/* global CodeMirror */

const HINT_ELEMENT_CLASS = 'CodeMirror-hint';
const ACTIVE_HINT_ELEMENT_CLASS = 'selected';

const defaultOptions = {
  hint: CodeMirror.hint.auto,
  completeSingle: true,
  alignWithWord: true,
  closeCharacters: /[\s()\\[\\]{};:>,]/,
  closeOnUnfocus: true,
  completeOnSingleClick: false,
  container: null,
  customKeys: null,
  extraKeys: null
};

function Completion(cm, options) {
  this.cm = cm;
  this.options = this.buildOptions(options);
  this.widget = null;
  this.debounce = 0;
  this.tick = 0;
  this.startPos = this.cm.getCursor();
  this.startLen = this.cm.getLine(this.startPos.line).length;

  const self = this;
  cm.on('cursorActivity', this.activityFunc = function() {
    self.cursorActivity();
  });
}
function getText(completion) {
  if (typeof completion === 'string') {
    return completion;
  } else {
    return completion.text;
  }
}
function buildKeyMap(completion, handle) {
  const baseMap = {
    Up: function() {
      handle.moveFocus(-1);
    },
    Down: function() {
      handle.moveFocus(1);
    },
    PageUp: function() {
      handle.moveFocus(-handle.menuSize() + 1, true);
    },
    PageDown: function() {
      handle.moveFocus(handle.menuSize() - 1, true);
    },
    Home: function() {
      handle.setFocus(0);
    },
    End: function() {
      handle.setFocus(handle.length - 1);
    },
    Enter: handle.pick,
    Tab: handle.pick,
    Esc: handle.close
  };
  const custom = completion.options.customKeys;
  const ourMap = custom ? {} : baseMap;

  function addBinding(key, val) {
    let bound;
    if (typeof val !== 'string') {
      bound = function(cm) {
        return val(cm, handle);
      };
      // This mechanism is deprecated
    } else if (baseMap.hasOwnProperty(val)) {
      bound = baseMap[val];
    } else {
      bound = val;
    }
    ourMap[key] = bound;
  }
  if (custom) {
    Object.keys(custom).forEach((key) => {
      addBinding(key, custom[key]);
    });
  }
  const extra = completion.options.extraKeys;
  if (extra) {
    Object.keys(extra).forEach((key) => {
      addBinding(key, extra[key]);
    });
  }
  return ourMap;
}

function getHintElement(hintsElement, el) {
  while (el && el !== hintsElement) {
    if (el.nodeName.toUpperCase() === 'ANYPOINT-ITEM' && el.parentNode === hintsElement) {
      return el;
    }
    el = el.parentNode;
  }
}
function Widget(completion, data) {
  this.completion = completion;
  this.data = data;
  this.picked = false;
  const widget = this;
  const cm = completion.cm;

  const hints = this.hints = document.createElement('code-mirror-hint-container');
  hints.slot = 'hints';
  hints.className = 'CodeMirror-hints';
  this.selectedHint = data.selectedHint || 0;
  const container = document.createElement('anypoint-listbox');
  container.selected = 0;
  hints.appendChild(container);

  const completions = data.list;
  for (let i = 0; i < completions.length; ++i) {
    const elt = container.appendChild(document.createElement('anypoint-item'));
    const cur = completions[i];
    let className = HINT_ELEMENT_CLASS + (i !== this.selectedHint ? '' : ' ' +
      ACTIVE_HINT_ELEMENT_CLASS);
    if (cur.className !== null) {
      className = cur.className ? cur.className + ' ' + className : className;
    }
    elt.className = className;
    if (cur.render) {
      cur.render(elt, data, cur);
    } else {
      elt.appendChild(document.createTextNode(cur.displayText || getText(cur)));
    }
    elt.hintId = i;
  }
  if (hints.children[0].children[0].nodeName === 'DIV') {
    this._indexOffset = 1;
  } else {
    this._indexOffset = 0;
  }
  let pos = cm.cursorCoords(completion.options.alignWithWord ? data.from : null, 'local');
  let left = pos.left;
  let top = pos.bottom;
  let below = true;
  hints.style.left = left + 'px';
  hints.style.top = top + 'px';
  // If we're at the edge of the screen, then we want the menu to appear on the left of the
  // cursor.
  const winW = window.innerWidth || Math.max(document.body.offsetWidth,
      document.documentElement.offsetWidth);
  const winH = window.innerHeight || Math.max(document.body.offsetHeight,
      document.documentElement.offsetHeight);
  (completion.options.container || document.body).appendChild(hints);
  let box = hints.getBoundingClientRect();
  const overlapY = box.bottom - winH;
  if (overlapY > 0) {
    const height = box.bottom - box.top;
    const curTop = pos.top - (pos.bottom - box.top);
    if (curTop - height > 0) { // Fits above cursor
      hints.style.top = (top = pos.top - height) + 'px';
      below = false;
    } else if (height > winH) {
      hints.style.height = (winH - 5) + 'px';
      hints.style.top = (top = pos.bottom - box.top) + 'px';
      const cursor = cm.getCursor();
      if (data.from.ch !== cursor.ch) {
        pos = cm.cursorCoords(cursor);
        hints.style.left = (left = pos.left) + 'px';
        box = hints.getBoundingClientRect();
      }
    }
  }
  let overlapX = box.right - winW;
  if (overlapX > 0) {
    if (box.right - box.left > winW) {
      hints.style.width = (winW - 5) + 'px';
      overlapX -= (box.right - box.left) - winW;
    }
    hints.style.left = (left = pos.left - overlapX) + 'px';
  }

  cm.addKeyMap(this.keyMap = buildKeyMap(completion, {
    moveFocus: function(n, avoidWrap) {
      widget.changeActive(widget.selectedHint + n, avoidWrap);
    },
    setFocus: function(n) {
      widget.changeActive(n);
    },
    menuSize: function() {
      return widget.screenAmount();
    },
    length: completions.length,
    close: function() {
      completion.close();
    },
    pick: function() {
      widget.pick();
    },
    data: data
  }));

  if (completion.options.closeOnUnfocus) {
    let closingOnBlur;
    cm.on('blur', this.onBlur = function() {
      closingOnBlur = setTimeout(function() {
        completion.close();
      }, 100);
    });
    cm.on('focus', this.onFocus = function() {
      clearTimeout(closingOnBlur);
    });
  }

  const startScroll = cm.getScrollInfo();
  cm.on('scroll', this.onScroll = function() {
    const curScroll = cm.getScrollInfo();
    const editor = cm.getWrapperElement().getBoundingClientRect();
    const newTop = top + startScroll.top - curScroll.top;
    let point = newTop -
      (window.pageYOffset || (document.documentElement || document.body).scrollTop);
    if (!below) {
      point += hints.offsetHeight;
    }
    if (point <= editor.top || point >= editor.bottom) {
      return completion.close();
    }
    hints.style.top = newTop + 'px';
    hints.style.left = (left + startScroll.left - curScroll.left) + 'px';
  });

  CodeMirror.on(container, 'click', function(e) {
    const t = getHintElement(hints.children[0], e.target || e.srcElement);
    if (t && t.hintId !== undefined) {
      widget.changeActive(t.hintId);
      widget.pick();
    }
  });

  CodeMirror.on(hints, 'mousedown', function() {
    setTimeout(function() {
      cm.focus();
    }, 20);
  });

  CodeMirror.signal(data, 'select', completions[0], hints.children[0].firstChild);
  return true;
}

