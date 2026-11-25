/* ==========================================
 * Tanks Vs. Zombie - UI View (HUD, Modals, Tech Tree & Shop)
 * View
 * ========================================== */

function updateBossHUD() {
    const bossHud = document.getElementById('boss-hud');
    if (!bossHud) return;
    const activeBoss = state.zombies.find(z => z.type === 'boss' && z.hp > 0);
    if (!activeBoss || !state.waveActive || state.gameOver || state.victory) {
        bossHud.classList.add('hidden');
        return;
    }
    bossHud.classList.remove('hidden');
    const cur = Math.max(0, Math.ceil(activeBoss.hp));
    const max = Math.ceil(activeBoss.maxHp);
    document.getElementById('boss-hp-text').textContent = `${cur} / ${max}`;
    document.getElementById('boss-hp-fill').style.width = `${Math.max(0, Math.min(100, (cur / max) * 100))}%`;
}

let toastTimeout = null;
function showToast(msg) {
    const el = document.getElementById('toast-msg');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.add('hidden'), 2400);
}

function applyStaticTranslations() {
    const tr = t();
    document.documentElement.lang = currentLang;
    document.getElementById('skip-to-game-link').textContent = tr.skipToGame;
    document.getElementById('lbl-menu-tech').textContent = tr.menuAndTech;
    document.getElementById('sr-lives-label').textContent = tr.srLives;
    document.getElementById('sr-money-label').textContent = tr.srMoney;
    document.getElementById('sr-stars-label').textContent = tr.srStars;
    document.getElementById('lbl-wave-prefix').textContent = tr.wavePrefix;
    document.getElementById('lbl-wave-middle').textContent = tr.waveMiddle;
    document.getElementById('lbl-auto-prefix').textContent = tr.autoPrefix;
    document.getElementById('lbl-boss-hud').textContent = tr.bossHudTitle;
    document.getElementById('lbl-next-wave').textContent = tr.nextWave;
    const lblNextWaveBar = document.getElementById('lbl-next-wave-bar');
    if (lblNextWaveBar) lblNextWaveBar.textContent = tr.nextWave;
    document.getElementById('touch-confirm-sub').textContent = tr.touchConfirmSub;
    document.getElementById('lbl-touch-cancel').textContent = tr.touchCancel;
    document.getElementById('lbl-touch-confirm').textContent = tr.touchConfirm;
    document.getElementById('lbl-deselect-btn').textContent = tr.deselectBtn;
    document.getElementById('lbl-goal').textContent = tr.goalLabel;
    document.getElementById('lbl-upgrade-btn').textContent = tr.upgradeBtn;
    document.getElementById('lbl-sell-btn').textContent = tr.sellBtn;
    document.getElementById('lbl-tactical-title').textContent = tr.tacticalTitle;
    document.getElementById('lbl-tactical-sub').textContent = tr.tacticalSub;
    document.getElementById('title-mine').textContent = tr.mineTitle;
    document.getElementById('title-airstrike').textContent = tr.airstrikeTitle;
    document.getElementById('lbl-tank-factory').textContent = tr.tankFactory;
    document.getElementById('lbl-buildings-title').textContent = tr.buildingsTitle;
    document.getElementById('lbl-guide-title').textContent = tr.guideTitle;
    document.getElementById('lbl-guide-1').innerHTML = tr.guide1;
    document.getElementById('lbl-guide-2').innerHTML = tr.guide2;
    document.getElementById('lbl-guide-3').innerHTML = tr.guide3;
    document.getElementById('lbl-guide-save').innerHTML = tr.guideSave;

    document.getElementById('lbl-menu-subtitle').textContent = tr.menuSubtitle;
    document.getElementById('lbl-tech-stars-header').textContent = tr.techStarsHeader;
    document.getElementById('menu-match-locked-notice').textContent = tr.matchLockedNotice;
    document.getElementById('heading-step-1').textContent = tr.step1;
    document.getElementById('heading-step-2').textContent = tr.step2;
    document.getElementById('lbl-exclusive-title').textContent = tr.exclusiveTitle;
    document.getElementById('lbl-exclusive-box').innerHTML = tr.exclusiveBox;
    document.getElementById('lbl-save-notice-title').textContent = tr.saveNoticeTitle;
    document.getElementById('lbl-save-notice-body').innerHTML = tr.saveNoticeBody;
    document.getElementById('lbl-tech-tree-title').textContent = tr.techTreeTitle;
    document.getElementById('lbl-saved-local').textContent = tr.savedLocal;
    document.getElementById('lbl-abort-btn').textContent = tr.abortBtn;
    document.getElementById('lbl-resume-btn').textContent = tr.resumeBtn;
    document.getElementById('btn-start-match-label').textContent = tr.startNewMatch;

    ['meadow', 'desert', 'winter', 'maze'].forEach(m => {
        const nameEl = document.getElementById(`map-name-${m}`);
        const wavesEl = document.getElementById(`map-waves-${m}`);
        const descEl = document.getElementById(`map-desc-${m}`);
        if (nameEl && tr.maps[m]) nameEl.textContent = tr.maps[m].name;
        if (wavesEl && tr.maps[m]) wavesEl.textContent = tr.maps[m].waves;
        if (descEl && tr.maps[m]) descEl.textContent = tr.maps[m].desc;
    });

    ['easy', 'normal', 'hard'].forEach(d => {
        document.getElementById(`diff-name-${d}`).textContent = tr.diffs[d].name;
        document.getElementById(`diff-desc-${d}`).innerHTML = tr.diffs[d].desc;
    });

    document.getElementById('gameover-title').textContent = tr.gameOver.title;
    document.getElementById('gameover-sub').textContent = tr.gameOver.sub;
    document.getElementById('lbl-go-waves').textContent = tr.gameOver.waves;
    document.getElementById('lbl-go-kills').textContent = tr.gameOver.kills;
    document.getElementById('lbl-go-stars').textContent = tr.gameOver.stars;
    document.getElementById('lbl-go-menu').textContent = tr.menuAndTech;
    document.getElementById('lbl-go-restart').textContent = tr.gameOver.restart;

    document.getElementById('victory-title').textContent = tr.victory.title;
    document.getElementById('victory-sub').textContent = tr.victory.sub;
    document.getElementById('lbl-vic-waves').textContent = tr.victory.waves;
    document.getElementById('lbl-vic-kills').textContent = tr.victory.kills;
    document.getElementById('lbl-vic-stars').textContent = tr.victory.stars;
    document.getElementById('lbl-vic-menu').textContent = tr.menuAndTech;
    document.getElementById('lbl-vic-restart').textContent = tr.victory.restart;
}

