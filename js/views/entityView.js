/* ==========================================
 * Tanks Vs. Zombie - Entity View (Tanks, Buildings & Zombies)
 * View - pixel art sprites
 * ========================================== */

const EntitySprites = (function () {
    const P = PixelArt;
    const { rect, circle, ellipse, seg, rotated, shade, hash } = P;

    // ---------- Tanks ----------
    function tankShapes(def, level) {
        const L = Math.min(level || 1, 5);
        const S = [];
        const hullC = def.color;
        const track = L >= 4 ? '#3b4252' : '#272c38';
        const trackLight = shade(track, 0.4);
        const tread = u => ((Math.floor(u / 2) & 1) ? track : trackLight);

        // Tracks
        S.push(rect(-10, -10, 20, 4, tread, 1.2));
        S.push(rect(-10, 6, 20, 4, tread, 1.2));

        // Hull with panel seam, engine grille, weathering and (veteran) gold trim
        const hull = (u, v) => {
            if (L >= 4 && Math.abs(v) > 5.4) return '#facc15';
            if (Math.abs(u + 4) < 0.5) return shade(hullC, -0.2);
            if (u < -6.5 && (Math.floor(v) & 1)) return shade(hullC, -0.38);
            if (hash(Math.floor(u + 20), Math.floor(v + 20), 4) < 0.06) return shade(hullC, -0.12);
            return hullC;
        };
        S.push(rect(-9, -6.5, 18, 13, hull, 2));
        S.push(rect(5.5, -5, 3, 10, shade(hullC, 0.14), 1));

        if (def.id === 'flame') S.push(circle(-6.2, 0, 2.3, '#c2410c'));

        // Barrel(s)
        if (def.spike) {
            for (let a = 0; a < 8; a++) {
                const ang = (a * Math.PI) / 4;
                const cx = Math.cos(ang);
                const cy = Math.sin(ang);
                S.push(seg(cx * 3, cy * 3, cx * 10.5, cy * 10.5, 0.85, def.barrelColor));
                S.push(circle(cx * 10.5, cy * 10.5, 1.1, '#e2e8f0'));
            }
        } else {
            const len = 10 + L * 0.9;
            const muzzle = L >= 4 ? '#facc15' : L >= 2 ? '#cbd5e1' : shade(def.barrelColor, 0.2);
            const barrelFn = centre => (u, v) => {
                if (u > 2 + len - 2) return muzzle;
                return Math.abs(v - centre) < 0.6 ? shade(def.barrelColor, 0.28) : def.barrelColor;
            };
            if (def.id === 'rapid') {
                S.push(rect(2, -2.7, len, 1.9, barrelFn(-1.75)));
                S.push(rect(2, 0.8, len, 1.9, barrelFn(1.75)));
            } else {
                const w = def.id === 'cannon' ? 4.6 : def.id === 'sniper' ? 2.2 : def.id === 'flame' ? 3.6 : def.id === 'tesla' ? 2.6 : 3;
                S.push(rect(2, -w / 2, len, w, barrelFn(0)));
                if (def.id === 'cannon' || def.id === 'flame') {
                    S.push(rect(2 + len - 2.5, -w / 2 - 1, 2.5, w + 2, muzzle));
                }
            }
        }

        // Turret
        const tr = L >= 3 ? 6 : 5.5;
        const turretC = def.turretColor;
        S.push(circle(0, 0, tr, (u, v) => (u + v < -tr * 0.9 ? shade(turretC, 0.25) : turretC)));
        S.push(circle(-1.8, 0, 1.7, shade(turretC, -0.32)));

        if (def.id === 'tesla') {
            S.push(circle(0.6, 0, 3.4, '#4c1d95'));
            S.push(circle(0.6, 0, 2.1, '#fef08a', { flat: true }));
        } else if (def.id === 'frost') {
            S.push(circle(1, 0, 1.7, '#e0f2fe', { flat: true }));
        } else if (def.id === 'sniper') {
            S.push(rect(0, -4.8, 6.5, 1.7, '#0f172a'));
            S.push(rect(5.5, -4.8, 1, 1.7, '#7dd3fc', 0, { flat: true }));
        }
        return S;
    }

    // Scale a shape around the sprite centre (used to fit tanks in their footprint)
    function scaled(shape, k) {
        if (k === 1) return shape;
        return {
            ...shape,
            test: (u, v) => shape.test(u / k, v / k),
            color: typeof shape.color === 'function' ? (u, v) => shape.color(u / k, v / k) : shape.color
        };
    }

    function tankSprite(id, level, angle, scale = 1) {
        const L = Math.min(level || 1, 5);
        const idx = P.angleIndex(angle);
        return P.cached(`tank|${id}|${L}|${idx}|${scale}`, () => {
            const def = TANK_DEFS.find(d => d.id === id) || TANK_DEFS[0];
            const size = 2 * Math.ceil(22 * scale);
            return P.rasterize(tankShapes(def, L).map(sh => scaled(sh, scale)), size, P.angleFromIndex(idx));
        });
    }

    // ---------- Buildings ----------
    function crate(x0, y0, s) {
        return (u, v) => {
            const a = u - x0;
            const b = v - y0;
            if (Math.abs(a - b) < 0.6 || Math.abs(a + b - s) < 0.6) return '#78350f';
            return (Math.floor(b / 2) & 1) ? '#b45309' : '#c2410c';
        };
    }

    function buildingShapes(id, color, frame) {
        const S = [];
        if (id === 'mine') {
            S.push(rect(-9.5, -9.5, 19, 19, (u, v) => {
                const h = hash(Math.floor(u + 40), Math.floor(v + 40), 11);
                return h < 0.08 ? '#5b4030' : h < 0.14 ? '#9a7a55' : '#7c5a3a';
            }, 2.5));
            S.push(ellipse(0, -1.5, 7.5, 6, (u, v) => (hash(Math.floor(u + 40), Math.floor(v + 40), 12) < 0.12 ? '#6b4f33' : '#8b6b4a')));
            S.push(ellipse(0, 0, 3.6, 3.2, '#16100c', { flat: true }));
            S.push(rect(-5, -4.2, 10, 1.6, '#a16207'));
            S.push(rect(-5, -4.2, 1.6, 7.5, '#a16207'));
            S.push(rect(3.4, -4.2, 1.6, 7.5, '#a16207'));
            S.push(rect(-3, 4.5, 6, 0.9, '#78350f'));
            S.push(rect(-3, 7, 6, 0.9, '#78350f'));
            S.push(rect(-2, 3, 1, 6.5, '#9ca3af'));
            S.push(rect(1, 3, 1, 6.5, '#9ca3af'));
            S.push(rect(-2.5, 4.6, 5, 3, '#57534e', 0.5));
            S.push(rect(-2, 4.6, 4, 1.2, color, 0, { flat: true }));
            S.push(circle(-6.5, 4.5, 1.2, '#facc15'));
            S.push(circle(6.5, -6, 1, '#fde047'));
            S.push(circle(6, 5.5, 1.3, '#facc15'));
        } else if (id === 'radar') {
            S.push(rect(-9, -9, 18, 18, (u, v) => ((Math.floor(u + 20) % 4 === 0 || Math.floor(v + 20) % 4 === 0) ? '#3f4a5a' : '#556274'), 2));
            S.push(rect(-9, 6.5, 18, 2.5, u => ((Math.floor(u + 20) & 2) ? color : '#facc15')));
            S.push(circle(0, 0, 2.8, '#334155'));
            const ang = (frame / 16) * Math.PI * 2;
            S.push(rotated(ellipse(1.5, 0, 2.6, 7.2, '#e2e8f0'), ang));
            S.push(rotated(ellipse(2.4, 0, 1.6, 5.6, '#cbd5e1'), ang));
            S.push(rotated(seg(1.5, 0, 6.5, 0, 0.55, '#94a3b8'), ang));
            S.push(rotated(circle(6.5, 0, 0.9, '#ef4444', { flat: true }), ang));
        } else {
            S.push(rect(-9.5, -9.5, 19, 19, (u, v) => (hash(Math.floor(u + 40), Math.floor(v + 40), 13) < 0.07 ? '#57534e' : '#78716c'), 2));
            S.push(rect(-9.5, -9.5, 19, 7.5, u => ((Math.floor(u + 20) & 1) ? color : shade(color, -0.15)), 1.5));
            S.push(seg(-4, -6, 3.5, -6, 0.7, '#e5e7eb'));
            S.push(circle(-4.5, -6, 1.6, '#e5e7eb'));
            S.push(circle(4, -6, 1.2, '#e5e7eb'));
            S.push(rect(-8, 0, 6.5, 6.5, crate(-8, 0, 6.5)));
            S.push(rect(-1, 1.5, 5.5, 5.5, crate(-1, 1.5, 5.5)));
            S.push(circle(6, 4, 2.4, '#dc2626'));
            S.push(circle(6, 4, 1.1, '#991b1b'));
        }
        return S;
    }

    function buildingSprite(id, frame = 0) {
        const f = id === 'radar' ? frame % 16 : 0;
        return P.cached(`bld|${id}|${f}`, () => {
            const bDef = BUILDING_DEFS.find(d => d.id === id) || BUILDING_DEFS[0];
            return P.rasterize(buildingShapes(id, bDef.color, f), 26);
        });
    }

    // ---------- Zombies ----------
    function zombieShapes(type, color, r, frame, frost) {
        const S = [];
        const boss = type === 'boss';
        const giant = type === 'giant';
        const armored = type === 'armored';
        const skin = boss ? '#8a9a5b' : giant ? '#7d9b63' : '#93b874';
        const skinDark = shade(skin, -0.28);
        const swing = [0, 1, 0, -1][frame] * Math.max(0.8, r * 0.16);
        const armW = Math.max(2, r * (giant || boss ? 0.42 : 0.32));
        const armLen = r * 1.05;
        const shoe = '#3b3631';

        if (boss) S.push(ellipse(-r * 0.3, 0, r * 0.8, r * 1.08, (u, v) => ((Math.floor(u + v + 100) & 3) === 0 ? '#5b0f0f' : '#450a0a')));

        const footRx = Math.max(1.2, r * 0.3);
        const footRy = Math.max(1, r * 0.22);
        S.push(ellipse(-r * 0.55 - swing * 0.8, -r * 0.36, footRx, footRy, shoe));
        S.push(ellipse(-r * 0.55 + swing * 0.8, r * 0.36, footRx, footRy, shoe));

        const sleeve = u => (u < r * 0.55 ? shade(color, -0.06) : skin);
        const armY1 = -r * 0.72 + swing * 0.5;
        const armY2 = r * 0.72 - swing * 0.5;
        S.push(rect(r * 0.05, armY1 - armW / 2, armLen, armW, sleeve, armW * 0.45));
        S.push(rect(r * 0.05, armY2 - armW / 2, armLen, armW, sleeve, armW * 0.45));
        S.push(circle(r * 0.05 + armLen, armY1, armW * 0.62, skinDark));
        S.push(circle(r * 0.05 + armLen, armY2, armW * 0.62, skinDark));

        // Torn, stained clothes; frost-immune zombies are crusted with ice
        const body = (u, v) => {
            const h = hash(Math.floor(u + 50), Math.floor(v + 50), 7);
            if (frost && h < 0.16) return h < 0.06 ? '#f0f9ff' : '#bae6fd';
            if (h < 0.05) return '#7f1d1d';
            if (h < 0.11) return skin;
            if (h < 0.2) return shade(color, -0.18);
            return color;
        };
        S.push(ellipse(0, 0, r * 0.8, r, body));

        if (armored) {
            S.push(ellipse(-r * 0.05, -r * 0.68, r * 0.42, r * 0.3, '#64748b'));
            S.push(ellipse(-r * 0.05, r * 0.68, r * 0.42, r * 0.3, '#64748b'));
        }

        const hx = r * 0.2;
        const hr = r * 0.52;
        const head = (u, v) => {
            const h = hash(Math.floor(u + 50), Math.floor(v + 50), 3);
            if (u < hx - hr * 0.2 && h > 0.45) return '#3f3a2a';
            if (h < 0.1) return skinDark;
            return skin;
        };
        if (boss) {
            const crown = (u, v) => ((Math.floor(((Math.atan2(v, u - hx) + Math.PI) / (Math.PI * 2)) * 10) & 1) ? '#facc15' : '#f59e0b');
            S.push(circle(hx, 0, hr + 0.8, crown));
            S.push(circle(hx, 0, hr * 0.68, head));
        } else if (armored) {
            S.push(circle(hx, 0, hr, (u, v) => {
                if (Math.abs(v) < 0.6) return '#cbd5e1';
                return hash(Math.floor(u + 50), Math.floor(v + 50), 5) < 0.07 ? '#475569' : '#94a3b8';
            }));
        } else {
            S.push(circle(hx, 0, hr, head));
        }

        const eyeC = boss ? '#ef4444' : frost ? '#67e8f9' : '#fde047';
        const er = Math.max(0.78, r * 0.11);
        S.push(circle(hx + hr * 0.55, -hr * 0.42, er, eyeC, { flat: true }));
        S.push(circle(hx + hr * 0.55, hr * 0.42, er, eyeC, { flat: true }));
        return S;
    }

    function zombieSprite(z, flash) {
        const r = z.radius / P.PX;
        const frame = ((Math.floor((z.walkPhase || 0) / (Math.PI / 2)) % 4) + 4) % 4;
        const idx = P.angleIndex(z.angle);
        const key = `z|${z.type}|${z.color}|${z.radius}|${z.frostImmune ? 1 : 0}|${frame}|${idx}|${flash ? 1 : 0}`;
        return P.cached(key, () => {
            const size = 2 * Math.ceil(r * 1.6) + 4;
            return P.rasterize(zombieShapes(z.type, z.color, r, frame, z.frostImmune), size, P.angleFromIndex(idx), { flash });
        });
    }

    return { tankSprite, buildingSprite, zombieSprite, tankShapes };
})();

