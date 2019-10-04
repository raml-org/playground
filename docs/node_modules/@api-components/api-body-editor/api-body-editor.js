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
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import formStyles from '@api-components/api-form-mixin/api-form-styles.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@advanced-rest-client/clipboard-copy/clipboard-copy.js';
import '@advanced-rest-client/form-data-editor/form-data-editor.js';
import '@advanced-rest-client/raw-payload-editor/raw-payload-editor.js';
import '@advanced-rest-client/multipart-payload-editor/multipart-payload-editor.js';
import '@advanced-rest-client/files-payload-editor/files-payload-editor.js';
import '@advanced-rest-client/content-type-selector/content-type-selector.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-example-generator/api-example-generator.js';
import { ApiBodyEditorAmfOverlay } from './api-body-editor-amf-overlay.js';

/**
 * `api-body-editor`
 * Renders different types of body editors. It works with AMF data model
 * but can be used separately.
 *
 * ## AMF support
 *
 * The element supports [AMF](https://github.com/mulesoft/amf/)
 * `json-ld` model. The model can be generated from OAS or RAML spec by
 * default and other specs with appropriate plugin.
 *
 * The element accepts `http://www.w3.org/ns/hydra/core#Operation`,
 * `http://raml.org/vocabularies/http#Request` or array of
 * `http://raml.org/vocabularies/http#Payload` definitions in AMF
 * vocabulary.
 *
 * When AMF model is accepted it alters the UI to render only allowed
 * by the spec content types and therefore editors.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin EventsTargetBehavior
 * @appliesMixin ApiBodyEditorAmfOverlay
 */
class ApiBodyEditor extends ApiBodyEditorAmfOverlay(EventsTargetMixin(LitElement)) {
  static get styles() {
    return [
      formStyles,
      css`:host {
        display: block;
      }

      [hidden] {
        display: none !important;
      }

      .content-actions {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      anypoint-dropdown-menu {
        margin-right: 12px;
      }

      anypoint-dropdown-menu.type {
        margin: 0 12px;
        min-width: 280px;
      }

      .single-ct-label {
        margin: 12px 0px;
        font-size: var(--arc-font-body1-font-size);
        font-weight: var(--arc-font-body1-font-weight);
        line-height: var(--arc-font-body1-line-height);
        color: var(--api-body-editor-single-media-type-label);
      }`
    ];
  }

  render() {
    const {
      aware,
      amf,
      _effectiveModel,
      value
    } = this;
    return html`
    <api-view-model-transformer .amf="${amf}"></api-view-model-transformer>
    <api-example-generator .amf="${amf}"></api-example-generator>
    ${aware ? html`<raml-aware .api-changed="${this._modelHandler}" .scope="${aware}"></raml-aware>` : ''}

    <div class="content-actions">
      ${_effectiveModel ? this._getApiMimeSelector() : this._getDefaultMimeSelector()}
    </div>

    <section class="body-panel">${this.__createBodyPanel()}</section>

    <clipboard-copy .content="${value}"></clipboard-copy>`;
  }

