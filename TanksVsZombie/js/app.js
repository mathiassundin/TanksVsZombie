/* ==========================================
 * Tanks Vs. Zombie - Application Entry Point
 * Maze-compatible initialization
 * ========================================== */
function initializeApplication() {
    if (window.TvZMaze) window.TvZMaze.install();

    const picker = document.getElementById('tvz-mode-picker');
    if (picker) {
        const syncPicker = () => {
            const maze = state.gameMode === 'maze';
            picker.querySelectorAll('[data-mode]').forEach(button => {
                const selected = button.dataset.mode === state.gameMode;
                button.classList.toggle('bg-lime-300', selected);
                button.classList.toggle('bg-white', !selected);
                button.setAttribute('aria-checked', String(selected));
                button.disabled = state.matchStarted;
            });
            document.querySelectorAll('.map-option').forEach(button => {
                button.classList.toggle('hidden', maze);
                button.disabled = state.matchStarted || maze;
            });
            const mapHeading = document.getElementById('heading-step-1');
            if (mapHeading) mapHeading.classList.toggle('hidden', maze);
        };

        picker.querySelectorAll('[data-mode]').forEach(button => {
            button.addEventListener('click', () => {
                if (state.matchStarted) return;
                state.gameMode = button.dataset.mode;
                if (state.gameMode === 'maze') {
                    window.TvZMaze.ensureMazeMap();
                    state.selectedMap = 'maze';
                } else {
                    if (state.selectedMap === 'maze') state.selectedMap = 'meadow';
                }
                syncPicker();
                renderStartMenu();
                updateHUD();
            });
        });

        const currentRenderStartMenu = window.renderStartMenu;
        if (currentRenderStartMenu && !currentRenderStartMenu.__mazeWrapped) {
            const wrapped = function () {
                const result = currentRenderStartMenu();
                syncPicker();
                return result;
            };
            wrapped.__mazeWrapped = true;
            window.renderStartMenu = wrapped;
        }
        syncPicker();
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
    if (typeof TvZMaze !== 'undefined') return initializeApplication();
    const script = document.createElement('script');
    script.src = 'js/mazeMode.js';
    script.onload = initializeApplication;
    script.onerror = initializeApplication;
    document.body.appendChild(script);
});
window.addEventListener('load', () => { if (typeof resizeCanvas === 'function') resizeCanvas(); });
