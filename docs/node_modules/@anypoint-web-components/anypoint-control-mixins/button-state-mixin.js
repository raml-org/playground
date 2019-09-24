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
export const ButtonStateMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class ButtonStateMixin extends base {
    static get properties() {
      // This properties won't be set on native WC.
      // Use `observedAttributes` and `attributeChangedCallback` to set properties
      // on a web component
      return {
        /**
         * If true, the button toggles the active state with each click or press
         * of the spacebar.
         */
        toggles: { type: Boolean, reflect: true },
        /**
         * If true, the button is a toggle and is currently in the active state.
         */
        active: { type: Boolean },
        /**
         * The aria attribute to be set if the button is a toggle and in the
         * active state.
         */
        ariaActiveAttribute: { type: String }
      };
    }
    /**
     * @return {Boolean} True when the element is currently being pressed as
     * the user is holding down the button on the element.
     */
    get pressed() {
      return this._pressed;
    }

    get _pressed() {
      return this.__pressed || false;
    }

    set _pressed(value) {
      if (this._setChanged('_pressed', value)) {
        if (value) {
          this.setAttribute('pressed', '');
        } else {
          this.removeAttribute('pressed');
        }
        this.dispatchEvent(new CustomEvent('pressed-changed', {
          composed: true,
          detail: {
            value
          }
        }));
        this._pressedChanged(value);
      }
    }

    get active() {
      return this._active || false;
    }

    set active(value) {
      if (this._setChanged('active', value)) {
        if (value) {
          this.setAttribute('active', '');
        } else {
          this.removeAttribute('active');
        }
        this.dispatchEvent(new CustomEvent('active-changed', {
          composed: true,
          detail: {
            value
          }
        }));
        this._activeChanged();
      }
    }

    get pointerDown() {
      return this._pointerDown;
    }

    get _pointerDown() {
      return this.__pointerDown || false;
    }

    set _pointerDown(value) {
      this._setChanged('_pointerDown', value);
    }

    get receivedFocusFromKeyboard() {
      return this._receivedFocusFromKeyboard || false;
    }

    get _receivedFocusFromKeyboard() {
      return this.__receivedFocusFromKeyboard || false;
    }

    set _receivedFocusFromKeyboard(value) {
      this._setChanged('_receivedFocusFromKeyboard', value);
    }

    get ariaActiveAttribute() {
      return this._ariaActiveAttribute;
    }

    set ariaActiveAttribute(value) {
      const old = this._ariaActiveAttribute;
      if (this._setChanged('ariaActiveAttribute', value)) {
        if (old && this.hasAttribute(old)) {
          this.removeAttribute(old);
        }
        this._activeChanged();
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
      this.ariaActiveAttribute = 'aria-pressed';
      this._downHandler = this._downHandler.bind(this);
      this._upHandler = this._upHandler.bind(this);
      this._clickHandler = this._clickHandler.bind(this);
      this._keyDownHandler = this._keyDownHandler.bind(this);
      this._keyUpHandler = this._keyUpHandler.bind(this);
      this._blurHandler = this._blurHandler.bind(this);
      this._focusHandler = this._focusHandler.bind(this);
    }
    /**
     * Registers hover listeners
     */
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      this.addEventListener('mousedown', this._downHandler);
      this.addEventListener('mouseup', this._upHandler);
      this.addEventListener('click', this._clickHandler);
      this.addEventListener('keydown', this._keyDownHandler);
      this.addEventListener('keyup', this._keyUpHandler);
      this.addEventListener('blur', this._blurHandler);
      this.addEventListener('focus', this._focusHandler);
      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'button');
      }
    }
    /**
     * Removes hover listeners
     */
    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      this.removeEventListener('mousedown', this._downHandler);
      this.removeEventListener('mouseup', this._upHandler);
      this.removeEventListener('click', this._clickHandler);
      this.removeEventListener('keydown', this._keyDownHandler);
      this.removeEventListener('keyup', this._keyUpHandler);
      this.removeEventListener('blur', this._blurHandler);
      this.removeEventListener('focus', this._focusHandler);
    }
    /**
     * Handler for pointer down event
     * @param {MouseEvent} e
     */
    _downHandler() {
      this._pointerDown = true;
      this._pressed = true;
      this._receivedFocusFromKeyboard = false;
    }
    /**
     * Handler for pointer up event
     * @param {MouseEvent} e
     */
    _upHandler() {
      this._pointerDown = false;
      this._pressed = false;
    }
    /**
     * Handler for pointer click event
     * @param {MouseEvent} e
     */
    _clickHandler() {
      if (this.toggles) {
        // a click is needed to toggle the active state
        this.active = !this.active;
      } else {
        this.active = false;
      }
    }
    /**
     * Handler for keyboard down event
     * @param {KeyboardEvent} e
     */
    _keyDownHandler(e) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.keyCode === 13) {
        this._asyncClick(e);
      } else if (e.code === 'Space' || e.keyCode === 32) {
        this._spaceKeyDownHandler(e);
      }
    }
    /**
     * Handler for keyboard up event
     * @param {KeyboardEvent} e
     */
    _keyUpHandler(e) {
      if (e.code === 'Space' || e.keyCode === 32) {
        this._spaceKeyUpHandler(e);
      }
    }

    _blurHandler() {
      this._detectKeyboardFocus(false);
      this._pressed = false;
    }

    _focusHandler() {
      this._detectKeyboardFocus(true);
    }

    _detectKeyboardFocus(focused) {
      this._receivedFocusFromKeyboard = !this.pointerDown && focused;
    }

    _isLightDescendant(node) {
      return node !== this && this.contains(node);
    }

    _spaceKeyDownHandler(e) {
      const target = e.target;
      // Ignore the event if this is coming from a focused light child, since that
      // element will deal with it.
      if (!target || this._isLightDescendant(/** @type {Node} */ (target))) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      this._pressed = true;
    }

    _spaceKeyUpHandler(e) {
      const target = e.target;
      // Ignore the event if this is coming from a focused light child, since that
      // element will deal with it.
      if (!target || this._isLightDescendant(/** @type {Node} */ (target))) {
        return;
      }
      if (this.pressed) {
        this._asyncClick();
      }
      this._pressed = false;
    }

    _asyncClick() {
      setTimeout(() => this.click(), 1);
    }

    _pressedChanged() {
      this._changedButtonState();
    }

    _changedButtonState() {
      if (this._buttonStateChanged) {
        this._buttonStateChanged(); // abstract
      }
    }

    _activeChanged() {
      const { active, ariaActiveAttribute } = this;
      if (this.toggles) {
        this.setAttribute(ariaActiveAttribute, active ? 'true' : 'false');
      } else {
        this.removeAttribute(ariaActiveAttribute);
      }
      this._changedButtonState();
    }
    /**
     * This function is called when `ControlStateMixin` is also applied to the element.
     */
    _controlStateChanged() {
      if (this.disabled) {
        this._pressed = false;
      } else {
        this._changedButtonState();
      }
    }
  }
  return ButtonStateMixin;
});
