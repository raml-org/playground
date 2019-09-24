import { html, css, LitElement } from 'lit-element';
import { ControlStateMixin } from '@anypoint-web-components/anypoint-control-mixins/control-state-mixin.js';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import '@anypoint-web-components/anypoint-dropdown/anypoint-dropdown.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import './anypoint-dropdown-menu-icons.js';
/**
 * Accessible dropdown menu for Anypoint platform.
 *
 * The element works perfectly with `anypoint-listbox` which together creates an
 * accessible list of options. The listbox can be replaced by any other element
 * that support similar functionality but make sure it has an appropriate aria
 * support.
 *
 * See README.md file for detailed documentation.
 */
export class AnypointDropdownMenu extends ValidatableMixin(ControlStateMixin(LitElement)) {
  static get styles() {
    return css`
    :host {
      /* Default size of an <input> */
      width: 200px;
      display: inline-block;
      position: relative;
      text-align: left;
      outline: none;
      height: 56px;
      box-sizing: border-box;
      font-size: 1rem;
      /* Anypoint UI controls margin in forms */
      margin: 16px 8px;
    }

    .hidden {
      display: none !important;
    }

    .trigger-button.form-disabled {
      pointer-events: none;
      opacity: var(--anypoint-dropdown-menu-disabled-opacity, 0.43);
    }

    .label.resting.form-disabled, {
      opacity: var(--anypoint-dropdown-menu-disabled-opacity, 0.43);
    }

    :host([nolabelfloat]) {
      height: 40px;
    }

    .input-container {
      position: relative;
      height: 100%;
      /* width: inherit; */
      background-color: var(--anypoint-dropdown-menu-background-color, #F5F5F5);

      border: 1px var(--anypoint-dropdown-menu-border-color, transparent) solid;
      border-radius: 4px 4px 0 0;
      border-bottom-width: 1px;
      border-bottom-style: solid;
      border-bottom-color: var(--anypoint-dropdown-menu-border-bottom-color, #8e8e8e);
      transition: border-bottom-color 0.22s linear;
      transform-origin: center center;

      cursor: default;
    }

    :host([invalid]) .input-container,
    :host(:invalid) .input-container {
      border-bottom: 1px solid var(--anypoint-dropdown-error-color, var(--error-color)) !important;
    }

    .input-container.form-disabled {
      opacity: var(--anypoint-dropdown-menu-disabled-opacity, 0.43);
      border-bottom: 1px dashed var(--anypoint-dropdown-menu-color, var(--secondary-text-color));
    }

    :host([opened]) .input-container,
    :host([focused]) .input-container,
    :host(:focus) .input-container {
      border-bottom-color: var(--anypoint-dropdown-menu-hover-border-color, var(--anypoint-color-coreBlue3));
    }

    .input-wrapper {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 100%;
      position: relative;
    }

    .input {
      flex: 1;
      margin: 12px 0px 0px 8px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: calc(100% - 40px);
    }

    :host(:dir(rtl)) .input {
      text-align: right;
      margin: 0px 8px 0px 0px;
    }

    :host([dir="rtl"]) .input {
      text-align: right;
      margin: 12px 8px 0px 0px;
    }

    :host([nolabelfloat]) .input {
      margin-top: 0 !important;
    }

    .input-spacer {
      visibility: hidden;
      margin-left: -12px;
    }

    .label {
      position: absolute;
      transition: transform 0.12s ease-in-out, max-width 0.12s ease-in-out;
      will-change: transform;
      border-radius: 3px;
      margin: 0;
      padding: 0;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      z-index: 1;
      max-width: calc(100% - 16px);
      text-overflow: clip;
      color: var(--anypoint-dropdown-menu-label-color, #616161);
      transform-origin: left top;
      left: 8px;
      top: calc(100% / 2 - 8px);
      font-size: 1rem;
    }

    :host(:dir(rtl)) .label {
      text-align: right;
      right: 8px;
      left: auto;
    }
    /* Not every browser support syntax above and for those who doesn't
      this style has to be repeated or it won't be applied. */
    :host([dir="rtl"]) .label {
      text-align: right;
      right: 8px;
      left: auto;
      transform-origin: right top;
    }

    .label.resting {
      transform: translateY(0) scale(1);
    }

    .label.floating {
      transform: translateY(-80%) scale(0.75);
      max-width: calc(100% + 20%);
    }

    :host([nolabelfloat]:not([compatibility])) .label.floating {
      display: none !important;
    }

    :host([invalid]) .label,
    :host(:invalid) .label {
      color: var(--anypoint-dropdown-error-color, var(--error-color)) !important;
    }

    .trigger-icon {
      transform: rotate(0);
      transition: transform 0.12s ease-in-out;
      will-change: transform;
      color: var(--anypoint-dropdown-menu-label-color, #616161);
    }

    .trigger-icon.opened {
      transform: rotate(-180deg);
    }

    :host([opened]) .trigger-icon,
    :host([focused]) .trigger-icon,
    :host(:focus) .trigger-icon {
      color: var(--anypoint-dropdown-menu-trigger-icon-active-color, var(--primary-color));
    }

    anypoint-dropdown {
      margin-top: 58px;
      width: auto;
    }

    .dropdown-content {
      box-shadow: var(--anypoiont-dropdown-shaddow);
    }

    :host([verticalalign="bottom"]) anypoint-dropdown {
      margin-bottom: 56px;
      margin-top: auto;
    }

    :host([nolabelfloat]) anypoint-dropdown {
      margin-top: 40px;
    }

    .assistive-info {
      overflow: hidden;
      margin-top: -2px;
      height: 20px;
      position: absolute;
    }

    .invalid,
    .info {
      padding: 0;
      margin: 0 0 0 8px;
      font-size: .875rem;
      transition: transform 0.12s ease-in-out;
    }

    .info {
      color: var(--anypoint-dropdown-menu-info-message-color, #616161);
    }

    .info.label-hidden {
      transform: translateY(-200%);
    }

    .invalid {
      color: var(--anypoint-dropdown-menu-error-color, var(--error-color));
    }

    .invalid.label-hidden,
    .invalid.info-offset.label-hidden {
      transform: translateY(-200%);
    }

    .invalid.info-offset {
      transform: translateY(-100%);
    }

    /* Outlined theme */
    :host([outlined]) .input-container {
      border: 1px var(--anypoint-dropdown-menu-border-color, #8e8e8e) solid;
      background-color: var(--anypoint-dropdown-menu-background-color, #fff);
      border-radius: 4px;
      transition: border-bottom-color 0.22s linear;
    }

    :host([outlined]) .input {
      margin-top: 0;
    }

    :host([outlined]) .label.resting {
      margin-top: 0;
      top: calc(100% / 2 - 8px);
    }

    :host([outlined]) .label.floating {
      background-color: var(--anypoint-dropdown-menu-label-background-color, white);
      transform: translateY(-130%) scale(0.75);
      max-width: 120%;
      padding: 0 2px;
      left: 6px;
    }

    :host([outlined][invalid]) .input-container,
    :host([outlined]:invalid) .input-container {
      border: 1px solid var(--anypoint-dropdown-error-color, var(--error-color)) !important;
    }

    /* Anypoint compatibility theme */

    :host([compatibility]) {
      height: 40px;
      margin-top: 20px;
    }

    :host([compatibility]) .input-container {
      border: none;
      border-left: 2px var(--anypoint-dropdown-menu-border-color, #8e8e8e) solid;
      border-right: 2px var(--anypoint-dropdown-menu-border-color, #8e8e8e) solid;
      border-radius: 0;
      box-sizing: border-box;
    }

    :host([compatibility][focused]) .input-container,
    :host([compatibility]:hover) .input-container {
      border-left-color: var(--anypoint-dropdown-menu-compatibility-focus-border-color, #58595a);
      border-right-color: var(--anypoint-dropdown-menu-compatibility-focus-border-color, #58595a);
      background-color: var(--anypoint-dropdown-menu-compatibility-focus-background-color, #f9fafb);
    }

    :host([compatibility][invalid]) .input-container {
      border-left-color: var(--anypoint-dropdown-menu-error-color, var(--error-color));
      border-right-color: var(--anypoint-dropdown-menu-error-color, var(--error-color));
      border-bottom: none !important;
    }

    :host([compatibility]) .label {
      font-size: .875rem;
      left: -2px;
      top: -18px;
      transform: none;
      font-weight: 500;
      color: var(--anypoint-dropdown-menu-compatibility-label-color, #616161);
    }

    :host([compatibility]) anypoint-dropdown {
      margin-top: 40px;
    }

    :host([compatibility]) .input {
      margin-top: 0;
    }

    :host([compatibility]) .invalid,
    :host([compatibility]) .info {
      margin-left: 0px;
    }

    :host([nolabelfloat][compatibility]) {
      margin-top: 0px;
    }

    :host([compatibility]) anypoint-dropdown {
      border-bottom: 2px var(--anypoint-dropdown-menu-border-color, #E0E0E0) solid;
      border-top: 2px var(--anypoint-dropdown-menu-border-color, #E0E0E0) solid;
    }

    :host([compatibility]) .dropdown-content {
      box-shadow: none;
    }

    :host([nolabelfloat][compatibility]) .label.resting {
      top: calc(100% / 2 - 8px);
      left: 10px;
      font-size: 1rem;
    }
    `;
  }

