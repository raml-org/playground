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
/**
 * A behavior to be implemented to elements that processes AMF data via form
 * data model and displays forms from the model.
 *
 * It contains common methods used in forms.
 *
 * Use `api-form-styles` from this package to include common styles.
 *
 * @mixinFunction
 * @param {Class} base
 * @return {Class}
 */
export const ApiFormMixin = (base) => class extends base {
  static get properties() {
    return {
      /**
       * View model to use to render the form.
       */
      model: { type: Array },
      /**
       * Set to true to show optional parameters (not required by the API).
       */
      optionalOpened: {
        type: Boolean,
        reflect: true
      },
      /**
       * Computed value from `allowHideOptional` and view model.
       * `true` if current model has any optional property.
       */
      hasOptional: { type: Boolean },
      /**
       * If set it computes `hasOptional` property and shows checkbox in the
       * form to show / hide optional properties.
       */
      allowHideOptional: { type: Boolean },
      /**
       * Computed flag to determine if optional checkbox can be rendered
       */
      renderOptionalCheckbox: { type: Boolean },
      /**
       * If set, enable / disable param checkbox is rendered next to each
       * form item.
       */
      allowDisableParams: { type: Boolean },
      /**
       * When set, renders "add custom" item button.
       * If the element is to be used withouth AMF model this should always
       * be enabled. Otherwise users won't be able to add a parameter.
       */
      allowCustom: { type: Boolean },
      /**
       * Renders items in "narrow" view
       */
      narrow: { type: Boolean },
      /**
       * Computed value. The form renders empty message (if supported by
       * the form element). It occurs when model is not set and allowCustom
       * is not set
       */
      renderEmptyMessage: { type: Boolean }
    };
  }

  get model() {
    return this._model;
  }

  set model(value) {
    if (this._sop('model', value)) {
      this._notifyChanged('model', value);
      this.renderEmptyMessage = this._computeRenderEmptyMessage(this.allowCustom, value);
      this.hasOptional = this._computeHasOptionalParameters(this.allowHideOptional, value);
    }
  }

  get allowCustom() {
    return this._allowCustom;
  }

  set allowCustom(value) {
    if (this._sop('allowCustom', value)) {
      this.renderEmptyMessage = this._computeRenderEmptyMessage(value, this.model);
    }
  }

  get allowHideOptional() {
    return this._allowHideOptional;
  }

  set allowHideOptional(value) {
    if (this._sop('allowHideOptional', value)) {
      this.hasOptional = this._computeHasOptionalParameters(value, this.model);
      this.renderOptionalCheckbox = this._computeRenderCheckbox(value, this.hasOptional);
    }
  }

  get hasOptional() {
    return this._hasOptional;
  }

  set hasOptional(value) {
    if (this._sop('hasOptional', value)) {
      this._notifyChanged('hasOptional', value);
      this.renderOptionalCheckbox = this._computeRenderCheckbox(this.allowHideOptional, value);
    }
  }

  constructor() {
    super();
    this.renderEmptyMessage = true;
  }

  _sop(prop, value) {
    const key = `_${prop}`;
    const old = this[key];
    if (old === value) {
      return false;
    }
    this[key] = value;
    if (this.requestUpdate) {
      this.requestUpdate(prop, old);
    }
    return true;
  }

  _notifyChanged(prop, value) {
    this.dispatchEvent(new CustomEvent(prop + '-changed', {
      composed: true,
      detail: {
        value
      }
    }));
  }
  /**
   * Computes class name for each form item depending on the item state.
   *
   * @param {Object} item Model item
   * @param {Boolean} allowHideOptional
   * @param {Boolean} optionalOpened True if optional parameters are rendered.
   * @param {Boolean} allowDisableParams
   * @return {String}
   */
  computeFormRowClass(item, allowHideOptional, optionalOpened, allowDisableParams) {
    let clazz = 'param-value';
    if (item && item.required) {
      clazz += ' required';
    } else if (allowHideOptional) {
      clazz += ' optional';
    }
    if (optionalOpened) {
      clazz += ' with-optional';
    }
    if (allowDisableParams) {
      clazz += ' has-enable-button';
    }
    return clazz;
  }
  /**
   * Toggles visibility of optional parameters.
   */
  toggleOptionalParams() {
    if (!this.allowHideOptional) {
      return;
    }
    this.optionalOpened = !this.optionalOpened;
  }

  /**
   * Returns a reference to the form element, if the DOM is ready.
   * This only works with `iron-form` that is in the DOM.
   *
   * @return {IronForm} Iron form element. It may be `undefined` if local
   * DOM is not yet initialized.
   */
  _getForm() {
    if (!this.__form && this.shadowRoot) {
      this.__form = this.shadowRoot.querySelector('iron-form');
    }
    return this.__form;
  }
  /**
   * Validates the form. It uses `iron-form`'s `validate()` function to
   * perform the validation.
   * @return {Boolean} Validation result or `true` if DOM is not yet ready.
   */
  _getValidity() {
    const form = this._getForm();
    if (!form) {
      return true;
    }
    return form.validate();
  }
  /**
   * Link to the form's serialize function.
   * @return {Object} Serialized form values or `undefined` if DOM is not ready.
   * Note, `undefined` is returned **only** if DOM is not yet ready.
   */
  serializeForm() {
    const form = this._getForm();
    if (!form) {
      return;
    }
    return form.serializeForm();
  }
  /**
   * Computes if any of the parameters are required.
   * It iterates over the model to find any first element that has `required`
   * propeerty set to `false`.
   *
   * @param {Boolean} allowHideOptional State of `allowHideOptional` property.
   * If `false` this function always returns `false`.
   * @param {Object} model Current model
   * @return {Boolean} `true` if model has at leas one alement that is not required.
   */
  _computeHasOptionalParameters(allowHideOptional, model) {
    if (!allowHideOptional || !model) {
      return false;
    }
    return model.some((item) => item.required === false);
  }
  /**
   * Computes value for `renderOptionalCheckbox` property.
   *
   * @param {Boolean} render Value of `allowHideOptional` property
   * @param {Boolean} has Value of `hasOptional` property.
   * @return {Boolean} True if both values are `true`.
   */
  _computeRenderCheckbox(render, has) {
    return render && has;
  }
  /**
   * Computes if given model item is a custom property (not generated by
   * AMF model transformation).
   * @param {Object} model Model item.
   * @return {Boolean} `true` if `isCustom` property is set on model's schema
   * property.
   */
  _computeIsCustom(model) {
    if (!model || !model.schema || !model.schema.isCustom) {
      return false;
    }
    return true;
  }
  /**
   * Adds empty custom property to the list.
   *
   * It dispatches `api-property-model-build` custom event that is handled by
   * `api-view-model-transformer` to build model item.
   * This assumem that the transformer element is already in the DOM.
   *
   * After the transformation the element pushes or sets the data to the
   * `model`.
   *
   * @param {String} binding Value if the `binding` property.
   * @param {Object} opts Additional options:
   * - inputLabel {String} - Forces a label of the input
   */
  addCustom(binding, opts) {
    if (!opts) {
      opts = {};
    }
    const e = new CustomEvent('api-property-model-build', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        name: opts.name || '',
        value: opts.value || '',
        binding: binding,
        schema: {
          enabled: true,
          isCustom: true,
          inputLabel: opts.inputLabel || undefined
        }
      }
    });
    this.dispatchEvent(e);
    const model = this.model || [];
    this.model = [...model, e.detail];
    this.optionalOpened = true;
  }
  /**
   * Removes custom item from the UI.
   * This can only be called from `dom-repeat` element so it contain's
   * `model` property.
   *
   * @param {CustomEvent} e
   */
  _removeCustom(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index !== index) {
      return;
    }
    const model = this.model;
    if (!model || !model.length) {
      return;
    }
    model.splice(index, 1);
    this.model = Array.from(model);
  }
  /**
   * Computes if model item is optional.
   * The items is always optional if is not required and when `hasOptional`
   * is set to `true`.
   *
   * @param {Boolean} hasOptional [description]
   * @param {Object} model Model item.
   * @return {Boolean} `true` if the model item is optional in the form.
   */
  computeIsOptional(hasOptional, model) {
    if (!hasOptional) {
      return false;
    }
    if (!model || !model.required) {
      return true;
    }
    return false;
  }
  /**
   * Computes value for `renderEmptyMessage`.
   *
   * @param {Boolean} allowCustom True if the form allows to add custom values.
   * @param {?Array} model Current model
   * @return {Boolean} `true` when allowCustom is falsy set and model is empty
   */
  _computeRenderEmptyMessage(allowCustom, model) {
    return !allowCustom && !model;
  }
};
