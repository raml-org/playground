import { html, css } from 'lit-element';
import { ApiSummary } from '@api-components/api-summary/src/ApiSummary.js';
import { ApiMethodDocumentation } from '@api-components/api-method-documentation/src/ApiMethodDocumentation.js';
import { ApiBodyDocumentElement } from '@api-components/api-body-document/src/ApiBodyDocumentElement.js';
import { ApiHeadersDocument } from '@api-components/api-headers-document/src/ApiHeadersDocument.js';
import { ApiTypeDocument } from '@api-components/api-type-document/src/ApiTypeDocument.js';
import { PropertyShapeDocument } from '@api-components/api-type-document/src/PropertyShapeDocument.js';
import { ApiResponsesDocument } from '@api-components/api-responses-document/src/ApiResponsesDocument.js';
import { ApiDocumentation } from '@api-components/api-documentation/src/ApiDocumentation.js';
import { ApiParametersDocument } from '@api-components/api-parameters-document/src/ApiParametersDocument.js';
import { HttpCodeSnippetsElement } from '@advanced-rest-client/http-code-snippets/src/HttpCodeSnippetsElement.js';
import { expandMore, openInNew } from '@advanced-rest-client/arc-icons/ArcIcons.js';


// Extends ApiDocumentation to customize its output
export class XApiDocumentation extends ApiDocumentation {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
    x-api-summary,
    x-api-method-documentation,
    api-endpoint-documentation,
    api-type-documentation,
    api-documentation-document {
      padding: 15px;
    }
    #api-doc-title {
      padding: 10px 15px;
      background-color: #d8d8d8;
    }
    #api-doc-title a,
    #api-doc-title a:visited,
    #api-doc-title a:hover,
    #api-doc-title a:active {
      color: #47a1b4;
    }
    `];
  }

  // Computes documentation title
  _computeApiTitle() {
    const { amf } = this;
    const webApi = this._computeWebApi(amf);
    const title = this._getValue(webApi, this.ns.aml.vocabularies.core.name);
    return title && title.lenght > 0 ? title.strip() : title
  }

  // Overriden to add documentation title block (#api-doc-title)
  render() {
    if (!this.documentationTitle) {
      this.documentationTitle = this._computeApiTitle();
    }
    const { aware } = this;
    return html`<style>${this.styles}</style>
    ${html`<div id="api-doc-title">${this.documentationTitle}</div>`}
    ${aware ? html`<raml-aware
      .scope="${aware}"
      @api-changed="${this._apiChanged}"></raml-aware>` : ''}
    ${this._renderServerSelector()}
    ${this._renderView()}`;
  }

  // Overriden to output x-api-summary instead of api-summary
  _summaryTemplate() {
    const { _docsModel, baseUri, rearrangeEndpoints } = this;
    return html`<x-api-summary
        .amf="${_docsModel}"
        .baseUri="${baseUri}"
        .rearrangeendpoints="${rearrangeEndpoints}"
      ></x-api-summary>`;
  }

  // Overriden to output x-api-method-documentation instead of api-method-documentation
  _methodTemplate() {
    const { amf, _docsModel, narrow, compatibility, _endpoint, selected, noTryIt, graph, noBottomNavigation, server } = this;
    const prev = this._computeMethodPrevious(amf, selected);
    const next = this._computeMethodNext(amf, selected);

    return html`<x-api-method-documentation
      .amf="${amf}"
      .narrow="${narrow}"
      .compatibility="${compatibility}"
      .endpoint="${_endpoint}"
      .server="${server}"
      .method="${_docsModel}"
      .previous="${prev}"
      .next="${next}"
      .baseUri="${this.effectiveBaseUri}"
      ?noTryIt="${noTryIt}"
      ?graph="${graph}"
      ?noNavigation="${noBottomNavigation}"
      rendersecurity
      rendercodesnippets></x-api-method-documentation>`;
  }

  // Overriden to create breadcrumbs in documentation title block
  _navigationHandler(e) {
    const { selected, type } = e.detail;
    let deepBreadcrumbs = ''
    switch (type) {
      case 'method':
      case 'endpoint':
        deepBreadcrumbs = decodeURIComponent(selected.split('end-points/').pop())
        break
      case 'type':
        deepBreadcrumbs = `/types/${decodeURIComponent(selected.split('types/').pop())}`
        break
      case 'documentation':
        deepBreadcrumbs = `/documentation/${decodeURIComponent(selected.split('creative-work/').pop())}`
        break
      case 'security':
        deepBreadcrumbs = `/security/${decodeURIComponent(selected.split('securitySchemes/').pop())}`
        break
    }
    this.documentationTitle = this._computeApiTitle()
    if (deepBreadcrumbs.length > 0) {
      this.documentationTitle = html`
        <a href="#"
           onclick="(() => { window.appModel.apiConsole.dispatchNavEvent('summary', 'summary'); return false; })()"
           >${this.documentationTitle}</a>
        <span>${deepBreadcrumbs.replaceAll('/', ' / ')}</span>`
    }
    super._navigationHandler(e);
  }
}
window.customElements.define('x-api-documentation', XApiDocumentation);


// Extends ApiSummary to customize its output
export class XApiSummary extends ApiSummary {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
    span.endpoint-path {
      float: left;
      margin: 0;
    }
    a.endpoint-path {
      margin: 0!important;
    }
    span.endpoint-operations {
      float: right;
    }
    .endpoint-item {
      margin-bottom: 10px;
      border: 1px solid #dbdbdb;
      border-radius: 8px;
      background-color: #ffffff;
      padding: 5px 5px 3px 7px;
    }
    .url-area {
      padding: 0;
      margin-bottom: 0;
      margin-top: 12px;
    }
    .endpoints-title {
      margin: 0 0 10px 0!important;
    }
    .separator {
      margin: 15px 0;
    }
    .url-value {
      margin: 0;
    }
    .api-title {
      margin-top: 0;
    }
    .clearfix::after {
      content: "";
      clear: both;
      display: table;
    }
    .method-label {
      margin: 0;
    }
    `];
  }

  // Overriden to customize block structure
  _titleTemplate() {
    const { _apiTitle, titleLevel } = this;
    if (!_apiTitle) {
      return '';
    }
    return html`
    <div class="api-title" role="heading" aria-level="${titleLevel}">
    <label><b>API Title</b></label></br>
    <span>${_apiTitle}</span>
    </div>`;
  }

  // Overriden to customize block structure
  _versionTemplate() {
    const { _version } = this;
    if (!_version) {
      return '';
    }
    return html`
    <p class="inline-description version">
      <label><b>Version</b></label></br>
      <span>${_version}</span>
    </p>`;
  }

  // Overriden to customize block structure
  _baseUriTemplate(server) {
    const { baseUri, protocols } = this;
    const uri = this._computeBaseUri(server, baseUri, protocols);
    return html`
    <div class="url-area">
      <label><b>Base URI</b></label>
      <p class="url-value">${uri}</p>
    </div>`;
  }

  // Overriden to customize block structure
  _endpointsTemplate() {
    const { _endpoints } = this;
    if (!_endpoints || !_endpoints.length) {
      return;
    }
    const result = _endpoints.map((item) => this._endpointTemplate(item));
    return html`
    <div class="separator"></div>
    <div class="toc">
      <label class="section endpoints-title"><b>Endpoints</b></label>
      ${result}
    </div>
    `;
  }

  // Overriden to customize block structure
  _endpointTemplate(item) {
    const ops = item.ops && item.ops.length ? item.ops.map((op) => this._methodTemplate(op, item)) : '';
    return html`
    <div class="endpoint-item" @click="${this._navigateItem}">
      <span class="endpoint-path">${this._endpointPathTemplate(item)}</span>
      <span class="endpoint-operations">${ops}</span>
      <div class="clearfix"></div>
    </div>`;
  }
}
window.customElements.define('x-api-summary', XApiSummary);


