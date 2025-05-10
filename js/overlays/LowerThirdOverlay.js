// js/overlays/LowerThirdOverlay.js
export class LowerThirdOverlay {
    constructor(containerId, nameId, titleId, affiliationId) {
        this.containerElement = document.getElementById(containerId);
        this.nameElement = document.getElementById(nameId);
        this.titleElement = document.getElementById(titleId);
        this.affiliationElement = document.getElementById(affiliationId);

        if (!this.containerElement) console.error(`LowerThirdOverlay: Element with ID '${containerId}' not found.`);
        if (!this.nameElement) console.error(`LowerThirdOverlay: Element with ID '${nameId}' not found.`);
        if (!this.titleElement) console.error(`LowerThirdOverlay: Element with ID '${titleId}' not found.`);
        if (!this.affiliationElement) console.error(`LowerThirdOverlay: Element with ID '${affiliationId}' not found.`);
    }

    update(data = {}) {
        if (this.nameElement) {
            this.nameElement.textContent = data.name || "";
            this.nameElement.style.display = data.name ? 'block' : 'none';
        }
        if (this.titleElement) {
            this.titleElement.textContent = data.title || "";
            this.titleElement.style.display = data.title ? 'block' : 'none';
        }
        if (this.affiliationElement) {
            this.affiliationElement.textContent = data.affiliation || "";
            this.affiliationElement.style.display = data.affiliation ? 'block' : 'none';
        }
    }

    show(data) {
        if (this.containerElement) {
            this.update(data);
            this.containerElement.classList.add('show-lower-third');
            console.log("LT: SHOWN", data);
        }
    }

    hide() {
        if (this.containerElement) {
            this.containerElement.classList.remove('show-lower-third');
            console.log("LT: HIDDEN");
        }
    }

    get isVisible() {
        return this.containerElement ? this.containerElement.classList.contains('show-lower-third') : false;
    }
}
