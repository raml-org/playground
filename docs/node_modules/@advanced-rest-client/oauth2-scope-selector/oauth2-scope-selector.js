/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
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
import {
  html,
  css,
  LitElement
} from 'lit-element';
import {
  ValidatableMixin
} from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import {
  ControlStateMixin
} from '@anypoint-web-components/anypoint-control-mixins/anypoint-control-mixins.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@anypoint-web-components/anypoint-autocomplete/anypoint-autocomplete.js';
import '@polymer/paper-toast/paper-toast.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@polymer/iron-icon/iron-icon.js';
/**
A selector for OAuth 2.0 scope. Provides the UI to enter a scope for OAuth 2.0 settings.

#### Example

```html
<oauth2-scope-selector></oauth2-scope-selector>
```

`allowed-scopes` attribute allows to provide a list of predefined scopes
supported by the endpoint. When the list is set, autocomplete is enabled.
Autocomplete is supported by `anypoint-autocomplete` element.

Setting `prevent-custom-scopes` dissallows adding a scope that is not defined
in the `allowed-scopes` array. This can only work with `allowed-scopes` set

#### Example

```html
<oauth2-scope-selector prevent-custom-scopes allowed-scopes='["email", "profile"]'></oauth2-scope-selector>
```

And in JavaScript

```javascript
var selector = document.querySelector('oauth2-scope-selector');
selector.allowedScopes = ['profile', 'email'];
```

## Adding scope documentation

`allowedScopes` property can be an list of object to present scope description
after it is selected. Object in the array has to contain `label` and `description` properties.
`label` is scope value.

### Example

```javascript
const scopes = [
  {
    'label': 'user',
    'description': 'Grants read/write access to profile info only. Note that this scope includes user:email and user:follow.'
  },
  {'label': 'user:email', 'description': 'Grants read access to a user\'s email addresses.'},
  {'label': 'user:follow', 'description': 'Grants access to follow or unfollow other users.'}
];
const selector = document.querySelector('oauth2-scope-selector');
selector.allowedScopes = scopes;
```

See demo page for example implementation.

## Use with forms

The element can be used in a form by using `iron-form` custom element.
It's value is reported to the form as any other form input. `name` attribute
must be set in order to process the value.

```html
<iron-form id="form">
  <form>
    <oauth2-scope-selector name="scope" required></oauth2-scope-selector>
  </form>
</iron-form>
<script>
const form = document.getElementById('form');
const values = form.serializeForm();
console.log(values); // {"scope": []}
</script>
```

@customElement
@demo demo/index.html
@memberof UiElements
@appliesMixin ValidatableMixin
@appliesMixin ControlStateMixin
*/
class OAuth2ScopeSelector extends ControlStateMixin(ValidatableMixin(LitElement)) {
  static get styles() {
    return css `
    :host {
     display: block;
     outline: none;
     box-sizing: border-box;

     font-size: var(--arc-font-body1-font-size);
     font-weight: var(--arc-font-body1-font-weight);
     line-height: var(--arc-font-body1-line-height);
   }

   anypoint-autocomplete {
     top: 52px;
   }

   .input-container {
     position: relative;
   }

   .add-button,
   .delete-icon {
     margin-left: 12px;
   }

   .form-label {
     margin: 12px 8px;
   }

   .scope-input {
     width: auto;
   }

   .scopes-list {
    list-style: none;
    margin: 12px 8px;
    padding: 0;
   }

   .scope-item {
    display: flex;
    flex-direction: row;
    align-items: center;
   }

   .scope-display {
     overflow: hidden;
     font-size: 16px;
   }

   .scope-item[two-line] {
     margin-bottom: 12px;
   }

   .scope-item[two-line] .scope-display {
     font-weight: 400;
   }

   .scope-item-label {
     text-overflow: ellipsis;
     overflow: hidden;
     white-space: nowrap;
   }

   .scope-display div[secondary] {
     font-size: 14px;
     font-weight: 400;
     line-height: 20px;
     color: var(--oauth2-scope-selector-item-description-color, #737373);
   }`;
  }

  _scopesListTemplate() {
    const value = this.value;
    if (!value || !value.length) {
      return;
    }
    const {
      readOnly,
      disabled,
      _allowedIsObject
    } = this;
    return value.map((item, index) => html`
    <li class="scope-item" ?two-line="${_allowedIsObject}">
      <div class="scope-display">
        <div class="scope-item-label">${item}</div>
        <div secondary="">${this._computeItemDescription(item, _allowedIsObject)}</div>
      </div>
      <anypoint-icon-button
        class="delete-icon"
        data-index="${index}"
        data-action="remove-scope"
        @click="${this._removeScope}"
        ?disabled="${readOnly || disabled}"
        aria-label="Press to remove this scope from the list"
        title="Remove scope">
        <iron-icon icon="arc:remove-circle-outline"></iron-icon>
      </anypoint-icon-button>
    </li>`);
  }

