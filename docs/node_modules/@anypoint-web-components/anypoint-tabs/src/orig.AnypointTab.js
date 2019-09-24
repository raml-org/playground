import { html, css, LitElement } from 'lit-element';
import { ButtonStateMixin, ControlStateMixin } from
  '@anypoint-web-components/anypoint-control-mixins/anypoint-control-mixins.js';
import '@polymer/paper-ripple/paper-ripple.js';

export class AnypointTab extends ButtonStateMixin(ControlStateMixin(LitElement)) {
  static get styles() {
    return css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 1 1 auto;
        position: relative;
        padding: 0 12px;
        overflow: hidden;
        cursor: pointer;
        vertical-align: middle;
      }

      :host(:focus) {
        outline: none;
      }

      :host([link]) {
        padding: 0;
      }

      .tab-content {
        height: 100%;
        transform: translateZ(0);
        transition: opacity 0.1s cubic-bezier(0.4, 0.0, 1, 1);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
      }

      :host(:not(.selected)) > .tab-content {
        opacity: 0.8;
      }

      :host(:focus) .tab-content {
        opacity: 1;
        font-weight: 700;
      }

      paper-ripple {
        color: var(--anypoint-tab-ink, var(--accent-color));
      }

      .tab-content > ::slotted(a) {
        flex: 1 1 auto;
        height: 100%;
      }
    `;
  }

  static get properties() {
    return {
      /**
       * If true, the tab will forward keyboard clicks (enter/space) to
       * the first anchor element found in its descendants
       */
      link: { type: Boolean, reflect: true },
      /**
       * If true, the ripple will not generate a ripple effect
       * via pointer interaction.
       */
      noink: { type: Boolean }
    };
  }

  constructor() {
    super();
    this._clickHandler = this._clickHandler.bind(this);
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'tab');
    }
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.addEventListener('click', this._clickHandler);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.removeEventListener('click', this._clickHandler);
  }

  _clickHandler() {
    if (this.link) {
      const slot = this.shadowRoot.querySelector('slot');
      const nodes = slot.assignedNodes();
      let target;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].localName === 'a') {
          target = nodes[i];
          break;
        }
      }
      if (!target) {
        return;
      }
      // Don't get stuck in a loop delegating
      // the listener from the child anchor
      if (event.target === target) {
        return;
      }
      target.click();
    }
  }

  render() {
    return html`
    <div class="tab-content">
      <slot></slot>
    </div>
    <paper-ripple ?noink="${this.noink}"></paper-ripple>`;
  }
}
