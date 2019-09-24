import { css } from 'lit-element';
import './typography.js';
import './colors.js';

const style = css`
  html {
    --primary-color: var(--anypoint-color-primary);
    --secondary-color: var(--anypoint-color-secondary);
    --primary-background-color: var(--anypoint-color-tertiary);
    --accent-color: var(--anypoint-color-violet3);

    /* HTTP methods colors */
    --method-display-selected-color: #fff;
    --method-display-get-color: var(--anypoint-color-viridian3);
    --method-display-post-color: var(--anypoint-color-violet3);
    --method-display-put-color: var(--anypoint-color-yellow3);
    --method-display-patch-color: var(--anypoint-color-indigo3);
    --method-display-delete-color: var(--anypoint-color-red3);
    --method-display-options-color: var(--anypoint-color-teal3);
    --method-display-head-color: var(--anypoint-color-futureGreen3);
    /* HTTP methods colors in method documentation panel */
    --http-method-label-border-radius: 1px;
    --http-method-label-get-background-color: var(--method-display-get-color);
    --http-method-label-get-color: #fff;
    --http-method-label-post-background-color: var(--method-display-post-color);
    --http-method-label-post-color: #fff;
    --http-method-label-put-background-color: var(--method-display-put-color);
    --http-method-label-put-color: #fff;
    --http-method-label-patch-background-color: var(--method-display-patch-color);
    --http-method-label-patch-color: #fff;
    --http-method-label-delete-background-color: var(--method-display-delete-color);
    --http-method-label-delete-color: #fff;
    --http-method-label-options-background-color: var(--method-display-options-color);
    --http-method-label-options-color: #fff;
    --http-method-label-head-background-color: var(--method-display-head-color);
    --http-method-label-head-color: #fff;
    --http-method-label-padding: 4px 5px;
    --method-display-font-weigth: 100;
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
