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

        if (!this.containerElement) logger.error(`Element with ID '${containerId}' not found.`);
        if (!this.nameElement) logger.error(`Element with ID '${nameId}' not found.`);
        if (!this.titleElement) logger.error(`Element with ID '${titleId}' not found.`);
        if (!this.affiliationElement) logger.error(`Element with ID '${affiliationId}' not found.`);
        logger.log("LowerThirdOverlay instance created.");
    }

    update(data = {}) {
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

    show(data) {
        if (this.containerElement) {
            this.update(data);
            this.containerElement.classList.add('show-lower-third');
            logger.log("SHOWN", data);
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-lower-third');
            logger.log("HIDDEN");
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-lower-third') : false;
    }
}
