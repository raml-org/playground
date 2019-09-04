[![Build Status](https://travis-ci.org/advanced-rest-client/form-data-editor.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/form-data-editor)  


[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/form-data-editor)

## &lt;form-data-editor&gt;

An element to edit form data (x-www-form-urlencoded).

The element renders a form of body properties. Each row contains name and value input
fields to describe parameters in the body.

It may work with [AMF](https://github.com/mulesoft/amf) json/ld model via `api-request-editor` that includes this element internally or by using `advanced-rest-client/api-view-model-transformer` to transform AMF model to form view model.
AMF is then used to build the view depending on API specification and selected endpoint.

AMF allows to read any API spec document (RAML, OAS by default) and produce common data model.

<!---
```
<custom-element-demo>
  <template>
    <link rel="import" href="form-data-editor.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->
```html
<form-data-editor value="grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb" allow-custom allow-disable-params></form-data-editor>
```


### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
