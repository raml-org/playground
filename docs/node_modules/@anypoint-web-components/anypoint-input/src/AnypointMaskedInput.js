import { html } from 'lit-element';
import { AnypointInput } from './AnypointInput.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';

export class AnypointMaskedInput extends AnypointInput {
  get _visibilityToggleIcon() {
    return this.visible ? 'arc:visibility-off' : 'arc:visibility';
  }

  get _visibilityToggleTitle() {
    return this.visible ?
      'Hide input value' :
      'Show input value';
  }

  get _visibilityToggleLabel() {
    return this.visible ?
      'Activate to hide input value' :
      'Activate to show input value';
  }

  get _inputType() {
    if (this.visible) {
      return this.type || 'text';
    } else {
      return 'password';
    }
  }

  static get properties() {
    return {
      /**
       * When set the input renders the value visible and restores
       * original input type.
       */
      visible: { type: Boolean }
    };
  }
  /**
   * Toggles `visible` property value.
   */
  toggleVisibility() {
    this.visible = !this.visible;
  }

  _suffixTemplate() {
    const {
      disabled,
      _visibilityToggleIcon,
      _visibilityToggleTitle,
      _visibilityToggleLabel
    } = this;
    return html`
    <div class="suffixes">
      <anypoint-icon-button
        @click="${this.toggleVisibility}"
        title="${_visibilityToggleTitle}"
        aria-label="${_visibilityToggleLabel}"
        ?disabled="${disabled}">
        <iron-icon icon="${_visibilityToggleIcon}"></iron-icon>
      </anypoint-icon-button>
      <slot name="suffix"></slot>
    </div>`;
  }
}
