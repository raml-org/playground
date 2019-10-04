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
import { LitElement, html, css } from 'lit-element';
import { ResponseStatusMixin } from './response-status-mixin.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tabs.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tab.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@advanced-rest-client/request-timings/request-timings-panel.js';
import '@advanced-rest-client/headers-list-view/headers-list-view.js';
import '@polymer/iron-collapse/iron-collapse.js';
import { expandMore } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import './http-source-message-view.js';
import './response-redirects-panel.js';
import statusStypes from './response-status-styles.js';
/* eslint-disable max-len */
/**
 * A class that reads response status code and returns default HTTP status
 * message associated with it.
 */
export class StatusMessage {
  /**
   * Translates status code into status message.
   *
   * @param {Number|String} code Status code
   * @return {String|undefined} Status text if the code is recognized.
   */
  static getMessage(code) {
    code = Number(code);
    let message;
    switch (code) {
      case 0:
        message = 'Request error';
        break;
      case 100:
        message = 'Continue';
        break;
      case 101:
        message = 'Switching Protocols';
        break;
      case 200:
        message = 'OK';
        break;
      case 201:
        message = 'Created';
        break;
      case 202:
        message = 'Accepted';
        break;
      case 203:
        message = 'Non-Authoritative Information';
        break;
      case 204:
        message = 'No Content';
        break;
      case 205:
        message = 'Reset Content';
        break;
      case 206:
        message = 'Partial Content';
        break;
      case 300:
        message = 'Multiple Choices';
        break;
      case 301:
        message = 'Moved Permanently';
        break;
      case 302:
        message = 'Found';
        break;
      case 303:
        message = 'See Other';
        break;
      case 304:
        message = 'Not Modified';
        break;
      case 305:
        message = 'Use Proxy';
        break;
      case 306:
        message = '(Unused)';
        break;
      case 307:
        message = 'Temporary Redirect';
        break;
      case 400:
        message = 'Bad Request';
        break;
      case 401:
        message = 'Unauthorized';
        break;
      case 402:
        message = 'Payment Required';
        break;
      case 403:
        message = 'Forbidden';
        break;
      case 404:
        message = 'Not Found';
        break;
      case 405:
        message = 'Method Not Allowed';
        break;
      case 406:
        message = 'Not Acceptable';
        break;
      case 407:
        message = 'Proxy Authentication Required';
        break;
      case 408:
        message = 'Request Timeout';
        break;
      case 409:
        message = 'Conflict';
        break;
      case 410:
        message = 'Gone';
        break;
      case 411:
        message = 'Length Required';
        break;
      case 412:
        message = 'Precondition Failed';
        break;
      case 413:
        message = 'Request Entity Too Large';
        break;
      case 414:
        message = 'Request-URI Too Long';
        break;
      case 415:
        message = 'Unsupported Media Type';
        break;
      case 416:
        message = 'Requested Range Not Satisfiable';
        break;
      case 417:
        message = 'Expectation Failed';
        break;
      case 500:
        message = 'Internal Server Error';
        break;
      case 501:
        message = 'Not Implemented';
        break;
      case 502:
        message = 'Bad Gateway';
        break;
      case 503:
        message = 'Service Unavailable';
        break;
      case 504:
        message = 'Gateway Timeout';
        break;
      case 505:
        message = 'HTTP Version Not Supported';
        break;
    }
    return message;
  }
}
/**
 * HTTP response status view, including status, headers redirects and timings
 *
 * ### Full example
 *
 * ```html
 * <response-status-view
 *  status-code="[[statusCode]]"
 *  status-message="[[statusMessage]]"
 *  request-headers="[[requestHeaders]]"
 *  response-headers="[[responseHeaders]]"
 *  loading-time="[[loadingTime]]"
 *  http-message="[[_computeHttpMessage(requestHeaders)]]"
 *  redirects="[[redirects]]"
 *  redirect-timings="[[redirectTimings]]"
 *  timings="[[timings]]"></response-status-view>
 * ```
 *
 * ### Minimal example
 *
 * ```html
 * <response-status-view
 *  status-code="[[statusCode]]"
 *  status-message="[[statusMessage]]"
 *  response-headers="[[responseHeaders]]"
 *  loading-time="[[loadingTime]]"></response-status-view>
 * ```
 *
 * ## Understanding `is-xhr`
 *
 * ARC (Advanced REST client) uses it's own HTTP client library to connect to
 * the server. Because of that it collects much more information about the
 * connection itself. When the response ends it reports detailed redirects
 * information. Each response (including redirects) has detailed timing
 * infomration. The timing object applies HAT 1.2 spec. When `is-xhr`
 * attribute is not set, the element expect to received additional data
 * available in ARC app. Element renders additional tabs to list redirects
 * and table of timing information.
 *
 * Simple requerst objects like XHR or Fetch does not allow to collect this
 * information in such details. In this case `is-xhr` should be set so the
 * element won't render a view that can never be used.
 *
 * ## Data model
 *
 * ### Redirects
 *
 * #### `redirects`
 *
 * Array of objects. Each object has `headers` property as a HTTP headers
 * string, `status` as a HTTP status and optionally `statusText`.
 *
 * #### `redirectTimings`
 *
 * Array of objects. Each object represent a HAR 1.2 timings object.
 * See the `request-timings` element documentation for more information.
 *
 * ### `responseError`
 *
 * A JavaScript Error object.
 *
 * ### `timings`
 *
 * Object that represent a HAR 1.2 timings object. See the `request-timings`
 * element documentation for more information.
 *
 * ## Status message
 *
 * The element sets a status message if, after ~100 ms of setting status code
 * property, the `statusMessage` property is not set. This is to ensure that
 * the user will always see any status message.
 *
 * ## Styling
 *
 * `<response-status-view>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--response-status-view` | Mixin applied to the element | `{}`
 * `--raml-docs-response-panel` | Mixin applied to the element | `{}`
 * `--arc-status-code-color-200` | Color of the 200 status code (ARC theme option) | `rgba(56, 142, 60, 1)` |
 * `--arc-status-code-color-300` | Color of the 300 status code (ARC theme option) | `rgba(48, 63, 159, 1)` |
 * `--arc-status-code-color-400` | Color of the 400 status code (ARC theme option) | `rgba(245, 124, 0, 1)` |
 * `--arc-status-code-color-500` | Color of the 500 status code (ARC theme option) | `rgba(211, 47, 47, 1)` |
 * `--arc-font-subhead` | Mixin applied to sub headers (low implortance headers). It's a theme mixin. | `{}`
 * `--no-info-message` | Mixin applied to the messages information that there's no information available. | `{}`
 * `--arc-font-code1` | Mixin applied to the source message. It's a theme mixin. | `{}`
 * `--response-status-view-badge-color` | Color of the badge with number of the headers / redirections in advanced view | `#fff`
 * `--response-status-view-badge-background` | Background color of the badge with number of the headers / redirections in advanced view | `--accent-color`
 * `--response-status-view-empty-badge-color` | Color of the badge with number of the headers / redirections in advanced view | `#fff`
 * `--response-status-view-empty-badge-background` | Background color of the badge with number of the headers / redirections in advanced view | `#9e9e9e`
 * `--response-status-view-status-info-border-color` | Border color separating status from the response headers | `#e5e5e5`
 * `--response-status-view-status-container` | Mixin applied to the status row in the main view and in the redirects view (in advanced mode). | `{}`
 *
 * ## Changes in version 2.0
 *
 * - `status-message` element was removed. The `StatusMessage` class is included
 * with this element.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof UiElements
 * @appliesMixin ResponseStatusMixin
 */
