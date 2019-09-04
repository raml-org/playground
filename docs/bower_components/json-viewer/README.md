[![Build Status](https://travis-ci.org/advanced-rest-client/json-viewer.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/json-viewer)

## JsonViewer component
Tag: `<json-viewer>`

### Installation
Using bower:
```
bower install --save advanced-rest-client/json-viewer
```

`<json-viewer>` A JSON payload viewer for the JSON response.

This element uses a web worker to process the JSON data.
To simplify our lives and app build process the worker script is embeded in the
imported template body. It will extract worker data from it and create the
worker. Otherwise build process would need to incude a worker script file
into set path which is not very programmer friendly.

### Example
```
<json-viewer json='{"json": "test"}'></json-viewer>
```

## Custom search
If the platform doesn't support native text search, this element implements
`ArcBehaviors.TextSearchBehavior` and exposes the `query` attribute.
Set any text to the `query` attribute and it will automatically highlight
occurance of the text.
See demo for example.

## Big numbers in JavaScript
This element marks all numbers that are above `Number.MAX_SAFE_INTEGER` value
and locates the numeric value in source json if passed json was a string or
when `raw` attribute was set. In this case it will display a warning and
explanation about use of big numbers in JavaScript.
See js-max-number-error element documentation for more information.

## Content actions
The element can render a actions pane above the code view. Action pane is to
display content actions that is relevan in context of the response displayed
below the icon buttons. It should be icon buttons or just buttons added to this
view.

Buttons need to have `content-action` property set to be included to this view.

```
<json-viewer json='{"json": "test"}'>
  <paper-icon-button content-action title="Copy content to clipboard" icon="arc:content-copy"></paper-icon-button>
</json-viewer>
```

### Styling
`<json-viewer>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--json-viewer` | Mixin applied to the element | `{}`
`--code-type-null-value-color` | Color of the null value. | `#708`
`--code-type-boolean-value-color` | Color of the boolean value | `#708`
`--code-punctuation-value-color` | Punctuation color. | `black`
`--code-type-number-value-color` | Color of the numeric value | `blue`
`--code-type-text-value-color` | Color of the string value. | `#48A`
`--code-array-index-color` | Color of the array counter. | `rgb(119, 119, 119)`
`--code-type-link-color` | Color of link inserted into the viewer. | `#1976d2`
`--json-viewer-node` | Mixin applied to a "node" | `{}`

## API
### Component properties (attributes)

#### json
- Type: `string`
JSON data to parse and display.
It can be either JS object (already parsed string) or string value.
If the passed object is a string then JSON.parse function will be
used to parse string.

#### raw
- Type: `string`
If it's possible, set this property to the JSON string.
It will help to handle big numbers that are not parsed correctly by
the JSON.parse function. The parser will try to locate the number
in the source string and display it in the correct form.

P.S.
Calling JSON.stringify on a JS won't help here :) Must be source
string.

#### isError
- Type: `boolean`
- Default: `false`
- Read only property
True if error ocurred when parsing the `json` data.
An error message will be displayed.

#### working
- Type: `boolean`
- Default: `false`
- Read only property
True when JSON is beeing parsed.

#### showOutput
- Type: `boolean`
- Default: `false`
- Read only property
True when output should be shown (JSON has been parsed without errors)

#### debug
- Type: `boolean`
If true then it prints the execution time to the console.


### Component methods


