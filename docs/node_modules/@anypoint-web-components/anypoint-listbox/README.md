[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-listbox.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-listbox)

[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-listbox.svg?branch=stage)](https://travis-ci.org/anypoint-web-components/anypoint-listbox)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/anypoint-web-components/anypoint-listbox)

# anypoint-listbox

The `anypoint-listbox` implements accessible list of options styled for the Anypoint platform.

```html
<anypoint-listbox>
  <anypoint-item>Item 1</anypoint-item>
  <anypoint-item>Item 2</anypoint-item>
  <anypoint-item>Item 3</anypoint-item>
</anypoint-listbox>
```

Initial selection can be set by using `selected` property / attribute:

```html
<anypoint-listbox selected="1">
  <anypoint-item>Item 1</anypoint-item>
  <anypoint-item>Item 2</anypoint-item>
  <anypoint-item>Item 3</anypoint-item>
</anypoint-listbox>
```

It allows multi selection by using `multi` property / attribute:

```html
<anypoint-listbox multi>
  <anypoint-item>Item 1</anypoint-item>
  <anypoint-item>Item 2</anypoint-item>
  <anypoint-item>Item 3</anypoint-item>
</anypoint-listbox>
```

Children can be selected by any attribute instead of index:

```html
<anypoint-listbox attrforselected="value" selected="2">
  <anypoint-item value="1">Item 1</anypoint-item>
  <anypoint-item value="2">Item 2</anypoint-item>
  <anypoint-item value="3">Item 3</anypoint-item>
</anypoint-listbox>
```

You can observe changes by listening to `selected-changed` event or by setting `onselected` property:

```javascript
list.onselected = (e) => {
  console.log(e.target.selected);
};
// or
list.addEventListener('selected-changed', (e) => {
  console.log(e.target.selected);
  // also e.detail.value
});
```

## Accessibility

`<anypoint-listbox>` has `role="listbox"` by default. A multi-select listbox will also have `aria-multiselectable` set.
It implements key bindings to navigate through the listbox with the up and down arrow keys, esc to exit the listbox, and enter to activate a listbox item.
Typing the first letter of a listbox item will also focus it.

The element also support `aria-selected` attribute set on children when `useAriaSelected` property is set. It should be used when the implementation uses different role where `aria-selected` is required.

```html
<anypoint-listbox role="tablist" useariaselected>
  <button role="tab">Tab #1</button>
  <button role="tab">Tab #2</button>
  <button role="tab">Tab #3</button>
</anypoint-listbox>
```

## Usage

### Installation
```
npm install --save @anypoint-web-components/anypoint-listbox
```

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';

class SimpleElement extends LitElement {
  render() {
    const { options, selected } = this;
    return html`
    <anypoint-listbox .selected="${selected}" @selected-changed="${this._selectedHandler}">
    ${options.map((item) => html`<anypoint-item>${item}</anypoint-item>`)}
    </anypoint-listbox>
    `;
  }

  _selectedHandler(e) {
    this.selected = e.target.value;
  }
}
window.customElements.define('simple-element', SimpleElement);
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-listbox
cd anypoint-listbox
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
