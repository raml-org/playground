import { LitElement, html, css } from 'lit-element';
import {
  ButtonStateMixin,
  ControlStateMixin,
  HoverableMixin,
} from '@anypoint-web-components/anypoint-control-mixins/anypoint-control-mixins.js';
import styles from './anypoint-item-shared-styles.js';
/**
 * `anypoint-icon-item`
 * An Anypoint icon list item is a convenience element to make an item with icon. It is an
 * interactive list item with a fixed-width icon area.
 * This is useful if the icons are of varying widths, but you want the item
 * bodies to line up. Use this like a `<anypoint-item>`. The child node with the slot
 * name `item-icon` is placed in the icon area.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof AnypointUi
 */
class AnypointIconItem extends HoverableMixin(ControlStateMixin(ButtonStateMixin(LitElement))) {
  static get styles() {
    return [
      styles,
      css`
        :host {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .content-icon {
          display: flex;
          flex-direction: row;
          align-items: center;
          width: var(--anypoint-item-icon-width, 40px);
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
      <div class="content-icon">
        <slot name="item-icon"></slot>
      </div>
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

window.customElements.define('anypoint-icon-item', AnypointIconItem);
