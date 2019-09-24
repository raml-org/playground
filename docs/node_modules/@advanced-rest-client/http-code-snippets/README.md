[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/http-code-snippets.svg)](https://www.npmjs.com/package/@advanced-rest-client/http-code-snippets)

[![Build Status](https://travis-ci.org/advanced-rest-client/http-code-snippets.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/http-code-snippets)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/http-code-snippets)


# &lt;http-code-snippets&gt;

Code snippets to render code implementation examples for a HTTP request.

## Example:

```html
<http-code-snippets url="https://api.github.com/authorizations" method="POST" payload='{"scopes": ["public_repo"]}'></http-code-snippets>
```

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/http-code-snippets
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import './node_modules/@advanced-rest-client/http-code-snippets/http-code-snippets.js';
    </script>
  </head>
  <body>
    <http-code-snippets url="https://api.github.com/authorizations" method="POST" payload='{"scopes": ["public_repo"]}'></http-code-snippets>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/http-code-snippets/http-code-snippets.js';

class SampleElement extends PolymerElement {
  render() {
    const {
      url,
      method,
      headers,
      payload
    } = this;
    return html`
    <http-code-snippets
      .url="${url}"
      .method="${method}"
      .headers="${headers}"
      .payload="${payload}"></http-code-snippets>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/http-code-snippets
cd http-code-snippets
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
