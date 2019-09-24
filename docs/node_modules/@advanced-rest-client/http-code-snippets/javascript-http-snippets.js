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
import '@anypoint-web-components/anypoint-tabs/anypoint-tabs.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tab.js';
import './xhr-http-snippet.js';
import './fetch-js-http-snippet.js';
import './node-http-snippet.js';
/**
 * `javascript-http-snippet`
 *
 * A set of code snippets for JavaScript requests.
 *
 * ## Styling
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--http-code-snippets` | Mixin applied to this elment | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/javascript.html JavaScript demo
 * @memberof ApiElements
 */
class JavascriptHttpSnippets extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
    }`;
  }

  _renderPage(selected) {
    const { url, method, payload, headers } = this;
    switch (selected) {
      case 0: return html`<fetch-js-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></fetch-js-http-snippet>`;
      case 1: return html`<node-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></node-http-snippet>`;
      case 2: return html`<xhr-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></xhr-http-snippet>`;
    }
  }

  render() {
    const { selected, compatibility } = this;
    return html`
    <anypoint-tabs
      ?compatibility="${compatibility}"
      .selected="${selected}"
      @selected-changed="${this._selectedCHanged}">
      <anypoint-tab>Fetch</anypoint-tab>
      <anypoint-tab>Node</anypoint-tab>
      <anypoint-tab>XHR</anypoint-tab>
    </anypoint-tabs>
    ${this._renderPage(selected)}
    `;
  }
  static get properties() {
    return {
      selected: { type: Number },
      /**
       * Request URL
       */
      url: { type: String },
      /**
       * HTTP method
       */
      method: { type: String },
      /**
       * Parsed HTTP headers.
       * Each item contains `name` and `value` properties.
       * @type {Array<Object>}
       */
      headers: { type: Array },
      /**
       * HTTP body (the message)
       */
      payload: { type: String },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true }
    };
  }
  constructor() {
    super();
    this.selected = 0;
  }
  /**
   * Handler for `selected-changed` event dispatched on anypoint-tabs.
   * @param {CustomEvent} e
   */
  _selectedCHanged(e) {
    const { value } = e.detail;
    this.selected = value;
  }
}
window.customElements.define('javascript-http-snippets', JavascriptHttpSnippets);
