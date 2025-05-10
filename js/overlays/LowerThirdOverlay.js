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
        this.lastData = {}; // Store last received data for toggle

        if (!this.containerElement) logger.error(`Element with ID '${containerId}' not found.`);
        if (!this.nameElement) logger.error(`Element with ID '${nameId}' not found.`);
        if (!this.titleElement) logger.error(`Element with ID '${titleId}' not found.`);
        if (!this.affiliationElement) logger.error(`Element with ID '${affiliationId}' not found.`);
        logger.log("LowerThirdOverlay instance created.");
    }

    update(data = {}) {
        this.lastData = data; // Always update lastData
        if (this.nameElement) {
            this.nameElement.textContent = data.name || "";
            this.nameElement.style.display = data.name ? 'block' : 'none';
        }
        if (this.titleElement) {
            this.titleElement.textContent = data.title || "";
            this.titleElement.style.display = data.title ? 'block' : 'none';
        }
        if (this.affiliationElement) {
            this.affiliationElement.textContent = data.affiliation || "";
            this.affiliationElement.style.display = data.affiliation ? 'block' : 'none';
        }
    }

    show(data) { // data argument is important here
        if (this.containerElement) {
            this.update(data); // Update with new data
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

    // For Lower Third, toggle will mean:
    // If hidden: show with the provided data (or last known data if none provided with toggle).
    // If shown: hide it.
    // The dashboard will always send current input field data with the 'toggle' action.
    toggle(data) {
        if (this.isVisible) {
            this.hide();
        } else {
            // If toggling to show, data MUST be provided by the dashboard with the toggle command.
            // The overlay manager will pass this data.
            this.show(data);
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-lower-third') : false;
    }
}
