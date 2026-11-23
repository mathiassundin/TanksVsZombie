/* ==========================================
 * Tanks Vs. Zombie - Audio Controller (Web Audio API)
 * Controller
 * ========================================== */

const SoundFX = (() => {
    let ctx = null;
    let enabled = true;

    function ensureCtx() {
        if (!enabled) return null;
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) ctx = new AudioCtx();
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function tone(freq, endFreq, dur, type = 'triangle', vol = 0.08) {
        const c = ensureCtx();
        if (!c) return;
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), now + dur);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + dur);
    }

    return {
        isEnabled: () => enabled,
        toggle: () => {
            enabled = !enabled;
            if (enabled) ensureCtx();
            return enabled;
        },
        shoot: () => tone(420, 140, 0.08, 'square', 0.05),
        frost: () => tone(780, 360, 0.11, 'sine', 0.05),
        tesla: () => tone(920, 240, 0.12, 'sawtooth', 0.05),
        explode: () => tone(150, 35, 0.22, 'sawtooth', 0.11),
        build: () => {
            tone(320, 520, 0.09, 'triangle', 0.08);
            setTimeout(() => tone(520, 740, 0.1, 'triangle', 0.08), 65);
        },
        upgrade: () => {
            tone(440, 660, 0.09, 'triangle', 0.09);
            setTimeout(() => tone(660, 920, 0.12, 'triangle', 0.09), 75);
        },
        sell: () => tone(540, 260, 0.14, 'triangle', 0.08),
        bossAlert: () => {
            tone(180, 120, 0.22, 'sawtooth', 0.12);
            setTimeout(() => tone(160, 95, 0.28, 'sawtooth', 0.12), 190);
        }
    };
})();

// Expose globally and on window.Game namespace
window.SoundFX = SoundFX;

window.Game = window.Game || {};
window.Game.Controllers = window.Game.Controllers || {};
window.Game.Controllers.Audio = SoundFX;
