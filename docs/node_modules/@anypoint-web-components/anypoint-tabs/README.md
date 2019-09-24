[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-tabs.svg?branch=master)](https://travis-ci.org/anypoint-web-components/anypoint-tabs)

[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-tabs.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-tabs)

This component is based on Material Design menu and adjusted for Anypoint platform components.

Anypoint web components are set of components that allows to build Anypoint enabled UI in open source projects.

Tabs organize content across different screens, data sets, and other interactions.

## Usage

### Installation
```
npm install --save @anypoint-web-components/anypoint-tabs
```

### In a HTML document

```html
<script type="module" src="node_modules/@anypoint-web-components/anypoint-tabs/anypoint-tabs.js"></script>
<script type="module" src="node_modules/@anypoint-web-components/anypoint-tabs/anypoint-tab.js"></script>

<anypoint-tabs selected="1">
  <anypoint-tab>Tab one</anypoint-tab>
  <anypoint-tab>Tab two</anypoint-tab>
  <anypoint-tab>Tab three</anypoint-tab>
</anypoint-tabs>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-tabs/anypoint-tabs.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tab.js';

class SimpleElement extends ControlStateMixin(ButtonStateMixin(LitElement)) {
  render() {
    return html`
    <anypoint-tabs .selected="${this.selectedTab}" @selected-changed="${this._tabHandler}">
      <anypoint-tab>Tab one</anypoint-tab>
      <anypoint-tab>Tab two</anypoint-tab>
      <anypoint-tab>Tab three</anypoint-tab>
    </anypoint-tabs>
    `;
  }

  _tabHandler(e) {
    this.selectedTab = e.detail.value;
  }
}
window.customElements.define('simple-element', SimpleElement);
```

### Styles

Anypoint tabs comes with 2 predefined styles:

-   Material - (default) - Material Design styled tabs
-   Compatibility To provide compatibility with Anypoint design

See [Tabs](https://material.io/components/tabs/) documentation in Material Design documentation for principles and anatomy of tabs.


### Scrollable tabs

When tabs takes more place than available then set `scrollable` property to enable scrolling.

```html
<div class="width: 320px;">
  <anypoint-tabs selected="0" scrollable>
    <anypoint-tab>Tab one</anypoint-tab>
    <anypoint-tab>Tab two</anypoint-tab>
    <anypoint-tab>Tab three</anypoint-tab>
    <anypoint-tab>Tab four</anypoint-tab>
  </anypoint-tabs>
</div>
```

### Fit container

When the `fitcontainer` property is set the tabs expands to full width of the container.

```html
<anypoint-tabs selected="0" fitcontainer>
  <anypoint-tab>Tab one</anypoint-tab>
  <anypoint-tab>Tab two</anypoint-tab>
  <anypoint-tab>Tab three</anypoint-tab>
  <anypoint-tab>Tab four</anypoint-tab>
</anypoint-tabs>
```

Otherwise they stay aligned to left/right (depending on dir value)

### Dynamic content

The tab resets when it's children changes.

Note that the tabs won't change the selection when children change. You need to handle this
situation depending on your application context.

```js
render() {
  return html`
  <anypoint-tabs>
    <anypoint-tab>Tab one</anypoint-tab>
    ${this.renderTwo ? html`<anypoint-tab>Tab two</anypoint-tab>` : ''}
    <anypoint-tab>Tab three</anypoint-tab>
  </anypoint-tabs>
  `;
}
```


## Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-tabs
cd anypoint-tabs
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests
```sh
npm test
```