  render() {
    const {
      opened,
      horizontalAlign,
      verticalAlign,
      dynamicAlign,
      horizontalOffset,
      verticalOffset,
      noOverlap,
      openAnimationConfig,
      closeAnimationConfig,
      noAnimations,
      allowOutsideScroll,
      restoreFocusOnClose,
      value,
      invalidMessage,
      infoMessage,
      compatibility,
      _labelClass,
      _errorAddonClass,
      _infoAddonClass,
      _triggerClass,
      _inputContainerClass
    } = this;

    const renderValue = value || '';
    return html`
    <div class="${_inputContainerClass}">
      <div class="${_labelClass}">
        <slot name="label"></slot>
      </div>

      <div class="input-wrapper">
        <div class="input">
          ${renderValue}
          <span class="input-spacer">&nbsp;</span>
        </div>
        <anypoint-icon-button
          @click="${this.toggle}"
          aria-label="Toggles dropdown menu"
          tabindex="-1"
          aria-label="Toggles dropdown menu"
          class="${_triggerClass}"
          ?compatibility="${compatibility}">
          <iron-icon
            class="trigger-icon ${opened ? 'opened' : ''}"
            icon="anypoint-dropdown-menu:adm-arrow-down"></iron-icon>
        </anypoint-icon-button>
      </div>

      <anypoint-dropdown
        .opened="${opened}"
        .horizontalAlign="${horizontalAlign}"
        .verticalAlign="${verticalAlign}"
        .dynamicAlign="${dynamicAlign}"
        .horizontalOffset="${horizontalOffset}"
        .verticalOffset="${verticalOffset}"
        .noOverlap="${noOverlap}"
        .openAnimationConfig="${openAnimationConfig}"
        .closeAnimationConfig="${closeAnimationConfig}"
        .noAnimations="${noAnimations}"
        .allowOutsideScroll="${allowOutsideScroll}"
        .restoreFocusOnClose="${restoreFocusOnClose}"
        ?compatibility="${compatibility}"
        @overlay-closed="${this._dropdownClosed}"
        @overlay-opened="${this._dropdownOpened}"
        @select="${this._selectHandler}"
        @deselect="${this._deselectHandler}">
        <div slot="dropdown-content" class="dropdown-content">
          <slot id="content" name="dropdown-content"></slot>
        </div>
      </anypoint-dropdown>
    </div>
    <div class="assistive-info">
    ${infoMessage ? html`<p class="${_infoAddonClass}">${infoMessage}</p>` : undefined}
    ${invalidMessage ?
      html`<p class="${_errorAddonClass}">${invalidMessage}</p>` :
      undefined}
    </div>
    `;
  }
  /**
   * For form-associated custom elements. Marks this custom element
   * as form enabled element.
   */
  static get formAssociated() {
    return true;
  }
  /**
   * When form-associated custom elements are supported in the browser it
   * returns `<form>` element associated with this constol.
   */
  get form() {
    return this._internals && this._internals.form || null;
  }

