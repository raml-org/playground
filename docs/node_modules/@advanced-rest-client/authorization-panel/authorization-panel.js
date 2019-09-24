/**
@license
Copyright 2019 The Advanced REST client authors <arc@mulesoft.com>
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
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import { AuthorizationPanelAmfOverlay } from './authorization-panel-amf-overlay.js';
import '@polymer/iron-meta/iron-meta.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@advanced-rest-client/auth-methods/auth-methods.js';
/**
 * Authorization panel used in the request panel to get user authorization information.
 *
 * @customElement
 * @memberof UiElements
 * @appliesMixin EventsTargetMixin
 * @appliesMixin AuthorizationPanelAmfOverlay
 * @demo demo/basic.html Basic element
 * @demo demo/meta-data.html IronMeta defined methods
 * @demo demo/amf.html RAML or OAS data from AMF model
 * @demo demo/amf-meta.html RAML or OAS data from AMF model and IronMeta
 */
class AuthorizationPanel extends AuthorizationPanelAmfOverlay(EventsTargetMixin(LitElement)) {
  static get styles() {
    return css`
    :host {
      display: block;
    }

    .auth-container {
      position: relative;
    }

    .no-method-info,
    .no-support-info {
      font-style: var(--no-info-message-font-style, italic);
      font-size: var(--no-info-message-font-size, 16px);
      color: var(--no-info-message-color, rgba(0, 0, 0, 0.74));
      margin: 12px 8px;
    }

    [hidden] {
      display: none;
    }

    .auth-title-single {
      font-size: 1.28rem;
      margin: 12px 8px;
      font-weight: 200;
    }`;
  }

  static get properties() {
    return {
      /**
       * Selected authorization type. It is one of the types supported by
       * `advanced-rest-client/auth-methods` component.
       *
       * This corresponds to the index of `authMethods` array.
       */
      selected: { type: Number },
      /**
       * List of currently rendered authorization methods.
       * This value changes when `securedBy` changes to reflect number of
       * authorization methods supported by current endpoint.
       */
      authMethods: { type: Array },
      /**
       * Current settings of selected auth type.
       *
       * Can be `undefined` if the user hasn't filled all required fields in the
       * form.
       */
      settings: { type: Object },
      /**
       * The OAuth2 redirect URL to be set in the OAuth2 form pane.
       */
      redirectUri: { type: Boolean },
      /**
       * If true the panels won't render inline documentation if
       * the information is available.
       */
      noDocs: { type: Boolean },
      // Current HTTP method. Passed to digest method.
      httpMethod: { type: String },
      // Current request URL. Passed to digest method.
      requestUrl: { type: String },
      // Current request body. Passed to digest method.
      requestBody: { type: String },
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
       * If set it renders a narrow layout
       */
      narrow: { type: Boolean, reflect: true },
    };
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    const old = this._selected;
    /* istanbul ignore if */
    if (old === value) {
      return false;
    }
    this._selected = value;
    this.requestUpdate('selected', old);
    this._selectedChanged(value, old);
    this.validate();
  }

  get settings() {
    return this._settings;
  }

  set settings(value) {
    if (this._sop('settings', value)) {
      this.validate();
      this.dispatchEvent(new CustomEvent('settings-changed', {
        detail: {
          value
        }
      }));
    }
  }
  /**
   * List of authorization methods supported by this element.
   * Each item has `id` and `name` property. The `id` is internal ID for
   * authorization methods. Can be any of: `none`, `basic`, `ntlm`, `digest`,
   * `oauth1` and `oauth2`. The `name` property is a lable for the method
   * used in UI.
   * @return {Array<Object>}
   */
  get supportedMethods() {
    return [{
      'type': 'none',
      'name': 'No authorization'
    }, {
      'type': 'Basic Authentication',
      'name': 'Basic authentication'
    }, {
      'type': 'ntlm',
      'name': 'NTLM'
    }, {
      'type': 'Digest Authentication',
      'name': 'Digest authentication'
    }, {
      'type': 'OAuth 2.0',
      'name': 'OAuth 2.0'
    }, {
      'type': 'OAuth 1.0',
      'name': 'OAuth 1.0'
    }];
  }
  /**
   * @return {HTMLElement} Currently rendered authorization panel.
   */
  get currentPanel() {
    const selector = '.auth-panel > *';
    return this.shadowRoot.querySelector(selector);
  }

