// js/overlays/OutroOverlay.js
export class OutroOverlay {
    constructor(elementId, onShowCallback, onHideCallback) {
        this.containerElement = document.getElementById(elementId);
        this._onShowCallback = onShowCallback;
        this._onHideCallback = onHideCallback;

        if (!this.containerElement) console.error(`OutroOverlay: Element with ID '${elementId}' not found.`);
    }

    show() {
        if (this.containerElement) {
            if (typeof this._onShowCallback === 'function') {
                this._onShowCallback();
            }
            this.containerElement.classList.add('show-outro'); // Use 'show-outro' class
            console.log("Outro Overlay: SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-outro');
            console.log("Outro Overlay: HIDDEN");
            if (typeof this._onHideCallback === 'function') {
                this._onHideCallback();
            }
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-outro') : false;
    }
}
