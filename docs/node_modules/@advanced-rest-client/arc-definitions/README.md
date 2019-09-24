[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-definitions.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-definitions)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-definitions.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-definitions)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-definitions)

# arc-definitions

Request / response headers and status codes definitions database used in Adavanced REST Client and API Console.

The `<arc-definitions>` element listens for query events.
Other elements can dispatch the `query-headers` and `query-status-codes` events that are handled by this element. Events are stopped from propagation.
Handled event receives new property on the `detail` object with the query result.

## Dispatching query events

### Querying for headers data

Each header definition item has the following properties:
-   `key` - String, The name of the header
-   `desc` - String, The documentation for the header
-   `example` - String, Example value of the header
-   `autocomplete` - Array of String, list of possible/example values for autocomplete functions. This property is not available for response headers.

```json
{
  "key": "Accept-Charset",
  "desc": "Character sets that are acceptable",
  "example": "Accept-Charset: utf-8",
  "autocomplete": ["utf-8"]
}
```

To query for the headers data dispatch `query-headers` event:

```javascript
const e = new CustomEvent('query-headers', {
  detail: {
    type: 'request', // or "response"
    query: 'Acce'
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(e);
console.log(event.defaultPrevented); // true
const headers = event.detail.headers;  // Array[...]
```

or use imperative API:

```javascript
const data = document.querySelector('arc-definitions').queryHeaders('A', 'response');
console.log(data); // list of headers with "A" in the name
```

### Querying for status code data

Status code definition item has the following properties:
-   `key` - Number, Code value
-   `desc` - String, The documentation for the status code
-   `label` - String, Status label associated with the code

```json
{
  "key": 101,
  "label": "Switching Protocols",
  "desc":"This means the requester has asked the server to switch protocols and the server is acknowledging that it will do so"
}
```

To query for the status code definition dispatch `query-status-codes` event:

```javascript
const e = new CustomEvent('query-status-codes', {
  detail: {
    code: 200
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(e);
console.log(event.defaultPrevented); // true
const statusCode = event.detail.statusCode; // {...}
```

or use imperative API:

```javascript
const status = document.querySelector('arc-definitions').getStatusCode(201);
console.log(status); // Status code definition for 201
```

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/arc-definitions
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/arc-definitions/arc-definitions.js';
    </script>
  </head>
  <body>
    <arc-definitions></arc-definitions>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/arc-definitions/arc-definitions.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <arc-definitions></arc-definitions>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/arc-definitions/arc-definitions.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <arc-definitions></arc-definitions>
    `;
  }

  _authChanged(e) {
    console.log(e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/arc-definitions
cd arc-definitions
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
