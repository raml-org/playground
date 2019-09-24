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
import { LitElement, html, css } from 'lit-element';
import { HeadersParserMixin } from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';
/**
 * An element that displays a list of headers.
 *
 * On double click on the list the `query-headers` event is dispatched to
 * get header definition. When information is handled by the application
 * then it dispays a dialog with header documentation.
 * Use `advanced-rest-client/arc-definitions` element to handle queries.
 *
 * The `headers` property accepts a HTTP headers string or `Headers` object
 * as defined in Fetch spec.
 *
 * ### Example
 *
 * ```html
 * <headers-list-view headers="Content-Type: application/json"></headers-list-view>
 * ```
 *
 * ### Styling
 * `<headers-list-view>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--headers-list-view` | Mixin applied to the element | `{}`
 * `--arc-font-body1` | Mixin applied to the example section in the details dialog. | `{}`
 * `--arc-font-body2` | Mixin applied to the description section in the details dialog. | `{}`
 * `--arc-font-code1` | Mixin apllied to the list | `{}`
 * `--headers-list-item-min-height` | Min height of the list item. | `20px`
 * `--arc-link` | Mixin applied to a link | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @appliesMixin HeadersParserMixin
 * @memberof UiElements
 */
class HeadersListView extends HeadersParserMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
      font-size: var(--arc-font-body1-font-size);
      font-weight: var(--arc-font-body1-font-weight);
      line-height: var(--arc-font-body1-line-height);
    }

    .dialog-header-example {
      margin-top: 16px;
    }

    .dialog-header-desc {
      font-size: var(--arc-font-body2-font-size);
      font-weight: var(--arc-font-body2-font-weight);
      line-height: var(--arc-font-body2-line-height);
    }

    .list-item {
      min-height: var(--headers-list-item-min-height, 20px);
      user-select: text;
      word-break: break-all;
      font-family: var(--arc-font-code-family);
    }

    .list-item > span {
      display: inline-block;
    }

    .header-name {
      margin-right: 8px;
    }

    .auto-link {
      color: var(--link-color);
    }`;
  }

  _listTemplate(headers) {
    return html`<div class="container">
      ${headers.map((item) => html`<div class="list-item" data-name="${item.name}">
        <span class="header-name">${item.name}:</span>
        <span class="header-value">${this._autoLink(item.value)}</span>
      </div>`)}
    </div>`;
  }

  render() {
    const { _headersList } = this;
    const hasList = !!(_headersList && _headersList.length);
    return html`
    ${hasList ? this._listTemplate(_headersList) : undefined}`;
  }

  static get properties() {
    return {
      /**
       * A HTTP headers to display.
       */
      headers: { type: String },
      /**
       * Parsed headers to the array of headers.
       *
       * @type {Array<Object>}
       */
      _headersList: { type: Array },
      /**
       * Type of the header.
       * Can be either `request` or `response`.
       * It is required for displaying the help for the headers. The element
       * fires the `query-headers` event on double click which requires this
       * information to be set.
       */
      type: { type: String },
      /**
       * A regexp used to match links in headers string.
       *
       * @type {RegExp}
       */
      _linkR: { type: Object }
    };
  }

  get headers() {
    return this._headers;
  }

  set headers(value) {
    const old = this._headers;
    if (old === value) {
      return;
    }
    this._headers = value;
    this._headersChanged(value);
  }

  constructor() {
    super();
    this._linkR = /(https?:\/\/([^" >]*))/gim;
    this.type = 'response';
  }
  /**
   * The list view requires to add some markup dynamically therefore it cannot
   * use Polymer's replates and binding system.
   * Heaqders list is generated manually when headers string has changed.
   *
   * @param {String} headers Headers to render
   */
  _headersChanged(headers) {
    if (!headers) {
      this._headersList = undefined;
      return;
    }
    const list = this.headersToJSON(headers);
    this._headersList = list;
  }
  // Finds URLs in input string and adds anchors tags.
  _autoLink(input) {
    if (typeof input !== 'string') {
      return input;
    }
    const matches = input.match(this._linkR);
    if (!matches) {
      return input;
    }
    let index = input.indexOf(matches[0]);
    const start = input.substr(0, index);
    const url = matches[0];
    index += url.length;
    const end = input.substr(index);

    return html`${start}<a target="_blank"
      class="auto-link" href="${url}">${url}</a>${end}`;
  }
}
window.customElements.define('headers-list-view', HeadersListView);
