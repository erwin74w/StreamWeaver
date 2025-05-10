// js/overlays/CSOOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[CSOOverlay]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

export class CSOOverlay {
    constructor(elementId, onShowCallback, onHideCallback) {
        this.containerElement = document.getElementById(elementId);
        this._onShowCallback = onShowCallback; 
        this._onHideCallback = onHideCallback; 

        if (!this.containerElement) logger.error(`Element with ID '${elementId}' not found.`);
        logger.log("CSOOverlay instance created.");
    }

    show() {
        if (this.containerElement && !this.isVisible) {
            if (typeof this._onShowCallback === 'function') {
                this._onShowCallback();
            }
            this.containerElement.classList.add('show-cso');
            logger.log("SHOWN");
        }
    }

    hide() {
        if (this.containerElement && this.isVisible) {
            this.containerElement.classList.remove('show-cso');
            logger.log("HIDDEN");
            if (typeof this._onHideCallback === 'function') {
                this._onHideCallback();
            }
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-cso') : false;
    }
}
