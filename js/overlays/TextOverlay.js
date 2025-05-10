// js/overlays/TextOverlay.js
export class TextOverlay {
    constructor(elementId, textElementId) {
        this.overlayElement = document.getElementById(elementId);
        this.textElement = document.getElementById(textElementId);

        if (!this.overlayElement) console.error(`TextOverlay: Element with ID '${elementId}' not found.`);
        if (!this.textElement) console.error(`TextOverlay: Element with ID '${textElementId}' not found.`);
    }

    setText(text) {
        if (this.textElement) {
            this.textElement.textContent = text;
        }
    }

    show() {
        if (this.overlayElement) {
            this.overlayElement.classList.add('show');
            console.log("Text Overlay: SHOWN");
        }
    }

    hide() {
        if (this.overlayElement) {
            this.overlayElement.classList.remove('show');
            console.log("Text Overlay: HIDDEN");
        }
    }

    toggle() {
        if (this.overlayElement) {
            this.overlayElement.classList.toggle('show');
            console.log(`Text Overlay: ${this.isVisible ? 'SHOWN' : 'HIDDEN'}`);
        }
    }

    get isVisible() {
        return this.overlayElement ? this.overlayElement.classList.contains('show') : false;
    }
}
