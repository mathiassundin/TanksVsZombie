/* ==========================================
 * Tanks Vs. Zombie - Effects View (Particles & Floating Texts)
 * View
 * ========================================== */

function spawnParticles(x, y, color, count = 8, speed = 90) {
    for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (0.3 + Math.random() * 0.7) * speed;
        const life = 0.22 + Math.random() * 0.25;
        state.particles.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            color,
            r: 2.2 + Math.random() * 2.6,
            life,
            maxLife: life
        });
    }
}

function spawnFloatingText(x, y, text, color = '#fef08a') {
    state.floatingTexts.push({
        x,
        y,
        text,
        color,
        life: 0.75,
        maxLife: 0.75
    });
}

// ---------- Pixel art drawing (art space) ----------

function drawProjectileWorld(c, p) {
    const P = PixelArt;
    const s = p.radius > 5 ? 3 : 2;
    const x = P.ax(p.x) - Math.floor(s / 2);
    const y = P.ax(p.y) - Math.floor(s / 2);
    const len = Math.hypot(p.vx, p.vy) || 1;
    const tx = -p.vx / len;
    const ty = -p.vy / len;

    c.save();
    c.fillStyle = p.color;
    for (let k = 1; k <= 3; k++) {
        c.globalAlpha = 0.45 / k;
        c.fillRect(Math.round(x + tx * k * 1.6), Math.round(y + ty * k * 1.6), s - 1 || 1, s - 1 || 1);
    }
    c.restore();

    c.fillStyle = P.OUTLINE;
    c.fillRect(x - 1, y, s + 2, s);
    c.fillRect(x, y - 1, s, s + 2);
    c.fillStyle = p.color;
    c.fillRect(x, y, s, s);
    c.fillStyle = '#ffffff';
    c.fillRect(x, y, 1, 1);
}

function drawParticleWorld(c, pt) {
    const P = PixelArt;
    const alpha = Math.max(0, pt.life / pt.maxLife);
    c.save();
    if (pt.isLightning && pt.points.length > 1) {
        const pts = pt.points.map(q => ({ x: P.ax(q.x), y: P.ax(q.y) }));
        const path = [pts[0]];
        for (let k = 1; k < pts.length; k++) {
            const prev = pts[k - 1];
            const curr = pts[k];
            path.push({ x: (prev.x + curr.x) / 2 + (Math.random() - 0.5) * 8, y: (prev.y + curr.y) / 2 + (Math.random() - 0.5) * 8 });
            path.push(curr);
        }
        c.globalAlpha = alpha * 0.55;
        for (let k = 1; k < path.length; k++) P.line(c, path[k - 1].x, path[k - 1].y, path[k].x, path[k].y, '#a78bfa', 3);
        c.globalAlpha = alpha;
        for (let k = 1; k < path.length; k++) P.line(c, path[k - 1].x, path[k - 1].y, path[k].x, path[k].y, '#fef08a', 1);
        for (const q of pts.slice(1)) {
            c.fillStyle = '#ffffff';
            c.fillRect(q.x - 1, q.y - 1, 3, 3);
        }
    } else if (pt.isShockwave) {
        const prog = 1 - alpha;
        const r = (pt.maxR * prog) / P.PX;
        c.globalAlpha = alpha;
        P.ring(c, P.ax(pt.x), P.ax(pt.y), r, '#f97316');
        P.ring(c, P.ax(pt.x), P.ax(pt.y), r - 1, '#fde047');
        P.ring(c, P.ax(pt.x), P.ax(pt.y), r * 0.6, 'rgba(249, 115, 22, 0.6)', 2);
    } else {
        const s = pt.r > 3.5 ? 2 : 1;
        c.globalAlpha = alpha;
        c.fillStyle = pt.color;
        c.fillRect(P.ax(pt.x), P.ax(pt.y), s, s);
        if (s === 2 && alpha > 0.5) {
            c.fillStyle = '#fff7d6';
            c.fillRect(P.ax(pt.x), P.ax(pt.y), 1, 1);
        }
    }
    c.restore();
}

function drawRoadMineWorld(c, mine, timeSec) {
    const P = PixelArt;
    const blink = Math.sin(timeSec * 8) > 0 ? 1 : 0;
    const sprite = P.cached(`mine|${blink}`, () => P.rasterize([
        P.circle(0, 0, 5, '#334155'),
        P.circle(0, 0, 3.6, (u, v) => ((Math.floor(Math.atan2(v, u) * 2) & 1) ? '#475569' : '#1e293b')),
        P.circle(0, 0, 1.6, blink ? '#ef4444' : '#7f1d1d', { flat: true })
    ], 14));
    P.blit(c, sprite, P.ax(mine.x), P.ax(mine.y));
}

// Translucent area with a marching dashed rim
function drawRangeArea(c, x, y, rangeWorld, fill, stroke, timeSec) {
    const P = PixelArt;
    const r = rangeWorld / P.PX;
    P.fillEllipse(c, P.ax(x), P.ax(y), r, r, fill);
    P.ring(c, P.ax(x), P.ax(y), r, stroke, 3, (timeSec || 0) * 4);
}

function drawCrosshairWorld(c, x, y, timeSec) {
    const P = PixelArt;
    const cx = P.ax(x);
    const cy = P.ax(y);
    const pulse = Math.floor((timeSec || 0) * 6) & 1;
    P.ring(c, cx, cy, 7 + pulse, '#ef4444');
    c.fillStyle = '#ef4444';
    c.fillRect(cx - 11, cy, 6, 1);
    c.fillRect(cx + 6, cy, 6, 1);
    c.fillRect(cx, cy - 11, 1, 6);
    c.fillRect(cx, cy + 6, 1, 6);
    c.fillStyle = '#fde047';
    c.fillRect(cx, cy, 1, 1);
}

// Expose globally and on window.Game namespace
window.spawnParticles = spawnParticles;
window.spawnFloatingText = spawnFloatingText;
window.drawProjectileWorld = drawProjectileWorld;
window.drawParticleWorld = drawParticleWorld;
window.drawRoadMineWorld = drawRoadMineWorld;
window.drawRangeArea = drawRangeArea;
window.drawCrosshairWorld = drawCrosshairWorld;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.Effects = {
    spawnParticles,
    spawnFloatingText,
    drawProjectileWorld,
    drawParticleWorld,
    drawRoadMineWorld,
    drawRangeArea,
    drawCrosshairWorld
};
