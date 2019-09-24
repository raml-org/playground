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
import './requests-python-http-snippet.js';
import './python-27-http-snippet.js';
import './python-31-http-snippet.js';
/**
 * `raw-http-snippet`
 *
 * A set of code snippets for Python requests.
 *
 * ## Styling
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--http-code-snippets` | Mixin applied to this elment | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/python.html Python demo
 * @memberof ApiElements
 */
class PythonHttpSnippets extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
    }`;
  }

  _renderPage(selected) {
    const { url, method, payload, headers } = this;
    switch (selected) {
      case 0: return html`<requests-python-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></requests-python-http-snippet>`;
      case 1: return html`<python-27-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></python-27-http-snippet>`;
      case 2: return html`<python-31-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></python-31-http-snippet>`;
    }
  }

  render() {
    const { selected, compatibility } = this;
    return html`
    <anypoint-tabs
      ?compatibility="${compatibility}"
      .selected="${selected}"
      @selected-changed="${this._selectedCHanged}">
      <anypoint-tab>Requests</anypoint-tab>
      <anypoint-tab>Python 2.7</anypoint-tab>
      <anypoint-tab>Python 3.1</anypoint-tab>
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
      compatibility: { type: Boolean }
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
window.customElements.define('python-http-snippets', PythonHttpSnippets);
