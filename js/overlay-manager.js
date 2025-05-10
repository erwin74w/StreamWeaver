// js/overlay-manager.js
import { ABLY_API_KEY, CONTROL_CHANNEL_NAME, STATUS_CHANNEL_NAME } from './ably-config.js'; // Updated import
import { fetchOverlayData } from './utils.js';

import { TextOverlay } from './overlays/TextOverlay.js';
import { LogoOverlay } from './overlays/LogoOverlay.js';
import { BreakingNewsOverlay } from './overlays/BreakingNewsOverlay.js';
import { LowerThirdOverlay } from './overlays/LowerThirdOverlay.js';
import { TickerOverlay } from './overlays/TickerOverlay.js';
import { BRBOverlay } from './overlays/BRBOverlay.js';
import { CSOOverlay } from './overlays/CSOOverlay.js';

export class OverlayManager {
    constructor() {
        this.ably = null;
        this.controlChannel = null;
        this.statusChannel = null; // New for publishing status
        this.isAblyConnected = false;

        this.textOverlay = new TextOverlay('streamweaver-overlay', 'overlay-text');
        this.logoOverlay = new LogoOverlay('logo-container');
        this.breakingNewsOverlay = new BreakingNewsOverlay('breaking-news-container');
        this.lowerThirdOverlay = new LowerThirdOverlay('lower-third-container', 'lt-name', 'lt-title', 'lt-affiliation');
        this.tickerOverlay = new TickerOverlay('ticker-container', 'ticker-content-wrapper', 'ticker-text-span');

        this.brbOverlay = new BRBOverlay('brb-overlay-container', 
            () => { // onShow
                this.csoOverlay.hide(); // Ensure other fullscreen is hidden
                // No direct status publish for csoOverlay.hide() here; its own hide method will trigger status if it was visible.
                this.hideAllNonFullscreenOverlays();
            },
            () => { // onHide
                 this.hideAllNonFullscreenOverlays();
            }
        );
        this.csoOverlay = new CSOOverlay('cso-overlay-container',
            () => { // onShow
                this.brbOverlay.hide(); 
                this.hideAllNonFullscreenOverlays();
            },
            () => { // onHide
                 this.hideAllNonFullscreenOverlays();
            }
        );
        
        this.nonFullscreenOverlays = [
            this.textOverlay, this.logoOverlay, this.breakingNewsOverlay,
            this.lowerThirdOverlay, this.tickerOverlay
        ];

        // Map overlay string IDs (used in Ably messages and status reporting) to instances
        this.overlayInstanceMap = {
            text: this.textOverlay,
            logo: this.logoOverlay,
            breakingNews: this.breakingNewsOverlay,
            lowerThird: this.lowerThirdOverlay,
            ticker: this.tickerOverlay,
            brb: this.brbOverlay,
            cso: this.csoOverlay
        };
    }

    async initialize() {
        console.log('OverlayManager: Initializing...');
        try {
            const initialText = await fetchOverlayData('./overlay_data.json', "Overlay Ready");
            this.textOverlay.setText(initialText);
            this.connectToAbly();
        } catch (error) {
            console.error("OverlayManager: Initialization failed", error);
            this.textOverlay.setText("Error initializing overlay system.");
            // If Ably connection fails later, status won't be sent. Consider this.
        }
    }

