[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/oauth2-scope-selector.svg)](https://www.npmjs.com/package/@advanced-rest-client/oauth2-scope-selector)

[![Build Status](https://travis-ci.org/advanced-rest-client/oauth2-scope-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/oauth2-scope-selector)

## &lt;oauth2-scope-selector&gt;

Form element that provides the UI to enter a scope for OAuth 2.0 settings.

```html
<oauth2-scope-selector name="scope" allowedscopes='["email", "profile"]'></oauth2-scope-selector>
```

## Usage

### Installation
```
npm install --save @advanced-rest-client/oauth2-scope-selector
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/oauth2-scope-selector/oauth2-scope-selector.js';
    </script>
  </head>
  <body>
    <oauth2-scope-selector></oauth2-scope-selector>
  </body>
</html>
```

### Deveopment

```sh
git clone https://github.com/advanced-rest-client/oauth2-scope-selector
cd oauth2-scope-selector
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