function updateHUD() {
    const tr = t();
    const maxW = getMaxWaves();
    document.getElementById('ui-lives').textContent = state.lives;
    document.getElementById('ui-money').textContent = state.money;
    document.getElementById('ui-stars').textContent = meta.techStars;
    document.getElementById('menu-stars').textContent = meta.techStars;
    document.getElementById('ui-wave').textContent = state.wave;
    document.getElementById('ui-max-wave').textContent = maxW;
    document.getElementById('ui-speed').textContent = `${state.speedMult}x`;
    document.getElementById('ui-auto-wave').textContent = state.autoWave ? 'ON' : 'OFF';
    document.getElementById('hud-map-label').textContent = `${tr.maps[state.selectedMap].name} • ${tr.diffs[state.selectedDiff].name.replace(/^[^\s]+\s/, '')}`;

    const nextW = Math.min(maxW, state.wave + 1);
    const waveDesc = describeWave(nextW);
    const wavePreview = document.getElementById('wave-preview-text');
    if (wavePreview) wavePreview.textContent = waveDesc;
    const wavePreviewBar = document.getElementById('wave-preview-text-bar');
    if (wavePreviewBar) wavePreviewBar.textContent = waveDesc;

    const waveBtn = document.getElementById('btn-start-wave');
    const waveBtnText = document.getElementById('btn-wave-text');
    waveBtn.classList.remove('boss-btn-pulse', 'bg-red-500', 'text-white', 'bg-lime-400', 'text-stone-950');

    if (state.waveActive) {
        waveBtn.disabled = true;
        waveBtn.classList.add('bg-lime-400', 'text-stone-950');
        waveBtnText.textContent = tr.waveActive(state.wave);
    } else {
        waveBtn.disabled = false;
        if (nextW % 7 === 0) {
            waveBtn.classList.add('bg-red-500', 'text-white', 'boss-btn-pulse');
            waveBtnText.textContent = tr.bossWaveBtn(nextW);
        } else {
            waveBtn.classList.add('bg-lime-400', 'text-stone-950');
            waveBtnText.textContent = tr.startWave(nextW);
        }
    }

    // Abilities UI
    const mineResearched = getTechLevel('tech_roadmine') > 0;
    const airResearched = getTechLevel('tech_airstrike') > 0;

    document.getElementById('icon-mine').textContent = !mineResearched ? '🔒' : '🧨';
    document.getElementById('cd-mine').textContent = !mineResearched
        ? tr.researchReq
        : !state.unlockedAbilities.mine
        ? tr.unlockBtnShort(90)
        : state.abilityCooldowns.mine > 0
        ? `${Math.ceil(state.abilityCooldowns.mine)}s`
        : tr.readyCost(45);

    document.getElementById('icon-airstrike').textContent = !airResearched ? '🔒' : '✈️';
    document.getElementById('cd-airstrike').textContent = !airResearched
        ? tr.researchReq
        : !state.unlockedAbilities.airstrike
        ? tr.unlockBtnShort(140)
        : state.abilityCooldowns.airstrike > 0
        ? `${Math.ceil(state.abilityCooldowns.airstrike)}s`
        : tr.readyCost(85);
}

