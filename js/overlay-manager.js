// js/overlay-manager.js
import { ABLY_API_KEY, CONTROL_CHANNEL_NAME, STATUS_CHANNEL_NAME, DEBUG } from './ably-config.js'; // Import DEBUG
import { fetchOverlayData } from './utils.js';

import { TextOverlay } from './overlays/TextOverlay.js';
import { LogoOverlay } from './overlays/LogoOverlay.js';
import { BreakingNewsOverlay } from './overlays/BreakingNewsOverlay.js';
import { LowerThirdOverlay } from './overlays/LowerThirdOverlay.js';
import { TickerOverlay } from './overlays/TickerOverlay.js';
import { BRBOverlay } from './overlays/BRBOverlay.js';
import { CSOOverlay } from './overlays/CSOOverlay.js';

const LOG_PREFIX = "[OverlayManager]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    warn: (...args) => DEBUG && console.warn(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

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

        this.brbOverlay = new BRBOverlay('brb-overlay-container', 
            () => { 
                this.csoOverlay.hide(); 
                this.hideAllNonFullscreenOverlays();
            },
            () => { 
                 this.hideAllNonFullscreenOverlays();
            }
        );
        this.csoOverlay = new CSOOverlay('cso-overlay-container',
            () => { 
                this.brbOverlay.hide(); 
                this.hideAllNonFullscreenOverlays();
            },
            () => { 
                 this.hideAllNonFullscreenOverlays();
            }
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
            cso: this.csoOverlay
        };
        logger.log("OverlayManager instance created.");
    }

    async initialize() {
        logger.log('Initializing...');
        try {
            const initialText = await fetchOverlayData('./overlay_data.json', "Overlay Ready");
            this.textOverlay.setText(initialText);
            this.connectToAbly();
        } catch (error) {
            logger.error("Initialization failed", error);
            this.textOverlay.setText("Error initializing overlay system.");
        }
    }

    connectToAbly() {
        if (!ABLY_API_KEY || ABLY_API_KEY === 'YOUR_ABLY_API_KEY_WAS_HERE' || ABLY_API_KEY.length < 10) {
            const errorMsg = "Ably API Key is missing or invalid. Ably connection aborted.";
            logger.error(errorMsg); // This is critical, so log it always.
            this.textOverlay.setText("Ably connection error: API Key missing.");
            return;
        }

        logger.log('Attempting to connect to Ably...');
        try {
            this.ably = new Ably.Realtime(ABLY_API_KEY);
            this.initialStatesPublished = false; 

            this.ably.connection.on('connected', () => {
                this.isAblyConnected = true;
                logger.log('Ably connection is CONNECTED.');
                
                this.controlChannel = this.ably.channels.get(CONTROL_CHANNEL_NAME);
                this.statusChannel = this.ably.channels.get(STATUS_CHANNEL_NAME);
                logger.log("Got channel instances. Control:", this.controlChannel.name, "Status:", this.statusChannel.name);

                let channelsAttached = 0;
                const totalChannelsToAttach = 2;

                const attemptInitialPublish = () => {
                    if (channelsAttached === totalChannelsToAttach && this.isAblyConnected) {
                        logger.log("All required channels attached.");
                        
                        this.subscribeToAblyEvents(); 
                        this.publishStatus('system', 'connected', 'Overlay client connected and channels ready.');
                        
                        if (!this.initialStatesPublished) {
                            logger.log("Scheduling initial state publish...");
                            setTimeout(() => {
                                if (this.isAblyConnected && !this.initialStatesPublished) {
                                    this.publishInitialOverlayStates();
                                    this.initialStatesPublished = true; 
                                } else {
                                    logger.warn("Conditions not met for delayed initial state publish (connected:", this.isAblyConnected, "already published:", this.initialStatesPublished, ")");
                                }
                            }, 750); 
                        }
                    }
                };

                logger.log("Attaching to control channel...");
                this.controlChannel.attach((err) => {
                    if (err) {
                        logger.error(`Failed to attach to control channel '${this.controlChannel.name}':`, err);
                        if (this.statusChannel && this.statusChannel.state === 'attached') {
                            this.publishStatus('system', 'error', `Failed to attach to control channel: ${err.message}`);
                        }
                        return;
                    }
                    logger.log(`Control channel '${this.controlChannel.name}' ATTACHED.`);
                    channelsAttached++;
                    attemptInitialPublish();
                });

                logger.log("Attaching to status channel...");
                this.statusChannel.attach((err) => {
                    if (err) {
                        logger.error(`Failed to attach to status channel '${this.statusChannel.name}':`, err);
                        return;
                    }
                    logger.log(`Status channel '${this.statusChannel.name}' ATTACHED.`);
                    channelsAttached++;
                    attemptInitialPublish();
                });
            });

            this.ably.connection.on('failed', (error) => {  
                this.isAblyConnected = false;
                this.initialStatesPublished = false;
                logger.error('Ably connection failed:', error);
                this.textOverlay.setText("Ably connection failed.");
            });
            this.ably.connection.on('closed', () => {  
                this.isAblyConnected = false;
                this.initialStatesPublished = false;
                logger.log('Ably connection closed.');
            });
            this.ably.connection.on('disconnected', () => {  
                this.isAblyConnected = false;
                this.initialStatesPublished = false;
                logger.log('Ably disconnected. Will attempt to reconnect.');
            });
        } catch (e) {
            logger.error("Error initializing Ably Realtime client:", e);
            this.textOverlay.setText("Failed to initialize Ably client.");
        }
    }

    publishStatus(overlayId, state, message = null, data = null) {
        if (!this.isAblyConnected) {
            logger.warn(`Cannot publish status for ${overlayId} - Ably not connected.`);
            return;
        }
        if (!this.statusChannel) {
            logger.warn(`Cannot publish status for ${overlayId} - Status channel object is null.`);
            return;
        }
        if (this.statusChannel.state !== 'attached') {
            logger.warn(`Cannot publish status for ${overlayId} - Status channel not attached (state: ${this.statusChannel.state}). Aborting publish.`);
            return;
        }

        const payload = { overlayId, state }; 
        if (message) payload.message = message;
        if (data) payload.data = data;

        logger.log(`Publishing status for '${overlayId}': state='${state}'`, message ? `msg='${message}'` : '', data || '');
        this.statusChannel.publish('update', payload, (err) => { 
            if (err) {
                logger.error(`Error publishing status for ${overlayId}:`, err);
            } else {
                // logger.log(`Successfully published status for ${overlayId}`); // Too verbose
            }
        });
    }

    publishInitialOverlayStates() {
        if (!this.isAblyConnected || !this.statusChannel || this.statusChannel.state !== 'attached') {
            logger.warn("publishInitialOverlayStates - Conditions not met (Ably/status channel not ready).");
            return;
        }
        logger.log("==> Starting publishInitialOverlayStates...");
        let publishedCount = 0;
        for (const overlayId in this.overlayInstanceMap) {
            const instance = this.overlayInstanceMap[overlayId];
            if (instance && typeof instance.isVisible !== 'undefined') {
                const currentState = instance.isVisible ? 'shown' : 'hidden';
                logger.log(`  Publishing initial for '${overlayId}' -> '${currentState}'`);
                this.publishStatus(overlayId, currentState, 'Initial state');
                publishedCount++;
            } else {
                logger.warn(`  Skipping initial for '${overlayId}' (instance or isVisible missing).`);
            }
        }
        logger.log(`==> Finished publishInitialOverlayStates. Attempted to publish for ${publishedCount} overlays.`);
        this.publishStatus('system', 'initial_states_published', `Initial states published for ${publishedCount} overlays.`);
    }


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
            logger.log(`Received action '${action}' for ${overlayStringId}`, actionData); 
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

    hideAllNonFullscreenOverlays() {
        logger.log("Hiding all non-fullscreen overlays.");
        this.nonFullscreenOverlays.forEach(overlay => {
            if (overlay.isVisible) { // Check if it's visible before trying to hide
                overlay.hide();
                // Optionally publish status here if needed, though individual hide methods already log.
                // Example: this.publishStatus(this.getOverlayIdByInstance(overlay), 'hidden', 'Hidden due to fullscreen mode');
            }
        });
    }
    // Helper to get overlayId string from instance if needed for above publishStatus
    // getOverlayIdByInstance(instance) {
    //     for (const id in this.overlayInstanceMap) {
    //         if (this.overlayInstanceMap[id] === instance) return id;
    //     }
    //     return 'unknown-overlay';
    // }
}
