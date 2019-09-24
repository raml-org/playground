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
import { html, css, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import formStyles from '@api-components/api-form-mixin/api-form-styles.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@api-components/api-property-form-item/api-property-form-item.js';

/**
 * A text form item.
 *
 * If the browser has native support for FormData (and iterators) then it will also render
 * a content type selector for the input field.
 *
 * @customElement
 * @demo demo/index.html
 * @appliesMixin ValidatableMixin
 */
class MultipartTextFormItem extends ValidatableMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      formStyles,
      css`:host {
        display: block;
        flex: 1;
      }

      .multipart-item {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .mime-selector {
        position: relative;
      }

      .value-selector {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      api-property-form-item {
        flex: 1;
        margin-left: 12px;
      }

      .mime-selector anypoint-input {
        max-width: 360px;
      }

      .name-field {
        max-width: 360px;
        flex: 1;
      }`
    ];
  }

  render() {
    const {
      hasFormData,
      type,
      name,
      value,
      docsOpened,
      readOnly,
      disabled,
      compatibility,
      outlined,
    } = this;
    const model = this.model || { schema: {} };
    return html`
    <div class="multipart-item">
      ${hasFormData ? html`<div class="mime-selector">
        <anypoint-input
          class="type-field"
          .value="${type}"
          @value-changed="${this._typeHandler}"
          type="text"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          .readOnly="${readOnly}"
          .disabled=${disabled}
        >
          <label slot="label">Content type (Optional)</label>
        </anypoint-input>
      </div>` : undefined}

      <div class="value-selector">
        <anypoint-input
          class="name-field"
          invalidmessage="The name is required"
          required
          autovalidate
          .value="${name}"
          @value-changed="${this._nameHandler}"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          .readOnly="${readOnly}"
          .disabled=${disabled}
          >
            <label slot="label">Field name</label>
        </anypoint-input>
        <api-property-form-item
          class="value-field"
          .model="${model}"
          name="${name}"
          .value="${value}"
          @value-changed="${this._valueHandler}"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          .readOnly="${readOnly}"
          .disabled=${disabled}
        ></api-property-form-item>
        ${model.hasDescription ? html`<anypoint-icon-button
          class="hint-icon"
          title="Toggle documentation"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          ?disabled="${disabled}"
          @click="${this.toggleDocumentation}">
          <iron-icon icon="arc:help"></iron-icon>
        </anypoint-icon-button>` : undefined}
      </div>
    </div>

    ${docsOpened && model.hasDescription ? html`<div class="docs">
      <arc-marked .markdown="${model.description}">
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>` : undefined}`;
  }

  static get properties() {
    return {
      /**
       * Name of this control
       */
      name: { type: String },
      /**
       * Valuie of this control.
       */
      value: { type: String },
      /**
       * A view model.
       */
      model: { type: Object },
      /**
       * True to render documentation (if set in model)
       */
      docsOpened: { type: Boolean },
      /**
       * A content type of the form field to be presented in the Multipart request.
       */
      type: { type: String },
      /**
       * When set it will also renders mime type selector for the input data.
       */
      hasFormData: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
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
  
  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }
  /**
   * Toggles documentation (if available)
   */
  toggleDocumentation() {
    this.docsOpened = !this.docsOpened;
  }

  _getValidity() {
    return !!(this.name && this.value);
  }

  _typeHandler(e) {
    this._changeHandler('type', e);
  }

  _nameHandler(e) {
    this._changeHandler('name', e);
  }

  _valueHandler(e) {
    this._changeHandler('value', e);
  }

  _changeHandler(prop, e) {
    const { value } = e.detail;
    if (this[prop] === value) {
      return;
    }
    this[prop] = value;
    this.dispatchEvent(new CustomEvent(`${prop}-changed`, {
      detail: {
        value
      }
    }));
  }
}
window.customElements.define('multipart-text-form-item', MultipartTextFormItem);
