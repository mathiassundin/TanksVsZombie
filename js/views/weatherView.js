/* ==========================================
 * Tanks Vs. Zombie - Weather View (Weather Overlays)
 * View - pixel art (draws in art space)
 * ========================================== */

function drawWeatherOverlay(c) {
    const w = state.weather;
    if (w.intensity <= 0.01) return;
    const P = PixelArt;

    c.save();
    c.globalAlpha = w.intensity;

    if (w.type === 'rain') {
        c.fillStyle = 'rgba(15, 23, 42, 0.16)';
        c.fillRect(0, 0, P.ART_W, P.ART_H);
        c.fillStyle = 'rgba(186, 230, 253, 0.75)';
        for (const p of w.particles) {
            const x = P.ax(p.x);
            const y = P.ax(p.y);
            const len = Math.max(3, Math.round(p.size / P.PX));
            for (let k = 0; k < len; k++) {
                c.fillRect(x - Math.round(k * 0.25), y + k, 1, 1);
            }
        }
        // Splash pixels on the ground
        c.fillStyle = 'rgba(224, 242, 254, 0.6)';
        for (let i = 0; i < w.particles.length; i += 4) {
            const p = w.particles[i];
            const x = P.ax(p.x * 0.7 + 150) % P.ART_W;
            const y = P.ax(p.y * 0.6 + 120) % P.ART_H;
            c.fillRect(x - 1, y, 1, 1);
            c.fillRect(x + 1, y, 1, 1);
        }
    } else if (w.type === 'sandstorm') {
        c.fillStyle = 'rgba(180, 83, 9, 0.2)';
        c.fillRect(0, 0, P.ART_W, P.ART_H);
        for (const p of w.particles) {
            const x = P.ax(p.x);
            const y = P.ax(p.y);
            const s = p.size > 3.5 ? 2 : 1;
            c.fillStyle = s === 2 ? 'rgba(120, 53, 15, 0.6)' : 'rgba(253, 230, 138, 0.55)';
            c.fillRect(x, y, s, s);
            c.fillStyle = 'rgba(120, 53, 15, 0.3)';
            c.fillRect(x - 2, y, 2, 1);
        }
    } else if (w.type === 'snow') {
        c.fillStyle = 'rgba(30, 58, 138, 0.08)';
        c.fillRect(0, 0, P.ART_W, P.ART_H);
        for (const p of w.particles) {
            const x = P.ax(p.x);
            const y = P.ax(p.y);
            c.fillStyle = 'rgba(71, 85, 105, 0.45)';
            c.fillRect(x + 1, y + 1, 1, 1);
            c.fillStyle = '#ffffff';
            if (p.size > 4.5) {
                c.fillRect(x - 1, y, 3, 1);
                c.fillRect(x, y - 1, 1, 3);
            } else if (p.size > 3.2) {
                c.fillRect(x, y, 2, 2);
            } else {
                c.fillRect(x, y, 1, 1);
            }
        }
    }
    c.restore();
}

// Expose globally and on window.Game namespace
window.drawWeatherOverlay = drawWeatherOverlay;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.Weather = {
    drawWeatherOverlay
};
