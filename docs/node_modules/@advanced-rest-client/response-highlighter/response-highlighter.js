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
import '@advanced-rest-client/prism-highlight/prism-highlight.js';
/**
 * An element that parses the HTTP response and displays highlighted result.
 *
 * It splits the response by line (by default it's 500) and if the response has
 * more than that it shows only first 500 lines and the user can request to
 * display the rest or next 500 lines. This is to make the element work faster.
 * If the response is very long it may take some time to parse and tokenize it.
 * Control number of lines by setting the maxRead attribute.
 *
 * ### Example
 *
 * ```html
 * <response-highlighter></response-highlighter>
 * ```
 * ```javascript
 * const display = document.querySelector('response-highlighter');
 * display.responseText = someJsonResponse;
 * display.contentType = 'application/json';
 * ```
 *
 * ## Content actions
 *
 * Child elements added to light DOM with slot name `content-action` are rendered
 * in actions container. It is a way to render additional actions related to
 * the response text.
 *
 * ### Example
 *
 * ```html
 * <response-highlighter>
 *  <paper-icon-button title="Additional action" icon="arc:cached"></paper-icon-button>
 *  <paper-icon-button title="Clear the code" icon="arc:clear"></paper-icon-button>
 * </response-highlighter>
 * ```
 *
 * See demo for more information.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof UiElements
 */
class ResponseHighlighter extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
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
    }

    [hidden] {
      display: none !important;
    }`;
  }

  render() {
    const {
      responseText,
      lang
    } = this;
    return html`
    <div class="${this._actionsPanelClass}">
      <slot name="content-action"></slot>
    </div>
    ${responseText ?
      html`<prism-highlight .code="${responseText}" .lang="${lang}"></prism-highlight>`:
      html`<p class="no-info">Nothing to display.</p>`}`;
  }

  static get properties() {
    return {
      /**
       * The response text to display.
       */
      responseText: { type: String },
      /**
       * Response content type.
       * It will be used to determine which syntaxt highlighter to use.
       */
      contentType: { type: String }
    };
  }

  get _actionsPanelClass() {
    let clazz = 'actions-panel';
    if (!this.responseText) {
      clazz += ' hidden';
    }
    return clazz;
  }
  /**
   * The lang property for the Prism.
   */
  get lang() {
    return this._computeLang(this.contentType);
  }
  /**
   * Computes a `lang` property for the Prism from the response content-type.
   *
   * @param {String} contentType
   * @return {String}
   */
  _computeLang(contentType) {
    if (!contentType || !contentType.indexOf) {
      return undefined;
    }
    if (contentType.indexOf(';') !== -1) {
      return contentType.split(';')[0];
    }
    return contentType;
  }
}
window.customElements.define('response-highlighter', ResponseHighlighter);
