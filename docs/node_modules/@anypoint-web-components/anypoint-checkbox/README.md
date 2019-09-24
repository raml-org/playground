[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-checkbox.svg?branch=master)](https://travis-ci.org/anypoint-web-components/anypoint-checkbox)

[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-checkbox.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-checkbox)

# anypoint-checkbox

Anypoint styled checkbox.

## Working with forms

At the moment of publication of the element, the spec allowing custom elements to be accepted by the `<form>` element ([Form-associated custom elements](https://www.chromestatus.com/feature/4708990554472448)) is work in progress.
Custom form element has to be used with custom elements that needs to be registered in a form. We suggest using [iron-form](https://www.webcomponents.org/element/@polymer/iron-form).

### Form-associated custom elements

This element supports form-associated custom elements spec that allows to use custom elements with `<form>` and `<fieldset>` elements. A browser may not yet support this feature.
If the API is enable then the form element returns `anypoint-checkbox` is `form.elements` list and collect value of the control when submitted.

## Usage

Checkboxes should be used with forms to select one of the available options. Unlike switch button which toggle action selects the control and immediately executes system related action, change of state of a checkbox does not carry any other related action than selecting an option.
In other words, when change of the state of the control triggers change in the UI a switch button should be used instead of a checkbox.

### Installation

```
npm i --save @anypoint-web-components/anypoint-checkbox
```

### In a HTML document

```html
<html>
  <head>
    <script type="module">
      import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
    </script>
  </head>
  <body>
    <anypoint-checkbox>Regular checkbox</anypoint-checkbox>
    <anypoint-checkbox checked>Checked checkbox</anypoint-checkbox>
    <anypoint-checkbox indeterminate>Indeterminate checkbox</anypoint-checkbox>
    <anypoint-checkbox required>Required checkbox</anypoint-checkbox>
    <anypoint-checkbox disabled>Disabled checkbox</anypoint-checkbox>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';

class SimpleElement extends ControlStateMixin(ButtonStateMixin(LitElement)) {
  render() {
    return html`
    <anypoint-checkbox>Regular checkbox</anypoint-checkbox>
    <anypoint-checkbox checked>Checked checkbox</anypoint-checkbox>
    <anypoint-checkbox indeterminate>Indeterminate checkbox</anypoint-checkbox>
    <anypoint-checkbox required>Required checkbox</anypoint-checkbox>
    <anypoint-checkbox disabled>Disabled checkbox</anypoint-checkbox>
    `;
  }
}
window.customElements.define('simple-element', SimpleElement);
```

### Using with custom forms

```sh
npm i --save @polymer/iron-form
```

```html
<script type="module" src="node_modules/@polymer/iron-form/iron-form.js"></script>
<script type="module" src="node_modules/@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js"></script>
<script type="module" src="node_modules/@anypoint-web-components/anypoint-button/anypoint-button.js"></script>
<iron-form>
  <form>
   <anypoint-checkbox name="subscribe" value="newsletetr">Subsceribe to our newsletter</anypoint-checkbox>
   <anypoint-checkbox name="tems" value="accepted" checked required>Agree to terms and conditions</anypoint-checkbox>
   <anypoint-checkbox name="disabled" value="noop" disabled>This is never included</anypoint-checkbox>
  </form>
  <anypoint-button id="submit"></anypoint-button>
</iron-form>
<script>
  document.getElementById('submit').addEventListener('click', () => {
    const values = document.querySelector('iron-form').serializeForm();
    console.log(values);
  });
</script>
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-checkbox
cd anypoint-checkbox
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
