// js/overlays/BreakingNewsOverlay.js
export class BreakingNewsOverlay {
    constructor(elementId) {
        this.containerElement = document.getElementById(elementId);
        if (!this.containerElement) console.error(`BreakingNewsOverlay: Element with ID '${elementId}' not found.`);
    }

    show() {
        if (this.containerElement) {
            this.containerElement.classList.add('show-breaking-news');
            console.log("BN: SHOWN");
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-breaking-news');
            console.log("BN: HIDDEN");
        }
    }

    toggle() {
        if (this.containerElement) {
            this.containerElement.classList.toggle('show-breaking-news');
            console.log(`BN: ${this.isVisible ? 'SHOWN' : 'HIDDEN'}`);
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-breaking-news') : false;
    }
}
