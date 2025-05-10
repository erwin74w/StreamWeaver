// dashboard.script.js
document.addEventListener('DOMContentLoaded', () => {
    const ablyApiKeyInput = document.getElementById('ablyApiKey');
    const connectAblyButton = document.getElementById('connectAbly');
    // ... (other const declarations for elements are the same)

    const overlayUiMap = {
        brb: { light: document.getElementById('brb-status-light'), showButton: document.getElementById('showBRB') },
        cso: { light: document.getElementById('cso-status-light'), showButton: document.getElementById('showCSO') },
        outro: { light: document.getElementById('outro-status-light'), showButton: document.getElementById('showOutro') }, // Add Outro UI
        ticker: { light: document.getElementById('ticker-status-light'), showButton: document.getElementById('showUpdateTicker') },
        lowerThird: { light: document.getElementById('lowerThird-status-light'), showButton: document.getElementById('showLowerThird') },
        text: { light: document.getElementById('text-status-light'), showButton: document.getElementById('showTextOverlay'), toggleButton: document.getElementById('toggleTextOverlay') },
        logo: { light: document.getElementById('logo-status-light'), showButton: document.getElementById('showLogo'), toggleButton: document.getElementById('toggleLogo') },
        breakingNews: { light: document.getElementById('breakingNews-status-light'), showButton: document.getElementById('showBreakingNews'), toggleButton: document.getElementById('toggleBreakingNews') }
    };
    
    // Re-populating allControlButtons and allControlInputs to include new buttons
    const allControlButtons = [];
    const allControlInputs = [];
    document.querySelectorAll('.control-group button, #connectAbly').forEach(btn => {
        if(!allControlButtons.includes(btn)) allControlButtons.push(btn);
    });
    document.querySelectorAll('.control-group input, .control-group textarea, #ablyApiKey').forEach(input => {
        if(!allControlInputs.includes(input)) allControlInputs.push(input);
    });


    // ... (CONTROL_CHANNEL_NAME, STATUS_CHANNEL_NAME, ably, controlChannel, statusChannel vars are same)
    // ... (updateLastAction, updateGeneralLog, attachChannel, connectToAbly functions are same)
    // ... (publishAction, subscribeToOverlayStatus, disableControls, enableControls functions are same)
    // Make sure the content of these functions is from the previous *working* version.

    // --- Event Listeners ---
    connectAblyButton.addEventListener('click', connectToAbly);
    
    overlayUiMap.brb.showButton.addEventListener('click', () => publishAction('brb-action', { action: 'show' }));
    document.getElementById('hideBRB').addEventListener('click', () => publishAction('brb-action', { action: 'hide' }));
    
    overlayUiMap.cso.showButton.addEventListener('click', () => publishAction('cso-action', { action: 'show' }));
    document.getElementById('hideCSO').addEventListener('click', () => publishAction('cso-action', { action: 'hide' }));

    // New Outro Listeners
    if (overlayUiMap.outro && overlayUiMap.outro.showButton) { // Check if Outro UI elements exist
        overlayUiMap.outro.showButton.addEventListener('click', () => publishAction('outro-action', { action: 'show' }));
    }
    const hideOutroButton = document.getElementById('hideOutro');
    if (hideOutroButton) {
        hideOutroButton.addEventListener('click', () => publishAction('outro-action', { action: 'hide' }));
    }
    
    // ... (Other event listeners: Ticker, Lower Third, Text, Logo, Breaking News - remain the same) ...
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


    // --- Initial Setup ---
    disableControls(); 
    ablyApiKeyInput.disabled = false; 
    connectAblyButton.disabled = false; 

    updateGeneralLog("Dashboard loaded. Please connect to Ably.");
    const savedApiKey = localStorage.getItem('streamWeaverAblyApiKey');
    if (savedApiKey) ablyApiKeyInput.value = savedApiKey;
    ablyApiKeyInput.addEventListener('input', () => { localStorage.setItem('streamWeaverAblyApiKey', ablyApiKeyInput.value); });
    Object.values(overlayUiMap).forEach(ui => {
        if (ui.light) ui.light.classList.add('unknown');
    });
});
