/* ==========================================
 * Tanks Vs. Zombie - Input Controller (Controls, Placement & Interactions)
 * Controller
 * ========================================== */

function deselectAll() {
    state.selectedTower = null;
    state.selectedBuilding = null;
    state.selectedObstacle = null;
    updateUpgradePanel();
}

function enterPlacementMode(item) {
    deselectAll();
    state.placingItem = item;
    state.touchPreviewPos = null; // Do not auto-place on the map; user chooses position freely

    const isMobile = window.innerWidth < 1024;
    const bar = document.getElementById('touch-confirm-bar');
    const titleEl = document.getElementById('touch-confirm-title');
    const tr = t();

    if (titleEl) {
        if (item.kind === 'tank') titleEl.textContent = tr.tanks[item.id].name;
        else if (item.kind === 'building') titleEl.textContent = tr.buildings[item.id].name;
        else titleEl.textContent = item.id === 'mine' ? tr.mineTitle : tr.airstrikeTitle;
    }

    if (isMobile) {
        if (bar) bar.classList.remove('hidden');
    } else {
        if (bar) bar.classList.add('hidden');
    }

    renderShopLists();
}

function exitPlacementMode() {
    state.placingItem = null;
    state.touchPreviewPos = null;
    const bar = document.getElementById('touch-confirm-bar');
    if (bar) bar.classList.add('hidden');
    renderShopLists();
}

function tryCommitPlacement(x, y) {
    const pItem = state.placingItem;
    if (!pItem) return false;
    const tr = t();
    if (pItem.kind === 'tank' || pItem.kind === 'building') ({ x, y } = snapPlacement(x, y));

    if (pItem.kind === 'tank') {
        if (state.money < pItem.cost) {
            showToast(tr.toasts.notEnoughGold);
            return false;
        }
        if (!canPlaceAt(x, y)) {
            showToast(tr.toasts.cantBuildHere);
            return false;
        }
        state.money -= pItem.cost;
        state.tanks.push({
            id: pItem.id,
            x,
            y,
            level: 1,
            angle: 0,
            cooldown: 0,
            priority: 'first',
            totalInvested: pItem.cost,
            upgradeFlash: 0
        });
        SoundFX.build();
        spawnParticles(x, y, '#facc15', 12, 95);
        exitPlacementMode();
        updateHUD();
        renderShopLists();
        return true;
    }

    if (pItem.kind === 'building') {
        if (state.money < pItem.cost) {
            showToast(tr.toasts.notEnoughGold);
            return false;
        }
        if (!canPlaceAt(x, y)) {
            showToast(tr.toasts.cantBuildHere);
            return false;
        }
        state.money -= pItem.cost;
        state.buildings.push({
            id: pItem.id,
            x,
            y,
            level: 1,
            totalInvested: pItem.cost
        });
        SoundFX.build();
        spawnParticles(x, y, '#38bdf8', 12, 95);
        exitPlacementMode();
        updateHUD();
        renderShopLists();
        return true;
    }

    if (pItem.kind === 'ability') {
        if (state.money < pItem.cost) {
            showToast(tr.toasts.notEnoughGold);
            return false;
        }
        if (pItem.id === 'mine') {
            if (distanceToRoad(x, y) > MAPS[state.selectedMap].roadWidth * 0.55) {
                showToast(tr.toasts.placeOnRoad);
                return false;
            }
            state.money -= pItem.cost;
            state.roadMines.push({ x, y, damage: 220 + state.wave * 24 });
            state.abilityCooldowns.mine = 14;
            SoundFX.build();
            exitPlacementMode();
            updateHUD();
            renderShopLists();
            return true;
        }
        if (pItem.id === 'airstrike') {
            state.money -= pItem.cost;
            triggerAirstrike(x, y);
            state.abilityCooldowns.airstrike = 22;
            exitPlacementMode();
            updateHUD();
            renderShopLists();
            return true;
        }
    }
    return false;
}

