[![Build Status](https://travis-ci.org/advanced-rest-client/raml-aware.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/raml-aware)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/raml-aware)

# raml-aware

`<raml-aware>` Element that is aware of the AMF (RAML, OAS) content.

<!---
```
<custom-element-demo>
  <template>
    <link rel="import" href="raml-aware.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->

```html
<h3>Basic authorization</h3>
<raml-aware raml='{"scope": "request"}' scope="request"></raml-aware>
<raml-aware raml='{"scope": "import"}' scope="import"></raml-aware>

<raml-aware id="a1" scope="request"></raml-aware>
<raml-aware id="a2" scope="import"></raml-aware>
<output id="o1"></output>
<script>
o1.innerText = JSON.stringify(a1.raml) + '<br/>';
o1.innerText += JSON.stringify(a2.raml);
</script>
```

### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
