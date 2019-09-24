import * as marked from 'marked/lib/marked.js';

if (!window.marked) {
  // For webpack support for the Polymer 3 version created by the Polymer
  // Modulizer More info:
  // https://github.com/PolymerElements/marked-element/issues/81
  window.marked = marked;
}
