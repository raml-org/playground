import { html, css, LitElement } from 'lit-element';
import sanitizer from 'dompurify/dist/purify.es.js';
import './marked-import.js';

const SafeHtmlUtils = {
  AMP_RE: new RegExp(/&/g),
  GT_RE: new RegExp(/>/g),
  LT_RE: new RegExp(/</g),
  SQUOT_RE: new RegExp(/'/g),
  QUOT_RE: new RegExp(/"/g),
  htmlEscape: function(s) {
    if (typeof s !== 'string') {
      return s;
    }
    if (s.indexOf('&') !== -1) {
      s = s.replace(SafeHtmlUtils.AMP_RE, '&amp;');
    }
    if (s.indexOf('<') !== -1) {
      s = s.replace(SafeHtmlUtils.LT_RE, '&lt;');
    }
    if (s.indexOf('>') !== -1) {
      s = s.replace(SafeHtmlUtils.GT_RE, '&gt;');
    }
    if (s.indexOf('"') !== -1) {
      s = s.replace(SafeHtmlUtils.QUOT_RE, '&quot;');
    }
    if (s.indexOf("'") !== -1) {
      s = s.replace(SafeHtmlUtils.SQUOT_RE, '&#39;');
    }
    return s;
  }
};
/**
Element wrapper for the [marked](https://github.com/chjj/marked) library.

Based on Polymer's `marked-element`.

`<marked-element>` accepts Markdown source and renders it to a child
element with the class `markdown-html`. This child element can be styled
as you would a normal DOM element. If you do not provide a child element
with the `markdown-html` class, the Markdown source will still be rendered,
but to a shadow DOM child that cannot be styled.

### Markdown Content

The Markdown source can be specified several ways:

#### Use the `markdown` attribute to bind markdown

```html
<marked-element markdown="`Markdown` is _awesome_!">
  <div slot="markdown-html"></div>
</marked-element>
```
#### Use `<script type="text/markdown">` element child to inline markdown

```html
<marked-element>
  <div slot="markdown-html"></div>
  <script type="text/markdown">
    Check out my markdown!
    We can even embed elements without fear of the HTML parser mucking up their
    textual representation:
  </script>
</marked-element>
```
#### Use `<script type="text/markdown" src="URL">` element child to specify remote markdown

```html
<marked-element>
  <div slot="markdown-html"></div>
  <script type="text/markdown" src="../guidelines.md"></script>
</marked-element>
```

Note that the `<script type="text/markdown">` approach is *static*. Changes to
the script content will *not* update the rendered markdown!

Though, you can data bind to the `src` attribute to change the markdown.

```html
<marked-element>
  <div slot="markdown-html"></div>
  <script type="text/markdown" src$="[[source]]"></script>
</marked-element>
<script>
  ...
  this.source = '../guidelines.md';
</script>
```

### Styling

If you are using a child with the `markdown-html` class, you can style it
as you would a regular DOM element:

```css
[slot="markdown-html"] p {
  color: red;
}
[slot="markdown-html"] td:first-child {
  padding-left: 24px;
}
```

@demo demo/index.html
 */
export default class ArcMarked extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        padding: 24px;
      }
    `;
  }

  static get properties() {
    return {
      /**
       * The markdown source that should be rendered by this element.
       */
      markdown: { type: String },
      /**
       * Enable GFM line breaks (regular newlines instead of two spaces for
       * breaks)
       */
      breaks: { type: Boolean },
      /**
       * Conform to obscure parts of markdown.pl as much as possible. Don't fix
       * any of the original markdown bugs or poor behavior.
       */
      pedantic: { type: Boolean },
      /**
       * Function used to customize a renderer based on the [API specified in the
       * Marked
       * library](https://github.com/chjj/marked#overriding-renderer-methods).
       * It takes one argument: a marked renderer object, which is mutated by the
       * function.
       */
      renderer: { type: Function },
      /**
       * Sanitize the output. Ignore any HTML that has been input.
       */
      sanitize: { type: Boolean },
      /**
       * Function used to customize a sanitize behavior.
       * It takes one argument: element String without text Contents.
       *
       * e.g. `<div>` `<a href="/">` `</p>'.
       * Note: To enable this function, must set `sanitize` to true.
       * WARNING: If you are using this option to untrusted text, you must to
       * prevent XSS Attacks.
       */
      sanitizer: { type: Function },
      /**
       * If true, disables the default sanitization of any markdown received by
       * a request and allows fetched unsanitized markdown
       *
       * e.g. fetching markdown via `src` that has HTML.
       * Note: this value overrides `sanitize` if a request is made.
       */
      disableRemoteSanitization: { type: Boolean },
      /**
       * Use "smart" typographic punctuation for things like quotes and dashes.
       */
      smartypants: { type: Boolean }
    };
  }

  get markdown() {
    return this._markdown;
  }

  set markdown(value) {
    if (this._setObservableProperty('markdown', value)) {
      this.renderMarkdown();
    }
  }

  get breaks() {
    return this._breaks;
  }

  set breaks(value) {
    if (this._setObservableProperty('breaks', value)) {
      this.renderMarkdown();
    }
  }

  get pedantic() {
    return this._pedantic;
  }

  set pedantic(value) {
    if (this._setObservableProperty('pedantic', value)) {
      this.renderMarkdown();
    }
  }

  get renderer() {
    return this._renderer;
  }

  set renderer(value) {
    if (this._setObservableProperty('renderer', value)) {
      this.renderMarkdown();
    }
  }

  get sanitize() {
    return this._sanitize;
  }

  set sanitize(value) {
    if (this._setObservableProperty('sanitize', value)) {
      this.renderMarkdown();
    }
  }

  get sanitizer() {
    return this._sanitizer;
  }

  set sanitizer(value) {
    if (this._setObservableProperty('sanitizer', value)) {
      this.renderMarkdown();
    }
  }

  get smartypants() {
    return this._smartypants;
  }

  set smartypants(value) {
    if (this._setObservableProperty('smartypants', value)) {
      this.renderMarkdown();
    }
  }

  _setObservableProperty(prop, value) {
    const key = `_${prop}`;
    const old = this[key];
    if (old === value) {
      return false;
    }
    this[key] = value;
    this.requestUpdate(prop, old);
    return true;
  }

  constructor() {
    super();
    this.breaks = false;
    this.pedantic = false;
    this.sanitize = false;
    this.disableRemoteSanitization = false;
    this.smartypants = false;
  }

  firstUpdated() {
    this._outputElement = this.outputElement;
    if (this.markdown) {
      this.renderMarkdown();
      return;
    }

    // Use the Markdown from the first `<script>` descendant whose MIME type
    // starts with "text/markdown". Script elements beyond the first are
    // ignored.
    this._markdownElement = this.querySelector('[type="text/markdown"]');
    if (!this._markdownElement) {
      return;
    }

    if (this._markdownElement.src) {
      this._request(this._markdownElement.src);
    }

    if (this._markdownElement.textContent.trim() !== '') {
      this.markdown = this._unindent(this._markdownElement.textContent);
    }

    const observer = new MutationObserver(this._onScriptAttributeChanged.bind(this));
    observer.observe(this._markdownElement, { attributes: true });
  }

  connectedCallback() {
    super.connectedCallback();
    this._attached = true;
    this._outputElement = this.outputElement;
    this.renderMarkdown();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._attached = false;
  }

  /**
   * Unindents the markdown source that will be rendered.
   *
   * @param {string} text
   * @return {string}
   */
  unindent(text) {
    return this._unindent(text);
  }

  get outputElement() {
    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) {
      return null;
    }
    const child = slot
      .assignedNodes()
      .find((node) => node.nodeType === 1 && node.getAttribute('slot') === 'markdown-html');
    return child || this.shadowRoot.querySelector('#content');
  }

  /**
   * Renders `markdown` into this element's DOM.
   *
   * This is automatically called whenever the `markdown` property is changed.
   *
   * The only case where you should be calling this is if you are providing
   * markdown via `<script type="text/markdown">` after this element has been
   * constructed (or updating that markdown).
   */
  renderMarkdown() {
    if (!this._attached) {
      return;
    }
    if (!this._outputElement) {
      return;
    }

    if (!this.markdown) {
      this._outputElement.innerHTML = '';
      return;
    }
    /* global marked */
    const renderer = new marked.Renderer();

    if (this.renderer) {
      this.renderer(renderer);
    }
    let data;
    if (this.sanitize) {
      data = SafeHtmlUtils.htmlEscape(this.markdown);
    } else {
      data = this.markdown;
    }
    const opts = {
      renderer: renderer,
      highlight: this._highlight.bind(this),
      breaks: this.breaks,
      pedantic: this.pedantic,
      smartypants: this.smartypants
    };
    let out = marked(data, opts);
    if (this.sanitize) {
      if (this.sanitizer) {
        out = this.sanitizer(out);
      } else {
        const result = sanitizer.sanitize(out);
        if (typeof result === 'string') {
          out = result;
        } else {
          out = result.toString();
        }
      }
    }
    this._outputElement.innerHTML = out;
    this.dispatchEvent(
      new CustomEvent('marked-render-complete', {
        composed: true
      })
    );
  }

  /**
   * Fired when the content is being processed and before it is rendered.
   * Provides an opportunity to highlight code blocks based on the programming
   * language used. This is also known as syntax highlighting. One example would
   * be to use a prebuilt syntax highlighting library, e.g with
   * [highlightjs](https://highlightjs.org/).
   *
   * @param {string} code
   * @param {string} lang
   * @return {string}
   * @event syntax-highlight
   */
  _highlight(code, lang) {
    const e = new CustomEvent('syntax-highlight', {
      composed: true,
      bubbles: true,
      detail: {
        code,
        lang
      }
    });
    this.dispatchEvent(e);
    return e.detail.code || code;
  }

  /**
   * @param {string} text
   * @return {string}
   */
  _unindent(text) {
    if (!text) {
      return text;
    }
    const lines = text.replace(/\t/g, '  ').split('\n');
    const indent = lines.reduce(function(prev, line) {
      if (/^\s*$/.test(line)) {
        return prev; // Completely ignore blank lines.
      }
      const lineIndent = line.match(/^(\s*)/)[0].length;
      if (prev === null) {
        return lineIndent;
      }
      return lineIndent < prev ? lineIndent : prev;
    }, null);

    return lines.map((l) => l.substr(indent)).join('\n');
  }

  /**
   * Fired when the XHR finishes loading
   *
   * @param {string} url
   * @event marked-loadend
   */
  _request(url) {
    this._xhr = new XMLHttpRequest();
    const xhr = this._xhr;

    if (xhr.readyState > 0) {
      return;
    }

    xhr.addEventListener('error', this._handleError.bind(this));
    xhr.addEventListener(
      'loadend',
      function(e) {
        const status = this._xhr.status || 0;
        // Note: if we are using the file:// protocol, the status code will be 0
        // for all outcomes (successful or otherwise).
        if (status === 0 || (status >= 200 && status < 300)) {
          this.sanitize = !this.disableRemoteSanitization;
          this.markdown = e.target.response;
        } else {
          this._handleError(e);
        }

        this.dispatchEvent(
          new CustomEvent('marked-loadend', {
            composed: true,
            bubbles: true,
            detail: e
          })
        );
      }.bind(this)
    );

    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', 'text/markdown');
    xhr.send();
  }

  /**
   * Fired when an error is received while fetching remote markdown content.
   *
   * @param {!Event} e
   * @event marked-request-error
   */
  _handleError(e) {
    const evt = new CustomEvent('marked-request-error', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: e
    });
    this.dispatchEvent(evt);
    if (!evt.defaultPrevented) {
      this.markdown = 'Failed loading markdown source';
    }
  }

  /**
   * @param {!Array<!MutationRecord>} mutation
   */
  _onScriptAttributeChanged(mutation) {
    if (mutation[0].attributeName !== 'src') {
      return;
    }

    this._request(this._markdownElement.src);
  }

  render() {
    return html`
      <slot name="markdown-html">
        <div id="content"></div>
      </slot>
    `;
  }
}