// Extends ApiMethodDocumentation to customize its output
export class XApiMethodDocumentation extends ApiMethodDocumentation {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
    .url-area {
      display: block;
      padding: 0;
      margin: 0!important;
    }
    .url-value {
      margin-left: 0;
    }
    iron-collapse {
      border: 1px solid #dbdbdb;
      border-radius: 8px;
      background-color: #fff;
    }
    api-security-documentation {
      padding-left: 15px;
    }
    anypoint-button {
      display: block;
      min-width: auto;
      padding: 0!important;
      margin: 0!important;
    }
    .toggle-icon {
      margin: 0!important;
    }
    x-http-code-snippets {
      margin-bottom: 0!important;
    }
    iron-collapse {
      position: relative;
      overflow: hidden;
    }
    #code-snippets-fullscreen-btn {
      position: absolute;
      right: 0;
      top: 0;
      z-index: 99;
      background: #fff;
      padding: 12px 12px;
      cursor: pointer;
      text-transform: uppercase;
    }
    .fullscreen-snippets {
      position: fixed;
      top: 0;
      left: 0;
      background: #f5f7f9;
      width: 100%;
      height: 100%;
      z-index: 99;
    }
    `];
  }

  // Overriden to customize block structure
  _getUrlTemplate() {
    const { httpMethod, endpointUri } = this;
    return html`<section class="url-area">
      <div><b>Endpoint URL</b></div>
      <div class="url-value">${endpointUri}</div><hr>
    </section>`;
  }

  /*
    Overriden to:
      * change the position of "toggle" buttons (move them before the section title);
      * remove word SHOW/HIDE from toggle buttons;
      * make section titles bold;
  */
  _getCodeSnippetsTemplate() {
    if (!this.renderCodeSnippets) {
      return '';
    }
    const {
      _snippetsOpened,
      _renderSnippets,
      endpointUri,
      httpMethod,
      headers,
      payload,
      compatibility
    } = this;
    const iconClass = this._computeToggleIconClass(_snippetsOpened);
    return html`<section class="snippets">
      <div
        class="section-title-area"
        @click="${this._toggleSnippets}"
        title="Toogle code example details"
        ?opened="${_snippetsOpened}"
      >
        <div class="title-area-actions">
          <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
            <span class="icon ${iconClass}">${expandMore}</span>
          </anypoint-button>
        </div>
        <div class="heading3 table-title" role="heading" aria-level="2">
          <b>Code samples</b>
        </div>
      </div>
      <iron-collapse .opened="${_snippetsOpened}" @transitionend="${this._snippetsTransitionEnd}">
      ${_renderSnippets ? html`<div id="http-code-snippets-container">
          <x-http-code-snippets
            scrollable
            ?compatibility="${compatibility}"
            .url="${endpointUri}"
            .method="${httpMethod}"
            .headers="${this._computeSnippetsHeaders(headers)}"
            .payload="${this._computeSnippetsPayload(payload)}"></x-http-code-snippets>
          <div
            id="code-snippets-fullscreen-btn"
            title="Toggle fullscreen"
            onclick="(function(el) { el.parentElement.classList.toggle('fullscreen-snippets'); })(this)"
            ><span class="icon">${openInNew}</span>
          </div>
        </div>` : ''}
      </iron-collapse>
    </section>`;
  }

  /*
    Overriden to:
      * change the position of "toggle" buttons (move them before the section title);
      * remove word SHOW/HIDE from toggle buttons;
      * make section titles bold;
  */
  _getSecurityTemplate() {
    const { renderSecurity, security } = this;
    if (!renderSecurity || !security || !security.length) {
      return '';
    }
    const { securityOpened, compatibility, amf, narrow } = this;
    const label = this._computeToggleActionLabel(securityOpened);
    const iconClass = this._computeToggleIconClass(securityOpened);
    return html`<section class="security">
      <div
        class="section-title-area"
        @click="${this._toggleSecurity}"
        title="Toogle security details"
        ?opened="${securityOpened}"
      >
        <div class="title-area-actions">
          <anypoint-button class="toggle-button security" ?compatibility="${compatibility}">
            <span class="icon ${iconClass}">${expandMore}</span>
          </anypoint-button>
        </div>
        <div class="heading3 table-title" role="heading" aria-level="2"><b>Security</b></div>
      </div>
      <iron-collapse .opened="${securityOpened}">
        ${security.map((item) => html`<api-security-documentation
          .amf="${amf}"
          .security="${item}"
          ?narrow="${narrow}"
          ?compatibility="${compatibility}"></api-security-documentation>`)}
      </iron-collapse>
    </section>`;
  }

  // Overriden to output x-api-parameters-document instead of api-parameters-document
  _getParametersTemplate() {
    if (!this.hasParameters) {
      return '';
    }
    const {
      serverVariables,
      endpointVariables,
      queryParameters,
      amf,
      narrow,
      compatibility,
      graph
    } = this;
    return html`<x-api-parameters-document
      .amf="${amf}"
      queryopened
      pathopened
      .baseUriParameters="${serverVariables}"
      .endpointParameters="${endpointVariables}"
      .queryParameters="${queryParameters}"
      ?narrow="${narrow}"
      ?compatibility="${compatibility}"
      ?graph="${graph}"></x-api-parameters-document>`;
  }

  /* Overriden to output x-api-body-document instead of api-body-document. */
  _getBodyTemplate() {
    const { payload } = this;
    if (!payload || !payload.length) {
      return '';
    }
    const {
      amf,
      narrow,
      compatibility,
      graph
    } = this;
    return html`<x-api-body-document
      opened
      .amf="${amf}"
      ?narrow="${narrow}"
      ?compatibility="${compatibility}"
      ?graph="${graph}"
      .body="${payload}"></x-api-body-document>`;
  }

  /*
    Overriden to:
      * output x-api-responses-document instead of api-responses-document;
      * make section title bold;
  */
  _getReturnsTemplate() {
    const { returns } = this;
    if (!returns || !returns.length) {
      return '';
    }
    const {
      amf,
      narrow,
      compatibility,
      graph
    } = this;
    return html`<section class="response-documentation">
      <div class="heading2" role="heading" aria-level="1"><b>Responses</b></div>
      <x-api-responses-document
        .amf="${amf}"
        ?narrow="${narrow}"
        ?compatibility="${compatibility}"
        ?graph="${graph}"
        .returns="${returns}"></x-api-responses-document>
    </section>`;
  }

  /* Overriden to output x-api-headers-document instead of api-headers-document. */
  _getHeadersTemplate() {
    const { headers } = this;
    if (!headers || !headers.length) {
      return '';
    }
    const {
      amf,
      narrow,
      compatibility,
      graph
    } = this;
    return html`<x-api-headers-document
      opened
      .amf="${amf}"
      ?narrow="${narrow}"
      ?compatibility="${compatibility}"
      ?graph="${graph}"
      .headers="${headers}"></x-api-headers-document>`;
  }
}
window.customElements.define('x-api-method-documentation', XApiMethodDocumentation);


// Extends ApiParametersDocument to customize its output
export class XApiParametersDocument extends ApiParametersDocument {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
      anypoint-button {
        display: block;
        min-width: auto;
        padding: 0!important;
        margin: 0!important;
      }
      .toggle-icon {
        margin: 0!important;
      }
    `];
  }

  /*
    Overriden to:
      * change the position of "toggle" buttons (move them before the section title);
      * remove word SHOW/HIDE from toggle buttons;
      * make section titles bold;
  */
  render() {
    const {
      aware,
      pathOpened,
      queryOpened,
      _effectivePathParameters,
      queryParameters,
      amf,
      narrow,
      compatibility,
      headerLevel,
      graph
    } = this;
    const hasPathParameters = !!(_effectivePathParameters && _effectivePathParameters.length);
    return html`<style>${this.styles}</style>
    ${aware ?
      html`<raml-aware
        @api-changed="${this._apiChangedHandler}"
        .scope="${aware}"
        data-source="api-parameters-document"></raml-aware>` : ''}
    ${hasPathParameters ? html`<section class="uri-parameters">
      <div
        class="section-title-area"
        @click="${this.toggleUri}"
        title="Toogle URI parameters details"
        ?opened="${pathOpened}"
      >
        <div class="title-area-actions">
          <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
            <span class="icon ${this._computeToggleIconClass(pathOpened)}">${expandMore}</span>
          </anypoint-button>
        </div>
        <div class="table-title" role="heading" aria-level="${headerLevel}"><b>URI parameters</b></div>
      </div>
      <iron-collapse .opened="${pathOpened}">
        <x-api-type-document
          .amf="${amf}"
          .type="${_effectivePathParameters}"
          ?compatibility="${compatibility}"
          ?narrow="${narrow}"
          ?graph="${graph}"
          noExamplesActions
        ></x-api-type-document>
      </iron-collapse>
    </section>` : ''}

    ${queryParameters ? html`<section class="query-parameters">
      <div
        class="section-title-area"
        @click="${this.toggleQuery}"
        title="Toogle query parameters details"
        ?opened="${queryOpened}"
      >
        <div class="title-area-actions">
          <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
            <span class="icon ${this._computeToggleIconClass(queryOpened)}">${expandMore}</span>
          </anypoint-button>
        </div>
        <div class="table-title" role="heading" aria-level="${headerLevel}"><b>Query parameters</b></div>
      </div>
      <iron-collapse .opened="${queryOpened}">
        <x-api-type-document
          .amf="${amf}"
          .type="${queryParameters}"
          ?compatibility="${compatibility}"
          ?narrow="${narrow}"
          ?graph="${graph}"
          noExamplesActions
        ></x-api-type-document>
      </iron-collapse>
    </section>`: ''}`;
  }
}
window.customElements.define('x-api-parameters-document', XApiParametersDocument);


