/* ==========================================
 * Tanks Vs. Zombie - Maze Game Mode
 * ========================================== */
(function () {
    const MAZE_ID = 'maze';
    const ROAD_WIDTH = 184; // 7 towers across at roughly 26px spacing
    const GRID = 16;

    function ensureMazeMap() {
        if (!MAPS[MAZE_ID]) {
            MAPS[MAZE_ID] = {
                id: MAZE_ID,
                maxWaves: 42,
                bg: '#365314',
                bgAlt: '#3f6212',
                roadOuter: '#713f12',
                roadInner: '#d6a64f',
                roadWidth: ROAD_WIDTH,
                waypoints: [{ x: -12, y: CANVAS_H / 2 }, { x: CANVAS_W + 12, y: CANVAS_H / 2 }],
                pond: null,
                streamX: null,
                bridgeY: null,
                decorations: [],
                gameMode: 'maze'
            };
        }
        return MAPS[MAZE_ID];
    }

    function isMaze() {
        return state.gameMode === 'maze' || state.selectedMap === MAZE_ID;
    }

    function mazeCanPlaceAt(x, y) {
        if (!isMaze()) {
            return window.__originalCanPlaceAt ? window.__originalCanPlaceAt(x, y) : true;
        }

        if (x < 30 || x > CANVAS_W - 30 || y < 30 || y > CANVAS_H - 30) return false;

        const roadHalf = ROAD_WIDTH / 2;
        if (Math.abs(y - CANVAS_H / 2) > roadHalf - 22) return false;

        for (const tank of state.tanks) {
            if (Math.hypot(x - tank.x, y - tank.y) < 42) return false;
        }
        for (const building of state.buildings) {
            if (Math.hypot(x - building.x, y - building.y) < 44) return false;
        }
        return true;
    }

    function isRoadBlockedCell(px, py) {
        const roadHalf = ROAD_WIDTH / 2 - 20;
        if (py < CANVAS_H / 2 - roadHalf || py > CANVAS_H / 2 + roadHalf) return true;

        for (const tank of state.tanks) {
            if (Math.hypot(px - tank.x, py - tank.y) < 30) return true;
        }
        for (const building of state.buildings) {
            if (Math.hypot(px - building.x, py - building.y) < 30) return true;
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

            const neighbors = [[1, 0], [0, -1], [0, 1], [-1, 0]];
            for (const [dx, dy] of neighbors) {
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
            { x: -12, y: CANVAS_H / 2 },
            ...cells.map(c => ({ x: c.x * GRID - GRID, y: c.y * GRID })),
            { x: CANVAS_W + 12, y: CANVAS_H / 2 }
        ];
    }

    function findBlockingTower() {
        if (!state.tanks.length) return null;
        let nearestToExit = state.tanks[0];
        let greatestProgress = -Infinity;

        for (const tank of state.tanks) {
            const progress = tank.x + tank.y * 0.01;
            if (progress > greatestProgress) {
                greatestProgress = progress;
                nearestToExit = tank;
            }
        }
        return nearestToExit;
    }

    function attackBlockingTower(dt) {
        const tower = findBlockingTower();
        if (!tower) return;

        if (!tower.mazeWallHp) {
            tower.mazeMaxWallHp = 700 + tower.level * 260;
            tower.mazeWallHp = tower.mazeMaxWallHp;
        }

        const attackers = state.zombies.filter(z => z.hp > 0);
        const damage = attackers.reduce((sum, z) => {
            if (z.type === 'boss') return sum + 95;
            if (z.type === 'giant') return sum + 38;
            return sum + 22;
        }, 0) * dt;

        tower.mazeWallHp -= damage;
        tower.upgradeFlash = Math.max(tower.upgradeFlash || 0, 0.08);

        if (tower.mazeWallHp <= 0) {
            spawnParticles(tower.x, tower.y, '#f97316', 28, 170);
            state.tanks = state.tanks.filter(t => t !== tower);
            showToast(window.currentLang === 'en'
                ? 'The zombies destroyed a blocking tower!'
                : 'Zombierna förstörde ett blockerande torn!');
        }
    }

    function updateMazePath() {
        const map = ensureMazeMap();
        const path = buildMazePath();
        if (path) {
            map.waypoints = path;
            state.mazePathBlocked = false;
        } else {
            map.waypoints = [{ x: -12, y: CANVAS_H / 2 }, { x: CANVAS_W + 12, y: CANVAS_H / 2 }];
            state.mazePathBlocked = true;
        }
        return path;
    }

    function install() {
        ensureMazeMap();
        state.gameMode = state.gameMode || 'original';

        if (!window.__originalCanPlaceAt) window.__originalCanPlaceAt = window.canPlaceAt;
        window.canPlaceAt = mazeCanPlaceAt;

        const originalUpdate = window.updateGame;
        const originalRender = window.renderGame;

        window.updateGame = function (rawDt) {
            if (!isMaze()) return originalUpdate(rawDt);

            const path = updateMazePath();
            if (!path) {
                attackBlockingTower(rawDt * (state.speedMult || 1));
                for (const zombie of state.zombies) {
                    zombie.angle = 0;
                    if (zombie.x < CANVAS_W) zombie.x += zombie.speed * rawDt * 0.08;
                }
                return;
            }
            return originalUpdate(rawDt);
        };

        window.renderGame = function (timeSec) {
            if (isMaze()) updateMazePath();

            const result = originalRender(timeSec);

            if (isMaze() && state.tanks.length) {
                ctx.save();
                ctx.fillStyle = '#111827';
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2;
                for (const tank of state.tanks) {
                    if (!tank.mazeWallHp) continue;
                    const maxHp = tank.mazeMaxWallHp || tank.mazeWallHp;
                    const width = 48;
                    ctx.fillRect(tank.x - width / 2, tank.y - 34, width, 6);
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(tank.x - width / 2, tank.y - 34, width * Math.max(0, tank.mazeWallHp / maxHp), 6);
                    ctx.strokeRect(tank.x - width / 2, tank.y - 34, width, 6);
                    ctx.fillStyle = '#111827';
                }
                ctx.restore();
            }

            return result;
        };

        window.Game = window.Game || {};
        window.Game.Maze = {
            ensureMazeMap,
            isMaze,
            mazeCanPlaceAt,
            buildMazePath,
            updateMazePath
        };
    }

    window.TvZMaze = { ensureMazeMap, install, isMaze, mazeCanPlaceAt, buildMazePath, updateMazePath };
})();
