/* ==========================================
 * Tanks Vs. Zombie - Map View (Terrain, Roads, Obstacles & Flags)
 * View - pixel art
 * ========================================== */

const MapArt = (function () {
    const P = PixelArt;
    const { shade, mix, hash, noise, ramp, rect, circle, ellipse, tri, blob } = P;
    const terrainCache = new Map();

    // ---------- Terrain baking (once per map) ----------
    function bakeTerrain(map) {
        const W = P.ART_W;
        const H = P.ART_H;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const g = canvas.getContext('2d');
        const img = g.createImageData(W, H);
        const data = img.data;
        const water = new Uint8Array(W * H);

        const theme = map.id;
        const winter = theme === 'winter';
        const desert = theme === 'desert';
        const grass = [shade(map.bg, -0.22), shade(map.bg, -0.1), map.bg, shade(map.bg, 0.1)];
        const alt = [shade(map.bgAlt, -0.18), shade(map.bgAlt, -0.06), map.bgAlt, shade(map.bgAlt, 0.08)];
        const wps = map.roadWaypoints || map.waypoints;
        const rw = map.roadWidth / 2;
        const inner = map.roadInner;
        const outer = map.roadOuter;
        const innerRamp = [shade(inner, -0.2), shade(inner, -0.08), inner, shade(inner, 0.12)];
        const outerRamp = [shade(outer, -0.15), outer, shade(outer, 0.14)];
        const iceRamp = ['#cbd5e1', '#e2e8f0', '#f1f5f9'];
        const border = mix(outer, '#000000', 0.6);
        const waterRamp = winter ? ['#7dd3fc', '#a5dcf7', '#bae6fd', '#e0f2fe'] : ['#075985', '#0369a1', '#0284c7', '#38bdf8'];
        const shoreRamp = desert ? ['#fcd34d', '#fde68a', '#fef3c7'] : winter ? ['#e2e8f0', '#f8fafc', '#ffffff'] : ['#57534e', '#78716c', '#a8a29e'];
        const wood = winter ? ['#7dd3fc', '#a5dcf7', '#bae6fd', '#e0f2fe'] : ['#5c2d0c', '#7c3f12', '#92400e', '#a85a1c'];
        const bankRamp = ['#57534e', '#78716c', '#a8a29e'];
        const flowers = ['#fde047', '#f8fafc', '#f472b6'];

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const wx = x * P.PX + 1;
                const wy = y * P.PX + 1;
                const i = y * W + x;
                let col;

                let dRoad = Infinity;
                for (let k = 0; k < wps.length - 1; k++) {
                    const d = distToSegment(wx, wy, wps[k].x, wps[k].y, wps[k + 1].x, wps[k + 1].y);
                    if (d < dRoad) dRoad = d;
                }

                const hasStream = map.streamX !== null && map.streamX !== undefined;
                const onBridge = hasStream && map.bridgeY !== null && Math.abs(wx - map.streamX) <= 30 && Math.abs(wy - map.bridgeY) <= 32;
                const pond = map.pond;
                const e = pond ? ((wx - pond.x) / pond.rx) ** 2 + ((wy - pond.y) / pond.ry) ** 2 : Infinity;
                const sd = hasStream ? Math.abs(wx - map.streamX) : Infinity;

                if (onBridge) {
                    const bx = wx - map.streamX + 30;
                    const by = wy - map.bridgeY + 32;
                    if (by < 1.5 || by > 62.5 || bx < 1.5 || bx > 58.5) {
                        col = P.OUTLINE;
                    } else if (by < 5 || by > 59) {
                        col = Math.floor(bx / 2) % 5 === 0 ? wood[0] : wood[2];
                    } else {
                        const board = Math.floor(bx / 6);
                        const inB = bx - board * 6;
                        if (inB < 1.2) {
                            col = winter ? '#0284c7' : '#2a1405';
                        } else if (inB < 2.4 && (Math.floor(by) % 16) < 2) {
                            col = '#d6d3d1';
                        } else {
                            const t = 0.55 + (hash(board, Math.floor(by / 3), 21) - 0.5) * 0.5 + (hash(x, y, 22) - 0.5) * 0.3;
                            col = ramp(wood, t, x, y);
                        }
                    }
                } else if (dRoad <= rw + 4) {
                    if (dRoad > rw + 1) {
                        col = border;
                    } else if (dRoad > rw - 4) {
                        col = hash(x, y, 3) < 0.12 ? shade(outer, 0.28) : ramp(outerRamp, hash(x, y, 4), x, y);
                    } else {
                        let t = noise(x / 6, y / 6, 4) * 0.7 + hash(x, y, 5) * 0.3;
                        if (Math.abs(dRoad - Math.min(rw * 0.42, 14)) < 1.3) t -= 0.35;
                        col = ramp(innerRamp, t, x, y);
                        const h = hash(x, y, 6);
                        if (h < 0.012) col = shade(inner, -0.35);
                        else if (h < 0.02) col = shade(inner, 0.3);
                        if (winter && noise(x / 9, y / 9, 8) > 0.68) col = ramp(iceRamp, hash(x, y, 9), x, y);
                    }
                } else if (e <= 1) {
                    water[i] = 1;
                    if (e > 0.92) {
                        col = mix(waterRamp[0], '#000000', 0.4);
                    } else if (winter && Math.abs(noise(x / 6, y / 6, 13) - 0.5) < 0.03) {
                        col = '#38bdf8';
                    } else {
                        col = ramp(waterRamp, 0.15 + e * 0.75 + (noise(x / 4, y / 4, 12) - 0.5) * 0.3, x, y);
                    }
                } else if (e <= 1.25) {
                    col = ramp(shoreRamp, hash(x, y, 14), x, y);
                    if (!desert && !winter && hash(x, y, 15) < 0.1) col = hash(x, y, 16) < 0.5 ? '#365314' : '#4d7c0f';
                } else if (sd < 18) {
                    water[i] = 1;
                    col = ramp(waterRamp, 0.4 + (noise(x / 3, y / 10, 14) - 0.5) * 0.8 + (18 - sd) / 60, x, y);
                } else if (sd < 20.5) {
                    col = mix(map.bg, '#000000', 0.55);
                } else if (sd < 24) {
                    col = ramp(bankRamp, hash(x, y, 17), x, y);
                } else {
                    const n = noise(x / 16, y / 16, 1) * 0.6 + noise(x / 5, y / 5, 2) * 0.3 + hash(x, y, 3) * 0.1;
                    const useAlt = noise(x / 28 + 3, y / 28, 7) > 0.6;
                    col = ramp(useAlt ? alt : grass, n, x, y);
                    const h = hash(x, y, 9);
                    if (desert) {
                        const rip = Math.sin(wx * 0.045 + wy * 0.12 + noise(x / 10, y / 10, 4) * 5);
                        if (rip > 0.92) col = shade(map.bg, -0.14);
                        else if (rip > 0.78) col = shade(map.bg, 0.1);
                        if (h < 0.004) col = '#92400e';
                    } else if (winter) {
                        if (h < 0.005) col = '#ffffff';
                        else if (h < 0.009) col = '#93c5fd';
                    } else {
                        if (h < 0.004) col = flowers[Math.floor(hash(x, y, 10) * 3)];
                        else if (h < 0.035) col = shade(map.bg, 0.25);
                        else if (hash(x, y - 1, 9) < 0.035 && hash(x, y - 1, 9) >= 0.004) col = shade(map.bg, -0.3);
                    }
                    if (dRoad < rw + 9) col = shade(col, -0.12);
                }

                const [r, gr, b] = P.hexToRgb(col);
                data[i * 4] = r;
                data[i * 4 + 1] = gr;
                data[i * 4 + 2] = b;
                data[i * 4 + 3] = 255;
            }
        }
        g.putImageData(img, 0, 0);
        return { canvas, water };
    }

    function getTerrain(map) {
        const key = `${map.id}|${map.roadWidth}`;
        let t = terrainCache.get(key);
        if (!t) {
            t = bakeTerrain(map);
            terrainCache.set(key, t);
        }
        return t;
    }

    // Animated sparkles that only land on water pixels
    function drawWaterFx(c, map, terrain, timeSec) {
        const W = P.ART_W;
        const isWater = (x, y) => x >= 0 && y >= 0 && x < W && y < P.ART_H && terrain.water[y * W + x] === 1;

        if (map.streamX !== null && map.streamX !== undefined) {
            const sx = P.ax(map.streamX);
            c.fillStyle = 'rgba(224, 242, 254, 0.75)';
            for (let k = 0; k < 34; k++) {
                const x = sx + [-6, -3, 0, 3, 6][k % 5];
                const y = Math.floor((k * 53 + timeSec * 28 * (1 + (k % 3) * 0.3)) % (P.ART_H + 6)) - 3;
                if (isWater(x, y) && isWater(x, y + 2)) c.fillRect(x, y, 1, 3);
            }
        }

        if (map.pond) {
            const p = map.pond;
            const cx = P.ax(p.x);
            const cy = P.ax(p.y);
            const rp = (timeSec * 0.65) % 1;
            const rx = (p.rx / P.PX) * (0.25 + rp * 0.55);
            const ry = (p.ry / P.PX) * (0.25 + rp * 0.55);
            c.fillStyle = map.id === 'winter' ? 'rgba(255,255,255,0.7)' : `rgba(186, 230, 253, ${0.75 * (1 - rp)})`;
            const steps = Math.max(24, Math.round(rx * 5));
            for (let k = 0; k < steps; k++) {
                const a = (k / steps) * Math.PI * 2;
                const x = Math.round(cx + Math.cos(a) * rx);
                const y = Math.round(cy + Math.sin(a) * ry);
                if (isWater(x, y)) c.fillRect(x, y, 1, 1);
            }
            const gx = Math.round(cx - 9 + Math.sin(timeSec * 2) * 4);
            c.fillStyle = 'rgba(255,255,255,0.55)';
            c.fillRect(gx, cy - 5, 6, 1);
            c.fillRect(gx + 2, cy - 4, 3, 1);
        }
    }

    // ---------- Obstacles ----------
    function leaf(base, ra) {
        const tones = [shade(base, -0.32), shade(base, -0.12), base, shade(base, 0.18)];
        return (u, v) => {
            const n = noise((u + 30) / 2.2, (v + 30) / 2.2, 9);
            // Leaf clumps: coarse noise for clusters, speckles for single leaves
            const clump = noise((u + 30) / 1.3, (v + 30) / 1.3, 27);
            const h = hash(Math.floor(u + 30), Math.floor(v + 30), 28);
            let t = 0.55 - (u + v) / (ra * 4) + (n - 0.5) * 0.7 + (clump > 0.62 ? 0.22 : clump < 0.3 ? -0.2 : 0);
            if (h < 0.07) t += 0.35;
            return ramp(tones, t, Math.floor(u + 30), Math.floor(v + 30));
        };
    }

    function obstacleShapes(type, ra) {
        const S = [];
        if (type === 'tree') {
            S.push(rect(-1.6, 0, 3.2, 7, u => ((Math.floor(u + 5) & 1) ? '#6b3f1d' : '#7c4a22')));
            S.push(circle(0, -3, ra * 0.85, leaf('#15803d', ra)));
            S.push(circle(2.6, -1.5, ra * 0.42, leaf('#16873f', ra)));
            S.push(circle(-2.5, -5, ra * 0.5, leaf('#22a24a', ra)));
        } else if (type === 'bush') {
            S.push(circle(-3, 1, ra * 0.65, leaf('#16a34a', ra)));
            S.push(circle(3, 1, ra * 0.65, leaf('#15913f', ra)));
            S.push(circle(0, -2, ra * 0.72, leaf('#1fb455', ra)));
            S.push(circle(-2, -1, 0.9, '#ef4444', { flat: true }));
            S.push(circle(2.5, 0.5, 0.9, '#ef4444', { flat: true }));
            S.push(circle(0.5, -3.5, 0.9, '#f87171', { flat: true }));
        } else if (type === 'rock' || type === 'desertRock') {
            const base = type === 'desertRock' ? '#b45309' : '#6b7280';
            const fn = (u, v) => {
                if (Math.abs(noise((u + 20) / 3, (v + 20) / 3, 18) - 0.5) < 0.035) return shade(base, -0.4);
                if (type === 'desertRock' && Math.floor(v + 40) % 3 === 0) return shade(base, -0.12);
                return hash(Math.floor(u + 40), Math.floor(v + 40), 19) < 0.1 ? shade(base, -0.15) : base;
            };
            S.push(blob(0, 0, ra * 0.92, ra * 0.68, ra, fn));
            S.push(blob(-ra * 0.15, -ra * 0.22, ra * 0.5, ra * 0.32, ra + 3, shade(base, 0.12)));
        } else if (type === 'cactus') {
            const cactus = (u, v) => {
                if (hash(Math.floor(u + 20), Math.floor(v + 20), 23) < 0.07) return '#fef3c7';
                return (Math.floor(u + 20) & 1) ? '#15803d' : '#16a34a';
            };
            S.push(rect(-6.5, -ra * 0.75, 3, 6, cactus, 1.4));
            S.push(rect(-6.5, -ra * 0.45, 4.5, 3, cactus, 1.4));
            S.push(rect(3.5, -ra * 0.62, 3, 6, cactus, 1.4));
            S.push(rect(2, -ra * 0.3, 4.5, 3, cactus, 1.4));
            S.push(rect(-2.5, -ra * 0.9, 5, ra * 1.4, cactus, 2.4));
            S.push(circle(0, -ra * 0.9, 1.2, '#f472b6', { flat: true }));
        } else if (type === 'snowPine') {
            S.push(rect(-1.8, 2, 3.6, 5, '#6b3f1d'));
            [7, 3.5, 0].forEach((yOff, idx) => {
                const w = ra * (0.95 - idx * 0.2);
                const apex = yOff - 9;
                S.push(tri(0, apex, w, 9, (u, v) => {
                    if (idx === 2 && v < apex + 3.5) return '#f8fafc';
                    if (v > yOff - 1.2) return '#e2e8f0';
                    if (u < 0 && hash(Math.floor(u + 20), Math.floor(v + 20), 25) < 0.22) return '#e2e8f0';
                    return (Math.floor(v + 20) & 1) ? '#0f766e' : '#115e59';
                }));
            });
        }
        return S;
    }

    function obstacleSprite(type, r) {
        return P.cached(`obs|${type}|${r}`, () => {
            const ra = r / P.PX;
            const size = 2 * Math.ceil(ra * 1.2 + 5) + 2;
            return P.rasterize(obstacleShapes(type, ra), size);
        });
    }

    function drawObstacle(c, dec, selected, timeSec) {
        const x = P.ax(dec.x);
        const y = P.ax(dec.y);
        const ra = dec.r / P.PX;
        P.fillEllipse(c, x + 1, y + ra * 0.55, ra * 0.85, ra * 0.42, 'rgba(0,0,0,0.22)');
        P.blit(c, obstacleSprite(dec.type, dec.r), x, y, { shadow: false });
        if (selected) P.ring(c, x, y, ra + 4, '#facc15', 3, (timeSec || 0) * 4);
    }

    // ---------- Flags ----------
    function drawFlag(c, x, y, color, timeSec) {
        x = Math.round(x);
        y = Math.round(y);
        P.fillEllipse(c, x, y + 2, 6, 2, 'rgba(0,0,0,0.3)');
        c.fillStyle = P.OUTLINE;
        c.fillRect(x - 1, y - 23, 3, 25);
        c.fillStyle = '#e7e5e4';
        c.fillRect(x, y - 22, 1, 23);

        const dark = shade(color, -0.3);
        const light = shade(color, 0.25);
        for (let i = 0; i < 16; i++) {
            const yo = Math.round(Math.sin(timeSec * 5.2 - i * 0.45) * 1.4 * (i / 15));
            const top = y - 21 + yo;
            let h = 9;
            if (i >= 13) h = 9;
            c.fillStyle = P.OUTLINE;
            c.fillRect(x + 2 + i, top - 1, 1, h + 2);
            if (i >= 13) {
                // swallowtail notch
                const notch = i - 12;
                c.fillStyle = color;
                c.fillRect(x + 2 + i, top, 1, 4 - notch);
                c.fillRect(x + 2 + i, top + 5 + notch, 1, 4 - notch);
                c.fillStyle = P.OUTLINE;
                c.fillRect(x + 2 + i, top + 4 - notch, 1, 1 + notch * 2);
            } else {
                const lit = Math.sin(timeSec * 5.2 - i * 0.45) > 0.3;
                c.fillStyle = lit ? light : color;
                c.fillRect(x + 2 + i, top, 1, h);
                c.fillStyle = dark;
                c.fillRect(x + 2 + i, top + h - 2, 1, 2);
            }
        }
        c.fillStyle = P.OUTLINE;
        c.fillRect(x - 2, y - 26, 4, 4);
        c.fillStyle = '#facc15';
        c.fillRect(x - 1, y - 25, 2, 2);
    }

    function drawMap(c, map, timeSec) {
        const terrain = getTerrain(map);
        c.drawImage(terrain.canvas, 0, 0);
        drawWaterFx(c, map, terrain, timeSec);

        const wps = map.roadWaypoints || map.waypoints;
        const startWp = wps[0];
        const endWp = wps[wps.length - 1];
        const clampX = v => Math.max(34, Math.min(CANVAS_W - 34, v));
        const sx = clampX(startWp.x + 28);
        const sy = startWp.y - 30;
        const ex = clampX(endWp.x - 42);
        const ey = endWp.y - 30;
        drawFlag(c, P.ax(sx), P.ax(sy), '#ef4444', timeSec);
        drawFlag(c, P.ax(ex), P.ax(ey), '#22c55e', timeSec);
        P.queueLabel(t().flagStart, sx, sy + 15, { box: '#1c1917', color: '#fef08a', size: 11 });
        P.queueLabel(t().flagGoal, ex, ey + 15, { box: '#1c1917', color: '#fef08a', size: 11 });
    }

    return { getTerrain, drawMap, drawObstacle, obstacleSprite };
})();

// ---------- Public API ----------

function drawMapBackground(c, map, timeSec) {
    MapArt.drawMap(c, map, timeSec);
}

function drawObstacleWorld(c, dec, selected, timeSec) {
    MapArt.drawObstacle(c, dec, selected, timeSec);
}

// Used by the upgrade panel preview (game units, origin at dec.x/dec.y)
function drawSingleObstacle(c, dec) {
    c.save();
    c.translate(dec.x, dec.y);
    PixelArt.blitScaled(c, MapArt.obstacleSprite(dec.type, dec.r), 1);
    c.restore();
}

// Expose globally and on window.Game namespace
window.MapArt = MapArt;
window.drawMapBackground = drawMapBackground;
window.drawObstacleWorld = drawObstacleWorld;
window.drawSingleObstacle = drawSingleObstacle;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.Map = {
    drawMapBackground,
    drawObstacleWorld,
    drawSingleObstacle
};
