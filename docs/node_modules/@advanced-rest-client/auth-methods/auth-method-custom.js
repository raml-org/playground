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
import { html, css } from 'lit-element';
import { AuthMethodBase } from './auth-method-base.js';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import formStyles from '@api-components/api-form-mixin/api-form-styles.js';
import authStyles from './auth-methods-styles.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@polymer/iron-form/iron-form.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import '@api-components/api-property-form-item/api-property-form-item.js';
/**
 * The `<auth-method-custom>` element displays a form to provide the
 * authorization details for RAML's custom security scheme.
 *
 * The element, alike other auth methods, dispatches `auth-settings-changed`
 * custom event. However, it also sends `request-header-changed` and
 * `query-parameters-changed` custom event to directly manipulate values
 * in corresponding UI element. This events are supported with all API components
 * that handles headers or query parameters.
 *
 * This element is rendered empty if `amfSettings` property is not set.
 * Parent element or application should check if model contains the scheme.
 *
 * ### Example
 *
 * ```html
 * <auth-method-custom securityscheme="{...}"></auth-method-custom>
 * ```
 *
 * @customElement
 * @memberof UiElements
 * @appliesMixin AmfHelperMixin
 * @demo demo/custom.html
 * @extends AuthMethodBase
 */
class AuthMethodCustom extends AmfHelperMixin(AuthMethodBase) {
  static get styles() {
    return [
      markdownStyles,
      formStyles,
      authStyles,
      css`
      :host {
        display: block;
      }

      .field-value {
        display: flex;
        flex-direction: row;
        flex: 1;
        align-items: center;
      }

      api-property-form-item {
        flex: 1;
      }

      .subtitle {
        display: flex;
        flex-direction: row;
        align-items: center;
      }`
    ];
  }

  render() {
    const {
      _schemeName,
      _schemeDescription,
      _hasSchemeDescription,
      outlined,
      compatibility,
      documentationOpened
    } = this;
    return html`
      <section>
        ${_schemeName ? html`<div class="scheme-header">
          <div class="subtitle">
            <span>Scheme: ${_schemeName}</span>
            ${_hasSchemeDescription ? html`<anypoint-icon-button
              class="hint-icon"
              title="Toggle description"
              aria-label="Press to toggle schema description"
              ?outlined="${outlined}"
              ?compatibility="${compatibility}"
              @click="${this.toggleSchemeDocumentation}">
              <iron-icon icon="arc:help"></iron-icon>
            </anypoint-icon-button>` : ''}
          </div>
          ${_hasSchemeDescription && documentationOpened ? html`<div class="docs-container">
            <arc-marked .markdown="${_schemeDescription}" main-docs>
              <div slot="markdown-html" class="markdown-body"></div>
            </arc-marked>
          </div>` : ''}
        </div>` : ''}

        <iron-form>
          <form autocomplete="on">
            ${this._getHeadersTemplate()}
            ${this._getQueryTemplate()}
          </form>
        </iron-form>
      </section>`;
  }

  static get properties() {
    return {
      /**
       * AMF security scheme model.
       */
      amfSettings: { type: Object },
      /**
       * Computed list of headers to render in the form.
       */
      _headers: { type: Array },
      /**
       * Computed list of query parameters to render.
       */
      _queryParameters: { type: Array },
      /**
       * Name of the security scheme
       */
      _schemeName: { type: String },
      /**
       * Security scheme description
       */
      _schemeDescription: { type: String },
      /**
       * True to opend scheme descripyion, if available.
       */
      documentationOpened: { type: Boolean }
    };
  }

  get _hasSchemeDescription() {
    if (this.noDocs) {
      return false;
    }
    return !!this._schemeDescription;
  }

  get amfSettings() {
    return this._amfSettings;
  }

  set amfSettings(value) {
    /* istanbul ignore else */
    if (this._sop('amfSettings', value)) {
      this._schemeChanged();
    }
  }

  get _transformer() {
    if (!this.__transformer) {
      this.__transformer = document.createElement('api-view-model-transformer');
    }
    return this.__transformer;
  }

  constructor() {
    super('x-custom');
    this._headerChangedHandler = this._headerChangedHandler.bind(this);
    this._parameterChangedHandler = this._parameterChangedHandler.bind(this);
  }

  disconnectedCallback() {
    /* istanbul ignore else */
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.__transformer = null;
  }

  firstUpdated() {
    this._settingsChanged();
  }

