[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/validatable-mixin.svg)](https://www.npmjs.com/package/@anypoint-web-components/validatable-mixin)

[![Build Status](https://travis-ci.org/anypoint-web-components/validatable-mixin.svg?branch=stage)](https://travis-ci.org/anypoint-web-components/validatable-mixin)

# ValidatableMixin

A mixin to implement user input validation in a LitElement component.

A port of `iron-validatable-mixin` that works with any JavaScript class.
To be used with Polymer 3, LitElement and low level web components.

This validatable supports multiple validators.

Use `ValidatableMixin` to implement an element that validates user input.
Use the related `ArcValidatorBehavior` to add custom validation logic
to an iron-input or other wrappers around native inputs.

By default, an `<iron-form>` element validates its fields when the user presses the submit button.
To validate a form imperatively, call the form's `validate()` method, which in turn will call `validate()` on all its children. By using `ValidatableMixin`, your custom element will get a public `validate()`, which will return the validity of the element, and a corresponding `invalid` attribute, which can be used for styling.

To implement the custom validation logic of your element, you must override the protected `_getValidity()` method of this behaviour, rather than `validate()`.

### Accessibility

Changing the `invalid` property, either manually or by calling `validate()` will update the `aria-invalid` attribute.

## Installation

```bash
npm i @anypoint-web-components/validatable-mixin
```

## Usage

### Using `_getValidity()` function

```html
<test-validatable></test-validatable>

<script>
import { LitElement, html } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';

class InputValidatable extends ValidatableMixin(LitElement) {
  render() {
    return html`<input/>`;
  }

  constructor() {
    super();
    this.addEventListener('input', this._onInput.bind(this));
  }

  _onInput(e) {
    this.validate(e.target.value);
  }

  _getValidity(value) {
    return value.length >= 6;
  }
}
window.customElements.define('input-validatable', InputValidatable);
</script>
```

### Using custom validators

```html
<cats-only message="Only cats are allowed!"></cats-only>
<test-validatable validator="cats-only"></test-validatable>

<script>
import { LitElement } from 'lit-element';
import { ValidatorMixin } from '@anypoint-web-components/validator-mixin/validator-mixin.js';

class CatsOnly extends ValidatorMixin(LitElement) {
  validate(value) {
    return value.match(/^(c|ca|cat|cats)?$/) !== null;
  }
}
window.customElements.define('cats-only', CatsOnly);
class InputValidatable extends ValidatableMixin(LitElement) {
  render() {
    return html`<input/>`;
  }

  constructor() {
    super();
    this.addEventListener('input', this._onInput.bind(this));
  }

  _onInput(e) {
    this.validate(e.target.value);
  }
}
window.customElements.define('input-validatable', InputValidatable);
</script>
```


## Testing
```bash
npm test
```

## Demo
```bash
npm start
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
