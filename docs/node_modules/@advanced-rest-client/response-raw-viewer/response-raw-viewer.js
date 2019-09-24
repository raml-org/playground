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
import { html, css, LitElement } from 'lit-element';
/**
 * An element to display the raw response data without syntax highlighting.
 *
 * ### Example
 *
 * ```html
 * <response-raw-viewer responsetext="Some response"></response-raw-viewer>
 * <script>
 * const display = document.querySelector('response-raw-viewer');
 * display.responseText = someResponse;
 * < /script>
 * ```
 *
 * ## Content actions
 *
 * Custom actions can be defined by adding a child with `slot="content-action"`
 * attribute set. Eny element will be rendered in content action field.
 *
 * ### Example
 *
 * ```html
 * <response-raw-viewer>
 *  <paper-icon-button slot="content-action"
 *    title="Copy content to clipboard" icon="arc:content-copy"></paper-icon-button>
 * </response-raw-viewer>
 * ```
 *
 * See demo for more examples.
 *
 * ## Content text wrapping
 *
 * Set `wraptext` attribute on the element to force the wiewer to wrap text.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin PayloadParserMixin
 */
class ResponseRawViewer extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
      overflow: overlay;
      width: 100%;
    }

    .raw-content {
      font-family: var(--arc-font-code-family);
      user-select: text;
      white-space: pre;
      width: 100%;
      min-height: 52px;
      display: block;
      overflow: auto;
      max-width: 100%;
      margin: 12px 0;
    }

    .raw-content[tabindex="-1"] {
      outline: none;
    }

    :host([wraptext]) .raw-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .actions-panel {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .actions-panel.hidden {
      display: none;
    }

    .no-info {
      font-style: var(--no-info-message-font-style, italic);
      font-size: var(--no-info-message-font-size, 16px);
      color: var(--no-info-message-color, rgba(0, 0, 0, 0.74));
    }`;
  }

  render() {
    const {
      _actionsPanelClass,
      responseText,
      wrapText
    } = this;
    const tabIndex = wrapText ? '-1' : '0';
    return html`
    <div class="${_actionsPanelClass}">
      <slot name="content-action"></slot>
    </div>
    ${responseText ?
      html`<code class="raw-content" tabindex="${tabIndex}">${this._responseValue(responseText)}</code>`:
      html`<p class="no-info">Nothing to display.</p>`}`;
  }

  static get properties() {
    return {
      /**
       * The response text to display.
       */
      responseText: { type: String },
      // If set to true then the text in the panel will be wrapped.
      wrapText: { type: Boolean, reflect: true }
    };
  }

  get _actionsPanelClass() {
    let klas = 'actions-panel';
    if (!this.responseText) {
      klas += ' hidden';
    }
    return klas;
  }
  /**
   * ARC stores workspace data with response object in a file.
   * It may happen that the data is a buffer when saving. This restores
   * the string if needed.
   * @param {String|Object} response Usually string response but may be
   * ARC converted object.
   * @return {String} Safe to process string.
   */
  _responseValue(response) {
    if (!response) {
      return response;
    }
    if (typeof response === 'string') {
      return response;
    }
    if (response.type === 'Buffer') {
      let str = '';
      for (let i = 0, len = response.data.length; i < len; i++) {
        str += String.fromCharCode(response.data[i]);
      }
      return str;
    }
    return '';
  }
}
window.customElements.define('response-raw-viewer', ResponseRawViewer);
