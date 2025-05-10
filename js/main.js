// js/main.js
import { OverlayManager } from './overlay-manager.js';
import { DEBUG } from './ably-config.js'; // Import DEBUG

const LOG_PREFIX = "[Main]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

document.addEventListener('DOMContentLoaded', () => {
    logger.log("StreamWeaver Overlay: DOMContentLoaded, initializing...");
    
    const overlayManager = new OverlayManager();
    
    overlayManager.initialize().catch(error => {
        logger.error("StreamWeaver Overlay: Critical error during initialization.", error);
        const overlayTextElement = document.getElementById('overlay-text');
        if (overlayTextElement) {
            overlayTextElement.textContent = "OVERLAY SYSTEM ERROR - CHECK CONSOLE";
            overlayTextElement.style.color = "red";
            if (overlayTextElement.parentElement) {
                overlayTextElement.parentElement.style.opacity = "1";
                overlayTextElement.parentElement.style.transform = "translateX(-50%) translateY(0)";
            }
        }
    });
});
