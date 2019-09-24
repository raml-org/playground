[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-body-document.svg)](https://www.npmjs.com/package/@api-components/api-body-document)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-body-document.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-body-document)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-body-document)

## &lt;api-body-document&gt;

A component to render HTTP method body documentation based on AMF model generated from API spec file.


## Styling

`<api-body-document>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--api-body-document-title-border-color` | Border color of the section title | `#e5e5e5`
`--api-body-document-toggle-view-color` | Color of the toggle view button | `--arc-toggle-view-icon-color` or `rgba(0, 0, 0, 0.74)`
`--api-body-document-toggle-view-hover-color` | Color of the toggle view button when hovered | `var(--arc-toggle-view-icon-hover-color` or `rgba(0, 0, 0, 0.88)`
`--api-body-document-description-color` | Color of the type description | `rgba(0, 0, 0, 0.74)`
`--api-body-document-media-button-background-color` | Selection color of the media type selector | `#CDDC39`
`--api-body-document-examples-title-color` | Color of examples section title | ``
`--api-body-document-examples-border-color` | Example section border color | `transparent`
`--code-background-color` | Background color of the examples section | ``
`--api-body-document-media-type-label-font-weight` | Font weight of the media type label (when selection is not available) | `500`
`--api-body-document-title-narrow-font-size`  |   |  `initial`,
`--api-body-document-code-color`  |   |  `initial`
`--api-body-document-any-info-font-size`  |   |  `16px`
`--api-body-document-any-info-font-weight`  |   |  `500`

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-body-document
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-body-document/api-body-document.js';
    </script>
  </head>
  <body>
    <api-body-document></api-body-document>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-body-document/api-body-document.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-body-document .amf="${this.amf}"></api-body-document>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Development

```sh
git clone https://github.com/advanced-rest-client/api-body-document
cd api-body-document
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
