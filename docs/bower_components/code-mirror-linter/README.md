[![Build Status](https://travis-ci.org/advanced-rest-client/code-mirror-linter.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/code-mirror-linter)

Sets of linters for `advanced-rest-client/code-mirror`

## Example

```html
<link rel="import" href="../code-mirror.html">
<link rel="import" href="../code-mirror-linter/code-mirror-linter-json.html">
<code-mirror mode="application/json" line-numbers gutters='["CodeMirror-lint-markers"]' id="linter">
{
  "a": 'b',
  "value": true
}
</code-mirror>
<script>
const demo = document.getElementById('linter');
demo.lint = CodeMirror.lint.json;
</script>
```

### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
