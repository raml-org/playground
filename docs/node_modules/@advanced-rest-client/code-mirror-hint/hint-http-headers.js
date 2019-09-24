import { getHints } from './HintHttpHeaders.js';
/* global CodeMirror */
CodeMirror.registerHelper('hint', 'http-headers', getHints);
