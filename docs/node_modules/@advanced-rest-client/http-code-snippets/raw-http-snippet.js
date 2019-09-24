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
import { BaseCodeSnippet } from './base-code-snippet.js';
import 'prismjs/prism.js';
import 'prismjs/components/prism-http.min.js';
/**
 * `raw-http-snippet`
 *
 * Code snippet to display raw HTTP message
 *
 * ### Styling
 *
 * See `http-code-snippets` for styling documentation.
 *
 * @customElement
 * @polymer
 * @demo demo/raw.html Raw demo
 * @memberof ApiElements
 * @extends BaseCodeSnippet
 */
class RawHttpSnippet extends BaseCodeSnippet {
  get lang() {
    return 'http';
  }

  /**
   * Computes bas command for cURL.
   * @param {String} url
   * @param {String} method
   * @param {Array<Object>|undefined} headers
   * @param {String} payload
   * @return {String} Complete cURL command for given arguments
   */
  _computeCommand(url, method, headers, payload) {
    if (!url || !method) {
      return '';
    }
    const urlData = this.urlDetails(url);
    let result = `${method} ${urlData.path} HTTP/1.1\n`;
    if (urlData.hostValue) {
      result += `Host: ${urlData.hostValue}:${urlData.port}\n`;
    }
    result += this._genHeadersPart(headers);
    result += this._genPayloadPart(payload);
    return result;
  }

  _genHeadersPart(headers) {
    let result = '';
    if (headers && headers instanceof Array) {
      for (let i = 0, len = headers.length; i < len; i++) {
        const h = headers[i];
        result += `${h.name}: ${h.value}\n`;
      }
    }
    return result;
  }

  _genPayloadPart(payload) {
    let result = '';
    if (payload) {
      result += '\n';
      result += payload;
      result += '\n\n';
    }
    return result;
  }
}
window.customElements.define('raw-http-snippet', RawHttpSnippet);
