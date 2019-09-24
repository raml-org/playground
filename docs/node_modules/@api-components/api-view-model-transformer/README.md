[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-view-model-transformer.svg)](https://www.npmjs.com/package/@api-components/api-view-model-transformer)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-view-model-transformer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-view-model-transformer)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-view-model-transformer)

# api-view-model-transformer

An element to transform AMF's ld=json model into a form view model.

Note, this element does not include polyfills for `Promise` and `Array.from`.

The model should be used to build a form view for request parameters like header, query parameters, uri parameters or the body.

### Data model

-   binding {String} - one of `path`, `query`, `header`
-   name {String} - property (form) name
-   required {Boolean} - is property required
-   value {any} - Value of the property
-   description {String} - The description of the property
-   hasDescription {Boolean} - Flag describing if the property has a description.
-   properties {Array<Object>} - If the model is a type of object it is a list of this model objects.
-   schema {Object} - Property schma information
-   schema.type {String} - Data type of the property
-   schema.inputLabel {String} Label for the form control
-   schema.inputType {String} - type attribute of the `input` element.
-   schema.pattern {String} - Regex pattern of the property
-   schema.minLength {Number} - String property minimum length
-   schema.maxLength {Number} - String property maximum length
-   schema.defaultValue {any} - Default value of the property
-   schema.examples {Array<Object>} - List of examples for the form property.
-   schema.multipleOf {Number} - For numeric values, a `step` attribute of the `input` element. Each object may contain `name` (may be undefined) and must contain `value` property of the example.
-   schema.minimum {Number} - For numeric values, minimum value of the property
-   schema.maximum {Number} - For numeric values, maximum value of the property
-   schema.isEnum {Boolean} - Flag describing enumerable value
-   schema.enum {Array<any>} - Only if `schema.isEnum` is set. Values for enum input.
-   schema.isArray {Boolean} - Flag describing array value for the property
-   schema.items {Object} - Lsit of items definitions
-   schema.isBool {Boolean} - Flag describing boolean value for the property
-   schema.isFile {Boolean} - Flag describing File value for the property
-   schema.isObject {Boolean} - Flag describing Object value for the property
-   schema.isNillable {Boolean} - True when it is an union and one of union items is nil.
-   schema.inputPlaceholder {?String} - A placeholder value for the input.
-   schema.inputFloatLabel {Boolean} - Only if placeholder is set. Instructs input control to float a label.
-   schema.isUnion {Boolean} - Flag describing union value
-   schema.anyOf {Array<Object>} - List of possible types of the union.
-   schema.enabled {Boolean} - Always `true`
-   schema.fileTypes {Array<String>} List of file types defined for a file type.
-   schema.readOnly {Boolean} - Nil types gets `readOnly` property

The `examples` on `schema` object is a result of processing the shape by `api-examples-generator` element.

## Example

```html
<api-view-model-transformer></api-view-model-transformer>
<script>
const amfModel = getAmfFromRamlOrOas();
const processor = document.querySelector('api-view-model-transformer');
processor.amf = amfModel;
processor.shape = extractHeadersForMethod(amfModel);
processor.addEventListener('view-model-changed', (e) => {
 console.log(e.detail.value);
});
</script>
```

This example uses `getAmfFromRamlOrOas()` function where you implement the logic of getting AMF json/ld data. It can be stored in file or parsed using AMF parsers. The `extractHeadersForMethod()` represents a logic to extract properties that you want to transform. It can be headers, query parameters or body type.

## ld+json context

JSON schema may contain `@context` property. It can be used to reduce size of the schema by replacing namespace ids with defined in `@context` keyword. For the component to properly compute AMF values the full AMF model has to be set on `amf` property.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

### Installation

```sh
npm install --save @api-components/api-view-model-transformer
```

### Development

```sh
git clone https://github.com/advanced-rest-client/api-view-model-transformer
cd api-view-model-transformer
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
