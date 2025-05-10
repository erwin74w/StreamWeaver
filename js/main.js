// js/main.js
import { OverlayManager } from './overlay-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("StreamWeaver Overlay: DOMContentLoaded, initializing...");
    
    const overlayManager = new OverlayManager();
    
    overlayManager.initialize().catch(error => {
        console.error("StreamWeaver Overlay: Critical error during initialization.", error);
        // Fallback: display an error message directly on the overlay if possible
        const overlayTextElement = document.getElementById('overlay-text');
        if (overlayTextElement) {
            overlayTextElement.textContent = "OVERLAY SYSTEM ERROR - CHECK CONSOLE";
            overlayTextElement.style.color = "red";
            overlayTextElement.parentElement.style.opacity = "1"; // Make sure it's visible
            overlayTextElement.parentElement.style.transform = "translateX(-50%) translateY(0)";
        }
    });
});
