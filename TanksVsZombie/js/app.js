/* ==========================================
 * Tanks Vs. Zombie - Application Entry Point
 * Maze-compatible initialization
 * ========================================== */

function initializeApplication() {
    if (window.TvZMaze) window.TvZMaze.install();

    const menu = document.getElementById('start-menu-modal');
    if (menu && !document.getElementById('tvz-mode-picker')) {
        const picker = document.createElement('div');
        picker.id = 'tvz-mode-picker';
        picker.className = 'mt-3 bg-emerald-100 border-2 border-emerald-900 rounded-2xl p-3';
        picker.innerHTML = `
            <div id="tvz-mode-title" class="font-extrabold text-stone-950 mb-2">🎮 Välj spelläge</div>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Spelläge">
                <button type="button" data-mode="original" class="cartoon-btn bg-lime-300 border-2 border-stone-900 rounded-xl p-2 text-left">
                    <b>🗺️ <span id="tvz-mode-original-title">Original</span></b>
                    <span id="tvz-mode-original-desc" class="block text-[11px]">Slingrande banor och naturliga hinder</span>
                </button>
                <button type="button" data-mode="maze" class="cartoon-btn bg-white border-2 border-stone-900 rounded-xl p-2 text-left">
                    <b>🧩 <span id="tvz-mode-maze-title">Maze</span></b>
                    <span id="tvz-mode-maze-desc" class="block text-[11px]">Bygg labyrinter på en rak väg</span>
                </button>
            </div>
            <p id="tvz-mode-help" class="text-[11px] font-semibold text-stone-700 mt-2">I Maze går zombierna runt tornen. Om vägen blockeras attackerar zombierna det sista tornet i blockeringen.</p>`;

        const anchor = document.getElementById('heading-step-1');
        (anchor ? anchor.parentElement : menu.firstElementChild).before(picker);

        const updateModeTexts = () => {
            const english = window.currentLang === 'en';
            document.getElementById('tvz-mode-title').textContent = english ? '🎮 Choose game mode' : '🎮 Välj spelläge';
            document.getElementById('tvz-mode-original-desc').textContent = english ? 'Winding paths and natural obstacles' : 'Slingrande banor och naturliga hinder';
            document.getElementById('tvz-mode-maze-desc').textContent = english ? 'Build mazes on one straight road' : 'Bygg labyrinter på en rak väg';
            document.getElementById('tvz-mode-help').textContent = english
                ? 'In Maze, zombies go around towers. If the route is fully blocked, zombies attack the last tower blocking the exit.'
                : 'I Maze går zombierna runt tornen. Om vägen blockeras helt attackerar zombierna det sista tornet i blockeringen.';
        };

        picker.querySelectorAll('[data-mode]').forEach(button => {
            button.addEventListener('click', () => {
                if (state.matchStarted) return;
                state.gameMode = button.dataset.mode;

                if (state.gameMode === 'maze') {
                    if (window.TvZMaze) window.TvZMaze.ensureMazeMap();
                    state.selectedMap = 'maze';
                } else if (state.selectedMap === 'maze') {
                    state.selectedMap = 'meadow';
                }

                picker.querySelectorAll('[data-mode]').forEach(b => {
                    b.classList.toggle('bg-lime-300', b === button);
                    b.classList.toggle('bg-white', b !== button);
                });

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

    if (typeof setupInputEventListeners === 'function') setupInputEventListeners();
    if (typeof resizeCanvas === 'function') resizeCanvas();
    if (typeof renderStartMenu === 'function') renderStartMenu();
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof renderShopLists === 'function') renderShopLists();
    if (typeof mainLoop === 'function') requestAnimationFrame(mainLoop);
}

window.addEventListener('DOMContentLoaded', () => {
    state.gameMode = state.gameMode || 'original';

    if (typeof TvZMaze !== 'undefined') {
        initializeApplication();
        return;
    }

    const mazeScript = document.createElement('script');
    mazeScript.src = 'js/mazeMode.js';
    mazeScript.onload = initializeApplication;
    mazeScript.onerror = initializeApplication;
    document.body.appendChild(mazeScript);
});

window.addEventListener('load', () => {
    if (typeof resizeCanvas === 'function') resizeCanvas();
});