function handleMapTapOrClick(x, y) {
    if (state.placingItem) {
        if (window.innerWidth < 1024) {
            state.touchPreviewPos = { x, y };
            const bar = document.getElementById('touch-confirm-bar');
            if (bar) bar.classList.remove('hidden');
            return;
        }
        tryCommitPlacement(x, y);
        return;
    }

    // 1. Check tanks
    for (const tk of state.tanks) {
        if (isInsideFootprint(x, y, tk.x, tk.y)) {
            state.selectedTower = tk;
            state.selectedBuilding = null;
            state.selectedObstacle = null;
            updateUpgradePanel();
            return;
        }
    }

    // 2. Check buildings
    for (const b of state.buildings) {
        if (isInsideFootprint(x, y, b.x, b.y)) {
            state.selectedBuilding = b;
            state.selectedTower = null;
            state.selectedObstacle = null;
            updateUpgradePanel();
            return;
        }
    }

    // 3. Check clearable natural obstacles
    for (const obs of state.obstacles) {
        if (Math.hypot(x - obs.x, y - obs.y) <= obs.r + 8) {
            state.selectedObstacle = obs;
            state.selectedTower = null;
            state.selectedBuilding = null;
            updateUpgradePanel();
            return;
        }
    }

    deselectAll();
}

function upgradeSelected() {
    if (state.selectedTower) {
        const tk = state.selectedTower;
        if (tk.level >= 5) return;
        const cost = getUpgradeCost(tk, false);
        if (state.money < cost) {
            showToast(t().toasts.notEnoughGold);
            return;
        }
        state.money -= cost;
        tk.level += 1;
        tk.totalInvested += cost;
        tk.upgradeFlash = 1.0;
        SoundFX.upgrade();
        spawnParticles(tk.x, tk.y, '#facc15', 14, 105);
        updateHUD();
        renderShopLists();
        updateUpgradePanel();
        return;
    }

    if (state.selectedBuilding) {
        const b = state.selectedBuilding;
        if (b.level >= 5) return;
        const cost = getUpgradeCost(b, true);
        if (state.money < cost) {
            showToast(t().toasts.notEnoughGold);
            return;
        }
        state.money -= cost;
        b.level += 1;
        b.totalInvested += cost;
        SoundFX.upgrade();
        spawnParticles(b.x, b.y, '#38bdf8', 14, 105);
        updateHUD();
        renderShopLists();
        updateUpgradePanel();
    }
}

function sellSelected() {
    if (state.selectedTower) {
        const tk = state.selectedTower;
        const refund = Math.round(tk.totalInvested * 0.7);
        state.money += refund;
        state.tanks = state.tanks.filter(item => item !== tk);
        SoundFX.sell();
        spawnFloatingText(tk.x, tk.y, `+${refund} 🪙`, '#facc15');
        deselectAll();
        updateHUD();
        renderShopLists();
        return;
    }

    if (state.selectedBuilding) {
        const b = state.selectedBuilding;
        const refund = Math.round(b.totalInvested * 0.7);
        state.money += refund;
        state.buildings = state.buildings.filter(item => item !== b);
        SoundFX.sell();
        spawnFloatingText(b.x, b.y, `+${refund} 🪙`, '#facc15');
        deselectAll();
        updateHUD();
        renderShopLists();
    }
}

function clearSelectedObstacle() {
    const obs = state.selectedObstacle;
    if (!obs) return;
    if (state.money < OBSTACLE_CLEAR_COST) {
        showToast(t().toasts.notEnoughGold);
        return;
    }
    state.money -= OBSTACLE_CLEAR_COST;
    const obsName = t().obstacles[obs.type] || obs.type;
    state.obstacles = state.obstacles.filter(o => o.id !== obs.id);
    SoundFX.build();
    spawnParticles(obs.x, obs.y, '#a16207', 14, 105);
    showToast(t().toasts.obstacleCleared(obsName, OBSTACLE_CLEAR_COST));
    deselectAll();
    updateHUD();
    renderShopLists();
}

function updateTouchPreview(touch) {
    const pos = clientToGameCoords(touch.clientX, touch.clientY);
    state.touchPreviewPos = pos;
    const bar = document.getElementById('touch-confirm-bar');
    const titleEl = document.getElementById('touch-confirm-title');
    const tr = t();
    if (state.placingItem) {
        if (state.placingItem.kind === 'tank') titleEl.textContent = tr.tanks[state.placingItem.id].name;
        else if (state.placingItem.kind === 'building') titleEl.textContent = tr.buildings[state.placingItem.id].name;
        else titleEl.textContent = state.placingItem.id === 'mine' ? tr.mineTitle : tr.airstrikeTitle;
        bar.classList.remove('hidden');
    }
}

