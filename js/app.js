/* ==========================================
 * Tanks Vs. Zombie - Application Entry Point
 * ========================================== */

let initialized = false;
let lastOriginalMap = 'meadow';

function initializeApplication() {
    if (initialized) return;
    initialized = true;

    // Register the core listeners first so that the language buttons update
    // currentLang before the mode picker below re-renders its texts.
    if (typeof setupInputEventListeners === 'function') setupInputEventListeners();

    const menu = document.getElementById('start-menu-modal');
    if (menu && !document.getElementById('tvz-mode-picker')) {
        const picker = document.createElement('div');
        picker.id = 'tvz-mode-picker';
        picker.className = 'mt-3 bg-emerald-100 border-2 border-emerald-900 rounded-2xl p-3';
        picker.innerHTML = `
            <div id="tvz-mode-title" class="font-extrabold text-stone-950 mb-2">🎮 Välj spelläge</div>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Spelläge">
                <button type="button" data-mode="original" class="cartoon-btn bg-lime-300 border-2 border-stone-900 rounded-xl p-2 text-left cursor-pointer">
                    <b>🗺️ <span id="tvz-mode-original-title">Original</span></b>
                    <span id="tvz-mode-original-desc" class="block text-[11px]">Slingrande banor och naturliga hinder</span>
                </button>
                <button type="button" data-mode="maze" class="cartoon-btn bg-white border-2 border-stone-900 rounded-xl p-2 text-left cursor-pointer">
                    <b>🧩 <span id="tvz-mode-maze-title">Maze</span></b>
                    <span id="tvz-mode-maze-desc" class="block text-[11px]">Bygg labyrinter på en rak väg</span>
                </button>
            </div>
            <p id="tvz-mode-help" class="text-[11px] font-semibold text-stone-700 mt-2">I Maze går zombierna runt tornen. Om vägen blockeras attackerar zombierna det sista tornet i blockeringen.</p>`;

        const anchor = document.getElementById('heading-step-1');
        (anchor ? anchor.parentElement : menu.firstElementChild).before(picker);

        const updateModeTexts = () => {
            const english = window.currentLang === 'en';
            const titleEl = document.getElementById('tvz-mode-title');
            if (titleEl) titleEl.textContent = english ? '🎮 Choose game mode' : '🎮 Välj spelläge';
            const origEl = document.getElementById('tvz-mode-original-desc');
            if (origEl) origEl.textContent = english ? 'Winding paths and natural obstacles' : 'Slingrande banor och naturliga hinder';
            const mazeEl = document.getElementById('tvz-mode-maze-desc');
            if (mazeEl) mazeEl.textContent = english ? 'Build mazes on one straight road' : 'Bygg labyrinter på en rak väg';
            const helpEl = document.getElementById('tvz-mode-help');
            if (helpEl) {
                helpEl.textContent = english
                    ? 'In Maze, zombies go around towers. If the route is fully blocked, zombies attack the last tower blocking the exit.'
                    : 'I Maze går zombierna runt tornen. Om vägen blockeras helt attackerar zombierna det sista tornet i blockeringen.';
            }
        };

        picker.querySelectorAll('[data-mode]').forEach(button => {
            button.addEventListener('click', () => {
                if (state.matchStarted) return;
                const mode = button.dataset.mode;
                if (state.selectedMap && state.selectedMap !== 'maze') {
                    lastOriginalMap = state.selectedMap;
                }
                state.gameMode = mode;

                if (mode === 'maze') {
                    state.selectedMap = 'maze';
                } else {
                    state.selectedMap = lastOriginalMap || 'meadow';
                }

                if (typeof renderStartMenu === 'function') renderStartMenu();
                if (typeof updateHUD === 'function') updateHUD();
                updateModeTexts();
            });
        });
        updateModeTexts();

        const svButton = document.getElementById('btn-lang-sv');
        const enButton = document.getElementById('btn-lang-en');
        if (svButton) svButton.addEventListener('click', updateModeTexts);
        if (enButton) enButton.addEventListener('click', updateModeTexts);
    }

    if (typeof resizeCanvas === 'function') resizeCanvas();
    if (typeof renderStartMenu === 'function') renderStartMenu();
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof renderShopLists === 'function') renderShopLists();
    if (typeof mainLoop === 'function') requestAnimationFrame(mainLoop);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        state.gameMode = state.selectedMap === 'maze' ? 'maze' : 'original';
        initializeApplication();
    });
} else {
    state.gameMode = state.selectedMap === 'maze' ? 'maze' : 'original';
    initializeApplication();
}

window.addEventListener('load', () => {
    if (typeof resizeCanvas === 'function') resizeCanvas();
});
