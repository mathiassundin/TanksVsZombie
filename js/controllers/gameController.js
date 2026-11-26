/* ==========================================
 * Tanks Vs. Zombie - Game Controller (Canvas Setup, Loop & Lifecycle)
 * Controller
 * ========================================== */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, Math.round(rect.width * dpr));
    const h = Math.max(186, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    ctx.setTransform(w / CANVAS_W, 0, 0, h / CANVAS_H, 0, 0);
}

window.addEventListener('resize', resizeCanvas);

function clientToGameCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_W,
        y: ((clientY - rect.top) / rect.height) * CANVAS_H
    };
}

function startNewMatch() {
    const diff = DIFFICULTIES[state.selectedDiff] || DIFFICULTIES.normal;
    const map = MAPS[state.selectedMap] || MAPS.meadow;
    const warchestBonus = getTechLevel('tech_warchest') * 75;

    state.matchStarted = true;
    state.paused = false;
    state.gameOver = false;
    state.victory = false;
    state.lives = diff.lives;
    state.money = diff.startGold + warchestBonus;
    state.wave = 0;
    state.waveActive = false;
    state.kills = 0;
    state.sessionStarsEarned = 0;
    state.unlockedTanks = { basic: true };
    state.unlockedAbilities = { mine: false, airstrike: false };
    state.abilityCooldowns = { mine: 0, airstrike: 0 };
    state.tanks = [];
    state.buildings = [];
    state.obstacles = map.decorations.map((d, idx) => ({ ...d, id: `obs_${idx}` }));
    state.zombies = [];
    state.projectiles = [];
    state.particles = [];
    state.floatingTexts = [];
    state.roadMines = [];
    state.spawnQueue = [];
    state.spawnTimer = 0;
    state.autoWaveTimer = 0;
    state.weather = { active: false, type: 'none', wavesLeft: 0, cooldownWaves: 0, intensity: 0, particles: [] };
    if (window.TvZMaze && state.selectedMap === 'maze') window.TvZMaze.updateMazePath(true);

    exitPlacementMode();
    deselectAll();
    document.getElementById('boss-hud').classList.add('hidden');
    document.getElementById('start-menu-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('victory-modal').classList.add('hidden');

    resizeCanvas();
    updateHUD();
    renderShopLists();
}

function triggerGameOver() {
    state.gameOver = true;
    state.paused = true;
    updateBossHUD();
    document.getElementById('go-waves').textContent = `${Math.max(0, state.wave - 1)} / ${getMaxWaves()}`;
    document.getElementById('go-kills').textContent = state.kills;
    document.getElementById('go-stars').innerHTML = `+${state.sessionStarsEarned} ${BLUE_STAR_INLINE}`;
    document.getElementById('gameover-modal').classList.remove('hidden');
}

function triggerVictory() {
    state.victory = true;
    state.paused = true;
    updateBossHUD();
    document.getElementById('vic-waves').textContent = `${state.wave} / ${getMaxWaves()}`;
    document.getElementById('vic-kills').textContent = state.kills;
    document.getElementById('vic-stars').innerHTML = `+${state.sessionStarsEarned} ${BLUE_STAR_INLINE}`;
    document.getElementById('victory-modal').classList.remove('hidden');
}

function updateGame(rawDt) {
    if (state.paused || state.gameOver || state.victory || !state.matchStarted) {
        return;
    }

    const dt = rawDt * state.speedMult;

    if (state.autoWaveTimer > 0) {
        state.autoWaveTimer = Math.max(0, state.autoWaveTimer - rawDt);
        if (state.autoWaveTimer === 0 && state.autoWave && !state.waveActive) {
            startNextWave();
        }
    }

    // Update ability cooldowns
    if (state.abilityCooldowns.mine > 0) {
        state.abilityCooldowns.mine = Math.max(0, state.abilityCooldowns.mine - dt);
        if (state.abilityCooldowns.mine === 0) updateHUD();
    }
    if (state.abilityCooldowns.airstrike > 0) {
        state.abilityCooldowns.airstrike = Math.max(0, state.abilityCooldowns.airstrike - dt);
        if (state.abilityCooldowns.airstrike === 0) updateHUD();
    }

    updateWeather(dt);

    // Spawn zombies from wave queue
    if (state.waveActive && state.spawnQueue.length > 0) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
            const nextSpec = state.spawnQueue.shift();
            spawnZombie(nextSpec);
            state.spawnTimer = nextSpec.delay || 0.5;
            if (nextSpec.type === 'boss') {
                updateBossHUD();
            }
        }
    }

    // Update zombies
    const wps = MAPS[state.selectedMap].waypoints;
    for (let i = state.zombies.length - 1; i >= 0; i--) {
        const z = state.zombies[i];
        if (z.hp <= 0) {
            state.zombies.splice(i, 1);
            continue;
        }

        if (z.hitFlash > 0) z.hitFlash = Math.max(0, z.hitFlash - dt);
        if (z._immuneToastCd > 0) z._immuneToastCd = Math.max(0, z._immuneToastCd - dt);

        if (z.slowTimer > 0) {
            z.slowTimer = Math.max(0, z.slowTimer - dt);
        }
        if (z.burnTimer > 0) {
            z.burnTimer = Math.max(0, z.burnTimer - dt);
            damageZombie(z, z.burnDps * dt, { isDot: true });
            if (z.hp <= 0) {
                state.zombies.splice(i, 1);
                continue;
            }
        }

        // Check road mines
        for (let m = state.roadMines.length - 1; m >= 0; m--) {
            const mine = state.roadMines[m];
            if (Math.hypot(z.x - mine.x, z.y - mine.y) <= z.radius + 18) {
                SoundFX.explode();
                spawnParticles(mine.x, mine.y, '#f97316', 20, 150);
                for (const otherZ of state.zombies) {
                    if (otherZ.hp > 0 && Math.hypot(otherZ.x - mine.x, otherZ.y - mine.y) <= 72 + otherZ.radius) {
                        damageZombie(otherZ, mine.damage);
                    }
                }
                state.roadMines.splice(m, 1);
                break;
            }
        }
        if (z.hp <= 0) {
            state.zombies.splice(i, 1);
            continue;
        }

        if (state.selectedMap === 'maze' && state.mazePathBlocked && window.TvZMaze) {
            const blk = window.TvZMaze.findBlockingTower();
            if (blk) {
                const bx = blk.x - 28;
                const by = blk.y;
                const bDist = Math.hypot(bx - z.x, by - z.y);
                const effSpd = z.speed * (z.slowTimer > 0 ? 0.55 : 1);
                if (bDist > 8) {
                    z.walkPhase += dt * (effSpd * 0.16);
                    z.angle = Math.atan2(by - z.y, bx - z.x);
                    z.x += ((bx - z.x) / bDist) * Math.min(bDist, effSpd * dt);
                    z.y += ((by - z.y) / bDist) * Math.min(bDist, effSpd * dt);
                }
                continue;
            }
        }

        const targetWp = wps[z.wpIndex];
        if (!targetWp) {
            // Reached base!
            const lifeLoss = z.type === 'boss' ? 10 : z.type === 'giant' ? 3 : 1;
            state.lives = Math.max(0, state.lives - lifeLoss);
            state.zombies.splice(i, 1);
            SoundFX.explode();
            updateHUD();
            updateBossHUD();
            if (state.lives <= 0) {
                triggerGameOver();
                return;
            }
            continue;
        }

        const dx = targetWp.x - z.x;
        const dy = targetWp.y - z.y;
        const dist = Math.hypot(dx, dy);
        const effectiveSpeed = z.speed * (z.slowTimer > 0 ? 0.55 : 1);
        z.walkPhase += dt * (effectiveSpeed * 0.16);

        if (dist <= effectiveSpeed * dt) {
            z.x = targetWp.x;
            z.y = targetWp.y;
            z.wpIndex += 1;
        } else {
            z.angle = Math.atan2(dy, dx);
            z.x += (dx / dist) * effectiveSpeed * dt;
            z.y += (dy / dist) * effectiveSpeed * dt;
        }
    }

    // Update tanks
    for (const tk of state.tanks) {
        if (tk.upgradeFlash > 0) {
            tk.upgradeFlash = Math.max(0, tk.upgradeFlash - dt * 1.8);
        }
        const stats = getTankStats(tk);
        if (tk.cooldown > 0) {
            tk.cooldown -= dt;
        }

        const target = selectTargetForTank(tk, stats.range);
        if (target) {
            if (!stats.spike) {
                tk.angle = Math.atan2(target.y - tk.y, target.x - tk.x);
            }
            if (tk.cooldown <= 0) {
                fireTankAt(tk, target, stats);
                tk.cooldown = 1 / Math.max(0.1, stats.fireRate);
            }
        }
    }

    // Update projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        const stepX = p.vx * dt;
        const stepY = p.vy * dt;
        const stepLen2 = stepX * stepX + stepY * stepY;
        const startX = p.x;
        const startY = p.y;

        // Swept collision: test the whole segment travelled this frame, so fast
        // bullets at high game speed or low FPS cannot jump over a zombie.
        let hitZombie = null;
        let hitT = Infinity;
        for (const z of state.zombies) {
            if (z.hp <= 0) continue;
            const tParam = stepLen2 > 0
                ? Math.max(0, Math.min(1, ((z.x - startX) * stepX + (z.y - startY) * stepY) / stepLen2))
                : 0;
            const cx = startX + stepX * tParam;
            const cy = startY + stepY * tParam;
            if (Math.hypot(z.x - cx, z.y - cy) <= z.radius + p.radius && tParam < hitT) {
                hitT = tParam;
                hitZombie = z;
            }
        }

        const moveT = hitZombie ? hitT : 1;
        p.x = startX + stepX * moveT;
        p.y = startY + stepY * moveT;
        p.traveled += Math.sqrt(stepLen2) * moveT;

        if (!hitZombie && (p.traveled >= p.maxDist || p.x < -30 || p.x > CANVAS_W + 30 || p.y < -30 || p.y > CANVAS_H + 30)) {
            state.projectiles.splice(i, 1);
            continue;
        }

        if (hitZombie) {
            if (p.splash > 0) {
                SoundFX.explode();
                spawnParticles(p.x, p.y, p.slow > 0 ? '#38bdf8' : '#f97316', 14, 115);
                for (const z of state.zombies) {
                    if (z.hp > 0 && Math.hypot(z.x - p.x, z.y - p.y) <= p.splash + z.radius) {
                        damageZombie(z, p.damage, { slow: p.slow, burn: p.burn });
                    }
                }
            } else {
                spawnParticles(p.x, p.y, p.color, 5, 65);
                damageZombie(hitZombie, p.damage, { slow: p.slow, burn: p.burn });
            }
            state.projectiles.splice(i, 1);
        }
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
            state.particles.splice(i, 1);
            continue;
        }
        if (!pt.isLightning && !pt.isShockwave) {
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vx *= 0.94;
            pt.vy *= 0.94;
        }
    }

    // Update floating texts
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.life -= dt;
        ft.y -= 28 * dt;
        if (ft.life <= 0) {
            state.floatingTexts.splice(i, 1);
        }
    }

    // Check wave completion
    if (state.waveActive && state.spawnQueue.length === 0 && state.zombies.length === 0) {
        state.waveActive = false;
        updateBossHUD();
        const diff = DIFFICULTIES[state.selectedDiff];
        let waveBonus = Math.round((28 + state.wave * 4) * diff.rewardMult);
        for (const b of state.buildings) {
            if (b.id === 'mine') {
                waveBonus += getBuildingIncome(b);
            }
        }
        state.money += waveBonus;
        showToast(t().toasts.waveCleared(state.wave, waveBonus));
        updateHUD();
        renderShopLists();
        updateUpgradePanel();

        if (state.wave >= getMaxWaves()) {
            triggerVictory();
            return;
        }

        // Counted down in the game loop (not setTimeout) so it pauses with the
        // game and cannot leak into a new match.
        state.autoWaveTimer = 0.9;
    }
}

