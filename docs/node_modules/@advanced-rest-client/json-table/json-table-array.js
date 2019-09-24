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
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@polymer/iron-icon/iron-icon.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import './json-table-object.js';
import './json-table-primitive-teaser.js';
/**
 * An element that displays array structure.
 *
 * ### Example
 *
 * ```html
 * <json-table-array json="[...]"></json-table-array>
 * ```
 *
 *
 * @customElement
 * @appliesMixin JsonTableMixin
 * @memberof UiElements
 */
class JsonTableArray extends JsonTableMixin(LitElement) {
  static get styles() {
    return css`:host {
     display: block;
     font-size: var(--arc-font-body1-font-size);
     font-weight: var(--arc-font-body1-font-weight);
     line-height: var(--arc-font-body1-line-height);
   }

   anypoint-dropdown-menu {
     width: 70px;
   }

   table {
     border-collapse: collapse;
   }

   th {
     white-space: nowrap;
     text-align: left;
     padding: 8px 16px;
     font-size: 14px;
     color: var(--json-table-array-header-color, #58595A);
     border-bottom: 3px #e8e9ea solid;
   }

   td {
     min-width: 60px;
     padding: 8px 16px;
     word-break: normal;
     vertical-align: top;
     border-bottom: 1px #E8E9EA solid;
     font-size: 14px;
     color: var(--json-table-array-body-color, #121314);
   }

   *[hidden] {
     display: none !important;
   }

   .enum-value {
     display: block;
     padding: 4px 0;
     margin: 4px 0;
   }

   .enum-value::after {
     content: ',';
     color: rgba(0, 0, 0, 0.54);
   }

   .enum-value:last-of-type::after {
     content: ''
   }

   .toggle-view {
     font-size: inherit;
     color: inherit;
     margin-top: 12px;
     display: block;
     white-space: nowrap;
   }

   .toggle-view.active {
     display: inline-block;
     margin-top: 0;
   }

   .table-actions {
     height: 56px;
     display: flex;
     flex-direction: row;
     align-items: center;
     font-size: var(--table-actions-label-font-size);
     color: var(--table-actions-label-color);
   }

   .page-items-count-selector,
   .page-count {
     margin-right: 32px;
     height: 56px;
     display: flex;
     flex-direction: row;
     align-items: center;
   }`;
  }

  _paginationTemplate() {
    const { paginate, itemsPerPage, _startItemLabel, _endItemLabel, _maxItemsLabel, page, outlined, compatibility } = this;
    if (!paginate) {
      return;
    }
    return html`<div class="table-actions">
      <div class="page-items-count-selector">
        <span class="page-items-count-label">Items per page</span>
        <anypoint-dropdown-menu
          nolabelfloat
          ?outlined="${outlined}"
          ?legacy="${compatibility}">
          <label slot="label">Select</label>
          <anypoint-listbox
            ?legacy="${compatibility}"
            slot="dropdown-content"
            attrforselected="data-value"
            .selected="${itemsPerPage}"
            @selected-changed="${this._ippHandler}">
            <anypoint-item data-value="10">10</anypoint-item>
            <anypoint-item data-value="15">15</anypoint-item>
            <anypoint-item data-value="20">20</anypoint-item>
            <anypoint-item data-value="25">25</anypoint-item>
            <anypoint-item data-value="50">50</anypoint-item>
            <anypoint-item data-value="100">100</anypoint-item>
          </anypoint-listbox>
        </anypoint-dropdown-menu>
      </div>
      <div class="page-count">
        ${_startItemLabel}-${_endItemLabel} of ${_maxItemsLabel}
      </div>
      <div class="page-paginators">
        <anypoint-icon-button
          aria-label="Activate to render previous page"
          @click="${this.previousPage}"
          ?disabled="${this._isDisabedPrevious(page)}"
          ?legacy="${compatibility}">
          <iron-icon icon="arc:chevron-left"></iron-icon>
        </anypoint-icon-button>
        <anypoint-icon-button
          aria-label="Activate to render next page"
          @click="${this.nextPage}"
          ?disabled="${this._isDisabedNext(_maxItemsLabel, _endItemLabel)}"
          ?legacy="${compatibility}">
          <iron-icon icon="arc:chevron-right"></iron-icon>
        </anypoint-icon-button>
      </div>
    </div>`;
  }

