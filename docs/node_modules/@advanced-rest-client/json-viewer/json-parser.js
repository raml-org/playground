const SafeHtmlUtils = {
  AMP_RE: new RegExp(/&/g),
  GT_RE: new RegExp(/>/g),
  LT_RE: new RegExp(/</g),
  SQUOT_RE: new RegExp(/'/g),
  QUOT_RE: new RegExp(/"/g),
  htmlEscape: function(s) {
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
    if (s.indexOf('\'') !== -1) {
      s = s.replace(SafeHtmlUtils.SQUOT_RE, '&#39;');
    }
    return s;
  }
};

export class JsonParser {
  constructor(opts) {
    this.rawData = opts.raw || '';
    this.cssPrefix = opts.cssPrefix || '';
    this._numberIndexes = {}; // Regexp number indexes
    this.jsonValue = null;
    this.latestError = null;
    this.elementsCounter = 0;
    this._setJson(opts.json);
    this.hasPerformanceApi = typeof performance !== 'undefined';
  }

  _setJson(jsonData) {
    if (typeof jsonData === 'string') {
      try {
        this.jsonValue = JSON.parse(jsonData);
        if (!this.rawData) {
          this.rawData = jsonData;
        }
      } catch (e) {
        this.latestError = e.message;
      }
    } else {
      this.jsonValue = jsonData;
    }
  }
  /**
   * Get created HTML content.
   * @return {String}
   */
  getHTML() {
    let parsedData = '<div class="' + this.cssPrefix + 'prettyPrint">';
    parsedData += this.parse(this.jsonValue);
    parsedData += '</div>';
    return parsedData;
  }
  /**
   * Parse JSON data
   * @param {*} data
   * @param {Object} opts
   * @return {Stirng}
   */
  parse(data, opts) {
    opts = opts || {};
    let result = '';
    if (data === null) {
      result += this.parseNullValue();
    } else if (typeof data === 'number') {
      result += this.parseNumericValue(data);
    } else if (typeof data === 'boolean') {
      result += this.parseBooleanValue(data);
    } else if (typeof data === 'string') {
      result += this.parseStringValue(data);
    } else if (data instanceof Array) {
      result += this.parseArray(data);
    } else {
      result += this.parseObject(data);
    }
    if (opts.hasNextSibling && !opts.holdComa) {
      result += '<span class="' + this.cssPrefix + 'punctuation dimmed">,</span>';
    }
    return result;
  }

  parseNullValue() {
    let result = '';
    result += '<span class="' + this.cssPrefix + 'nullValue">';
    result += 'null';
    result += '</span>';
    return result;
  }

  parseNumericValue(number) {
    let expectedNumber;
    let max = Number.MAX_SAFE_INTEGER;
    if (!max) {
      max = 9007199254740991;
    }
    if (number > max) { // IE doesn't support Number.MAX_SAFE_INTEGER
      let comp = String(number);
      comp = comp.substr(0, String(max).length);
      const r = new RegExp(comp + '(\\d+),?', 'gim');
      if (comp in this._numberIndexes) {
        r.lastIndex = this._numberIndexes[comp];
      }
      const _result = r.exec(this.rawData);
      if (_result) {
        this._numberIndexes[comp] = _result.index;
        expectedNumber = comp + _result[1];
      }
    }

    let result = '';
    result += '<span class="' + this.cssPrefix + 'numeric">';
    if (expectedNumber) {
      result += '<js-max-number-error class="' + this.cssPrefix +
        'number-error" expectednumber="' + expectedNumber + '">';
    }
    result += number + '';
    if (expectedNumber) {
      result += '</js-max-number-error>';
    }
    result += '</span>';
    return result;
  }

  parseBooleanValue(bool) {
    let result = '';
    result += '<span class="' + this.cssPrefix + 'booleanValue">';
    if (bool !== null && bool !== undefined) {
      result += bool + '';
    } else {
      result += 'null';
    }
    result += '</span>';
    return result;
  }

  parseStringValue(str) {
    let result = '';
    let value = str || '';
    if (value !== null && value !== undefined) {
      value = SafeHtmlUtils.htmlEscape(value);
      if (value.slice(0, 1) === '/' || value.substr(0, 4) === 'http') {
        value = '<a class="' + this.cssPrefix + '" title="Click to insert into URL field" ' +
          'response-anchor add-root-url href="' + value + '">' + value + '</a>';
      }
    } else {
      value = 'null';
    }
    result += '&quot;';
    result += '<span class="' + this.cssPrefix + 'stringValue">';
    result += value;
    result += '</span>';
    result += '&quot;';
    return result;
  }

  parseObject(object) {
    let result = '';
    result += '{';
    result += '<div collapse-indicator class="' + this.cssPrefix + 'info-row">...</div>';
    Object.keys(object).forEach((key, i, arr) => {
      const value = object[key];
      const lastSibling = (i + 1) === arr.length;
      const parseOpts = {
        hasNextSibling: !lastSibling
      };
      if (value instanceof Array) {
        parseOpts.holdComa = true;
      }
      const elementNo = this.elementsCounter++;
      const data = this.parse(value, parseOpts);
      const hasManyChildren = this.elementsCounter - elementNo > 1;
      result += '<div data-element="' + elementNo + '" style="margin-left: 24px" class="' +
        this.cssPrefix + 'node">';
      const _nan = isNaN(key);
      if (_nan) {
        result += '&quot;';
      }
      result += this.parseKey(key);
      if (_nan) {
        result += '&quot;';
      }
      result += ': ' + data;
      if (hasManyChildren) {
        result += '<div data-toggle="' + elementNo + '" class="' + this.cssPrefix +
          'rootElementToggleButton"></div>';
      }
      result += '</div>';
    });
    result += '}';
    return result;
  }

  parseArray(array) {
    const cnt = array.length;
    let result = '';
    result += '<span class="' + this.cssPrefix + 'punctuation dimmed">[</span>';
    result += '<span class="' + this.cssPrefix + 'array-counter brace punctuation" count="' +
      cnt + '"></span>';
    for (let i = 0; i < cnt; i++) {
      const elementNo = this.elementsCounter++;

      const lastSibling = (i + 1) === cnt;
      const data = this.parse(array[i], {
        hasNextSibling: !lastSibling
      });
      const hasManyChildren = this.elementsCounter - elementNo > 1;
      result += '<div data-element="' + elementNo +
        '" style="margin-left: 24px" class="' + this.cssPrefix + 'node">';
      result += '<span class="' + this.cssPrefix + 'array-key-number" index="' + i +
        '"> &nbsp;</span>';
      result += data;
      if (hasManyChildren) {
        result += '<div data-toggle="' + elementNo + '" class="' + this.cssPrefix +
          'rootElementToggleButton"></div>';
      }
      result += '</div>';
    }
    result += '<span class="' + this.cssPrefix + 'punctuation dimmed">],</span>';
    return result;
  }

  parseKey(key) {
    let result = '';
    result += '<span class="' + this.cssPrefix + 'key-name">' + key + '</span>';
    return result;
  }
}
