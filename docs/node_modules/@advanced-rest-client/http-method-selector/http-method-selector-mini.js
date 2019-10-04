/**
@license
Copyright 2017 The Advanced REST client authors <arc@mulesoft.com>
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
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import { close } from '@advanced-rest-client/arc-icons/ArcIcons.js';
/**
 * A HTTP method selector in a dropdown list of predefined HTTP methods.
 *
 * ### Example
 *
 * ```html
 * <http-method-selector-mini></http-method-selector-mini>
 * ```
 *
 * @customElement
 * @demo demo/mini.html
 * @memberof UiElements
 * @appliesMixin ArcBehaviors.EventsTargetBehavior
 * @appliesMixin ArcBehaviors.HttpMethodSelectorMixin
 */
class HttpMethodSelectorMini extends HttpMethodSelectorMixin(EventsTargetMixin(LitElement)) {
  static get styles() {
    return css`:host {
      display: block;
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

    [hidden] {
      display: none !important;
    }

    anypoint-listbox {
      box-shadow: var(--anypoiont-dropdown-shaddow);
    }

    .icon {
      display: inline-block;
      width: 24px;
      height: 24px;
      fill: currentColor;
    }`;
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
      <label slot="label">Method</label>
      <anypoint-icon-button
        aria-label="Activate to clear and close custom editor"
        title="Clear and close custom editor"
        slot="suffix"
        @click="${this.closeCustom}"
      >
        <span class="icon">${close}</span>
      </anypoint-icon-button>
    </anypoint-input>` :
    html`<anypoint-dropdown-menu
      ?opened="${methodMenuOpened}"
      ?hidden="${renderCustom}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      ?disabled="${readOnly}"
      ?nolabelfloat="${noLabelFloat}"
      @opened-changed="${this._openedHandler}">
      <label slot="label">Method</label>
      <anypoint-listbox
        slot="dropdown-content"
        .selected="${method}"
        attrforselected="data-method"
        @selected-changed="${this._methodHandler}">
        <anypoint-item ?compatibility="${compatibility}" data-method="GET">GET</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="POST">POST</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="PUT">PUT</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="DELETE">DELETE</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="PATCH">PATCH</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="HEAD">HEAD</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="CONNECT">CONNECT</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="OPTIONS">OPTIONS</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="TRACE">TRACE</anypoint-item>
        <anypoint-item ?compatibility="${compatibility}" data-method="">custom</anypoint-item>
      </anypoint-listbox>
    </anypoint-dropdown-menu>`}`;
  }
}
window.customElements.define('http-method-selector-mini', HttpMethodSelectorMini);
