/* ==========================================
 * Application entry point
 * ========================================== */
window.addEventListener('DOMContentLoaded', () => {
    if (window.TvZMaze) window.TvZMaze.install();

    const menu = document.getElementById('start-menu-modal');
    if (menu && !document.getElementById('tvz-mode-picker')) {
        const picker = document.createElement('div');
        picker.id = 'tvz-mode-picker';
        picker.className = 'mt-3 bg-emerald-100 border-2 border-emerald-900 rounded-2xl p-3';
        picker.innerHTML = '<div class="font-extrabold text-stone-950 mb-2">🎮 Välj spelläge</div>' +
            '<div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Spelläge">' +
            '<button type="button" data-mode="original" class="cartoon-btn bg-white border-2 border-stone-900 rounded-xl p-2 text-left"><b>🗺️ Original</b><span class="block text-[11px]">Slingrande banor och hinder</span></button>' +
            '<button type="button" data-mode="maze" class="cartoon-btn bg-white border-2 border-stone-900 rounded-xl p-2 text-left"><b>🧩 Maze</b><span class="block text-[11px]">Bygg en labyrint på den raka vägen</span></button>' +
            '</div>' +
            '<p class="text-[11px] font-semibold text-stone-700 mt-2">I Maze går zombierna runt tornen. Blockeras vägen helt attackerar de det sista tornet.</p>';
        const anchor = document.getElementById('heading-step-1');
        (anchor ? anchor.parentElement : menu.firstElementChild).before(picker);
        picker.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
            state.gameMode = button.dataset.mode;
            if (state.gameMode === 'maze') {
                TvZMaze.ensureMazeMap();
                state.selectedMap = 'maze';
            } else if (state.selectedMap === 'maze') state.selectedMap = 'meadow';
            picker.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('bg-lime-300', b === button));
            renderStartMenu();
        }));
    }

    if (typeof setupInputEventListeners === 'function') setupInputEventListeners();
    if (typeof resizeCanvas === 'function') resizeCanvas();
    if (typeof renderStartMenu === 'function') renderStartMenu();
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof renderShopLists === 'function') renderShopLists();
    if (typeof mainLoop === 'function') requestAnimationFrame(mainLoop);
});
window.addEventListener('load', () => { if (typeof resizeCanvas === 'function') resizeCanvas(); });
