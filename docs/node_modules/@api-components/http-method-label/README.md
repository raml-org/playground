[![Published on NPM](https://img.shields.io/npm/v/@api-components/http-method-label.svg)](https://www.npmjs.com/package/@api-components/http-method-label)

[![Build Status](https://travis-ci.org/advanced-rest-client/http-method-label.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/http-method-label)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/http-method-label)

## &lt;http-method-label&gt;

A HTTP method name display label for lists.

```html
<http-method-label method="get"></http-method-label>
<http-method-label method="POST"></http-method-label>
<http-method-label method="Put"></http-method-label>
<http-method-label method="delete"></http-method-label>
<http-method-label method="patch"></http-method-label>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/http-method-label
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/http-method-label/http-method-label.js';
    </script>
  </head>
  <body>
    <http-method-label method="get"></http-method-label>
  </body>
</html>
```

### In a web component element

```js
import { LitElement, html, css } from 'lit-element';
import '@api-components/http-method-label/http-method-label.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <http-method-label method="get"></http-method-label>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/http-method-label
cd http-method-label
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
