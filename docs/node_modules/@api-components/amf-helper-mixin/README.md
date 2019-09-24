[![Published on NPM](https://img.shields.io/npm/v/@api-components/amf-helper-mixin.svg)](https://www.npmjs.com/package/@api-components/amf-helper-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/amf-helper-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/amf-helper-mixin)

# amf-helper-mixin

Common functions used by AMF components to compute AMF values.
This mixin is safe to use in both Polymer and LitElement projects as well as pure web components.

## Updating API's base URI

(Only applies when using `_computeEndpointUri()` function)

By default the component render the documentation as it is defined
in the AMF model. Sometimes, however, you may need to replace the base URI
of the API with something else. It is useful when the API does not
have base URI property defined (therefore this component render relative
paths instead of URIs) or when you want to manage different environments.

To update base URI value either update `baseUri` property or use
`iron-meta` with key `ApiBaseUri`. First method is easier but the second
gives much more flexibility since it use a
[monostate pattern](http://wiki.c2.com/?MonostatePattern)
to manage base URI property.

When the component constructs the final URI for the endpoint it does the following:
-   if `baseUri` is set it uses this value as a base URI for the endpoint
-   else if `iron-meta` with key `ApiBaseUri` exists and contains a value it uses it uses this value as a base URI for the endpoint
-   else if `amf` is set then it computes base URI value from main model document
Then it concatenates computed base URI with `endpoint`'s path property.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Installation

```bash
npm i @api-components/amf-helper-mixin
```

## Usage

```javascript
import { LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';

class AmfHelperImpl extends AmfHelperMixin(LitElement) {
  static get properties() {
    return {
      myProp: { type: String }
    };
  }
}
```

## Testing

```bash
npm run test
```

## Testing with Sauce Labs

```bash
npm run test:sl
```

## Demo

```bash
npm start
```
