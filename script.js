// script.js (for index.html - Overlay Logic)
document.addEventListener('DOMContentLoaded', () => {
    // --- Text Overlay Elements ---
    const overlayElement = document.getElementById('streamweaver-overlay');
    const overlayTextElement = document.getElementById('overlay-text');

    // --- Logo Overlay Elements ---
    const logoContainerElement = document.getElementById('logo-container');

    // --- Breaking News Overlay Elements ---
    const breakingNewsContainerElement = document.getElementById('breaking-news-container');

    // --- Lower Third Elements ---
    const lowerThirdContainerElement = document.getElementById('lower-third-container');
    const ltNameElement = document.getElementById('lt-name');
    const ltTitleElement = document.getElementById('lt-title');
    const ltAffiliationElement = document.getElementById('lt-affiliation');

    const ABLY_API_KEY = 'PpmbHg.J6_8kg:qC-BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik'; 
    const CHANNEL_NAME = 'streamweaver-control'; 

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

    // --- 4. Breaking News Overlay Show/Hide Functions ---
    function showBreakingNews() {
        if (breakingNewsContainerElement) {
            breakingNewsContainerElement.classList.add('show-breaking-news');
            console.log("Breaking News Overlay: SHOWN");
        }
    }
    function hideBreakingNews() {
        if (breakingNewsContainerElement) {
            breakingNewsContainerElement.classList.remove('show-breaking-news');
            console.log("Breaking News Overlay: HIDDEN");
        }
    }

    // --- 5. Lower Third Show/Hide Functions ---
    function showLowerThird(data) {
        if (lowerThirdContainerElement && ltNameElement && ltTitleElement && ltAffiliationElement) {
            ltNameElement.textContent = data.name || "Name";
            ltTitleElement.textContent = data.title || "Title";
            ltAffiliationElement.textContent = data.affiliation || "Affiliation";
            
            // Ensure elements are visible if they were hidden by empty content previously
            ltNameElement.style.display = data.name ? 'block' : 'none';
            ltTitleElement.style.display = data.title ? 'block' : 'none';
            ltAffiliationElement.style.display = data.affiliation ? 'block' : 'none';

            lowerThirdContainerElement.classList.add('show-lower-third');
            console.log("Lower Third: SHOWN with data:", data);
        }
    }
    function hideLowerThird() {
        if (lowerThirdContainerElement) {
            lowerThirdContainerElement.classList.remove('show-lower-third');
            console.log("Lower Third: HIDDEN");
        }
    }

    // --- 6. Ably Client Setup ---
    console.log('Overlay: Initializing Ably...');
    const ablyOverlay = new Ably.Realtime(ABLY_API_KEY);
    const controlChannel = ablyOverlay.channels.get(CHANNEL_NAME);

    ablyOverlay.connection.on('connected', () => console.log('Overlay: Successfully connected to Ably!'));
    ablyOverlay.connection.on('failed', (err) => console.error('Overlay: Ably connection failed:', err));
    
    // Subscribe to actions for TEXT OVERLAY
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
                default: console.warn('Overlay: Unknown action for text overlay:', actionData.action);
            }
        }
    });

    // Subscribe to actions for LOGO OVERLAY
    controlChannel.subscribe('logo-action', (message) => {
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showLogo(); break;
                case 'hide': hideLogo(); break;
                case 'toggle':
                    logoContainerElement.classList.contains('show-logo') ? hideLogo() : showLogo();
                    break;
                default: console.warn('Overlay: Unknown action for logo:', actionData.action);
            }
        }
    });

    // Subscribe to actions for BREAKING NEWS OVERLAY
    controlChannel.subscribe('breaking-news-action', (message) => {
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showBreakingNews(); break;
                case 'hide': hideBreakingNews(); break;
                case 'toggle':
                    breakingNewsContainerElement.classList.contains('show-breaking-news') ? hideBreakingNews() : showBreakingNews();
                    break;
                default: console.warn('Overlay: Unknown action for breaking news:', actionData.action);
            }
        }
    });

    // Subscribe to actions for LOWER THIRD
    controlChannel.subscribe('lower-third-action', (message) => {
        console.log('Overlay: Received Ably message on "lower-third-action":', message.data);
        const actionData = message.data;
        if (actionData?.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show':
                    // Data for lower third (name, title, affiliation) is expected in message.data
                    showLowerThird(actionData); 
                    break;
                case 'hide':
                    hideLowerThird();
                    break;
                // Toggle for Lower Third might not always make sense if data needs to be fresh each time.
                // For now, we'll just support explicit show/hide.
                // case 'toggle': 
                //    lowerThirdContainerElement.classList.contains('show-lower-third') ? hideLowerThird() : showLowerThird(actionData); // Requires data for show
                //    break;
                default: console.warn('Overlay: Unknown action for lower third:', actionData.action);
            }
        }
    });
});
