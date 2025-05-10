// js/overlay-manager.js
// ... (imports and logger setup) ...

export class OverlayManager {
    // ... (constructor) ...
    // ... (initialize, connectToAbly, publishStatus, publishInitialOverlayStates) ...

    subscribeToAblyEvents() {
        if (!this.isAblyConnected || !this.controlChannel || this.controlChannel.state !== 'attached') {
            logger.error("Cannot subscribe to control events - Ably/control channel not ready (state:", this.controlChannel?.state, ")");
            return;
        }
        logger.log(`Subscribing to Ably actions on attached control channel '${CONTROL_CHANNEL_NAME}'`);
        
        const createActionHandler = (overlayStringId, overlayInstance) => (message) => {
            const actionData = message.data; 
            if (!actionData?.action) {
                logger.warn(`No action specified in message for ${overlayStringId}. Data:`, actionData);
                this.publishStatus(overlayStringId, 'error', 'No action specified in message.', actionData);
                return;
            }

            const action = actionData.action.toLowerCase();
            logger.log(`Received action '${action}' for ${overlayStringId}. Full actionData:`, JSON.stringify(actionData)); 
            
            try {
                switch (action) {
                    case 'show':
                        // ... (show logic) ...
                        if (overlayStringId === 'lowerThird') {
                            logger.log(`Calling ${overlayStringId}.show() with data:`, JSON.stringify(actionData));
                            overlayInstance.show(actionData); 
                            this.publishStatus(overlayStringId, 'shown', null, { name: actionData.name, title: actionData.title, affiliation: actionData.affiliation });
                        } else if (overlayStringId === 'ticker') {
                            logger.log(`Calling ${overlayStringId}.updateAndShow() with data:`, JSON.stringify(actionData));
                            overlayInstance.updateAndShow(actionData); 
                            this.publishStatus(overlayStringId, 'shown', null, { text: actionData.text });
                        } else {
                            logger.log(`Calling ${overlayStringId}.show()`);
                            overlayInstance.show(); 
                            this.publishStatus(overlayStringId, 'shown');
                        }
                        break;
                    case 'hide':
                        logger.log(`Calling ${overlayStringId}.hide()`);
                        overlayInstance.hide(); 
                        this.publishStatus(overlayStringId, 'hidden');
                        break;
                    case 'toggle':
                        if (typeof overlayInstance.toggle === 'function') {
                            // LOGGING RIGHT BEFORE THE CALL
                            logger.log(`Calling ${overlayStringId}.toggle() with data:`, JSON.stringify(actionData));
                            overlayInstance.toggle(actionData); 
                            this.publishStatus(overlayStringId, overlayInstance.isVisible ? 'shown' : 'hidden');
                        } else {
                            logger.warn(`Overlay '${overlayStringId}' does not support toggle.`);
                            throw new Error(`Overlay '${overlayStringId}' does not support toggle.`);
                        }
                        break;
                    default:
                        logger.warn(`Unknown action '${action}' for ${overlayStringId}.`);
                        throw new Error(`Unknown action: ${action}`);
                }
            } catch (e) {
                logger.error(`Error executing action '${action}' for ${overlayStringId}:`, e);
                this.publishStatus(overlayStringId, 'error', `Failed to ${action} ${overlayStringId}: ${e.message}`, actionData);
            }
        };

        this.controlChannel.subscribe('overlay-action', createActionHandler('text', this.textOverlay));
        this.controlChannel.subscribe('logo-action', createActionHandler('logo', this.logoOverlay));
        this.controlChannel.subscribe('breaking-news-action', createActionHandler('breakingNews', this.breakingNewsOverlay));
        this.controlChannel.subscribe('lower-third-action', createActionHandler('lowerThird', this.lowerThirdOverlay));
        this.controlChannel.subscribe('ticker-action', createActionHandler('ticker', this.tickerOverlay));
        this.controlChannel.subscribe('brb-action', createActionHandler('brb', this.brbOverlay));
        this.controlChannel.subscribe('cso-action', createActionHandler('cso', this.csoOverlay));
        logger.log("Subscribed to all control actions.");
    }

    // ... (hideAllNonFullscreenOverlays) ...
}
