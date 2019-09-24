import { AnypointSelectableMixin } from './anypoint-selectable-mixin.js';
/**
 * Port of `@polymer/iron-selector/iron-multi-selectable.js`.
 *
 * A mixin to be applied to a class where child elements can be selected and selection
 * can be applied to more than one item.
 *
 * Note, by default the mixin works with LitElement. If used with different class
 * make sure that attributes are reflected to properties correctly.
 *
 * @mixinFunction
 * @param {Class} base
 * @return {Class}
 * @appliesMixin AnypointSelectableMixin
 */
export const AnypointMultiSelectableMixin = (base) => class extends AnypointSelectableMixin(base) {
  static get properties() {
    return {
      /**
       * If true, multiple selections are allowed.
       */
      multi: { type: Boolean },
      /**
       * Gets or sets the selected elements. This is used instead of `selected`
       * when `multi` is true.
       */
      selectedValues: { type: Array },
      _selectedItems: { type: Array }
    };
  }

  get multi() {
    return this._multi;
  }

  set multi(value) {
    const old = this._multi;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._multi = value;
    this.multiChanged(value);
  }

  get selectedValues() {
    return this._selectedValues;
  }

  set selectedValues(value) {
    const old = this._selectedValues;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._selectedValues = value;
    this._updateSelected();
    this.dispatchEvent(new CustomEvent('selectedvalues-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * @return {Array<Element>} An array of currently selected items.
   */
  get selectedItems() {
    return this._selectedItems;
  }

  get _selectedItems() {
    return this.__selectedItems;
  }

  set _selectedItems(value) {
    const old = this.__selectedItems;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.__selectedItems = value;
    this.dispatchEvent(new CustomEvent('selecteditems-changed', {
      detail: {
        value
      }
    }));
  }

  /**
   * @return {Function} Previously registered handler for `selectedvalues-changed` event
   */
  get onselectedvalueschanged() {
    return this['_onselectedvalues-changed'];
  }
  /**
   * Registers a callback function for `selectedvalues-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onselectedvalueschanged(value) {
    this._registerCallback('selectedvalues-changed', value);
  }

  /**
   * @return {Function} Previously registered handler for `selecteditems-changed` event
   */
  get onselecteditemschanged() {
    return this['_onselecteditems-changed'];
  }
  /**
   * Registers a callback function for `selecteditems-changed` event
   * @param {Function} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onselecteditemschanged(value) {
    this._registerCallback('selecteditems-changed', value);
  }

  constructor() {
    super();
    this.multi = false;
    this._selectedValues = [];
    this._selectedItems = [];
  }

  /**
   * Selects the given value. If the `multi` property is true, then the selected
   * state of the `value` will be toggled; otherwise the `value` will be
   * selected.
   *
   * @method select
   * @param {string|number} value the value to select.
   */
  select(value) {
    if (this.multi) {
      this._toggleSelected(value);
    } else {
      this.selected = value;
    }
  }

  multiChanged(multi) {
    this._selection.multi = multi;
    this._updateSelected();
  }

  _updateAttrForSelected() {
    if (!this.multi) {
      super._updateAttrForSelected();
    } else if (this.selectedItems && this.selectedItems.length > 0) {
      this.selectedValues =
        this.selectedItems.map((selectedItem) => this._indexToValue(this.indexOf(selectedItem)))
          .filter((unfilteredValue) => unfilteredValue !== null);
    }
  }

  _updateSelected() {
    if (this.multi) {
      this._selectMulti(this.selectedValues);
    } else {
      this._selectSelected(this.selected);
    }
  }

  _selectMulti(values) {
    values = values || [];

    const selectedItems = (this._valuesToItems(values) || [])
      .filter((item) => item !== null && item !== undefined);

    // clear all but the current selected items
    this._selection.clear(selectedItems);

    // select only those not selected yet
    for (let i = 0; i < selectedItems.length; i++) {
      this._selection.setItemSelected(selectedItems[i], true);
    }

    // Check for items, since this array is populated only when attached
    if (this.fallbackSelection && !this._selection.get().length) {
      const fallback = this._valueToItem(this.fallbackSelection);
      if (fallback) {
        this.select(this.fallbackSelection);
      }
    }
  }

  _selectionChange() {
    const s = this._selection.get();
    if (this.multi) {
      this._selectedItems = s;
      this._selectedItem = (s.length ? s[0] : null);
    } else {
      if (s !== null && s !== undefined) {
        this._selectedItems = [s];
        this._selectedItem = s;
      } else {
        this._selectedItems = [];
        this._selectedItem = null;
      }
    }
  }

  _toggleSelected(value) {
    const i = this.selectedValues.indexOf(value);
    const unselected = i < 0;
    const items = this.selectedValues;
    if (unselected) {
      items.push(value);
    } else {
      items.splice(i, 1);
    }
    this.selectedValues = [...items];
  }

  _valuesToItems(values) {
    return (values === null) ?
      null :
      values.map((value) => this._valueToItem(value));
  }
};
