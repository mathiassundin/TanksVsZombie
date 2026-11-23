/* ==========================================
 * Tanks Vs. Zombie - Weather View (Weather Overlays)
 * View
 * ========================================== */

function drawWeatherOverlay(c) {
    const w = state.weather;
    if (w.intensity <= 0.01) return;

    c.save();
    c.globalAlpha = w.intensity;

    if (w.type === 'rain') {
        c.fillStyle = 'rgba(15, 23, 42, 0.14)';
        c.fillRect(0, 0, CANVAS_W, CANVAS_H);
        c.strokeStyle = 'rgba(186, 230, 253, 0.72)';
        c.lineWidth = 1.6;
        c.beginPath();
        for (const p of w.particles) {
            c.moveTo(p.x, p.y);
            c.lineTo(p.x - p.size * 0.25, p.y + p.size);
        }
        c.stroke();
    } else if (w.type === 'sandstorm') {
        c.fillStyle = 'rgba(180, 83, 9, 0.18)';
        c.fillRect(0, 0, CANVAS_W, CANVAS_H);
        for (const p of w.particles) {
            c.fillStyle = 'rgba(120, 53, 15, 0.55)';
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();
        }
    } else if (w.type === 'snow') {
        c.fillStyle = 'rgba(30, 58, 138, 0.08)';
        c.fillRect(0, 0, CANVAS_W, CANVAS_H);
        for (const p of w.particles) {
            c.fillStyle = '#ffffff';
            c.strokeStyle = 'rgba(71, 85, 105, 0.55)';
            c.lineWidth = 1;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();
            c.stroke();
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
