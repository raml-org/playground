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
import { html, css } from 'lit-element';
import { AuthMethodBase } from './auth-method-base.js';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import authStyles from './auth-methods-styles.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import { cached } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-input/anypoint-masked-input.js';
import '@polymer/iron-form/iron-form.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@polymer/paper-toast/paper-toast.js';
import '@polymer/paper-spinner/paper-spinner.js';
/**
 * The `<auth-method-oauth1>` element displays a form to provide the OAuth 1a settings.
 *
 * ### Example
 *
 * ```html
 * <auth-method-oauth1 consumer-key="xyz"></auth-method-oauth1>
 * ```
 *
 * ### Required form fields
 *
 * - Consumer key
 * - Timestamp
 * - Nonce
 * - Signature method
 *
 * ## Authorizing the user
 *
 * This element displays form for user input only. To perform authorization and
 * later to sign the request, add `oauth-authorization/oauth1-authorization.html`
 * to the DOM. This element sends `oauth1-token-requested` that is handled by
 * autorization element.
 *
 * Note that the OAuth1 authorization wasn't designed for browser. Most existing
 * OAuth1 implementation disallow browsers to perform the authorization by
 * not allowing POST requests to authorization server. Therefore receiving token
 * may not be possible without using browser extensions to alter HTTP request to
 * enable CORS.
 * If the server disallow obtaining authorization token and secret from clients
 * then the application should listen for `oauth1-token-requested` custom event
 * and perform authorization on the server side.
 *
 * When application is performing authorization instead of `oauth1-authorization`
 * element then the application should dispatch `oauth1-token-response` custom event
 * with `oauth_token` and `oauth_token_secret` properties set on detail object.
 * This element handles the response to reset UI state and to updates other elements
 * status that works with authorization.
 *
 * ## Signing the request
 *
 * See description for `oauth-authorization/oauth1-authorization.html` element.
 *
 * @customElement
 * @memberof UiElements
 * @appliesMixin ApiElements.AmfHelperMixin
 * @demo demo/oauth1.html
 * @extends AuthMethodBase
 */
class AuthMethodOauth1 extends AmfHelperMixin(AuthMethodBase) {
  static get styles() {
    return [
      authStyles,
      css`
      :host {
        display: block;
      }

      .form {
        max-width: 700px;
      }

      .grant-dropdown {
        width: 320px;
      }

      .authorize-actions {
        margin-top: 12px;
      }`
    ];
  }

