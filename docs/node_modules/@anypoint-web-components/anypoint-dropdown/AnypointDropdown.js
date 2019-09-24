import { html, css, LitElement } from 'lit-element';
import { ControlStateMixin } from '@anypoint-web-components/anypoint-control-mixins/control-state-mixin.js';
import { ArcOverlayMixin } from '@advanced-rest-client/arc-overlay-mixin/arc-overlay-mixin.js';

export class AnypointDropdown extends ArcOverlayMixin(ControlStateMixin(LitElement)) {
  static get styles() {
    return css`
    :host {
      position: fixed;
    }

    .contentWrapper ::slotted(*) {
      overflow: auto;
    }

    .contentWrapper.animating ::slotted(*) {
      overflow: hidden;
      pointer-events: none;
    }
    `;
  }

  static get properties() {
    return {
      /**
       * An animation config. If provided, this will be used to animate the
       * opening of the dropdown. Pass an Array for multiple animations.
       * See `neon-animation` documentation for more animation configuration
       * details.
       */
      openAnimationConfig: { type: Object },

      /**
       * An animation config. If provided, this will be used to animate the
       * closing of the dropdown. Pass an Array for multiple animations.
       * See `neon-animation` documentation for more animation configuration
       * details.
       */
      closeAnimationConfig: { type: Object },
      /**
       * If provided, this will be the element that will be focused when
       * the dropdown opens.
       */
      focusTarget: { type: Object },
      /**
       * Set to true to disable animations when opening and closing the
       * dropdown.
       */
      noAnimations: { type: Boolean },
      /**
       * By default, the dropdown will constrain scrolling on the page
       * to itself when opened.
       * Set to true in order to prevent scroll from being constrained
       * to the dropdown when it opens.
       * This property is a shortcut to set `scrollAction` to lock or refit.
       * Prefer directly setting the `scrollAction` property.
       */
      allowOutsideScroll: { type: Boolean }
    };
  }

  get allowOutsideScroll() {
    return this._allowOutsideScroll;
  }

  set allowOutsideScroll(value) {
    const old = this._allowOutsideScroll;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._allowOutsideScroll = value;
    this._allowOutsideScrollChanged(value);
  }

  get positionTarget() {
    return this._positionTarget;
  }

  set positionTarget(value) {
    const old = this._positionTarget;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._positionTarget = value;
    this._updateOverlayPosition();
  }

  get verticalAlign() {
    return this._verticalAlign;
  }

  set verticalAlign(value) {
    const old = this._verticalAlign;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._verticalAlign = value;
    this._updateOverlayPosition();
  }

  get horizontalAlign() {
    return this._horizontalAlign;
  }

  set horizontalAlign(value) {
    const old = this._horizontalAlign;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._horizontalAlign = value;
    this._updateOverlayPosition();
  }

  get verticalOffset() {
    return this._verticalOffset;
  }

  set verticalOffset(value) {
    const old = this._verticalOffset;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._verticalOffset = value;
    this._updateOverlayPosition();
  }

  get horizontalOffset() {
    return this._horizontalOffset;
  }

  set horizontalOffset(value) {
    const old = this._horizontalOffset;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._horizontalOffset = value;
    this._updateOverlayPosition();
  }

