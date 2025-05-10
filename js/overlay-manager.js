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

export class OverlayManager {
    constructor() {
        this.ably = null;
        this.controlChannel = null;
        this.statusChannel = null; 
        this.isAblyConnected = false;
        this.initialStatesPublished = false; 

        this.textOverlay = new TextOverlay('streamweaver-overlay', 'overlay-text');
        this.logoOverlay = new LogoOverlay('logo-container');
        // ... (rest of constructor is the same)
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
            this.initialStatesPublished = false; 

            this.ably.connection.on('connected', () => {
                this.isAblyConnected = true;
                console.log('OverlayManager: Ably connection is CONNECTED.');
                
                this.controlChannel = this.ably.channels.get(CONTROL_CHANNEL_NAME);
                this.statusChannel = this.ably.channels.get(STATUS_CHANNEL_NAME);
                console.log("OverlayManager: Got channel instances. Control:", this.controlChannel.name, "Status:", this.statusChannel.name);

                let channelsAttached = 0;
                const totalChannelsToAttach = 2; // control and status

                const attemptInitialPublish = () => {
                    if (channelsAttached === totalChannelsToAttach && this.isAblyConnected) {
                        console.log("OverlayManager: All required channels attached.");
                        
                        // Subscribe to control events (must be done after control channel is attached)
                        this.subscribeToAblyEvents(); 
                        
                        // Publish system connected status *first*
                        this.publishStatus('system', 'connected', 'Overlay client connected and channels ready.');
                        
                        // Then publish initial states with a slight delay
                        if (!this.initialStatesPublished) { // Double check flag before scheduling
                            console.log("OverlayManager: Scheduling initial state publish...");
                            setTimeout(() => {
                                if (this.isAblyConnected && !this.initialStatesPublished) { // Check connection and flag again
                                    this.publishInitialOverlayStates();
                                    this.initialStatesPublished = true; // Set flag AFTER successful publish attempt
                                } else {
                                    console.warn("OverlayManager: Conditions not met for delayed initial state publish (connected:", this.isAblyConnected, "already published:", this.initialStatesPublished, ")");
                                }
                            }, 750); // Increased delay slightly to 750ms
                        }
                    }
                };

                console.log("OverlayManager: Attaching to control channel...");
                this.controlChannel.attach((err) => {
                    if (err) {
                        console.error(`OverlayManager: Failed to attach to control channel '${this.controlChannel.name}':`, err);
                        // Potentially publish a system error status if status channel is already attached
                        if (this.statusChannel && this.statusChannel.state === 'attached') {
                            this.publishStatus('system', 'error', `Failed to attach to control channel: ${err.message}`);
                        }
                        return;
                    }
                    console.log(`OverlayManager: Control channel '${this.controlChannel.name}' ATTACHED.`);
                    channelsAttached++;
                    attemptInitialPublish();
                });

                console.log("OverlayManager: Attaching to status channel...");
                this.statusChannel.attach((err) => {
                    if (err) {
                        console.error(`OverlayManager: Failed to attach to status channel '${this.statusChannel.name}':`, err);
                        return;
                    }
                    console.log(`OverlayManager: Status channel '${this.statusChannel.name}' ATTACHED.`);
                    channelsAttached++;
                    attemptInitialPublish();
                });
            });

            this.ably.connection.on('failed', (error) => { /* ... same, ensure initialStatesPublished = false ... */ 
                this.isAblyConnected = false;
                this.initialStatesPublished = false;
                console.error('OverlayManager: Ably connection failed:', error);
                this.textOverlay.setText("Ably connection failed.");
            });
            this.ably.connection.on('closed', () => { /* ... same, ensure initialStatesPublished = false ... */ 
                this.isAblyConnected = false;
                this.initialStatesPublished = false;
                console.log('OverlayManager: Ably connection closed.');
            });
            this.ably.connection.on('disconnected', () => { /* ... same, ensure initialStatesPublished = false ... */ 
                this.isAblyConnected = false;
                this.initialStatesPublished = false;
                console.log('OverlayManager: Ably disconnected. Will attempt to reconnect.');
            });
        } catch (e) {
            console.error("OverlayManager: Error initializing Ably Realtime client:", e);
            this.textOverlay.setText("Failed to initialize Ably client.");
        }
    }

    publishStatus(overlayId, state, message = null, data = null) {
        if (!this.isAblyConnected) {
            console.warn(`OverlayManager: Cannot publish status for ${overlayId} - Ably not connected.`);
            return;
        }
        if (!this.statusChannel) {
            console.warn(`OverlayManager: Cannot publish status for ${overlayId} - Status channel object is null.`);
            return;
        }
        if (this.statusChannel.state !== 'attached') {
            console.warn(`OverlayManager: Cannot publish status for ${overlayId} - Status channel not attached (state: ${this.statusChannel.state}). Aborting publish.`);
            return;
        }

        const payload = { overlayId, state }; 
        if (message) payload.message = message;
        if (data) payload.data = data;

        console.log(`OverlayManager: Publishing status for '${overlayId}': state='${state}'`, message ? `msg='${message}'` : '', data || '');
        this.statusChannel.publish('update', payload, (err) => { 
            if (err) {
                console.error(`OverlayManager: Error publishing status for ${overlayId}:`, err);
            } else {
                // console.log(`OverlayManager: Successfully published status for ${overlayId}`); // Can be too verbose
            }
        });
    }

    publishInitialOverlayStates() {
        if (!this.isAblyConnected || !this.statusChannel || this.statusChannel.state !== 'attached') {
            console.warn("OverlayManager: publishInitialOverlayStates - Conditions not met (Ably/status channel not ready).");
            return;
        }
        console.log("OverlayManager: ==> Starting publishInitialOverlayStates...");
        let publishedCount = 0;
        for (const overlayId in this.overlayInstanceMap) {
            const instance = this.overlayInstanceMap[overlayId];
            if (instance && typeof instance.isVisible !== 'undefined') {
                // Log before publishing for this specific overlay
                const currentState = instance.isVisible ? 'shown' : 'hidden';
                console.log(`OverlayManager:   Publishing initial for '${overlayId}' -> '${currentState}'`);
                this.publishStatus(overlayId, currentState, 'Initial state');
                publishedCount++;
            } else {
                console.warn(`OverlayManager:   Skipping initial for '${overlayId}' (instance or isVisible missing).`);
            }
        }
        console.log(`OverlayManager: ==> Finished publishInitialOverlayStates. Attempted to publish for ${publishedCount} overlays.`);
        this.publishStatus('system', 'initial_states_published', `Initial states published for ${publishedCount} overlays.`);
    }


    subscribeToAblyEvents() {
        if (!this.isAblyConnected || !this.controlChannel || this.controlChannel.state !== 'attached') {
            console.error("OverlayManager: Cannot subscribe to control events - Ably/control channel not ready (state:", this.controlChannel?.state, ")");
            return;
        }
        console.log(`OverlayManager: Subscribing to Ably actions on attached control channel '${CONTROL_CHANNEL_NAME}'`);
        // ... (rest of createActionHandler and subscriptions are the same) ...
        const createActionHandler = (overlayStringId, overlayInstance) => (message) => {
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
        console.log("OverlayManager: Subscribed to all control actions.");
    }

    hideAllNonFullscreenOverlays() { /* ... (same as before) ... */ }
}
