// js/overlays/TickerOverlay.js
import { DEBUG } from '../ably-config.js';

const LOG_PREFIX = "[TickerOverlay]";
const logger = {
    log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args),
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

export class TickerOverlay {
    constructor(containerId, wrapperId, textSpanId) {
        this.containerElement = document.getElementById(containerId);
        this.contentWrapperElement = document.getElementById(wrapperId);
        this.textSpanElement = document.getElementById(textSpanId);

        if (!this.containerElement) logger.error(`Element with ID '${containerId}' not found.`);
        if (!this.contentWrapperElement) logger.error(`Element with ID '${wrapperId}' not found.`);
        if (!this.textSpanElement) logger.error(`Element with ID '${textSpanId}' not found.`);
        logger.log("TickerOverlay instance created.");
    }

    updateAndShow(data = {}) {
        if (this.containerElement && this.textSpanElement && this.contentWrapperElement) {
            const newText = data.text || "StreamWeaver Ticker Active...";
            const trailingSpaces = " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 "; 
            this.textSpanElement.textContent = newText + trailingSpaces;

            if (this.contentWrapperElement.classList.contains('animate')) {
                this.contentWrapperElement.classList.remove('animate');
                void this.contentWrapperElement.offsetWidth; 
            }
            this.contentWrapperElement.classList.add('animate');
            this.containerElement.classList.add('show-ticker');
            logger.log("SHOWN/UPDATED with text:", newText);
        }
    }

    hide() {
        if (this.containerElement && this.contentWrapperElement) {
            this.containerElement.classList.remove('show-ticker');
            this.contentWrapperElement.classList.remove('animate');
            logger.log("HIDDEN");
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-ticker') : false;
    }
}