  /**
   * The element that is contained by the dropdown, if any.
   */
  get containedElement() {
    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) {
      return null;
    }
    const nodes = slot.assignedNodes({ flatten: true });
    for (let i = 0, l = nodes.length; i < l; i++) {
      if (nodes[i].nodeType === Node.ELEMENT_NODE) {
        return nodes[i];
      }
    }
    return null;
  }

  get contentWrapper() {
    return this.shadowRoot.querySelector('.contentWrapper');
  }

  constructor() {
    super();
    this.horizontalAlign = 'left';
    this.verticalAlign = 'top';
    this.noAnimations = false;
    this.allowOutsideScroll = false;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    // Ensure scrollAction is set.
    if (!this.scrollAction) {
      this.scrollAction = this.allowOutsideScroll ? 'refit' : 'lock';
    }
    this._readied = true;
  }

  firstUpdated() {
    if (!this.sizingTarget || this.sizingTarget === this) {
      this.sizingTarget = this.containedElement || this;
    }
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    this.cancelAnimation();
  }

  _updateOverlayPosition() {
    // from ArcOverlayMixin
    if (this.isAttached) {
      // from  ArcResizableMixin
      this.notifyResize();
    }
  }

  _openedChanged(opened) {
    if (opened && this.disabled) {
      // from ArcOverlayMixin
      this.cancel();
    } else {
      this.cancelAnimation();
      super._openedChanged(opened);
    }
  }

  _renderOpened() {
    if (!this.noAnimations) {
      this.contentWrapper.classList.add('animating');
      this.playAnimation('open');
    } else {
      super._renderOpened();
    }
  }

  _renderClosed() {
    if (!this.noAnimations) {
      this.contentWrapper.classList.add('animating');
      this.playAnimation('close');
    } else {
      super._renderClosed();
    }
  }

  /**
   * Called when animation finishes on the dropdown (when opening or
   * closing). Responsible for "completing" the process of opening or
   * closing the dropdown by positioning it or setting its display to
   * none.
   */
  _onAnimationFinish() {
    this._activeAnimations = undefined;
    this.contentWrapper.classList.remove('animating');
    if (this.opened) {
      this._finishRenderOpened();
    } else {
      this._finishRenderClosed();
    }
  }
  /**
   * Sets scrollAction according to the value of allowOutsideScroll.
   * Prefer setting directly scrollAction.
   * @param {Boolean} allowOutsideScroll
   */
  _allowOutsideScrollChanged(allowOutsideScroll) {
    // Wait until initial values are all set.
    if (!this._readied) {
      return;
    }
    if (!allowOutsideScroll) {
      this.scrollAction = 'lock';
    } else if (!this.scrollAction || this.scrollAction === 'lock') {
      this.scrollAction = 'refit';
    }
  }

  _applyFocus() {
    const focusTarget = this.focusTarget || this.containedElement;
    if (focusTarget && this.opened && !this.noAutoFocus) {
      focusTarget.focus();
    } else {
      super._applyFocus();
    }
  }

  playAnimation(name) {
    if (window.KeyframeEffect === undefined) {
      this._onAnimationFinish();
      return;
    }

    const node = this.containedElement;
    let origin;
    switch (this.verticalAlign) {
      case 'bottom': origin = '100%'; break;
      case 'middle': origin = '50%'; break;
      default: origin = '0%';
    }
    this._setPrefixedProperty(node, 'transformOrigin', `0% ${origin}`);
    let results;
    if (name === 'open') {
      results = this._configureStartAnimation(node, this.openAnimationConfig);
    } else {
      results = this._configureEndAnimation(node, this.closeAnimationConfig);
    }
    if (!results || !results.length) {
      this._onAnimationFinish();
      return;
    }
    this._activeAnimations = results;
  }

  cancelAnimation() {
    if (!this._activeAnimations) {
      return;
    }
    this._activeAnimations.forEach((anim) => {
      if (anim && anim.cancel) {
        anim.cancel();
      }
    });
    this._activeAnimations = [];
  }

  _runEffects(node, config) {
    const results = [];
    for (let i = 0; i < config.length; i++) {
      const options = config[i];
      try {
        this.__runAnimation(node, options, results);
      } catch (_) {
        continue;
      }
    }
    return results;
  }

  __runAnimation(node, options, results) {
    const result = node.animate(options.keyframes, options.timing);
    results[results.length] = result;
    result.onfinish = () => {
      result.onfinish = null;
      const index = results.findIndex((item) => item === result);
      results.splice(index, 1);
      if (!results.length) {
        this._onAnimationFinish();
      }
    };
  }

  _configureStartAnimation(node, config) {
    if (window.KeyframeEffect === undefined) {
      return null;
    }
    if (!config) {
      config = [{
        keyframes: [
          { transform: 'scale(1, 0)' },
          { transform: 'scale(1, 1)' }
        ],
        timing: {
          delay: 0,
          duration: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both'
        }
      }];
    }
    return this._runEffects(node, config);
  }

  _configureEndAnimation(node, config) {
    if (window.KeyframeEffect === undefined) {
      return null;
    }
    if (!config) {
      config = [{
        keyframes: [
          { transform: 'scale(1, 1)' },
          { transform: 'scale(1, 0)' }
        ],
        timing: {
          delay: 0,
          duration: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both'
        }
      }];
    }
    return this._runEffects(node, config);
  }

  _setPrefixedProperty(node, property, value) {
    const map = {
      transform: ['webkitTransform'],
      transformOrigin: ['mozTransformOrigin', 'webkitTransformOrigin']
    };
    const prefixes = map[property];
    for (let index = 0, len = prefixes.length; index < len; index++) {
      const prefix = prefixes[index];
      node.style[prefix] = value;
    }
    node.style[property] = value;
  }

  render() {
    return html`
    <div class="contentWrapper">
      <slot name="dropdown-content"></slot>
    </div>
    `;
  }
}
