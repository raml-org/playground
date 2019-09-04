/**
 * Implements logic for parsing URL string.
 */
class UrlValueParser {
  /**
   * @constructor
   * @param {?Object} opts
   */
  constructor(opts) {
    this.__data = {};
    this.opts = opts;
  }
  /**
   * @return {Object} Class options.
   */
  get opts() {
    return this.__data.opts;
  }
  /**
   * Sets parser options.
   * Unknown options are ignored.
   *
   * @param {Object} opts Options to pass.
   * - queryDelimiter {String} a query string delimiter.
   */
  set opts(opts) {
    opts = opts || {};
    this.__data.opts = {
      queryDelimiter: opts.queryDelimiter || '&'
    };
  }
  /**
   * Returns protocol value in format `protocol` + ':'
   *
   * @param {String} value URL to parse.
   * @return {String|undefined} Value of the protocol or undefined if
   * value not set
   */
  _parseProtocol(value) {
    if (!value) {
      return;
    }
    const delimIndex = value.indexOf('://');
    if (delimIndex !== -1) {
      return value.substr(0, delimIndex + 1);
    }
  }
  /**
   * Gets a host value from the url.
   * It reads the whole authority value of given `value`. It doesn't parses it
   * to host, port and
   * credentials parts. For URL panel it's enough.
   *
   * @param {String} value The URL to parse
   * @return {String|undefined} Value of the host or undefined.
   */
  _parseHost(value) {
    if (!value) {
      return;
    }
    const delimIndex = value.indexOf('://');
    if (delimIndex !== -1) {
      value = value.substr(delimIndex + 3);
    }
    if (!value) {
      return;
    }
    // We don't need specifics here (username, password, port)
    const host = value.split('/')[0];
    return host;
  }
  /**
   * Parses the path part of the URL.
   *
   * @param {String} value URL value
   * @return {String|undefined} Path part of the URL
   */
  _parsePath(value) {
    if (!value) {
      return;
    }
    let index = value.indexOf('://');
    if (index !== -1) {
      value = value.substr(index + 3);
    }
    index = value.indexOf('?');
    if (index !== -1) {
      value = value.substr(0, index);
    }
    index = value.indexOf('#');
    if (index !== -1) {
      value = value.substr(0, index);
    }
    const lastIsSlash = value[value.length - 1] === '/';
    const parts = value.split('/').filter((part) => !!part);
    parts.shift();
    let path = '/' + parts.join('/');
    if (lastIsSlash && parts.length > 1) {
      path += '/';
    }
    return path;
  }
  /**
   * Returns query parameters string (without the '?' sign) as a whole.
   *
   * @param {String} value The URL to parse
   * @return {String|undefined} Value of the search string or undefined.
   */
  _parseSearch(value) {
    if (!value) {
      return;
    }
    let index = value.indexOf('?');
    if (index === -1) {
      return;
    }
    value = value.substr(index + 1);
    index = value.indexOf('#');
    if (index === -1) {
      return value;
    }
    return value.substr(0, index);
  }
  /**
   * Reads a value of the anchor (or hash) parameter without the `#` sign.
   *
   * @param {String} value The URL to parse
   * @return {String|undefined} Value of the anchor (hash) or undefined.
   */
  _parseAnchor(value) {
    if (!value) {
      return;
    }
    const index = value.indexOf('#');
    if (index === -1) {
      return;
    }
    return value.substr(index + 1);
  }
  /**
   * Returns an array of items where each item is an array where first
   * item is param name and second is it's value. Both always strings.
   *
   * @param {?String} search Parsed search parameter
   * @return {Array} Always returns an array.
   */
  _parseSearchParams(search) {
    const result = [];
    if (!search) {
      return result;
    }
    const parts = search.split(this.opts.queryDelimiter);
    parts.forEach((item) => {
      const _part = ['', ''];
      const _params = item.split('=');
      let _name = _params.shift();
      if (!_name && name !== '') {
        return;
      }
      _name = _name.trim();
      const _value = _params.join('=').trim();
      _part[0] = _name;
      _part[1] = _value;
      result.push(_part);
    });
    return result;
  }
}
/**
 * A class to parse URL string.
 */
