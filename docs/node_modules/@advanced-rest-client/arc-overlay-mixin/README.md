[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-overlay-mixin.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-overlay-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-overlay-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-overlay-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-overlay-mixin)

This mixin is a port of [iron-overlay-behavior](https://github.com/PolymerElements/iron-overlay-behavior)
that works with LitElement.

Use `ArcOverlayMixin` to implement an element that can be hidden
or shown, and displays on top of other content. It includes an optional
backdrop, and can be used to implement a variety of UI controls including
dialogs and drop downs. Multiple overlays may be displayed at once.

See the [demo source code](https://github.com/advanced-rest-client/arc-overlay-mixin/blob/master/demo/simple-overlay.html)
for an example.

### Closing and canceling

An overlay may be hidden by closing or canceling. The difference between close
and cancel is user intent. Closing generally implies that the user
acknowledged the content on the overlay. By default, it will cancel whenever
the user taps outside it or presses the escape key. This behavior is
configurable with the `nocancelonesckey` and the
`nocancelonoutsideclick` properties. `close()` should be called explicitly
by the implementer when the user interacts with a control in the overlay
element. When the dialog is canceled, the overlay fires an
'iron-overlay-canceled' event. Call `preventDefault` on this event to prevent
the overlay from closing.

### Positioning

By default the element is sized and positioned to fit and centered inside the
window. You can position and size it manually using CSS. See `ArcFitMixin`.

### Backdrop

Set the `withbackdrop` attribute to display a backdrop behind the overlay.
The backdrop is appended to `<body>` and is of type `<iron-overlay-backdrop>`.
See its doc page for styling options.
In addition, `with-backdrop` will wrap the focus within the content in the
light DOM. Override the `_focusableNodes` getter to achieve a different behavior.

### Limitations

The element is styled to appear on top of other content by setting its
`z-index` property. You must ensure no element has a stacking context with a
higher `z-index` than its parent stacking context. You should place this
element as a child of `<body>` whenever possible.

## Installation

```bash
npm i @advanced-rest-client/arc-overlay-mixin
```

## Usage

```javascript
import { LitElement } from 'lit-element';
import { ArcOverlayMixin } from '@advanced-rest-client/arc-overlay-mixin/arc-overlay-mixin.js';

class ArcOverlayImpl extends ArcOverlayMixin(LitElement) {
  static get properties() {
    return {
      myProp: { type: String }
    };
  }
}
```

## Testing

```bash
npm run test
```

## Testing with Sauce Labs

```bash
npm run test:sl
```

## Demo

```bash
npm start
```
