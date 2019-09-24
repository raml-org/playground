import { LitElement, html, css } from 'lit-element';
import '@api-components/api-annotation-document/api-annotation-document.js';
import '@api-components/api-resource-example-document/api-resource-example-document.js';
import { PropertyDocumentMixin } from './property-document-mixin.js';
import './api-type-document.js';
/**
 * `property-range-document`
 *
 * Renders a documentation for a shape property of AMF model.
 *
 * ## Styling
 *
 * `<property-range-document>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--property-range-document` | Mixin applied to this elment | `{}`
 * `--api-type-document-type-attribute-color` | Color of each attribute that describes a property | `#616161`
 * `--api-type-document-examples-title-color` | Color of examples section title | ``
 * `--api-type-document-examples-border-color` | Example section border color | `transparent`
 * `--code-background-color` | Background color of the examples section | ``
 * `--arc-font-body1` | Mixin applied to an example name label | `{}`
 * `--arc-font-body2` | Mixin applied to the examples section title | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin PropertyDocumentMixin
 */
class PropertyRangeDocument extends PropertyDocumentMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
    }

    [hidden] {
      display: none !important;
    }

    .property-attribute {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      margin: 4px 0;
      padding: 0;
      color: var(--api-type-document-type-attribute-color, #616161);
    }

    .property-attribute:last-of-type {
      margin-bottom: 12px;
    }

    .attribute-label {
      font-weight: 500;
      margin-right: 12px;
    }

    .attribute-value {
      flex: 1;
      flex-basis: 0.000000001px;
    }

    .attribute-value ul {
      margin: 0;
      padding-left: 18px;
    }

    .examples {
      border: 1px var(--api-type-document-examples-border-color, transparent) solid;
      background-color: var(--code-background-color);
    }

    api-annotation-document {
      margin-bottom: 12px;
    }

    .examples-section-title {
      font-size: var(--arc-font-body2-font-size);
      font-weight: var(--arc-font-body2-font-weight);
      line-height: var(--arc-font-body2-line-height);
      padding: 8px;
      margin: 0;
      color: var(--api-type-document-examples-title-color);
    }

    .example-title {
      font-weight: var(--arc-font-body1-font-weight);
      line-height: var(--arc-font-body1-line-height);
      font-size: 15px;
      margin: 0;
      padding: 0 8px;
    }`;
  }

  static get properties() {
    return {
      /**
       * Name of the property that is being described by this definition.
       */
      propertyName: { type: String },
      /**
       * Computed value form the shape. True if the property is ENUM.
       */
      isEnum: { type: Boolean, reflect: true },
      /**
       * Computed value, true if current property is an union.
       */
      isUnion: { type: Boolean, reflect: true },
      /**
       * Computed value, true if current property is an object.
       */
      isObject: { type: Boolean, reflect: true },
      /**
       * Computed value, true if current property is an array.
       */
      isArray: { type: Boolean, reflect: true },
      /**
       * Computed value, true if current property is a File.
       */
      isFile: { type: Boolean },
      /**
       * Computed values for list of enums.
       * Enums are list of types names.
       *
       * @type {Array<String>}
       */
      enumValues: { type: Array },
      /**
       * When set it removes actions bar from the examples render.
       */
      noExamplesActions: { type: Boolean },
      _hasExamples: { type: Boolean },
      exampleSectionTitle: { type: String }
    };
  }

  get range() {
    return this._range;
  }

  set range(value) {
    if (this._setObservableProperty('range', value)) {
      this._rangeChanged(value);
    }
  }

  _rangeChanged(range) {
    this._hasExamples = false;
    const isEnum = this.isEnum = this._computeIsEnum(range);
    this.isUnion = this._computeIsUnion(range);
    this.isObject = this._computeIsObject(range);
    this.isArray = this._computeIsArray(range);
    this.isFile = this._computeIsFile(range);
    this.enumValues = isEnum ? this._computeEnumValues(range) : false;
  }
  /**
   * Computes value `isEnum` property.
   * @param {Object} range Current `range` object.
   * @return {Boolean} Curently it always returns `false`
   */
  _computeIsEnum(range) {
    const key = this._getAmfKey(this.ns.w3.shacl.name + 'in');
    return !!(range && (key in range));
  }
  /**
   * Computes value for `isUnion` property.
   * Union type is identified as a `http://raml.org/vocabularies/shapes#UnionShape`
   * type.
   *
   * @param {Object} range Range object of current shape.
   * @return {Boolean}
   */
  _computeIsUnion(range) {
    return this._hasType(range, this.ns.raml.vocabularies.shapes + 'UnionShape');
  }
  /**
   * Computes value for `isObject` property.
   * Object type is identified as a `http://raml.org/vocabularies/shapes#NodeShape`
   * type.
   *
   * @param {Object} range Range object of current shape.
   * @return {Boolean}
   */
  _computeIsObject(range) {
    return this._hasType(range, this.ns.w3.shacl.name + 'NodeShape');
  }

  /**
   * Computes value for `isArray` property.
   * Array type is identified as a `http://raml.org/vocabularies/shapes#ArrayShape`
   * type.
   *
   * @param {Object} range Range object of current shape.
   * @return {Boolean}
   */
  _computeIsArray(range) {
    return this._hasType(range, this.ns.raml.vocabularies.shapes + 'ArrayShape');
  }
  /**
   * Computes value for `isFile` property
   *
   * @param {Object} range Range object of current shape.
   * @return {Boolean}
   */
  _computeIsFile(range) {
    return this._hasType(range, this.ns.raml.vocabularies.shapes + 'FileShape');
  }

  _computeObjectProperties(range) {
    if (!range) {
      return;
    }
    const pkey = this._getAmfKey(this.ns.w3.shacl.name + 'property');
    return range[pkey];
  }
  /**
   * Computes value for `enumValues` property.
   *
   * @param {Object} range Range object of current shape.
   * @return {Array<String>|undefined} List of enum types.
   */
  _computeEnumValues(range) {
    if (!range) {
      return;
    }
    const ikey = this._getAmfKey(this.ns.w3.shacl.name + 'in');
    let model = range[ikey];
    if (!model) {
      return;
    }
    model = this._ensureArray(model);
    if (model instanceof Array) {
      model = model[0];
    }
    const results = [];
    Object.keys(model).forEach((key) => {
      const amfKey = this._getAmfKey('http://www.w3.org/2000/01/rdf-schema#');
      if (key.indexOf(amfKey) !== 0) {
        return;
      }
      let value = model[key];
      if (value instanceof Array) {
        value = value[0];
      }
      let result = this._getValue(value, this.ns.raml.vocabularies.data + 'value');
      if (result) {
        if (result['@value']) {
          result = result['@value'];
        }
        results.push(result);
      }
    });
    return results;
  }

  _examplesChanged(e) {
    const { value } = e.detail;
    this.exampleSectionTitle = value && value.length === 1 ? 'Example' : 'Examples';
  }

  _hasExamplesHandler(e) {
    this._hasExamples = e.detail.value;
  }

  _listItemTemplate(label, title, key, isArray) {
    let value = isArray ? this._getValueArray(this.range, key) : this._getValue(this.range, key);
    if (isArray && value instanceof Array) {
      value = value.join(', ');
    }
    return html`<div class="property-attribute" part="property-attribute">
      <span class="attribute-label" part="attribute-label">${label}:</span>
      <span class="attribute-value" part="attribute-value" title="${title}">${value}</span>
    </div>`;
  }

  _nonFilePropertisTemplate() {
    const range = this.range;
    return html`
    ${this._hasProperty(range, this.ns.w3.shacl.minLength) ?
      this._listItemTemplate('Minimum characters', 'Minimum number of characters in the value', this.ns.w3.shacl.minLength) :
      undefined}
    ${this._hasProperty(range, this.ns.w3.shacl.maxLength) ?
      this._listItemTemplate('Maximum characters', 'Maximum number of characters in the value', this.ns.w3.shacl.maxLength) :
      undefined}`;
  }

  _filePropertisTemplate() {
    const range = this.range;
    return html`
    <section class="file-properties">
    ${this._hasProperty(range, this.ns.w3.shacl.fileType) ?
      this._listItemTemplate('File types', 'File mime types accepted by the endpoint', this.ns.w3.shacl.fileType, true) :
      undefined}
    ${this._hasProperty(range, this.ns.aml.vocabularies.shapes + 'fileType') ?
      this._listItemTemplate('File types', 'File mime types accepted by the endpoint',
        this.ns.aml.vocabularies.shapes + 'fileType', true) :
      undefined}
    ${this._hasProperty(range, this.ns.w3.shacl.minLength) ?
      this._listItemTemplate('File minimum size', 'Minimum size of the file accepted by this endpoint',
        this.ns.w3.shacl.minLength) :
      undefined}
    ${this._hasProperty(range, this.ns.w3.shacl.maxLength) ?
      this._listItemTemplate('File maximum size', 'Maximum size of the file accepted by this endpoint',
        this.ns.w3.shacl.maxLength) :
      undefined}
    </section>`;
  }

  _enumTemplate() {
    const items = this.enumValues;
    if (!items || !items.length) {
      return;
    }
    return html`<div class="property-attribute enum-values" part="property-attribute">
      <span class="attribute-label" part="attribute-label">Enum values:</span>
      <span class="attribute-value" part="attribute-value" title="List of possible values to use with this property">
        <ul>
        ${items.map((item) => html`<li>${item}</li>`)}
        </ul>
      </span>
    </div>`;
  }

  render() {
    const range = this.range;
    return html`
    ${this._hasProperty(range, this.ns.w3.shacl.defaultValueStr) ?
      this._listItemTemplate('Default value', 'This value is used as a default value', this.ns.w3.shacl.defaultValueStr) :
      undefined}
    ${this._hasProperty(range, this.ns.w3.shacl.pattern) ?
      this._listItemTemplate('Pattern', 'Regular expression value for this property', this.ns.w3.shacl.pattern) :
      undefined}
    ${this._hasProperty(range, this.ns.w3.shacl.minInclusive) ?
      this._listItemTemplate('Min value', 'Minimum numeric value possible to set on this property',
        this.ns.w3.shacl.minInclusive) :
      undefined}
    ${this._hasProperty(range, this.ns.w3.shacl.maxInclusive) ?
      this._listItemTemplate('Max value', 'Maximum numeric value possible to set on this property',
        this.ns.w3.shacl.maxInclusive) :
      undefined}
    ${this._hasProperty(range, this.ns.w3.shacl.multipleOf) ?
      this._listItemTemplate('Multiple of', 'The numeric value has to be multiplicable by this value',
        this.ns.w3.shacl.multipleOf) :
      undefined}
    ${this.isFile ? this._filePropertisTemplate() : this._nonFilePropertisTemplate()}
    ${this.isEnum ? this._enumTemplate() : undefined}

    <api-annotation-document ?compatibility="${this.compatibility}" .amf="${this.amf}" .shape="${this.range}"></api-annotation-document>
    <section class="examples" ?hidden="${!this._hasExamples}">
      <api-resource-example-document
        .amf="${this.amf}"
        .examples="${range}"
        .mediaType="${this.mediaType}"
        .typeName="${this.propertyName}"
        noauto
        ?compatibility="${this.compatibility}"
        ?noactions="${this.noExamplesActions}"
        ?rawonly="${!this._hasMediaType}"
        ?graph="${this.graph}"
        @rendered-examples-changed="${this._examplesChanged}"
        @has-examples-changed="${this._hasExamplesHandler}"></api-resource-example-document>
    </section>`;
  }
}
window.customElements.define('property-range-document', PropertyRangeDocument);