// Extend ApiBodyDocumentElement to customize its output
export class XApiBodyDocumentElement extends ApiBodyDocumentElement {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
      anypoint-button {
        display: block;
        min-width: auto;
        padding: 0!important;
        margin: 0!important;
      }
      .toggle-icon {
        margin: 0!important;
      }
    `];
  }

  /*
    Overriden to:
      * change the position of "toggle" buttons (move them before the section title);
      * remove word SHOW/HIDE from toggle buttons;
      * make section titles bold;
  */
  render() {
    const { opened, _isAnyType, aware, compatibility, headerLevel } = this;
    const iconClass = this._computeToggleIconClass(opened);
    return html`<style>${this.styles}</style>
    ${aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" .scope="${aware}"></raml-aware>` : ''}

    <div
      class="section-title-area"
      @click="${this.toggle}"
      title="Toogle body details"
      ?opened="${opened}"
    >
      <div class="title-area-actions">
        <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
          <span class="icon ${iconClass}">${expandMore}</span>
        </anypoint-button>
      </div>
      <div class="table-title" role="heading" aria-level="${headerLevel}"><b>Body</b></div>
    </div>

    <iron-collapse .opened="${opened}">
      ${_isAnyType ? this._anyTypeTemplate() : this._typedTemplate()}
    </iron-collapse>`;
  }
}
window.customElements.define('x-api-body-document', XApiBodyDocumentElement);


// Extend ApiBodyDocumentElement to customize its output
export class XApiResponsesDocument extends ApiResponsesDocument {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
      anypoint-button {
        display: block;
        min-width: auto;
        padding: 0!important;
        margin: 0!important;
      }
      .toggle-icon {
        margin: 0!important;
      }
    `];
  }

  /* Overriden to output x-api-body-document instead of api-body-document. */
  _payloadTemplate() {
    const {
      _payload,
      amf,
      narrow,
      compatibility,
      graph
    } = this;
    const hasPayload = !!(_payload && _payload.length);
    if (!hasPayload) {
      return '';
    }
    return html`<x-api-body-document
      .amf="${amf}"
      .body="${_payload}"
      ?narrow="${narrow}"
      ?compatibility="${compatibility}"
      ?graph="${graph}"
      renderreadonly
      opened></x-api-body-document>`
  }
}
window.customElements.define('x-api-responses-document', XApiResponsesDocument);


