/**
 * An addon for CodeMirror 5.x to support syntax highlighting for HTTP headers.
 *
 * @return {Object}.
 */
export default function() {
  function failRest(stream, state) {
    stream.skipToEnd();
    state.cur = failRest;
    return 'error';
  }

  function header(stream) {
    if (stream.sol() && !stream.eat(/[ \t]/)) {
      if (stream.match(/^.*?:/)) {
        return 'atom';
      } else {
        stream.skipToEnd();
        return 'error';
      }
    } else {
      stream.skipToEnd();
      return 'string';
    }
  }

  return {
    token: function(stream, state) {
      const cur = state.cur;
      if (!cur || cur !== header && stream.eatSpace()) {
        return null;
      }
      return cur(stream, state);
    },

    blankLine: function(state) {
      state.cur = failRest;
    },

    startState: function() {
      return {
        cur: header
      };
    }
  };
}
