[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-selector.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-selector)

[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-selector.svg?branch=stage)](https://travis-ci.org/anypoint-web-components/anypoint-selector)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/anypoint-web-components/anypoint-selector)

# anypoint-selector

This is a port of [iron-selector](https://github.com/PolymerElements/iron-selector) that works with LitElement and ES6 classes, originally developed by Polymer team.


## &lt;anypoint-selector&gt;, `AnypointSelectableMixin`, `AnypointMultiSelectableMixin`

`anypoint-selector` is an element which can be used to manage a list of elements that can be selected.
Tapping on the item will make the item selected. The `selected` indicates which item is being selected.
The default is to use the index of the item. `anypoint-selector`'s functionality is entirely defined by `AnypointMultiSelectableMixin`.

`AnypointSelectableMixin` gives an element the concept of a selected child element. By default, the element will select one of its selectable children
when a click event is dispatched to it.

`AnypointSelectableMixin` lets you ...

-   decide which children should be considered selectable (`selectable`),
-   retrieve the currently selected element (`selectedItem`) and all elements
    in the selectable set (`items`),
-   change the selection (`select`, `selectNext`, etc.),
-   decide how selected elements are modified to indicate their selected state (`selectedClass`, `selectedAttribute`),

... among other things.

`AnypointMultiSelectableMixin` includes all the features of `AnypointSelectableMixin` as well as a `multi` property, which can be set to `true` to indicate that the element can have multiple selected child elements.
It also includes the `selectedItems` and `selectedValues` properties for working with arrays of selectable elements and their corresponding values (`multi` is `true`) - similar to the single-item versions provided by `AnypointSelectableMixin`: `selectedItem` and `selected`.

The element has no own shadow DOM. Items are rendered as is. The element also covers a case where the selector is used in another custom element and a `<slot>` is passed as a child (e.g. dropdown list wit children defined in light DOM).


## Usage

### Installation
```
npm install --save @anypoint-web-components/anypoint-selector
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@anypoint-web-components/anypoint-selector/anypoint-selector.js';
    </script>
  </head>
  <body>
    <anypoint-selector selected="0">
      <div>Item 0</div>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
      <div>Item 4</div>
    </anypoint-selector>
    <script>
    {
      document.querySelector('files-payload-editor').onselect = (e) => {
        console.log(e.detail.value);
      };
    }
    </script>
  </body>
</html>
```

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-selector/anypoint-selector.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <anypoint-selector @select="${this._selectedHandler}"></anypoint-selector>
    `;
  }

  _selectedHandler(e) {
    console.log('current selection:', e.detail.item);
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-selector
cd anypoint-selector
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
