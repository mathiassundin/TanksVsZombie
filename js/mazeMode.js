/* ==========================================
 * Tanks Vs. Zombie - Maze Game Mode
 * ========================================== */
(function () {
    const MAZE_ID = 'maze';
    const DEFAULT_ROAD_WIDTH = 350;
    const GRID = MAZE_GRID;
    // A cell is blocked when it lies inside a footprint (3 x 3 cells)
    const BLOCK_HALF = TOWER_FOOTPRINT / 2 + GRID / 2;
    const ATTACK_REACH = 40;
    let cachedTanksKey = null;
    // Cells (in pixels) the zombies can still reach while the road is blocked
    let reachableCells = null;
    let cachedBlocker = null;

    function isMaze() {
        return state.selectedMap === MAZE_ID;
    }

    function getMazeRoadWidth() {
        return (MAPS[MAZE_ID] && MAPS[MAZE_ID].roadWidth) || DEFAULT_ROAD_WIDTH;
    }

    function isRoadBlockedCell(px, py) {
        const roadHalf = getMazeRoadWidth() / 2 - 20;
        if (py < CANVAS_H / 2 - roadHalf || py > CANVAS_H / 2 + roadHalf) return true;
        for (const entity of getBlockers()) {
            if (Math.abs(px - entity.x) < BLOCK_HALF && Math.abs(py - entity.y) < BLOCK_HALF) return true;
        }
        return false;
    }

    // Both tanks and buildings block the road, so both can be attacked.
    function getBlockers() {
        return [...state.tanks, ...state.buildings];
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
        if (!previous.has(endKey)) {
            reachableCells = [...previous.keys()].map(k => {
                const [cx, cy] = k.split(',').map(Number);
                return { x: cx * GRID - GRID, y: cy * GRID };
            });
            return null;
        }
        reachableCells = null;

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

    // The blocking wall is made of the towers/buildings that touch the area the
    // zombies can still reach. Of those, attack the one furthest along the road
    // (closest to the exit), as described in the mode help text.
    function findBlockingTower() {
        if (cachedBlocker && (state.tanks.includes(cachedBlocker) || state.buildings.includes(cachedBlocker))) {
            return cachedBlocker;
        }
        cachedBlocker = null;
        if (!reachableCells) return null;

        const touchDist = BLOCK_HALF + GRID * 1.5;
        let best = null;
        for (const entity of getBlockers()) {
            if (best && entity.x <= best.x) continue;
            if (reachableCells.some(c => Math.abs(c.x - entity.x) < touchDist && Math.abs(c.y - entity.y) < touchDist)) {
                best = entity;
            }
        }
        cachedBlocker = best;
        return best;
    }

    function attackBlockingTower(dt) {
        const tower = findBlockingTower();
        if (!tower) return;

        // Only zombies that have actually reached the tower can damage it.
        const damage = state.zombies.reduce((sum, z) => {
            if (z.hp <= 0 || Math.hypot(z.x - tower.x, z.y - tower.y) > ATTACK_REACH + z.radius) return sum;
            return sum + (z.type === 'boss' ? 95 : z.type === 'giant' ? 38 : 22);
        }, 0) * dt;
        if (damage <= 0) return;

        if (tower.mazeWallHp === undefined) {
            tower.mazeMaxWallHp = 700 + tower.level * 260;
            tower.mazeWallHp = tower.mazeMaxWallHp;
        }
        tower.mazeWallHp -= damage;
        tower.upgradeFlash = Math.max(tower.upgradeFlash || 0, 0.08);
        if (tower.mazeWallHp <= 0) {
            spawnParticles(tower.x, tower.y, '#f97316', 28, 170);
            state.tanks = state.tanks.filter(t => t !== tower);
            state.buildings = state.buildings.filter(b => b !== tower);
            if (state.selectedTower === tower || state.selectedBuilding === tower) deselectAll();
            if (state.hoverTower === tower) state.hoverTower = null;
            cachedTanksKey = null;
            cachedBlocker = null;
            updateMazePath(true);
            renderShopLists();
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
        cachedBlocker = null;

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
                const running = state.matchStarted && !state.paused && !state.gameOver && !state.victory;
                if (running && (!path || state.mazePathBlocked)) {
                    attackBlockingTower(rawDt * (state.speedMult || 1));
                }
            }
            return originalUpdate(rawDt);
        };

        window.renderGame = function (timeSec) {
            const result = originalRender(timeSec);
            if (isMaze()) {
                ctx.save();
                for (const tank of getBlockers()) {
                    if (tank.mazeWallHp === undefined) continue;
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