  get validationStates() {
    return this._validationStates;
  }

  set validationStates(value) {
    const old = this._validationStates;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._validationStates = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('validationStates', old);
    }
    this._hasValidationMessage = !!(value && value.length);
    this._validationStatesChanged(value);
    this.dispatchEvent(new CustomEvent('validationstates-changed', {
      detail: {
        value
      }
    }));
  }

  get hasValidationMessage() {
    return this._hasValidationMessage;
  }

  get _hasValidationMessage() {
    return this.__hasValidationMessage;
  }

  set _hasValidationMessage(value) {
    const old = this.__hasValidationMessage;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__hasValidationMessage = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('hasValidationMessage', old);
    }
    this.__hasValidationMessage = value;
    this.dispatchEvent(new CustomEvent('hasvalidationmessage-changed', {
      detail: {
        value
      }
    }));
  }

  get autoValidate() {
    return this._autoValidate;
  }

  set autoValidate(value) {
    const old = this._autoValidate;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._autoValidate = value;
    this._autoValidateChanged(value);
  }

  get invalidMessage() {
    return this._invalidMessage;
  }

  set invalidMessage(value) {
    const old = this._invalidMessage;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._invalidMessage = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('invalidMessage', old);
    }
    this._hasValidationMessage = this.invalid && !!value;
  }

  get _labelClass() {
    const labelFloating = !!this.value;
    let klas = 'label';
    if (labelFloating && this.noLabelFloat) {
      klas += ' hidden';
    } else {
      klas += labelFloating ? ' floating' : ' resting';
    }
    if (this._formDisabled || this.disabled) {
      klas += ' form-disabled';
    }
    return klas;
  }

  get _infoAddonClass() {
    let klas = 'info';
    const isInavlidWithMessage = !!this.invalidMessage && this.invalid;
    if (isInavlidWithMessage) {
      klas += ' label-hidden';
    }
    return klas;
  }

  get _errorAddonClass() {
    let klas = 'invalid';
    if (!this.invalid) {
      klas += ' label-hidden';
    }
    if (this.infoMessage) {
      klas += ' info-offset';
    }
    return klas;
  }

  get _triggerClass() {
    let klas = 'trigger-button';
    if (this._formDisabled || this.disabled) {
      klas += ' form-disabled';
    }
    return klas;
  }

  get _inputContainerClass() {
    let klas = 'input-container';
    if (this._formDisabled || this.disabled) {
      klas += ' form-disabled';
    }
    return klas;
  }

  get selectedItem() {
    return this._selectedItem;
  }

  get _selectedItem() {
    return this.__selectedItem;
  }

  set _selectedItem(value) {
    const old = this.__selectedItem;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__selectedItem = value;
    this._selectedItemChanged(value);
  }

  get opened() {
    return this._opened || false;
  }

  set opened(value) {
    const old = this._opened;
    if (old === value) {
      return;
    }
    if (value && (this._disabled || this._formDisabled)) {
      return;
    }
    this._opened = value;
    this.requestUpdate('opened', old);
    this._openedChanged(value);
    this.dispatchEvent(new CustomEvent('opened-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @return {?Element} The content element that is contained by the dropdown menu, if any.
   */
  get contentElement() {
    const slot = this.shadowRoot.querySelector('slot[name="dropdown-content"]');
    if (!slot) {
      return null;
    }
    const nodes = slot.assignedNodes();
    for (let i = 0, l = nodes.length; i < l; i++) {
      if (nodes[i].nodeType === Node.ELEMENT_NODE) {
        return nodes[i];
      }
    }
    return null;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    if (old === value) {
      return;
    }
    this._value = value;
    this.requestUpdate('value', old);
    /* istanbul ignore else */
    if (this._internals) {
      this._internals.setFormValue(value);
    }
  }

  get disabled() {
    return this._disabled || false;
  }

  set disabled(value) {
    const old = this._disabled;
    if (old === value) {
      return;
    }
    this._disabled = value;
    this.requestUpdate('disabled', old);
    if (this.opened) {
      this.opened = false;
    }
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  static get properties() {
    return {
      /**
       * An animation config. If provided, this will be used to animate the
       * opening of the dropdown. Pass an Array for multiple animations.
       * See `neon-animation` documentation for more animation configuration
       * details.
       */
      openAnimationConfig: { type: Object },

      /**
       * An animation config. If provided, this will be used to animate the
       * closing of the dropdown. Pass an Array for multiple animations.
       * See `neon-animation` documentation for more animation configuration
       * details.
       */
      closeAnimationConfig: { type: Object },
      /**
       * Set to true to disable animations when opening and closing the
       * dropdown.
       */
      noAnimations: { type: Boolean, reflect: true },
      /**
       * By default, the dropdown will constrain scrolling on the page
       * to itself when opened.
       * Set to true in order to prevent scroll from being constrained
       * to the dropdown when it opens.
       * This property is a shortcut to set `scrollAction` to lock or refit.
       * Prefer directly setting the `scrollAction` property.
       */
      allowOutsideScroll: { type: Boolean, reflect: true },
      /**
       * The orientation against which to align the element vertically
       * relative to the `positionTarget`. Possible values are "top", "bottom",
       * "middle", "auto".
       */
      verticalAlign: { type: String },
      /**
       * The orientation against which to align the element horizontally
       * relative to the `positionTarget`. Possible values are "left", "right",
       * "center", "auto".
       */
      horizontalAlign: { type: String },
      /**
       * A pixel value that will be added to the position calculated for the
       * given `verticalAlign`, in the direction of alignment. You can think
       * of it as increasing or decreasing the distance to the side of the
       * screen given by `verticalAlign`.
       *
       * If `verticalAlign` is "top" or "middle", this offset will increase or
       * decrease the distance to the top side of the screen: a negative offset
       * will move the dropdown upwards; a positive one, downwards.
       *
       * Conversely if `verticalAlign` is "bottom", this offset will increase
       * or decrease the distance to the bottom side of the screen: a negative
       * offset will move the dropdown downwards; a positive one, upwards.
       */
      verticalOffset: { type: Number },
      /**
       * A pixel value that will be added to the position calculated for the
       * given `horizontalAlign`, in the direction of alignment. You can think
       * of it as increasing or decreasing the distance to the side of the
       * screen given by `horizontalAlign`.
       *
       * If `horizontalAlign` is "left" or "center", this offset will increase or
       * decrease the distance to the left side of the screen: a negative offset
       * will move the dropdown to the left; a positive one, to the right.
       *
       * Conversely if `horizontalAlign` is "right", this offset will increase
       * or decrease the distance to the right side of the screen: a negative
       * offset will move the dropdown to the right; a positive one, to the left.
       */
      horizontalOffset: { type: Number },
      /**
       * If true, it will use `horizontalAlign` and `verticalAlign` values as
       * preferred alignment and if there's not enough space, it will pick the
       * values which minimize the cropping.
       */
      dynamicAlign: { type: Boolean, reflect: true },
      /**
       * True if the list is currently displayed.
       */
      opened: { type: Boolean, reflect: true },
      /**
       * Selected item value calculated as it's (in order) label property, label
       * attribute, and `innerText` value.
       */
      value: { type: String },
      /**
       * Name of the form control.
       * Note, form-associated custom elements may not be supported as first
       * implementation was released in Chrome M77 in July 2019. It may require
       * using custom form element to gather form data.
       */
      name: { type: String },
      /**
       * When set it marks the element as required. Calling the `validate`
       * function will mark this control as invalid when no value is selected.
       */
      required: { type: Boolean, reflect: true },
      /**
       * Automatically calls `validate()` function when dropdown closes.
       */
      autoValidate: { type: Boolean, reflect: true },
      /**
       * The error message to display when the input is invalid.
       */
      invalidMessage: { type: String },
      /**
       * Assistive text value.
       * Rendered beflow the input.
       */
      infoMessage: { type: String },
      /**
       * After calling `validate()` this will be populated by latest result of the test for each
       * validator. Result item will contain following properties:
       *
       * - validator {String} Name of the validator
       * - valid {Boolean} Result of the test
       * - message {String} Error message, populated only if `valid` equal `false`
       *
       * This property is `undefined` if `validator` is not set.
       */
      validationStates: { type: Array },
      /**
       * Value computed from `invalidMessage`, `invalid` and `validationStates`.
       * True if the validation message should be displayed.
       */
      _hasValidationMessage: { type: Boolean },
      /**
       * Will position the list around the button without overlapping
       * it.
       */
      noOverlap: { type: Boolean },
      /**
       * Enables outlined theme.
       */
      outlined: { type: Boolean, reflect: true },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * When set the label is rendered only when not selected state.
       * It is useful when using the dropdown in an application menu bar.
       */
      noLabelFloat: { type: Boolean, reflect: true },
      /**
       * When set the control is rendered as disabled form control.
       */
      disabled: { type: Boolean, reflect: true }
    };
  }

  constructor() {
    super();
    this.horizontalAlign = 'left';
    this.verticalAlign = 'top';
    this.noAnimations = false;
    this.allowOutsideScroll = false;
    this.dynamicAlign = false;
    this.noOverlap = false;
    this.horizontalOffset = 0;
    this.verticalOffset = 0;
    this.restoreFocusOnClose = false;
    this.value = '';

    this._clickHandler = this._clickHandler.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._focusHandler = this._focusHandler.bind(this);
    /* istanbul ignore else */
    if (this.attachInternals) {
      this._internals = this.attachInternals();
    }
  }

  connectedCallback() {
    /* istanbul ignore else */
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    if (!this.hasAttribute('aria-haspopup')) {
      this.setAttribute('aria-haspopup', 'listbox');
    }
    // aria-expanded is set with `opened` flag which is initialzed in the cosntructor.
    this.addEventListener('click', this._clickHandler);
    this.addEventListener('keydown', this._onKeydown);
    this.addEventListener('focus', this._focusHandler);
  }

  disconnectedCallback() {
    /* istanbul ignore else */
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.removeEventListener('click', this._clickHandler);
    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('focus', this._focusHandler);
  }
  /**
   * When form-associated custom elements are supported in the browser it
   * is called when for disabled state changed.
   * @param {Boolean} disabled Form disabled state
   */
  formDisabledCallback(disabled) {
    const old = this._formDisabled;
    this._formDisabled = disabled;
    if (disabled && this.opened) {
      this.opened = false;
    }
    this.requestUpdate('_formDisabled', old);
  }
  /**
   * When form-associated custom elements are supported in the browser it
   * is called when the form has been reset
   */
  formResetCallback() {
    this.value = '';
    const node = this.contentElement;
    /* istanbul ignore else */
    if (node) {
      node.selected = undefined;
    }
    this._internals.setFormValue('');
  }
  /**
   * When form-associated custom elements are supported in the browser it
   * is called when the form state has been restored
   *
   * @param {String} state Restored value
   */
  formStateRestoreCallback(state) {
    this._internals.setFormValue(state);
  }

  firstUpdated() {
    this._openedChanged(this.opened);
    const contentElement = this.contentElement;
    const item = contentElement && contentElement.selectedItem;
    if (item) {
      this._selectedItem = item;
    }
  }
  /**
   * Handler for `click` event.
   * Opens the list of the click originated from the shadow DOM.
   * @param {MouseEvent} e
   */
  _clickHandler(e) {
    const path = e.path || e.composedPath && e.composedPath();
    /* istanbul ignore if */
    if (!path) {
      return;
    }
    /* istanbul ignore else */
    if (path.indexOf(this) !== -1 && !this.opened) {
      this.opened = true;
      e.preventDefault();
      e.stopPropagation();
    }
  }
  /**
   * Focuses on the listbox, if available.
   */
  _focusContent() {
    const node = this.contentElement;
    if (node) {
      node.focus();
    }
  }
  /**
   * Handler for the `focus` event.
   * Focuses on the listbox when opened.
   */
  _focusHandler() {
    if (this.opened) {
      this._focusContent();
    }
  }
  /**
   * Handler for the keydown event.
   * @param {KeyboardEvent} e
   */
  _onKeydown(e) {
    if (e.key === 'ArrowDown') {
      this._onDownKey(e);
    } else if (e.key === 'ArrowUp') {
      this._onUpKey(e);
    } else if (e.key === 'Escape') {
      this._onEscKey(e);
    }
  }
  /**
   * Handler for ArrowDown button press.
   * Opens the list if it's not open and focuses on the list otherwise.
   *
   * The event should be cancelled or it may cause unwanted behavior.
   *
   * @param {KeyboardEvent} e
   */
  _onDownKey(e) {
    if (!this.opened) {
      this.opened = true;
    } else {
      this._focusContent();
    }
    e.preventDefault();
    e.stopPropagation();
  }
  /**
   * Handler for ArrowUp button press.
   * Opens the list if it's not open and focuses on the list otherwise.
   *
   * The event should be cancelled or it may cause unwanted behavior.
   *
   * @param {KeyboardEvent} e
   */
  _onUpKey(e) {
    if (!this.opened) {
      this.opened = true;
    } else {
      this._focusContent();
    }
    e.preventDefault();
    e.stopPropagation();
  }
  /**
   * Handler for Escape button press.
   * Closes the list if it's open.
   */
  _onEscKey() {
    if (this.opened) {
      this.opened = false;
    }
  }
  /**
   * Compute the label for the dropdown given a selected item.
   *
   * @param {Element} selectedItem A selected Element item, with an
   * optional `label` property.
   */
  _selectedItemChanged(selectedItem) {
    let value = '';
    if (selectedItem) {
      value = selectedItem.label || selectedItem.getAttribute('label') ||
        selectedItem.textContent.trim();
    }
    this.value = value;
  }
  /**
   * Toggles `opened` state.
   *
   * @param {?MouseEvent} e When set it cancels the event
   */
  toggle(e) {
    if (this.disabled || this._formDisabled) {
      return;
    }
    this.opened = !this.opened;
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Show the dropdown content.
   */
  open() {
    if (this.disabled || this._formDisabled) {
      return;
    }
    this.opened = true;
  }
  /**
   * Hide the dropdown content.
   */
  close() {
    if (this.disabled || this._formDisabled) {
      return;
    }
    this.opened = false;
  }

  _dropdownClosed() {
    this.opened = false;
    if (this.autoValidate) {
      this.validate();
      this._updateNativeValidationState();
    }
    this.focus();
  }

  _updateNativeValidationState() {
    if (!this._internals) {
      return;
    }
    if (this.invalid) {
      this._internals.setValidity({
        customError: true
      }, 'Please select a value.');
    } else {
      this._internals.setValidity({});
    }
  }

  _dropdownOpened() {
    this._focusContent();
  }

  _selectHandler(e) {
    this.opened = false;
    this._selectedItem = e.detail.item;
  }

  _deselectHandler() {
    this._selectedItem = null;
  }
  /**
   * Returns false if the element is required and does not have a selection,
   * and true otherwise.
   *
   * @return {boolean} true if `required` is false, or if `required` is true
   * and the element has a valid selection.
   */
  _getValidity() {
    return (this.disabled || this._formDisabled) || !this.required || (this.required && !!this.value);
  }

  _openedChanged(opened) {
    const openState = opened ? 'true' : 'false';
    this.setAttribute('aria-expanded', openState);
    const e = this.contentElement;
    if (e) {
      e.setAttribute('aria-expanded', openState);
    }
  }

  checkValidity() {
    return this._getValidity() && ((this._internals && this._internals.checkValidity()) || true);
  }
  /**
   * Called when validation states changed.
   * Validation states are set by validatable mixin and is a result of calling
   * a custom validator. Each validator returns an object with `valid` and `message`
   * properties.
   *
   * See `ValidatableMixin` for more information.
   *
   * @param {?Array<Object>} states
   */
  _validationStatesChanged(states) {
    if (!states || !states.length) {
      return;
    }
    const parts = [];
    for (let i = 0, len = states.length; i < len; i++) {
      if (!states[i].valid) {
        parts[parts.length] = states[i].message;
      }
    }
    this.invalidMessage = parts.join('. ');
  }
  /**
   * Calles when `autoValidate` changed
   * @param {Boolean} value
   */
  _autoValidateChanged(value) {
    if (value) {
      this.validate();
    }
  }
  /**
   * From `ValidatableMixin`
   * @param {Boolean} value Current invalid sate
   */
  _invalidChanged(value) {
    super._invalidChanged(value);
    this._hasValidationMessage = value && !!this.invalidMessage;
    this._ensureInvalidAlertSate(value);
  }

  _ensureInvalidAlertSate(invalid) {
    if (!this.invalidMessage) {
      return;
    }
    const node = this.shadowRoot.querySelector('p.invalid');
    if (!node) {
      return;
    }
    if (invalid) {
      node.setAttribute('role', 'alert');
    } else {
      node.removeAttribute('role');
    }
    setTimeout(() => {
      node.removeAttribute('role');
    }, 1000);
  }
}
