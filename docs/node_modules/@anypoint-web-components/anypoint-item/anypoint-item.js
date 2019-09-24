import { LitElement, html, css } from 'lit-element';
import {
  ButtonStateMixin,
  ControlStateMixin,
  HoverableMixin,
} from '@anypoint-web-components/anypoint-control-mixins/anypoint-control-mixins.js';
import styles from './anypoint-item-shared-styles.js';
/**
 * `anypoint-item`
 * An Anypoint list item.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof AnypointUi
 */
class AnypointItem extends HoverableMixin(ControlStateMixin(ButtonStateMixin(LitElement))) {
  static get styles() {
    return [
      styles,
      css`
        :host {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
      `,
    ];
  }

  static get properties() {
    return {
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  render() {
    return html`
      <slot></slot>
    `;
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'option');
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    if (super.connectedCallback) {
      super.connectedCallback();
    }
  }
}

window.customElements.define('anypoint-item', AnypointItem);
