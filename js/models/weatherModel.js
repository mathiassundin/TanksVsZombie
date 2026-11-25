/* ==========================================
 * Tanks Vs. Zombie - Weather Model (Simulation & Particle States)
 * Model
 * ========================================== */

function initWeatherParticles(type) {
    const list = [];
    const count = type === 'rain' ? 120 : type === 'sandstorm' ? 95 : 85;
    for (let i = 0; i < count; i++) {
        list.push({
            x: Math.random() * CANVAS_W,
            y: Math.random() * CANVAS_H,
            speed: type === 'rain' ? 480 + Math.random() * 180 : type === 'sandstorm' ? 280 + Math.random() * 160 : 45 + Math.random() * 45,
            size: type === 'rain' ? 10 + Math.random() * 6 : type === 'sandstorm' ? 2 + Math.random() * 3 : 2.5 + Math.random() * 3.5,
            drift: (Math.random() - 0.5) * 40,
            phase: Math.random() * Math.PI * 2
        });
    }
    return list;
}

function getWeatherTypeForMap(mapId) {
    if (mapId === 'meadow') return 'rain';
    if (mapId === 'desert') return 'sandstorm';
    if (mapId === 'winter') return 'snow';
    if (mapId === 'maze') {
        const types = ['rain', 'sandstorm', 'snow'];
        return types[Math.floor(Math.random() * types.length)];
    }
    return 'rain';
}

function rollWeatherForWave(waveNum) {
    const mapType = getWeatherTypeForMap(state.selectedMap);
    const w = state.weather;

    if (w.active) {
        w.wavesLeft -= 1;
        if (w.wavesLeft <= 0) {
            w.active = false;
            w.cooldownWaves = 1 + Math.floor(Math.random() * 2);
        }
        return;
    }

    if (w.cooldownWaves > 0) {
        w.cooldownWaves -= 1;
        return;
    }

    const guaranteed = waveNum % 3 === 0;
    const chance = waveNum === 1 ? 0.8 : 0.65;
    if (guaranteed || Math.random() < chance) {
        w.active = true;
        w.type = mapType;
        w.wavesLeft = 2 + Math.floor(Math.random() * 3); // 2 to 4 waves in a row
        w.particles = initWeatherParticles(mapType);
    }
}

function updateWeather(dt) {
    const w = state.weather;
    const targetIntensity = w.active ? 1 : 0;
    w.intensity += (targetIntensity - w.intensity) * Math.min(1, dt * 1.5);

    if (w.intensity <= 0.01 && !w.active) return;

    for (const p of w.particles) {
        if (w.type === 'rain') {
            p.x -= p.speed * 0.24 * dt;
            p.y += p.speed * dt;
        } else if (w.type === 'sandstorm') {
            p.x += p.speed * dt;
            p.y += Math.sin(p.phase + p.x * 0.01) * 28 * dt;
        } else {
            p.phase += dt * 2.2;
            p.x += Math.sin(p.phase) * 24 * dt - 12 * dt;
            p.y += p.speed * dt;
        }

        if (p.y > CANVAS_H + 15) {
            p.y = -15;
            p.x = Math.random() * CANVAS_W;
        }
        if (p.x < -20) p.x = CANVAS_W + 20;
        if (p.x > CANVAS_W + 20) p.x = -20;
    }
}

// Expose globally and on window.Game namespace
window.initWeatherParticles = initWeatherParticles;
window.getWeatherTypeForMap = getWeatherTypeForMap;
window.rollWeatherForWave = rollWeatherForWave;
window.updateWeather = updateWeather;

window.Game = window.Game || {};
window.Game.Models = window.Game.Models || {};
window.Game.Models.Weather = {
    initWeatherParticles,
    getWeatherTypeForMap,
    rollWeatherForWave,
    updateWeather
};
