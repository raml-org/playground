/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { IronMeta } from '@polymer/iron-meta/iron-meta.js';
/**
 * Singleton IronMeta instance.
 */
export let ValidatableMixinMeta = null;
/**
 * A port of `iron-validatable-mixin` that works with any JavaScript class.
 * To be used with Polymer 3, LitElement and low level web components.
 *
 * This validatable supports multiple validators.
 *
 * Use `ValidatableMixin` to implement an element that validates user input.
 * Use the related `ArcValidatorBehavior` to add custom validation logic
 * to an iron-input or other wrappers around native inputs.
 *
 * By default, an `<iron-form>` element validates its fields when the user presses the submit
 * button.
 * To validate a form imperatively, call the form's `validate()` method, which in turn will
 * call `validate()` on all its children. By using `ValidatableMixin`, your
 * custom element will get a public `validate()`, which will return the validity
 * of the element, and a corresponding `invalid` attribute, which can be used for styling.
 *
 * To implement the custom validation logic of your element, you must override
 * the protected `_getValidity()` method of this behaviour, rather than `validate()`.
 * See [this](https://github.com/PolymerElements/iron-form/blob/master/demo/simple-element.html)
 * for an example.
 *
 * ### Accessibility
 *
 * Changing the `invalid` property, either manually or by calling `validate()` will update the
 * `aria-invalid` attribute.
 *
 * @mixinFunction
 * @param {Class} base
 * @return {Class}
 */
export const ValidatableMixin = (base) => class extends base {
  static get properties() {
    return {
      /**
       * Name of the validator or validators to use.
       * If the element should be validated by more than one validator then separate names with
       * space. See docs for `PolymerValidatorBehavior` for description of how to define a
       * validator.
       */
      validator: { type: String },

      /**
       * After calling `validate()` this is be populated by latest result of the
       * test for each validator. Result item contains following properties:
       *
       * - validator {String} Name of the validator
       * - valid {Boolean} Result of the test
       * - message {String} Error message
       *
       * This property is `undefined` if `validator` is not set.
       */
      validationStates: { type: Array },
      /**
       * True if the last call to `validate` is invalid.
       */
      invalid: {
        reflect: true,
        type: Boolean
      },
      /**
       * Namespace for this validator. This property is deprecated and should
       * not be used. For all intents and purposes, please consider it a
       * read-only, config-time property.
       */
      validatorType: { type: String }
    };
  }
  /* Recompute this every time it's needed, because we don't know if the
   * underlying ValidatableMixinMeta has changed. */
  get _validator() {
    if (!ValidatableMixinMeta) {
      return null;
    }
    const validator = this.validator;
    if (!validator) {
      return null;
    }
    const validatorsNames = validator.split(' ');
    if (validatorsNames.length === 0) {
      return null;
    }
    const result = [];
    validatorsNames.forEach((name) => {
      const validator = ValidatableMixinMeta.byKey(name);
      if (validator) {
        result.push(validator);
      }
    });
    return result;
  }
  get invalid() {
    return this._invalid;
  }

  set invalid(value) {
    if (this._sop('invalid', value)) {
      this._invalidChanged(value);
      this._notifyChanged('invalid', value);
    }
  }

  get validationStates() {
    return this._validationStates;
  }

  set validationStates(value) {
    if (this._sop('validationStates', value)) {
      this._notifyChanged('validation-states', value);
    }
  }

  /**
   * @return {Function} Previously registered handler for `chips-changed` event
   */
  get oninvalid() {
    return this._oninvalid;
  }
  /**
   * Registers a callback function for `chips-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set oninvalid(value) {
    if (this._oninvalid) {
      this.removeEventListener('invalid-changed', this._oninvalid);
    }
    if (typeof value !== 'function') {
      this._oninvalid = null;
      return;
    }
    this._oninvalid = value;
    this.addEventListener('invalid-changed', value);
  }

  /**
   * @constructor
   */
  constructor() {
    super();
    ValidatableMixinMeta = new IronMeta({
      type: 'validator'
    });
    this.validatorType = 'validator';
    this.invalid = false;
  }

  _sop(prop, value) {
    const key = `_${prop}`;
    const old = this[key];
    if (old === value) {
      return false;
    }
    this[key] = value;
    if (this.requestUpdate) {
      // Lit element
      this.requestUpdate(prop, old);
    }
    return true;
  }

  _notifyChanged(prop, value) {
    this.dispatchEvent(new CustomEvent(prop + '-changed', {
      composed: true,
      detail: {
        value
      }
    }));
  }

  _invalidChanged(invalid) {
    if (invalid) {
      this.setAttribute('aria-invalid', 'true');
    } else {
      this.removeAttribute('aria-invalid');
    }
  }

  /**
   * @return {boolean} True if the validator `validator` exists.
   */
  hasValidator() {
    const _validator = this._validator;
    return !!(_validator && _validator.length);
  }

  /**
   * Returns true if the `value` is valid, and updates `invalid`. If you want
   * your element to have custom validation logic, do not override this method;
   * override `_getValidity(value)` instead.
   * @param {Object} value The value to be validated. By default, it is passed
   * to the validator's `validate()` function, if a validator is set.
   * @return {boolean} True if `value` is valid.
   */
  validate(value) {
    const state = this._getValidity(value);
    this.invalid = !state;
    return state;
  }

  /**
   * Overrides `IronValidatableBehavior#hasValidator`
   *
   * Returns true if `value` is valid.  By default, it is passed
   * to the validator's `validate()` function, if a validator is set. You
   * should override this method if you want to implement custom validity
   * logic for your element.
   *
   * @param {Object} value The value to be validated.
   * @return {boolean} True if `value` is valid.
   */
  _getValidity(value) {
    if (this.hasValidator()) {
      let result = true;
      const states = [];
      this._validator.forEach((validator) => {
        const validatorResult = {
          validator: validator.nodeName && validator.nodeName.toLowerCase(),
          message: validator.message
        };
        if (!validator.validate(value)) {
          result = false;
          validatorResult.valid = false;
        } else {
          validatorResult.valid = true;
        }
        states.push(validatorResult);
      });
      this.validationStates = states;
      return result;
    }
    return true;
  }
};
