import { LitElement, html, css } from 'lit-element';
import { expandMore } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-type-document/api-type-document.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
/**
 * `api-parameters-document`
 *
 * URI and query parameters documentation table based on
 * [AMF](https://github.com/mulesoft/amf) json/ld model.
 *
 * It rquires you to set at least one of the following properties:
 * - baseUriParameters
 * - endpointParameters
 * - queryParameters
 *
 * Otherwise it render empty block element.
 *
 * See demo for example implementation.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 */
class ApiParametersDocument extends LitElement {
  static get styles() {
    return css`:host {
      display: block;
      font-size: var(--arc-font-body1-font-size);
      font-weight: var(--arc-font-body1-font-weight);
      line-height: var(--arc-font-body1-line-height);
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
      border-bottom: 1px var(--api-parameters-document-title-border-color, #e5e5e5) solid;
    }

    .section-title-area .table-title {
      flex: 1;
      flex-basis: 0.000000001px;
    }

    .toggle-icon {
      outline: none;
      margin-left: 8px;
      transform: rotateZ(0deg);
      transition: transform 0.3s ease-in-out;
    }

    .toggle-icon.opened {
      transform: rotateZ(-180deg);
    }

    .table-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: var(--arc-font-subhead-font-size);
      font-weight: var(--arc-font-subhead-font-weight);
      line-height: var(--arc-font-subhead-line-height);
    }

    :host([narrow]) .table-title {
      font-size: var(--api-parameters-document-title-narrow-font-size, initial);
    }

    .icon {
      display: block;
      width: 24px;
      height: 24px;
      fill: currentColor;
    }`;
  }

  render() {
    const {
      aware,
      pathOpened,
      queryOpened,
      _effectivePathParameters,
      queryParameters,
      amf,
      narrow,
      compatibility,
      headerLevel,
      graph
    } = this;
    const hasPathParameters = !!(_effectivePathParameters && _effectivePathParameters.length);
    const hasQueryParameters = !!(queryParameters && queryParameters.length);
    return html`
    ${aware ?
      html`<raml-aware
        @api-changed="${this._apiChangedHandler}"
        .scope="${aware}"
        data-source="api-parameters-document"></raml-aware>` : undefined}
    ${hasPathParameters ? html`<section class="uri-parameters">
      <div class="section-title-area" @click="${this.toggleUri}" title="Toogle URI parameters details">
        <div class="table-title" role="heading" aria-level="${headerLevel}">URI parameters</div>
        <div class="title-area-actions">
          <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
            ${this._computeToggleActionLabel(pathOpened)}
            <span class="icon ${this._computeToggleIconClass(pathOpened)}">${expandMore}</span>
          </anypoint-button>
        </div>
      </div>
      <iron-collapse .opened="${pathOpened}">
        <api-type-document
          .amf="${amf}"
          .type="${_effectivePathParameters}"
          ?compatibility="${compatibility}"
          ?narrow="${narrow}"
          ?graph="${graph}"></api-type-document>
      </iron-collapse>
    </section>` : undefined}

    ${hasQueryParameters ? html`<section class="query-parameters">
      <div class="section-title-area" @click="${this.toggleQuery}" title="Toogle query parameters details">
        <div class="table-title" role="heading" aria-level="${headerLevel}">Query parameters</div>
        <div class="title-area-actions">
          <anypoint-button class="toggle-button" ?compatibility="${compatibility}">
            ${this._computeToggleActionLabel(queryOpened)}
            <span class="icon ${this._computeToggleIconClass(queryOpened)}">${expandMore}</span>
          </anypoint-button>
        </div>
      </div>
      <iron-collapse .opened="${queryOpened}">
        <api-type-document
          .amf="${amf}"
          .type="${queryParameters}"
          ?compatibility="${compatibility}"
          ?narrow="${narrow}"
          ?graph="${graph}"></api-type-document>
      </iron-collapse>
    </section>`: undefined}`;
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
       * Set to true to open the query parameters view.
       * Autormatically updated when the view is toggled from the UI.
       */
      queryOpened: { type: Boolean },
      /**
       * Set to true to open the path parameters view.
       * Autormatically updated when the view is toggled from the UI.
       */
      pathOpened: { type: Boolean },
      /**
       * The `http://raml.org/vocabularies/http#variable` entry
       * from API's `http://raml.org/vocabularies/http#server` model.
       *
       * @type {Array<Object>}
       */
      baseUriParameters: { type: Array },
      /**
       * Endpoint path parameters as
       * `http://raml.org/vocabularies/http#parameter` property value of the
       * type of `http://raml.org/vocabularies/http#EndPoint`
       * @type {Array<Object>}
       */
      endpointParameters: { type: Array },
      /**
       * Method query parameters as
       * `http://raml.org/vocabularies/http#parameter` property value of the
       * type of `http://raml.org/vocabularies/http#Request`
       * @type {Array<Object>}
       */
      queryParameters: { type: Array },
      /**
       * Set to render a mobile friendly view.
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
      graph: { type: Boolean },

      _effectivePathParameters: { type: Array }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  get baseUriParameters() {
    return this._baseUriParameters;
  }

  set baseUriParameters(value) {
    if (this._sop('baseUriParameters', value)) {
      this._effectivePathParameters = this._computeEffectivePath(value, this.endpointParameters);
    }
  }

  get endpointParameters() {
    return this._endpointParameters;
  }

  set endpointParameters(value) {
    if (this._sop('endpointParameters', value)) {
      this._effectivePathParameters = this._computeEffectivePath(this.baseUriParameters, value);
    }
  }

  constructor() {
    super();
    this.headerLevel = 2;
  }

  _sop(prop, value) {
    const key = '_' + prop;
    const oldValue = this[key];
    if (oldValue === value) {
      return false;
    }
    this[key] = value;
    this.requestUpdate(prop, oldValue);
    return true;
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
  /**
   * Computes combined array of base uri parameters and selected endpoint
   * parameters so the element can render single documentation table.
   *
   * @param {?Array} base Base uri parameetrs
   * @param {?Array} endpoint Endpoint's uri parameters
   * @return {Array} Combined array. Can be empty array if arguments does not
   * contain values.
   */
  _computeEffectivePath(base, endpoint) {
    let result = [];
    if (base && base.length) {
      result = result.concat(base);
    }
    if (endpoint && endpoint.length) {
      result = result.concat(endpoint);
    }
    return result;
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
   * Toggles URI parameters view.
   * Use `pathOpened` property instead.
   */
  toggleUri() {
    this.pathOpened = !this.pathOpened;
  }
  /**
   * Toggles `queryOpened` value.
   */
  toggleQuery() {
    this.queryOpened = !this.queryOpened;
  }
}
window.customElements.define('api-parameters-document', ApiParametersDocument);
