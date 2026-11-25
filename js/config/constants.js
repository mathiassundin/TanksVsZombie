/* ==========================================
 * Tanks Vs. Zombie - Constants & Definitions
 * Model / Config
 * ========================================== */

const BLUE_STAR_INLINE = `<svg class="inline-block w-3.5 h-3.5 -mt-0.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#38bdf8" stroke="#1c1917" stroke-width="2.2" stroke-linejoin="round"/></svg>`;

const CANVAS_W = 960;
const CANVAS_H = 560;
const OBSTACLE_CLEAR_COST = 15;
const SAVE_KEY = 'tank_vs_zombie_meta_v2';

const MAPS = {
    meadow: {
        id: 'meadow',
        maxWaves: 42,
        bg: '#4d7c0f',
        bgAlt: '#3f6212',
        roadOuter: '#78350f',
        roadInner: '#d97706',
        roadWidth: 52,
        waypoints: [
            { x: 0, y: 120 },
            { x: 250, y: 120 },
            { x: 250, y: 390 },
            { x: 520, y: 390 },
            { x: 520, y: 165 },
            { x: 770, y: 165 },
            { x: 770, y: 440 },
            { x: 960, y: 440 }
        ],
        pond: { x: 115, y: 430, rx: 72, ry: 46 },
        streamX: 645,
        bridgeY: 165,
        decorations: [
            { x: 85, y: 230, type: 'tree', r: 22 },
            { x: 145, y: 295, type: 'bush', r: 16 },
            { x: 375, y: 110, type: 'tree', r: 24 },
            { x: 400, y: 265, type: 'rock', r: 17 },
            { x: 365, y: 495, type: 'bush', r: 16 },
            { x: 645, y: 315, type: 'tree', r: 23 },
            { x: 655, y: 475, type: 'rock', r: 16 },
            { x: 875, y: 110, type: 'tree', r: 22 },
            { x: 880, y: 295, type: 'bush', r: 17 }
        ]
    },
    desert: {
        id: 'desert',
        maxWaves: 70,
        bg: '#eab308',
        bgAlt: '#ca8a04',
        roadOuter: '#7c2d12',
        roadInner: '#fed7aa',
        roadWidth: 50,
        waypoints: [
            { x: 0, y: 95 },
            { x: 810, y: 95 },
            { x: 810, y: 245 },
            { x: 165, y: 245 },
            { x: 165, y: 405 },
            { x: 810, y: 405 },
            { x: 810, y: 500 },
            { x: 960, y: 500 }
        ],
        pond: { x: 115, y: 475, rx: 68, ry: 42 },
        streamX: null,
        bridgeY: null,
        decorations: [
            { x: 95, y: 170, type: 'cactus', r: 18 },
            { x: 460, y: 170, type: 'desertRock', r: 21 },
            { x: 685, y: 170, type: 'cactus', r: 17 },
            { x: 320, y: 325, type: 'cactus', r: 19 },
            { x: 585, y: 325, type: 'desertRock', r: 22 },
            { x: 390, y: 485, type: 'cactus', r: 18 },
            { x: 640, y: 485, type: 'desertRock', r: 19 },
            { x: 895, y: 175, type: 'cactus', r: 18 },
            { x: 895, y: 345, type: 'desertRock', r: 20 }
        ]
    },
    maze: {
        id: 'maze',
        maxWaves: 42,
        bg: '#365314',
        bgAlt: '#3f6212',
        roadOuter: '#713f12',
        roadInner: '#d6a64f',
        roadWidth: 350,
        roadWaypoints: [
            { x: -20, y: CANVAS_H / 2 },
            { x: CANVAS_W + 20, y: CANVAS_H / 2 }
        ],
        waypoints: [
            { x: -20, y: CANVAS_H / 2 },
            { x: CANVAS_W + 20, y: CANVAS_H / 2 }
        ],
        pond: null,
        streamX: null,
        bridgeY: null,
        decorations: []
    },
    winter: {
        id: 'winter',
        maxWaves: 100,
        bg: '#e2e8f0',
        bgAlt: '#cbd5e1',
        roadOuter: '#334155',
        roadInner: '#94a3b8',
        roadWidth: 50,
        waypoints: [
            { x: 0, y: 280 },
            { x: 195, y: 280 },
            { x: 195, y: 105 },
            { x: 475, y: 105 },
            { x: 475, y: 455 },
            { x: 755, y: 455 },
            { x: 755, y: 225 },
            { x: 960, y: 225 }
        ],
        pond: { x: 115, y: 445, rx: 74, ry: 46 },
        streamX: 615,
        bridgeY: 455,
        decorations: [
            { x: 95, y: 135, type: 'snowPine', r: 22 },
            { x: 335, y: 220, type: 'snowPine', r: 23 },
            { x: 330, y: 410, type: 'rock', r: 18 },
            { x: 615, y: 155, type: 'snowPine', r: 24 },
            { x: 615, y: 310, type: 'rock', r: 17 },
            { x: 865, y: 115, type: 'snowPine', r: 22 },
            { x: 865, y: 385, type: 'snowPine', r: 23 }
        ]
    }
};

