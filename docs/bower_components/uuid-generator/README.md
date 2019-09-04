[![Build Status](https://travis-ci.org/advanced-rest-client/authorization-panel.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/uuid-generator)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/uuid-generator)

## &lt;uuid-generator&gt;

An UUID generator as a  web component.

<!---
```
<custom-element-demo>
  <template>
    <link rel="import" href="uuid-generator.html">
    <link rel="import" href="../polymer/lib/elements/dom-if.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->

```html
<dom-bind>
  <template is="dom-bind">
    <uuid-generator last-uuid="{{generatedUuid}}"></uuid-generator>
    <p>Latest generated UUID: [[generatedUuid]]</p>
    <script>
    document.querySelector('uuid-generator').generate();
    </script>
  </template>
</dom-bind>
```

### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
