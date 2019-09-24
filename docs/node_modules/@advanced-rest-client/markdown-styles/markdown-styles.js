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
/**
## Styles for markdown viewer

It should be included where the `marked-element` is used.

## Usage example

```javascript
import { LitElement, html, css } from 'lit-element';
import markdownStyles from '@advanced-rest-client/markdown-stylesmarkdown-styles.js';

class MarkdownImpl extends LitElement {
  static get styles() {
    return css`
    :host {
      ...
    }
    ${markdownStyles}
  }

  render() {
    return html`
    <marked-element markdown="....">
      <div class="markdown-html"></div>
    </marked-element>`;
  }
}
```

Note use of the `markdown-html` CSS rules. It is required by markdown element also all css rules
defined here are scoped to a container with this class name.

@customElement
@group UI Elements
@memberof UI Elements
@element markdown-styles
*/
import { css } from 'lit-element';
export default css`[slot="markdown-html"] {
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  font-size: var(--arc-font-body1-font-size, 14px);
  font-weight: var(--arc-font-body1-font-weight, 400);
  line-height: var(--arc-font-body1-line-height, 20px);
}

[slot="markdown-html"] h1,
[slot="markdown-html"] h2,
[slot="markdown-html"] h3,
[slot="markdown-html"] h4,
[slot="markdown-html"] h5,
[slot="markdown-html"] h6 {
  font-size: var(--arc-font-title-font-size, 20px);
  font-weight: var(--arc-font-title-font-weight, 500);
  line-height: var(--arc-font-title-line-height, 28px);
}

[slot="markdown-html"] h1 tt,
[slot="markdown-html"] h1 code,
[slot="markdown-html"] h2 tt,
[slot="markdown-html"] h2 code,
[slot="markdown-html"] h3 tt,
[slot="markdown-html"] h3 code,
[slot="markdown-html"] h4 tt,
[slot="markdown-html"] h4 code,
[slot="markdown-html"] h5 tt,
[slot="markdown-html"] h5 code,
[slot="markdown-html"] h6 tt,
[slot="markdown-html"] h6 code {
  font-size: inherit
}

[slot="markdown-html"] h1 {
  font-size: var(--arc-font-display1-font-size, 34px);
  font-weight: var(--arc-font-display1-font-weight, 400);
  letter-spacing: var(--arc-font-display1-letter-spacing, -.01em);
  line-height: var(--arc-font-display1-line-height, 40px);
  border-bottom: 1px solid var(--markdown-styles-title-border-bottom-color, #eee);
  padding-top: 1rem;
  padding-bottom: 0.5rem;
}

[slot="markdown-html"] h2 {
  font-size: var(--arc-font-title-font-size, 20px);
  font-weight: var(--arc-font-title-font-weight, 500);
  line-height: var(--arc-font-title-line-height, 28px);
  border-bottom: 1px solid var(--markdown-styles-title-border-bottom-color, #eee);
}

[slot="markdown-html"] h3 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  font-size: 1.5em;
  line-height: 1.43
}

[slot="markdown-html"] h4 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  line-height: var(--arc-font-subhead-line-height, 24px);
  font-size: 1.25em
}

[slot="markdown-html"] h5 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  line-height: var(--arc-font-subhead-line-height, 24px);
  font-size: 1em
}

[slot="markdown-html"] h6 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  line-height: var(--arc-font-subhead-line-height, 24px);
  font-size: 1em;
  color: #777;
}

[slot="markdown-html"] p,
[slot="markdown-html"] blockquote,
[slot="markdown-html"] ul,
[slot="markdown-html"] ol,
[slot="markdown-html"] dl,
[slot="markdown-html"] table,
[slot="markdown-html"] pre {
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  font-size: var(--arc-font-body1-font-size, 14px);
  font-weight: var(--arc-font-body1-font-weight, 400);
  line-height: var(--arc-font-body1-line-height, 20px);
  margin-top: 0;
  margin-bottom: 16px;
}

[slot="markdown-html"] > *:last-child {
  margin-bottom: 0;
}

[slot="markdown-html"] hr {
  height: 4px;
  padding: 0;
  margin: 16px 0;
  background-color: var(--markdown-styles-hr-color, #e7e7e7);
  border: 0 none;
}

[slot="markdown-html"] ul,
[slot="markdown-html"] ol {
  padding-left: 2em;
}

[slot="markdown-html"] ul.no-list,
[slot="markdown-html"] ol.no-list {
  padding: 0;
  list-style-type: none;
}

[slot="markdown-html"] ul ul,
[slot="markdown-html"] ul ol,
[slot="markdown-html"] ol ol,
[slot="markdown-html"] ol ul {
  margin-top: 0;
  margin-bottom: 0;
}

[slot="markdown-html"] li>p {
  margin-top: 16px;
}

[slot="markdown-html"] dl {
  padding: 0;
}

[slot="markdown-html"] dl dt {
  padding: 0;
  margin-top: 16px;
  font-size: 1em;
  font-style: italic;
  font-weight: bold;
}

[slot="markdown-html"] dl dd {
  padding: 0 16px;
  margin-bottom: 16px
}

[slot="markdown-html"] blockquote {
  padding: 0 15px;
  color: var(--markdown-styles-blockquote-color, #777);
  border-left: 4px solid var(--markdown-styles-blockquote-border-left-color, #ddd);
}

[slot="markdown-html"] blockquote>:first-child {
  margin-top: 0
}

[slot="markdown-html"] blockquote>:last-child {
  margin-bottom: 0
}

[slot="markdown-html"] table {
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  font-size: var(--arc-font-body1-font-size, 14px);
  font-weight: var(--arc-font-body1-font-weight, 400);
  line-height: var(--arc-font-body1-line-height, 20px);
  display: block;
  width: 100%;
  overflow: auto;
  word-break: normal;
  word-break: keep-all;
  border-collapse: collapse;
}

[slot="markdown-html"] table th {
  font-weight: bold
}

[slot="markdown-html"] table th,
[slot="markdown-html"] table td {
  padding: 6px 13px;
  border: 1px solid var(--markdown-styles-table-header-border-color, #ddd);
}

[slot="markdown-html"] table tr {
  background-color: #fff;
  border-top: 1px solid #ccc
}

[slot="markdown-html"] table tr:nth-child(2n) {
  background-color: var(--markdown-styles-table-row-background-color, #f8f8f8);
}

[slot="markdown-html"] img {
  max-width: 100%;
  box-sizing: content-box;
  background-color: var(--markdown-styles-image-background-color, #fff);
}

[slot="markdown-html"] img[align=right] {
  padding-left: 20px
}

[slot="markdown-html"] img[align=left] {
  padding-right: 20px
}

[slot="markdown-html"] code,
[slot="markdown-html"] tt {
  font-family: var(--arc-font-code-family, 'Roboto Mono', 'Consolas', 'Menlo', monospace;);
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  padding: 0;
  padding-top: 0.2em;
  padding-bottom: 0.2em;
  margin: 0;
  background-color: var(--markdown-styles-code-background-color, rgba(0, 0, 0, 0.04));
  border-radius: 2px
}

[slot="markdown-html"] pre {
  word-wrap: normal
}

/**
* prism.js default theme for JavaScript, CSS and HTML
* Based on dabblet (http://dabblet.com)
* @author Lea Verou
*/
[slot="markdown-html"] code,
[slot="markdown-html"] pre {
  font-family: var(--arc-font-code-family, 'Roboto Mono', 'Consolas', 'Menlo', monospace;);
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  color: var(--code-color, black);
  background-color: var(--code-background-color);
  text-shadow: var(--markdown-styles-code-text-shadow, 0 1px white);
  text-align: left;
  word-break: break-all;
  white-space: pre-wrap;
  word-spacing: normal;
  line-height: 1.5;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;

  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
}

[slot="markdown-html"] pre::-moz-selection,
[slot="markdown-html"] pre ::-moz-selection,
[slot="markdown-html"] code::-moz-selection,
[slot="markdown-html"] code ::-moz-selection {
  text-shadow: none;
  background: var(--markdown-styles-code-selection-background-color, #b3d4fc);
}

[slot="markdown-html"] pre::selection,
[slot="markdown-html"] pre ::selection,
[slot="markdown-html"] code::selection,
[slot="markdown-html"] code ::selection {
  text-shadow: none;
  background: var(--markdown-styles-code-selection-background-color, #b3d4fc);
}

@media print {
  [slot="markdown-html"] code,
  [slot="markdown-html"] pre {
    text-shadow: none;
  }
}

/* Code blocks */
[slot="markdown-html"] pre {
  padding: 1em;
  margin: .5em 0;
  overflow: auto;
}

[slot="markdown-html"] :not(pre) > code,
[slot="markdown-html"] pre,
pre[slot="markdown-html"] {
  background: var(--code-background-color, #f5f2f0);
}

/* Inline code */
[slot="markdown-html"] :not(pre) > code {
  padding: .1em;
  border-radius: .3em;
  white-space: normal;
}

[slot="markdown-html"] .token.comment,
[slot="markdown-html"] .token.prolog,
[slot="markdown-html"] .token.doctype,
[slot="markdown-html"] .token.cdata {
  color: var(--markdown-styles-code-cdata-color, slategray);
}

[slot="markdown-html"] .token.punctuation {
  color: var(--code-punctuation-value-color, #999);
}

[slot="markdown-html"] .namespace {
  opacity: .7;
}

[slot="markdown-html"] .token.property,
[slot="markdown-html"] .token.tag,
[slot="markdown-html"] .token.boolean,
[slot="markdown-html"] .token.number,
[slot="markdown-html"] .token.constant,
[slot="markdown-html"] .token.symbol,
[slot="markdown-html"] .token.deleted {
  color: var(--code-type-number-value-color, #905);
}

[slot="markdown-html"] .token.selector,
[slot="markdown-html"] .token.attr-name,
[slot="markdown-html"] .token.string,
[slot="markdown-html"] .token.char,
[slot="markdown-html"] .token.builtin,
[slot="markdown-html"] .token.inserted {
  color: var(--code-type-text-value-color, #690);
}

[slot="markdown-html"] .token.operator,
[slot="markdown-html"] .token.entity,
[slot="markdown-html"] .token.url,
[slot="markdown-html"] .language-css .token.string,
[slot="markdown-html"] .style .token.string {
  color: var(--code-punctuation-value-color, #a67f59);
  background: hsla(0, 0%, 100%, .5);
}

[slot="markdown-html"] .token.atrule,
[slot="markdown-html"] .token.attr-value,
[slot="markdown-html"] .token.keyword {
  color: var(--markdown-styles-code-keyword-color, #07a);
}

[slot="markdown-html"] .token.function {
  color: var(--markdown-styles-code-function-color, #DD4A68);
}

[slot="markdown-html"] .token.regex,
[slot="markdown-html"] .token.important,
[slot="markdown-html"] .token.variable {
  color: var(--markdown-styles-variable-color, #e90);
}

[slot="markdown-html"] .token.important,
[slot="markdown-html"] .token.bold {
  font-weight: bold;
}
[slot="markdown-html"] .token.italic {
  font-style: italic;
}

[slot="markdown-html"] .token.entity {
  cursor: help;
}`;
