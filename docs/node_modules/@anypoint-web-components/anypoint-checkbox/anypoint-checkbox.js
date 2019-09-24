import { LitElement, html, css } from 'lit-element';
import {
  ButtonStateMixin,
  ControlStateMixin
} from '@anypoint-web-components/anypoint-control-mixins/anypoint-control-mixins.js';
import { CheckedElementMixin } from '@anypoint-web-components/anypoint-form-mixins/anypoint-form-mixins.js';
/**
 * `anypoint-checkbox`
 * Anypoint styled checkbox
 *
 * `<anypoint-checkbox>` is a button that can be either checked or unchecked.
 * User can tap the checkbox to check or uncheck it.  Usually you use checkboxes
 * to allow user to select multiple options from a set.
 * Avoid using a single checkbox as an option selector and use toggle button intead.
 *
 * ### Example
 *
 * ```html
 * <anypoint-checkbox>label</anypoint-checkbox>
 * <anypoint-checkbox checked>label</anypoint-checkbox>
 * ```
 *
 * ### Using with forms
 *
 * ```
 * npm i --save @polymer/iron-form
 * ```
 *
 * ```html
 * <script type="module">
 * import 'node_modules/@polymer/iron-form';
 * </script>
 * <iron-form>
 *  <form>
 *    <anypoint-checkbox name="subscribe" value="newsletetr">Subsceribe to our newsletter</anypoint-checkbox>
 *    <anypoint-checkbox name="tems" value="accepted" checked>Agree to terms and conditions</anypoint-checkbox>
 *    <anypoint-checkbox name="disabled" value="noop" disabled>This is never included</anypoint-checkbox>
 *  </form>
 * </iron-form>
 * <script>
 * const values = document.querySelector('iron-form').serializeForm();
 * console.log(values);
 * </script>
 * ```
 *
 * ### Styling
 *
 * `<anypoint-checkbox>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--anypoint-checkbox-input-border-bolor` | Border color of the checkbox input square | `--anypoint-color-aluminum4`
 * `--anypoint-checkbox-label-color` | A color of the label. | ` --anypoint-color-steel1`
 * `--anypoint-checkbox-label` | Mixin applied to the label | ``
 * `--anypoint-checkbox-label-checked-color` | Color of checked label | `--anypoint-color-steel1`
 * `--anypoint-checkbox-label-checked` | Mixin applie dto checked label | ``
 * `--anypoint-checkbox-unchecked-color` | Color of a label of unchecked checkbox | `--anypoint-color-steel1`
 * `--anypoint-checkbox-error-color` | Color of error state | `--anypoint-color-danger`
 * `--anypoint-checkbox-label-spacing` | Spacing between the label and the checkbox | `0`
 *
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof AnypointUi
 */
class AnypointCheckbox extends ButtonStateMixin(ControlStateMixin(CheckedElementMixin(LitElement))) {
  static get styles() {
    return css`:host {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      cursor: pointer;
      line-height: 0;
      -webkit-tap-highlight-color: transparent;
    }

    :host([hidden]) {
      display: none !important;
    }

    :host([disabled]),
    :host([formdisabled]) {
      cursor: auto;
      pointer-events: none;
      user-select: none;
    }

    :host(:focus) {
      outline: none;
    }

    .hidden {
      display: none !important;
    }

    .checkboxContainer {
      display: inline-block;
      position: relative;
      vertical-align: middle;
      padding: 12px;
    }

    .checkboxContainer:hover:before,
      :host([focused]) .checkboxContainer:before {
      top: 0%;
      left: 0%;
      width: 100%;
      height: 100%;
      opacity: .04;
      background-color: var(--anypoint-checkbox-checked-color, var(--anypoint-color-primary));
      pointer-events: none;
      content: "";
      border-radius: 50%;
      position: absolute;
    }

    :host([disabled]) .checkboxContainer:before,
    :host([formdisabled]) .checkboxContainer:before {
      display: none;
    }

    :host([focused]) .checkboxContainer:before {
      opacity: .12;
    }

    .checkbox {
      position: relative;
      box-sizing: border-box;
      pointer-events: none;
      border-width: 1px;
      border-style: solid;
      border-color: var(--anypoint-checkbox-input-border-color, var(--anypoint-color-aluminum4));
      border-radius: 2px;
      -webkit-transition: box-shadow .3s linear;
      transition: box-shadow .3s linear;
      display: inline-block;
      vertical-align: text-top;
      width: 20px;
      height: 20px;
      -webkit-transition: background-color .17s ease-out;
      transition: background-color .17s ease-out;
    }

    .checkmark {
      transition: top .15s ease-in-out, height .2s ease-in-out, width .3s ease-in-out;
      will-change: top, width, height;
      position: absolute;
      display: block;
      left: 4px;
    }

    :host([checked]) .checkmark {
      border-color: var(--anypoint-checkbox-checkmark-color, var(--anypoint-color-tertiary));
      border-style: none none solid solid;
      border-width: 3px;
      height: 5px;
      top: 3px;
      transform: rotate(-45deg);
      width: 8px;
      background: transparent;
    }

    .checkboxLabel {
      position: relative;
      display: inline-block;
      vertical-align: middle;
      white-space: normal;
      line-height: normal;
      color: var(--anypoint-checkbox-label-color, var(--anypoint-color-steel1));
    }

    :host-context([dir="rtl"]) .checkboxLabel {
      padding-right: var(--anypoint-checkbox-label-spacing, 5px);
      padding-left: 0;
    }

    :host([checked]) .checkbox,
    :host(:not([checked])[indeterminate]) .checkbox {
      background-color: var(--anypoint-checkbox-checked-color, var(--anypoint-color-primary));
      border-color: var(--anypoint-checkbox-checked-input-border-color, var(--anypoint-color-primary));
    }

    :host(:not([checked])[indeterminate]) .checkmark {
      background-color: var(--anypoint-checkbox-checkmark-color, var(--anypoint-color-tertiary));
      height: 3px;
      width: 10px;
      top: calc(50% - 1px);
      border: none;
    }


    :host([checked]) .checkboxLabel {
      color: var(--anypoint-checkbox-label-checked-color,
        var(--anypoint-checkbox-label-color, var(--anypoint-color-steel1)));
    }

    .checkboxLabel[hidden] {
      display: none;
    }

    :host([disabled]) .checkbox,
    :host([formdisabled]) .checkbox {
      opacity: 0.5;
      border-color: var(--anypoint-checkbox-unchecked-color,
        var(--anypoint-checkbox-label-color, var(--anypoint-color-steel1)));
    }

    :host([disabled][checked]) .checkbox,
    :host([formdisabled][checked]) .checkbox {
      background-color: var(--anypoint-checkbox-unchecked-color,
        var(--anypoint-checkbox-label-color, var(--anypoint-color-steel1)));
      opacity: 0.5;
    }

    :host([disabled]) .checkboxLabel,
    :host([formdisabled]) .checkboxLabel {
      opacity: 0.65;
    }

    /* invalid state */
    .checkbox.invalid:not(.checked),
    :host(:invalid) .checkbox {
      border-color: var(--anypoint-checkbox-error-color, var(--anypoint-color-danger));
    }`;
  }

