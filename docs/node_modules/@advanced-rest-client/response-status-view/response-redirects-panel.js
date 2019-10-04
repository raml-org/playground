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
import '@advanced-rest-client/headers-list-view/headers-list-view.js';
import { ResponseStatusMixin } from './response-status-mixin.js';
import statusStyles from './response-status-styles.js';
/**
 * HTTP redirects info panel.
 * Renders list of redirects and headers in the response.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof UiElements
 * @appliesMixin ResponseStatusMixin
 */
class ResponseRedirectsPanel extends ResponseStatusMixin(LitElement) {
  static get styles() {
    return [
      statusStyles,
      css`.status-label {
        width: 40px;
        font-size: var(--arc-font-subhead-font-size);
        font-weight: var(--arc-font-subhead-font-weight);
        line-height: var(--arc-font-subhead-line-height);
      }

      .redirect-value {
        margin-top: 12px;
        flex: 1;
      }

      .redirect-location {
        margin-left: 8px;
      }

      .auto-link {
        color: var(--link-color);
      }`
    ];
  }

  _listItemTemplate(item, index, narrow) {
    const loc = this._computeRedirectLocation(item.headers);
    return html`<div class="status-label text">
      #<span>${index + 1}</span>
    </div>
    <div class="redirect-value" @click="${this._handleLink}">
      <div class="status-value status text">
        <span class="${this._computeStatusClass(item.status)}">${item.status} ${item.statusText}</span>
        <span class="redirect-location">
          to: <a href="${loc}" class="auto-link">${loc}</a></span>
      </div>
      <headers-list-view
        .headers="${item.headers}"
        ?narrow="${narrow}"></headers-list-view>
    </div>`;
  }

  render() {
    const { redirects, narrow } = this;
    const hasRedirects = !!(redirects && redirects.length);
    return html`
    ${hasRedirects ?
      redirects.map((item, index) =>
        html`<div class="status-row">
          ${this._listItemTemplate(item, index, narrow)}
          </div>`) :
      html`<div class="no-info-container">
          <p class="no-info">There is no redirects information to display</p>
        </div>`}
    `;
  }

  static get properties() {
    return {
      /**
       * List of redirects information.
       */
      redirects: { type: Array }
    };
  }
  /**
   * Extracts a location URL form the headers.
   *
   * @param {String} headers A HTTP headers string.
   * @return {String} A value of the location header or `unknown` if not
   * found.
   */
  _computeRedirectLocation(headers) {
    const def = 'unknown';
    if (!headers) {
      return def;
    }
    if (typeof headers === 'string') {
      const match = headers.match(/^location: (.*)$/im);
      if (!match) {
        return def;
      }
      return match[1];
    }
    const location = headers.get('location');
    return location || def;
  }
}
window.customElements.define('response-redirects-panel', ResponseRedirectsPanel);
