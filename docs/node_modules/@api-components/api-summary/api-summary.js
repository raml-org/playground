import { LitElement, html, css } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import labelStyles from '@api-components/http-method-label/http-method-label-common-styles.js';
import '@api-components/raml-aware/raml-aware.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@polymer/iron-meta/iron-meta.js';
/**
 * `api-summary`
 *
 * A summary view for an API base on AMF data model
 *
 * ## Styling
 *
 * `<api-summary>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-summary` | Mixin applied to this elment | `{}`
 * `--api-summary-color` | Color of text labels | ``
 * `--api-summary-url-font-size` | Font size of endpoin URL | `16px`
 * `--api-summary-url-background-color` | Background color of the URL section | `#424242`
 * `--api-summary-url-font-color` | Font color of the URL area | `#fff`
 * `--api-summary-separator-color` | Color of section separator | `rgba(0, 0, 0, 0.12)`
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiSummary extends AmfHelperMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      labelStyles,
      css`
        :host {
          display: block;
          color: var(--api-summary-color, inherit);
        }

        .api-title {
          margin: 12px 0;
        }

        arc-marked {
          padding: 0;
        }

        .marked-description {
          margin: 24px 0;
        }

        .markdown-body {
          margin-bottom: 28px;
        }

        :host([narrow]) h1 {
          font-size: var(--api-summary-title-narrow-font-size, 1.2rem);
          margin: 0;
        }

        .url-area {
          display: flex;
          flex-direction: column;
          font-family: var(--arc-font-code-family);

          margin-bottom: 40px;
          margin-top: 20px;
          background-color: var(--code-background-color);
          color: var(--code-color);
          padding: 8px;
          border-radius: var(--api-endpoint-documentation-url-border-radius, 4px);
        }

        .url-label {
          font-size: 0.75rem;
          font-weight: 700;
        }

        .url-value {
          font-size: var(--api-endpoint-documentation-url-font-size, 1.07rem);
          word-break: break-all;
        }

        .method-value {
          text-transform: uppercase;
          white-space: nowrap;
        }

        label.section {
          font-weight: var(--arc-font-subhead-font-weight);
          line-height: var(--arc-font-subhead-line-height);
          /* font-size: 18px; */
          margin-top: 20px;
          display: block;
        }

        a {
          color: var(--link-color);
        }

        a:hover {
          color: var(--link-hover-color);
        }

        .chip {
          display: inline-block;
          white-space: nowrap;
          padding: 2px 4px;
          margin-right: 8px;
          background-color: var(--api-summary-chip-background-color, #f0f0f0);
          color: var(--api-summary-chip-color, #616161);
          border-radius: var(--api-summary-chip-border-radius, 2px);
        }

        .app-link {
          color: var(--link-color);
        }

        .link-padding {
          margin-left: 8px;
        }

        .inline-description {
          padding: 0;
          margin: 0;
        }

        .docs-section {
          margin-bottom: 40px;
        }

        .separator {
          background-color: var(--api-summary-separator-color, rgba(0, 0, 0, 0.12));
          height: 1px;
          margin: 40px 0;
        }

        .endpoint-item {
          margin-bottom: 32px;
        }

        .method-label {
          margin-right: 8px;
          margin-bottom: 8px;
          text-decoration: none;
          /* padding: var(--api-summary-method-padding, 4px 6px); */
        }

        .method-label:hover,
        .method-label:focus {
          text-decoration: underline;
        }

        .endpoint-path {
          display: block;
          text-decoration: none;
          cursor: pointer;
          margin-bottom: 4px;
          display: inline-block;
          font-weight: 500;
          color: var(--link-color, #0277BD);
          margin: 4px 0;
          word-break: break-all;
        }

        .endpoint-path:hover,
        .endpoint-path:focus {
          text-decoration: underline;
          color: var(--link-color, #0277BD);
        }

        .toc .section {
          margin-bottom: 24px;
        }

        .section.endpoints-title {
          font-weight: 500;
        }

        .endpoint-path-name {
          word-break: break-all;
          margin: 8px 0;
        }
      `
    ];
  }

  _titleTemplate() {
    const { _apiTitle, titleLevel } = this;
    if (!_apiTitle) {
      return '';
    }
    return html`
    <div class="api-title" role="heading" aria-level="${titleLevel}">
    <label>API title:</label>
    <span>${_apiTitle}</span>
    </div>`;
  }

  _versionTemplate() {
    const { _version } = this;
    if (!_version) {
      return '';
    }
    return html`
    <p class="inline-description version">
      <label>Version:</label>
      <span>${_version}</span>
    </p>`;
  }

  _descriptionTemplate() {
    const { _description } = this;
    if (!_description) {
      return '';
    }
    return html`
    <div role="region" class="marked-description">
      <arc-marked .markdown="${_description}" sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>`;
  }

  _baseUriTemplate() {
    const { _apiBaseUri } = this;
    if (!_apiBaseUri) {
      return '';
    }
    return html`
    <div class="url-area">
      <span class="url-label">API base URI</span>
      <div class="url-value">${_apiBaseUri}</div>
    </div>`;
  }

  _protocolsTemplate() {
    const { _protocols } = this;
    if (!_protocols || !_protocols.length) {
      return '';
    }
    const result = _protocols.map((item) => html`<span class="chip">${item}</span>`);

    return html`
    <label class="section">Supported protocols</label>
    <div class="protocol-chips">${result}</div>`;
  }

  _contactInfoTemplate() {
    const { _providerName, _providerEmail, _providerUrl } = this;
    if (!_providerName) {
      return '';
    }
    return html`
    <section role="contentinfo" class="docs-section">
      <label class="section">Contact information</label>
      <p class="inline-description">
        <span class="provider-name">${_providerName}</span>
        ${_providerEmail ? html`<a
            class="app-link link-padding provider-email"
            href="mailto:${_providerEmail}">${_providerEmail}</a>` : ''}
      </p>
      ${_providerUrl ? html`
        <p class="inline-description">
          <a href="${_providerUrl}" target="_blank" class="app-link provider-url">${_providerUrl}</a>
        </p>` : ''}
    </section>`;
  }

  _licenseTemplate() {
    const { _licenseUrl, _licenseName } = this;
    if (!_licenseUrl || !_licenseName) {
      return '';
    }
    return html`
    <section role="region" aria-labelledby="licenseLabel" class="docs-section">
      <label class="section" id="licenseLabel">License</label>
      <p class="inline-description">
        <a href="${_licenseUrl}" target="_blank" class="app-link">${_licenseName}</a>
      </p>
    </section>`;
  }

  _termsOfServiceTemplate() {
    const { _termsOfService } = this;
    if (!_termsOfService || !_termsOfService.length) {
      return '';
    }
    return html`
    <section role="region" aria-labelledby="tocLabel" class="docs-section">
      <label class="section" id="tocLabel">Terms of service</label>
      <arc-marked .markdown="${_termsOfService}" sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </section>`;
  }

  _endpointsTemplate() {
    const { _endpoints } = this;
    if (!_endpoints || !_endpoints.length) {
      return;
    }
    const result = _endpoints.map((item) => this._endpointTemplate(item));
    return html`
    <div class="separator"></div>
    <div class="toc">
      <label class="section endpoints-title">API endpoints</label>
      ${result}
    </div>
    `;
  }

  _endpointTemplate(item) {
    const ops = item.ops && item.ops.length ? item.ops.map((op) => this._methodTemplate(op, item)) : '';
    return html`
    <div class="endpoint-item" @click="${this._navigateItem}">
      ${item.name ? this._endpointNameTemplate(item) : this._endpointPathTemplate(item)}
      <div class="endpoint-header">
        ${ops}
      </div>
    </div>`;
  }

  _endpointPathTemplate(item) {
    return html`
    <a
      class="endpoint-path"
      href="#${item.path}"
      data-id="${item.id}"
      data-shape-type="endpoint"
      title="Open endpoint documentation">${item.path}</a>
    `;
  }

  _endpointNameTemplate(item) {
    if (!item.name) {
      return '';
    }
    return html`
    <a
      class="endpoint-path"
      href="#${item.path}"
      data-id="${item.id}"
      data-shape-type="endpoint"
      title="Open endpoint documentation">${item.name}</a>
    <p class="endpoint-path-name">${item.path}</p>
    `;
  }

  _methodTemplate(item, endpoint) {
    return html`
      <a
        href="#${endpoint.path + '/' + item.method}"
        class="method-label"
        data-method="${item.method}"
        data-id="${item.id}"
        data-shape-type="method"
        title="Open method documentation">${item.method}</a>
    `;
  }

  render() {
    const { aware } = this;
    return html`
      ${aware ?
        html`<raml-aware @api-changed="${this._apiHandler}" .scope="${aware}"></raml-aware>` :
        ''}

      <div>
        ${this._titleTemplate()}
        ${this._versionTemplate()}
        ${this._descriptionTemplate()}
        ${this._baseUriTemplate()}
        ${this._protocolsTemplate()}
        ${this._contactInfoTemplate()}
        ${this._licenseTemplate()}
        ${this._termsOfServiceTemplate()}
      </div>

      ${this._endpointsTemplate()}
    `;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * A property to set to override AMF's model base URI information.
       * When this property is set, the `endpointUri` property is recalculated.
       */
      baseUri: { type: String, value: '' },
      /**
       * API title header level in value range from 1 to 6.
       * This is made for accessibility. It the component is used in a context
       * where headers order matters then this property is to be set to
       * arrange headers in the right order.
       *
       * @default 2
       */
      titleLevel: { type: String },

      _providerName: { type: String },
      _providerEmail: { type: String },
      _providerUrl: { type: String },
      _licenseName: { type: String },
      _licenseUrl: { type: String },
      _endpoints: { type: Array },
      _termsOfService: { type: String },
      _version: { type: String },
      _apiTitle: { type: String },
      _description: { type: String },
      _apiBaseUri: { type: String },
      _protocols: { type: Array }
    };
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._baseUri = value;
    this._apiBaseUri = this._computeBaseUri(this.server, value, this.protocols);
    this.requestUpdate('baseUri', old);
  }

  get _protocols() {
    return this.__protocols;
  }

  set _protocols(value) {
    const old = this.__protocols;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__protocols = value;
    this._apiBaseUri = this._computeBaseUri(this.server, this.baseUri, value);
    this.requestUpdate('_protocols', old);
  }

  constructor() {
    super();
    this.titleLevel = 2;
  }

  __amfChanged() {
    if (this.__amfProcessingDebouncer) {
      return;
    }
    this.__amfProcessingDebouncer = true;
    setTimeout(() => this._processModelChange());
  }

  _processModelChange() {
    this.__amfProcessingDebouncer = false;
    const { amf } = this;
    if (!amf) {
      return;
    }

    const webApi = this.webApi = this._computeWebApi(amf);
    const server = this.server = this._computeServer(amf);
    const protocols = this._protocols = this._computeProtocols(amf);
    this._apiBaseUri = this._computeBaseUri(server, this.baseUri, protocols);

    this._webApiChanged(webApi);
  }

  _webApiChanged(webApi) {
    if (!webApi) {
      return;
    }

    this._apiTitle = this._computeApiTitle(webApi);
    this._description = this._computeDescription(webApi);
    this._version = this._computeVersion(webApi);
    this._termsOfService = this._computeToS(webApi);
    this._endpoints = this._computeEndpoints(webApi);

    const provider = this._computeProvider(webApi);
    this._providerName = this._computeName(provider);
    this._providerEmail = this._computeEmail(provider);
    this._providerUrl = this._computeUrl(provider);

    const license = this._computeLicense(webApi);
    this._licenseName = this._computeName(license);
    this._licenseUrl = this._computeUrl(license);
  }

  /**
   * Computes value of `apiTitle` property.
   *
   * @param {Object} shape Shape of AMF model.
   * @return {String|undefined} Description if defined.
   */
  _computeApiTitle(shape) {
    return this._getValue(shape, this.ns.schema.schemaName);
  }
  /**
   * Computes value for `version` property
   * @param {Object} webApi AMF's WebApi shape
   * @return {String|undefined}
   */
  _computeVersion(webApi) {
    return this._getValue(webApi, this.ns.schema.name + 'version');
  }
  /**
   * Computes API's URI based on `amf` and `baseUri` property.
   *
   * @param {Object} server Server model of AMF API.
   * @param {?String} baseUri Current value of `baseUri` property
   * @param {?Array<String>} protocols List of supported protocols
   * @return {String} Endpoint's URI
   */
  _computeBaseUri(server, baseUri, protocols) {
    let base = this._getBaseUri(baseUri, server, protocols);
    if (base && base[base.length - 1] === '/') {
      base = base.substr(0, base.length - 1);
    }
    return base;
  }
  /**
   * Computes information about provider of the API.
   *
   * @param {Object} webApi WebApi shape
   * @return {Object|undefined}
   */
  _computeProvider(webApi) {
    if (!webApi) {
      return;
    }
    const key = this._getAmfKey(this.ns.schema.name + 'provider');
    let data = this._ensureArray(webApi[key]);
    if (!data) {
      return;
    }
    data = data[0];
    if (data instanceof Array) {
      data = data[0];
    }
    return data;
  }

  _computeName(provider) {
    return this._getValue(provider, this.ns.schema.schemaName);
  }

  _computeEmail(provider) {
    return this._getValue(provider, this.ns.schema.name + 'email');
  }

  _computeUrl(provider) {
    let value = this._getValue(provider, this.ns.schema.name + 'url');
    if (!value && provider) {
      const key = this._getAmfKey(this.ns.schema.name + 'url');
      const data = provider[key];
      if (data) {
        value = data instanceof Array ? data[0]['@id'] : data['@id'];
      }
    }
    return value;
  }

  _computeToS(webApi) {
    return this._getValue(webApi, this.ns.schema.name + 'termsOfService');
  }

  _computeLicense(webApi) {
    const key = this._getAmfKey(this.ns.schema.name + 'license');
    const data = webApi && webApi[key];
    if (!data) {
      return;
    }
    return data instanceof Array ? data[0] : data;
  }
  /**
   * Computes view model for endpoints list.
   * @param {Object} webApi Web API model
   * @return {Array<Object>|undefined}
   */
  _computeEndpoints(webApi) {
    if (!webApi) {
      return;
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.http + 'endpoint');
    const endpoints = this._ensureArray(webApi[key]);
    if (!endpoints || !endpoints.length) {
      return;
    }
    return endpoints.map((item) => {
      const result = {
        name: this._getValue(item, this.ns.schema.schemaName),
        path: this._getValue(item, this.ns.raml.vocabularies.http + 'path'),
        id: item['@id'],
        ops: this._endpointOperations(item)
      };
      return result;
    });
  }
  /**
   * Computes a view model for supported operations for an endpoint.
   * @param {Object} endpoint Endpoint model.
   * @return {Array<Object>|unbdefined}
   */
  _endpointOperations(endpoint) {
    const key = this._getAmfKey(this.ns.w3.hydra.core + 'supportedOperation');
    const so = this._ensureArray(endpoint[key]);
    if (!so || !so.length) {
      return;
    }
    return so.map((item) => {
      return {
        id: item['@id'],
        method: this._getValue(item, this.ns.w3.hydra.core + 'method')
      };
    });
  }

  _navigateItem(e) {
    e.preventDefault();
    const data = e.composedPath()[0].dataset;
    if (!data.id || !data.shapeType) {
      return;
    }
    const ev = new CustomEvent('api-navigation-selection-changed', {
      bubbles: true,
      composed: true,
      detail: {
        selected: data.id,
        type: data.shapeType
      }
    });
    this.dispatchEvent(ev);
  }

  _apiHandler(e) {
    this.amf = e.target.api;
  }
}
window.customElements.define('api-summary', ApiSummary);
