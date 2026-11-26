/* ==========================================
 * Tanks Vs. Zombie - Pixel Art Core
 * View
 *
 * The world is drawn into a low-resolution "art" canvas (1 art pixel =
 * PX game units) and scaled up without smoothing. Sprites are built from
 * simple shapes that are rasterised pixel by pixel at each rotation, then
 * given bevel shading and a selective outline, so they stay crisp at every
 * angle instead of being blurry rotated bitmaps.
 * ========================================== */

const PixelArt = (function () {
    const PX = 2;
    const ART_W = Math.round(CANVAS_W / PX);
    const ART_H = Math.round(CANVAS_H / PX);
    const ANGLE_STEPS = 32;
    const OUTLINE = '#120f0d';

    // ---------- Colour helpers ----------
    const rgbCache = new Map();
    function hexToRgb(hex) {
        let v = rgbCache.get(hex);
        if (v) return v;
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
        const n = parseInt(h, 16);
        v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        rgbCache.set(hex, v);
        return v;
    }

    function rgbToHex(r, g, b) {
        const to = val => Math.max(0, Math.min(255, Math.round(val))).toString(16).padStart(2, '0');
        return `#${to(r)}${to(g)}${to(b)}`;
    }

    function mix(a, b, t) {
        const A = hexToRgb(a);
        const B = hexToRgb(b);
        return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
    }

    // Hue-shifted ramp: highlights drift warm, shadows drift cool.
    const shadeCache = new Map();
    function shade(hex, amt) {
        const key = hex + '|' + amt;
        let v = shadeCache.get(key);
        if (v) return v;
        v = amt >= 0
            ? mix(mix(hex, '#ffffff', amt), '#fff3c4', amt * 0.35)
            : mix(mix(hex, '#000000', -amt), '#1e1b4b', -amt * 0.4);
        shadeCache.set(key, v);
        return v;
    }

    // ---------- Noise & dithering ----------
    function hash(x, y, s = 0) {
        let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    }

    function noise(x, y, s = 0) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);
        const a = hash(xi, yi, s);
        const b = hash(xi + 1, yi, s);
        const c = hash(xi, yi + 1, s);
        const d = hash(xi + 1, yi + 1, s);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }

    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
    function dither(x, y) {
        return BAYER[((y & 3) << 2) | (x & 3)];
    }

    // Pick a colour from a ramp with ordered dithering between steps.
    function ramp(colors, t, x, y) {
        const f = Math.max(0, Math.min(1, t)) * (colors.length - 1);
        let i = Math.floor(f);
        if (f - i > dither(Math.floor(x), Math.floor(y))) i += 1;
        return colors[Math.min(colors.length - 1, i)];
    }

    // ---------- Shapes (sprite space, art pixels, facing +x) ----------
    const colorAt = (col, u, v) => (typeof col === 'function' ? col(u, v) : col);

    function rect(x, y, w, h, color, r = 0, extra = {}) {
        return {
            color,
            ...extra,
            test(u, v) {
                if (u < x || u >= x + w || v < y || v >= y + h) return false;
                if (r <= 0) return true;
                const cx = Math.max(x + r, Math.min(x + w - r, u));
                const cy = Math.max(y + r, Math.min(y + h - r, v));
                return (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
            }
        };
    }

    function circle(cx, cy, r, color, extra = {}) {
        return { color, ...extra, test: (u, v) => (u - cx) ** 2 + (v - cy) ** 2 <= r * r };
    }

    function ellipse(cx, cy, rx, ry, color, extra = {}) {
        return { color, ...extra, test: (u, v) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1 };
    }

    function seg(x0, y0, x1, y1, hw, color, extra = {}) {
        return { color, ...extra, test: (u, v) => distToSegment(u, v, x0, y0, x1, y1) <= hw };
    }

    // Isosceles triangle with apex at (ax, ay) pointing up
    function tri(ax, ay, halfBase, height, color, extra = {}) {
        return {
            color,
            ...extra,
            test(u, v) {
                if (v < ay || v > ay + height) return false;
                return Math.abs(u - ax) <= ((v - ay) / height) * halfBase;
            }
        };
    }

    // Irregular rounded blob, for rocks
    function blob(cx, cy, rx, ry, seed, color, extra = {}) {
        return {
            color,
            ...extra,
            test(u, v) {
                const nx = (u - cx) / rx;
                const ny = (v - cy) / ry;
                const a = Math.atan2(ny, nx);
                const k = 0.8 + 0.32 * noise(Math.cos(a) * 1.7 + seed, Math.sin(a) * 1.7 + seed, 31);
                return nx * nx + ny * ny <= k * k;
            }
        };
    }

    // Wrap shapes so they are rotated by `angle` around (ox, oy)
    function rotated(shape, angle, ox = 0, oy = 0) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const back = (u, v) => {
            const du = u - ox;
            const dv = v - oy;
            return [ox + du * c + dv * s, oy - du * s + dv * c];
        };
        return {
            ...shape,
            test: (u, v) => shape.test(...back(u, v)),
            color: typeof shape.color === 'function' ? (u, v) => shape.color(...back(u, v)) : shape.color
        };
    }

    // ---------- Rasteriser ----------
    // opts.flash: paint everything white (hit flash)
    function rasterize(shapes, size, angle = 0, opts = {}) {
        const n = size * size;
        const colors = new Array(n).fill(null);
        const region = new Int16Array(n).fill(-1);
        const flat = new Uint8Array(n);
        const half = size / 2;
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x + 0.5 - half;
                const dy = y + 0.5 - half;
                const u = ca * dx + sa * dy;
                const v = -sa * dx + ca * dy;
                for (let i = shapes.length - 1; i >= 0; i--) {
                    const s = shapes[i];
                    if (!s.test(u, v)) continue;
                    const col = colorAt(s.color, u, v);
                    const idx = y * size + x;
                    colors[idx] = col;
                    region[idx] = s.group !== undefined ? s.group : i;
                    flat[idx] = s.flat ? 1 : 0;
                    break;
                }
            }
        }

        const out = new Array(n).fill(null);
        const differs = (x, y, r) => {
            if (x < 0 || y < 0 || x >= size || y >= size) return true;
            return region[y * size + x] !== r;
        };

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                const col = colors[idx];
                if (!col) continue;
                let c = col;
                if (!flat[idx]) {
                    const r = region[idx];
                    const lit = differs(x, y - 1, r) || differs(x - 1, y, r);
                    const dark = differs(x, y + 1, r) || differs(x + 1, y, r);
                    if (lit && !dark) c = shade(col, 0.22);
                    else if (dark && !lit) c = shade(col, -0.24);
                }
                if (opts.flash) c = mix(c, '#ffffff', 0.85);
                out[idx] = c;
            }
        }

        // Selective outline: a dark version of the neighbouring colour
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                if (colors[idx]) continue;
                let neighbour = null;
                if (y > 0 && colors[idx - size]) neighbour = colors[idx - size];
                else if (x > 0 && colors[idx - 1]) neighbour = colors[idx - 1];
                else if (x < size - 1 && colors[idx + 1]) neighbour = colors[idx + 1];
                else if (y < size - 1 && colors[idx + size]) neighbour = colors[idx + size];
                if (neighbour) out[idx] = opts.flash ? '#fecaca' : mix(neighbour, OUTLINE, 0.8);
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const g = canvas.getContext('2d');
        const img = g.createImageData(size, size);
        const shadow = document.createElement('canvas');
        shadow.width = size;
        shadow.height = size;
        const sg = shadow.getContext('2d');
        const simg = sg.createImageData(size, size);
        for (let i = 0; i < n; i++) {
            if (!out[i]) continue;
            const [r, gr, b] = hexToRgb(out[i]);
            img.data[i * 4] = r;
            img.data[i * 4 + 1] = gr;
            img.data[i * 4 + 2] = b;
            img.data[i * 4 + 3] = 255;
            simg.data[i * 4 + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        sg.putImageData(simg, 0, 0);
        return { canvas, shadow, size, half: size / 2 };
    }

    const spriteCache = new Map();
    function cached(key, build) {
        let s = spriteCache.get(key);
        if (!s) {
            s = build();
            spriteCache.set(key, s);
        }
        return s;
    }

    function angleIndex(angle) {
        const steps = Math.round(((angle || 0) / (Math.PI * 2)) * ANGLE_STEPS);
        return ((steps % ANGLE_STEPS) + ANGLE_STEPS) % ANGLE_STEPS;
    }

    const angleFromIndex = idx => (idx / ANGLE_STEPS) * Math.PI * 2;

    // ---------- Drawing in art space ----------
    const ax = v => Math.round(v / PX);

    function blit(c, sprite, x, y, opts = {}) {
        const left = Math.round(x) - sprite.half;
        const top = Math.round(y) - sprite.half;
        if (opts.shadow !== false) {
            c.save();
            c.globalAlpha = (opts.alpha || 1) * 0.3;
            c.drawImage(sprite.shadow, left + 1, top + 2);
            c.restore();
        }
        if (opts.alpha !== undefined && opts.alpha < 1) {
            c.save();
            c.globalAlpha = opts.alpha;
            c.drawImage(sprite.canvas, left, top);
            c.restore();
        } else {
            c.drawImage(sprite.canvas, left, top);
        }
    }

    // Draw a sprite into any context whose origin is the sprite centre,
    // using game units (used by the HTML shop and upgrade panel previews).
    function blitScaled(c, sprite, scale = 1) {
        const s = PX * scale;
        c.save();
        c.imageSmoothingEnabled = false;
        c.drawImage(sprite.canvas, -sprite.half * s, -sprite.half * s, sprite.size * s, sprite.size * s);
        c.restore();
    }

    function fillEllipse(c, cx, cy, rx, ry, color) {
        c.fillStyle = color;
        cx = Math.round(cx);
        cy = Math.round(cy);
        const ryi = Math.max(1, Math.round(ry));
        for (let dy = -ryi; dy <= ryi; dy++) {
            const t = 1 - (dy * dy) / (ry * ry);
            if (t < 0) continue;
            const hw = Math.round(rx * Math.sqrt(t));
            c.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
        }
    }

    // Midpoint circle; `dash` gives dash length in pixels, `phase` animates it
    function ring(c, cx, cy, r, color, dash = 0, phase = 0) {
        r = Math.round(r);
        if (r <= 0) return;
        c.fillStyle = color;
        cx = Math.round(cx);
        cy = Math.round(cy);
        let x = r;
        let y = 0;
        let err = 1 - r;
        const pts = [];
        while (x >= y) {
            pts.push([x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]);
            y++;
            if (err < 0) {
                err += 2 * y + 1;
            } else {
                x--;
                err += 2 * (y - x) + 1;
            }
        }
        for (const [dx, dy] of pts) {
            if (dash) {
                const a = Math.atan2(dy, dx) + Math.PI;
                if (Math.floor((a * r) / dash + phase) & 1) continue;
            }
            c.fillRect(cx + dx, cy + dy, 1, 1);
        }
    }

    function line(c, x0, y0, x1, y1, color, w = 1) {
        c.fillStyle = color;
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0);
        const dy = -Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        const off = Math.floor(w / 2);
        for (let guard = 0; guard < 2000; guard++) {
            c.fillRect(x0 - off, y0 - off, w, w);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) {
                err += dy;
                x0 += sx;
            }
            if (e2 <= dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    // Small 3x3 pixel stars with outline, centred under an entity
    function stars(c, x, y, count) {
        const total = count * 4 - 1;
        let sx = Math.round(x - total / 2);
        y = Math.round(y);
        for (let i = 0; i < count; i++, sx += 4) {
            c.fillStyle = OUTLINE;
            c.fillRect(sx - 1, y, 5, 3);
            c.fillRect(sx, y - 1, 3, 5);
            c.fillStyle = '#facc15';
            c.fillRect(sx, y + 1, 3, 1);
            c.fillRect(sx + 1, y, 1, 3);
            c.fillStyle = '#fef9c3';
            c.fillRect(sx + 1, y + 1, 1, 1);
        }
    }

    // ---------- Frame handling ----------
    let frameCanvas = null;
    let frameCtx = null;
    const overlayTexts = [];

    function beginFrame() {
        if (!frameCanvas) {
            frameCanvas = document.createElement('canvas');
            frameCanvas.width = ART_W;
            frameCanvas.height = ART_H;
            frameCtx = frameCanvas.getContext('2d');
        }
        frameCtx.setTransform(1, 0, 0, 1, 0, 0);
        frameCtx.imageSmoothingEnabled = false;
        frameCtx.clearRect(0, 0, ART_W, ART_H);
        overlayTexts.length = 0;
        return frameCtx;
    }

    // Queue crisp text that is drawn on the full-resolution canvas
    function queueLabel(text, x, y, opts = {}) {
        overlayTexts.push({ text, x, y, ...opts });
    }

    function present(target) {
        target.save();
        target.imageSmoothingEnabled = false;
        target.drawImage(frameCanvas, 0, 0, CANVAS_W, CANVAS_H);
        target.restore();
        for (const l of overlayTexts) drawPixelText(target, l.text, l.x, l.y, l);
    }

    const PIXEL_FONT = '"Pixelify Sans", "Courier New", monospace';
    function drawPixelText(c, text, x, y, opts = {}) {
        const size = opts.size || 11;
        c.save();
        c.font = `${opts.weight || 700} ${size}px ${PIXEL_FONT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        if (opts.alpha !== undefined) c.globalAlpha = opts.alpha;
        if (opts.box) {
            const w = Math.ceil(c.measureText(text).width) + 8;
            const h = size + 4;
            c.fillStyle = OUTLINE;
            c.fillRect(Math.round(x - w / 2) - 2, Math.round(y - h / 2) - 2, w + 4, h + 4);
            c.fillStyle = opts.box;
            c.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
        }
        c.lineJoin = 'miter';
        c.miterLimit = 2;
        c.strokeStyle = OUTLINE;
        c.lineWidth = opts.box ? 0 : 3;
        if (!opts.box) c.strokeText(text, x, y);
        c.fillStyle = opts.color || '#fef08a';
        c.fillText(text, x, y + 0.5);
        c.restore();
    }

    return {
        PX,
        ART_W,
        ART_H,
        ANGLE_STEPS,
        OUTLINE,
        hexToRgb,
        rgbToHex,
        mix,
        shade,
        hash,
        noise,
        dither,
        ramp,
        rect,
        circle,
        ellipse,
        seg,
        tri,
        blob,
        rotated,
        rasterize,
        cached,
        angleIndex,
        angleFromIndex,
        ax,
        blit,
        blitScaled,
        fillEllipse,
        ring,
        line,
        stars,
        beginFrame,
        queueLabel,
        present,
        drawPixelText
    };
})();

window.PixelArt = PixelArt;
window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.PixelArt = PixelArt;
