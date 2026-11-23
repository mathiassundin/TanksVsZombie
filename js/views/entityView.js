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

    // Level 5 glowing aura
    if (lvl >= 5 && !isGhost) {
        const glowAlpha = 0.18 + Math.sin(Date.now() * 0.004) * 0.08;
        c.save();
        c.fillStyle = `rgba(250, 204, 21, ${glowAlpha})`;
        c.beginPath();
        c.arc(0, 0, 30, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }

    // Veteran ring on higher levels
    if (lvl >= 3 && !isGhost) {
        c.strokeStyle = lvl >= 5 ? '#facc15' : lvl >= 4 ? '#f59e0b' : '#94a3b8';
        c.lineWidth = lvl >= 5 ? 3 : 2.5;
        if (lvl >= 5) c.setLineDash([]);
        c.beginPath();
        c.arc(0, 0, 23, 0, Math.PI * 2);
        c.stroke();
        if (lvl >= 5) c.setLineDash([]);
    }

    // Chassis & Tracks
    c.save();
    c.rotate(tk.angle || 0);

    // Track width grows with level
    const trackW = 34 + (lvl >= 3 ? 2 : 0) + (lvl >= 5 ? 2 : 0);
    const trackH = 7 + (lvl >= 4 ? 1 : 0);

    // Tracks
    c.fillStyle = lvl >= 4 ? '#334155' : '#1e293b';
    c.strokeStyle = '#1c1917';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(-trackW / 2, -18, trackW, trackH, 3);
    c.roundRect(-trackW / 2, 11, trackW, trackH, 3);
    c.fill();
    c.stroke();

    // Track treads detail for level 3+
    if (lvl >= 3) {
        c.strokeStyle = 'rgba(255,255,255,0.15)';
        c.lineWidth = 1;
        const treadCount = 5 + lvl;
        for (let i = 0; i < treadCount; i++) {
            const tx = -trackW / 2 + 3 + i * ((trackW - 6) / (treadCount - 1));
            c.beginPath();
            c.moveTo(tx, -18);
            c.lineTo(tx, -18 + trackH);
            c.stroke();
            c.beginPath();
            c.moveTo(tx, 11);
            c.lineTo(tx, 11 + trackH);
            c.stroke();
        }
    }

    // Main hull - grows slightly with level
    const hullW = 30 + (lvl >= 2 ? 1 : 0) + (lvl >= 4 ? 1 : 0);
    const hullH = 26 + (lvl >= 3 ? 1 : 0) + (lvl >= 5 ? 1 : 0);
    c.fillStyle = def.color;
    c.strokeStyle = lvl >= 4 ? '#facc15' : '#1c1917';
    c.lineWidth = lvl >= 4 ? 2.6 : 2.2;
    c.beginPath();
    c.roundRect(-hullW / 2, -hullH / 2, hullW, hullH, 6);
    c.fill();
    c.stroke();

    // Armor plates for level 3+
    if (lvl >= 3) {
        c.fillStyle = 'rgba(0,0,0,0.12)';
        c.beginPath();
        c.roundRect(-hullW / 2 + 2, -hullH / 2 + 2, hullW - 4, 5, 2);
        c.roundRect(-hullW / 2 + 2, hullH / 2 - 7, hullW - 4, 5, 2);
        c.fill();
    }

    // Extra side armor for level 4+
    if (lvl >= 4) {
        c.fillStyle = 'rgba(0,0,0,0.18)';
        c.strokeStyle = lvl >= 5 ? '#facc15' : '#94a3b8';
        c.lineWidth = 1.5;
        // Side armor plates
        c.beginPath();
        c.roundRect(-hullW / 2 - 2, -8, 4, 16, 1);
        c.fill();
        c.stroke();
        c.beginPath();
        c.roundRect(hullW / 2 - 2, -8, 4, 16, 1);
        c.fill();
        c.stroke();
    }

    // Barrel(s)
    if (def.spike) {
        const spikeLen = 19 + lvl * 1.5;
        c.strokeStyle = def.barrelColor;
        c.lineWidth = 3 + (lvl >= 3 ? 0.5 : 0) + (lvl >= 5 ? 0.5 : 0);
        for (let a = 0; a < 8; a++) {
            const ang = (a * Math.PI) / 4;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(Math.cos(ang) * spikeLen, Math.sin(ang) * spikeLen);
            c.stroke();
        }
        // Level 4+: add spike tips
        if (lvl >= 4) {
            c.fillStyle = lvl >= 5 ? '#facc15' : '#e2e8f0';
            for (let a = 0; a < 8; a++) {
                const ang = (a * Math.PI) / 4;
                c.beginPath();
                c.arc(Math.cos(ang) * spikeLen, Math.sin(ang) * spikeLen, 2.5, 0, Math.PI * 2);
                c.fill();
            }
        }
    } else {
        const barrelLen = 20 + Math.min(lvl, 5) * 2;
        const barrelW = def.id === 'cannon' ? 8 : def.id === 'sniper' ? 5 : 6;
        const barrelWFinal = barrelW + (lvl >= 3 ? 1 : 0) + (lvl >= 5 ? 1 : 0);

        // Dual barrels for level 4+ cannon & rapid
        if (lvl >= 4 && (def.id === 'cannon' || def.id === 'rapid')) {
            const gap = barrelWFinal * 0.7;
            c.fillStyle = def.barrelColor;
            c.strokeStyle = '#1c1917';
            c.lineWidth = 1.8;
            c.beginPath();
            c.roundRect(4, -gap - barrelWFinal / 2, barrelLen, barrelWFinal * 0.7, 2);
            c.fill();
            c.stroke();
            c.beginPath();
            c.roundRect(4, gap - barrelWFinal * 0.7 / 2, barrelLen, barrelWFinal * 0.7, 2);
            c.fill();
            c.stroke();
        } else {
            c.fillStyle = def.barrelColor;
            c.strokeStyle = '#1c1917';
            c.lineWidth = 2;
            c.beginPath();
            c.roundRect(4, -barrelWFinal / 2, barrelLen, barrelWFinal, 2);
            c.fill();
            c.stroke();
        }

        // Barrel tip decoration for level 2+
        if (lvl >= 2) {
            c.fillStyle = lvl >= 5 ? '#facc15' : lvl >= 4 ? '#f59e0b' : '#94a3b8';
            if (lvl >= 4 && (def.id === 'cannon' || def.id === 'rapid')) {
                const gap = barrelWFinal * 0.7;
                c.fillRect(4 + barrelLen - 5, -gap - barrelWFinal / 2 - 1, 5, barrelWFinal * 0.7 + 2);
                c.fillRect(4 + barrelLen - 5, gap - barrelWFinal * 0.7 / 2 - 1, 5, barrelWFinal * 0.7 + 2);
            } else {
                c.fillRect(4 + barrelLen - 5, -barrelWFinal / 2 - 1, 5, barrelWFinal + 2);
            }
        }

        // Muzzle glow for level 5
        if (lvl >= 5 && !isGhost) {
            const muzzleX = 4 + barrelLen;
            c.save();
            const glowR = 4 + Math.sin(Date.now() * 0.006) * 1.5;
            const grad = c.createRadialGradient(muzzleX, 0, 0, muzzleX, 0, glowR * 2);
            grad.addColorStop(0, 'rgba(250, 204, 21, 0.7)');
            grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
            c.fillStyle = grad;
            c.beginPath();
            c.arc(muzzleX, 0, glowR * 2, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    }

    // Turret dome - grows with level
    const turretR = 10 + (lvl >= 2 ? 0.5 : 0) + (lvl >= 3 ? 0.5 : 0) + (lvl >= 5 ? 1 : 0);
    c.fillStyle = def.turretColor;
    c.strokeStyle = lvl >= 4 ? '#facc15' : '#1c1917';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, turretR, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Inner turret ring for level 3+
    if (lvl >= 3) {
        c.strokeStyle = 'rgba(255,255,255,0.3)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(0, 0, turretR * 0.6, 0, Math.PI * 2);
        c.stroke();
    }

    // Level 4+ antenna/sensor on turret
    if (lvl >= 4 && !isGhost) {
        c.strokeStyle = '#94a3b8';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-3, -turretR + 1);
        c.lineTo(-5, -turretR - 7);
        c.stroke();
        c.fillStyle = lvl >= 5 ? '#facc15' : '#ef4444';
        c.beginPath();
        c.arc(-5, -turretR - 7, 2, 0, Math.PI * 2);
        c.fill();
    }

    // Level 5 turret hatch detail
    if (lvl >= 5) {
        c.fillStyle = 'rgba(0,0,0,0.2)';
        c.beginPath();
        c.arc(0, 0, turretR * 0.35, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#facc15';
        c.beginPath();
        c.arc(0, 0, 2, 0, Math.PI * 2);
        c.fill();
    }

    // Exhaust pipes for level 3+
    if (lvl >= 3) {
        c.fillStyle = '#475569';
        c.strokeStyle = '#1c1917';
        c.lineWidth = 1.5;
        const exW = lvl >= 5 ? 5 : 4;
        const exH = lvl >= 5 ? 7 : 5;
        c.beginPath();
        c.roundRect(-hullW / 2 - exW + 1, -4, exW, exH, 1);
        c.fill();
        c.stroke();
        if (lvl >= 4) {
            c.beginPath();
            c.roundRect(-hullW / 2 - exW + 1, 0, exW, exH, 1);
            c.fill();
            c.stroke();
        }
    }

    c.restore();

    // Level chevrons/stars below tank
    if (!isGhost && lvl > 1) {
        c.font = '800 10px Nunito, sans-serif';
        c.textAlign = 'center';
        c.fillStyle = lvl >= 5 ? '#facc15' : lvl >= 4 ? '#f59e0b' : '#94a3b8';
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
    const isArmored = z.type === 'armored';
    const isFast = z.type === 'fast';
    const r = z.radius;
    const swing = Math.sin(z.walkPhase || 0) * 3.5;
    const walkCycle = z.walkPhase || 0;

    c.save();
    c.translate(z.x, z.y);

    // Ground shadow
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.beginPath();
    c.ellipse(0, r * 0.72, r * 0.9, r * 0.42, 0, 0, Math.PI * 2);
    c.fill();

    // Boss: ground cracks effect
    if (isBoss) {
        c.strokeStyle = 'rgba(127, 29, 29, 0.35)';
        c.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const ang = (i * Math.PI * 2) / 5 + 0.3;
            c.beginPath();
            c.moveTo(Math.cos(ang) * r * 0.6, Math.sin(ang) * r * 0.6 + r * 0.5);
            c.lineTo(Math.cos(ang) * r * 1.6, Math.sin(ang) * r * 0.6 + r * 0.7);
            c.stroke();
        }
    }

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

    const bodyColor = z.hitFlash > 0 ? '#ffffff' : z.color;

    // === LEGS (behind body) ===
    const legLen = r * 0.65;
    const legW = r * 0.22;
    const legSwing = Math.sin(walkCycle) * 0.35;
    const legSwing2 = Math.sin(walkCycle + Math.PI) * 0.35;
    c.fillStyle = bodyColor;
    c.strokeStyle = '#1c1917';
    c.lineWidth = 1.5;
    // Left leg
    c.save();
    c.translate(-r * 0.25, r * 0.4);
    c.rotate(legSwing);
    c.beginPath();
    c.roundRect(-legW / 2, 0, legW, legLen, 3);
    c.fill();
    c.stroke();
    // Foot
    c.fillStyle = isArmored ? '#374151' : isBoss ? '#451a03' : '#1e3a1e';
    c.beginPath();
    c.roundRect(-legW / 2 - 1, legLen - 3, legW + 3, 5, 2);
    c.fill();
    c.stroke();
    c.restore();
    // Right leg
    c.fillStyle = bodyColor;
    c.save();
    c.translate(r * 0.25, r * 0.4);
    c.rotate(legSwing2);
    c.beginPath();
    c.roundRect(-legW / 2, 0, legW, legLen, 3);
    c.fill();
    c.stroke();
    c.fillStyle = isArmored ? '#374151' : isBoss ? '#451a03' : '#1e3a1e';
    c.beginPath();
    c.roundRect(-legW / 2 - 1, legLen - 3, legW + 3, 5, 2);
    c.fill();
    c.stroke();
    c.restore();

    // === OUTSTRETCHED ZOMBIE ARMS ===
    c.fillStyle = bodyColor;
    c.strokeStyle = '#1c1917';
    c.lineWidth = 1.8;

    // Right arm (top)
    c.save();
    c.translate(r * 0.3, -r * 0.55);
    c.rotate(swing * 0.04 - 0.15);
    c.beginPath();
    c.roundRect(0, -r * 0.14, r * 0.95, r * 0.28, 4);
    c.fill();
    c.stroke();
    // Hand/claw
    c.fillStyle = isArmored ? '#374151' : isBoss ? '#451a03' : bodyColor;
    c.beginPath();
    c.arc(r * 0.95, 0, r * 0.16, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    // Claw fingers
    c.strokeStyle = isBoss ? '#facc15' : '#1c1917';
    c.lineWidth = 1.2;
    for (let f = -1; f <= 1; f++) {
        c.beginPath();
        c.moveTo(r * 0.95, f * r * 0.08);
        c.lineTo(r * 1.12, f * r * 0.14);
        c.stroke();
    }
    c.restore();

    // Left arm (bottom)
    c.fillStyle = bodyColor;
    c.strokeStyle = '#1c1917';
    c.lineWidth = 1.8;
    c.save();
    c.translate(r * 0.3, r * 0.55);
    c.rotate(-swing * 0.04 + 0.15);
    c.beginPath();
    c.roundRect(0, -r * 0.14, r * 0.95, r * 0.28, 4);
    c.fill();
    c.stroke();
    c.fillStyle = isArmored ? '#374151' : isBoss ? '#451a03' : bodyColor;
    c.beginPath();
    c.arc(r * 0.95, 0, r * 0.16, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.strokeStyle = isBoss ? '#facc15' : '#1c1917';
    c.lineWidth = 1.2;
    for (let f = -1; f <= 1; f++) {
        c.beginPath();
        c.moveTo(r * 0.95, f * r * 0.08);
        c.lineTo(r * 1.12, f * r * 0.14);
        c.stroke();
    }
    c.restore();

    // === MAIN HEAD/TORSO ===
    // Torso (slight oval)
    c.fillStyle = bodyColor;
    c.strokeStyle = '#1c1917';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(0, r * 0.1, r * 0.85, r * 0.95, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Torn clothing / rags
    if (!isBoss) {
        c.strokeStyle = isArmored ? 'rgba(148,163,184,0.4)' : isFast ? 'rgba(202,138,4,0.3)' : 'rgba(0,0,0,0.15)';
        c.lineWidth = 1;
        // Ragged lines across chest
        c.beginPath();
        c.moveTo(-r * 0.5, -r * 0.1);
        c.quadraticCurveTo(-r * 0.1, -r * 0.2, r * 0.3, 0);
        c.stroke();
        c.beginPath();
        c.moveTo(-r * 0.4, r * 0.2);
        c.quadraticCurveTo(0, r * 0.35, r * 0.4, r * 0.15);
        c.stroke();
    }

    // Giant: muscle lines
    if (isGiant) {
        c.strokeStyle = 'rgba(88, 28, 135, 0.5)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(-r * 0.3, -r * 0.1, r * 0.3, 0.5, 2.0);
        c.stroke();
        c.beginPath();
        c.arc(r * 0.3, -r * 0.1, r * 0.3, 1.1, 2.6);
        c.stroke();
    }

    // Armor plates for armored/giant/boss
    if (isArmored || isGiant || isBoss) {
        // Front armor plate
        c.fillStyle = isArmored ? 'rgba(100,116,139,0.6)' : isBoss ? 'rgba(250,204,21,0.25)' : 'rgba(88,28,135,0.3)';
        c.strokeStyle = isBoss ? '#facc15' : '#94a3b8';
        c.lineWidth = isBoss ? 3 : 2;
        c.beginPath();
        c.arc(0, 0, r * 0.72, Math.PI * 0.6, Math.PI * 1.4);
        c.stroke();

        // Extra shoulder pads for armored
        if (isArmored) {
            c.fillStyle = 'rgba(71,85,105,0.7)';
            c.strokeStyle = '#475569';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(0, -r * 0.65, r * 0.35, Math.PI * 0.1, Math.PI * 0.9);
            c.fill();
            c.stroke();
            c.beginPath();
            c.arc(0, r * 0.65, r * 0.35, Math.PI * 1.1, Math.PI * 1.9);
            c.fill();
            c.stroke();
        }

        // Boss: extra ornamental plates
        if (isBoss) {
            c.strokeStyle = '#facc15';
            c.lineWidth = 2;
            c.beginPath();
            c.arc(0, 0, r * 0.5, Math.PI * 0.7, Math.PI * 1.3);
            c.stroke();
        }
    }

    // === FACE DETAILS ===
    // Cartoon eyes
    const eyeX = r * 0.38;
    const eyeOffY = r * 0.3;
    const eyeR = Math.max(2.6, r * 0.24);

    // Eye whites (yellowish)
    c.fillStyle = isBoss ? '#fef9c3' : '#fef08a';
    c.strokeStyle = '#1c1917';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(eyeX, -eyeOffY, eyeR * 1.1, eyeR, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(eyeX, eyeOffY, eyeR * 1.1, eyeR, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Pupils (red, with boss glow)
    c.fillStyle = isBoss ? '#ff0000' : '#dc2626';
    c.beginPath();
    c.arc(eyeX + eyeR * 0.3, -eyeOffY, eyeR * 0.48, 0, Math.PI * 2);
    c.arc(eyeX + eyeR * 0.3, eyeOffY, eyeR * 0.48, 0, Math.PI * 2);
    c.fill();

    // Boss: glowing eye effect
    if (isBoss && !z.hitFlash) {
        c.save();
        const eyeGlow = 0.3 + Math.sin(Date.now() * 0.005) * 0.15;
        c.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
        c.beginPath();
        c.arc(eyeX + eyeR * 0.3, -eyeOffY, eyeR * 1.2, 0, Math.PI * 2);
        c.arc(eyeX + eyeR * 0.3, eyeOffY, eyeR * 1.2, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }

    // Mouth / snarl
    c.strokeStyle = '#1c1917';
    c.lineWidth = 1.5;
    c.beginPath();
    if (isBoss || isGiant) {
        // Wide snarling mouth
        c.moveTo(r * 0.55, -r * 0.15);
        c.quadraticCurveTo(r * 0.75, 0, r * 0.55, r * 0.15);
        c.stroke();
        // Teeth
        c.fillStyle = '#fef9c3';
        const teeth = isBoss ? 4 : 3;
        for (let t = 0; t < teeth; t++) {
            const ty = -r * 0.12 + t * (r * 0.24 / (teeth - 1));
            c.beginPath();
            c.moveTo(r * 0.58, ty - 2);
            c.lineTo(r * 0.68, ty);
            c.lineTo(r * 0.58, ty + 2);
            c.closePath();
            c.fill();
            c.stroke();
        }
    } else {
        // Simple open mouth
        c.moveTo(r * 0.45, -r * 0.08);
        c.quadraticCurveTo(r * 0.6, 0, r * 0.45, r * 0.08);
        c.stroke();
    }

    // Drool/blood drip for normal and fast
    if (!isArmored && !isBoss && !isGiant) {
        const dripPhase = (walkCycle * 0.5) % (Math.PI * 2);
        const dripLen = 3 + Math.sin(dripPhase) * 2;
        c.strokeStyle = isFast ? 'rgba(202,138,4,0.5)' : 'rgba(34,197,94,0.5)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(r * 0.5, r * 0.06);
        c.lineTo(r * 0.5 + 1, r * 0.06 + dripLen);
        c.stroke();
    }

    // Fast zombie: speed lines
    if (isFast) {
        c.strokeStyle = 'rgba(202,138,4,0.35)';
        c.lineWidth = 1;
        for (let sl = 0; sl < 3; sl++) {
            const sy = -r * 0.6 + sl * r * 0.6;
            c.beginPath();
            c.moveTo(-r * 0.8, sy);
            c.lineTo(-r * 1.4, sy + (Math.random() - 0.5) * 4);
            c.stroke();
        }
    }

    // Wound/scratch marks
    if (z.hp < z.maxHp * 0.5) {
        c.strokeStyle = 'rgba(220, 38, 38, 0.5)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(-r * 0.3, -r * 0.4);
        c.lineTo(r * 0.1, r * 0.1);
        c.stroke();
        c.beginPath();
        c.moveTo(-r * 0.1, -r * 0.2);
        c.lineTo(r * 0.2, r * 0.3);
        c.stroke();
    }

    // Boss golden crown
    if (isBoss) {
        c.fillStyle = '#facc15';
        c.strokeStyle = '#92400e';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-r * 0.55, -r * 0.45);
        c.lineTo(-r * 0.8, -r * 1.05);
        c.lineTo(-r * 0.25, -r * 0.7);
        c.lineTo(0, -r * 1.15);
        c.lineTo(r * 0.25, -r * 0.7);
        c.lineTo(r * 0.8, -r * 1.05);
        c.lineTo(r * 0.55, -r * 0.45);
        c.closePath();
        c.fill();
        c.stroke();
        // Crown jewels
        c.fillStyle = '#dc2626';
        c.beginPath();
        c.arc(0, -r * 0.85, 2.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#2563eb';
        c.beginPath();
        c.arc(-r * 0.35, -r * 0.65, 2, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(r * 0.35, -r * 0.65, 2, 0, Math.PI * 2);
        c.fill();
    }

    // Boss cape
    if (isBoss) {
        c.fillStyle = 'rgba(127, 29, 29, 0.6)';
        c.strokeStyle = 'rgba(127, 29, 29, 0.8)';
        c.lineWidth = 1.5;
        const capeSwing = Math.sin(walkCycle * 0.7) * 3;
        c.beginPath();
        c.moveTo(-r * 0.6, -r * 0.3);
        c.quadraticCurveTo(-r * 1.2 + capeSwing, 0, -r * 0.9 + capeSwing, r * 0.6);
        c.lineTo(-r * 0.4, r * 0.3);
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
