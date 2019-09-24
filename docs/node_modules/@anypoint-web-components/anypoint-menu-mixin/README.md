[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-menu-mixin.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-menu-mixin)

[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-menu-mixin.svg?branch=stage)](https://travis-ci.org/anypoint-web-components/anypoint-menu-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/anypoint-web-components/anypoint-menu-mixin)

# anypoint-menu-mixin

This is a port of [iron-menu-behavior](https://github.com/PolymerElements/iron-menu-behavior) that works with LitElement and ES6 classes, originally developed by the Polymer team.


## `AnypointMenuMixin` and `AnypointMenubarMixin`

`AnypointMenuMixin` and `AnypointMenubarMixin` implement accessible menu and menubar behaviors.

## Usage

### Installation
```
npm install --save @anypoint-web-components/anypoint-menu-mixin
```

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import { AnypointMenuMixin } from '@anypoint-web-components/anypoint-menu-mixin/anypoint-menu-mixin.js';

class SimpleMenu extends AnypointMenuMixin(LitElement) {
  static get styles() {
    return css`
    :host > ::slotted(.selected) {
      color: white;
      background-color: #2196F3;
    }

    :host > ::slotted([disabled]) {
      pointer-events: none;
    }`;
  }

  render() {
    return html`<slot></slot>`;
  }
}
window.customElements.define('simple-menu', SimpleMenu);
```

Then, in your HTML:

```html
<html>
  <head>
    <script type="module" src="./simple-menu.js"></script>
    <style>
    /* Overrides component's internal styling */
    simple-menu .selected {
      background-color: blue;
      color: white;
    }
    </style>
  </head>
  <body>
    <simple-menu>
      <div>Item 0</div>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
      <div>Item 4</div>
    </simple-menu>
    <script>
    {
      document.querySelector('simple-menu').onselect = (e) => {
        console.log(e.detail.value);
      };
    }
    </script>
  </body>
</html>
```

## Accessibility

The mixin sets default role to the implementing element of "menu" and "menubar". The mixin can be used in different context. Then you may want to change the role to something else. If new role requires children to have "aria-selected" attribute then additionally set `useAriaSelected` property so the element will handle selection.

```html
<tabs-implementation role="tablist" useariaselected>
  <button role="tab">Tab #1</button>
  <button role="tab">Tab #2</button>
  <button role="tab">Tab #3</button>
</tabs-implementation>
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-menu-mixin
cd anypoint-menu-mixin
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