function renderTechTreeGrid() {
    const tr = t();
    const grid = document.getElementById('tech-tree-grid');
    grid.innerHTML = '';

    const categories = ['tanks', 'economy', 'abilities'];
    for (const catKey of categories) {
        const section = document.createElement('div');
        section.className = 'bg-amber-50/90 border-2 border-stone-800 rounded-2xl p-2.5';

        const header = document.createElement('h4');
        header.className = 'cartoon-font text-xs sm:text-sm font-bold text-stone-950 mb-2 pb-1 border-b border-stone-300';
        header.textContent = tr.techCategories[catKey];
        section.appendChild(header);

        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2';

        const nodes = TECH_NODES.filter(n => n.category === catKey);
        for (const node of nodes) {
            const lvl = getTechLevel(node.id);
            const maxed = lvl >= node.maxLevel;
            const reqMet = !node.req || getTechLevel(node.req) > 0;
            const canAfford = meta.techStars >= node.cost;
            const info = tr.tech[node.id];

            const card = document.createElement('div');
            card.className = 'bg-white border-2 border-stone-900 rounded-2xl p-2.5 flex flex-col justify-between gap-2 shadow-sm';

            const topRow = document.createElement('div');
            topRow.className = 'flex items-center justify-between gap-1.5';

            const titleWrap = document.createElement('div');
            titleWrap.className = 'flex items-center gap-1.5 min-w-0';
            titleWrap.innerHTML = `<span class="text-base shrink-0">${node.icon}</span><span class="font-extrabold text-xs text-stone-950 truncate">${info.name}</span>`;

            const badge = document.createElement('span');
            badge.className = 'bg-purple-200 border border-purple-700 text-purple-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0';
            badge.textContent = tr.techLevelBadge(lvl, node.maxLevel);

            topRow.appendChild(titleWrap);
            topRow.appendChild(badge);
            card.appendChild(topRow);

            const desc = document.createElement('p');
            desc.className = 'text-[11px] font-semibold text-stone-700 leading-snug';
            desc.textContent = info.desc;
            if (!reqMet && node.req) {
                const reqText = document.createElement('span');
                reqText.className = 'block text-red-700 font-extrabold mt-0.5';
                reqText.textContent = tr.techRequires(tr.tech[node.req].name);
                desc.appendChild(reqText);
            }
            card.appendChild(desc);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cartoon-btn w-full py-1.5 px-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer';
            if (maxed) {
                btn.disabled = true;
                btn.classList.add('bg-emerald-200', 'text-emerald-950');
                btn.textContent = tr.techMaxed;
            } else if (!reqMet || state.matchStarted) {
                btn.disabled = true;
                btn.classList.add('bg-stone-200', 'text-stone-600');
                btn.textContent = tr.techLocked;
            } else if (!canAfford) {
                btn.disabled = true;
                btn.classList.add('bg-stone-200', 'text-stone-700');
                btn.innerHTML = `${BLUE_STAR_INLINE} <span>${tr.techResearch(node.cost)}</span>`;
            } else {
                btn.classList.add('bg-purple-300', 'hover:bg-purple-200', 'text-purple-950');
                btn.innerHTML = `${BLUE_STAR_INLINE} <span>${tr.techResearch(node.cost)}</span>`;
                btn.addEventListener('click', () => {
                    if (state.matchStarted || meta.techStars < node.cost || maxed || !reqMet) return;
                    meta.techStars -= node.cost;
                    meta.techLevels[node.id] = lvl + 1;
                    saveMeta();
                    SoundFX.upgrade();
                    renderStartMenu();
                    updateHUD();
                });
            }
            card.appendChild(btn);
            cardsGrid.appendChild(card);
        }

        section.appendChild(cardsGrid);
        grid.appendChild(section);
    }
}

