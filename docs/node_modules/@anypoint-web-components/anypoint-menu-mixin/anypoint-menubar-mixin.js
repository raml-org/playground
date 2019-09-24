import { AnypointMenuMixin } from './anypoint-menu-mixin.js';
/**
 * Port of `@polymer/iron-menubar-behavior`.
 *
 * A mixin that implement accessible menubar.
 *
 * Note, by default the mixin works with LitElement. If used with different class
 * make sure that attributes are reflected to properties correctly.
 *
 * @mixinFunction
 * @param {Class} base
 * @return {Class}
 * @appliesMixin AnypointMenuMixin
 */
export const AnypointMenubarMixin = (base) => class extends AnypointMenuMixin(base) {
  get _isRTL() {
    return window.getComputedStyle(this).direction === 'rtl';
  }

  connectedCallback() {
    /* istanbul ignore else */
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (this.getAttribute('role') === 'menu') {
      this.setAttribute('role', 'menubar');
    }
  }

  _onUpKey(e) {
    this.focusedItem.click();
    e.preventDefault();
  }

  _onDownKey(e) {
    this.focusedItem.click();
    e.preventDefault();
  }

  _onLeftKey(e) {
    if (this._isRTL) {
      this._focusNext();
    } else {
      this._focusPrevious();
    }
    e.preventDefault();
  }

  _onRightKey(e) {
    if (this._isRTL) {
      this._focusPrevious();
    } else {
      this._focusNext();
    }
    e.preventDefault();
  }

  _onKeydown(e) {
    if (e.key === 'ArrowLeft') {
      this._onLeftKey(e);
    } else if (e.key === 'ArrowRight') {
      this._onRightKey(e);
    } else {
      super._onKeydown(e);
    }
  }
};
