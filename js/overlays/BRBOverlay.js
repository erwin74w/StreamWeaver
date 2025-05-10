// js/overlays/BRBOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[BRBOverlay]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

export class BRBOverlay {
    constructor(elementId, onShowCallback, onHideCallback) {
        this.containerElement = document.getElementById(elementId);
        this._onShowCallback = onShowCallback; 
        this._onHideCallback = onHideCallback; 

        if (!this.containerElement) logger.error(`Element with ID '${elementId}' not found.`);
        logger.log("BRBOverlay instance created.");
    }

    show() {
        if (this.containerElement) {
            if (typeof this._onShowCallback === 'function') {
                this._onShowCallback();
            }
            this.containerElement.classList.add('show-brb');
            logger.log("SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-brb');
            logger.log("HIDDEN");
            if (typeof this._onHideCallback === 'function') {
                this._onHideCallback();
            }
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-brb') : false;
    }
}
