[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/response-body-view.svg)](https://www.npmjs.com/package/@advanced-rest-client/response-body-view)

[![Build Status](https://travis-ci.org/advanced-rest-client/response-body-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/response-body-view)

## &lt;response-body-view&gt;

An element to display a HTTP response body in accessible and human readable form.

```html
<response-body-view responsetext="# Hello world" contenttype="application/markdown"></response-body-view>
```

Note, the element internally uses `TextDecoder` class for responses that are an `ArrayBuffer` instead of text. If the response can be an `ArrayBuffer` you need to ensure the `TextDecoder` class is supported / polyfilled.

## Usage

### Installation
```
npm install --save @advanced-rest-client/response-body-view
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/response-body-view/response-body-view.js';
    </script>
  </head>
  <body>
    <response-body-view></response-body-view>
    <script>
    {
      const view = document.querySelector('response-body-view');
      view.responseText = JSON.stringify({
        data: 'some data'
      });
      view.contentType = 'application/json'
    }
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/response-body-view/response-body-view.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <response-body-view
      responsetext="# Hello world"
      contenttype="application/markdown"
      @url-change-action="${this._urlClickHandler}"
      @request-workspace-append="${this._urlMetaClickHandler}"></response-body-view>
    `;
  }

  _urlClickHandler(e) {
    console.log(`User clicked on ${e.detail.value}`);
  }

  _urlMetaClickHandler(e) {
    console.log(`User clicked on ${e.detail.value} with ctrl or meta`);
  }
}
customElements.define('sample-element', SampleElement);
```

## Development

```sh
git clone https://github.com/advanced-rest-client/response-body-view
cd response-body-view
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

-   XML custom view has been replaced with Prism syntax highlighting
-   Prism parsing timeout is no longer supported, it wasn't working well anyway
-   Response preview has been removed, it couldn't reliably render response view
