// js/overlay-manager.js
import { ABLY_API_KEY, CHANNEL_NAME } from './ably-config.js';
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
        this.isAblyConnected = false;

        // Instantiate all overlays
        this.textOverlay = new TextOverlay('streamweaver-overlay', 'overlay-text');
        this.logoOverlay = new LogoOverlay('logo-container');
        this.breakingNewsOverlay = new BreakingNewsOverlay('breaking-news-container');
        this.lowerThirdOverlay = new LowerThirdOverlay('lower-third-container', 'lt-name', 'lt-title', 'lt-affiliation');
        this.tickerOverlay = new TickerOverlay('ticker-container', 'ticker-content-wrapper', 'ticker-text-span');

        // Fullscreen overlays need callbacks to manage other overlays
        this.brbOverlay = new BRBOverlay('brb-overlay-container', 
            () => { // onShow
                this.csoOverlay.hide(); // Ensure other fullscreen is hidden
                this.hideAllNonFullscreenOverlays();
            },
            () => { // onHide
                // Current behavior: other overlays remain hidden.
                // If restoration is needed, implement logic here.
                 this.hideAllNonFullscreenOverlays(); // Re-ensure others are hidden
            }
        );
        this.csoOverlay = new CSOOverlay('cso-overlay-container',
            () => { // onShow
                this.brbOverlay.hide(); // Ensure other fullscreen is hidden
                this.hideAllNonFullscreenOverlays();
            },
            () => { // onHide
                 this.hideAllNonFullscreenOverlays(); // Re-ensure others are hidden
            }
        );
        
        this.nonFullscreenOverlays = [
            this.textOverlay, this.logoOverlay, this.breakingNewsOverlay,
            this.lowerThirdOverlay, this.tickerOverlay
        ];
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
                this.controlChannel = this.ably.channels.get(CHANNEL_NAME);
                this.subscribeToAblyEvents();
            });

            this.ably.connection.on('failed', (error) => {
                this.isAblyConnected = false;
                console.error('OverlayManager: Ably connection failed:', error);
                this.textOverlay.setText("Ably connection failed.");
            });

            this.ably.connection.on('closed', () => {
                this.isAblyConnected = false;
                console.log('OverlayManager: Ably connection closed.');
            });

            this.ably.connection.on('disconnected', () => {
                this.isAblyConnected = false;
                console.log('OverlayManager: Ably disconnected. Will attempt to reconnect.');
                // Ably's client library handles reconnection attempts by default.
            });
        } catch (e) {
            console.error("OverlayManager: Error initializing Ably Realtime client:", e);
            this.textOverlay.setText("Failed to initialize Ably client.");
        }
    }

    subscribeToAblyEvents() {
        if (!this.controlChannel) {
            console.error("OverlayManager: Control channel not available. Cannot subscribe to events.");
            return;
        }
        console.log(`OverlayManager: Subscribing to Ably actions on channel '${CHANNEL_NAME}'`);

        // Generic handler for simple show/hide/toggle overlays
        const handleSimpleAction = (message, overlayInstance) => {
            const actionData = message.data;
            if (actionData?.action) {
                switch (actionData.action.toLowerCase()) {
                    case 'show': overlayInstance.show(); break;
                    case 'hide': overlayInstance.hide(); break;
                    case 'toggle':
                        if (typeof overlayInstance.toggle === 'function') overlayInstance.toggle();
                        else console.warn("Toggle action called on overlay without toggle method.");
                        break;
                    default: console.warn(`OverlayManager: Unknown action '${actionData.action}' for ${overlayInstance.constructor.name}`);
                }
            }
        };

        this.controlChannel.subscribe('overlay-action', (msg) => handleSimpleAction(msg, this.textOverlay));
        this.controlChannel.subscribe('logo-action', (msg) => handleSimpleAction(msg, this.logoOverlay));
        this.controlChannel.subscribe('breaking-news-action', (msg) => handleSimpleAction(msg, this.breakingNewsOverlay));
        this.controlChannel.subscribe('brb-action', (msg) => handleSimpleAction(msg, this.brbOverlay));
        this.controlChannel.subscribe('cso-action', (msg) => handleSimpleAction(msg, this.csoOverlay));

        this.controlChannel.subscribe('lower-third-action', (message) => {
            const actionData = message.data;
            if (actionData?.action) {
                switch (actionData.action.toLowerCase()) {
                    case 'show': this.lowerThirdOverlay.show(actionData); break;
                    case 'hide': this.lowerThirdOverlay.hide(); break;
                    default: console.warn(`OverlayManager: Unknown action '${actionData.action}' for LowerThird`);
                }
            }
        });

        this.controlChannel.subscribe('ticker-action', (message) => {
            const actionData = message.data;
            if (actionData?.action) {
                switch (actionData.action.toLowerCase()) {
                    case 'show': this.tickerOverlay.updateAndShow(actionData); break;
                    case 'hide': this.tickerOverlay.hide(); break;
                    default: console.warn(`OverlayManager: Unknown action '${actionData.action}' for Ticker`);
                }
            }
        });
    }

    hideAllNonFullscreenOverlays() {
        this.nonFullscreenOverlays.forEach(overlay => {
            if (overlay && typeof overlay.hide === 'function') {
                overlay.hide();
            }
        });
        console.log("OverlayManager: All non-fullscreen overlays commanded to hide.");
    }
}
