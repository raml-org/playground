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

class JsonTablePrimitiveTeaser extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
      margin: 4px 0;
    }

    :host([opened]) .primitive-wrapper {
      max-height: none;
    }

    .primitive-wrapper {
      max-height: var(--json-table-primitive-teaser-max-heigth, 160px);
      overflow: hidden;
      padding: 4px 0;
    }

    *[hidden] {
      display: none !important;
    }

    .toggle {
      font-size: inherit;
      color: inherit;
      margin-top: 12px;
      display: inline-block;
    }`;
  }

  render() {
    const { _isOverflow, opened } = this;
    return html`
    <div class="primitive-wrapper">
      <slot></slot>
    </div>
    <a href="#" class="toggle" ?hidden="${!_isOverflow}" @click="${this.toggle}">${this._computeToggleLabel(opened)}</a>`;
  }

  static get properties() {
    return {
      // If true then the whole value will be visible.
      opened: {
        type: Boolean,
        reflect: true
      },
      // DOM change observer
      _observer: { type: Object },
      // if true then the content overflows the max height area.
      _isOverflow: { type: Boolean },
      // Container's max height when closed.
      maxHeight: { type: String }
    };
  }

  get _wrapper() {
    return this.shadowRoot.querySelector('.primitive-wrapper');
  }

  get maxHeight() {
    return this._maxHeight;
  }

  set maxHeight(value) {
    this._maxHeight = value;
    this._maxHeightChanged(value);
  }

  constructor() {
    super();
    this._contentChanged = this._contentChanged.bind(this);
    this.opened = false;
    this._isOverflow = false;
    this.maxHeight = '160px';
  }

  connectedCallback() {
    super.connectedCallback();
    const config = { attributes: false, childList: true, subtree: true };
    this._observer = new MutationObserver(this._contentChanged);
    this._observer.observe(this, config);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._observer) {
      this._observer.disconnect();
      this._observer = undefined;
    }
  }

  firstUpdated() {
    this._contentChanged();
  }

  _contentChanged() {
    const wrap = this._wrapper;
    if (!wrap) {
      return;
    }
    const oh = wrap.offsetHeight; // current height
    const sh = wrap.scrollHeight; // content height
    this._isOverflow = sh > oh;
  }

  toggle(e) {
    e.preventDefault();
    this.opened = !this.opened;
  }

  _computeToggleLabel(opened) {
    return opened ? 'show less' : 'show more';
  }

  _maxHeightChanged(maxHeight) {
    maxHeight = maxHeight || '160px';
    this.style.setProperty('--json-table-primitive-teaser-max-heigth', maxHeight);
  }
}
window.customElements.define('json-table-primitive-teaser', JsonTablePrimitiveTeaser);
