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

// Expose globally and on window.Game namespace
window.spawnParticles = spawnParticles;
window.spawnFloatingText = spawnFloatingText;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.Effects = {
    spawnParticles,
    spawnFloatingText
};
