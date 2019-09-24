import { html, css, LitElement } from 'lit-element';
import { HeadersParserMixin } from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import '@api-components/api-request-editor/api-request-editor.js';
import '@advanced-rest-client/response-view/response-view.js';
import '@api-components/raml-aware/raml-aware.js';
/* eslint-disable max-len */
/**
 * Request editor and response view panels in a single element.
 *
 * This element is to replace `api-console-request` element from `mulesoft/api-console`
 * project repository.
 *
 * This is also a base case for any application that renders request and
 * response views.
 *
 * The element uses AMF model to render view based on API mnodel and current user
 * selection.
 *
 * It uses both `api-request-editor` and `response-view` elements and
 * listens to `api-request` and `api-response` events.
 * It also adds additional configuration options that exists in API console
 * (proxy, additional headers).
 *
 * ## `api-request` and `api-response` events
 *
 * See full documentation here:
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/api-request-and-response.md
 *
 * ## Dependencies and changelog from included elements
 *
 * - XHR element is not included in the element. Use
 * `advanced-rest-client/xhr-simple-request` in your application or handle
 * `api-request` custom event to make a request.
 * - The element does not include any polyfills
 * - `redirectUrl` is now `redirectUri`
 * - `api-console-request` event is now `api-request` event
 * - `api-console-response` event is now `api-response` event
 * - Added more details to `api-request` custom event (comparing to
 * `api-console-request`)
 * - The user is able to enable/disable query parameters and headers. Set
 * `allow-disable-params` attribute to enable this behavior.
 * - The user is able to add custom query parameters or headers.
 * Set `allow-custom` attribute to enable this behavior.
 * - From authorization panel changes:
 *  - `auth-settings-changed` custom event is stopped from bubbling.
 *  Listen for `authorization-settings-changed` event instead.
 * - From auth-method-oauth2 changes:
 *  - Added `deliveryMethod` and `deliveryName` properties to the
 *  `detail.setting` object.
 * - Crypto library is no longer included into the element. Use
 *  `advanced-rest-client/cryptojs-lib` component to include the library
 *  if your project doesn't use crypto libraries already.
 *
 * ## Narrow view
 *
 * Generally the API components are flexible and mobile friendly. However,
 * it is possible to set `narrow` property to render form elements in
 * a mobile fieldly view. In most cases it means that forms controls are
 * rendered in different layout.
 *
 * ## api-navigation integration
 *
 * The element works with `api-navigation` element. Set `handle-navigation-events`
 * attribute when using `api-navigation` so the component will automatically
 * update selection when internal API navigation occurres.
 *
 * @customElement
 * @demo demo/index.html
 * @demo demo/navigation.html Automated navigation
 * @appliesMixin HeadersParserMixin
 * @appliesMixin EventsTargetMixin
 * @memberof ApiElements
 */
class ApiRequestPanel extends EventsTargetMixin(HeadersParserMixin(LitElement)) {
  static get styles() {
    return css`
    :host { display: block; }
    response-view {
      margin-top: var(--api-request-panel-response-margin-top, 48px);
    }
    `;
  }

  get _hasResponse() {
    return !!this.response || !!this.responseError;
  }