class UrlParser extends UrlValueParser {
  /**
   * @constructor
   * @param {String} value URL value
   * @param {?Object} opts
   */
  constructor(value, opts) {
    super(opts);
    this.value = value;
  }

  /**
   * Returns protocol value in format `protocol` + ':'
   *
   * @return {String|undefined} Value of the protocol or undefined if
   * value not set
   */
  get protocol() {
    return this.__data.protocol;
  }
  /**
   * Sets value of the `protocol`
   *
   * @param {String} value Protocol value.
   */
  set protocol(value) {
    this.__data.protocol = value;
  }
  /**
   * It reads the authority part of the URL value. It doesn't parses it
   * to host, port and credentials parts.
   *
   * @return {String|undefined} Value of the host or undefined if
   * value not set
   */
  get host() {
    return this.__data.host;
  }
  /**
   * Sets value of the `host`
   *
   * @param {String} value Host value.
   */
  set host(value) {
    this.__data.host = value;
  }
  /**
   * Returns path part of the URL.
   *
   * @return {String|undefined} Value of the path or undefined if
   * value not set
   */
  get path() {
    return this.__data.path || '/';
  }
  /**
   * Sets value of the `path`
   *
   * @param {String} value Path value.
   */
  set path(value) {
    this.__data.path = value;
  }
  /**
   * Returns anchor part of the URL.
   *
   * @return {String|undefined} Value of the anchor or undefined if
   * value not set
   */
  get anchor() {
    return this.__data.anchor;
  }
  /**
   * Sets value of the `anchor`
   *
   * @param {String} value Anchor value.
   */
  set anchor(value) {
    this.__data.anchor = value;
  }
  /**
   * Returns search part of the URL.
   *
   * @return {String|undefined} Value of the search or undefined if
   * value not set
   */
  get search() {
    return this.__data.search;
  }
  /**
   * Sets value of the `search`
   *
   * @param {String} value Search value.
   */
  set search(value) {
    this.__data.search = value;
  }
  /**
   * The URL value. It is the same as calling `toStirng()`.
   *
   * @return {String} URL value for current configuration.
   */
  get value() {
    return this.toString();
  }
  /**
   * Sets value of the URL.
   * It parses the url and sets properties.
   *
   * @param {String} value URL value.
   */
  set value(value) {
    this.protocol = this._parseProtocol(value);
    this.host = this._parseHost(value);
    this.path = this._parsePath(value);
    this.anchor = this._parseAnchor(value);
    this.search = this._parseSearch(value);
  }
  /**
   * Returns an array of search params.
   *
   * @return {Array<Array>} List of search params. Each item contains an
   * array when first item is name of the parameter and second item is the
   * value.
   */
  get searchParams() {
    return this._parseSearchParams(this.search);
  }
  /**
   * Sets the value of `search` and `searchParams`.
   *
   * @param {Array<Array>} value Search params list.
   */
  set searchParams(value) {
    if (!value || !value.length) {
      this.search = undefined;
      return;
    }
    this.search = value.map((item) => {
      if (!item[0] && !item[1]) {
        return '';
      }
      item[1] = item[1] || '';
      return item[0] + '=' + item[1];
    })
    .join(this.opts.queryDelimiter);
  }
  /**
   * Returns the URL for current settings.
   *
   * @return {String} URL value.
   */
  toString() {
    let result = '';
    if (this.protocol) {
      result += this.protocol;
      result += '//';
    }
    if (this.host) {
      result += this.host;
    }
    if (this.path) {
      if (this.path === '/' && !this.host && !this.search && !this.anchor) {
      } else {
        if (this.path[0] !== '/') {
          result += '/';
        }
        result += this.path;
      }
    } else {
      if (this.search || this.anchor) {
        result += '/';
      }
    }
    if (this.search) {
      const p = this.searchParams;
      this.searchParams = p;
      result += '?' + this.search;
    }
    if (this.anchor) {
      result += '#' + this.anchor;
    }
    return result;
  }
}
