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
import { html, css, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import { PayloadParserMixin } from '@advanced-rest-client/payload-parser-mixin/payload-parser-mixin.js';
import { ApiFormMixin } from '@api-components/api-form-mixin/api-form-mixin.js';
import formStyles from '@api-components/api-form-mixin/api-form-styles.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@polymer/iron-form/iron-form.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import './form-data-editor-item.js';
/**
 * An element to edit form data (x-www-form-urlencoded).
 * @customElement
 * @demo demo/index.html
 * @appliesMixin ValidatableMixin
 * @appliesMixin ApiFormMixin
 * @appliesMixin PayloadParserBehavior
 * @memberof UiElements
 */
class FormDataEditor extends PayloadParserMixin(ValidatableMixin(ApiFormMixin(LitElement))) {
  static get styles() {
    return [
      formStyles,
      css`:host {
        display: block;
      }

      .form-item-row {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      form-data-editor-item {
        flex: 1;
      }

      .option-pane {
        margin: 8px 0;
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      `
    ];
  }

  _formRowTemplate(item, index) {
    const {
      allowHideOptional,
      optionalOpened,
      allowDisableParams,
      readOnly,
      disabled,
      compatibility,
      outlined,
      narrow,
      noDocs,
      hasOptional
    } = this;
    const rowClass = this._computeItemClass(item, narrow, allowHideOptional, optionalOpened, allowDisableParams);
    const isOptional = this.computeIsOptional(hasOptional, item);
    return html`<div
      class="${rowClass}"
      ?data-optional="${isOptional}">

      ${allowDisableParams ? html`
      <anypoint-checkbox
        class="enable-checkbox"
        ?checked="${item.schema.enabled}"
        data-index="${index}"
        ?data-array="${item.schema.isArray}"
        @checked-changed="${this._enableCheckedHandler}"
        title="Enable or disable this parameter"
        aria-label="Toggle to enable or disable this parameter"
        ?disabled="${readOnly || disabled}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"></anypoint-checkbox>` : undefined}

      <form-data-editor-item
        data-index="${index}"
        .narrow="${narrow}"
        .name="${item.name}"
        .value="${item.value}"
        .model="${item}"
        .noDocs="${noDocs}"
        .required="${item.required}"
        .disabled="${disabled}"
        .readOnly="${readOnly}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        .isCustom="${item.schema.isCustom}"
        .isArray="${item.schema.isArray}"
        @remove="${this._removeCustom}"
        @value-changed="${this._valueChangeHanlder}"
        @name-changed="${this._nameChangeHanlder}"></form-data-editor-item>
    </div>`;
  }

  render() {
    const {
      renderOptionalCheckbox,
      optionalOpened,
      allowCustom,
      readOnly,
      disabled
    } = this;
    let { model } = this;
    if (!model) {
      model = [];
    }
    const encButtonsEmphasis = allowCustom ? 'low' : 'medium';
    return html`
    <div class="option-pane">
      ${allowCustom ? html`<div class="add-action">
        <anypoint-button
          class="action-button"
          emphasis="medium"
          @click="${this.add}"
          title="Add new parameter"
          aria-label="Press to create a new parameter"
          ?disabled="${readOnly || disabled}">
          <iron-icon
            class="action-icon"
            icon="arc:add-circle-outline"
            alt="Add parameter icon"></iron-icon>
          Add parameter
        </anypoint-button>
      </div>` : undefined}

      <anypoint-button
        title="Encodes payload to x-www-form-urlencoded data"
        aria-label="Press to encode form values"
        emphasis="${encButtonsEmphasis}"
        @click="${this._encodePaylod}"
        ?disabled="${readOnly || disabled}">
        Encode payload
      </anypoint-button>

      <anypoint-button
        title="Decodes payload to human readable form"
        aria-label="Press to decode form values"
        emphasis="${encButtonsEmphasis}"
        @click="${this._decodePaylod}"
        ?disabled="${readOnly || disabled}">
        Decode payload
      </anypoint-button>

      <slot name="content-action"></slot>
    </div>

    ${renderOptionalCheckbox ? html`<div class="optional-checkbox">
      <anypoint-checkbox
        class="toggle-checkbox"
        .checked="${optionalOpened}"
        @checked-changed="${this._optionalHanlder}"
        title="Toggles optional parameters">
        Show optional parameters
      </anypoint-checkbox>
    </div>` : undefined}

    <iron-form>
      <form enctype="application/json">
        ${model.map((item, index) => this._formRowTemplate(item, index))}
      </form>
    </iron-form>

    ${model.length === 0 && !allowCustom ?
      html`<p>This endpoint does not declare body properties</p>` : ''}

    ${model.length !== 0 && allowCustom ?
      html`<anypoint-button
        class="action-button"
        @click="${this.add}"
        title="Add new parameter"
        aria-label="Press to create a new parameter"
        ?disabled="${readOnly || disabled}">
        <iron-icon
          class="action-icon"
          icon="arc:add-circle-outline"
          alt="Add parameter icon"></iron-icon>
        Add next
      </anypoint-button>` : ''}
    `;
  }

  static get properties() {
    return {
      /**
       * The editor value
       */
      value: { type: String },
      /**
       * Prohibits rendering of the documentation (the icon and the
       * description).
       */
      noDocs: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * @deprecated Use `compatibility` instead
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
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  get model() {
    return this._model;
  }

  set model(value) {
    if (this._sop('model', value)) {
      this._notifyChanged('model', value);
      this.renderEmptyMessage = this._computeRenderEmptyMessage(this.allowCustom, value);
      this.hasOptional = this._computeHasOptionalParameters(this.allowHideOptional, value);
      this._updateValue();
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if (this._sop('value', value)) {
      this._notifyChanged('value', value);
      this._valueChanged(value);
    }
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
   * @return {Function} Previously registered handler for `value-changed` event
   */
  get onchange() {
    return this['_onvalue-changed'];
  }
  /**
   * Registers a callback function for `value-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onchange(value) {
    this._registerCallback('value-changed', value);
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
    if (!this.model || !this.model.length) {
      this.add();
    }
  }
  /**
   * Appends an empty header to the list.
   */
  add() {
    if (!this.allowCustom) {
      return;
    }
    this.addCustom('query', {
      inputLabel: 'Parameter value'
    });

    setTimeout(() => this.focusLast());
  }
  /**
   * Focuses on last added item.
   */
  focusLast() {
    const node = this.shadowRoot.querySelector('.form-item:last-child form-data-editor-item');
    if (node) {
      node.focus();
    }
  }
  /**
   * Encodes the payload
   */
  _encodePaylod() {
    this.encodeUrlEncoded(this.model);
    this.requestUpdate();
  }

  /**
   * Decodes the payload
   */
  _decodePaylod() {
    this.decodeUrlEncoded(this.model);
    this.requestUpdate();
  }
  /**
   * Computes for item class.
   *
   * @param {Object} item Model for form item
   * @param {Boolean} narrow
   * @param {Boolean} allowHideOptional
   * @param {Boolean} optionalOpened
   * @param {Boolean} allowDisableParams
   * @return {String}
   */
  _computeItemClass(item, narrow, allowHideOptional, optionalOpened, allowDisableParams) {
    let cls = 'form-item form-item-row ';
    cls += this.computeFormRowClass(item, allowHideOptional, optionalOpened, allowDisableParams);
    if (item && item.schema.isCustom) {
      cls += ' is-custom';
    }
    if (narrow) {
      cls += ' is-narrow';
    }
    return cls;
  }
  /**
   * Updates the value when model changes.
   */
  _updateValue() {
    const { model } = this;
    const hasModel = !!(model && model.length);
    const value = hasModel ? this.formArrayToString(model) : '';
    this.__internalChange = true;
    this.value = value;
    this.__internalChange = false;
  }
  /**
   * Updates the model from value, if not cause by internal setters.
   *
   * @param {String} value
   */
  _valueChanged(value) {
    if (this.__internalChange) {
      return;
    }
    this.model = undefined;
    const params = this.stringToArray(value);
    if (!params || !params.length) {
      return;
    }
    params.forEach((item) => this._paramToModel(item));
  }
  /**
   * Creates a model item from parser's name => value pairs.
   *
   * @param {Object} param Object with `value` and `name` properties.
   */
  _paramToModel(param) {
    const name = this.decodeQueryString(param.name);
    const value = this.decodeQueryString(param.value);
    this.addCustom('query', {
      inputLabel: 'Parameter value',
      name: name,
      value: value
    });
  }

  _optionalHanlder(e) {
    this.optionalOpened = e.detail.value;
  }

  _enableCheckedHandler(e) {
    const index = Number(e.target.dataset.index);
    /* istanbul ignore if  */
    if (index !== index) {
      return;
    }
    const { checked } = e.target;
    // const old = this.model[index].schema.enabled;
    this.model[index].schema.enabled = checked;
    this._updateValue();
  }

  _valueChangeHanlder(e) {
    const index = Number(e.target.dataset.index);
    /* istanbul ignore if  */
    if (index !== index) {
      return;
    }
    const { value } = e.detail;
    this.model[index].value = value;
    this._updateValue();
  }

  _nameChangeHanlder(e) {
    const index = Number(e.target.dataset.index);
    /* istanbul ignore if  */
    if (index !== index) {
      return;
    }
    const { value } = e.detail;
    this.model[index].name = value;
    this._updateValue();
  }
}
window.customElements.define('form-data-editor', FormDataEditor);
