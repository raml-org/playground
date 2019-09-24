[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-button.svg?branch=master)](https://travis-ci.org/anypoint-web-components/anypoint-button)

[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-button.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-button)

# anypoint-button

Anypoint styled button.

Anypoint button by default is styled for Anypoint platform. Styles can be controlled by using `emphasis` property ans CSS variables.

`emphasis` can be one of `low`, `middle`, or `high`. Styles for each of it can be redefined using CSS variables.
Low emphasis button should be used for less important actions.
Medium emphasis should be used for secondary actions.
High emphasis should be used for primary action, not very often, ideally one per screen.

## Usage

### Installation
```
npm install --save @anypoint-web-components/anypoint-button
```

### In a HTML document

```html
<script type="module" src="node_modules/@anypoint-web-components/anypoint-button/anypoint-button.js"></script>
<script type="module" src="node_modules/@anypoint-web-components/anypoint-button/anypoint-icon-button.js"></script>
<anypoint-button emphasis="low">Low emphasis</anypoint-button>
<anypoint-button emphasis="medium">Medium emphasis</anypoint-button>
<anypoint-button emphasis="high">High emphasis</anypoint-button>
<anypoint-button toggles>Button that toggles</anypoint-button>
<anypoint-button disabled>You can't click me</anypoint-button>

<anypoint-icon-button emphasis="low">
  <button title="Add alarm">
    <iron-icon icon="alarm-add"></iron-icon>
  </button>
</anypoint-icon-button>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';

class SimpleElement extends ControlStateMixin(ButtonStateMixin(LitElement)) {
  render() {
    return html`
    <anypoint-button emphasis="low">Low emphasis</anypoint-button>
    <anypoint-button emphasis="medium">Medium emphasis</anypoint-button>
    <anypoint-button emphasis="high">High emphasis</anypoint-button>
    <anypoint-button toggles>Button that toggles</anypoint-button>
    <anypoint-button disabled>You can't click me</anypoint-button>

    <anypoint-icon-button emphasis="low">
      <button title="Add alarm">
        <iron-icon icon="alarm-add"></iron-icon>
      </button>
    </anypoint-icon-button>
    `;
  }
}
window.customElements.define('simple-element', SimpleElement);
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-button
cd anypoint-button
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
