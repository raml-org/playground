[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/auth-methods.svg)](https://www.npmjs.com/package/@api-components/auth-methods)

[![Build Status](https://travis-ci.org/advanced-rest-client/auth-methods.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/auth-methods)

# auth-methods

A set of elements that contains an UI to create different authorization headers like Basic, OAuth etc


## Usage

### Installation
```
npm install --save @advanced-rest-client/auth-methods
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/auth-methods/auth-methods.js';
    </script>
  </head>
  <body>
    <auth-method-basic></auth-method-basic>
    <auth-method-digest></auth-method-digest>
    <auth-method-ntlm></auth-method-ntlm>
    <auth-method-oauth1></auth-method-oauth1>
    <auth-method-oauth2></auth-method-oauth2>
    <auth-method-custom></auth-method-custom>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/auth-methods/auth-methods.js';

class SampleElement extends PolymerElement {
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('auth-settings-changed', this._authChanged);
  }

  render() {
    return html`
    <auth-method-basic></auth-method-basic>
    <auth-method-digest></auth-method-digest>
    <auth-method-ntlm></auth-method-ntlm>
    <auth-method-oauth1></auth-method-oauth1>
    <auth-method-oauth2></auth-method-oauth2>
    <auth-method-custom></auth-method-custom>
    `;
  }

  _authChanged(e) {
    console.log('current authorization settings', e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### Receiving authorization data

When the user changes any of the editors it dispatches bubbling `auth-settings-changed` custom event.
The events has the following properties set on the detail object:

-   `settings` - Object, depends on the panel. Each panel has it's own configuration
-   `type` - String, name of the configuration - corresponds to authentication method
-   `valid` - Boolean, whether or not the current values are valid for given type.


## Development

```sh
git clone https://github.com/advanced-rest-client/auth-methods
cd auth-methods
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

The required modules are installed with this element.
