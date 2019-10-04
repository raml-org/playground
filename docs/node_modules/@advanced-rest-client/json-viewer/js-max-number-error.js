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
import { LitElement, html, css } from 'lit-element';
import '@polymer/iron-collapse/iron-collapse.js';
import { info } from '@advanced-rest-client/arc-icons/ArcIcons.js';
/* eslint-disable max-len */
class JsMaxNumberError extends LitElement {
  static get styles() {
    return css`:host {
      display: inline-block;
      vertical-align: text-bottom;
    }

    .parsed-value ::slot > * {
      color: #D32F2F;
      font-weight: 500;
    }

    .content {
      display: flex;
      flex-direction: row;
      align-items: center;
      color: #D32F2F;
      font-weight: 500;
      cursor: pointer;
    }

    .icon {
      height: 18px;
      width: 18px;
      margin-right: 8px;
      display: inline-block;
      fill: currentColor;
    }

    #collapse {
      white-space: initial;
      font-size: var(--arc-font-body2-font-size);
      font-weight: var(--arc-font-body2-font-weight);
      line-height: var(--arc-font-body2-line-height);
      color: rgba(0, 0, 0, 0.74);
    }

    p {
      margin: 0;
    }

    .message {
      padding: 12px;
      background-color: #FFECB3;
      margin: 12px 24px;
    }

    .expected {
      font-weight: 700;
    }`;
  }


  render() {
    return html`
    <div
      class="content"
      @click="${this.toggle}"
    >
      <span class="icon">${info}</span>
      <div class="parsed-value">
        <slot></slot>
      </div>
    </div>
    <iron-collapse>
      <div class="message">
        <p>The number used in the response is unsafe in JavaScript environment and therefore as a JSON value.</p>
        <p>Original value for the number (represented as string) is <span class="expected">"${this.expectedNumber}"</span></p>
        <p>This number will not work in web environment and should be passed as a string, not a number.</p>
        <p><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER" target="_blank">Read more about numbers in JavaScript</a>.</p>
      </div>
    </iron-collapse>`;
  }

  static get properties() {
    return {
      // A number that is expected to be true.
      expectedNumber: { type: String }
    };
  }

  constructor() {
    super();
    this.expectedNumber = '[unknown]';
    this._keyDown = this._keyDown.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', 0);
    this.setAttribute('aria-expanded', 'false');
    this.setAttribute('aria-label', 'Activate to see warning details');
    this.addEventListener('keydown', this._keyDown);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.removeEventListener('keydown', this._keyDown);
  }

  // Toggles the collapse element.
  toggle() {
    const node = this.shadowRoot.querySelector('iron-collapse');
    node.toggle();
    if (node.opened) {
      this.setAttribute('aria-expanded', 'true');
    } else {
      this.setAttribute('aria-expanded', 'false');
    }
  }

  _keyDown(e) {
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
      e.preventDefault();
      this.toggle();
    }
  }
}
window.customElements.define('js-max-number-error', JsMaxNumberError);
