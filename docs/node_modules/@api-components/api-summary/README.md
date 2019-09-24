[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-summary.svg)](https://www.npmjs.com/package/@api-components/api-summary)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-summary.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-summary)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@api-components/api-summary)

# api-summary

A component that renders basic information about an API.
It uses AMF model to render the view.


## Usage

### Installation
```
npm install --save @api-components/api-summary
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-summary/api-summary.js';
    </script>
  </head>
  <body>
    <api-summary></api-summary>
    <script>
    const amf = await getAmfModel();
    document.body.querySelector('api-summary').api = amf;
    window.addEventListener('api-navigation-selection-changed', (e) => {
      console.log(e.detail.selected);
      console.log(e.detail.type);
    });
    </script>
  </body>
</html>
```

### In a LitElement template

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-summary/api-summary.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <api-summary .api="${this._amfModel}" @api-navigation-selection-changed="${this._navHandler}"></api-summary>
    `;
  }

  _navHandler(e) {
    console.log(e.detail.selected);
    console.log(e.detail.type);
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@api-components/api-summary/api-summary.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <api-summary api="[[amfModel]]" on-api-navigation-selection-changed="_navHandler"></api-summary>
    `;
  }

  _navHandler(e) {
    console.log(e.detail.selected);
    console.log(e.detail.type);
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-summary
cd api-summary
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
