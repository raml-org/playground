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
import '@advanced-rest-client/response-raw-viewer/response-raw-viewer.js';
import '@advanced-rest-client/json-viewer/json-viewer.js';
import '@advanced-rest-client/response-highlighter/response-highlighter.js';
import '@advanced-rest-client/clipboard-copy/clipboard-copy.js';
import '@advanced-rest-client/json-table/json-table.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';

export let hasLocalStorage;
/* global chrome */
/* istanbul ignore next */
if (typeof chrome !== 'undefined' && chrome.i18n) {
  // Chrome apps have `chrome.i18n` property, regular website doesn't.
  // This is to avoid annoying warning message in Chrome apps.
  hasLocalStorage = false;
} else {
  try {
    localStorage.getItem('test');
    hasLocalStorage = true;
    /* istanbul ignore next */
  } catch (_) {
    /* istanbul ignore next */
    hasLocalStorage = false;
  }
}

/**
 * An element to display a HTTP response body.
 *
 * The element will try to select best view for given `contentType`. It will
 * choose the JSON viewer for JSON response and XML viewer for XML responses.
 * Otherise it will display a syntax hagligter.
 *
 * Note that the `contentType` property **must** be set in order to display any
 * view.
 *
 * ### Save content to file
 *
 * The element uses the web way of file saving. However, it sends the
 * `export-data` custom event first to check if hosting application implements
 * other save functionality. See event description for more information.
 *
 *
 * @customElement
 * @memberof UiElements
 */
