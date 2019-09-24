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
import authStyles from './auth-methods-styles.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-input/anypoint-masked-input.js';
import '@polymer/iron-form/iron-form.js';
import '@polymer/iron-icon/iron-icon.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
/**
 * The `<auth-method-digest>` element displays a form for digest authentication.
 * The user have to choose is he want to provide username and password only or
 * all digest parameters to calculate final authorization header.
 *
 * In first case, the listeners and the transport method must perform handshake
 * by it's own. Otherwise authorization header should be set with calculated value.
 *
 * ### Example
 * ```
 * <auth-method-digest username="john" password="doe"></auth-method-digest>
 * ```
 *
 * The `settings` property (of the element or even detail property) for full form
 * has the following structure:
 *
 * ```
 * {
 *  "username": String,
 *  "realm": String,
 *  "nonce": String,
 *  "uri": String,
 *  "response": String,
 *  "opaque": String,
 *  "qop": String - can be empty,
 *  "nc": String,
 *  "cnonce": String
 * }
 * ```
 *
 * ## Response calculation
 * Depending on the algorithm and quality of protection (qop) properties the hasing
 * algorithm may need following data:
 * - request URL
 * - request payload (body)
 * - request HTTP method
 *
 * The element should be provided with this information by setting it's properties.
 * However, the element will listen for `url-value-changed`, `http-method-changed`
 * and `body-value-changed` events on the window object. Once the event is handled
 * it will set up corresponding properties.
 * All this events must have a `value` property set on event's detail object.
 *
 * @customElement
 * @memberof UiElements
 * @demo demo/digest.html
 * @extends AuthMethodBase
 */
class AuthMethodDigest extends AuthMethodBase {
  static get styles() {
    return [
      authStyles,
      css`
      :host {
        display: block;
      }`
    ];
  }

  render() {
    const {
      username,
      password,
      outlined,
      compatibility,
      readOnly,
      disabled,
      fullForm
    } = this;
    return html`
    <iron-form>
      <form autocomplete="on">
        <anypoint-input
          .value="${username}"
          @input="${this._valueHandler}"
          name="username"
          type="text"
          required
          autovalidate
          autocomplete="on"
          .outlined="${outlined}"
          .compatibility="${compatibility}"
          .readOnly="${readOnly}"
          .disabled="${disabled}"
          invalidmessage="Username is required">
          <label slot="label">User name</label>
        </anypoint-input>
        <anypoint-masked-input
          name="password"
          .value="${password}"
          @input="${this._valueHandler}"
          autocomplete="on"
          .outlined="${outlined}"
          .compatibility="${compatibility}"
          .readOnly="${readOnly}"
          .disabled="${disabled}">
          <label slot="label">Password</label>
        </anypoint-masked-input>

        <div class="adv-toggle">
          <anypoint-checkbox
            class="adv-settings-input"
            .checked="${fullForm}"
            @change="${this._advHandler}"
            .disabled="${disabled || readOnly}"
          >Advanced settings</anypoint-checkbox>
        </div>

        ${fullForm ? html`<div class="extended-form">
          <anypoint-input
            .value="${this.realm}"
            @input="${this._valueHandler}"
            name="realm"
            type="text"
            required
            autovalidate
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Realm is required">
            <label slot="label">Server issued realm</label>
          </anypoint-input>

          <anypoint-input
            .value="${this.nonce}"
            @input="${this._valueHandler}"
            name="nonce"
            type="text"
            required
            autovalidate
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Nonce is required">
            <label slot="label">Server issued nonce</label>
          </anypoint-input>

          <anypoint-dropdown-menu
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Quality of protection</label>
            <anypoint-listbox
              slot="dropdown-content"
              .selected="${this.qop}"
              @selected-changed="${this._qopHandler}"
              .outlined="${outlined}"
              .compatibility="${compatibility}"
              .readOnly="${readOnly}"
              .disabled="${disabled}"
              attrforselected="data-qop">
              <anypoint-item .compatibility="${compatibility}" data-qop="auth">auth</anypoint-item>
              <anypoint-item .compatibility="${compatibility}" data-qop="auth-int">auth-int</anypoint-item>
            </anypoint-listbox>
          </anypoint-dropdown-menu>

          <anypoint-input
            .value="${this.nc}"
            @input="${this._valueHandler}"
            name="nc"
            type="number"
            required
            autovalidate
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Nonce count is required">
            <label slot="label">Nounce count</label>
          </anypoint-input>

          <anypoint-dropdown-menu
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Hash algorithm</label>
            <anypoint-listbox
              slot="dropdown-content"
              .selected="${this.algorithm}"
              @selected-changed="${this._algorithmHandler}"
              .outlined="${outlined}"
              .compatibility="${compatibility}"
              .readOnly="${readOnly}"
              .disabled="${disabled}"
              attrforselected="data-algorithm">
              <anypoint-item .compatibility="${compatibility}" data-algorithm="MD5">MD5</anypoint-item>
              <anypoint-item .compatibility="${compatibility}" data-algorithm="MD5-sess">MD5-sess</anypoint-item>
            </anypoint-listbox>
          </anypoint-dropdown-menu>

          <anypoint-input
            .value="${this.opaque}"
            @input="${this._valueHandler}"
            name="opaque"
            type="text"
            required
            autovalidate
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Server issued opaque is required">
            <label slot="label">Server issued opaque string</label>
          </anypoint-input>

          <anypoint-input
            .value="${this.cnonce}"
            @input="${this._valueHandler}"
            name="cnonce"
            type="text"
            required
            autovalidate
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Client nounce is required">
            <label slot="label">Client nounce</label>
          </anypoint-input>
        </div>` : ''}
      </form>
    </iron-form>`;
  }

