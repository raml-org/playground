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
import '@polymer/paper-spinner/paper-spinner.js';
import './js-max-number-error.js';
import { JsonParser } from './json-parser.js';
/**
 * `<json-viewer>` A JSON payload viewer for the JSON response.
 *
 * This element uses a web worker to process the JSON data.
 * To simplify our lives and app build process the worker script is embeded in the
 * imported template body. It will extract worker data from it and create the
 * worker. Otherwise build process would need to incude a worker script file
 * into set path which is not very programmer friendly.
 *
 * ### Example
 *
 * ```html
 * <json-viewer json='{"json": "test"}'></json-viewer>
 * ```
 *
 * ## Custom search
 *
 * If the platform doesn't support native text search, this element implements
 * `ArcBehaviors.TextSearchBehavior` and exposes the `query` attribute.
 * Set any text to the `query` attribute and it will automatically highlight
 * occurance of the text.
 * See demo for example.
 *
 * ## Big numbers in JavaScript
 *
 * This element marks all numbers that are above `Number.MAX_SAFE_INTEGER` value
 * and locates the numeric value in source json if passed json was a string or
 * when `raw` attribute was set. In this case it will display a warning and
 * explanation about use of big numbers in JavaScript.
 * See js-max-number-error element documentation for more information.
 *
 * ## Content actions
 *
 * The element can render a actions pane above the code view. Action pane is to
 * display content actions that is relevan in context of the response displayed
 * below the icon buttons. It should be icon buttons or just buttons added to this
 * view.
 *
 * ```html
 * <json-viewer json='{"json": "test"}'>
 *  <paper-icon-button slot="content-action"
 *    title="Copy content to clipboard" icon="arc:content-copy"></paper-icon-button>
 * </json-viewer>
 * ```
 *
 * ### Styling
 *
 * `<json-viewer>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--json-viewer` | Mixin applied to the element | `{}`
 * `--code-type-null-value-color` | Color of the null value. | `#708`
 * `--code-type-boolean-value-color` | Color of the boolean value | `#708`
 * `--code-punctuation-value-color` | Punctuation color. | `black`
 * `--code-type-number-value-color` | Color of the numeric value | `blue`
 * `--code-type-text-value-color` | Color of the string value. | `#295469`
 * `--code-array-index-color` | Color of the array counter. | `rgb(119, 119, 119)`
 * `--code-type-link-color` | Color of link inserted into the viewer. | `#1976d2`
 * `--json-viewer-node` | Mixin applied to a "node" | `{}`
 * `--code-dimmed-punctuation-opacity` | Value of the opacity on the "dimmed" punctuation | `0.34`
 * `--code-background-color` | Background color of the code area | ``
 *
 * @group UiElements
 * @element json-viewer
 * @demo demo/index.html
 */
