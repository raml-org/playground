[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/clipboard-copy.svg)](https://www.npmjs.com/package/@advanced-rest-client/clipboard-copy)

[![Build Status](https://travis-ci.org/advanced-rest-client/clipboard-copy.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/clipboard-copy)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/clipboard-copy)

## clipboard-copy

An element that copies a text to clipboard.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/clipboard-copy
```

### In an html file

```html
<script type="module" src="/node_modules/@advanced-rest-client/clipboard-copy/clipboard-copy.js"></script>
<clipboard-copy content="test"></clipboard-copy>
<script>
const elm = document.querySelectior('clipboard-copy');
if(elm.copy()) {
 console.info('Content has been copied to the clipboard');
} else {
 console.error('Content copy error. This browser is ancient!');
}
</script>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/clipboard-copy/clipboard-copy.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <clipboard-copy .content="${this.copyContent}"></clipboard-copy>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/clipboard-copy
cd clipboard-copy
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