  static get properties() {
    return {
      /**
       * Currently selected editor.
       *
       * - 0 for Raw editor
       * - 1 for Form data
       * - 2 for Multipart
       * - 3 for File
       */
      selected: { type: Number },
      /**
       * A HTTP body.
       *
       * Depending of current editor selection the type can vary.
       *
       * @type {String|FormData|File}
       */
      value: { },
      /**
       * When set it attempts to run associated code mirror mode
       * (raw editor).
       * This element listens for the `content-type-changed` event and when
       * handled it will automatically update content type and `mode`.
       */
      contentType: { type: String },
      // Computed value, if set then raw text input is hidden
      noTextInput: { type: Boolean },
      // Computed value, if set then form data input is hidden
      noFormData: { type: Boolean },
      // Computed value, if set then multipart input is hidden
      noMultipart: { type: Boolean },
      // Computed value, if set then file input is hidden
      noFile: { type: Boolean },
      // Computed value, true if the editor type selector is hidden.
      _editorSelectorHidden: { type: Boolean },
      /**
       * If set it computes `hasOptional` property and shows checkbox in the
       * form to show / hide optional properties.
       */
      allowHideOptional: { type: Boolean },
      /**
       * If set, enable / disable param checkbox is rendered next to each
       * form item.
       */
      allowDisableParams: { type: Boolean },
      /**
       * When set, renders "add custom" item button.
       * If the element is to be used withouth AMF model this should always
       * be enabled. Otherwise users won't be able to add a parameter.
       */
      allowCustom: { type: Boolean },
      /**
       * Renders items in "narrow" view
       */
      narrow: { type: Boolean },
      /**
       * Enables Anypoint legacy styling
       */
      legacy: { type: Boolean },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set all controls are disabled in the form
       */
      disabled: { type: Boolean },
      /**
       * Prohibits rendering of the documentation (the icon and the
       * description).
       */
      noDocs: { type: Boolean },
      /**
       * Renders line number on "raw" editor.
       * @type {Object}
       */
      lineNumbers: { type: Boolean }
    };
  }

  /**
   * @return {HTMLElement} Currently rendered body panel.
   */
  get currentPanel() {
    const selector = '[data-bodypanel]';
    return this.shadowRoot.querySelector(selector);
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    const old = this._selected;
    /* istanbul ignore if */
    if (old === value || isNaN(value)) {
      return;
    }
    this._selected = value;
    this.requestUpdate('selected', old);
    this._selectedChanged(value, old);
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._value = value;
    this.requestUpdate('value', old);
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
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._contentType = value;
    this.requestUpdate('contentType', old);
    this._contentTypeChanged(value, old);
  }

  /**
   * @constructor
   */
  constructor() {
    super();
    this._contentTypeHandler = this._contentTypeHandler.bind(this);
    this._payloadKeyDown = this._payloadKeyDown.bind(this);

    this.selected = 0;
    this.value = '';
  }

  _attachListeners(node) {
    node.addEventListener('content-type-changed', this._contentTypeHandler);
    this.addEventListener('keydown', this._payloadKeyDown);
  }

  _detachListeners(node) {
    node.removeEventListener('content-type-changed', this._contentTypeHandler);
    this.removeEventListener('keydown', this._payloadKeyDown);
  }

  _getApiMimeSelector() {
    const {
      _singleMimeType,
      contentType,
      readOnly,
      disabled,
      legacy,
      outlined,
    } = this;
    if (!_singleMimeType) {
      const item = this._mimeTypes || [];
      return html`<anypoint-dropdown-menu
        class="amf-types"
        .outlined="${outlined}"
        .legacy="${legacy}"
        .readOnly="${readOnly}"
        .disabled="${disabled}">
        <label slot="label">Body content type</label>
        <anypoint-listbox
          slot="dropdown-content"
          attrforselected="data-mime"
          .selected="${contentType}"
          .disabled="${disabled}"
          @selected-changed="${this._typeSelectedChanged}">
          ${item.map((item) => html`<anypoint-item .legacy="${legacy}" data-mime="${item}">${item}</anypoint-item>`)}
        </anypoint-listbox>
      </anypoint-dropdown-menu>`;
    }
  }

