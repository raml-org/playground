/**
@license
Copyright 2019 The Advanced REST client authors <arc@mulesoft.com>
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
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin/arc-resizable-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import { PayloadParserMixin } from '@advanced-rest-client/payload-parser-mixin/payload-parser-mixin.js';
import '@polymer/paper-toast/paper-toast.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@advanced-rest-client/code-mirror/code-mirror.js';
import '@advanced-rest-client/code-mirror-linter/code-mirror-linter.js';
import linterStyles from '@advanced-rest-client/code-mirror-linter/lint-style.js';
/**
 * A raw payload input editor based on CodeMirror.
 *
 * The element additionally shows Encode / Decode buttons if current content type value contains
 * "x-www-form-urlencoded".
 *
 * The element listens for `content-type-changed` custom event and updates the `contentType` property
 * automatically. This event is commonly used in ARC elements.
 *
 * ### Example
 * ```
 * <raw-payload-editor content-type="application/json"></raw-payload-editor>
 * ```
 *
 * @customElement
 * @demo demo/index.html
 * @memberof UiElements
 * @polymerBehavior Polymer.IronResizableBehavior
 * @appliesMixin EventsTargetMixin
 * @appliesMixin PayloadParserMixin
 */
class RawPayloadEditor extends ArcResizableMixin(PayloadParserMixin(EventsTargetMixin(LitElement))) {
  static get styles() {
    return [
      linterStyles,
      css`:host {
        display: block;
      }

      .action-buttons > * {
        margin: 8px 0;
      }

      *[hidden] {
        display: none !important;
      }`
    ];
  }

  render() {
    const { _encodeEnabled, _isJson, lineNumbers } = this;
    return html`
    <div class="action-buttons">
      ${_encodeEnabled ? html`
        <anypoint-button
          data-action="encode"
          @click="${this.encodeValue}"
          emphasis="medium"
          title="Encodes payload to x-www-form-urlencoded data">Encode payload</anypoint-button>
        <anypoint-button
          data-action="decode"
          @click="${this.decodeValue}"
          emphasis="medium"
          title="Decodes payload to human readable form">Decode payload</anypoint-button>
      ` : undefined}
      ${_isJson ? html`
        <anypoint-button
          data-action="format-json"
          emphasis="medium"
          @click="${this.formatValue}"
          title="Formats JSON input.">Format JSON</anypoint-button>
        <anypoint-button
          data-action="minify-json"
          @click="${this.minifyValue}"
          emphasis="medium"
          title="Removed whitespaces from the input">Minify JSON</anypoint-button>
      ` : undefined}
      <slot name="content-action"></slot>
    </div>
    <code-mirror
      mode="application/json"
      @value-changed="${this._editorValueChanged}"
      gutters='["CodeMirror-lint-markers"]'
      .lineNumbers="${lineNumbers}"></code-mirror>
    <paper-toast id="invalidJsonToast">JSON value is invalid. Cannot parse value.</paper-toast>`;
  }

  static get properties() {
    return {
      /**
       * Raw payload value
       */
      value: { type: String },
      /**
       * Renders line number when set.
       * @type {Object}
       */
      lineNumbers: { type: Boolean },
      /**
       * Content-Type header value. Determines current code mirror mode.
       */
      contentType: { type: String },
      // Computed value, true if `contentType` contains `x-www-form-urlencoded`
      _encodeEnabled: { type: Boolean },
      // Computed value, true if `contentType` contains `/json`
      _isJson: { type: Boolean }
    };
  }