class JsonViewer extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
      font-family: var(--arc-font-code-family, monospace);
      font-size: var(--arc-font-code-font-size, 1rem);
      color: inherit;
      cursor: text;
      user-select: text;
    }

    .prettyPrint {
      padding: 8px;
    }

    .stringValue {
      white-space: normal;
      color: var(--code-type-text-value-color, #295469);
    }

    .brace {
      display: inline-block;
    }

    .numeric {
      color: var(--code-type-number-value-color, blue);
    }

    .nullValue {
      color: var(--code-type-null-value-color, #708);
    }

    .booleanValue {
      color: var(--code-type-boolean-value-color, #708);
    }

    .punctuation {
      color: var(--code-punctuation-value-color, black);
    }

    .node {
      position: relative;
      margin-bottom: 4px;
      word-break: break-all;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }

    .array-counter {
      color: gray;
      font-size: 11px;
    }

    .array-counter::before {
      content: "Array[" attr(count) "]";
      user-select: none;
      pointer-events: none;
    }

    *[data-expanded="false"] > .array-counter::before {
      content: "Array[" attr(count) "] ...";
      user-select: none;
      pointer-events: none;
    }

    .array-key-number::before {
      content: "" attr(index) ":";
      user-select: none;
      pointer-events: none;
    }

    .key-name {
      color: var(--code-type-text-value-color, #295469);
    }

    .rootElementToggleButton {
      position: absolute;
      top: 0;
      left: -9px;
      font-size: 14px;
      cursor: pointer;
      font-weight: bold;
      user-select: none;
    }

    .rootElementToggleButton::after {
      content: "-";
    }

    .array-key-number {
      color: var(--code-array-index-color, rgb(119, 119, 119));
    }

    .info-row {
      display: none;
      margin: 0 8px;
      text-indent: 0;
    }

    div[data-expanded="false"] div[collapse-indicator] {
      display: inline-block !important;
    }

    div[data-expanded="false"] div[data-element] {
      display: none !important;
    }

    .arc-search-mark.selected {
      background-color: #ff9632;
    }

    div[data-expanded="false"] .punctuation.dimmed {
      opacity: 0;
    }

    .dimmed {
      opacity: var(--code-dimmed-punctuation-opacity, 0.54);
    }

    a[response-anchor] {
      color: var(--code-type-link-color, #1976d2);
    }

    paper-spinner:not([active]) {
      display: none;
    }

    .actions-panel {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .actions-panel.hidden {
      display: none;
    }

    [hidden] {
      display: none !important;
    }

    output {
      display: block;
      background-color: var(--code-background-color);
    }`;
  }

  render() {
    const { working, isError, json } = this;
    const showOutput = this._computeShowOutput(working, isError, json);
    return html`<paper-spinner .active="${working}"></paper-spinner>
    ${isError ? html`<div class="error">
      <p>There was an error parsing JSON data</p>
    </div>` : undefined}

    <div class="${this._computeActionsPanelClass(showOutput)}">
      <slot name="content-action"></slot>
    </div>
    <output ?hidden="${!showOutput}" @click="${this._handleDisplayClick}"></output>`;
  }

  static get properties() {
    return {
      /**
       * JSON data to parse and display.
       * It can be either JS object (already parsed string) or string value.
       * If the passed object is a string then JSON.parse function will be
       * used to parse string.
       */
      json: { type: String },
      /**
       * If it's possible, set this property to the JSON string.
       * It will help to handle big numbers that are not parsed correctly by
       * the JSON.parse function. The parser will try to locate the number
       * in the source string and display it in the correct form.
       *
       * P.S.
       * Calling JSON.stringify on a JS won't help here :) Must be source
       * string.
       */
      raw: { type: String },
      /**
       * True if error ocurred when parsing the `json` data.
       * An error message will be displayed.
       */
      _isError: { type: Boolean },
      /**
       * True when JSON is beeing parsed.
       */
      _working: { type: Boolean }
    };
  }

  get isError() {
    return this._isError;
  }

  get _isError() {
    return this.__isError;
  }

  set _isError(value) {
    const old = this.__isError;
    if (old === value) {
      return;
    }
    this.__isError = value;
    this.requestUpdate('_isError', old);
    this.dispatchEvent(new CustomEvent('iserror-changed', {
      detail: {
        value
      }
    }));
  }

  get working() {
    return this._working;
  }

  get _working() {
    return this.__working;
  }

  set _working(value) {
    const old = this.__working;
    if (old === value) {
      return;
    }
    this.__working = value;
    this.requestUpdate('_working', old);
    this.dispatchEvent(new CustomEvent('working-changed', {
      detail: {
        value
      }
    }));
  }

  get json() {
    return this._json;
  }

  set json(value) {
    const old = this._json;
    if (old === value) {
      return;
    }
    this._json = value;
    this._changed(value);
  }

  constructor() {
    super();
    this._isError = false;
    this._working = false;
  }

  firstUpdated() {
    this._isReady = true;
    if (this.json) {
      this._changed(this.json);
    }
  }

  _clearOutput() {
    const node = this.shadowRoot.querySelector('output');
    node.innerHTML = '';
  }

  _writeOutput(text) {
    const node = this.shadowRoot.querySelector('output');
    node.innerHTML = text;
  }

  // Called when `json` property changed. It starts parsing the data.
  _changed(json) {
    if (!this._isReady) {
      return;
    }
    this._isError = false;
    this._clearOutput();
    if (json === undefined) {
      return;
    }
    this._working = true;
    if (json === null) {
      this._printPrimitiveValue('null', 'nullValue');
      return;
    }
    if (json === false || json === true) {
      this._printPrimitiveValue(String(json), 'booleanValue');
      return;
    }
    try {
      const parser = new JsonParser({
        json,
        raw: this.raw,
        cssPrefix: this.nodeName.toLowerCase() + ' style-scope '
      });
      if (parser.latestError !== null) {
        throw new Error(parser.latestError);
      }
      const html = parser.getHTML();
      this._reportResult(html);
    } catch (cause) {
      this._reportError(cause);
    }
  }

  _printPrimitiveValue(value, klas) {
    const html = `<div class="prettyPrint"><span class="${klas}">${value}</span></div>`;
    this._writeOutput(html);
    this._working = false;
    this.dispatchEvent(new CustomEvent('json-viewer-parsed'));
  }

  _reportResult(html) {
    this._writeOutput(html);
    this._isError = false;
    this._working = false;
    this.dispatchEvent(new CustomEvent('json-viewer-parsed'));
  }

  // Called when workr error received.
  _reportError() {
    this._isError = true;
    this._working = false;
    this.dispatchEvent(new CustomEvent('json-viewer-parsed'));
  }
  // Compute if output should be shown.
  _computeShowOutput(working, isError, json) {
    if (working) {
      return false;
    }
    if (isError) {
      return true;
    }
    return typeof json !== 'undefined';
  }
  // Called when the user click on the display area. It will handle view toggle and links clicks.
  _handleDisplayClick(e) {
    if (!e.target) {
      return;
    }

    if (e.target.nodeName === 'A') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const newEntity = e.ctrlKey || e.metaKey;
      const url = e.target.getAttribute('href');
      if (newEntity) {
        this._dispatchNewRequest(url);
      } else {
        this._dispatchChangeUrl(url);
      }
      return;
    }
    const toggleId = e.target.dataset.toggle;
    if (!toggleId) {
      return;
    }
    const parent = this.shadowRoot.querySelector('div[data-element="' + toggleId + '"]');
    if (!parent) {
      return;
    }
    const expanded = parent.dataset.expanded;
    if (!expanded || expanded === 'true') {
      parent.dataset.expanded = 'false';
    } else {
      parent.dataset.expanded = 'true';
    }
  }

  _dispatchChangeUrl(url) {
    this.dispatchEvent(new CustomEvent('url-change-action', {
      detail: {
        url
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }));
  }

  _dispatchNewRequest(url) {
    this.dispatchEvent(new CustomEvent('request-workspace-append', {
      detail: {
        kind: 'ARC#Request',
        request: { url }
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }));
  }
  /**
   * Computes CSS class for the actions pane.
   *
   * @param {Boolean} showOutput The `showOutput` propety value of the element.
   * @return {String} CSS class names for the panel depending on state of the
   * `showOutput`property.
   */
  _computeActionsPanelClass(showOutput) {
    let clazz = 'actions-panel';
    if (!showOutput) {
      clazz += ' hidden';
    }
    return clazz;
  }
  /**
   * Event called when the user click on the anchor in display area.
   *
   * @event url-change-action
   * @param {String} url The URL handled by this event.
   * @param {Boolean} asNew When true it should be treated as "new tab" action.
   */
  /**
   * Fired when web worker finished work and the data are displayed.
   *
   * @event json-viewer-parsed
   */
}
window.customElements.define('json-viewer', JsonViewer);
