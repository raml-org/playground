[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-schema-document.svg)](https://www.npmjs.com/package/@api-components/api-schema-document)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-schema-document.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-schema-document)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-schema-document)

## &lt;api-schema-document&gt;

A component to render XML/JSON schema with examples.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-schema-document
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-schema-document/api-schema-document.js';
    </script>
  </head>
  <body>
    <api-schema-document></api-schema-document>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-schema-document/api-schema-document.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-schema-document .amf="${this.amf}"></api-schema-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-schema-document
cd api-schema-document
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