class ResponseStatusView extends ResponseStatusMixin(LitElement) {
  static get styles() {
    return [
      statusStypes,
      css`:host {
        display: flex;
        flex-direction: column;

        font-size: var(--arc-font-body1-font-size);
        font-weight: var(--arc-font-body1-font-weight);
        line-height: var(--arc-font-body1-line-height);
      }

      .badge {
        display: block;
        background-color: var(--response-status-view-badge-background, var(--accent-color));
        color: var(--response-status-view-badge-color, #fff);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font-size: 12px;
        margin-left: 12px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
      }

      .badge.empty {
        background-color: var(--response-status-view-empty-badge-background, #9e9e9e);
        color: var(--response-status-view-empty-badge-color, #fff);
      }

      .response-time {
        color: var(--response-status-view-loading-time-color, rgba(0, 0, 0, 0.54));
        margin-left: 8px;
        display: block;
      }

      .status-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex: 1;
        padding: 0 4px;
      }

      .toggle-icon {
        transform: rotateZ(0deg);
        transition: transform 0.3s linear;
      }

      .toggle-icon.opened {
        transform: rotateZ(-180deg);
      }

      .xhr-title {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0px 16px;
        font-size: var(--arc-font-subhead-font-size);
        font-weight: var(--arc-font-subhead-font-weight);
        line-height: var(--arc-font-subhead-line-height);
      }

      .response-error-label {
        margin-left: 12px;
        color: var(--arc-status-code-color-500, rgba(211, 47, 47, 1));
      }

      .status-url {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding-top: 12px;
        padding-bottom: 12px;
        font-size: 120%;
        padding-left: 16px;
        background: var(--response-status-view-request-url-background-color, #6B6C6D);
        color: var(--response-status-view-request-url-color, #fff);
        font-family: var(--arc-font-code-family, initial);
      }

      .http-method {
        margin-right: 12px;
      }

      .request-url {
        word-break: break-all;
      }

      .no-info {
        padding-left: 16px;
        font-style: italic;
      }

      [hidden] {
        display: none !important;
      }

      .icon {
        display: block;
        width: 24px;
        height: 24px;
        fill: currentColor;
      }`
    ];
  }

