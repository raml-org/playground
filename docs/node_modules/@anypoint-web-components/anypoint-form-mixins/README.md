[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-form-mixins.svg?branch=master)](https://travis-ci.org/anypoint-web-components/anypoint-form-mixins)

[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-form-mixins.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-form-mixins)

# Anypoint form control mixins for web components

## checked-element-mixin

Use `CheckedElementMixin` to implement an element that can be checked like native checkbox.

## Usage

### Installation
```
npm install --save @anypoint-web-components/anypoint-form-mixins
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import { CheckedElementMixin } from '@anypoint-web-components/anypoint-form-mixins/anypoint-form-mixins.js';

class SimpleCheckbox extends CheckedElementMixin(LitElement) {
  static get styles() {
    return css`
    :host {
      display: block;
    }

    :host([invalid]) span {
      color: red;
    }

    #labelText {
      display: inline-block;
      width: 100px;
    }`;
  }

  render() {
    return html`
    <input type="checkbox" id="checkbox" @click="${this._onCheckClick}">
    <span id="labelText">${this.label}</span>
    <paper-button raised @click="${this._onClick}">validate</paper-button>`;
  }

  static get properties() {
    return {
      label: { type: String }
    };
  }

  constructor() {
    super();
    this.label = 'Not validated';
  }

  _onCheckClick(e) {
    this.checked = e.target.checked;
  }

  _onClick() {
    this.validate();
    this.label = this.invalid ? 'is invalid' : 'is valid';
  }
}
window.customElements.define('simple-checkbox', SimpleCheckbox);
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-form-mixins
cd anypoint-form-mixins
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