  render() {
    const {
      name,
      invalid,
      currentValue,
      readOnly,
      compatibility,
      outlined,
      disabled,
      _autocompleteScopes,
      _inputTarget,
      _invalidMessage
    } = this;
    return html `
    <div class="container">
      <label class="form-label">Scopes</label>

      <div class="input-container">
        <anypoint-input
          name="${name}"
          ?invalid="${invalid}"
          class="scope-input"
          .value="${currentValue}"
          ?readOnly="${readOnly}"
          ?disabled="${disabled}"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          title="Enter authorization scopes for this API endpoint"
          .invalidMessage="${_invalidMessage}"
          @value-changed="${this._currentValueHandler}"
          @keydown="${this._keyDown}">
          <label slot="label">Scope value</label>
          <anypoint-icon-button
            class="add-button"
            data-action="add-scope"
            slot="suffix"
            @click="${this._appendScope}"
            ?disabled="${readOnly || disabled}"
            aria-label="Press to add current scope to the list"
            title="Add scope">
            <iron-icon icon="arc:add-circle-outline"></iron-icon>
          </anypoint-icon-button>
        </anypoint-input>

        ${_autocompleteScopes && _autocompleteScopes.length ?
          html`<anypoint-autocomplete
          .target="${_inputTarget}"
          .source="${_autocompleteScopes}"
          @selected="${this._suggestionSelected}"
        ></anypoint-autocomplete>` : ''}
      </div>

      <ul class="scopes-list">
        ${this._scopesListTemplate()}
      </ul>
    </div>
    <paper-toast missing-scope text="Enter scope value to add a scope."></paper-toast>
    <paper-toast dissalowed text="You can't enter this scope. Use one of the provided scopes."></paper-toast>
`;
  }

