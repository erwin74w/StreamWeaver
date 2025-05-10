// js/main.js
import { OverlayManager } from './overlay-manager.js'; // If this import fails, nothing else runs

document.addEventListener('DOMContentLoaded', () => {
    console.log("StreamWeaver Overlay: DOMContentLoaded, initializing..."); // THIS RUNS
    
    try { // Let's add a try-catch here
        const overlayManager = new OverlayManager(); // <<< ERROR LIKELY HERE OR IN OverlayManager CONSTRUCTOR
        
        overlayManager.initialize().catch(error => { // Or error in initialize() if constructor passed
            console.error("StreamWeaver Overlay: Critical error during initialization in main.js.", error);
            // Fallback display
        });
    } catch (e) {
        console.error("StreamWeaver Overlay: CRITICAL ERROR CREATING OverlayManager or calling initialize() in main.js:", e);
        const errText = document.getElementById('overlay-text');
        if (errText) {
            errText.textContent = "OVERLAY SYSTEM CRITICAL FAILURE: " + e.message;
            errText.style.color = "red";
            errText.parentElement.style.opacity = "1";
            errText.parentElement.style.transform = "translateX(-50%) translateY(0)";
        }
    }
});
