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
    const csoOverlayContainerElement = document.getElementById('cso-overlay-container');

    // --- Ably Configuration ---
    //  IMPORTANT: REPLACE 'YOUR_ABLY_API_KEY_WAS_HERE' WITH YOUR ACTUAL ABLY API KEY
    const ABLY_API_KEY = 'BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik'; 
    const CHANNEL_NAME = 'streamweaver-control'; 

    if (ABLY_API_KEY === 'YOUR_ABLY_API_KEY_WAS_HERE' || !ABLY_API_KEY || ABLY_API_KEY.length < 10) {
        console.warn("CRITICAL: Ably API Key is a placeholder or invalid in script.js. Overlays will not work. Please replace 'YOUR_ABLY_API_KEY_WAS_HERE' with your actual key.");
        if(overlayTextElement) overlayTextElement.textContent = "Ably API Key Error!";
        // Optionally, you could display an error on a more prominent overlay element if the API key is missing.
    }

    // --- Overlay Control Functions (Minor Overlays) ---
    function showTextOverlay() {
        if (overlayElement) {
            overlayElement.classList.add('show');
            console.log("Text Overlay: SHOWN");
        } else console.error("Text Overlay element not found");
    }
    function hideTextOverlay() {
        if (overlayElement) {
            overlayElement.classList.remove('show');
            console.log("Text Overlay: HIDDEN");
        }
    }

    function showLogo() {
        if (logoContainerElement) {
            logoContainerElement.classList.add('show-logo');
            console.log("Logo: SHOWN");
        } else console.error("Logo element not found");
    }
    function hideLogo() {
        if (logoContainerElement) {
            logoContainerElement.classList.remove('show-logo');
            console.log("Logo: HIDDEN");
        }
    }

    function showBreakingNews() {
        if (breakingNewsContainerElement) {
            breakingNewsContainerElement.classList.add('show-breaking-news');
            console.log("BN: SHOWN");
        } else console.error("Breaking News element not found");
    }
    function hideBreakingNews() {
        if (breakingNewsContainerElement) {
            breakingNewsContainerElement.classList.remove('show-breaking-news');
            console.log("BN: HIDDEN");
        }
    }

    function showLowerThird(data) {
        if (lowerThirdContainerElement && ltNameElement && ltTitleElement && ltAffiliationElement) {
            ltNameElement.textContent = data.name || "";
            ltTitleElement.textContent = data.title || "";
            ltAffiliationElement.textContent = data.affiliation || "";
            
            ltNameElement.style.display = data.name ? 'block' : 'none';
            ltTitleElement.style.display = data.title ? 'block' : 'none';
            ltAffiliationElement.style.display = data.affiliation ? 'block' : 'none';
            
            lowerThirdContainerElement.classList.add('show-lower-third');
            console.log("LT: SHOWN", data);
        } else console.error("Lower Third elements not found");
    }
    function hideLowerThird() {
        if (lowerThirdContainerElement) {
            lowerThirdContainerElement.classList.remove('show-lower-third');
            console.log("LT: HIDDEN");
        }
    }

    function showTicker(data) {
        if (tickerContainerElement && tickerTextSpanElement && tickerContentWrapperElement) {
            const newText = data.text || "StreamWeaver Ticker Active...";
            const trailingSpaces = " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 "; 
            tickerTextSpanElement.textContent = newText + trailingSpaces;
            
            if (tickerContentWrapperElement.classList.contains('animate')) {
                tickerContentWrapperElement.classList.remove('animate');
                void tickerContentWrapperElement.offsetWidth; // Force reflow
            }
            tickerContentWrapperElement.classList.add('animate');
            tickerContainerElement.classList.add('show-ticker');
            console.log("Ticker: SHOWN/UPDATED:", newText);
        } else console.error("Ticker elements not found");
    }
    function hideTicker() {
        if (tickerContainerElement && tickerContentWrapperElement) {
            tickerContainerElement.classList.remove('show-ticker');
            tickerContentWrapperElement.classList.remove('animate');
            console.log("Ticker: HIDDEN");
        }
    }

    // --- Fullscreen Overlay Control Functions ---
    function _hideBRBInternal() { 
        if (brbOverlayContainerElement) brbOverlayContainerElement.classList.remove('show-brb');
    }
    function _hideCSOInternal() { 
        if (csoOverlayContainerElement) csoOverlayContainerElement.classList.remove('show-cso');
    }

    function hideAllMinorOverlays() {
        hideTextOverlay(); hideLogo(); hideBreakingNews(); hideLowerThird(); hideTicker();
        console.log("All minor overlays commanded to hide.");
    }

    function showBRB() {
        _hideCSOInternal(); 
        hideAllMinorOverlays();
        if (brbOverlayContainerElement) {
            brbOverlayContainerElement.classList.add('show-brb');
            console.log("BRB Overlay: SHOWN");
        } else console.error("BRB element not found");
    }
    function hideBRB() {
        _hideBRBInternal();
        hideAllMinorOverlays(); 
        console.log("BRB Overlay: HIDDEN, minor overlays also ensured hidden.");
    }

    function showCSO() {
        _hideBRBInternal(); 
        hideAllMinorOverlays();
        if (csoOverlayContainerElement) {
            csoOverlayContainerElement.classList.add('show-cso');
            console.log("CSO Overlay: SHOWN");
        } else console.error("CSO element not found");
    }
    function hideCSO() {
        _hideCSOInternal();
        hideAllMinorOverlays(); 
        console.log("CSO Overlay: HIDDEN, minor overlays also ensured hidden.");
    }
    
    // --- Initial Data Fetch (for Subtitles) ---
    if(overlayTextElement){ // Check if element exists before fetch
        fetch('./overlay_data.json') 
            .then(response => {
                if (!response.ok) {
                    return Promise.reject(`HTTP error! status: ${response.status}, for overlay_data.json`);
                }
                return response.json();
            })
            .then(data => {
                overlayTextElement.textContent = data?.message || "Overlay Ready";
            })
            .catch(error => {
                console.error("Error fetching overlay_data.json:", error);
                overlayTextElement.textContent = "Error loading data";
            });
    } else {
        console.warn("Initial overlay text element not found, skipping data fetch for it.");
    }


    // --- Ably Client Setup ---
    console.log('Overlay: Initializing Ably...');
    const ablyOverlay = new Ably.Realtime(ABLY_API_KEY); // User manages this key

    ablyOverlay.connection.on('connected', () => {
        console.log('Overlay: Successfully connected to Ably!');
        if(overlayTextElement && (overlayTextElement.textContent === "Ably API Key Error!" || overlayTextElement.textContent === "Connecting to Ably...")) {
            // If it was showing an error or connecting message, try to set initial text again
             fetch('./overlay_data.json').then(r=>r.ok?r.json():Promise.reject(r.status)).then(d=>{overlayTextElement.textContent=d?.message||"Ready"}).catch(e=>{overlayTextElement.textContent="Error loading data";});
        }
    });
    ablyOverlay.connection.on('failed', (err) => {
        console.error('Overlay: Ably connection failed:', err);
        if(overlayTextElement) overlayTextElement.textContent = "Ably Connection Failed!";
    });
    ablyOverlay.connection.on('disconnected', () => {
        console.warn('Overlay: Ably disconnected.');
         if(overlayTextElement) overlayTextElement.textContent = "Ably Disconnected";
    });
     ablyOverlay.connection.on('suspended', () => {
        console.warn('Overlay: Ably connection suspended.');
         if(overlayTextElement) overlayTextElement.textContent = "Ably Suspended";
    });
    if(overlayTextElement) overlayTextElement.textContent = "Connecting to Ably...";


    const controlChannel = ablyOverlay.channels.get(CHANNEL_NAME);

    // --- Ably Subscriptions ---
    console.log('Overlay: Setting up Ably subscriptions...');

    controlChannel.subscribe('overlay-action', (message) => {
        console.log('Overlay: RX "overlay-action":', message.data);
        const actionData = message.data; 
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showTextOverlay(); break;
                case 'hide': hideTextOverlay(); break;
                case 'toggle': 
                    if (overlayElement) overlayElement.classList.contains('show') ? hideTextOverlay() : showTextOverlay(); 
                    break;
                default: console.warn('Overlay: Unknown action for text overlay:', actionData.action);
            }
        }
    });

    controlChannel.subscribe('logo-action', (message) => {
        console.log('Overlay: RX "logo-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showLogo(); break;
                case 'hide': hideLogo(); break;
                case 'toggle':
                    if (logoContainerElement) logoContainerElement.classList.contains('show-logo') ? hideLogo() : showLogo();
                    break;
                default: console.warn('Overlay: Unknown action for logo:', actionData.action);
            }
        }
    });

    controlChannel.subscribe('breaking-news-action', (message) => {
        console.log('Overlay: RX "breaking-news-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showBreakingNews(); break;
                case 'hide': hideBreakingNews(); break;
                case 'toggle':
                    if (breakingNewsContainerElement) breakingNewsContainerElement.classList.contains('show-breaking-news') ? hideBreakingNews() : showBreakingNews();
                    break;
                default: console.warn('Overlay: Unknown action for breaking news:', actionData.action);
            }
        }
    });

    controlChannel.subscribe('lower-third-action', (message) => {
        console.log('Overlay: RX "lower-third-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showLowerThird(actionData); break;
                case 'hide': hideLowerThird(); break;
                default: console.warn('Overlay: Unknown action for lower third:', actionData.action);
            }
        }
    });

    controlChannel.subscribe('ticker-action', (message) => {
        console.log('Overlay: RX "ticker-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showTicker(actionData); break;
                case 'hide': hideTicker(); break;
                default: console.warn('Overlay: Unknown action for ticker:', actionData.action);
            }
        }
    });

    controlChannel.subscribe('brb-action', (message) => {
        console.log('Overlay: RX "brb-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showBRB(); break;
                case 'hide': hideBRB(); break;
                default: console.warn('Overlay: Unknown action for BRB:', actionData.action);
            }
        }
    });
    
    controlChannel.subscribe('cso-action', (message) => {
        console.log('Overlay: RX "cso-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showCSO(); break;
                case 'hide': hideCSO(); break;
                default: console.warn('Overlay: Unknown action for CSO:', actionData.action);
            }
        }
    });
    console.log('Overlay: Ably subscriptions set up.');
});
