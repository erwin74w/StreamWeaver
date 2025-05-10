// script.js (for index.html - Overlay Logic)
document.addEventListener('DOMContentLoaded', () => {
    // --- Text Overlay Elements ---
    const overlayElement = document.getElementById('streamweaver-overlay');
    const overlayTextElement = document.getElementById('overlay-text');

    // --- Logo Overlay Elements ---
    const logoContainerElement = document.getElementById('logo-container');

    const ABLY_API_KEY = 'PpmbHg.J6_8kg:qC-BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik'; // Note: API Key will be managed by user
    const CHANNEL_NAME = 'streamweaver-control'; 

    // Basic error check for API key (user will manage the actual key)
    if (ABLY_API_KEY === 'YOUR_ABLY_API_KEY_WAS_HERE' || !ABLY_API_KEY || ABLY_API_KEY.length < 10) {
        console.warn("Ably API Key placeholder active. User needs to insert actual key.");
    }

    // --- 1. Fetch and display initial overlay data (for text overlay) ---
    fetch('./overlay_data.json') 
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
        .then(data => overlayTextElement.textContent = data?.message || "Overlay Ready")
        .catch(error => {
            console.error("Error fetching overlay_data.json:", error);
            if(overlayTextElement) overlayTextElement.textContent = "Error loading data";
        });

    // --- 2. Text Overlay Show/Hide Functions ---
    function showTextOverlay() {
        if (overlayElement) {
            overlayElement.classList.add('show');
            console.log("Text Overlay: SHOWN");
        }
    }

    function hideTextOverlay() {
        if (overlayElement) {
            overlayElement.classList.remove('show');
            console.log("Text Overlay: HIDDEN");
        }
    }
    
    // --- 3. Logo Overlay Show/Hide Functions ---
    function showLogo() {
        if (logoContainerElement) {
            logoContainerElement.classList.add('show-logo');
            console.log("Logo Overlay: SHOWN");
        }
    }

    function hideLogo() {
        if (logoContainerElement) {
            logoContainerElement.classList.remove('show-logo');
            console.log("Logo Overlay: HIDDEN");
        }
    }

    // --- 4. Ably Client Setup ---
    console.log('Overlay: Initializing Ably...');
    const ablyOverlay = new Ably.Realtime(ABLY_API_KEY); // User manages this key
    const controlChannel = ablyOverlay.channels.get(CHANNEL_NAME);

    ablyOverlay.connection.on('connected', () => console.log('Overlay: Successfully connected to Ably!'));
    ablyOverlay.connection.on('failed', (err) => console.error('Overlay: Ably connection failed:', err));
    
    // Subscribe to actions for the TEXT OVERLAY
    controlChannel.subscribe('overlay-action', (message) => {
        console.log('Overlay: Received Ably message on "overlay-action":', message.data);
        const actionData = message.data; 
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showTextOverlay(); break;
                case 'hide': hideTextOverlay(); break;
                case 'toggle': 
                    overlayElement.classList.contains('show') ? hideTextOverlay() : showTextOverlay(); 
                    break;
                default: console.warn('Overlay: Unknown action received for text overlay:', actionData.action);
            }
        }
    });

    // Subscribe to actions for the LOGO OVERLAY
    controlChannel.subscribe('logo-action', (message) => {
        console.log('Overlay: Received Ably message on "logo-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showLogo(); break;
                case 'hide': hideLogo(); break;
                case 'toggle':
                    logoContainerElement.classList.contains('show-logo') ? hideLogo() : showLogo();
                    break;
                default: console.warn('Overlay: Unknown action received for logo:', actionData.action);
            }
        }
    });
});
