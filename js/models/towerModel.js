/* ==========================================
 * Tanks Vs. Zombie - Tower Model (Tanks & Buildings Mechanics)
 * Model
 * ========================================== */

// --- Stats, Upgrades & Economy ---
function getTankStats(tk) {
    const def = TANK_DEFS.find(d => d.id === tk.id);
    const lvl = tk.level;
    const opticsMult = 1 + getTechLevel('tech_optics') * 0.08;
    const loaderMult = 1 + getTechLevel('tech_autoloader') * 0.08;

    let radarBonus = 0;
    let depotBonus = 0;
    for (const b of state.buildings) {
        const bDef = BUILDING_DEFS.find(d => d.id === b.id);
        const auraR = bDef.range + (b.level - 1) * 14;
        if (Math.hypot(tk.x - b.x, tk.y - b.y) <= auraR) {
            if (b.id === 'radar') radarBonus = Math.max(radarBonus, bDef.bonus + (b.level - 1) * 0.05);
            if (b.id === 'depot') depotBonus = Math.max(depotBonus, bDef.bonus + (b.level - 1) * 0.05);
        }
    }

    const damage = Math.round(def.damage * Math.pow(1.36, lvl - 1));
    const baseRange = Math.round(def.range * Math.pow(1.08, lvl - 1) * opticsMult);
    const range = Math.round(baseRange * (1 + radarBonus));
    const baseFireRate = def.fireRate * Math.pow(1.13, lvl - 1) * loaderMult;
    const fireRate = +(baseFireRate * (1 + depotBonus)).toFixed(2);

    return {
        damage,
        range,
        fireRate,
        radarBonus,
        depotBonus,
        splash: def.splash || 0,
        slow: def.slow || 0,
        burn: def.burn ? Math.round(def.burn * Math.pow(1.3, lvl - 1)) : 0,
        chain: def.chain || 0,
        spike: !!def.spike,
        bulletSpeed: def.bulletSpeed,
        bulletColor: def.bulletColor
    };
}

function getUpgradeCost(entity, isBuilding = false) {
    const baseCost = isBuilding
        ? BUILDING_DEFS.find(d => d.id === entity.id).cost
        : TANK_DEFS.find(d => d.id === entity.id).cost;
    return Math.round(baseCost * (0.72 * Math.pow(1.45, entity.level - 1)));
}

function getBuildingIncome(b) {
    const bDef = BUILDING_DEFS.find(d => d.id === b.id);
    const deepMult = 1 + getTechLevel('tech_deepmines') * 0.25;
    return Math.round(bDef.income * Math.pow(1.42, b.level - 1) * deepMult);
}

// --- Targeting & Firing Mechanism ---
function selectTargetForTank(tk, range) {
    const candidates = state.zombies.filter(z => z.hp > 0 && Math.hypot(z.x - tk.x, z.y - tk.y) <= range + z.radius);
    if (candidates.length === 0) return null;

    const prio = tk.priority || 'first';
    if (prio === 'strong') {
        return candidates.reduce((best, cur) => (cur.hp > best.hp ? cur : best), candidates[0]);
    }
    if (prio === 'close') {
        return candidates.reduce((best, cur) =>
            Math.hypot(cur.x - tk.x, cur.y - tk.y) < Math.hypot(best.x - tk.x, best.y - tk.y) ? cur : best,
            candidates[0]
        );
    }
    // 'first' along path
    return candidates.reduce((best, cur) => {
        if (cur.wpIndex !== best.wpIndex) return cur.wpIndex > best.wpIndex ? cur : best;
        const wps = MAPS[state.selectedMap].waypoints;
        const wp = wps[cur.wpIndex] || wps[wps.length - 1];
        return Math.hypot(wp.x - cur.x, wp.y - cur.y) < Math.hypot(wp.x - best.x, wp.y - best.y) ? cur : best;
    }, candidates[0]);
}

function fireTankAt(tk, target, stats) {
    if (stats.spike) {
        SoundFX.shoot();
        for (let a = 0; a < 8; a++) {
            const ang = (a * Math.PI) / 4;
            state.projectiles.push({
                x: tk.x,
                y: tk.y,
                vx: Math.cos(ang) * stats.bulletSpeed,
                vy: Math.sin(ang) * stats.bulletSpeed,
                traveled: 0,
                maxDist: stats.range + 15,
                damage: stats.damage,
                radius: 4,
                color: stats.bulletColor,
                splash: 0,
                slow: 0,
                burn: 0
            });
        }
        return;
    }

    if (stats.chain > 0) {
        SoundFX.tesla();
        const hitList = [target];
        let current = target;
        while (hitList.length < stats.chain) {
            let nearest = null;
            let nearestDist = 95;
            for (const cand of state.zombies) {
                if (cand.hp > 0 && !hitList.includes(cand)) {
                    const d = Math.hypot(cand.x - current.x, cand.y - current.y);
                    if (d < nearestDist) {
                        nearestDist = d;
                        nearest = cand;
                    }
                }
            }
            if (!nearest) break;
            hitList.push(nearest);
            current = nearest;
        }
        const pts = [{ x: tk.x, y: tk.y }, ...hitList.map(z => ({ x: z.x, y: z.y }))];
        state.particles.push({
            isLightning: true,
            points: pts,
            life: 0.16,
            maxLife: 0.16
        });
        hitList.forEach((z, idx) => {
            damageZombie(z, Math.round(stats.damage * Math.pow(0.82, idx)));
        });
        return;
    }

    if (stats.slow > 0) SoundFX.frost();
    else SoundFX.shoot();

    const ang = Math.atan2(target.y - tk.y, target.x - tk.x);
    state.projectiles.push({
        x: tk.x + Math.cos(ang) * 18,
        y: tk.y + Math.sin(ang) * 18,
        vx: Math.cos(ang) * stats.bulletSpeed,
        vy: Math.sin(ang) * stats.bulletSpeed,
        traveled: 0,
        maxDist: stats.range + 28,
        damage: stats.damage,
        radius: stats.splash > 0 ? 6.5 : 4.5,
        color: stats.bulletColor,
        splash: stats.splash,
        slow: stats.slow,
        burn: stats.burn
    });
}

// Expose globally and on window.Game namespace
window.getTankStats = getTankStats;
window.getUpgradeCost = getUpgradeCost;
window.getBuildingIncome = getBuildingIncome;
window.selectTargetForTank = selectTargetForTank;
window.fireTankAt = fireTankAt;

window.Game = window.Game || {};
window.Game.Models = window.Game.Models || {};
window.Game.Models.Tower = {
    getTankStats,
    getUpgradeCost,
    getBuildingIncome,
    selectTargetForTank,
    fireTankAt
};
