/**
@license
Copyright 2018 Pawel Psztyc, The ARC team

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.

Adapted from https://github.com/PETComputacaoUFPR/code-mirror and
https://github.com/PolymerLabs/code-mirror
The MIT License (MIT)

Copyright (c) 2015 PET Computação UFPR

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Copyright (c) 2012 The Polymer Authors. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

  * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
  * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
import { LitElement, html, css } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import cmStyles from './codemirror-styles.js';
function noop() {}
/* global CodeMirror */
/**
 * Code mirror web component
 *
 * @customElement
 * @demo demo/index.html
 * @memberof UiElements
 * @appliesMixin ValidatableMixin
 */
class CodeMirrorElement extends ValidatableMixin(LitElement) {
  static get styles() {
    return [
      cmStyles,
      css`:host {
        display: block;
        position: relative;
        height: var(--code-mirror-height, 300px);
      }

      .wrapper {
        height: inherit;
      }

      .content {
        display: none;
      }

      .invalid-message {
        display: none;
      }

      :host([invalid]) .invalid-message {
        display: block;
        color: var(--code-mirror-invalid-label-color, #F44336)
      }

      :host([invalid]) .wrapper {
        border: 1px var(--code-mirror-invalid-border-color, #F44336) solid;
      }
      `
    ];
  }

  render() {
    return html`
    <div class="wrapper"></div>
    <div class="invalid-message">
      <slot name="invalid"></slot>
    </div>
    <div class="content" role="alert">
      <slot></slot>
    </div>
    <div class="hints">
      <slot name="hints"></slot>
    </div>`;
  }

