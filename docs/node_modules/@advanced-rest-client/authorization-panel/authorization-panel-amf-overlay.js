import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
/**
 * A mixin for the authorization panel that provides support for
 * AMF model.
 *
 * This is purely for code r1eadiness.
 *
 * @param {Class} base
 * @return {Class}
 * @mixinFunction
 */
export const AuthorizationPanelAmfOverlay = (base) => class extends AmfHelperMixin(base) {
  static get properties() {
    return {
      /**
       * Security definition for an endpoint in AMF json/ld model.
       * It is `http://raml.org/vocabularies/security#security`
       * property of the `http://www.w3.org/ns/hydra/core#supportedOperation`
       * property of an endpoint.
       */
      securedBy: { type: Array },
      /**
       * List of currently available custom security schemes declared in
       * the AMF
       */
      customSchemes: { type: Array },
      /**
       * Computed value of validation state.
       * To be used with CSS selectors to style the element when the authorization
       * form is onvalid.
       *
       * Example:
       *
       * ```css
       * authorization-panel[invalid] {
       *  border: 1px red solid;
       * }
       * ```
       */
      invalid: { type: Boolean, reflect: true },
      /**
       * Computed value from the AMF model.
       * If authorization is required by endpoint defined in the model,
       * then internally this property is set to `true`.
       *
       * It can be `false` if `selected` is `none`, meaning RAML spec
       * allows no authorization.
       */
      _authRequired: { type: Boolean },
    };
  }

  get authRequired() {
    return this._authRequired;
  }

  get _authRequired() {
    return this.__authRequired;
  }

  set _authRequired(value) {
    if (this._sop('_authRequired', value)) {
      this.validate();
      this.dispatchEvent(new CustomEvent('authrequired-changed', {
        detail: {
          value
        }
      }));
    }
  }

  get securedBy() {
    return this._securedBy;
  }

  set securedBy(value) {
    if (this._sop('securedBy', value)) {
      this._securedByChanged();
    }
  }
  /**
   * Sets Observable Property.
   * @param {String} prop Property name to set
   * @param {any} value A value to set
   * @return {Boolean} True if property was changed.
   */
  _sop(prop, value) {
    const key = `_${prop}`;
    const old = this[key];
    /* istanbul ignore if */
    if (old === value) {
      return false;
    }
    this[key] = value;
    this.requestUpdate(prop, old);
    return true;
  }
  /**
   * Overrides `AmfHelperMixin.__amfChanged`
   */
  __amfChanged() {
    this._securedByChanged();
  }
  /**
   * Validates current settings received from currently selected authorization
   * panel.
   *
   * @return {Boolean} Validation result.
   */
  validate() {
    const { settings, selected,  _authRequired } = this;
    const formValid = settings && settings.valid;
    let result;
    if (!settings && _authRequired) {
      result = false;
    } else if (!settings) {
      result = true;
    } else if ((selected === undefined || selected === -1) && _authRequired) {
      // valid by default
      result = true;
    } else if ((selected === undefined || selected === -1) && !_authRequired) {
      result = true;
    } else if (formValid === undefined && !_authRequired) {
      result = true;
    } else  if (formValid !== undefined) {
      result = formValid;
    } else {
      result = true;
    }
    this.invalid = !result;
    return result;
  }

  _securedByChanged() {
    if (this._amfDebouncer) {
      return;
    }
    // See https://github.com/anypoint-web-components/anypoint-selector/issues/1
    this.selected = -1;
    this.authMethods = undefined;
    this._amfDebouncer = true;
    setTimeout(() => {
      this._amfDebouncer = false;
      this._processAmfModel();
    });
  }
  /**
   * Restores component to it's initial state.
   * @return {Promise}
   */
  async restoreDefaults() {
    this._authRequired = false;
    this.authMethods = this._listAuthMethods();
    await this.updateComplete;
    this.selected = 0;
  }

  async _processAmfModel() {
    const secured = this.securedBy;
    if (!secured || !secured.length) {
      await this.restoreDefaults();
      return;
    }
    const supported = [];
    const secPrefix = this.ns.raml.vocabularies.security;
    let hasNull = false;
    for (let i = 0, len = secured.length; i < len; i++) {
      const item = secured[i];
      if (!this._hasType(item, secPrefix + 'ParametrizedSecurityScheme') &&
        !this._hasType(item, secPrefix + 'SecurityScheme')) {
        continue;
      }
      const shKey = this._getAmfKey(secPrefix + 'scheme');
      let scheme = item[shKey];
      if (!scheme) {
        hasNull = true;
        continue;
      }
      if (scheme instanceof Array) {
        scheme = scheme[0];
      }
      const type = this._getValue(scheme, secPrefix + 'type');
      if (!type) {
        hasNull = true;
        continue;
      }
      let name = this._getValue(scheme, this.ns.schema.displayName);
      if (!name) {
        if (type === 'x-custom') {
          name = this._getValue(item, secPrefix + 'name');
          if (!name) {
            name = 'Custom authorization';
          }
        } else {
          name = type;
        }
      }

      supported[supported.length] = {
        name: name,
        type: type
      };
    }
    if (hasNull) {
      supported.unshift({
        name: 'No authorization',
        type: 'none'
      });
    }
    this.authMethods = supported;
    const isRequired = !!(supported && supported.length) && !hasNull;
    this._authRequired = isRequired;
    this._analyticsEvent('authorization-panel', 'usage-amf', 'loaded');
    await this.updateComplete;
    this.selected = 0;
  }

  /**
   * Searches for AMF security description in the AMF model.
   *
   * @param {String} type Security scheme type as defined in RAML spec.
   * @param {?String} name Display name of the security scheme
   * @return {[type]} [description]
   */
  _computeAmfSettings(type, name) {
    const model = this.securedBy;
    if (!model) {
      return;
    }
    if (name === type) {
      name = undefined;
    }
    const secPrefix = this.ns.raml.vocabularies.security;
    for (let i = 0, len = model.length; i < len; i++) {
      const item = model[i];
      const shKey = this._getAmfKey(secPrefix + 'scheme');
      let scheme = item[shKey];
      if (!scheme) {
        continue;
      }
      if (scheme instanceof Array) {
        scheme = scheme[0];
      }
      const modelType = this._getValue(scheme, secPrefix + 'type');
      if (!modelType) {
        continue;
      }
      if (modelType === type) {
        if (!name) {
          return item;
        }
        let modelName = this._getValue(scheme, this.ns.schema.displayName);
        if (!modelName) {
          modelName = this._getValue(item, secPrefix + 'name');
        }
        if (modelName === name) {
          return item;
        }
      }
    }
  }

  /**
   * Finds a RAML method name from both RAML type or auth panel type.
   * @param {String} type
   * @return {String|undefined} RAML type name
   */
  _panelTypeToRamType(type) {
    switch (type) {
      case 'none':
      case 'No authorization':
        return 'none';
      case 'ntlm':
      case 'NTLM':
        return 'ntlm';
      case 'basic':
      case 'Basic Authentication':
        return 'Basic Authentication';
      case 'digest':
      case 'Digest Authentication':
        return 'Digest Authentication';
      case 'oauth1':
      case 'OAuth 1.0':
        return 'OAuth 1.0';
      case 'oauth2':
      case 'OAuth 2.0':
        return 'OAuth 2.0';
    }
  }
};