function renderStartMenu() {
    applyStaticTranslations();

    const btnSv = document.getElementById('btn-lang-sv');
    const btnEn = document.getElementById('btn-lang-en');
    btnSv.classList.toggle('bg-amber-300', currentLang === 'sv');
    btnSv.classList.toggle('border-2', currentLang === 'sv');
    btnSv.classList.toggle('border-stone-900', currentLang === 'sv');
    btnSv.setAttribute('aria-pressed', currentLang === 'sv' ? 'true' : 'false');

    btnEn.classList.toggle('bg-amber-300', currentLang === 'en');
    btnEn.classList.toggle('border-2', currentLang === 'en');
    btnEn.classList.toggle('border-stone-900', currentLang === 'en');
    btnEn.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');

    const isMazeMode = state.selectedMap === 'maze';
    state.gameMode = isMazeMode ? 'maze' : 'original';
    const modePicker = document.getElementById('tvz-mode-picker');
    if (modePicker) {
        modePicker.querySelectorAll('[data-mode]').forEach(btn => {
            const isTarget = (btn.dataset.mode === 'maze') === isMazeMode;
            btn.classList.toggle('bg-lime-300', isTarget);
            btn.classList.toggle('bg-white', !isTarget);
            btn.disabled = state.matchStarted;
        });
    }

    document.querySelectorAll('.map-option').forEach(btn => {
        const isMazeCard = btn.dataset.map === 'maze';
        btn.classList.toggle('hidden', isMazeMode ? !isMazeCard : isMazeCard);
        const isAct = btn.dataset.map === state.selectedMap;
        btn.classList.toggle('active', isAct);
        btn.setAttribute('aria-checked', isAct ? 'true' : 'false');
        btn.disabled = state.matchStarted;
    });

    document.querySelectorAll('.diff-option').forEach(btn => {
        const isAct = btn.dataset.diff === state.selectedDiff;
        btn.classList.toggle('active', isAct);
        btn.setAttribute('aria-checked', isAct ? 'true' : 'false');
        btn.disabled = state.matchStarted;
    });

    document.getElementById('menu-match-locked-notice').classList.toggle('hidden', !state.matchStarted);
    document.getElementById('btn-resume-game').classList.toggle('hidden', !state.matchStarted);
    document.getElementById('btn-abort-match').classList.toggle('hidden', !state.matchStarted);

    renderTechTreeGrid();
}

