import { LitElement, html, css } from 'lit-element';
import { CheckedElementMixin } from '@anypoint-web-components/anypoint-form-mixins/anypoint-form-mixins.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
/**
 * `anypoint-radio-button`
 *
 * Anypoint styled radio button.
 *
 * ## Usage
 *
 * Install element:
 *
 * ```
 * npm i --save @anypoint-components/anypoint-radio-button
 * ```
 *
 * Import into your app:
 *
 * ```html
 * <script type="module" src="node_modules/@anypoint-components/anypoint-radio-button.js"></script>
 * ```
 *
 * Or into another component
 *
 * ```javascript
 * import '@anypoint-components/anypoint-radio-button.js';
 * ```
 *
 * Use it:
 *
 * ```html
 * <paper-radio-group selectable="anypoint-radio-button">
 *  <anypoint-radio-button name="a">Apple</anypoint-radio-button>
 *  <anypoint-radio-button name="b">Banana</anypoint-radio-button>
 *  <anypoint-radio-button name="c">Orange</anypoint-radio-button>
 * </paper-radio-group>
 * ```
 *
 * ### Styling
 *
 * `<anypoint-radio-button>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--anypoint-radio-button-radio-container` | A mixin applied to the internal radio container | `{}`
 * `--anypoint-radio-button-unchecked-color` | Border color of unchecked button | `--anypoint-color-aluminum5`
 * `--anypoint-radio-button-unchecked-background-color` | Unchecked button background color | `transparent`
 * `--anypoint-radio-button-checked-color` | Checked button selection color | `--anypoint-color-coreBlue3`
 * `--anypoint-radio-button-checked-inner-background-color` | Checked button inner cicrcle background color | `#fff`
 * `--anypoint-radio-button-label-spacing` | Spacing between the label and the button | `5px`
 * `--anypoint-radio-button-label-color` | Label color | `--primary-text-color`
 * `--anypoint-radio-button-label` | A mixin applied to the internal label | `{}`
 *
 * @customElement
 * @demo demo/index.html
 * @memberof AnypointComponents
 */
class AnypointRadioButton extends CheckedElementMixin(LitElement) {
  static get styles() {
    return css`
    :host {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      line-height: 0;
      white-space: nowrap;
      cursor: pointer;
      vertical-align: middle;
    }

    :host(:focus) {
      outline: none;
    }

    :host([disabled]) {
      cursor: auto;
      pointer-events: none;
      color: var(--anypoint-radio-button-disabled-color, #a8a8a8);
    }

    .radio-container {
      display: inline-block;
      position: relative;
      vertical-align: middle;
      position: relative;
      vertical-align: middle;
      width: 16px;
      height: 16px;
      padding: 8px;
    }

    .radio-container:before {
      top: 0%;
      left: 0%;
      width: 100%;
      height: 100%;
      opacity: 0.04;
      background-color: var(--anypoint-radio-button-checked-color, var(--anypoint-color-primary));
      pointer-events: none;
      content: "";
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      transition: transform ease 0.18s;
      will-change: transform;
    }

    .radio-container:hover:before,
    :host(:focus) .radio-container:before {
      transform: scale(1);
    }

    :host(:focus) .radio-container:before {
      opacity: 0.08;
    }

    .state-container {
      width: 16px;
      height: 16px;
      position: relative;
    }

    #offRadio, #onRadio {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
      border-width: 1px;
      border-color: transparent;
      border-style: solid;
      position: absolute;
    }

    #offRadio {
      border-color: var(--anypoint-radio-button-unchecked-color, var(--anypoint-color-aluminum5));
      background-color: var(--anypoint-radio-button-unchecked-background-color, transparent);
      transition: background-color 0.28s, border-color 0.28s;
    }

    :host(:hover) #offRadio {
      border-color: var(--anypoint-radio-button-hover-unchecked-color, var(--anypoint-color-coreBlue2));
    }

    :host(:active) #offRadio,
    :host(:focus) #offRadio {
      border-color: var(--anypoint-radio-button-active-unchecked-color, var(--anypoint-color-coreBlue3));
    }

    :host([checked]) #offRadio {
      border-color: var(--anypoint-radio-button-checked-color, var(--anypoint-color-coreBlue3));
      background-color: var(--anypoint-radio-button-checked-color, var(--anypoint-color-coreBlue3));
    }

    :host([disabled]) #offRadio {
      border-color: var(--anypoint-radio-button-unchecked-color, var(--anypoint-color-steel1));
      opacity: 0.65;
    }

    :host([disabled][checked]) #offRadio {
      background-color: var(--anypoint-radio-button-checked-color, var(--anypoint-color-steel1));
    }

    #onRadio {
      background-color: var(--anypoint-radio-button-checked-inner-background-color, #fff);
      -webkit-transform: scale(0);
      transform: scale(0);
      transition: -webkit-transform ease 0.28s;
      transition: transform ease 0.28s;
      will-change: transform;
    }

    :host([checked]) #onRadio {
      -webkit-transform: scale(0.5);
      transform: scale(0.5);
    }

    .radioLabel {
      line-height: normal;
      position: relative;
      display: inline-block;
      vertical-align: middle;
      white-space: normal;
      color: var(--anypoint-radio-button-label-color, var(--primary-text-color));
    }

    :host-context([dir="rtl"]) .radioLabel {
      margin-left: 8px;
    }

    :host([disabled]) .radioLabel {
      pointer-events: none;
      color: var(--anypoint-radio-button-disabled-color, #a8a8a8);
    }
    `;
  }

