// js/overlays/BreakingNewsOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[BreakingNewsOverlay]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

export class BreakingNewsOverlay {
    constructor(elementId) {
        this.containerElement = document.getElementById(elementId);
        if (!this.containerElement) logger.error(`Element with ID '${elementId}' not found.`);
        logger.log("BreakingNewsOverlay instance created.");
    }

    show() {
        if (this.containerElement) {
            this.containerElement.classList.add('show-breaking-news');
            logger.log("SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-breaking-news');
            logger.log("HIDDEN");
        }
    }

    toggle() {
        if (this.containerElement) {
            this.containerElement.classList.toggle('show-breaking-news');
            logger.log(this.isVisible ? 'SHOWN (toggled)' : 'HIDDEN (toggled)');
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-breaking-news') : false;
    }
}
