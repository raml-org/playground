import { LitElement, html, css } from 'lit-element';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import { PropertyDocumentMixin } from './property-document-mixin.js';
import './api-type-document.js';
import './property-range-document.js';
/**
 * `property-shape-document`
 *
 * Renders a documentation for a shape property of AMF model.
 *
 * ## Styling
 *
 * `<property-shape-document>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--property-shape-document` | Mixin applied to this elment | `{}`
 * `--property-shape-document-array-color` | Property border color when type is an array | `#8BC34A`
 * `--property-shape-document-object-color` | Property border color when type is an object | `#FF9800`
 * `--property-shape-document-union-color` | Property border color when type is an union | `#FFEB3B`
 * `--arc-font-subhead` | Theme mixin, applied to the property title | `{}`
 * `--property-shape-document-title` | Mixin applied to the property title | `{}`
 * `--api-type-document-property-parent-color` | Color of the parent property label | `#757575`
 * `--api-type-document-property-color` | Color of the property name label when display name is used | `#757575`
 * `--api-type-document-child-docs-margin-left` | Margin left of item's description | `0px`
 * `--api-type-document-type-color` | Color of the "type" trait | `white`
 * `--api-type-document-type-background-color` | Background color of the "type" trait | `#1473bf`
 * `--api-type-document-trait-background-color` | Background color to main range trait (type name) | `#EEEEEE`,
 * `--api-type-document-trait-border-radius` | Border radious of a main property traits | `3px`
 * `--api-type-document-property-name-width` | Width of the left hand side column with property name | `240px`
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin PropertyDocumentMixin
 */