  render() {
    return html`
      <div class="radio-container">
        <div class="state-container">
          <div id="offRadio"></div>
          <div id="onRadio"></div>
        </div>
      </div>
      <label class="radioLabel"><slot></slot></label>`;
  }

  get checked() {
    return this._checked || false;
  }

  set checked(value) {
    if (this._setChanged('checked', value)) {
      this._updateCheckedAria(value);
      this._checkedChanged(value);
    }
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    if (this._setChanged('disabled', value)) {
      this._disabledChanged(value);
    }
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'radio');
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    if (this.checked === undefined) {
      this.checked = false;
    } else {
      this._updateCheckedAria(this.checked);
    }
    this.addEventListener('keydown', this._keyDownHandler);
    this.addEventListener('click', this._clickHandler);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.addEventListener('keydown', this._keyDownHandler);
    this.addEventListener('click', this._clickHandler);
  }

  _updateCheckedAria(checked) {
    if (checked === undefined) {
      checked = false;
    }
    this.setAttribute('aria-checked', String(checked));
  }

  /**
   * Handler for keyboard down event
   * @param {KeyboardEvent} e
   */
  _keyDownHandler(e) {
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.keyCode === 13) {
      this._clickHandler(e);
      this._asyncClick();
    } else if (e.code === 'Space' || e.keyCode === 32) {
      this._clickHandler(e);
      this._asyncClick();
      e.preventDefault();
    }
  }
  /**
   * Handler for pointer click event
   * @param {MouseEvent} e
   */
  _clickHandler() {
    if (this.disabled) {
      return;
    }
    this.checked = true;
  }
  /**
   * Performs a click operation in next macrotask.
   */
  _asyncClick() {
    if (this.disabled) {
      return;
    }
    setTimeout(() => this.click(), 1);
  }
  /**
   * Handles `disable` property state change and manages `aria-disabled`
   * and `tabindex` attributes.
   * @param {Boolean} disabled
   */
  _disabledChanged(disabled) {
    this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    if (disabled) {
      // Read the `tabindex` attribute instead of the `tabIndex` property.
      // The property returns `-1` if there is no `tabindex` attribute.
      // This distinction is important when restoring the value because
      // leaving `-1` hides shadow root children from the tab order.
      this._oldTabIndex = this.getAttribute('tabindex');
      this.focused = false;
      this.setAttribute('tabindex', '-1');
      this.blur();
    } else if (this._oldTabIndex !== undefined) {
      if (this._oldTabIndex === null) {
        this.removeAttribute('tabindex');
      } else {
        this.setAttribute('tabindex', this._oldTabIndex);
      }
    }
  }
}

window.customElements.define('anypoint-radio-button', AnypointRadioButton);