function renderShopLists() {
    const tr = t();
    const tankContainer = document.getElementById('tank-shop-list');
    tankContainer.innerHTML = '';

    let unlockedCount = 0;
    for (const def of TANK_DEFS) {
        const researched = !def.techReq || getTechLevel(def.techReq) > 0;
        const unlocked = researched && !!state.unlockedTanks[def.id];
        if (unlocked) unlockedCount += 1;

        const isSelected = state.placingItem && state.placingItem.kind === 'tank' && state.placingItem.id === def.id;
        const info = tr.tanks[def.id];

        const card = document.createElement('button');
        card.type = 'button';
        card.className = `tank-card bg-white p-2 rounded-2xl text-left flex flex-col justify-between gap-1.5 cursor-pointer ${isSelected ? 'selected' : ''} ${!researched ? 'locked opacity-65 bg-stone-200' : ''}`;

        const top = document.createElement('div');
        top.className = 'flex items-center gap-2';

        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 38;
        miniCanvas.height = 38;
        miniCanvas.className = 'bg-emerald-100 rounded-xl border border-stone-700 shrink-0';
        const mCtx = miniCanvas.getContext('2d');
        mCtx.translate(19, 19);
        drawTankEntity(mCtx, { id: def.id, level: 1, angle: -0.3 }, 0.78, false);

        const textCol = document.createElement('div');
        textCol.className = 'min-w-0';
        textCol.innerHTML = `<div class="font-extrabold text-xs text-stone-950 truncate">${info.name}</div><div class="text-[10px] font-semibold text-stone-700 leading-tight line-clamp-2">${info.short}</div>`;

        top.appendChild(miniCanvas);
        top.appendChild(textCol);
        card.appendChild(top);

        const footer = document.createElement('div');
        footer.className = 'w-full';
        if (!researched) {
            footer.innerHTML = `<div class="w-full bg-purple-200 border border-purple-800 text-purple-950 text-[10px] font-extrabold py-1 px-2 rounded-lg text-center">${tr.shopTechTreeTag}</div><div class="text-[9px] text-center font-bold text-stone-600 mt-0.5">${tr.shopUnlockInMenu}</div>`;
        } else if (!unlocked) {
            footer.innerHTML = `<div class="w-full bg-amber-300 border border-stone-900 text-stone-950 text-[10px] font-extrabold py-1 px-2 rounded-lg text-center">${tr.shopUnlockBtn(def.unlockCost)}</div><div class="text-[10px] text-center font-bold text-stone-700 mt-0.5">${tr.shopBuildCost(def.cost)}</div>`;
        } else {
            const affordable = state.money >= def.cost;
            footer.innerHTML = `<div class="flex justify-end"><span class="${affordable ? 'bg-yellow-300 text-stone-950' : 'bg-stone-200 text-stone-500'} border border-stone-900 text-xs font-black px-2.5 py-0.5 rounded-full">🪙 ${def.cost}</span></div>`;
        }
        card.appendChild(footer);

        card.addEventListener('click', () => {
            if (isSelected) {
                exitPlacementMode();
                return;
            }
            if (!researched) {
                showToast(tr.toasts.researchFirst);
                return;
            }
            if (!unlocked) {
                if (state.money < def.unlockCost) {
                    showToast(tr.toasts.notEnoughGold);
                    return;
                }
                state.money -= def.unlockCost;
                state.unlockedTanks[def.id] = true;
                SoundFX.build();
                showToast(tr.toasts.unlockedItem(info.name));
                updateHUD();
                renderShopLists();
                return;
            }
            if (state.money < def.cost) {
                showToast(tr.toasts.notEnoughGold);
                return;
            }
            enterPlacementMode({ kind: 'tank', id: def.id, cost: def.cost });
        });

        tankContainer.appendChild(card);
    }
    document.getElementById('unlocked-tanks-badge').textContent = tr.unlockedBadge(unlockedCount, TANK_DEFS.length);

    // Buildings list
    const bContainer = document.getElementById('building-shop-list');
    bContainer.innerHTML = '';

    for (const bDef of BUILDING_DEFS) {
        const researched = !bDef.techReq || getTechLevel(bDef.techReq) > 0;
        const count = state.buildings.filter(b => b.id === bDef.id).length;
        const atMax = count >= bDef.maxCount;
        const isSelected = state.placingItem && state.placingItem.kind === 'building' && state.placingItem.id === bDef.id;
        const info = tr.buildings[bDef.id];

        const card = document.createElement('button');
        card.type = 'button';
        card.className = `tank-card bg-white p-1.5 rounded-2xl text-center flex flex-col items-center justify-between gap-1 cursor-pointer ${isSelected ? 'selected' : ''} ${!researched || atMax ? 'opacity-65 bg-stone-200' : ''}`;

        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 34;
        miniCanvas.height = 34;
        miniCanvas.className = 'bg-amber-100 rounded-xl border border-stone-700';
        const bCtx = miniCanvas.getContext('2d');
        bCtx.translate(17, 17);
        drawBuildingEntity(bCtx, { id: bDef.id, level: 1 }, 0.72, false);

        card.appendChild(miniCanvas);
        card.insertAdjacentHTML('beforeend', `<div class="font-extrabold text-[11px] text-stone-950 leading-tight">${info.name}</div><div class="text-[9px] font-semibold text-stone-700 leading-tight">${info.short}</div>`);

        const tag = document.createElement('div');
        tag.className = 'w-full mt-0.5';
        if (!researched) {
            tag.innerHTML = `<span class="block bg-purple-200 border border-purple-800 text-purple-950 text-[9px] font-extrabold py-0.5 px-1 rounded-md">🔒 Tech</span>`;
        } else if (atMax) {
            tag.innerHTML = `<span class="block bg-stone-300 border border-stone-700 text-stone-800 text-[9px] font-extrabold py-0.5 px-1 rounded-md">${tr.shopMaxPlaced}</span>`;
        } else {
            const affordable = state.money >= bDef.cost;
            tag.innerHTML = `<span class="inline-block ${affordable ? 'bg-yellow-300 text-stone-950' : 'bg-stone-200 text-stone-500'} border border-stone-900 text-[10px] font-black px-2 py-0.5 rounded-full">🪙 ${bDef.cost}</span>`;
        }
        card.appendChild(tag);

        card.addEventListener('click', () => {
            if (isSelected) {
                exitPlacementMode();
                return;
            }
            if (!researched) {
                showToast(tr.toasts.researchFirst);
                return;
            }
            if (atMax) {
                showToast(tr.toasts.maxBuildings(bDef.maxCount));
                return;
            }
            if (state.money < bDef.cost) {
                showToast(tr.toasts.notEnoughGold);
                return;
            }
            enterPlacementMode({ kind: 'building', id: bDef.id, cost: bDef.cost });
        });

        bContainer.appendChild(card);
    }

    const mineCnt = state.buildings.filter(b => b.id === 'mine').length;
    const radarCnt = state.buildings.filter(b => b.id === 'radar').length;
    const depotCnt = state.buildings.filter(b => b.id === 'depot').length;
    document.getElementById('mine-count-badge').textContent = tr.mineBadge(mineCnt, 1);
    document.getElementById('radar-count-badge').textContent = tr.radarBadge(radarCnt, 2);
    document.getElementById('depot-count-badge').textContent = tr.depotBadge(depotCnt, 2);
}