  render() {
    const {
      authTokenMethod,
      authParamsLocation,
      consumerKey,
      consumerSecret,
      token,
      tokenSecret,
      requestTokenUri,
      accessTokenUri,
      authorizationUri,
      redirectUri,
      timestamp,
      nonce,
      realm,
      signatureMethod,
      signatureMethods,
      _authorizing,
      outlined,
      compatibility,
      readOnly,
      disabled
    } = this;
    const hasSignatureMethods = !!(signatureMethods && signatureMethods.length);
    return html`
    <div class="form">
      <iron-form>
        <form autocomplete="on">
          <anypoint-dropdown-menu
            name="authTokenMethod"
            required
            autovalidate
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Authorization token method</label>
            <anypoint-listbox
              slot="dropdown-content"
              .selected="${authTokenMethod}"
              @selected-changed="${this._selectionHandler}"
              data-name="authTokenMethod"
              .outlined="${outlined}"
              .compatibility="${compatibility}"
              .readOnly="${readOnly}"
              .disabled="${disabled}"
              attrforselected="data-value"
            >
              <anypoint-item .compatibility="${compatibility}" data-value="GET">GET</anypoint-item>
              <anypoint-item .compatibility="${compatibility}" data-value="POST">POST</anypoint-item>
            </anypoint-listbox>
          </anypoint-dropdown-menu>

          <anypoint-dropdown-menu
            required
            autovalidate
            name="authParamsLocation"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Oauth parameters location</label>
            <anypoint-listbox
              slot="dropdown-content"
              .selected="${authParamsLocation}"
              @selected-changed="${this._selectionHandler}"
              data-name="authParamsLocation"
              .outlined="${outlined}"
              .compatibility="${compatibility}"
              .readOnly="${readOnly}"
              .disabled="${disabled}"
              attrforselected="data-value"
            >
              <anypoint-item .compatibility="${compatibility}" data-value="querystring">Query string</anypoint-item>
              <anypoint-item .compatibility="${compatibility}"
                data-value="authorization">Authorization header</anypoint-item>
            </anypoint-listbox>
          </anypoint-dropdown-menu>

          <anypoint-masked-input
            required
            autovalidate
            name="consumerKey"
            .value="${consumerKey}"
            @input="${this._valueHandler}"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Consumer key is required"
          >
            <label slot="label">Consumer key</label>
          </anypoint-masked-input>

          <anypoint-masked-input
            name="consumerSecret"
            .value="${consumerSecret}"
            @input="${this._valueHandler}"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Consumer secret</label>
          </anypoint-masked-input>

          <anypoint-masked-input
            name="token"
            .value="${token}"
            @input="${this._valueHandler}"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Token</label>
          </anypoint-masked-input>

          <anypoint-masked-input
            name="tokenSecret"
            .value="${tokenSecret}"
            @input="${this._valueHandler}"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Token secret</label>
          </anypoint-masked-input>

          <anypoint-input
            name="requestTokenUri"
            .value="${requestTokenUri}"
            @input="${this._valueHandler}"
            type="text"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Request token URL</label>
          </anypoint-input>

          <anypoint-input
            name="accessTokenUri"
            .value="${accessTokenUri}"
            @input="${this._valueHandler}"
            type="url"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Token Authorization URL</label>
          </anypoint-input>

          <anypoint-input
            name="authorizationUri"
            .value="${authorizationUri}"
            @input="${this._valueHandler}"
            type="url"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">User authorization dialog URL</label>
          </anypoint-input>

          <anypoint-input
            name="redirectUri"
            .value="${redirectUri}"
            @input="${this._valueHandler}"
            type="url"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
          >
            <label slot="label">Redirect URL</label>
          </anypoint-input>

          <anypoint-input
            required
            autovalidate
            name="timestamp"
            .value="${timestamp}"
            @input="${this._valueHandler}"
            type="number"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Timestamp is required">
            <label slot="label">Timestamp</label>
            <anypoint-icon-button
              slot="suffix"
              title="Regenerate timestamp"
              aria-label="Press to regenerate timestamp"
              @click="${this._genTimestamp}"
            >
              <span class="icon">${cached}</span>
            </anypoint-icon-button>
          </anypoint-input>

          <anypoint-input
            required
            autovalidate
            name="nonce"
            .value="${nonce}"
            @input="${this._valueHandler}"
            type="text"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}"
            invalidmessage="Nonce is required">
            <label slot="label">Nonce</label>
            <anypoint-icon-button
              slot="suffix"
              title="Regenerate nonce"
              aria-label="Press to regenerate nonce"
              @click="${this._genNonce}"
            >
              <span class="icon">${cached}</span>
            </anypoint-icon-button>
          </anypoint-input>

          <anypoint-input
            name="realm"
            .value="${realm}"
            @input="${this._valueHandler}"
            type="text"
            autocomplete="on"
            .outlined="${outlined}"
            .compatibility="${compatibility}"
            .readOnly="${readOnly}"
            .disabled="${disabled}">
            <label slot="label">Realm</label>
          </anypoint-input>

          ${hasSignatureMethods ?
            html`<anypoint-dropdown-menu
              required
              autovalidate
              name="signatureMethod"
              .outlined="${outlined}"
              .compatibility="${compatibility}"
              .readOnly="${readOnly}"
              .disabled="${disabled}"
            >
              <label slot="label">Signature method</label>
              <anypoint-listbox
                slot="dropdown-content"
                .selected="${signatureMethod}"
                @selected-changed="${this._selectionHandler}"
                data-name="signatureMethod"
                .outlined="${outlined}"
                .compatibility="${compatibility}"
                .readOnly="${readOnly}"
                .disabled="${disabled}"
                attrforselected="data-value">
                ${signatureMethods.map((item) =>
              html`<anypoint-item .compatibility="${compatibility}" data-value="${item}">${item}</anypoint-item>`)}
              </anypoint-listbox>
            </anypoint-dropdown-menu>` :
            ''}

          <div class="authorize-actions">
            <anypoint-button
              ?disabled="${_authorizing}"
              class="auth-button"
              @click="${this.authorize}">Authorize</anypoint-button>
            <paper-spinner .active="${_authorizing}"></paper-spinner>
          </div>
        </form>
      </iron-form>
    </div>
    <paper-toast text="" duration="5000"></paper-toast>`;
  }

