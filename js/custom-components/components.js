import { html } from 'lit-element';
import { ApiSummary } from '@api-components/api-summary/src/ApiSummary.js';
// import { ApiDocumentation } from '@api-components/api-documentation/api-documentation.js';

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

}
window.customElements.define('x-api-summary', XApiSummary);

export class XApiDocumentation extends ApiDocumentation {
  render() {
    const res = super.render();
    res.strings = replaceComponentsTags(res.strings)
    return res
  }
}
window.customElements.define('x-api-documentation', XApiDocumentation);
