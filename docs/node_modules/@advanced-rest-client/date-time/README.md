[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/date-time.svg)](https://www.npmjs.com/package/@advanced-rest-client/date-time)

[![Build Status](https://travis-ci.org/advanced-rest-client/date-time.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/date-time)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/date-time)

## &lt;date-time&gt;

An element to render data and/or time formatted for user locale.

```html
<date-time date="2010-12-10T11:50:45Z" year="numeric" month="narrow" day="numeric"></date-time>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/date-time
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/date-time/date-time.js';
    </script>
  </head>
  <body>
    <date-time date="2010-12-10T11:50:45Z" year="numeric" month="long" day="numeric" hour="2-digit" minute="2-digit" second="2-digit"></date-time>
  </body>
</html>
```

### In a Polymer 3 element

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/date-time/date-time.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <date-time date="2010-12-10T11:50:45Z" year="numeric" month="long" day="numeric" hour="2-digit" minute="2-digit" second="2-digit"></date-time>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/date-time
cd date-time
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
