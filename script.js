// script.js (for index.html - Overlay Logic)
document.addEventListener('DOMContentLoaded', () => {
    // ... (previous element getters for logo, breaking news, text overlay, lower third)
    const overlayElement = document.getElementById('streamweaver-overlay');
    const overlayTextElement = document.getElementById('overlay-text');
    const logoContainerElement = document.getElementById('logo-container');
    const breakingNewsContainerElement = document.getElementById('breaking-news-container');
    const lowerThirdContainerElement = document.getElementById('lower-third-container');
    const ltNameElement = document.getElementById('lt-name');
    const ltTitleElement = document.getElementById('lt-title');
    const ltAffiliationElement = document.getElementById('lt-affiliation');

    // --- Ticker Overlay Elements ---
    const tickerContainerElement = document.getElementById('ticker-container');
    const tickerContentWrapperElement = document.getElementById('ticker-content-wrapper');
    const tickerTextSpanElement = document.getElementById('ticker-text-span');

    const ABLY_API_KEY = 'PpmbHg.J6_8kg:qC-BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik'; 
    const CHANNEL_NAME = 'streamweaver-control'; 

    if (ABLY_API_KEY === 'YOUR_ABLY_API_KEY_WAS_HERE' || !ABLY_API_KEY || ABLY_API_KEY.length < 10) {
        console.warn("Ably API Key placeholder active. User needs to insert actual key.");
    }

    // --- 1. Fetch initial overlay data (for text overlay) ---
    // ... (same as before)
    fetch('./overlay_data.json') 
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
        .then(data => overlayTextElement.textContent = data?.message || "Overlay Ready")
        .catch(error => {
            console.error("Error fetching overlay_data.json:", error);
            if(overlayTextElement) overlayTextElement.textContent = "Error loading data";
        });

    // --- Show/Hide Functions for other overlays (same as before) ---
    function showTextOverlay() { /* ... */ }
    function hideTextOverlay() { /* ... */ }
    function showLogo() { /* ... */ }
    function hideLogo() { /* ... */ }
    function showBreakingNews() { /* ... */ }
    function hideBreakingNews() { /* ... */ }
    function showLowerThird(data) { /* ... (as before) */ }
    function hideLowerThird() { /* ... (as before) */ }
    if (overlayElement) { // Quick check for text overlay functions
        showTextOverlay = function() { overlayElement.classList.add('show'); console.log("Text Overlay: SHOWN"); };
        hideTextOverlay = function() { overlayElement.classList.remove('show'); console.log("Text Overlay: HIDDEN"); };
    }
    if (logoContainerElement) {
        showLogo = function() { logoContainerElement.classList.add('show-logo'); console.log("Logo Overlay: SHOWN"); };
        hideLogo = function() { logoContainerElement.classList.remove('show-logo'); console.log("Logo Overlay: HIDDEN"); };
    }
    if (breakingNewsContainerElement) {
        showBreakingNews = function() { breakingNewsContainerElement.classList.add('show-breaking-news'); console.log("BN Overlay: SHOWN"); };
        hideBreakingNews = function() { breakingNewsContainerElement.classList.remove('show-breaking-news'); console.log("BN Overlay: HIDDEN"); };
    }
    if (lowerThirdContainerElement && ltNameElement && ltTitleElement && ltAffiliationElement) {
        showLowerThird = function(data) {
            ltNameElement.textContent = data.name || ""; ltTitleElement.textContent = data.title || ""; ltAffiliationElement.textContent = data.affiliation || "";
            ltNameElement.style.display = data.name ? 'block' : 'none'; ltTitleElement.style.display = data.title ? 'block' : 'none'; ltAffiliationElement.style.display = data.affiliation ? 'block' : 'none';
            lowerThirdContainerElement.classList.add('show-lower-third'); console.log("LT: SHOWN", data);
        };
        hideLowerThird = function() { lowerThirdContainerElement.classList.remove('show-lower-third'); console.log("LT: HIDDEN"); };
    }


    // --- Ticker Show/Hide/Update Functions ---
    function showTicker(data) {
        if (tickerContainerElement && tickerTextSpanElement && tickerContentWrapperElement) {
            const newText = data.text || "StreamWeaver Ticker Active...";
            // Add extra non-breaking spaces to create a visual gap for continuous scroll illusion
            const trailingSpaces = " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 "; 
            tickerTextSpanElement.textContent = newText + trailingSpaces;

            // Restart animation: remove class, trigger reflow, add class back
            // This ensures the animation recalculates based on new text width if it changed
            // and makes it start from the beginning.
            if (tickerContentWrapperElement.classList.contains('animate')) {
                tickerContentWrapperElement.classList.remove('animate');
                void tickerContentWrapperElement.offsetWidth; // Force reflow to reset animation
            }
            tickerContentWrapperElement.classList.add('animate');
            
            tickerContainerElement.classList.add('show-ticker');
            console.log("Ticker: SHOWN/UPDATED with text:", newText);
        }
    }

    function hideTicker() {
        if (tickerContainerElement && tickerContentWrapperElement) {
            tickerContainerElement.classList.remove('show-ticker');
            tickerContentWrapperElement.classList.remove('animate'); // Stop animation
            console.log("Ticker: HIDDEN");
        }
    }

    // --- Ably Client Setup ---
    // ... (same as before, ensure it's defined once)
    console.log('Overlay: Initializing Ably...');
    const ablyOverlay = new Ably.Realtime(ABLY_API_KEY);
    const controlChannel = ablyOverlay.channels.get(CHANNEL_NAME);

    ablyOverlay.connection.on('connected', () => console.log('Overlay: Successfully connected to Ably!'));
    ablyOverlay.connection.on('failed', (err) => console.error('Overlay: Ably connection failed:', err));
    
    // --- Ably Subscriptions (including new Ticker subscription) ---
    // ... (subscriptions for overlay-action, logo-action, breaking-news-action, lower-third-action as before)
    controlChannel.subscribe('overlay-action', (message) => {
        const d = message.data; if(d?.action){ switch(d.action.toLowerCase()){ case 'show': showTextOverlay(); break; case 'hide': hideTextOverlay(); break; case 'toggle': overlayElement.classList.contains('show')?hideTextOverlay():showTextOverlay(); break; }}
    });
    controlChannel.subscribe('logo-action', (message) => {
        const d = message.data; if(d?.action){ switch(d.action.toLowerCase()){ case 'show': showLogo(); break; case 'hide': hideLogo(); break; case 'toggle': logoContainerElement.classList.contains('show-logo')?hideLogo():showLogo(); break; }}
    });
    controlChannel.subscribe('breaking-news-action', (message) => {
        const d = message.data; if(d?.action){ switch(d.action.toLowerCase()){ case 'show': showBreakingNews(); break; case 'hide': hideBreakingNews(); break; case 'toggle': breakingNewsContainerElement.classList.contains('show-breaking-news')?hideBreakingNews():showBreakingNews(); break; }}
    });
    controlChannel.subscribe('lower-third-action', (message) => {
        const d = message.data; if(d?.action){ switch(d.action.toLowerCase()){ case 'show': showLowerThird(d); break; case 'hide': hideLowerThird(); break; }}
    });


    // Subscribe to actions for the TICKER
    controlChannel.subscribe('ticker-action', (message) => {
        console.log('Overlay: Received Ably message on "ticker-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': // This will also handle updates if ticker is already shown
                    showTicker(actionData); // Expects actionData.text
                    break;
                case 'hide':
                    hideTicker();
                    break;
                default: console.warn('Overlay: Unknown action received for ticker:', actionData.action);
            }
        }
    });
});
