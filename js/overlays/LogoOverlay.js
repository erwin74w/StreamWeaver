// js/overlays/LogoOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[LogoOverlay]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

export class LogoOverlay {
    constructor(elementId) {
        this.containerElement = document.getElementById(elementId);
        if (!this.containerElement) logger.error(`Element with ID '${elementId}' not found.`);
        logger.log("LogoOverlay instance created.");
    }

    show() {
        if (this.containerElement) {
            this.containerElement.classList.add('show-logo');
            logger.log("SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-logo');
            logger.log("HIDDEN");
        }
    }

    toggle() {
        if (this.containerElement) {
            this.containerElement.classList.toggle('show-logo');
            logger.log(this.isVisible ? 'SHOWN (toggled)' : 'HIDDEN (toggled)');
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-logo') : false;
    }
}
