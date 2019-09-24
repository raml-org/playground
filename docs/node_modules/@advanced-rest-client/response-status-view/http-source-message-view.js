/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html, css } from 'lit-element';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
/**
 * The element displays the HTTP source message that has been sent to the remote mchine.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof UiElements
 */
class HttpSourceMessageView extends LitElement {
  static get styles() {
    return css`:host {
      overflow: auto;
      display: block;
    }

    pre {
      word-break: break-all;
      user-select: text;
      font-family: var(--arc-font-code-family, initial);
      margin-bottom: 0;
    }

    .title {
      margin: 0;
      display: flex;
      align-items: center;
      cursor: pointer;

    }`;
  }

  render() {
    const { opened, message } = this;
    return html`
    <div class="title" @click="${this.toggle}">
      Source message
      <anypoint-icon-button
        title="Toggles source view"
        aria-label="Press to toggle source view">
          <iron-icon icon="${this._computeIcon(opened)}"></iron-icon>
      </anypoint-icon-button>
    </div>
    <iron-collapse id="collapse" .opened="${opened}">
      <pre>${message}</pre>
    </iron-collapse>`;
  }

  static get properties() {
    return {
      // A HTTP message to display.
      message: { type: String },
      // True if the message is visible.
      opened: { type: Boolean },
      /**
       * Icon prefix from the svg icon set. This can be used to replace the set
       * without changing the icon.
       *
       * Defaults to `arc`.
       */
      iconPrefix: { type: String }
    };
  }

  get opened() {
    return this._opened;
  }

  set opened(value) {
    const old = this._opened;
    if (old === value) {
      return;
    }
    this._opened = value;
    this.requestUpdate('opened', old);
    if (value) {
      this.setAttribute('aria-expanded', 'true');
    } else {
      this.setAttribute('aria-expanded', 'false');
    }
  }

  constructor() {
    super();
    this.iconPrefix = 'arc';
  }
  /**
   * Toggles source message visibility
   */
  toggle() {
    this.opened = !this.opened;
  }
  /**
   * Computes icon name depending on `opened` state
   * @param {Boolean} opened
   * @return {String}
   */
  _computeIcon(opened) {
    let icon = '';
    if (this.iconPrefix) {
      icon = this.iconPrefix + ':';
    }
    return icon + (opened ? 'expand-less' : 'expand-more');
  }
}
window.customElements.define('http-source-message-view', HttpSourceMessageView);
