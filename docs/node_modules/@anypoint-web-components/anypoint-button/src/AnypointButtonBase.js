import { LitElement } from 'lit-element';
import {
  ButtonStateMixin,
  ControlStateMixin
} from '@anypoint-web-components/anypoint-control-mixins/anypoint-control-mixins.js';
import '@polymer/paper-ripple/paper-ripple.js';
/**
 * A base class for buttons.
 * @type {Class}
 * @appliesMixin ControlStateMixin
 * @appliesMixin ButtonStateMixin
 */
export class AnypointButtonBase extends ControlStateMixin(ButtonStateMixin(LitElement)) {
  static get properties() {
    return {
      /**
       * The z-depth of this element, from 0-5. Setting to 0 will remove the
       * shadow, and each increasing number greater than 0 will be "deeper"
       * than the last.
       * This is for MD implementation.
       */
      elevation: { type: Number, reflect: true },
      /**
       * Button emphasis in the UI.
       *
       * Possible values:
       * - `low` - Text buttons are typically used for less important actions.
       * - `medium` - Outlined buttons are used for more emphasis than text buttons due to the stroke.
       * - `high` - Contained buttons have more emphasis, as they use use a color fill and shadow.
       *
       * Default is "low".
       */
      emphasis: { type: String, reflect: true },
      /**
       * When set ripple effect is not rendered.
       */
      noink: { type: Boolean },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  get emphasis() {
    return this._emphasis;
  }

  set emphasis(value) {
    if (this._setChanged('emphasis', value)) {
      this._calculateElevation();
    }
  }

  get toggles() {
    return this._toggles;
  }

  set toggles(value) {
    if (this._setChanged('toggles', value)) {
      this._calculateElevation();
    }
  }

  get compatibility() {
    return this._compatibility;
  }

  set compatibility(value) {
    if (this._setChanged('compatibility', value)) {
      this._calculateElevation();
    }
  }

  get elevation() {
    return this._elevation;
  }

  set elevation(value) {
    if (!value) {
      value = 0;
    }
    this._setChanged('elevation', value);
  }

  constructor() {
    super();
    this.emphasis = 'low';
  }

  async _calculateElevation() {
    let e = 0;
    if (this.emphasis === 'high' && !this.compatibility) {
      if (this.toggles && this.active) {
        e = 2;
      } else if (this.pressed) {
        e = 3;
      } else {
        e = 1;
      }
    }
    await this.updateComplete;
    this.elevation = e;
  }

  _controlStateChanged() {
    super._controlStateChanged();
    this._calculateElevation();
  }

  _buttonStateChanged() {
    this._calculateElevation();
  }
}
