import { css } from 'lit-element';
import './din-pro.js';
/*
Anypoint typography.

This CSS variables has to be applied to the corresponding elements in Anypoint
Web Components.

This may not be a convinient way of applying styles but at the moment of making it
there's nmo other way. There's promising `::parts` and `::theme` spec proposal
but it is only implemented in Chrome and it is not sure whether the spec will be adopted.
*/
const style = css`
  html {
    --font-family: 'Open Sans', 'DIN Pro', sans-serif;
    --font-family-din: 'DIN Pro', sans-serif;
    --font-code-family: 'Source Code Pro', 'Consolas', 'Menlo', monospace;
    /* Header 1 */
    --font-header1-font-size: 30px;
    --font-header1-font-weight: 100;
    --font-header1-letter-spacing: -0.5px;
    --font-header1-margin-bottom: 20px;
    /* Header 2 */
    --font-header2-font-size: 25px;
    --font-header2-font-weight: 100;
    --font-header2-letter-spacing: -0.3px;
    --font-header2-margin-bottom: 20px;
    /* Header 3 */
    --font-header3-font-size: 20px;
    --font-header3-font-weight: 100;
    --font-header3-letter-spacing: -0.25px;
    --font-header3-margin-bottom: 20px;
    /* Header 4 */
    --font-header4-font-size: 18px;
    --font-header4-font-weight: 100;
    --font-header4-letter-spacing: -0.2px;
    --font-header4-margin-bottom: 20px;
    /* Header 5 */
    --font-header5-font-size: 16px;
    --font-header5-font-weight: 100;
    --font-header5-letter-spacing: -0.2px;
    --font-header5-margin-bottom: 20px;
    /* Header 6 */
    --font-header6-font-size: 12px;
    --font-header6-font-weight: 700;
    --font-header6-letter-spacing: 0;
    --font-header6-margin-bottom: 20px;
    /* Body text */
    --font-body-font-size: 14px;
    --font-body-letter-spacing: 0;
    --font-body-font-weight: 400;
    /* Body text small */
    --font-body-small-font-size: 14px;
    --font-body-small-letter-spacing: 0;
    --font-body-small-font-weight: 400;
    /* Blockquote container */
    --font-blockquote-font-style: italic;
    --font-blockquote-font-weight: 200;
    --font-blockquote-font-size: 18px;
    /* Code block */
    --font-code-font-size: 14px;
    --font-code-font-weight: 500;
    --font-code-line-height: 20px;
  }
`;
try {
  document.adoptedStyleSheets = document.adoptedStyleSheets.concat(style.styleSheet);
} catch (_) {
  /* istanbul ignore next */
  {
    const s = document.createElement('style');
    s.type = 'text/css';
    s.innerHTML = style.cssText;
    document.getElementsByTagName('head')[0].appendChild(s);
  }
}
