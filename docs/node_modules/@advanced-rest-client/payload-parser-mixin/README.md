[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/payload-parser-mixin.svg)](https://www.npmjs.com/package/@advanced-rest-client/payload-parser-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/payload-parser-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/payload-parser-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@advanced-rest-client/payload-parser-mixin)

## payload-parser-mixin

A mixin to be implemented to elements that needs to parse request / response body.

## Usage

### Installation
```
npm install --save @advanced-rest-client/payload-parser-mixin
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import { PayloadParserMixin } from '@advanced-rest-client/payload-parser-mixin/payload-parser-mixin.js';

class SampleElement extends PayloadParserMixin(LitElement) {
  render() {
    const encoded = this.encodeUrlEncoded('String to URL encode');
    return html`
    <p>Encoded: ${encoded}</p>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import { PolymerElement, html } from '@polymer/polymer';
import { PayloadParserMixin } from '@advanced-rest-client/payload-parser-mixin/payload-parser-mixin.js';

class SampleElement extends PayloadParserMixin(PolymerElement) {
  static get template() {
    return html`
    <p>Encoded: [[encoded]]</p>
    `;
  }

  _prepareEncoded(value) {
    this.encoded = this.encodeUrlEncoded(value);
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/payload-parser-mixin
cd payload-parser-mixin
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

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