class PropertyShapeDocument extends PropertyDocumentMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      css`:host {
        display: block;
        border-bottom-width: 1px;
        border-bottom-color: var(--property-shape-document-border-bottom-color, #CFD8DC);
        border-bottom-style: var(--property-shape-document-border-bottom-style, dashed);
        padding: var(--property-shape-document-padding);
      }

      :host(:last-of-type) {
        border-bottom: none;
      }

      [hidden] {
        display: none !important;
      }

      .property-title {
        font-size: var(--property-shape-document-title-font-size, var(--arc-font-subhead-font-size));
        font-weight: var(--property-shape-document-title-font-weight, var(--arc-font-subhead-font-weight));
        line-height: var(--property-shape-document-title-line-height, var(--arc-font-subhead-line-height));

        margin: 4px 0 4px 0;
        font-size: 1rem;
        font-weight: var(--api-type-document-property-title-font-weight, 500);
        word-break: break-word;
        color: var(--api-type-document-property-title-color);
      }

      .property-title[secondary] {
        font-weight: var(--api-type-document-property-title-secondary-font-weight, 400);
        color: var(--api-type-document-property-title-secondary-color, #616161);
      }

      .parent-label {
        color: var(--api-type-document-property-parent-color, #757575);
      }

      .property-display-name {
        font-weight: var(--api-type-document-property-name-font-weight, 500);
        color: var(--api-type-document-property-name-color, var(--api-type-document-property-color, #212121));
        margin: 4px 0 4px 0;
        font-size: var(--api-type-document-property-name-font-size, 16px);
      }

      .doc-wrapper {
        transition: background-color 0.4s linear;
      }
      .doc-wrapper.with-description {
        margin-top: 20px;
      }

      :host([isobject]) .doc-wrapper.complex,
      :host([isunion]) .doc-wrapper.complex,
      :host([isarray]) .doc-wrapper.complex {
        padding-left: var(--api-type-document-child-docs-padding-left, 20px);
        margin-left: var(--api-type-document-child-docs-margin-left, 0px);
        margin-top: 12px;
        padding-right: var(--api-type-document-child-docs-padding-right, initial);
      }

      :host([isobject]) .doc-wrapper {
        border-left-color: var(--property-shape-document-object-color, #FF9800);
        border-left-width: 2px;
        border-left-style: solid;
        padding-left: 12px;
      }

      :host([isarray]) .doc-wrapper {
        border-left: 2px var(--property-shape-document-array-color, #8BC34A) solid;
        padding-left: 12px;
      }

      :host([isunion]) .doc-wrapper {
        border-left: 2px var(--property-shape-document-union-color, #FFEB3B) solid;
        padding-left: 12px;
      }

      .property-traits {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }

      .property-traits > span {
        display: inline-block;
        margin-right: 8px;
        padding: var(--api-type-document-trait-padding, 2px 4px);
        background-color: var(--api-type-document-trait-background-color, #EEEEEE);
        color: var(--api-type-document-trait-color, #616161);
        border-radius: var(--api-type-document-trait-border-radius, 3px);
        font-size: var(--api-type-document-trait-font-size, 13px);
      }

      .property-traits > span.data-type {
        background-color: var(--api-type-document-type-background-color, #1473bf);
        color: var(--api-type-document-type-color, white);
        padding: var(--api-type-document-trait-data-type-padding, 2px 4px);
        font-weight: var(--api-type-document-trait-data-type-font-weight, normal);
      }

      :host([narrow]) .property-description {
        margin: 20px 0;
      }

      .content-wrapper,
      .shape-docs {
        margin-top: 12px;
      }

      /* .content-wrapper {
        display: flex;
        flex-direction: row;
      } */

      .shape-properties {
        min-width: var(--api-type-document-property-name-width, 120px);
      }

      .shape-docs {
        flex: 1;
        flex-basis: 0.000000001px;
        word-break: break-word;
        overflow: hidden;
      }

      .shape-docs .doc-wrapper {
        border-left: none !important;
        padding-left: 0 !important;
      }

      /* :host([narrow]) .content-wrapper {
        display: block;
        -ms-flex-direction: initial;
        -webkit-flex-direction: initial;
        flex-direction: initial;
      } */

      :host([narrow]) .shape-docs {
        -ms-flex: initial;
        -webkit-flex: initial;
        flex: initial;
        -webkit-flex-basis: initial;
        flex-basis: initial;
      }

      :host([narrow]) .shape-properties {
        min-width: 100%;
      }

      :host([narrow]) .shape-properties > * {
        display: inline-block;
        vertical-align: middle;
        margin-right: 8px;
      }

      arc-marked {
        background-color: transparent;
        padding: 0;
      }

      .link-label {
        text-decoration: underline;
        cursor: pointer;
      }`
    ];
  }

  static get properties() {
    return {
      /**
       * Computed value of shape's http://raml.org/vocabularies/shapes#range
       * @type {Object}
       */
      range: { type: Object },
      /**
       * Computed value of "display name" of the property
       */
      displayName: { type: String },
      /**
       * A type property name.
       * This may be different from `displayName` property if
       * `displayName` was specified in the API spec for this property.
       */
      propertyName: { type: String },
      /**
       * Computed value, true if `displayName` has been defined for this
       * property.
       */
      hasDisplayName: { type: Boolean },
      /**
       * Computed value, true if current property is an union.
       */
      isUnion: {
        type: Boolean,
        reflect: true
      },
      /**
       * Computed value, true if current property is an object.
       */
      isObject: {
        type: Boolean,
        reflect: true
      },
      /**
       * Computed value, true if current property is an array.
       */
      isArray: {
        type: Boolean,
        reflect: true
      },
      /**
       * Computed value, true if this propery contains a complex
       * structure. It is computed when the property is and array,
       * object, or union.
       */
      isComplex: { type: Boolean },
      /**
       * Should be set if described properties has a parent type.
       * This is used when recursively iterating over properties.
       */
      parentTypeName: { type: String },
      /**
       * Computed value, true if `parentTypeName` has a value.
       */
      hasParentTypeName: { type: Boolean },
      /**
       * Computed value of shape data type
       * @type {Object}
       */
      propertyDataType: { type: String },
      /**
       * Computed value form the shape. True if the property is required.
       */
      isRequired: { type: Boolean },
      /**
       * Computed value form the shape. True if the property is ENUM.
       */
      isEnum: { type: Boolean },
      /**
       * A description of the property to render.
       */
      propertyDescription: { type: String },
      /**
       * Computed value, true if desceription is set.
       */
      hasPropertyDescription: { type: Boolean },
      /**
       * A property to set when the component is rendered in the narrow
       * view. To be used with mobile rendering or when the
       * components occupies only small part of the screen.
       */
      narrow: {
        type: Boolean,
        reflect: true
      },
      /**
       * When set it removes actions bar from the examples render.
       */
      noExamplesActions: { type: Boolean },

      _targetTypeId: { type: String },
      _targetTypeName: { type: String }
    };
  }

  get shape() {
    return this._shape;
  }

  set shape(value) {
    if (this._setObservableProperty('shape', value)) {
      this._shapeChanged(value);
      this._shapeRangeChanged(value, this._range);
    }
  }

  get range() {
    return this._range;
  }

  set range(value) {
    if (this._setObservableProperty('range', value)) {
      this._rangeChanged(value);
      this._shapeRangeChanged(this._shape, value);
    }
  }

  get parentTypeName() {
    return this._parentTypeName;
  }

  set parentTypeName(value) {
    if (this._setObservableProperty('parentTypeName', value)) {
      this.hasParentTypeName = !!value;
    }
  }

  constructor() {
    super();
    this.hasDisplayName = false;
    this.hasParentTypeName = false;
    this.hasPropertyDescription = false;
  }

  __amfChanged() {
    this._shapeChanged(this._shape);

    this._evaluateGraph();
  }

  _shapeChanged(shape) {
    if (!this._amf) {
      return;
    }
    this.range = this._computeRange(shape);
    this.isRequired = this._computeIsRequired(shape);
  }

  _rangeChanged(range) {
    this.propertyDescription = this._computeDescription(range);
    this.hasPropertyDescription = this._computeHasStringValue(this.propertyDescription);
    this.isEnum = this._computeIsEnum(range);
    this.isUnion = this._computeIsUnion(range);
    this.isObject = this._computeIsObject(range);
    this.isArray = this._computeIsArray(range);
    this.isComplex = this._computeIsComplex(this.isUnion, this.isObject, this.isArray);

    this._evaluateGraph();
  }

  _shapeRangeChanged(shape, range) {
    this.displayName = this._computeDisplayName(range, shape);
    this.propertyName = this._computePropertyName(range, shape);
    this.hasDisplayName = this._computeHasDisplayName(this.displayName, this.propertyName);
    this.propertyDataType = this._computeObjectDataType(range, shape);
  }

  _computeObjectDataType(range, shape) {
    let type = range && this._computeRangeDataType(this._resolve(range));
    if (!type) {
      type = shape && this._computeRangeDataType(this._resolve(shape));
    }
    return type;
  }
  /**
   * Computes name of the property. This may be different from the
   * `displayName` if `displayName` is set in API spec.
   *
   * @param {Object} range Range object of current shape.
   * @param {Object} shape The shape object
   * @return {String} Display name of the property
   */
  _computePropertyName(range, shape) {
    if (!shape && !range) {
      return;
    }
    if (shape) {
      shape = this._resolve(shape);
      if (this._hasType(shape, this.ns.raml.vocabularies.http + 'Parameter')) {
        return this._getValue(shape, this.ns.schema.schemaName);
      }
      if (this._hasType(shape, this.ns.w3.shacl.name + 'PropertyShape') ||
        this._hasType(shape, this.ns.raml.vocabularies.shapes + 'NilShape') ||
        this._hasType(shape, this.ns.raml.vocabularies.shapes + 'AnyShape')) {
        return this._getValue(shape, this.ns.w3.shacl.name + 'name');
      }
    }
    if (range) {
      range = this._resolve(range);
      const name = this._getValue(range, this.ns.w3.shacl.name + 'name');
      if (name === 'items' &&
      this._hasType(shape, this.ns.raml.vocabularies.shapes + 'ScalarShape')) {
        return;
      }
      return name;
    }
  }
  /**
   * Computes value for `hasDisplayName` property.
   * Indicates that `displayName` has been defined in the API specification.
   *
   * @param {String} displayName
   * @param {String} propertyName
   * @return {Boolean}
   */
  _computeHasDisplayName(displayName, propertyName) {
    return !!(displayName) && displayName !== propertyName;
  }
  /**
   * Computes value for `hasParentTypeName`.
   * @param {String?} parentTypeName
   * @return {Boolean}
   */
  _computeHasParentTypeName(parentTypeName) {
    return !!parentTypeName;
  }
  /**
   * Computes value for `isRequired` property.
   * In AMF model a property is required when `http://www.w3.org/ns/shacl#minCount`
   * does not equal `0`.
   *
   * @param {Object} shape Current shape object
   * @return {Boolean}
   */
  _computeIsRequired(shape) {
    if (!shape) {
      return false;
    }
    shape = this._resolve(shape);
    if (this._hasType(shape, this.ns.raml.vocabularies.http + 'Parameter')) {
      return this._getValue(shape, this.ns.w3.hydra.core + 'required');
    }
    const data = this._getValue(shape, this.ns.w3.shacl.name + 'minCount');
    return data !== undefined && data !== 0;
  }
  /**
   * Computes value `isEnum` property.
   * @param {Object} range Current `range` object.
   * @return {Boolean} Curently it always returns `false`
   */
  _computeIsEnum(range) {
    const ikey = this._getAmfKey(this.ns.w3.shacl.name + 'in');
    return !!(range && (ikey in range));
  }
  /**
   * Computes value for `propertyDescription`.
   * @param {Object} range Range model
   * @return {String} Description to render.
   */
  _computeDescription(range) {
    if (!range) {
      return;
    }
    return this._getValue(range, this.ns.schema.desc);
  }
  /**
   * Computes value for `isComplex` property.
   * @param {Boolean} isUnion
   * @param {Boolean} isObject
   * @param {Boolean} isArray
   * @return {Boolean}
   */
  _computeIsComplex(isUnion, isObject, isArray) {
    return isUnion || isObject || isArray;
  }

  _evaluateGraph() {
    this._targetTypeId = undefined;
    this._targetTypeName = undefined;
    if (!this.graph) {
      return;
    }
    const { amf, range } = this;
    if (!amf || !range) {
      return;
    }
    const sKey = this._getAmfKey(this.ns.raml.vocabularies.docSourceMaps + 'sources');
    const maps = this._ensureArray(range[sKey]);
    if (!maps) {
      return;
    }
    const dKey = this._getAmfKey(this.ns.raml.vocabularies.docSourceMaps + 'declared-element');
    const dElm = this._ensureArray(maps[0][dKey]);
    if (!dElm) {
      return;
    }
    const id = this._getValue(dElm[0], this.ns.raml.vocabularies.docSourceMaps + 'element');
    this._targetTypeId = id;
    const type = this._getType(amf, id);
    if (!type) {
      return;
    }

    this._targetTypeName = this._getValue(type, this.ns.w3.shacl.name + 'name');
  }

  _getType(amf, id) {
    const dcs = this._computeDeclares(amf);
    let refs; // this._computeReferences(amf);
    return this._computeType(dcs, refs, id);
  }

  _navigateType() {
    const e = new CustomEvent('api-navigation-selection-changed', {
      bubbles: true,
      composed: true,
      detail: {
        selected: this._targetTypeId,
        type: 'type'
      }
    });
    this.dispatchEvent(e);
  }

  _linkKeydown(e) {
    if (e.key === 'Enter') {
      this._navigateType();
    }
  }

  _complexTemplate() {
    if (!this.isComplex) {
      return;
    }
    const range = this._resolve(this.range);
    const parentTypeName = this.isArray ? 'item' : this.displayName;
    return html`<div class="doc-wrapper complex">
      <div class="doc-content">
      <api-type-document
        class="children"
        .amf="${this.amf}"
        .type="${range}"
        .parentTypeName="${parentTypeName}"
        ?narrow="${this.narrow}"
        ?compatibility="${this.compatibility}"
        ?noexamplesactions="${this.noExamplesActions}"
        nomainexample
        .mediaType="${this.mediaType}"
        ?graph="${this.graph}"></api-type-document>
      </div>
    </div>`;
  }

  _getTypeNameTemplate() {
    const dataType = this.propertyDataType;
    const id = this._targetTypeId;
    if (id) {
      const label = this._targetTypeName;
      return html`
        <span
          class="data-type link-label"
          role="link"
          tabindex="0"
          @click="${this._navigateType}"
          @keydown="${this._linkKeydown}">${label}</span>
        <span class="type-data-type">${dataType}</span>
      `;
    }
    return html`<span class="data-type">${dataType}</span>`;
  }

  render() {
    return html`
    ${this.hasDisplayName ? html`<div class="property-display-name">${this.displayName}</div>` : undefined}
    ${this.propertyName ? html`<div class="property-title" ?secondary="${this.hasDisplayName}">
      <span class="parent-label" ?hidden="${!this.hasParentTypeName}">${this.parentTypeName}.</span>
      <span class="property-name">${this.propertyName}</span>
    </div>` : undefined}

    <div class="content-wrapper">
      <div class="shape-properties">
        <div class="property-traits">
          ${this._getTypeNameTemplate()}
          ${this.isRequired ?
            html`<span class="required-type" title="This property is required by the API">Required</span>` : undefined}
          ${this.isEnum ?
            html`<span class="enum-type" title="This property represent enumerable value">Enum</span>` : undefined}
        </div>
      </div>
      <div class="shape-docs">
      ${this.hasPropertyDescription ? html`<div class="property-description">
          <arc-marked .markdown="${this.propertyDescription}">
            <div slot="markdown-html" class="markdown-body"></div>
          </arc-marked>
        </div>` : undefined}

        <div class="doc-wrapper ${this.hasPropertyDescription ? 'with-description' : ''}">
          <div class="doc-content">
            <property-range-document
              .amf="${this.amf}"
              .shape="${this.shape}"
              .range="${this.range}"
              ?compatibility="${this.compatibility}"
              ?noexamplesactions="${this.noExamplesActions}"
              .mediaType="${this.mediaType}"
              .propertyName="${this.propertyName}"
              ?graph="${this.graph}"></property-range-document>
          </div>
        </div>
      </div>
    </div>

    ${this._complexTemplate()}`;
  }
}
window.customElements.define('property-shape-document', PropertyShapeDocument);
