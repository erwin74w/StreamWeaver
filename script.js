document.addEventListener('DOMContentLoaded', () => {
    const overlayElement = document.getElementById('streamweaver-overlay');
    const overlayTextElement = document.getElementById('overlay-text');

    // --- ABLY CONFIGURATION ---
    // ROW 4: Replace 'PpmbHg.J6_8kg:qC-BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik' with your actual Ably API Key
    const ABLY_API_KEY = 'YOUR_ABLY_API_KEY_GOES_HERE';
    const CHANNEL_NAME = 'streamweaver-control'; // This is our shared "mailbox"

    if (!ABLY_API_KEY || ABLY_API_KEY === 'YOUR_ABLY_API_KEY_GOES_HERE') {
        const errorMsg = "CRITICAL: Ably API Key not set in script.js (for index.html)! Please update it.";
        console.error(errorMsg);
        if(overlayTextElement) overlayTextElement.textContent = errorMsg;
        alert(errorMsg); // Make it very obvious
        return; // Stop further execution
    }

    // --- 1. Fetch and display initial overlay data ---
    fetch('./overlay_data.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (overlayTextElement) overlayTextElement.textContent = data?.message || "Overlay Ready";
        })
        .catch(error => {
            console.error("Error fetching overlay_data.json:", error);
            if (overlayTextElement) overlayTextElement.textContent = "Error loading data";
        });

    // --- 2. Show/Hide Functions ---
    function showOverlay() {
        if (overlayElement) overlayElement.classList.add('show');
        console.log("Overlay: SHOWN");
    }

    function hideOverlay() {
        if (overlayElement) overlayElement.classList.remove('show');
        console.log("Overlay: HIDDEN");
    }
    
    // --- 3. Ably Client Setup (Overlay LISTENS for messages) ---
    console.log('Overlay: Initializing Ably...');
    const ablyOverlay = new Ably.Realtime(ABLY_API_KEY);
    const overlayChannel = ablyOverlay.channels.get(CHANNEL_NAME);

    ablyOverlay.connection.on('connected', () => {
        console.log('Overlay: Successfully connected to Ably!');
        if(overlayTextElement && overlayTextElement.textContent.indexOf('(Ably Connected)') === -1) {
            overlayTextElement.textContent = (overlayTextElement.textContent || "") + " (Ably Connected)";
        }
    });

    ablyOverlay.connection.on('failed', (err) => {
        console.error('Overlay: Ably connection failed:', err);
        if(overlayTextElement) overlayTextElement.textContent = "Ably Connection Failed";
    });
    ablyOverlay.connection.on('disconnected', () => {
        console.warn('Overlay: Ably disconnected. Will attempt to reconnect if configured (Ably handles this by default).');
         if(overlayTextElement) overlayTextElement.textContent = "Ably Disconnected";
    });
    ablyOverlay.connection.on('suspended', () => {
        console.warn('Overlay: Ably connection suspended. May reconnect.');
         if(overlayTextElement) overlayTextElement.textContent = "Ably Connection Suspended";
    });

    // Subscribe to messages on the 'overlay-action' EVENT within our CHANNEL
    overlayChannel.subscribe('overlay-action', (message) => {
        console.log('Overlay: Received Ably message on event "overlay-action":', message.data);
        const actionData = message.data; 
        if (actionData && actionData.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showOverlay(); break;
                case 'hide': hideOverlay(); break;
                case 'toggle':
                    if (overlayElement) {
                        overlayElement.classList.contains('show') ? hideOverlay() : showOverlay();
                    }
                    break;
                default: console.warn('Overlay: Unknown action received via Ably:', actionData.action);
            }
        }
    });

    // --- 4. Keyboard Triggers for Local Testing (Optional) ---
    document.addEventListener('keydown', (event) => {
        if (event.altKey) { // Use Alt key to avoid conflicts
            if (event.key === 's' || event.key === 'S') { 
                console.log("Keyboard: Show triggered");
                showOverlay(); 
            } else if (event.key === 'h' || event.key === 'H') { 
                console.log("Keyboard: Hide triggered");
                hideOverlay(); 
            }
        }
    });
});