Widget.prototype = {
  close: function() {
    if (this.completion.widget !== this) {
      return;
    }
    this.completion.widget = null;
    this.hints.parentNode.removeChild(this.hints);
    this.completion.cm.removeKeyMap(this.keyMap);

    const cm = this.completion.cm;
    if (this.completion.options.closeOnUnfocus) {
      cm.off('blur', this.onBlur);
      cm.off('focus', this.onFocus);
    }
    cm.off('scroll', this.onScroll);
  },

  disable: function() {
    this.completion.cm.removeKeyMap(this.keyMap);
    const widget = this;
    this.keyMap = {
      Enter: function() {
        widget.picked = true;
      }
    };
    this.completion.cm.addKeyMap(this.keyMap);
  },

  pick: function() {
    this.completion.pick(this.data, this.selectedHint);
  },

  changeActive: function(i, avoidWrap) {
    // i += this._indexOffset;
    if (i >= this.data.list.length) {
      i = avoidWrap ? this.data.list.length - 1 : 0;
    } else if (i < 0) {
      i = avoidWrap ? 0 : this.data.list.length - 1;
    }
    if (this.selectedHint === i) {
      return;
    }
    let selectedHint = this.selectedHint + this._indexOffset;
    let node = this.hints.children[0].children[selectedHint];
    node.classList.remove(ACTIVE_HINT_ELEMENT_CLASS);
    selectedHint = i + this._indexOffset;
    this.selectedHint = i;
    node = this.hints.children[0].children[selectedHint];
    node.classList.add(ACTIVE_HINT_ELEMENT_CLASS);
    if (node.offsetTop < this.hints.scrollTop) {
      this.hints.scrollTop = node.offsetTop - 3;
    } else if (node.offsetTop + node.offsetHeight > this.hints.scrollTop +
      this.hints.clientHeight) {
      this.hints.scrollTop = node.offsetTop + node.offsetHeight - this.hints.clientHeight + 3;
    }
    CodeMirror.signal(this.data, 'select', this.data.list[selectedHint], node);
  },

  screenAmount: function() {
    return Math.floor(this.hints.clientHeight /
      this.hints.children[0].children[0].offsetHeight) || 1;
  }
};
// This is the old interface, kept around for now to stay
// backwards-compatible.
CodeMirror.showHint = function(cm, getHints, options) {
  if (!getHints) {
    return cm.showHint(options);
  }
  if (options && options.async) {
    getHints.async = true;
  }
  const newOpts = {
    hint: getHints
  };
  if (options) {
    Object.keys(options).forEach((prop) => {
      newOpts[prop] = options[prop];
    });
  }
  return cm.showHint(newOpts);
};


