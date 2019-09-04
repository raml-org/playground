[![Build Status](https://travis-ci.org/advanced-rest-client/headers-list-view.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/headers-list-view)  
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/headers-list-view)

# headers-list-view

An element that displays a list of headers.

<!---
```
<custom-element-demo>
  <template>
    <link rel="import" href="headers-list-view.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->

```html
<headers-list-view></headers-list-view>
<script>
let headers = 'Content-Type: application-json\n';
headers += 'Content-Length: 256\n';
headers += 'Content-Encoding: gzip\n';
headers += 'x-server: x-abc.zone-europe-a.domain.company.com';
document.querySelector('headers-list-view').headers = headers;
</script>
```

### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
