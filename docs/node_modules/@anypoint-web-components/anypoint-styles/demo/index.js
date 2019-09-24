import { html, render } from 'lit-html';
import { IronMeta } from '@polymer/iron-meta/iron-meta.js';
import '../anypoint-icons.js';

const items = new IronMeta({ type: 'iconset' }).list;

render(
  html`
    <h1>Icons</h1>
    ${items.map(
      item => html`
        <h2>${item.name}</h2>
        <div class="set">
          ${item.getIconNames().map(
            item => html`
              <span class="container">
                <iron-icon .icon="${item}"></iron-icon>
                <div>${item}</div>
              </span>
            `,
          )}
        </div>
      `,
    )}
  `,
  document.querySelector('#demo'),
);
