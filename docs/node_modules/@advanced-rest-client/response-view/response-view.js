/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
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
import '@advanced-rest-client/response-status-view/response-status-view.js';
import '@advanced-rest-client/response-error-view/response-error-view.js';
import '@advanced-rest-client/response-body-view/response-body-view.js';
/**
 * An element to display HTTP response view.
 *
 * It accepts request data object to render additional information in the
 * status bar (method & URL).
 *
 * ## Data model
 *
 * ## Request data model
 *
 * The request is ARC (Advanced REST client) request data model. It expects
 * the following properties:
 * - url (`String`) - Request URL
 * - method (`String`) - Request HTTP method.
 * - headers (`String|undefined`) - HTTP headers string
 * - payload (`String|FormData|File|ArrayBuffer|undefined`) Request body
 *
 * ## Response data model
 *
 * The response is ARC response data model:
 * - status (`Number`) - Response status code
 * - statusText (`String`) - Response status text. Can be empty string.
 * - payload (`String|Document|ArrayBuffer|Blob|undefined`) - Response body
 * - headers (`String|undefined`) - Response headers
 *
 * Response object is created by `advanced-rest-client/xhr-simple-request`.
 * However, any transport library can generate similar object.
 *
 * ## Advanced transport properties
 *
 * When using own transport libraries or server side transport you may have
 * access to more information about the request and response like redirects
 * and timings. The response status view can render additional UI for this
 * data.
 * To enable this feature, set `isXhr` to false and any of the following
 * properties:
 *
 * - sentHttpMessage `String` - Raw HTTP message sent to server
 * - redirects `Array<Object>` - A list of redirect information. Each object has
 * the following properties:
 *  - status (`Number`) - Response status code
 *  - statusText (`String`) - Response status text. Can be empty string.
 *  - headers (`String|undefined`) - Response headers
 *  - payload (`String|Document|ArrayBuffer|Blob|undefined`) - Response body
 * - redirectTimings `Array<Object>` - List of HAR 1.2 timing objects for
 * each redirected request. The order must corresponds with order in `redirects`
 * array.
 * - timings `Object` - HAR 1.2 timings object
 *
 * Read [response-status-view]
 * (https://elements.advancedrestclient.com/elements/response-status-view)
 * element documentation for more details.
 *
 * ## Error reporting
 *
 * If there's a request error set `isError` property and the `responseError`
 * that is an `Error` object.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof UiElements
 */
export class ResponseView extends LitElement {
  static get styles() {
    return css`
    :host { display: block; }

    response-body-view,
    response-error-view {
      margin-top: 24px;
    }
    `;
  }

  _errorTemplate() {
    const { responseError } = this;
    const message = responseError && responseError.message || 'unknown error';
    return html`<response-error-view .message="${message}"></response-error-view>`;
  }

  _responseTemplate() {
    const { _charset, isError, responseBody, contentType } = this;
    const _renderError = !!(isError && !responseBody);
    return html`
    ${_renderError ? this._errorTemplate() : ''}
    ${responseBody ? html`<response-body-view
      .responseText="${responseBody}"
      .contentType="${contentType}"
      .charset="${_charset}"></response-body-view>` : ''}`;
  }

  render() {
    const {
      _hasResponse,
      statusCode,
      statusMessage,
      requestHeaders,
      responseHeaders,
      loadingTime,
      redirects,
      redirectTimings,
      responseTimings,
      isXhr,
      requestUrl,
      requestMethod
    } = this;
    return html`
    <response-status-view
      .statusCode="${statusCode}"
      .statusMessage="${statusMessage}"
      .requestHeaders="${requestHeaders}"
      .responseHeaders="${responseHeaders}"
      .loadingTime="${loadingTime}"
      .httpMessage="${this.sentHttpMessage}"
      .redirects="${redirects}"
      .redirectTimings="${redirectTimings}"
      .timings="${responseTimings}"
      isxhr="${isXhr}"
      .requestUrl="${requestUrl}"
      .requestMethod="${requestMethod}"></response-status-view>

    ${_hasResponse ?
      this._responseTemplate() :
      html`<p class="empty-info">This response does not carry a payload.</p>`}`;
  }

