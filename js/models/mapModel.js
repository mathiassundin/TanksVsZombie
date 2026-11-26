/* ==========================================
 * Tanks Vs. Zombie - Map Model (Geometry & Placement Logic)
 * Model
 * ========================================== */

function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let tParam = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    tParam = Math.max(0, Math.min(1, tParam));
    return Math.hypot(px - (x1 + tParam * (x2 - x1)), py - (y1 + tParam * (y2 - y1)));
}

function distanceToRoad(x, y) {
    const map = MAPS[state.selectedMap] || MAPS.meadow;
    const wps = map.roadWaypoints || map.waypoints;
    let minD = Infinity;
    for (let i = 0; i < wps.length - 1; i++) {
        const d = distToSegment(x, y, wps[i].x, wps[i].y, wps[i + 1].x, wps[i + 1].y);
        if (d < minD) minD = d;
    }
    return minD;
}

function isInsidePondOrStream(x, y) {
    const map = MAPS[state.selectedMap] || MAPS.meadow;
    if (map.pond) {
        const dx = (x - map.pond.x) / (map.pond.rx + TOWER_FOOTPRINT / 2);
        const dy = (y - map.pond.y) / (map.pond.ry + TOWER_FOOTPRINT / 2);
        if (dx * dx + dy * dy <= 1) return true;
    }
    if (map.streamX !== null) {
        // Stream is 40 wide; keep the whole footprint out of it
        if (Math.abs(x - map.streamX) < 20 + TOWER_FOOTPRINT / 2) return true;
    }
    return false;
}

// True if the footprints of two towers/buildings overlap
function footprintsOverlap(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) < TOWER_FOOTPRINT && Math.abs(y1 - y2) < TOWER_FOOTPRINT;
}

// Distance from a point to the footprint square centred on (x, y)
function distanceToFootprint(px, py, x, y) {
    const half = TOWER_FOOTPRINT / 2;
    const dx = Math.max(0, Math.abs(px - x) - half);
    const dy = Math.max(0, Math.abs(py - y) - half);
    return Math.hypot(dx, dy);
}

// True if (px, py) is inside the footprint of something centred on (x, y)
function isInsideFootprint(px, py, x, y) {
    return Math.abs(px - x) <= TOWER_FOOTPRINT / 2 && Math.abs(py - y) <= TOWER_FOOTPRINT / 2;
}

// Tanks and buildings whose footprint overlaps one placed at (x, y)
function findFootprintCollisions(x, y) {
    return [...state.tanks, ...state.buildings].filter(e => footprintsOverlap(x, y, e.x, e.y));
}

// In maze mode towers snap to the maze grid. If that spot is taken, they are
// pulled to the closest free spot up to two cells away, so plates can easily
// be placed edge to edge.
function snapPlacement(x, y) {
    if (state.selectedMap !== 'maze') return { x, y };
    const g = MAZE_GRID;
    const base = { x: Math.round(x / g) * g, y: Math.round(y / g) * g };
    if (canPlaceAt(base.x, base.y)) return base;
    let best = base;
    let bestD = Infinity;
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const cx = base.x + dx * g;
            const cy = base.y + dy * g;
            if (!canPlaceAt(cx, cy)) continue;
            const d = Math.hypot(cx - x, cy - y);
            if (d < bestD) {
                bestD = d;
                best = { x: cx, y: cy };
            }
        }
    }
    return best;
}

function canPlaceAt(x, y) {
    const half = TOWER_FOOTPRINT / 2;
    if (x < half + 4 || x > CANVAS_W - half - 4 || y < half + 4 || y > CANVAS_H - half - 4) return false;
    const map = MAPS[state.selectedMap] || MAPS.meadow;

    if (state.selectedMap === 'maze') {
        // In maze mode, towers must be placed within the wide road corridor
        if (Math.abs(y - CANVAS_H / 2) > map.roadWidth * 0.5 - 20) return false;
    } else {
        // Normal maps: cannot place on the road or in water
        if (distanceToRoad(x, y) < map.roadWidth * 0.5 + half) return false;
        if (isInsidePondOrStream(x, y)) return false;
    }

    for (const obs of state.obstacles) {
        if (distanceToFootprint(obs.x, obs.y, x, y) < obs.r) return false;
    }
    return findFootprintCollisions(x, y).length === 0;
}

// Expose globally and on window.Game namespace
window.distToSegment = distToSegment;
window.distanceToRoad = distanceToRoad;
window.isInsidePondOrStream = isInsidePondOrStream;
window.canPlaceAt = canPlaceAt;
window.footprintsOverlap = footprintsOverlap;
window.distanceToFootprint = distanceToFootprint;
window.isInsideFootprint = isInsideFootprint;
window.findFootprintCollisions = findFootprintCollisions;
window.snapPlacement = snapPlacement;

window.Game = window.Game || {};
window.Game.Models = window.Game.Models || {};
window.Game.Models.Map = {
    distToSegment,
    distanceToRoad,
    isInsidePondOrStream,
    canPlaceAt,
    footprintsOverlap,
    distanceToFootprint,
    isInsideFootprint,
    findFootprintCollisions,
    snapPlacement
};
