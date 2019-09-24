[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-documentation.svg)](https://www.npmjs.com/package/@api-components/api-documentation)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-documentation.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-documentation)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-documentation)

## &lt;api-documentation&gt;

A main documentation view for AMF model generated from API spec.

**See breaking changes and list of required dependencies at the bottom of this document**

```html
<api-documentation></api-documentation>
```

## Usage

### Installation
```
npm install --save @api-components/api-documentation
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-documentation/api-documentation.js';
    </script>
  </head>
  <body>
    <api-documentation amf="..." selected="..."></api-documentation>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-documentation/api-documentation.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-endpoint-documentation
      .amf="${this.amf}"
      .selected="${this.selectedAmfId}"
      .selectedType="${this.selectedType}"
      ?narrow="${this.narrow}"
      ?legacy="${this.legacy}"
      ?outlined="${this.outlined}"
      .inlineMethods="${this.inlineMethods}"
      .scrollTarget="${this.scrollTarget}"
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

### AMF model and selection

Pass the entire AMF model to the element. It accepts models for:

-   API
-   Documentation fragment
-   Type fragment
-   Security fragment
-   Library fragment
-   AMF service partial model

API, library, and partial model for endpoint requires `selected` and `selectedType` properties to be set.
It computes required properties when selection change.

The type can be one of:

-   `summary`
-   `documentation`
-   `type`
-   `security`
-   `endpoint`
-   `method`

The `selected` property id the `@id` value of a model to render. It has to correspond to selected type.
This means, when `selectedType` it `security` then the component scans declarations and references for a type
with given id. If model cannot be found then it renders blank element.

### api-navigation

To avoid dealing with selection and types you can use [api-navigation](https://github.com/advanced-rest-client/api-navigation) element
in combination with `handleNavigationEvents` property. When set, and the navigation is in the DOM, the element listens for navigation
events dispatched from the navigation element when the user changes selection.

Note, initial event when the DOM is constructed might not be handled. Therefore use a default value `summary` for both `selectedType` and `selected`.

```html
<api-navigation amf="..."></api-navigation>
<api-documentation amf="..." handleNavigationEvents selected="summary" selectedtype="summary"></api-documentation>
```

### inline methods

The components by default render endpoint and method documentation separately. It's mostly for performance reasons and endpoint documentation may contain multiple methods with complex data types. In this case it could potentially slow down the browsers lowering good experience.
However, it is possible to render a single view for an endpoint that includes all methods and the "try it" panel by setting `inlineMethods` property and by providing `scrollTarget`.

The scroll target should be set to either the `window` object or a parent that has scrolling region (overflow set). The endpoint documentation uses this to compute which method is currently being rendered on the screen and to scroll to a method when selection change.

## Development

```sh
git clone https://github.com/advanced-rest-client/api-documentation
cd api-documentation
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
