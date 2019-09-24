import addon from './HeadersAddon.js';

/* global CodeMirror */

CodeMirror.defineMode('http-headers', addon);
CodeMirror.defineMIME('message/http-headers', 'http-headers');
