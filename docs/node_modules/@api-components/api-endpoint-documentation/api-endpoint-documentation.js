import { html, css, LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import httpMethodStyles from '@api-components/http-method-label/http-method-label-common-styles.js';
import { expandMore, chevronLeft, chevronRight } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-annotation-document/api-annotation-document.js';
import '@api-components/api-parameters-document/api-parameters-document.js';
import '@api-components/api-method-documentation/api-method-documentation.js';
import '@advanced-rest-client/arc-marked/arc-marked.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@api-components/api-request-panel/api-request-panel.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@advanced-rest-client/http-code-snippets/http-code-snippets.js';
import '@api-components/api-example-generator/api-example-generator.js';
/**
 * `api-endpoint-documentation`
 *
 * A component to generate documentation for an endpoint from AMF model
 *
 * This element works with [AMF](https://github.com/mulesoft/amf) data model.
 * To properly compute all the information relevant to endpoint documentation
 * set the following properties:
 *
 * - amf - as AMF's WebApi data model
 * - endpoint - As AMF's EndPoint data model
 *
 * When set, this will automatically populate the wiew with data.
 *
 * ## Updating API's base URI
 *
 * By default the component render the documentation as it is defined
 * in the AMF model. Sometimes, however, you may need to replace the base URI
 * of the API with something else. It is useful when the API does not
 * have base URI property defined (therefore this component render relative
 * paths instead of URIs) or when you want to manage different environments.
 *
 * To update base URI value either update `baseUri` property or use
 * `iron-meta` with key `ApiBaseUri`. First method is easier but the second
 * gives much more flexibility since it use a
 * [monostate pattern](http://wiki.c2.com/?MonostatePattern)
 * to manage base URI property.
 *
 * When the component constructs the funal URI for the endpoint it does the
 * following:
 * - if `baseUri` is set it uses this value as a base uri for the endpoint
 * - else if `iron-meta` with key `ApiBaseUri` exists and contains a value
 * it uses it uses this value as a base uri for the endpoin
 t
 * - else if `amf` is set then it computes base uri value from main
 * model document
 * Then it concatenates computed base URI with `endpoint`'s path property.
 *
 * ### Example
 *
 * ```html
 * <iron-meta key="ApiBaseUri" value="https://domain.com"></iron-meta>
 * ```
 *
 * To update value of the `iron-meta`:
 * ```javascript
 * new Polymer.IronMeta({key: 'ApiBaseUri'}).value = 'https://other.domain';
 * ```
 *
 * Note: The element will not get notified about the change in `iron-meta`.
 * The change will be reflected whehn `amf` or `endpoint` property chnage.
 *
 * ## Inline methods layout
 *
 * When `inlineMethods` is set then methods (api-method-document) is rendered
 * instead of list of links to methods.
 * Deep linking is still supported. The page scrolls when navigation event
 * changes.
 *
 * In this layout the try it panel is rendered next to method documentation
 * (normal layout) or below method documentation (narrow layout).
 *
 * ## Styling
 *
 * `<api-endpoint-documentation>` provides the following custom properties
 * and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-endpoint-documentation` | Mixin applied to this elment | `{}`
 * `--arc-font-headline` | Theme mixin, Applied to h1 element (title) | `{}`
 * `--arc-font-code1` | Theme mixin, applied to the URL area | `{}`
 * `--api-endpoint-documentation-url-font-size` | Font size of endpoin URL | `16px`
 * `--api-endpoint-documentation-url-background-color` | Background color of the URL section | `#424242`
 * `--api-endpoint-documentation-url-font-color` | Font color of the URL area | `#fff`
 * `--api-endpoint-documentation-bottom-navigation-color` | Color of of the bottom navigartion (icon + text) | `#000`
 * `--api-endpoint-documentation-tryit-background-color` | Background color of inlined "try it" panel | `#ECEFF1`
 * `--api-endpoint-documentation-method-doc-border-top-color` | Method doc top border color |  `#E5E5E5`
 * `--api-endpoint-documentation-method-doc-border-top-style` | Method doc top border style | `dashed`
 * `--api-endpoint-documentation-tryit-panels-background-color` | Bg color of try it panels | `#fff`
 * `--api-endpoint-documentation-tryit-panels-border-radius` | Try it panels border radius | `3px`
 * `--api-endpoint-documentation-tryit-panels-border-color` | Try it panels border color | `#EEEEEE`
 * `--api-endpoint-documentation-tryit-panels-border-style` | Try it panels border style | `solid`
 * `--api-endpoint-documentation-tryit-section-title`
 *
 * @customElement
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiEndpointDocumentation extends AmfHelperMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      httpMethodStyles,
      css`:host {
        display: block;
      }

      .title {
        font-size: var(--arc-font-headline-font-size);
        letter-spacing: var(--arc-font-headline-letter-spacing);
        line-height: var(--arc-font-headline-line-height);
        font-weight: var(--api-method-documentation-title-method-font-weight,
          var(--arc-font-headline-font-weight, 500));
        text-transform: capitalize;
      }

      .heading2 {
        font-size: var(--arc-font-title-font-size);
        font-weight: var(--arc-font-title-font-weight);
        line-height: var(--arc-font-title-line-height);
        margin: 0.84em 0;
      }

      .heading3 {
        flex: 1;
        font-size: var(--arc-font-subhead-font-size);
        font-weight: var(--arc-font-subhead-font-weight);
        line-height: var(--arc-font-subhead-line-height);
      }

      :host([narrow]) .title {
        font-size: var(--arc-font-headline-narrow-font-size, 20px);
        margin: 0;
      }

      :host([narrow]) .heading2 {
        font-size: var(--arc-font-title-narrow-font-size, 18px);
      }

      :host([narrow]) .heading3 {
        font-size: var(--arc-font-subhead-narrow-font-size, 17px);
      }

      arc-marked {
        margin: 8px 0;
        padding: 0px;
      }

      .markdown-body {
        margin-bottom: 28px;
        color: var(--api-endpoint-documentation-description-color, rgba(0, 0, 0, 0.74));
      }

      .extensions {
        font-style: italic;
        margin: 12px 0;
      }

      .bottom-nav,
      .bottom-link {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .bottom-nav {
        padding: 32px 0;
        margin: 16px 0;
        color: var(--api-endpoint-documentation-bottom-navigation-color, #000);
      }

      .bottom-link {
        cursor: pointer;
        max-width: 50%;
        word-break: break-all;
        text-decoration: underline;
      }

      .bottom-link.previous {
        margin-right: 12px;
      }

      .bottom-link.next {
        margin-left: 12px;
      }

      .nav-separator {
        flex: 1;
      }

      .url-area {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        font-family: var(--arc-font-code-family);
        font-size: var(--api-endpoint-documentation-url-font-size, 1.07rem);
        margin-bottom: 40px;
        margin-top: 20px;
        background-color: var(--code-background-color);
        color: var(--code-color);
        padding: 8px;
        border-radius: var(--api-endpoint-documentation-url-border-radius, 4px);
      }

      .url-area[extra-margin] {
        margin-top: 20px;
      }

      .url-value {
        flex: 1;
        word-break: break-all;
      }

      .method-label {
        margin-bottom: 0px;
      }

      .method-anchor {
        text-decoration: none;
        color: inherit;
      }

      .method-anchor:hover {
        text-decoration: underline;
      }

      .method {
        margin: 0.83em 0;
      }

      .method p {
        margin: 0;
      }

      .method-name + p {
        margin-top: 0.83em;
      }

      .method-container {
        display: flex;
        flex-direction: row;
        padding: 24px 0;
        box-sizing: border-box;
        border-top-width: 2px;
        border-top-color: var(--api-endpoint-documentation-method-doc-border-top-color, #E5E5E5);
        border-top-style: var(--api-endpoint-documentation-method-doc-border-top-style, dashed);
      }

      :host([narrow]) .method-container {
        flex-direction: column;
      }

      .method-container api-method-documentation {
        width: var(--api-endpoint-documentation-method-doc-width, 60%);
        max-width: var(--api-endpoint-documentation-method-doc-max-width);
        padding-right: 12px;
        box-sizing: border-box;
      }

      .method-container .try-it-column {
        width: var(--api-endpoint-documentation-tryit-width, 40%);
        max-width: var(--api-endpoint-documentation-tryit-max-width);
        background-color: var(--api-endpoint-documentation-tryit-background-color, #ECEFF1);
      }

      :host([narrow]) .method-container api-method-documentation,
      :host([narrow]) .method-container .try-it-column {
        border: none !important;
        max-width: 900px;
        width: 100%;
        margin: 0;
        padding: 0;
      }

      .try-it-column api-request-panel,
      .try-it-column http-code-snippets {
        padding: 4px 4px 12px 4px;
        margin: 4px;
        background-color: var(--api-endpoint-documentation-tryit-panels-background-color, #fff);
        box-sizing: border-box;
        border-radius: var(--api-endpoint-documentation-tryit-panels-border-radius, 3px);
        border-width: 1px;
        border-color: var(--api-endpoint-documentation-tryit-panels-border-color, #EEEEEE);
        border-style: var(--api-endpoint-documentation-tryit-panels-border-style, solid);
      }

      .try-it-column .heading3 {
        padding-left: 12px;
        padding-right: 12px;
        flex: 1;
      }

      .section-title-area {
        flex-direction: row;
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
        border-bottom-width: 1px;
        border-bottom-color: var(--api-endpoint-documentation-tryit-title-border-bottom-color, #bac6cb);
        border-bottom-style: var(--api-endpoint-documentation-tryit-title-border-bottom-style, solid);
      }

      .toggle-icon {
        margin-left: 8px;
        transform: rotateZ(0deg);
        transition: transform 0.3s ease-in-out;
      }

      .toggle-icon.opened {
        transform: rotateZ(-180deg);
      }

      .noinfo {
        font-style: var(--no-info-message-font-style, italic);
        font-size: var(--no-info-message-font-size, 16px);
        color: var(--no-info-message-color, rgba(0, 0, 0, 0.74));
      }

      .icon {
        display: block;
        width: 24px;
        height: 24px;
        fill: currentColor;
      }
      `
    ];
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * Method's endpoint definition as a
       * `http://raml.org/vocabularies/http#endpoint` of AMF model.
       */
      endpoint: { type: Object },
      /**
       * The ID in `amf` of current selection. It can be this endpoint
       * or any of methods
       */
      selected: { type: String },
      /**
       * A property to set to override AMF's model base URI information.
       * When this property is set, the `endpointUri` property is recalculated.
       */
      baseUri: { type: String },
      /**
       * Computed value, API version name
       */
      apiVersion: { type: String },
      /**
       * Endpoint URI to display in main URL field.
       * This value is computed when `amf`, `endpoint` or `baseUri` change.
       */
      endpointUri: { type: String },
      /**
       * Computed value of the `http://raml.org/vocabularies/http#server`
       * from `amf`
       */
      server: { type: Object },
      /**
       * Endpoint name.
       * It should be either a "displayName" or endpoint's relative
       * path.
       */
      endpointName: { type: String },
      /**
       * Computed value of method description from `method` property.
       */
      description: { type: String },
      /**
       * Computed value of endpoint's path.
       */
      path: { type: String },
      /**
       * Computed value from current `method`. True if the model containsPATCH
       * custom properties (annotations in RAML).
       */
      hasCustomProperties: { type: Boolean },
      /**
       * If set it will renders the view in the narrow layout.
       */
      narrow: { type: Boolean, reflect: true },
      /**
       * List of traits and resource types, if any.
       *
       * @type {Array<Object>}
       */
      extendsTypes: { type: Array },
      /**
       * Computed value of a parent type.
       * In RAML it is resource type that can be applied to a resource.
       */
      parentType: { type: Object },
      /**
       * Computed value for parent type name.
       */
      parentTypeName: { type: String },
      /**
       * List of traits appied to this endpoint
       *
       * @type {Array<Object>}
       */
      traits: { type: Array },
      /**
       * Model to generate a link to previous HTTP endpoint.
       * It should contain `id` and `label` properties
       */
      previous: { type: Object },
      /**
       * Model to generate a link to next HTTP endpoint.
       * It should contain `id` and `label` properties
       */
      next: { type: Object },
      /**
       * Scroll target used to observe `scroll` event.
       * When set the element will observe scroll and inform other components
       * about changes in navigation while scrolling through methods list.
       * The navigation event contains `passive: true` property that
       * determines that it's not user triggered navigation but rather
       * context enforced.
       */
      scrollTarget: { type: Object },
      /**
       * Passing value of `noTryIt` to the method documentation.
       * Hiddes "Try it" button from the view.
       */
      noTryIt: { type: Boolean },
      /**
       * Computed list of operations to render in the operations list.
       * @type {Object}
       */
      operations: { type: Array },
      /**
       * Computed value if the endpoint contains operations.
       */
      hasOperations: { type: Boolean },
      /**
       * If set then it renders methods documentation inline with
       * the endpoint documentation.
       * When it's not set (or value is `false`, default) then it renders
       * just a list of methods with links.
       */
      inlineMethods: { type: Boolean },
      /**
       * In inline mode, passes the `noUrlEditor` value on the
       * `api-request-paqnel`
       */
      noUrlEditor: { type: Boolean },
      /**
       * OAuth2 redirect URI.
       * This value **must** be set in order for OAuth 1/2 to work properly.
       * This is only required in inline mode (`inlineMethods`).
       */
      redirectUri: { type: String },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * Applied outlined theme to the try it panel
       */
      outlined: { type: Boolean },
      /**
       * Passed to `api-type-document`. Enables internal links rendering for types.
       */
      graph: { type: Boolean },

      _editorEventTarget: { type: Object },
      /**
       * When set it hiddes bottom navigation links
       */
      noNavigation: { type: Boolean }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  get _exampleGenerator() {
    if (!this.__exampleGenerator) {
      this.__exampleGenerator = document.createElement('api-example-generator');
    }
    this.__exampleGenerator.amf = this.amf;
    return this.__exampleGenerator;
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._baseUri = value;
    this.endpointUri = this._computeEndpointUri(this.server, this.endpoint, value, this.apiVersion);
  }

  get scrollTarget() {
    return this._scrollTarget;
  }

  set scrollTarget(value) {
    const old = this._scrollTarget;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._scrollTarget = value;
    this._scrollTargetChanged(value);
  }

  get inlineMethods() {
    return this._inlineMethods;
  }

  set inlineMethods(value) {
    const old = this._inlineMethods;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._inlineMethods = value;
    this._inlineMethodsChanged(value);
    this.operations = this._computeOperations(this.endpoint, value, this.amf);
    this.requestUpdate('inlineMethods', old);
  }

  get operations() {
    return this._operations;
  }

  set operations(value) {
    const old = this._operations;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._operations = value;
    this.hasOperations = !!(value && value.length);
    this.requestUpdate('operations', old);
  }

  get endpoint() {
    return this._endpoint;
  }

  set endpoint(value) {
    const old = this._endpoint;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._endpoint = value;
    this._endpointChanged();
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    const old = this._selected;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._selected = value;
    this._selectedChanged(value);
  }

  constructor() {
    super();
    this._scrollHandler = this._scrollHandler.bind(this);

    this._editorEventTarget = this;
  }

  __amfChanged() {
    if (this.__amfProcessingDebouncer) {
      return;
    }
    this.__amfProcessingDebouncer = true;
    setTimeout(() => this._processModelChange());
  }

  _endpointChanged() {
    if (this.__endpointProcessingDebouncer) {
      return;
    }
    this.__endpointProcessingDebouncer = true;
    setTimeout(() => this._processEndpointChange());
  }

  _processModelChange() {
    this.__amfProcessingDebouncer = false;
    const { amf } = this;
    if (!amf) {
      return;
    }
    const apiVersion = this.apiVersion = this._computeApiVersion(amf);
    const server = this.server = this._computeServer(amf);
    this.endpointUri = this._computeEndpointUri(server, this.endpoint, this.baseUri, apiVersion);
    this.operations = this._computeOperations(this.endpoint, this.inlineMethods, amf);
  }

  _processEndpointChange() {
    this.__endpointProcessingDebouncer = false;
    const { endpoint } = this;
    if (!endpoint) {
      return;
    }
    this.endpointName = this._computeEndpointName(endpoint);
    this.description = this._computeDescription(endpoint);
    this.path = this._computePath(endpoint);
    this.hasCustomProperties = this._computeHasCustomProperties(endpoint);
    this.endpointUri = this._computeEndpointUri(this.server, endpoint, this.baseUri, this.apiVersion);
    const types = this.extendsTypes = this._computeExtendsTypes(endpoint);
    this.traits = this._computeTraits(types);
    const parent = this.parentType = this._computeParentType(types);
    this.parentTypeName = this._computeParentTypeName(parent);
    this.operations = this._computeOperations(endpoint, this.inlineMethods, this.amf);
  }

  /**
   * Computes method's endpoint name.
   * It looks for `http://schema.org/name` in the endpoint definition and
   * if not found it uses path as name.
   *
   * @param {Object} endpoint Endpoint model.
   * @return {String} Endpoint name.
   */
  _computeEndpointName(endpoint) {
    const name = this._getValue(endpoint, this.ns.schema.schemaName);
    // if (!name) {
    //   name = this._computePath(endpoint);
    // }
    return name;
  }
  /**
   * Computes value of `path` property
   *
   * @param {Object} endpoint Endpoint model.
   * @return {String}
   */
  _computePath(endpoint) {
    return this._getValue(endpoint, this.ns.raml.vocabularies.http + 'path');
  }
  /**
   * Computes `extendsTypes`
   *
   * @param {Object} shape AMF shape to get `#extends` model
   * @return {Array<Object>|undefined}
   */
  _computeExtendsTypes(shape) {
    const key = this._getAmfKey(this.ns.raml.vocabularies.document + 'extends');
    return shape && this._ensureArray(shape[key]);
  }
  /**
   * Computes parent type as RAML's resource type.
   *
   * @param {Array<Object>} types Current value of `extendsTypes`
   * @return {Object|undefined}
   */
  _computeParentType(types) {
    if (!types || !types.length) {
      return;
    }
    return types.find((item) =>
      this._hasType(item, this.ns.raml.vocabularies.document + 'ParametrizedResourceType'));
  }
  /**
   * Computes vaolue for `parentTypeName`
   *
   * @param {?Object} type Parent type shape
   * @return {String|undefined}
   */
  _computeParentTypeName(type) {
    return this._getValue(type, this.ns.schema.schemaName);
  }
  /**
   * Computes value for `traits` property
   *
   * @param {Array<Object>} types Current value of `extendsTypes`
   * @return {Array<Object>|undefined}
   */
  _computeTraits(types) {
    if (!types || !types.length) {
      return;
    }
    const data = types.filter((item) =>
      this._hasType(item, this.ns.raml.vocabularies.document + 'ParametrizedTrait'));
    return data.length ? data : undefined;
  }
  /**
   * Computes list of trait names to render it in the doc.
   *
   * @param {Array<Object>} traits AMF trait definition
   * @return {String|undefined} Trait name if defined.
   */
  _computeTraitNames(traits) {
    if (!traits || !traits.length) {
      return;
    }
    const names = traits.map((trait) => this._getValue(trait, this.ns.schema.schemaName));
    if (names.length === 2) {
      return names.join(' and ');
    }
    return names.join(', ');
  }
  /**
   * Navigates to next method. Calls `_navigate` with id of previous item.
   */
  _navigatePrevious() {
    this._navigate(this.previous.id, 'endpoint');
  }
  /**
   * Navigates to next method. Calls `_navigate` with id of next item.
   */
  _navigateNext() {
    this._navigate(this.next.id, 'endpoint');
  }
  /**
   * Dispatches `api-navigation-selection-changed` so other components
   * can update their state.
   *
   * @param {String} id
   * @param {String} type
   */
  _navigate(id, type) {
    const e = new CustomEvent('api-navigation-selection-changed', {
      bubbles: true,
      composed: true,
      detail: {
        selected: id,
        type: type
      }
    });
    this.dispatchEvent(e);
  }
  /**
   * Computes value for `operations` property.
   * @param {Object} endpoint Endpoint model.
   * @param {Boolean} inlineMethods
   * @return {Array<Object>}
   */
  _computeOperations(endpoint, inlineMethods) {
    if (!endpoint) {
      return;
    }
    const key = this._getAmfKey(this.ns.w3.hydra.supportedOperation);
    const ops = this._ensureArray(endpoint[key]);
    if (!ops || !ops.length) {
      return;
    }
    if (inlineMethods) {
      return ops.map((item) => {
        item._tryitOpened = true;
        return item;
      });
    }
    const result = [];
    for (let i = 0, len = ops.length; i < len; i++) {
      const op = ops[i];
      const method = this._getValue(op, this.ns.w3.hydra.core + 'method');
      const name = this._getValue(op, this.ns.schema.schemaName);
      const desc = this._getValue(op, this.ns.schema.desc);
      result[result.length] = {
        method,
        name,
        desc,
        id: op['@id']
      };
    }
    return result;
  }

  _methodNavigate(e) {
    e.stopPropagation();
    e.preventDefault();
    const target = (e.path || e.composedPath()).find((node) => node.nodeName === 'A');
    const id = target.dataset.apiId;
    this._navigate(id, 'method');
  }

  /**
   * Handles scroll target chane and adds scroll event.
   *
   * @param {Node} st The scroll target.
   */
  _scrollTargetChanged(st) {
    if (this._oldScrollTarget) {
      this._oldScrollTarget.removeEventListener('scroll', this._scrollHandler);
      this._oldScrollTarget = undefined;
    }
    if (st) {
      st.addEventListener('scroll', this._scrollHandler);
      this._oldScrollTarget = st;
    }
  }
  /**
   * Scroll handler for `scrollTarget`.
   * It does not stall main thred by executing the action after nex render.
   */
  _scrollHandler() {
    if (!this.inlineMethods) {
      return;
    }
    setTimeout(() => this._checkMethodsPosition());
  }
  /**
   * I hope this won't be required in final version :(
   */
  _checkMethodsPosition() {
    const st = this._oldScrollTarget;
    if (!st) {
      return;
    }
    // Window object has `scrollY` but HTML element has `scrollTop`
    const scroll = st.scrollY || st.scrollTop;
    if (scroll === undefined) {
      return;
    }
    const diff = (this._lastScrollPos || 0) - scroll;
    if (diff === 0) {
      return;
    }
    this._lastScrollPos = scroll;
    const dir = diff < 0 ? 'down' : 'up';
    const scrollHeigth = st.scrollHeight || st.innerHeight;
    const targetHeigth = st.offsetHeight || st.innerHeight;
    if (!this._methodsList) {
      const section = this.shadowRoot.querySelector('section.methods');
      // This list is a live node list so the reference has to be made
      // only once.
      this._methodsList = section.childNodes;
    }
    for (let i = 0, len = this._methodsList.length; i < len; i++) {
      const node = this._methodsList[i];
      if (node.nodeName !== 'DIV') {
        continue;
      }
      if (this._occupiesMainScrollArea(targetHeigth, scrollHeigth, dir, node)) {
        const doc = node.querySelector('api-method-documentation');
        this._notifyPassiveNavigation(doc.method['@id']);
        return;
      }
    }
  }
  /**
   * Function that checks if an `element` is in the main scrolling area.
   *
   * @param {Number} targetHeigth Height (visible) of the scroll target
   * @param {Number} scrollHeigth Height of the scroll target
   * @param {String} dir Direction where the scroll is going (up or down)
   * @param {Node} element The node to test
   * @return {Boolean} True when it determines that the element is in the main
   * scroll area,
   */
  _occupiesMainScrollArea(targetHeigth, scrollHeigth, dir, element) {
    const rect = element.getBoundingClientRect();
    if (rect.top < 0 && rect.bottom > targetHeigth) {
      // Occupies whole area
      return true;
    }
    if (rect.bottom < 0 || targetHeigth < rect.top ||
      (rect.top < 0 && rect.top + rect.height <= 0)) {
      // Completely out of screen
      return false;
    }
    if (rect.top < 0 && dir === 'down' && rect.top + rect.height < targetHeigth / 2) {
      // less than half screen
      return false;
    }
    if (dir === 'down' && (rect.top + rect.height) > targetHeigth / 2) {
      return true;
    }
    const padding = 60;
    if (rect.y > 0 && rect.y < padding) {
      if (dir === 'up') {
        return false;
      }
      return true;
    }
    if (dir === 'up' && (rect.bottom + padding) > scrollHeigth && rect.bottom < targetHeigth) {
      return true;
    }
    return false;
  }

  /**
   * Dispatches `api-navigation-selection-changed` custom event with
   * `passive: true` set on the detail object.
   * Listeners should not react on this event except for the ones that
   * should reflect passive navigation change.
   *
   * @param {String} selected Id of selected method as in AMF model.
   */
  _notifyPassiveNavigation(selected) {
    if (this.__notyfyingChange || this.__latestNotified === selected ||
      this.selected === selected) {
      return;
    }
    this.__latestNotified = selected;
    this.__notyfyingChange = true;
    setTimeout(() => {
      this.__notyfyingChange = false;
      this.dispatchEvent(new CustomEvent('api-navigation-selection-changed', {
        composed: true,
        bubbles: true,
        detail: {
          selected,
          type: 'method',
          passive: true
        }
      }));
    }, 200);
  }

  /**
   * Hadnler for either `selected` or `endpoint proerty change`
   * @param {String} selected Currently selected shape ID in AMF model
   * @param {Object} endpoint AMF model for the endpoint.
   * @param {Boolean} inlineMethods True if methods documentation is included
   */
  _selectedChanged(selected) {
    if (!selected) {
      return;
    }
    const { endpoint, inlineMethods } = this;
    if (!endpoint || !inlineMethods) {
      return;
    }
    setTimeout(() => this._repositionVerb(selected));
  }
  /**
   * Positions the method (operation) or endpoint (main title).
   *
   * @param {String} id Selected AMF id.
   */
  _repositionVerb(id) {
    let options;
    if ('scrollBehavior' in document.documentElement.style) {
      options = {
        block: 'start',
        inline: 'nearest'
      };
    } else {
      options = true;
    }
    const isEndpoint = (this.endpoint && this.endpoint['@id'] === id);
    if (isEndpoint) {
      const title = this.shadowRoot.querySelector('.title');
      if (title) {
        title.scrollIntoView(true);
      }
      return;
    }
    const selector = `[data-operation-id="${id}"]`;
    const node = this.shadowRoot.querySelector(selector);
    if (!node) {
      return;
    }
    node.scrollIntoView(options);
  }

  _computeOperationId(item) {
    return item && item['@id'];
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
   * Computes example headers string for code snippets.
   * @param {Array} method Method (operation) model
   * @return {String|undefind} Computed example value for headers
   */
  _computeSnippetsHeaders(method) {
    if (!method) {
      return;
    }
    const expects = this._computeExpects(method);
    if (!expects) {
      return;
    }
    let result;
    const headers = this._computeHeaders(expects);
    if (headers && headers.length) {
      result = '';
      headers.forEach((item) => {
        const name = this._getValue(item, this.ns.schema.schemaName);
        const value = this._computePropertyValue(item) || '';
        result += `${name}: ${value}\n`;
      });
    }
    return result;
  }
  /**
   * Computes example payload string for code snippets.
   * @param {Array} payload Payload model from AMF
   * @return {String|undefind} Computed example value for payload
   */
  _computeSnippetsPayload(payload) {
    if (payload && payload instanceof Array) {
      payload = payload[0];
    }
    if (this._hasType(payload, this.ns.w3.hydra.core + 'Operation')) {
      const expects = this._computeExpects(payload);
      payload = this._computePayload(expects);
    }
    if (payload && payload instanceof Array) {
      payload = payload[0];
    }
    if (!payload) {
      return;
    }

    let mt = this._getValue(payload, this.ns.raml.vocabularies.http + 'mediaType');
    if (!mt) {
      mt = 'application/json';
    }
    const examples = this._exampleGenerator.generatePayloadExamples(payload, mt, {});
    if (!examples || !examples[0]) {
      return;
    }
    return examples[0].value;
  }
  /**
   * Tries to find an example value (whether it's default value or from an
   * example) to put it into snippet's values.
   *
   * @param {Object} item A http://raml.org/vocabularies/http#Parameter property
   * @return {String|undefined}
   */
  _computePropertyValue(item) {
    const key = this._getAmfKey(this.ns.raml.vocabularies.http + 'schema');
    let schema = item && item[key];
    if (!schema) {
      return;
    }
    if (schema instanceof Array) {
      schema = schema[0];
    }
    let value = this._getValue(item, this.ns.w3.shacl.name + 'defaultValue');
    if (!value) {
      const examplesKey = this._getAmfKey(this.ns.raml.vocabularies.document + 'examples');
      let example = item[examplesKey];
      if (example) {
        if (example instanceof Array) {
          example = example[0];
        }
        value = this._getValue(item, this.ns.raml.vocabularies.document + 'value');
      }
    }
    return value;
  }

  /**
   * Computes value for `httpMethod` property.
   *
   * @param {Object} method AMF `supportedOperation` model
   * @return {String|undefined} HTTP method name
   */
  _computeHttpMethod(method) {
    let name = this._getValue(method, this.ns.w3.hydra.core + 'method');
    if (name) {
      name = name.toUpperCase();
    }
    return name;
  }

  _toggleSnippets(e) {
    const index = Number(e.currentTarget.dataset.index);
    const newState = !this.operations[index]._snippetsOpened;
    this.operations[index]._snippetsOpened = newState;
    this.requestUpdate();
  }

  _toggleRequestPanel(e) {
    const index = Number(e.currentTarget.dataset.index);
    const newState = !this.operations[index]._tryitOpened;
    this.operations[index]._tryitOpened = newState;
    this.requestUpdate();
  }
  /**
   * A handler for the `inlineMethods` property change.
   * When set it automatically disables the try it button.
   *
   * @param {Boolean} value Current value of `inlineMethods`
   */
  _inlineMethodsChanged(value) {
    if (value && !this.noTryIt) {
      this.noTryIt = true;
    }
  }
  /**
   * Computes special class names for the method container.
   * It adds `first`, and `last` names to corresponding
   * containers.
   *
   * @param {Number} index
   * @param {Array} operations
   * @return {String}
   */
  _computeTryItColumClass(index, operations) {
    if (!operations || !operations.length || index === undefined) {
      return '';
    }
    let klass = '';
    if (index === 0) {
      klass += ' first';
    }
    if (index === operations.length - 1) {
      klass += ' last';
    }
    return klass;
  }

  _computeTryItSelected(item) {
    if (!item) {
      return;
    }
    return item['@id'];
  }

  _apiChanged(e) {
    this.amf = e.detail.value;
  }

  render() {
    const {
      aware,
      hasCustomProperties,
      endpoint,
      hasOperations,
      description
    } = this;
    return html`
    ${aware ? html`<raml-aware
      .scope="${aware}"
      @api-changed="${this._apiChanged}"></raml-aware>` : ''}
    ${this._getTitleTemplate()}
    ${this._getUrlTemplate()}
    ${this._getExtensionsTemplate()}
    ${hasCustomProperties ? html`<api-annotation-document .shape="${endpoint}"></api-annotation-document>` : ''}
    ${this._getDescriptionTemplate(description)}
    <div class="heading2 table-title" role="heading" aria-level="2">Methods</div>
    ${hasOperations ?
      this._getOperationsTemplate() :
      html`<p class="noinfo">This enpoint doesn't have HTTP methods defined in the API specification file.</p>`}
    ${this._getNavigationTemplate()}`;
  }

  _getDescriptionTemplate(description) {
    if (!description) {
      return html``;
    }
    return html`<arc-marked .markdown="${description}" sanitize>
      <div slot="markdown-html" class="markdown-body"></div>
    </arc-marked>`;
  }

  _getTitleTemplate() {
    const { endpointName } = this;
    if (!endpointName) {
      return html``;
    }
    return html`
    <div role="heading" aria-level="1" class="title">${endpointName}</div>
    `;
  }

  _getUrlTemplate() {
    if (this.inlineMethods) {
      return html``;
    }
    const { endpointUri, endpointName } = this;
    return html`<section class="url-area" ?extra-margin="${!endpointName}">
      <div class="url-value">${endpointUri}</div>
    </section>`;
  }

  _getExtensionsTemplate() {
    const { parentTypeName, traits } = this;
    const hasTraits = !!(traits && traits.length);
    if (!hasTraits && !parentTypeName) {
      return html``;
    }
    const traitsLabel = hasTraits && this._computeTraitNames(traits);
    return html`<section class="extensions">
      ${parentTypeName ? html`<span>Implements </span>
      <span class="resource-type-name" title="Resource type applied to this endpoint">${parentTypeName}</span>.` : ''}
      ${hasTraits ? html`<span>Mixes in </span>
      <span class="trait-name">${traitsLabel}</span>.` : ''}
    </section>`;
  }

  _getOperationsTemplate() {
    return this.inlineMethods ?
      this._getInlineMethodsTemplate() :
      this._getMethodsListTemplate();
  }

  _getInlineMethodsTemplate() {
    const { operations } = this;
    if (!operations || !operations.length) {
      return;
    }
    return html`<section class="methods">
      ${operations.map((item, index) => this._inlineMethodTemplate(item, index, operations))}
    </section>`;
  }

  _inlineMethodTemplate(item, index, operations) {
    const {
      amf,
      endpoint,
      narrow,
      baseUri,
      noTryIt,
      compatibility,
      graph
    } = this;
    const klas = this._computeTryItColumClass(index, operations);
    return html`
    <div class="method-container ${klas}">
      <api-method-documentation
        data-operation-id="${item['@id']}"
        .amf="${amf}"
        .endpoint="${endpoint}"
        .method="${item}"
        .narrow="${narrow}"
        .baseUri="${baseUri}"
        .noTryIt="${noTryIt}"
        .compatibility="${compatibility}"
        ?graph="${graph}"
        rendersecurity></api-method-documentation>
      <div class="try-it-column">
        ${this._getRequestPanelTemplate(item, index)}
        ${this._getSnippetsTemplate(item, index)}

      </div>
    </div>`;
  }

  _getRequestPanelTemplate(item, index) {
    // TODO(pawel): maybe to use a directive that renders content asyncronously to
    // avoid cost of loading the try it panel with the method, especially when the try it panel
    // is not rendered immidietly ith the method.
    const label = this._computeToggleActionLabel(item._tryitOpened);
    const iconClass = this._computeToggleIconClass(item._tryitOpened);
    return html`<section class="request-panel">
      <div
        class="section-title-area"
        data-index="${index}"
        @click="${this._toggleRequestPanel}"
        title="Toogle code example details">
        <div class="heading3 table-title" role="heading" aria-level="2">Try the API</div>
        <div class="title-area-actions">
          <anypoint-button class="toggle-button" ?compatibility="${this.compatibility}">
            ${label}
            <span class="icon ${iconClass}">${expandMore}</span>
          </anypoint-button>
        </div>
      </div>
      <iron-collapse .opened="${item._tryitOpened}">
        <api-request-panel
          .amf="${this.amf}"
          .selected="${item['@id']}"
          .narrow="${this.narrow}"
          .noUrlEditor="${this.noUrlEditor}"
          .baseUri="${this.baseUri}"
          .redirectUri="${this.redirectUri}"
          .legacy="${this.compatibility}"
          .outlined="${this.outlined}"
          nodocs></api-request-panel>
      </iron-collapse>
    </section>`;
  }

  _getSnippetsTemplate(item, index) {
    const label = this._computeToggleActionLabel(item._snippetsOpened);
    const iconClass = this._computeToggleIconClass(item._snippetsOpened);
    return html`<section class="snippets">
      <div
        class="section-title-area"
        data-index="${index}"
        @click="${this._toggleSnippets}" title="Toogle code example details">
        <div class="heading3 table-title" role="heading" aria-level="2">Code examples</div>
        <div class="title-area-actions">
          <anypoint-button class="toggle-button" ?compatibility="${this.compatibility}">
            ${label}
            <span class="icon ${iconClass}">${expandMore}</span>
          </anypoint-button>
        </div>
      </div>
      <iron-collapse .opened="${item._snippetsOpened}">
        <http-code-snippets
          scrollable
          .url="${this.endpointUri}"
          .method="${this._computeHttpMethod(item)}"
          .headers="${this._computeSnippetsHeaders(item)}"
          .payload="${this._computeSnippetsPayload(item)}"></http-code-snippets>
      </iron-collapse>
    </section>`;
  }

  _getMethodsListTemplate() {
    const { operations } = this;
    if (!operations || !operations.length) {
      return;
    }
    return html`<section class="methods">
      ${operations.map((item) => html`<div class="method">
        <div class="method-name">
          <a href="#" @click="${this._methodNavigate}" class="method-anchor" data-api-id="${item.id}">
            <span class="method-label" data-method="${item.method}">${item.method}</span>
            <span class="method-value" data-method="${item.name}">${item.name}</span>
          </a>
        </div>
        ${this._getDescriptionTemplate(item.desc)}
      </div>`)}
    </section>`;
  }

  _getNavigationTemplate() {
    const { next, previous, noNavigation } = this;
    if (!next && !previous || noNavigation) {
      return;
    }
    const { compatibility } = this;
    return html`<section class="bottom-nav">
      ${previous ? html`<div class="bottom-link previous" @click="${this._navigatePrevious}">
        <anypoint-icon-button title="${previous.label}" ?compatibility="${compatibility}">
          <span class="icon">${chevronLeft}</span>
        </anypoint-icon-button>
        <span class="nav-label">${previous.label}</span>
      </div>` : ''}
      <div class="nav-separator"></div>
      ${next ? html`<div class="bottom-link next" @click="${this._navigateNext}">
        <span class="nav-label">${next.label}</span>
        <anypoint-icon-button title="${next.label}" ?compatibility="${compatibility}">
          <span class="icon">${chevronRight}</span>
        </anypoint-icon-button>
      </div>` : ''}
    </section>`;
  }
  /**
   * Dispatched when the user requested previous / next
   *
   * @event api-navigation-selection-changed
   * @param {String} selected
   * @param {String} type
   */
}
window.customElements.define('api-endpoint-documentation', ApiEndpointDocumentation);
