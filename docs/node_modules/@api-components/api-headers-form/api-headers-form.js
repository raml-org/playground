import { html, css, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import { ApiFormMixin } from '@api-components/api-form-mixin/api-form-mixin.js';
import formStyles from '@api-components/api-form-mixin/api-form-styles.js';
import '@polymer/iron-form/iron-form.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import { addCircleOutline, removeCircleOutline } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import '@advanced-rest-client/arc-definitions/arc-definitions.js';
import './api-headers-form-item.js';
/**
 * HTTP headers form build from AMF json/ld model.
 *
 * @customElement
 * @demo demo/index.html
 * @appliesMixin ApiFormMixin
 * @appliesMixin ValidatableMixin
 * @memberOf ApiComponents
 */
class ApiHeadersForm extends ValidatableMixin(ApiFormMixin(LitElement)) {
  static get styles() {
    return [
      formStyles,
      css`:host {
        display: block;
      }

      api-headers-form-item {
        flex: 1;
      }

      .enable-checkbox {
        margin-right: 8px;
      }

      [hidden] {
        display: none !important;
      }

      .empty-info {
        color: var(--empty-info-color, rgba(0, 0, 0, 0.74));
        font-size: var(--empty-info-font-size, 16px);
      }

      .icon {
        display: inline-block;
        width: 24px;
        height: 24px;
        fill: currentColor;
      }`
    ];
  }

  render() {
    const {
      renderEmptyMessage,
      renderOptionalCheckbox,
      allowDisableParams,
      readOnly,
      hasOptional,
      narrow,
      noDocs,
      allowCustom,
      compatibility,
      outlined,
      optionalOpened
    } = this;
    const model = this.model || [];
    return html`<arc-definitions></arc-definitions>

    ${renderEmptyMessage ? html`<p class="empty-info">Headers are not defined for this endpoint</p>` : undefined}

    <iron-form>
      <form enctype="application/json">
        ${renderOptionalCheckbox ? html`<div class="optional-checkbox">
          <anypoint-checkbox
            class="toggle-checkbox"
            .checked="${optionalOpened}"
            @checked-changed="${this._optionalHanlder}"
            title="Shows or hides optional parameters">Show optional headers</anypoint-checkbox>
        </div>` : undefined}
        ${model.map((item, index) => html`
        <div class="form-item" ?data-optional="${this.computeIsOptional(hasOptional, item)}">
          ${allowDisableParams ? html`
          <anypoint-checkbox
            class="enable-checkbox"
            ?checked="${item.schema.enabled}"
            data-index="${index}"
            @checked-changed="${this._enableCheckedHandler}"
            title="Enable or disable this header"
            ?disabled="${readOnly}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"></anypoint-checkbox>` : undefined}
          <api-headers-form-item
            data-index="${index}"
            .name="${item.name}"
            @name-changed="${this._nameChangeHandler}"
            .value="${item.value}"
            @value-changed="${this._valueChangeHandler}"
            .model="${item}"
            ?required="${item.required}"
            .readOnly="${readOnly}"
            .isCustom="${item.schema.isCustom}"
            .isArray="${item.schema.isArray}"
            ?narrow="${narrow}"
            .noDocs="${noDocs}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"
          >
            <anypoint-icon-button
              title="Remove this header"
              aria-label="Press to remove header ${name}"
              class="action-icon delete-icon"
              data-index="${index}"
              @click="${this._removeCustom}"
              slot="suffix"
              ?disabled="${readOnly}"
              ?outlined="${outlined}"
              ?compatibility="${compatibility}"
            >
              <span class="icon action-icon">${removeCircleOutline}</span>
            </anypoint-icon-button>
          </api-headers-form-item>
        </div>`)}
      </form>
    </iron-form>

    ${allowCustom ? html`<div class="add-action">
      <anypoint-button
        class="action-button"
        @tap="${this.add}"
        title="Add new header"
        aria-label="Press to create a new header"
        ?disabled="${readOnly}"
      >
        <span class="icon action-icon">${addCircleOutline}</span>
        Add header
      </anypoint-button>
    </div>` : undefined}
`;
  }

  static get properties() {
    return {
      /**
       * Current value of the headers. Changing the value will update the list
       * of the headers.
       */
      value: { type: String },
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
       * Automatically validates the input on value change.
       */
      autoValidate: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
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
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: {
        value
      }
    }));
  }

  get model() {
    return this._model;
  }

  set model(value) {
    const old = this._model;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    super.model = value;
    this.requestUpdate('model', old);
    this._modelChanged(value, this.readOnly);
    // The model change is not propagated outside the element as it keeps a copy
    // of the model.
    // This causes issues when dealing with custom headers and parent template regenerates
    // the view as new items won't be propagated. Parent elements
    // should ovserve this event and update the model if needed.
    this.dispatchEvent(new CustomEvent('model-changed', {
      detail: {
        value
      }
    }));
  }

  get readOnly() {
    return this._readOnly;
  }

  set readOnly(value) {
    const old = this._readOnly;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._readOnly = value;
    this.requestUpdate('readOnly', old);
    this._modelChanged(this.model, value);
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
   * @return {Function} Previously registered handler for `model-changed` event
   */
  get onmodel() {
    return this['_onmodel-changed'];
  }
  /**
   * Registers a callback function for `model-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onmodel(value) {
    this._registerCallback('model-changed', value);
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

  firstUpdated() {
    this.__firstUpdatedReady = this;
    this._autoDescribeModel(this.model);
  }
  /**
   * Appends an empty header to the list.
   */
  add() {
    if (!this.allowCustom) {
      return;
    }
    this.addCustom('header');
    setTimeout(() => this.focusLast());
  }
  /**
   * Focuses on last form item.
   */
  focusLast() {
    const node = this.shadowRoot.querySelector('.form-item:last-child api-headers-form-item');
    if (!node) {
      return;
    }
    node.focus();
  }

  _modelChanged(model, readOnly) {
    if (readOnly || !model) {
      return;
    }
    if (this.invalid) {
      this.invalid = false;
    }
    this._updateValue(this.autoValidate);
    if (this.__firstUpdatedReady) {
      this._autoDescribeModel(model);
    }
  }
  /**
   * Updates value of the element when model change.
   * @param {Boolean} validate When true then it performs validation after setting
   * the value.
   */
  _updateValue(validate) {
    if (this.__updatingModelValue || this.readOnly) {
      return;
    }
    this.__updatingModelValue = true;
    setTimeout(() => {
      this.__updateValue(validate);
      this.__updatingModelValue = false;
    });
  }
  /**
   * Creates a header value for current model.
   * @param {Boolean} validate When true then it performs validation after setting
   * the value.
   */
  __updateValue(validate) {
    const h = this.model;
    if (!h || !h.length) {
      this.value = '';
      if (this.invalid) {
        this.invalid = false;
      }
      return;
    }
    let value = '';
    for (let i = 0, len = h.length; i < len; i++) {
      const item = h[i];
      if (item.schema && item.schema.enabled === false) {
        continue;
      }
      const n = item.name || '';
      let v = item.value || '';
      if (!n && !v) {
        continue;
      }
      if (v instanceof Array) {
        v = v.join(',');
      }
      if (!v && !item.required) {
        continue;
      }
      if (value[0]) {
        value += '\n';
      }
      value += n + ': ' + v;
    }
    this.value = value;
    if (validate) {
      this.validate();
    }
  }
  /**
   * Adds documentation for headers that doesn't have it already.
   *
   * @param {Array} model View model
   */
  _autoDescribeModel(model) {
    if (this.noDocs || !model) {
      return;
    }
    model.forEach((item, index) => this._fillModelDescription(item, index));
  }
  /**
   * Queries for header information and updates header info if needed.
   *
   * @param {Object} item View model item
   * @param {Number} index Position of the item in `model` array
   */
  _fillModelDescription(item, index) {
    if (item.hasDescription || item.isCustom) {
      return;
    }
    const type = this._queryHeaderData(item.name);
    if (!type) {
      return;
    }
    const model = this.model;
    model[index].description = type.desc;
    model[index].hasDescription = true;
    model[index].schema.examples = [type.example];
    this.model = [...model];
  }
  /**
   * Queries for a header definition.
   *
   * @param {String} name header name to query
   * @return {Object|undefined} Header definition or undefined.
   */
  _queryHeaderData(name) {
    const node = this.shadowRoot.querySelector('arc-definitions');
    if (!node) {
      return;
    }
    const suggestions = node.queryHeaders(name, 'request');
    if (!suggestions) {
      return;
    }
    name = name.toLowerCase();
    return suggestions.find((i) => i.key.toLowerCase() === name);
  }

  _getValidity() {
    const form = this.shadowRoot && this.shadowRoot.querySelector('iron-form');
    return form ? form.validate() : true;
  }

  _enableCheckedHandler(e) {
    const index = Number(e.target.dataset.index);
    if (index !== index) {
      return;
    }
    this.model[index].schema.enabled = e.target.checked;
    // this.model = [...this.model];
    this._updateValue(this.autoValidate);
  }

  _nameChangeHandler(e) {
    if (!this.allowCustom) {
      return;
    }
    const index = Number(e.target.dataset.index);
    if (index !== index) {
      return;
    }
    const item = this.model[index];
    if (!item.schema.isCustom) {
      return;
    }
    this.model[index].name = e.detail.value;
    // this.model = [...this.model];
    this._updateValue(this.autoValidate);
  }

  _valueChangeHandler(e) {
    const index = Number(e.target.dataset.index);
    if (index !== index) {
      return;
    }
    this.model[index].value = e.detail.value;
    // this.model = [...this.model];
    this._updateValue(this.autoValidate);
  }

  _optionalHanlder(e) {
    this.optionalOpened = e.detail.value;
  }
}

window.customElements.define('api-headers-form', ApiHeadersForm);