// ---------- Drawing in the game world (art space) ----------

// Tanks are drawn smaller than in the shop so they always fit inside their
// footprint, even when rotated with the barrel pointing at a corner.
const TANK_WORLD_SCALE = 0.72;

function drawTankWorld(c, tk, isGhost = false) {
    const P = PixelArt;
    const x = P.ax(tk.x);
    const y = P.ax(tk.y);
    const lvl = tk.level || 1;

    if (tk.upgradeFlash > 0) {
        P.ring(c, x, y, 12 + (1 - tk.upgradeFlash) * 8, `rgba(250, 204, 21, ${tk.upgradeFlash})`);
    }
    P.blit(c, EntitySprites.tankSprite(tk.id, lvl, tk.angle || 0, TANK_WORLD_SCALE), x, y, { alpha: isGhost ? 0.65 : 1 });

    if (!isGhost && lvl > 1) P.stars(c, x, y + 9, lvl);
}

function drawBuildingWorld(c, b, timeSec, isGhost = false) {
    const P = PixelArt;
    const x = P.ax(b.x);
    const y = P.ax(b.y);
    const frame = Math.floor((timeSec || 0) * 6);
    const lvl = b.level || 1;
    P.blit(c, EntitySprites.buildingSprite(b.id, frame), x, y, { alpha: isGhost ? 0.65 : 1 });
    if (!isGhost && lvl > 1) P.stars(c, x, y + 9, lvl);
}

