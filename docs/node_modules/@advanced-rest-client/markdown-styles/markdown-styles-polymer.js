/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
/**
## Styles for markdown preview

It should be included where the `marked-element` is used.

## Usage example

```html
<style include="markdown-styles"></style>
<marked-element markdown="[[item.description]]">
  <div class="markdown-html"></div>
</marked-element>
```

Note use of the `markdown-html` CSS rules. It is required by markdown element also all css rules
defined here are scoped to a container with this class name.

Custom property | Description | Default
----------------|-------------|----------
`--code-background-color` | Background color of the code block | `#f5f2f0`
`--arc-code-styles` | Mixin to override styles for markdown pre and code elements

@customElement
@group UI Elements
@memberof UI Elements
@element markdown-styles
@polymer
*/
import markdownStyles from './markdown-styles.js';
const $documentContainer = document.createElement('template');
$documentContainer.innerHTML = `<dom-module id="markdown-styles">
  <template>
    <style>
    ${markdownStyles.toString()}
    </style>
  </template>
</dom-module>`;

document.head.appendChild($documentContainer.content);