  render() {
    const {
      aware,
      narrow,
      redirectUri,
      selected,
      amf,
      noUrlEditor,
      baseUri,
      noDocs,
      eventsTarget,
      allowHideOptional,
      allowDisableParams,
      allowCustom,
      server,
      protocols,
      version,
      readOnly,
      disabled,
      legacy,
      outlined,

      _hasResponse
    } = this;


    return html`
    ${aware ? html`<raml-aware
      .scope="${aware}"
      @api-changed="${this._apiChanged}"></raml-aware>` : ''}

    <api-request-editor
      ?narrow="${narrow}"
      .redirectUri="${redirectUri}"
      .selected="${selected}"
      .amf="${amf}"
      .noUrlEditor="${noUrlEditor}"
      .baseUri="${baseUri}"
      .noDocs="${noDocs}"
      .eventsTarget="${eventsTarget}"
      .allowHideOptional="${allowHideOptional}"
      .allowDisableParams="${allowDisableParams}"
      .allowCustom="${allowCustom}"
      .server="${server}"
      .protocols="${protocols}"
      .version="${version}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      .outlined="${outlined}"
      .legacy="${legacy}"></api-request-editor>
    ${_hasResponse ? html`<response-view
      .request="${this.request}"
      .response="${this.response}"
      .responseError="${this.responseError}"
      .isError="${this.isErrorResponse}"
      .isXhr="${this.responseIsXhr}"
      .loadingTime="${this.loadingTime}"
      .redirects="${this.redirects}"
      .redirectTimings="${this.redirectsTiming}"
      .responseTimings="${this.timing}"
      .sentHttpMessage="${this.sourceMessage}"
      .legacy="${legacy}"></response-view>` : ''}
    `;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * AMF HTTP method (operation in AMF vocabulary) ID.
       */
      selected: { type: String },
      /**
       * By default application hosting the element must set `selected`
       * property. When using `api-navigation` element
       * by setting this property the element listens for navigation events
       * and updates the state
       */
      handleNavigationEvents: { type: Boolean },
      /**
       * A model's `@id` of selected documentation part.
       * Special case is for `summary` view. It's not part of an API
       * but most applications has some kind of summary view for the
       * API.
       */
      amf: { type: Object },
      /**
       * Hides the URL editor from the view.
       * The editor is still in the DOM and the `urlInvalid` property still will be set.
       */
      noUrlEditor: { type: Boolean },
      /**
       * A base URI for the API. To be set if RAML spec is missing `baseUri`
       * declaration and this produces invalid URL input. This information
       * is passed to the URL editor that prefixes the URL with `baseUri` value
       * if passed URL is a relative URL.
       */
      baseUri: { type: String },
      /**
       * OAuth2 redirect URI.
       * This value **must** be set in order for OAuth 1/2 to work properly.
       */
      redirectUri: { type: String },
      /**
       * If set it will renders the view in the narrow layout.
       */
      narrow: { type: Boolean, reflect: true },
      /**
       * Enables Anypoint legacy styling
       */
      legacy: { type: Boolean, reflect: true },
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
       * Created by the transport ARFC `request` object
       */
      request: { type: Object },
      /**
       * Created by the transport ARC `response` object.
       */
      response: { type: Object },

      /**
       * A flag indincating request error.
       */
      isErrorResponse: { type: Boolean },
      /**
       * True if the response is made by the Fetch / XHR api.
       */
      responseIsXhr: { type: Boolean },
      /**
       * An error object associated with the response when error.
       */
      responseError: { type: Object },
      /**
       * Response full loading time. This information is received from the
       * transport library.
       */
      loadingTime: { type: Number },
      /**
       * If the transport method is able to collect detailed information about request timings
       * then this value will be set. It's the `timings` property from the HAR 1.2 spec.
       */
      timing: { type: Object },
      /**
       * If the transport method is able to collect detailed information about redirects timings
       * then this value will be set. It's a list of `timings` property from the HAR 1.2 spec.
       */
      redirectsTiming: { type: Array },
      /**
       * It will be set if the transport method can generate information about redirections.
       */
      redirects: { type: Array },
      /**
       * Http message sent to the server.
       *
       * This information should be available only in case of advanced HTTP transport.
       */
      sourceMessage: { type: String },
      /**
       * Forces the console to send headers defined in this string overriding any used defined
       * header.
       * This should be an array of headers with `name` and `value` keys, e.g.:
       * ```
       * [{
       *   name: "x-token",
       *   value: "value"
       * }]
       * ```
       */
      appendHeaders: { type: Array },
      /**
       * If set every request made from the console will be proxied by the service provided in this
       * value.
       * It will prefix entered URL with the proxy value. so the call to
       * `http://domain.com/path/?query=some+value` will become
       * `https://proxy.com/path/http://domain.com/path/?query=some+value`
       *
       * If the proxy require a to pass the URL as a query parameter define value as follows:
       * `https://proxy.com/path/?url=`. In this case be sure to set `proxy-encode-url`
       * attribute.
       */
      proxy: { type: String },
      /**
       * If `proxy` is set, it will URL encode the request URL before appending it to the proxy URL.
       * `http://domain.com/path/?query=some+value` will become
       * `https://proxy.com/?url=http%3A%2F%2Fdomain.com%2Fpath%2F%3Fquery%3Dsome%2Bvalue`
       */
      proxyEncodeUrl: { type: Boolean },
      /**
       * Location of the `node_modules` folder.
       * It should be a path from server's root path including node_modules.
       */
      authPopupLocation: { type: String },
      /**
       * ID of latest request.
       * It is received from the `api-request-editor` when `api-request`
       * event is dispatched. When `api-response` event is handled
       * the id is compared and if match it dispays the result.
       *
       * This system allows to use different request panels on single app
       * and don't mix the results.
       *
       * @type {String|Number}
       */
      lastRequestId: { type: String },
      /**
       * Prohibits rendering of the documentation (the icon and the
       * description).
       */
      noDocs: { type: Boolean },
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
       * API server definition from the AMF model.
       *
       * This value to be set when partial AMF mnodel for an endpoint is passed
       * instead of web api to be passed to the `api-url-data-model` element.
       *
       * Do not set with full AMF web API model.
       */
      server: { type: Object },
      /**
       * Supported protocl versions.
       *
       * E.g.
       *
       * ```json
       * ["http", "https"]
       * ```
       *
       * This value to be set when partial AMF mnodel for an endpoint is passed
       * instead of web api to be passed to the `api-url-data-model` element.
       *
       * Do not set with full AMF web API model.
       */
      protocols: { type: Array },
      /**
       * API version name.
       *
       * This value to be set when partial AMF mnodel for an endpoint is passed
       * instead of web api to be passed to the `api-url-data-model` element.
       *
       * Do not set with full AMF web API model.
       */
      version: { type: String }
    };
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    const old = this._selected;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._selected = value;
    this.requestUpdate('selected', old);
    this._selectedChanged(value);
  }

  get handleNavigationEvents() {
    return this._handleNavigationEvents;
  }

  set handleNavigationEvents(value) {
    const old = this._handleNavigationEvents;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._handleNavigationEvents = value;
    this._handleNavChanged(value);
  }

  get authPopupLocation() {
    return this._authPopupLocation;
  }

  set authPopupLocation(value) {
    const old = this._authPopupLocation;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._authPopupLocation = value;
    this._updateRedirectUri(value);
  }
  /**
   * @constructor
   */
  constructor() {
    super();
    this._apiResponseHandler = this._apiResponseHandler.bind(this);
    this._apiRequestHandler = this._apiRequestHandler.bind(this);
    this._navigationHandler = this._navigationHandler.bind(this);

    this.responseIsXhr = true;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.redirectUri) {
      this._updateRedirectUri(this.authPopupLocation);
    }
  }

  _attachListeners() {
    window.addEventListener('api-response', this._apiResponseHandler);
    this.addEventListener('api-request', this._apiRequestHandler);
  }

  _detachListeners() {
    window.removeEventListener('api-response', this._apiResponseHandler);
    this.removeEventListener('api-request', this._apiRequestHandler);
    if (this.__navEventsRegistered) {
      this._unregisterNavigationEvents();
    }
  }
  /**
   * Registers `api-navigation-selection-changed` event listener handler
   * on window object.
   */
  _registerNavigationEvents() {
    this.__navEventsRegistered = true;
    window.addEventListener('api-navigation-selection-changed', this._navigationHandler);
  }
  /**
   * Removes event listener from window object for
   * `api-navigation-selection-changed` event.
   */
  _unregisterNavigationEvents() {
    this.__navEventsRegistered = false;
    window.removeEventListener('api-navigation-selection-changed', this._navigationHandler);
  }
  /**
   * Registers / unregisters event listeners depending on `state`
   *
   * @param {Boolean} state
   */
  _handleNavChanged(state) {
    if (state) {
      this._registerNavigationEvents();
    } else {
      this._unregisterNavigationEvents();
    }
  }
  /**
   * Handler for `api-navigation-selection-changed` event.
   *
   * @param {CustomEvent} e
   */
  _navigationHandler(e) {
    const { type, selected } = e.detail;
    this.selected = type === 'method' ? selected : undefined;
  }
  /**
   * Sets OAuth 2 redirect URL for the authorization panel
   *
   * @param {?String} location Bower components location
   */
  _updateRedirectUri(location) {
    const a = document.createElement('a');
    if (!location) {
      location = 'node_modules/';
    }
    if (location && location[location.length - 1] !== '/') {
      location += '/';
    }
    a.href = location + '@advanced-rest-client/oauth-authorization/oauth-popup.html';
    this.redirectUri = a.href;
  }
  /**
   * A handler for the API call.
   * This handler will only check if there is authorization required
   * and if the user is authorizaed.
   *
   * @param {CustomEvent} e `api-request` event
   */
  _apiRequestHandler(e) {
    this.lastRequestId = e.detail.id;
    this._appendConsoleHeaders(e);
    this._appendProxy(e);
  }
  /**
   * Appends headers defined in the `appendHeaders` array.
   * @param {CustomEvent} e The `api-request` event.
   */
  _appendConsoleHeaders(e) {
    const headersToAdd = this.appendHeaders;
    if (!headersToAdd) {
      return;
    }
    let eventHeaders = e.detail.headers || '';
    for (let i = 0, len = headersToAdd.length; i < len; i++) {
      const header = headersToAdd[i];
      eventHeaders = this.replaceHeaderValue(eventHeaders, header.name, header.value);
    }
    e.detail.headers = eventHeaders;
  }
  /**
   * Sets the proxy URL if the `proxy` property is set.
   * @param {CustomEvent} e The `api-request` event.
   */
  _appendProxy(e) {
    const proxy = this.proxy;
    if (!proxy) {
      return;
    }
    let url = this.proxyEncodeUrl ? encodeURIComponent(e.detail.url) : e.detail.url;
    url = proxy + url;
    e.detail.url = url;
  }
  /**
   * Handler for the `api-response` custom event. Sets values on the response
   * panel when response is ready.
   *
   * @param {CustomEvent} e
   */
  _apiResponseHandler(e) {
    if (this.lastRequestId !== e.detail.id) {
      return;
    }
    this._propagateResponse(e.detail);
  }
  /**
   * Propagate `api-response` detail object.
   *
   * @param {Object} data Event's detail object
   */
  _propagateResponse(data) {
    this.isErrorResponse = data.isError;
    this.responseError = data.isError ? data.error : undefined;
    this.loadingTime = data.loadingTime;
    this.request = data.request;
    this.response = data.response;
    const isXhr = data.isXhr === false ? false : true;
    this.responseIsXhr = isXhr;
    this.redirects = isXhr ? undefined : data.redirects;
    this.redirectsTiming = isXhr ? undefined : data.redirectsTiming;
    this.timing = isXhr ? undefined : data.timing;
    this.sourceMessage = data.sentHttpMessage;
  }
  /**
   * Clears response panel when selected id changed.
   * @param {String} id
   */
  _selectedChanged(id) {
    if (!id) {
      return;
    }
    this.clearResponse();
  }
  /**
   * Clears response panel.
   */
  clearResponse() {
    this.isErrorResponse = undefined;
    this.responseError = undefined;
    if (this.loadingTime) {
      this.loadingTime = undefined;
    }
    if (this.request) {
      this.request = undefined;
    }
    if (this.response) {
      this.response = undefined;
    }
    if (this.responseIsXhr !== undefined) {
      this.responseIsXhr = undefined;
    }
    if (this.redirects) {
      this.redirects = undefined;
    }
    if (this.redirectsTiming) {
      this.redirectsTiming = undefined;
    }
    if (this.timing) {
      this.timing = undefined;
    }
    if (this.sourceMessage) {
      this.sourceMessage = undefined;
    }
  }

  _apiChanged(e) {
    this.amf = e.detail.value;
  }
}

window.customElements.define('api-request-panel', ApiRequestPanel);
