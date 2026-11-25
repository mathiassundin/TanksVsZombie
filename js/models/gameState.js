/* ==========================================
 * Tanks Vs. Zombie - Game State & Meta Progression
 * Model
 * ========================================== */

function loadMeta() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                techStars: Number(parsed.techStars) || 0,
                techLevels: parsed.techLevels || {}
            };
        }
    } catch (_) {}
    return { techStars: 0, techLevels: {} };
}

const meta = loadMeta();
function saveMeta() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
    } catch (_) {}
}

function getTechLevel(id) {
    return meta.techLevels[id] || 0;
}

const state = {
    selectedMap: 'meadow',
    selectedDiff: 'normal',
    matchStarted: false,
    paused: true,
    gameOver: false,
    victory: false,
    lives: 20,
    money: 275,
    wave: 0,
    waveActive: false,
    autoWave: false,
    speedMult: 1,
    kills: 0,
    sessionStarsEarned: 0,
    unlockedTanks: { basic: true },
    unlockedAbilities: { mine: false, airstrike: false },
    abilityCooldowns: { mine: 0, airstrike: 0 },
    tanks: [],
    buildings: [],
    obstacles: [],
    zombies: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    roadMines: [],
    spawnQueue: [],
    spawnTimer: 0,
    placingItem: null,
    hoverPos: null,
    touchPreviewPos: null,
    hoverTower: null,
    selectedTower: null,
    selectedBuilding: null,
    selectedObstacle: null,
    weather: {
        active: false,
        type: 'none',
        wavesLeft: 0,
        cooldownWaves: 0,
        intensity: 0,
        particles: []
    }
};

// Expose globally and on window.Game namespace
window.loadMeta = loadMeta;
window.saveMeta = saveMeta;
window.getTechLevel = getTechLevel;
window.meta = meta;
window.state = state;

window.Game = window.Game || {};
window.Game.Models = window.Game.Models || {};
window.Game.Models.State = state;
window.Game.Models.Meta = meta;
window.Game.Models.loadMeta = loadMeta;
window.Game.Models.saveMeta = saveMeta;
window.Game.Models.getTechLevel = getTechLevel;
