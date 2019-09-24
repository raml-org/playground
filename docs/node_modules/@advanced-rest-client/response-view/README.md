[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/response-view.svg)](https://www.npmjs.com/package/@advanced-rest-client/response-view)

[![Build Status](https://travis-ci.org/advanced-rest-client/response-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-view)

## &lt;response-view&gt;

An element to display the HTTP response view.


```html
<response-view></response-view>
```

## Usage

### Installation
```
npm install --save @advanced-rest-client/response-view
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/response-view/response-view.js';
    </script>
  </head>
  <body>
    <response-view request="..." response="..."></response-view>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/response-view/response-view.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <response-view
      request="${this.request}"
      response="${this.response}"></response-view>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Development

```sh
git clone https://github.com/advanced-rest-client/response-view
cd response-view
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
