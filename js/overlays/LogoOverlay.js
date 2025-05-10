// js/overlays/LogoOverlay.js
export class LogoOverlay {
    constructor(elementId) {
        this.containerElement = document.getElementById(elementId);
        if (!this.containerElement) console.error(`LogoOverlay: Element with ID '${elementId}' not found.`);
    }

    show() {
        if (this.containerElement) {
            this.containerElement.classList.add('show-logo');
            console.log("Logo: SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-logo');
            console.log("Logo: HIDDEN");
        }
    }

    toggle() {
        if (this.containerElement) {
            this.containerElement.classList.toggle('show-logo');
            console.log(`Logo: ${this.isVisible ? 'SHOWN' : 'HIDDEN'}`);
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-logo') : false;
    }
}
