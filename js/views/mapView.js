/* ==========================================
 * Tanks Vs. Zombie - Map View (Terrain, Roads, Obstacles & Flags)
 * View
 * ========================================== */

function drawSingleObstacle(c, dec) {
    c.save();
    c.translate(dec.x, dec.y);

    // Ground shadow
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath();
    c.ellipse(3, dec.r * 0.55, dec.r * 0.85, dec.r * 0.42, 0, 0, Math.PI * 2);
    c.fill();

    if (dec.type === 'tree') {
        c.fillStyle = '#78350f';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2;
        c.fillRect(-4, 0, 8, 14);
        c.strokeRect(-4, 0, 8, 14);

        c.fillStyle = '#15803d';
        c.beginPath();
        c.arc(0, -6, dec.r * 0.85, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = '#22c55e';
        c.beginPath();
        c.arc(-5, -10, dec.r * 0.52, 0, Math.PI * 2);
        c.fill();
    } else if (dec.type === 'bush') {
        c.fillStyle = '#16a34a';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(-6, 2, dec.r * 0.65, 0, Math.PI * 2);
        c.arc(6, 2, dec.r * 0.65, 0, Math.PI * 2);
        c.arc(0, -4, dec.r * 0.72, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = '#ef4444';
        c.beginPath();
        c.arc(-4, -2, 2.5, 0, Math.PI * 2);
        c.arc(5, 1, 2.5, 0, Math.PI * 2);
        c.fill();
    } else if (dec.type === 'rock' || dec.type === 'desertRock') {
        c.fillStyle = dec.type === 'desertRock' ? '#b45309' : '#64748b';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(-dec.r * 0.85, dec.r * 0.4);
        c.lineTo(-dec.r * 0.5, -dec.r * 0.65);
        c.lineTo(dec.r * 0.35, -dec.r * 0.72);
        c.lineTo(dec.r * 0.88, dec.r * 0.35);
        c.closePath();
        c.fill();
        c.stroke();
    } else if (dec.type === 'cactus') {
        c.fillStyle = '#15803d';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(-5, -dec.r * 0.9, 10, dec.r * 1.4, 5);
        c.roundRect(-13, -dec.r * 0.45, 9, 6, 3);
        c.roundRect(-13, -dec.r * 0.75, 6, 12, 3);
        c.roundRect(4, -dec.r * 0.3, 9, 6, 3);
        c.roundRect(7, -dec.r * 0.62, 6, 12, 3);
        c.fill();
        c.stroke();
    } else if (dec.type === 'snowPine') {
        c.fillStyle = '#78350f';
        c.fillRect(-4, 4, 8, 10);
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2;
        const tiers = [14, 7, 0];
        tiers.forEach((yOff, idx) => {
            const w = dec.r * (0.95 - idx * 0.2);
            c.fillStyle = idx === 2 ? '#f8fafc' : '#0f766e';
            c.beginPath();
            c.moveTo(0, yOff - 18);
            c.lineTo(-w, yOff);
            c.lineTo(w, yOff);
            c.closePath();
            c.fill();
            c.stroke();
        });
    }
    c.restore();
}

function drawFlag(c, x, y, color, labelText, timeSec) {
    c.save();
    c.translate(x, y);

    // Base shadow
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(0, 4, 12, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Flagpole
    c.strokeStyle = '#1c1917';
    c.lineWidth = 4.5;
    c.beginPath();
    c.moveTo(0, 3);
    c.lineTo(0, -44);
    c.stroke();

    c.strokeStyle = '#e7e5e4';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(0, 2);
    c.lineTo(0, -43);
    c.stroke();

    // Waving pennant flag
    const wave1 = Math.sin(timeSec * 5.2) * 3.5;
    const wave2 = Math.cos(timeSec * 5.2) * 3.5;
    c.fillStyle = color;
    c.strokeStyle = '#1c1917';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(0, -42);
    c.quadraticCurveTo(15, -45 + wave1, 32, -39 + wave2);
    c.lineTo(26, -32 + wave2);
    c.lineTo(32, -25 + wave2);
    c.quadraticCurveTo(15, -28 + wave1, 0, -24);
    c.closePath();
    c.fill();
    c.stroke();

    // Gold finial orb on top of pole
    c.fillStyle = '#facc15';
    c.beginPath();
    c.arc(0, -46, 4.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Clear START / MÅL sign badge below flag
    if (labelText) {
        c.font = '800 10px Nunito, sans-serif';
        const textW = c.measureText(labelText).width;
        const boxW = textW + 10;
        c.fillStyle = '#1c1917';
        c.beginPath();
        c.roundRect(-boxW / 2, 7, boxW, 15, 5);
        c.fill();

        c.fillStyle = '#fef08a';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(labelText, 0, 14.5);
    }

    c.restore();
}

function drawMapBackground(map, timeSec) {
    // Base terrain
    ctx.fillStyle = map.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle terrain patches
    ctx.fillStyle = map.bgAlt;
    for (let gx = 40; gx < CANVAS_W; gx += 120) {
        for (let gy = 40; gy < CANVAS_H; gy += 110) {
            const offset = ((gx + gy) % 3) * 14;
            ctx.beginPath();
            ctx.ellipse(gx + offset, gy, 34, 18, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Animated Pond / Oasis / Frozen Lake
    if (map.pond) {
        const p = map.pond;
        ctx.save();
        ctx.fillStyle = map.id === 'winter' ? '#bae6fd' : '#0284c7';
        ctx.strokeStyle = map.id === 'desert' ? '#92400e' : '#1c1917';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Animated water ripples & shimmer
        const ripple = (timeSec * 0.65) % 1;
        ctx.strokeStyle = map.id === 'winter' ? 'rgba(255,255,255,0.75)' : 'rgba(186, 230, 253, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx * (0.25 + ripple * 0.55), p.ry * (0.25 + ripple * 0.55), 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        const glintX = p.x - 18 + Math.sin(timeSec * 2) * 8;
        ctx.beginPath();
        ctx.ellipse(glintX, p.y - 10, 14, 4, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Animated Stream
    if (map.streamX !== null) {
        ctx.save();
        ctx.fillStyle = map.id === 'winter' ? '#7dd3fc' : '#0ea5e9';
        ctx.fillRect(map.streamX - 20, 0, 40, CANVAS_H);
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(map.streamX - 20, 0);
        ctx.lineTo(map.streamX - 20, CANVAS_H);
        ctx.moveTo(map.streamX + 20, 0);
        ctx.lineTo(map.streamX + 20, CANVAS_H);
        ctx.stroke();

        // Flowing water streaks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2.2;
        const flowOffset = (timeSec * 55) % 60;
        for (let sy = -60 + flowOffset; sy < CANVAS_H + 60; sy += 60) {
            ctx.beginPath();
            ctx.moveTo(map.streamX - 7, sy);
            ctx.lineTo(map.streamX - 7, sy + 24);
            ctx.moveTo(map.streamX + 7, sy + 28);
            ctx.lineTo(map.streamX + 7, sy + 52);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Road Outer Border & Inner Path
    const wps = map.waypoints;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = map.roadWidth + 8;
    ctx.beginPath();
    ctx.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) ctx.lineTo(wps[i].x, wps[i].y);
    ctx.stroke();

    ctx.strokeStyle = map.roadOuter;
    ctx.lineWidth = map.roadWidth + 2;
    ctx.beginPath();
    ctx.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) ctx.lineTo(wps[i].x, wps[i].y);
    ctx.stroke();

    ctx.strokeStyle = map.roadInner;
    ctx.lineWidth = map.roadWidth - 10;
    ctx.beginPath();
    ctx.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) ctx.lineTo(wps[i].x, wps[i].y);
    ctx.stroke();
    ctx.restore();

    // Wooden / Ice Bridge over stream
    if (map.streamX !== null && map.bridgeY !== null) {
        ctx.save();
        ctx.translate(map.streamX, map.bridgeY);
        ctx.fillStyle = map.id === 'winter' ? '#bae6fd' : '#92400e';
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 3;
        ctx.fillRect(-30, -32, 60, 64);
        ctx.strokeRect(-30, -32, 60, 64);

        ctx.strokeStyle = map.id === 'winter' ? '#0284c7' : '#451a03';
        ctx.lineWidth = 2;
        for (let px = -20; px <= 20; px += 10) {
            ctx.beginPath();
            ctx.moveTo(px, -30);
            ctx.lineTo(px, 30);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Waving START & FINISH Flags
    const startWp = wps[0];
    const endWp = wps[wps.length - 1];
    drawFlag(ctx, startWp.x + 28, startWp.y - 30, '#ef4444', t().flagStart, timeSec);
    drawFlag(ctx, endWp.x - 42, endWp.y - 30, '#22c55e', t().flagGoal, timeSec);
}

// Expose globally and on window.Game namespace
window.drawSingleObstacle = drawSingleObstacle;
window.drawFlag = drawFlag;
window.drawMapBackground = drawMapBackground;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.Map = {
    drawSingleObstacle,
    drawFlag,
    drawMapBackground
};
