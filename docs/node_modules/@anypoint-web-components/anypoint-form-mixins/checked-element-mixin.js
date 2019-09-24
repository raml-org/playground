import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
/**
 * Use `CheckedElementMixin` to implement an element that can be checked like native checkbox.
 *
 * @mixinFunction
 * @memberof AnypointBasics
 */
export const CheckedElementMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class CheckedElementMixin extends ValidatableMixin(base) {
    static get properties() {
      return {
        /**
         * Gets or sets the state, `true` is checked and `false` is unchecked.
         */
        checked: { type: Boolean, reflect: true },
        /**
         * If true, the button toggles the active state with each click or press
         * of the spacebar.
         */
        toggles: { type: Boolean },
        /**
         * The name of this form element.
         */
        name: { type: String },
        /**
         * The value of this form control
         * @type {*}
         */
        value: { type: String },
        /**
         * Set to true to mark the input as required. If used in a form, a
         * custom element that uses this mixin should also use
         * AnypointValidatableMixin and define a custom validation method.
         * Otherwise, a `required` element will always be considered valid.
         * It's also strongly recommended to provide a visual style for the element
         * when its value is invalid.
         */
        required: { type: Boolean },
        /**
         * Disabled state of the control
         */
        disabled: { type: Boolean, reflect: true }
      };
    }

    constructor() {
      super();
      this.value = 'on';
    }

    get required() {
      return this._required || false;
    }

    set required(value) {
      if (this._setChanged('required', value)) {
        this._requiredChanged(value);
      }
    }

    get value() {
      return this._value || false;
    }

    set value(value) {
      if (this._setChanged('value', value)) {
        this._valueChanged(value);
      }
    }

    get checked() {
      return this._checked || false;
    }

    set checked(value) {
      if (this._setChanged('checked', value)) {
        this._checkedChanged(value);
      }
    }

    _setChanged(prop, value) {
      const key = `_${prop}`;
      const old = this[key];
      if (value === old) {
        return false;
      }
      this[key] = value;
      if (this.requestUpdate) {
        this.requestUpdate(prop, old);
      }
      return true;
    }
    /**
     * @return {Boolean} false if the element is required and not checked, and true
     * otherwise.
     */
    _getValidity() {
      return this.disabled || !this.required || this.checked;
    }
    /**
     * Updates the `aria-required` label when `required` is changed.
     * @param {Boolean} required
     */
    _requiredChanged(required) {
      if (required) {
        this.setAttribute('aria-required', 'true');
      } else {
        this.removeAttribute('aria-required');
      }
    }
    /**
     * Fire `iron-changed`for compatybility with iron elements, `change` event
     * for consistency with HTML elements, and `checked-changed` for Polymer.
     * @param {Boolean} value
     */
    _checkedChanged(value) {
      this.active = value;
      this.dispatchEvent(new CustomEvent('change'));
      this.dispatchEvent(new CustomEvent('iron-change'));
      this.dispatchEvent(new CustomEvent('checked-changed', {
        composed: true,
        detail: {
          value
        }
      }));
    }
    /**
     * Reset value to 'on' if it is set to `undefined`.
     * @param {*} value
     */
    _valueChanged(value) {
      if (value === undefined || value === null) {
        this.value = 'on';
      }
    }
  }
  return CheckedElementMixin;
});