function updateUpgradePanel() {
    const tr = t();
    const panel = document.getElementById('upgrade-panel');
    const statsGrid = document.getElementById('sel-stats-grid');
    const prioRow = document.getElementById('priority-row');
    const btnUpgrade = document.getElementById('btn-upgrade');
    const btnSell = document.getElementById('btn-sell');
    const btnClearObs = document.getElementById('btn-clear-obstacle');
    const previewCanvas = document.getElementById('selected-tank-preview');
    const pCtx = previewCanvas.getContext('2d');
    pCtx.clearRect(0, 0, 44, 44);

    if (state.selectedObstacle) {
        const obs = state.selectedObstacle;
        panel.classList.remove('hidden');
        statsGrid.classList.add('hidden');
        prioRow.classList.add('hidden');
        btnUpgrade.classList.add('hidden');
        btnSell.classList.add('hidden');
        btnClearObs.classList.remove('hidden');

        pCtx.save();
        pCtx.translate(22, 24);
        pCtx.scale(0.85, 0.85);
        drawSingleObstacle(pCtx, { ...obs, x: 0, y: 0 });
        pCtx.restore();

        document.getElementById('sel-name').textContent = tr.obstacles[obs.type] || obs.type;
        document.getElementById('sel-level').textContent = tr.obstacleLevel;
        document.getElementById('sel-special').textContent = tr.obstacleDesc;
        document.getElementById('lbl-clear-obstacle-btn').textContent = tr.clearObstacleBtn(OBSTACLE_CLEAR_COST);
        btnClearObs.disabled = state.money < OBSTACLE_CLEAR_COST;
        resizeCanvas();
        return;
    }

    if (state.selectedBuilding) {
        const b = state.selectedBuilding;
        const bDef = BUILDING_DEFS.find(d => d.id === b.id);
        const info = tr.buildings[b.id];
        panel.classList.remove('hidden');
        statsGrid.classList.remove('hidden');
        prioRow.classList.add('hidden');
        btnUpgrade.classList.remove('hidden');
        btnSell.classList.remove('hidden');
        btnClearObs.classList.add('hidden');

        pCtx.save();
        pCtx.translate(22, 22);
        drawBuildingEntity(pCtx, b, 0.9, false);
        pCtx.restore();

        document.getElementById('sel-name').textContent = info.name;
        document.getElementById('sel-level').textContent = tr.levelLabel(b.level, 5);
        document.getElementById('sel-special').textContent = info.special;

        if (b.id === 'mine') {
            const inc = getBuildingIncome(b);
            const nextInc = getBuildingIncome({ ...b, level: b.level + 1 });
            document.getElementById('lbl-stat-1').textContent = tr.statIncome;
            document.getElementById('sel-dmg').textContent = `+${inc} 🪙`;
            document.getElementById('sel-dmg-next').textContent = b.level < 5 ? `+${nextInc - inc}` : '';
            document.getElementById('lbl-stat-2').textContent = tr.statAura;
            document.getElementById('sel-rng').textContent = '—';
            document.getElementById('sel-rng-next').textContent = '';
            document.getElementById('lbl-stat-3').textContent = tr.statBonus;
            document.getElementById('sel-spd').textContent = '100%';
            document.getElementById('sel-spd-next').textContent = '';
        } else {
            const auraR = bDef.range + (b.level - 1) * 14;
            const pct = Math.round((bDef.bonus + (b.level - 1) * 0.05) * 100);
            document.getElementById('lbl-stat-1').textContent = tr.statBonus;
            document.getElementById('sel-dmg').textContent = `+${pct}%`;
            document.getElementById('sel-dmg-next').textContent = b.level < 5 ? '+5%' : '';
            document.getElementById('lbl-stat-2').textContent = tr.statAura;
            document.getElementById('sel-rng').textContent = `${auraR}`;
            document.getElementById('sel-rng-next').textContent = b.level < 5 ? '+14' : '';
            document.getElementById('lbl-stat-3').textContent = tr.statSpd;
            document.getElementById('sel-spd').textContent = 'Aura';
            document.getElementById('sel-spd-next').textContent = '';
        }
        document.getElementById('sel-dmg-bonus').textContent = '';
        document.getElementById('sel-rng-bonus').textContent = '';
        document.getElementById('sel-spd-bonus').textContent = '';

        if (b.level >= 5) {
            btnUpgrade.disabled = true;
            document.getElementById('lbl-upgrade-btn').textContent = tr.maxLevelBtn;
            document.getElementById('sel-upgrade-cost').textContent = '';
        } else {
            const upCost = getUpgradeCost(b, true);
            btnUpgrade.disabled = state.money < upCost;
            document.getElementById('lbl-upgrade-btn').textContent = tr.upgradeBtn;
            document.getElementById('sel-upgrade-cost').textContent = `🪙 ${upCost} (U)`;
        }

        document.getElementById('lbl-sell-btn').textContent = tr.sellBtn;
        document.getElementById('sel-sell-value').textContent = `+🪙 ${Math.round(b.totalInvested * 0.7)}`;
        resizeCanvas();
        return;
    }

    if (state.selectedTower) {
        const tk = state.selectedTower;
        const info = tr.tanks[tk.id];
        const stats = getTankStats(tk);
        const nextStats = getTankStats({ ...tk, level: tk.level + 1 });

        panel.classList.remove('hidden');
        statsGrid.classList.remove('hidden');
        prioRow.classList.remove('hidden');
        btnUpgrade.classList.remove('hidden');
        btnSell.classList.remove('hidden');
        btnClearObs.classList.add('hidden');

        pCtx.save();
        pCtx.translate(22, 22);
        drawTankEntity(pCtx, { ...tk, angle: -0.35 }, 0.9, false);
        pCtx.restore();

        document.getElementById('sel-name').textContent = info.name;
        document.getElementById('sel-level').textContent = tr.levelLabel(tk.level, 5);
        document.getElementById('sel-special').textContent = info.special;

        document.getElementById('lbl-stat-1').textContent = tr.statDmg;
        document.getElementById('sel-dmg').textContent = stats.damage;
        document.getElementById('sel-dmg-bonus').textContent = '';
        document.getElementById('sel-dmg-next').textContent = tk.level < 5 ? `+${nextStats.damage - stats.damage}` : '';

        document.getElementById('lbl-stat-2').textContent = tr.statRng;
        document.getElementById('sel-rng').textContent = stats.range;
        document.getElementById('sel-rng-bonus').textContent = stats.radarBonus > 0 ? `+${Math.round(stats.radarBonus * 100)}%` : '';
        document.getElementById('sel-rng-next').textContent = tk.level < 5 ? `+${nextStats.range - stats.range}` : '';

        document.getElementById('lbl-stat-3').textContent = tr.statSpd;
        document.getElementById('sel-spd').textContent = `${stats.fireRate}/s`;
        document.getElementById('sel-spd-bonus').textContent = stats.depotBonus > 0 ? `+${Math.round(stats.depotBonus * 100)}%` : '';
        document.getElementById('sel-spd-next').textContent = tk.level < 5 ? `+${(nextStats.fireRate - stats.fireRate).toFixed(2)}/s` : '';

        document.getElementById('btn-cycle-priority').textContent = tr.priorities[tk.priority || 'first'];

        if (tk.level >= 5) {
            btnUpgrade.disabled = true;
            document.getElementById('lbl-upgrade-btn').textContent = tr.maxLevelBtn;
            document.getElementById('sel-upgrade-cost').textContent = '';
        } else {
            const upCost = getUpgradeCost(tk, false);
            btnUpgrade.disabled = state.money < upCost;
            document.getElementById('lbl-upgrade-btn').textContent = tr.upgradeBtn;
            document.getElementById('sel-upgrade-cost').textContent = `🪙 ${upCost} (U)`;
        }

        document.getElementById('lbl-sell-btn').textContent = tr.sellBtn;
        document.getElementById('sel-sell-value').textContent = `+🪙 ${Math.round(tk.totalInvested * 0.7)}`;
        resizeCanvas();
        return;
    }

    panel.classList.add('hidden');
    resizeCanvas();
}

// Expose globally and on window.Game namespace
window.updateBossHUD = updateBossHUD;
window.showToast = showToast;
window.applyStaticTranslations = applyStaticTranslations;
window.updateHUD = updateHUD;
window.renderTechTreeGrid = renderTechTreeGrid;
window.renderStartMenu = renderStartMenu;
window.renderShopLists = renderShopLists;
window.updateUpgradePanel = updateUpgradePanel;

window.Game = window.Game || {};
window.Game.Views = window.Game.Views || {};
window.Game.Views.UI = {
    updateBossHUD,
    showToast,
    applyStaticTranslations,
    updateHUD,
    renderTechTreeGrid,
    renderStartMenu,
    renderShopLists,
    updateUpgradePanel
};
