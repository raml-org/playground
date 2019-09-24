[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-item.svg?branch=master)](https://travis-ci.org/anypoint-web-components/anypoint-item)

[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-item.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-item)

# anypoint-item, anypoint-item-body, anypoint-icon-item

This component is based on Material Design text field and adjusted for Anypoint platform components.

Anypoint web components are set of components that allows to build Anypoint enabled UI in open source projects.

A list item to be used in menus and list views.

```html
<anypoint-item>Item</anypoint-item>
```

## Styling options

The element has two built-in themes:

-   Material Design - Default style
-   Anypoint Design - Enabled by adding `legacy` attribute to the elements.

OSS application should not use Anypoint based styling as it's protected by MuleSoft copyrights. This property is reserved for OSS applications embedded in the Anypoint platform.

## Usage

### Installation

```
npm install --save @anypoint-web-components/anypoint-item
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@anypoint-web-components/anypoint-item/anypoint-item.js';
    </script>
  </head>
  <body>
    <div role="listbox" slot="content">
      <anypoint-item>
        Option 1
      </anypoint-item>
      <anypoint-item>
        Option 2
      </anypoint-item>
      <anypoint-item>
        Option 3
      </anypoint-item>
      <anypoint-item>
        <p>Paragraph as a child</p>
      </anypoint-item>
    </div>
  </body>
</html>
```

Use this element with `<anypoint-item-body>` to make styled `twoline` and `threeline` items.

```html
<html>
  <head>
    <script type="module">
      import '@anypoint-web-components/anypoint-item/anypoint-item.js';
      import '@anypoint-web-components/anypoint-item/anypoint-item-body.js';
    </script>
  </head>
  <body>
    <div role="listbox" slot="content">
      <anypoint-item-body twoline>
        <div>Show your status</div>
        <div secondary>Your status is visible to everyone</div>
      </anypoint-item-body>
      <iron-icon icon="warning"></iron-icon>
    </div>
  </body>
</html>
```

To use `anypoint-item` as a link, wrap it in an anchor tag. Since `anypoint-item` will already receive focus, you may want to prevent the anchor tag from receiving focus as well by setting its tabindex to -1.

```html
<a href="https://domain.com/project" tabindex="-1">
  <anypoint-item raised>API Project</anypoint-item>
</a>
```

If you are concerned about performance and want to use `anypoint-item` in a `anypoint-listbox` with many items, you can just use a native `button` with the `anypoint-item` class applied (provided you have correctly included the shared styles):


```javascript
import { LitElement, html, css } from 'lit-element';
import itemStyles from '@anypoint-web-components/anypoint-item/anypoint-item-shared-styles.js';

class SampleElement extends LitElement {
  static get styles() {
    return [
      itemStyles,
      css`...`;
    ];
  }

  render() {
    return html`
    <anypoint-listbox>
      <button class="anypoint-item" role="option">Inbox</button>
      <button class="anypoint-item" role="option">Starred</button>
      <button class="anypoint-item" role="option">Sent mail</button>
    </anypoint-listbox>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Styling

See [anypoint-item-shared-styles.js](anypoint-item-shared-styles.js) for list of CSS variables.

### Accessibility

This element has `role="listitem"` by default. Depending on usage, it may be more appropriate to set `role="menuitem"`, `role="menuitemcheckbox"` or `role="menuitemradio"`.

```html
<anypoint-item role="menuitemcheckbox">
  <anypoint-item-body>
    Show your status
  </anypoint-item-body>
  <paper-checkbox></paper-checkbox>
</anypoint-item>
```

## Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-item
cd anypoint-item
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
