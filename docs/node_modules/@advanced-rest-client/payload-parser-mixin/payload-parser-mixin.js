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
const AMP_RE = new RegExp(/&/g);
const GT_RE = new RegExp(/>/g);
const LT_RE = new RegExp(/</g);
const SQUOT_RE = new RegExp(/'/g);
const QUOT_RE = new RegExp(/"/g);
/**
 * A behavior to be implemented to elements that needs to parse
 * request / response body.
 * It contains functions to encode / decode form data and to escape HTML.
 *
 * @polymer
 * @mixinFunction
 * @memberof ArcBehaviors
 */
export const PayloadParserMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class PayloadParserMixin extends base {
    /**
     * Regexp to search for the `&` character
     * @type {RegExp}
     */
    get AMP_RE() {
      return AMP_RE;
    }
    /**
     * Regexp to search for the `>` character
     * @type {RegExp}
     */
    get GT_RE() {
      return GT_RE;
    }
    /**
     * Regexp to search for the `<` character
     * @type {RegExp}
     */
    get LT_RE() {
      return LT_RE;
    }
    /**
     * Regexp to search for the `'` character
     * @type {RegExp}
     */
    get SQUOT_RE() {
      return SQUOT_RE;
    }
    /**
     * Regexp to search for the `"` character
     * @type {RegExp}
     */
    get QUOT_RE() {
      return QUOT_RE;
    }
    /**
     * Escape HTML to save HTML text.
     *
     * @param {String} html A HTML string to be escaped.
     * @return {String}
     */
    htmlEscape(html) {
      if (html.indexOf('&') !== -1) {
        html = html.replace(this.AMP_RE, '&amp;');
      }
      if (html.indexOf('<') !== -1) {
        html = html.replace(this.LT_RE, '&lt;');
      }
      if (html.indexOf('>') !== -1) {
        html = html.replace(this.GT_RE, '&gt;');
      }
      if (html.indexOf('"') !== -1) {
        html = html.replace(this.QUOT_RE, '&quot;');
      }
      if (html.indexOf('\'') !== -1) {
        html = html.replace(this.SQUOT_RE, '&apos;');
      }
      return html;
    }
    /**
     * Parse input array to string x-www-form-urlencoded.
     *
     * Note that this function doesn't encodes the name and value. Use
     * `this.formArrayToString(this.encodeUrlEncoded(arr))`
     * to create a encoded string from the array.
     *
     * @param {Array<Object>} arr Input array. Each element must contain an
     * object with `name` and `value` keys.
     * @return {String} A parsed string of `name`=`value` pairs of the input objects.
     */
    formArrayToString(arr) {
      if (!arr || !(arr instanceof Array)) {
        return [];
      }
      const result = [];
      arr.forEach((item) => {
        const data = this._modelItemToFormDataString(item);
        if (data) {
          result[result.length] = data;
        }
      });
      return result.join('&');
    }
    /**
     * Creates a form data string for a single item.
     * @param {Object} model The model with `name` and `value` properties.
     * @return {String} Generated value string for x-www-form-urlencoded form.
     */
    _modelItemToFormDataString(model) {
      if (model.schema && model.schema.enabled === false) {
        return;
      }
      const name = this._paramValue(model.name);
      let value = model.value;
      if (value && value instanceof Array) {
        return value.map((item) => name + '=' + this._paramValue(item))
            .join('&');
      }
      value = this._paramValue(value);
      if (!name && !value) {
        return;
      }
      if (!value && model.required === false) {
        return;
      }
      return name + '=' + value;
    }
    /**
     * Parse input string to array of x-www-form-urlencoded form parameters.
     *
     * This function will not url-decode names and values. Please, use
     * `this.decodeUrlEncoded(this.stringToArray(str))` to create an array
     * of decoded parameters.
     *
     * @param {String} input A string of HTTP x-www-form-urlencoded parameters
     * @return {Array<Object>} An array of params with `name` and `value` keys.
     */
    stringToArray(input) {
      if (typeof input !== 'string' || !input.trim()) {
        return [];
      }
      // Chrome inspector has FormData output in format: `param-name`:`param-value`
      // When copying from inspector the ':' must be replaced with '='
      const htmlInputCheck = /^([^\\=]{1,})=(.*)$/m;
      if (!htmlInputCheck.test(input)) {
        // replace chome inspector data.
        input = input.replace(/^([^\\:]{1,}):(.*)$/gm, '$1=$2&').replace(/\n/gm, '');
        input = input.substr(0, input.length - 1);
      }

      return this._createParamsArray(input);
    }
    /**
     * Converts a string to an array with objects containing name and value keys
     * @param {String} input An input string
     * @return {Array.<Object>} An array of params with `name` and `value` keys.
     */
    _createParamsArray(input) {
      let result = [];
      if (!input) {
        return result;
      }
      let state = 0; // 0 - reading name, 1 - reading value
      let i = 0;
      let _tmpName = '';
      let _tmpValue = '';
      const cond = true;
      while (cond) {
        const ch = input[i++];
        if (ch === undefined) {
          if (_tmpValue || _tmpName) {
            result = this._appendArrayResult(result, _tmpName, _tmpValue);
          }
          break;
        }
        if (ch === '=') {
          if (state !== 1) {
            state = 1;
            continue;
          }
        }
        if (ch === '&') {
          state = 0;
          result = this._appendArrayResult(result, _tmpName, _tmpValue);
          _tmpName = '';
          _tmpValue = '';
          continue;
        }
        if (state === 0) {
          _tmpName += ch;
        } else if (state === 1) {
          _tmpValue += ch;
        }
      }
      return result;
    }
    /**
     * Appends form data parameter to an array.
     * If the parameter already exists in the array it creates an array for
     * the value onstead of appending the same parameter.
     *
     * @param {Array} array An array to append the parameter
     * @param {String} name Name of the form data parameter
     * @param {String} value Value of the form data parameter
     * @return {Array} Updated array
     */
    _appendArrayResult(array, name, value) {
      for (let i = 0, len = array.length; i < len; i++) {
        if (array[i].name === name) {
          if (array[i].value instanceof Array) {
            array[i].value.push(value);
          } else {
            array[i].value = [array[i].value, value];
          }
          return array;
        }
      }
      array.push({
        name: name,
        value: value
      });
      return array;
    }
    /**
     * Encode payload to x-www-form-urlencoded string.
     *
     * @param {Array<object>|String} input An input data.
     * @return {Array<object>|String}
     */
    encodeUrlEncoded(input) {
      if (!input || !input.length) {
        return input;
      }
      const isArray = input instanceof Array;
      if (!isArray) {
        input = this.stringToArray(input);
      }
      input.forEach((obj) => {
        obj.name = this.encodeQueryString(obj.name);
        obj.value = this._encodeValue(obj.value);
      });
      if (isArray) {
        return input;
      }
      return this.formArrayToString(input);
    }
    /**
     * URL encodes a value.
     *
     * @param {String|Array<String>} value Value to encode. Either string or
     * array of strings.
     * @return {String|Array<String>} Encoded value. The same type as the input.
     */
    _encodeValue(value) {
      if (value instanceof Array) {
        for (let i = 0, len = value.length; i < len; i++) {
          value[i] = this.encodeQueryString(value[i]);
        }
        return value;
      }
      return this.encodeQueryString(value);
    }
    /**
     * Decode x-www-form-urlencoded data.
     *
     * @param {Array<object>|String} input An input data.
     * @return {Array<object>|String}
     */
    decodeUrlEncoded(input) {
      if (!input || !input.length) {
        return input;
      }
      const isArray = input instanceof Array;
      if (!isArray) {
        input = this.stringToArray(input);
      }
      input.forEach((obj) => {
        obj.name = this.decodeQueryString(obj.name);
        obj.value = this._decodeValue(obj.value);
      });
      if (isArray) {
        return input;
      }
      return this.formArrayToString(input);
    }
    /**
     * URL decodes a value.
     *
     * @param {String|Array<String>} value Value to decode. Either string or
     * array of strings.
     * @return {String|Array<String>} Decoded value. The same type as the input.
     */
    _decodeValue(value) {
      if (value instanceof Array) {
        for (let i = 0, len = value.length; i < len; i++) {
          value[i] = this.decodeQueryString(value[i]);
        }
        return value;
      }
      return this.decodeQueryString(value);
    }
    /**
     * Parse input string as a payload param key or value.
     *
     * @param {String} input An input to parse.
     * @return {String}
     */
    _paramValue(input) {
      if (!input) {
        return String();
      }
      input = String(input);
      input = input.trim();
      return input;
    }
    /**
     * Parse a line of key=value http params into an object with `name` and `value` keys.
     *
     * @param {String} input A input line of x-www-form-urlencoded text tike `param=value`
     * @return {Object} A parsed object with `name` and `value` keys.
     * @deprecated It's old parser. Use `_createParamsArray` instead.
     */
    _paramLineToFormObject(input) {
      if (!input) {
        return;
      }
      const _tmp = input.split('=');
      const name = _tmp[0].trim();
      if (!name && _tmp.length === 1) {
        return;
      }
      let value;
      if (_tmp.length === 1) {
        value = '';
      } else {
        value = _tmp[1].trim();
      }
      return {
        name: name,
        value: value
      };
    }
    /**
     * Returns a string where all characters that are not valid for a URL
     * component have been escaped. The escaping of a character is done by
     * converting it into its UTF-8 encoding and then encoding each of the
     * resulting bytes as a %xx hexadecimal escape sequence.
     *
     * Note: this method will convert any space character into its escape
     * short form, '+' rather than %20. It should therefore only be used for
     * query-string parts.
     *
     * The following character sets are **not** escaped by this method:
     * - ASCII digits or letters
     * - ASCII punctuation characters: ```- _ . ! ~ * ' ( )</pre>```
     *
     * Notice that this method <em>does</em> encode the URL component delimiter
     * characters:<blockquote>
     *
     * ```
     * ; / ? : & = + $ , #
     * ```
     *
     * @param {String} str A string containing invalid URL characters
     * @return {String} a string with all invalid URL characters escaped
     */
    encodeQueryString(str) {
      if (!str) {
        return str;
      }
      const regexp = /%20/g;
      return encodeURIComponent(str).replace(regexp, '+');
    }
    /**
     * Returns a string where all URL component escape sequences have been
     * converted back to their original character representations.
     *
     * Note: this method will convert the space character escape short form, '+',
     * into a space. It should therefore only be used for query-string parts.
     *
     * @param {String} str string containing encoded URL component sequences
     * @return {String} string with no encoded URL component encoded sequences
     */
    decodeQueryString(str) {
      if (!str) {
        return str;
      }
      const regexp = /\+/g;
      return decodeURIComponent(str.replace(regexp, '%20'));
    }
  }
  return PayloadParserMixin;
});
