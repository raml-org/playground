[![Build Status](https://travis-ci.org/advanced-rest-client/api-form-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-form-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-form-mixin)

## &lt;api-form-mixin&gt;

A mixin to be used with elements that processes AMF data via form data model and displays forms from the model.

It contains common methods used in forms.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-form-mixin
```

### In a LitElement

```js
import { LitElement, html, css } from 'lit-element';
import { ApiFormMixin } from '@api-components/api-form-mixin/api-form-mixin.js';
import styles from '@api-components/api-form-mixin/api-form-styles.js';
import '@polymer/iron-form/iron-form.js';

class SampleElement extends PolymerElement {
  static get styles() {
    return [
      styles,
      css`:host {
        display: block;
      }`
    ];
  }

  render() {
    const { model: items, allowHideOptional, optionalOpened, allowDisableParams } = this;
    return html`
    <h1>Form</h1>
    <iron-form>
      <form enctype="application/json">
      ${items ? items.map((item, index) => html`<div class="form-item">
        <div class="${this.computeFormRowClass(item, allowHideOptional, optionalOpened, allowDisableParams)}">
          <input
            data-index="${index}"
            type="text"
            name="${item.name}"
            ?required="${item.required}"
            .value="${item.value}"
            @change="${this._modelValueChanged}">
        </div>
      </div>`) : undefined}
      </form>
    </iron-form>`;
  }

  _modelValueChanged(e) {
    const index = Number(e.target.dataset.index);
    if (index !== index) {
      return;
    }
    this.model[index].value = e.target.value;
    this._requestRender();
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-form-mixin
cd api-form-mixin
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
