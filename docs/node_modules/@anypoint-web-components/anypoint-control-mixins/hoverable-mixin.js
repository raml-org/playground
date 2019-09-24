/**
@license
Copyright 2017 Mulesoft.

All rights reserved.
*/
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
/**
 * Use `HoverableMixin` to implement an element that can be hovered.
 * The control gets a `hovered` attribute when it's hovered by the pointing devide.
 *
 * Be aware that mobile devices will not support hovering as desktop devices and behavior
 * may vary depending on platform. You should use this as little as possible.
 *
 * @mixinFunction
 * @memberof AnypointBasics
 */
export const HoverableMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class HoverableMixin extends base {
    /**
     * @return {Boolean} True when the element is currently hovered by a pointing device.
     */
    get hovered() {
      return this._hovered;
    }

    get _hovered() {
      return this.__hovered || false;
    }

    set _hovered(value) {
      const old = this.__hovered;
      if (value === old) {
        return;
      }
      this.__hovered = value;
      if (this.requestUpdate) {
        this.requestUpdate('hovered', old);
      }
      if (value) {
        this.setAttribute('hovered', '');
      } else {
        this.removeAttribute('hovered');
      }
      this.dispatchEvent(new CustomEvent('hovered-changed', {
        composed: true,
        detail: {
          value
        }
      }));
    }

    /**
     * @constructor
     */
    constructor() {
      super();
      this._hoverCallback = this._hoverCallback.bind(this);
      this._leaveCallback = this._leaveCallback.bind(this);
    }
    /**
     * Registers hover listeners
     */
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      this.addEventListener('mouseover', this._hoverCallback);
      this.addEventListener('mouseleave', this._leaveCallback);
    }
    /**
     * Removes hover listeners
     */
    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      this.removeEventListener('mouseover', this._hoverCallback);
      this.removeEventListener('mouseleave', this._leaveCallback);
    }
    /**
     * Set's the `hovered` attribute to true when handled.
     */
    _hoverCallback() {
      this._hovered = true;
    }
    /**
     * Updates `hovered` if the control is not hovered anymore.
     */
    _leaveCallback() {
      this._hovered = false;
    }
  }
  return HoverableMixin;
});