  render() {
    const { checked, invalid, indeterminate } = this;
    return html`
      <div class="checkboxContainer">
        <div class="checkbox ${this._computeCheckboxClass(checked, invalid)}">
          <div class="checkmark ${this._computeCheckmarkClass(checked, indeterminate)}"></div>
        </div>
      </div>
      <label class="checkboxLabel"><slot></slot></label>`;
  }

  static get formAssociated() {
    return true;
  }

  get form() {
    return this._internals && this._internals.form;
  }

  static get properties() {
    return {
      ariaActiveAttribute: { type: String },

      indeterminate: { type: Boolean, reflect: true },

      formDisabled: { type: Boolean, reflect: true }
    };
  }

  constructor() {
    super();
    this.ariaActiveAttribute = 'aria-checked';
    this.checked = false;
    /* to work with iron-form */
    this._hasIronCheckedElementBehavior = true;
    if (this.attachInternals) {
      this._internals = this.attachInternals();
    }
  }

  connectedCallback() {
    // button state mixin sets role to checkbox
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'checkbox');
    }
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.hasAttribute('aria-checked')) {
      this.setAttribute('aria-checked', 'false');
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
  }

  _computeCheckboxClass(checked, invalid) {
    let className = '';
    if (checked) {
      className += 'checked ';
    }
    if (invalid) {
      className += 'invalid';
    }
    return className.trim();
  }

  _computeCheckmarkClass(checked, indeterminate) {
    if (!checked && indeterminate) {
      return '';
    }
    return checked ? '' : 'hidden';
  }
  /**
   * Synchronizes the element's `active` and `checked` state.
   */
  _buttonStateChanged() {
    if (this.disabled || this.indeterminate) {
      return;
    }
    this.checked = this.active;
  }

  _clickHandler() {
    if (this.disabled) {
      return;
    }
    if (this.indeterminate) {
      this.indeterminate = false;
    }
    this.active = !this.active;
  }

  _checkedChanged(value) {
    super._checkedChanged(value);
    if (this.indeterminate) {
      this.indeterminate = false;
    }
    this.setAttribute('aria-checked', value ? 'true' : 'false');
    if (this._internals) {
      this._internals.setFormValue(value ? this.value : '');

      if (!this.matches(':disabled') && this.hasAttribute('required') && !value) {
        this._internals.setValidity({
          customError: true
        }, 'This field is required.');
      } else {
        this._internals.setValidity({});
      }
    } else {
      this.validate();
    }
  }

  _spaceKeyDownHandler(e) {
    if (this.indeterminate) {
      this.indeterminate = false;
    }
    super._spaceKeyDownHandler(e);
  }

  checkValidity() {
    return this._internals ? this._internals.checkValidity() :
      this.required ? this.checked : true;
  }

  formDisabledCallback(disabled) {
    this.formDisabled = disabled;
  }

  formResetCallback() {
    this.checked = false;
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state) {
    this._internals.setFormValue(state);
    this.checked = !!state;
  }
  /**
   * Fired when the checked state changes due to user interaction.
   *
   * @event change
   */
  /**
   * Fired when the checked state changes.
   *
   * @event iron-change
   */
}

window.customElements.define('anypoint-checkbox', AnypointCheckbox);
