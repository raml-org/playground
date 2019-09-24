[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/events-target-mixin.svg)](https://www.npmjs.com/package/@advanced-rest-client/events-target-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/events-target-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/events-target-mixin)

A Mixin that support event targets retargeting so the element listens on a set node instead of default one (window).

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/events-target-mixin
```

### In a web component

```js
import { LitElement, html } from 'lit-element';
import { EventsTargetMixin } '@advanced-rest-client/events-target-mixin/events-target-mixin.js';

class SampleElement extends EventsTargetMixin(HTMLElement) {
  _attachListeners(node) {
    node.addEventListener('my-event', this._testEventHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('my-event', this._testEventHandler);
  }

  _testEventHandler() {

  }
}
customElements.define('sample-element', SampleElement);
```

```html
<sample-element id="example"></sample-element>
<div id="target"></div>
example.eventsTarget = target;
```

The element listens for events that bubbles through #target element.

### Development

```sh
git clone https://github.com/advanced-rest-client/events-target-mixin
cd events-target-mixin
npm install
```

### Running the tests
```sh
npm test
```
