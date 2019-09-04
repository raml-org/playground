[![Build Status](https://travis-ci.org/advanced-rest-client/files-payload-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/files-payload-editor)  

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/files-payload-editor)

# files-payload-editor

`<files-payload-editor>` A request body editor to add files as a payload.
With this element the user can select single file that will be used in the request body.

As other payload editors it fires `payload-value-changed` custom event when value change.

The element can be used in forms when `iron-form` is used. It contains validation methods to
validate user input.

<!---
```
<custom-element-demo>
  <template>
    <link rel="import" href="files-payload-editor.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->
```html
<files-payload-editor></files-payload-editor>
```

### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