  _getDefaultMimeSelector() {
    const {
      contentType,
      eventsTarget,
      _editorSelectorHidden,
      selected,
      noTextInput,
      noFormData,
      noMultipart,
      noFile,
      readOnly,
      disabled,
      legacy,
      outlined
    } = this;
    return html`<content-type-selector
      .contentType="${contentType}"
      .eventsTarget="${eventsTarget}"
      .outlined="${outlined}"
      .legacy="${legacy}"
      .readOnly="${readOnly}"
      .disabled="${disabled}">
        <anypoint-item .legacy="${legacy}" data-type="application/octet-stream">Any file data</anypoint-item>
      </content-type-selector>
      ${!_editorSelectorHidden ? html`<anypoint-dropdown-menu
        class="type"
        .outlined="${outlined}"
        .legacy="${legacy}"
        .readOnly="${readOnly}"
        .disabled="${disabled}">
        <label slot="label">Editor view</label>
        <anypoint-listbox
          slot="dropdown-content"
          .selected="${selected}"
          .disabled="${disabled}"
          @selected-changed="${this._typeSelectionHandler}">
          <anypoint-item
            data-source="raw"
            .legacy="${legacy}"
            ?hidden="${noTextInput}">Raw input</anypoint-item>
          <anypoint-item
            data-source="urlencode"
            .legacy="${legacy}"
            ?hidden="${noFormData}">Form data (www-url-form-encoded)</anypoint-item>
          <anypoint-item
            data-source="multipart"
            .legacy="${legacy}"
            ?hidden="${noMultipart}">Multipart form data (multipart/form-data)</anypoint-item>
          <anypoint-item
            data-source="file"
            .legacy="${legacy}"
            ?hidden="${noFile}">Single file</anypoint-item>
        </anypoint-listbox>
      </anypoint-dropdown-menu>` : ''}
    `;
  }

  __createBodyPanel() {
    switch (this.selected) {
      case 0: return this._createRawPanel();
      case 1: return this._createFormDataPanel();
      case 2: return this._createMultipartPanel();
      case 3: return this._createFilePanel();
    }
  }

  /**
   * Creates instance of Raw body panel in a TemplateResult
   *
   * @return {TemplateResult}
   */
  _createRawPanel() {
    const {
      eventsTarget,
      allowDisableParams,
      allowCustom,
      allowHideOptional,
      contentType,
      narrow,
      readOnly,
      disabled,
      legacy,
      outlined,
      value,
      noDocs,
      lineNumbers
    } = this;
    return html`<raw-payload-editor
      data-type="raw"
      data-bodypanel
      .contentType="${contentType}"
      .value="${value}"
      .allowDisableParams="${allowDisableParams}"
      .allowCustom="${allowCustom}"
      .allowHideOptional="${allowHideOptional}"
      .noDocs="${noDocs}"
      .eventsTarget="${eventsTarget}"
      .narrow="${narrow}"
      .outlined="${outlined}"
      .legacy="${legacy}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      .lineNumbers="${lineNumbers}"
      @value-changed="${this._panelValueChanged}"
    >
    <anypoint-button
      part="content-action-button, code-content-action-button"
      class="action-button"
      data-action="copy"
      emphasis="low"
      slot="content-action"
      @click="${this._copyToClipboard}"
      aria-label="Press to copy payload to clipboard"
      title="Copy payload to clipboard"
    >Copy</anypoint-button>
    </raw-payload-editor>`;
  }
  /**
   * Creates instance of x-www-urlencoded body panel.
   *
   * @return {TemplateResult}
   */
  _createFormDataPanel() {
    const {
      eventsTarget,
      allowDisableParams,
      allowCustom,
      allowHideOptional,
      contentType,
      narrow,
      readOnly,
      disabled,
      legacy,
      outlined,
      value,
      noDocs,
      _panelModel
    } = this;
    return html`<form-data-editor
    data-type="urlencode"
    data-bodypanel
    .value="${value}"
    .model="${_panelModel}"
    .allowDisableParams="${allowDisableParams}"
    .allowCustom="${allowCustom}"
    .allowHideOptional="${allowHideOptional}"
    .noDocs="${noDocs}"
    .eventsTarget="${eventsTarget}"
    .narrow="${narrow}"
    .contentType="${contentType}"
    .outlined="${outlined}"
    .legacy="${legacy}"
    .readOnly="${readOnly}"
    .disabled="${disabled}"
    @value-changed="${this._panelValueChanged}">
      <anypoint-button
        part="content-action-button, code-content-action-button"
        class="action-button"
        data-action="copy"
        emphasis="low"
        slot="content-action"
        @click="${this._copyToClipboard}"
        aria-label="Press to copy payload to clipboard"
        title="Copy payload to clipboard"
      >Copy</anypoint-button>
    </form-data-editor>`;
  }
  /**
   * Creates instance of File body panel.
   * @return {TemplateResult}
   */
  _createFilePanel() {
    const {
      eventsTarget,
      allowDisableParams,
      allowCustom,
      allowHideOptional,
      contentType,
      narrow,
      value,
      noDocs,
      _panelModel
    } = this;
    return html`<files-payload-editor
    data-type="file"
    data-bodypanel
    .value="${value}"
    .allowDisableParams="${allowDisableParams}"
    .allowCustom="${allowCustom}"
    .allowHideOptional="${allowHideOptional}"
    .noDocs="${noDocs}"
    .eventsTarget="${eventsTarget}"
    .narrow="${narrow}"
    .contentType="${contentType}"
    .model="${_panelModel}"
    @value-changed="${this._panelValueChanged}">
    </files-payload-editor>`;
  }
  /**
   * Creates instance of Multipart body panel.
   * @return {TemplateResult}
   */
  _createMultipartPanel() {
    const {
      eventsTarget,
      allowDisableParams,
      allowCustom,
      allowHideOptional,
      contentType,
      narrow,
      readOnly,
      disabled,
      legacy,
      outlined,
      value,
      noDocs,
      _panelModel
    } = this;
    return html`<multipart-payload-editor
    data-type="formdata"
    data-bodypanel
    .value="${value}"
    .allowDisableParams="${allowDisableParams}"
    .allowCustom="${allowCustom}"
    .allowHideOptional="${allowHideOptional}"
    .noDocs="${noDocs}"
    .eventsTarget="${eventsTarget}"
    .narrow="${narrow}"
    .contentType="${contentType}"
    .outlined="${outlined}"
    .legacy="${legacy}"
    .readOnly="${readOnly}"
    .disabled="${disabled}"
    .model="${_panelModel}"
    @value-changed="${this._panelValueChanged}">
    </multipart-payload-editor>`;
  }
  /**
   * Handler for content type changed event.
   * @param {CustomEvent} e
   */
  _contentTypeHandler(e) {
    if (this.readonly) {
      return;
    }
    this.contentType = e.detail.value;
  }
  /**
   * Handler for content type change.
   * Updates state of the UI depending on AMF model.
   *
   * @param {String} contentType New content type value.
   * @param {String} oldValue Previous value
   */
  _contentTypeChanged(contentType, oldValue) {
    super._contentTypeChanged(contentType, oldValue);
    this._updateEditorsState(contentType, oldValue);
    this._updateEditorSelectorHidden(contentType);
  }

