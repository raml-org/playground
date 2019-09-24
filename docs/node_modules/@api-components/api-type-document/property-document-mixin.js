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
 * A mixin that contains common function for `property-*-document` elements.
 *
 * @mixinFunction
 * @memberof ArcBehaviors
 * @appliesMixin AmfHelperMixin
 * @param {Class} base
 * @return {Class}
 */
export const PropertyDocumentMixin = (base) => class extends AmfHelperMixin(base) {
  static get properties() {
    return {
      /**
       * A property shape definition of AMF.
       *
       * @type {Object}
       */
      shape: { type: Object },
      /**
       * Computes value of shape's http://raml.org/vocabularies/shapes#range
       * @type {Object}
       */
      range: { type: Object },
      /**
       * Type's current media type.
       * This is used to select/generate examples according to current body
       * media type. When not set it only renders examples that were defined
       * in API specfile in a form as they were written.
       */
      mediaType: { type: String },
      /**
       * When set it removes actions bar from the examples render.
       */
      noExamplesActions: { type: Boolean },

      _hasMediaType: { type: Boolean },

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
       */
      graph: { type: Boolean }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  get mediaType() {
    return this._mediaType;
  }

  set mediaType(value) {
    if (this._setObservableProperty('mediaType', value)) {
      this._hasMediaType = this._computeHasMediaType(value);
    }
  }

  get graph() {
    return this._graph;
  }

  set graph(value) {
    if (this._setObservableProperty('graph', value)) {
      this._evaluateGraph();
    }
  }

  constructor() {
    super();
    this._hasMediaType = false;
  }

  _setObservableProperty(prop, value) {
    const key = '_' + prop;
    const old = this[key];
    if (old === value) {
      return false;
    }
    this[key] = value;
    if (this.requestUpdate) {
      this.requestUpdate(prop, old);
    }
    return true;
  }
  /**
   * Computes type from a `http://raml.org/vocabularies/shapes#range` object
   *
   * @param {Object} range AMF property range object
   * @return {String} Data type of the property.
   */
  _computeRangeDataType(range) {
    if (!range) {
      return;
    }
    const rs = this.ns.raml.vocabularies.shapes;
    if (this._hasType(range, rs + 'ScalarShape')) {
      const sc = this.ns.w3.xmlSchema;
      const key = this._getAmfKey(this.ns.w3.shacl.name + 'datatype');
      const data = this._ensureArray(range[key]);
      const id = (data && data[0]) ? data[0]['@id'] : '';
      switch (id) {
        case this._getAmfKey(sc + 'string'):
        case sc + 'string':
          return 'String';
        case this._getAmfKey(sc + 'integer'):
        case sc + 'integer':
          return 'Integer';
        case this._getAmfKey(sc + 'long'):
        case sc + 'long':
          return 'Long';
        case this._getAmfKey(sc + 'float'):
        case sc + 'float':
          return 'Float';
        case this._getAmfKey(sc + 'double'):
        case sc + 'double':
          return 'Double';
        case this._getAmfKey(rs + 'number'):
        case rs + 'number':
          return 'Number';
        case this._getAmfKey(sc + 'boolean'):
        case sc + 'boolean':
          return 'Boolean';
        case this._getAmfKey(sc + 'dateTime'):
        case sc + 'dateTime':
          return 'DateTime';
        case this._getAmfKey(rs + 'dateTimeOnly'):
        case rs + 'dateTimeOnly':
          return 'Time';
        case this._getAmfKey(sc + 'time'):
        case sc + 'time':
          return 'Time';
        case this._getAmfKey(sc + 'date'):
        case sc + 'date':
          return 'Date';
        case this._getAmfKey(sc + 'base64Binary'):
        case sc + 'base64Binary':
          return 'Base64 binary';
        case this._getAmfKey(rs + 'password'):
        case rs + 'password':
          return 'Password';
      }
    }
    if (this._hasType(range, rs + 'UnionShape')) {
      return 'Union';
    }
    if (this._hasType(range, rs + 'ArrayShape')) {
      return 'Array';
    }
    if (this._hasType(range, this.ns.w3.shacl.name + 'NodeShape')) {
      return 'Object';
    }
    if (this._hasType(range, rs + 'FileShape')) {
      return 'File';
    }
    if (this._hasType(range, rs + 'NilShape')) {
      return 'Null';
    }
    if (this._hasType(range, rs + 'AnyShape')) {
      return 'Any';
    }
    if (this._hasType(range, rs + 'MatrixShape')) {
      return 'Matrix';
    }
    if (this._hasType(range, rs + 'TupleShape')) {
      return 'Tuple';
    }
    if (this._hasType(range, rs + 'UnionShape')) {
      return 'Union';
    }
    if (this._hasType(range, rs + 'RecursiveShape')) {
      return 'Recursive';
    }
    return 'Unknown type';
  }
  /**
   * Computes value for `range` property.
   * @param {Object} shape Current shape object.
   * @return {Object} Range object
   */
  _computeRange(shape) {
    if (!shape) {
      return;
    }
    let data;
    if (this._hasType(shape, this.ns.raml.vocabularies.shapes + 'ScalarShape')) {
      data = shape;
    } else if (this._hasType(shape, this.ns.raml.vocabularies.http + 'Parameter')) {
      const key = this._getAmfKey(this.ns.raml.vocabularies.http + 'schema');
      data = this._ensureArray(shape[key]);
      data = (data && data.length) ? data[0] : undefined;
    } else {
      const key = this._getAmfKey(this.ns.raml.vocabularies.shapes + 'range');
      data = this._ensureArray(shape[key]);
      data = (data && data.length) ? data[0] : undefined;
    }
    return data;
  }
  /**
   * Computes properties to render Array items documentation.
   *
   * @param {Object} range Range object of current shape.
   * @return {Array<Object>|undefined} List of Array items.
   */
  _computeArrayProperties(range) {
    if (!range) {
      return;
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.shapes + 'items');
    let item = range[key];
    if (!item) {
      return;
    }
    if (item instanceof Array) {
      item = item[0];
    }
    item = this._resolve(item);
    if (!item) {
      return;
    }
    switch (true) {
      case this._hasType(item, this.ns.raml.vocabularies.shapes + 'ScalarShape'):
        item.isShape = true;
        return this._ensureArray(item);
      case this._hasType(item, this.ns.raml.vocabularies.shapes + 'UnionShape'):
      case this._hasType(item, this.ns.raml.vocabularies.shapes + 'ArrayShape'):
        item.isType = true;
        return [item];
      default:
        {
          const pkey = this._getAmfKey(this.ns.w3.shacl.name + 'property');
          const items = this._ensureArray(item[pkey]);
          if (items) {
            items.forEach((item) => item.isShape = true);
          }
          return items;
        }
    }
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
   * Computes list of union type labels to render.
   *
   * @param {Boolean} isUnion
   * @param {Object} range
   * @return {Array<Object>}
   */
  _computeUnionTypes(isUnion, range) {
    if (!isUnion || !range) {
      return;
    }
    const key = this._getAmfKey(this.ns.raml.vocabularies.shapes + 'anyOf');
    const list = this._ensureArray(range[key]);
    if (!list) {
      return;
    }
    return list.map((item) => {
      if (item instanceof Array) {
        item = item[0];
      }
      item = this._resolve(item);
      let isScalar = this._hasType(item, this.ns.raml.vocabularies.shapes + 'ScalarShape');
      const isNil = this._hasType(item, this.ns.raml.vocabularies.shapes + 'NilShape');
      if (!isScalar && isNil) {
        isScalar = true;
      }
      const isArray = this._hasType(item, this.ns.raml.vocabularies.shapes + 'ArrayShape');
      const isType = !isScalar && !isArray;
      let label;
      if (isArray) {
        label = this._getValue(item, this.ns.w3.shacl.name + 'name');
        if (!label) {
          const key = this._getAmfKey(this.ns.raml.vocabularies.shapes + 'items');
          label = this._computeArrayUnionLabel(item[key]);
        }
      } else if (isNil) {
        label = 'Null';
      } else {
        label = this._getValue(item, this.ns.schema.schemaName);
        if (!label) {
          label = this._getValue(item, this.ns.w3.shacl.name + 'name');
        }
        if (!label && this._hasType(item, this.ns.raml.vocabularies.shapes + 'ScalarShape')) {
          label = this._computeRangeDataType(item);
        }
      }
      if (!label) {
        label = 'Unnamed type';
      }
      return {
        isScalar,
        isArray,
        isType,
        label
      };
    });
  }
  /**
   * Computes union type label when the union is in Array.
   *
   * @param {Array|Object} items Array's items property or a single property
   * @return {String|undefined} Label for the union type.
   */
  _computeArrayUnionLabel(items) {
    if (!items) {
      return;
    }
    if (items instanceof Array) {
      items = items[0];
    }
    items = this._resolve(items);
    if (this._hasType(items, this.ns.raml.vocabularies.shapes + 'ScalarShape')) {
      return this._computeRangeDataType(items);
    }
    return this._computeDisplayName(items, items);
  }

  /**
   * Computes name label for the shape.
   *
   * @param {Object} range Range object of current shape.
   * @param {Object} shape The shape of the property.
   * @return {String} Display name of the property
   */
  _computeDisplayName(range, shape) {
    if (!shape || !range) {
      return;
    }
    // let name;
    if (this._hasType(shape, this.ns.raml.vocabularies.http + 'Parameter')) {
      return this._getValue(range, this.ns.schema.schemaName);
      // if(!name) {
      //   name =  this._getValue(shape, this.ns.raml.vocabularies.http + 'paramName');
      // }
    } else if (this._hasType(range, this.ns.w3.shacl.name + 'NodeShape')) {
      return this._getValue(shape, this.ns.w3.shacl.name + 'name');
    } else {
      return this._getValue(range, this.ns.schema.schemaName);
      // if (!name) {
      //   name = this._getValue(range, this.ns.w3.shacl.name + 'name');
      // }
    }
    // if (!name) {
    //   // File and Union types does not have "name" on range object.
    //   name = this._getValue(shape, this.ns.w3.shacl.name + 'name');
    // }
    // if (name && name[name.length - 1] === '?') {
    //   name = name.substr(0, name.length - 1);
    // }
    // return name;
  }

  _computeHasMediaType(mediaType) {
    return !!mediaType;
  }

  _evaluateGraph() {}
};
