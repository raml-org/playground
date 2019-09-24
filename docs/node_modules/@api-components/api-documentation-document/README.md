[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-documentation-document.svg)](https://www.npmjs.com/package/@api-components/api-documentation-document)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-documentation-document.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-documentation-document)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-documentation-document)

# api-documentation-document

A component to render documentation node of the AMF model


```html
<api-documentation-document amf="{...}" shape="{...}"></api-documentation-document>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-documentation-document
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-documentation-document/api-documentation-document.js';
    </script>
  </head>
  <body>
    <api-documentation-document></api-documentation-document>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-documentation-document/api-documentation-document.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-documentation-document .amf="${this.amf}"></api-documentation-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-documentation-document
cd api-documentation-document
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
