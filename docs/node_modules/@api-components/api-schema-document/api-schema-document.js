import { LitElement, html, css } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@polymer/prism-element/prism-highlighter.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tabs.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tab.js';
import '@api-components/raml-aware/raml-aware.js';
import './api-schema-render.js';

/**
 * `api-schema-document`
 *
 * A component to render XML schema with examples.
 *
 * Note, if AMF contains unresolved properties (reference-id without resolving
 * the value) this element will resolve it. `amf` must be set on this
 * element to resolve the references.
 *
 * ## Styling
 *
 * `<api-schema-document>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-schema-document` | Mixin applied to this elment | `{}`
 * `api-schema-render` | Mixin applied to schema renderer element | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiSchemaDocument extends AmfHelperMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
    }`;
  }

  render() {
    return html`<prism-highlighter></prism-highlighter>
    ${this.aware ?
      html`<raml-aware @api-changed="${this._apiChanged}" .scope="${this.aware}"></raml-aware>` : undefined}

    ${this._schemaOnly ? this._schemaOnlyTemplate() : undefined}
    ${this._exampleOnly ? this._exampleOnlyTemplate() : undefined}
    ${this._schemaAndExample ? this._schemaAndExampleTemplate() : undefined}`;
  }

  _exampleOnlyTemplate() {
    const items = this._examples;
    if (!items || !items.length) {
      return;
    }
    return items.map((item) => html`<api-schema-render
      .code="${this._computeExampleValue(item)}"></api-schema-render>`);
  }

  _schemaAndExampleTemplate() {
    return html`
    <anypoint-tabs
      class="schemas"
      .selected="${this.selectedPage}"
      ?compatibility="${this.compatibility}"
      @selected-changed="${this._selectedPageChanged}">
      <anypoint-tab>Schema</anypoint-tab>
      <anypoint-tab>Examples</anypoint-tab>
    </anypoint-tabs>
    ${this._renderSelectedPage()}`;
  }

  _renderSelectedPage() {
    switch (this.selectedPage) {
      case 0: return this._schemaOnlyTemplate();
      case 1: return this._exampleOnlyTemplate();
      default: return '';
    }
  }

  _schemaOnlyTemplate() {
    return html`<api-schema-render .code="${this._raw}"></api-schema-render>`;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: String,
      /**
       * AMF's shape object object.
       * Values for sheba and examples are computed from this model.
       */
      shape: Object,
      /**
       * Computed `http://www.w3.org/ns/shacl#raw`
       */
      _raw: String,
      /**
       * Computed list of examples
       */
      _examples: Array,

      /**
       * Computed value, true when data contains example only
       */
      _exampleOnly: { type: Boolean },
      /**
       * Computed value, true when data contains xml schema only
       */
      _schemaOnly: { type: Boolean },
      /**
       * Computed value, true when data contains example and schema information
       */
      _schemaAndExample: { type: Boolean },
      /**
       * Currently selected tab.
       * Relevant when the example contains both example and schema.
       */
      selectedPage: { type: Number },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean }
    };
  }

  get shape() {
    return this._shape;
  }

  set shape(value) {
    const old = this._shape;
    this._shape = value;
    this.requestUpdate('shape', old);
    this._schemaChanged(value);
  }

  constructor() {
    super();
    this.selectedPage = 0;
  }

  _apiChanged(e) {
    this.amf = e.detail.value;
  }

  _selectedPageChanged(e) {
    this.selectedPage = e.detail.value;
  }
  /**
   * Comnputes besic properties for the view.
   * @param {Object} schema `shape` value
   */
  _schemaChanged(schema) {
    this._examples = undefined;
    this._raw = undefined;
    let exampleOnly = false;
    let schemaOnly = false;
    let schemaAndExample = false;
    let raw;
    let examples;

    if (schema) {
      schema = this._resolve(schema);
      if (this._hasType(schema, this.ns.w3.shacl.name + 'SchemaShape') ||
        this._hasType(schema, this.ns.raml.vocabularies.shapes + 'AnyShape') ||
        this._hasType(schema, this.ns.raml.vocabularies.shapes + 'ScalarShape') ||
        this._hasType(schema, this.ns.w3.shacl.name + 'NodeShape')) {
        raw = this._getValue(schema, this.ns.raml.vocabularies.document + 'raw');
        if (!raw) {
          raw = this._getValue(schema, this.ns.w3.shacl.name + 'raw');
        }
        const key = this._getAmfKey(this.ns.raml.vocabularies.document + 'examples');
        const exs = this._ensureArray(schema[key]);
        examples = this._processExamples(exs);
      }
    }
    exampleOnly = !!(examples && examples.length && !raw);
    schemaOnly = !!(!examples && raw);
    schemaAndExample = !!(raw && examples && examples.length);
    this._exampleOnly = exampleOnly;
    this._schemaOnly = schemaOnly;
    this._schemaAndExample = schemaAndExample;
    this._examples = examples;
    this._raw = raw;
  }

  _processExamples(examples) {
    if (!examples || !examples.length) {
      return;
    }
    return examples.map((item) => this._resolve(item));
  }

  _computeExampleValue(item) {
    item = this._resolve(item);
    let raw = this._getValue(item, this.ns.raml.vocabularies.document + 'raw');
    if (!raw) {
      raw = this._getValue(item, this.ns.w3.shacl.name + 'raw');
    }
    return raw;
  }
}
window.customElements.define('api-schema-document', ApiSchemaDocument);
