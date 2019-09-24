[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-body-editor.svg)](https://www.npmjs.com/package/@api-components/api-body-editor)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-body-editor)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-body-editor)

# api-body-editor

Renders body editor that correspond to selected media type.

It works with AMF data model to produce pre-populated view with values.

**See breaking changes and list of required dependencies at the bottom of this document**

## Usage

### Installation
```
npm install --save @api-components/api-body-editor
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-body-editor/api-body-editor.js';
    </script>
  </head>
  <body>
    <api-body-editor></api-body-editor>
    <script>
    {
      document.querySelector('api-body-editor').addEventListener('value-changed', (e) => {
        console.log(e.detail.value);
      });
    }
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-body-editor/api-body-editor.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-body-editor
      allowdisableparams
      allowcustom
      allowhideoptional
      .contentType="${this.contentType}"
      @value-changed="${this._handleValue}"></api-headers-editor>
    `;
  }

  _handleValue(e) {
    this.bodyValue = e.target.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development


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
<!-- CodeMirror + modes loader -->
<script src="node_modules/codemirror/lib/codemirror.js"></script>
<script src="node_modules/codemirror/addon/mode/loadmode.js"></script>
<script src="node_modules/codemirror/mode/meta.js"></script>
<!--Default set of parsers, add as many as you need -->
<script src="node_modules/codemirror/mode/javascript/javascript.js"></script>
<script src="node_modules/codemirror/mode/xml/xml.js"></script>
<script src="node_modules/codemirror/mode/htmlmixed/htmlmixed.js"></script>
<!-- JSON linter -->
<script src="node_modules/jsonlint/lib/jsonlint.js"></script>
<script src="node_modules/codemirror/addon/lint/lint.js"></script>
<script src="node_modules/codemirror/addon/lint/json-lint.js"></script>
```

Add linter popup styles:

```html
<link rel="stylesheet" href="node_modules/codemirror/addon/lint/lint.css" />
```

Finally, you should set the path to CodeMirror modes. When content type change
this path is used to load syntax highlighter. If you list all modes in the scripts
above then this is not required.

```html
<script>
CodeMirror.modeURL = 'node_modules/codemirror/mode/%N/%N.js';
</script>
```

The `jsonlint` library is a dependency of `@api-components/code-mirror-linter`
already included in the dependency graph of this element.
