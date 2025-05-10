// js/overlay-manager.js
import { ABLY_API_KEY, CONTROL_CHANNEL_NAME, STATUS_CHANNEL_NAME } from './ably-config.js';
import { fetchOverlayData } from './utils.js';

import { TextOverlay } from './overlays/TextOverlay.js';
import { LogoOverlay } from './overlays/LogoOverlay.js';
import { BreakingNewsOverlay } from './overlays/BreakingNewsOverlay.js';
import { LowerThirdOverlay } from './overlays/LowerThirdOverlay.js';
import { TickerOverlay } from './overlays/TickerOverlay.js';
import { BRBOverlay } from './overlays/BRBOverlay.js';
import { CSOOverlay } from './overlays/CSOOverlay.js';
import { OutroOverlay } from './overlays/OutroOverlay.js'; // Import new overlay

export class OverlayManager {
    constructor() {
        this.ably = null;
        this.controlChannel = null;
        this.statusChannel = null; 
        this.isAblyConnected = false;
        this.initialStatesPublished = false; 

        this.textOverlay = new TextOverlay('streamweaver-overlay', 'overlay-text');
        this.logoOverlay = new LogoOverlay('logo-container');
        this.breakingNewsOverlay = new BreakingNewsOverlay('breaking-news-container');
        this.lowerThirdOverlay = new LowerThirdOverlay('lower-third-container', 'lt-name', 'lt-title', 'lt-affiliation');
        this.tickerOverlay = new TickerOverlay('ticker-container', 'ticker-content-wrapper', 'ticker-text-span');

        const hideOtherFullscreenAndNonFullscreen = () => {
            this.brbOverlay.hide();
            this.csoOverlay.hide();
            this.outroOverlay.hide(); // Will be overwritten by the one being shown
            this.hideAllNonFullscreenOverlays();
        };
        
        const afterHideFullscreen = () => {
            this.hideAllNonFullscreenOverlays(); // Consistent behavior
        };

        this.brbOverlay = new BRBOverlay('brb-overlay-container', 
            () => { hideOtherFullscreenAndNonFullscreen(); this.csoOverlay.hide(); this.outroOverlay.hide(); }, // Explicitly ensure others are off
            afterHideFullscreen
        );
        this.csoOverlay = new CSOOverlay('cso-overlay-container',
            () => { hideOtherFullscreenAndNonFullscreen(); this.brbOverlay.hide(); this.outroOverlay.hide(); },
            afterHideFullscreen
        );
        this.outroOverlay = new OutroOverlay('outro-overlay-container', // Instantiate Outro
            () => { hideOtherFullscreenAndNonFullscreen(); this.brbOverlay.hide(); this.csoOverlay.hide(); },
            afterHideFullscreen
        );
        
        this.nonFullscreenOverlays = [
            this.textOverlay, this.logoOverlay, this.breakingNewsOverlay,
            this.lowerThirdOverlay, this.tickerOverlay
        ];

        this.overlayInstanceMap = {
            text: this.textOverlay,
            logo: this.logoOverlay,
            breakingNews: this.breakingNewsOverlay,
            lowerThird: this.lowerThirdOverlay,
            ticker: this.tickerOverlay,
            brb: this.brbOverlay,
            cso: this.csoOverlay,
            outro: this.outroOverlay // Add to map
        };
    }

    // ... (initialize() and connectToAbly() remain the same as previous working version) ...
    async initialize() { /* ... same ... */ }
    connectToAbly() { /* ... same ... */ }
    publishStatus(overlayId, state, message = null, data = null) { /* ... same ... */ }
    publishInitialOverlayStates() { /* ... same ... */ }


    subscribeToAblyEvents() {
        if (!this.isAblyConnected || !this.controlChannel || this.controlChannel.state !== 'attached') {
            console.error("OverlayManager: Cannot subscribe to control events - Ably/control channel not ready (state:", this.controlChannel?.state, ")");
            return;
        }
        console.log(`OverlayManager: Subscribing to Ably actions on attached control channel '${CONTROL_CHANNEL_NAME}'`);
        
        const createActionHandler = (overlayStringId, overlayInstance) => (message) => {
            // ... (existing action handler logic remains the same) ...
            const actionData = message.data;
            if (!actionData?.action) {
                this.publishStatus(overlayStringId, 'error', 'No action specified in message.', actionData);
                return;
            }

            const action = actionData.action.toLowerCase();
            console.log(`OverlayManager: Received action '${action}' for ${overlayStringId}`, actionData); 
            try {
                switch (action) {
                    case 'show':
                        if (overlayStringId === 'lowerThird') {
                            overlayInstance.show(actionData); 
                            this.publishStatus(overlayStringId, 'shown', null, { name: actionData.name, title: actionData.title, affiliation: actionData.affiliation });
                        } else if (overlayStringId === 'ticker') {
                            overlayInstance.updateAndShow(actionData); 
                            this.publishStatus(overlayStringId, 'shown', null, { text: actionData.text });
                        } else { // This will now also handle brb, cso, outro
                            overlayInstance.show(); 
                            this.publishStatus(overlayStringId, 'shown');
                        }
                        break;
                    case 'hide':
                        overlayInstance.hide(); 
                        this.publishStatus(overlayStringId, 'hidden');
                        break;
                    case 'toggle':
                        if (typeof overlayInstance.toggle === 'function') {
                            overlayInstance.toggle(); 
                            this.publishStatus(overlayStringId, overlayInstance.isVisible ? 'shown' : 'hidden');
                        } else {
                            this.publishStatus(overlayStringId, 'error', `Overlay '${overlayStringId}' does not support toggle.`);
                            // throw new Error(`Overlay '${overlayStringId}' does not support toggle.`);
                        }
                        break;
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            } catch (e) {
                console.error(`OverlayManager: Error executing action '${action}' for ${overlayStringId}:`, e);
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
        this.controlChannel.subscribe('outro-action', createActionHandler('outro', this.outroOverlay)); // Subscribe to new action

        console.log("OverlayManager: Subscribed to all control actions.");
    }

    hideAllNonFullscreenOverlays() {
        this.nonFullscreenOverlays.forEach(overlay => {
            const overlayStringId = Object.keys(this.overlayInstanceMap).find(key => this.overlayInstanceMap[key] === overlay);
            if (overlay && typeof overlay.hide === 'function') {
                if (overlay.isVisible) { 
                    overlay.hide();
                    if (overlayStringId) { 
                        this.publishStatus(overlayStringId, 'hidden', 'Automatically hidden by fullscreen overlay.');
                    }
                }
            }
        });
    }
}
