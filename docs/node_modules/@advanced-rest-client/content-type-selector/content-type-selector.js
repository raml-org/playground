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
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
/**
 * `<content-type-selector>` is an element that provides an UI for selecting common
 * content type values.
 *
 * The element do not renders a value that is not defined on the list.
 * Instead it shows the default label.
 *
 * If the content type is more complex, mening has additional information like
 * `multipart/form-data; boundary=something` then, in this case` only the
 * `multipart/form-data` is taken into the account when computing selected item.
 *
 * The element fires the `content-type-changed` custom event when the user change
 * the value in the drop down container. It is not fired when the change has not
 * beem cause by the user.
 *
 * ### Example
 * ```
 * <content-type-selector></content-type-selector>
 * ```
 *
 * The list of content type values can be extended by setting child `<anypoint-item>`
 * elements with the `data-type` attribute set to content type value.
 *
 * ### Example
 * ```
 * <content-type-selector>
 *    <anypoint-item data-type="application/zip">Zip file</anypoint-item>
 *    <anypoint-item data-type="application/7z">7-zip file</anypoint-item>
 * </content-type-selector>
 * ```
 *
 * ### Listening for content type change event
 *
 * By default the element listens for the `content-type-changed` custom event on
 * global `window` object. This can be controlled by setting the `eventsTarget`
 * property to an element that will be used as an event listeners target.
 * This way the application can scope events accepted by this element.
 *
 * This will not work for events dispatched on this element. The scoped element
 * should handle `content-type-changed` custom event and stop it's propagation
 * if appropriate.
 *
 * Once the `content-type-changed` custom event it changes value of current
 * content type on this element unless the event has been canceled.
 *
 * ### Styling
 *
 * The element support styles for `anypoint-dropdown-menu`, `anypoint-listbox` and `anypoint-item`
 *
 * @demo demo/index.html
 * @memberof UiElements
 * @appliesMixin EventsTargetMixin
 */
class ContentTypeSelector extends EventsTargetMixin(LitElement) {
  static get styles() {
    return css`
      :host {
        display: inline-block;
        margin: 12px 8px;
        height: 56px;
      }

      :host([legacy]),
      :host([nolabelfloat]) {
        height: 40px;
      }

      anypoint-dropdown-menu {
        margin: 0;
      }
    `;
  }

  render() {
    const { readOnly, disabled, legacy, outlined, noLabelFloat } = this;
    return html`
      <anypoint-dropdown-menu
        ?noLabelFloat="${noLabelFloat}"
        aria-label="Select request body content type"
        aria-expanded="false"
        .outlined="${outlined}"
        .legacy="${legacy}"
        .readOnly="${readOnly}"
        .disabled="${disabled}"
        @opened-changed="${this._handleDropdownOpened}"
      >
        <label slot="label">Body content type</label>
        <anypoint-listbox
          slot="dropdown-content"
          @iron-select="${this._contentTypeSelected}"
          .selected="${this.selected}"
          .disabled="${disabled}"
          selectable="[data-type]"
        >
          <anypoint-item .legacy="${legacy}" data-type="application/json">application/json</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="application/xml">application/xml</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="application/atom+xml">application/atom+xml</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="multipart/form-data">multipart/form-data</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="multipart/alternative">multipart/alternative</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="multipart/mixed">multipart/mixed</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="application/x-www-form-urlencoded"
            >application/x-www-form-urlencoded</anypoint-item
          >
          <anypoint-item .legacy="${legacy}" data-type="application/base64">application/base64</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="application/octet-stream"
            >application/octet-stream</anypoint-item
          >
          <anypoint-item .legacy="${legacy}" data-type="text/plain">text/plain</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="text/css">text/css</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="text/html">text/html</anypoint-item>
          <anypoint-item .legacy="${legacy}" data-type="application/javascript">application/javascript</anypoint-item>
          <slot name="item"></slot>
        </anypoint-listbox>
      </anypoint-dropdown-menu>
    `;
  }

  static get properties() {
    return {
      /**
       * A value of a Content-Type header.
       */
      contentType: { type: String },
      /**
       * Index of currently selected item.
       */
      selected: { type: Number },
      /**
       * Passes the value to the dropdown element
       */
      noLabelFloat: { type: Boolean, reflect: true },
      /**
       * Enables Anypoint legacy styling
       */
      legacy: { type: Boolean, reflect: true },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set all controls are disabled in the form
       */
      disabled: { type: Boolean }
    };
  }

