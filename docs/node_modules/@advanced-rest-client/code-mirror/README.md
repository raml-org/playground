[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/code-mirror.svg)](https://www.npmjs.com/package/@advanced-rest-client/code-mirror)

[![Build Status](https://travis-ci.org/advanced-rest-client/code-mirror.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/code-mirror)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/code-mirror)


## Breaking Changes in v3

1.  Upgrade

The element now uses LitElement library instead of Polymer. This means that all attributes are lowercase without `-` characters.
For example, previously the `lineSeparator` property was reflected to `line-separator` attribute. Now it is `lineseparator` attribute.

2.  Tab handling

CodeMirror traps focus in the editor area. This is not accessible way of handling user input. Because of that this element overrides default tab key behavior
and removes focus from the element. If for any reason you still want to use CodeMirror's tab handling, set `extraKeys` option on the editor:

```javascript
element.editor.setOption('extraKeys', {});
```

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

## code-mirror

This is a wrapper for CodeMirror library. It has been adjusted to work inside shadow DOM.
The component is used by Advanced REST Client and API Console.

## Accessing options

The element exposes `setOption()` function that should be used to directly set editor option.

```javascript
cm.setOption('extraKeys', {
 'Ctrl-Space': (cm) => {
   CodeMirror.showHint(cm, CodeMirror.hint['http-headers'], {
     container: containerRef
   });
 }
});
```

Additionally, the element has the `editor` property which is a reference to the CodeMirror instance.

## Rendering hidden element

If the element is active but not visible then you may need to call `refresh()` function on a CodeMirror instance
after showing the element.

```javascript
parent.style.display = 'block';
cm.editor.refresh();
```


## Styling

See `codemirror-styles.js` file for CSS variables definition.

## Usage

### Installation
```
npm install --save @advanced-rest-client/code-mirror
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/code-mirror/code-mirror.js';
    </script>
  </head>
  <body>
    <code-mirror mode="javascript">
      function myScript() {
        return 100;
      }
    </code-mirror>
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
    <code-mirror @value-changed="${this._valueHandler}"></code-mirror>
    `;
  }

  _valueHandler(e) {
    this.value = e.detail.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/code-mirror
cd code-mirror
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
