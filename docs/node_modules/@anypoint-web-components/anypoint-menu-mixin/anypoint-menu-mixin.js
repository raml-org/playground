import { AnypointMultiSelectableMixin }
  from '@anypoint-web-components/anypoint-selector/anypoint-multi-selectable-mixin.js';
/**
 * The list of keys has been taken from
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState
 * @private
 */
const MODIFIER_KEYS = [
  'Alt',
  'AltGraph',
  'CapsLock',
  'Control',
  'Fn',
  'FnLock',
  'Hyper',
  'Meta',
  'NumLock',
  'OS',
  'ScrollLock',
  'Shift',
  'Super',
  'Symbol',
  'SymbolLock'
];

const SEARCH_RESET_TIMEOUT_MS = 1000;

/**
 * Port of `@polymer/iron-menu-behavior`.
 *
 * A mixin that implement accessible menu and menubar behaviors.
 *
 * Note, by default the mixin works with LitElement. If used with different class
 * make sure that attributes are reflected to properties correctly.
 *
 * @mixinFunction
 * @param {Class} base
 * @return {Class}
 * @appliesMixin AnypointMultiSelectableMixin
 */
export const AnypointMenuMixin = (base) => class extends AnypointMultiSelectableMixin(base) {
  static get properties() {
    return {
      /**
       * If true, multiple selections are allowed.
       */
      _focusedItem: { type: Object },
      /**
       * The attribute to use on menu items to look up the item title. Typing the
       * first letter of an item when the menu is open focuses that item. If
       * unset, `textContent` will be used.
       */
      attrForItemTitle: { type: String },

      /**
       * @type {boolean}
       */
      disabled: { type: Boolean },

      _previousTabIndex: { type: Number },
      /**
       * When set it adds `aria-selected` attribute to currently selected item.
       *
       * The `aria-selected` attribute is invalid with default role of this
       * element ("menu"). If you manually change the role to some other that
       * accepts `aria-selected` attribute on children then set this property.
       */
      useAriaSelected: { type: Boolean }
    };
  }

  /**
   * @return {?Element} The currently focused item.
   */
  get focusedItem() {
    return this._focusedItem;
  }

  get _focusedItem() {
    return this.__focusedItem;
  }

  set _focusedItem(value) {
    const old = this.__focusedItem;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__focusedItem = value;
    this._focusedItemChanged(value, old);
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    const old = this._disabled;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._disabled = value;
    /* istanbul ignore else */
    if (this.requestUpdate) {
      this.requestUpdate('disabled', value);
    }
    this._disabledChanged(value);
  }

  constructor() {
    super();
    this._previousTabIndex = 0;

    this._onFocus = this._onFocus.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._onItemsChanged = this._onItemsChanged.bind(this);
  }

  connectedCallback() {
    /* istanbul ignore else */
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'menu');
    }
    this.addEventListener('focus', this._onFocus);
    this.addEventListener('keydown', this._onKeydown);
    this.addEventListener('children-changed', this._onItemsChanged);

    if (this._disabled === undefined) {
      this.disabled = false;
    }

    this._resetTabindices();
  }

  disconnectedCallback() {
    /* istanbul ignore else */
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.removeEventListener('focus', this._onFocus);
    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('children-changed', this._onItemsChanged);
  }

  multiChanged(value) {
    super.multiChanged(value);
    if (value) {
      this.setAttribute('aria-multiselectable', 'true');
    } else {
      this.removeAttribute('aria-multiselectable');
    }
  }

  _onItemsChanged(e) {
    const mutationsList = e.detail;
    for(const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        this._resetTabindices();
      }
    }
  }
  /**
   * Handler for the keydown event.
   * @param {KeyboardEvent} e
   */
  _onKeydown(e) {
    if (e.key === 'ArrowDown') {
      this._onDownKey(e);
    } else if (e.key === 'ArrowUp') {
      this._onUpKey(e);
    } else if (e.key === 'Tab' && e.shiftKey) {
      this._onShiftTabDown(e);
    } else if (e.key === 'Escape') {
      this._onEscKey(e);
    } else {
      this._focusWithKeyboardEvent(e);
    }
    e.stopPropagation();
  }
  /**
   * Handler that is called when the up key is pressed.
   *
   * @param {CustomEvent} e A key combination event.
   */
  _onUpKey(e) {
    this._focusPrevious();
    e.preventDefault();
  }
  /**
   * Handler that is called when the down key is pressed.
   *
   * @param {CustomEvent} e A key combination event.
   */
  _onDownKey(e) {
    e.preventDefault();
    e.stopPropagation();
    this._focusNext();
  }
  /**
   * Handler that is called when the esc key is pressed.
   *
   * @param {CustomEvent} e A key combination event.
   */
  _onEscKey() {
    const focusedItem = this.focusedItem;
    if (focusedItem) {
      focusedItem.blur();
    }
  }

  _focusWithKeyboardEvent(e) {
    // Make sure that the key pressed is not a modifier key.
    // getModifierState is not being used, as it is not available in Safari
    // earlier than 10.0.2 (https://trac.webkit.org/changeset/206725/webkit)
    if (MODIFIER_KEYS.indexOf(e.key) !== -1) {
      return;
    }
    if (this._clearSearchTextDebouncer) {
      clearTimeout(this._clearSearchTextDebouncer);
      this._clearSearchTextDebouncer = undefined;
    }
    let searchText = this._searchText || '';
    const key = e.key && e.key.length === 1 ?
        e.key :
        String.fromCharCode(e.keyCode);
    searchText += key.toLocaleLowerCase();

    const searchLength = searchText.length;
    for (let i = 0, len = this.items.length; i < len; i++) {
      const item = this.items[i];
      if (item.hasAttribute('disabled')) {
        continue;
      }

      const attr = this.attrForItemTitle || 'textContent';
      const title = (item[attr] || item.getAttribute(attr) || '').trim();

      if (title.length < searchLength) {
        continue;
      }

      if (title.slice(0, searchLength).toLocaleLowerCase() === searchText) {
        this._focusedItem = (item);
        break;
      }
    }

    this._searchText = searchText;
    this._clearSearchTextDebouncer = setTimeout(() => this._clearSearchText(), SEARCH_RESET_TIMEOUT_MS);
  }

  _clearSearchText() {
    this._searchText = '';
  }

  /**
   * Resets all tabindex attributes to the appropriate value based on the
   * current selection state. The appropriate value is `0` (focusable) for
   * the default selected item, and `-1` (not keyboard focusable) for all
   * other items. Also sets the correct initial values for aria-selected
   * attribute, true for default selected item and false for others.
   */
  _resetTabindices() {
    const firstSelectedItem = this.multi ?
        (this.selectedItems && this.selectedItems[0]) :
        this.selectedItem;
    const aria = this.useAriaSelected;
    this.items.forEach((item) => {
      item.setAttribute('tabindex', item === firstSelectedItem ? '0' : '-1');
      if (aria) {
        item.setAttribute('aria-selected', this._selection.isSelected(item));
      }
    });
  }

  /**
   * Selects the given value. If the `multi` property is true, then the selected
   * state of the `value` will be toggled; otherwise the `value` will be
   * selected.
   *
   * @param {string|number} value the value to select.
   */
  select(value) {
    const item = this._valueToItem(value);
    if (item && item.hasAttribute('disabled')) {
      return;
    }
    this._focusedItem = (item);
    super.select(value);
  }
  /**
   * Focuses the previous item (relative to the currently focused item) in the
   * menu, disabled items will be skipped.
   * Loop until length + 1 to handle case of single item in menu.
   */
  _focusPrevious() {
    const length = this.items.length;
    const curFocusIndex = Number(this.indexOf(this.focusedItem));

    for (let i = 1; i < length + 1; i++) {
      const item = this.items[(curFocusIndex - i + length) % length];
      if (!item.hasAttribute('disabled')) {
        const owner = (item.getRootNode && item.getRootNode()) || document;
        this._focusedItem = item;
        // Focus might not have worked, if the element was hidden or not
        // focusable. In that case, try again.
        if (owner.activeElement === item) {
          return;
        }
      }
    }
  }

  _focusNext() {
    const length = this.items.length;
    const curFocusIndex = Number(this.indexOf(this.focusedItem));
    for (let i = 1; i < length + 1; i++) {
      const item = this.items[(curFocusIndex + i) % length];
      if (!item.hasAttribute('disabled')) {
        const owner = (item.getRootNode && item.getRootNode()) || document;
        this._focusedItem = item;
        // Focus might not have worked, if the element was hidden or not
        // focusable. In that case, try again.
        if (owner.activeElement === item) {
          return;
        }
      }
    }
  }
  /**
   * Mutates items in the menu based on provided selection details, so that
   * all items correctly reflect selection state.
   *
   * @param {Element} item An item in the menu.
   * @param {boolean} isSelected True if the item should be shown in a
   * selected state, otherwise false.
   */
  _applySelection(item, isSelected) {
    if (this.useAriaSelected) {
      if (isSelected) {
        item.setAttribute('aria-selected', 'true');
      } else {
        item.setAttribute('aria-selected', 'false');
      }
    }
    super._applySelection(item, isSelected);
  }
  /**
   * Discretely updates tabindex values among menu items as the focused item
   * changes.
   *
   * @param {Element} focusedItem The element that is currently focused.
   * @param {?Element} old The last element that was considered focused, if
   * applicable.
   */
  _focusedItemChanged(focusedItem, old) {
    if (old) {
      old.setAttribute('tabindex', '-1');
    }
    if (focusedItem && !focusedItem.hasAttribute('disabled') && !this.disabled) {
      focusedItem.setAttribute('tabindex', '0');
      focusedItem.focus();
    }
  }

  /**
   * Handler that is called when a shift+tab keypress is detected by the menu.
   *
   * @param {CustomEvent} event A key combination event.
   */
  _onShiftTabDown() {
    const oldTabIndex = this.getAttribute('tabindex');

    this._shiftTabPressed = true;

    this._focusedItem = null;

    this.setAttribute('tabindex', '-1');

    setTimeout(() => {
      this.setAttribute('tabindex', oldTabIndex);
      this._shiftTabPressed = false;
      // NOTE(cdata): polymer/polymer#1305
    }, 1);
  }

  _onFocus(e) {
    if (this._shiftTabPressed) {
      // do not focus the menu itself
      return;
    }
    let path = e.composedPath && e.composedPath();
    if (!path) {
      path = e.path;
    }
    const rootTarget = path[0];
    if (rootTarget !== this && typeof rootTarget.tabIndex !== 'undefined' && !this.contains(rootTarget)) {
      return;
    }
    // focus the selected item when the menu receives focus, or the first item
    // if no item is selected
    const firstSelectedItem = this.multi ?
    (this.selectedItems && this.selectedItems[0]) :
    this.selectedItem;

    this._focusedItem = null;

    if (firstSelectedItem) {
      this._focusedItem = firstSelectedItem;
    } else if (this.items.length) {
      // We find the first none-disabled item (if one exists)
      this._focusNext();
    }
  }

  _activateHandler(e) {
    super._activateHandler(e);
    e.stopPropagation();
  }

  _disabledChanged(disabled) {
    if (disabled) {
      this._previousTabIndex = this.hasAttribute('tabindex') ? this.tabIndex : 0;
      this.removeAttribute('tabindex');  // No tabindex means not tab-able or select-able.
    } else if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', this._previousTabIndex);
    }
  }
};
