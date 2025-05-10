// js/main.js
import { OverlayManager } from './overlay-manager.js'; // <<<< CORRECT IMPORT
import { DEBUG } from './ably-config.js';

const LOG_PREFIX = "[Main]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

document.addEventListener('DOMContentLoaded', () => {
    logger.log("StreamWeaver Overlay: DOMContentLoaded, initializing...");
    
    const overlayManager = new OverlayManager(); // <<<< CREATING INSTANCE
    
    overlayManager.initialize().catch(error => { // <<<< CALLING INITIALIZE
        logger.error("StreamWeaver Overlay: Critical error during initialization.", error);
        // ... (error display logic) ...
    });
});
