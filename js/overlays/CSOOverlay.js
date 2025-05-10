// js/overlays/CSOOverlay.js
export class CSOOverlay {
    constructor(elementId, onShowCallback, onHideCallback) {
        this.containerElement = document.getElementById(elementId);
        this._onShowCallback = onShowCallback; // Manager provides this to hide other overlays
        this._onHideCallback = onHideCallback; // Manager provides this for post-hide actions

        if (!this.containerElement) console.error(`CSOOverlay: Element with ID '${elementId}' not found.`);
    }

    show() {
        if (this.containerElement) {
            if (typeof this._onShowCallback === 'function') {
                this._onShowCallback();
            }
            this.containerElement.classList.add('show-cso');
            console.log("CSO Overlay: SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-cso');
            console.log("CSO Overlay: HIDDEN");
            if (typeof this._onHideCallback === 'function') {
                this._onHideCallback();
            }
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-cso') : false;
    }
}
