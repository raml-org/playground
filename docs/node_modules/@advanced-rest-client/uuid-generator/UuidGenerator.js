/**
@license
Copyright 2018 Pawel Psztyc, The ARC team
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
 * An UUID generator.
 *
 * ## Example
 * ```html
 * <uuid-generator auto last-uuid="{{generatedUuid}}"></uuid-generator>
 * ```
 * @customElement
 * @memberof LogicElements
 * @demo demo/index.html
 */
export class UuidGenerator extends HTMLElement {
  constructor() {
    super();
    this._lut = this._genLut();
  }

  get auto() {
    return this._auto;
  }
  /**
   * If set it generates uuid and sets it to `lastUuid` once the element
   * is ready.
   *
   * @param {Boolean} value
   */
  set auto(value) {
    if (this._auto === value) {
      return;
    }
    this._auto = value;
    if (value && !this.hasAttribute('auto')) {
      this.setAttribute('auto', '');
    } else if (!value && this.hasAttribute('auto')) {
      this.removeAttribute('auto');
    }
    this._autoChanged(value);
  }

  get lastUuid() {
    return this.__lastUuid;
  }

  set lastUuid(value) {
    this.__lastUuid = value;
    // Compatibility with Polymer.
    this.dispatchEvent(new CustomEvent('last-uuid-changed', {
      detail: {
        value
      }
    }));
  }

  static get observedAttributes() {
    return ['auto'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Only "auto" is allowed to run this callback
    if (newValue === null) {
      this.auto = false;
    } else {
      this.auto = true;
    }
  }

  connectedCallback() {
    if (!this.hasAttribute('aria-hidden')) {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  _genLut() {
    const result = [];
    for (let i = 0; i < 256; i++) {
      result[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }
    return result;
  }

  _autoChanged(state) {
    if (!state) {
      return;
    }
    this.generate();
  }
  /**
   * Creates an UUID string
   * @return {String} Generated value
   */
  _hash() {
    const d0 = Math.random() * 0xffffffff | 0;
    const d1 = Math.random() * 0xffffffff | 0;
    const d2 = Math.random() * 0xffffffff | 0;
    const d3 = Math.random() * 0xffffffff | 0;
    const lut = this._lut;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] +
      lut[d0 >> 24 & 0xff] + '-' + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' +
      lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' + lut[d2 & 0x3f | 0x80] +
      lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
      lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
  }
  /**
   * Generate a RFC4122, version 4 ID. Example:
   * "92329D39-6F5C-4520-ABFC-AAB64544E172"
   * http://stackoverflow.com/a/21963136/1127848
   * @return {String} The UUID string.
   */
  generate() {
    const value = this._hash();
    this.lastUuid = value;
    return this.lastUuid;
  }
}
