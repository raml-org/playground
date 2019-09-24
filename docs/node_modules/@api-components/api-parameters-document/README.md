[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-parameters-document.svg)](https://www.npmjs.com/package/@api-components/api-parameters-document)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-parameters-document.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-parameters-document)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-parameters-document)

## api-parameters-document

Documentation component for API query and URI parameters based on AMF data model.

## Styling

`<api-parameters-document>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--api-parameters-document-title-border-color` | Border color of the title area | `#e5e5e5`
`--api-parameters-document-toggle-view-color` | Color of the toggle button | `--arc-toggle-view-icon-color` or `rgba(0, 0, 0, 0.74)`
`--api-parameters-document-toggle-view-hover-color` | Color of the toggle button when hovering. Please, mind that hover is not available on all devices.| `--arc-toggle-view-icon-hover-color` or `rgba(0, 0, 0, 0.88)`

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-parameters-document
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-parameters-document/api-parameters-document.js';
    </script>
  </head>
  <body>
    <api-parameters-document></api-parameters-document>
  </body>
</html>
```

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-parameters-document/api-parameters-document.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-parameters-document .amf="${this.amf}"></api-parameters-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/api-components/api-parameters-document
cd api-parameters-document
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