  static get properties() {
    return {
      /**
       * ARC response object.
       *
       * Properties -
       * - status (`Number`) - Response status code
       * - statusText (`String`) - Response status text. Can be empty string.
       * - headers (`String|undefined`) - Response headers
       * - payload (`String|Document|ArrayBuffer|Blob|undefined`) - Response body
       *
       * @type {{
       *  status: String,
       *  statusText: String,
       *  headers: (String|undefined),
       *  payload: (String|Document|ArrayBuffer|Blob|undefined)}}
       */
      response: { type: Object },
      /**
       * ARC request object
       *
       * Properties -
       * - url (`String`) - Request URL
       * - method (`String`) - Request HTTP method.
       * - headers (`String|undefined`) - HTTP headers string
       * - payload (`String|FormData|File|ArrayBuffer|undefined`) Request body
       *
       * @type {{
       *  url: String.
       *  method: String,
       *  headers: (String|undefined),
       *  payload: (String|FormData|File|ArrayBuffer|undefined)
       * }}
       */
      request: { type: Object },
      /**
       * An Error object associated with the request if the response was errored.
       * It should have a `message` property set to the human readable
       * explenation of the error.
       * If not set the default message will be displaed.
       *
       * `isError` must be set with thit object.
       *
       * @type {Error}
       */
      responseError: { type: Object },
      /**
       * Response body.
       *
       * Ths value is computed from `response` property.
       *
       * @type {String|FormData|File|ArrayBuffer|undefined}
       */
      responseBody: { type: String },
      /**
       * Returned status code.
       * Ths value is computed from `response` property.
       */
      statusCode: { type: Number },
      /**
       * Returned status message (if any).
       * Ths value is computed from `response` property.
       */
      statusMessage: { type: String },
      /**
       * Request headers sent to the server.
       * Ths value is computed from `request` property.
       */
      requestHeaders: { type: String },
      /**
       * Returned from the server headers.
       * Ths value is computed from `response` property.
       */
      responseHeaders: { type: String },
      /**
       * The response content type header if present
       * Ths value is computed from `response` property.
       */
      contentType: { type: String },
      /**
       * If available, the request / response timings as defined in HAR 1.2
       * spec.
       */
      responseTimings: { type: Object },
      /**
       * The total time of the request / response load.
       */
      loadingTime: { type: Number },
      /**
       * If this information available, the source HTTP message sent to
       * the remote machine.
       */
      sentHttpMessage: { type: String },
      /**
       * List of ordered redirects.
       * Each object has the following properties:
       * - status (`Number`) - Response status code
       * - statusText (`String`) - Response status text. Can be empty string.
       * - headers (`String|undefined`) - Response headers
       * - payload (`String|Document|ArrayBuffer|Blob|undefined`) - Response body
       */
      redirects: { type: Array },
      /**
       * If timings stats are available for redirects, the list of the
       * `timings` objects as defined in HAR 1.2 specification.
       * The list should be ordered list.
       */
      redirectTimings: { type: Array },
      /**
       * Computed value, false if the response is set and it is a HEAD type
       * request (which can't have the response).
       */
      _hasResponse: { type: Boolean },
      // Set to `true` if the response has error object set.
      isError: { type: Boolean },
      /**
       * If true it means that the request has been made by the basic
       * transport and advanced details of the request/response like
       * redirects, timings, source message are not available.
       * It this case it will hide unused tabs.
       */
      isXhr: { type: Boolean },
      // A request URL that has been used to make a request
      requestUrl: { type: String },
      // A HTTP method used to make a request
      requestMethod: { type: String },
      /**
       * Response's character encoding.
       * This value is set when the response is changed. Can be undefined in which case
       * default `utf-8` is used.
       * It is read from `content-type` header value, e.g.: `Content-Type: text/html; charset=iso-8859-1`
       */
      _charset: { type: String }
    };
  }

  get request() {
    return this._request;
  }

  set request(value) {
    const old = this._request;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._request = value;
    this.requestUpdate('request', old);
    this._requestChanged(value);
  }

  get response() {
    return this._response;
  }

  set response(value) {
    const old = this._response;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._response = value;
    this.requestUpdate('response', old);
    this._responseChanged(value);
  }

  constructor() {
    super();
    this.statusCode = 0;
  }

  /**
   * Resets the initial variables for the Response change handler.
   */
  _reset() {
    this.statusCode = 0;
    this.statusMessage = undefined;
    this.responseHeaders = undefined;
    this.responseBody = undefined;
    this.contentType = undefined;
  }
  /**
   * Propagate response properties when response object changes.
   *
   * @param {Object} response The response object
   */
  _responseChanged(response) {
    this._reset();
    if (!response) {
      return;
    }
    this.statusCode = response.status;
    this.statusMessage = response.statusText;
    this.responseHeaders = response.headers;
    let [contentType, charset] = this._readContentType(response.headers);
    if (!contentType) {
      contentType = 'text/plain';
    }
    this._charset = charset;
    this.responseBody = response.payload;
    this.contentType = contentType;
  }
  /**
   * Reads content-type header from the response headers.
   *
   * @param {?String} headers Headers received from the server
   * @return {Array<String>} When present an array where first item is
   * the content type and second is charset value. Otherwise empty array.
   */
  _readContentType(headers) {
    if (!headers || typeof headers !== 'string') {
      return [];
    }
    const ctMatches = headers.match(/^\s*content-type\s*:\s*(.*)$/im);
    if (!ctMatches) {
      return [];
    }
    let mime = ctMatches[1];
    const charset = this._computeCharset(mime);
    const index = mime.indexOf(';');
    if (index !== -1) {
      mime = mime.substr(0, index);
    }
    return [mime, charset];
  }
  /**
   * Propagate request data when the `request` object changes.
   *
   * @param {Object} request The ARC request object
   */
  _requestChanged(request) {
    this.requestHeaders = undefined;
    this._hasResponse = this._computeHasResponse(request);
    if (!request) {
      return;
    }
    this.requestUrl = request.url;
    this.requestMethod = request.method;
    this.requestHeaders = request.headers;
  }
  /**
   * Computes if the response panel should be displayed.
   * If the request method is `HEAD` then it never can have response.
   *
   * @param {Object} request ARC request object.
   * @return {Boolean}
   */
  _computeHasResponse(request) {
    if (request && request.method === 'HEAD') {
      return false;
    }
    return true;
  }
  /**
   * Computes charset value from the `content-type` header.
   * @param {String} contentType Content type header string
   * @return {String|undefined}
   */
  _computeCharset(contentType) {
    if (!contentType || !contentType.split) {
      return;
    }
    if (contentType.indexOf('charset') === -1) {
      return;
    }
    const parts = contentType.split(';');
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i].trim();
      const _tmp = part.split('=');
      if (_tmp[0] === 'charset') {
        return _tmp[1].trim();
      }
    }
  }
}
window.customElements.define('response-view', ResponseView);
