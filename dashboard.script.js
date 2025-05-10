// dashboard.script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Global DEBUG Flag for Dashboard ---
    const DEBUG = true;
    const LOG_PREFIX = "[Dashboard]";

    // Helper for conditional logging
    const logger = {
        log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
        warn: (...args) => DEBUG && console.warn(LOG_PREFIX, ...args),
        error: (...args) => console.error(LOG_PREFIX, ...args), // Errors are usually important
        info: (...args) => DEBUG && console.info(LOG_PREFIX, ...args),
    };

    const ablyApiKeyInput = document.getElementById('ablyApiKey');
    const connectAblyButton = document.getElementById('connectAbly');
    const ablyStatusElement = document.getElementById('ablyStatus');
    const lastActionElement = document.getElementById('lastAction');
    const generalLogElement = document.getElementById('generalLog');

    const tickerTextInput = document.getElementById('tickerTextInput');
    const ltNameInput = document.getElementById('ltNameInput');
    const ltTitleInput = document.getElementById('ltTitleInput');
    const ltAffiliationInput = document.getElementById('ltAffiliationInput');

    const overlayUiMap = {
        brb: { light: document.getElementById('brb-status-light'), showButton: document.getElementById('showBRB') },
        cso: { light: document.getElementById('cso-status-light'), showButton: document.getElementById('showCSO') },
        ticker: { light: document.getElementById('ticker-status-light'), showButton: document.getElementById('showUpdateTicker') },
        lowerThird: { light: document.getElementById('lowerThird-status-light'), showButton: document.getElementById('showLowerThird') },
        text: { light: document.getElementById('text-status-light'), showButton: document.getElementById('showTextOverlay'), toggleButton: document.getElementById('toggleTextOverlay') },
        logo: { light: document.getElementById('logo-status-light'), showButton: document.getElementById('showLogo'), toggleButton: document.getElementById('toggleLogo') },
        breakingNews: { light: document.getElementById('breakingNews-status-light'), showButton: document.getElementById('showBreakingNews'), toggleButton: document.getElementById('toggleBreakingNews') }
    };
    
    const allControlButtons = Array.from(document.querySelectorAll('.control-group button'));
    const allControlInputs = Array.from(document.querySelectorAll('.control-group input, .control-group textarea'));


    const CONTROL_CHANNEL_NAME = 'streamweaver-control';
    const STATUS_CHANNEL_NAME = 'streamweaver-status'; 
    let ably = null;
    let controlChannel = null;
    let statusChannel = null; 

    function updateLastAction(message) { 
        logger.log("Sent:", message); 
        lastActionElement.textContent = message; 
    }
    function updateGeneralLog(message, isError = false) { 
        logger.log(`General Log (${isError ? 'ERROR' : 'INFO'}):`, message); 
        generalLogElement.textContent = message;
        generalLogElement.style.color = isError ? 'var(--color-error-text)' : 'inherit';
    }
    
    function setAblyStatus(message, color) {
        ablyStatusElement.textContent = message;
        ablyStatusElement.style.color = color;
    }

    function attachChannel(channel, channelNameForLog) {
        return new Promise((resolve, reject) => {
            if (!channel) {
                const errMsg = `Channel object for ${channelNameForLog} is null.`;
                updateGeneralLog(errMsg, true); // This uses logger internally if it's an error
                reject(new Error(errMsg));
                return;
            }
            logger.log(`Attempting to attach to ${channelNameForLog} channel (current state: ${channel.state})`);
            updateGeneralLog(`Attaching to ${channelNameForLog} channel...`);
            channel.attach((err) => {
                if (err) {
                    const errMsg = `Failed to attach to ${channelNameForLog} Channel: ${err.message || 'Unknown Error'} (Code: ${err.code}, Status: ${err.statusCode})`;
                    logger.error(errMsg); // Use logger.error
                    updateGeneralLog(errMsg, true);
                    setAblyStatus(`${channelNameForLog} channel attach error.`, 'var(--color-error)');
                    reject(err);
                } else {
                    logger.log(`${channelNameForLog} Channel attached successfully (state: ${channel.state}).`);
                    updateGeneralLog(`${channelNameForLog} Channel attached.`);
                    resolve();
                }
            });
        });
    }

    async function connectToAbly() {
        const apiKey = ablyApiKeyInput.value;
        if (!apiKey || apiKey === 'YOUR_ABLY_API_KEY_WAS_HERE' || apiKey.length < 10) {
            setAblyStatus("Valid API Key required.", 'var(--color-error)'); return;
        }
        if (ably) {
             ably.close(); 
             ably = null; controlChannel = null; statusChannel = null; 
        }
        setAblyStatus("Connecting...", 'var(--color-warning-dark)');
        updateGeneralLog("Attempting to connect to Ably...");
        
        try {
            ably = new Ably.Realtime(apiKey);
        } catch (e) {
            setAblyStatus(`Ably client init failed: ${e.message}`, 'var(--color-error)'); 
            updateGeneralLog(`Ably client initialization error: ${e.message}`, true);
            logger.error('Ably client init fail:', e); 
            disableControls();
            return;
        }

        ably.connection.on('connected', async () => {
            setAblyStatus(`Ably Connected! Attaching channels...`, 'var(--color-success)');
            updateGeneralLog("Successfully connected to Ably. Attaching channels...");

            controlChannel = ably.channels.get(CONTROL_CHANNEL_NAME);
            statusChannel = ably.channels.get(STATUS_CHANNEL_NAME);
            
            try {
                await attachChannel(controlChannel, "Control");
                await attachChannel(statusChannel, "Status");

                setAblyStatus(`Channels Ready! (Ctrl: ${CONTROL_CHANNEL_NAME}, Status: ${STATUS_CHANNEL_NAME})`, 'var(--color-success)');
                updateGeneralLog("All channels attached. Subscribing to status updates...");
                subscribeToOverlayStatus(); 
                enableControls();

            } catch (error) {
                logger.error("One or more channels failed to attach.", error);
                updateGeneralLog("Failed to attach all required channels. Check console and API key permissions.", true);
                if (ablyStatusElement.style.color !== 'var(--color-error)') { 
                     setAblyStatus("Channel attachment failed.", 'var(--color-error)');
                }
                disableControls(); 
            }
        });
        
        ably.connection.on('failed', (err) => { 
            const errMsg = `Ably connection failed: ${err.reason?.message || err.reason || err.message || 'Unknown error'}`;
            setAblyStatus(errMsg, 'var(--color-error)'); 
            updateGeneralLog(errMsg, true);
            logger.error('Ably fail:', err); 
            disableControls(); 
        });
        ably.connection.on('closed', () => { 
            setAblyStatus("Ably connection closed.", 'var(--color-neutral-dark)'); 
            updateGeneralLog("Ably connection closed.");
            disableControls(); 
        });
        ably.connection.on('disconnected', () => { 
            setAblyStatus("Ably disconnected. Will attempt to reconnect.", 'var(--color-warning-dark)'); 
            updateGeneralLog("Ably disconnected. Attempting to reconnect...");
            disableControls(); 
        });
    }
    
    function publishAction(eventName, payload) {
        if (!controlChannel || controlChannel.state !== 'attached') { 
            const msg = `Error: Control channel not attached (current state: ${controlChannel ? controlChannel.state : 'null'}). Cannot send action. Please ensure Ably is connected and channel permissions are correct.`;
            updateLastAction(msg); 
            updateGeneralLog(msg, true);
            setAblyStatus("Control channel not ready. Cannot send.", 'var(--color-error)'); 
            return; 
        }
        controlChannel.publish(eventName, payload, (err) => {
            if (err) { 
                const errMsg = `Error publishing ${eventName}: ${err.message}`;
                updateLastAction(errMsg); 
                updateGeneralLog(`Error sending action ${eventName}: ${err.message} (Code: ${err.code}, Status: ${err.statusCode})`, true);
            } 
            else { updateLastAction(`Sent ${eventName}: ${JSON.stringify(payload)}`); }
        });
    }

    function subscribeToOverlayStatus() {
        if (!statusChannel || statusChannel.state !== 'attached') {
            const msg = `Cannot subscribe: Status channel not attached (state: ${statusChannel ? statusChannel.state : 'null'}). Status updates will not be received.`;
            logger.error(msg);
            updateGeneralLog(msg, true);
            return;
        }
        
        logger.log("Subscribing to messages on attached Status Channel:", STATUS_CHANNEL_NAME);
        updateGeneralLog("Subscribed to overlay status channel. Waiting for updates...");

        statusChannel.subscribe('update', (message) => {
            logger.log("statusChannel 'update' RECEIVED:", JSON.stringify(message.data)); 

            try {
                const { overlayId, state, message: statusMsg, data } = message.data;
                logger.log(`Processing status for overlayId='${overlayId}', state='${state}'`);

                const ui = overlayUiMap[overlayId];
                
                if (ui && ui.light) {
                    logger.log(`Found UI mapping for '${overlayId}'. Light element:`, ui.light);
                    ui.light.className = 'status-light'; 
                    
                    switch(state) {
                        case 'shown':
                            ui.light.classList.add('visible');
                            logger.log(`Set '${overlayId}' light to VISIBLE.`);
                            break;
                        case 'hidden':
                            ui.light.classList.add('hidden');
                            logger.log(`Set '${overlayId}' light to HIDDEN.`);
                            break;
                        case 'error':
                            ui.light.classList.add('error');
                            logger.error(`Overlay Error reported for '${overlayId}': ${statusMsg || 'Unknown error'}`, data);
                            updateGeneralLog(`Error on ${overlayId}: ${statusMsg || 'Unknown error'}`, true);
                            logger.log(`Set '${overlayId}' light to ERROR.`);
                            break;
                        default:
                            ui.light.classList.add('unknown');
                            logger.log(`Set '${overlayId}' light to UNKNOWN (unrecognized state: ${state}).`);
                    }
                } else if (overlayId === 'system') {
                    updateGeneralLog(`System Status: ${statusMsg || state}`);
                    logger.log(`Processed SYSTEM message: ${statusMsg || state}`);
                } else if (overlayId !== 'system') { 
                    logger.warn(`No UI mapping or light element found for overlayId: '${overlayId}'. Message data:`, message.data);
                }
            } catch (e) {
                logger.error("ERROR INSIDE statusChannel.subscribe CALLBACK:", e);
                updateGeneralLog("Error processing status update: " + e.message, true);
            }
        });
    }

    function disableControls() {
        allControlButtons.forEach(btn => { if(btn !== connectAblyButton) btn.disabled = true; });
        allControlInputs.forEach(input => { if(input !== ablyApiKeyInput) input.disabled = true; });
        
        for (const key in overlayUiMap) {
            if (overlayUiMap[key] && overlayUiMap[key].light) {
                overlayUiMap[key].light.className = 'status-light unknown';
            }
        }
    }
    function enableControls() {
        allControlButtons.forEach(btn => btn.disabled = false);
        allControlInputs.forEach(input => input.disabled = false);
    }

    connectAblyButton.addEventListener('click', connectToAbly);
    
    document.getElementById('showBRB').addEventListener('click', () => publishAction('brb-action', { action: 'show' }));
    document.getElementById('hideBRB').addEventListener('click', () => publishAction('brb-action', { action: 'hide' }));
    document.getElementById('showCSO').addEventListener('click', () => publishAction('cso-action', { action: 'show' }));
    document.getElementById('hideCSO').addEventListener('click', () => publishAction('cso-action', { action: 'hide' }));
    document.getElementById('showUpdateTicker').addEventListener('click', () => { 
        const text = tickerTextInput.value.trim(); 
        if (!text) { alert("Ticker text required."); tickerTextInput.focus(); return; } 
        publishAction('ticker-action', { action: 'show', text: text }); 
    });
    document.getElementById('hideTicker').addEventListener('click', () => publishAction('ticker-action', { action: 'hide' }));
    document.getElementById('showLowerThird').addEventListener('click', () => { 
        const name = ltNameInput.value.trim(); 
        const title = ltTitleInput.value.trim(); 
        const affiliation = ltAffiliationInput.value.trim(); 
        if (!name) { alert("Lower Third Name required."); ltNameInput.focus(); return; } 
        publishAction('lower-third-action', { action: 'show', name: name, title: title, affiliation: affiliation }); 
    });
    document.getElementById('hideLowerThird').addEventListener('click', () => publishAction('lower-third-action', { action: 'hide' }));
    document.getElementById('showTextOverlay').addEventListener('click', () => publishAction('overlay-action', { action: 'show' }));
    document.getElementById('hideTextOverlay').addEventListener('click', () => publishAction('overlay-action', { action: 'hide' }));
    document.getElementById('toggleTextOverlay').addEventListener('click', () => publishAction('overlay-action', { action: 'toggle' }));
    document.getElementById('showLogo').addEventListener('click', () => publishAction('logo-action', { action: 'show' }));
    document.getElementById('hideLogo').addEventListener('click', () => publishAction('logo-action', { action: 'hide' }));
    document.getElementById('toggleLogo').addEventListener('click', () => publishAction('logo-action', { action: 'toggle' }));
    document.getElementById('showBreakingNews').addEventListener('click', () => publishAction('breaking-news-action', { action: 'show' }));
    document.getElementById('hideBreakingNews').addEventListener('click', () => publishAction('breaking-news-action', { action: 'hide' }));
    document.getElementById('toggleBreakingNews').addEventListener('click', () => publishAction('breaking-news-action', { action: 'toggle' }));

    disableControls(); 
    ablyApiKeyInput.disabled = false; 
    connectAblyButton.disabled = false;

    updateGeneralLog("Dashboard loaded. Please connect to Ably.");
    const savedApiKey = localStorage.getItem('streamWeaverAblyApiKey');
    if (savedApiKey) {
        ablyApiKeyInput.value = savedApiKey;
    }
    ablyApiKeyInput.addEventListener('input', () => { 
        localStorage.setItem('streamWeaverAblyApiKey', ablyApiKeyInput.value); 
    });
    
    Object.values(overlayUiMap).forEach(ui => {
        if (ui.light) ui.light.classList.add('unknown');
    });
});
