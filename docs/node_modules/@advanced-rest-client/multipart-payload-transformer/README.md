[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/multipart-payload-transformer.svg)](https://www.npmjs.com/package/@advanced-rest-client/multipart-payload-transformer)

[![Build Status](https://travis-ci.org/advanced-rest-client/multipart-payload-transformer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/multipart-payload-transformer)  

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/multipart-payload-transformer)

# multipart-payload-transformer

An element to transform `FormData` object into Multipart message and `ArrayBuffer`.

## Usage

### Installation
```
npm install --save @advanced-rest-client/multipart-payload-transformer
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/code-mirror/code-mirror.js';

class SampleElement extends PolymerElement {
  render() {
    const formData = new FormData();
    formData.add('filed', new Blob(['test'], { type: 'text/plain' }));
    return html`
    <multipart-payload-transformer .formData="${formData}"></multipart-payload-transformer>
    `;
  }

  async run() {
    const message = await this.shadowRoot.querySelector('multipart-payload-transformer').generateMessage();
    console.log(message);
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/multipart-payload-transformer/multipart-payload-transformer.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <multipart-payload-transformer formdata="[[formData]]"></multipart-payload-transformer>
    `;
  }

  static get properties() {
    return {
      formData: Object
    }
  }

  constructor() {
    super();
    const fd = new FormData();
    fd.add('test', 'value');
    this.formData = fd;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/multipart-payload-transformer
cd multipart-payload-transformer
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

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
