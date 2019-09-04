# Markdown styles set for API components

## Usage

```html
<head>
  <link rel="import" href="../shadycss/apply-shim.html">
  <link rel="import" href="../polymer/lib/elements/custom-style.html">
  <link rel="import" href="../markdown-styles/markdown-styles.html">
  <custom-style>
    <style include="markdown-styles"></style>
  </custom-style>
</head>
<body>
  <marked-element markdown="...">
    <div slot="markdown-html"></div>
  </marked-element>
</body>
```

The styles are applied to the element with `[slot="markdown-html"]` attribute.
