// js/main.js
import { OverlayManager } from './overlay-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("StreamWeaver Overlay: DOMContentLoaded, initializing...");
    
    try {
        const overlayManager = new OverlayManager(); // Attempt to create instance
        
        // If constructor didn't throw, attempt to initialize
        overlayManager.initialize().catch(error => {
            console.error("StreamWeaver Overlay: Error during overlayManager.initialize() call:", error);
            const errText = document.getElementById('overlay-text');
            if (errText) {
                errText.textContent = "OVERLAY INIT FAILED (initialize method): " + error.message;
                errText.style.color = "red";
                const errOverlay = document.getElementById('streamweaver-overlay');
                if (errOverlay) {
                    errOverlay.classList.add('show');
                    errOverlay.style.backgroundColor = "rgba(0,0,0,0.7)";
                }
            }
        });

    } catch (e) {
        console.error("StreamWeaver Overlay: CRITICAL ERROR during new OverlayManager() in main.js:", e);
        const errText = document.getElementById('overlay-text');
        if (errText) {
            errText.textContent = "OVERLAY SYSTEM CRITICAL FAILURE (constructor): " + e.message;
            errText.style.color = "red";
            const errOverlay = document.getElementById('streamweaver-overlay');
            if (errOverlay) {
                errOverlay.classList.add('show');
                errOverlay.style.backgroundColor = "rgba(0,0,0,0.7)";
            }
        }
    }
});
