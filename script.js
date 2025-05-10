// script.js (for index.html - Overlay Logic)
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Getters ---
    const overlayElement = document.getElementById('streamweaver-overlay');
    const overlayTextElement = document.getElementById('overlay-text');
    const logoContainerElement = document.getElementById('logo-container');
    const breakingNewsContainerElement = document.getElementById('breaking-news-container');
    const lowerThirdContainerElement = document.getElementById('lower-third-container');
    const ltNameElement = document.getElementById('lt-name');
    const ltTitleElement = document.getElementById('lt-title');
    const ltAffiliationElement = document.getElementById('lt-affiliation');
    const tickerContainerElement = document.getElementById('ticker-container');
    const tickerContentWrapperElement = document.getElementById('ticker-content-wrapper');
    const tickerTextSpanElement = document.getElementById('ticker-text-span');
    const brbOverlayContainerElement = document.getElementById('brb-overlay-container');
    const csoOverlayContainerElement = document.getElementById('cso-overlay-container'); // New

    // --- Ably Configuration ---
    const ABLY_API_KEY = 'BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik'; 
    const CHANNEL_NAME = 'streamweaver-control'; 

    if (ABLY_API_KEY === 'YOUR_ABLY_API_KEY_WAS_HERE' || !ABLY_API_KEY || ABLY_API_KEY.length < 10) {
        console.warn("Ably API Key placeholder active. User needs to insert actual key.");
    }

    // --- Overlay Control Functions (Minor Overlays) ---
    function showTextOverlay() { if (overlayElement) { overlayElement.classList.add('show'); console.log("Text Overlay: SHOWN"); } }
    function hideTextOverlay() { if (overlayElement) { overlayElement.classList.remove('show'); console.log("Text Overlay: HIDDEN"); } }
    function showLogo() { if (logoContainerElement) { logoContainerElement.classList.add('show-logo'); console.log("Logo: SHOWN"); } }
    function hideLogo() { if (logoContainerElement) { logoContainerElement.classList.remove('show-logo'); console.log("Logo: HIDDEN"); } }
    function showBreakingNews() { if (breakingNewsContainerElement) { breakingNewsContainerElement.classList.add('show-breaking-news'); console.log("BN: SHOWN"); } }
    function hideBreakingNews() { if (breakingNewsContainerElement) { breakingNewsContainerElement.classList.remove('show-breaking-news'); console.log("BN: HIDDEN"); } }
    function showLowerThird(data) {
        if (lowerThirdContainerElement && ltNameElement && ltTitleElement && ltAffiliationElement) {
            ltNameElement.textContent = data.name || ""; ltTitleElement.textContent = data.title || ""; ltAffiliationElement.textContent = data.affiliation || "";
            ltNameElement.style.display = data.name ? 'block' : 'none'; ltTitleElement.style.display = data.title ? 'block' : 'none'; ltAffiliationElement.style.display = data.affiliation ? 'block' : 'none';
            lowerThirdContainerElement.classList.add('show-lower-third'); console.log("LT: SHOWN", data);
        }
    }
    function hideLowerThird() { if (lowerThirdContainerElement) { lowerThirdContainerElement.classList.remove('show-lower-third'); console.log("LT: HIDDEN"); } }
    function showTicker(data) {
        if (tickerContainerElement && tickerTextSpanElement && tickerContentWrapperElement) {
            const newText = data.text || "StreamWeaver Ticker Active...";
            const trailingSpaces = " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 "; 
            tickerTextSpanElement.textContent = newText + trailingSpaces;
            if (tickerContentWrapperElement.classList.contains('animate')) {
                tickerContentWrapperElement.classList.remove('animate'); void tickerContentWrapperElement.offsetWidth; 
            }
            tickerContentWrapperElement.classList.add('animate');
            tickerContainerElement.classList.add('show-ticker'); console.log("Ticker: SHOWN/UPDATED:", newText);
        }
    }
    function hideTicker() {
        if (tickerContainerElement && tickerContentWrapperElement) {
            tickerContainerElement.classList.remove('show-ticker');
            tickerContentWrapperElement.classList.remove('animate'); console.log("Ticker: HIDDEN");
        }
    }

    // --- Fullscreen Overlay Control Functions ---
    function _hideBRBInternal() { // Internal hide without side effects on other minor overlays
        if (brbOverlayContainerElement) brbOverlayContainerElement.classList.remove('show-brb');
    }
    function _hideCSOInternal() { // Internal hide without side effects on other minor overlays
        if (csoOverlayContainerElement) csoOverlayContainerElement.classList.remove('show-cso');
    }

    function hideAllMinorOverlays() {
        hideTextOverlay(); hideLogo(); hideBreakingNews(); hideLowerThird(); hideTicker();
        console.log("All minor overlays commanded to hide.");
    }

    function showBRB() {
        _hideCSOInternal(); // Hide CSO if active
        hideAllMinorOverlays();
        if (brbOverlayContainerElement) {
            brbOverlayContainerElement.classList.add('show-brb');
            console.log("BRB Overlay: SHOWN");
        }
    }
    function hideBRB() {
        _hideBRBInternal();
        hideAllMinorOverlays(); // Per requirement, when BRB is hidden, all other overlays should *remain* hidden.
        console.log("BRB Overlay: HIDDEN, minor overlays also ensured hidden.");
    }

    function showCSO() {
        _hideBRBInternal(); // Hide BRB if active
        hideAllMinorOverlays();
        if (csoOverlayContainerElement) {
            csoOverlayContainerElement.classList.add('show-cso');
            console.log("CSO Overlay: SHOWN");
        }
    }
    function hideCSO() {
        _hideCSOInternal();
        hideAllMinorOverlays(); // Per requirement, when CSO is hidden, all other overlays should *remain* hidden.
        console.log("CSO Overlay: HIDDEN, minor overlays also ensured hidden.");
    }
    
    // Initial Data Fetch
    fetch('./overlay_data.json').then(r=>r.ok?r.json():Promise.reject(r.status)).then(d=>{if(overlayTextElement)overlayTextElement.textContent=d?.message||"Ready"}).catch(e=>{console.error(e);if(overlayTextElement)overlayTextElement.textContent="Error"});

    // Ably Client Setup
    console.log('Overlay: Initializing Ably...');
    const ablyOverlay = new Ably.Realtime(ABLY_API_KEY);
    const controlChannel = ablyOverlay.channels.get(CHANNEL_NAME);
    ablyOverlay.connection.on('connected', () => console.log('Overlay: Ably Connected!'));
    ablyOverlay.connection.on('failed', (err) => console.error('Overlay: Ably connection failed:', err));

    // Ably Subscriptions
    controlChannel.subscribe('overlay-action',m=>{const d=m.data;if(d?.action){switch(d.action.toLowerCase()){case 'show':showTextOverlay();break;case 'hide':hideTextOverlay();break;case 'toggle':overlayElement.classList.contains('show')?hideTextOverlay():showTextOverlay();break;}}});
    controlChannel.subscribe('logo-action',m=>{const d=m.data;if(d?.action){switch(d.action.toLowerCase()){case 'show':showLogo();break;case 'hide':hideLogo();break;case 'toggle':logoContainerElement.classList.contains('show-logo')?hideLogo():showLogo();break;}}});
    controlChannel.subscribe('breaking-news-action',m=>{const d=m.data;if(d?.action){switch(d.action.toLowerCase()){case 'show':showBreakingNews();break;case 'hide':hideBreakingNews();break;case 'toggle':breakingNewsContainerElement.classList.contains('show-breaking-news')?hideBreakingNews():showBreakingNews();break;}}});
    controlChannel.subscribe('lower-third-action',m=>{const d=m.data;if(d?.action){switch(d.action.toLowerCase()){case 'show':showLowerThird(d);break;case 'hide':hideLowerThird();break;}}});
    controlChannel.subscribe('ticker-action',m=>{const d=m.data;if(d?.action){switch(d.action.toLowerCase()){case 'show':showTicker(d);break;case 'hide':hideTicker();break;}}});
    controlChannel.subscribe('brb-action',m=>{const d=m.data;if(d?.action){switch(d.action.toLowerCase()){case 'show':showBRB();break;case 'hide':hideBRB();break;}}});
    // New subscription for CSO
    controlChannel.subscribe('cso-action', (message) => {
        console.log('Overlay: Received Ably message on "cso-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showCSO(); break;
                case 'hide': hideCSO(); break;
                default: console.warn('Overlay: Unknown action received for CSO:', actionData.action);
            }
        }
    });
});
