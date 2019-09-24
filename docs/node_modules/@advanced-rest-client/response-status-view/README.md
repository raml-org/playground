[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/response-status-view.svg)](https://www.npmjs.com/package/@advanced-rest-client/response-status-view)

[![Build Status](https://travis-ci.org/advanced-rest-client/response-status-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-status-view)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/response-status-view)

## &lt;response-status-view&gt;

HTTP response status view, including status, headers redirects and timings/

```html
<response-status-view></response-status-view>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/response-status-view
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/response-status-view/response-status-view.js';
    </script>
  </head>
  <body>
    <response-status-view></response-status-view>
  </body>
</html>
```


### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/response-status-view/response-status-view.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <response-status-view .json="${this.json}"></response-status-view>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import { PolymerElement, html } from '@polymer/polymer';
import '@advanced-rest-client/response-status-view/response-status-view.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <response-status-view
      .statusCode="{this.response.statusCode}"
      .statusMessage="{this.response.statusMessage}"
      .loadingTime="{this.response.loadingTime}"
      .responseHeaders="{this.response.responseHeaders}"
      .requestHeaders="{this.response.requestHeaders}"
      ...></response-status-view>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/response-status-view
cd response-status-view
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
