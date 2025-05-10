// js/overlays/LowerThirdOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[LowerThirdOverlay]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    warn: (...args) => DEBUG && console.warn(LOG_PREFIX, ...args),
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

    _updateElements(displayPayload = {}) {
        if (this.nameElement) {
            this.nameElement.textContent = displayPayload.name || "";
            this.nameElement.style.display = 'block';
        }
        if (this.titleElement) {
            this.titleElement.textContent = displayPayload.title || "";
            this.titleElement.style.display = 'block';
        }
        if (this.affiliationElement) {
            this.affiliationElement.textContent = displayPayload.affiliation || "";
            this.affiliationElement.style.display = 'block';
        }
    }

    show(actionPayload) {
        logger.log("Attempting to show. Current isVisible state:", this.isVisible, "Received Full Payload:", JSON.stringify(actionPayload)); // Log the whole payload

        // More detailed check for the name property
        if (actionPayload && typeof actionPayload.name !== 'undefined') {
            logger.log("actionPayload.name:", `"${actionPayload.name}"`, "(Type:", typeof actionPayload.name + ")");
            logger.log("actionPayload.name.trim():", `"${actionPayload.name.trim()}"`);
        } else {
            logger.warn("actionPayload itself is problematic or actionPayload.name is undefined.");
        }

        if (!actionPayload || typeof actionPayload.name === 'undefined' || actionPayload.name.trim() === "") {
            logger.warn("Show method's NAME CHECK FAILED. Aborting show. 'name' was effectively empty or undefined.");
            if (this.isVisible) {
                this.hide();
            }
            return;
        }

        if (this.containerElement) {
            this._updateElements({
                name: actionPayload.name,
                title: actionPayload.title,
                affiliation: actionPayload.affiliation
            });

            if (!this.isVisible) {
                this.containerElement.classList.add('show-lower-third');
                logger.log("Class 'show-lower-third' ADDED. Data:", { name: actionPayload.name, title: actionPayload.title, affiliation: actionPayload.affiliation });
            } else {
                logger.log("Already visible, UPDATED content. Data:", { name: actionPayload.name, title: actionPayload.title, affiliation: actionPayload.affiliation });
            }
        } else {
            logger.warn("Cannot show, containerElement is null.");
        }
    }

    hide() {
        logger.log("Attempting to hide. Current isVisible state:", this.isVisible);
        if (this.containerElement && this.isVisible) {
            this.containerElement.classList.remove('show-lower-third');
            logger.log("Class 'show-lower-third' REMOVED.");
        } else if (!this.containerElement) {
            logger.warn("Cannot hide, containerElement is null.");
        } else {
            // logger.log("Already hidden or containerElement issue."); // Can be noisy
        }
    }

    toggle(actionPayload) {
        logger.log("Inside toggle. Current isVisible state:", this.isVisible, "Received Action Payload:", JSON.stringify(actionPayload)); // Log the whole payload
        if (this.isVisible) {
            this.hide();
        } else {
            this.show(actionPayload);
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-lower-third') : false;
    }
}
