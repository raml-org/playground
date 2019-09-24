[![Build Status](https://travis-ci.org/advanced-rest-client/authorization-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/uuid-generator)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/uuid-generator)

## &lt;uuid-generator&gt;

An UUID generator as a plain web component.
It does not include any dependnecies.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation

```sh
npm install --save @advanced-rest-client/uuid-generator
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/uuid-generator/uuid-generator.js';
    </script>
  </head>
  <body>
    <uuid-generator></uuid-generator>
  </body>
</html>
```

### In a other element

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/uuid-generator/uuid-generator.js';

class SampleElement extends LitElement {
  render() {
    return html`<uuid-generator></uuid-generator>`;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/uuid-generator
cd uuid-generator
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