  static get properties() {
    return {
      // Client ID aka consumer key
      consumerKey: { type: String },
      // The client secret aka consumer secret
      consumerSecret: { type: String },
      // Oauth 1 token (from the oauth console)
      token: { type: String },
      // Oauth 1 token secret (from the oauth console)
      tokenSecret: { type: String },
      // Timestamp
      timestamp: { type: Number },
      // The nonce generated for this request
      nonce: { type: String },
      // Optional realm
      realm: { type: String },
      /**
       * Signature method. Enum {`HMAC-SHA256`, `HMAC-SHA1`, `PLAINTEXT`}
       */
      signatureMethod: { type: String },

      // True when currently authorizing the user.
      _authorizing: { type: Boolean },
      /**
       * Authorization callback URI
       */
      redirectUri: { type: String },
      /**
       * OAuth1 endpoint to obtain request token to request user authorization.
       */
      requestTokenUri: { type: String },
      /**
       * Endpoint to authorize the token.
       */
      accessTokenUri: { type: String },
      /**
       * HTTP method to obtain authorization header.
       * Spec recommends POST
       */
      authTokenMethod: { type: String },
      /**
       * A location of the OAuth 1 authorization parameters.
       * It can be either in the URL as a query string (`querystring` value)
       * or in the authorization header (`authorization`) value.
       */
      authParamsLocation: { type: String },
      /**
       * An URI to authentication endpoint where the user should be redirected
       * to auththorize the app.
       */
      authorizationUri: { type: String },
      /**
       * RAML `securedBy` obejct definition.
       * If set, it will prefill the settings in the auth panel.
       */
      amfSettings: { type: Object },
      /**
       * List of currently support signature methods.
       * This can be updated when `amfSettings` property is set.
       */
      signatureMethods: { type: Array }
    };
  }
  /**
   * Returns default list of signature methods for OAuth1
   */
  get defaultSignatureMethods() {
    return ['HMAC-SHA1', 'RSA-SHA1', 'PLAINTEXT'];
  }

  get amfSettings() {
    return this._amfSettings;
  }

  set amfSettings(value) {
    /* istanbul ignore else */
    if (this._sop('amfSettings', value)) {
      this._amfSettingsChanged();
    }
  }

  constructor() {
    super('oauth1');
    this._oauth1ErrorHandler = this._oauth1ErrorHandler.bind(this);
    this._tokenResponseHandler = this._tokenResponseHandler.bind(this);

    this.signatureMethod = 'HMAC-SHA1';
    this.authTokenMethod = 'POST';
    this.authParamsLocation = 'authorization';
    this._genTimestamp();
    this._genNonce();
  }

