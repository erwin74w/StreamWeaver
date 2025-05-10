// dashboard.script.js
document.addEventListener('DOMContentLoaded', () => {
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
    
    const allControlButtons = [];
    const allControlInputs = [];
    document.querySelectorAll('.control-group button').forEach(btn => allControlButtons.push(btn));
    document.querySelectorAll('.control-group input, .control-group textarea').forEach(input => allControlInputs.push(input));
    if (!allControlButtons.includes(connectAblyButton)) allControlButtons.push(connectAblyButton);
    if (!allControlInputs.includes(ablyApiKeyInput)) allControlInputs.push(ablyApiKeyInput);


    const CONTROL_CHANNEL_NAME = 'streamweaver-control';
    const STATUS_CHANNEL_NAME = 'streamweaver-status'; 
    let ably = null;
    let controlChannel = null;
    let statusChannel = null; 

    function updateLastAction(message) { 
        console.log("Dashboard Sent:", message); 
        lastActionElement.textContent = message; 
    }
    function updateGeneralLog(message, isError = false) { 
        console.log(`Dashboard General Log (${isError ? 'ERROR' : 'INFO'}):`, message); 
        generalLogElement.textContent = message;
        generalLogElement.style.color = isError ? 'red' : 'inherit';
    }
    
    function attachChannel(channel, channelNameForLog) {
        return new Promise((resolve, reject) => {
            if (!channel) {
                reject(new Error(`Channel object for ${channelNameForLog} is null.`));
                return;
            }
            console.log(`Dashboard: Attempting to attach to ${channelNameForLog} channel (current state: ${channel.state})`);
            updateGeneralLog(`Attaching to ${channelNameForLog} channel...`);
            channel.attach((err) => {
                if (err) {
                    console.error(`Dashboard: Failed to attach to ${channelNameForLog} Channel:`, err);
                    updateGeneralLog(`${channelNameForLog} Channel attach failed: ${err.message || 'Unknown Error'} (Code: ${err.code}, Status: ${err.statusCode})`, true);
                    ablyStatusElement.textContent = `${channelNameForLog} channel attach error.`; ablyStatusElement.style.color = "red";
                    reject(err);
                } else {
                    console.log(`Dashboard: ${channelNameForLog} Channel attached successfully (state: ${channel.state}).`);
                    updateGeneralLog(`${channelNameForLog} Channel attached.`);
                    resolve();
                }
            });
        });
    }

    async function connectToAbly() {
        const apiKey = ablyApiKeyInput.value;
        if (!apiKey || apiKey === 'YOUR_ABLY_API_KEY_WAS_HERE' || apiKey.length < 10) {
            ablyStatusElement.textContent = "Valid API Key required."; ablyStatusElement.style.color = "red"; return;
        }
        if (ably) {
             ably.close(); 
             ably = null; controlChannel = null; statusChannel = null; 
        }
        ablyStatusElement.textContent = "Connecting..."; ablyStatusElement.style.color = "orange";
        updateGeneralLog("Attempting to connect to Ably...");
        
        try {
            ably = new Ably.Realtime(apiKey);
        } catch (e) {
            ablyStatusElement.textContent = `Ably client init failed: ${e.message}`; ablyStatusElement.style.color = "red"; 
            updateGeneralLog(`Ably client initialization error: ${e.message}`, true);
            console.error('Dashboard Ably client init fail:', e); 
            disableControls();
            return;
        }

        ably.connection.on('connected', async () => {
            ablyStatusElement.textContent = `Ably Connected! Attaching channels...`;
            ablyStatusElement.style.color = "green";
            updateGeneralLog("Successfully connected to Ably. Attaching channels...");

            controlChannel = ably.channels.get(CONTROL_CHANNEL_NAME);
            statusChannel = ably.channels.get(STATUS_CHANNEL_NAME);
            
            try {
                await attachChannel(controlChannel, "Control");
                await attachChannel(statusChannel, "Status");

                ablyStatusElement.textContent = `Channels Ready! (Ctrl: ${CONTROL_CHANNEL_NAME}, Status: ${STATUS_CHANNEL_NAME})`;
                ablyStatusElement.style.color = "green";
                updateGeneralLog("All channels attached. Subscribing to status updates...");
                subscribeToOverlayStatus(); 
                enableControls();

            } catch (error) {
                console.error("Dashboard: One or more channels failed to attach.", error);
                updateGeneralLog("Failed to attach all required channels. Check console and API key permissions.", true);
                if (ablyStatusElement.style.color !== "red") { 
                     ablyStatusElement.textContent = "Channel attachment failed.";
                     ablyStatusElement.style.color = "red";
                }
                disableControls(); 
            }
        });
        
        ably.connection.on('failed', (err) => { 
            ablyStatusElement.textContent = `Ably connection failed: ${err.reason || err.message || 'Unknown error'}`; 
            ablyStatusElement.style.color = "red"; 
            updateGeneralLog(`Ably connection failed: ${err.reason || err.message || 'Unknown error'}`, true);
            console.error('Dashboard Ably fail:', err); 
            disableControls(); 
        });
        ably.connection.on('closed', () => { 
            ablyStatusElement.textContent = "Ably connection closed."; 
            ablyStatusElement.style.color = "gray"; 
            updateGeneralLog("Ably connection closed.");
            disableControls(); 
        });
        ably.connection.on('disconnected', () => { 
            ablyStatusElement.textContent = "Ably disconnected. Will attempt to reconnect."; 
            ablyStatusElement.style.color = "orange"; 
            updateGeneralLog("Ably disconnected. Attempting to reconnect...");
            disableControls(); 
        });
    }
    
    function publishAction(eventName, payload) {
        if (!controlChannel || controlChannel.state !== 'attached') { 
            const msg = `Error: Control channel not attached (state: ${controlChannel ? controlChannel.state : 'null'}). Cannot send.`;
            updateLastAction(msg); 
            updateGeneralLog(msg, true);
            ablyStatusElement.textContent = "Control channel not ready."; ablyStatusElement.style.color = "red"; 
            return; 
        }
        controlChannel.publish(eventName, payload, (err) => {
            if (err) { 
                updateLastAction(`Error publishing ${eventName}: ${err.message}`); 
                updateGeneralLog(`Error sending action ${eventName}: ${err.message}`, true);
            } 
            else { updateLastAction(`Sent ${eventName}: ${JSON.stringify(payload)}`); }
        });
    }

    function subscribeToOverlayStatus() {
        if (!statusChannel || statusChannel.state !== 'attached') {
            const msg = `Cannot subscribe: Status channel not attached (state: ${statusChannel ? statusChannel.state : 'null'}).`;
            console.error("Dashboard:", msg);
            updateGeneralLog(msg, true);
            return;
        }
        
        console.log("Dashboard: Subscribing to messages on attached Status Channel:", STATUS_CHANNEL_NAME);
        updateGeneralLog("Subscribed to overlay status channel. Waiting for updates...");

        statusChannel.subscribe('update', (message) => {
            console.log("Dashboard: statusChannel 'update' RECEIVED:", JSON.stringify(message.data)); 

            try {
                const { overlayId, state, message: statusMsg, data } = message.data;
                console.log(`Dashboard: Processing status for overlayId='${overlayId}', state='${state}'`);

                const ui = overlayUiMap[overlayId];
                
                if (ui && ui.light) {
                    console.log(`Dashboard: Found UI mapping for '${overlayId}'. Light element:`, ui.light);
                    ui.light.className = 'status-light'; 
                    
                    if (state === 'shown') {
                        ui.light.classList.add('visible');
                        console.log(`Dashboard: Set '${overlayId}' light to VISIBLE.`);
                    } else if (state === 'hidden') {
                        ui.light.classList.add('hidden');
                        console.log(`Dashboard: Set '${overlayId}' light to HIDDEN.`);
                    } else if (state === 'error') {
                        ui.light.classList.add('error');
                        console.error(`Dashboard: Overlay Error reported for '${overlayId}': ${statusMsg || 'Unknown error'}`, data);
                        updateGeneralLog(`Error on ${overlayId}: ${statusMsg || 'Unknown error'}`, true);
                        console.log(`Dashboard: Set '${overlayId}' light to ERROR.`);
                    } else {
                        ui.light.classList.add('unknown');
                        console.log(`Dashboard: Set '${overlayId}' light to UNKNOWN (unrecognized state: ${state}).`);
                    }
                } else if (overlayId === 'system') {
                    updateGeneralLog(`System Status: ${statusMsg || state}`);
                    console.log(`Dashboard: Processed SYSTEM message: ${statusMsg || state}`);
                } else if (overlayId !== 'system') { 
                    console.warn(`Dashboard: No UI mapping or light element found for overlayId: '${overlayId}'. Message data:`, message.data);
                }
            } catch (e) {
                console.error("Dashboard: ERROR INSIDE statusChannel.subscribe CALLBACK:", e);
                updateGeneralLog("Error processing status update: " + e.message, true);
            }
        });
    }

    function disableControls() {
        allControlButtons.forEach(btn => { if(btn !== connectAblyButton) btn.disabled = true; }); // Keep connectAbly enabled
        allControlInputs.forEach(input => { if(input !== ablyApiKeyInput) input.disabled = true; }); // Keep API key enabled
        
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
    
    overlayUiMap.brb.showButton.addEventListener('click', () => publishAction('brb-action', { action: 'show' }));
    document.getElementById('hideBRB').addEventListener('click', () => publishAction('brb-action', { action: 'hide' }));
    overlayUiMap.cso.showButton.addEventListener('click', () => publishAction('cso-action', { action: 'show' }));
    document.getElementById('hideCSO').addEventListener('click', () => publishAction('cso-action', { action: 'hide' }));
    overlayUiMap.ticker.showButton.addEventListener('click', () => { const text = tickerTextInput.value.trim(); if (!text) { alert("Ticker text required."); tickerTextInput.focus(); return; } publishAction('ticker-action', { action: 'show', text: text }); });
    document.getElementById('hideTicker').addEventListener('click', () => publishAction('ticker-action', { action: 'hide' }));
    overlayUiMap.lowerThird.showButton.addEventListener('click', () => { const name = ltNameInput.value.trim(); const title = ltTitleInput.value.trim(); const affiliation = ltAffiliationInput.value.trim(); if (!name) { alert("LT Name required."); ltNameInput.focus(); return; } publishAction('lower-third-action', { action: 'show', name: name, title: title, affiliation: affiliation }); });
    document.getElementById('hideLowerThird').addEventListener('click', () => publishAction('lower-third-action', { action: 'hide' }));
    overlayUiMap.text.showButton.addEventListener('click', () => publishAction('overlay-action', { action: 'show' }));
    if (overlayUiMap.text.toggleButton) { 
        document.getElementById('hideTextOverlay').addEventListener('click', () => publishAction('overlay-action', { action: 'hide' }));
        overlayUiMap.text.toggleButton.addEventListener('click', () => publishAction('overlay-action', { action: 'toggle' }));
    }
    overlayUiMap.logo.showButton.addEventListener('click', () => publishAction('logo-action', { action: 'show' }));
    if (overlayUiMap.logo.toggleButton) { 
        document.getElementById('hideLogo').addEventListener('click', () => publishAction('logo-action', { action: 'hide' }));
        overlayUiMap.logo.toggleButton.addEventListener('click', () => publishAction('logo-action', { action: 'toggle' }));
    }
    overlayUiMap.breakingNews.showButton.addEventListener('click', () => publishAction('breaking-news-action', { action: 'show' }));
    if (overlayUiMap.breakingNews.toggleButton) { 
         document.getElementById('hideBreakingNews').addEventListener('click', () => publishAction('breaking-news-action', { action: 'hide' }));
        overlayUiMap.breakingNews.toggleButton.addEventListener('click', () => publishAction('breaking-news-action', { action: 'toggle' }));
    }

    disableControls(); // Initial state: most controls disabled until connection
    ablyApiKeyInput.disabled = false; // API key input always enabled
    connectAblyButton.disabled = false; // Connect button always enabled

    updateGeneralLog("Dashboard loaded. Please connect to Ably.");
    const savedApiKey = localStorage.getItem('streamWeaverAblyApiKey');
    if (savedApiKey) ablyApiKeyInput.value = savedApiKey;
    ablyApiKeyInput.addEventListener('input', () => { localStorage.setItem('streamWeaverAblyApiKey', ablyApiKeyInput.value); });
    Object.values(overlayUiMap).forEach(ui => {
        if (ui.light) ui.light.classList.add('unknown');
    });
});
