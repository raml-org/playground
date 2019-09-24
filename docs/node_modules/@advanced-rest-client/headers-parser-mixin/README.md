[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/headers-parser-mixin.svg)](https://www.npmjs.com/package/@advanced-rest-client/headers-parser-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/headers-parser-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/headers-parser-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/headers-parser-mixin)

## headers-parser-mixin

Headers parser Polymer Mixin to be implemented with elements that needs to parse headers data.

## Usage

### Installation
```
npm install --save @advanced-rest-client/headers-parser-mixin
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import { HeadersParserMixin } from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';

class SampleElement extends HeadersParserMixin(LitElement) {
  render() {
    const validation = this.getHeaderError('Whitespace Name: x-true');
    return html`
    ${validation ? html`<p>${validation}<p>` : html`<p>Headers are valid</p>`}
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import { PolymerElement, html } from '@polymer/polymer';
import { HeadersParserMixin } from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';

class SampleElement extends HeadersParserMixin(PolymerElement) {
  static get template() {
    return html`
    <template is="dom-if" if="[[validation]]">
      <p>${validation}<p>
    </template>
    <template is="dom-if" if="[[!validation]]">
      <p>Headers are valid</p>
    </template>
    `;
  }

  _processHeaders(value) {
    this.validation = this.getHeaderError(value);
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/headers-parser-mixin
cd headers-parser-mixin
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

This components is a part of API [components ecosystem](https://elements.advancedrestclient.com/)
