/* ==========================================
 * Tanks Vs. Zombie - Application Entry Point
 * Main Initialization
 * ========================================== */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Input Event Listeners
    if (typeof setupInputEventListeners === 'function') {
        setupInputEventListeners();
    }

    // 2. Initial Canvas Sizing
    if (typeof resizeCanvas === 'function') {
        resizeCanvas();
    }

    // 3. Render Initial UI State
    if (typeof renderStartMenu === 'function') {
        renderStartMenu();
    }
    if (typeof updateHUD === 'function') {
        updateHUD();
    }
    if (typeof renderShopLists === 'function') {
        renderShopLists();
    }

    // 4. Start the Main Game Loop
    if (typeof mainLoop === 'function') {
        requestAnimationFrame(mainLoop);
    }
});

// Fallback for window.load in case DOMContentLoaded has already executed
window.addEventListener('load', () => {
    if (typeof resizeCanvas === 'function') {
        resizeCanvas();
    }
});
