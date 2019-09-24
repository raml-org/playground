import { html, css } from 'lit-element';
import { AnypointButtonBase } from './AnypointButtonBase.js';
import '@polymer/paper-ripple/paper-ripple.js';
/**
 * `anypoint-button`
 * Anypoint styled button.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof AnypointUi
 */
export class AnypointButton extends AnypointButtonBase {
  static get styles() {
    return css`:host {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      position: relative;
      box-sizing: border-box;
      min-width: 5.14em;
      margin: 0 0.29em;
      outline-width: 0;
      user-select: none;
      cursor: pointer;
      z-index: 0;
      padding: 0.7em 0.57em;
      font-size: var(--anypoint-button-font-size, 15px);
      background-color: var(--anypoint-button-background-color, inherit);
      color: var(--anypoint-button-color, var(--anypoint-color-primary));
      border-width: 1px;
      border-color: var(--anypoint-button-border-color, transparent);
      border-style: solid;
      border-radius: var(--anypoint-button-border-radius, 3px);
      text-transform: var(--anypoint-button-text-transform, uppercase);
      transition: box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host([hidden]) {
      display: none !important;
    }

    :host(:focus) {
      outline: none;
    }

    :host([disabled]) {
      cursor: auto;
      pointer-events: none;
    }

    :host([emphasis="low"]:not([compatibility])) {
      box-shadow: none !important;
    }

    :host([emphasis="low"][disabled]) {
      color: var(--anypoint-button-disabled-color, #a8a8a8);
    }

    :host(:not([pressed])[emphasis="low"]:hover) {
      background-color: var(--anypoint-button-emphasis-low-hover-background-color, rgba(0, 162, 223, .08));
    }

    :host(:not([pressed]):not([compatibility])[emphasis="low"][focused]) {
      background-color: var(--anypoint-button-emphasis-low-focus-background-color, rgba(0, 162, 223, .12));
      color: var(--anypoint-button-emphasis-low-focus-color, var(--anypoint-color-coreBlue4));
    }

    :host(:not([pressed])[emphasis="low"][active]) {
      background-color: var(--anypoint-button-emphasis-low-active-background-color, rgba(0, 162, 223, .16));
    }

    :host([emphasis="medium"]:not([compatibility])) {
      box-shadow: none !important;
    }

    :host([emphasis="medium"]) {
      border-color: var(--anypoint-button-emphasis-medium-focus-border-color, var(--anypoint-color-robustBlue1));
    }

    :host([emphasis="medium"][disabled]) {
      color: var(--anypoint-button-disabled-color, #a8a8a8);
      border-color: var(--anypoint-button-disabled-color, var(--anypoint-color-aluminum4));
    }

    :host(:not([pressed])[emphasis="medium"]:hover) {
      background-color: var(--anypoint-button-emphasis-medium-hover-background-color, rgba(0, 162, 223, .06));
    }

    :host(:not([pressed])[emphasis="medium"][focused]) {
      background-color: var(--anypoint-button-emphasis-medium-focus-background-color, rgba(0, 162, 223, .08));
      color: var(--anypoint-button-emphasis-low-focus-color, var(--anypoint-color-coreBlue4));
      border-color: var(--anypoint-button-emphasis-medium-focus-border-color, var(--anypoint-color-robustBlue2));
    }

    :host(:not([pressed])[emphasis="medium"][active]) {
      background-color: var(--anypoint-button-emphasis-low-active-background-color, rgba(94, 102, 249, 0.16));
    }

    :host([emphasis="high"]:not([compatibility])) {
      will-change: box-shadow;
      background-color: var(--anypoint-button-emphasis-high-background-color, var(--anypoint-color-primary));
      color: var(--anypoint-button-emphasis-high-color, var(--anypoint-color-tertiary));
    }

    :host([emphasis="high"][disabled]:not([compatibility])) {
      background: var(--anypoint-button-disabled-background-color, #eaeaea);
      color: var(--anypoint-button-disabled-color, #a8a8a8);
      box-shadow: none;
    }

    :host(:not([pressed]):not([compatibility])[emphasis="high"]:hover) {
      background-color: var(--anypoint-button-emphasis-high-hover-background-color, rgba(0, 162, 223, 0.87));
    }

    :host(:not([pressed]):not([compatibility])[emphasis="high"]:focus) {
      background-color: var(--anypoint-button-emphasis-high-focus-background-color, rgba(0, 162, 223, 0.87));
    }

    :host(:not([pressed]):not([compatibility])[emphasis="high"][active]) {
      background-color: var(--anypoint-button-emphasis-high-active-background-color, var(--anypoint-color-indigo3));
    }

    :host([elevation="1"]) {
      box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
                  0 1px 5px 0 rgba(0, 0, 0, 0.12),
                  0 3px 1px -2px rgba(0, 0, 0, 0.2);
    }

    :host([elevation="2"]) {
      box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14),
                  0 1px 10px 0 rgba(0, 0, 0, 0.12),
                  0 2px 4px -1px rgba(0, 0, 0, 0.4);
    }

    :host([elevation="3"]) {
      box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
                  0 1px 18px 0 rgba(0, 0, 0, 0.12),
                  0 3px 5px -1px rgba(0, 0, 0, 0.4);
    }

    :host([emphasis="high"][compatibility]) {
      background-color: var(--anypoint-button-background-color, var(--anypoint-color-primary));
      color: var(--anypoint-button-color, var(--anypoint-color-tertiary));
      border-radius: var(--anypoint-button-border-radius, 2px);
      text-transform: var(--anypoint-button-text-transform, initial);
      height: 40px;
    }

    :host([emphasis="high"][compatibility]:hover) {
      background-color: var(--anypoint-button-hover-background-color, var(--anypoint-color-coreBlue4));
    }

    :host([compatibility][focused]) {
      box-shadow: var(--anypoint-button-foxus-box-shadow-color, 0 0 0 3px #abe2f5);
    }

    :host([emphasis="high"][compatibility][pressed]) {
      background-color: var(--anypoint-button-hover-background-color, var(--anypoint-color-coreBlue5));
    }

    :host([emphasis="high"][compatibility][active]) {
      background-color: var(--anypoint-button-active-background-color, var(--anypoint-color-coreBlue5));
    }

    :host([compatibility]) paper-ripple {
      display: none;
    }

    :host([compatibility][disabled]) {
      background: var(--anypoint-button-disabled-background-color, #eaeaea);
      color: var(--anypoint-button-disabled-color, #a8a8a8);
    }

    :host ::slotted(*) {
      margin: 0 4px;
    }
    `;
  }

  render() {
    const { noink, compatibility } = this;
    const stopRipple = !!noink || !!compatibility;
    return html`<slot></slot><paper-ripple .noink="${stopRipple}"></paper-ripple>`;
  }

  get _ripple() {
    return this.shadowRoot.querySelector('paper-ripple');
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'button');
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    if (super.connectedCallback) {
      super.connectedCallback();
    }
  }

  _spaceKeyDownHandler(e) {
    super._spaceKeyDownHandler(e);
    this._calculateElevation();
    if (!this._ripple.animating) {
      this._ripple.uiDownAction();
    }
  }

  _spaceKeyUpHandler(e) {
    super._spaceKeyUpHandler(e);
    this._calculateElevation();
    this._ripple.uiUpAction();
  }
}
