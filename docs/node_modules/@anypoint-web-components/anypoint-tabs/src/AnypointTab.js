import { html, css, } from 'lit-element';
import '@polymer/paper-ripple/paper-ripple.js';
import { AnypointButton } from '@anypoint-web-components/anypoint-button/src/AnypointButton.js';

export class AnypointTab extends AnypointButton {
  static get styles() {
    return [
      AnypointButton.styles,
      css`
      :host {
        overflow: hidden;
        vertical-align: middle;
        margin: 0;
      }

      .tab-content {
        height: 100%;
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

      :host([link]) {
        padding: 0;
      }

      paper-ripple {
        color: var(--anypoint-tab-ink, var(--accent-color));
      }

      .tab-content > ::slotted(a) {
        flex: 1 1 auto;
        height: 100%;
      }`
    ];
  }

  static get properties() {
    return {
      /**
       * If true, the tab will forward keyboard clicks (enter/space) to
       * the first anchor element found in its descendants
       */
      link: { type: Boolean, reflect: true }
    };
  }

  constructor() {
    super();
    this._clickHandler = this._clickHandler.bind(this);
  }

  connectedCallback() {
    /* istanbul ignore else */
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'tab');
    }
    /* istanbul ignore else */
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.addEventListener('click', this._clickHandler);
  }

  disconnectedCallback() {
    /* istanbul ignore else */
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.removeEventListener('click', this._clickHandler);
  }

  _clickHandler(e) {
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
      if (e.target === target) {
        return;
      }
      target.click();
    }
  }

  render() {
    const { noink, legacy } = this;
    const stopRipple = !!noink || !!legacy;
    return html`
      <div class="tab-content">
        <slot></slot>
      </div>
      <paper-ripple .noink="${stopRipple}"></paper-ripple>`;
  }
}
