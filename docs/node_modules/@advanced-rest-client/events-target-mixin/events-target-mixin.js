/**
@license
Copyright 2017 The Advanced REST client authors <arc@mulesoft.com>
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
/**
 * `ArcBehaviors.EventsTargetBehavior` is a behavior mixin that allows setting
 * up event listeners on a default or set node.
 *
 * By default the element listens on the `window` element for events. By setting
 * `eventsTarget` property on this element it removes all previously set
 * listeners and adds the same listeners to the node.
 * It also restores default state when the `eventsTarget` is removed.
 *
 * Implementations should implement two abstract methods:
 * `_attachListeners(node)` and `_detachListeners(node)`. Both of them will be
 * called with event target argument when it's required to either set or remove
 * listeners.
 *
 * ### Example (Polymer 2.x)
 *
 * ```javascript
 * class EventableElement extends EventsTargetMixin(HTMLElement) {
 *   _attachListeners: function(node) {
 *    mode.addEventListener('event', this._callback);
 *  }
 *
 *  _detachListeners: function(node) {
 *    mode.removeEventListener('event', this._callback);
 *  }
 * }
 * ```
 *
 * The mixin handles connectedCallback / disconnectedCallback and calls the
 * functions with required parameters.
 *
 * @mixinFunction
 * @param {Class} base
 * @return {Class}
 */
export const EventsTargetMixin = (base) => class extends base {
  static get properties() {
    return {
      /**
       * Events handlers target. By default the element listens on
       * `window` object. If set, all events listeners will be attached to this
       * object instead of `window`.
       */
      eventsTarget: { type: Object },
      // An event target used to attach listeners.
      _oldEventsTarget: Object
    };
  }

  get eventsTarget() {
    return this._eventsTarget;
  }

  set eventsTarget(value) {
    const old = this._eventsTarget;
    if (old === value) {
      return;
    }
    this._eventsTarget = value;
    this._eventsTargetChanged(value);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this._eventsTargetChanged(this.eventsTarget);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    if (this._oldEventsTarget) {
      this._detachListeners(this._oldEventsTarget);
    }
  }
  /**
   * Removes old handlers (if any) and attaches listeners on new event
   * event target.
   *
   * @param {?Node} eventsTarget Event target to set handlers on. If not set it
   * will set handlers on the `window` object.
   */
  _eventsTargetChanged(eventsTarget) {
    if (this._oldEventsTarget) {
      this._detachListeners(this._oldEventsTarget);
    }
    this._oldEventsTarget = eventsTarget || window;
    this._attachListeners(this._oldEventsTarget);
  }
  // To be implement by the element to set event listeners on the target
  _attachListeners() {}
  // To be implement by the element to remove event listeners from the target
  _detachListeners() {}
};
