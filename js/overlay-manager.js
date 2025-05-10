// js/overlay-manager.js
// ... (imports and logger setup) ...

export class OverlayManager { // <<<< EXPORTED CLASS
    constructor() {
        // ...
        logger.log("OverlayManager instance created.");
    }

    async initialize() { // <<<< ASYNC INITIALIZE METHOD IS DEFINED
        logger.log('Initializing...');
        try {
            const initialText = await fetchOverlayData('./overlay_data.json', "Overlay Ready");
            this.textOverlay.setText(initialText);
            this.connectToAbly();
        } catch (error) {
            logger.error("Initialization failed", error);
            this.textOverlay.setText("Error initializing overlay system.");
            throw error; // Re-throw to be caught by main.js
        }
    }

    // ... (other methods: connectToAbly, publishStatus, subscribeToAblyEvents, etc.) ...
}