function setupInputEventListeners() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    document.getElementById('btn-lang-sv').addEventListener('click', () => {
        currentLang = 'sv';
        localStorage.setItem('tvz_lang', 'sv');
        renderStartMenu();
        updateHUD();
        renderShopLists();
        updateUpgradePanel();
    });
    
    document.getElementById('btn-lang-en').addEventListener('click', () => {
        currentLang = 'en';
        localStorage.setItem('tvz_lang', 'en');
        renderStartMenu();
        updateHUD();
        renderShopLists();
        updateUpgradePanel();
    });
    
    document.querySelectorAll('.map-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.matchStarted) return;
            state.selectedMap = btn.dataset.map;
            state.gameMode = state.selectedMap === 'maze' ? 'maze' : 'original';
            renderStartMenu();
            updateHUD();
        });
    });
    
    document.querySelectorAll('.diff-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.matchStarted) return;
            state.selectedDiff = btn.dataset.diff;
            renderStartMenu();
        });
    });
    
    document.getElementById('btn-start-match').addEventListener('click', startNewMatch);
    document.getElementById('btn-restart').addEventListener('click', startNewMatch);
    document.getElementById('btn-vic-restart').addEventListener('click', startNewMatch);
    
    document.getElementById('btn-open-menu').addEventListener('click', () => {
        state.paused = true;
        renderStartMenu();
        document.getElementById('start-menu-modal').classList.remove('hidden');
    });
    
    document.getElementById('btn-resume-game').addEventListener('click', () => {
        if (!state.matchStarted) return;
        state.paused = false;
        document.getElementById('start-menu-modal').classList.add('hidden');
    });
    
    document.getElementById('btn-abort-match').addEventListener('click', () => {
        state.matchStarted = false;
        state.paused = true;
        state.waveActive = false;
        exitPlacementMode();
        deselectAll();
        document.getElementById('boss-hud').classList.add('hidden');
        renderStartMenu();
    });
    
    document.getElementById('btn-go-menu').addEventListener('click', () => {
        state.matchStarted = false;
        document.getElementById('gameover-modal').classList.add('hidden');
        renderStartMenu();
        document.getElementById('start-menu-modal').classList.remove('hidden');
    });
    
    document.getElementById('btn-vic-menu').addEventListener('click', () => {
        state.matchStarted = false;
        document.getElementById('victory-modal').classList.add('hidden');
        renderStartMenu();
        document.getElementById('start-menu-modal').classList.remove('hidden');
    });
    
    document.getElementById('btn-speed').addEventListener('click', () => {
        state.speedMult = state.speedMult === 1 ? 2 : state.speedMult === 2 ? 3 : 1;
        updateHUD();
    });
    
    document.getElementById('btn-sound').addEventListener('click', () => {
        const on = SoundFX.toggle();
        const btn = document.getElementById('btn-sound');
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.innerHTML = `<span aria-hidden="true">${on ? '🔊' : '🔇'}</span>`;
    });
    
    document.getElementById('btn-auto-wave').addEventListener('click', () => {
        state.autoWave = !state.autoWave;
        document.getElementById('btn-auto-wave').setAttribute('aria-pressed', state.autoWave ? 'true' : 'false');
        updateHUD();
        if (state.autoWave && !state.waveActive && !state.paused && state.matchStarted) {
            startNextWave();
        }
    });
    
    document.getElementById('btn-start-wave').addEventListener('click', startNextWave);
    
    document.getElementById('btn-ability-mine').addEventListener('click', () => {
        const tr = t();
        if (getTechLevel('tech_roadmine') <= 0) {
            showToast(tr.toasts.researchFirst);
            return;
        }
        if (!state.unlockedAbilities.mine) {
            if (state.money < 90) {
                showToast(tr.toasts.notEnoughGold);
                return;
            }
            state.money -= 90;
            state.unlockedAbilities.mine = true;
            SoundFX.build();
            showToast(tr.toasts.abilityUnlocked(tr.mineTitle));
            updateHUD();
            return;
        }
        if (state.abilityCooldowns.mine > 0) {
            showToast(tr.toasts.onCooldown(Math.ceil(state.abilityCooldowns.mine)));
            return;
        }
        if (state.money < 45) {
            showToast(tr.toasts.notEnoughGold);
            return;
        }
        enterPlacementMode({ kind: 'ability', id: 'mine', cost: 45 });
    });
    
    document.getElementById('btn-ability-airstrike').addEventListener('click', () => {
        const tr = t();
        if (getTechLevel('tech_airstrike') <= 0) {
            showToast(tr.toasts.researchFirst);
            return;
        }
        if (!state.unlockedAbilities.airstrike) {
            if (state.money < 140) {
                showToast(tr.toasts.notEnoughGold);
                return;
            }
            state.money -= 140;
            state.unlockedAbilities.airstrike = true;
            SoundFX.build();
            showToast(tr.toasts.abilityUnlocked(tr.airstrikeTitle));
            updateHUD();
            return;
        }
        if (state.abilityCooldowns.airstrike > 0) {
            showToast(tr.toasts.onCooldown(Math.ceil(state.abilityCooldowns.airstrike)));
            return;
        }
        if (state.money < 85) {
            showToast(tr.toasts.notEnoughGold);
            return;
        }
        enterPlacementMode({ kind: 'ability', id: 'airstrike', cost: 85 });
    });
    document.getElementById('btn-close-upgrade').addEventListener('click', deselectAll);
    document.getElementById('btn-upgrade').addEventListener('click', upgradeSelected);
    document.getElementById('btn-sell').addEventListener('click', sellSelected);
    document.getElementById('btn-clear-obstacle').addEventListener('click', clearSelectedObstacle);
    
    document.getElementById('btn-cycle-priority').addEventListener('click', () => {
        if (!state.selectedTower) return;
        const order = ['first', 'strong', 'close'];
        const cur = state.selectedTower.priority || 'first';
        state.selectedTower.priority = order[(order.indexOf(cur) + 1) % order.length];
        updateUpgradePanel();
    });
    
    // Touch placement confirm/cancel bar
    document.getElementById('btn-touch-cancel').addEventListener('click', exitPlacementMode);
    document.getElementById('btn-touch-confirm').addEventListener('click', () => {
        if (state.placingItem) {
            if (!state.touchPreviewPos) {
                showToast(currentLang === 'en' ? 'Tap the map to choose a position' : 'Tryck på kartan för att välja plats');
                return;
            }
            tryCommitPlacement(state.touchPreviewPos.x, state.touchPreviewPos.y);
        }
    });
    
    // Mouse interactions on canvas
    canvas.addEventListener('mousemove', (e) => {
        const pos = clientToGameCoords(e.clientX, e.clientY);
        state.hoverPos = pos;
        state.hoverTower = state.tanks.find(tk => isInsideFootprint(pos.x, pos.y, tk.x, tk.y)) || null;
    });
    
    canvas.addEventListener('mouseleave', () => {
        state.hoverPos = null;
        state.hoverTower = null;
    });
    
    canvas.addEventListener('click', (e) => {
        const pos = clientToGameCoords(e.clientX, e.clientY);
        handleMapTapOrClick(pos.x, pos.y);
    });
    
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (state.placingItem) exitPlacementMode();
        else deselectAll();
    });

    canvas.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        e.preventDefault();
        const touch = e.touches[0];
        if (state.placingItem) {
            updateTouchPreview(touch);
        } else {
            const pos = clientToGameCoords(touch.clientX, touch.clientY);
            handleMapTapOrClick(pos.x, pos.y);
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!state.placingItem || !e.touches || e.touches.length === 0) return;
        e.preventDefault();
        updateTouchPreview(e.touches[0]);
    }, { passive: false });
    
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.placingItem) exitPlacementMode();
            else if (state.selectedTower || state.selectedBuilding || state.selectedObstacle) deselectAll();
        } else if ((e.key === 'u' || e.key === 'U') && !state.paused) {
            upgradeSelected();
        } else if ((e.key === 's' || e.key === 'S') && !state.paused) {
            sellSelected();
        }
    });
}

// Expose globally and on window.Game namespace
window.deselectAll = deselectAll;
window.enterPlacementMode = enterPlacementMode;
window.exitPlacementMode = exitPlacementMode;
window.tryCommitPlacement = tryCommitPlacement;
window.handleMapTapOrClick = handleMapTapOrClick;
window.upgradeSelected = upgradeSelected;
window.sellSelected = sellSelected;
window.clearSelectedObstacle = clearSelectedObstacle;
window.updateTouchPreview = updateTouchPreview;
window.setupInputEventListeners = setupInputEventListeners;

window.Game = window.Game || {};
window.Game.Controllers = window.Game.Controllers || {};
window.Game.Controllers.Input = {
    deselectAll,
    enterPlacementMode,
    exitPlacementMode,
    tryCommitPlacement,
    handleMapTapOrClick,
    upgradeSelected,
    sellSelected,
    clearSelectedObstacle,
    updateTouchPreview,
    setupInputEventListeners
};
