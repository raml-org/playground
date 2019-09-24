[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/raw-payload-editor.svg)](https://www.npmjs.com/package/@advanced-rest-client/raw-payload-editor)

[![Build Status](https://travis-ci.org/advanced-rest-client/raw-payload-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/raw-payload-editor)  

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/raw-payload-editor)

## &lt;raw-payload-editor&gt;

An element with CodeMirror editor to allow the user to enter HTTP message body.



## Breaking Changes in v3

1.  Upgrade

The element now uses LitElement library instead of Polymer. This means that all attributes are lowercase without `-` characters.
For example, previously the `lineSeparator` property was reflected to `line-separator` attribute. Now it is `lineseparator` attribute.

2.  Tab handling

CodeMirror traps focus in the editor area. This is not accessible way of handling user input. Because of that this element overrides default tab key behavior
and removes focus from the element.

3.  Required imports

This version uses latest and final specs for web components. This means the component works as a ES module. Because of that
CodeMirror and any related library has to be included into the document before inserting this element to the DOM.
CodeMirror 6 possibly will be working with ES imports but this is not set in stone at the moment.

Below is the default set of scripts to be added to the document.

```html
<script src="node_modules/codemirror/lib/codemirror.js"></script>
<script src="node_modules/codemirror/addon/mode/loadmode.js"></script>
<script src="node_modules/codemirror/mode/meta.js"></script>
<!--Default set of parsers -->
<script src="node_modules/codemirror/mode/javascript/javascript.js"></script>
<script src="node_modules/codemirror/mode/xml/xml.js"></script>
<script src="node_modules/codemirror/mode/htmlmixed/htmlmixed.js"></script>
```

If you are using JSON linter

```html
<script src="node_modules/jsonlint/lib/jsonlint.js"></script>
<script src="node_modules/codemirror/addon/lint/lint.js"></script>
<script src="node_modules/codemirror/addon/lint/json-lint.js"></script>
<link rel="stylesheet" href="node_modules/codemirror/addon/lint/lint.css" />
```

Finally, if your application will use modes that aren't included in the document, you should set import URI. This will be used to resolve modes dependencies.

```html
<script>
CodeMirror.modeURL = 'node_modules/codemirror/mode/%N/%N.js';
</script>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/raw-payload-editor
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/raw-payload-editor/raw-payload-editor.js';
    </script>
  </head>
  <body>
    <raw-payload-editor contenttype="application/json"></raw-payload-editor>
    <script>
    {
      document.querySelector('raw-payload-editor').onvalue = (e) => {
        console.log(e.target.value);
      }
    }
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/code-mirror/code-mirror.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <code-mirror contenttype="application/json" @value-changed="${this._valueHandler}"></code-mirror>
    `;
  }

  _valueHandler(e) {
    this.value = e.detail.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### development

```sh
git clone https://github.com/advanced-rest-client/raw-payload-editor
cd raw-payload-editor
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
