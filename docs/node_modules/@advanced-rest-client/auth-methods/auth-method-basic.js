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
 * The `<auth-method-basic>` element displays a form to provide the Basic
 * auth credentials.
 * It calculates base64 has while typing into username or password field.
 *
 * It accepts `hash` as a property and once set it will atempt to decode it
 * and set username and paswword.
 *
 * ### Example
 *
 * ```html
 * <auth-method-basic hash="dGVzdDp0ZXN0"></auth-method-basic>
 * ```
 *
 * This example will produce a form with prefilled username and passowrd with
 * value "test".
 *
 * @customElement
 * @memberof UiElements
 * @demo demo/basic.html
 * @extends AuthMethodBase
 */
class AuthMethodBasic extends AuthMethodBase {
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
      disabled
    } = this;
    return html`
      <iron-form>
        <form autocomplete="on">
          <anypoint-input
            .value="${username}"
            @input="${this._usernameHandler}"
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
            @input="${this._passwordHandler}"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}">
            <label slot="label">Password</label>
          </anypoint-masked-input>
        </form>
      </iron-form>`;
  }

  static get properties() {
    return {
      // The password.
      password: { type: String },
      // The username.
      username: { type: String }
    };
  }
  /**
   * @return {String} base64 hash of the uid and passwd. When set it will override
   * current username and password.
   */
  get hash() {
    let { username, password } = this;
    if (!username) {
      username = '';
    }
    if (!password) {
      password = '';
    }
    let hash;
    if (username || password) {
      const enc = `${username}:${password}`;
      hash = btoa(enc);
    } else {
      hash = '';
    }
    return hash;
  }

  get username() {
    return this._username || '';
  }

  set username(value) {
    /* istanbul ignore else */
    if (this._sop('username', value)) {
      this._valueChanged();
      this._notifyChanged('username', value);
    }
  }

  get password() {
    return this._password || '';
  }

  set password(value) {
    /* istanbul ignore else */
    if (this._sop('password', value)) {
      this._valueChanged();
      this._notifyChanged('password', value);
    }
  }

  constructor() {
    super('basic');
    this._onAuthSettings = this._onAuthSettings.bind(this);
  }

  _attachListeners(node) {
    node.addEventListener('auth-settings-changed', this._onAuthSettings);
  }

  _detachListeners(node) {
    node.removeEventListener('auth-settings-changed', this._onAuthSettings);
  }

  firstUpdated() {
    this._valueChanged();
  }

  /**
   * Resets state of the form.
   */
  reset() {
    this.username = '';
    this.password = '';
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
    return form.validate();
  }
  /**
   * Creates a settings object with user provided data.
   *
   * @return {Object} User provided data
   */
  getSettings() {
    return {
      hash: this.hash,
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
    this.password = settings.password;
    this.username = settings.username;
  }
  /**
   * Handler to the `auth-settings-changed` event (fired by all auth panels).
   * If the event was fired by other element with the same method ttype
   * then the form will be updated to incomming values.
   * This helps to sync changes between elements in the same app.
   *
   * @param {Event} e
   */
  _onAuthSettings(e) {
    if (this._getEventTarget(e) === this || e.detail.type !== 'basic') {
      return;
    }
    this.restore(e.detail.settings);
  }
  /**
   * Dispatches `request-header-changed` custom event to inform other
   * elements about authorization value change.
   *
   * @param {Object} settings
   */
  _notifyHeaderChange(settings) {
    const hash = settings && settings.hash || '';
    const value = `Basic ${hash}`;
    this.dispatchEvent(new CustomEvent('request-header-changed', {
      detail: {
        name: 'Authorization',
        value
      },
      bubbles: true,
      composed: true
    }));
  }

  _usernameHandler(e) {
    this._setSettingsInputValue('username', e.target.value);
  }

  _passwordHandler(e) {
    this._setSettingsInputValue('password', e.target.value);
  }

  _valueChanged() {
    if (this.__isInputEvent) {
      return;
    }
    this._settingsChanged();
  }
  /**
   * Fired when error occured when decoding hash.
   * The event is not bubbling.
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
  /**
   * Fired when the header value has changed.
   *
   * @event request-header-changed
   * @param {String} name Name of the header
   * @param {String} value Value of the header
   */
}
window.customElements.define('auth-method-basic', AuthMethodBasic);
