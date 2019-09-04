[![Build Status](https://travis-ci.org/advanced-rest-client/prism-highlight.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/prism-highlight)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/prism-highlight)

# prism-highlight

Syntax highlighting with Prism JS library

<!---
```
<custom-element-demo>
  <template>
    <link rel="import" href="prism-highlight.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->

```html
<prism-highlight id="c2" lang="javascript"></prism-highlight>
<script>
document.querySelector('#c2').code = 'function(param) {\n' +
  '  param.forEach((item) => this._parseItem(item))\n' +
  '  const test = null;\n' +
  '}';
</script>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
