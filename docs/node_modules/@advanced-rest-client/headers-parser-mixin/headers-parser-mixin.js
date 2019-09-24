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
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

const ERROR_MESSAGES = {
  CONTENT_TYPE_MISSING: 'Content-Type header is not defined',
  HEADER_NAME_EMPTY: 'Header name can\'t be empty',
  HEADER_NAME_WHITESPACES: 'Header name should not contain whitespaces',
  HEADER_VALUE_EMPTY: 'Header value should not be empty'
};
/**
 * Headers parser behavior to be impplemented with elements that needs to parse headers data.
 *
 * In most cases function defined in this behavior can work with the headers defined as a string,
 * array of objects (name, value keys) or as Header object.
 *
 * To calculate errors properly, set `isPayload` property when current request can carry a
 * payload.
 *
 * @polymer
 * @mixinFunction
 * @memberof ArcMixins
 */
export const HeadersParserMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class HPBmixin extends base {
    static get properties() {
      return {
        /**
         * Set to true when the request can carry a payload.
         * It's required for calculating headers errors.
         */
        isPayload: Boolean
      };
    }

    /**
     * Filter array of headers and return not duplicated array of the same headers.
     * Duplicated headers should be appended to already found one using coma separator.
     *
     * @param {Array} headers
     *                Headers array to filter. All objects in headers array must have "name"
     *                and "value" keys.
     * @return {Array} An array of filtered headers.
     */
    filterHeaders(headers) {
      const _tmp = {};
      headers.forEach(function(header) {
        if (header.name in _tmp) {
          if (header.value) {
            _tmp[header.name] += ', ' + header.value;
          }
        } else {
          _tmp[header.name] = header.value;
        }
      });
      const result = [];
      Object.keys(_tmp).forEach((key) => {
        result[result.length] = {
          name: key,
          value: _tmp[key]
        };
      });
      return result;
    }
    /**
     * Parse headers array to Raw HTTP headers string.
     *
     * @param {Array|String|Headers} headersArray List of objects with "name" and "value"
     * properties.
     * @return {String} A HTTP representation of the headers.
     */
    headersToString(headersArray) {
      if (typeof headersArray === 'string') {
        return headersArray;
      }
      if (!(headersArray instanceof Array)) {
        headersArray = this.headersToJSON(headersArray);
      }
      if (headersArray.length === 0) {
        return '';
      }
      headersArray = this.filterHeaders(headersArray);
      return headersArray
          .map((header) => this.headerItemToString(header))
          .join('\n');
    }
    /**
     * Transforms a header model item to a string.
     * Array values are supported.
     *
     * @param {Object} header Object with name and value.
     * @return {String} Generated headers line
     */
    headerItemToString(header) {
      const key = header.name;
      let value = header.value;
      if (value instanceof Array) {
        value = value.join(',');
      }
      let result = '';
      if (key && key.trim() !== '') {
        result += key + ': ';
        if (value) {
          result += value;
        }
      }
      return result;
    }

    /**
     * Parse HTTP headers input from string to array of objects containing `name` and `value`
     * properties.
     *
     * @param {String|Headers} headers Raw HTTP headers input or Headers object
     * @return {Array<Object>} The array of objects where properties are `name` as a header
     * name and `value` as a header content.
     */
    headersToJSON(headers) {
      if (typeof headers === 'string') {
        return this._headersStringToJSON(headers);
      }
      return this._hedersToJSON(headers);
    }
    /**
     * Parse headers string to array of objects.
     * See `#toJSON` for more info.
     * @param {String} headersString
     * @return {Array<Object>}
     */
    _headersStringToJSON(headersString) {
      const result = [];
      if (!headersString) {
        return result;
      }
      if (typeof headersString !== 'string') {
        throw new Error('Headers must be an instance of String.');
      }
      if (headersString.trim() === '') {
        return result;
      }
      const headers = headersString.split(/\n(?=[^ \t]+)/gim);

      for (let i = 0, len = headers.length; i < len; i++) {
        const line = headers[i].trim();
        if (line === '') {
          continue;
        }
        const sepPosition = line.indexOf(':');
        if (sepPosition === -1) {
          result[result.length] = {
            name: line,
            value: ''
          };
          continue;
        }
        const name = line.substr(0, sepPosition);
        const value = line.substr(sepPosition + 1).trim();
        const obj = {
          name: name,
          value: value
        };
        result.push(obj);
      }
      return result;
    }
    /**
     * Parse Headers object to array of objects.
     * See `#toJSON` for more info.
     *
     * @param {Headers|Object} headers
     * @return {Array<Object>}
     */
    _hedersToJSON(headers) {
      const result = [];
      if (!headers) {
        return result;
      }
      headers = new Headers(headers);
      const _tmp = {};
      headers.forEach(function(value, name) {
        if (_tmp[name]) {
          _tmp[name] += ', ' + value;
        } else {
          _tmp[name] = value;
        }
      });
      return Object.keys(_tmp).map(function(key) {
        let value = _tmp[key];
        if (value && value.indexOf(',') !== -1) {
          value = value.split(',').map((part) => part.trim()).join(', ');
        }
        return {
          name: key,
          value: value
        };
      });
    }

    /**
     * Helper method for old system: combine headers list with encoding value.
     * Note that this function will update the original array.
     *
     * @param {Array} headers An array of headers
     * @param {String} encoding An encoding string from the old request.
     * @return {Boolean} True if encoding has been added to the array.
     */
    _oldCombine(headers, encoding) {
      if (!(headers instanceof Array)) {
        throw new Error('Headers must be an array');
      }
      encoding = String(encoding);
      const ct = headers.filter((item) => item.name.toLowerCase() === 'content-type');
      if (ct.length === 0) {
        headers.push({
          name: 'Content-Type',
          value: encoding.trim()
        });
        return true;
      }
      return false;
    }

    /**
     * Get the Content-Type value from the headers.
     *
     * @param {Array|String} headers Either HTTP headers string or list of headers.
     * @return {String|null} A content-type header value or null if not found
     */
    getContentType(headers) {
      if (typeof headers !== 'string') {
        headers = this.headersToString(headers);
      }
      headers = headers.trim();
      if (headers === '') {
        return null;
      }
      const re = /^content-type:\s?(.*)$/im;
      const match = headers.match(re);
      if (!match) {
        return null;
      }
      let ct = match[1].trim();
      if (ct.indexOf('multipart') === -1) {
        const index = ct.indexOf('; ');
        if (index > 0) {
          ct = ct.substr(0, index);
        }
      }
      return ct;
    }

    /**
     * Replace value for given header in the headers list.
     *
     * @param {Array|String|Object} headers A headers object. Can be string, array of objects or
     * Headers object.
     * @param {String} name Header name to be replaced.
     * @param {String} value Header value to be repleced.
     * @return {Array} Updated headers.
     */
    replaceHeaderValue(headers, name, value) {
      let origType = 'headers';
      if (headers instanceof Array) {
        origType = 'array';
      } else if (typeof headers === 'string') {
        origType = 'string';
      }
      if (origType !== 'array') {
        headers = this.headersToJSON(headers);
      }
      const _name = name.toLowerCase();
      let found = false;
      headers.forEach(function(header) {
        if (header.name.toLowerCase() === _name) {
          header.value = value;
          found = true;
        }
      });
      if (!found) {
        headers.push({
          name: name,
          value: value
        });
      }
      if (origType === 'array') {
        return headers;
      } else if (origType === 'string') {
        return this.headersToString(headers);
      }
      const obj = {};
      headers.forEach(function(header) {
        obj[header.name] = header.value;
      });
      return new Headers(obj);
    }
    /**
     * Get error message for given header string.
     * @param {Header|Array|String} input A headers to check.
     * @return {?String} An error message or null if the headers are valid.
     */
    getHeaderError(input) {
      if (!input) {
        if (this.isPayload) {
          return ERROR_MESSAGES.CONTENT_TYPE_MISSING;
        }
        return null;
      }
      if (!(input instanceof Array)) {
        input = this.headersToJSON(input);
      }
      const msg = [];
      let hasContentType = false;
      for (let i = 0, len = input.length; i < len; i++) {
        const name = input[i].name;
        const value = input[i].value;
        if (name.toLowerCase() === 'content-type') {
          hasContentType = true;
        }
        if (!name || !name.trim()) {
          msg[msg.length] = ERROR_MESSAGES.HEADER_NAME_EMPTY;
        } else if (/\s/.test(name)) {
          msg[msg.length] = ERROR_MESSAGES.HEADER_NAME_WHITESPACES;
        }
        if (!value || !value.trim()) {
          msg[msg.length] = ERROR_MESSAGES.HEADER_VALUE_EMPTY;
        }
      }
      if (this.isPayload && !hasContentType) {
        msg[msg.length] = ERROR_MESSAGES.CONTENT_TYPE_MISSING;
      }
      if (msg.length > 0) {
        return msg.join('\n');
      }
      return null;
    }
  }
  return HPBmixin;
});
