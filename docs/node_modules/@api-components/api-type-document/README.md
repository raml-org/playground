[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-type-document.svg)](https://www.npmjs.com/package/@api-components/api-type-document)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-type-document.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-type-document)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-type-document)

## &lt;api-type-document&gt;

A documentation table for RAML type / OAS schema properties. Works with AMF data model.

```html
<api-type-document></api-type-document>
```

## Styling

`<api-type-document>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--api-type-document` | Mixin applied to this elment | `{}`
`--api-type-document-union-button-background-color` | Background color of union selector button | `#fff`
`--api-type-document-union-button-color` | Color of union selector button | `#000`
`--api-type-document-union-button-active-background-color` | Background color of active union selector button | `#CDDC39`
`--api-type-document-union-button-active-color` | Color of active union selector button | `#000`

From `property-shape-document`

Custom property | Description | Default
----------------|-------------|----------
`--property-shape-document` | Mixin applied each proeprty element | `{}`
`--property-shape-document-array-color` | Property border color when type is an array | `#8BC34A`
`--property-shape-document-object-color` | Property border color when type is an object | `#FF9800`
`--property-shape-document-union-color` | Property border color when type is an union | `#FFEB3B`
`--arc-font-subhead` | Theme mixin, applied to the property title | `{}`
`--property-shape-document-title` | Mixin applied to the property title | `{}`
`--api-type-document-property-parent-color` | Color of the parent property label | `#757575`
`--api-type-document-property-color` | Color of the property name label when display name is used | `#757575`
`--api-type-document-child-docs-margin-left` | Margin left of the item's properties description relative to the title when the item is a child property of another property | `24px`
`--api-type-document-type-color` | Color of the "type" trait | `white`
`--api-type-document-type-background-color` | Background color of the "type" trait | `#2196F3`
`--api-type-document-trait-background-color` | Background color to main range trait (type, required, enum) | `#EEEEEE`,
`--api-type-document-trait-border-radius` | Border radious of a main property traits like type, required, enum | `3px`

From `property-range-document`

Custom property | Description | Default
----------------|-------------|----------
`--property-range-document` | Mixin applied to this elment | `{}`
`--api-type-document-type-attribute-color` | Color of each attribute that describes a property | `#616161`
`--api-type-document-examples-title-color` | Color of examples section title | ``
`--api-type-document-examples-border-color` | Example section border color | `transparent`
`--code-background-color` | Background color of the examples section | ``
`--arc-font-body1` | Mixin applied to an example name label | `{}`
`--arc-font-body2` | Mixin applied to the examples section title | `{}`

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-type-document
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-type-document/api-type-document.js';
    </script>
  </head>
  <body>
    <api-type-document></api-type-document>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-type-document/api-type-document.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-type-document .amf="${this.amf}"></api-type-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-type-document
cd api-type-document
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
