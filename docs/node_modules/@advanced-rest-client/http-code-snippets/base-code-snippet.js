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
import { LitElement, html } from 'lit-element';
import httpStyles from './http-code-snippets-style.js';
const URI_CACHE = {};
function noop() {}
/**
 * `base-code-snippet`
 *
 * A class to be used to extend other code snippets elements.
 *
 * Each child class has to have `lang` property to be used to recognize the
 * syntax. If syntax is different than the default PrismJs set then it has to
 * be imported into the DOM.
 *
 * Each child class must implement `_processCommand()` function which results
 * to a code to highlight. It takes 4 attributes (in order): url, method,
 * headers, and payload.
 * Mind that all atguments are optional.
 *
 * If the child class implements it's own template, it should contain
 * `<code></code>` inside the template where the highlighted value is
 * added.
 *
 * Parent element, presumably `http-code-snippets`, or main document
 * must include `prism-element/prism-highlighter.html` in it's DOM.
 *
 * ### Styling
 *
 * See `http-code-snippets` for styling documentation.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 */
export class BaseCodeSnippet extends LitElement {
  static get _httpStyles() {
    return httpStyles;
  }

  static get styles() {
    return BaseCodeSnippet._httpStyles;
  }

  render() {
    return html`<button class="copy-button" title="Copy to clipboard" @click="${this._copyToClipboard}">Copy</button>
    <code class="code language-snippet"></code>`;
  }

  static get properties() {
    return {
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

  get url() {
    return this._url;
  }

  get method() {
    return this._method;
  }

  get headers() {
    return this._headers;
  }

  get payload() {
    return this._payload;
  }

  set url(value) {
    this._setProp('url', value);
  }

  set method(value) {
    this._setProp('method', value);
  }

  set headers(value) {
    this._setProp('headers', value);
  }

  set payload(value) {
    this._setProp('payload', value);
  }

  get _code() {
    return this.shadowRoot.querySelector('code');
  }

  _setProp(prop, value) {
    if (this._sop(prop, value)) {
      this._valuesChanged();
    }
  }

  _sop(prop, value) {
    const key = '_' + prop;
    const old = this[key];
    if (old === value) {
      return false;
    }
    this[key] = value;
    this.requestUpdate(prop, old);
    return true;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.__valuesDebouncer) {
      this._valuesChanged();
    }
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this._clearValueTimeout();
  }
  /**
   * Clears timeout from the debouncer if set.
   */
  _clearValueTimeout() {
    if (this.__valuesDebouncer) {
      clearTimeout(this.__valuesDebouncer);
      this.__valuesDebouncer = undefined;
    }
  }
  /**
   * Computes code value with debouncer.
   */
  _valuesChanged() {
    this._clearValueTimeout();
    this.__valuesDebouncer = setTimeout(() => {
      this.__valuesDebouncer = undefined;
      this._processCommand();
    });
  }
  /**
   * Processes command by calling, respectively, `_computeCommand()` and
   * `_highlight()`. The result is added to the `<code>` block in the template.
   */
  _processCommand() {
    const { url, method, headers, payload } = this;
    let code = this._computeCommand(url, method, headers, payload);
    if (!code) {
      code = '';
    } else {
      code = this._highlight(code, this.lang);
    }
    this._code.innerHTML = code;
  }

  _computeCommand() {}

  _highlight(code, lang) {
    const e = new CustomEvent('syntax-highlight', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        code,
        lang
      }
    });
    this.dispatchEvent(e);
    return e.detail.code || code;
  }
  /**
   * Reads the host, port and path from the url.
   * This function uses URI library to parse the URL so you have to
   * include this library from bower_components if the element want to use it.
   *
   * @param {String} url
   * @return {Object}
   */
  urlDetails(url) {
    if (URI_CACHE[url]) {
      return URI_CACHE[url];
    }
    url = url || this.url;
    const result = {
      path: '',
      port: '',
      hostValue: ''
    };
    if (!url) {
      return result;
    }
    let uri;
    try {
      uri = new URL(url);
    } catch (e) {
      if (url[0] === '/') {
        result.path = url;
        result.post = 80;
      }
      return result;
    }
    let host = uri.hostname;
    if (host) {
      host = decodeURIComponent(host);
    }
    let port = uri.port;
    if (!port) {
      if (uri.protocol === 'https:') {
        port = 443;
      } else {
        port = 80;
      }
    }
    result.port = port;
    result.hostValue = host;
    const query = uri.search;
    let path = uri.pathname;
    if (!path) {
      path = '/';
    } else {
      path = decodeURIComponent(path);
    }
    if (query) {
      path += query;
    }
    result.path = path;
    URI_CACHE[url] = result;
    return result;
  }

  _copyToClipboard() {
    const code = this._code;
    if (!code) {
      return;
    }
    const content = code.innerText;
    if (this._beforeCopy(content)) {
      return;
    }
    const el = document.createElement('textarea');
    el.value = content;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selected = document.getSelection().rangeCount > 0 ?
      document.getSelection().getRangeAt(0) : false;
    el.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      noop();
    }
    document.body.removeChild(el);
    document.getSelection().removeAllRanges();
    if (selected) {
      document.getSelection().addRange(selected);
    }
  }
  /**
   * Sends the `content-copy` event.
   * If the event is canceled then the logic from this element won't be
   * executed. Useful if current platform doesn't support `execCommand('copy')`
   * and has other way to manage clipboard.
   *
   * @param {String} value The value to dispatch with the event.
   * @return {Boolean} True if handler executed copy function.
   */
  _beforeCopy(value) {
    const ev = new CustomEvent('content-copy', {
      detail: {
        value
      },
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.dispatchEvent(ev);
    return ev.defaultPrevented;
  }
}
window.customElements.define('base-code-snippet', BaseCodeSnippet);
