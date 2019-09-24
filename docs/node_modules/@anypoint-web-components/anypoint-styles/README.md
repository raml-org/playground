# anypoint-styles

The `<anypoint-styles>` component provides simple ways to use Anypoint CSS styles
in an application. The following imports are available:

1. [colors.js](https://github.com/anypoint-web-components/anypoint-styles/blob/master/colors.js):
a complete list of the colors defined in the Anypoint [palette](http://ux.mulesoft.com/#/colors)

2. [typography.js](https://github.com/anypoint-web-components/anypoint-styles/blob/master/typography.js):
Anypoint [font](http://ux.mulesoft.com/#/typography) styles and sizes

3. [anypoint-theme.js](https://github.com/anypoint-web-components/anypoint-styles/blob/master/anypoint-theme.js):
Default theme for anypoint applications.

We recommend importing each of these individual files, and using the style variables
available in each ones, rather than the aggregated `anypoint-styles.js` as a whole.


## Usage

### Installation
```sh
npm install --save @anypoint-web-components/anypoint-styles
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@anypoint-web-components/anypoint-styles/default-theme.js';
    </script>
    <style>
    h1 {
      font-size: var(--font-header1-font-size);
      font-weight: var(--font-header1-font-weight);
      letter-spacing: var(--font-header1-letter-spacing);
      margin-bottom: var(--font-header1-margin-bottom);
    }
    </style>
  </head>
  <body>
    <h1>Content title</h1>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html, css } from 'lit-element';
import '@anypoint-web-components/anypoint-styles/default-theme.js';

class SampleElement extends LitElement {
  static get styles() {
    return css`
    h1 {
      font-size: var(--font-header1-font-size);
      font-weight: var(--font-header1-font-weight);
      letter-spacing: var(--font-header1-letter-spacing);
      margin-bottom: var(--font-header1-margin-bottom);
    }`;
  }

  render() {
    return html`<h1>Content title</h1>`;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-styles
cd anypoint-styles
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
