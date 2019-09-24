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
import 'prismjs/components/prism-bash.min.js';
/**
 * `curl-http-snippet`
 *
 * A snippet for curl command in bash.
 *
 * ### Styling
 *
 * See `http-code-snippets` for styling documentation.
 *
 * @customElement
 * @polymer
 * @demo demo/curl.html cURL demo
 * @memberof ApiElements
 * @extends BaseCodeSnippet
 */
class CurlHttpSnippet extends BaseCodeSnippet {
  get lang() {
    return 'bash';
  }
  /**
   * Computes command for cURL.
   * @param {String} url
   * @param {String} method
   * @param {Array<Object>|undefined} headers
   * @param {String} payload
   * @return {String} Complete cURL command for given arguments
   */
  _computeCommand(url, method, headers, payload) {
    url = url || '';
    method = method || 'GET';
    let result = `curl "${url}" \\\n`;
    if (method !== 'GET') {
      result += `  -X ${method} \\\n`;
    }
    if (payload) {
      let quot = '';
      try {
        payload = JSON.stringify(payload);
      } catch (_) {
        quot = '"';
      }
      result += `  -d ${quot}${payload}${quot} \\\n`;
    }
    if (headers && headers instanceof Array) {
      for (let i = 0, len = headers.length; i < len; i++) {
        const h = headers[i];
        result += `  -H "${h.name}: ${h.value}" `;
        if (i + 1 !== len) {
          result += '\\\n';
        }
      }
    }
    if (result.substr(-2) === '\\\n') {
      result = result.substr(0, result.length - 3);
    }
    return result;
  }
}
window.customElements.define('curl-http-snippet', CurlHttpSnippet);
