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

/**
 * A mixin to share common code between both method selectors.
 *
 * @mixinFunction
 * @memberof ArcMixins
 * @param {Class} base
 * @return {Class}
 */
export const HttpMethodSelectorMixin = (base) => class extends base {
  static get properties() {
    return {
      /**
       * Currently selected HTTP method.
       */
      method: { type: String },
      /**
       * True if the request for selected HTTP method can carry a payload. It
       * is defined in HTTP spec.
       */
      _isPayload: { type: Boolean },
      /**
       * Set to true when the user opens the dropdown menu
       */
      methodMenuOpened: { type: Boolean },
      /**
       * When set it allows to render a custom method selector
       */
      renderCustom: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * Enables outlined theme.
       */
      outlined: { type: Boolean, reflect: true },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Makes the dropdown label to be hidden when has a value.
       */
      noLabelFloat: { type: Boolean }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  get method() {
    return this._method;
  }

  set method(value) {
    const old = this._method;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._method = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('method', old);
    }
    this._methodChanged(value);
    this._isPayload = this._computeIsPayload(value);
    this._dropdownMenuOpened(this.methodMenuOpened, value);
    this.dispatchEvent(new CustomEvent('method-changed', {
      detail: {
        value
      }
    }));
  }

  get isPayload() {
    return this._isPayload;
  }

  get _isPayload() {
    return this.__isPayload;
  }

  set _isPayload(value) {
    const old = this.__isPayload;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__isPayload = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('_isPayload', old);
    }
    this._onIsPayloadChanged(value);
    this.dispatchEvent(new CustomEvent('ispayload-changed', {
      detail: {
        value
      }
    }));
  }

  get renderCustom() {
    return this._renderCustom;
  }

  set renderCustom(value) {
    const old = this._renderCustom;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._renderCustom = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('renderCustom', old);
    }
    this.dispatchEvent(new CustomEvent('rendercustom-changed', {
      detail: {
        value
      }
    }));
  }

  get methodMenuOpened() {
    return this._methodMenuOpened;
  }

  set methodMenuOpened(value) {
    const old = this._methodMenuOpened;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._methodMenuOpened = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('methodMenuOpened', old);
    }
    this._dropdownMenuOpened(value, this.method);
  }

  /**
   * @return {Function} Previously registered handler for `method-changed` event
   */
  get onmethod() {
    return this['_onmethod-changed'];
  }
  /**
   * Registers a callback function for `method-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onmethod(value) {
    this._registerCallback('method-changed', value);
  }

  /**
   * @return {Function} Previously registered handler for `ispayload-changed` event
   */
  get onispayload() {
    return this['_onispayload-changed'];
  }
  /**
   * Registers a callback function for `ispayload-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onispayload(value) {
    this._registerCallback('ispayload-changed', value);
  }

  constructor() {
    super();
    this._isPayloadStatusHandler = this._isPayloadStatusHandler.bind(this);
    this._methodChangedHandler = this._methodChangedHandler.bind(this);

    this.method = 'GET';
    this._isPayload = false;
    this.methodMenuOpened = false;
    this.renderCustom = false;
  }

  get standardMethods() {
    return [
      'get', 'post', 'put', 'delete', 'patch', 'head', 'connect',
      'options', 'trace'
    ];
  }

  get inputElement() {
    return this.shadowRoot && this.shadowRoot.querySelector('anypoint-input');
  }

  /**
   * Registers an event handler for given type
   * @param {String} eventType Event type (name)
   * @param {Function} value The handler to register
   */
  _registerCallback(eventType, value) {
    const key = `_on${eventType}`;
    if (this[key]) {
      this.removeEventListener(eventType, this[key]);
    }
    if (typeof value !== 'function') {
      this[key] = null;
      return;
    }
    this[key] = value;
    this.addEventListener(eventType, value);
  }

  _attachListeners(node) {
    node.addEventListener('request-is-payload-status', this._isPayloadStatusHandler);
    node.addEventListener('request-method-changed', this._methodChangedHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('request-is-payload-status', this._isPayloadStatusHandler);
    node.removeEventListener('request-method-changed', this._methodChangedHandler);
  }

  // Compute if the tayload can carry a payload.
  _computeIsPayload(method) {
    return ['GET', 'HEAD'].indexOf(method) === -1;
  }

  /**
   * Handler for `isPayload` property change.
   * @param {Boolean} value
   */
  _onIsPayloadChanged(value) {
    if (value === undefined) {
      return;
    }
    this.dispatchEvent(new CustomEvent('request-is-payload-changed', {
      cancelable: true,
      bubbles: true,
      composed: true,
      detail: {
        value: value
      }
    }));
  }
  /**
   * Handler for `method` property chnage.
   * @param {?String} method
   */
  _methodChanged(method) {
    if (method === undefined || this.__cancelMethodEvent) {
      return;
    }
    if (method && !this.renderCustom) {
      let m = method && method.toLowerCase();
      m = m.trim();
      if (m) {
        if (this.standardMethods.indexOf(m) === -1) {
          this.renderCustom = true;
        }
      }
    }
    this.dispatchEvent(new CustomEvent('request-method-changed', {
      cancelable: true,
      bubbles: true,
      composed: true,
      detail: {
        value: method
      }
    }));
  }
  /**
   * Responds to an event requesting status check for `isPayload` propery by setting the `value`
   * property on the event and canceling the event.
   *
   * @param {CustomEvent} e
   */
  _isPayloadStatusHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.value = this._isPayload;
  }
  /**
   * If the event source is not this element it will update the method value.
   *
   * @param {CustomEvent} e
   */
  _methodChangedHandler(e) {
    if (e.target === this) {
      return;
    }
    this.__cancelMethodEvent = true;
    this.method = e.detail.value;
    this.__cancelMethodEvent = undefined;

    setTimeout(() => this.validateCustom());
  }

  validateCustom() {
    const node = this.inputElement;
    if (node) {
      return node.validate();
    }
    return true;
  }

  closeCustom() {
    this.renderCustom = false;
    this.method = 'GET';
  }

  /**
   * Checks if there is an empty method name and if it is it will set `renderCustom` property
   * that constrolls display of a custom method input.
   *
   * @param {Boolean} opened
   * @param {String} method
   */
  _dropdownMenuOpened(opened, method) {
    if (!opened && method === '' && !this.renderCustom) {
      this.renderCustom = true;
      setTimeout(() => {
        const node = this.inputElement;
        if (node) {
          node.focus();
        }
      });
    }
  }

  _openedHandler(e) {
    this.methodMenuOpened = e.detail.value;
  }

  _methodHandler(e) {
    this.method = e.detail.value;
  }
  /**
   * Fired when the `isPayload` computed property value chnage.
   *
   * @event request-is-payload-changed
   * @param {Boolean} value Current state.
   */
  /**
   * Fired when a method has been selected.
   *
   * @event request-method-changed
   * @param {Boolean} value Current HTTP method name.
   */
};