function drawZombieWorld(c, z, timeSec) {
    const P = PixelArt;
    const x = P.ax(z.x);
    const y = P.ax(z.y);
    const r = z.radius / P.PX;
    const isBoss = z.type === 'boss';
    const isGiant = z.type === 'giant';

    P.fillEllipse(c, x, y + r * 0.72, r * 0.9, r * 0.42, 'rgba(0,0,0,0.28)');
    if (z.frostImmune) P.ring(c, x, y, r + 3, '#38bdf8', 2, (timeSec || 0) * 2);

    P.blit(c, EntitySprites.zombieSprite(z, z.hitFlash > 0), x, y, { shadow: false });

    if (z.slowTimer > 0) P.ring(c, x, y, r + 2, 'rgba(103, 232, 249, 0.85)');

    if (z.burnTimer > 0) {
        const fx = x;
        const fy = Math.round(y - r - 5);
        const flick = Math.floor((timeSec || 0) * 10) & 1;
        c.fillStyle = '#dc2626';
        c.fillRect(fx - 2, fy, 5, 3);
        c.fillStyle = '#f97316';
        c.fillRect(fx - 1, fy - 1 - flick, 3, 3);
        c.fillStyle = '#facc15';
        c.fillRect(fx, fy - flick, 1, 2);
    }

    if (z.hp < z.maxHp || isBoss || isGiant) {
        const barW = Math.max(13, Math.round(r * 2.1));
        const barH = isBoss ? 3 : 2;
        const top = Math.round(y - r - (z.burnTimer > 0 ? 9 : 5));
        const left = Math.round(x - barW / 2);
        const pct = Math.max(0, Math.min(1, z.hp / z.maxHp));
        const fill = isBoss ? '#f97316' : '#22c55e';
        c.fillStyle = PixelArt.OUTLINE;
        c.fillRect(left - 1, top - 1, barW + 2, barH + 2);
        c.fillStyle = '#3f1d1d';
        c.fillRect(left, top, barW, barH);
        const w = Math.round(barW * pct);
        c.fillStyle = fill;
        c.fillRect(left, top, w, barH);
        c.fillStyle = PixelArt.shade(fill, 0.35);
        c.fillRect(left, top, w, 1);
    }
}

