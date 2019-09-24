[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/http-method-selector.svg)](https://www.npmjs.com/package/@advanced-rest-client/http-method-selector)

[![Build Status](https://travis-ci.org/advanced-rest-client/http-method-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/http-method-selector)

## &lt;http-method-selector&gt;

A HTTP method selector. Displays list of radio buttons with common http methods and a dropdown with less common but still valid methods.

It also allows to define own method.

```html
<http-method-selector method="POST" is-payload></http-method-selector>
<http-method-selector-mini method="PUT" is-payload></http-method-selector-mini>
```

## Usage

### Installation
```
npm install --save @advanced-rest-client/http-method-selector
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/http-method-selector/http-method-selector.js';
      import '@advanced-rest-client/http-method-selector/http-method-selector-mini.js';
    </script>
  </head>
  <body>
    <http-method-selector method="POST"></http-method-selector>
    <http-method-selector-mini method="PUT"></http-method-selector-mini>

    <script>
    {
      document.querySelector('http-method-selector').onmethod = (e) => {
        console.log(e.detail.value); // or e.target.method
      };
      document.querySelector('http-method-selector').onispayload = (e) => {
        if (e.detail.value) {
          console.log('Payload is allowed');
        } else {
          console.log('Payload is not allowed');
        }
      };
    }
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/http-method-selector/http-method-selector.js';
import '@advanced-rest-client/http-method-selector/http-method-selector-mini.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <http-method-selector
      method="POST"
      @method-changed="${this._verbHandler}"
      @ispayload-changed="${this._isPayloadHandler}"></http-method-selector>
    `;
  }

  _verbHandler(e) {
    this.httpMethod = e.target.method;
  }

  _isPayloadHandler(e) {
    this.payloadAllowed = e.detail.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/http-method-selector
cd http-method-selector
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