  get _editor() {
    return this.shadowRoot.querySelector('code-mirror');
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    if (old === value) {
      return;
    }
    this._value = value;
    this._valueChanged(value);
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: {
        value
      }
    }));
  }

  get contentType() {
    return this._contentType;
  }

  set contentType(value) {
    const old = this._contentType;
    if (old === value) {
      return;
    }
    this._contentType = value;
    this._onContentTypeChanged(value);
    this._encodeEnabled = this.__computeIs(value, 'x-www-form-urlencoded');
    this._isJson = this._computeIsJson(value);
  }

  get onvalue() {
    return this._onValue;
  }

  set onvalue(value) {
    if (this._onValue) {
      this.removeEventListener('value-changed', this._onValue);
    }
    if (typeof value !== 'function') {
      this._onValue = null;
      return;
    }
    this._onValue = value;
    this.addEventListener('value-changed', this._onValue);
  }

  constructor() {
    super();
    this._contentTypeHandler = this._contentTypeHandler.bind(this);
    this._resizeHandler = this._resizeHandler.bind(this);
  }

  _attachListeners(node) {
    node.addEventListener('content-type-changed', this._contentTypeHandler);
    this.addEventListener('iron-resize', this._resizeHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('content-type-changed', this._contentTypeHandler);
    this.removeEventListener('iron-resize', this._resizeHandler);
  }

  firstUpdated() {
    this.refresh();
    if (this.contentType) {
      this._onContentTypeChanged(this.contentType);
    }
    if (this.value) {
      this._valueChanged(this.value);
    }
  }

  /**
   * Forces render code-mirror content.
   * Should be used to when the element becomes visible after being hidden.
   */
  refresh() {
    this._editor.refresh();
  }

  /**
   * Changes CodeMirror mode when the content type value is updated.
   *
   * @param {String} ct
   */
  _onContentTypeChanged(ct) {
    const editor = this._editor;
    if (!editor) {
      return;
    }
    this._setupLinter(ct);
    if (!ct) {
      return;
    }
    if (ct.indexOf && ct.indexOf(';') !== -1) {
      ct = ct.substr(0, ct.indexOf(';'));
    }
    this._editor.mode = ct;
  }

  _computeIsJson(ct) {
    return this.__computeIs(ct, '/json');
  }

  __computeIs(ct, needle) {
    if (!ct) {
      return false;
    }
    if (ct.indexOf && ct.indexOf(needle) !== -1) {
      return true;
    }
    return false;
  }

  /**
   * Handler for the `content-type-changed` event. Sets the `contentType` property.
   *
   * @param {CustomEvent} e
   */
  _contentTypeHandler(e) {
    this.contentType = e.detail.value;
  }
  /**
   * Handler for value change.
   * If the element is opened then it will fire change event.
   *
   * @param {String} value
   */
  _valueChanged(value) {
    const editor = this._editor;
    if (this.__editorValueChange || !editor) {
      return;
    }
    editor.value = value;
  }
  /**
   * Called when the editor fires change event
   *
   * @param {CustomEvent} e
   */
  _editorValueChanged(e) {
    e.stopPropagation();
    this.__editorValueChange = true;
    this.value = e.detail.value;
    this.__editorValueChange = false;
  }

  _setupLinter(ct) {
    /* global CodeMirror */
    const editor = this._editor;
    if (this._computeIsJson(ct) && CodeMirror.lint) {
      editor.lint = CodeMirror.lint.json;
      editor.gutters = ['code-mirror-lint', 'CodeMirror-lint-markers'];
    } else {
      editor.lint = false;
      editor.gutters = ['CodeMirror-lint-markers'];
    }
    editor.refresh();
  }
  /**
   * Formats current value as it is a JSON object.
   */
  formatValue() {
    try {
      let value = this.value;
      value = JSON.parse(value);
      value = JSON.stringify(value, null, 2);
      this.value = value;
      this.refresh();
    } catch (e) {
      this.shadowRoot.querySelector('#invalidJsonToast').opened = true;
    }
  }
  /**
   * Minifies JSON value by removing whitespaces.
   */
  minifyValue() {
    try {
      let value = this.value;
      value = JSON.parse(value);
      value = JSON.stringify(value);
      this.value = value;
      this.refresh();
    } catch (e) {
      this.shadowRoot.querySelector('#invalidJsonToast').opened = true;
    }
  }

  _resizeHandler() {
    this.refresh();
  }

  /**
   * URL encodes payload value and resets the same value property.
   * This should be used only for payloads with x-www-form-urlencoded content-type.
   */
  encodeValue() {
    const value = this.encodeUrlEncoded(this.value);
    this.__internalChange = true;
    this.value = value;
    this.__internalChange = false;
  }
  /**
   * URL decodes payload value and resets the same value property.
   * This should be used only for payloads with x-www-form-urlencoded content-type.
   */
  decodeValue() {
    const value = this.decodeUrlEncoded(this.value);
    this.__internalChange = true;
    this.value = value;
    this.__internalChange = false;
  }
}
window.customElements.define('raw-payload-editor', RawPayloadEditor);
