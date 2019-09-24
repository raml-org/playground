[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/code-mirror-hint.svg)](https://www.npmjs.com/package/@advanced-rest-client/code-mirror-hint)

[![Build Status](https://travis-ci.org/advanced-rest-client/code-mirror-hint.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/code-mirror-hint)

Hint addons for CodeMirror.

It provides module for showing hints for `<code-mirror>`.

It also has HTTP headers hints addon for headers editor.

## Usage

### Installation

```
npm install --save @advanced-rest-client/code-mirror-hint
```

### Document setup

CodeMirror does not work as ES module. It bundle does not offer a way to import
CM instance as a module so it has to be inserted into the DOM before any of this imports.

Inside the document

```html
<!-- Code mirror imports -->
<script src="../node_modules/codemirror/lib/codemirror.js"></script>
```

To import hints support use `code-mirror-hint.js` file

```html
<script src="../node_modules/codemirror/lib/codemirror.js"></script>
<script type="module" src="../node_modules/@advanced-rest-client/code-mirror-hint/code-mirror-hint.js"></script>

<code-mirror mode="..."></code-mirror>
```

For hints for HTTP mode, use `code-mirror-headers-hint.js`.

```html
<script src="../node_modules/codemirror/lib/codemirror.js"></script>
<script type="module" src="../node_modules/@advanced-rest-client/code-mirror-hint/code-mirror-headers-hint.js"></script>

<code-mirror mode="http-headers" id="editor"></code-mirror>
```

To enable hints

```javascript
const editor = document.getElementById('editor');
editor.setOption('extraKeys', {
  'Ctrl-Space': function(cm) {
    CodeMirror.showHint(cm, CodeMirror.hint['http-headers'], {
      container: editor
    });
  }
});
```

### Development

```sh
git clone https://github.com/advanced-rest-client/code-mirror-hint/code-mirror-hint
cd code-mirror-hint
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
