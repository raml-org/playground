/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
import { LitElement, html, css } from 'lit-element';

/*
`arc-overlay-backdrop` is a backdrop used by `ArcOverlayMixin`. It
should be a singleton.

Originally designed by the Polymer team, ported to LitElement by ARC team.

### Styling

The following custom properties and mixins are available for styling.

Custom property | Description | Default
-------------------------------------------|------------------------|---------
`--iron-overlay-backdrop-background-color` | Backdrop background color | #000
`--iron-overlay-backdrop-opacity`          | Backdrop opacity | 0.6
`--iron-overlay-backdrop`                  | Mixin applied to `iron-overlay-backdrop`.                      | {}
`--iron-overlay-backdrop-opened`           | Mixin applied to `iron-overlay-backdrop` when it is displayed | {}
*/
export class ArcOverlayBackdrop extends LitElement {
  static get styles() {
    return css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--arc-overlay-backdrop-background-color,
        var(--iron-overlay-backdrop-background-color, #000));
      opacity: 0;
      transition: var(--arc-overlay-backdrop-transition, opacity 0.2s);
      pointer-events: none;
    }

    :host(.opened) {
      opacity: var(--arc-overlay-backdrop-opacity, var(--iron-overlay-backdrop-opacity, 0.6));
      pointer-events: auto;
    }`;
  }

  static get properties() {
    return {
      opened: { type: Boolean, reflect: true }
    };
  }

  get opened() {
    return this.__opened;
  }

  set opened(value) {
    const old = this.__opened;
    if (old === value) {
      return;
    }
    this.__opened = value;
    this._openedChanged(value, old);
  }

  constructor() {
    super();
    this.opened = false;
    // Used to cancel previous requestAnimationFrame calls when opened changes.
    this.__openedRaf = null;

    this._onTransitionend = this._onTransitionend.bind(this);
  }

  connectedCallback() {
    this.isAttached = true;
    super.connectedCallback();
    this.addEventListener('transitionend', this._onTransitionend, true);
    if (this.opened) {
      this._openedChanged(this.opened);
    }
  }

  disconnectedCallback() {
    this.isAttached = false;
    super.disconnectedCallback();
    this.removeEventListener('transitionend', this._onTransitionend);
  }

  /**
   * Appends the backdrop to document body if needed.
   */
  prepare() {
    if (this.opened && !this.parentNode) {
      document.body.appendChild(this);
    }
  }

  /**
   * Shows the backdrop.
   */
  open() {
    this.opened = true;
  }

  /**
   * Hides the backdrop.
   */
  close() {
    this.opened = false;
  }

  /**
   * Removes the backdrop from document body if needed.
   */
  complete() {
    if (!this.opened && this.parentNode === document.body) {
      this.parentNode.removeChild(this);
    }
  }

  _onTransitionend(e) {
    if (e && e.target === this) {
      this.complete();
    }
  }

  /**
   * @param {boolean} opened
   * @private
   */
  _openedChanged(opened) {
    if (opened) {
      // Auto-attach.
      this.prepare();
    } else {
      // Animation might be disabled via the mixin or opacity custom property.
      // If it is disabled in other ways, it's up to the user to call complete.
      const cs = window.getComputedStyle(this);
      if (cs.transitionDuration === '0s' || cs.opacity === 0) {
        this.complete();
      }
    }

    if (!this.isAttached) {
      return;
    }

    // Always cancel previous requestAnimationFrame.
    if (this.__openedRaf) {
      window.cancelAnimationFrame(this.__openedRaf);
      this.__openedRaf = null;
    }
    // Force relayout to ensure proper transitions.
    this.scrollTop = this.scrollTop;
    this.__openedRaf = window.requestAnimationFrame(() => {
      this.__openedRaf = null;
      this.toggleClass('opened', this.opened);
    });
  }
  /**
   * Toggles clas on this element.
   * @param {String} klass CSS class name to toggle
   * @param {Boolean} cond Boolean condition to test whether the class should be
   * added or removwed.
   */
  toggleClass(klass, cond) {
    if (cond) {
      if (!this.classList.contains(klass)) {
        this.classList.add(klass);
      }
    } else {
      if (this.classList.contains(klass)) {
        this.classList.remove(klass);
      }
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}
