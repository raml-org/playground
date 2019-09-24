[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-autocomplete.svg?branch=master)](https://travis-ci.org/anypoint-web-components/anypoint-autocomplete)

[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-autocomplete.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-autocomplete)

# anypoint-autocomplete

This component is based on Material Design lists.

Anypoint web components are set of components that allows to build Anypoint enabled UI in open source projects.

The element renders accessible list of suggestions for input field.

## Usage

### Installation
```
npm install --save @anypoint-web-components/anypoint-autocomplete
```

### In a HTML document

```html
<html>
  <head>
    <script type="module">
      import '@anypoint-web-components/anypoint-autocomplete/anypoint-autocomplete.js';
      import '@anypoint-web-components/anypoint-input/anypoint-input.js';
    </script>
  </head>
  <body>
    <div class="parent">
      <anypoint-input id="targetInput"></anypoint-input>
      <anypoint-autocomplete target="targetInput"></anypoint-autocomplete>
    </div>

    <script>
    {
      document.querySelector('anypoint-autocomplete').source = [
        'a',
        'b',
        'c',
        'd'
      ];
    }
    </script>
  </body>
</html>
```

### Asynchronous suggestions

When the input value changes the autocomplete dispatches `query` event. Your application should handle this event, generate suggestions for the user, and set the `source` property.

To indicate to the user that the suggestions are async you may set `loader` property. It renders a progress bar until source property change.

```html
<div class="parent">
  <anypoint-input id="targetInput"></anypoint-input>
  <anypoint-autocomplete target="targetInput"></anypoint-autocomplete>
</div>
<script>
{
  document.querySelector('anypoint-autocomplete').onquery = (e) => {
    const { value } = e.detail;
    const suggestions = await getAsyncSuggestions(value);
    e.target.source = suggestions;
  };
}
</script>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-autocomplete/anypoint-autocomplete.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';

class SimpleElement extends ControlStateMixin(ButtonStateMixin(LitElement)) {
  render() {
    return html`
    <div class="parent">
      <anypoint-input id="targetInput"></anypoint-input>
      <anypoint-autocomplete
        target="targetInput"
        loader
        .source="${this.suggestions}"
        @query="${this._handleQuery}"></anypoint-autocomplete>
    </div>
    `;
  }

  async _handleQuery(e) {
    const { value } = e.detail;
    this.suggestions = await getAsyncSuggestions(value);
  }
}
window.customElements.define('simple-element', SimpleElement);
```

## Accessibility

The autocomplete element follows W3C guidelines for [ARIA 1.1 Combobox with Listbox Popup](https://www.w3.org/TR/wai-aria-practices/examples/combobox/aria1.1pattern/listbox-combo.html). The element is enabled to support screen readers.

Because of how screen readers parses page content and associate roles, the element places suggestions as child elements of the autosuggestion element. This means that you may accidentally style list items from your master CSS file.

Because autocomplete element and text input requires a parent element with specific role, put both elements inside single parent. The element takes care of setting roles and aria attributes on all elements.

### Your code

```html
<div class="parent">
  <anypoint-input id="targetInput"></anypoint-input>
  <anypoint-autocomplete target="targetInput"></anypoint-autocomplete>
</div>
```

### After initialization

```html
<div
  class="parent"
  role="combobox"
  aria-label="Text input with list suggestions"
  aria-expanded="true"
  aria-owns="paperAutocompleteInput7302"
  aria-haspopup="listbox">
  <anypoint-input
    id="targetInput"
    aria-autocomplete="list"
    autocomplete="off"
    aria-haspopup="true"
    aria-controls="paperAutocompleteInput63418"></anypoint-input>
  <anypoint-autocomplete
    target="targetInput"
    id="paperAutocompleteInput7302"
    aria-controls="paperAutocompleteInput63418"
    >
    <anypoint-dropdown>
      <anypoint-listbox
        aria-label="Use arrows and enter to select list item. Escape to close the list."
        role="listbox"
        aria-activedescendant=""
        id="paperAutocompleteInput63418"></anypoint-listbox>
    </anypoint-dropdown>
  </anypoint-autocomplete>
</div>
```

You can set `aria-label` on the parent to override default message. However other attributes are always changed to comply with accessibility requirements.

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-autocomplete
cd anypoint-autocomplete
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
