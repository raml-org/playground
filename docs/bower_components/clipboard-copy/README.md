[![Build Status](https://travis-ci.org/advanced-rest-client/clipboard-copy.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/clipboard-copy)

## LogicElements.ClipboardCopy component
Tag: `<clipboard-copy>`

### Installation
Using bower:
```
bower install --save advanced-rest-client/clipboard-copy
```

An element that copies a text to clipboard.

### Example

```html
<clipboard-copy content="test"></clipboard-copy>
<script>
const elm = document.querySelectior('clipboard-copy');
if(elm.copy()) {
 console.info('Content has been copied to the clipboard');
} else {
 console.error('Content copy error. This browser is ancient!');
}
< /script>
```

## API
### Component properties (attributes)

#### content
- Type: `string`
A content to be copied to the clipboard.
It must be set before calling the `copy` function.


### Component methods

#### copy
- Return type: `Boolean`
Execute content copy.

