/* Maze game mode: shared tech tree and towers, dynamic path around placed units. */
(function () {
    const MAZE_ID = 'maze';
    const MAZE_ROAD_WIDTH = 184; // Seven roughly 26px units across the buildable road.
    const MAZE_GRID = 16;

    function ensureMazeMap() {
        if (MAPS[MAZE_ID]) return;
        MAPS[MAZE_ID] = {
            id: MAZE_ID,
            maxWaves: 42,
            bg: '#365314',
            bgAlt: '#3f6212',
            roadOuter: '#713f12',
            roadInner: '#d6a64f',
            roadWidth: MAZE_ROAD_WIDTH,
            waypoints: [{ x: -12, y: CANVAS_H / 2 }, { x: CANVAS_W + 12, y: CANVAS_H / 2 }],
            pond: null,
            streamX: null,
            bridgeY: null,
            decorations: [],
            gameMode: 'maze'
        };
    }

    function isMaze() { return state.gameMode === 'maze' || state.selectedMap === MAZE_ID; }
    function unitRadius(entity) { return entity && entity.type === 'boss' ? 30 : 23; }

    function mazeCanPlaceAt(x, y) {
        if (!isMaze()) return window.__tvzOriginalCanPlaceAt ? window.__tvzOriginalCanPlaceAt(x, y) : true;
        const map = MAPS[MAZE_ID];
        if (x < 30 || x > CANVAS_W - 30 || y < 30 || y > CANVAS_H - 30) return false;
        if (Math.abs(y - CANVAS_H / 2) > map.roadWidth / 2 - 22) return false;
        if (state.tanks.some(t => Math.hypot(x - t.x, y - t.y) < 42)) return false;
        if (state.buildings.some(b => Math.hypot(x - b.x, y - b.y) < 44)) return false;
        return true;
    }

    function blocked(x, y) {
        const half = MAZE_ROAD_WIDTH / 2 - 25;
        if (y < CANVAS_H / 2 - half || y > CANVAS_H / 2 + half) return true;
        return state.tanks.some(t => Math.hypot(x - t.x, y - t.y) < 27) ||
            state.buildings.some(b => Math.hypot(x - b.x, y - b.y) < 27);
    }

    function buildMazePath() {
        const start = { x: -12, y: CANVAS_H / 2 };
        const end = { x: CANVAS_W + 12, y: CANVAS_H / 2 };
        const step = MAZE_GRID;
        const cols = Math.ceil((CANVAS_W + 24) / step) + 1;
        const rows = Math.ceil(CANVAS_H / step);
        const sx = 0, sy = Math.floor(CANVAS_H / 2 / step);
        const ex = cols - 1, ey = sy;
        const key = (x, y) => `${x},${y}`;
        const queue = [{ x: sx, y: sy }];
        const previous = new Map([[key(sx, sy), null]]);
        while (queue.length) {
            const cur = queue.shift();
            if (cur.x === ex) break;
            for (const [dx, dy] of [[1, 0], [0, -1], [0, 1], [-1, 0]]) {
                const nx = cur.x + dx, ny = cur.y + dy;
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || previous.has(key(nx, ny))) continue;
                const px = nx * step - 12, py = ny * step;
                if (blocked(px, py) && nx !== ex) continue;
                previous.set(key(nx, ny), cur);
                queue.push({ x: nx, y: ny });
            }
        }
        if (!previous.has(key(ex, ey))) return null;
        const cells = [];
        let cur = { x: ex, y: ey };
        while (cur) { cells.push(cur); cur = previous.get(key(cur.x, cur.y)); }
        cells.reverse();
        return [start, ...cells.map(c => ({ x: c.x * step - 12, y: c.y * step })), end];
    }

    function updateMazePath() {
        const path = buildMazePath();
        if (path) MAPS[MAZE_ID].waypoints = path;
        return path;
    }

    function damageBlockingTower(dt) {
        const last = state.tanks[state.tanks.length - 1];
        if (!last) return false;
        last.mazeHp = (last.mazeHp == null ? 420 : last.mazeHp) - 70 * dt;
        if (last.mazeHp <= 0) {
            spawnParticles(last.x, last.y, '#f97316', 25, 150);
            state.tanks.pop();
            showToast(currentLang === 'en' ? 'A zombie destroyed your last tank!' : 'En zombie förstörde ditt sista torn!');
        }
        return true;
    }

    function install() {
        ensureMazeMap();
        window.__tvzOriginalCanPlaceAt = window.canPlaceAt;
        window.canPlaceAt = mazeCanPlaceAt;
        const originalUpdate = window.updateGame;
        const originalRender = window.renderGame;
        window.updateGame = function (dt) {
            if (!isMaze()) return originalUpdate(dt);
            const path = updateMazePath();
            if (!path) { damageBlockingTower(dt); return; }
            return originalUpdate(dt);
        };
        window.renderGame = function (time) {
            if (isMaze()) updateMazePath();
            return originalRender(time);
        };
    }

    window.TvZMaze = { ensureMazeMap, install, isMaze, mazeCanPlaceAt };
})();
