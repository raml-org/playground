import { LitElement, html, css } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@api-components/raml-aware/raml-aware.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@api-components/api-type-document/api-type-document.js';
import '@api-components/api-annotation-document/api-annotation-document.js';
import '@api-components/api-schema-document/api-schema-document.js';
/**
 * `api-type-documentation`
 *
 * A documentation module for RAML types (resources) using AMF data model.
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiTypeDocumentation extends AmfHelperMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      css `:host {
        display: block;
      }

      .title {
        font-size: var(--arc-font-headline-font-size);
        font-weight: var(--arc-font-headline-font-weight);
        letter-spacing: var(--arc-font-headline-letter-spacing);
        line-height: var(--arc-font-headline-line-height);
      }

      :host([narrow]) .title {
        font-size: var(--arc-font-headline-narrow-font-size);
      }

      arc-marked {
        background-color: transparent;
        padding: 0;
      }`
    ];
  }

  render() {
    const {
      aware,
      typeTitle,
      hasCustomProperties,
      amf,
      type,
      isSchema,
      narrow,
      mediaType,
      mediaTypes,
      compatibility,
      graph,
      headerLevel
    } = this;
    return html `
    ${aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" scope="${aware}"></raml-aware>` : undefined}

    ${typeTitle ? html`<div class="title" role="heading" aria-level="${headerLevel}">${typeTitle}</div>` : ''}
    ${hasCustomProperties ?
      html`<api-annotation-document .amf="${amf}" .shape="${type}"></api-annotation-document>` : undefined}

    ${this.description ? html`<arc-marked .markdown="${this.description}" sanitize>
      <div slot="markdown-html" class="markdown-html" part="markdown-html"></div>
    </arc-marked>` : undefined}

    ${isSchema ?
      html`<api-schema-document
        .shape="${type}"
        .amf="${amf}"
        ?compatibility="${compatibility}"></api-schema-document>` :
      html`<api-type-document
        .amf="${amf}"
        .type="${type}"
        ?narrow="${narrow}"
        .mediaType="${mediaType}"
        .mediaTypes="${mediaTypes}"
        ?graph="${graph}"
        ?compatibility="${compatibility}"></api-type-document>`}`;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: {
        type: String
      },
      /**
       * A type definition to render.
       * This should be a one of the following AMF types:
       *
       * - `http://www.w3.org/ns/shacl#NodeShape` (Object)
       * - `http://raml.org/vocabularies/shapes#UnionShape` (Union)
       * - `http://raml.org/vocabularies/shapes#ArrayShape` (Array)
       * - `http://raml.org/vocabularies/shapes#ScalarShape` (single property)
       * @type {Object|Array}
       */
      type: {
        type: Object
      },
      /**
       * Computed value, title of the type.
       */
      typeTitle: {
        type: String
      },
      /**
       * Computed value of method description from `method` property.
       */
      description: {
        type: String
      },
      /**
       * Computed value from current `method`. True if the model contains
       * custom properties (annotations in RAML).
       */
      hasCustomProperties: {
        type: Boolean
      },
      /**
       * Computed value, true when passed model represents a schema
       * (like XML)
       */
      isSchema: {
        type: Boolean
      },
      /**
       * Set to render a mobile friendly view.
       */
      narrow: {
        type: Boolean,
        reflect: true
      },
      /**
       * A media type to use to generate examples.
       */
      mediaType: String,
      /**
       * A list of supported media types for the type.
       * This is used by `api-resource-example-document` to compute examples.
       * In practive it should be value of raml's `mediaType`.
       *
       * Each item in the array is just a name of thr media type.
       *
       * Example:
       *
       * ```json
       * ["application/json", "application/xml"]
       * ```
       *
       * @type {Array<String>}
       */
      mediaTypes: Array,
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * When enabled it renders external types as links and dispatches
       * `api-navigation-selection-changed` when clicked.
       */
      graph: { type: Boolean },
      /**
       * Type of the header in the documentation section.
       * Should be in range of 1 to 6.
       *
       * @default 2
       */
      headerLevel: { type: Number }
    };
  }

  get type() {
    return this._type;
  }

  set type(value) {
    const old = this._type;
    if (old === value) {
      return;
    }
    this._type = value;
    this.requestUpdate('type', old);
    this._typeChanged(value);
  }

  constructor() {
    super();
    this.headerLevel = 2;
  }

  _apiChangedHandler(e) {
    const {
      value
    } = e.detail;
    setTimeout(() => {
      this.amf = value;
    });
  }

  _typeChanged(type) {
    this.isSchema = this._computeIsSchema(type);
    this.hasCustomProperties = this._computeHasCustomProperties(type);
    this.description = this._computeDescription(type);
    this.typeTitle = this._computeTitle(type);
  }
  /**
   * Computes `typeTitle` property
   *
   * @param {Object} shape AMF model for data type
   * @return {String|undefined}
   */
  _computeTitle(shape) {
    if (!shape) {
      return;
    }
    let name = this._getValue(shape, this.ns.schema.schemaName);
    if (!name) {
      name = this._getValue(shape, this.ns.w3.shacl.name + 'name');
    }
    return name;
  }
  /**
   * Computes `description` property
   *
   * @param {Object} shape AMF model for data type
   * @return {String|undefined}
   */
  _computeDescription(shape) {
    return shape && this._getValue(shape, this.ns.schema.desc);
  }
  /**
   * Computes value for `isSchema` property.
   *
   * @param {Object} shape AMF `supportedOperation` model
   * @return {Boolean | undefined}
   */
  _computeIsSchema(shape) {
    if (!shape) {
      return;
    }
    return this._hasType(shape, this.ns.w3.shacl.name + 'SchemaShape');
  }
}
window.customElements.define('api-type-documentation', ApiTypeDocumentation);
