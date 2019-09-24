/**
@license
Copyright 2019 The Advanced REST client authors <arc@mulesoft.com>
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
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import formStyles from '@api-components/api-form-mixin/api-form-styles.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@api-components/api-property-form-item/api-property-form-item.js';

/**
 * An element that renders form controls for the editor.
 *
 * @customElement
 * @demo demo/simple.html Simple usage
 * @demo demo/raml.html With AMF model from RAML file
 * @memberof UiElements
 */
class FormDataEditorItem extends LitElement {
  static get styles() {
    return [
      markdownStyles,
      formStyles,
      css`:host {
        display: block;
        outline: none;
      }

      .custom-inputs,
      .value-field {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .narrow .custom-inputs {
        display: block;
      }

      .value-field,
      .param-name,
      .custom-inputs,
      api-property-form-item {
        flex: 1;
      }

      api-property-form-item[isarray] {
        margin-top: 8px;
      }

      .narrow .param-name {
        margin-right: 0;
      }

      [hidden] {
        display: none !important;
      }`
    ];
  }

  _customTemplate() {
    const {
      name,
      value,
      readOnly,
      disabled,
      compatibility,
      outlined
    } = this;
    return html`<div class="custom-inputs">
      <anypoint-input
        name="custom-name"
        .value="${name}"
        @value-changed="${this._nameChangeHandler}"
        class="param-name"
        type="text"
        required
        autovalidate
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        .readOnly="${readOnly}"
        .disabled=${disabled}>
        <label slot="label">Parameter name</label>
      </anypoint-input>

      <anypoint-input
        .name="${name}"
        .value="${value}"
        @value-changed="${this._valueChangeHandler}"
        class="param-value"
        type="text"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        .readOnly="${readOnly}"
        .disabled=${disabled}>
        <label slot="label">Parameter value</label>
      </anypoint-input>
    </div>

    <anypoint-icon-button
      title="Remove this parameter"
      aria-label="Press to remove parameter ${name}"
      class="action-icon delete-icon"
      @click="${this._remove}"
      slot="suffix"
      ?disabled="${readOnly || disabled}"
      ?outlined="${outlined}"
      ?compatibility="${compatibility}">
      <iron-icon icon="arc:remove-circle-outline"></iron-icon>
    </anypoint-icon-button>`;
  }

  _modelTemplate(model, hasDocs, noDocs) {
    const {
      name,
      value,
      readOnly,
      disabled,
      compatibility,
      outlined,
      narrow,
      required
    } = this;
    return html`<div class="value-field">
      <api-property-form-item
        data-type="typed"
        name="${name}"
        .value="${value}"
        @value-changed="${this._valueChangeHandler}"
        .model="${model}"
        ?required="${required}"
        .readOnly="${readOnly}"
        .disabled=${disabled}
        ?narrow="${narrow}"
        .noDocs="${noDocs}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ></api-property-form-item>
      ${hasDocs ? html`<anypoint-icon-button
        class="hint-icon"
        title="Toggle documentation"
        aria-label="Press to toggle documentation for this property"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?disabled="${disabled}"
        @click="${this._toggleItemDocs}">
        <iron-icon icon="arc:help"></iron-icon>
      </anypoint-icon-button>` : undefined}
    </div>`;
  }

  render() {
    const {
      narrow,
      isCustom,
      docsOpened,
      noDocs,
      model
    } = this;
    const hasDocs = this._computeHasDocumentation(noDocs, model);
    const renderDocs = !noDocs && hasDocs && !!docsOpened;

    return html`
    <div class="form-item${narrow ? ' narrow' : ''}">
      ${isCustom ? this._customTemplate() : this._modelTemplate(model, hasDocs, noDocs)}
    </div>
    ${renderDocs ? html`<div class="docs">
      <arc-marked .markdown="${this._computeDocumentation(model)}">
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>` : undefined}`;
  }

  static get properties() {
    return {
      /**
       * The name of this element.
       */
      name: { type: String },
      /**
       * The value of this element.
       */
      value: { type: String },
      /**
       * A model item
       */
      model: { type: Object },
      /**
       * If set it renders a narrow layout
       */
      narrow: { type: Boolean, reflect: true },
      /**
       * True to render documentation (if set in model)
       */
      docsOpened: { type: Boolean },
      /**
       * Set if the header is not specified in the RAML type (is a custom
       * header).
       */
      isCustom: { type: Boolean },
      /**
       * If set it is render the item control as an array item (adds more
       * spacing to the element)
       */
      isArray: { type: Boolean, reflect: true },
      /**
       * Prohibits rendering of the documentation (the icon and the
       * description).
       */
      noDocs: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true },
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
      disabled: { type: Boolean },
      /**
       * When set a model generated item is maked as required.
       */
      required: { type: Boolean }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  constructor() {
    super();
    this.focus = this.focus.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.addEventListener('focus', this.focus);
    this.setAttribute('tabindex', '0');
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.removeEventListener('focus', this.focus);
  }
  /**
   * Focuses on name input (custom value) or the value input (model value).
   */
  focus() {
    let node;
    if (this.isCustom) {
      node = this.shadowRoot.querySelector('.param-name');
      if (node) {
        node = node.inputElement;
      }
    } else {
      node = this.shadowRoot.querySelector('api-property-form-item');
    }
    if (node) {
      node.focus();
    }
  }

  /**
   * Dispatches `remove` custom event that does not bubbles to inform the editor
   * to delete this parameter.
   */
  _remove() {
    this.dispatchEvent(new CustomEvent('remove'));
  }
  /**
   * Computes documentation as a markdown to be placed in the `marked-element`
   * @param {Object} item View model
   * @return {String}
   */
  _computeDocumentation(item) {
    let docs = '';
    if (item.description) {
      docs += item.description;
    }
    if (!item.schema) {
      return docs;
    }
    const schema = item.schema;
    if (docs) {
      docs += '\n\n\n';
    }
    if (schema.pattern) {
      docs += '- Pattern: `' + schema.pattern + '`\n';
    }
    if (schema.examples && schema.examples.length) {
      schema.examples.forEach((item) => {
        if (!item.value) {
          return;
        }
        docs += '- Example';
        if (item.hasName) {
          docs += ' ' + item.name;
        }
        docs += ': `' + item.value + '`\n';
      });
    }
    return docs;
  }
  /**
   * Computes if model item has documentation to display.
   * @param {Boolean} noDocs If set it always cancels docs
   * @param {Object} item Model item
   * @return {Boolean} True if documentation can be rendered.
   */
  _computeHasDocumentation(noDocs, item) {
    if (noDocs || !item) {
      return false;
    }
    if (item.hasDescription) {
      return true;
    }
    if (!item.schema) {
      return false;
    }
    const schema = item.schema;
    if (schema.pattern) {
      return true;
    }
    if (schema.examples && schema.examples.length && schema.examples[0].value) {
      return true;
    }
    return false;
  }

  _valueChangeHandler(e) {
    const { value } = e.detail;
    this.value = value;
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: {
        value
      }
    }));
  }

  _nameChangeHandler(e) {
    const { value } = e.detail;
    this.name = value;
    this.dispatchEvent(new CustomEvent('name-changed', {
      detail: {
        value
      }
    }));
  }

  _toggleItemDocs() {
    this.docsOpened = !this.docsOpened;
  }
}
window.customElements.define('form-data-editor-item', FormDataEditorItem);
