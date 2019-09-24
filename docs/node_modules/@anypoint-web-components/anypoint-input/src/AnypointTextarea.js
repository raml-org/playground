import { html, css, LitElement } from 'lit-element';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { AnypointInputMixin } from './AnypointInputMixin.js';
import commonStyles from './anypoint-input-styles.js';

export class AnypointTeaxtarea extends AnypointInputMixin(LitElement) {
  static get styles() {
    return [
      commonStyles,
      css`
        :host {
          min-height: 96px;
          min-width: 200px;
          width: auto;
          height: auto;
        }

        .textarea .label {
          left: 8px;
          top: 8px;
        }

        .textarea .input-label {
          align-items: start;
        }

        .textarea .label.resting {
          transform: scale(0.75);
        }

        .textarea .label.floating {
          top: 8px;
          transform: scale(0.75);
        }

        .input-container {
          min-height: inherit;
        }

        .input-label {
          min-height: inherit;
        }

        .input-element {
          height: calc(100% - 16px);
          min-height: inherit;
          margin: 20px 0 8px 0;
        }

        :host([outlined]) .label.resting {
          margin-top: 0px;
          top: 8px;
          transform: scale(1);
        }

        :host([outlined]) .label.floating {
          transform: translateY(-15px) scale(0.75);
        }

        :host([outlined]) .input-element {
          margin-top: 8px;
          top: 0;
        }

        :host([compatibility]) {
          height: auto;
        }

        :host([compatibility]) .textarea .label {
          top: -18px;
          transform: none;
        }

        :host([compatibility]) .textarea .input-element {
          margin: 0;
        }

        :host([nolabelfloat]) {
          height: auto;
          min-height: 72px;
        }

        :host([nolabelfloat]) .textarea .input-element {
          margin: 8px 0;
        }
      `
    ];
  }

  get _labelClass() {
    const labelFloating = !!this.value || !!this.placeholder || this.focused;
    let klas = 'label';

    if (labelFloating && this.noLabelFloat) {
      klas += ' hidden';
    } else {
      klas += labelFloating ? ' floating' : ' resting';
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

  static get properties() {
    return {
      /**
       * Binds this to the `<textarea>`'s `cols` property.
       */
      cols: { type: Number },
      /**
       * Binds this to the `<textarea>`'s `rows` property.
       */
      rows: { type: Number },
      /**
       * Binds this to the `<textarea>`'s `wrap` property.
       */
      wrap: { type: String }
    };
  }

  render() {
    const {
      value,
      _ariaLabelledBy,
      disabled,
      cols,
      rows,
      spellcheck,
      required,
      autocomplete,
      autofocus,
      inputMode,
      minLength,
      maxLength,
      wrap,
      name,
      placeholder,
      readOnly,
      autocapitalize,
      autocorrect,
      invalidMessage,
      infoMessage,
      _labelClass,
      _errorAddonClass,
      _infoAddonClass
    } = this;
    const bindValue = value || '';

    return html`
    <div class="input-container">
      <div class="textarea input-label">
        <div class="${_labelClass}" id="${_ariaLabelledBy}">
          <slot name="label"></slot>
        </div>
        <textarea
          class="input-element"
          aria-labelledby="${_ariaLabelledBy}"
          autocomplete="${ifDefined(autocomplete)}"
          autocapitalize="${ifDefined(autocapitalize)}"
          autocorrect="${ifDefined(autocorrect)}"
          ?autofocus="${autofocus}"
          cols="${ifDefined(cols)}"
          ?disabled="${disabled}"
          inputmode="${ifDefined(inputMode)}"
          maxlength="${ifDefined(maxLength ? maxLength: undefined)}"
          minlength="${ifDefined(minLength ? minLength : undefined)}"
          name="${ifDefined(name)}"
          placeholder="${ifDefined(placeholder)}"
          ?required="${required}"
          ?readonly="${readOnly}"
          rows="${ifDefined(rows)}"
          spellcheck="${ifDefined(spellcheck)}"
          tabindex="-1"
          wrap="${ifDefined(wrap)}"
          .value="${bindValue}"
          @change="${this._onChange}"
          @input="${this._onInput}"
          @keypress="${this._onKeypress}"></textarea>
      </div>
    </div>
    <div class="assistive-info">
    ${infoMessage ? html`<p class="${_infoAddonClass}">${this.infoMessage}</p>` : undefined}
    ${invalidMessage ?
      html`<p class="${_errorAddonClass}">${invalidMessage}</p>` :
      undefined}
    </div>
    `;
  }
}
