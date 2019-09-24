import { LitElement, html, css } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
/**
 * `api-oauth1-settings-document`
 *
 * Documentation view for AMF OAuth2 security settings.
 *
 * Settings can be passed by setting the `settings` property to AMF's
 * settings property of Security Scheme.
 *
 * ```html
 * <api-oauth1-settings-document
 *  amf-model="{...}"
 *  settings="{...}"></api-oauth1-settings-document>
 * ```
 *
 * It is also possible to set corresponding properties directly.
 *
 * ```html
 * <api-oauth1-settings-document
 *  amf-model="{...}"
 *  request-token-uri="https://..."
 *  authorization-uri="https://..."
 *  signatures='["RSA-SHA1"]'></api-oauth1-settings-document>
 * ```
 *
 * ## Styling
 *
 * `<api-oauth1-settings-document>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-oauth1-settings-document` | Mixin applied to this elment | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiOauth1SettingsDocument extends AmfHelperMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
    }

    h4 {
      font-size: var(--arc-font-subhead-font-size);
      font-weight: var(--arc-font-subhead-font-weight);
      line-height: var(--arc-font-subhead-line-height);
    }

    .settings-value {
      background: var(--code-background-color, #f5f2f0);
      display: block;
      padding: 1em;
      margin: .5em 0;
    }`;
  }

  render() {
    const { requestTokenUri, authorizationUri, tokenCredentialsUri, signatures } = this;
    return html`
    ${requestTokenUri ? html`<h4 data-type="request-token-uri">Request token URI</h4>
    <code class="settings-value">${requestTokenUri}</code>` : undefined}

    ${authorizationUri ? html`<h4 data-type="authorization-uri">Authorization URI</h4>
    <code class="settings-value">${authorizationUri}</code>` : undefined}

    ${tokenCredentialsUri ? html`<h4 data-type="token-credentials-uri">Token credentials URI</h4>
    <code class="settings-value">${tokenCredentialsUri}</code>` : undefined}

    ${signatures && signatures.length ? html`
      <h4 data-type="signatures">Supported signatures</h4>
      <ul>
      ${signatures.map((item) => html`<li>${item}</li>`)}
      </ul>
      ` : undefined}`;
  }

  static get properties() {
    return {
      /**
       * OAuth1 settings scheme of AMF.
       * When this property changes it resets other properties.
       * @type {Object}
       */
      settings: { type: Object },
      /**
       * The request token URI from the settings model.
       * Automatically set when `settings` property change.
       */
      requestTokenUri: { type: String },
      /**
       * The authorization endpoint URI.
       * Automatically set when `settings` property change.
       */
      authorizationUri: { type: String },
      /**
       * Token credentials endpoint URI.
       * Automatically set when `settings` property change.
       */
      tokenCredentialsUri: { type: String },
      /**
       * List of signatures used by this authorization server.
       * Automatically set when `settings` property change.
       * @type {Array<String>}
       */
      signatures: { type: Array }
    };
  }

  get settings() {
    return this._settings;
  }

  set settings(value) {
    const old = this._settings;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._settings = value;
    this._settingsChanged(value);
  }

  /**
   * Called automatically when `settings` property change (whole object,
   * not sub property).
   * Sets values of all other properties to the one found in the AMF.
   *
   * @param {Object} settings AMF settings to process.
   */
  _settingsChanged(settings) {
    const requestTokenUri = this._computeRequestTokenUri(settings);
    const authorizationUri = this._computeAuthorizationUri(settings);
    const tokenCredentialsUri = this._computeTokenCredentialsUri(settings);
    const signatures = this._computeSignatures(settings);

    this.requestTokenUri = requestTokenUri;
    this.authorizationUri = authorizationUri;
    this.tokenCredentialsUri = tokenCredentialsUri;
    this.signatures = signatures;
  }
  /**
   * If passed argument is an array it returns first object from it. Otherwise
   * it returns the object.
   * @param {any} result
   * @return {any}
   */
  _deArray(result) {
    if (result instanceof Array) {
      result = result[0];
    }
    return result;
  }
  /**
   * Computes value of request token endpoint URI.
   * @param {Object} settings AMF settings to process.
   * @return {String|undefined} Request token URI value
   */
  _computeRequestTokenUri(settings) {
    const result = this._getValue(settings, this.ns.raml.vocabularies.security + 'requestTokenUri');
    return this._deArray(result);
  }
  /**
   * Computes value of authorization endpoint URI.
   * @param {Object} settings AMF settings to process.
   * @return {String|undefined} Authorization URI value
   */
  _computeAuthorizationUri(settings) {
    const result = this._getValue(settings, this.ns.raml.vocabularies.security + 'authorizationUri');
    return this._deArray(result);
  }
  /**
   * Computes value of token credentials endpoint URI.
   * @param {Object} settings AMF settings to process.
   * @return {String|undefined} Token credentials URI value
   */
  _computeTokenCredentialsUri(settings) {
    const result = this._getValue(settings, this.ns.raml.vocabularies.security + 'tokenCredentialsUri');
    return this._deArray(result);
  }
  /**
   * Computes value of OAuth1 signatures.
   * @param {Object} settings AMF settings to process.
   * @return {Array<String>|undefined} List of signatures.
   */
  _computeSignatures(settings) {
    return this._getValueArray(settings, this.ns.raml.vocabularies.security + 'signature');
  }
}
window.customElements.define('api-oauth1-settings-document', ApiOauth1SettingsDocument);
