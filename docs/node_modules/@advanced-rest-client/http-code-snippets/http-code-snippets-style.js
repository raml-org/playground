/**
http://prismjs.com/download.html?themes=prism&languages=markup+css+clike+javascript

prism.js default theme for JavaScript, CSS and HTML
Based on dabblet (http://dabblet.com)
@author Lea Verou

Modified for ARC.
*/
import { css } from 'lit-element';

export default css`:host {
  display: block;
  position: relative;
  width: 100%;
}

.code {
  display: block;
  position: relative;
  white-space: pre-wrap;
  word-break: break-all;
  padding-top: 20px; /* Padding for the copy button. */

  background-color: var(--http-code-snippet-container-background-color);
  padding: var(--http-code-snippet-container-padding, 8px);
}

.copy-button,
anypoint-icon-button {
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 1;
}

.copy-button {
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  background: #e0e0e0;
}

.label {
  font-weight: 500;
}

.value {
  margin-left: 8px;
}

.line {
  word-break: break-all;
  white-space: pre-wrap;
}

.line.indent {
  margin-left: var(--http-code-snippet-indent, 12px);
}

.line.indent-2 {
  margin-left: var(--http-code-snippet-indent-2, 24px);
}

.copy-button {
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  -ms-flex-pack: end;
  -webkit-justify-content: flex-end;
  justify-content: flex-end;
  -ms-flex-direction: row;
  -webkit-flex-direction: row;
  flex-direction: row;
}

code[class*="language-"],
pre[class*="language-"] {
  font-family: var(--arc-font-code-family);
  webkit-font-smoothing: var(--arc-font-font-smoothing);
  color: var(--code-color, black);
  text-shadow: 0 1px white;
  text-shadow: var(--http-code-snippet-code-text-shadow, 0 1px white);
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  text-align: left;
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

pre[class*="language-"]::-moz-selection,
pre[class*="language-"] ::-moz-selection,
code[class*="language-"]::-moz-selection,
code[class*="language-"] ::-moz-selection {
  text-shadow: none;
  background: var(--http-code-snippet-code-selection-background-color, #b3d4fc);
}

pre[class*="language-"]::selection,
pre[class*="language-"] ::selection,
code[class*="language-"]::selection,
code[class*="language-"] ::selection {
  text-shadow: none;
  background: var(--http-code-snippet-code-selection-background-color, #b3d4fc);
}

@media print {
  code[class*="language-"],
  pre[class*="language-"] {
    text-shadow: none;
  }
}
/* Code blocks */

pre[class*="language-"] {
  padding: 1em;
  margin: .5em 0;
  overflow: auto;
}

/* Inline code */

:not(pre)>code[class*="language-"] {
  padding: .1em;
  border-radius: .3em;
  white-space: normal;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: var(--http-code-snippet-code-cdata-color, slategray);
}

.token.punctuation {
  color: var(--code-punctuation-value-color, #999);
}

.namespace {
  opacity: .7;
}

.token.property,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted {
  color: var(--code-type-number-value-color, #905);
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: var(--code-type-text-value-color, #690);
}

.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string {
  color: var(--code-punctuation-value-color, #a67f59);
  background: transparent !important;
}

.token.atrule,
.token.attr-value,
.token.keyword {
  color: var(--http-code-snippet-code-keyword-color, #07a);
}

.token.function {
  color: var(--http-code-snippet-code-function-color, #DD4A68);
}

.token.regex,
.token.important,
.token.variable {
  color: var(--http-code-snippet-variable-color, #e90);
}

.token.important,
.token.bold {
  font-weight: bold;
}

.token.italic {
  font-style: italic;
}

.token.entity {
  cursor: help;
}`;