// ---------- Compatibility API used by the HTML shop / upgrade panel ----------

function drawTankEntity(c, tk, scale = 1, isGhost = false) {
    c.save();
    if (isGhost) c.globalAlpha = 0.65;
    PixelArt.blitScaled(c, EntitySprites.tankSprite(tk.id, tk.level || 1, tk.angle || 0), scale);
    c.restore();
}

function drawBuildingEntity(c, b, scale = 1, isGhost = false) {
    c.save();
    if (isGhost) c.globalAlpha = 0.65;
    PixelArt.blitScaled(c, EntitySprites.buildingSprite(b.id, 0), scale);
    c.restore();
}

function drawZombieEntity(c, z) {
    c.save();
    c.translate(z.x, z.y);
    PixelArt.blitScaled(c, EntitySprites.zombieSprite(z, z.hitFlash > 0), 1);
    c.restore();
}

// Expose globally and on window.Game namespace
window.EntitySprites = EntitySprites;
window.drawTankWorld = drawTankWorld;
window.drawBuildingWorld = drawBuildingWorld;
window.drawZombieWorld = drawZombieWorld;
window.drawTankEntity = drawTankEntity;
window.drawBuildingEntity = drawBuildingEntity;
window.drawZombieEntity = drawZombieEntity;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.Entity = {
    drawTankWorld,
    drawBuildingWorld,
    drawZombieWorld,
    drawTankEntity,
    drawBuildingEntity,
    drawZombieEntity
};
