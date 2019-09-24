[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/authorization-panel.svg)](https://www.npmjs.com/package/@advanced-rest-client/authorization-panel)

[![Build Status](https://travis-ci.org/advanced-rest-client/authorization-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/authorization-panel)

## &lt;authorization-panel&gt;

Accessible forms to provide authorization data for various authorization methods.

The forms used in the panel are coming from [auth-methods](https://github.com/advanced-rest-client/auth-methods) element.

## Usage

### Installation
```
npm install --save @advanced-rest-client/authorization-panel
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/authorization-panel/authorization-panel.js';
    </script>
  </head>
  <body>
    <authorization-panel></authorization-panel>
    <script>
    {
      document.querySelector('authorization-panel').addEventListener('authorization-settings-changed', (e) => {
        console.log('current settings', e.detail);
      });
    }
    </script>
  </body>
</html>

```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/authorization-panel/authorization-panel.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <authorization-panel
      @authorization-settings-changed="${this._handleModel}"
      @request-header-deleted="${this._headerDeleted}"
      @request-header-changed="${this._headerChanged}"></authorization-panel>
    `;
  }

  _handleModel(e) {
    this.authData = e.detail.value;
  }

  _headerDeleted(e) {
    const { name } = e.detail;
    this.httpHeaders = ``;
  }

  _headerChanged(e) {
    const { name, value } = e.detail;
    this.httpHeaders = `${name}: ${value}`;
  }
}
customElements.define('sample-element', SampleElement);
```

### AMF model

The element works with [AMF](https://a.ml) model which describes both RAML and OAS API specs into a common data model.

First step is to set `amf` property on the element which is the AMF model for the API.
Second step is to lookup security scheme definition for an operation (HTTP method). It has to be an array of all security schemes defined for the endpoint / method. Pass it to `securedBy` property of the element.
The element automatically updates the UI to only render methods supported by the endpoint or method. Authorization panels updates their state when selected and use pre-defined data to fill up the forms.

```javascript
const amfModel = await generateApiModel();
const method = computeMethodModel(amfModel, 'some id of selected method');
const securityArray = getSecurityList(method);
panel.amf = amfModel;
panel.securedBy = securityArray;
```

## Breaking Changes in v3

Use the scripts below to include dependencies into the web page.

**OAuth 1**

```html
<script src="node_modules/cryptojslib/components/core.js"></script>
<script src="node_modules/cryptojslib/rollups/sha1.js"></script>
<script src="node_modules/cryptojslib/components/enc-base64-min.js"></script>
<script src="node_modules/cryptojslib/rollups/md5.js"></script>
<script src="node_modules/cryptojslib/rollups/hmac-sha1.js"></script>
<script src="node_modules/jsrsasign/lib/jsrsasign-rsa-min.js"></script>
```

**Digest**

```html
<script src="node_modules/cryptojslib/rollups/md5.js"></script>
```

The required modules are installed with this element. You can skip it if you won't use OAuth1 or Digest methods.

## Development

```sh
git clone https://github.com/advanced-rest-client/authorization-panel
cd authorization-panel
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