  render() {
    const {
      responseError,
      loadingTime,
      statusMessage,
      statusCode,
      opened,
      requestUrl,
      requestMethod,
      selectedTab,
      responseHeaders,
      requestHeaders,
      isXhr,
      scrollableTab,
      compatibility
    } = this;
    let  {
      redirects
    } = this;
    if (!redirects) {
      redirects = [];
    }
    const isError = !!responseError;

    return html`
    <div class="status-row">
      <div class="status-value status">
      ${isError ?
        html`<span class="error status-code-value">0</span>
        ${loadingTime ? html`<span class="response-time">${this._roundTime(loadingTime)} ms</span>` : undefined}
        <p class="response-error-label">Error in the response.</p>` :
        html`<div class="status-info text">
          <span class="${this._computeStatusClass(statusCode)}">${statusCode} ${statusMessage}</span>
          ${loadingTime ? html`<span class="response-time">${this._roundTime(loadingTime)} ms</span>` : undefined}
        </div>
        <div class="status-details">
          <anypoint-button
            @click="${this.toggleCollapse}"
            class="toggle-button"
            title="Toogles response headers"
            aria-label="Activate to toggle response headers"
            ?compatibility="${compatibility}"
          >
            Details
            <span class="icon ${this._computeToggleIconClass(opened)}">${expandMore}</span>
          </anypoint-button>
        </div>`}
      </div>
    </div>

    <iron-collapse .opened="${opened}">
      ${requestUrl ? html`<div class="status-url">
        ${requestMethod ? html`<span class="http-method">${requestMethod}</span>` : undefined}
        <span class="request-url">${requestUrl}</span>
      </div>` : undefined}

      <anypoint-tabs
        .selected="${selectedTab}"
        ?scrollable="${scrollableTab}"
        @selected-changed="${this._tabChangeHandler}"
        ?compatibility="${compatibility}"
      >
        <anypoint-tab ?compatibility="${compatibility}">
          <span>Response headers</span>
          <span class="${this._computeBageClass(responseHeaders)}">${this._computeHeadersLength(responseHeaders)}</span>
        </anypoint-tab>
        <anypoint-tab ?compatibility="${compatibility}">
          <span>Request headers</span>
          <span class="${this._computeBageClass(requestHeaders)}">${this._computeHeadersLength(requestHeaders)}</span>
        </anypoint-tab>
        ${isXhr ? undefined : html`<anypoint-tab ?compatibility="${compatibility}">
          <span>Redirects</span>
          <span class="${this._computeBageClass(redirects.length)}">${redirects.length}</span>
        </anypoint-tab>
        <anypoint-tab ?compatibility="${compatibility}">Timings</anypoint-tab>`}
      </anypoint-tabs>
      ${this._selectedTemplate(selectedTab)}
    </iron-collapse>`;
  }

