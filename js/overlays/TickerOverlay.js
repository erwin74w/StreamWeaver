// js/overlays/TickerOverlay.js
export class TickerOverlay {
    constructor(containerId, wrapperId, textSpanId) {
        this.containerElement = document.getElementById(containerId);
        this.contentWrapperElement = document.getElementById(wrapperId);
        this.textSpanElement = document.getElementById(textSpanId);

        if (!this.containerElement) console.error(`TickerOverlay: Element with ID '${containerId}' not found.`);
        if (!this.contentWrapperElement) console.error(`TickerOverlay: Element with ID '${wrapperId}' not found.`);
        if (!this.textSpanElement) console.error(`TickerOverlay: Element with ID '${textSpanId}' not found.`);
    }

    updateAndShow(data = {}) {
        if (this.containerElement && this.textSpanElement && this.contentWrapperElement) {
            const newText = data.text || "StreamWeaver Ticker Active...";
            const trailingSpaces = " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 "; // For continuous scroll appearance
            this.textSpanElement.textContent = newText + trailingSpaces;

            // Restart animation by removing and re-adding the class
            if (this.contentWrapperElement.classList.contains('animate')) {
                this.contentWrapperElement.classList.remove('animate');
                void this.contentWrapperElement.offsetWidth; // Force reflow to restart animation
            }
            this.contentWrapperElement.classList.add('animate');
            this.containerElement.classList.add('show-ticker');
            console.log("Ticker: SHOWN/UPDATED with text:", newText);
        }
    }

    hide() {
        if (this.containerElement && this.contentWrapperElement) {
            this.containerElement.classList.remove('show-ticker');
            this.contentWrapperElement.classList.remove('animate');
            console.log("Ticker: HIDDEN");
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-ticker') : false;
    }
}