// Extend ApiBodyDocumentElement to customize its output
export class XApiHeadersDocument extends ApiHeadersDocument {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
      anypoint-button {
        display: block;
        min-width: auto;
        padding: 0!important;
        margin: 0!important;
      }
      .toggle-icon {
        margin: 0!important;
      }
    `];
  }

  /*
    Overriden to:
      * change the position of "toggle" buttons (move them before the section title);
      * remove word SHOW/HIDE from toggle buttons;
      * make section titles bold;
  */
  render() {
    const { aware, opened, headers, amf, narrow, compatibility, headerLevel, graph } = this;
    const hasHeaders = !!(headers && headers.length);
    return html`<style>${this.styles}</style>
    ${aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" .scope="${aware}"></raml-aware>` : ''}

    <div
      class="section-title-area"
      @click="${this.toggle}"
      title="Toogle headers details"
      ?opened="${opened}"
    >
      <div class="title-area-actions">
        <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
          <span class="icon ${this._computeToggleIconClass(opened)}">${expandMore}</span>
        </anypoint-button>
      </div>
      <div class="headers-title" role="heading" aria-level="${headerLevel}"><b>Headers</b></div>
    </div>

    <iron-collapse .opened="${opened}">
      ${hasHeaders ?
        html`<x-api-type-document
          .amf="${amf}"
          .type="${headers}"
          ?narrow="${narrow}"
          ?graph="${graph}"
          noExamplesActions
        ></x-api-type-document>` :
        html`<p class="no-info">Headers are not required by this endpoint</p>`}
    </iron-collapse>`;
  }
}
window.customElements.define('x-api-headers-document', XApiHeadersDocument);


// Extend ApiTypeDocument to customize its output
export class XApiTypeDocument extends ApiTypeDocument {

  // Overriden to output x-property-shape-document
  _objectTemplate() {
    const items = this._computeProperties(this._resolvedType);
    if (!items || !items.length) {
      return '';
    }
    return items.map(
      (item) => html`<x-property-shape-document
        class="object-document"
        .shape="${this._resolve(item)}"
        .amf="${this.amf}"
        .parentTypeName="${this.parentTypeName}"
        ?narrow="${this.narrow}"
        ?noexamplesactions="${this.noExamplesActions}"
        ?compatibility="${this.compatibility}"
        ?graph="${this.graph}"
        .mediaType="${this.mediaType}"
        ?renderReadOnly="${this.renderReadOnly}"
      ></x-property-shape-document>`
    );
  }

  // Overriden to output x-property-shape-document
  _arrayTemplate() {
    const items = this._computeArrayProperties(this._resolvedType) || [];
    return html`
      ${this.hasParentType
        ? html`<x-property-shape-document
            class="array-document"
            .amf="${this.amf}"
            .shape="${this._resolvedType}"
            .parentTypeName="${this.parentTypeName}"
            ?narrow="${this.narrow}"
            ?noexamplesactions="${this.noExamplesActions}"
            ?compatibility="${this.compatibility}"
            .mediaType="${this.mediaType}"
            ?graph="${this.graph}"
          ></x-property-shape-document>`
        : ''}

      <div class="array-children">
        ${items.map(
          (item) => html`
            ${item.isShape
              ? html`<x-property-shape-document
                  class="array-document"
                  .amf="${this.amf}"
                  .shape="${item}"
                  parentTypeName="${this._computeArrayParentName(
                    this.parentTypeName
                  )}"
                  ?narrow="${this.narrow}"
                  ?noexamplesactions="${this.noExamplesActions}"
                  ?compatibility="${this.compatibility}"
                  .mediaType="${this.mediaType}"
                  ?graph="${this.graph}"
                ></x-property-shape-document>`
              : ''}
            ${item.isType
              ? html`<api-type-document
                  class="union-document"
                  .amf="${this.amf}"
                  .parentTypeName="${this.parentTypeName}"
                  .type="${item}"
                  ?narrow="${this.narrow}"
                  ?noexamplesactions="${this.noExamplesActions}"
                  ?nomainexample="${this._renderMainExample}"
                  ?compatibility="${this.compatibility}"
                  .mediaType="${this.mediaType}"
                  ?graph="${this.graph}"
                ></api-type-document>`
              : ''}
          `
        )}
      </div>
    `;
  }

  // Overriden to output x-property-shape-document
  render() {
    let parts =
      'content-action-button, code-content-action-button, content-action-button-disabled, ';
    parts +=
      'code-content-action-button-disabled content-action-button-active, ';
    parts +=
      'code-content-action-button-active, code-wrapper, example-code-wrapper, markdown-html';
    const mediaTypes = this.mediaTypes || [];
    return html`<style>
        ${this.styles}
      </style>
      ${this.aware
        ? html`<raml-aware
            @api-changed="${this._apiChangedHandler}"
            scope="${this.aware}"
          ></raml-aware>`
        : ''}
      <section class="examples" ?hidden="${!this._renderMainExample}">
        ${this.renderMediaSelector
          ? html`<div class="media-type-selector">
              <span>Media type:</span>
              ${mediaTypes.map((item, index) => {
                const selected = this.selectedMediaType === index;
                const pressed = selected ? 'true' : 'false';
                return html`<anypoint-button
                  part="content-action-button"
                  class="media-toggle"
                  data-index="${index}"
                  ?activated="${selected}"
                  aria-pressed="${pressed}"
                  @click="${this._selectMediaType}"
                  ?compatibility="${this.compatibility}"
                  title="Select ${item} media type"
                  >${item}</anypoint-button
                >`;
              })}
            </div>`
          : ''}

        <api-resource-example-document
          .amf="${this.amf}"
          .payloadId="${this.selectedBodyId}"
          .examples="${this._resolvedType}"
          .mediaType="${this.mediaType}"
          .typeName="${this.parentTypeName}"
          @has-examples-changed="${this._hasExamplesHandler}"
          ?noauto="${!!this.isScalar}"
          ?noactions="${this.noExamplesActions}"
          ?rawOnly="${!this.mediaType}"
          ?compatibility="${this.compatibility}"
          exportparts="${parts}"
          ?renderReadOnly="${this.renderReadOnly}"
        ></api-resource-example-document>
      </section>

      ${this.isObject ? this._objectTemplate() : ''}
      ${this.isArray ? this._arrayTemplate() : ''}
      ${this.isScalar
        ? html`<x-property-shape-document
            class="shape-document"
            .amf="${this.amf}"
            .shape="${this._resolvedType}"
            .parentTypeName="${this.parentTypeName}"
            ?narrow="${this.narrow}"
            ?noexamplesactions="${this.noExamplesActions}"
            ?compatibility="${this.compatibility}"
            .mediaType="${this.mediaType}"
            ?graph="${this.graph}"
          ></x-property-shape-document>`
        : ''}
      ${this.isUnion ? this._unionTemplate() : ''}
      ${this.isAnd ? this._anyTemplate() : ''}
      ${this.isAnyOf ? this._anyOfTemplate() : ''}
      ${this.isOneOf ? this._oneOfTemplate() : ''}`;
  }
}
window.customElements.define('x-api-type-document', XApiTypeDocument);


// Extend PropertyShapeDocument to customize its output
export class XPropertyShapeDocument extends PropertyShapeDocument {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
      .data-type-string {
        background-color: #1589ee!important;
      }
      .data-type-integer,
      .data-type-number {
        background-color: #4aca80!important;
      }
    `];
  }

  // Overriden to add data-type-* classes
  _getTypeNameTemplate() {
    let dataType = this.propertyDataType;
    const id = this._targetTypeId;
    const { isScalarArray } = this;
    if (id) {
      const label = this._targetTypeName;
      return html`
        <span
          class="data-type link-label"
          role="link"
          tabindex="0"
          @click="${this._navigateType}"
          @keydown="${this._linkKeydown}"
          >${label}</span
        >
        <span class="type-data-type data-type-${dataType.toLowerCase()}">${dataType}</span>`;
    }
    if (isScalarArray) {
      const itemType = this.arrayScalarTypeName;
      dataType = `${dataType} of ${itemType}`;
    }
    return html`<span class="data-type data-type-${dataType.toLowerCase()}">${dataType}</span>`;
  }
}
window.customElements.define('x-property-shape-document', XPropertyShapeDocument);


// Override HttpCodeSnippetsElement to customize its output
export class XHttpCodeSnippetsElement extends HttpCodeSnippetsElement {

  // Overriden to add new styles
  get styles() {
    return [super.styles, css`
      anypoint-tabs {
        margin-right: 40px;
      }
    `];
  }
}
window.customElements.define('x-http-code-snippets', XHttpCodeSnippetsElement);
