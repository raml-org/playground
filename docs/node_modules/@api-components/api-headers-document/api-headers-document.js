import { LitElement, html, css } from 'lit-element';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-type-document/api-type-document.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/iron-icon/iron-icon.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
/**
 * `api-headers-document`
 *
 * A documentation for API headers.
 *
 * It uses [AMF](https://github.com/mulesoft/amf) json/ld model to render
 * the view.
 *
 * ## Example
 *
 * ```html
 * <api-headers-document headers="[...]" opened></api-headers-document>
 * ```
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 */
export class ApiHeadersDocument extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
    }

    [hidden] {
      display: none !important;
    }

    .section-title-area {
      display: flex;
      flex-direction: row;
      align-items: center;
      cursor: pointer;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      border-bottom: 1px var(--api-headers-document-title-border-color, #e5e5e5) solid;
    }

    .toggle-icon {
      margin-left: 8px;
      transform: rotateZ(0deg);
      transition: transform 0.3s ease-in-out;
    }

    .toggle-icon.opened {
      transform: rotateZ(-180deg);
    }

    .headers-title {
      flex: 1;
      flex-basis: 0.000000001px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: var(--arc-font-subhead-font-size);
      font-weight: var(--arc-font-subhead-font-weight);
      line-height: var(--arc-font-subhead-line-height);
    }

    .no-info {
      font-style: var(--no-info-message-font-style, italic);
      font-size: var(--no-info-message-font-size, 16px);
      color: var(--no-info-message-color, rgba(0, 0, 0, 0.74));
    }

    :host([narrow]) .headers-title {
      font-size: var(--api-headers-document-title-narrow-font-size, 17px);
    }`;
  }

  render() {
    const { aware, opened, headers, amf, narrow, compatibility, headerLevel, graph } = this;
    const hasHeaders = !!(headers && headers.length);
    return html`
    ${aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" .scope="${aware}"></raml-aware>` : undefined}

    <div class="section-title-area" @click="${this.toggle}" title="Toogle headers details">
      <div class="headers-title" role="heading" aria-level="${headerLevel}">Headers</div>
      <div class="title-area-actions">
        <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
          ${this._computeToggleActionLabel(opened)}
          <iron-icon icon="arc:expand-more" class="${this._computeToggleIconClass(opened)}"></iron-icon>
        </anypoint-button>
      </div>
    </div>

    <iron-collapse .opened="${opened}">
      ${hasHeaders ?
        html`<api-type-document
          .amf="${amf}"
          .type="${headers}"
          ?narrow="${narrow}"
          ?graph="${graph}"></api-type-document>` :
        html`<p class="no-info">Headers are not required by this endpoint</p>`}
    </iron-collapse>`;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * Generated AMF json/ld model form the API spec.
       * The element assumes the object of the first array item to be a
       * type of `"http://raml.org/vocabularies/document#Document`
       * on AMF vocabulary.
       *
       * It is only usefult for the element to resolve references.
       *
       * @type {Object|Array}
       */
      amf: { type: Object },
      /**
       * The headers AMF model Array.
       */
      headers: { type: Array },
      /**
       * Set to true to open the view.
       * Autormatically set when the view is toggle from the UI.
       */
      opened: { type: Boolean },
      /**
       * A property passed to the type document element to render
       * a mogile friendly view.
       */
      narrow: { type: Boolean, reflect: true },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * Type of the header in the documentation section.
       * Should be in range of 1 to 6.
       *
       * @default 2
       */
      headerLevel: { type: Number },
      /**
       * Passed to `api-type-document`. Enables internal links rendering for types.
       */
      graph: { type: Boolean }
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
    this.headerLevel = 2;
  }
  /**
   * Handler for amf model change from `raml-aware`
   * @param {CustomEvent} e
   */
  _apiChangedHandler(e) {
    const { value } = e.detail;
    setTimeout(() => {
      this.amf = value;
      // For some reson this value is not reflected in the render function
      // unles it is delayed
    });
  }

  // Computes a label for the section toggle buttons.
  _computeToggleActionLabel(opened) {
    return opened ? 'Hide' : 'Show';
  }

  // Computes class for the toggle's button icon.
  _computeToggleIconClass(opened) {
    let clazz = 'toggle-icon';
    if (opened) {
      clazz += ' opened';
    }
    return clazz;
  }
  /**
   * Toggles the view.
   * Use `opened` property instead.
   */
  toggle() {
    this.opened = !this.opened;
  }
}
window.customElements.define('api-headers-document', ApiHeadersDocument);
