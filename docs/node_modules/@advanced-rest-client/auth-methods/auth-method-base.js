/**
@license
Copyright 2018 The Advanced REST client authors
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
import { LitElement } from 'lit-element';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
/**
 * Base class for all authorization methods
 *
 * @appliesMixin EventsTargetMixin
 * @extends LitElement
 */
export class AuthMethodBase extends EventsTargetMixin(LitElement) {
  static get properties() {
    return {
      /**
       * Setting passed to paper buttons.
       */
      noink: { type: Boolean },
      /**
       * WHen set it prohibits methods from rendering inline documentation.
       */
      noDocs: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set the inputs are disabled
       */
      disabled: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  constructor(type) {
    super();
    this.type = type;
  }
  /**
   * Restores settings from stored value.
   * Abstract to be overriten.
   * @abstract
   */
  restore() {}
  /**
   * Resets settings to default state
   * @abstract
   */
  reset() {}
  /**
   * Sets Observable Property.
   * @param {String} prop Property name to set
   * @param {any} value A value to set
   * @return {Boolean} True if property was changed.
   */
  _sop(prop, value) {
    const key = `_${prop}`;
    const old = this[key];
    /* istanbul ignore if */
    if (old === value) {
      return false;
    }
    this[key] = value;
    this.requestUpdate(prop, old);
    return true;
  }

  _notifyChanged(prop, value) {
    this.dispatchEvent(new CustomEvent(`${prop}-changed`, {
      detail: {
        value
      }
    }));
  }
  /**
   * Generates auth data model by calling `validate()` and `getSettings()` functions.
   *
   * @param {String} type Auth form type.
   * @return {Object} Gnerated data model
   */
  _createModel(type) {
    return {
      settings: this.getSettings(),
      type,
      valid: this.validate()
    };
  }
  /**
   * Generates data model and disaptches `auth-settings-changed` custom event.
   *
   * @param {String} type Auth form type.
   * @return {CustomEvent} Dispatched event
   */
  _notifySettingsChange(type) {
    const detail = this._createModel(type);
    const e = new CustomEvent('auth-settings-changed', {
      detail: detail,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(e);
    return e;
  }
  /**
   * A coniniet method to set a property value and call the settings changed function.
   *
   * Note, this function is to be called from user input only. Calling this function
   * from a property change will cause invalid validation report.
   *
   * @param {String} prop Name of the property to set
   * @param {any} value A value to set.
   */
  _setSettingsInputValue(prop, value) {
    this.__isInputEvent = true;
    this[prop] = value;
    this._settingsChanged();
    this.__isInputEvent = false;
  }

  /**
   * Dispatches `auth-settings-changed` custom event asynchronously or, if
   * `__isInputEvent` flag is set, synchronously.
   */
  _settingsChanged() {
    if (this.__isInputEvent) {
      this.__notifyChanged();
    } else {
      if (this.__settingsDebouncer) {
        clearTimeout(this.__settingsDebouncer);
      }
      this.__settingsDebouncer = setTimeout(() => this.__notifyChanged());
    }
  }

  __notifyChanged() {
    this.__settingsDebouncer = null;
    const e = this._notifySettingsChange(this.type);
    if (this._notifyHeaderChange) {
      this._notifyHeaderChange(e.detail.settings);
    }
  }

  _getEventTarget(e) {
    let target;
    if (e.composedPath) {
      target = e.composedPath()[0];
    } else if (e.path) {
      target = e.path[0];
    } else {
      target = e.target;
    }
    return target;
  }
  /**
   * Restores an item from a session store and assigns it to a local
   * property.
   * @param {String} sessionKey Session storage key
   * @param {String} localKey This component's property
   */
  _restoreSessionProperty(sessionKey, localKey) {
    if (!this[localKey]) {
      const value = sessionStorage.getItem(sessionKey);
      if (value) {
        this[localKey] = value;
      }
    }
  }
  /**
   * Stores a property in a session storage.
   * @param {String} sessionKey A storage key
   * @param {String} value Value to store
   */
  _storeSessionProperty(sessionKey, value) {
    if (!value) {
      return;
    }
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    sessionStorage.setItem(sessionKey, value);
  }
}
