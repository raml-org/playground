/**
@license
Copyright 2018 The Advanced REST Client authors
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
import 'prismjs/prism.js';
import 'prismjs/components/prism-json.min.js';
import 'prismjs/components/prism-markdown.min.js';
import 'prismjs/components/prism-yaml.min.js';
import 'prismjs/plugins/autolinker/prism-autolinker.js';
import styles from './prism-styles.js';
/* global Prism */
/**
 * Syntax highlighting via Prism
 *
 * ### Example
 *
 * ```html
 * <prism-highlight id="c1" lang="markdown"></prism-highlight>
 * <script>
 *  document.querySelector('#c1').code = '# Test highlight';
 * &lt;/script>
 * ```
 *
 * The `lang` attribute is required and the component will not start parsing data without it.
 *
 * Changing the `lang` and `code` properties together, do it in less than 10 ms.
 * The element is set to commit changes after this persiod. Otherwise it may display
 * old and new code due to the asynchronius nature of the code highligter.
 *
 * ## Changes in version 4
 *
 * The component supports only few syntax highlighting by default. It won't
 * load other languages at runtime.The component consumer has to download definition
 * before highlighting the code.
 *
 * The component no longer uses Web Workers.
 *
 * ### Styling
 *
 * `<prism-highlight>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--prism-highlight` | Mixin applied to the element | `{}`
 * `--prism-highlight-code` | Mixin applied to the `<pre>` element | `{}`
 * `--error-color` | Color of the error message when script error ocurred in the worker | ``
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof UiElements
 */
class PrismHighlight extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }

      pre {
        user-select: text;
        margin: 8px;
      }

      .worker-error {
        color: var(--error-color);
      }

      .token a {
        color: inherit;
      }

      ${styles}
    `;
  }

  render() {
    return html`
      <pre class="parsed-content">
      <code id="output" class="language-" @click="${this._handleLinks}"></code>
    </pre>
    `;
  }

  static get properties() {
    return {
      /**
       * A data to be highlighted and dispayed.
       */
      code: { type: String },
      /**
       * Prism supported language.
       */
      lang: { type: String },
      /**
       * Adds languages outside of the core Prism languages.
       *
       * Prism includes a few languages in the core library:
       *   - JavaScript
       *   - Markup
       *   - CSS
       *   - C-Like
       * Use this property to extend the core set with other Prism
       * components and custom languages.
       *
       * Example:
       *   ```
       *   <!-- with languages = {'custom': myCustomPrismLang}; -->
       *   <!-- or languages = Prism.languages; -->
       *   <prism-highlighter languages="[[languages]]"></prism-highlighter>
       *   ```
       *
       * @attribute languages
       * @type {!Object}
       */
      languages: { type: Object }
    };
  }

  get code() {
    return this._code;
  }

  set code(value) {
    const old = this._code;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._code = value;
    this._highlight();
  }

  get lang() {
    return this._lang;
  }

  set lang(value) {
    const old = this._lang;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._lang = value;
    this._highlight();
  }

  get _output() {
    return this.shadowRoot.querySelector('code');
  }

  constructor() {
    super();
    this.languages = {};
  }

  firstUpdated() {
    /* istanbul ignore if */
    if (this.__results) {
      this._output.innerHTML += this.__results;
      this.__results = undefined;
    }
  }

  // Resets the state of the display to initial state.
  reset() {
    const node = this._output;
    if (node) {
      node.innerHTML = '';
    }
  }
  /**
   * Hightligt the code.
   */
  _highlight() {
    const { code, lang } = this;
    if (!code || !lang) {
      return;
    }
    this.reset();
    if (this._highlightDebounce) {
      return;
    }
    this._highlightDebounce = true;
    setTimeout(() => {
      this._highlightDebounce = false;
      this._tokenize(this.code, this.lang);
    });
  }

  _tokenize(code, lang) {
    const grammar = this._detectLang(code, lang);
    const env = {
      code: code,
      grammar,
      language: lang
    };
    Prism.hooks.run('before-highlight', env);
    const result = Prism.highlight(code, grammar, lang);
    const node = this._output;
    /* istanbul ignore else */
    if (node) {
      node.innerHTML += result;
    } else {
      if (!this.__results) {
        this.__results = '';
      }
      this.__results += result;
    }
  }
  /**
   * Handler for click events.
   * It dispatches `url-change-action` custom event when a link is clicked.
   *
   * @param {ClickEvent} e
   */
  _handleLinks(e) {
    const el = e.target;
    if (el.nodeName !== 'A') {
      return;
    }
    const newEntity = e.ctrlKey || e.metaKey;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const url = el.href;
    if (newEntity) {
      this._dispatchNewRequest(url);
    } else {
      this._dispatchChangeUrl(url);
    }
  }
  _dispatchChangeUrl(url) {
    this.dispatchEvent(
      new CustomEvent('url-change-action', {
        detail: {
          url
        },
        bubbles: true,
        cancelable: true,
        composed: true
      })
    );
  }

  _dispatchNewRequest(url) {
    this.dispatchEvent(
      new CustomEvent('request-workspace-append', {
        detail: {
          kind: 'ARC#Request',
          request: { url }
        },
        bubbles: true,
        cancelable: true,
        composed: true
      })
    );
  }
  /**
   * Picks a Prism formatter based on the `lang` hint and `code`.
   *
   * @param {string} code The source being highlighted.
   * @param {string=} lang A language hint (e.g. ````LANG`).
   * @return {!Prism.Lang}
   */
  _detectLang(code, lang) {
    if (!lang) {
      // Stupid simple detection if we have no lang, courtesy of:
      // https://github.com/robdodson/mark-down/blob/ac2eaa/mark-down.html#L93-101
      return code.match(/^\s*</) ? Prism.languages.markup : Prism.languages.javascript;
    }
    if (this.languages[lang]) {
      return this.languages[lang];
    } else if (Prism.languages[lang]) {
      return Prism.languages[lang];
    }
    switch (lang.substr(0, 2)) {
      case 'js':
      case 'es':
      case 'mj':
        return Prism.languages.javascript;
      case 'c':
        return Prism.languages.clike;
      default:
        // The assumption is that you're mostly documenting HTML when in HTML.
        return Prism.languages.markup;
    }
  }
  /**
   * An event fired when the user clicked on any link in the response
   * panels or the headers
   *
   * @event url-change-action
   * @param {String} url An url value
   * @param {Boolean} asNew When true it should be treated as "new tab" action.
   */
  /**
   * Fired when highlighting is applied to the code view.
   *
   * @event prism-highlight-parsed
   */
}
window.customElements.define('prism-highlight', PrismHighlight);
