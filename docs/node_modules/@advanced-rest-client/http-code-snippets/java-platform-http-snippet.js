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
import 'prismjs/components/prism-java.min.js';
/**
 * `java-platform-http-snippet`
 *
 * A snippet for requests made in Java using the platform functions
 *
 * ### Styling
 *
 * See `http-code-snippets` for styling documentation.
 *
 * @customElement
 * @polymer
 * @demo demo/java-platform.html Java Platform demo
 * @demo demo/java.html Java demo
 * @memberof ApiElements
 * @extends BaseCodeSnippet
 */
class JavaPlatformHttpSnippet extends BaseCodeSnippet {
  get lang() {
    return 'java';
  }

  /**
   * Computes code for Java (patform).
   * @param {String} url
   * @param {String} method
   * @param {Array<Object>|undefined} headers
   * @param {String} payload
   * @return {String} Complete code for given arguments
   */
  _computeCommand(url, method, headers, payload) {
    if (!url || !method) {
      return '';
    }
    url = String(url);
    let result = `URL url = new URL("${url}");\n`;
    let klass = 'Http';
    if (url.indexOf('https') === 0) {
      klass += 's';
    }
    klass += 'URLConnection';
    result += `${klass} con = (${klass}) url.openConnection();\n`;
    result += `con.setRequestMethod("${method}");\n`;
    result += this._genHeadersPart(headers);
    result += this._genPayloadPart(payload);
    result += '\n';
    result += 'int status = con.getResponseCode();\n';
    result += 'BufferedReader in = new BufferedReader(';
    result += 'new InputStreamReader(con.getInputStream()));\n';
    result += 'String inputLine;\n';
    result += 'StringBuffer content = new StringBuffer();\n';
    result += 'while((inputLine = in.readLine()) != null) {\n';
    result += '\tcontent.append(inputLine);\n';
    result += '}\n';
    result += 'in.close();\n';
    result += 'con.disconnect();\n';
    result += 'System.out.println("Response status: " + status);\n';
    result += 'System.out.println(content.toString());';
    return result;
  }

  _genHeadersPart(headers) {
    let result = '';
    if (headers && headers.length) {
      headers.forEach((h) => {
        result += `con.setRequestProperty("${h.name}", "${h.value}");\n`;
      });
    }
    return result;
  }

  _genPayloadPart(payload) {
    let result = '';
    if (payload) {
      result += '\n/* Payload support */\n';
      result += 'con.setDoOutput(true);\n';
      result += 'DataOutputStream out = new DataOutputStream(con.getOutputStream());\n';
      const list = this._payloadToList(payload);
      list.forEach((line) => {
        result += `out.writeBytes("${line}\\n");\n`;
      });
      result += 'out.flush();\n';
      result += 'out.close();\n';
    }
    return result;
  }

  _payloadToList(payload) {
    return payload.split('\n').map((item) => item.replace(/"/g, '\\"'));
  }
}
window.customElements.define('java-platform-http-snippet', JavaPlatformHttpSnippet);
