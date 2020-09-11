import { html, css } from 'lit-element';
import { ApiSummary } from '@api-components/api-summary/src/ApiSummary.js';
import { ApiMethodDocumentation } from '@api-components/api-method-documentation/src/ApiMethodDocumentation.js';
import { ApiDocumentation } from '@api-components/api-documentation/src/ApiDocumentation.js';

// Extends ApiSummary to customize its output
export class XApiSummary extends ApiSummary {

  // Overriden to add new styles
  get styles() {
    return super.styles.concat(css`
    span.endpoint-path {
      float: left;
    }
    span.endpoint-operations {
      float: right;
    }
    .endpoint-item {
      clear: both;
    }
    .url-area {
      padding: 0;
      margin-bottom: 0;
    }
    .endpoints-title {
      margin: 0;
    }
    .separator {
      margin: 15px 0;
    }
    `);
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
      <label><b>Base URI</b></label></br>
      <span class="url-value">${uri}</span>
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
      <label class="section endpoints-title"><b>Endpoints</b></label></br>
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
    </div>`;
  }
}
window.customElements.define('x-api-summary', XApiSummary);


// Extends ApiMethodDocumentation to customize its output
export class XApiMethodDocumentation extends ApiMethodDocumentation {

}
window.customElements.define('x-api-method-documentation', XApiMethodDocumentation);


// Extends ApiDocumentation to customize its output
export class XApiDocumentation extends ApiDocumentation {

  // Overriden to add new styles
  get styles() {
    return super.styles.concat(css`
    x-api-summary,
    x-api-method-documentation,
    api-annotation-documentation,
    api-endpoint-documentation,
    api-security-documentation,
    api-type-documentation {
      padding: 15px;
    }
    #api-doc-title {
      padding: 10px 15px;
      background-color: #d8d8d8;
    }
    `);
  }

  // Computes documentation title
  _computeApiTitle() {
    const { amf } = this;
    const webApi = this._computeWebApi(amf);
    return this._getValue(webApi, this.ns.aml.vocabularies.core.name);
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
  // _navigationHandler(e) {
  //   const { selected, type, endpointId } = e.detail;
  //   this.documentationTitle = `${this._computeApiTitle()}`
  //   if (type === 'method') {
  //     this.documentationTitle += ` / ${endpointId}`
  //   }
  //   super._navigationHandler(e);
  // }
}
window.customElements.define('x-api-documentation', XApiDocumentation);
