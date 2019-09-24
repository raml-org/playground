[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-example-generator.svg)](https://www.npmjs.com/package/@api-components/api-example-generator)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-example-generator.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-example-generator)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-example-generator)

## &lt;api-example-generator&gt;

Examples generator from AMF model.

```html
<api-example-generator></api-example-generator>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-example-generator
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-example-generator/api-example-generator.js';
    </script>
  </head>
  <body>
    <api-example-generator></api-example-generator>
  </body>
</html>
```

### In a LitElement element

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-example-generator/api-example-generator.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <api-example-generator .amf="${this.model}"></api-example-generator>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-example-generator
cd api-example-generator
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