const DIFFICULTIES = {
    easy: { id: 'easy', lives: 25, startGold: 340, hpMult: 0.78, speedMult: 0.92, rewardMult: 1.15 },
    normal: { id: 'normal', lives: 20, startGold: 275, hpMult: 1.0, speedMult: 1.0, rewardMult: 1.0 },
    hard: { id: 'hard', lives: 15, startGold: 300, hpMult: 1.32, speedMult: 1.08, rewardMult: 0.9 }
};

const TANK_DEFS = [
    { id: 'basic', unlockCost: 0, cost: 80, damage: 25, range: 140, fireRate: 1.2, color: '#16a34a', turretColor: '#15803d', barrelColor: '#334155', bulletColor: '#facc15', bulletSpeed: 460, techReq: null },
    { id: 'frost', unlockCost: 110, cost: 105, damage: 14, range: 135, fireRate: 1.05, color: '#06b6d4', turretColor: '#67e8f9', barrelColor: '#0e7490', bulletColor: '#a5f3fc', bulletSpeed: 420, slow: 0.45, splash: 48, techReq: null },
    { id: 'rapid', unlockCost: 130, cost: 125, damage: 12, range: 130, fireRate: 3.1, color: '#2563eb', turretColor: '#1d4ed8', barrelColor: '#1e293b', bulletColor: '#fde047', bulletSpeed: 540, techReq: 'tech_rapid' },
    { id: 'spike', unlockCost: 150, cost: 140, damage: 18, range: 112, fireRate: 1.35, color: '#db2777', turretColor: '#f472b6', barrelColor: '#831843', bulletColor: '#e2e8f0', bulletSpeed: 410, spike: true, techReq: 'tech_spike' },
    { id: 'cannon', unlockCost: 180, cost: 170, damage: 56, range: 155, fireRate: 0.68, color: '#991b1b', turretColor: '#dc2626', barrelColor: '#1c1917', bulletColor: '#fb923c', bulletSpeed: 370, splash: 62, techReq: 'tech_cannon' },
    { id: 'flame', unlockCost: 200, cost: 185, damage: 11, range: 108, fireRate: 4.2, color: '#ea580c', turretColor: '#fb923c', barrelColor: '#431407', bulletColor: '#f97316', bulletSpeed: 330, burn: 14, techReq: 'tech_flame' },
    { id: 'sniper', unlockCost: 230, cost: 215, damage: 135, range: 265, fireRate: 0.52, color: '#475569', turretColor: '#334155', barrelColor: '#0f172a', bulletColor: '#f87171', bulletSpeed: 760, techReq: 'tech_sniper' },
    { id: 'tesla', unlockCost: 270, cost: 250, damage: 44, range: 150, fireRate: 0.95, color: '#7c3aed', turretColor: '#a78bfa', barrelColor: '#4c1d95', bulletColor: '#fef08a', bulletSpeed: 600, chain: 4, techReq: 'tech_tesla' }
];