  _selectedTemplate(selected) {
    const { narrow } = this;
    switch (selected) {
      case 0: return html`<section class="response-headers-panel">
      ${this.responseHeaders ?
        html`<headers-list-view
          type="response"
          ?narrow="${narrow}"
          @click="${this._handleLink}"
          .headers="${this.responseHeaders}"
          data-source="response-headers"></headers-list-view>` :
        html`<div class="no-info-container">
          <p class="no-info">No response headers recorded.</p>
        </div>`}
      </section>`;
      case 1: return this._headersTemplate();
      case 2: return html`<response-redirects-panel
        .redirects="${this.redirects}"
        ?narrow="${narrow}"></response-redirects-panel>`;
      case 3: return html`<request-timings-panel
        .redirectTimings="${this.redirectTimings}"
        .timings="${this.timings}"
        ?narrow="${narrow}"></request-timings-panel>`;
    }
  }

  _headersTemplate() {
    const {
      requestHeaders,
      httpMessage,
      narrow,
      compatibility
    } = this;
    return html`<section class="request-headers-panel">
      ${requestHeaders ?
        html`<headers-list-view
          ?narrow="${narrow}"
          type="request"
          @click="${this._handleLink}"
          .headers="${requestHeaders}"
          data-source="request-headers"></headers-list-view>` :
        html`<div class="no-info-container">
          <p class="no-info">No request headers were recorded.</p>
        </div>`}
      ${httpMessage ?
        html`
        <http-source-message-view
          .message="${httpMessage}"
          ?compatibility="${compatibility}"
        ></http-source-message-view>` : ''}
    </section>`
  }

  static get properties() {
    return {
      // Response status code.
      statusCode: { type: Number },
      // Status message (if any)
      statusMessage: { type: String },
      // The request/response loading time.
      loadingTime: { type: Number },
      /**
       * The response headers as a HTTP headers string
       */
      responseHeaders: { type: String },
      // The request headers as a HTTP headers string
      requestHeaders: { type: String },
      /**
       * Raw HTTP message sent to the server.
       * It will be displayed in the request headers tab.
       * Optional for transports that do not expose this information.
       */
      httpMessage: { type: String },
      /**
       * An Error object representing the response error.
       * It uses this property only to determine if the request is errored
       */
      responseError: { type: Object },
      /**
       * An array of redirect responses.
       * Each of the response objects should be regular Response objects.
       *
       * @type {Array<Object>}
       */
      redirects: { type: Array },
      /**
       * List of timings occured during the redirects.
       * This list should be ordered by the time of redirection.
       * See the `request-timings` element documentation for more
       * information.
       *
       * @type {Array<Object>}
       */
      redirectTimings: { type: Array },
      /**
       * Currently selected tab.
       */
      selectedTab: { type: Number },
      /**
       * When set renders tabs in a scrollable view.
       */
      scrollableTab: { type: Boolean },
      /**
       * The timings object to display request/response timing information
       * as defined in HAR 1.2 spec.
       * See the `request-timings` element documentation for more
       * information.
       */
      timings: { type: Object },
      /**
       * If true it means that the request has been made by the basic
       * transport and advanced details of the request/response like
       * redirects, timings, source message are not available.
       * It this case it will hide unused tabs.
       */
      isXhr: { type: Boolean },
      /**
       * True if the element is expanded
       */
      opened: { type: Boolean },
      /**
       * A request URL that has been used to make a request
       */
      requestUrl: { type: String },
      /**
       * A HTTP method used to make a request.
       */
      requestMethod: { type: String },
      /**
       * Renders mobile frinedly view
       */
      narrow: { type: Boolean },
      /**
       * Enables compatibility view with Anypoint platform
       */
      compatibility: { type: Boolean }
    };
  }

  get statusCode() {
    return this._statusCode;
  }

