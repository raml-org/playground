[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-headers-editor.svg)](https://www.npmjs.com/package/@api-components/api-headers-editor)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-headers-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-headers-editor)

# api-headers-editor

A HTTP headers editor.

It allows to edit headers in  a convenient and accessible form editor and also allows to switch to the source edit view (thanks to CodeMirror).

The component works as a stand-alone editor that allows to define headers for HTTP request but also works with generated [AMF model](https://a.ml/) from API spec file.

```html
<api-headers-editor allowcustom allowdisableparams allowhideoptional></api-headers-editor>
```

**See breaking changes and list of required dependencies at the bottom of this document**

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-headers-editor
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-headers-editor/api-headers-editor.js';
    </script>
  </head>
  <body>
    <api-headers-editor allowdisableparams allowcustom allowhideoptional></api-headers-editor>
    <script>
    {
      document.querySelector('api-headers-editor').onvalue = (e) {
        console.log('Headers value', e.target.value);
      };
    }
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-headers-editor/api-headers-editor.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-headers-editor
      allowdisableparams
      allowcustom
      allowhideoptional
      @value-changed="${this._handleValue}"></api-headers-editor>
    `;
  }

  _handleValue(e) {
    this.headersValue = e.target.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### Passing AMF data model

```html
<api-headers-editor></api-headers-editor>

<script>
{
  const api = await generateApiModel();
  const endpoint = '/api-endpoint';
  const operation = 'GET';
  const headersModelArray = getOperationHeadersFromModel(api, endpoint, operation); // some abstract method
  const editor = document.querySelector('api-headers-editor');
  editor.api = api; // This is required to compute ld+json keys!
  editor.amfHeaders = headersModelArray;
}
</script>
```

The `headersModelArray` property is the value of `http://a.ml/vocabularies/http#header` shape of AMF model.
It can be accessed via `supportedOperation` > `expects` shapes.

## Development

```sh
git clone https://github.com/advanced-rest-client/api-headers-editor
cd api-headers-editor
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

You need to include CodeMirror into the document before importing this element
as it expect this global variable to be already set.

This is due CodeMirror not being able to run as ES module.

Use your build system to bundle CodeMirror into the build and don't forget to export global variable.

```html
<script src="node_modules/codemirror/lib/codemirror.js"></script>
```
