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
import { LitElement } from 'lit-element';
/**
 * An element that contains methods to transform FormData object
 * into Multipart message and ArrayBuffer
 *
 * ## Example
 *
 * ```html
 * <multipart-payload-transformer form-data="[[formData]]"></multipart-payload-transformer>
 * ```
 *
 * ## Legacy dependencies
 *
 * If targeting legacy browsers add polyfill for Fetch API.
 *
 * @customElement
 * @polymer
 * @memberof LogicElements
 */
export class MultipartPayloadTransformer extends LitElement {
  static get properties() {
    return {
      /**
       * A form data object to transform.
       *
       * @type {FormData}
       */
      formData: { type: Object },
      /**
       * Latest generated boundary value for the multipart forms.
       * Each call to `generateMessage()` or `generatePreview()` will
       * generate new content type and therefore boundary value.
       */
      boundary: { type: String },
      /**
       * Latest generated content-type value for the multipart forms.
       * Each call to `generateMessage()` or `generatePreview()` will
       * generate new content type value.
       */
      contentType: { type: String }
    };
  }

  get boundary() {
    return this._boundary;
  }

  set boundary(value) {
    const old = this._boundary;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._boundary = value;
    this.dispatchEvent(new CustomEvent('boundary-changed', {
      detail: {
        value
      }
    }));
  }

  get contentType() {
    return this._contentType;
  }

  set contentType(value) {
    const old = this._contentType;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._contentType = value;
    this.dispatchEvent(new CustomEvent('contenttype-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @return {Function} Previously registered handler for `boundary-changed` event
   */
  get onboundary() {
    return this['_onboundary-changed'];
  }
  /**
   * Registers a callback function for `boundary-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onboundary(value) {
    this._registerCallback('boundary-changed', value);
  }
  /**
   * @return {Function} Previously registered handler for `contenttype-changed` event
   */
  get oncontenttype() {
    return this['_oncontenttype-changed'];
  }
  /**
   * Registers a callback function for `contenttype-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set oncontenttype(value) {
    this._registerCallback('contenttype-changed', value);
  }


  connectedCallback() {
    /* istanbul ignore else */
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.setAttribute('aria-hidden', 'true');
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
  /**
   * Generates an ArrayBuffer instance from the FormData object.
   *
   * @return {Promise<String>} A resolved promise when produces ArrayBuffer.
   */
  generateMessage() {
    /* global Request */
    const request = new Request('/', {
      method: 'POST',
      body: this.formData
    });
    const ct = request.headers.get('content-type');
    this._processContentType(ct);
    if (!request.arrayBuffer) {
      return Promise.reject(new Error('Your browser do not support this method.'));
    }
    return request.arrayBuffer();
  }
  /**
   * Informs other ARC elements about content type change.
   * If boundary is added to the content type string then it is reported in
   * a separate event.
   *
   * @param {String} contentType New cintent type.
   */
  _processContentType(contentType) {
    this.contentType = contentType;
    this.dispatchEvent(new CustomEvent('content-type-changed', {
      bubbles: true,
      composed: true,
      detail: {
        value: contentType
      }
    }));
    const match = contentType.match(/boundary=(.*)/);
    if (!match) {
      return;
    }
    const boundary = match[1];
    this.boundary = boundary;
    this.dispatchEvent(new CustomEvent('multipart-boundary-changed', {
      bubbles: true,
      composed: true,
      detail: {
        value: boundary
      }
    }));
  }
  /**
   * Generates a preview of the multipart messgae.
   *
   * @return {Promise<String>} A promise resolved to a string message.
   */
  async generatePreview() {
    if (!this.formData) {
      return Promise.reject(new Error('The FormData property is not set.'));
    }
    const ab = await this.generateMessage();
    return this.arrayBufferToString(ab);
  }
  /**
   * Convert ArrayBuffer to readable form
   * @param {ArrayBuffer} buffer
   * @return {String} Converted string
   */
  arrayBufferToString(buffer) {
    if (buffer.buffer) {
      // Not a ArrayBuffer, need and instance of AB
      // It can't just get buff.buffer because it will use original buffer if the buff is a slice
      // of it.
      const b = buffer.slice(0);
      buffer = b.buffer;
    }
    if ('TextDecoder' in window) {
      const view = new DataView(buffer);
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(view);
    }
    const array = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < array.length; ++i) {
      str += String.fromCharCode(array[i]);
    }
    return str;
  }
  /**
   * Dispatched when a message is generated from the FormData. This operation
   * changes boundary added to the header.
   *
   * @event content-type-changed
   * @param {String} value New value of the content type.
   */
  /**
   * Dispatched when boundary is generated
   *
   * @event multipart-boundary-changed
   * @param {String} value New value of the boundary
   */
}
window.customElements.define('multipart-payload-transformer', MultipartPayloadTransformer);
