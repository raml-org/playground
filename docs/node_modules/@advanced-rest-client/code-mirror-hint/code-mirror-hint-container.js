import { html, css, LitElement } from 'lit-element';
/**
 * `code-mirror-hint-container`
 * UI element for hint display.
 *
 * @customElement
 * @demo demo/index.html
 */
export class CodeMirrorHintContainer extends LitElement {
  static get styles() {
    return css`
    :host {
      box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14),
                  0 1px 10px 0 rgba(0, 0, 0, 0.12),
                  0 2px 4px -1px rgba(0, 0, 0, 0.4);
    }
    `;
  }

  render() {
    return html`
    <div class="container">
      <slot></slot>
    </div>`;
  }
}
window.customElements.define('code-mirror-hint-container', CodeMirrorHintContainer);
