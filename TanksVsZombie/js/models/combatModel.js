/* ==========================================
 * Tanks Vs. Zombie - Combat Model (Damage & Tactical Abilities)
 * Model
 * ========================================== */

function damageZombie(z, amount, opts = {}) {
    if (!z || z.hp <= 0) return;
    z.hp -= amount;
    if (!opts.isDot) {
        z.hitFlash = 0.08;
    }

    if (opts.slow && opts.slow > 0) {
        if (z.frostImmune) {
            if ((z._immuneToastCd || 0) <= 0) {
                spawnFloatingText(z.x, z.y - z.radius - 8, t().toasts.frostImmuneHit, '#7dd3fc');
                z._immuneToastCd = 1.6;
            }
        } else {
            z.slowTimer = Math.max(z.slowTimer, 2.5);
        }
    }

    if (opts.burn && opts.burn > 0) {
        z.burnTimer = Math.max(z.burnTimer, 3.0);
        z.burnDps = Math.max(z.burnDps || 0, opts.burn);
    }

    if (z.type === 'boss') {
        if (!opts.isDot && amount >= 8) {
            spawnFloatingText(z.x + (Math.random() - 0.5) * 18, z.y - z.radius - 6, `-${Math.round(amount)}`, '#fca5a5');
        }
        updateBossHUD();
    }

    if (z.hp <= 0 && !z._rewarded) {
        z._rewarded = true;
        state.kills += 1;
        state.money += z.reward;
        spawnParticles(z.x, z.y, z.color, z.type === 'boss' ? 32 : 10, z.type === 'boss' ? 180 : 95);
        spawnFloatingText(z.x, z.y - 10, `+${z.reward} 🪙`, '#facc15');

        if (z.type === 'boss') {
            const starsAwarded = z.starReward || 1;
            meta.techStars += starsAwarded;
            state.sessionStarsEarned += starsAwarded;
            saveMeta();
            SoundFX.explode();
            showToast(t().toasts.bossDefeated(starsAwarded));
            updateBossHUD();
        }

        updateHUD();
        renderShopLists();
        updateUpgradePanel();
    }
}

function triggerAirstrike(x, y) {
    SoundFX.explode();
    const heavyLvl = getTechLevel('tech_heavyair');
    const dmg = Math.round((280 + state.wave * 35) * (1 + heavyLvl * 0.45));
    const radius = 115;

    state.particles.push({
        isShockwave: true,
        x,
        y,
        maxR: radius,
        life: 0.35,
        maxLife: 0.35
    });
    spawnParticles(x, y, '#f97316', 26, 175);
    spawnParticles(x, y, '#facc15', 16, 120);

    for (const z of state.zombies) {
        if (z.hp > 0 && Math.hypot(z.x - x, z.y - y) <= radius + z.radius) {
            damageZombie(z, dmg, { burn: 18 });
        }
    }
}

// Expose globally and on window.Game namespace
window.damageZombie = damageZombie;
window.triggerAirstrike = triggerAirstrike;

window.Game = window.Game || {};
window.Game.Models = window.Game.Models || {};
window.Game.Models.Combat = {
    damageZombie,
    triggerAirstrike
};
