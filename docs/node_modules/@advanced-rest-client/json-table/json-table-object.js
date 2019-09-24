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
import { JsonTableMixin } from './json-table-mixin.js';
import './json-table-array.js';
/**
 * An element that displays object structure.
 *
 * ### Example
 *
 * ```html
 * <json-table-object json="{...}"></json-table-object>
 * ```
 *
 * ### Styling
 *
 * `<json-table>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--json-table-object` | Mixin applied to the element | `{}`
 *
 * @customElement
 * @appliesMixin JsonTableMixin
 * @memberof UiElements
 */
class JsonTableObject extends JsonTableMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
      --json-table-property-name-width: auto;
    }

    .item {
      display: flex;
      flex-direction: row;
      min-height: 24px;
      padding: 8px 0;
      border-bottom: 1px var(--json-table-item-border-bottom-color, rgba(0, 0, 0, 0.12)) solid;
    }

    .item.array,
    .item.object {
      display: flex;
      flex-direction: column;
    }

    .item:last-of-type {
      border-bottom: none;
    }

    .property-name {
      color: var(--json-table-list-property-name-color, #000);
      word-break: break-all;
      margin-right: 12px;
      padding-right: 12px;
      white-space: normal;
      word-break: normal;
      margin: 8px 12px 8px 0;
    }

    .property-value {
      flex: 1;
      word-wrap: normal;
      overflow: auto;
    }

    .object .property-value,
    .array .property-value {
      overflow: visible;
    }

    .object .property-value {
      margin-left: var(--json-table-indent-size, 12px);
    }

    .object .property-name,
    .array .property-name  {
      font-weight: 600;
      width: auto;
      min-width: auto;
    }

    json-table-object,
    json-table-array {
      overflow: auto;
    }

    :host > .object > .property-name,
    :host > .array > .property-name {
      color: var(--json-table-list-property-name-color, #000);
    }

    .enum-value {
      display: block;
    }

    .enum-value::after {
      content: ',';
      color: rgba(0, 0, 0, 0.54);
    }

    .enum-value:last-of-type::after {
      content: ''
    }

    .object-label,
    .array-label {
      color: var(--json-table-complex-name-label-color, #58595A);
    }`;
  }

  render() {
    const { _display, paginate, page, itemsPerPage, outlined, compatibility } = this;

    if (!(_display && _display.length)) {
      return;
    }
    return html`
    ${_display.map((item) => html`<div class="item ${this._computeItemClass(item)}">
      <div class="property-name">
        ${item.key}
        ${item.isObject ? html`<span class="object-label">(Object)</span>` : undefined}
        ${this._isEnumOrArray(item) ? html`<span class="array-label">(Array ${this._computeArraySize(item)})</span>` : undefined}
      </div>
      <div class="property-value">
        ${item.isObject ? html`<json-table-object
          .json="${item.value}"
          ?paginate="${paginate}"
          .page="${page}"
          .itemsPerPage="${itemsPerPage}"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"></json-table-object>` : undefined}
        ${item.isEnum ?
          item.value.map((item) => html`<span class="enum-value">${item}</span>`) :
          undefined}
        ${item.isArray ? html`<div class="array-wrapper">
          <json-table-array
            .json="${item.value}"
            ?paginate="${paginate}"
            .page="${page}"
            .itemsPerPage="${itemsPerPage}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"></json-table-array>
        </div>` : undefined}

        ${item.isPrimitive ? html`<json-table-primitive-teaser class="primitive-value">${item.value}</json-table-primitive-teaser>` : undefined}
      </div>
    </div>`)}`;
  }

  get json() {
    return this._json;
  }

  set json(value) {
    const old = this._json;
    if (old === value) {
      return;
    }
    this._json = value;
    this._jsonChanged(value);
  }

  static get properties() {
    return {
      // An object to render.
      json: { type: Object },
      // data model created from the `json` attribute.
      _display: { type: Array }
    };
  }
  /**
   * Creates a data model from the JSON object.
   * The element is only interested in first level properties. Other properties will be rendered
   * by child elements.
   *
   * TODO: This should be a deep data observer to update only the portion of the model that
   * actually had changed.
   *
   * @param {Object} json
   */
  _jsonChanged(json) {
    if (!json) {
      this._display = undefined;
      return;
    }
    const names = Object.keys(json);
    const model = names.map((key) => this.getPropertyModel(key, json[key]));
    this._display = model;
  }

  _computeItemClass(item) {
    if (item.isArray/* || item.isEnum*/) {
      return 'array';
    }
    if (item.isEnum) {
      return 'enum';
    }
    if (item.isObject) {
      return 'object';
    }
  }
}
window.customElements.define('json-table-object', JsonTableObject);
