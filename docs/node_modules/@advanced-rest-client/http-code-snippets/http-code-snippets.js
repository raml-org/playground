import { LitElement, html, css } from 'lit-element';
import '@anypoint-web-components/anypoint-tabs/anypoint-tabs.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tab.js';
import '@polymer/prism-element/prism-highlighter.js';
import './raw-http-snippet.js';
import './curl-http-snippet.js';
import './javascript-http-snippets.js';
import './python-http-snippets.js';
import './c-curl-http-snippet.js';
import './java-http-snippets.js';
/**
 * `http-code-snippets`
 *
 * Code snippets to display code implementatyion examples for a HTTP request
 *
 * ## Polyfills
 *
 * This component requires `advanced-rest-client/URL` (or other) polyfill for
 * URL object. This spec is not supported in Safari 9 and IE 11.
 * If you are targeting this browsers install ind include this dependency.
 *
 * This component does not include polyfills.
 *
 * ## Styling
 *
 * See http-code-snippets-style.js file for styling definition.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 */
class HttpCodeSnippets extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
    }`;
  }

  render() {
    const { selected, scrollable, compatibility } = this;
    return html`
    <prism-highlighter></prism-highlighter>
    <anypoint-tabs
      .selected="${selected}"
      ?scrollable="${scrollable}"
      fitcontainer
      ?compatibility="${compatibility}"
      @selected-changed="${this._selectedCHanged}">
      <anypoint-tab>cURL</anypoint-tab>
      <anypoint-tab>HTTP</anypoint-tab>
      <anypoint-tab>JavaScript</anypoint-tab>
      <anypoint-tab>Python</anypoint-tab>
      <anypoint-tab>C</anypoint-tab>
      <anypoint-tab>Java</anypoint-tab>
    </anypoint-tabs>
    ${this._snippetTemplate()}`;
  }

  _snippetTemplate() {
    const { selected, url, method, payload, _headersList: headers, compatibility } = this;
    switch (selected) {
      case 0: return html`<curl-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></curl-http-snippet>`;
      case 1: return html`<raw-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></raw-http-snippet>`;
      case 2: return html`<javascript-http-snippets
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"
        ?compatibility="${compatibility}"></javascript-http-snippets>`;
      case 3: return html`<python-http-snippets
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"
        ?compatibility="${compatibility}"></python-http-snippets>`;
      case 4: return html`<c-curl-http-snippet
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"></c-curl-http-snippet>`;
      case 5: return html`<java-http-snippets
        .url="${url}"
        .method="${method}"
        .payload="${payload}"
        .headers="${headers}"
        ?compatibility="${compatibility}"></java-http-snippets>`;
    }
  }

  static get properties() {
    return {
      /**
       * Currently selected tab for the platform row.
       */
      selected: { type: Number },
      /**
       * Computed list of headers from `headers` property.
       * It is an array of objects where each object contains `name` and `value`
       * properties.
       * @type {Array<Object>}
       */
      _headersList: { type: Array },
      // Passed to `anypoint-tabs` `scrollable` property
      scrollable: { type: Boolean },
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
       */
      headers: { type: String },
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

  get headers() {
    return this._headers;
  }

  set headers(value) {
    const old = this._headers;
    if (old === value) {
      return;
    }
    this._headers = value;
    this._headersList = this.headersToList(value);
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
  /**
   * Computes a list of headers from a headers string.
   * @param {?String} headers
   * @return {Array} Headers as a list od maps. Can be empty.
   */
  headersToList(headers) {
    headers = headers || this.headers;
    if (!headers || !headers.trim() || typeof headers !== 'string') {
      return [];
    }
    const result = [];
    headers = headers.replace('\\n', '\n');
    headers = headers.split(/\n(?=[^ \t]+)/gim);
    for (let i = 0, len = headers.length; i < len; i++) {
      const line = headers[i].trim();
      if (line === '') {
        continue;
      }
      const sepPosition = line.indexOf(':');
      if (sepPosition === -1) {
        result[result.length] = {
          name: line,
          value: ''
        };
        continue;
      }
      const name = line.substr(0, sepPosition);
      const value = line.substr(sepPosition + 1).trim();
      const obj = {
        name: name,
        value: value
      };
      result.push(obj);
    }
    return result;
  }
}
window.customElements.define('http-code-snippets', HttpCodeSnippets);
