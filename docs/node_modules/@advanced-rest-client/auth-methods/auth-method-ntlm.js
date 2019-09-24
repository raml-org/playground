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
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-input/anypoint-masked-input.js';
import '@polymer/iron-form/iron-form.js';
/**
 * The `<auth-method-ntlm>` element displays a form to provide the NTLM auth
 * credentials.
 *
 * It only provides data since NTLM authentication and all calculations must
 * be conducted when working on socket.
 *
 * This form requires to provide at least username and password. The domain
 * parameter is not required in NTLM so it may be empty.
 *
 * ### Example
 *
 * ```html
 * <auth-method-ntlm username="john" password="doe" domain="my-nt-domain"></auth-method-ntlm>
 * ```
 *
 * @customElement
 * @memberof UiElements
 * @demo demo/ntlm.html
 * @extends AuthMethodBase
 */
class AuthMethodNtlm extends AuthMethodBase {
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
      domain,
      outlined,
      compatibility,
      readOnly,
      disabled
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
          <anypoint-input
            .value="${domain}"
            @input="${this._valueHandler}"
            name="domain"
            type="text"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}">
            <label slot="label">NT domain</label>
          </anypoint-input>
        </form>
      </iron-form>`;
  }

  static get properties() {
    return {
      // The domain parameter for the request.
      domain: { type: String },
      // The password.
      password: { type: String },
      // The username.
      username: { type: String }
    };
  }

  get username() {
    return this._username || '';
  }

  set username(value) {
    /* istanbul ignore else */
    if (this._sop('username', value)) {
      this._valueChanged();
    }
  }

  get password() {
    return this._password || '';
  }

  set password(value) {
    /* istanbul ignore else */
    if (this._sop('password', value)) {
      this._valueChanged();
    }
  }

  get domain() {
    return this._domain || '';
  }

  set domain(value) {
    /* istanbul ignore else */
    if (this._sop('domain', value)) {
      this._valueChanged();
    }
  }

  constructor() {
    super('ntlm');
    this._onAuthSettings = this._onAuthSettings.bind(this);
  }

  firstUpdated() {
    this._valueChanged();
  }

  _attachListeners(node) {
    node.addEventListener('auth-settings-changed', this._onAuthSettings);
  }
  _detachListeners(node) {
    node.removeEventListener('auth-settings-changed', this._onAuthSettings);
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
  /**
   * Creates a settings object with user provided data.
   *
   * @return {Object} User provided data
   */
  getSettings() {
    return {
      domain: this.domain || '',
      password: this.password || '',
      username: this.username || ''
    };
  }

  /**
   * Restores settings from stored value.
   *
   * @param {Object} settings Object returned by `_getSettings()`
   */
  restore(settings) {
    this.domain = settings.domain;
    this.password = settings.password;
    this.username = settings.username;
  }

  reset() {
    this.domain = '';
    this.password = '';
    this.username = '';
  }
  /**
   * Handler for the `auth-settings-changed` event (fired by all auth panels).
   * If the event was fired by other element with the same method ttype
   * then the form will be updated to incomming values.
   *
   * @param {Event} e
   */
  _onAuthSettings(e) {
    if (this._getEventTarget(e) === this || e.detail.type !== 'ntlm') {
      return;
    }
    this.restore(e.detail.settings);
  }

  _valueHandler(e) {
    const { name, value } = e.target;
    this._setSettingsInputValue(name, value);
  }

  _valueChanged() {
    if (this.__isInputEvent) {
      return;
    }
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
   * The `domain` field is not required in the form so check for missing `domain` value if it's
   * required in your application.
   *
   * @event auth-settings-changed
   * @param {Object} settings Current settings containing domain, password
   * and username.
   * @param {String} type The authorization type - ntlm
   * @param {Boolean} valid True if the form has been validated.
   */
}
window.customElements.define('auth-method-ntlm', AuthMethodNtlm);
