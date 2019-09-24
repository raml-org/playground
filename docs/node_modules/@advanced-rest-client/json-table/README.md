[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/json-table.svg)](https://www.npmjs.com/package/@advanced-rest-client/json-table)

[![Build Status](https://travis-ci.org/advanced-rest-client/json-table.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/json-table)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/json-table)


# &lt;json-table&gt;

A table view from the JSON structure.

The element renders a table and / or list view from a JSON object.
If JSON is an array it renders a table view. For objects it renders a list view.

Complex object are represented as an embedded view of a list or table inside the parent object
representation. That may create very complex structure and lead to performance issues when computing
data model and building the DOM. Therefore the element will only build the first level of the view.
If the object / array contains other objects / arrays it will show only a button to display embeded
objects. That should prohibit from freezing the UI while rendering the view.

Another optimization is pagination (disabled by default). After setting the `paginate` property
array tables will contain a pagination with `itemsPerPage` items rendered at a time. The user can
change number of items at any time.

### Example
```html
<json-table json="[...]" paginate itemsperpage="15"></json-table>
```

## Content actions

The element can render an actions pane above the table / list view. Action pane is to
display content actions that is relevant in context of the content displayed
below the buttons. It should be icon buttons list or just buttons added to this view.

Buttons must have `slot="content-action"` attributte set to be included to this view.

```html
<json-table json='{"json": "test"}'>
 <paper-icon-button slot="content-action" title="Copy content to clipboard" icon="arc:content-copy"></paper-icon-button>
</json-table>
```

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/json-table
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/json-table/json-table.js';
    </script>
  </head>
  <body>
    <json-table paginate json="..."></json-table>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/json-table/json-table.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <json-table .json="${this.json}" paginate></json-table>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@advanced-rest-client/json-table/json-table.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <json-table json="[[json]]"></json-table>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/json-table
cd json-table
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
