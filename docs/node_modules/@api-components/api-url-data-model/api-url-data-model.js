import { LitElement, html, css } from 'lit-element';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
/**
 * `api-url-data-model`
 * An element to generate view model for api-url-editor and api-url-params-editor
 * elements from AMF model
 *
 * The component computes all required values from AMF's WebApi model.
 *
 * When using partial query model the `server`, `protocols`, and `version`
 * model must be set manually as partial model won't have this information.
 *
 * After reseting the model to full AMF WebApi model the values are updated.
 *
 * @customElement
 * @demo demo/index.html
 * @appliesMixin AmfHelperMixin
 * @memberof ApiElements
 */
class ApiUrlDataModel extends AmfHelperMixin(LitElement) {
  static get styles() {
    return css`:host {display: none !important;}`;
  }

  render() {
    const { aware } = this;
    return html`
    ${aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" .scope="${aware}"></raml-aware>` : undefined}`;
  }

  static get properties() {
    return {
      /**
       * Name of the scope to use with `raml-aware`.
       * If this element is used with other aware elements, it updates
       * `webApi` when aware value change.
       */
      aware: { type: String },
      /**
       * A value to override API's base URI.
       */
      apiUri: { type: String },
      /**
       * The `@id` property of selected endpoint and method to compute
       * data models for.
       */
      selected: { type: String }
    };
  }

  get _transformer() {
    if (!this.__transformer) {
      this.__transformer = document.createElement('api-view-model-transformer');
    }
    this.__transformer.amf = this.amf;
    return this.__transformer;
  }
  /**
   * Computed value of server definition from the AMF model.
   *
   * @return {Object} AMF model part for server
   */
  get server() {
    return this._server;
  }

  set server(value) {
    const old = this._server;
    if (value === old) {
      return;
    }
    this._server = value;
    this._apiParameters = this._computeApiParameters(value, this.version);
    this._apiBaseUri = this._computeApiBaseUri(value, this.version, this.protocols, this.apiUri);
    this._endpointUri = this._computeEndpointUri(value, this.endpoint, this.apiUri, this.version);
  }
  /**
   * List of supported protocols.
   * Required to compute base URI in some cases.
   *
   * This value is computed when AMF model change.
   *
   * @return {Array<String>}
   */
  get protocols() {
    return this._protocols;
  }

  set protocols(value) {
    // Note, partial model requires this setter to work
    const old = this._protocols;
    if (value === old) {
      return;
    }
    this._protocols = value;
    this._apiBaseUri = this._computeApiBaseUri(this.server, this.version, value, this.apiUri);
  }
  /**
   * API version name.
   * Computed when AMF model change
   *
   * @return {String}
   */
  get version() {
    return this._version;
  }

  set version(value) {
    // Note, partial model requires this setter to work
    const old = this._version;
    if (value === old) {
      return;
    }
    this._version = value;
    this._apiParameters = this._computeApiParameters(this.server, value);
    this._apiBaseUri = this._computeApiBaseUri(this.server, value, this.protocols, this.apiUri);
    this._endpointUri = this._computeEndpointUri(this.server, this.endpoint, this.apiUri, value);
  }

  get selected() {
    return this._selected;
  }
  /**
   * The `@id` property of selected endpoint and method to compute
   * data models for.
   *
   * @param {String} value
   */
  set selected(value) {
    const old = this._selected;
    if (value === old) {
      return;
    }
    this._selected = value;
    this._computeModelEndpointModel();
    this._computeMethodAmf();
  }
  /**
   * @return {String} previously set `apiUri` value.
   */
  get apiUri() {
    return this._apiUri;
  }
  /**
   * A property to set to override AMF's model base URI information.
   * When this property is set, the `endpointUri` property is recalculated.
   *
   * @param {String} value
   */
  set apiUri(value) {
    const old = this._apiUri;
    if (value === old) {
      return;
    }
    this._apiUri = value;
    this._apiBaseUri = this._computeApiBaseUri(this.server, this.version, this.protocols, value);
    this._endpointUri = this._computeEndpointUri(this.server, this.endpoint, value, this.version);
  }
  /**
   * Computed view model for API uri parameters.
   *
   * @return {Array<Object>}
   */
  get apiParameters() {
    return this._apiParameters;
  }

  get _apiParameters() {
    return this.__apiParameters;
  }

  set _apiParameters(value) {
    const old = this.__apiParameters;
    if (old === value) {
      return;
    }
    this.__apiParameters = value;
    this._pathModel = this._computePathModel(this.endpoint, this.method, value);
    this.dispatchEvent(new CustomEvent('apiparameters-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @return {String} Computed value of API base URI.
   */
  get apiBaseUri() {
    return this._apiBaseUri;
  }

  get _apiBaseUri() {
    return this.__apiBaseUri;
  }

  set _apiBaseUri(value) {
    const old = this.__apiBaseUri;
    if (old === value) {
      return;
    }
    this.__apiBaseUri = value;
    this.dispatchEvent(new CustomEvent('apibaseuri-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * Computed model of HTTP method.
   *
   * @return {?Object} AMF's supported operation model for selected method (if any).
   */
  get method() {
    return this._method;
  }

  get _method() {
    return this.__method;
  }

  set _method(value) {
    const old = this.__method;
    if (old === value) {
      return;
    }
    this.__method = value;
    this._queryModel = this._computeQueryModel(value);
    this._pathModel = this._computePathModel(this.endpoint, value, this.apiParameters);
  }
  /**
   * @return {Array<Object>} Generated view model for query parameters.
   */
  get queryModel() {
    return this._queryModel;
  }

  get _queryModel() {
    return this.__queryModel;
  }

  set _queryModel(value) {
    const old = this.__queryModel;
    if (old === value) {
      return;
    }
    this.__queryModel = value;
    this.dispatchEvent(new CustomEvent('querymodel-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @return {Array<Object>} Generated view model for path parameters
   */
  get pathModel() {
    return this._pathModel;
  }

  get _pathModel() {
    return this.__pathModel;
  }

  set _pathModel(value) {
    const old = this.__pathModel;
    if (old === value) {
      return;
    }
    this.__pathModel = value;
    this.dispatchEvent(new CustomEvent('pathmodel-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * Computed model of selected endpoint.
   * @return {Object} AMF model part describing an endpoint
   */
  get endpoint() {
    return this._endpoint;
  }

  get _endpoint() {
    return this.__endpoint;
  }

  set _endpoint(value) {
    const old = this.__endpoint;
    if (old === value) {
      return;
    }
    this.__endpoint = value;
    this._pathModel = this._computePathModel(value, this.method, this.apiParameters);
    this._endpointUri = this._computeEndpointUri(this.server, value, this.apiUri, this.version);
    this._endpointPath = this._computeEndpointPath(value);
  }
  /**
   * @return {String} Computed value of full endpoint URI when selection has been made.
   */
  get endpointUri() {
    return this._endpointUri;
  }

  get _endpointUri() {
    return this.__endpointUri;
  }

  set _endpointUri(value) {
    const old = this.__endpointUri;
    if (old === value) {
      return;
    }
    this.__endpointUri = value;
    this.dispatchEvent(new CustomEvent('endpointuri-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @return {String} Selected endponit relative path.
   */
  get endpointPath() {
    return this._endpointPath;
  }

  get _endpointPath() {
    return this.__endpointPath;
  }

  set _endpointPath(value) {
    const old = this.__endpointPath;
    if (old === value) {
      return;
    }
    this.__endpointPath = value;
    this.dispatchEvent(new CustomEvent('endpointpath-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @return {Function} Previously registered handler for `apiparameters-changed` event
   */
  get onapiparameters() {
    return this['_onapiparameters-changed'];
  }
  /**
   * Registers a callback function for `apiparameters-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onapiparameters(value) {
    this._registerCallback('apiparameters-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `apibaseuri-changed` event
   */
  get onapibaseuri() {
    return this['_onapibaseuri-changed'];
  }
  /**
   * Registers a callback function for `apibaseuri-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onapibaseuri(value) {
    this._registerCallback('apibaseuri-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `querymodel-changed` event
   */
  get onquerymodel() {
    return this['_onquerymodel-changed'];
  }
  /**
   * Registers a callback function for `querymodel-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onquerymodel(value) {
    this._registerCallback('querymodel-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `pathmodel-changed` event
   */
  get onpathmodel() {
    return this['_onpathmodel-changed'];
  }
  /**
   * Registers a callback function for `pathmodel-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onpathmodel(value) {
    this._registerCallback('pathmodel-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `endpointuri-changed` event
   */
  get onendpointuri() {
    return this['_onendpointuri-changed'];
  }
  /**
   * Registers a callback function for `endpointuri-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onendpointuri(value) {
    this._registerCallback('endpointuri-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `endpointpath-changed` event
   */
  get onendpointpath() {
    return this['_onendpointpath-changed'];
  }
  /**
   * Registers a callback function for `endpointpath-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onendpointpath(value) {
    this._registerCallback('endpointpath-changed', value);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.hasAttribute('aria-hidden')) {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    if (this.__transformer) {
      this.__transformer = null;
    }
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
  // overrides AmfHelperMixin.__amfChanged
  __amfChanged(amf) {
    this._computeModelEndpointModel();
    this._computeMethodAmf();
    this._amfChanged(amf);
  }
  /**
   * Computes values for `server`, `version`, and `protocol` properties if the
   * model is a web api model.
   * @param {Object} model The AMF model.
   */
  _amfChanged(model) {
    if (model instanceof Array) {
      model = model[0];
    }
    if (!model || !this._hasType(model, this.ns.raml.vocabularies.document + 'Document')) {
      return;
    }
    const server = this._computeServer(model);
    const version = this._computeApiVersion(model);
    const protocols = this._computeProtocols(model);
    this.server = server;
    this.protocols = protocols;
    this.version = version;
  }
  /**
   * Computes `apiBaseUri` property when `amf` change.
   *
   * @param {Object} server Server definition model
   * @param {?String} version API version number
   * @param {?Array<String>} protocols List of supported protocols.
   * @param {?String} apiUri A uri to override APIs base uri
   * @return {String}
   */
  _computeApiBaseUri(server, version, protocols, apiUri) {
    let uri = this._getBaseUri(apiUri, server, protocols);
    if (!uri) {
      return;
    }
    if (version && uri.indexOf('{version}') !== -1) {
      uri = uri.replace('{version}', version);
    }
    const lastIndex = uri.length - 1;
    if (uri[lastIndex] === '/') {
      uri = uri.substr(0, lastIndex);
    }
    return uri;
  }
  /**
   * Computes uri paramerters lsit for API base.
   * If `version` is set it eliminates it from the variables if it's set.
   *
   * @param {Object} server The `http://raml.org/vocabularies/http#server`
   * object
   * @param {?String} version API version number
   * @return {Array<Object>} A view model.
   */
  _computeApiParameters(server, version) {
    if (!server) {
      return [];
    }
    const variables = this._computeServerVariables(server);
    if (!variables || !variables.length) {
      return [];
    }
    if (version) {
      for (let i = variables.length - 1; i >=0; i--) {
        const name = this._getValue(variables[i], this.ns.schema.schemaName);
        if (name === 'version') {
          variables.splice(i, 1);
          break;
        }
      }
    }
    let model = this._transformer.computeViewModel(variables);
    if (model && model.length) {
      model = Array.from(model);
    } else {
      model = undefined;
    }
    return model;
  }
  /**
   * Computes combined list of path parameters from server definition
   * (RAML's base URI) and current path variables.
   * @param {Object} endpoint Endpoint model
   * @param {Object} method Method model
   * @param {?Array<Object>} apiParameters Current value of API parameters
   * @return {Array<Object>}
   */
  _computePathModel(endpoint, method, apiParameters) {
    if (!endpoint) {
      return;
    }
    let params = this._computeQueryParameters(endpoint);
    if (!params || !params.length) {
      params = this._uriParamsFromMethod(method);
      if (!params) {
        return apiParameters;
      }
    }
    let model = this._transformer.computeViewModel(params);
    if (!model) {
      model = [];
    }
    if (apiParameters && apiParameters[0]) {
      model = Array.from(apiParameters).concat(model);
    }
    return model;
  }
  /**
   * Finds URI parameters in method definition.
   * @param {Object} method Method model
   * @return {Array<Object>|undefined}
   */
  _uriParamsFromMethod(method) {
    if (!method) {
      return;
    }
    const request = this._computeExpects(method);
    if (!request) {
      return;
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.http + 'uriParameter');
    const params = this._ensureArray(request[key]);
    return params && params.length ? params : undefined;
  }
  /**
   * Computes value for `queryModel` property.
   *
   * @param {Object} method Supported operation model
   * @return {Array<Object>}
   */
  _computeQueryModel(method) {
    if (!method) {
      return [];
    }
    const request = this._computeExpects(method);
    if (!request) {
      return [];
    }
    const params = this._computeQueryParameters(request);
    if (!params) {
      return [];
    }
    let data = this._transformer.computeViewModel(params);
    if (data && data.length) {
      data = Array.from(data);
    } else {
      data = [];
    }
    return data;
  }
  /**
   * Computes endpoint's path value
   * @param {Object} endpoint Endpoint model
   * @return {String}
   */
  _computeEndpointPath(endpoint) {
    return this._getValue(endpoint, this.ns.raml.vocabularies.http + 'path');
  }
  /**
   * Computes value of endpoint model.
   *
   * The selection (id) can be for endpoint or for a method.
   * This tries endpoint first and then method.
   *
   * The operation result is set on `_endpoint` property.
   *
   * @param {Object} api WebApi or EndPoint AMF shape.
   * @param {String} id Endpoint/method selection
   */
  _computeModelEndpointModel() {
    const { selected } = this;
    let { amf } = this;
    if (!amf) {
      this._endpoint = undefined;
      return;
    }
    if (amf instanceof Array) {
      amf = amf[0];
    }
    if (this._hasType(amf, this.ns.raml.vocabularies.http + 'EndPoint')) {
      this._endpoint = amf;
      return;
    }
    const webApi = this._computeWebApi(amf);
    if (!webApi || !selected) {
      this._endpoint = undefined;
      return;
    }
    let model = this._computeEndpointModel(webApi, selected);
    if (model) {
      this._endpoint = model;
      return;
    }
    model = this._computeMethodModel(webApi, selected);
    if (!model) {
      this._endpoint = undefined;
      return;
    }
    const result = this._computeMethodEndpoint(webApi, model['@id']);
    this._endpoint = result;
  }

  _computeMethodAmf() {
    const { selected } = this;
    let { amf } = this;
    if (!amf || !selected) {
      this._method = undefined;
      return;
    }
    if (amf instanceof Array) {
      amf = amf[0];
    }
    if (this._hasType(amf, this.ns.raml.vocabularies.document + 'Document')) {
      const webApi = this._computeWebApi(amf);
      const model = this._computeMethodModel(webApi, selected);
      this._method = model;
      return;
    }
    const key = this._getAmfKey(this.ns.w3.hydra.supportedOperation);
    const methods = this._ensureArray(amf[key]);
    if (!methods) {
      this._method = undefined;
      return;
    }
    for (let i = 0; i < methods.length; i++) {
      if (methods[i]['@id'] === selected) {
        this._method = methods[i];
        return;
      }
    }
    this._method = undefined;
  }

  _apiChangedHandler(e) {
    const { value } = e.detail;
    this.amf = value;
  }
}
window.customElements.define('api-url-data-model', ApiUrlDataModel);