  static get properties() {
    return {
      // The password.
      password: { type: String },
      // The username.
      username: { type: String },
      // If set then it will display all form fields.
      fullForm: { type: Boolean },
      // Server issued realm.
      realm: { type: String },
      // Server issued nonce.
      nonce: { type: String },
      // The realm value for the digest response.
      algorithm: { type: String },
      /**
       * The quality of protection value for the digest response.
       * Either '', 'auth' or 'auth-int'
       */
      qop: { type: String },
      // Nonce count - increments with each request used with the same nonce
      nc: { type: Number },
      // Client nonce
      cnonce: { type: String },
      // A string of data specified by the server
      opaque: { type: String },
      // Hashed response to server challenge
      response: { type: String },
      // Request HTTP method
      httpMethod: { type: String },
      // Current request URL.
      requestUrl: { type: String },

      _requestUri: { type: String },
      // Current request body.
      requestBody: { type: String }
    };
  }

  get requestUrl() {
    return this._requestUrl;
  }

  set requestUrl(value) {
    const old = this._requestUrl;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._requestUrl = value;
    this._processRequestUrl(value);
  }

  constructor() {
    super('digest');
    this.nc = 1;
    this.algorithm = 'MD5';
    this._onUrlChanged = this._onUrlChanged.bind(this);
    this._onHttpMethodChanged = this._onHttpMethodChanged.bind(this);
    this._onBodyChanged = this._onBodyChanged.bind(this);
    this._onAuthSettings = this._onAuthSettings.bind(this);
  }

  _attachListeners(node) {
    node.addEventListener('url-value-changed', this._onUrlChanged);
    node.addEventListener('http-method-changed', this._onHttpMethodChanged);
    node.addEventListener('body-value-changed', this._onBodyChanged);
    node.addEventListener('auth-settings-changed', this._onAuthSettings);
  }

  _detachListeners(node) {
    node.removeEventListener('url-value-changed', this._onUrlChanged);
    node.removeEventListener('http-method-changed', this._onHttpMethodChanged);
    node.removeEventListener('body-value-changed', this._onBodyChanged);
    node.removeEventListener('auth-settings-changed', this._onAuthSettings);
  }

  firstUpdated() {
    this._settingsChanged();
  }
  /**
   * Validates the form.
   *
   * @return {Boolean} Validation result.
   */
  validate() {
    const form = this.shadowRoot.querySelector('iron-form');
    /* istanbul ignore if */
    if (!form) {
      return true;
    }
    return form ? form.validate() : true;
  }
  /**
   * Returns current settings. Object's structure depends on `fullForm`
   * property. If it's `false` then the object will contain username and
   * password. Otherwise it will contain a list of parameters of the
   * Authorization header.
   *
   * @return {Object}
   */
  getSettings() {
    if (!this.fullForm) {
      return {
        password: this.password || '',
        username: this.username || ''
      };
    }
    this.response = this.generateResponse();
    const settings = {};
    settings.username = this.username || '';
    settings.password = this.password || '';
    settings.realm = this.realm;
    settings.nonce = this.nonce;
    settings.uri = this._requestUri;
    settings.response = this.response;
    settings.opaque = this.opaque;
    settings.qop = this.qop;
    settings.nc = ('00000000' + this.nc).slice(-8);
    settings.cnonce = this.cnonce;
    settings.algorithm = this.algorithm;
    return settings;
  }

  /**
   * Restores settings from stored value.
   *
   * @param {Object} settings Object returned by `_getSettings()`
   */
  restore(settings) {
    this.username = settings.username;
    this.password = settings.password;
    this.realm = settings.realm;
    this.nonce = settings.nonce;
    this.opaque = settings.opaque;
    this.qop = settings.qop;
    this.cnonce = settings.cnonce;
    if (settings.uri) {
      this._requestUri = settings.uri;
    }
    if (settings.nc) {
      this.nc = Number(settings.nc.replace(/0+/, ''));
    }
  }

