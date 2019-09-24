[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-icons.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-icons)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-icons.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-icons)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-icons)

# arc-icons

A set of icons for Advanced REST Client.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/arc-icons
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/arc-icons/arc-icons.js';
      import '@polymer/iron-icon/iron-icon.js';
    </script>
  </head>
  <body>
    <iron-icon icon="arc:add"></iron-icon>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@polymer/iron-icon/iron-icon.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <iron-icon icon="arc:add"></iron-icon>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/arc-icons
cd arc-icons
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
