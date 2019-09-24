[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/response-raw-viewer.svg)](https://www.npmjs.com/package/@advanced-rest-client/response-raw-viewer)

[![Build Status](https://travis-ci.org/advanced-rest-client/response-raw-viewer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-raw-viewer)

## &lt;response-raw-viewer&gt;

An element to display the raw HTTP response data without syntax highlighting.

```html
<response-raw-viewer responsetext="Some response"></response-raw-viewer>
```

## Usage

### Installation
```
npm install --save @advanced-rest-client/response-raw-viewer
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/response-raw-viewer/response-raw-viewer.js';
    </script>
  </head>
  <body>
    <response-raw-viewer responsetext="Some response"></response-raw-viewer>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/response-raw-viewer/response-raw-viewer.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <response-raw-viewer
      .responseText="${this.response}"></response-raw-viewer>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Development

```sh
git clone https://github.com/advanced-rest-client/response-raw-viewer
cd response-raw-viewer
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
