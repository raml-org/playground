[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-marked.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-marked)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-marked.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-marked)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-marked)

# arc-marked

Port of Polymer's marked-element to LitElement

```html
<arc-marked>
  <div slot="markdown-html"></div>
  <script type="text/markdown">
    ## Markdown Renderer

     <div>This is a HTML container</div>

    Example:

    ```html
    <paper-toolbar>
     <paper-icon-button icon="menu"></paper-icon-button>
     <div class="title">Title</div>
     <paper-icon-button icon="more"></paper-icon-button>
    </paper-toolbar>
    ```

    _Nifty_ features.
 </script>
</arc-marked>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/arc-marked
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/arc-marked/arc-marked.js';
    </script>
  </head>
  <body>
    <arc-marked markdown="..."></arc-marked>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/arc-marked/arc-marked.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <arc-marked .markdown="${this.markdown}"></arc-marked>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/arc-marked
cd arc-marked
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests
```sh
npm test
```