    connectToAbly() {
        if (!ABLY_API_KEY || ABLY_API_KEY === 'YOUR_ABLY_API_KEY_WAS_HERE' || ABLY_API_KEY.length < 10) {
            const errorMsg = "OverlayManager: Ably API Key is missing or invalid. Ably connection aborted.";
            console.error(errorMsg);
            this.textOverlay.setText("Ably connection error: API Key missing.");
            return;
        }

        console.log('OverlayManager: Attempting to connect to Ably...');
        try {
            this.ably = new Ably.Realtime(ABLY_API_KEY);

            this.ably.connection.on('connected', () => {
                this.isAblyConnected = true;
                console.log('OverlayManager: Successfully connected to Ably!');
                this.controlChannel = this.ably.channels.get(CONTROL_CHANNEL_NAME);
                this.statusChannel = this.ably.channels.get(STATUS_CHANNEL_NAME); // Get status channel
                this.subscribeToAblyEvents();
                this.publishStatus('system', 'connected', 'Overlay client connected to Ably.');
            });

            this.ably.connection.on('failed', (error) => {
                this.isAblyConnected = false;
                console.error('OverlayManager: Ably connection failed:', error);
                this.textOverlay.setText("Ably connection failed.");
            });
            // Add other connection state handlers as before (closed, disconnected)
            this.ably.connection.on('closed', () => {
                this.isAblyConnected = false;
                console.log('OverlayManager: Ably connection closed.');
                 // this.publishStatus('system', 'disconnected', 'Overlay client disconnected from Ably.'); // Can't publish if closed
            });

            this.ably.connection.on('disconnected', () => {
                this.isAblyConnected = false;
                console.log('OverlayManager: Ably disconnected. Will attempt to reconnect.');
            });

        } catch (e) {
            console.error("OverlayManager: Error initializing Ably Realtime client:", e);
            this.textOverlay.setText("Failed to initialize Ably client.");
        }
    }

    publishStatus(overlayId, state, message = null, data = null) {
        if (!this.statusChannel || !this.isAblyConnected) {
            console.warn("OverlayManager: Cannot publish status, Ably not connected or status channel not available.", { overlayId, state, message });
            return;
        }
        const payload = { overlayId, state }; // overlayId will be 'logo', 'ticker', etc.
        if (message) payload.message = message;
        if (data) payload.data = data;

        this.statusChannel.publish('update', payload, (err) => { // Publishing 'update' event with payload
            if (err) {
                console.error(`OverlayManager: Error publishing status for ${overlayId}:`, err);
            } else {
                // console.log(`OverlayManager: Status published for ${overlayId}:`, payload); // Can be verbose
            }
        });
    }

    subscribeToAblyEvents() {
        if (!this.controlChannel) {
            console.error("OverlayManager: Control channel not available. Cannot subscribe to events.");
            return;
        }
        console.log(`OverlayManager: Subscribing to Ably actions on channel '${CONTROL_CHANNEL_NAME}'`);

        // Generic handler factory
        const createActionHandler = (overlayStringId, overlayInstance) => (message) => {
            const actionData = message.data;
            if (!actionData?.action) {
                this.publishStatus(overlayStringId, 'error', 'No action specified in message.', actionData);
                return;
            }

            const action = actionData.action.toLowerCase();
            try {
                switch (action) {
                    case 'show':
                        if (overlayStringId === 'lowerThird') {
                            overlayInstance.show(actionData);
                            this.publishStatus(overlayStringId, 'shown', null, { name: actionData.name, title: actionData.title, affiliation: actionData.affiliation });
                        } else if (overlayStringId === 'ticker') {
                            overlayInstance.updateAndShow(actionData);
                            this.publishStatus(overlayStringId, 'shown', null, { text: actionData.text });
                        } else {
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
                            throw new Error(`Overlay '${overlayStringId}' does not support toggle.`);
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
    }

    hideAllNonFullscreenOverlays() {
        this.nonFullscreenOverlays.forEach(overlay => {
            // Find the string ID for the overlay instance
            const overlayStringId = Object.keys(this.overlayInstanceMap).find(key => this.overlayInstanceMap[key] === overlay);
            if (overlay && typeof overlay.hide === 'function') {
                if (overlay.isVisible) { // Only hide and publish if it was visible
                    overlay.hide();
                    if (overlayStringId) { // Should always be found if overlay is in nonFullscreenOverlays
                        this.publishStatus(overlayStringId, 'hidden', 'Automatically hidden by fullscreen overlay.');
                    }
                }
            }
        });
        console.log("OverlayManager: Non-fullscreen overlays checked and hidden if necessary.");
    }
}
