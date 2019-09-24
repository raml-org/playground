[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-property-form-item.svg)](https://www.npmjs.com/package/@api-components/api-property-form-item)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-property-form-item.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-property-form-item)

## &lt;api-property-form-item&gt;

An input to use with forms to render inputs based in ARC view-model

```html
<api-property-form-item model='{"schema":{"inputLabel": "Enter number value", "inputType": "number", "minimum": 1, "maximum": 100}}' name="numericModel" value="1"></api-property-form-item>
```

## Usage

### Installation
```
npm install --save @api-components/api-property-form-item
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-property-form-item/api-property-form-item.js';
    </script>
  </head>
  <body>
    <api-property-form-item name="numericModel" value="1"></api-property-form-item>
    <script>
    {
      document.querySelector('api-property-form-item').model = {
        schema: {
          inputLabel: 'Enter number value',
          inputType: 'number',
          minimum: 1,
          maximum: 100
        }
      };
    }
    </script>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-property-form-item/api-property-form-item.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <api-property-form-item
      name="numericModel"
      value="1"
      .model="${this.inputModel}"
      @changed="${this._handleHande}"></api-property-form-item>
    `;
  }

  _handleHande(e) {
    this.inputValue = e.target.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### Base styles

The element provides 3 basic styling options:

-   Filled - Material design filled style, default style
-   Outlined - Material design outlined style, use `outlined` property
-   Legacy - Anypoint style, use `legacy` property

```html
<api-property-form-item outlined></api-property-form-item>
<api-property-form-item legacy></api-property-form-item>
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-property-form-item
cd api-property-form-item
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

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
