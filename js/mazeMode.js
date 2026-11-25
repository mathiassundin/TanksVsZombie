/* ==========================================
 * Tanks Vs. Zombie - Maze Game Mode
 * ========================================== */
(function () {
    const MAZE_ID = 'maze';
    const DEFAULT_ROAD_WIDTH = 350;
    const GRID = 16;
    let cachedTanksKey = null;

    function isMaze() {
        return state.selectedMap === MAZE_ID;
    }

    function getMazeRoadWidth() {
        return (MAPS[MAZE_ID] && MAPS[MAZE_ID].roadWidth) || DEFAULT_ROAD_WIDTH;
    }

    function isRoadBlockedCell(px, py) {
        const roadHalf = getMazeRoadWidth() / 2 - 20;
        if (py < CANVAS_H / 2 - roadHalf || py > CANVAS_H / 2 + roadHalf) return true;
        for (const tank of state.tanks) {
            if (Math.hypot(px - tank.x, py - tank.y) < 32) return true;
        }
        for (const building of state.buildings) {
            if (Math.hypot(px - building.x, py - building.y) < 32) return true;
        }
        return false;
    }

    function buildMazePath() {
        const cols = Math.ceil(CANVAS_W / GRID) + 2;
        const rows = Math.ceil(CANVAS_H / GRID);
        const start = { x: 0, y: Math.round((CANVAS_H / 2) / GRID) };
        const end = { x: cols - 1, y: start.y };
        const key = (x, y) => `${x},${y}`;
        const queue = [start];
        let cursor = 0;
        const previous = new Map([[key(start.x, start.y), null]]);

        while (cursor < queue.length) {
            const current = queue[cursor++];
            if (current.x === end.x && current.y === end.y) break;
            for (const [dx, dy] of [[1, 0], [0, -1], [0, 1], [-1, 0]]) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                const k = key(nx, ny);
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || previous.has(k)) continue;
                const px = nx * GRID - GRID;
                const py = ny * GRID;
                if (nx !== end.x && isRoadBlockedCell(px, py)) continue;
                previous.set(k, current);
                queue.push({ x: nx, y: ny });
            }
        }

        const endKey = key(end.x, end.y);
        if (!previous.has(endKey)) return null;

        const cells = [];
        let cell = end;
        while (cell) {
            cells.push(cell);
            cell = previous.get(key(cell.x, cell.y));
        }
        cells.reverse();

        return [
            { x: -20, y: CANVAS_H / 2 },
            ...cells.map(c => ({ x: c.x * GRID - GRID, y: c.y * GRID })),
            { x: CANVAS_W + 20, y: CANVAS_H / 2 }
        ];
    }

    function findBlockingTower() {
        if (!state.tanks.length) return null;
        let nearest = state.tanks[0];
        let greatestProgress = -Infinity;
        for (const tank of state.tanks) {
            const progress = tank.x + tank.y * 0.01;
            if (progress > greatestProgress) {
                greatestProgress = progress;
                nearest = tank;
            }
        }
        return nearest;
    }

    function attackBlockingTower(dt) {
        const tower = findBlockingTower();
        if (!tower) return;
        if (!tower.mazeWallHp) {
            tower.mazeMaxWallHp = 700 + tower.level * 260;
            tower.mazeWallHp = tower.mazeMaxWallHp;
        }
        const damage = state.zombies.reduce((sum, z) => sum + (z.type === 'boss' ? 95 : z.type === 'giant' ? 38 : 22), 0) * dt;
        tower.mazeWallHp -= damage;
        tower.upgradeFlash = Math.max(tower.upgradeFlash || 0, 0.08);
        if (tower.mazeWallHp <= 0) {
            spawnParticles(tower.x, tower.y, '#f97316', 28, 170);
            state.tanks = state.tanks.filter(t => t !== tower);
            cachedTanksKey = null;
            updateMazePath(true);
            showToast(window.currentLang === 'en' ? 'The zombies destroyed a blocking tower!' : 'Zombierna förstörde ett blockerande torn!');
        }
    }

    function updateMazePath(force = false) {
        const map = MAPS[MAZE_ID];
        if (!map) return null;

        const tanksKey = state.tanks.map(t => `${t.x},${t.y}`).join(';') + '|' + state.buildings.map(b => `${b.x},${b.y}`).join(';');
        if (!force && tanksKey === cachedTanksKey) {
            return map.waypoints;
        }
        cachedTanksKey = tanksKey;

        const path = buildMazePath();
        if (path) {
            map.waypoints = path;
            state.mazePathBlocked = false;

            // Smoothly align zombie waypoints to the new path
            for (const z of state.zombies) {
                let bestIdx = 1;
                let minD = Infinity;
                for (let i = 1; i < path.length; i++) {
                    if (path[i].x >= z.x - 16) {
                        const d = Math.hypot(path[i].x - z.x, path[i].y - z.y);
                        if (d < minD) {
                            minD = d;
                            bestIdx = i;
                        }
                    }
                }
                z.wpIndex = bestIdx;
            }
        } else {
            state.mazePathBlocked = true;
        }
        return path;
    }

    function initMazeMode() {
        const originalUpdate = window.updateGame;
        const originalRender = window.renderGame;

        window.updateGame = function (rawDt) {
            if (isMaze()) {
                const path = updateMazePath();
                if (!path || state.mazePathBlocked) {
                    attackBlockingTower(rawDt * (state.speedMult || 1));
                }
            }
            return originalUpdate(rawDt);
        };

        window.renderGame = function (timeSec) {
            const result = originalRender(timeSec);
            if (isMaze()) {
                ctx.save();
                for (const tank of state.tanks) {
                    if (!tank.mazeWallHp) continue;
                    const maxHp = tank.mazeMaxWallHp || tank.mazeWallHp;
                    ctx.fillStyle = '#111827';
                    ctx.fillRect(tank.x - 24, tank.y - 34, 48, 6);
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(tank.x - 24, tank.y - 34, 48 * Math.max(0, tank.mazeWallHp / maxHp), 6);
                    ctx.strokeStyle = '#facc15';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(tank.x - 24, tank.y - 34, 48, 6);
                }
                ctx.restore();
            }
            return result;
        };

        window.TvZMaze = {
            isMaze,
            buildMazePath,
            updateMazePath,
            attackBlockingTower,
            findBlockingTower
        };
    }

    initMazeMode();
})();
