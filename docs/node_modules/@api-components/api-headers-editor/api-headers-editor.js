import { html, css, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import { ApiFormMixin } from '@api-components/api-form-mixin/api-form-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import { HeadersParserMixin } from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import formStyles from '@api-components/api-form-mixin/api-form-styles.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-headers-form/api-headers-form.js';
import '@advanced-rest-client/code-mirror/code-mirror.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@advanced-rest-client/clipboard-copy/clipboard-copy.js';
import '@advanced-rest-client/code-mirror-hint/code-mirror-headers-hint.js';

const contentTypeRe = /^[\t\r]*content-type[\t\r]*:[\t\r]*([^\n]*)$/gim;
/**
 * `api-headers-editor`
 * An element to render headers edior based on AMF data model.
 *
 * By default it renders headers form. The user has an option to switch to
 * source editing mode. `code-mirror` element is used in the later case.
 *
 * ## AMF data model
 *
 * This element renders pre-configured form of headers based on
 * [AMF's](https://github.com/mulesoft/amf) json/ld data model.
 * From the model select `http://raml.org/vocabularies/http#header`
 * node which contains list of headers defined for current object
 * (it can be method, trait, security scheme etc).
 * The model is resolved to internal data model by `api-view-model-transformer`
 * element.
 *
 * If the element is used without AMF model `allowCustom` property must be
 * set or otherwise user won't be able to add new header to the editor.
 *
 * ### Example
 *
 * ```html
 * <api-headers-editor id="editor" allow-disable-params></api-headers-editor>
 * <script>
 * let data = await getamf();
 * editor.amf = data;
 * data = data[0]['http://raml.org/vocabularies/document#encodes'][0];
 * data = data['http://raml.org/vocabularies/http#endpoint'][0];
 * data = data['http://www.w3.org/ns/hydra/core#supportedOperation'][0];
 * data = data['http://www.w3.org/ns/hydra/core#expects'][0];
 * data = data['http://raml.org/vocabularies/http#header'];
 * (first endpoint, first method, headers array)
 * editor.amfHeaders = data;
 * editor.addEventListener('value-changed', (e) => console.log(e.detail.value));
 * < /script>
 * ```
 *
 * ### Example without AMF
 *
 * ```html
 * <api-headers-editor id="editor" allow-disable-params allow-custom></api-headers-editor>
 * <script>
 * editor.addEventListener('value-changed', (e) => console.log(e.detail.value));
 * < /script>
 * ```
 *
 * ## Setting value when model is set
 *
 * Model values has priority over value set on the editor.
 * If `amf` is set and value has been altered programatically there
 * are two possible outcomes:
 *
 * 1) If `allowDisableParams` is set, model values are automatically
 * disabled if model item is not in the value
 * 2) If `allowDisableParams` is not set, model values are always
 * added to generated values. Or rather new value is added to the existing
 * model as custom values.
 *
 * @customElement
 * @memberof ApiElements
 * @demo demo/simple.html Simple headers editor
 * @demo demo/raml.html With AMF model
 * @appliesMixin ArcBehaviors.HeadersParserBehavior
 * @appliesMixin ApiFormMixin
 * @appliesMixin ValidatableMixin
 * @appliesMixin AmfHelperMixin
 */
class ApiHeadersEditor extends
    ValidatableMixin(ApiFormMixin(EventsTargetMixin(
      HeadersParserMixin(AmfHelperMixin(LitElement))))) {

  static get styles() {
    return [
      formStyles,
      css`
      :host {
        display: block;
        position: relative;
      }`
    ];
  }

  render() {
    const {
      aware,
      amf,
      amfHeaders,
      viewModel,
      narrow,
      noDocs,
      sourceMode,
      allowCustom,
      allowDisableParams,
      allowHideOptional,
      readOnly,
      outlined,
      legacy,
      value,
      noSourceEditor
    } = this;
    return html`
    ${aware ? html`<raml-aware @api-changed="${this._apiHandler}" .scope="${aware}"></raml-aware>` : undefined}
    <api-view-model-transformer
      @view-model-changed="${this._viewModelHandler}"
      .amf="${amf}"
      .shape="${amfHeaders}"
      .eventsTarget="${this}"
      ?nodocs="${noDocs}"
    ></api-view-model-transformer>

    <div class="content">
      <div class="editor-actions">
        <anypoint-button
          part="content-action-button, code-content-action-button"
          class="action-button"
          data-action="copy"
          @click="${this._copyToClipboard}"
          aria-label="Press to copy headers to clipboard"
          title="Copy example to clipboard">Copy</anypoint-button>
        ${noSourceEditor ? undefined : html`<anypoint-button
          aria-label="Press to toggle source edit mode"
          title="Toggle source edit mode"
          part="content-action-button, code-content-action-button"
          class="action-button"
          data-action="source"
          toggles
          .active="${sourceMode}"
          @active-changed="${this._sourceModeHandler}">Source view</anypoint-button>`}
        <slot name="content-actions"></slot>
      </div>
      <div id="editor">
        ${(!sourceMode || noSourceEditor) ?
          html`<api-headers-form
            .model="${viewModel}"
            ?narrow="${narrow}"
            ?allowcustom="${allowCustom}"
            ?allowdisableparams="${allowDisableParams}"
            ?allowhideoptional="${allowHideOptional}"
            data-headers-panel
            ?nodocs="${noDocs}"
            ?readonly="${readOnly}"
            ?outlined="${outlined}"
            ?legacy="${legacy}"
            @value-changed="${this._editorValueChanged}"
            @invalid-changed="${this._formEditorInvalidHandler}"
            @model-changed="${this._formEditorModelHandler}"
            ></api-headers-form>` :
          html`<code-mirror
            mode="http-headers"
            data-headers-panel
            ?readonly="${readOnly}"
            @value-changed="${this._editorValueChanged}"></code-mirror>`}
      </div>
    </div>
    <clipboard-copy .content="${value}"></clipboard-copy>
    `;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * List of headers defined in AMF model to render.
       */
      amfHeaders: { type: Array },
      /**
       * Headers value.
       */
      value: { type: String },
      /**
       * Generated view model from the headers from `amf` model.
       * This is automatically set when `amf` is set.
       */
      viewModel: { type: Array },
      /**
       * Value of a Content-Type header.
       * When this value change then editor update the value for the content type. However,
       * to change a single header value, please, use `request-headers-changed` event with `name`
       * and `value` properties set on the detail object.
       *
       * @type {Stirng}
       */
      contentType: { type: String },
      // When set to true then the source edit mode is enabled
      sourceMode: { type: Boolean },
      /**
       * Prohibits rendering of the documentation (the icon and the
       * description).
       * Note, Set is separately for `api-view-model-transformer`
       * component as this only affects "custom" items.
       */
      noDocs: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * Automatically validates headers agains AMF model when value change.
       * Note, it only works with form editor.
       */
      autoValidate: { type: Boolean },
      /**
       * Enables Anypoint legacy styling
       */
      legacy: { type: Boolean },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * When set only form editor is available.
       *
       * Note, because of dependency, you still have to import CodeMirror
       * or at lease provide a mock function for registering addons.
       *
       * See @advanced-rest-client/code-mirror-hint for used functions.
       */
      noSourceEditor: { type: Boolean }
    };
  }
  /**
   * Reference to currently rendered headers editor.
   * @return {HTMLElement}
   */
  get currentPanel() {
    if (!this.shadowRoot) {
      return null;
    }
    const panel = this.shadowRoot.querySelector('code-mirror');
    if (panel) {
      return panel;
    }
    return this.shadowRoot.querySelector('api-headers-form');
  }

  get _cmExtraKeys() {
    return {
      'Ctrl-Space': this._cmKeysHandler
    };
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._value = value;
    this.requestUpdate('value', old);
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
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._contentType = value;
    this.requestUpdate('contentType', old);
    this._onContentTypeChanged(value);
  }

  get viewModel() {
    return this._viewModel;
  }

  set viewModel(value) {
    const old = this._viewModel;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._viewModel = value;
    this.requestUpdate('viewModel', old);
  }
  /**
   * @return {Function} Previously registered handler for `value-changed` event
   */
  get onvalue() {
    return this['_onvalue-changed'];
  }
  /**
   * Registers a callback function for `value-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onvalue(value) {
    this._registerCallback('value-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `content-type-changed-changed` event
   */
  get oncontenttype() {
    return this['_oncontent-type-changed'];
  }
  /**
   * Registers a callback function for `content-type-changed-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set oncontenttype(value) {
    this._registerCallback('content-type-changed', value);
  }
  /**
   * @constructor
   */
  constructor() {
    super();
    this._cmKeysHandler = this._cmKeysHandler.bind(this);
    this._headersChangedHandler = this._headersChangedHandler.bind(this);
    this._headerChangedHandler = this._headerChangedHandler.bind(this);
    this._contentTypeChangedHandler = this._contentTypeChangedHandler.bind(this);
    this._headerDeletedHandler = this._headerDeletedHandler.bind(this);

    this.sourceMode = false;
  }

  _attachListeners(node) {
    node.addEventListener('request-headers-changed', this._headersChangedHandler);
    node.addEventListener('request-header-changed', this._headerChangedHandler);
    node.addEventListener('content-type-changed', this._contentTypeChangedHandler);
    node.addEventListener('request-header-deleted', this._headerDeletedHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('request-headers-changed', this._headersChangedHandler);
    node.removeEventListener('request-header-changed', this._headerChangedHandler);
    node.removeEventListener('content-type-changed', this._contentTypeChangedHandler);
    node.removeEventListener('request-header-deleted', this._headerDeletedHandler);
  }
  /**
   * Registers an event handler for given type
   * @param {String} eventType Event type (name)
   * @param {Function} value The handler to register
   */
  _registerCallback(eventType, value) {
    const key = `_on${eventType}`;
    if (this[key]) {
      this.removeEventListener(eventType, this[key]);
    }
    if (typeof value !== 'function') {
      this[key] = null;
      return;
    }
    this[key] = value;
    this.addEventListener(eventType, value);
  }
  /**
   * Handler for `sourceMode` change.
   *
   * Opens desired editr.
   *
   * @param {Boolean} isSource
   */
  _sourceModeChanged(isSource) {
    if (this.noSourceEditor) {
      return;
    }
    if (isSource) {
      setTimeout(() => {
        const panel = this.currentPanel;
        panel.setOption('extraKeys', this._cmExtraKeys);
        panel.value = this.modelToValue(this.viewModel);
      }, 50);
    } else {
      this._modelFromValue();
    }

    const ev = new CustomEvent('send-analytics', {
      detail: {
        type: 'event',
        category: 'Usage',
        action: 'Click',
        label: 'Toggle source mode ' + String(isSource),
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(ev);
  }

  /**
   * Updates the value when current editor's value change.
   *
   * @param {CustomEvent} e
   */
  _editorValueChanged(e) {
    const value = e.detail.value;
    if (value !== this.value) {
      this._innerEditorValueChanged = true;
      this.value = value;
      this._innerEditorValueChanged = false;
    }
  }
  /**
   * Creates a headers string from a model.
   *
   * @param {?Array} model Optional, model to process. If not set it uses
   * `this.viewModel`
   * @return {String} Generated headers
   */
  modelToValue(model) {
    if (!model) {
      model = this.viewModel;
    }
    if (!model || !model.length) {
      return '';
    }
    const data = [];
    const disbleAllowed = this.allowDisableParams;
    model.forEach((item) => {
      if (!item || (disbleAllowed && item.schema && item.schema.enabled === false)) {
        return;
      }
      data.push({
        name: item.name,
        value: item.value
      });
    });
    return this.headersToString(data);
  }
  /**
   * Code mirror's ctrl+space key handler.
   * Opens headers fill support.
   *
   * @param {Object} cm Code mirror instance.
   */
  _cmKeysHandler(cm) {
    /* global CodeMirror */
    CodeMirror.showHint(cm, CodeMirror.hint['http-headers'], {
      container: this.currentPanel
    });
  }
  /**
   * Called when switching from source view to form view.
   * Updates view model with values defined in text editor.
   *
   * Only headers existing in `value` are going to be present in the model.
   * Otherwise headers will be disabled.
   *
   * It does nothing if `value` or `viewModel` is not defined.
   *
   * @param {?String} value
   */
  _modelFromValue(value) {
    value = value || this.value;
    if (value === undefined) {
      if (!this.model) {
        return;
      } else {
        value = '';
      }
    }
    let model = this.viewModel;
    if (!model) {
      model = [];
      this.viewModel = model;
    }
    const parsedValue = this.filterHeaders(this.headersToJSON(String(value)));
    const tmp = {};
    const appendCustom = [];
    const disbleAllowed = this.allowDisableParams;
    // updates model value
    for (let i = 0, len = parsedValue.length; i < len; i++) {
      const item = parsedValue[i];
      const index = this._findModelIndex(model, item.name);
      if (index === -1) {
        appendCustom.push(this.createCustom(item));
      } else {
        tmp[item.name] = true;
        if (model[index].value !== item.value) {
          if (model[index].schema.isArray) {
            model[index].value = item.value.split(',');
          } else {
            model[index].value = item.value;
          }
        }
        if (!model[index].schema.enabled) {
          model[index].schema.enabled = true;
        }
      }
    }
    // Disables / removes not existing values.
    for (let i = model.length - 1; i >= 0; i--) {
      if (model[i].name in tmp) {
        continue;
      }
      if (model[i].schema.isCustom) {
        model.splice(i, 1);
      } else if (disbleAllowed) {
        model[i].schema.enabled = false;
      } else {
        if (model[i].schema.isArray) {
          model[i].value = [];
        } else {
          model[i].value = '';
        }
      }
    }
    if (!model.length) {
      this.viewModel = appendCustom;
    } else {
      model = [...model, ...appendCustom];
      this.viewModel = model;
    }
  }
  /**
   * Finds item position in model by name.
   *
   * @param {Array} model Model items
   * @param {String} name Header name to search for
   * @return {Number} Items position or `-1` if not found.
   */
  _findModelIndex(model, name) {
    for (let i = 0, len = model.length; i < len; i++) {
      if (model[i].name === name) {
        return i;
      }
    }
    return -1;
  }
  /**
   * Creates a custom header model item.
   *
   * @param {Object} defaults Default data
   * @return {Object} View model item
   */
  createCustom(defaults) {
    const data = Object.assign({}, defaults);
    if (!data.schema) {
      data.schema = {};
    }
    data.schema.isCustom = true;
    if (!data.schema.type) {
      data.schema.type = 'string';
    }
    if (!data.schema.enabled) {
      data.schema.enabled = true;
    }
    if (!data.schema.inputLabel) {
      data.schema.inputLabel = 'Header value';
    }
    const node = this.shadowRoot.querySelector('api-view-model-transformer');
    if (node) {
      node.buildProperty(data);
    }
    return data;
  }

  /**
   * Handler tor the `request-headers-changed` event.
   * Updates the editor value to the value of the event detail object.
   * @param {CustomEvent} e
   */
  _headersChangedHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    const value = e.detail.value;
    this._setValues(value);
  }
  /**
   * Handler for the `request-header-changed` event.
   * It updates value for a single header.
   * @param {CustomEvent} e
   */
  _headerChangedHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    const name = e.detail.name;
    if (!name) {
      return;
    }
    const value = e.detail.value;
    const arr = this.headersToJSON(this.value);
    let updated = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i].name.toLowerCase() === name.toLowerCase()) {
        arr[i].value = value;
        updated = true;
        break;
      }
    }
    if (!updated) {
      arr.push({
        name: name,
        value: value
      });
    }
    const headers = this.headersToString(arr);
    this._setValues(headers);
  }
  /**
   * Handler for `content-type-changed` event.
   * Uppdates it's value if from external source.
   *
   * @param {CustomEvent} e
   */
  _contentTypeChangedHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    this.__cancelContentTypeNotification = true;
    this.contentType = e.detail.value;
    this.__cancelContentTypeNotification = false;
  }
  /**
   * Handler for `request-header-deleted` custom event.
   * Deletes header from the editor.
   * @param {CustomEvent} e
   */
  _headerDeletedHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    const name = e.detail.name;
    if (!name) {
      return;
    }
    const arr = this.headersToJSON(this.value);
    let updated = false;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].name.toLowerCase() === name.toLowerCase()) {
        arr.splice(i, 1);
        updated = true;
        break;
      }
    }
    if (!updated) {
      return;
    }
    const headers = this.headersToString(arr);
    this._setValues(headers);
  }
  /**
   * Detects and sets content type value from changed headers value.
   *
   * @param {String} value Headers new value.
   */
  _detectContentType(value) {
    if (!value) {
      value = '';
    }
    contentTypeRe.lastIndex = 0;
    const matches = contentTypeRe.exec(value);
    let ctValue;
    if (!matches) {
      ctValue = '';
    } else {
      ctValue = matches[1];
    }
    if (!ctValue) {
      if (this.contentType) {
        this.contentType = undefined;
      }
    } else {
      ctValue = ctValue.trim();
      if (this.contentType !== ctValue) {
        this.contentType = ctValue;
      }
    }
  }
  /**
   * Called by CodeMirror editor.
   * When something change n the headers list, detect content type header.
   * @param {String} value
   */
  _valueChanged(value) {
    if (this.autoValidate) {
      this.validate();
    }
    this._detectContentType(value);
    if (this._cacncelChangeEvent) {
      if (!this._innerEditorValueChanged) {
        this._modelFromValue(value);
      }
      return;
    }
    if (this._innerEditorValueChanged) {
      if (this.readOnly) {
        return;
      }
      this.dispatchEvent(new CustomEvent('request-headers-changed', {
        detail: {
          value: value
        },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
    } else {
      this._modelFromValue(value);
    }
  }

  _onContentTypeChanged(currentCt) {
    if (this.readOnly) {
      return;
    }
    if (!currentCt) {
      this._notifyContentType('');
      return;
    }
    const arr = this.headersToJSON(this.value);
    let updated = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i].name.toLowerCase() !== 'content-type') {
        continue;
      }
      updated = true;
      if (arr[i].value !== currentCt) {
        arr[i].value = currentCt;
      }
      break;
    }
    if (!updated) {
      arr.push({
        name: 'Content-Type',
        value: currentCt
      });
    }
    const headers = this.headersToString(arr);
    if (!this._innerEditorValueChanged) {
      this._setValues(headers);
      this._modelFromValue(headers);
    }
    this._notifyContentType(currentCt);
  }

  _notifyContentType(type) {
    if (this.__cancelContentTypeNotification) {
      return;
    }
    const ev = new CustomEvent('content-type-changed', {
      detail: {
        value: type
      },
      cancelable: false,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(ev);
  }
  /**
   * Updates `value` when new value is computed by the editor.
   *
   * @param {String} value A value to set.
   */
  _setValues(value) {
    this._cacncelChangeEvent = true;
    this.value = value;
    this._cacncelChangeEvent = false;
    if (!this._innerEditorValueChanged && this.sourceMode) {
      const panel = this.currentPanel;
      if (panel) {
        panel.value = value;
      }
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

  // Overidden from Polymer.IronValidatableBehavior. Will set the `invalid`
  // attribute automatically, which should be used for styling.
  _getValidity() {
    if (this.sourceMode || !this.shadowRoot) {
      return true;
    }
    const form = this.shadowRoot.querySelector('api-headers-form');
    return form ? form.validate() : true;
  }
  /**
   * Refreshes the CodeMirror editor when in `sourceMode`.
   */
  refresh() {
    if (!this.sourceMode) {
      return;
    }
    const panel = this.currentPanel;
    panel.refresh();
  }

  _apiHandler(e) {
    this.amf = e.detail.value;
  }

  async _viewModelHandler(e) {
    const { value } = e.detail;
    if (value) {
      await this.updateComplete;
      this.viewModel = value;
    }
  }

  _sourceModeHandler(e) {
    if (this.noSourceEditor) {
      return;
    }
    const { value } = e.detail;
    this.sourceMode = value;
    this._sourceModeChanged(value);
  }

  _formEditorInvalidHandler(e) {
    this.invalid = e.detail.value;
  }

  _formEditorModelHandler(e) {
    if (e.detail.value !== this.viewModel) {
      this.viewModel = e.detail.value;
    }
  }
}

window.customElements.define('api-headers-editor', ApiHeadersEditor);