const BUILDING_DEFS = [
    { id: 'mine', cost: 150, maxCount: 1, income: 55, range: 0, color: '#eab308', techReq: 'tech_mine' },
    { id: 'radar', cost: 140, maxCount: 2, range: 135, bonus: 0.15, color: '#0284c7', techReq: 'tech_radar' },
    { id: 'depot', cost: 145, maxCount: 2, range: 135, bonus: 0.15, color: '#059669', techReq: 'tech_depot' }
];

const TECH_NODES = [
    // Tanks & Towers
    { id: 'tech_rapid', category: 'tanks', icon: '🔫', cost: 1, maxLevel: 1, req: null },
    { id: 'tech_spike', category: 'tanks', icon: '⚙️', cost: 2, maxLevel: 1, req: null },
    { id: 'tech_cannon', category: 'tanks', icon: '💣', cost: 2, maxLevel: 1, req: null },
    { id: 'tech_flame', category: 'tanks', icon: '🔥', cost: 3, maxLevel: 1, req: 'tech_cannon' },
    { id: 'tech_sniper', category: 'tanks', icon: '🎯', cost: 3, maxLevel: 1, req: 'tech_rapid' },
    { id: 'tech_tesla', category: 'tanks', icon: '⚡', cost: 4, maxLevel: 1, req: 'tech_spike' },
    // Buildings, Economy & Upgrades
    { id: 'tech_mine', category: 'economy', icon: '⛏️', cost: 2, maxLevel: 1, req: null },
    { id: 'tech_deepmines', category: 'economy', icon: '💎', cost: 2, maxLevel: 4, req: 'tech_mine' },
    { id: 'tech_warchest', category: 'economy', icon: '💰', cost: 2, maxLevel: 4, req: null },
    { id: 'tech_radar', category: 'economy', icon: '📡', cost: 2, maxLevel: 1, req: null },
    { id: 'tech_depot', category: 'economy', icon: '🔧', cost: 2, maxLevel: 1, req: null },
    { id: 'tech_optics', category: 'economy', icon: '🔭', cost: 2, maxLevel: 5, req: null },
    { id: 'tech_autoloader', category: 'economy', icon: '⚡', cost: 2, maxLevel: 5, req: null },
    // Tactical Abilities
    { id: 'tech_roadmine', category: 'abilities', icon: '🧨', cost: 2, maxLevel: 1, req: null },
    { id: 'tech_airstrike', category: 'abilities', icon: '✈️', cost: 3, maxLevel: 1, req: null },
    { id: 'tech_heavyair', category: 'abilities', icon: '🚀', cost: 3, maxLevel: 5, req: 'tech_airstrike' }
];

// Expose globally and on window.Game namespace
window.BLUE_STAR_INLINE = BLUE_STAR_INLINE;
window.CANVAS_W = CANVAS_W;
window.CANVAS_H = CANVAS_H;
window.OBSTACLE_CLEAR_COST = OBSTACLE_CLEAR_COST;
window.SAVE_KEY = SAVE_KEY;
window.MAPS = MAPS;
window.DIFFICULTIES = DIFFICULTIES;
window.TANK_DEFS = TANK_DEFS;
window.BUILDING_DEFS = BUILDING_DEFS;
window.TECH_NODES = TECH_NODES;

window.Game = window.Game || {};
window.Game.Config = window.Game.Config || {};
Object.assign(window.Game.Config, {
    BLUE_STAR_INLINE,
    CANVAS_W,
    CANVAS_H,
    OBSTACLE_CLEAR_COST,
    SAVE_KEY,
    MAPS,
    DIFFICULTIES,
    TANK_DEFS,
    BUILDING_DEFS,
    TECH_NODES
});