  set statusCode(value) {
    const old = this._statusCode;
    if (old === value) {
      return;
    }
    if (!value) {
      value = 0;
    }
    this._statusCode = value;
    this.requestUpdate('statusCode', old);
    this._statusCodeChanged();
  }

  get statusMessage() {
    return this._statusMessage;
  }

  set statusMessage(value) {
    const old = this._statusMessage;
    if (old === value) {
      return;
    }
    if (!value) {
      value = 0;
    }
    this._statusMessage = value;
    this.requestUpdate('statusMessage', old);
    this._statusCodeChanged();
  }

  get responseError() {
    return this._responseError;
  }

  set responseError(value) {
    const old = this._responseError;
    if (old === value) {
      return;
    }
    this._responseError = value;
    this.requestUpdate('responseError', old);
    if (value && this.opened) {
      this.opened = false;
    }
  }

  get isXhr() {
    return this._isXhr;
  }

  set isXhr(value) {
    const old = this._isXhr;
    if (old === value) {
      return;
    }
    this._isXhr = value;
    this.requestUpdate('isXhr', old);
    this._isXhrChanged(value);
  }

  get opened() {
    return this._opened;
  }

  set opened(value) {
    const old = this._opened;
    if (old === value) {
      return;
    }
    this._opened = value;
    this.requestUpdate('opened', old);
    if (value) {
      this.setAttribute('aria-expanded', 'true');
    } else {
      this.setAttribute('aria-expanded', 'false');
    }
  }

  constructor() {
    super();
    this.loadingTime = 0;
    this.selectedTab = 0;
    this.opened = false;
  }

  connectedCallback() {
    /* istanbul ignore else */
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (this.statusCode) {
      this._statusCodeChanged();
    }
  }

  _statusCodeChanged() {
    setTimeout(() => this.assignStatusMessage());
  }
  /**
   * Computes CSS class for the badge in the tabs.
   * If passed `input` is string it only check if string is not empty.
   * Otherwise it checks if passed value is !== 0.
   *
   * @param {String|Number} input String or number to check.
   * @return {String} Computed class name for this badge.
   */
  _computeBageClass(input) {
    const cls = 'badge';
    const clsEmpty = cls + ' empty';
    if (input === undefined) {
      return clsEmpty;
    }
    if (typeof input === 'string') {
      return input ? cls : clsEmpty;
    }
    return input === 0 ? clsEmpty : cls;
  }
  /**
   * Compute size of the HTTP headers.
   * Note, it only checks for number of lines. It doeasn't check if each line
   * contains string.
   *
   * @param {String} headers The headers strings to count.
   * @return {Number} Size of the headers in passed string.
   */
  _computeHeadersLength(headers) {
    if (!headers) {
      return 0;
    }
    return headers.split('\n').length;
  }

  _roundTime(num) {
    num = Number(num);
    if (num !== num) {
      return '';
    }
    return num.toFixed(2);
  }
  // Toggles collapsable element.
  toggleCollapse() {
    this.opened = !this.opened;
  }
  // Computes class for the toggle's button icon.
  _computeToggleIconClass(opened) {
    let clazz = 'toggle-icon';
    if (opened) {
      clazz += ' opened';
    }
    return clazz;
  }
  /**
   * Runs status text recognition after ~100 ms to ensure a status message
   * is displayed even if there wasn't any.
   */
  assignStatusMessage() {
    if (this.statusMessage) {
      return;
    }
    this.statusMessage = StatusMessage.getMessage(this.statusCode);
  }
  /**
   * Resets current tab when isXhr is true.
   * @param {Boolean} value current state of `isXhr`
   */
  _isXhrChanged(value) {
    if (value === undefined) {
      return;
    }
    if (value && this.selectedTab > 1) {
      this.selectedTab = 0;
    }
    const tabs = this.shadowRoot.querySelector('anypoint-tabs');
    if (!tabs) {
      return;
    }
    tabs.notifyResize();
  }
  /**
   * A handler for the selection change on the anypoint-tabs elemet.
   * @param {CustomEvent} e
   */
  _tabChangeHandler(e) {
    this.selectedTab = e.detail.value;
  }
}
window.customElements.define('response-status-view', ResponseStatusView);
