# StreamWeaver
Weaving brilliance into Live Streams 

StreamWeaver is a versatile system for displaying dynamic, web-based graphical overlays on live video streams using software like OBS Studio, Prism Live Studio, or any streaming application that supports browser source inputs. It allows for remote control of these overlays through a web-based dashboard, leveraging the Ably real-time messaging service for instant communication.

This project provides a robust proof-of-concept for managing various common overlay elements such as logos, breaking news banners, lower thirds, subtitles/text overlays, tickers, and fullscreen "Be Right Back" (BRB) / "Coming Soon Online" (CSO) screens.

## Features

*   **Multiple Overlay Types:**
    *   Logo Overlay
    *   Breaking News Banner
    *   Text Overlay (Subtitles)
    *   Lower Thirds (Name, Title, Affiliation)
    *   Scrolling News Ticker
    *   Fullscreen BRB (Be Right Back) Image
    *   Fullscreen CSO (Coming Soon Online) Image
*   **Remote Control Dashboard:** A web-based dashboard to show, hide, toggle, and update overlay content in real-time.
*   **Real-time Communication:** Uses [Ably](https://ably.com/) for low-latency messaging between the dashboard and the overlay client.
*   **Visual Feedback:** The dashboard provides visual indicators (status lights) reflecting the current state (visible, hidden, error) of each overlay on the stream.
*   **Easy Integration:** Overlays are standard HTML/CSS/JavaScript, easily added as a "Browser Source" in streaming software.
*   **Customizable:** Styles and content can be easily modified.
*   **GitHub Pages Hosting:** Designed to be easily hostable on GitHub Pages for the overlay client.

## Project Structure

├── dashboard.html # The remote control panel
├── dashboard.style.css # Styles for the dashboard
├── dashboard.script.js # JavaScript logic for the dashboard
├── index.html # The main overlay page (browser source)
├── style.css # Styles for all overlay elements
├── js/ # JavaScript modules for the overlay client
│ ├── ably-config.js # Ably API Key and channel names
│ ├── main.js # Main entry point for overlay logic
│ ├── overlay-manager.js # Manages all overlays and Ably communication
│ ├── utils.js # Utility functions
│ └── overlays/ # Individual classes for each overlay type
│ ├── BRBOverlay.js
│ ├── BreakingNewsOverlay.js
│ ├── CSOOverlay.js
│ ├── LogoOverlay.js
│ ├── LowerThirdOverlay.js
│ ├── TextOverlay.js
│ └── TickerOverlay.js
├── Images/ # Directory for overlay images
│ ├── streamweaver_logo.png
│ ├── BreakingNews.png
│ ├── brb.png
│ └── cso.png
├── overlay_data.json # Sample data for the text overlay (subtitles)
└── README.md # This file



## Setup Instructions

### 1. Ably Account & API Key

*   **Sign up for Ably:** You'll need an Ably account. They offer a free tier that is sufficient for this project. Go to [ably.com](https://ably.com/) to create an account.
*   **Create an Ably App:** Once logged in, create a new Ably app.
*   **Get Your API Key:**
    *   Navigate to your app's "API keys" section.
    *   You will need a key with at least the following capabilities for the specified channels:
        *   `streamweaver-control`: `publish`, `subscribe`, `history` (history is optional but can be useful)
        *   `streamweaver-status`: `publish`, `subscribe`, `history`
    *   It's recommended to create a dedicated API key for this project.
    *   **Important Security Note:** The overlay client (`index.html` served via GitHub Pages) ideally should not use your main, powerful API key directly. See the "Security Considerations" section below. For initial testing, you can use the same key for both the dashboard and the overlay client.

### 2. Configure API Key

*   **Overlay Client:** Open `js/ably-config.js`. Replace the placeholder `YOUR_ABLY_API_KEY_WAS_HERE` (or the sample key) with your actual Ably API key:
    ```javascript
    // js/ably-config.js
    export const ABLY_API_KEY = 'YOUR_REAL_ABLY_API_KEY'; // Paste your key here
    // ... rest of the file
    ```
*   **Dashboard:** When you open `dashboard.html` in your browser, you will be prompted to enter this same Ably API key into a password field. The dashboard will store this key in your browser's `localStorage` for convenience on subsequent visits.

### 3. Prepare Images

*   Place your desired images for the logo, breaking news, BRB, and CSO screens into the `Images/` directory.
*   Ensure the filenames in `index.html` and `style.css` match your image files if you rename them. Default filenames are:
    *   `streamweaver_logo.png`
    *   `BreakingNews.png`
    *   `brb.png`
    *   `cso.png`

### 4. Hosting the Overlay Client (`index.html` and related assets)

*   The `index.html` file and all its related assets (`style.css`, `js/` directory, `Images/` directory, `overlay_data.json`) need to be hosted on a web server so your streaming software can access it as a URL.
*   **GitHub Pages is an excellent free option for this:**
    1.  Create a GitHub repository for this project (or use an existing one).
    2.  Push all the project files to the repository.
    3.  Go to your repository's "Settings" tab.
    4.  Scroll down to the "Pages" section.
    5.  Choose the branch to deploy from (e.g., `main` or `master`) and the `/ (root)` folder.
    6.  Click "Save". GitHub will build and deploy your site. It will provide you with a URL (e.g., `https://your-username.github.io/your-repository-name/`).
    7.  The URL for your overlay will be this base URL followed by `index.html` (e.g., `https://your-username.github.io/your-repository-name/index.html`).

### 5. Running the Dashboard (`dashboard.html`)

*   You can simply open the `dashboard.html` file directly in your local web browser (e.g., by double-clicking it or using `File > Open File...`). No special web server is needed for the dashboard itself as it runs client-side.

## Usage

### 1. Add Overlay to Streaming Software

*   Open your streaming software (OBS, Prism Live Studio, etc.).
*   Add a new "Browser" source (sometimes called "BrowserSource" or "Webpage").
*   In the URL field, enter the URL of your hosted `index.html` (from GitHub Pages or your own server).
    *   Example: `https://your-username.github.io/your-repository-name/index.html`
*   Set the width and height to match your stream resolution (e.g., 1920x1080).
*   Ensure "Shutdown source when not visible" is **UNCHECKED** (important for overlays to persist).
*   Ensure "Refresh browser when scene becomes active" is **UNCHECKED**.
*   You may want to add custom CSS within the browser source properties if needed (e.g., `body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }`), though the provided `style.css` already handles transparency.

### 2. Control via Dashboard

1.  Open `dashboard.html` in your web browser.
2.  **Connect to Ably:**
    *   Enter your Ably API Key in the designated field.
    *   Click "Connect to Ably".
    *   The "Ably Status" should indicate a successful connection and channel readiness.
    *   The "General Log" at the bottom will provide more detailed status updates.
3.  **Control Overlays:**
    *   Use the buttons in each section to control the corresponding overlay.
    *   **Status Lights:** A colored circle next to each "Show" button indicates the overlay's current state on the stream:
        *   **Green:** Visible
        *   **Red:** Hidden
        *   **Yellow/Orange:** Error reported by the overlay
        *   **Grey:** Unknown (usually briefly at startup or if connection is lost)
    *   **Fullscreen Modes (BRB/CSO):** Showing one of these will automatically hide all other non-fullscreen overlays. Hiding them will also keep other non-fullscreen overlays hidden (they need to be manually re-enabled if desired).
    *   **News Ticker:** Enter text and click "Show / Update Ticker".
    *   **Lower Third:** Fill in Name, Title, and Affiliation fields then click "Show Lower Third".
    *   **Toggle Buttons:** For overlays like Text, Logo, and Breaking News, a "Toggle" button is available to switch between shown and hidden states.

## Development & Customization

*   **Overlay Styles:** Modify `style.css` to change the appearance, positioning, fonts, and animations of the overlays.
*   **Overlay Logic:**
    *   The core logic for how each overlay behaves is in its respective class within the `js/overlays/` directory (e.g., `js/overlays/LogoOverlay.js`).
    *   The `js/overlay-manager.js` orchestrates these overlays and handles Ably communication for the overlay client.
*   **Dashboard Functionality:** Modify `dashboard.script.js` and `dashboard.html` to change dashboard behavior or add new controls.
*   **Adding New Overlay Types:**
    1.  Create a new HTML container for it in `index.html`.
    2.  Style it in `style.css`.
    3.  Create a new JavaScript class for it in the `js/overlays/` directory (similar to existing ones, with `show()`, `hide()`, `isVisible` methods).
    4.  Add an instance of it in `js/overlay-manager.js` and map it in `this.overlayInstanceMap`.
    5.  Add an Ably subscription for its control messages in `js/overlay-manager.js`.
    6.  Add corresponding controls (buttons, inputs) to `dashboard.html`.
    7.  Add event listeners and UI mapping for the new controls in `dashboard.script.js`.

## Security Considerations (IMPORTANT)

*   **Ably API Key Exposure (Overlay Client):**
    *   The `js/ably-config.js` file, which is part of the overlay client hosted on GitHub Pages (or any public web server), currently contains your Ably API key. **This is a security risk if the key has broad permissions.**
    *   **Recommended Solution: Ably Token Authentication.**
        1.  Your dashboard (running locally or in a trusted environment) or a secure backend server should use your main, powerful Ably API key.
        2.  The overlay client (`index.html`) should request a temporary, capability-limited **token** from this trusted source.
        3.  This token would grant the overlay client only the necessary permissions (e.g., subscribe to `streamweaver-control`, publish to `streamweaver-status`).
        4.  This prevents your main API key from being exposed publicly.
        5.  Refer to the [Ably Token Authentication documentation](https://ably.com/docs/auth/token-auth) for implementation details.
*   **Dashboard Access:** If the `dashboard.html` file itself were to be hosted publicly (not recommended for this setup), ensure that access to it is restricted, or implement proper authentication for users of the dashboard.

## Troubleshooting

*   **Lights on Dashboard Stay Grey:**
    *   Ensure the overlay client (`index.html` page) is loaded in a browser tab and its console shows it successfully connecting to Ably, attaching channels, and publishing initial states.
    *   Verify the Ably API key is identical and correct in both `js/ably-config.js` (overlay) and entered into the dashboard.
    *   Check for JavaScript errors in both the overlay console and the dashboard console.
    *   Ensure channel names (`CONTROL_CHANNEL_NAME`, `STATUS_CHANNEL_NAME`) are identical in `js/ably-config.js` and `dashboard.script.js`.
*   **Dashboard "Control channel not ready" error:**
    *   This usually means the Ably API key used by the dashboard lacks the necessary permissions to attach to the `streamweaver-control` channel. Check the Ably error codes in the dashboard console (e.g., 401xx codes indicate auth/authz issues).
*   **Overlays Not Appearing in Stream:**
    *   Double-check the Browser Source URL in your streaming software.
    *   Ensure the overlay client page (`index.html`) is loading without errors in a separate browser tab.
    *   Check the `z-index` values in `style.css` if overlays are being hidden by other elements (unlikely with the current setup but possible if you modify heavily).

## Future Enhancements

*   Implement full Ably Token Authentication for the overlay client.
*   Add a "Request Current State" button to the dashboard.
*   More configurable overlay styles directly from the dashboard.
*   Support for more overlay types (e.g., chat, polls, alerts).
*   User authentication for the dashboard.

---