  _attachListeners(node) {
    node.addEventListener('request-header-changed', this._headerChangedHandler);
    node.addEventListener('query-parameter-changed', this._parameterChangedHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('request-header-changed', this._headerChangedHandler);
    node.removeEventListener('query-parameter-changed', this._parameterChangedHandler);
  }
  /**
   * Overrides `AmfHelperMixin.__amfChanged`
   */
  __amfChanged() {
    this._schemeChanged();
  }

  _getHeadersTemplate() {
    return this._formListTemplate(this._headers, 'header');
  }

  _getQueryTemplate() {
    return this._formListTemplate(this._queryParameters, 'query');
  }

  _formListTemplate(items, type) {
    if (!items || !items.length) {
      return '';
    }
    const {
      outlined,
      compatibility,
      readOnly,
      disabled,
      noDocs
    } = this;
    return html`<section>
    ${items.map((item, index) =>
    this._formItemTemplate(item, index, outlined, compatibility, readOnly, disabled, noDocs, type))}
    </section>`;
  }

  _formItemTemplate(item, index, outlined, compatibility, readOnly, disabled, noDocs, type) {
    return html`<div class="field-value">
      <api-property-form-item
        .model="${item}"
        .value="${item.value}"
        name="${item.name}"
        ?readonly="${readOnly}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?disabled="${disabled}"
        data-type="${type}"
        data-index="${index}"
        @value-changed="${this._inputValueChanged}"></api-property-form-item>
        ${item.hasDescription && !noDocs ? html`<anypoint-icon-button
          class="hint-icon"
          title="Toggle description"
          aria-label="Press to toggle description"
          data-type="${type}"
          data-index="${index}"
          @click="${this._toggleDocumentation}">
          <iron-icon icon="arc:help"></iron-icon>
        </anypoint-icon-button>` : undefined}
    </div>
    ${item.hasDescription && !noDocs && item.docsOpened ? html`<div class="docs-container">
      <arc-marked .markdown="${item.description}">
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>` : ''}`;
  }

  /**
   * Validates the form.
   *
   * @return {Boolean} `true` if valid, `false` otherwise.
   */
  validate() {
    const form = this.shadowRoot.querySelector('iron-form');
    /* istanbul ignore if */
    if (!form) {
      return true;
    }
    return form.validate();
  }

  _schemeChanged() {
    if (this.__schemeChangeDebouncer) {
      return;
    }
    this.__schemeChangeDebouncer = true;
    setTimeout(() => {
      this.__schemeChangeDebouncer = false;
      this.__schemeChanged(this.amfSettings);
    });
  }

  __schemeChanged() {
    const model = this.amfSettings;
    const prefix = this.ns.raml.vocabularies.security;
    this._headers = undefined;
    this._queryParameters = undefined;
    if (!this._hasType(model, this.ns.raml.vocabularies.security + 'ParametrizedSecurityScheme')) {
      return;
    }
    const shKey = this._getAmfKey(prefix + 'scheme');
    let scheme = model[shKey];
    let type;
    if (scheme) {
      if (scheme instanceof Array) {
        scheme = scheme[0];
      }
      type = this._getValue(scheme, prefix + 'type');
    }
    if (!type || type.indexOf('x-') !== 0) {
      return;
    }
    const hKey = this._getAmfKey(this.ns.raml.vocabularies.http + 'header');
    this._createViewModel('header', this._ensureArray(scheme[hKey]));
    const params = this._readParamsProperties(scheme);
    this._createViewModel('parameter', params);
    this._schemeName = this._getValue(model, prefix + 'name');
    this._schemeDescription = this._getValue(scheme, this.ns.schema.desc);
    this._settingsChanged();
  }

  _readParamsProperties(scheme) {
    const pKey = this._getAmfKey(this.ns.raml.vocabularies.http + 'parameter');
    let result = this._ensureArray(scheme[pKey]);
    if (result) {
      return result;
    }
    const qKey = this._getAmfKey(this.ns.raml.vocabularies.http + 'queryString');
    result = this._ensureArray(scheme[qKey]);
    if (result) {
      result = result[0];
    }
    return result;
  }
  /**
   * Generates view model using the tranformer.
   *
   * @param {String} type Param type. Either `header` or `parameter`.
   * @param {Array} model
   */
  _createViewModel(type, model) {
    if (!model) {
      return;
    }
    const factory = this._transformer;
    factory.amf = this.amf;
    const data = factory.computeViewModel(model);
    if (!data) {
      return;
    }
    if (type === 'header') {
      this._headers = data;
      this._notifyModelChanged(type, data);
    } else if (type === 'parameter') {
      this._queryParameters = data;
      this._notifyModelChanged(type, data);
    }
  }
  /**
   * Returns current configuration of the OAuth2.
   *
   * @return {Object} Current OAuth2 configuration.
   */
  getSettings() {
    const form = this.shadowRoot.querySelector('iron-form');
    if (!form) {
      return {};
    }
    return form.serializeForm();
  }
  /**
   * Toggles documentartion for custom property.
   *
   * @param {CustomEvent} e
   */
  _toggleDocumentation(e) {
    const index = Number(e.currentTarget.dataset.index);
    const type = e.currentTarget.dataset.type;
    if (index !== index || !type) {
      return;
    }
    const model = type === 'query' ? this._queryParameters : this._headers;
    model[index].docsOpened = !model[index].docsOpened;
    this.requestUpdate();
  }
  /**
   * Toggles docs opened state
   */
  toggleSchemeDocumentation() {
    this.documentationOpened = !this.documentationOpened;
  }
  /**
   * Handler for the `request-header-changed` event.
   * It updates value for a single header if this header is already on the list.
   * @param {CustomEvent} e
   */
  _headerChangedHandler(e) {
    this._updateEventValue(e, this._headers);
  }
  /**
   * Handler for the `query-parameter-changed` event.
   * It updates value for a single parameter if this parameter is already on the list.
   * @param {CustomEvent} e
   */
  _parameterChangedHandler(e) {
    this._updateEventValue(e, this._queryParameters);
  }
  /**
   * Update array value for given type (`headers` or `queryParameters`) for given event.
   * @param {CustomEvent} e
   * @param {Array} model Model to use to update the value.
   */
  _updateEventValue(e, model) {
    if (!model || !model.length) {
      return;
    }
    const target = this._getEventTarget(e);
    if (target === this || e.defaultPrevented) {
      return;
    }
    const name = e.detail.name;
    if (!name || typeof name !== 'string') {
      return;
    }
    for (let i = 0, len = model.length; i < len; i++) {
      const pName = model[i].name;
      if (!pName) {
        continue;
      }
      if (pName === name) {
        model[i].value = e.detail.value;
        this.requestUpdate();
        this._settingsChanged();
        return;
      }
    }
  }
  /**
   * Handler for the `value-changed` event disaptched by input element.
   * Dispatches 'request-header-changed' or 'query-parameter-changed'
   * event. Other components can update their state when the value change.
   *
   * @param {CustomEvent} e
   */
  _inputValueChanged(e) {
    const index = Number(e.target.dataset.index);
    const type = e.target.dataset.type;
    if (index !== index || !type) {
      return;
    }
    const model = type === 'query' ? this._queryParameters : this._headers;
    const { name } = model[index];
    const { value } = e.detail;
    model[index].value = value;
    this.__isInputEvent = true;
    this._settingsChanged();
    this.__isInputEvent = false;
    this._dispatchParamChanged(type, name, value);
  }
  /**
   * Dispatches header/query parameter changed event - depending on the type.
   * @param {String} type `header` or `query`
   * @param {String} name name of the property
   * @param {String} value changed value
   */
  _dispatchParamChanged(type, name, value) {
    const eventType = type === 'header' ? 'request-header-changed' : 'query-parameter-changed';
    this.dispatchEvent(new CustomEvent(eventType, {
      detail: {
        name,
        value
      },
      bubbles: true,
      composed: true
    }));
  }
  /**
   * Calls `_dispatchParamChanged()` on each item to notify other editors about
   * value change.
   * @param {String} type Changed type.
   * @param {String} data View model
   */
  _notifyModelChanged(type, data) {
    if (!data || !data.length) {
      return;
    }
    data.forEach((item) => this._dispatchParamChanged(type, item.name, item.value));
  }
  /**
   * Fired when the any of the auth method settings has changed.
   * This event will be fired quite frequently - each time anything in the text field changed.
   * With one exception. This event will not be fired if the validation of the form didn't passed.
   *
   * @event auth-settings-changed
   * @param {Object} settings Current settings containing hash, password
   * and username.
   * @param {String} type The authorization type - x-custom
   * @param {Boolean} valid True if the form has been validated.
   * @param {String} name Name of the custom method to differeciante them if many.
   */
  /**
   * Fired when the header value has changed.
   *
   * @event request-header-changed
   * @param {String} name Name of the header
   * @param {String} value Value of the header
   */
  /**
   * Fired when the header value has changed.
   *
   * @event query-parameter-changed
   * @param {String} name Name of the parameter
   * @param {String} value Value of the parameter
   */
}
window.customElements.define('auth-method-custom', AuthMethodCustom);
