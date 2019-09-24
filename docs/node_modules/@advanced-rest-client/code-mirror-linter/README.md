[![Build Status](https://travis-ci.org/advanced-rest-client/code-mirror-linter.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/code-mirror-linter)

Sets of linters for `advanced-rest-client/code-mirror`

## Usage

### Installation
```
npm install --save @advanced-rest-client/code-mirror-linter
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/code-mirror/code-mirror.js';
import '@advanced-rest-client/code-mirror-linter/code-mirror-linter-json';
import linterStyles from '@advanced-rest-client/code-mirror-linter/lint-style.js';

class SampleElement extends PolymerElement {
  static get styles() {
    return [
      linterStyles,
      css`:host { ... }`
    ];
  }

  render() {
    const gutters = ['CodeMirror-lint-markers'];
    return html`
    <code-mirror
      mode="application/json"
      linenumbers
      .gutters="${gutters}"
      .lint="${CodeMirror.lint.json}">
      {
        "a": 'b',
        "value": true
      }
      </code-mirror>
    `;
  }

  _valueHandler(e) {
    this.value = e.detail.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/code-mirror-linter
cd code-mirror-linter
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

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