  static get properties() {
    return {
      /**
       * Editor's value.
       * If set at initialization time any content inside this element will be replaced by this
       * value.
       *
       * @type {String}
       */
      value: { type: String },
      /**
       * True when a value is required.
       */
      required: { type: Boolean },
      /**
       * The mode to use. When not given, this will default to the first mode that was loaded.
       * It may be a string, which either simply names the mode or is a MIME type associated with
       * the mode.
       * Alternatively, it may be an object containing configuration options for the mode, with
       * a name property that names the mode. For example
       * <code>{name: "javascript", json: true}</code>
       *
       * @type {String}
       */
      mode: { type: String },
      /**
       * Explicitly set the line separator for the editor. By default (value null), the document
       * will be split on CRLFs as well as lone CRs and LFs, and a single LF will be used as line
       * separator in all output.
       *
       * @type {String}
       */
      lineSeparator: { type: String },
      /**
       * Renders line number when set.
       * @type {Object}
       */
      lineNumbers: { type: Boolean },
      /**
       * The width of a tab character.
       * Defaults to 2.
       *
       * @type {Number}
       */
      tabSize: { type: Number },
      /**
       * Whether to use the context-sensitive indentation that the mode provides (or just indent
       * the same as the line before).
       *
       * @type {Boolean}
       */
      smartIndent: { type: Boolean },
      /**
       * Configures the key map to use. The default is "default", which is the only key map
       * defined in codemirror.js itself.
       *
       * @type {String}
       */
      keyMap: { type: String },
      /**
       * Whether CodeMirror should scroll or wrap for long lines. Defaults to false (scroll).
       *
       * @type {Boolean}
       */
      lineWrapping: { type: Boolean },
      /**
       * This disables editing of the editor content by the user. If the special value "nocursor"
       * is given (instead of simply true), focusing of the editor is also disallowed.
       *
       * @type {Boolean}
       */
      readonly: { type: Boolean },
      /**
       * Whether the cursor should be drawn when a selection is active.
       *
       * @type {Boolean}
       */
      showCursorWhenSelecting: { type: Boolean },
      /**
       * When enabled, which is the default, doing copy or cut when there is no selection will
       * copy or cut the whole lines that have cursors on them.
       *
       * @type {Boolean}
       */
      lineWiseCopyCut: { type: Boolean },
      /**
       * The maximum number of undo levels that the editor stores. Note that this includes
       * selection change events. Defaults to 200.
       *
       * @type {Boolean}
       */
      undoDepth: { type: Number },
      /**
       * The period of inactivity (in milliseconds) that will cause a new history event to be
       * started when typing or deleting. Defaults to 1250.
       *
       * @type {Number}
       */
      historyEventDelay: { type: Number },
      /**
       * Can be used to make CodeMirror focus itself on initialization. Defaults to off.
       *
       * @type {Boolean}
       */
      autofocus: { type: Boolean },
      /**
       * An option for CodeMirror's gutters.
       * For example `['CodeMirror-lint-markers']`
       */
      gutters: { type: Array },
      /**
       * Lint option. It should be a linter object used to lint the
       * value.
       *
       * This option works when `../codemirror/addon/lint.lint.js` is
       * imcluded into the document.
       */
      lint: { type: Object },
      /**
       * A reference to the CodeMirror instance.
       *
       * @type {Object}
       */
      _editor: { type: Object }
    };
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    if (old === value) {
      return;
    }
    this._value = value;
    this._valueChanged(value);
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: {
        value
      }
    }));
  }

  get mode() {
    return this._mode;
  }

  set mode(value) {
    const old = this._mode;
    if (old === value) {
      return;
    }
    this._mode = value;
    this._modeChanged(value);
  }

  get lineSeparator() {
    return this._lineSeparator;
  }

  set lineSeparator(value) {
    this.__setProperty('lineSeparator', value);
  }

  get lineNumbers() {
    return this._lineNumbers;
  }

  set lineNumbers(value) {
    this.__setProperty('lineNumbers', value);
  }

  get tabSize() {
    return this._tabSize;
  }

  set tabSize(value) {
    this.__setProperty('tabSize', value);
  }

  get smartIndent() {
    return this._smartIndent;
  }

  set smartIndent(value) {
    this.__setProperty('smartIndent', value);
  }

  get keyMap() {
    return this._keyMap;
  }

  set keyMap(value) {
    this.__setProperty('keyMap', value);
  }

  get lineWrapping() {
    return this._lineWrapping;
  }

  set lineWrapping(value) {
    this.__setProperty('lineWrapping', value);
  }

  get readonly() {
    return this._readOnly;
  }

  set readonly(value) {
    this.__setProperty('readOnly', value);
  }

  get showCursorWhenSelecting() {
    return this._showCursorWhenSelecting;
  }

  set showCursorWhenSelecting(value) {
    this.__setProperty('showCursorWhenSelecting', value);
  }

  get lineWiseCopyCut() {
    return this._lineWiseCopyCut;
  }

  set lineWiseCopyCut(value) {
    this.__setProperty('lineWiseCopyCut', value);
  }

  get undoDepth() {
    return this._undoDepth;
  }

  set undoDepth(value) {
    this.__setProperty('undoDepth', value);
  }

  get historyEventDelay() {
    return this._historyEventDelay;
  }

  set historyEventDelay(value) {
    this.__setProperty('historyEventDelay', value);
  }

  get autofocus() {
    return this._autofocus;
  }

  set autofocus(value) {
    this.__setProperty('autofocus', value);
  }

  get gutters() {
    return this._gutters;
  }

  set gutters(value) {
    this.__setProperty('gutters', value);
  }

  get lint() {
    return this._lint;
  }

  set lint(value) {
    this.__setProperty('lint', value);
  }

  get editor() {
    return this._editor;
  }

  __setProperty(prop, value) {
    const key = `_${prop}`;
    if (this[key] === value) {
      return;
    }
    this[key] = value;
    this.setOption(prop, value);
  }

  /**
   * @constructor
   */
  constructor() {
    super();
    this._onChangeHandler = this._onChangeHandler.bind(this);
    this._onBeforeChangeHnalder = this._onBeforeChangeHnalder.bind(this);

    this._pendingOptions = [];
    this.mode = {
      name: 'javascript',
      json: true
    };
  }

  firstUpdated() {
    if (!this.value) {
      this.value = this._unindent(this._getContentValue() || '');
    }
    this._initializeEditor();
  }

  _initializeEditor() {
    try {
      const wrapper = this.shadowRoot.querySelector('.wrapper');
      const editor = CodeMirror(wrapper, {
        value: this.value,
        mode: this.mode
      });
      this._editor = editor;
      setTimeout(() => this._setPendingOptions());
      editor.getInputField().setAttribute('aria-label', 'Input field');
      editor.setOption('extraKeys', {
        Tab: () => {
          this.blur();
        }
      });
      this._connectEditor();
    } catch (e) {
      noop();
    }
  }

  _getContentValue() {
    const slot = this.shadowRoot.querySelector('.content slot');
    const nodes = slot.assignedNodes();
    for (let i = 0; i < nodes.length; i++) {
      const value = nodes[i].textContent;
      if (value.trim()) {
        return value;
      }
    }
  }

  _unindent(text) {
    if (!text) {
      return text;
    }
    const lines = text.replace(/\t/g, '  ').split('\n');
    const indent = lines.reduce(function(prev, line) {
      if (/^\s*$/.test(line)) {
        return prev;  // Completely ignore blank lines.
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
   * Sets options to an editor that has been set before the editor was created
   */
  _setPendingOptions() {
    if (!this._pendingOptions) {
      return;
    }
    this._pendingOptions.forEach((item) => {
      this.setOption(item.option, item.value);
      if (item.post) {
        try {
          item.post();
        } catch (e) {
          noop();
        }
      }
    });
    this._pendingOptions = undefined;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this._connectEditor();
  }

  _connectEditor() {
    if (!this.editor) {
      return;
    }
    this.editor.on('change', this._onChangeHandler);
    this.editor.on('beforeChange', this._onBeforeChangeHnalder);
    this.editor.refresh();
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    if (!this.editor) {
      return;
    }
    this.editor.off('change', this._onChangeHandler);
    this.editor.off('beforeChange', this._onBeforeChangeHnalder);
  }
  /**
   * Refreshes the sate of the editor.
   */
  refresh() {
    if (!this.editor) {
      return;
    }
    this.editor.refresh();
  }
  /**
   * Focus cursor on an editor.
   */
  focus() {
    if (!this.editor) {
      return;
    }
    this.editor.focus();
  }
  /**
   * Set option on an editor.
   *
   * @param {String} option An option name to setOption
   * @param {Any} value A value to be set.
   */
  setOption(option, value) {
    if (!this.editor) {
      this._pendingOptions.push({
        option: option,
        value: value
      });
      return;
    }
    this.editor.setOption(option, value);
  }
  /**
   * Set an editor value when `value` property changed.
   * @param {String} value
   */
  _valueChanged(value) {
    if (!this.editor) {
      return;
    }
    if (value === undefined || value === null) {
      this.editor.setValue('');
    } else if (value !== this.editor.getValue()) {
      if (typeof value !== 'string') {
        value = String(value);
      }
      this.editor.setValue(value);
    }
  }
  /**
   * Auto-called when mode has changed
   * @param {String} val
   */
  _modeChanged(val) {
    if (!val || (val.indexOf && val.indexOf('application/json') === 0)) {
      this.mode = {
        name: 'javascript',
        json: true
      };
      return;
    }
    let mode;
    let spec;
    let info;
    const m = /.+\.([^.]+)$/.exec(val);
    if (m) {
      info = CodeMirror.findModeByExtension(m[1]);
      if (info) {
        mode = info.mode;
        spec = info.mime;
      }
    } else if (/\//.test(val)) {
      info = CodeMirror.findModeByMIME(val);
      if (info) {
        mode = info.mode;
        spec = val;
      }
    } else {
      mode = spec = val;
    }
    if (!this.editor) {
      this._pendingOptions.push({
        option: 'mode',
        value: mode,
        post: function() {
          CodeMirror.autoLoadMode(this.editor, mode);
        }.bind(this)
      });
      return;
    }
    if (!mode) {
      this.setOption('mode', null);
      return;
    }
    this.setOption('mode', spec);
    CodeMirror.autoLoadMode(this.editor, mode);
  }

  _onChangeHandler() {
    this.value = this.editor.getValue();
  }

  _onBeforeChangeHnalder(instance, changeObj) {
    const ev = new CustomEvent('before-change', {
      detail: {
        change: changeObj
      }
    });
    this.dispatchEvent(ev);
    if (ev.detail.change.canceled) {
      this.value = this.editor.getValue();
    }
  }

  _getValidity() {
    if (this.required && !this.value) {
      return false;
    }
    return true;
  }
  /**
   * Fired before a change is applied, and its handler may choose to modify or
   * cancel the change.
   *
   * @event before-change
   * @param {Object} change It has `from`, `to`, and `text` properties,
   * as with the CodeMirror's `change` event.
   *
   * It has a `cancel()` method, which can be called to cancel the change, and,
   * if the change isn't coming from an undo or redo event, an `update(from, to, text)` method,
   * which may be used to modify the change.
   */
}
window.customElements.define('code-mirror', CodeMirrorElement);
