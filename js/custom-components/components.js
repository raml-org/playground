import { html } from 'lit-element';
import { ApiSummary } from '@api-components/api-summary/src/ApiSummary.js';
import { ApiDocumentation } from '@api-components/api-documentation/src/ApiDocumentation.js';

function replaceComponentsTags (strings) {
  const tags = [
    'api-summary'
  ]
  return strings.map(str => {
    tags.forEach(tag => {
      str = str.replaceAll(tag, `x-${tag}`)
    })
    return str
  })
}


export class XApiSummary extends ApiSummary {
  _titleTemplate() {
    const { _apiTitle, titleLevel } = this;
    if (!_apiTitle) {
      return '';
    }
    return html`
    <div class="api-title" role="heading" aria-level="${titleLevel}">
    <label>TEST:</label>
    <span>${_apiTitle}</span>
    </div>`;
  }
}
window.customElements.define('api-summary', XApiSummary);


export class XApiDocumentation extends ApiDocumentation {
  // Computes documentation title
  _computeApiTitle() {
    const { amf } = this;
    const webApi = this._computeWebApi(amf);
    return this._getValue(webApi, this.ns.aml.vocabularies.core.name);
  }

  // Overriden to add documentation title block
  render() {
    if (!this.documentationTitle) {
      this.documentationTitle = this._computeApiTitle();
    }
    const { aware } = this;
    const res = html`<style>${this.styles}</style>
    ${html`<div id="api-doc-title">${this.documentationTitle}</div>`}
    ${aware ? html`<raml-aware
      .scope="${aware}"
      @api-changed="${this._apiChanged}"></raml-aware>` : ''}
    ${this._renderServerSelector()}
    ${this._renderView()}`;
    res.strings = replaceComponentsTags(res.strings);
    return res
  }

  // Overriden to create breadcrumbs in documentation title block
  _navigationHandler(e) {
    const { selected, type, endpointId } = e.detail;
    console.log(selected, type, endpointId);
    this.documentationTitle = `${this._computeApiTitle()}`
    if (type === 'method') {
      this.documentationTitle += ` / ${endpointId}`
    }
    super._navigationHandler(e);
  }
}
window.customElements.define('api-documentation', XApiDocumentation);
