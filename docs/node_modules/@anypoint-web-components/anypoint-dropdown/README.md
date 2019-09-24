[![Published on NPM](https://img.shields.io/npm/v/@anypoint-web-components/anypoint-dropdown.svg)](https://www.npmjs.com/package/@anypoint-web-components/anypoint-dropdown)

[![Build Status](https://travis-ci.org/anypoint-web-components/anypoint-dropdown.svg?branch=stage)](https://travis-ci.org/anypoint-web-components/anypoint-dropdown)

# anypoint-dropdown

An element that displays content inside a fixed-position container, positioned relative to another element.

Partially inspired by [anypoint-dropdown](https://github.com/PolymerElements/anypoint-dropdown)

## Accessibility

The element does not offer `aria-*` or `role` attributes. The elements that uses this element should set an appropriate role and aria to the context.

## Usage

### Installation

```
npm install --save @anypoint-web-components/anypoint-dropdown
```

### In an HTML file

```html
<html>
  <head>
    <script type="module">
      import '@anypoint-web-components/anypoint-dropdown/anypoint-dropdown.js';
    </script>
    <style>
      #container {
        display: inline-block;
      }

      anypoint-dropdown {
        border: 1px solid gray;
        background: white;
        font-size: 2em;
      }
    </style>
  </head>
  <body>
    <div id="container">
      <button onclick="dropdown.open();">open the anypoint-dropdown</button>
      <anypoint-dropdown id="dropdown" nooverlap>
        <div slot="dropdown-content">Hello!</div>
      </anypoint-dropdown>
    </div>
  </body>
</html>
```

### Development

```sh
git clone https://github.com/anypoint-web-components/anypoint-dropdown
cd anypoint-dropdown
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
