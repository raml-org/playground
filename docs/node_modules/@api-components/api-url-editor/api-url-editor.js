import { html, css, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';

/**
 * `api-url-editor`
 * An AMF powered url editor for the HTTP request editor.
 *
 * The element is regular input element that is adjusted to work with URL
 * data.
 * It supports validation for URL values that may contain variables.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @appliesMixin EventsTargetMixin
 * @appliesMixin ValidatableMixin
 * @memberof ApiElements
 */
class ApiUrlEditor extends EventsTargetMixin(ValidatableMixin(LitElement)) {
  static get styles() {
    return css`:host {
      display: flex;
    }

    anypoint-input {
      flex: 1;
    }`;
  }

  render() {
    const {
      noLabelFloat,
      disabled,
      readOnly,
      invalid,
      outlined,
      compatibility,
      value,
      required
    } = this;
    return html`
    <anypoint-input
      ?nolabelfloat="${noLabelFloat}"
      ?disabled="${disabled}"
      ?readonly="${readOnly}"
      ?invalid="${invalid}"
      ?outlined="${outlined}"
      ?compatibility="${compatibility}"
      ?required="${required}"
      invalidmessage="The URL is invalid"
      type="url"
      .value="${value}"
      @blur="${this._onElementBlur}"
      @input="${this.__userInputHandler}">
      <label slot="label">Request URL</label>
    </anypoint-input>`;
  }

  get inputElement() {
    return this.shadowRoot.querySelector('anypoint-input');
  }

  static get properties() {
    return {
      /**
       * When set the input label won't float when focused/has input
       */
      noLabelFloat: { type: Boolean },
      /**
       * Renders input element disabled.
       */
      disabled: { type: Boolean },
      /**
       * When set the input is marked as required input.
       */
      required: { type: Boolean },
      /**
       * Makes the input element read only.
       */
      readOnly: { type: Boolean },
      /**
       * A value produced by this editor - the URL.
       */
      value: { type: String },
      /**
       * Value or RAML's base URI property.
       *
       * Note, the element doesn't check if `baseUri` is relative or not.
       * Hosting application have to take care of that.
       */
      baseUri: { type: String },
      /**
       * Currently selected endpoint relative URI.
       * It is available in RAML definition.
       */
      endpointPath: { type: String },
      /**
       * Computed value, sum of `baseUri` and `endpointPath`
       */
      _fullUri: { type: String },
      /**
       * The query properties model.
       * Use `api-url-data-model` to compute model for the view.
       */
      queryModel: { type: Array },
      /**
       * The URI properties model.
       * Use `api-url-data-model` to compute model for the view.
       */
      pathModel: { type: Array },
      /**
       * Computed, ordered list of URL variables in the URI string.
       */
      _urlParams: { type: Array },
      /**
       * Computed regexp for the current `_fullUri` value to search for the
       * URI parameters.
       */
      _urlSearchRegexp: { type: RegExp },
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
      outlined: { type: Boolean },
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
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._value = value;
    this.requestUpdate('value', old);
    this._onValueChanged(value);
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: {
        value
      }
    }));
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._baseUri = value;
    this._fullUri = this._computeFullUrl(value, this.endpointPath);
  }

  get endpointPath() {
    return this._endpointPath;
  }

  set endpointPath(value) {
    const old = this._endpointPath;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._endpointPath = value;
    this._fullUri = this._computeFullUrl(this.baseUri, value);
  }

  get _fullUri() {
    return this.__fullUri;
  }

  set _fullUri(value) {
    const old = this.__fullUri;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this.__fullUri = value;
    this._urlParams = this._computeUrlParams(value);
    this._urlSearchRegexp = this._computeUrlRegexp(value);
    this._computeValue(this.queryModel, this.pathModel, value);
  }

  get queryModel() {
    return this._queryModel;
  }

  set queryModel(value) {
    const old = this._queryModel;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._queryModel = value;
    this._computeValue(value, this.pathModel, this._fullUri);
    this.dispatchEvent(new CustomEvent('querymodel-changed', {
      detail: {
        value
      }
    }));
  }

  get pathModel() {
    return this._pathModel;
  }

  set pathModel(value) {
    const old = this._pathModel;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._pathModel = value;
    this._computeValue(this.queryModel, value, this._fullUri);
    this.dispatchEvent(new CustomEvent('pathmodel-changed', {
      detail: {
        value
      }
    }));
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

  constructor() {
    super();
    this._extValueChangedHandler = this._extValueChangedHandler.bind(this);
    this._focusHandler = this._focusHandler.bind(this);
    this._queryParamChangeHandler = this._queryParamChangeHandler.bind(this);
    this._uriParamChangeHandler = this._uriParamChangeHandler.bind(this);
  }

  firstUpdated() {
    this._elementReady = true;
    // If there's an initial input, validate it.
    if (this.value) {
      this.validate();
    }
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.addEventListener('focus', this._focusHandler);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.removeEventListener('focus', this._focusHandler);
  }

  _attachListeners(node) {
    node.addEventListener('url-value-changed', this._extValueChangedHandler);
    node.addEventListener('uri-parameter-changed', this._uriParamChangeHandler);
    node.addEventListener('query-parameter-changed', this._queryParamChangeHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('url-value-changed', this._extValueChangedHandler);
    node.removeEventListener('uri-parameter-changed', this._uriParamChangeHandler);
    node.removeEventListener('query-parameter-changed', this._queryParamChangeHandler);
  }

  _focusHandler() {
    const node = this.inputElement;
    if (node) {
      node.inputElement.focus();
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
  /**
   * Computes endpoint's full URI with (possibly) variables in it.
   *
   * @param {String} baseUri API base URI
   * @param {String} endpointPath Endpoint relative URI to `baseUri`
   * @return {String} A full URI for the endpoint.
   */
  _computeFullUrl(baseUri, endpointPath) {
    if (!endpointPath) {
      endpointPath = '/';
    }
    if (endpointPath[0] !== '/') {
      endpointPath = '/' + endpointPath;
    }
    if (!baseUri) {
      return endpointPath;
    }
    if (baseUri[baseUri.length - 1] === '/') {
      baseUri = baseUri.substr(0, baseUri.length - 1);
    }
    return baseUri + endpointPath;
  }
  /**
   * Computes url value from current `baseUri` and query/uri models.
   *
   * @param {Array} queryModel Query parameters model
   * @param {Array} pathModel Uri parameters model.
   * @param {String} uri Current endpoint uri.
   */
  async _computeValue(queryModel, pathModel, uri) {
    if (!uri) {
      this.value = '';
      return;
    }
    uri = this._applyUriParams(uri, pathModel);
    uri = this._applyQueryParams(uri, queryModel);
    this.value = uri;
    await this.updateComplete;
    this.validate();
  }
  /**
   * Creates a map of serialized values from a model.
   * It is a replacemenet for `iron-form` serialize function which
   * can't be used here because this function is called before local DOM
   * is ready and therefore form is not set.
   *
   * @param {Array} model Model to compute.
   * @return {Map} Map of serialized values.
   */
  _formValuesFromModel(model) {
    const result = new Map();
    if (!model || !model.length) {
      return result;
    }
    model.forEach((item) => {
      const value = this._valueFormModelItem(item);
      if (value !== undefined) {
        result.set(item.name, value);
      }
    });
    return result;
  }
  /**
   * Extracts value from the model item.
   * If the item is required it is alwats returned (even  if it is empty string).
   * If value is not required and not present then it returns `undefined`.
   *
   * @param {Object} item Model item
   * @return {String} Model value
   */
  _valueFormModelItem(item) {
    if (item.schema && item.schema.enabled === false) {
      return;
    }
    let value = item.value;
    if (!value && item.required) {
      if (value !== 0 && value !== false && value !== null) {
        value = '';
      }
    } else if (!item.required) {
      if (!value && value !== 0 && value !== false && value !== null) {
        value = undefined;
      }
    }
    return value;
  }
  /**
   * Applies URI parameters to the URL.
   *
   * @param {String} url An URL to apply the params to
   * @param {Array} model Uri parameters model.
   * @return {String} The URL.
   */
  _applyUriParams(url, model) {
    if (!model) {
      return url;
    }
    const uriParams = this._formValuesFromModel(model);
    for (let [name, value] of uriParams) {
      if (!value) {
        continue;
      }
      value = String(value);
      if (value.trim() === '') {
        continue;
      }
      if (name[0] === '+' || name[0] === '#') {
        value = encodeURI(value);
      } else {
        value = this._wwwFormUrlEncodePiece(value);
      }
      const re = this._createUrlReplaceRegex(name);
      url = url.replace(re, value);
    }
    return url;
  }
  /**
   * Creates a RegExp object to replace template variable from the base string
   * @param {String} name Name of the parameter to be replaced
   * @return {RegExp}
   */
  _createUrlReplaceRegex(name) {
    if (name[0] === '+' || name[0] === '#') {
      name = '\\' + name;
    }
    return new RegExp('{' + name + '}');
  }
  /**
   * Applies query parameters to the URL.
   * Query parameters that are not required by the API spec and don't have value
   * are removed from the URL. Parameters that are required and don't have
   * value are set to the URL but with empty value.
   *
   * @param {String} url An URL to apply the params to
   * @param {Array} model Query parameters model.
   * @return {String} The URL.
   */
  _applyQueryParams(url, model) {
    if (!model) {
      return url;
    }
    let params = this._formValuesFromModel(model);
    const items = this._computeQueryItems(params);
    params = this._wwwFormUrlEncode(items);
    if (!params) {
      return url;
    }
    url += (url.indexOf('?') === -1) ? '?' : '&';
    url += params;
    return url;
  }
  /**
   * Computes query parameters list of items containing `name` and `value`
   * properties to use to build query string.
   *
   * This function may change the `params` map.
   *
   * @param {Object} params Map of query model properties.
   * @return {Array} List of query parameters.
   */
  _computeQueryItems(params) {
    const items = [];
    for (const [name, value] of params) {
      if (value === undefined) {
        continue;
      }
      let isArray = false;
      if (value instanceof Array) {
        isArray = true;
        if (!value.length || (value.length === 1 && !value[0])) {
          continue;
        }
      }
      if (isArray) {
        for (let i = 0, len = value.length; i < len; i++) {
          if (value || value === 0 || value === false) {
            items.push({
              name: name,
              value: value[i]
            });
          }
        }
      } else {
        items.push({
          name: name,
          value: value
        });
      }
    }
    return items;
  }
  /**
   * @param {Array} object The list of objects to encode as
   * x-www-form-urlencoded string. Each entry should have `name` and `value`
   * properties.
   * @return {string} .
   */
  _wwwFormUrlEncode(object) {
    if (!object || !object.length) {
      return '';
    }
    const pieces = object.map((item) => {
      return this._wwwFormUrlEncodePiece(item.name) + '=' +
        this._wwwFormUrlEncodePiece(item.value);
    });
    return pieces.join('&');
  }
  /**
   * @param {*} str A key or value to encode as x-www-form-urlencoded.
   * @return {string} .
   */
  _wwwFormUrlEncodePiece(str) {
    // Spec says to normalize newlines to \r\n and replace %20 spaces with +.
    // jQuery does this as well, so this is likely to be widely compatible.
    if (!str) {
      return '';
    }
    return encodeURIComponent(str.toString()
        .replace(/\r?\n/g, '\r\n'))
        .replace(/%20/g, '+');
  }
  /**
   * Updates URI / query parameters model from user input.
   *
   * @param {Event} e Input event
   */
  __userInputHandler(e) {
    const value = e.target.value;
    let matches;
    const uriParams = this._urlParams;
    const uriRegexp = this._urlSearchRegexp;
    if (uriParams && uriRegexp) {
      matches = value.match(uriRegexp);
      if (matches) {
        matches.shift();
        this._applyUriValues(matches, uriParams);
      }
    }
    const matchesNew = value.match(/[^&?]*?=[^&?]*/g);
    if (matchesNew) {
      const params = {};
      matchesNew.forEach((item) => this._applyQueryParamToObject(item, params));
      this._applyQueryParamsValues(params);
    }

    this.value = value;
    this.validate();
  }
  /**
   * Applies query parameter values to an object.
   * Repeated parameters will have array value intead of string value.
   *
   * @param {String} param Query parameter value as string. Eg `name=value`
   * @param {Object} obj Target for values
   */
  _applyQueryParamToObject(param, obj) {
    if (!param || !obj || typeof param !== 'string') {
      return;
    }
    const parts = param.split('=');
    const name = parts[0];
    if (name in obj) {
      if (!(obj[name] instanceof Array)) {
        obj[name] = [obj[name]];
      }
      obj[name].push(parts[1]);
    } else {
      obj[name] = parts[1];
    }
  }
  /**
   * Applies values from the `values` array to the uri parametes which names are in the `names`
   * array.
   * Both lists are ordered list of paramerters.
   *
   * @param {Array<String>} values Values for the parameters
   * @param {Array<String>} names List of variables names (uri parameters).
   */
  _applyUriValues(values, names) {
    let changed = false;
    for (let i = 0, len = names.length; i < len; i++) {
      const value = values[i];
      if (value && value[0] === '{') {
        // This is still a variable
        continue;
      }
      const name = names[i];
      const index = this._findModelIndex(name, 'path');
      if (index !== -1) {
        if (this.pathModel[index].value !== value) {
          this.pathModel[index].value = value;
          changed = true;
        }
      }
    }
    if (changed) {
      this.pathModel = [...this.pathModel];
    }
  }
  /**
   * Applies query parameters values to the render list.
   *
   * @param {Object} map A map where keys are names of the parameters in the
   * `queryModel` list
   */
  _applyQueryParamsValues(map) {
    if (!map) {
      return;
    }
    const keys = Object.keys(map);
    let changed = false;
    keys.forEach((key) => {
      const value = map[key];
      if (value && value[0] === '{') {
        // This is still a variable
        return;
      }
      const index = this._findModelIndex(key, 'query');
      if (index !== -1) {
        if (this.queryModel[index].value !== value) {
          this.queryModel[index].value = value;
          changed = true;
        }
      }
    });
    if (changed) {
      this.queryModel = [...this.queryModel];
      changed = true;
    }
  }

  _findModelIndex(name, type) {
    const model = this[type + 'Model'];
    if (!model) {
      return -1;
    }
    return model.findIndex((item) => item.name === name);
  }
  /**
   * A handler that is called on input
   */
  _onValueChanged() {
    if (!this._elementReady || this.__cancelValueChange) {
      return;
    }
    this.fire('url-value-changed', {
      value: this.value
    });
    this.validate();
  }

  _onElementBlur() {
    this.validate();
  }
  /**
   * A handler for the `url-value-changed` event.
   * If this element is not the source of the event then it will update the `value` property.
   * It's to be used besides the Polymer's data binding system.
   *
   * @param {CustomEvent} e
   */
  _extValueChangedHandler(e) {
    if (e.composedPath()[0] === this) {
      return;
    }
    this.__cancelValueChange = true;
    this.value = e.detail.value;
    this.__cancelValueChange = false;
  }

  _getValidity() {
    const value = this.value;
    if (value === undefined) {
      return true;
    }
    if (!this.required && !value) {
      return true;
    }
    if (!value && this.required) {
      return false;
    }
    if (!value) {
      return true;
    }
    if (typeof value !== 'string') {
      return false;
    }
    if (value.indexOf('{') !== -1 && value.indexOf('}') !== -1) {
      return false;
    }
    if (!this.shadowRoot) {
      return true;
    }
    return this.inputElement.validate();
  }
  /**
   * Creates a regular expression from the `_fullUri` to match the
   * parameters in the `value` url.
   *
   * @param {String} url Enpoint's absolute URL with (possibly) parameters.
   * @return {String} A RegExp that can be used to search for parameters values.
   */
  _computeUrlRegexp(url) {
    if (!url) {
      return null;
    }
    url = url.replace('?', '\\?');
    url = url.replace(/(\.|\/)/g, '\\$1');
    url = url.replace(/{[\w\\+]+}/g, '([a-zA-Z0-9\\$\\-_\\.~\\+!\'\\(\\)\\*\\{\\}]+)');
    url += '.*';
    return new RegExp(url);
  }
  /**
   * Computes ordered list of parameters applied to the `_fullUri`.
   * For example the URL: `http://{environment}.domain.com/{apiVersion}/`
   *
   * will be mapped to
   * ```
   * [
   *   "environment",
   *   "apiVersion"
   * ]
   * ```
   *
   * @param {String} url The URL to test for the parameters.
   * @return {Array|null} An ordered list of parameters or null if none found.
   */
  _computeUrlParams(url) {
    if (!url) {
      return null;
    }
    let paramsNames = url.match(/\{[\w\\+]+\}/g);
    if (paramsNames) {
      paramsNames = paramsNames.map((item) => item.substr(1, item.length - 2));
    }
    return paramsNames;
  }

  fire(type, detail) {
    const e = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: false,
      detail
    });
    this.dispatchEvent(e);
    return e;
  }

  /**
   * Handler for the `query-parameter-changed` custom event.
   * Updates model value from the event
   *
   * @param {CustomEvent} e
   */
  _queryParamChangeHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    this._appyEventValues(e.detail, 'query');
  }
  /**
   * Handler for the `uri-parameter-changed` custom event.
   * Updates model value from the event
   *
   * @param {CustomEvent} e
   */
  _uriParamChangeHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    this._appyEventValues(e.detail, 'path');
  }

  /**
   * Applies values from the change event to a model.
   *
   * @param {Object} detail Detail event object
   * @param {String} type `uri` or `query`
   */
  _appyEventValues(detail, type) {
    if (detail.isCustom) {
      // dealing with custom properties with possible name change is a mess.
      // It won't be processed via event's API and values should be passed via
      // queryModel.
      return;
    }
    const modelPath = `${type}Model`;
    const model = this[modelPath] || [];
    const index = model.findIndex((item) => item.name === detail.name);
    if (index === -1) {
      if (detail.removed || detail.enabled === false) {
        return;
      }
      const item = this._buildPropertyItem(detail.name, detail.value);
      model.push(item);
    } else {
      if (detail.removed) {
        model.splice(index, 1);
      } else {
        const item = model[index];
        if (item.value === detail.value) {
          return;
        }
        item.value = detail.value;
      }
    }
    this[modelPath] = [...model];
  }

  _buildPropertyItem(name, value) {
    const item = {
      name,
      value,
      schema: {
        type: 'string'
      }
    };
    // api-view-model-transformer handles this event. If it's not in the DOM then it
    // uses the base item object.
    const e = new CustomEvent('api-property-model-build', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: item
    });
    this.dispatchEvent(e);
    return item;
  }
}

window.customElements.define('api-url-editor', ApiUrlEditor);
