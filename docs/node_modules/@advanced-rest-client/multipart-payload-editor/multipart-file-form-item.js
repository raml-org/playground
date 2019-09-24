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
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
/**
 * A file form item.
 *
 * @customElement
 * @demo demo/index.html
 * @appliesMixin ValidatableMixin
 */
class MultipartFileFormItem extends ValidatableMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      formStyles,
      css`:host {
        display: block;
        flex: 1;
      }

      *[hidden] {
        display: none !important;
      }

      .file-row {
        margin: 8px 0;
      }

      .controls {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex: 1;
      }

      .controls > *:not(:last-child) {
        margin-right: 12px;
      }

      .file-trigger,
      .param-name {
        margin-right: 12px;
      }

      .files-counter-message {
        color: var(--multipart-file-form-item-counter-color, rgba(0, 0, 0, 0.74));
        flex: 1;
        font-size: var(--arc-font-body1-font-size);
        font-weight: var(--arc-font-body1-font-weight);
        line-height: var(--arc-font-body1-line-height);
      }

      .name-field {
        max-width: 360px;
        flex: 1;
      }`
    ];
  }

  render() {
    const {
      name,
      value,
      docsOpened,
      readOnly,
      disabled,
      compatibility,
      outlined,
      _hasFile
    } = this;
    const model = this.model || { };
    return html`
    <div class="file-row">
      <div class="controls">
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

        <anypoint-button
          emphasis="high"
          @click="${this._selectFile}"
          class="file-trigger"
          ?disabled="${disabled || readOnly}">Choose file</anypoint-button>

        ${_hasFile ?
          html`<span
          class="files-counter-message">
            ${value.name} (${value.size} bytes)
          </span>` : undefined}

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

      ${docsOpened && model.hasDescription ? html`<div class="docs">
        <arc-marked .markdown="${model.description}">
          <div slot="markdown-html" class="markdown-body"></div>
        </arc-marked>
      </div>` : undefined}
    </div>

    <input type="file" hidden @change="${this._fileObjectChanged}" accept="${this._computeAccept(model)}">`;
  }


  static get properties() {
    return {
      /**
       * Computed value, true if the control has a file.
       */
      _hasFile: { type: Boolean },
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

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._value = value;
    this._hasFile = this._computeHasFile(value);
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * Toggles documentation (if available)
   */
  toggleDocumentation() {
    this.docsOpened = !this.docsOpened;
  }

  _getValidity() {
    return !!(this.name && this.value instanceof Blob);
  }
  /**
   * Tests if current value is a type of `Blob`.
   *
   * @param {String|Blob|File|undefined} value Value to test
   * @return {Boolean}
   */
  _computeHasFile(value) {
    return !!(value && value instanceof Blob);
  }

  /**
   * A handler to choose file button click.
   * This function will find a proper input[type="file"] and programatically click on it to open
   * file dialog.
   */
  _selectFile() {
    const file = this.shadowRoot.querySelector('input[type="file"]');
    file.click();
  }

  /**
   * A handler to file change event for input[type="file"].
   * This will update files array for corresponding `this.filesList` array object.
   *
   * @param {Event} e
   */
  _fileObjectChanged(e) {
    const [file] = e.target.files;
    this.value = file;
  }
  /**
   * Computes the `accept`attribute for file input.
   *
   * @param {Object} model
   * @return {String}
   */
  _computeAccept(model) {
    if (!model) {
      return;
    }
    let types;
    if (model.fileTypes && model.fileTypes.length && typeof model.fileTypes[0] === 'string') {
      types = model.fileTypes;
    } else if (model.fixedFacets && model.fixedFacets.fileTypes && model.fixedFacets.fileTypes.length) {
      types = model.fixedFacets.fileTypes;
    }
    if (types) {
      return types.join(',');
    }
  }

  _nameHandler(e) {
    const { value } = e.detail;
    this.name = value;
    this.dispatchEvent(new CustomEvent('name-changed', {
      detail: {
        value
      }
    }));
  }
}
window.customElements.define('multipart-file-form-item', MultipartFileFormItem);
