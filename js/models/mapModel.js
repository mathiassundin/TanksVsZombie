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
    const wps = MAPS[state.selectedMap].waypoints;
    let minD = Infinity;
    for (let i = 0; i < wps.length - 1; i++) {
        const d = distToSegment(x, y, wps[i].x, wps[i].y, wps[i + 1].x, wps[i + 1].y);
        if (d < minD) minD = d;
    }
    return minD;
}

function isInsidePondOrStream(x, y) {
    const map = MAPS[state.selectedMap];
    if (map.pond) {
        const dx = (x - map.pond.x) / (map.pond.rx + 18);
        const dy = (y - map.pond.y) / (map.pond.ry + 18);
        if (dx * dx + dy * dy <= 1) return true;
    }
    if (map.streamX !== null) {
        if (Math.abs(x - map.streamX) < 34) return true;
    }
    return false;
}

function canPlaceAt(x, y) {
    if (x < 28 || x > CANVAS_W - 28 || y < 28 || y > CANVAS_H - 28) return false;
    const map = MAPS[state.selectedMap];
    if (distanceToRoad(x, y) < map.roadWidth * 0.5 + 22) return false;
    if (isInsidePondOrStream(x, y)) return false;

    for (const obs of state.obstacles) {
        if (Math.hypot(x - obs.x, y - obs.y) < obs.r + 22) return false;
    }
    for (const tk of state.tanks) {
        if (Math.hypot(x - tk.x, y - tk.y) < 42) return false;
    }
    for (const b of state.buildings) {
        if (Math.hypot(x - b.x, y - b.y) < 44) return false;
    }
    return true;
}

// Expose globally and on window.Game namespace
window.distToSegment = distToSegment;
window.distanceToRoad = distanceToRoad;
window.isInsidePondOrStream = isInsidePondOrStream;
window.canPlaceAt = canPlaceAt;

window.Game = window.Game || {};
window.Game.Models = window.Game.Models || {};
window.Game.Models.Map = {
    distToSegment,
    distanceToRoad,
    isInsidePondOrStream,
    canPlaceAt
};
