/**
 * This mixin is a port of [IronScrollTargetBehavior](https://github.com/PolymerElements/iron-acroll-target-behavior)
 * that works with LitElements.
 *
 * `ArcScrollTargetMixin` allows an element to respond to scroll
 * events from a designated scroll target.
 *
 * Elements that consume this mixin can override the `_scrollHandler`
 * method to add logic on the scroll event.
 *
 *
 * ## Usage
 *
 * ```javascript
 * import { LitElement } from 'lit-element';
 * import { ArcScrollTargetMixin } from '@advanced-rest-client/arc-scroll-target-mixin/arc-scroll-target-mixin.js';
 *
 * class ArcOverlayImpl extends ArcScrollTargetMixin(LitElement) {
 *  _scrollHandler(e) {
 *    ...
 *  }
 * }
 * ```
 *
 * @demo demo/scrolling-region.html Scrolling Region
 * @demo demo/index.html Document Element
 * @param {Class} superClass
 * @return {Class}
 */
export const ArcScrollTargetMixin = (superClass) => class extends superClass {
  static get properties() {
    return {
      /**
       * Specifies the element that will handle the scroll event
       * on the behalf of the current element. This is typically a reference to an
       *element, but there are a few more posibilities:
       *
       * ### Elements id
       *
       *```html
       * <div id="scrollable-element" style="overflow: auto;">
       *  <x-element scroll-target="scrollable-element">
       *    <!-- Content-->
       *  </x-element>
       * </div>
       *```
       * In this case, the `scrollTarget` will point to the outer div element.
       *
       * ### Document scrolling
       *
       * For document scrolling, you can use the reserved word `document`:
       *
       *```html
       * <x-element scroll-target="document">
       *   <!-- Content -->
       * </x-element>
       *```
       *
       * ### Elements reference
       *
       *```js
       * appHeader.scrollTarget = document.querySelector('#scrollable-element');
       *```
       *
       * @type {HTMLElement}
       * @default document
       */
      scrollTarget: { type: HTMLElement },
      /**
       * The `scroll-target` attribute is deprecated as it is inconsistent
       * with web platform attributes.
       * @type {HTMLElement}
       * @deprecated Use `scrolltarget` attribute instead
       */
      _legacyTarget: { type: HTMLElement, attribute: 'scroll-target' }
    };
  }

  get scrollTarget() {
    return this._scrollTarget;
  }

  set scrollTarget(value) {
    if (value === this._scrollTarget) {
      return;
    }
    this._scrollTarget = value;
    this._scrollTargetChanged(value);
  }

  get _legacyTarget() {
    return this._scrollTarget;
  }

  set _legacyTarget(value) {
    this.scrollTarget = value;
  }

  get isAttached() {
    return this._isAttached;
  }

  set isAttached(value) {
    this._isAttached = value;
    this._scrollTargetChanged(this._scrollTarget);
  }

  /**
   * The default scroll target. Consumers of this behavior may want to customize
   * the default scroll target.
   *
   * @type {Element}
   */
  get _defaultScrollTarget() {
    return this._doc;
  }

  /**
   * Shortcut for the document element
   *
   * @type {Element}
   */
  get _doc() {
    return this.ownerDocument.documentElement;
  }

  /**
   * Gets the number of pixels that the content of an element is scrolled
   * upward.
   *
   * @type {number}
   */
  get _scrollTop() {
    if (this._isValidScrollTarget()) {
      return this.scrollTarget === this._doc ? window.pageYOffset :
                                               this.scrollTarget.scrollTop;
    }
    return 0;
  }

  /**
   * Gets the number of pixels that the content of an element is scrolled to the
   * left.
   *
   * @type {number}
   */
  get _scrollLeft() {
    if (this._isValidScrollTarget()) {
      return this.scrollTarget === this._doc ? window.pageXOffset :
                                               this.scrollTarget.scrollLeft;
    }
    return 0;
  }

  /**
   * Sets the number of pixels that the content of an element is scrolled
   * upward.
   *
   * @type {Number}
   * @param {Number} top
   */
  set _scrollTop(top) {
    if (this.scrollTarget === this._doc) {
      window.scrollTo(window.pageXOffset, top);
    } else if (this._isValidScrollTarget()) {
      this.scrollTarget.scrollTop = top;
    }
  }

  /**
   * Sets the number of pixels that the content of an element is scrolled to the
   * left.
   *
   * @type {Number}
   * @param {Number} left
   */
  set _scrollLeft(left) {
    if (this.scrollTarget === this._doc) {
      window.scrollTo(left, window.pageYOffset);
    } else if (this._isValidScrollTarget()) {
      this.scrollTarget.scrollLeft = left;
    }
  }

  constructor() {
    super();
    this.scrollTarget = this._defaultScrollTarget;
    /**
     * True if the event listener should be installed.
     */
    this._shouldHaveListener = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.isAttached = true;
    setTimeout(() => {
      if (!this._oldScrollTarget && this.scrollTarget) {
        this._scrollTargetChanged(this._scrollTarget);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.isAttached = false;
  }

  /**
   * Runs on every scroll event. Consumer of this behavior may override this
   * method.
   *
   * @protected
   */
  _scrollHandler() {}

  _scrollTargetChanged(scrollTarget) {
    if (this._oldScrollTarget) {
      this._toggleScrollListener(false, this._oldScrollTarget);
      this._oldScrollTarget = null;
    }
    if (!this.isAttached) {
      return;
    }
    // Support element id references
    if (scrollTarget === 'document') {
      this.scrollTarget = this._doc;
    } else if (typeof scrollTarget === 'string') {
      if (!this.shadowRoot) {
        // shadowRoot is not yet ready. In connectedCallback it checks
        // whether this happended and calls this again to reinitialize.
        return;
      }
      const rootNode = this.getRootNode && this.getRootNode();
      let target;
      if (rootNode) {
        target = rootNode.querySelector('#' + scrollTarget);
      }
      if (!target) {
        this.ownerDocument.querySelector('#' + scrollTarget);
      }
      this.scrollTarget = target;
    } else if (this._isValidScrollTarget()) {
      this._oldScrollTarget = scrollTarget;
      this._toggleScrollListener(this._shouldHaveListener, scrollTarget);
    }
  }

  /**
   * Scrolls the content to a particular place.
   *
   * @method scroll
   * @param {number|!{left: number, top: number}} leftOrOptions The left position or scroll options
   * @param {number=} top The top position
   * @return {void}
   */
  scroll(leftOrOptions, top) {
    let left;

    if (typeof leftOrOptions === 'object') {
      left = leftOrOptions.left;
      top = leftOrOptions.top;
    } else {
      left = leftOrOptions;
    }

    left = left || 0;
    top = top || 0;
    if (this.scrollTarget === this._doc) {
      window.scrollTo(left, top);
    } else if (this._isValidScrollTarget()) {
      this.scrollTarget.scrollLeft = left;
      this.scrollTarget.scrollTop = top;
    }
  }

  /**
   * Gets the width of the scroll target.
   *
   * @type {number}
   */
  get _scrollTargetWidth() {
    if (this._isValidScrollTarget()) {
      return this.scrollTarget === this._doc ? window.innerWidth :
                                               this.scrollTarget.offsetWidth;
    }
    return 0;
  }

  /**
   * Gets the height of the scroll target.
   *
   * @type {number}
   */
  get _scrollTargetHeight() {
    if (this._isValidScrollTarget()) {
      return this.scrollTarget === this._doc ? window.innerHeight :
                                               this.scrollTarget.offsetHeight;
    }
    return 0;
  }

  /**
   * Returns true if the scroll target is a valid HTMLElement.
   *
   * @return {boolean}
   */
  _isValidScrollTarget() {
    return this.scrollTarget instanceof HTMLElement;
  }

  _toggleScrollListener(yes, scrollTarget) {
    if (!scrollTarget) {
      return;
    }
    const eventTarget = scrollTarget === this._doc ? window : scrollTarget;
    if (yes) {
      if (!this._boundScrollHandler) {
        this._boundScrollHandler = this._scrollHandler.bind(this);
        eventTarget.addEventListener('scroll', this._boundScrollHandler);
      }
    } else {
      if (this._boundScrollHandler) {
        eventTarget.removeEventListener('scroll', this._boundScrollHandler);
        this._boundScrollHandler = null;
      }
    }
  }

  /**
   * Enables or disables the scroll event listener.
   *
   * @param {boolean} yes True to add the event, False to remove it.
   */
  toggleScrollListener(yes) {
    this._shouldHaveListener = yes;
    this._toggleScrollListener(yes, this.scrollTarget);
  }
};
