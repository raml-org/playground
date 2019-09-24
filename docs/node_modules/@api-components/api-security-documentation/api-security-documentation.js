import { LitElement, html, css } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@api-components/raml-aware/raml-aware.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@api-components/api-annotation-document/api-annotation-document.js';
import '@api-components/api-parameters-document/api-parameters-document.js';
import '@api-components/api-headers-document/api-headers-document.js';
import '@api-components/api-responses-document/api-responses-document.js';
import './api-oauth2-settings-document.js';
import './api-oauth1-settings-document.js';
/**
 * `api-security-documentation`
 *
 * Documentation view for AMF security description
 *
 * ## Styling
 *
 * `<api-security-documentation>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-security-documentation` | Mixin applied to this elment | `{}`
 * `--arc-font-headline` | Theme mixin, Applied to H1 element | `{}`
 * `--api-security-documentation-title` | Mixin applied to the H1 element | `{}`
 * `--api-security-documentation-title-narrow` | Mixin applied to the H1 element in narrow layout | `{}`
 * `--arc-font-title` | Theme mixin, applied to h2 element | `{}`
 * `--api-security-documentation-main-section-title` | Mixin applied to main sections title element | `{}`
 * `--api-security-documentation-main-section-title-narrow` | Mixin applied to main sections title element in narrow layout | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiSecurityDocumentation extends AmfHelperMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      css`:host {
        display: block;
      }

      h2 {
        font-size: var(--arc-font-headline-font-size);
        font-weight: var(--arc-font-headline-font-weight);
        letter-spacing: var(--arc-font-headline-letter-spacing);
        line-height: var(--arc-font-headline-line-height);
      }

      h3 {
        font-size: var(--arc-font-title-font-size);
        font-weight: var(--arc-font-title-font-weight);
        line-height: var(--arc-font-title-line-height);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host([narrow]) h1 {
        font-size: 20px;
        margin: 0;
      }

      :host([narrow]) h2 {
        font-size: 18px;
      }

      arc-marked {
        padding: 0;
      }`
    ];
  }

  render() {
    const { description, aware, type, security, settings, amf, queryParameters, headers, responses, narrow } = this;
    const hasCustomProperties = this._computeHasCustomProperties(security);
    let hasOauth1Settings = false;
    let hasOauth2Settings = false;
    if (settings) {
      hasOauth1Settings = this._computeHasOA1Settings(settings);
      hasOauth2Settings = this._computeHasOA2Settings(settings);
    }
    return html`
    ${aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" .scope="${aware}"></raml-aware>` : undefined}

    <section class="title">
      <h2>${type}</h2>
    </section>

    ${hasCustomProperties ? html`<api-annotation-document
      .shape="${security}"></api-annotation-document>`:undefined}

    ${description ? html`<arc-marked .markdown="${description}">
      <div slot="markdown-html" class="markdown-body"></div>
    </arc-marked>`:undefined}

    ${hasOauth1Settings ? html`<h3 class="settings-title">Settings</h3>
      <api-oauth1-settings-document
      .amf="${amf}"
      .settings="${settings}"></api-oauth1-settings-document>` : undefined}

    ${hasOauth2Settings ? html`<h3 class="settings-title">Settings</h3>
      <api-oauth2-settings-document
      .amf="${amf}"
      .settings="${settings}"></api-oauth2-settings-document>` : undefined}

    ${queryParameters && queryParameters.length ?
      html`<api-parameters-document
        .amf="${amf}"
        queryopened
        .queryParameters="${queryParameters}"
        ?narrow="${narrow}"></api-parameters-document>` :
      undefined}

    ${headers && headers.length ?
      html`<api-headers-document
        opened
        .amf="${amf}"
        .headers="${headers}"
        ?narrow="${narrow}"></api-headers-document>` :
      undefined}

    ${responses && responses.length ?
      html`<section class="response-documentation">
        <h3>Responses</h3>
        <api-responses-document
          .amf="${amf}"
          .returns="${responses}"
          ?narrow="${narrow}"></api-responses-document>
      </section>` :
      undefined}`;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * A security definition to render.
       * This should be AMF's type of `http://raml.org/vocabularies/security#SecurityScheme`.
       *
       * @type {Object}
       */
      security: { type: Object },
      /**
       * Computed value, scheme of the security
       */
      _scheme: { type: Object },
      /**
       * Security scheme type name.
       * The value is updated automatically when `security` property change.
       */
      type: { type: String },
      /**
       * Security scheme description.
       * The value is updated automatically when `security` property change.
       */
      description: { type: String },
      /**
       * AMF headers model.
       * List of headers to apply to this scheme.
       * This value is updated automatically when `security` property change.
       * @type {Array<Object>}
       */
      headers: { type: Array },
      /**
       * AMF query parameters model.
       * List of query parameters to apply to this scheme.
       * This value is updated automatically when `security` property change.
       * @type {Array<Object>}
       */
      queryParameters: { type: Array },
      /**
       * AMF responses model.
       * List of responses applied to this security scheme.
       * This value is updated automatically when `security` property change.
       * @type {Array<Object>}
       */
      responses: { type: Array },
      /**
       * AMF settings model for a security scheme.
       * This value is updated automatically when `security` property change.
       * @type {Object}
       */
      settings: { type: Object },
      /**
       * Set to render a mobile friendly view.
       */
       narrow: { type: Boolean, reflect: true }
    };
  }

  get amf() {
    return this._amf;
  }

  set amf(value) {
    const old = this._amf;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._amf = value;
    this._scheme = this._computeScheme(this.security);
    this.requestUpdate('amf', old);
  }

  get security() {
    return this._security;
  }

  set security(value) {
    const old = this._security;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._security = value;
    this._scheme = this._computeScheme(value);
    this.requestUpdate('security', old);
  }

  get _scheme() {
    return this.__scheme;
  }

  set _scheme(value) {
    const old = this.__scheme;
    if (old === value) {
      return;
    }
    this.__scheme = value;
    this._schemeChanged(value);
  }
  /**
   * Computes value of security scheme's scheme model.
   * @param {Array|Object} security AMF security description.
   * @return {Object} Security's scheme model.
   */
  _computeScheme(security) {
    if (!security) {
      return;
    }
    if (security instanceof Array) {
      security = security[0];
    }
    if (this._hasType(security, this.ns.raml.vocabularies.security + 'SecurityScheme')) {
      return security;
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.security + 'scheme');
    let scheme = security[key];
    if (!scheme) {
      return;
    }
    if (scheme instanceof Array) {
      scheme = scheme[0];
    }
    return scheme;
  }
  /**
   * Computes values for prroperties like `type`, `description`, `headers`,
   * `queryParameters`, `responses` and `settings` when `scheme` property
   * change.
   * @param {Object} scheme Scheme model to process.
   */
  _schemeChanged(scheme) {
    this.type = this._computeType(scheme);
    this.description = this._computeDescription(scheme);
    let headers = this._computeHeaders(scheme);
    if (headers && !(headers instanceof Array)) {
      headers = [headers];
    }
    this.headers = headers;
    let queryParameters = this._computeQueryParameters(scheme);
    if (queryParameters && !(queryParameters instanceof Array)) {
      queryParameters = [queryParameters];
    }
    this.queryParameters = queryParameters;
    let responses = this._computeResponses(scheme);
    if (responses && !(responses instanceof Array)) {
      responses = [responses];
    }
    this.responses = responses;
    this.settings = this._computeSettings(scheme);
  }
  /**
   * Computes value for security type.
   * @param {Object} shape Scheme model.
   * @return {String|undefined}
   */
  _computeType(shape) {
    return this._getValue(shape, this.ns.raml.vocabularies.security + 'type');
  }
  /**
   * Computes scheme's settings model.
   * @param {Object} shape Scheme model.
   * @return {Object|undefined} Settings model
   */
  _computeSettings(shape) {
    return this._computePropertyObject(shape, this.ns.raml.vocabularies.security + 'settings');
  }
  /**
   * @param {Object|undefined} settings Computed settings object
   * @return {Boolean} True if this settings represents OAuth 2 settings
   */
  _computeHasOA2Settings(settings) {
    if (!settings) {
      return false;
    }
    return this._hasType(settings, this.ns.raml.vocabularies.security + 'OAuth2Settings');
  }
  /**
   * @param {Object|undefined} settings Computed settings object
   * @return {Boolean}
   */
  _computeHasOA1Settings(settings) {
    if (!settings) {
      return false;
    }
    return this._hasType(settings, this.ns.raml.vocabularies.security + 'OAuth1Settings');
  }

  _apiChangedHandler(e) {
    const { value } = e.detail;
    this.amf = value;
  }
}
window.customElements.define('api-security-documentation', ApiSecurityDocumentation);
