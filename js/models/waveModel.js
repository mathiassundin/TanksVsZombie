/* ==========================================
 * Tanks Vs. Zombie - Wave Model (Wave Generation & Spawning)
 * Model
 * ========================================== */

function getMaxWaves() {
    return MAPS[state.selectedMap].maxWaves;
}

function describeWave(waveNum) {
    if (waveNum % 7 === 0) return t().waveTypes.boss(waveNum);
    const parts = [];
    if (waveNum >= 6 && waveNum % 2 === 0) parts.push(t().waveTypes.frostImmune);
    // Keep in sync with the type rules in buildWaveQueue
    if (waveNum >= 10 && waveNum % 3 === 1) parts.push(t().waveTypes.giant);
    if (waveNum >= 5) parts.push(t().waveTypes.armored);
    if (waveNum >= 3) parts.push(t().waveTypes.fast);
    if (waveNum < 3) parts.push(t().waveTypes.normal);

    if (waveNum >= 14) parts.push(t().waveTypes.horde);
    return parts.join(' + ');
}

function buildWaveQueue(waveNum) {
    const diff = DIFFICULTIES[state.selectedDiff];
    const queue = [];

    // Every 7th wave is a pure Boss Wave
    if (waveNum % 7 === 0) {
        const bossIdx = waveNum / 7;
        // Rebalanced wave 7 boss HP from 5230 down to 2350 for fair early-game balance
        const bossHp = Math.round(2350 * Math.pow(2.05, bossIdx - 1) * diff.hpMult);
        const starReward = bossIdx === 1 ? 1 : Math.min(4, 1 + Math.floor(bossIdx / 2));
        queue.push({
            type: 'boss',
            hp: bossHp,
            speed: Math.min(46, (30 + bossIdx * 1.5) * diff.speedMult),
            radius: 28,
            color: '#7f1d1d',
            reward: Math.round((85 + bossIdx * 20) * diff.rewardMult),
            starReward,
            frostImmune: false,
            delay: 1.0
        });
        return queue;
    }

    // Tightened coin scaling per zombie so wave 35 stays balanced
    const count = Math.min(68, 7 + Math.floor(waveNum * 1.45));
    const lateWaveFactor = waveNum <= 15 ? 1 : Math.max(0.45, 1 - (waveNum - 15) * 0.018);

    for (let i = 0; i < count; i++) {
        let type = 'normal';
        let frostImmune = false;

        if (waveNum >= 6 && waveNum % 2 === 0 && i % 3 === 1) {
            frostImmune = true;
        }
        if (waveNum >= 10 && waveNum % 3 === 1 && i % 5 === 4) {
            type = 'giant';
        } else if (waveNum >= 5 && i % 4 === 2) {
            type = 'armored';
        } else if (waveNum >= 3 && i % 3 === 1) {
            type = 'fast';
        }

        const baseHp = (34 + Math.pow(waveNum, 1.48) * 11) * diff.hpMult;
        const hpMultType = type === 'giant' ? 3.4 : type === 'armored' ? 1.85 : type === 'fast' ? 0.72 : 1.0;
        const baseSpeed = (type === 'fast' ? 84 : type === 'giant' ? 40 : type === 'armored' ? 48 : 58) * diff.speedMult;
        const rawReward = (type === 'giant' ? 14 : type === 'armored' ? 8 : 5) + Math.min(5, Math.floor(waveNum / 6));
        const reward = Math.max(2, Math.round(rawReward * lateWaveFactor * diff.rewardMult));

        queue.push({
            type,
            hp: Math.round(baseHp * hpMultType),
            speed: baseSpeed,
            radius: type === 'giant' ? 20 : type === 'armored' ? 15 : type === 'fast' ? 12 : 13.5,
            color: frostImmune
                ? '#0284c7'
                : type === 'giant'
                ? '#581c87'
                : type === 'armored'
                ? '#475569'
                : type === 'fast'
                ? '#ca8a04'
                : '#16a34a',
            reward,
            frostImmune,
            delay: Math.max(0.24, 0.72 - waveNum * 0.01)
        });
    }
    return queue;
}

function spawnZombie(spec) {
    const startWp = MAPS[state.selectedMap].waypoints[0];
    state.zombies.push({
        type: spec.type,
        x: startWp.x - 10,
        y: startWp.y + (Math.random() - 0.5) * 10,
        wpIndex: 1,
        angle: 0,
        hp: spec.hp,
        maxHp: spec.hp,
        speed: spec.speed,
        radius: spec.radius,
        color: spec.color,
        reward: spec.reward,
        starReward: spec.starReward || 0,
        frostImmune: !!spec.frostImmune,
        slowTimer: 0,
        burnTimer: 0,
        burnDps: 0,
        hitFlash: 0,
        walkPhase: Math.random() * Math.PI * 2
    });
}

function startNextWave() {
    if (state.waveActive || state.gameOver || state.victory || !state.matchStarted) return;
    const maxW = getMaxWaves();
    if (state.wave >= maxW) return;

    state.wave += 1;
    state.waveActive = true;
    state.spawnQueue = buildWaveQueue(state.wave);
    state.spawnTimer = 0.25;
    rollWeatherForWave(state.wave);

    if (state.wave % 7 === 0) {
        SoundFX.bossAlert();
        const banner = document.getElementById('boss-banner');
        document.getElementById('boss-banner-title').textContent = t().bossBannerTitle(state.wave);
        document.getElementById('boss-banner-sub').textContent = t().bossBannerSub;
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 3600);
    }

    updateHUD();
}

// Expose globally and on window.Game namespace
window.getMaxWaves = getMaxWaves;
window.describeWave = describeWave;
window.buildWaveQueue = buildWaveQueue;
window.spawnZombie = spawnZombie;
window.startNextWave = startNextWave;

window.Game = window.Game || {};
window.Game.Models = window.Game.Models || {};
window.Game.Models.Wave = {
    getMaxWaves,
    describeWave,
    buildWaveQueue,
    spawnZombie,
    startNextWave
};
