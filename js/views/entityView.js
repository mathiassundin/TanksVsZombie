/* ==========================================
 * Tanks Vs. Zombie - Entity View (Tanks, Buildings & Zombies)
 * View
 * ========================================== */

function drawTankEntity(c, tk, scale = 1, isGhost = false) {
    const def = TANK_DEFS.find(d => d.id === tk.id) || TANK_DEFS[0];
    const lvl = tk.level || 1;
    c.save();
    c.scale(scale, scale);
    if (isGhost) c.globalAlpha = 0.65;

    // Upgrade pulse flash
    if (tk.upgradeFlash > 0) {
        c.save();
        c.strokeStyle = `rgba(250, 204, 21, ${tk.upgradeFlash})`;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(0, 0, 24 + (1 - tk.upgradeFlash) * 16, 0, Math.PI * 2);
        c.stroke();
        c.restore();
    }

    // Veteran ring on higher levels
    if (lvl >= 3 && !isGhost) {
        c.strokeStyle = lvl >= 5 ? '#facc15' : '#94a3b8';
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, 23, 0, Math.PI * 2);
        c.stroke();
    }

    // Chassis & Tracks
    c.save();
    c.rotate(tk.angle || 0);

    // Tracks
    c.fillStyle = lvl >= 4 ? '#334155' : '#1e293b';
    c.strokeStyle = '#1c1917';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(-17, -18, 34, 7, 3);
    c.roundRect(-17, 11, 34, 7, 3);
    c.fill();
    c.stroke();

    // Main hull
    c.fillStyle = def.color;
    c.strokeStyle = lvl >= 4 ? '#facc15' : '#1c1917';
    c.lineWidth = lvl >= 4 ? 2.6 : 2.2;
    c.beginPath();
    c.roundRect(-15, -13, 30, 26, 6);
    c.fill();
    c.stroke();

    // Barrel(s)
    if (def.spike) {
        c.strokeStyle = def.barrelColor;
        c.lineWidth = 3;
        for (let a = 0; a < 8; a++) {
            const ang = (a * Math.PI) / 4;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(Math.cos(ang) * 19, Math.sin(ang) * 19);
            c.stroke();
        }
    } else {
        const barrelLen = 20 + Math.min(lvl, 5) * 1.4;
        const barrelW = def.id === 'cannon' ? 8 : def.id === 'sniper' ? 5 : 6;
        c.fillStyle = def.barrelColor;
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(4, -barrelW / 2, barrelLen, barrelW, 2);
        c.fill();
        c.stroke();

        if (lvl >= 2) {
            c.fillStyle = lvl >= 4 ? '#facc15' : '#94a3b8';
            c.fillRect(4 + barrelLen - 4, -barrelW / 2 - 1, 4, barrelW + 2);
        }
    }

    // Turret dome
    c.fillStyle = def.turretColor;
    c.strokeStyle = '#1c1917';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, 10 + (lvl >= 3 ? 1 : 0), 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.restore();

    // Level stars below tank
    if (!isGhost && lvl > 1) {
        c.font = '800 10px Nunito, sans-serif';
        c.textAlign = 'center';
        c.fillStyle = '#facc15';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2.5;
        const starsTxt = '★'.repeat(lvl);
        c.strokeText(starsTxt, 0, 26);
        c.fillText(starsTxt, 0, 26);
    }

    c.restore();
}

function drawBuildingEntity(c, b, scale = 1, isGhost = false) {
    const bDef = BUILDING_DEFS.find(d => d.id === b.id) || BUILDING_DEFS[0];
    const lvl = b.level || 1;
    c.save();
    c.scale(scale, scale);
    if (isGhost) c.globalAlpha = 0.65;

    c.fillStyle = bDef.color;
    c.strokeStyle = lvl >= 4 ? '#facc15' : '#1c1917';
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(-18, -18, 36, 36, 8);
    c.fill();
    c.stroke();

    c.font = '20px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const icon = b.id === 'mine' ? '⛏️' : b.id === 'radar' ? '📡' : '🔧';
    c.fillText(icon, 0, 1);

    if (!isGhost && lvl > 1) {
        c.font = '800 10px Nunito, sans-serif';
        c.fillStyle = '#facc15';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2.5;
        const starsTxt = '★'.repeat(lvl);
        c.strokeText(starsTxt, 0, 26);
        c.fillText(starsTxt, 0, 26);
    }

    c.restore();
}

