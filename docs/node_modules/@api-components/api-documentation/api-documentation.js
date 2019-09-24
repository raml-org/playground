import { html, css, LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-endpoint-documentation/api-endpoint-documentation.js';
import '@api-components/api-type-documentation/api-type-documentation.js';
import '@api-components/api-documentation-document/api-documentation-document.js';
import '@api-components/api-method-documentation/api-method-documentation.js';
import '@api-components/api-summary/api-summary.js';
import '@api-components/api-security-documentation/api-security-documentation.js';
/* eslint-disable max-len */
/**
 * `api-documentation`
 *
 * A main documentation view for AMF model.
 *
 * This element works with [AMF](https://github.com/mulesoft/amf) data model.
 *
 * It works well with `api-navigation` component. When `handle-navigation-events`
 * is set it listens for selection events dispatched by the navigation.
 *
 * To manually steare the behavior of the component you have to set both:
 * - selected
 * - selectedType
 *
 * Selected is an `@id` of the AMF data model in json/ld representation.
 * Selected type tells the component where to look for the data and which
 * view to render.
 *
 * The component handles data computation on selection change.
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
 * When the component constructs the funal URI for the endpoint it does the following:
 * - if `baseUri` is set it uses this value as a base uri for the endpoint
 * - else if `iron-meta` with key `ApiBaseUri` exists and contains a value
 * it uses it uses this value as a base uri for the endpoint
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
 * Note: The element will not be notified about the change when `iron-meta` value change.
 * The change will be reflected when `amf` or `endpoint` property chnage.
 *
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiDocumentation extends AmfHelperMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
    }`;
  }

  render() {
    const {
      aware
    } = this;
    return html`
    ${aware ? html`<raml-aware
      .scope="${aware}"
      @api-changed="${this._apiChanged}"></raml-aware>` : ''}
    ${this._renderView()}`;
  }

  _renderView() {
    switch (this._viewType) {
      case 'summary': return this._summaryTemplate();
      case 'security': return this._securityTemplate();
      case 'documentation': return this._documentationTemplate();
      case 'type': return this._typeTemplate();
      case 'endpoint': return this._endpointTemplate();
      case 'method': return this._methodTemplate();
    }
  }

  _summaryTemplate() {
    const { _docsModel, baseUri } = this;
    return html`<api-summary .amf="${_docsModel}" .baseUri="${baseUri}"></api-summary>`;
  }

  _securityTemplate() {
    const { amf, _docsModel, narrow } = this;
    return html`<api-security-documentation
      .amf="${amf}"
      .security="${_docsModel}"
      .narrow="${narrow}"></api-security-documentation>`;
  }

  _documentationTemplate() {
    const { amf, _docsModel } = this;
    return html`<api-documentation-document
      .amf="${amf}"
      .shape="${_docsModel}"></api-documentation-document>`;
  }

  _typeTemplate() {
    const { amf, _docsModel, narrow, compatibility, graph } = this;
    const mt = this._computeApiMediaTypes(amf);
    return html`<api-type-documentation
      .amf="${amf}"
      .type="${_docsModel}"
      .narrow="${narrow}"
      .mediaTypes="${mt}"
      .compatibility="${compatibility}"
      ?graph="${graph}"></api-type-documentation>`;
  }

  _methodTemplate() {
    const { amf, _docsModel, narrow, compatibility, _endpoint, selected, baseUri, noTryIt, graph } = this;
    const prev = this._computeMethodPrevious(amf, selected);
    const next = this._computeMethodNext(amf, selected);
    return html`<api-method-documentation
      .amf="${amf}"
      .narrow="${narrow}"
      .compatibility="${compatibility}"
      .endpoint="${_endpoint}"
      .method="${_docsModel}"
      .previous="${prev}"
      .next="${next}"
      .baseUri="${baseUri}"
      .noTryIt="${noTryIt}"
      ?graph="${graph}"
      rendersecurity
      rendercodesnippets></api-method-documentation>`;
  }

  _endpointTemplate() {
    return this.inlineMethods ?
      this._inlineEndpointTemplate() :
      this._simpleEndpointTemplate();
  }

  _inlineEndpointTemplate() {
    const { amf, _docsModel, narrow, compatibility, outlined, selected, baseUri, scrollTarget, redirectUri, noUrlEditor, graph } = this;
    const prev = this._computeEndpointPrevious(amf, selected, true);
    const next = this._computeEndpointNext(amf, selected, true);
    return html`<api-endpoint-documentation
      .amf="${amf}"
      .narrow="${narrow}"
      .compatibility="${compatibility}"
      .outlined="${outlined}"
      .selected="${selected}"
      .endpoint="${_docsModel}"
      .previous="${prev}"
      .next="${next}"
      .baseUri="${baseUri}"
      .scrollTarget="${scrollTarget}"
      .redirectUri="${redirectUri}"
      .noUrlEditor="${noUrlEditor}"
      ?graph="${graph}"
      notryit
      inlinemethods></api-endpoint-documentation>`;
  }

  _simpleEndpointTemplate() {
    const { amf, _docsModel, narrow, compatibility, selected, baseUri, graph } = this;
    const prev = this._computeEndpointPrevious(amf, selected);
    const next = this._computeEndpointNext(amf, selected);

    return html`<api-endpoint-documentation
      .amf="${amf}"
      .narrow="${narrow}"
      .compatibility="${compatibility}"
      .selected="${selected}"
      .endpoint="${_docsModel}"
      .previous="${prev}"
      .next="${next}"
      .baseUri="${baseUri}"
      ?graph="${graph}"
      ></api-endpoint-documentation>`;
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * A model's `@id` of selected documentation part.
       * Special case is for `summary` view. It's not part of an API
       * but most applications has some kind of summary view for the
       * API.
       */
      selected: { type: String },
      /**
       * Type of the selected item.
       * One of `documentation`, `type`, `security`, `endpoint`, `method`
       * or `summary`.
       */
      selectedType: { type: String },
      /**
       * By default application hosting the element must set `selected` and
       * `selectedType` properties. When using `api-navigation` element
       * by setting this property the element listens for navigation events
       * and updates the state
       */
      handleNavigationEvents: { type: Boolean },
      /**
       * A property to set to override AMF's model base URI information.
       */
      baseUri: { type: String },
      /**
       * Passing value of `noTryIt` to the method documentation.
       * Hiddes "Try it" button.
       */
      noTryIt: { type: Boolean },
      /**
       * If set it will renders the view in the narrow layout.
       */
      narrow: { type: Boolean },
      /**
       * If set then it renders methods documentation inline with
       * the endpoint documentation.
       * When it's not set (or value is `false`, default) then it renders
       * just a list of methods with links.
       */
      inlineMethods: { type: Boolean },
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
       * OAuth2 redirect URI.
       * This value **must** be set in order for OAuth 1/2 to work properly.
       * This is only required in inline mode (`inlineMethods`).
       */
      redirectUri: { type: String },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * When enabled it renders external types as links and dispatches
       * `api-navigation-selection-changed` when clicked.
       *
       * This property is experimental.
       */
      graph: { type: Boolean },
      /**
       * Applied outlined theme to the try it panel
       */
      outlined: { type: Boolean },
      /**
       * In inline mode, passes the `noUrlEditor` value on the
       * `api-request-paqnel`
       */
      noUrlEditor: { type: Boolean },

      // Currently rendered view type
      _viewType: { type: String },
      /**
       * Computed value of the final model extracted from the `amf`, `selected`,
       * and `selectedType` properties.
       * @type {Object}
       */
      _docsModel: { type: Object },
      /**
       * Computed value of currently rendered endpoint.
       */
      _endpoint: { type: Object }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
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
    this.__amfChanged();
    this.requestUpdate('selected', old);
  }

  get selectedType() {
    return this._selectedType;
  }

  set selectedType(value) {
    const old = this._selectedType;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._selectedType = value;
    this.__amfChanged();
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
    this.__amfChanged();
  }

  get handleNavigationEvents() {
    return this._handleNavigationEvents;
  }

  set handleNavigationEvents(value) {
    const old = this._handleNavigationEvents;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._handleNavigationEvents = value;
    this._handleNavChanged(value);
  }

  constructor() {
    super();
    this._navigationHandler = this._navigationHandler.bind(this);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    if (this.__eventsRegistered) {
      this._unregisterNavigationEvents();
    }
  }

  __amfChanged() {
    if (this.__amfProcessingDebouncer) {
      return;
    }
    this.__amfProcessingDebouncer = true;
    setTimeout(() => this._processModelChange());
  }

  _processModelChange() {
    this.__amfProcessingDebouncer = false;

    let { amf } = this;
    if (!amf) {
      return;
    }
    if (amf instanceof Array) {
      amf = amf[0];
    }
    if (this._hasType(amf, this.ns.raml.vocabularies.document + 'Document')) {
      this.__processApiSpecSelection(amf);
      return;
    }
    if (this._isLibrary(amf)) {
      this.__processLibrarySelection(amf);
      return;
    }
    if (this._isSecurityFragment(amf)) {
      this._processSecurityFragment(amf);
      return;
    }
    if (this._isDocumentationFragment(amf)) {
      this._processDocumentationFragment(amf);
      return;
    }
    if (this._isTypeFragment(amf)) {
      this._processTypeFragment(amf);
      return;
    }
    if (this._isDocumentationPartialModel(amf)) {
      this._processDocumentationParial(amf);
      return;
    }
    if (this._isSecurityPartialModel(amf)) {
      this._processSecurityParial(amf);
      return;
    }
    if (this._isTypePartialModel(amf)) {
      this._processTypeParial(amf);
      return;
    }
    if (this._isEndpointPartialModel(amf)) {
      this._processEndpointParial(amf);
      return;
    }
  }

  /**
   * Registers `api-navigation-selection-changed` event listener handler
   * on window object.
   */
  _registerNavigationEvents() {
    this.__eventsRegistered = true;
    window.addEventListener('api-navigation-selection-changed', this._navigationHandler);
  }
  /**
   * Removes event listener from window object for
   * `api-navigation-selection-changed` event.
   */
  _unregisterNavigationEvents() {
    this.__eventsRegistered = false;
    window.removeEventListener('api-navigation-selection-changed', this._navigationHandler);
  }
  /**
   * Registers / unregisters event listeners depending on `state`
   *
   * @param {Boolean} state
   */
  _handleNavChanged(state) {
    if (state) {
      this._registerNavigationEvents();
    } else {
      this._unregisterNavigationEvents();
    }
  }
  /**
   * Handler for `api-navigation-selection-changed` event.
   *
   * @param {CustomEvent} e
   */
  _navigationHandler(e) {
    if (e.detail.passive === true) {
      return;
    }
    this.selected = e.detail.selected;
    this.selectedType = e.detail.type;
  }
  /**
   * Processes selection for the web API data model. It ignores the input if
   * `selected` or `selectedType` is not set.
   * @param {Object} model WebApi AMF model. Do not use an array here.
   */
  __processApiSpecSelection(model) {
    const { selected, inlineMethods } = this;
    let { selectedType } = this;
    if (!selected || !selectedType) {
      // Not all required properties were set.
      return;
    }
    let result;
    switch (selectedType) {
      case 'summary': result = model; break;
      case 'security': result = this._computeSecurityApiModel(model, selected); break;
      case 'type': result = this._computeTypeApiModel(model, selected); break;
      case 'documentation': result = this._computeDocsApiModel(model, selected); break;
      case 'endpoint':
        result = this._computeEndpointApiModel(model, selected);
        // this._endpoint = result;
        break;
      case 'method':
        if (inlineMethods) {
          selectedType = 'endpoint';
          result = this._computeEndpointApiMethodModel(model, selected);
        } else {
          result = this._computeMethodApiModel(model, selected);
          this._endpoint = this._computeEndpointApiMethodModel(model, selected);
        }
        break;
      default:
        return;
    }
    this._docsModel = result;
    this._viewType = selectedType;
  }
  /**
   * Computes security scheme definition model from web API and current selection.
   * It looks for the definition in both `declares` and `references` properties.
   * Returned value is already resolved AMF model (references are resolved).
   *
   * @param {Object} model WebApi AMF model. Do not use an array here.
   * @param {String} selected Currently selected `@id`.
   * @return {Object|undefined} Model definition for the securit scheme.
   */
  _computeSecurityApiModel(model, selected) {
    const declares = this._computeDeclares(model);
    let result;
    if (declares) {
      result = declares.find((item) => item['@id'] === selected);
    }
    if (!result) {
      const references = this._computeReferences(model);
      if (references && references.length) {
        for (let i = 0, len = references.length; i < len; i++) {
          if (!this._hasType(references[i], this.ns.raml.vocabularies.document + 'Module')) {
            continue;
          }
          result = this._computeReferenceSecurity(references[i], selected);
          if (result) {
            break;
          }
        }
      }
    } else {
      result = this._resolve(result);
    }
    return result;
  }
  /**
   * Computes type definition model from web API and current selection.
   * It looks for the definition in both `declares` and `references` properties.
   * Returned value is already resolved AMF model (references are resolved).
   *
   * @param {Object} model WebApi AMF model. Do not use an array here.
   * @param {String} selected Currently selected `@id`.
   * @return {Object|undefined} Model definition for a type.
   */
  _computeTypeApiModel(model, selected) {
    const declares = this._computeDeclares(model);
    const references = this._computeReferences(model);
    return this._computeType(declares, references, selected);
  }
  /**
   * Computes documentation definition model from web API and current selection.
   *
   * @param {Object} model WebApi AMF model. Do not use an array here.
   * @param {String} selected Currently selected `@id`.
   * @return {Object|undefined} Model definition for a documentation fragment.
   */
  _computeDocsApiModel(model, selected) {
    const webApi = this._computeWebApi(model);
    return this._computeDocument(webApi, selected);
  }
  /**
   * Computes Endpoint definition model from web API and current selection.
   *
   * @param {Object} model WebApi AMF model. Do not use an array here.
   * @param {String} selected Currently selected `@id`.
   * @return {Object|undefined} Model definition for an endpoint fragment.
   */
  _computeEndpointApiModel(model, selected) {
    const webApi = this._computeWebApi(model);
    return this._computeEndpointModel(webApi, selected);
  }
  /**
   * Computes Method definition model from web API and current selection.
   *
   * @param {Object} model WebApi AMF model. Do not use an array here.
   * @param {String} selected Currently selected `@id`.
   * @return {Object|undefined} Model definition for an endpoint fragment.
   */
  _computeMethodApiModel(model, selected) {
    const webApi = this._computeWebApi(model);
    return this._computeMethodModel(webApi, selected);
  }

  _computeEndpointApiMethodModel(model, selected) {
    const webApi = this._computeWebApi(model);
    return this._computeMethodEndpoint(webApi, selected);
  }
  /**
   * Processes selection for a library data model. It ignores the input if
   * `selected` or `selectedType` is not set.
   * @param {Object} model Library AMF model. Do not use an array here.
   */
  __processLibrarySelection(model) {
    const { selected, selectedType } = this;
    if (!selected || !selectedType) {
      // Not all required properties were set.
      return;
    }
    let result;
    switch (selectedType) {
      case 'security': result = this._computeSecurityLibraryModel(model, selected); break;
      case 'type': result = this._computeTypeLibraryModel(model, selected); break;
      default:
        return;
    }
    this._docsModel = result;
    this._viewType = selectedType;
  }
  /**
   * Computes Security scheme from a Library model.
   * @param {Object} model Library AMF model.
   * @param {String} selected Currently selected `@id`.
   * @return {Object|undefined} Model definition for a security.
   */
  _computeSecurityLibraryModel(model, selected) {
    return this._computeDeclById(model, selected);
  }
  /**
   * Computes Type definition from a Library model.
   * @param {Object} model Library AMF model.
   * @param {String} selected Currently selected `@id`.
   * @return {Object|undefined} Model definition for a type.
   */
  _computeTypeLibraryModel(model, selected) {
    return this._computeDeclById(model, selected);
  }
  /**
   * Extracts security model from security scheme fragment and sets current selection
   * and the model.
   * @param {Object} model Security scheme fragment model
   */
  _processSecurityFragment(model) {
    this.__processFragment(model, 'security');
  }
  /**
   * Extracts documentation model from documentation fragment and sets current selection
   * and the model.
   * @param {Object} model Documentation fragment model
   */
  _processDocumentationFragment(model) {
    this.__processFragment(model, 'documentation');
  }
  /**
   * Extracts Type model from Type fragment and sets current selection
   * and the model.
   * @param {Object} model Type fragment model
   */
  _processTypeFragment(model) {
    this.__processFragment(model, 'type');
  }
  /**
   * Processes fragment model and sets current selection and the model.
   * @param {Object} model RAML fragment model
   * @param {String} selectedType Currently selected type.
   */
  __processFragment(model, selectedType) {
    const result = this._computeEncodes(model);
    this._docsModel = result;
    this._viewType = selectedType;
  }

  _processDocumentationParial(model) {
    this._docsModel = model;
    this._viewType = 'documentation';
  }

  _processSecurityParial(model) {
    this._docsModel = model;
    this._viewType = 'security';
  }

  _processTypeParial(model) {
    this._docsModel = model;
    this._viewType = 'type';
  }
  /**
   * Processes endpoint data from partial model definitnion.
   * It sets models that are used by the docs.
   *
   * If `selected` or `selectedType` is not set then it automatically selects
   * an endpoint.
   * @param {Object} model Partial model for endpoints
   */
  _processEndpointParial(model) {
    let { selected, selectedType, inlineMethods } = this;
    if (!selectedType || inlineMethods) {
      selectedType = 'endpoint';
    }
    this._endpoint = model;
    if (!inlineMethods && selectedType === 'method') {
      model = this._computeMethodPartialEndpoint(model, selected);
    }
    this._docsModel = model;
    this._viewType = selectedType;
  }
  /**
   * Creates a link model that is accepted by the endpoint documentation
   * view.
   * @param {?Object} item An AMF shape to use to get the data from.
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no item.
   */
  _computeEndpointLink(item) {
    if (!item) {
      return;
    }
    let name = this._getValue(item, this.ns.schema.schemaName);
    if (!name) {
      name = this._getValue(item, this.ns.raml.vocabularies.http + 'path');
    }
    return {
      id: item['@id'],
      label: name
    };
  }
  /**
   * Computes link model for previous endpoint, if any exists relative to
   * current selection.
   * @param {Object} model Web API AMF model
   * @param {String} selected Currently selected endpoint
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no previous item.
   * @param {?Boolean} lookupMethods When set it looks for the ID in methods array.
   */
  _computeEndpointPrevious(model, selected, lookupMethods) {
    if (!model || !selected) {
      return;
    }
    if (this._hasType(model, this.ns.raml.vocabularies.http + 'EndPoint')) {
      return;
    }
    const webApi = this._computeWebApi(model);
    if (!webApi) {
      return;
    }
    const ekey = this._getAmfKey(this.ns.raml.vocabularies.http + 'endpoint');
    const endpoints = this._ensureArray(webApi[ekey]);
    if (!endpoints) {
      return;
    }
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      if (endpoint['@id'] === selected) {
        return this._computeEndpointLink(endpoints[i - 1]);
      }
      if (!lookupMethods) {
        continue;
      }
      const key = this._getAmfKey(this.ns.w3.hydra.supportedOperation);
      const methods = this._ensureArray(endpoint[key]);
      if (!methods) {
        continue;
      }
      for (let j = 0; j < methods.length; j++) {
        if (methods[j]['@id'] === selected) {
          return this._computeEndpointLink(endpoints[i - 1]);
        }
      }
    }
  }
  /**
   * Computes link model for next endpoint, if any exists relative to
   * current selection.
   * @param {Object} model WebApi shape object of AMF
   * @param {String} selected Currently selected endpoint
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no next item.
   * @param {?Boolean} lookupMethods When set it looks for the ID in methods array.
   */
  _computeEndpointNext(model, selected, lookupMethods) {
    if (!model || !selected) {
      return;
    }
    if (this._hasType(model, this.ns.raml.vocabularies.http + 'EndPoint')) {
      return;
    }
    const webApi = this._computeWebApi(model);
    if (!webApi) {
      return;
    }
    const ekey = this._getAmfKey(this.ns.raml.vocabularies.http + 'endpoint');
    const endpoints = this._ensureArray(webApi[ekey]);
    if (!endpoints) {
      return;
    }
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      if (endpoint['@id'] === selected) {
        return this._computeEndpointLink(endpoints[i + 1]);
      }
      if (!lookupMethods) {
        continue;
      }
      const key = this._getAmfKey(this.ns.w3.hydra.supportedOperation);
      const methods = this._ensureArray(endpoint[key]);
      if (!methods) {
        continue;
      }
      for (let j = 0; j < methods.length; j++) {
        if (methods[j]['@id'] === selected) {
          return this._computeEndpointLink(endpoints[i + 1]);
        }
      }
    }
  }
  /**
   * Creates a link model that is accepted by the method documentation
   * view.
   * @param {?Object} item An AMF shape to use to get the data from.
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no item.
   */
  _computeMethodLink(item) {
    if (!item) {
      return;
    }
    let name = this._getValue(item, this.ns.schema.schemaName);
    if (!name) {
      name = this._getValue(item, this.ns.w3.hydra.core + 'method');
    }
    return {
      id: item['@id'],
      label: name
    };
  }
  /**
   * Computes link for the previous method.
   * This is used by the method documentation panel to render previous
   * nethod link.
   * @param {Object} model WebApi shape object of AMF
   * @param {String} selected Currently selected method
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no previous item.
   */
  _computeMethodPrevious(model, selected) {
    let methods;
    if (this._hasType(model, this.ns.raml.vocabularies.http + 'EndPoint')) {
      const key = this._getAmfKey(this.ns.w3.hydra.supportedOperation);
      methods = this._ensureArray(model[key]);
    } else {
      const webApi = this._computeWebApi(model);
      methods = this.__computeMethodsListForMethod(webApi, selected);
    }
    if (!methods) {
      return;
    }
    for (let i = 0; i < methods.length; i++) {
      if (methods[i]['@id'] === selected) {
        return this._computeMethodLink(methods[i - 1]);
      }
    }
  }
  /**
   * Computes link for the next method.
   * This is used by the method documentation panel to render next
   * nethod link.
   * @param {Object} model WebApi shape object of AMF
   * @param {String} selected Currently selected method
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no next item.
   */
  _computeMethodNext(model, selected) {
    let methods;
    if (this._hasType(model, this.ns.raml.vocabularies.http + 'EndPoint')) {
      const key = this._getAmfKey(this.ns.w3.hydra.supportedOperation);
      methods = this._ensureArray(model[key]);
    } else {
      const webApi = this._computeWebApi(model);
      methods = this.__computeMethodsListForMethod(webApi, selected);
    }
    if (!methods) {
      return;
    }
    for (let i = 0; i < methods.length; i++) {
      if (methods[i]['@id'] === selected) {
        return this._computeMethodLink(methods[i + 1]);
      }
    }
  }
  /**
   * Computes method definition from an endpoint partial model.
   * @param {Object} api Endpoint partial model
   * @param {String} selected Currently selected ID.
   * @return {Object|undefined} Method model.
   */
  _computeMethodPartialEndpoint(api, selected) {
    const opKey = this._getAmfKey(this.ns.w3.hydra.supportedOperation);
    const ops = this._ensureArray(api[opKey]);
    if (!ops) {
      return;
    }
    for (let i = 0, len = ops.length; i < len; i++) {
      const op = ops[i];
      if (op['@id'] === selected) {
        return op;
      }
    }
  }
  /**
   * Tests if `model` is of a RAML library model.
   * @param {Object|Array} model A shape to test
   * @return {Boolean}
   */
  _isLibrary(model) {
    if (!model) {
      return false;
    }
    if (model instanceof Array) {
      model = model[0];
    }
    if (!model['@type']) {
      return;
    }
    const moduleKey = this._getAmfKey(this.ns.raml.vocabularies.document + 'Module');
    return moduleKey === model['@type'][0];
  }
  /**
   * Computes a security model from a reference (library for example).
   * @param {Object|Array} reference AMF model for a reference to extract the data from
   * @param {String} selected Node ID to look for
   * @return {Object|undefined} Type definition or undefined if not found.
   */
  _computeReferenceSecurity(reference, selected) {
    const declare = this._computeDeclares(reference);
    if (!declare) {
      return;
    }
    let result = declare.find((item) => {
      if (item instanceof Array) {
        item = item[0];
      }
      return item['@id'] === selected;
    });
    if (result instanceof Array) {
      result = result[0];
    }
    return this._resolve(result);
  }
  /**
   * Computes model of a shape defined ni `declares` list
   * @param {Object} model AMF model
   * @param {String} selected Current selection
   * @return {Object|undefined}
   */
  _computeDeclById(model, selected) {
    const declares = this._computeDeclares(model);
    if (!declares) {
      return;
    }
    return declares.find((item) => item['@id'] === selected);
  }

  _isTypeFragment(model) {
    /* istanbul ignore if */
    if (model instanceof Array) {
      model = model[0];
    }
    return this._hasType(model, this.ns.raml.vocabularies.document + 'DataType');
  }

  _isTypePartialModel(model) {
    /* istanbul ignore if */
    if (model instanceof Array) {
      model = model[0];
    }
    return this._hasType(model, this.ns.raml.vocabularies.document + 'DomainElement');
  }

  _isSecurityFragment(model) {
    /* istanbul ignore if */
    if (model instanceof Array) {
      model = model[0];
    }
    return this._hasType(model, this.ns.raml.vocabularies.document + 'SecuritySchemeFragment');
  }

  _isSecurityPartialModel(model) {
    /* istanbul ignore if */
    if (model instanceof Array) {
      model = model[0];
    }
    return this._hasType(model, this.ns.raml.vocabularies.security + 'SecurityScheme');
  }

  _isDocumentationFragment(model) {
    /* istanbul ignore if */
    if (model instanceof Array) {
      model = model[0];
    }
    return this._hasType(model, this.ns.raml.vocabularies.document + 'UserDocumentation');
  }

  _isDocumentationPartialModel(model) {
    /* istanbul ignore if */
    if (model instanceof Array) {
      model = model[0];
    }
    return this._hasType(model, this.ns.schema.creativeWork);
  }

  _isEndpointPartialModel(model) {
    /* istanbul ignore if */
    if (model instanceof Array) {
      model = model[0];
    }
    return this._hasType(model, this.ns.raml.vocabularies.http + 'EndPoint');
  }
  /**
   * Computes API's media types when requesting type documentation view.
   * This is passed to the type documentation to render examples in the type
   * according to API's defined media type.
   *
   * @param {Object} model API model.
   * @return {Array<String>|undefined} List of supported media types or undefined.
   */
  _computeApiMediaTypes(model) {
    if (model instanceof Array) {
      model = model[0];
    }
    let webApi = this._computeWebApi(model);
    if (!webApi) {
      return;
    }
    if (webApi instanceof Array) {
      webApi = webApi[0];
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.http + 'accepts');
    const value = this._ensureArray(webApi[key]);
    if (value) {
      return value.map((item) => item['@value']);
    }
  }

  _apiChanged(e) {
    this.amf = e.detail.value;
  }
}
window.customElements.define('api-documentation', ApiDocumentation);