function renderGame(timeSec) {
    // The world is drawn into a low-resolution pixel art canvas, then scaled up
    // without smoothing. Text is queued and drawn crisp at full resolution.
    const pc = PixelArt.beginFrame();
    const map = MAPS[state.selectedMap];
    drawMapBackground(pc, map, timeSec);

    // Natural obstacles
    for (const obs of state.obstacles) {
        const selected = !!(state.selectedObstacle && state.selectedObstacle.id === obs.id);
        drawObstacleWorld(pc, obs, selected, timeSec);
    }

    // Road mines
    for (const mine of state.roadMines) {
        drawRoadMineWorld(pc, mine, timeSec);
    }

    // Range / aura area for hovered or selected tower/building
    const activeTank = state.selectedTower || state.hoverTower;
    if (activeTank) {
        const stats = getTankStats(activeTank);
        drawRangeArea(pc, activeTank.x, activeTank.y, stats.range, 'rgba(250, 204, 21, 0.14)', 'rgba(250, 204, 21, 0.9)', timeSec);
    }

    if (state.selectedBuilding) {
        const b = state.selectedBuilding;
        const bDef = BUILDING_DEFS.find(d => d.id === b.id);
        if (bDef.range > 0) {
            const auraR = bDef.range + (b.level - 1) * 14;
            drawRangeArea(pc, b.x, b.y, auraR, 'rgba(56, 189, 248, 0.14)', 'rgba(56, 189, 248, 0.9)', timeSec);
        }
    }

    for (const b of state.buildings) {
        drawBuildingWorld(pc, b, timeSec, false);
    }

    for (const tk of state.tanks) {
        drawTankWorld(pc, tk, false);
    }

    // Zombies sorted by Y for natural depth
    const sortedZombies = [...state.zombies].sort((a, b) => a.y - b.y);
    for (const z of sortedZombies) {
        drawZombieWorld(pc, z, timeSec);
    }

    for (const p of state.projectiles) {
        drawProjectileWorld(pc, p);
    }

    for (const pt of state.particles) {
        drawParticleWorld(pc, pt);
    }

    // Placement ghost preview
    const previewPos = state.touchPreviewPos || state.hoverPos;
    if (state.placingItem && previewPos) {
        const { x, y } = previewPos;
        const pItem = state.placingItem;
        let valid = false;
        let previewRange = 0;

        if (pItem.kind === 'tank') {
            valid = canPlaceAt(x, y);
            const def = TANK_DEFS.find(d => d.id === pItem.id);
            previewRange = Math.round(def.range * (1 + getTechLevel('tech_optics') * 0.08));
        } else if (pItem.kind === 'building') {
            valid = canPlaceAt(x, y);
            const bDef = BUILDING_DEFS.find(d => d.id === pItem.id);
            previewRange = bDef.range;
        } else if (pItem.kind === 'ability') {
            if (pItem.id === 'mine') {
                valid = distanceToRoad(x, y) <= map.roadWidth * 0.55;
                previewRange = 72;
            } else if (pItem.id === 'airstrike') {
                valid = true;
                previewRange = 115;
            }
        }

        if (previewRange > 0) {
            drawRangeArea(
                pc, x, y, previewRange,
                valid ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.22)',
                valid ? '#22c55e' : '#ef4444',
                timeSec
            );
        }

        if (pItem.kind === 'tank') {
            drawTankWorld(pc, { id: pItem.id, level: 1, angle: 0, x, y }, true);
        } else if (pItem.kind === 'building') {
            drawBuildingWorld(pc, { id: pItem.id, level: 1, x, y }, timeSec, true);
        } else if (pItem.id === 'mine') {
            drawRoadMineWorld(pc, { x, y }, timeSec);
        } else {
            drawCrosshairWorld(pc, x, y, timeSec);
        }
    }

    drawWeatherOverlay(pc);

    // Floating damage / gold texts, drawn crisp at full resolution
    for (const ft of state.floatingTexts) {
        const alpha = Math.max(0, ft.life / ft.maxLife);
        PixelArt.queueLabel(ft.text, ft.x, ft.y, { color: ft.color, alpha, size: 13 });
    }

    PixelArt.present(ctx);
}

let lastTimestamp = performance.now();

function mainLoop(now) {
    const rawDt = Math.min(0.05, Math.max(0, (now - lastTimestamp) / 1000));
    lastTimestamp = now;

    try {
        updateGame(rawDt);
    } catch (err) {
        console.error('Error in updateGame:', err);
    }

    try {
        renderGame(now / 1000);
    } catch (err) {
        console.error('Error in renderGame:', err);
    }

    requestAnimationFrame(mainLoop);
}

// Expose globally and on window.Game namespace
window.canvas = canvas;
window.ctx = ctx;
window.resizeCanvas = resizeCanvas;
window.clientToGameCoords = clientToGameCoords;
window.startNewMatch = startNewMatch;
window.triggerGameOver = triggerGameOver;
window.triggerVictory = triggerVictory;
window.updateGame = updateGame;
window.renderGame = renderGame;
window.mainLoop = mainLoop;

window.Game = window.Game || {};
window.Game.Controllers = window.Game.Controllers || {};
window.Game.Controllers.Game = {
    canvas,
    ctx,
    resizeCanvas,
    clientToGameCoords,
    startNewMatch,
    triggerGameOver,
    triggerVictory,
    updateGame,
    renderGame,
    mainLoop
};
