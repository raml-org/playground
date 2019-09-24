/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
/**
 * An element to display formatted date and time.
 *
 * The `date` propery accepts Date object, Number as a timestamp or string
 * that will be parsed to the Date object.
 *
 * This element uses the `Intl` interface which is available in IE 11+ browsers.
 *
 * To format the date use [Intl.DateTimeFormat]
 * (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat)
 * inteface options.
 *
 * The default value for each date-time component property is undefined,
 * but if all component properties are undefined, then year, month, and day
 * are assumed to be "numeric" (per spec).
 *
 * ### Example
 *
 * ```html
 * <date-time date="2010-12-10T11:50:45Z" year="numeric" month="narrow" day="numeric"></date-time>
 * ```
 *
 * The element provides accessibility by using the `time` element and setting
 * the `datetime` attribute on it.
 *
 * ### Styling
 *
 * `<date-time>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--date-time` | Mixin applied to the element | `{}`
 *
 *
 * @customElement
 * @demo demo/index.html
 * @memberof UiElements
 */
class DateTime extends HTMLElement {
  static get observedAttributes() {
    return [
      'locales', 'date', 'year', 'month', 'day', 'hour', 'minute', 'second',
      'weekday', 'time-zone-name', 'era', 'time-zone', 'hour12', 'itemprop'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._observer = new MutationObserver(() => this._mutationHandler());
  }

  connectedCallback() {
    this._observer.observe(this.shadowRoot, {
      childList: true,
      characterData: true,
      subtree: true
    });
    this._updateLabel();
  }

  disconnectedCallback() {
    this._observer.disconnect();
  }

  _mutationHandler() {
    this.setAttribute('aria-label', this.shadowRoot.textContent);
  }

  /**
   * A string with a BCP 47 language tag, or an array of such strings.
   * For the general form and interpretation of the locales argument,
   * see the Intl page.
   * The following Unicode extension keys are allowed:
   * - nu - Numbering system. Possible values include: "arab", "arabext",
   * "bali", "beng", "deva", "fullwide", "gujr", "guru", "hanidec", "khmr",
   * "knda", "laoo", "latn", "limb", "mlym", "mong", "mymr", "orya",
   * "tamldec", "telu", "thai", "tibt".
   * - ca - Calendar. Possible values include: "buddhist", "chinese",
   * "coptic", "ethioaa", "ethiopic", "gregory", "hebrew", "indian",
   * "islamic", "islamicc", "iso8601", "japanese", "persian", "roc".
   *
   * @type {String}
   */
  get locales() {
    return this.getAttribute('locales');
  }
  /**
   * A string with a BCP 47 language tag, or an array of such strings.
   * For the general form and interpretation of the locales argument,
   * see the Intl page.
   * The following Unicode extension keys are allowed:
   * - nu - Numbering system. Possible values include: "arab", "arabext",
   * "bali", "beng", "deva", "fullwide", "gujr", "guru", "hanidec", "khmr",
   * "knda", "laoo", "latn", "limb", "mlym", "mong", "mymr", "orya",
   * "tamldec", "telu", "thai", "tibt".
   * - ca - Calendar. Possible values include: "buddhist", "chinese",
   * "coptic", "ethioaa", "ethiopic", "gregory", "hebrew", "indian",
   * "islamic", "islamicc", "iso8601", "japanese", "persian", "roc".
   *
   * @param {String} v
   * @type {String}
   */
  set locales(v) {
    this.setAttribute('locales', v);
  }
  /**
   * The representation of the year.
   * Possible values are "numeric", "2-digit".
   */
  get year() {
    return this.getAttribute('year');
  }
  /**
   * The representation of the year.
   * @param {String} v Possible values are "numeric", "2-digit".
   */
  set year(v) {
    this.setAttribute('year', v);
  }
  /**
   * The representation of the month.
   * Possible values are "numeric", "2-digit", "narrow", "short", "long".
   */
  get month() {
    return this.getAttribute('month');
  }
  /**
   * The representation of the month.
   * @param {String} v Possible values are "numeric", "2-digit", "narrow", "short", "long".
   */
  set month(v) {
    this.setAttribute('month', v);
  }
  /**
   * The representation of the day.
   * Possible values are "numeric", "2-digit".
   */
  get day() {
    return this.getAttribute('day');
  }
  /**
   * The representation of the day.
   * @param {String} v Possible values are "numeric", "2-digit".
   */
  set day(v) {
    this.setAttribute('day', v);
  }
  /**
   * The representation of the hour.
   * Possible values are "numeric", "2-digit".
   */
  get hour() {
    return this.getAttribute('hour');
  }
  /**
   * The representation of the hour.
   * @param {String} v Possible values are "numeric", "2-digit".
   */
  set hour(v) {
    this.setAttribute('hour', v);
  }
  /**
   * The representation of the minute.
   * Possible values are "numeric", "2-digit".
   */
  get minute() {
    return this.getAttribute('minute');
  }
  /**
   * The representation of the minute.
   * @param {String} v Possible values are "numeric", "2-digit".
   */
  set minute(v) {
    this.setAttribute('minute', v);
  }
  /**
   * The representation of the second.
   * Possible values are "numeric", "2-digit".
   */
  get second() {
    return this.getAttribute('second');
  }
  /**
   * The representation of the second.
   * @param {String} v Possible values are "numeric", "2-digit".
   */
  set second(v) {
    this.setAttribute('second', v);
  }
  /**
   * The representation of the weekday.
   * Possible values are "narrow", "short", "long".
   */
  get weekday() {
    return this.getAttribute('weekday');
  }
  /**
   * The representation of the weekday.
   * @param {String} v Possible values are "narrow", "short", "long".
   */
  set weekday(v) {
    this.setAttribute('weekday', v);
  }
  /**
   * The representation of the time zone name.
   *
   * Possible values are "short", "long".
   */
  get timeZoneName() {
    return this.getAttribute('time-zone-name');
  }
  /**
   * The representation of the time zone name.
   *
   * @param {String} v Possible values are "short", "long".
   */
  set timeZoneName(v) {
    this.setAttribute('time-zone-name', v);
  }
  /**
   * The time zone to use. The only value implementations must recognize
   * is "UTC"; the default is the runtime's default time zone.
   * Implementations may also recognize the time zone names of the IANA
   * time zone database, such as "Asia/Shanghai", "Asia/Kolkata",
   * "America/New_York".
   */
  get timeZone() {
    return this.getAttribute('time-zone');
  }
  /**
   * The time zone to use. The only value implementations must recognize
   * is "UTC"; the default is the runtime's default time zone.
   * Implementations may also recognize the time zone names of the IANA
   * time zone database, such as "Asia/Shanghai", "Asia/Kolkata",
   * "America/New_York".
   * @param {String} v
   */
  set timeZone(v) {
    this.setAttribute('time-zone', v);
  }
  /**
   * The representation of the era.
   *
   * Possible values are "narrow", "short", "long".
   */
  get era() {
    return this.getAttribute('era');
  }
  /**
   * The representation of the era.
   *
   * @param {String} v Possible values are "narrow", "short", "long".
   */
  set era(v) {
    this.setAttribute('era', v);
  }
  /**
   * Whether to use 12-hour time (as opposed to 24-hour time).
   * Possible values are `true` and `false`; the default is locale
   * dependent.
   *
   * @type {Boolean}
   */
  get hour12() {
    if (!this.hasAttribute('hour12') && !this.__hour12set) {
      return null;
    }
    return this.hasAttribute('hour12');
  }
  /**
   * Whether to use 12-hour time (as opposed to 24-hour time).
   * Possible values are `true` and `false`; the default is locale
   * dependent.
   *
   * @param {Boolean} v
   */
  set hour12(v) {
    this.__hour12set = true;
    if (v) {
      this.setAttribute('hour12', '');
    } else {
      this.removeAttribute('hour12');
    }
  }
  /**
   * A date object to render.
   * It can be a `Date` object, number representing a timestamp
   * or valid date string. The argument is parsed by `Date` constructor
   * to produce the value.
   *
   * @type {Date|String|number}
   */
  get date() {
    if (this.__date) {
      return this.__date;
    }
    return this.getAttribute('date');
  }
  /**
   * A date object to render.
   * It can be a `Date` object, number representing a timestamp
   * or valid date string. The argument is parsed by `Date` constructor
   * to produce the value.
   *
   * @param {Date|String|number} v The date to render
   */
  set date(v) {
    this.__date = v;
    if (typeof v === 'string') {
      this.setAttribute('date', v);
    } else {
      this._updateLabel();
    }
  }

  get itemprop() {
    return this._getTimeNode().getAttribute('itemprop');
  }

  set itemprop(value) {
    const old = this.itemprop;
    if (old === value) {
      return;
    }
    if (old && value === null) {
      // This setter moves attribute from this element to "<time>" elsement.
      // When the attribute is removed from this then it becomes null.
      return;
    }
    const node = this._getTimeNode();
    if (value) {
      node.setAttribute('itemprop', value);
      this.removeAttribute('itemprop');
    } else {
      node.removeAttribute('itemprop');
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'itemprop') {
      this[name] = newValue;
      return;
    }
    this._updateLabel();
  }
  /**
   * Parses input `date` to a Date object.
   * @param {String|Number|Date} date A date to parse
   * @return {Date}
   */
  _getParsableDate(date) {
    if (!date) {
      date = new Date();
    } else if (typeof date === 'string') {
      try {
        date = new Date(date);
        const _test = date.getDate();
        if (_test !== _test) {
          date = new Date();
        }
      } catch (e) {
        date = new Date();
      }
    } else if (!isNaN(date)) {
      date = new Date(date);
    } else if (!(date instanceof Date)) {
      date = new Date();
    }
    return date;
  }

  _getIntlOptions() {
    const options = {};
    if (this.year) {
      options.year = this.year;
    }
    if (this.month) {
      options.month = this.month;
    }
    if (this.day) {
      options.day = this.day;
    }
    if (this.hour) {
      options.hour = this.hour;
    }
    if (this.minute) {
      options.minute = this.minute;
    }
    if (this.second) {
      options.second = this.second;
    }
    if (this.weekday) {
      options.weekday = this.weekday;
    }
    if (this.era) {
      options.era = this.era;
    }
    if (this.timeZoneName) {
      options.timeZoneName = this.timeZoneName;
    }
    if (this.timeZone) {
      options.timeZone = this.timeZone;
    }
    if (this.hour12 !== undefined) {
      options.hour12 = this.hour12;
    }
    return options;
  }
  /**
   * @return {Element} A reference to a `<time>` element that is in the shadow DOM of this element.
   */
  _getTimeNode() {
    let node = this.shadowRoot.querySelector('time');
    if (!node) {
      node = document.createElement('time');
      this.shadowRoot.appendChild(node);
    }
    return node;
  }

  _updateLabel() {
    if (!this.parentElement) {
      return;
    }
    const date = this._getParsableDate(this.date);
    const node = this._getTimeNode();
    node.setAttribute('datetime', date.toISOString());
    /* istanbul ignore if */
    if (typeof Intl === 'undefined') {
      node.innerText = date.toString();
      return;
    }
    let locales;
    if (this.locales) {
      locales = this.locales;
    }
    const options = this._getIntlOptions();
    const value = new Intl.DateTimeFormat(locales, options).format(date);
    node.innerText = value;
  }
}
window.customElements.define('date-time', DateTime);
