/**
@license
Copyright 2017 Mulesoft.

All rights reserved.
*/
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
/**
 * Use `ButtonStateMixin` to implement an element that can be pressed and active when toggles.
 *
 * @mixinFunction
 * @memberof AnypointBasics
 */
export const ControlStateMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class ControlStateMixin extends base {
    static get properties() {
      // This properties won't be set on native WC.
      // Use `observedAttributes` and `attributeChangedCallback` to set properties
      // on a web component
      return {
        /**
         * If true, the button is a toggle and is currently in the active state.
         */
        disabled: { type: Boolean },
        /**
         * If true, the element currently has focus.
         */
        focused: { type: Boolean }
      };
    }
    /**
     * @return {Boolean} True when the element is currently being pressed as
     * the user is holding down the button on the element.
     */
    get focused() {
      return this._focused;
    }

    set focused(value) {
      if (this._setChanged('focused', value)) {
        if (value) {
          this.setAttribute('focused', '');
        } else {
          this.removeAttribute('focused');
        }
        this.dispatchEvent(new CustomEvent('focused-changed', {
          composed: true,
          detail: {
            value
          }
        }));
        this._changedControlState();
      }
    }

    get disabled() {
      return this._disabled;
    }

    set disabled(value) {
      if (this._setChanged('disabled', value)) {
        if (value) {
          this.setAttribute('disabled', '');
        } else {
          this.removeAttribute('disabled');
        }
        this.dispatchEvent(new CustomEvent('disabled-changed', {
          composed: true,
          detail: {
            value
          }
        }));
        this._disabledChanged(value);
        this._changedControlState();
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
     * @constructor
     */
    constructor() {
      super();
      this._focusBlurHandler = this._focusBlurHandler.bind(this);
    }
    /**
     * Registers hover listeners
     */
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      this.addEventListener('focus', this._focusBlurHandler);
      this.addEventListener('blur', this._focusBlurHandler);
    }
    /**
     * Removes hover listeners
     */
    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      this.removeEventListener('focus', this._focusBlurHandler);
      this.removeEventListener('blur', this._focusBlurHandler);
    }

    _focusBlurHandler(e) {
      if (this.disabled) {
        if (this.focused) {
          this.focused = false;
          this.blur();
        }
        return;
      }
      this.focused = e.type === 'focus';
    }

    _disabledChanged(disabled) {
      this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      this.style.pointerEvents = disabled ? 'none' : '';
      if (disabled) {
        // Read the `tabindex` attribute instead of the `tabIndex` property.
        // The property returns `-1` if there is no `tabindex` attribute.
        // This distinction is important when restoring the value because
        // leaving `-1` hides shadow root children from the tab order.
        this._oldTabIndex = this.getAttribute('tabindex');
        this.focused = false;
        this.setAttribute('tabindex', '-1');
        this.blur();
      } else if (this._oldTabIndex !== undefined) {
        if (this._oldTabIndex === null) {
          this.removeAttribute('tabindex');
        } else {
          this.setAttribute('tabindex', this._oldTabIndex);
        }
      }
    }

    _changedControlState() {
      // _controlStateChanged is abstract, follow-on mixins may implement it
      if (this._controlStateChanged) {
        this._controlStateChanged();
      }
    }
  }
  return ControlStateMixin;
});
