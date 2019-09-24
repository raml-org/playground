[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/headers-list-view.svg)](https://www.npmjs.com/package/@advanced-rest-client/headers-list-view)

[![Build Status](https://travis-ci.org/advanced-rest-client/headers-list-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/headers-list-view)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/headers-list-view)

# headers-list-view

An element that displays a list of headers.


```html
<headers-list-view></headers-list-view>
<script>
let headers = 'Content-Type: application-json\n';
headers += 'Content-Length: 256\n';
headers += 'Content-Encoding: gzip\n';
headers += 'x-server: x-abc.zone-europe-a.domain.company.com';
document.querySelector('headers-list-view').headers = headers;
</script>
```

You can put `@advanced-rest-client/arc-definitions` element into dom to enable interactive list.
When the user double click on the list item it dispatches headers query event and `arc-definitions` responds to his query.
If the headers details are available it renders a dialog with header description.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/headers-list-view
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/headers-list-view/headers-list-view.js';
    </script>
  </head>
  <body>
    <headers-list-view headers="..."></headers-list-view>
  </body>
</html>
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/headers-list-view/headers-list-view.js';

class SampleElement extends PolymerElement {
  render() {
    return html`
    <headers-list-view .headers="${this.headers}"></headers-list-view>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/headers-list-view/headers-list-view.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <headers-list-view headers="[[headers]]"></headers-list-view>
    `;
  }

  _authChanged(e) {
    console.log(e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/headers-list-view
cd headers-list-view
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