  _dispayTemplate(display, hasColumns, columns) {
    const { paginate, page, itemsPerPage, outlined, compatibility } = this;
    return display.map((displayItem) => html`<tr>
      ${hasColumns ? columns.map((column) => html`<td>
        ${this._isPrimitive(displayItem, column) ?
          html`<json-table-primitive-teaser
            class="primitive-value">${this._getValue(displayItem, column)}</json-table-primitive-teaser>` :
          undefined}
        ${this._isObject(displayItem, column) ?
          html`<json-table-object
            .json="${this._getValue(displayItem, column)}"
            ?paginate="${paginate}"
            .page="${page}"
            .itemsPerPage="${itemsPerPage}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"></json-table-object>` :
          undefined}
        ${this._isEnum(displayItem, column) ?
          this._getValue(displayItem, column).map((item) => html`<span class="enum-value">${item}</span>`) :
          undefined}

        ${this._isArray(displayItem, column) ? html`<span class="object-info">
          <span class="object-label" array="">Array (${this._computeValueSize(displayItem, column)})</span>
          <a href="#" class="toggle-view" data-target="array" @click="${this._toggleItem}">show array</a></span>
          <json-table-array
            hidden
            .json="${this._getValue(displayItem, column)}"
            ?paginate="${paginate}"
            .page="${page}"
            .itemsPerPage="${itemsPerPage}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"></json-table-array>` : undefined}
      </td>`) : undefined}
    </tr>`);
  }

  render() {
    const { _columns, _display } = this;
    const hasColumns = !!(_columns && _columns.length);
    const hasDisplay = !!(_display && _display.length);

    return html`
    ${this._paginationTemplate()}
    <table>
      ${hasColumns ? html`<thead>
        <tr>
        ${_columns.map((item) => html`<th>${item}</th>`)}
        </tr>
      </thead>` : undefined}
      <tbody>
        ${hasDisplay ? this._dispayTemplate(_display, hasColumns, _columns) : undefined}
      </tbody>
    </table>
    ${this._paginationTemplate()}`;
  }

  static get properties() {
    return {
      // An object to render.
      json: { type: Array },
      // List of computed column names
      _columns: { type: Array },
      // data model created from the `json` attribute.
      _display: { type: Array },
      // A label for start index in pagination (1-based)
      _startItemLabel: { type: Number },
      // A label for end index in pagination (1-based)
      _endItemLabel: { type: Number },
      // A label for end index in pagination (1-based)
      _maxItemsLabel: { type: Number }
    };
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
    this._computeDisplay();
  }

  get columns() {
    return this._columns;
  }

  get paginate() {
    return this._paginate;
  }

  set paginate(value) {
    const old = this._paginate;
    if (old === value) {
      return;
    }
    this._paginate = value;
    this.requestUpdate('paginate', old);
    this._computeDisplay();
  }

  get page() {
    return this._page;
  }

  set page(value) {
    const old = this._page;
    if (old === value) {
      return;
    }
    this._page = value;
    this.requestUpdate('page', old);
    this._computeDisplay();
  }

  get itemsPerPage() {
    return this._itemsPerPage;
  }

  set itemsPerPage(value) {
    const old = this._itemsPerPage;
    if (old === value) {
      return;
    }
    this._itemsPerPage = value;
    this.requestUpdate('itemsPerPage', old);
    this._computeDisplay();
  }

  /**
   * Creates a data model from the `json` property.
   *
   * TODO: This should be a deep data observer to update only the portion of the model that
   * actually has changed.
   *
   * @param {Array} json
   */
  _jsonChanged(json) {
    if (!json) {
      this._display = undefined;
      this._columns = undefined;
      return;
    }
    const names = this._computeColumns(json);
    this._columns = names;
  }