  get contentType() {
    return this._contentType;
  }

  set contentType(value) {
    const old = this._contentType;
    if (old === value) {
      return;
    }
    // no need calling requestUpdate
    this._contentType = value;
    this.dispatchEvent(
      new CustomEvent('contenttype-changed', {
        detail: {
          value
        }
      })
    );
    this._contentTypeChanged(value);
  }

  get oncontenttypechanged() {
    return this._oncontenttypechanged;
  }

  set oncontenttypechanged(value) {
    if (this._oncontenttypechanged) {
      this.removeEventListener('contenttype-changed', this._oncontenttypechanged);
    }
    if (typeof value !== 'function') {
      this._oncontenttypechanged = null;
      return;
    }
    this._oncontenttypechanged = value;
    this.addEventListener('contenttype-changed', this._oncontenttypechanged);
  }

  constructor() {
    super();
    this._contentTypeHandler = this._contentTypeHandler.bind(this);
  }

  _attachListeners(node) {
    node.addEventListener('content-type-changed', this._contentTypeHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('content-type-changed', this._contentTypeHandler);
  }

  firstUpdated() {
    this._contentTypeChanged(this.contentType);
  }
  /**
   * Handles change of content type value
   *
   * @param {String} contentType New value
   */
  _contentTypeChanged(contentType) {
    this.__cancelSelectedEvents = true;
    if (!contentType) {
      this.selected = undefined;
      this.__cancelSelectedEvents = false;
      return;
    }
    const index = contentType.indexOf(';');
    if (index > 0) {
      contentType = contentType.substr(0, index);
    }
    contentType = contentType.toLowerCase();
    const supported = this.__getDropdownChildrenTypes();
    const selected = supported.findIndex((item) => item.toLowerCase() === contentType);
    if (selected !== -1) {
      this.selected = selected;
    } else {
      this.selected = undefined;
    }
    this.__cancelSelectedEvents = false;
  }

  /**
   * If the event comes from different source then this element then it
   * updates `contentType` value.
   *
   * @param {CustomEvent} e
   */
  _contentTypeHandler(e) {
    if (e.defaultPrevented || e.composedPath()[0] === this) {
      return;
    }
    const ct = e.detail.value;
    if (ct !== this.contentType) {
      this.contentType = ct;
    }
  }
  /**
   * When chanding the editor it mey require to also change the content type header.
   * This function updates Content-Type.
   *
   * @param {CustomEvent} e
   */
  _contentTypeSelected(e) {
    if (this.__cancelSelectedEvents) {
      return;
    }
    const selected = e.target.selected;
    if (this.selected !== selected) {
      this.selected = selected;
    }
    const ct = e.detail.item.dataset.type;
    if (this.contentType !== ct) {
      this.__cancelSelectedEvents = true;
      this.dispatchEvent(
        new CustomEvent('content-type-changed', {
          bubbles: true,
          composed: true,
          cancelable: false,
          detail: {
            value: ct
          }
        })
      );
      this.contentType = ct;
      this.__cancelSelectedEvents = false;
    }
  }
  /**
   * Creates a list of all content types added to this element.
   * This includes pre-existing onces and any added to loght DOM.
   *
   * @return {Array} Array of ordered content types (values of the
   * `data-type` attribute).
   */
  __getDropdownChildrenTypes() {
    let children = Array.from(this.shadowRoot.querySelectorAll('anypoint-listbox anypoint-item'));
    const slot = this.shadowRoot.querySelector('slot[name="item"]');
    if (!slot) {
      return [];
    }
    const lightChildren = slot.assignedNodes();
    children = children.concat(lightChildren);
    const result = [];
    children.forEach((item) => {
      if (!item.dataset || !item.dataset.type) {
        return;
      }
      result[result.length] = item.dataset.type;
    });
    return result;
  }

  _handleDropdownOpened(e) {
    e.target.setAttribute('aria-expanded', String(e.target.opened));
  }
  /**
   * Dispatched when selected value changes
   *
   * @event content-type-changed
   * @param {String} value New value of the content type.
   */
}
window.customElements.define('content-type-selector', ContentTypeSelector);
