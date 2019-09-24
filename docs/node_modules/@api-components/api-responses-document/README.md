[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-responses-document.svg)](https://www.npmjs.com/package/@api-components/api-responses-document)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-responses-document.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-responses-document)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@api-components/api-responses-document)

## api-responses-document

A documentation for HTTP method responses based on AMF model.

```html
<api-responses-document></api-responses-document>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-responses-document
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-responses-document/api-responses-document.js';
    </script>
  </head>
  <body>
    <api-responses-document></api-responses-document>

    <script>
    const model = await getAmfModel();
    const returns = await getMethodReturns(model);
    const doc = document.querySelector('api-responses-document');
    doc.amf = model;
    doc.returns = returns;
    // Select a 400 response from auto generated list of available status codes
    const index = doc.codes.indexOf(400);
    doc.selected = index;
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-responses-document/api-responses-document.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-responses-document .amf="${this.amf}" returns="..."></api-responses-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@api-components/api-responses-document/api-responses-document.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <api-responses-document></api-responses-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/api-components/api-responses-document
cd api-responses-document
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