  _computeDisplay() {
    const { json, paginate, page, itemsPerPage } = this;
    if (!json) {
      return;
    }
    const maxInxdex = json.length - 1;
    if (maxInxdex === -1) {
      return;
    }
    if (paginate && maxInxdex <= itemsPerPage) {
      this.paginate = false;
      return;
    }
    const startIndex = paginate ? (page * itemsPerPage) : 0;
    if (maxInxdex < startIndex) {
      return;
    }
    const endIndex = paginate ? Math.min(startIndex + itemsPerPage - 1, maxInxdex) : maxInxdex;
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      result.push(this.getItemModel(json[i]));
    }
    this._display = result;
    this._startItemLabel = startIndex + 1;
    this._endItemLabel = Math.min(endIndex + 1, maxInxdex);
    this._maxItemsLabel = maxInxdex;
  }
  /**
   * Computes the list of column names for the table.
   * It will contain all properties keys fond in the array.
   * @param {Array} json
   * @return {Array<String>}
   */
  _computeColumns(json) {
    if (this.isEnum(json)) {
      // no column names
      return;
    }
    const columnNames = [];
    json.forEach(function(value) {
      if (this.isObject(value)) {
        const names = Object.keys(value);
        for (let i = 0, len = names.length; i < len; i++) {
          if (columnNames.indexOf(names[i]) === -1) {
            columnNames.push(names[i]);
          }
        }
      }
    }, this);
    return columnNames.length ? columnNames : undefined;
  }
  // Checks if passed `item` is a primitive
  _isPrimitive(item, column) {
    if (!item || !item.value || typeof column === undefined) {
      return false;
    }
    if (!(column in item.value)) {
      return false;
    }
    const obj = item.value[column];
    return this.isPrimitive(obj);
  }

  _isObject(item, column) {
    if (!item || !item.value || typeof column === undefined) {
      return false;
    }
    if (!(column in item.value)) {
      return false;
    }
    const obj = item.value[column];
    return this.isObject(obj);
  }

  _isEnum(item, column) {
    if (!item || !item.value || typeof column === undefined) {
      return false;
    }
    if (!(column in item.value)) {
      return false;
    }
    const obj = item.value[column];
    return this.isArray(obj) && this.isEnum(obj);
  }

  _isArray(item, column) {
    if (!item || !item.value || typeof column === undefined) {
      return false;
    }
    if (!(column in item.value)) {
      return false;
    }
    const obj = item.value[column];
    return this.isArray(obj) && !this.isEnum(obj);
  }

  _getValue(item, column) {
    if (!item || !item.value || typeof column === undefined) {
      return;
    }
    if (!(column in item.value)) {
      return;
    }
    return item.value[column];
  }

  _toggleItem(e) {
    e.preventDefault();
    let cell;
    let currentElement = e.target;
    const targetAnchor = e.target;
    const templateTarget = currentElement.dataset.target;
    const test = true;
    while (test) {
      if (currentElement.nodeName === 'TD') {
        cell = currentElement;
        break;
      }
      currentElement = currentElement.parentElement;
      if (!currentElement) {
        throw new Error('Couldn\'t find table cell in the event path.');
      }
    }
    const node = cell.querySelector(`json-table-array`);
    const label = cell.querySelector(`.object-label[${templateTarget}]`);
    if (node.hasAttribute('hidden')) {
      node.removeAttribute('hidden');
      e.target.textContent = 'hide ' + templateTarget;
      label.setAttribute('hidden', true);
      targetAnchor.classList.add('active');
    } else {
      node.setAttribute('hidden', '');
      e.target.textContent = 'show ' + templateTarget;
      label.removeAttribute('hidden');
      targetAnchor.classList.remove('active');
    }
  }
  /**
   * When pagination is enabled this will increase page number.
   * This will do nothing if pagination isn't enabled or there's no next page of results to
   * display.
   * @return {Boolean}
   */
  nextPage() {
    const maxIndex = this._maxItemsLabel;
    const endIndex = this._endItemLabel;
    if (maxIndex <= endIndex) {
      return false;
    }
    this.page++;
  }
  /**
   * When pagination is enabled this will decrease page number.
   * This will do nothing if pagination isn't enabled or there's no previous page of results to
   * display.
   */
  previousPage() {
    if (!this.paginate || this.page === 0) {
      return;
    }
    this.page--;
  }
  /**
   * Computes if the previous page button for the pagination should be disabled.
   *
   * @param {Number} page Current page index
   * @return {Boolean} true if there's previous page of the results
   */
  _isDisabedPrevious(page) {
    return page === 0;
  }

  _isDisabedNext(maxItemsLabel, endItemLabel) {
    if (maxItemsLabel <= endItemLabel) {
      return true;
    }
    return false;
  }

  _computeValueSize(item, column) {
    const value = this._getValue(item, column);
    return value && value.length || 0;
  }

  _ippHandler(e) {
    this.itemsPerPage = e.detail.value;
  }
}
window.customElements.define('json-table-array', JsonTableArray);
