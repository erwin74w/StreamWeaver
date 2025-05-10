// js/overlays/LowerThirdOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[LowerThirdOverlay]";
// Define logger correctly for this module
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    warn: (...args) => DEBUG && console.warn(LOG_PREFIX, ...args), // Now defined
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

export class LowerThirdOverlay {
    constructor(containerId, nameId, titleId, affiliationId) {
        this.containerElement = document.getElementById(containerId);
        this.nameElement = document.getElementById(nameId);
        this.titleElement = document.getElementById(titleId);
        this.affiliationElement = document.getElementById(affiliationId);

        if (!this.containerElement) logger.error(`Element with ID '${containerId}' not found.`);
        if (!this.nameElement) logger.error(`Element with ID '${nameId}' not found.`);
        if (!this.titleElement) logger.error(`Element with ID '${titleId}' not found.`);
        if (!this.affiliationElement) logger.error(`Element with ID '${affiliationId}' not found.`);
        logger.log("LowerThirdOverlay instance created.");
    }

    _updateElements(data = {}) {
        if (this.nameElement) {
            this.nameElement.textContent = data.name || "";
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

    show(data) {
        if (!data || typeof data.name === 'undefined') {
            logger.warn("Show called without data or name. Aborting show.");
            if (this.isVisible) {
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
                logger.log("UPDATED (already shown)", data);
            }
        }
    }

    hide() {
        if (this.containerElement && this.isVisible) {
            this.containerElement.classList.remove('show-lower-third');
            logger.log("HIDDEN");
        }
    }

    toggle(data) {
        if (this.isVisible) {
            this.hide();
        } else {
            // When toggling to show, the 'data' from the dashboard (current input fields) is used.
            // Check if name is present in the data. actionData from dashboard always includes name, title, affiliation.
            if (data && data.name && data.name.trim() !== "") { // Ensure name is not just whitespace
                this.show(data);
            } else {
                // If trying to toggle ON but there's no name, it effectively means "don't show".
                // The dashboard already has a check to prevent sending if name is empty when toggling ON.
                // This is a safeguard on the client.
                logger.warn("Toggle to show attempted without a valid name. LT will not be shown.");
                // Ensure it's hidden if it somehow got into a weird state
                if (this.isVisible) this.hide();
            }
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-lower-third') : false;
    }
}
