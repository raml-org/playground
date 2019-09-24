[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/request-timings.svg)](https://www.npmjs.com/package/@advanced-rest-client/request-timings)

[![Build Status](https://travis-ci.org/advanced-rest-client/request-timings.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/request-timings)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@advanced-rest-client/request-timings)

## request-timings

An element to render request timings information from HAR 1.2  timings object

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/request-timings
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/request-timings/request-timings.js';
    </script>
  </head>
  <body>
    <request-timings></request-timings>
    <script>
    document.querySelector('request-timings').timings = {
      startTime: 1483368432132,
      blocked: 7.75,
      dns: 279.38,
      connect: 883.12,
      ssl: 633.05,
      send: 0.29,
      wait: 649.88,
      receive: 1.71
    };
    </script>
  </body>
</html>
```

### In a LitElement template

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/request-timings/request-timings.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <request-timings .timings="${this.har}"></request-timings>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/request-timings/request-timings.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <request-timings timings="[[timings]]"></request-timings>
    `;
  }

  setTimings() {
    this.timings = {
      startTime: 1483368432132,
      blocked: 7.75,
      dns: 279.38,
      connect: 883.12,
      ssl: 633.05,
      send: 0.29,
      wait: 649.88,
      receive: 1.71
    };
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/request-timings
cd request-timings
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