  _processInput() {
    if (this.fullForm) {
      if (!this.nc) {
        this.nc = 1;
        return;
      }
      if (!this.cnonce) {
        this.cnonce = this.generateCnonce();
        return;
      }
    }
  }
  /**
   * Generates client nonce.
   *
   * @return {String} Generated client nonce.
   */
  generateCnonce() {
    const characters = 'abcdef0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      const randNum = Math.round(Math.random() * characters.length);
      token += characters.substr(randNum, 1);
    }
    return token;
  }
  /**
   * Generates the response header based on the parameters provided in the
   * form.
   *
   * See https://en.wikipedia.org/wiki/Digest_access_authentication#Overview
   *
   * @return {String} A response part of the authenticated digest request.
   */
  generateResponse() {
    /* global CryptoJS */
    const HA1 = this._getHA1();
    const HA2 = this._getHA2();
    const ncString = ('00000000' + this.nc).slice(-8);
    let responseStr = HA1 + ':' + this.nonce;
    if (!this.qop) {
      responseStr += ':' + HA2;
    } else {
      responseStr += ':' + ncString + ':' + this.cnonce + ':' + this.qop + ':' + HA2;
    }
    return CryptoJS.MD5(responseStr).toString();
  }
  // Generates HA1 as defined in Digest spec.
  _getHA1() {
    let HA1param = this.username + ':' + this.realm + ':' + this.password;
    let HA1 = CryptoJS.MD5(HA1param).toString();

    if (this.algorithm === 'MD5-sess') {
      HA1param = HA1 + ':' + this.nonce + ':' + this.cnonce;
      HA1 = CryptoJS.MD5(HA1param).toString();
    }
    return HA1;
  }
  // Generates HA2 as defined in Digest spec.
  _getHA2() {
    let HA2param = this.httpMethod + ':' + this._requestUri;
    if (this.qop === 'auth-int') {
      HA2param += ':' + CryptoJS.MD5(this.requestBody).toString();
    }
    return CryptoJS.MD5(HA2param).toString();
  }
  /**
   * Handler to the `url-value-changed` event. When the element handle this
   * event it will update the `requestUrl` property.
   * @param {CustomEvent} e
   */
  _onUrlChanged(e) {
    this.requestUrl = e.detail.value;
  }
  /**
   * Handler to the `http-method-changed` event. When the element handle this
   * event it will update the `httpMethod` property.
   * @param {CustomEvent} e
   */
  _onHttpMethodChanged(e) {
    this.httpMethod = e.detail.value;
    this._processInput();
    this._settingsChanged();
  }
  /**
   * Handler to the `body-value-changed` event. When the element handle this
   * event it will update the `requestBody` property.
   * @param {CustomEvent} e
   */
  _onBodyChanged(e) {
    this.requestBody = e.detail.value;
    this._processInput();
    this._settingsChanged();
  }
  /**
   * Handler to the `auth-settings-changed` event (fired by all auth panels).
   * If the event was fired by other element with the same method ttype
   * then the form will be updated to incomming values.
   * This helps to sync changes between elements in the same app.
   * @param {CustomEvent} e
   */
  _onAuthSettings(e) {
    const target = this._getEventTarget(e);
    if (target === this || e.detail.type !== 'digest') {
      return;
    }
    this.restore(e.detail.settings);
  }

  _advHandler(e) {
    this._processInput();
    this._setSettingsInputValue('fullForm', e.target.checked);
  }

  _qopHandler(e) {
    this._processInput();
    this._setSettingsInputValue('qop', e.detail.value);
  }

  _algorithmHandler(e) {
    this._processInput();
    this._setSettingsInputValue('algorithm', e.detail.value);
  }

  _valueHandler(e) {
    const { name, value } = e.target;
    this._processInput();
    this._setSettingsInputValue(name, value);
  }

  _processRequestUrl(value) {
    if (!value || typeof value !== 'string') {
      this._requestUri = undefined;
      this._processInput();
      this._settingsChanged();
      return;
    }
    try {
      const url = new URL(value);
      value = url.pathname;
    } catch (_) {
      value = value.trum();
    }
    this._requestUri = value;
    this._processInput();
    this._settingsChanged();
  }
  /**
   * Fired when error occured when decoding hash.
   *
   * @event error
   * @param {Error} error The error object.
   */
  /**
   * Fired when the any of the auth method settings has changed.
   * This event will be fired quite frequently - each time anything in the text field changed.
   * With one exception. This event will not be fired if the validation of the form didn't passed.
   *
   * @event auth-settings-changed
   * @param {Object} settings Current settings containing hash, password
   * and username.
   * @param {String} type The authorization type - basic
   * @param {Boolean} valid True if the form has been validated.
   */
}
window.customElements.define('auth-method-digest', AuthMethodDigest);