  _hideAllEditors() {
    this.noTextInput = true;
    this.noFormData = true;
    this.noMultipart = true;
    this.noFile = true;
  }

  _renderAllEditors() {
    this.noTextInput = false;
    this.noFormData = false;
    this.noMultipart = false;
    this.noFile = false;
  }
  /**
   * Updates editors availability state depending on content type.
   * @param {String} contentType New content type value.
   * @param {String} oldValue Previous value
   */
  _updateEditorsState(contentType, oldValue) {
    if (!contentType) {
      this._renderAllEditors();
      return;
    }
    const value = this.value;
    this._hideAllEditors();
    if (contentType.indexOf('multipart/form-data') === 0) {
      this.noTextInput = false;
      this.noMultipart = false;
      this.selected = 2;
      return;
    }
    if (oldValue && oldValue.indexOf('multipart/form-data') === 0) {
      this.value = '';
    }
    const blobValue = value instanceof Blob;
    if (contentType === 'application/octet-stream' || (blobValue && oldValue !== undefined)) {
      this.noFile = false;
      this.selected = 3;
      return;
    }
    if (contentType.indexOf('json') !== -1) {
      this.noTextInput = false;
      this.selected = 0;
      return;
    }
    if (contentType === 'application/x-www-form-urlencoded') {
      this.noTextInput = false;
      this.noFormData = false;
      this.selected = 1;
      return;
    }
    this.noTextInput = false;
    this.selected = 0;
  }
  /**
   * Replaces active body editor with new one.
   *
   * @param {Number} selected
   * @param {Number} oldValue
   */
  _selectedChanged(selected, oldValue) {
    if (selected === -1 || selected === undefined || selected === null) {
      this._notifyBodyChanged();
      return;
    }
    if (oldValue !== undefined) {
      this._analyticsEvent('api-body-editor', 'usage-selection', selected);
    }
  }
  /**
   * Notifies application about body change.
   *
   * @param {String|FormData|File|undefined} value Value to notify
   */
  _notifyBodyChanged(value) {
    if (this.readonly) {
      return;
    }
    const e = new CustomEvent('body-value-changed', {
      detail: {
        value: value,
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(e);
  }
  /**
   * Dispatches analytics event.
   *
   * @param {String} category Event category
   * @param {String} action Event action
   * @param {String} label Event label
   */
  _analyticsEvent(category, action, label) {
    const e = new CustomEvent('send-analytics', {
      detail: {
        type: 'event',
        category: category,
        action: action,
        label: label
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(e);
  }
  /**
   * Dispatches `send-request` custom event when the user pressed
   * `meta+enter` on Mac or `ctrl+enter` eklsewhere keys combination.
   *
   * @param {CustomEvent} e
   */
  _payloadKeyDown(e) {
    if (e.key !== 'Enter') {
      return;
    }
    if (!e.metaKey && !e.ctrlKey) {
      return;
    }
    this.dispatchEvent(new CustomEvent('send-request', {
      cancelable: true,
      bubbles: true,
      composed: true
    }));
  }
  /**
   * Computes a value of the hidden attribute of the editory type selector.
   * Some content types are supported by only one type of the editor so in
   * this cases the editor should be hidden.
   *
   * @param {String} contentType Current content type.
   */
  _updateEditorSelectorHidden(contentType) {
    let result;
    const value = this.value;
    if (!contentType) {
      result = false;
    } else if (value instanceof Blob) {
      result = true;
    } else if (contentType.indexOf('json') !== -1) {
      result = true;
    } else if (contentType.indexOf('x-www-form-urlencoded') !== -1) {
      result = false;
    } else if (contentType.indexOf('multipart/') !== -1) {
      result = false;
    } else {
      result = true;
    }
    this._editorSelectorHidden = result;
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
        label: 'Multipart payload editor clipboard copy',
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
   * Dispatches `content-type-changed` custom event when CT changes by
   * using type selection.
   * @param {String} type Content type value to announce.
   */
  _notifyContentTypeChange(type) {
    if (this.readOnly) {
      return;
    }
    this.dispatchEvent(new CustomEvent('content-type-changed', {
      bubbles: true,
      composed: true,
      detail: {
        value: type
      }
    }));
  }
  /**
   * Notifies about content type change when type selection changes.
   * @param {CustomEvent} e
   */
  _typeSelectedChanged(e) {
    if (!e.detail.value) {
      return;
    }
    this._notifyContentTypeChange(e.detail.value);
  }
  /**
   * A function to be called to refres current state of editor panel.
   * It is only called for the panels that support refreshing (raw editor)
   */
  refresh() {
    if (this.selected === 0) {
      const panel = this.currentPanel;
      if (panel) {
        panel.refresh();
      }
    }
  }

  refreshPanel() {
    this.refresh();
  }

  _modelHandler(e) {
    this.amf = e.detail.value;
  }

  _typeSelectionHandler(e) {
    this.selected = e.detail.value;
  }

  _panelValueChanged(e) {
    const { value } = e.detail;
    this.value = value;
    this._notifyBodyChanged(value);
  }
  /**
   * Fires when the value change.
   *
   * @event body-value-changed
   * @param {String} value Current editor value
   */
  /**
   * Dispatched when the request should be invoked.
   *
   * @event send-request
   */

  /**
   * Dispatched when the user select media type from the list of available types.
   *
   * @event content-type-changed
   * @param {String} value New content type value.
   */
}

window.customElements.define('api-body-editor', ApiBodyEditor);
