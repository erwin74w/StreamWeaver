// js/overlays/LowerThirdOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[LowerThirdOverlay]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

export class LowerThirdOverlay {
    constructor(containerId, nameId, titleId, affiliationId) {
        this.containerElement = document.getElementById(containerId);
        this.nameElement = document.getElementById(nameId);
        this.titleElement = document.getElementById(titleId);
        this.affiliationElement = document.getElementById(affiliationId);
        // this.lastData = {}; // We don't strictly need to store lastData here if toggle always provides fresh data from dashboard

        if (!this.containerElement) logger.error(`Element with ID '${containerId}' not found.`);
        if (!this.nameElement) logger.error(`Element with ID '${nameId}' not found.`);
        if (!this.titleElement) logger.error(`Element with ID '${titleId}' not found.`);
        if (!this.affiliationElement) logger.error(`Element with ID '${affiliationId}' not found.`);
        logger.log("LowerThirdOverlay instance created.");
    }

    // update() is primarily called by show() now.
    _updateElements(data = {}) {
        if (this.nameElement) {
            this.nameElement.textContent = data.name || "";
            // If showing, an empty name should still occupy space or be handled by CSS min-height for the container
            // Forcing display: 'block' ensures the span exists, CSS can handle empty appearance.
            this.nameElement.style.display = 'block';
        }
        if (this.titleElement) {
            this.titleElement.textContent = data.title || "";
            this.titleElement.style.display = 'block';
        }
        if (this.affiliationElement) {
            this.affiliationElement.textContent = data.affiliation || "";
            this.affiliationElement.style.display = 'block';
        }
    }

    // show() always expects data.
    show(data) {
        if (!data || typeof data.name === 'undefined') { // Ensure data (especially name) is provided to show
            logger.warn("Show called without data or name. Aborting show.");
            // Optionally, if it's already visible and called with no data, treat as an update to empty.
            // But for a fresh "show" command, data is crucial.
            if (this.isVisible) { // If it's visible and show is called with bad data, hide it
                this.hide();
            }
            return;
        }

        if (this.containerElement) {
            this._updateElements(data);
            if (!this.isVisible) {
                this.containerElement.classList.add('show-lower-third');
                logger.log("SHOWN", data);
            } else {
                // If already shown, this acts as an update.
                logger.log("UPDATED (already shown)", data);
            }
        }
    }

    hide() {
        if (this.containerElement && this.isVisible) {
            this.containerElement.classList.remove('show-lower-third');
            logger.log("HIDDEN");
            // Optionally clear text content on hide, or let CSS handle it.
            // For now, let's not clear it, so a quick toggle off/on retains text
            // this._updateElements(); // Passing no data would clear them due to || ""
        }
    }

    // toggle(data) expects the dashboard to send the current input field data.
    toggle(data) { // `data` here comes from the dashboard via overlay-manager
        if (this.isVisible) {
            this.hide();
        } else {
            // When toggling to show, the 'data' from the dashboard (current input fields) is used.
            if (data && typeof data.name !== 'undefined') {
                this.show(data);
            } else {
                logger.warn("Toggle to show attempted without sufficient data (name missing). LT will not be shown.");
                // If we had a 'lastGoodDataForShow' we could use it, but dashboard should always send current.
            }
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-lower-third') : false;
    }
}