export class ResponseBodyView extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
      position: relative;
      color: var(--response-body-view-color, inherit);
      background-color: var(--response-body-view-background-color, inherit);
    }

    .close-preview {
      position: absolute;
      top: 8px;
      right: 12px;
      background-color: var(--response-body-view-preview-close-background-color, #fff);
      color: var(--response-body-view-preview-close-color, rgba(0,0,0,0.74));
    }

    [hidden] {
      display: none !important;
    }

    .content-actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-bottom: 8px;
    }

    .download-link {
      text-decoration: none;
      color: inherit;
      outline: none;
    }

    .save-dialog {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 12px 0;
    }

    .save-dialog h2 {
      font-size: 1.5rem;
      font-weight: 400;
      letter-spacing: 0.01rem;
    }

    .img-preview {
      max-width: 100%;
    }

    .content-info {
      text-align: center;
      margin: 24px 0;
    }`;
  }

  _activeTemplate(activeView, content) {
    switch (activeView) {
      case 0: return html`<response-raw-viewer
        .responseText="${content}"
        .wrapText="${this.rawTextWrap}"></response-raw-viewer>`;
      case 1: return html`<response-highlighter
        .responseText="${content}"
        .contentType="${this.contentType}"></response-highlighter>`;
      case 2: return html`<json-viewer .json="${content}"></json-viewer>`;
      case 3: return html`<json-table .json="${content}" ?compatibility="${this.compatibility}"></json-table>`;
      case 4: return this._imageTemplate();
      case 5: return this._pdfTemplate();
      default:
    }
  }

  _downloadTemplate() {
    const {
      compatibility,
      _downloadFileUrl,
      _downloadFileName
    } = this;
    return html`<div class="save-dialog">
      <h2>Saving to file</h2>
      <div>
        <p>Your file is now ready to download.</p>
      </div>
      <div>
        <anypoint-button
          emphasis="low"
          @click="${this._downloadDialogClose}"
          ?compatibility="${compatibility}"
        >Cancel</anypoint-button>
        <a
          href="${_downloadFileUrl}"
          download="${_downloadFileName}"
          @click="${this._downloadHandler}"
          target="_blank"
          class="download-link">
          <anypoint-button
            emphasis="high"
            ?compatibility="${compatibility}"
          >Download file</anypoint-button>
        </a>
      </div>
    </div>`;
  }

  _imageTemplate() {
    return html`<img class="img-preview" src="${this._imageDataUrl}" alt="">`;
  }

  _pdfTemplate() {
    return html`<p class="content-info">
      The response conatin <b>PDF</b> data.<br/>
      Save the file to preview its contents.
    </p>`;
  }

  render() {
    const {
      contentType,
      rawView,
      activeView,
      jsonTableView,
      rawTextWrap,
      compatibility,
      _downloadFileUrl,
      _raw,
      _isJson
    } = this;
    const content = _raw && this._getRawContent(_raw);
    return html `
    ${contentType && content ? html`<div class="content-actions">
      <anypoint-button
        part="content-action-button, code-content-action-button"
        class="action-button"
        data-action="copy"
        emphasis="medium"
        ?compatibility="${compatibility}"
        @click="${this._copyToClipboard}"
        aria-label="Press to copy response to clipboard"
        title="Copy response to clipboard">Copy</anypoint-button>
      <anypoint-button
        part="content-action-button, code-content-action-button"
        class="action-button"
        data-action="save-file"
        emphasis="medium"
        ?compatibility="${compatibility}"
        @click="${this._saveFile}"
        aria-label="Press to save content to file"
        title="Save content to file">Save</anypoint-button>
      <anypoint-button
        part="content-action-button, code-content-action-button"
        class="action-button"
        data-action="raw-toggle"
        emphasis="medium"
        ?compatibility="${compatibility}"
        toggles
        .active="${rawView}"
        @active-changed="${this._sourceViewHandler}"
        aria-label="Press to toggle source view"
        title="Toogle source view">Source view</anypoint-button>

      ${_isJson ? html`<anypoint-button
        part="content-action-button, code-content-action-button"
        class="action-button"
        data-action="json-table"
        ?compatibility="${compatibility}"
        toggles
        .active="${jsonTableView}"
        @active-changed="${this._jsonTableViewHandler}"
        aria-label="Press to activate table view for JSON data"
        title="Toggle structured table view">Data table</anypoint-button>` : undefined}

      ${activeView === 0 ? html`<anypoint-button
        part="content-action-button, code-content-action-button"
        class="action-button"
        data-action="text-wrap"
        ?compatibility="${compatibility}"
        toggles
        .active="${rawTextWrap}"
        @active-changed="${this._rawTextWrapViewHandler}"
        aria-label="Press to toggle text wrapping in the view"
        title="Toggle text wrapping">Wrap text</anypoint-button>` : undefined}
    </div>` : undefined}

    ${_downloadFileUrl ? this._downloadTemplate() : this._activeTemplate(activeView, content)}

    <clipboard-copy .content="${content}"></clipboard-copy>`;
  }

  static get properties() {
    return {
      /**
       * Raw response as a response text.
       * @type {String|ArrayBuffer|Buffer|Object}
       */
      responseText: { },
      /**
       * A variable to be set after the `responseText` change
       */
      _raw: { type: String },
      /**
       * The response content type.
       */
      contentType: { type: String },
      /**
       * Current value of charset encoding, if available.
       * It should be set to correctly decode buffer to string
       */
      charset: { type: String },
      /**
       * Computed value, true if the parsed view can be displayed.
       * If false then the syntax highligter will be removed from the DOM
       * so it will not try to do the parsing job if it is not necessary.
       */
      _isParsed: { type: Boolean },
      /**
       * Computed value, true if the JSON view can be displayed.
       * If false then the syntax highligter will be removed from the DOM
       * so it will not try to do the parsing job if it is not necessary.
       */
      _isJson: { type: Boolean },
      /**
       * Selected view.
       */
      activeView: { type: Number },
      /**
       * When saving a file this will be the download URL created by the
       * `URL.createObjectURL` function.
       */
      _downloadFileUrl: { type: String },
      /**
       * Autogenerated file name for the download file.
       */
      _downloadFileName: { type: String },
      /**
       * When true then the text in "raw" preview will be wrapped.
       */
      rawTextWrap: { type: Boolean },
      /**
       * When set it opens the "raw" view.
       */
      rawView: { type: Boolean },
      /**
       * If set it opens the JSON table view.
       */
      jsonTableView: { type: Boolean },
      /**
       * Enables Anypoint compatibility
       */
      compatibility: { type: Boolean },
      _imageDataUrl: { type: String }
    };
  }

  get responseText() {
    return this._responseText;
  }

  set responseText(value) {
    const old = this._responseText;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._responseText = value;
    if (this._downloadFileUrl) {
      this._downloadDialogClose();
    }
    this._responseTextChanged(value);
  }

  get rawView() {
    return this._rawView;
  }

  set rawView(value) {
    const old = this._rawView;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._rawView = value;
    this.requestUpdate('rawView', old);
    this._toggleViewSource(value);
  }

  get jsonTableView() {
    return this._jsonTableView;
  }

  set jsonTableView(value) {
    const old = this._jsonTableView;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._jsonTableView = value;
    this.requestUpdate('jsonTableView', old);
    this._jsonTableViewChanged(value);
  }

  get contentType() {
    return this._contentType;
  }

  set contentType(value) {
    const old = this._contentType;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._contentType = value;
    this.requestUpdate('contentType', old);
    this._contentTypeChanged(value, this._raw);
  }

  get _raw() {
    return this.__raw;
  }

  set _raw(value) {
    const old = this.__raw;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__raw = value;
    this.requestUpdate('_raw', old);
    this._contentTypeChanged(this.contentType, value);
  }
  /**
   * @constructor
   */
  constructor() {
    super();
    this._onStorageChanged = this._onStorageChanged.bind(this);
    this._onJsonTableStateChanged = this._onJsonTableStateChanged.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    window.addEventListener('storage', this._onStorageChanged);
    window.addEventListener('json-table-state-changed', this._onJsonTableStateChanged);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    if (this._downloadFileUrl) {
      this._downloadDialogClose();
    }
    window.removeEventListener('storage', this._onStorageChanged);
    window.removeEventListener('json-table-state-changed', this._onJsonTableStateChanged);
  }

  /**
   * Set's `_raw` property that it propagated to current viewer.
   * The operation is async for performance reasons.
   *
   * @param {String} payload
   */
  _responseTextChanged(payload) {
    if (this.__setRawDebouncer) {
      return;
    }
    this._isJson = false;
    this._isParsed = false;
    this._raw = undefined;
    if (payload === undefined) {
      return;
    }
    this.__setRawDebouncer = true;
    setTimeout(() => {
      this.__setRawDebouncer = false;
      this._raw = this.responseText;
    }, 1);
  }
  /**
   * Updates `activeView` property based on `contentType` value.
   *
   * @param {?String} contentType Current content type of the response
   */
  _contentTypeChanged(contentType) {
    let parsed = false;
    let json = false;
    let imageDataUrl = undefined;
    let isImage = false;
    let isPdf = false;
    if (contentType) {
      if (contentType.indexOf('json') !== -1) {
        this.activeView = 2;
        json = true;
      } else if (contentType.indexOf('image/') === 0) {
        imageDataUrl = this._prepareImageDataUrl(contentType, this._raw);
        if (imageDataUrl) {
          this.activeView = 4;
          isImage = true;
        } else {
          this.activeView = 1;
          parsed = true;
        }
      } else if (contentType === 'application/pdf') {
        isPdf = true;
        this.activeView = 5;
      } else {
        this.activeView = 1;
        parsed = true;
      }
    }
    this._isJson = json;
    this._isParsed = parsed;
    this._imageDataUrl = imageDataUrl;
    this._isImage = isImage;
    this._isPdf = isPdf;
    if (json) {
      this._ensureJsonTable();
    }
  }
  /**
   * Converts current `_raw` data to an image data URL string.
   * @param {String} contentType Response content type
   * @param {Buffer|ArrayBuffer} raw
   * @return {String|undefined} Procerssed image data or undefined when error.
   */
  _prepareImageDataUrl(contentType, raw) {
    if (raw && raw.type === 'Buffer') {
      raw = raw.data;
    }
    try {
      const arr = new Uint8Array(raw);
      const str = arr.reduce((data, byte) => data + String.fromCharCode(byte), '');
      const enc = btoa(str);
      return `data:${contentType};base64, ${enc}`;
    } catch (_) {
      // ..
    }
  }

  /**
   * When response's content type is JSON the view renders the
   * JSON table element. This function reads current state for the table
   * (if it is turned on) and handles view change if needed.
   */
  _ensureJsonTable() {
    /* istanbul ignore if */
    if (!hasLocalStorage) {
      return;
    }
    const isTable = this._localStorageValueToBoolean(localStorage.jsonTableEnabled);
    if (this.jsonTableView !== isTable) {
      this.jsonTableView = isTable;
    }
    if (this.jsonTableView) {
      this.activeView = 3;
    } else if (this.activeView === 3) {
      this.activeView = 1;
    }
  }
  /**
   * The component may work in Electron app where Buffer can be returned from
   * the transport library. This ensures that string is always returned.
   * @return {String} String value of `_raw` property
   */
  _getRawContent() {
    let raw = this._raw;
    const type = typeof raw;
    if (['string', 'boolean', 'undefined'].indexOf(type) !== -1) {
      return raw;
    }
    if (raw && raw.type === 'Buffer') {
      raw = new Uint8Array(raw.data);
    }
    const ce = this.charset || 'utf-8';
    const decoder = new TextDecoder(ce);
    try {
      return decoder.decode(raw);
    } catch (e) {
      return '';
    }
  }
  /**
   * Coppies current response text value to clipboard.
   * @param {Event} e
   */
  _copyToClipboard(e) {
    const button = e.target;
    const copy = this.shadowRoot.querySelector('clipboard-copy');
    if (copy.copy()) {
      button.innerText = 'Done';
    } else {
      button.innerText = 'Error';
    }
    button.disabled = true;
    if ('part' in button) {
      button.part.add('content-action-button-disabled');
      button.part.add('code-content-action-button-disabled');
    }
    setTimeout(() => this._resetCopyButtonState(button), 1000);
    const ev = new CustomEvent('send-analytics', {
      detail: {
        type: 'event',
        category: 'Usage',
        action: 'Click',
        label: 'Headers editor clipboard copy',
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(ev);
  }

  _resetCopyButtonState(button) {
    button.innerText = 'Copy';
    button.disabled = false;
    if ('part' in button) {
      button.part.remove('content-action-button-disabled');
      button.part.remove('code-content-action-button-disabled');
    }
  }
  /**
   * Fires the `export-data` custom event. If the event is not canceled
   * then it will use default web implementation for file saving.
   */
  _saveFile() {
    const ext = this._fileExtension();
    const now = new Date().toISOString();
    const file = `response-${now}.${ext}`;
    const data = this._exportContent();
    const e = new CustomEvent('export-data', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        destination: 'file',
        data,
        file,
        providerOptions: {
          contentType: this.contentType
        }
      }
    });
    this.dispatchEvent(e);
    if (e.defaultPrevented) {
      return;
    }
    this.saveToFile(data, file);
  }
  /**
   * Creates a file object form current response text and opens a dialog
   * with the link to a file.
   *
   * @param {String|ArrayBuffer} data
   * @param {String} fileName
   */
  saveToFile(data, fileName) {
    const ct = this.contentType || 'text/plain';
    if (typeof data !== 'string') {
      data = new Uint8Array(data);
    }
    const file = new Blob([data], {
      type: ct
    });
    this._downloadFileUrl = URL.createObjectURL(file);
    this._downloadFileName = fileName;
  }
  /**
   * Creates file extension name based on current content type.
   * @return {String} A file extension. `txt` as default
   */
  _fileExtension() {
    if (this._isJson) {
      return 'json';
    }
    const { contentType } = this;
    if (!contentType) {
      return 'txt';
    }
    let mime = contentType.split('/')[1];
    if (!mime) {
      return 'txt';
    }
    const charsetIndex = mime.indexOf(';');
    if (charsetIndex !== -1) {
      mime = mime.substr(0, charsetIndex);
    }
    const plusIndex = mime.indexOf('+');
    if (plusIndex !== -1) {
      mime = mime.substr(0, plusIndex);
    }
    return mime;
  }
  /**
   * @return {String|ArrayBuffer|Buffer} content pre-processed for export.
   */
  _exportContent() {
    if (this._isImage || this._isPdf) {
      let raw = this._raw;
      if (raw && raw.type === 'Buffer') {
        raw = raw.data;
      }
      return raw;
    }
    return this._getRawContent();
  }
  /**
   * Handler for download link click to prevent default and close the dialog.
   */
  _downloadHandler() {
    setTimeout(() => this._downloadDialogClose(), 250);
  }
  /**
   * Handler for file download dialog close.
   */
  _downloadDialogClose() {
    URL.revokeObjectURL(this.downloadFileUrl);
    this._downloadFileUrl = undefined;
    this._downloadFileName = undefined;
  }
  /**
   * Toggles "view source" or raw message view.
   *
   * @param {Boolean} opened
   */
  _toggleViewSource(opened) {
    if (!opened) {
      if (!this.__parsedView) {
        return;
      }
      this.activeView = this.__parsedView;
      this.__parsedView = undefined;
      if (this.activeView === 2 && this.jsonTableView) {
        this.jsonTableView = false;
      }
    } else {
      if (this.jsonTableView) {
        this._skipJsonTableEvent = true;
        this.jsonTableView = false;
        this._skipJsonTableEvent = false;
      }
      this.__parsedView = this.activeView;
      this.activeView = 0;
    }
  }
  // Handler for the `jsonTableView` property change.
  _jsonTableViewChanged(state) {
    if (state) {
      if (this.rawView) {
        this.__parsedView = undefined;
        this.rawView = false;
      }
      this.activeView = 3;
    } else {
      this.activeView = 1;
    }
    if (this._skipJsonTableEvent) {
      return;
    }
    /* istanbul ignore if */
    if (hasLocalStorage) {
      if (localStorage.jsonTableEnabled !== String(state)) {
        window.localStorage.setItem('jsonTableEnabled', state);
      }
    }
    this.dispatchEvent(new CustomEvent('json-table-state-changed', {
      detail: {
        enabled: state
      },
      bubbles: true,
      composed: true
    }));
  }
  /**
   * Updates the value of the `jsonTableView` property when the
   * corresponding localStorage property change.
   *
   * @param {StorageEvent} e
   */
  _onStorageChanged(e) {
    if (e.key !== 'jsonTableEnabled') {
      return;
    }
    if (!e.newValue) {
      return;
    }
    const v = this._localStorageValueToBoolean(e.newValue);
    if (this.jsonTableView !== v) {
      this._skipJsonTableEvent = true;
      this.jsonTableView = v;
      this._skipJsonTableEvent = false;
    }
  }
  /**
   * Reads the local value (always a string) as a boolean value.
   *
   * @param {String} value The value read from the local storage.
   * @return {Boolean} Boolean value read from the value.
   */
  _localStorageValueToBoolean(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === 'true') {
      value = true;
    } else {
      value = false;
    }
    return value;
  }

  _onJsonTableStateChanged(e) {
    if (e.target === this) {
      return;
    }
    const enabled = e.detail.enabled;
    if (enabled !== this.jsonTableView) {
      this._skipJsonTableEvent = true;
      this.jsonTableView = enabled;
      this._skipJsonTableEvent = false;
    }
  }

  _sourceViewHandler(e) {
    this.rawView = e.detail.value;
  }

  _jsonTableViewHandler(e) {
    this.jsonTableView = e.detail.value;
  }

  _rawTextWrapViewHandler(e) {
    this.rawTextWrap = e.detail.value;
  }
  /**
   * Fired when the element request to export data outside the application.
   *
   * Application can handle this event if it support native UX of file saving.
   * In this case this event must be canceled by calling `preventDefault()`
   * on it. If the event is not canceled then save to file dialog appears
   * with a regular download link.
   *
   * @event export-data
   * @param {String} data A text to save in the file.
   * @param {String} destination Always 'file'
   * @param {String} file Suggested file name
   * @param {Object} providerOptions File provider options.
   * Contains `contentType` property.
   */
  /**
   * Fired when the `jsonTableView` property change to inform other
   * elements to switch corresponding view as well.
   *
   * @event json-table-state-changed
   * @param {Boolean} enabled If true then the view is enabled.
   */
}
window.customElements.define('response-body-view', ResponseBodyView);
