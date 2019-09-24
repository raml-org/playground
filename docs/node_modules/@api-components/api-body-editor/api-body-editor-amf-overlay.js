/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
/**
 * Adds AMF support to body editor.
 *
 * This mixin's only purpose is to keep AMF support separated from the
 * body editor code so it's clearer to read it.
 *
 * @polymer
 * @mixinFunction
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 * @param {Class} base
 * @return {Class}
 */
export const ApiBodyEditorAmfOverlay = (base) => class extends AmfHelperMixin(base) {
  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * AMF json/ld model for body.
       * When set it resets editor settings and transform it to work with
       * data types defined in AMF only.
       * @type {Object}
       */
      amfBody: { type: Object },
      // Computed final model for payload.
      _effectiveModel: { type: Object },
      /**
       * List of supported mime types by this endpoint.
       * This information is read from AMF data model.
       */
      _mimeTypes: { type: Array },
      /**
       * Computed value.
       * It's `true` when the endpint supports single mime type.
       * In this case it won't render type selector.
       *
       * @type {Object}
       */
      _singleMimeType: { type: Boolean },

      _panelModel: { type: Object }
    };
  }

  get _effectiveModel() {
    return this.__effectiveModel;
  }

  set _effectiveModel(value) {
    const old = this.__effectiveModel;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__effectiveModel = value;
    if (value) {
      this._updatePanelAmf(this.contentType);
    }
  }

  get amfBody() {
    return this._amfBody;
  }

  set amfBody(value) {
    const old = this._amfBody;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.value = '';
    this._amfBody = value;
    this.__amfChanged();
  }

  firstUpdated() {
    if (this.__effectiveModel) {
      this._updatePanelAmf(this.contentType);
    }
  }

  _contentTypeChanged(contentType) {
    if (this._effectiveModel) {
      this._updatePanelAmf(contentType);
    }
  }
  /**
   * Overrides `AmfHelperMixin.__amfChanged`
   */
  __amfChanged() {
    if (this.__bodyChangeDebouncer) {
      return;
    }
    this.__bodyChangeDebouncer = true;
    setTimeout(() => {
      this.__bodyChangeDebouncer = false;
      this.__processAmfData(this.amfBody);
    });
  }
  /**
   * A handler for `amfBody` property change.
   * Resets `mediaTypes` property as defined in the model.
   *
   * @param {Array|Object} bodyShape Passed model
   */
  __processAmfData(bodyShape) {
    this._effectiveModel = undefined;
    if (!bodyShape || (bodyShape instanceof Array && !bodyShape.length)) {
      // Clears view model from the value.
      this._panelModel = undefined;
      return;
    }

    bodyShape = this._ensurePayloadModel(bodyShape);
    if (!bodyShape) {
      this._panelModel = undefined;
      return;
    }
    this._updateAmfMediaTypes(bodyShape);
    this._selectDefaultMediaType(bodyShape);
    this._effectiveModel = bodyShape;
  }

  /**
   * Ensures that the passed model is an array of
   * `http://raml.org/vocabularies/http#Payload`
   * in the AMF vocabulary.
   * The element accepts `http://www.w3.org/ns/hydra/core#Operation`,
   * `http://raml.org/vocabularies/http#Request` or array of
   * `http://raml.org/vocabularies/http#Payload` definitions.
   * It selectes the array from the model.
   *
   * @param {Array|Object} model Passed model
   * @return {Array|undefined} Payload model of undefined if the model
   * is invalid for this element.
   */
  _ensurePayloadModel(model) {
    if (model instanceof Array) {
      if (this._hasType(model[0], this.ns.raml.vocabularies.http + 'Payload')) {
        return model;
      }
      model = model[0];
    }
    if (!this._hasType(model, this.ns.w3.hydra.core + 'Operation')) {
      return;
    }
    const opKey = this._getAmfKey(this.ns.w3.hydra.core + 'expects');
    model = model[opKey];
    if (model instanceof Array) {
      model = model[0];
    }
    if (!this._hasType(model, this.ns.raml.vocabularies.http + 'Request')) {
      return;
    }
    const pKey = this._getAmfKey(this.ns.raml.vocabularies.http + 'payload');
    return this._ensureArray(model[pKey]);
  }

  /**
   * Creates a list of media types supported by the endpoint as defined in
   * API spec file.
   * @param {Array} model List of `Payload` definitions
   */
  _updateAmfMediaTypes(model) {
    this._mimeTypes = undefined;
    const ns = this.ns.raml.vocabularies;
    const key = ns.http + 'mediaType';
    const mediaTypes = model.map((item) => this._getValue(item, key));
    this._mimeTypes = mediaTypes;
    this._singleMimeType = mediaTypes && mediaTypes.length === 1;
  }
  /**
   * Sets a content type property based on AMF mode's available options.
   * It sets the first defined media type in the model.
   *
   * This function **always** triggers the change by clearing `contentType`
   * first and then assigning new value.
   *
   * If the AMF model is a file model then it sets `fileAccept` property
   *
   * @param {Array} model List of `Payload` definitions
   */
  _selectDefaultMediaType(model) {
    const types = this._mimeTypes;
    if (!types || !types[0]) {
      return;
    }
    const ns = this.ns.raml.vocabularies;
    // Types corresponds to model array in order.
    const schemaKey = this._getAmfKey(this.ns.raml.vocabularies.http + 'schema');
    let shape = model[0][schemaKey];
    if (shape instanceof Array) {
      shape = shape[0];
    }
    // this.contentType = undefined;
    let ct;
    if (this._hasType(shape, ns.shapes + 'FileShape')) {
      this.fileAccept = types;
      ct = 'application/octet-stream';
    } else {
      if (this.fileAccept) {
        this.fileAccept = undefined;
      }
      const index = types.indexOf(this.contentType);
      ct = index === -1 ? types[0] : types[index];
    }
    this.contentType = ct;
    this._notifyContentTypeChange(ct);
  }

  _updatePanelAmf(contentType) {
    if (!contentType) {
      return;
    }
    const [payload, schema] = this._schemaForMedia(contentType);
    if (!schema) {
      return;
    }
    this._updatePanelModel(contentType, schema);
    this._updatePanelValue(contentType, payload);
  }

  _schemaForMedia(mediaType) {
    const key = this._getAmfKey(this.ns.raml.vocabularies.http + 'mediaType');
    for (let i = 0, len = this._effectiveModel.length; i < len; i++) {
      const payload = this._effectiveModel[i];
      let itemMedia = payload[key];
      if (!itemMedia) {
        continue;
      }
      if (itemMedia instanceof Array) {
        itemMedia = itemMedia[0];
      }
      if (typeof itemMedia !== 'string') {
        itemMedia = itemMedia['@value'];
      }
      if (itemMedia === mediaType) {
        const sKey = this._getAmfKey(this.ns.raml.vocabularies.http + 'schema');
        let schema = payload[sKey];
        if (schema instanceof Array) {
          schema = schema[0];
        }
        this._resolve(payload);
        this._resolve(schema);
        return [payload, schema];
      }
    }
    return [];
  }
  /**
   * Tests if the panel that supports given content-type supports data model.
   * XML and JSON do not use view data model to render the view.
   * @param {String} contentType A content type value to test
   * @return {Boolean} True if the content type's panel support data model
   */
  _typeHasModel(contentType) {
    const allowed = ['application/x-www-form-urlencoded', 'multipart/form-data'];
    return allowed.indexOf(contentType) !== -1;
  }

  /**
   * Updates view model on panels that support the model.
   *
   * @param {String} contentType Current content type
   * @param {Object} schema A schema for current payload.
   */
  _updatePanelModel(contentType, schema) {
    const node = this.shadowRoot.querySelector('api-view-model-transformer');
    if (!node || !this._typeHasModel(contentType)) {
      return;
    }
    if (!node.amf) {
      node.amf = this.amf;
    }
    let data;
    this._resolve(schema);
    if (this._hasType(schema, this.ns.raml.vocabularies.shapes + 'UnionShape')) {
      data = this._getUnionObjectProperties(schema);
    } else if (this._hasType(schema, this.ns.w3.shacl.name + 'NodeShape')) {
      const pKey = this._getAmfKey(this.ns.w3.shacl.name + 'property');
      data = this._ensureArray(schema[pKey]);
    }
    if (!data) {
      // It could be an array but it doesn't make any sens with this
      // media types.
      return;
    }
    const model = node.computeViewModel(data);
    this._panelModel = model;
  }
  /**
   * To simplify things, this searches for first **object** from the union type
   * definition and returns its properties.
   *
   * The component do not offer an UI to selected union type.
   *
   * @param {Object} schema Payload's schema definition
   * @return {Array<Object>|undefined} Properies of first object, if any.
   */
  _getUnionObjectProperties(schema) {
    const key = this._getAmfKey(this.ns.raml.vocabularies.shapes + 'anyOf');
    const list = this._ensureArray(schema[key]);
    if (!list) {
      return;
    }
    const pKey = this._getAmfKey(this.ns.w3.shacl.name + 'property');
    for (let i = 0, len = list.length; i < len; i++) {
      let item = list[i];
      if (item instanceof Array) {
        item = item[0];
      }
      this._resolve(item);
      if (this._hasType(item, this.ns.w3.shacl.name + 'NodeShape')) {
        item = this._resolve(item);
        const data = this._ensureArray(item[pKey]);
        if (data) {
          return data;
        }
      }
    }
  }
  /**
   * Updates panel value depending on examples or type schema availability.
   *
   * @param {String} type Current content type
   * @param {Object} schema A schema for current payload.
   */
  _updatePanelValue(type, schema) {
    const node = this.shadowRoot.querySelector('api-example-generator');
    if (!node) {
      return;
    }
    if (!node.amf) {
      node.amf = this.amf;
    }
    const examples = node.generatePayloadExamples(schema, type, {});
    if (!examples) {
      return;
    }
    for (let i = 0, len = examples.length; i < len; i++) {
      const item = examples[i];
      if (typeof item.value !== 'undefined') {
        this.value = item.value;
        return;
      }
      if (item.values) {
        this.value = item.values[0].value;
        return;
      }
    }
  }
};
