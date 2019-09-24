[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-url-data-model.svg)](https://www.npmjs.com/package/@api-components/api-url-data-model)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-url-data-model)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-url-data-model)

## &lt;api-url-data-model&gt;

An element to generate view model for `api-url-editor` and `api-url-params-editor`
elements from [AMF](https://github.com/mulesoft/amf) json/ld model.

AMF allows to read any API spec document (RAML, OAS by default) and produce common
data model.

This component creates a view model used in request forms from selected endpoint
or HTTP method.

The component computes all required values from AMF's WebApi model.

```html
<api-url-data-model></api-url-data-model>
```

```javascript
const elm = document.querySelector('api-url-data-model');
const model = await downloadApiModel();
elm.amf = model;
elm.selected = '#123'; // Selected node ID, must be method's ID.

console.log(elm.server); // server definition
console.log(elm.apiParameters); // API base path parameters
console.log(elm.endpointUri); // API base path parameters
console.log(elm.apiBaseUri); // Computed value of base URI for the API.
console.log(elm.pathModel); // Endpoint's URI variables (including base URI's variables)
console.log(elm.queryModel); // Method's query parameters
```

When using partial query model the `server`, `protocols`, and `version`
model must be set manually as partial model won't have this information.

After reseting the model to full AMF WebApi model the values are updated.

```javascript
const elm = document.querySelector('api-url-data-model');
const summaryModel = await downloadPartialApiModelSummary();
const endpointModel = await downloadPartialApiModelEndpoint();
elm.amf = endpointModel;
elm.selected = '#123'; // Selected node ID, must be method ID that is in endpoint definition.
elm.server = elm._computeServer(summaryModel); // This is element's inherited method
elm.version = conputeApiVersion(summaryModel); // Compute version from `server` model.
elm.protocols = ['http', 'https']; // This is encoded in AMF model.

console.log(elm.apiParameters); // API base path parameters
console.log(elm.endpointUri); // API base path parameters
console.log(elm.apiBaseUri); // Computed value of base URI for the API.
console.log(elm.pathModel); // Endpoint's URI variables (including base URI's variables)
console.log(elm.queryModel); // Method's query parameters
```

## Overriding API's base URL

To alter URL data model without changing the AMF or API data simply set `apiUri` proprty. The component then regenrates `apiBaseUri` and `endpointUri`
to include updated API base uri.

```javascript
element.apiUri = 'https://proxy.domain.com';
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-url-data-model
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-url-data-model/api-url-data-model.js';
    </script>
  </head>
  <body>
    <api-url-data-model></api-url-data-model>
  </body>
</html>
```

### In a LitElement template

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-url-data-model/api-url-data-model.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <api-url-data-model
      .amf="${this.amdModel}"
      .selected="${this.selectedShape}"
      @apiparameters-changed="${this._apiBasePramsHandler}"
      @endpointuri-changed="${this._endpointUriHandler}"
      @apibaseuri-changed="${this._apiBaseUriHandler}"
      @pathmodel-changed="${this._pathModelHandler}"
      @querymodel-changed="${this._queryModelHandler}"></api-url-data-model>`;
  }

  _apiBasePramsHandler(e) {
    this.apiParameters = e.target.apiParameters;
  }

  _endpointUriHandler(e) {
    this.endpointUri = e.target.endpointUri;
  }

  _apiBaseUriHandler(e) {
    this.apiBaseUri = e.target.apiBaseUri;
  }

  _pathModelHandler(e) {
    this.pathModel = e.target.pathModel;
  }

  _queryModelHandler(e) {
    this.queryModel = e.target.queryModel;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@api-components/api-url-data-model/api-url-data-model.js';

class SampleElement extends PolymerElement {
  static get template() {
    // don't use 2-way data binding as setters do not exists.
    return html`
    <api-url-data-model
      amf="[[amf]]"
      selected="[[selectedShape]]"
      on-apiparameters-changed="_apiBasePramsHandler"
      on-endpointuri-changed="endpointUriHandler"
      on-apibaseuri-changed="_apiBaseUriHandler"
      on-pathmodel-changed="_pathModelHandler"
      on-querymodel-changed="_queryModelHandler"></api-url-data-model>
    `;
  }

  _apiBasePramsHandler(e) {
    this.apiParameters = e.target.apiParameters;
  }

  _endpointUriHandler(e) {
    this.endpointUri = e.target.endpointUri;
  }

  _apiBaseUriHandler(e) {
    this.apiBaseUri = e.target.apiBaseUri;
  }

  _pathModelHandler(e) {
    this.pathModel = e.target.pathModel;
  }

  _queryModelHandler(e) {
    this.queryModel = e.target.queryModel;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-url-data-model
cd api-url-data-model
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
