import { LitElement } from 'lit-element';
import { AnypointMultiSelectableMixin } from './anypoint-multi-selectable-mixin.js';

export class AnypointSelector extends AnypointMultiSelectableMixin(LitElement) {
  createRenderRoot() {
    return this;
  }
}
