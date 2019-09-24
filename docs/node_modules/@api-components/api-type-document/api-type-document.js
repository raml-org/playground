import { LitElement, html, css } from 'lit-element';
import '@api-components/raml-aware/raml-aware.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@api-components/api-resource-example-document/api-resource-example-document.js';
import './property-shape-document.js';
import { PropertyDocumentMixin } from './property-document-mixin.js';
/**
 * `api-type-document`
 *
 * An element that recuresively renders a documentation for a data type
 * using from model.
 *
 * Pass AMF's shape type `property` array to render the documentation.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin PropertyDocumentMixin
 * @appliesMixin AmfHelperMixin
 */
class ApiTypeDocument extends PropertyDocumentMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
      font-size: var(--arc-font-body1-font-size);
      font-weight: var(--arc-font-body1-font-weight);
      line-height: var(--arc-font-body1-line-height);
    }

    property-shape-document {
      padding: 12px 0;
    }

    property-shape-document:last-of-type,
    :last-of-type {
      border-bottom: none;
    }

    .array-children {
      box-sizing: border-box;
      padding-left: 12px;
      border-left: 2px var(--property-shape-document-array-color, #8BC34A) solid;
    }

    :host([hasparenttype]) .array-children {
      padding-left: 0px;
      border-left: none;
    }

    .inheritance-label {
      font-size: var(--api-type-document-inheritance-label-font-size, 16px);
    }

    .media-type-selector {
      margin: 20px 0;
    }

    .media-toggle {
      outline: none;
      color: var(--api-type-document-media-button-color, #000);
      background-color: var(--api-type-document-media-button-background-color, #fff);
      border-width: 1px;
      border-color: var(--api-type-document-media-button-border-color, #a3b11d);
      border-style: solid;
    }

    .media-toggle[activated] {
      background-color: var(--api-type-document-media-button-active-background-color, #CDDC39);
    }

    .union-toggle {
      outline: none;
      background-color: var(--api-type-document-union-button-background-color, #fff);
      color: var(--api-type-document-union-button-color, #000);
      border-width: 1px;
      border-color: var(--api-type-document-media-button-border-color, #a3b11d);
      border-style: solid;
    }

    .union-toggle[activated] {
      background-color: var(--api-type-document-union-button-active-background-color, #CDDC39);
      color: var(--api-type-document-union-button-active-color, #000);
    }

    .union-type-selector {
      margin: 12px 0;
    }`;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * A type definition to render.
       * This should be a one of the following AMF types:
       *
       * - `http://www.w3.org/ns/shacl#NodeShape` (Object)
       * - `http://raml.org/vocabularies/shapes#UnionShape` (Union)
       * - `http://raml.org/vocabularies/shapes#ArrayShape` (Array)
       * - `http://raml.org/vocabularies/shapes#ScalarShape` (single property)
       *
       * It also accepts array of properties like list of headers or
       * parameters.
       * @type {Object|Array}
       */
      type: { type: Object },
      /**
       * Media type to use to render examples.
       * If not set a "raw" version of the example from API spec file is used.
       */
      mediaType: { type: String },
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
      mediaTypes: { type: Array },
      /**
       * Currently selected media type.
       * It is an index of a media type in `mediaTypes` array.
       * It is set to `0` each time the body changes.
       */
      selectedMediaType: { type: Number },
      // The type after it has been resolved.
      _resolvedType: { type: Object },
      /**
       * Should be set if described properties has a parent type.
       * This is used when recursively iterating over properties.
       */
      parentTypeName: { type: String },
      /**
       * Computed value, true if the shape has parent type.
       */
      hasParentType: { type: Boolean },
      /**
       * True if given `type` is a scalar property
       */
      isScalar: { type: Boolean },
      /**
       * True if given `type` is an array property
       */
      isArray: { type: Boolean },
      /**
       * True if given `type` is an object property
       */
      isObject: { type: Boolean },
      /**
       * True if given `type` is an union property
       */
      isUnion: { type: Boolean },
      /**
       * True if given `type` is OAS "and" type.
       */
      isAnd: { type: Boolean },
      /**
       * Computed list of union type types to render in union type
       * selector.
       * Each item has `label` and `isScalar` property.
       *
       * @type {Array<Object>}
       */
      unionTypes: { type: Array },
      /**
       * List of types definition and name for OAS' "and" type
       */
      andTypes: { type: Array },
      /**
       * Selected index of union type in `unionTypes` array.
       */
      selectedUnion: { type: Number },
      /**
       * A property to set when the component is rendered in the narrow
       * view. To be used with mobile rendering or when the
       * components occupies only small part of the screen.
       */
      narrow: { type: Boolean },
      /**
       * When set an example in this `type` object won't be rendered even if set.
       */
      noMainExample: { type: Boolean },
      /**
       * When rendering schema for a payload set this to the payload ID
       * so the examples can be correctly rendered.
       */
      selectedBodyId: { type: String },

      _hasExamples: { type: Boolean },

      _renderMainExample: { type: Boolean }
    };
  }

  get type() {
    return this._type;
  }

  set type(value) {
    if (this._setObservableProperty('type', value)) {
      this._resolvedType = this._resolve(value);
      this.__typeChanged();
    }
  }

  get mediaTypes() {
    return this._mediaTypes;
  }

  set mediaTypes(value) {
    if (this._setObservableProperty('mediaTypes', value)) {
      this._mediaTypesChanged(value);
    }
  }

  get parentTypeName() {
    return this._parentTypeName;
  }

  set parentTypeName(value) {
    if (this._setObservableProperty('parentTypeName', value)) {
      this.hasParentType = !!value;
    }
  }

  get unionTypes() {
    return this._unionTypes;
  }

  set unionTypes(value) {
    if (this._setObservableProperty('unionTypes', value)) {
      this._unionTypesChanged(value);
    }
  }

  get noMainExample() {
    return this._noMainExample;
  }

  set noMainExample(value) {
    if (this._setObservableProperty('noMainExample', value)) {
      this._renderMainExample = this._computeRenderMainExample(value, this._hasExamples);
    }
  }

  get _hasExamples() {
    return this.__hasExamples;
  }

  set _hasExamples(value) {
    if (this._setObservableProperty('_hasExamples', value)) {
      this._renderMainExample = this._computeRenderMainExample(this.noMainExample, value);
    }
  }

  constructor() {
    super();
    this.hasParentType = false;
  }

  _computeRenderMainExample(noMainExample, hasExamples) {
    return !!(!noMainExample && hasExamples);
  }
  /**
   * Called when resolved type or amf changed.
   * Creates a debouncer to compute UI values so it's independent of
   * order of assigning properties.
   */
  __typeChanged() {
    if (this.__typeChangeDebouncer) {
      return;
    }
    this.__typeChangeDebouncer = true;
    setTimeout(() => {
      this.__typeChangeDebouncer = false;
      this._typeChanged(this._resolvedType);
    });
  }

  /**
   * Handles type change. Sets basic view control properties.
   *
   * @param {Array|Object} type Passed type/
   */
  _typeChanged(type) {
    if (!type) {
      return;
    }
    let isScalar = false;
    let isArray = false;
    let isObject = false;
    let isUnion = false;
    let isAnd = false;
    if (type instanceof Array) {
      isObject = true;
    } else if (this._hasType(type, this.ns.raml.vocabularies.shapes + 'ScalarShape') ||
      this._hasType(type, this.ns.raml.vocabularies.shapes + 'NilShape')) {
      isScalar = true;
    } else if (this._hasType(type, this.ns.raml.vocabularies.shapes + 'UnionShape')) {
      isUnion = true;
      this.unionTypes = this._computeUnionTypes(true, type);
    } else if (this._hasType(type, this.ns.raml.vocabularies.shapes + 'ArrayShape')) {
      isArray = true;
    } else if (this._hasType(type, this.ns.w3.shacl.name + 'NodeShape')) {
      isObject = true;
    } else if (this._hasType(type, this.ns.raml.vocabularies.shapes + 'AnyShape')) {
      const key = this._getAmfKey(this.ns.w3.shacl.name + 'and');
      if (key in type) {
        isAnd = true;
        this.andTypes = this._computeAndTypes(type[key]);
      } else {
        isScalar = true;
      }
    }
    this.isScalar = isScalar;
    this.isArray = isArray;
    this.isObject = isObject;
    this.isUnion = isUnion;
    this.isAnd = isAnd;
  }
  /**
   * Computes parent name for the array type table.
   *
   * @param {?String} parent `parentTypeName` if available
   * @return {String} Parent type name of refault value for array type.
   */
  _computeArrayParentName(parent) {
    return parent || '';
  }
  /**
   * Resets union selection when union types list changes.
   *
   * @param {?Array} types List of current union types.
   */
  _unionTypesChanged(types) {
    if (!types) {
      return;
    }
    this.selectedUnion = 0;
  }
  /**
   * Handler for union type button click.
   * Sets `selectedUnion` property.
   *
   * @param {ClickEvent} e
   */
  _selectUnion(e) {
    const index = Number(e.target.dataset.index);
    if (index !== index) {
      return;
    }
    if (this.selectedUnion === index) {
      e.target.active = true;
    } else {
      this.selectedUnion = index;
    }
  }
  /**
   * Computes properties for union type.
   *
   * @param {Object} type Current `type` value.
   * @param {Number} selected Selected union index from `unionTypes` array
   * @return {Array<Object>|undefined} Properties for union type.
   */
  _computeUnionProperty(type, selected) {
    if (!type) {
      return;
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.shapes + 'anyOf');
    const data = type[key];
    if (!data) {
      return;
    }
    let item = data[selected];
    if (!item) {
      return;
    }
    if (item instanceof Array) {
      item = item[0];
    }
    if (this._hasType(item, this.ns.raml.vocabularies.shapes + 'ArrayShape')) {
      item = this._resolve(item);
      const key = this._getAmfKey(this.ns.raml.vocabularies.shapes + 'items');
      const items = this._ensureArray(item[key]);
      if (items && items.length === 1) {
        let result = items[0];
        if (result instanceof Array) {
          result = result[0];
        }
        result = this._resolve(result);
        return result;
      }
    }
    if (item instanceof Array) {
      item = item[0];
    }
    return this._resolve(item);
  }
  /**
   * Helper function for the view. Extracts `http://www.w3.org/ns/shacl#property`
   * from the shape model
   *
   * @param {Object} item Range object
   * @return {Array<Object>} Shape object
   */
  _computeProperties(item) {
    if (!item) {
      return;
    }
    if (item instanceof Array) {
      return item;
    }
    const key = this._getAmfKey(this.ns.w3.shacl.name + 'property');
    return this._ensureArray(item[key]);
  }
  /**
   * Computes list values for `andTypes` property.
   * @param {Array<Object>} items List of OAS' "and" properties
   * @return {Array<Object>} An array of type definitions and label to render
   */
  _computeAndTypes(items) {
    if (!items || !items.length) {
      return;
    }
    return items.map((item) => {
      if (item instanceof Array) {
        item = item[0];
      }
      item = this._resolve(item);
      let label = this._getValue(item, this.ns.schema.schemaName);
      if (!label) {
        label = this._getValue(item, this.ns.w3.shacl.name + 'name');
      }
      if (label && label.indexOf('item') === 0) {
        label = undefined;
      }
      return {
        label,
        type: item
      };
    });
  }
  /**
   * Observer for `mediaTypes` property.
   * Controls media type selected depending on the value.
   *
   * @param {?Array<String>} types List of media types that are supported by the API.
   */
  _mediaTypesChanged(types) {
    if (!types || !(types instanceof Array) || !types.length) {
      this.renderMediaSelector = false;
    } else if (types.length === 1) {
      this.renderMediaSelector = false;
      this.mediaType = types[0];
    } else {
      this.renderMediaSelector = true;
      this.mediaType = types[0];
      this.selectedMediaType = 0;
    }
  }

  /**
   * Computes if `selected` equals current item index.
   *
   * @param {Number} selected
   * @param {Number} index
   * @return {Boolean}
   */
  _mediaTypeActive(selected, index) {
    return selected === index;
  }

  /**
   * Handler for media type type button click.
   * Sets `selected` property.
   *
   * @param {ClickEvent} e
   */
  _selectMediaType(e) {
    const index = Number(e.target.dataset.index);
    if (index !== index) {
      return;
    }
    if (index !== this.selectedMediaType) {
      this.selectedMediaType = index;
      this.mediaType = this.mediaTypes[index];
    } else {
      e.target.active = true;
    }
  }

  _apiChangedHandler(e) {
    const { value } = e.detail;
    this.amf = value;
  }

  _hasExamplesHandler(e) {
    const { value } = e.detail;
    this._hasExamples = value;
  }

  _objectTemplate() {
    const items = this._computeProperties(this._resolvedType);
    if (!items || !items.length) {
      return;
    }
    return items.map((item) => html`<property-shape-document
      class="object-document"
      .shape="${this._resolve(item)}"
      .amf="${this.amf}"
      .parentTypeName="${this.parentTypeName}"
      ?narrow="${this.narrow}"
      ?noexamplesactions="${this.noExamplesActions}"
      ?compatibility="${this.compatibility}"
      ?graph="${this.graph}"
      .mediaType="${this.mediaType}"></property-shape-document>`);
  }

  _arrayTemplate() {
    const items = this._computeArrayProperties(this._resolvedType) || [];
    return html`
    ${this.hasParentType ? html`<property-shape-document
      class="array-document"
      .amf="${this.amf}"
      .shape="${this._resolvedType}"
      parentTypeName="Array test"
      ?narrow="${this.narrow}"
      ?noexamplesactions="${this.noExamplesActions}"
      ?compatibility="${this.compatibility}"
      .mediaType="${this.mediaType}"
      ?graph="${this.graph}"></property-shape-document>` : undefined}

      <div class="array-children">
      ${items.map((item) => html`
        ${item.isShape ? html`<property-shape-document
          class="array-document"
          .amf="${this.amf}"
          .shape="${item}"
          parentTypeName="${this._computeArrayParentName(this.parentTypeName, item)}"
          ?narrow="${this.narrow}"
          ?noexamplesactions="${this.noExamplesActions}"
          ?compatibility="${this.compatibility}"
          .mediaType="${this.mediaType}"
          ?graph="${this.graph}"></property-shape-document>` : undefined}
        ${item.isType ? html`<api-type-document
          class="union-document"
          .amf="${this.amf}"
          .parentTypeName="${this.parentTypeName}"
          .type="${item}"
          ?narrow="${this.narrow}"
          ?noexamplesactions="${this.noExamplesActions}"
          ?nomainexample="${this._renderMainExample}"
          ?compatibility="${this.compatibility}"
          .mediaType="${this.mediaType}"
          ?graph="${this.graph}"></api-type-document>` : undefined}
      `)}
      </div>
    `;
  }

  _unionTemplate() {
    const items = this.unionTypes || [];
    return html`
    <div class="union-type-selector">
      <span>Any of:</span>
      ${items.map((item, index) => html`<anypoint-button
        class="union-toggle"
        data-index="${index}"
        ?activated="${this.selectedUnion === index}"
        aria-pressed="${this.selectedUnion === index ? 'true' : 'false'}"
        @click="${this._selectUnion}"
        ?compatibility="${this.compatibility}"
        title="Select ${item.label} type">${item.label}</anypoint-button>`)}
    </div>
    <api-type-document
      class="union-document"
      .amf="${this.amf}"
      .parentTypeName="${this.parentTypeName}"
      .type="${this._computeUnionProperty(this._resolvedType, this.selectedUnion)}"
      ?narrow="${this.narrow}"
      ?noexamplesactions="${this.noExamplesActions}"
      ?nomainexample="${this._renderMainExample}"
      ?compatibility="${this.compatibility}"
      .mediaType="${this.mediaType}"
      ?graph="${this.graph}"></api-type-document>
    `;
  }

  _anyTemplate() {
    const items = this.andTypes;
    if (!items || !items.length) {
      return;
    }
    return html`
    ${items.map((item) => html`
      ${item.label ?
        html`<p class="inheritance-label">Properties inherited from <b>${item.label}</b>.</p>` :
        html`<p class="inheritance-label">Properties defined inline.</p>`}
    <api-type-document
      class="and-document"
      .amf="${this.amf}"
      .type="${item.type}"
      ?narrow="${this.narrow}"
      ?noexamplesactions="${this.noExamplesActions}"
      ?nomainexample="${this._renderMainExample}"
      ?compatibility="${this.compatibility}"
      .mediaType="${this.mediaType}"
      ?graph="${this.graph}"></api-type-document>`)}`;
  }

  render() {
    let parts = 'content-action-button, code-content-action-button, content-action-button-disabled, ';
    parts += 'code-content-action-button-disabled content-action-button-active, ';
    parts += 'code-content-action-button-active, code-wrapper, example-code-wrapper, markdown-html';
    const mediaTypes = this.mediaTypes || [];
    return html`
    ${this.aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" scope="${this.aware}"></raml-aware>` : undefined}
    <section class="examples" ?hidden="${!this._renderMainExample}">
      ${this.renderMediaSelector ? html`<div class="media-type-selector">
        <span>Media type:</span>
        ${mediaTypes.map((item, index) => {
          const selected = this.selectedMediaType === index;
          const pressed = selected ? 'true' : 'false';
          return html`<anypoint-button
            part="content-action-button"
            class="media-toggle"
            data-index="${index}"
            ?activated="${selected}"
            aria-pressed="${pressed}"
            @click="${this._selectMediaType}"
            ?compatibility="${this.compatibility}"
            title="Select ${item} media type">${item}</anypoint-button>`;
        })}
      </div>` : undefined}

      <api-resource-example-document
        .amf="${this.amf}"
        .payloadId="${this.selectedBodyId}"
        .examples="${this._resolvedType}"
        .mediaType="${this.mediaType}"
        .typeName="${this.parentTypeName}"
        @has-examples-changed="${this._hasExamplesHandler}"
        ?noauto="${!!this.isScalar}"
        ?noactions="${this.noExamplesActions}"
        ?rawOnly="${!this.mediaType}"
        ?compatibility="${this.compatibility}"
        exportparts="${parts}"></api-resource-example-document>
    </section>

    ${this.isObject ? this._objectTemplate() : undefined}
    ${this.isArray ? this._arrayTemplate() : undefined}
    ${this.isScalar ? html`<property-shape-document
      class="shape-document"
      .amf="${this.amf}"
      .shape="${this._resolvedType}"
      .parentTypeName="${this.parentTypeName}"
      ?narrow="${this.narrow}"
      ?noexamplesactions="${this.noExamplesActions}"
      ?compatibility="${this.compatibility}"
      .mediaType="${this.mediaType}"
      ?graph="${this.graph}"></property-shape-document>` : undefined}
    ${this.isUnion ? this._unionTemplate() : undefined}
    ${this.isAnd ? this._anyTemplate() : undefined}`;
  }
}
window.customElements.define('api-type-document', ApiTypeDocument);