function ShowHintFn(options) {
  // We want a single cursor position.
  if (this.listSelections().length > 1 || this.somethingSelected()) {
    return;
  }

  if (this.state.completionActive) {
    this.state.completionActive.close();
  }
  const completion = this.state.completionActive = new Completion(this, options);
  if (!completion.options.hint) {
    return;
  }

  CodeMirror.signal(this, 'startCompletion', this);
  completion.update(true);
}

CodeMirror.defineExtension('showHint', ShowHintFn);

const raf = window.requestAnimationFrame || function(fn) {
  return setTimeout(fn, 1000 / 60);
};
const caf = window.cancelAnimationFrame || clearTimeout;

Completion.prototype = {
  close: function() {
    if (!this.active()) {
      return;
    }
    this.cm.state.completionActive = null;
    this.tick = null;
    this.cm.off('cursorActivity', this.activityFunc);

    if (this.widget && this.data) {
      CodeMirror.signal(this.data, 'close');
    }
    if (this.widget) {
      this.widget.close();
    }
    CodeMirror.signal(this.cm, 'endCompletion', this.cm);
  },

  active: function() {
    return this.cm.state.completionActive === this;
  },

  pick: function(data, i) {
    const completion = data.list[i];
    if (completion.hint) {
      completion.hint(this.cm, data, completion);
    } else {
      this.cm.replaceRange(getText(completion), completion.from || data.from,
          completion.to || data.to, 'complete');
    }
    CodeMirror.signal(data, 'pick', completion);
    this.close();
  },

  cursorActivity: function() {
    if (this.debounce) {
      caf(this.debounce);
      this.debounce = 0;
    }

    const pos = this.cm.getCursor();
    const line = this.cm.getLine(pos.line);
    if (pos.line !== this.startPos.line ||
      line.length - pos.ch !== this.startLen - this.startPos.ch ||
      pos.ch < this.startPos.ch || this.cm.somethingSelected() ||
      (pos.ch && this.options.closeCharacters.test(line.charAt(pos.ch - 1)))) {
      this.close();
    } else {
      const self = this;
      this.debounce = raf(function() {
        self.update();
      });
      if (this.widget) {
        this.widget.disable();
      }
    }
  },

  update: function(first) {
    if (this.tick === null) {
      return;
    }
    if (this.data) {
      CodeMirror.signal(this.data, 'update');
    }
    if (!this.options.hint.async) {
      this.finishUpdate(this.options.hint(this.cm, this.options), first);
    } else {
      const myTick = ++this.tick;
      const self = this;
      this.options.hint(this.cm, function(data) {
        if (self.tick === myTick) {
          self.finishUpdate(data, first);
        }
      }, this.options);
    }
  },

  finishUpdate: function(data, first) {
    this.data = data;

    const picked = (this.widget && this.widget.picked) || (first && this.options.completeSingle);
    if (this.widget) {
      this.widget.close();
    }
    if (data && data.list.length) {
      if (picked && data.list.length === 1) {
        this.pick(data, 0);
      } else {
        this.widget = new Widget(this, data);
        CodeMirror.signal(data, 'shown');
      }
    }
  },

  buildOptions: function(options) {
    const editor = this.cm.options.hintOptions;
    const out = {};
    Object.keys(defaultOptions).forEach((prop) => {
      out[prop] = defaultOptions[prop];
    });
    if (editor) {
      for (const prop in editor) {
        if (editor[prop] !== undefined) {
          out[prop] = editor[prop];
        }
      }
    }
    if (options) {
      for (const prop in options) {
        if (options[prop] !== undefined) {
          out[prop] = options[prop];
        }
      }
    }
    return out;
  }
};

CodeMirror.registerHelper('hint', 'auto', function(cm, options) {
  const helpers = cm.getHelpers(cm.getCursor(), 'hint');
  let words;
  if (helpers.length) {
    for (let i = 0; i < helpers.length; i++) {
      const cur = helpers[i](cm, options);
      if (cur && cur.list.length) {
        return cur;
      }
    }
  } else if ((words = cm.getHelper(cm.getCursor(), 'hintWords'))) {
    if (words) {
      return CodeMirror.hint.fromList(cm, {
        words: words
      });
    }
  } else if (CodeMirror.hint.anyword) {
    return CodeMirror.hint.anyword(cm, options);
  }
});

CodeMirror.registerHelper('hint', 'fromList', function(cm, options) {
  const cur = cm.getCursor();
  const token = cm.getTokenAt(cur);
  const found = [];
  for (let i = 0; i < options.words.length; i++) {
    const word = options.words[i];
    if (word.slice(0, token.string.length) === token.string) {
      found.push(word);
    }
  }

  if (found.length) {
    return {
      list: found,
      from: CodeMirror.Pos(cur.line, token.start),
      to: CodeMirror.Pos(cur.line, token.end)
    };
  }
});

CodeMirror.commands.autocomplete = CodeMirror.showHint;

CodeMirror.defineOption('hintOptions', null);
