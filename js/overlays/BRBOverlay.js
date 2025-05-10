// js/overlays/BRBOverlay.js
export class BRBOverlay {
    constructor(elementId, onShowCallback, onHideCallback) {
        this.containerElement = document.getElementById(elementId);
        this._onShowCallback = onShowCallback; // Manager provides this to hide other overlays
        this._onHideCallback = onHideCallback; // Manager provides this for post-hide actions

        if (!this.containerElement) console.error(`BRBOverlay: Element with ID '${elementId}' not found.`);
    }

    show() {
        if (this.containerElement) {
            if (typeof this._onShowCallback === 'function') {
                this._onShowCallback();
            }
            this.containerElement.classList.add('show-brb');
            console.log("BRB Overlay: SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-brb');
            console.log("BRB Overlay: HIDDEN");
            if (typeof this._onHideCallback === 'function') {
                this._onHideCallback();
            }
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-brb') : false;
    }
}
