[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-annotation-document.svg)](https://www.npmjs.com/package/@api-components/api-annotation-document)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-annotation-document.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-annotation-document)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@advanced-rest-client/api-annotation-document)

## api-annotation-document

An element to render RAML annotations based on AMF data model.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-annotation-document
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-annotation-document/api-annotation-document.js';
    </script>
  </head>
  <body>
    <api-annotation-document></api-annotation-document>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-annotation-document/api-annotation-document.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <api-annotation-document></api-annotation-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/api-annotation-document
cd api-annotation-document
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
