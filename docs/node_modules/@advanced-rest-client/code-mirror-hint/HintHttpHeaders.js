import headersSuggestions from './HintHeadersSuggestions.js';

/* global CodeMirror */

function getToken(editor, cur) {
  return editor.getTokenAt(cur);
}
/**
 * Get all keywords (headers names).
 * @param {Array} suggestions List of possible headers
 * @return {Array} Array of founded header names.
 */
export function getKeywords(suggestions) {
  const keywords = [];
  const clb = function(header, cm, data, completion) {
    cm.replaceRange(completion.text + ': ', data.from, data.to);
    CodeMirror.signal(cm, 'header-key-selected', completion.text);
  };
  for (let i = 0; i < suggestions.length; i++) {
    keywords.push({
      text: suggestions[i].key,
      hint: clb.bind(null, suggestions[i])
    });
  }
  return keywords;
}

export function getHeaderValuesFor(suggestions, key) {
  const keywords = [];
  const clb = function(header, cm, data, completion) {
    cm.replaceRange(completion.text, data.from, data.to);
    CodeMirror.signal(cm, 'header-value-selected', completion.text);

    if (header.params && header.params['*'] && header.params['*'].call) {
      const fromChar = Math.min(data.from.ch, data.to.ch);
      const charTo = fromChar + completion.text.length;
      const line = data.from.line;
      cm.setSelection({
        line: line,
        ch: fromChar
      }, {
        line: line,
        ch: charTo
      });
      CodeMirror.signal(cm, 'header-value-support', {
        type: header.params['*'],
        key: header.key,
        value: completion.text
      });
    } else {
      const match = completion.text.match(/\{(.*?)\}/);
      if (match) {
        if (header.params && (match[1] in header.params)) {
          let fromChar = Math.min(data.from.ch, data.to.ch);
          const line = data.from.line;
          fromChar += completion.text.indexOf('{');
          const charTo = fromChar + match[1].length + 2;
          cm.setSelection({
            line: line,
            ch: fromChar
          }, {
            line: line,
            ch: charTo
          });
          CodeMirror.signal(cm, 'header-value-support', {
            type: header.params[match[1]],
            key: header.key,
            value: completion.text
          });
        }
      }
    }
  };

  for (let i = 0; i < suggestions.length; i++) {
    if (suggestions[i].key.toLowerCase() === key) {
      const valuesLenght = suggestions[i].values && suggestions[i].values.length || 0;
      for (let j = 0; j < valuesLenght; j++) {
        const item = suggestions[i].values[j];
        const completion = {
          text: item,
          hint: clb.bind(null, suggestions[i])
        };
        keywords.push(completion);
      }
      break;
    }
  }
  return keywords;
}

export function cleanResults(text, keywords) {
  const results = [];
  let i = 0;
  for (i = 0; i < keywords.length; i++) {
    if (keywords[i].text) {
      if (keywords[i].text.toLowerCase()
          .substring(0, text.length) === text) {
        results.push(keywords[i]);
      }
    } else {
      if (keywords[i].toLowerCase()
          .substring(0, text.length) === text) {
        results.push(keywords[i]);
      }
    }
  }
  return results;
}

export function getHints(editor) {
  const cur = editor.getCursor();
  const token = getToken(editor, cur);
  let tokenString = (token.string) ? '' : token.string.trim();
  let keywords = [];
  let i = 0;
  const fromCur = {
    line: cur.line,
    ch: cur.ch + 2
  };
  const toCur = {
    line: cur.line,
    ch: cur.ch
  };
  let flagClean = true;
  const last = editor.getRange({
    line: cur.line,
    ch: cur.ch - 1
  }, cur);
  const last2 = editor.getRange({
    line: cur.line,
    ch: cur.ch - 2
  }, cur);

  let key;
  if ((last === ':' || last2 === ': ') || (last === ',' || last2 === ', ')) {
    key = editor.getRange({
      line: cur.line,
      ch: 0
    }, cur);
    if (!key) {
      key = '';
    }
    key = key.substr(0, key.indexOf(':'))
        .trim()
        .toLowerCase();
    keywords = getHeaderValuesFor(headersSuggestions, key);
  } else if (editor.getRange({
    line: cur.line,
    ch: 0
  }, cur)
      .trim() !== '') {
    const prev = editor.getRange({
      line: cur.line,
      ch: 0
    }, cur)
        .trim();
    const index = prev.indexOf(':');
    if (index !== -1) {
      // looking for the key
      key = prev.substr(0, prev.indexOf(':'))
          .trim()
          .toLowerCase();
      // looking for the value
      tokenString = prev.substr(prev.indexOf(':') + 1)
          .trim()
          .toLowerCase();
      keywords = getHeaderValuesFor(headersSuggestions, key);
    } else {
      // looking for header name starting with...
      tokenString = prev.toLowerCase();
      keywords = getKeywords(headersSuggestions);
    }
    fromCur.ch = token.start;
  } else {
    for (i = 0; i < headersSuggestions.length; i++) {
      keywords = getKeywords(headersSuggestions);
    }
  }

  if (flagClean === true && tokenString.trim() === '') {
    flagClean = false;
  }

  if (flagClean) {
    keywords = cleanResults(tokenString, keywords);
  }
  /*
   * from: replaceToken ? Pos(cur.line, tagStart == null ? token.start : tagStart) : cur,
   to: replaceToken ? Pos(cur.line, token.end) : cur
   */
  return {
    list: keywords,
    from: fromCur,
    to: toCur
  };
}