  static get properties() {
    return {
      /**
       * List of scopes entered by the user. It can be used it pre-select scopes
       * by providing an array with scope values.
       */
      value: { type: Array },
      /**
       * Form input name
       */
      name: { type: String },
      /**
       * Current value entered by the user. This is not a scope and it is not
       * yet in the scopes list. User has to accept the scope before it become
       * available in the scopes list.
       */
      currentValue: { type: String },
      // Target for `anypoint-autocomplete`
      _inputTarget: { type: Object },
      /**
       * List of available scopes.
       * It can be either list of string or list of object. If this is the
       * list of object then this expects to each object contain a `label`
       * and `description` keys.
       *
       * ### Example
       * ```
       * {
       *   'label': 'user',
       *   'description': 'Grants read/write access to profile info only. '
       * }
       * ```
       * When the description is provided it will be displayed below the name
       * of the scope.
       */
      allowedScopes: { type: Array },
      // If true then scopes that are in the `allowedScopes` list will be
      // allowed to be add.
      preventCustomScopes: { type: Boolean },
      // Computed value, true if the `allowedScopes` is a list of objects
      _allowedIsObject: { type: Boolean },
      /**
       * Set to true to auto-validate the input value when it changes.
       */
      autoValidate: { type: Boolean },
      /**
       * List of scopes to be set as autocomplete source.
       */
      _autocompleteScopes: { type: Array },
      /**
       * Returns true if the value is invalid.
       *
       * If `autoValidate` is true, the `invalid` attribute is managed automatically,
       * which can clobber attempts to manage it manually.
       */
      invalid: { type: Boolean, reflect: true },
      /**
       * Set to true to mark the input as required.
       */
      required: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set the editor is in disabled mode.
       */
      disabled: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * @deprecated Use `compatibility` instead
       */
      legacy: { type: Boolean },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean }
    };
  }

  get legacy() {
    return this.compatibility;
  }

  set legacy(value) {
    this.compatibility = value;
  }

  get _invalidMessage() {
    let message;
    if (this.allowedScopes) {
      message = 'Entered value is not allowed';
    } else if (this.required) {
      message = 'Scope value is required';
    }
    return message;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._value = value;
    this.requestUpdate('value', old);
    this._handleAutoValidate(this.autoValidate, value);
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: {
        value
      }
    }));
  }

  get allowedScopes() {
    return this._allowedScopes;
  }

  set allowedScopes(value) {
    const old = this._allowedScopes;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._allowedScopes = value;
    this._allowedIsObject = this._computeAllowedIsObject(value);
    this._autocompleteScopes = this._normalizeScopes(value);
  }

  get invalid() {
    return this._invalid;
  }

  set invalid(value) {
    const old = this._invalid;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._invalid = value;
    this.requestUpdate('invalid', old);
    this._invalidChanged(value);
    this.dispatchEvent(new CustomEvent('invalid-changed', {
      detail: {
        value
      }
    }));
  }

  constructor() {
    super();

    this.value = [];
  }

  firstUpdated() {
    this._inputTarget = this.shadowRoot.querySelector('.scope-input');
  }

  _invalidChanged(invalid) {
    this.setAttribute('aria-invalid', invalid);
  }

  // Add currently entered scope value to the scopes list.
  _appendScope() {
    const value = this.currentValue;
    if (!value) {
      this.shadowRoot.querySelector('paper-toast[missing-scope]').opened = true;
      return;
    }
    this.currentValue = '';
    this.append(value);
  }
  // Remove scope button click handler
  _removeScope(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index !== index || !this.value) {
      return;
    }
    this.value.splice(index, 1);
    this.value = [...this.value];
  }
  /**
   * Handler for the `anypoint-autocomplete` selected event.
   *
   * @param {Event} e
   */
  _suggestionSelected(e) {
    e.preventDefault();

    const scope = e.detail.value;
    this.append(scope);
    setTimeout(() => {
      this.currentValue = '';
    });
  }
  /**
   * Adds a scope to the list. The same as pushing item to the `scopes`
   * array but it will check for duplicates first.
   *
   * @param {String} scope Scope value to append
   */
  append(scope) {
    const scopeValue = typeof scope === 'string' ? scope : scope.value;
    if (!scopeValue) {
      return;
    }
    const all = this.value || [];
    let index = all.indexOf(scopeValue);
    if (index !== -1) {
      return;
    }
    const as = this.allowedScopes;
    if (as && as.length) {
      index = this._findAllowedScopeIndex(scopeValue);
      if (index === -1 && this.preventCustomScopes) {
        this.shadowRoot.querySelector('paper-toast[dissalowed]').opened = true;
        return;
      }
    }
    all.push(scopeValue);
    this.value = [...all];
  }
  /**
   * Finds an index if the `scope` in the `allowedScopes` list.
   *
   * @param {String} scope A scope value (label) to find.
   * @return {Number} An index of scope or `-1` if not found.
   */
  _findAllowedScopeIndex(scope) {
    let index = -1;
    const scopes = this.allowedScopes;
    if (!scopes || !scopes.length || !scope) {
      return index;
    }
    if (this._allowedIsObject) {
      index = scopes.findIndex((item) => item.label === scope);
    } else {
      index = this.allowedScopes.indexOf(scope);
    }
    return index;
  }
  // A handler for the input's key down event. Handles ENTER press.
  _keyDown(e) {
    if (e.key !== 'Enter') {
      return;
    }
    const ac = this.shadowRoot.querySelector('anypoint-autocomplete');
    if (ac && ac.opened) {
      return;
    }
    this._appendScope();
    this.currentValue = '';
  }
  /**
   * Normalizes scopes to use it with autocomplete element.
   *
   * @param {Array} scopes List of autocomplete values. Can be list of
   * strings or objects
   * @return {Array} Normalized scopes list for autocomplete.
   */
  _normalizeScopes(scopes) {
    if (!scopes || !scopes.length) {
      return undefined;
    }
    return scopes.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      return {
        'display': item.label,
        'value': item.label,
      };
    });
  }
  /**
   * Compute function for the _allowedIsObject. Check first item of the
   * `allowedScopes` array if it is an object (return `true`) or
   * string (return `false`);
   * @param {Array<String>|Array<Object>} allowedScopes
   * @return {Boolean}
   */
  _computeAllowedIsObject(allowedScopes) {
    if (!allowedScopes || !allowedScopes.length) {
      return false;
    }
    const first = allowedScopes[0];
    return typeof first !== 'string';
  }
  /**
   * Returns a description for the selected scope.
   *
   * @param {String} scope Scope name
   * @param {Boolean} allowedIsObject True if allowed scopes is an object.
   * @return {String} Description of the scope or `` (empty string) if the
   * item do not exists.
   */
  _computeItemDescription(scope, allowedIsObject) {
    if (!allowedIsObject) {
      return;
    }
    const index = this._findAllowedScopeIndex(scope);
    if (index === -1) {
      return '';
    }
    return this.allowedScopes[index].description;
  }
  /**
   * Returns false if the element is required and does not have a selection,
   * and true otherwise.
   *
   * @return {boolean} true if `required` is false, or if `required` is true
   * and the element has a valid selection.
   */
  _getValidity() {
    const {
      value,
      disabled,
      required,
      allowedScopes
    } = this;
    const hasValue = !!(value && value.length);
    const valid = disabled || !required || (required && hasValue);
    if (!valid || !hasValue || !allowedScopes) {
      return valid;
    }
    for (let i = 0, len = value.length; i < len; i++) {
      const scope = value[i];
      const index = this._findAllowedScopeIndex(scope);
      if (index === -1) {
        return false;
      }
    }
    return true;
  }

  _handleAutoValidate(autoValidate) {
    if (autoValidate) {
      this.invalid = !this._getValidity();
    }
  }

  _currentValueHandler(e) {
    this.currentValue = e.detail.value;
  }
}
window.customElements.define('oauth2-scope-selector', OAuth2ScopeSelector);
