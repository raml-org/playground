/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
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
import { html, css, LitElement } from 'lit-element';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import { HttpMethodSelectorMixin } from './http-method-selector-mixin.js';
import '@anypoint-web-components/anypoint-radio-button/anypoint-radio-group.js';
import '@anypoint-web-components/anypoint-radio-button/anypoint-radio-button.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@polymer/iron-icon/iron-icon.js';
/**
 * A HTTP method selector.
 *
 * Displays list of radio buttons with common
 * http methods and a dropdown with less common but still valid methods.
 *
 * User can define his own methos whe selects "custom" option in the dropdown menu.
 * Because of this the element do not support validation of any kind and hosting
 * application should provide one if required.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof UiElements
 * @appliesMixin EventsTargetMixin
 * @appliesMixin HttpMethodSelectorMixin
 */
class HttpMethodSelector extends HttpMethodSelectorMixin(EventsTargetMixin(LitElement)) {
  static get styles() {
    return css`
    :host {
      display: inline-flex;
      align-items: center;
      flex-direction: row;
    }

    :host > * {
      vertical-align: middle;
    }

    anypoint-dropdown-menu,
    anypoint-input {
      margin: 12px 8px;
    }

    anypoint-dropdown-menu {
      width: var(--http-method-selector-mini-dropdown-width, 100px);
    }

    .custom-name {
      width: var(--http-method-selector-mini-input-width, 100px);
    }

    #closeCustom {
      padding: 0;
      width: 24px;
      height: 24px;
    }

    [hidden] {
      display: none !important;
    }

    anypoint-listbox {
      box-shadow: var(--anypoiont-dropdown-shaddow);
    }
    `;
  }

  _radioSelection(e) {
    this.method = e.detail.value;
  }

  render() {
    const {
      method,
      compatibility,
      outlined,
      readOnly,
      methodMenuOpened,
      renderCustom,
      noLabelFloat
    } = this;
    return html`
    <anypoint-radio-group
      .selected="${method}"
      @selected-changed="${this._radioSelection}"
      ?disabled="${readOnly}"
      attrforselected="name"
      aria-label="Select one of predefined HTTP methods">
      <anypoint-radio-button ?disabled="${readOnly}" name="GET">GET</anypoint-radio-button>
      <anypoint-radio-button ?disabled="${readOnly}" name="POST">POST</anypoint-radio-button>
      <anypoint-radio-button ?disabled="${readOnly}" name="PUT">PUT</anypoint-radio-button>
      <anypoint-radio-button ?disabled="${readOnly}" name="DELETE">DELETE</anypoint-radio-button>
      <anypoint-radio-button ?disabled="${readOnly}" name="PATCH">PATCH</anypoint-radio-button>
    </anypoint-radio-group>

    <anypoint-dropdown-menu
      ?opened="${methodMenuOpened}"
      ?hidden="${renderCustom}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      ?disabled="${readOnly}"
      ?nolabelfloat="${noLabelFloat}"
      aria-label="Select one of predefined other HTTP methods. Select custom to set custom method"
      @opened-changed="${this._openedHandler}">
      <label slot="label">Other</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${method}"
        attrforselected="data-method"
        @selected-changed="${this._methodHandler}">
        <anypoint-item ?compatibility="${compatibility}" data-method="HEAD">HEAD</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="CONNECT">CONNECT</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="OPTIONS">OPTIONS</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="TRACE">TRACE</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="">custom</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    ${renderCustom ? html`<anypoint-input
      class="custom-name"
      required
      autovalidate
      .value="${method}"
      @value-changed="${this._methodHandler}"
      ?disabled="${readOnly}"
      nolabelfloat
      ?readonly="${readOnly}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}">
      <label slot="label">Custom method</label>
      <anypoint-icon-button
        aria-label="Activate to clear and close custom editor"
        title="Clear and close custom editor"
        slot="suffix"
        @click="${this.closeCustom}">
        <iron-icon icon="arc:close"></iron-icon>
      </anypoint-icon-button>
    </anypoint-input>` : undefined}`;
  }
}
window.customElements.define('http-method-selector', HttpMethodSelector);
