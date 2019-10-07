import { LitElement, html, css } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import { expandMore } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-type-document/api-type-document.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@api-components/api-schema-document/api-schema-document.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@api-components/api-resource-example-document/api-resource-example-document.js';
/**
 * `api-body-document`
 *
 * A component to render HTTP method body documentation based on AMF model.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiBodyDocument extends AmfHelperMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      css`:host {
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
        border-bottom: 1px var(--api-body-document-title-border-color, #e5e5e5) solid;
      }

      .section-title-area .table-title {
        flex: 1;
        flex-basis: 0.000000001px;
        font-size: var(--api-body-document-title-narrow-font-size, initial);
      }

      .toggle-button {
        outline: none;
      }

      .toggle-icon {
        margin-left: 8px;
        transform: rotateZ(0deg);
        transition: transform 0.3s ease-in-out;
      }

      .toggle-icon.opened {
        transform: rotateZ(-180deg);
      }

      .table-title {
        font-size: var(--arc-font-subhead-font-size);
        font-weight: var(--arc-font-subhead-font-weight);
        line-height: var(--arc-font-subhead-line-height);
      }

      :host([narrow]) .table-title {
        font-size: var(--api-body-document-title-narrow-font-size, initial);
      }

      .type-title {
        font-size: var(--arc-font-body2-font-size);
        font-weight: var(--arc-font-body2-font-weight);
        line-height: var(--arc-font-body2-line-height);
      }

      .body-name {
        font-weight: var(--api-body-document-any-info-font-weight, 500);
        font-size: 1.1rem;
      }

      anypoint-button[active] {
        background-color: var(--api-body-document-media-button-background-color, #CDDC39);
      }

      .media-type-selector {
        margin: 20px 0;
      }

      .markdown-html {
        margin-bottom: 28px;
        margin-top: 28px;
        color: var(--api-body-document-description-color, rgba(0, 0, 0, 0.74));
      }

      .markdown-html[data-with-title] {
        margin-top: 0;
      }

      .examples {
        margin-top: 12px;
        border: 1px var(--api-body-document-examples-border-color, transparent) solid;
      }

      .examples,
      api-schema-document {
        background-color: var(--code-background-color);
      }

      .examples-section-title {
        font-size: 16px;
        padding: 16px 12px;
        margin: 0;
        color: var(--api-body-document-examples-title-color);
      }

      api-resource-example-document,
      api-schema-document {
        padding: 8px;
        color: var(--api-body-document-code-color, initial);
        word-break: break-all;
      }

      .media-type-label {
        font-weight: var(--api-body-document-media-type-label-font-weight, 500);
        margin-left: 8px;
      }

      .media-toggle {
        outline: none;
        color: var(--api-body-document-toggle-view-color, var(--arc-toggle-view-icon-color, rgba(0, 0, 0, 0.74)));
      }

      .any-info,
      .any-info-description {
        color: var(--api-body-document-description-color, rgba(0, 0, 0, 0.74));
      }

      .any-info {
        font-size: var(--api-body-document-any-info-font-size, 16px);
      }

      arc-marked {
        background-color: transparent;
        padding: 0px;
      }

      .icon {
        display: block;
        width: 24px;
        height: 24px;
        fill: currentColor;
      }`
    ];
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * Set to true to open the body view.
       * Autormatically updated when the view is toggled from the UI.
       */
      opened: { type: Boolean },
      /**
       * AMF model for body as a `http://raml.org/vocabularies/http#payload`
       * type.
       * @type {Array<Object>}
       */
      body: { type: Array },
      /**
       * List of discovered media types in the `body`.
       * @type {Array<Object>}
       */
      _mediaTypes: { type: Array },
      /**
       * Computed value. True when mediaTypes has more than one item.
       */
      _renderMediaSelector: { type: Boolean },
      /**
       * Currently selected media type.
       * It is an index of a media type in `mediaTypes` array.
       * It is set to `0` each time the body changes.
       */
      selected: { type: Number },
      /**
       * A body model for selected media type.
       * Computed automatically when selection change.
       */
      _selectedBody: { type: Object },
      /**
       * Selected body ID.
       * It is computed here and passed to the type document to render
       * examples.
       */
      _selectedBodyId: { type: String },
      /**
       * Computed AMF schema object for the body.
       */
      _selectedSchema: { type: Object },
      /**
       * Name of the selected media type.
       */
      _selectedMediaType: { type: String },
      /**
       * True if selected body is a structured object
       */
      _isObject: { type: Boolean },
      /**
       * True if selected body is a schema (JSON, XML, ...) data
       */
      _isSchema: { type: Boolean },
      /**
       * Computed value, true if the body is of "any" type.
       */
      _isAnyType: { type: Boolean },
      /**
       * Name of the resource type if any.
       */
      _typeName: { type: String },
      /**
       * Computed value, true if `typeName` is set.
       */
      _hasTypeName: { type: Boolean },
      /**
       * Body name, if defined
       */
      _bodyName: { type: String },
      /**
       * Name of the resource type if any.
       */
      _description: { type: String },
      /**
       * Set to render a mobile friendly view.
       */
       narrow: {
         type: Boolean,
         reflect: true
       },
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
        * When enabled it renders external types as links and dispatches
        * `api-navigation-selection-changed` when clicked.
        */
       graph: { type: Boolean },
       _hasObjectExamples: { type: Boolean },
       _hasAnyExamples: { type: Boolean }
    };
  }
  get _mediaTypes() {
    return this.__mediaTypes;
  }
  set _mediaTypes(value) {
    if (this._sop('_mediaTypes', value)) {
      this._renderMediaSelector = this._computeRenderMediaSelector(value);
    }
  }
  get _selectedBody() {
    return this.__selectedBody;
  }
  set _selectedBody(value) {
    if (this._sop('_selectedBody', value)) {
      this._selectedBodyChanged(value);
    }
  }
  get _selectedSchema() {
    return this.__selectedSchema;
  }
  set _selectedSchema(value) {
    if (this._sop('_selectedSchema', value)) {
      this._selectedSchemaChanged(value);
    }
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    if (this._sop('selected', value)) {
      this._selectedBody = this._computeSelectedBody(value, this.body);
      this._selectedMediaType = this._computeSelectedMediaName(value, this.body);
    }
  }

  get body() {
    return this._body;
  }

  set body(value) {
    if (this._sop('body', value)) {
      this._selectedBody = this._computeSelectedBody(this.selected, value);
      this._selectedMediaType = this._computeSelectedMediaName(this.selected, value);
      this._bodyChanged();
    }
  }

  __amfChanged() {
    this._bodyChanged();
  }

  /**
   * Sets observable property that causes render action.
   * @param {String} prop Property name
   * @param {any} value Value to set
   * @return {Boolean} True when the property has been updated.
   */
  _sop(prop, value) {
    const key = '_' + prop;
    const old = this[key];
    if (old === value) {
      return false;
    }
    this[key] = value;
    this.requestUpdate(prop, old);
    return true;
  }

  constructor() {
    super();
    this._renderMediaSelector = false;
    this._hasObjectExamples = false;
    this._hasAnyExamples = false;
    this.headerLevel = 2;
  }

  _bodyChanged() {
    if (this.__bodyChangedDebounce) {
      return;
    }
    this.__bodyChangedDebounce = true;
    setTimeout(() => {
      this.__bodyChangedDebounce = false;
      this.__bodyChanged(this.body);
    });
  }

  /**
   * Computes basic view values when body change.
   *
   * @param {Object} body
   */
  __bodyChanged(body) {
    if (!body) {
      return;
    }
    this.selected = -1;
    const media = this._computeMediaTypes(body);
    this._mediaTypes = media;
    this.selected = 0;
  }

  _selectedBodyChanged(value) {
    this._selectedBodyId = value && value['@id'];
    this._selectedSchema = this._computeSelectedSchema(value);
    this._hasObjectExamples = false;
    this._hasAnyExamples = false;
  }
  /**
   * Computes list of media types in the `body`
   * @param {Array} body Current value of the body.
   * @return {Array<Object>}
   */
  _computeMediaTypes(body) {
    const result = [];
    body.forEach((item) => {
      const label = this._getValue(item, this.ns.raml.vocabularies.http + 'mediaType');
      if (label) {
        result.push({
          label
        });
      }
    });
    return result.length ? result : undefined;
  }
  /**
   * Computes value for `renderMediaSelector` properety.
   * @param {Object} types `mediaTypes` change record.
   * @return {Boolean}
   */
  _computeRenderMediaSelector(types) {
    return !!(types && types.length && types.length > 1);
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
    const { target } = e;
    const index = Number(target.dataset.index);
    if (index !== index) {
      return;
    }
    if (index !== this.selected) {
      this.selected = index;
    }
    setTimeout(() => {
      target.active = true;
    });
  }
  /**
   * Computes value of `http://raml.org/vocabularies/http#schema` for body.
   * @param {Number} selected Index of currently selected media type in
   * `mediaTypes` array
   * @param {Array<Object>} body List of body in request.
   * @return {Object|undefined}
   */
  _computeSelectedBody(selected, body) {
    if (!body || (!selected && selected !== 0)) {
      return;
    }
    return body[selected];
  }

  _computeSelectedSchema(selectedBody) {
    if (!selectedBody) {
      return;
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.http + 'schema');
    let schema = selectedBody[key];
    if (!schema) {
      return;
    }
    if (schema instanceof Array) {
      schema = schema[0];
    }
    return this._resolve(schema);
  }
  /**
   * Computes value for `selectedMediaType` property.
   * @param {Number} selected Currently selected media type index in the selector.
   * @param {Array<Object>} body List of bodies.
   * @return {String} Content type value.
   */
  _computeSelectedMediaName(selected, body) {
    if (!body || (!selected && selected !== 0)) {
      return;
    }
    const data = body[selected];
    return this._getValue(data, this.ns.raml.vocabularies.http + 'mediaType');
  }
  /**
   * Handler for body value change. Computes basic view control properties.
   * @param {Object} body Currently computed body.
   */
  _selectedSchemaChanged(body) {
    this._typeName = this._computeTypeName(body);
    this._bodyName = this._getValue(body, this.ns.schema.schemaName);
    this._description = this._computeDescription(body);
    let isObject = false;
    let isSchema = false;
    let isAnyType = false;
    let isAnd = false;
    if (this._hasType(body, this.ns.w3.shacl.name + 'NodeShape') ||
      this._hasType(body, this.ns.raml.vocabularies.shapes + 'UnionShape')) {
      isObject = true;
    } else if (this._hasType(body, this.ns.w3.shacl.name + 'SchemaShape') ||
      this._hasType(body, this.ns.raml.vocabularies.shapes + 'ScalarShape')) {
      isSchema = true;
    } else if (this._hasType(body, this.ns.raml.vocabularies.shapes + 'ArrayShape')) {
      isObject = true;
    } else if (this._hasType(body, this.ns.raml.vocabularies.shapes + 'AnyShape')) {
      const key = this._getAmfKey(this.ns.w3.shacl.name + 'and');
      if (key in body) {
        isAnd = true;
      } else {
        isAnyType = true;
      }
    }
    this._isObject = isObject || isAnd;
    this._isSchema = isSchema;
    this._isAnyType = isAnyType;
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
  toggle() {
    this.opened = !this.opened;
  }
  /**
   * Computes `typeName` as a name of body in the AMF model.
   *
   * @param {Object} body Currently selected body.
   * @return {String|undefined}
   */
  _computeTypeName(body) {
    let value = this._getValue(body, this.ns.w3.shacl.name + 'name');
    if (value && (value === 'schema' || value.indexOf('amf_inline_type') === 0)) {
      value = undefined;
    }
    return value;
  }

  _apiChangedHandler(e) {
    const { value } = e.detail;
    this.amf = value;
  }

  _hasExamplesHandler(e) {
    const { value } = e.detail;
    this._hasAnyExamples = value;
  }
  /**
   * A template to render for "Any" AMF model.
   * @return {TemplateResult}
   */
  _anyTypeTemplate() {
    const {
      compatibility,
      _bodyName,
      _description,
      _typeName,
      _hasAnyExamples,
      _selectedBody,
      _selectedMediaType,
      _selectedBodyId
    } = this;
    const hasBodyName = !!_bodyName;
    const hasDescription = !!_description;
    const hasTypeName = !!_typeName;

    return html`
    ${hasBodyName ? html`<div class="body-name type-title">${_bodyName}</div>` : undefined}
    ${hasDescription ? html`<arc-marked .markdown="${_description}" sanitize>
      <div slot="markdown-html" class="markdown-html" part="markdown-html" ?data-with-title="${hasTypeName}"></div>
    </arc-marked>` : undefined}
    <p class="any-info">Any instance of data is allowed.</p>
    <p class="any-info-description">
      The API file specifies body for this request but it does not specify the data model.
    </p>
    <section class="examples" ?hidden="${!_hasAnyExamples}">
      <div class="examples-section-title">Examples</div>
      <api-resource-example-document
        .amf="${this.amf}"
        .examples="${_selectedBody}"
        .mediaType="${_selectedMediaType}"
        .typeName="${_typeName}"
        .payloadId="${_selectedBodyId}"
        ?compatibility="${compatibility}"
        @has-examples-changed="${this._hasExamplesHandler}"></api-resource-example-document>
    </section>`;
  }
  /**
   * A template to render for any AMF model\ that is different than "any".
   * @return {TemplateResult}
   */
  _typedTemplate() {
    const {
      compatibility,
      graph,
      _bodyName,
      _description,
      _typeName,
      _selectedSchema,
      _selectedMediaType,
      _selectedBodyId,
      _renderMediaSelector,
      _isObject,
      _isSchema,
      amf,
      narrow
    } = this;
    const hasBodyName = !!_bodyName;
    const hasDescription = !!_description;
    const hasTypeName = !!_typeName;

    return html`
    <div class="media-type-selector">
      <span>Media type:</span>
      ${_renderMediaSelector ?
        this._mediaTypesTemplate() :
        html`<span class="media-type-label">${_selectedMediaType}</span>`}
    </div>
    ${hasBodyName ? html`<div class="body-name type-title">${_bodyName}</div>` : undefined}
    ${hasTypeName ? html`<div class="type-title">${_typeName}</div>` : undefined}
    ${hasDescription ? html`
    <arc-marked .markdown="${_description}" sanitize>
      <div slot="markdown-html" class="markdown-html" part="markdown-html" ?data-with-title="${hasTypeName}"></div>
    </arc-marked>` : undefined}

    ${_isObject ?
      html`<api-type-document
      .amf="${amf}"
      .selectedBodyId="${_selectedBodyId}"
      .type="${_selectedSchema}"
      .narrow="${narrow}"
      .mediaType="${_selectedMediaType}"
      ?compatibility="${compatibility}"
      ?graph="${graph}"></api-type-document>` : undefined}
    ${_isSchema ?
      html`<api-schema-document
        .amf="${amf}"
        .shape="${_selectedSchema}"
        ?compatibility="${compatibility}"></api-schema-document>` :
      undefined}`;
  }

  _mediaTypesTemplate() {
    const items = this._mediaTypes;
    if (!items || !items.length) {
      return;
    }
    const selected = this.selected;
    return items.map((item, index) =>
      html`<anypoint-button
        class="media-toggle"
        data-index="${index}"
        title="Select ${item.label} media type"
        .active="${selected === index}"
        ?compatibility="${this.compatibility}"
        toggles
        @click="${this._selectMediaType}">${item.label}</anypoint-button>`);
  }

  render() {
    const { opened, _isAnyType, aware, compatibility, headerLevel } = this;
    const iconClass = this._computeToggleIconClass(opened);
    return html`
    ${aware ?
      html`<raml-aware @api-changed="${this._apiChangedHandler}" .scope="${aware}"></raml-aware>` : undefined}

    <div class="section-title-area" @click="${this.toggle}" title="Toogle body details">
      <div class="table-title" role="heading" aria-level="${headerLevel}">Body</div>
      <div class="title-area-actions">
        <anypoint-button
          class="toggle-button"
          ?compatibility="${compatibility}">
          ${this._computeToggleActionLabel(opened)}
          <span class="icon ${iconClass}">${expandMore}</span>
        </anypoint-button>
      </div>
    </div>

    <iron-collapse .opened="${opened}">
      ${_isAnyType ? this._anyTypeTemplate() : this._typedTemplate()}
    </iron-collapse>`;
  }
}
window.customElements.define('api-body-document', ApiBodyDocument);
