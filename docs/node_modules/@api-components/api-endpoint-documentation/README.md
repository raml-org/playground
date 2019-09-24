[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-endpoint-documentation.svg)](https://www.npmjs.com/package/@api-components/api-endpoint-documentation)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-endpoint-documentation.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-endpoint-documentation)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-endpoint-documentation)

## &lt;api-endpoint-documentation&gt;

A component to generate documentation for an API resource from AMF model.

**See breaking changes and list of required dependencies at the bottom of this document**

```html
<api-endpoint-documentation></api-endpoint-documentation>
```

## Usage

### Installation
```
npm install --save @api-components/api-endpoint-documentation
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-endpoint-documentation/api-endpoint-documentation.js';
    </script>
  </head>
  <body>
    <api-endpoint-documentation amf="..." endpoint="..."></api-endpoint-documentation>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-endpoint-documentation/api-endpoint-documentation.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-endpoint-documentation
      .amf="${this.amf}"
      .endpoint="${this.endpoint}"
      .method="${this.method}"
      .previous="${this.previous}"
      .next="${this.next}"
      ?narrow="${this.narrow}"
      ?legacy="${this.legacy}"
      ?outlined="${this.outlined}"
      .inlineMethods="${inlineMethods}"
      .scrollTarget="${scrollTarget}"
      .noTryIt="${this.noTryit}"
      @tryit-requested="${this._tryitHandler}"></api-endpoint-documentation>
    `;
  }

  _tryitHandler(e) {
    console.log('opening api-request-panel...');
  }
}
customElements.define('sample-element', SampleElement);
```

## Development

```sh
git clone https://github.com/advanced-rest-client/api-endpoint-documentation
cd api-endpoint-documentation
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

## Breaking Changes in v3

When using `inlinemethods` property you should note this breaking changes.

### OAuth popup location

The `bower-location` attribute becomes `auth-popup-location`.
It is a path to `node_modules` directory. It can be both relative or absolute location. For example `/static/console/node_modules` will produce OAuth Redirect URI `/static/console/node_modules/@advanced-rest-client/oauth-authorization/oauth-popup.html`.

However, you are encourage to use your own redirect popup. It can be anything but it must post message to the opened window with URL parameters. See `@advanced-rest-client/oauth-authorization/oauth-popup.html` for more details.

### Code Mirror dependencies

Code mirror is not ES6 ready. Their build contains AMD exports which is incompatible with native modules. Therefore the dependencies cannot be imported with the element but outside of it.
The component requires the following scripts to be ready before it's initialized (especially body and headers editors):

```html
<script src="node_modules/jsonlint/lib/jsonlint.js"></script>
<script src="node_modules/codemirror/lib/codemirror.js"></script>
<script src="node_modules/codemirror/addon/mode/loadmode.js"></script>
<script src="node_modules/codemirror/mode/meta.js"></script>
<!-- Some basic syntax highlighting -->
<script src="node_modules/codemirror/mode/javascript/javascript.js"></script>
<script src="node_modules/codemirror/mode/xml/xml.js"></script>
<script src="node_modules/codemirror/mode/htmlmixed/htmlmixed.js"></script>
<script src="node_modules/codemirror/addon/lint/lint.js"></script>
<script src="node_modules/codemirror/addon/lint/json-lint.js"></script>
```

CodeMirror's modes location. May be skipped if all possible modes are already included into the app.

```html
<script>
/* global CodeMirror */
CodeMirror.modeURL = 'node_modules/codemirror/mode/%N/%N.js';
</script>
```

### Dependencies for OAuth1 and Digest authorization methods

For the same reasons as for CodeMirror this dependencies are required for OAuth1 and Digest authorization panels to work.

```html
<script src="node_modules/cryptojslib/components/core.js"></script>
<script src="node_modules/cryptojslib/rollups/sha1.js"></script>
<script src="node_modules/cryptojslib/components/enc-base64-min.js"></script>
<script src="node_modules/cryptojslib/rollups/md5.js"></script>
<script src="node_modules/cryptojslib/rollups/hmac-sha1.js"></script>
<script src="node_modules/jsrsasign/lib/jsrsasign-rsa-min.js"></script>
```