function drawZombieEntity(c, z) {
    const isBoss = z.type === 'boss';
    const isGiant = z.type === 'giant';
    const r = z.radius;
    const swing = Math.sin(z.walkPhase || 0) * 3.5;

    c.save();
    c.translate(z.x, z.y);

    // Ground shadow
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.beginPath();
    c.ellipse(0, r * 0.72, r * 0.9, r * 0.42, 0, 0, Math.PI * 2);
    c.fill();

    // Frost-immune crystalline shield ring
    if (z.frostImmune) {
        c.save();
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2.2;
        c.setLineDash([4, 3]);
        c.beginPath();
        c.arc(0, 0, r + 5, 0, Math.PI * 2);
        c.stroke();
        c.restore();
    }

    // Body rotated toward movement direction
    c.save();
    c.rotate(z.angle || 0);

    // Outstretched zombie arms
    c.fillStyle = z.hitFlash > 0 ? '#ffffff' : z.color;
    c.strokeStyle = '#1c1917';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(r * 0.25, -r * 0.85 + swing * 0.4, r * 0.95, r * 0.34, 4);
    c.roundRect(r * 0.25, r * 0.5 - swing * 0.4, r * 0.95, r * 0.34, 4);
    c.fill();
    c.stroke();

    // Main head/torso circle
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Armor plates for armored/giant/boss
    if (z.type === 'armored' || isGiant || isBoss) {
        c.strokeStyle = isBoss ? '#facc15' : '#94a3b8';
        c.lineWidth = isBoss ? 3.5 : 2.5;
        c.beginPath();
        c.arc(0, 0, r * 0.72, Math.PI * 0.6, Math.PI * 1.4);
        c.stroke();
    }

    // Cartoon eyes
    const eyeX = r * 0.38;
    const eyeOffY = r * 0.34;
    const eyeR = Math.max(2.6, r * 0.22);
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(eyeX, -eyeOffY, eyeR, 0, Math.PI * 2);
    c.arc(eyeX, eyeOffY, eyeR, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#dc2626';
    c.beginPath();
    c.arc(eyeX + eyeR * 0.3, -eyeOffY, eyeR * 0.48, 0, Math.PI * 2);
    c.arc(eyeX + eyeR * 0.3, eyeOffY, eyeR * 0.48, 0, Math.PI * 2);
    c.fill();

    // Boss golden crown
    if (isBoss) {
        c.fillStyle = '#facc15';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-r * 0.5, -r * 0.4);
        c.lineTo(-r * 0.75, -r * 0.95);
        c.lineTo(-r * 0.2, -r * 0.65);
        c.lineTo(0, -r * 1.05);
        c.lineTo(r * 0.2, -r * 0.65);
        c.lineTo(r * 0.75, -r * 0.95);
        c.lineTo(r * 0.5, -r * 0.4);
        c.closePath();
        c.fill();
        c.stroke();
    }
    c.restore();

    // Slow / Burn status indicators
    if (z.slowTimer > 0) {
        c.strokeStyle = 'rgba(103, 232, 249, 0.85)';
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, r + 3, 0, Math.PI * 2);
        c.stroke();
    }
    if (z.burnTimer > 0) {
        c.font = '12px sans-serif';
        c.textAlign = 'center';
        c.fillText('🔥', 0, -r - 8);
    }

    // HP bar above damaged zombies (and always for bosses/giants)
    if (z.hp < z.maxHp || isBoss || isGiant) {
        const barW = Math.max(26, r * 2.1);
        const barH = isBoss ? 6 : 4;
        const yOff = -r - (z.burnTimer > 0 ? 18 : 9);
        const pct = Math.max(0, Math.min(1, z.hp / z.maxHp));

        c.fillStyle = '#1c1917';
        c.fillRect(-barW / 2 - 1, yOff - 1, barW + 2, barH + 2);
        c.fillStyle = isBoss ? '#f97316' : '#22c55e';
        c.fillRect(-barW / 2, yOff, barW * pct, barH);
    }

    c.restore();
}

// Expose globally and on window.Game namespace
window.drawTankEntity = drawTankEntity;
window.drawBuildingEntity = drawBuildingEntity;
window.drawZombieEntity = drawZombieEntity;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.Entity = {
    drawTankEntity,
    drawBuildingEntity,
    drawZombieEntity
};
