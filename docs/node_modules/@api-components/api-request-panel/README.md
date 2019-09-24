[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-request-panel.svg)](https://www.npmjs.com/package/@api-components/api-request-panel)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-request-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-request-panel)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-request-panel)

## &lt;api-request-panel&gt;

An complete request editor and response view panels in a single element.

**See breaking changes and list of required dependencies at the bottom of this document**

## Usage

### Installation
```
npm install --save @api-components/api-request-panel
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-request-panel/api-request-panel.js';
    </script>
  </head>
  <body>
    <api-request-panel></api-request-panel>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-request-editor/api-request-editor.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-request-panel
      @api-request="${this._apiRequestHandler}"></api-request-panel>
    `;
  }

  _apiRequestHandler(e) {
    console.log('current request to run', e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### Working with AMF model

The component is to be used with [AMF](https://a.ml) model. Assign API model value to `amf` property to initialize the element.
When the user made a selection (in navigation) set `selected` property to the `@id` value of a HTTP method model. API model data are populated automatically.

When using with combination with `@api-components/api-navigation` then use `handleNavigationEvents` option.
The panel listens then for navigation events dispatched by the navigation and updates the state automatically.

```html
<api-navigation></api-navigation>
<api-request-panel handlenavigationevents></api-request-panel>
<script>
{
  const model = await generateApiModel();
  document.querySelector('api-navigation').amf = model;
  document.querySelector('api-request-panel').amf = model;
}
</script>
```

### Working with AMF partial model

Only endpoint model with selection set to a method node that is already in the model make sense.
Because the model don't have server, protocols, and version definition it has to be computed and set manually.

```javascript
const elm = document.querySelector('api-request-panel');
const summaryModel = await downloadPartialApiModelSummary();
const endpointModel = await downloadPartialApiModelEndpoint();
elm.amfModel = endpointModel; // This must be set before any computation, it contains `@context` property.
elm.selected = '#123'; // Selected node ID, must be method ID that is in endpoint definition.
elm.server = elm._computeServer(summaryModel); // This is element's inherited method
elm.version = conputeApiVersion(summaryModel); // Compute version from `server` model.
elm.protocols = ['http', 'https']; // This is encoded in AMF model.
```

### api-request event

Dispatched when the user requests to send current request.

Properties set on the detail object:

-   url `String` The request URL. Can be empty string.
-   method `String`  HTTP method name. Can be empty.
-   headers `String` HTTP headers string. Can be empty.
-   payload `String|File|FormData` Message body. Can be undefined.
-   auth `Object` Optional, authorization settings from the auth panel.
-   authType `String` Name of the authorization methods. One of `advanced-rest-client/auth-methods`.
-   id `String` Generated UUID for the request. Each call of the `execute()` function regenerates the `id`.


When the response is ready dispatch `api-response` custom event. It is handled by this element and the response data is populated to the response view.

The response is ARC response data model:
-   status (`Number`) - Response status code
-   statusText (`String`) - Response status text. Can be empty string.
-   payload (`String|Document|ArrayBuffer|Blob|undefined`) - Response body
-   headers (`String|undefined`) - Response headers

Response object is created by `advanced-rest-client/xhr-simple-request`.
However, any transport library can generate similar object.

#### Advanced transport properties

When using own transport libraries or server side transport you may have access to more information about the request and response like redirects and timings. The response status view can render additional UI for this
data. To enable this feature, set `isXhr` to false and any of the following properties:

-   sentHttpMessage `String` - Raw HTTP message sent to server
-   redirects `Array<Object>` - A list of redirect information. Each object has the following properties:
-   status (`Number`) - Response status code
-   statusText (`String`) - Response status text. Can be empty string.
-   headers (`String|undefined`) - Response headers
-   payload (`String|Document|ArrayBuffer|Blob|undefined`) - Response body
-   redirectTimings `Array<Object>` - List of HAR 1.2 timing objects for each redirected request. The order must corresponds with order in `redirects` array.
-   timings `Object` - HAR 1.2 timings object

## Development

```sh
git clone https://github.com/api-components/api-request-panel
cd api-request-panel
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

### editorRequest is removed

The element do not track request generated by the editor any more and do not set `editorRequest` property. It also do not dispatch `api-request-data-changed` custom event.
All request data are passed to the application with `api-request` event.

### popup location

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
