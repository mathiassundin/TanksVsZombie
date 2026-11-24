/* ==========================================
 * Tanks Vs. Zombie - Maze Game Mode
 * ========================================== */
(function () {
    const MAZE_ID = 'maze';
    const ROAD_WIDTH = 184;
    const GRID = 16;

    function ensureMazeMap() {
        if (!MAPS[MAZE_ID]) {
            MAPS[MAZE_ID] = {
                id: MAZE_ID, maxWaves: 42, bg: '#365314', bgAlt: '#3f6212',
                roadOuter: '#713f12', roadInner: '#d6a64f', roadWidth: ROAD_WIDTH,
                waypoints: [{ x: -12, y: CANVAS_H / 2 }, { x: CANVAS_W + 12, y: CANVAS_H / 2 }],
                pond: null, streamX: null, bridgeY: null, decorations: [], gameMode: 'maze'
            };
        }
        return MAPS[MAZE_ID];
    }

    function isMaze() { return state.gameMode === 'maze'; }

    function canPlace(x, y) {
        if (!isMaze()) return window.__tvzOriginalCanPlaceAt(x, y);
        if (x < 32 || x > CANVAS_W - 32 || y < 32 || y > CANVAS_H - 32) return false;
        if (Math.abs(y - CANVAS_H / 2) > ROAD_WIDTH / 2 - 22) return false;
        if (state.tanks.some(t => Math.hypot(x - t.x, y - t.y) < 42)) return false;
        if (state.buildings.some(b => Math.hypot(x - b.x, y - b.y) < 44)) return false;
        return true;
    }

    function isBlockedCell(x, y) {
        const roadHalf = ROAD_WIDTH / 2 - 20;
        if (y < CANVAS_H / 2 - roadHalf || y > CANVAS_H / 2 + roadHalf) return true;
        return state.tanks.some(t => Math.hypot(x - t.x, y - t.y) < 30) || state.buildings.some(b => Math.hypot(x - b.x, y - b.y) < 30);
    }

    function findPath(startX, startY) {
        const cols = Math.ceil(CANVAS_W / GRID) + 1;
        const rows = Math.ceil(CANVAS_H / GRID);
        const start = { x: Math.max(0, Math.min(cols - 1, Math.round(startX / GRID))), y: Math.max(0, Math.min(rows - 1, Math.round(startY / GRID))) };
        const goal = { x: cols - 1, y: Math.round((CANVAS_H / 2) / GRID) };
        const key = (x, y) => `${x},${y}`;
        const queue = [start];
        let cursor = 0;
        const previous = new Map([[key(start.x, start.y), null]]);

        while (cursor < queue.length) {
            const cell = queue[cursor++];
            if (cell.x === goal.x && cell.y === goal.y) break;
            for (const [dx, dy] of [[1, 0], [0, -1], [0, 1], [-1, 0]]) {
                const nx = cell.x + dx, ny = cell.y + dy, k = key(nx, ny);
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || previous.has(k)) continue;
                if (!(nx === goal.x && ny === goal.y) && isBlockedCell(nx * GRID, ny * GRID)) continue;
                previous.set(k, cell);
                queue.push({ x: nx, y: ny });
            }
        }
        if (!previous.has(key(goal.x, goal.y))) return null;
        const cells = [];
        let current = goal;
        while (current) { cells.push(current); current = previous.get(key(current.x, current.y)); }
        cells.reverse();
        return [{ x: -12, y: CANVAS_H / 2 }, ...cells.map(c => ({ x: c.x * GRID, y: c.y * GRID })), { x: CANVAS_W + 12, y: CANVAS_H / 2 }];
    }

    function pathForCurrentMap() {
        const map = ensureMazeMap();
        const path = findPath(-12, CANVAS_H / 2);
        state.mazePathBlocked = !path;
        if (path) map.waypoints = path;
        return path;
    }

    function nearestWallUnit() {
        const units = [...state.tanks, ...state.buildings].filter(u => Math.abs(u.y - CANVAS_H / 2) < ROAD_WIDTH / 2 && u.x > 0 && u.x < CANVAS_W);
        if (!units.length) return null;
        const furthestX = Math.max(...units.map(u => u.x));
        return units.filter(u => u.x >= furthestX - 30).slice(-1)[0];
    }

    function attackWall(dt) {
        const target = nearestWallUnit();
        if (!target) return;
        if (target.mazeWallHp == null) {
            target.mazeMaxWallHp = 700 + (target.level || 1) * 260;
            target.mazeWallHp = target.mazeMaxWallHp;
        }
        const dps = state.zombies.reduce((sum, z) => sum + (z.type === 'boss' ? 95 : z.type === 'giant' ? 38 : 22), 0);
        target.mazeWallHp -= dps * dt;
        if (target.mazeWallHp <= 0) {
            spawnParticles(target.x, target.y, '#f97316', 24, 150);
            state.tanks = state.tanks.filter(t => t !== target);
            state.buildings = state.buildings.filter(b => b !== target);
            showToast(window.currentLang === 'en' ? 'Zombies destroyed the blocking unit!' : 'Zombierna förstörde det blockerande tornet!');
            updateUpgradePanel();
            renderShopLists();
        }
    }

    function reanchorZombies(path) {
        for (const z of state.zombies) {
            let best = -1, min = Infinity;
            for (let i = 0; i < path.length; i++) {
                const point = path[i];
                if (point.x < z.x - GRID) continue;
                const d = Math.hypot(point.x - z.x, point.y - z.y);
                if (d < min) { min = d; best = i; }
            }
            if (best >= 0) z.wpIndex = Math.max(1, best);
        }
    }

    function install() {
        ensureMazeMap();
        if (!window.__tvzOriginalCanPlaceAt) window.__tvzOriginalCanPlaceAt = window.canPlaceAt;
        window.canPlaceAt = canPlace;
        const baseUpdate = window.updateGame;
        const baseRender = window.renderGame;
        window.updateGame = function (rawDt) {
            if (!isMaze()) return baseUpdate(rawDt);
            const path = pathForCurrentMap();
            if (!path) {
                attackWall(rawDt * (state.speedMult || 1));
                // Avoid ending the frame early: towers, projectiles, particles and wave timers continue.
                const savedSpeeds = state.zombies.map(z => z.speed);
                state.zombies.forEach(z => { z.speed = 0; });
                try { return baseUpdate(rawDt); }
                finally { state.zombies.forEach((z, i) => { z.speed = savedSpeeds[i] || 0; }); }
            }
            reanchorZombies(path);
            return baseUpdate(rawDt);
        };
        window.renderGame = function (timeSec) {
            if (isMaze()) pathForCurrentMap();
            const result = baseRender(timeSec);
            if (isMaze()) {
                ctx.save();
                for (const unit of [...state.tanks, ...state.buildings]) {
                    if (unit.mazeWallHp == null) continue;
                    const hpRatio = Math.max(0, unit.mazeWallHp / (unit.mazeMaxWallHp || unit.mazeWallHp));
                    ctx.fillStyle = '#111827'; ctx.fillRect(unit.x - 24, unit.y - 34, 48, 6);
                    ctx.fillStyle = '#ef4444'; ctx.fillRect(unit.x - 24, unit.y - 34, 48 * hpRatio, 6);
                    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(unit.x - 24, unit.y - 34, 48, 6);
                }
                ctx.restore();
            }
            return result;
        };
    }

    window.TvZMaze = { ensureMazeMap, install, isMaze, mazeCanPlaceAt: canPlace, findPath, pathForCurrentMap };
})();