  constructor() {
    super();
    this.selected = 0;
    this._authSettingsHandler = this._authSettingsHandler.bind(this);
    this._onAuthSettingsChanged = this._onAuthSettingsChanged.bind(this);
  }

  _attachListeners() {
    if (!this.authMethods) {
      this.authMethods = this._listAuthMethods();
    }
    this.addEventListener('auth-settings-changed', this._authSettingsHandler);
    this.addEventListener('authorization-settings-changed', this._onAuthSettingsChanged);
  }

  _detachListeners() {
    this.removeEventListener('auth-settings-changed', this._authSettingsHandler);
    this.removeEventListener('authorization-settings-changed', this._onAuthSettingsChanged);
  }

  /**
   * Clears the state of the panel.
   */
  clear() {
    this.selected = undefined;
    this.settings = {};
    this._authRequired = false;
    this.invalid = false;
  }

  /**
   * Replaces active panel with new one and dipatches
   * `authorization-type-changed` event.
   *
   * If the event is canceled it restores previous value in the selector.
   *
   * @param {Number} selected
   * @param {Number} oldValue
   */
  _selectedChanged(selected, oldValue) {
    this._ensureAuthHeaderRemoved(oldValue);
    this._notifySettings();
  }
  /**
   * Ensures that the authorization header is removed if previously
   * selected (and now deselected) type is one of using Authorization
   * header.
   * @param {Number} oldSelected Previously selected auth method
   */
  _ensureAuthHeaderRemoved(oldSelected) {
    const methods = this.authMethods;
    if (oldSelected === undefined || !methods) {
      return;
    }
    const oldMethod = methods[oldSelected];
    const type = oldMethod && this._panelTypeToRamType(oldMethod.type);
    if (type && ['Basic Authentication', 'OAuth 1.0', 'OAuth 2.0']
      .indexOf(type) !== -1) {
      this._clearAuthHeader();
    }
  }
  /**
   * Dispatches `request-header-deleted` custom event to inform listeners
   * that `authorization` header should not be used.
   */
  _clearAuthHeader() {
    this.fire('request-header-deleted', {
      name: 'authorization'
    }, {
      cancelable: true
    });
  }
  /**
   * Lists available authorization methods.
   * By default it returns list from `supportedMethods` property which is the
   * list of all supported methods by this element.
   * If `iron-meta` element with key `auth-methods` is set then it will use
   * this information to compute list of auth methods.
   * See element description for more information.
   *
   * @return {Array<Object>} See `supportedMethods` property for data model.
   */
  _listAuthMethods() {
    const meta = this._listMetaAuthMethods();
    if (meta) {
      return meta;
    }
    return this.supportedMethods;
  }
  /**
   * Creates a listing of methods from `iron-meta` definition.
   *
   * @return {Array|undefined} List of methods defined in `iron-meta`
   * or undefined if not set.
   */
  _listMetaAuthMethods() {
    let meta = document.createElement('iron-meta').byKey('auth-methods');
    if (!meta) {
      return;
    }
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch (e) {
        return;
      }
    }
    if (!(meta instanceof Array)) {
      return;
    }
    const result = [];
    meta.forEach((key) => {
      let name;
      switch (key) {
        case null:
          name = 'No authorization';
          key = 'none';
          break;
        case 'ntlm':
          name = 'NTLM';
          break;
        case 'basic':
          name = 'Basic Authentication';
          key = name;
          break;
        case 'digest':
          name = 'Digest Authentication';
          key = name;
          break;
        case 'oauth1':
          name = 'OAuth 1.0';
          key = name;
          break;
        case 'oauth2':
          name = 'OAuth 2.0';
          key = name;
          break;
      }
      if (name) {
        result.push({
          type: key,
          name
        });
      }
    });
    return result;
  }
  /**
   * Handler for `auth-settings-changed` custom event.
   * Sets up `settings` property from the event.
   *
   * @param {CustomEvent} e
   */
  _authSettingsHandler(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (this.readOnly || this.disabled) {
      return;
    }
    this.settings = e.detail;
    this._processPanelSettings(e.detail);
    this._notifySettings();
  }
  /**
   * Restores settings to a panel including selection and data.
   *
   * @param {Object} settings The same settings object as dispatched in
   * `detail` object from this element.
   */
  restore(settings) {
    if (!settings) {
      if (this.selected || this.selected === 0) {
        this.selected = undefined;
      }
      return;
    }
    const methods = this.authMethods;
    if (!methods) {
      return;
    }
    const index = methods.findIndex((item) =>
      this._panelTypeToRamType(item.type) === this._panelTypeToRamType(settings.type));
    if (index === -1) {
      return;
    }
    if (this.selected !== index) {
      this.selected = index;
    }
    this.settings = settings;
    // selection might have changes so the panel was not ready
    setTimeout(() => {
      const panel = this.currentPanel;
      if (panel) {
        // Can be no-auth panel
        panel.restore(settings.settings);
      }
    });
  }
  /**
   * Notifies settings change if currently selected method is the same as
   * `settings.type`.
   */
  _notifySettings() {
    if (this.readOnly || this.disabled) {
      return;
    }
    const { selected } = this;
    const config = this.authMethods && this.authMethods[selected];
    const isBlank = ['none', 'Pass Through'].indexOf(config && config.type) !== -1;
    if (isBlank) {
      this.settings = {};
    }
    const { settings } = this;
    let valid = false;
    let type;
    if (config) {
      type = config.type;
      if (isBlank) {
        valid = true;
      } else if (settings) {
        valid = settings.valid || false;
      } else if (this.authVaid) {
        valid = true;
      }
    } else {
      type = 'none';
      if (!this._authRequired) {
        valid = true;
      }
    }
    this.fire('authorization-settings-changed', {
      settings: settings ? settings.settings : {},
      valid,
      type
    });
  }
  /**
   * Rstores authorization settings if event is external.
   *
   * @param {CustomEvent} e
   */
  _onAuthSettingsChanged(e) {
    if (this.readOnly || e.composedPath()[0] === this) {
      return;
    }
    this.restore(e.detail);
  }
  /**
   * Processes incomming settings and acts if any action needed to authorize
   * the use has to be performed.
   *
   * @param {Object} settings Current settings.
   */
  _processPanelSettings(settings) {
    switch (settings.type) {
      case 'oauth2': this._handleOauth2Settings(settings); break;
      case 'digest': this._handleDigestSettings(settings); break;
    }
  }
  /**
   * Handles the case when OAuth2 settings changed.
   *
   * @param {Object} settings Oauth2 auth settings object
   */
  _handleOauth2Settings(settings) {
    settings = settings || {};

    const authSettings = settings.settings || {};
    const token = authSettings.accessToken;
    if (!token) {
      settings.valid = false;
      this.settings = settings;
      return;
    }
    let type;
    let value;
    if (authSettings.deliveryMethod === 'header') {
      type = 'request-header-changed';
      value = authSettings.tokenType + ' ' + token;
    } else {
      type = 'query-parameter-changed';
      value = token;
    }
    this.fire(type, {
      name: authSettings.deliveryName,
      value: value
    }, {
      cancelable: true
    });
  }
  /**
   * Handles the case when digest auth method settings changed.
   *
   * @param {Object} settings Digest auth method settings object
   * It can be either username and password (that will be passed to
   * transport method) then this function do nothing or list of Authorization
   * header parameters.
   */
  _handleDigestSettings(settings) {
    if (!settings.valid) {
      this.fire('request-header-changed', {
        name: 'authorization',
        value: ''
      });
      return;
    }
    settings = settings.settings;
    if (!settings) {
      return;
    }
    const data = settings.settings;
    if (!data || !(data.username && data.password)) {
      return;
    }
    let value = 'Digest ';
    Object.keys(data).forEach((name) => {
      value += name + '="' + data[name] + '", ';
    });
    value = value.substr(0, value.length - 2);
    this.fire('request-header-changed', {
      name: 'authorization',
      value: value
    }, {
      cancelable: true
    });
  }

  fire(type, detail, options) {
    const defaults = {
      bubbles: true,
      composed: true,
      cancelable: false
    };
    if (!options) {
      options = defaults;
    } else {
      options = Object.assign(defaults, options);
    }
    options.detail = detail;
    const e = new CustomEvent(type, options);
    this.dispatchEvent(e);
    return e;
  }
  /**
   * If selected authorization type is `oauth1` or `oauth2` it calls
   * `authorize()` function of selected panel.
   * If other method is selected it does nothing.
   *
   * @return {Boolean} True if the panel received intent to authorize and
   * `false` otherwise
   */
  forceTokenAuthorization() {
    const selected = this.authMethods && this.authMethods[this.selected];
    if (!selected) {
      return false;
    }
    if (['OAuth 2.0', 'OAuth 1.0'].indexOf(selected.type) === -1) {
      return false;
    }
    const panel = this.currentPanel;
    if (!panel) {
      return true;
    }
    return panel.authorize();
  }
  /**
   * Dispatches analytics event.
   *
   * @param {String} category Event category
   * @param {String} action Event action
   * @param {String} label Event label
   */
  _analyticsEvent(category, action, label) {
    this.fire('send-analytics', {
      type: 'event',
      category: category,
      action: action,
      label: label
    });
  }

  _selectionHandler(e) {
    const { value } = e.detail;
    const { name } = e.target.parentElement;
    this[name] = value;
  }

  _selectorTemplate() {
    const {
      outlined,
      legacy,
      readOnly,
      disabled,
      selected
    } = this;
    const items = this.authMethods || [];
    const isSingle = items.length === 1;
    return html`
    ${isSingle ? html`<div role="heading" aria-level="3" class="auth-title-single">${items[0].name}</div>` : ''}
    <anypoint-dropdown-menu
      ?hidden="${isSingle}"
      name="selected"
      .outlined="${outlined}"
      .legacy="${legacy}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
    >
      <label slot="label">Authorization method</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${selected}"
        @selected-changed="${this._selectionHandler}"
        .outlined="${outlined}"
        .legacy="${legacy}"
        .readOnly="${readOnly}"
        .disabled="${disabled}">
        ${items.map((item) => html`<anypoint-item .legacy="${legacy}">${item.name}</anypoint-item>`)}
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }

  _panelTemplate() {
    const { selected, authMethods } = this;
    if (selected === -1 || selected === undefined || !authMethods || !authMethods.length) {
      return;
    }
    const item = authMethods[selected];
    switch (item.type) {
      case 'none': return '';
      case 'Basic Authentication': return this._basicTemplate();
      case 'Digest Authentication': return this._digestTemplate();
      case 'ntlm': return this._ntlmTemplate();
      case 'Pass Through': return this._passThroughTemplate();
      case 'OAuth 2.0': return this._oauth2Template(item.type, item.name);
      case 'OAuth 1.0': return this._oauth1Template(item.type, item.name);
      default: return this._customTemplate(item.type, item.name);
    }
  }

  _basicTemplate() {
    const {
      eventsTarget,
      readOnly,
      disabled,
      legacy,
      outlined
    } = this;

    return html`<auth-method-basic
      .eventsTarget="${eventsTarget}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      ?outlined="${outlined}"
      ?legacy="${legacy}"
    ></auth-method-basic>`;
  }

  _digestTemplate() {
    const {
      eventsTarget,
      readOnly,
      disabled,
      legacy,
      outlined,
      narrow,
      requestUrl,
      httpMethod,
      requestBody
    } = this;

    return html`<auth-method-digest
      .eventsTarget="${eventsTarget}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      ?narrow="${narrow}"
      ?outlined="${outlined}"
      ?legacy="${legacy}"
      .requestUrl="${requestUrl}"
      .httpMethod="${httpMethod}"
      .requestBody="${requestBody}"
    ></auth-method-digest>`;
  }

  _ntlmTemplate() {
    const {
      eventsTarget,
      readOnly,
      disabled,
      legacy,
      outlined
    } = this;

    return html`<auth-method-ntlm
      .eventsTarget="${eventsTarget}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      ?outlined="${outlined}"
      ?legacy="${legacy}"
    ></auth-method-ntlm>`;
  }

  _oauth2Template(type, name) {
    const {
      eventsTarget,
      readOnly,
      disabled,
      legacy,
      outlined,
      noDocs,
      redirectUri,
      amf
    } = this;

    const amfSettings = this._computeAmfSettings(type, name);

    return html`<auth-method-oauth2
      .eventsTarget="${eventsTarget}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      ?outlined="${outlined}"
      ?legacy="${legacy}"
      .noDocs="${noDocs}"
      .redirectUri="${redirectUri}"
      .amf="${amf}"
      .amfSettings="${amfSettings}"
    ></auth-method-oauth2>`;
  }

  _oauth1Template(type, name) {
    const {
      eventsTarget,
      readOnly,
      disabled,
      legacy,
      outlined,
      noDocs,
      redirectUri,
      amf
    } = this;

    const amfSettings = this._computeAmfSettings(type, name);

    return html`<auth-method-oauth1
      .eventsTarget="${eventsTarget}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      ?outlined="${outlined}"
      ?legacy="${legacy}"
      .noDocs="${noDocs}"
      .redirectUri="${redirectUri}"
      .amf="${amf}"
      .amfSettings="${amfSettings}"
    ></auth-method-oauth1>`;
  }

  _customTemplate(type, name) {
    const amfSettings = this._computeAmfSettings(type, name);
    if (!amfSettings) {
      return html`<p class="no-support-info">This method is not yet supported.</p>`;
    }
    const {
      eventsTarget,
      readOnly,
      disabled,
      legacy,
      outlined,
      noDocs,
      redirectUri,
      amf
    } = this;

    return html`<auth-method-custom
      .eventsTarget="${eventsTarget}"
      .readOnly="${readOnly}"
      .disabled="${disabled}"
      ?outlined="${outlined}"
      ?legacy="${legacy}"
      .noDocs="${noDocs}"
      .redirectUri="${redirectUri}"
      .amf="${amf}"
      .amfSettings="${amfSettings}"
    ></auth-method-custom>`;
  }

  _passThroughTemplate() {
    return html`<p class="no-support-info">This method is not yet supported.</p>`;
  }

  render() {
    const { authMethods } = this;
    return html`
    <div class="auth-container">
      ${authMethods && authMethods.length ?
        html`
        ${this._selectorTemplate()}
        <section class="auth-panel">
        ${this._panelTemplate()}
        </section>` :
        html`<p class="no-method-info">Authorization method for current endpoint is not supported.</p>`}
    </div>`;
  }
  /**
   * Fired when auth settings change.
   *
   * It will be fired when any of types is currently selected and
   * any value of any property has changed.
   *
   * @event authorization-settings-changed
   * @param {?Object} settings Current auth settings. It depends on enabled `type`.
   * It might be undefined if the user unselected a method (if possible). This
   * means that there's no selection at the moment.
   * @param {?String} type Enabled auth type. For example `basic`, `ntlm` or `oauth2`.
   * It may be `undefined` if the user deselected current method and none is selected.
   * @param {Boolean} valid Flag determining if current settings are valid.
   * This property depends on `null` security scheme when scheme is unselected
   * (`settings` and `type` are `undefined`). If `null` security is set then
   * it is valid when methos is unselected. `false` otherise.
   */
  /**
   * Fired when the authorization type changed.
   * Note that the `settings` property may not be updated at the moment of of
   * firing the event.
   *
   * This event is cancelable. If handler cancels the event the operation
   * is stopped and selection is set to previous value.
   *
   * @event authorization-type-changed
   * @param {String} type Current auth type
   */
  /**
   * Fired when the request header changed and all listeners should update
   * header value.
   *
   * @event request-header-changed
   * @param {String} name Name of the header that has changed
   * @param {String} value Header new value
   */
  /**
   * Fired when the query param changed and all listeners should update
   * parameters / URL value.
   *
   * @event query-parameter-changed
   * @param {String} name Name of the header that has changed
   * @param {String} value Header new value
   */
}
window.customElements.define('authorization-panel', AuthorizationPanel);