  connectedCallback() {
    /* istanbul ignore else */
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.signatureMethods) {
      this.signatureMethods = this.defaultSignatureMethods;
    }
  }

  _attachListeners() {
    window.addEventListener('oauth1-error', this._oauth1ErrorHandler);
    window.addEventListener('oauth1-token-response', this._tokenResponseHandler);
  }

  _detachListeners() {
    window.removeEventListener('oauth1-error', this._onAuthSettings);
    window.removeEventListener('oauth1-token-response', this._tokenResponseHandler);
  }

  updated() {
    this._settingsChanged();
  }
  /**
   * Overrides `AmfHelperMixin.__amfChanged`
   */
  __amfChanged() {
    this._amfSettingsChanged();
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

  _createModel(type) {
    let validationResult = this.validate();
    const settings = this.getSettings();
    if (validationResult) {
      if (!settings || !settings.token || !settings.tokenSecret) {
        validationResult = false;
      }
    }
    return {
      settings,
      type,
      valid: validationResult
    };
  }

  getSettings() {
    return {
      consumerKey: this.consumerKey,
      consumerSecret: this.consumerSecret,
      token: this.token,
      tokenSecret: this.tokenSecret,
      timestamp: this.timestamp,
      nonce: this.nonce,
      realm: this.realm,
      signatureMethod: this.signatureMethod,
      requestTokenUri: this.requestTokenUri,
      accessTokenUri: this.accessTokenUri,
      redirectUri: this.redirectUri,
      authTokenMethod: this.authTokenMethod,
      authParamsLocation: this.authParamsLocation,
      authorizationUri: this.authorizationUri,
      type: 'oauth1'
    };
  }

  /**
   * Restores settings from stored value.
   *
   * @param {Object} settings Object returned by `_getSettings()`
   */
  restore(settings) {
    this.consumerKey = settings.consumerKey;
    this.consumerSecret = settings.consumerSecret;
    this.token = settings.token;
    this.tokenSecret = settings.tokenSecret;
    this.timestamp = settings.timestamp;
    this.nonce = settings.nonce;
    this.realm = settings.realm;
    this.signatureMethod = settings.signatureMethod;
    this.requestTokenUri = settings.requestTokenUri;
    this.accessTokenUri = settings.accessTokenUri;
    this.redirectUri = settings.redirectUri;
    this.authTokenMethod = settings.authTokenMethod;
    this.authParamsLocation = settings.authParamsLocation;
    this.authorizationUri = settings.authorizationUri;
  }
  /**
   * Sends the `oauth2-token-requested` event.
   * @return {Boolean} True if event was sent. Can be false if event is not
   * handled or when the form is invalid.
   */
  authorize() {
    this._authorizing = true;
    const detail = {};
    if (this.consumerKey) {
      detail.consumerKey = this.consumerKey;
    }
    if (this.consumerSecret) {
      detail.consumerSecret = this.consumerSecret;
    }
    if (this.token) {
      detail.token = this.token;
    }
    if (this.tokenSecret) {
      detail.tokenSecret = this.tokenSecret;
    }
    /* istanbul ignore else */
    if (this.timestamp) {
      detail.timestamp = this.timestamp;
    }
    /* istanbul ignore else */
    if (this.nonce) {
      detail.nonce = this.nonce;
    }
    if (this.realm) {
      detail.realm = this.realm;
    }
    /* istanbul ignore else */
    if (this.signatureMethod) {
      detail.signatureMethod = this.signatureMethod;
    }
    if (this.requestTokenUri) {
      detail.requestTokenUri = this.requestTokenUri;
    }
    if (this.accessTokenUri) {
      detail.accessTokenUri = this.accessTokenUri;
    }
    if (this.redirectUri) {
      detail.redirectUri = this.redirectUri;
    }
    /* istanbul ignore else */
    if (this.authParamsLocation) {
      detail.authParamsLocation = this.authParamsLocation;
    }
    /* istanbul ignore else */
    if (this.authTokenMethod) {
      detail.authTokenMethod = this.authTokenMethod;
    }
    if (this.authorizationUri) {
      detail.authorizationUri = this.authorizationUri;
    }
    detail.type = 'oauth1';
    this.dispatchEvent(new CustomEvent('oauth1-token-requested', {
      detail,
      bubbles: true,
      composed: true,
      camcelable: true
    }));
    return true;
  }
  /**
   * Handles OAuth1 authorization errors.
   *
   * @param {CustomEvent} e
   */
  _oauth1ErrorHandler(e) {
    this._authorizing = false;
    const toast = this.shadowRoot.querySelector('paper-toast');
    toast.text = e.detail.message;
    toast.opened = true;
  }

  /**
   * Handler for the `oauth1-token-response` custom event.
   * Sets `token` and `tokenSecret` properties from the event.
   *
   * @param {CustomEvent} e
   */
  _tokenResponseHandler(e) {
    this._authorizing = false;
    this.token = e.detail.oauth_token;
    this.tokenSecret = e.detail.oauth_token_secret;
  }
  // Sets timestamp in seconds
  _genTimestamp() {
    const t = Math.floor(Date.now() / 1000);
    this.timestamp = t;
  }
  /**
   * Sets autogenerated nocne
   * @param {?Number} length Optional, size of generated string. Default to 32.
   */
  _genNonce() {
    const result = [];
    const chrs = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const chrsLength = chrs.length;
    const length = 32;
    for (let i = 0; i < length; i++) {
      result[result.length] = (chrs[Math.floor(Math.random() * chrsLength)]);
    }
    this.nonce = result.join('');
  }
  /**
   * Called when the AMF object change
   */
  _amfSettingsChanged() {
    const model = this.amfSettings;
    if (!model) {
      this.signatureMethods = this.defaultSignatureMethods;
      return;
    }
    const prefix = this.ns.raml.vocabularies.security;
    const shKey = this._getAmfKey(prefix + 'scheme');
    let scheme = model[shKey];
    let type;
    if (scheme) {
      if (scheme instanceof Array) {
        scheme = scheme[0];
      }
      type = this._getValue(scheme, prefix + 'type');
    }
    if (type !== 'OAuth 1.0') {
      this.signatureMethods = this.defaultSignatureMethods;
      return;
    }
    const sKey = this._getAmfKey(this.ns.raml.vocabularies.security + 'settings');
    let settings = scheme[sKey];
    if (settings instanceof Array) {
      settings = settings[0];
    }
    if (!settings) {
      this.signatureMethods = this.defaultSignatureMethods;
      return;
    }
    this.requestTokenUri = this._getValue(settings, prefix + 'requestTokenUri');
    this.authorizationUri = this._getValue(settings, prefix + 'authorizationUri');
    this.accessTokenUri = this._getValue(settings, prefix + 'tokenCredentialsUri');
    const signaturtes = this._getValueArray(settings, prefix + 'signature');
    if (!signaturtes || !signaturtes.length) {
      this.signatureMethods = this.defaultSignatureMethods;
    } else {
      this.signatureMethods = signaturtes;
    }
  }

  _selectionHandler(e) {
    const { value } = e.detail;
    const { name } = e.target.parentElement;
    this._setSettingsInputValue(name, value);
  }

  _valueHandler(e) {
    const { name, value } = e.target;
    this._setSettingsInputValue(name, value);
  }
  /**
   * Fired when user requested to perform an authorization.
   * The details object vary depends on the `grantType` property.
   * However this event always fire two properties set on the `detail` object: `type` and
   * `clientId`.
   *
   * @event oauth1-token-requested
   * @param {String} consumerKey The consumer key. May be undefined if not provided.
   * @param {String} consumerSecret May be undefined if not provided.
   * @param {String} token May be undefined if not provided.
   * @param {String} tokenSecret May be undefined if not provided.
   * @param {String} timestamp May be undefined if not provided.
   * @param {String} nonce May be undefined if not provided.
   * @param {String} realm May be undefined if not provided.
   * @param {String} signatureMethod May be undefined if not provided.
   * @param {String} type Always `oauth1`
   */
  /**
   * Fired when the any of the auth method settings has changed.
   * This event will be fired quite frequently - each time anything in the text field changed.
   * With one exception. This event will not be fired if the validation of the form didn't passed.
   *
   * @event auth-settings-changed
   * @param {Object} settings Current settings. See the
   * `oauth1-token-requested` for detailed description.
   * @param {String} type The authorization type - oauth1
   */
}
window.customElements.define('auth-method-oauth1', AuthMethodOauth1);
