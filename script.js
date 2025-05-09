document.addEventListener('DOMContentLoaded', () => {
    const overlayElement = document.getElementById('streamweaver-overlay');
    const overlayTextElement = document.getElementById('overlay-text');

    // --- IMPORTANT: REPLACE WITH YOUR ACTUAL ABLY API KEY ---
    const ABLY_API_KEY = 'PpmbHg.J6_8kg:qC-BaNitrxujvNUg2DHRy8tlw3WECMYJispON6PCOik'; // e.g., 'xxxxxx.yyyyyy:zzzzzz'
    const CHANNEL_NAME = 'streamweaver-control';

    if (ABLY_API_KEY === 'YOUR_ABLY_API_KEY_HERE') {
        alert("Please replace 'YOUR_ABLY_API_KEY' in script.js with your actual Ably API Key!");
        console.error("Ably API Key not set in script.js");
        overlayTextElement.textContent = "Ably API Key Missing!";
        return;
    }

    // --- 1. Fetch and display initial overlay data ---
    fetch('./overlay_data.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            overlayTextElement.textContent = data?.message || "Overlay Ready";
        })
        .catch(error => {
            console.error("Error fetching overlay_data.json:", error);
            overlayTextElement.textContent = "Error loading data";
        });

    // --- 2. Show/Hide Functions ---
    function showOverlay() {
        if (overlayElement) overlayElement.classList.add('show');
        console.log("Overlay SHOWN");
    }

    function hideOverlay() {
        if (overlayElement) overlayElement.classList.remove('show');
        console.log("Overlay HIDDEN");
    }
    
    // --- 3. Ably Client Setup ---
    console.log('Overlay: Initializing Ably...');
    const ably = new Ably.Realtime(ABLY_API_KEY);
    const channel = ably.channels.get(CHANNEL_NAME);

    ably.connection.on('connected', () => {
        console.log('Overlay: Successfully connected to Ably!');
        overlayTextElement.textContent = overlayTextElement.textContent + " (Ably Connected)";
    });

    ably.connection.on('failed', (err) => {
        console.error('Overlay: Ably connection failed:', err);
        overlayTextElement.textContent = "Ably Connection Failed";
    });
    ably.connection.on('disconnected', () => {
        console.warn('Overlay: Ably disconnected. Will attempt to reconnect.');
         overlayTextElement.textContent = "Ably Disconnected";
    });


    // Subscribe to messages on the channel
    channel.subscribe('overlay-action', (message) => {
        console.log('Overlay: Received Ably message:', message.data);
        const actionData = message.data; // Ably automatically parses JSON if sent as JSON
        if (actionData && actionData.action) {
            switch (actionData.action.toLowerCase()) {
                case 'show': showOverlay(); break;
                case 'hide': hideOverlay(); break;
                case 'toggle':
                    overlayElement.classList.contains('show') ? hideOverlay() : showOverlay();
                    break;
                default: console.warn('Overlay: Unknown action received via Ably:', actionData.action);
            }
        }
    });

    // --- 4. Keyboard Triggers for Local Testing (Optional) ---
    document.addEventListener('keydown', (event) => {
        if (event.altKey) {
            if (event.key === 's' || event.key === 'S') { showOverlay(); }
            else if (event.key === 'h' || event.key === 'H') { hideOverlay(); }
        }
    });
});
