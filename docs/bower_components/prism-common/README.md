[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/prism-common)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/prism-common)

# prism-common

Common import files for Prism library for ARC.
Common library is to avoid duplicate imports in a build bundle of ARC or API console so it always references single Prism library.

To reference the main Prism library install `PolymerElements/prism-element#^2.1.0`
and import `<link rel="import" href="../prism-element/prism-import.html">`.

```html
<link rel="import" href="../prism-element/prism-import.html">
<link rel="import" href="../prism-common/prism-http-import.html">
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
