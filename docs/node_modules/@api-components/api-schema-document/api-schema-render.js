import { LitElement, html, css, unsafeCSS } from 'lit-element';
import '@polymer/prism-element/prism-theme-default.js';

class ApiSchemaRender extends LitElement {
  /**
   * This is rather dirty hack to import Polymer's `prism-theme-default`.
   * The theme inserts `dom-module` with styles to the head section upon import.
   * This method reads the content of the theme and creates CSSResult instance
   * of it.
   * @return {CSSResult}
   */
  static getPrismTheme() {
    const theme = document.head.querySelector('dom-module#prism-theme-default');
    if (!theme) {
      return;
    }
    const tpl = theme.querySelector('template');
    if (!tpl) {
      return;
    }
    const clone = tpl.content.cloneNode(true);
    const style = clone.querySelector('style');
    return unsafeCSS(style.innerText);
  }

  static get styles() {
    const styles = css`:host {
      display: block;
      background-color: var(--code-background-color, #f5f2f0);
    }

    #output {
      white-space: pre-wrap;
      font-family: var(--arc-font-code-family, initial);
    }`;
    const prism = ApiSchemaRender.getPrismTheme();
    const result = [styles];
    if (prism) {
      result[result.length] = prism;
    }
    return result;
  }

  render() {
    return html`<code id="output" part="markdown-html" class="markdown-html"></code>`;
  }

  static get properties() {
    return {
      /**
       * Data to render.
       */
      code: { type: String },

      type: { type: String }
    };
  }

  get code() {
    return this._code;
  }

  set code(value) {
    const old = this._code;
    this._code = value;
    this.requestUpdate('code', old);
    this._codeChanged(value);
  }

  get type() {
    return this.__type;
  }

  get _type() {
    return this.__type;
  }

  set _type(value) {
    const old = this.__type;
    this.__type = value;
    this.requestUpdate('type', old);
    this._typeChanged(value);
  }

  get output() {
    return this.shadowRoot.querySelector('#output');
  }

  firstUpdated() {
    if (this.code) {
      this._codeChanged(this.code);
    }
    if (this.type) {
      this._typeChanged(this.type);
    }
  }
  /**
   * Handles highlighting when code changed.
   * Note that the operation is async.
   * @param {String} code
   */
  _codeChanged(code) {
    const output = this.output;
    if (!output) {
      return;
    }
    if (!code) {
      output.innerHTML = '';
      return;
    }
    let isJson;
    try {
      JSON.parse(code);
      isJson = true;
    } catch (_) {
      isJson = false;
    }
    this._type = isJson ? 'json' : 'xml';
    setTimeout(() => {
      this.output.innerHTML = this.highlight(code);
    });
  }
  /**
   * Dispatches `syntax-highlight` custom event
   * @param {String} code Code to highlight
   * @return {String} Highlighted code.
   */
  highlight(code) {
    const ev = new CustomEvent('syntax-highlight', {
      bubbles: true,
      composed: true,
      detail: {
        code,
        lang: this.type || 'xml'
      }
    });
    this.dispatchEvent(ev);
    return ev.detail.code;
  }

  _clearTypeAttribute() {
    const output = this.output;
    const type = output.dataset.type;
    if (!type) {
      return;
    }
    const attr = 'language-' + type;
    output.removeAttribute(attr);
  }

  _typeChanged(type) {
    const output = this.output;
    if (!output) {
      return;
    }
    this._clearTypeAttribute();
    if (!type) {
      return;
    }
    const attr = 'language-' + type;
    output.setAttribute(attr, 'true');
    output.dataset.type = type;
  }
}
window.customElements.define('api-schema-render', ApiSchemaRender);
