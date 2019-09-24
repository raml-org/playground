/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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
import { LitElement, html, css } from 'lit-element';
import '@polymer/paper-progress/paper-progress.js';
import '@advanced-rest-client/date-time/date-time.js';
/* eslint-disable max-len */
/**
 * An element to display request timings information as a timeline according to the HAR 1.2 spec.
 *
 * The `timings` property should contain timings object as defined in
 * [HAR 1.2 spec](https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html#sec-object-types-timings).
 *
 * The timings object is consisted of:
 * - **blocked** [number, optional] - Time spent in a queue waiting for a network connection. Use -1 if the timing does not apply to the current request.
 * - **dns** [number, optional] - DNS resolution time. The time required to resolve a host name. Use -1 if the timing does not apply to the current request.
 * - **connect** [number, optional] - Time required to create TCP connection. Use -1 if the timing does not apply to the current request.
 * - **send** [number] - Time required to send HTTP request to the server.
 * - **wait** [number] - Waiting for a response from the server.
 * - **receive** [number] - Time required to read entire response from the server (or cache).
 * - **ssl** [number, optional] - Time required for SSL/TLS negotiation. If this field is defined then the time is also included in the connect field (to ensure backward compatibility with HAR 1.1). Use -1 if the timing does not apply to the current request.
 *
 * Additionally the object can contain the `startTime` property that indicates
 * the request start time. If can be Date object, timestamp or formatted string
 * representing a date.
 *
 * The timeline for `connect`, `send`, `wait` and `receive` are always shown.
 * `blocked`, `dns` and `ssl` are visible only if values for it was set and value
 * was > 0.
 *
 * ### Example
 *
 * ```html
 * <request-timings timings="[[requestTimings]]"></request-timings>
 *```
 *
 * ### Styling
 * `<request-timings>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--request-timings` | Mixin applied to the element | `{}`
 * `--select-text` | Mixin applied to the text elements that should have text selection enabled (in some platforms text selection is disabled by default) | `{}`
 * `--form-label` | Mixin applied to labels elements | `{}`
 * `--request-timings-progress-height` | The height of the progress bar | `12px`
 * `--request-timings-progress-background` | Background color of the progress bar. | `#F5F5F5`
 * `--request-timings-progress-color` | Color of the progress bar. | `#4a4`
 * `--request-timings-label-width` | Width of the label | `160px`
 * `--request-timings-value-width` | Width of the value column | `120px`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof UiElements
 */
class RequestTimings extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        --paper-progress-height: var(--request-timings-progress-height, 12px);
        --paper-progress-container-color: var(--request-timings-progress-background, #f5f5f5);
        --paper-progress-active-color: var(--request-timings-progress-background, #f5f5f5);
        --paper-progress-secondary-color: var(--request-timings-progress-color, #4a4);
      }

      .row {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      paper-progress {
        flex: 1;
        flex-basis: 0.000000001px;
      }

      .label,
      .date-value {
        user-select: text;
        cursor: text;
      }

      .label {
        margin-right: 8px;
      }

      .timing-label {
        width: var(--request-timings-label-width, 160px);
      }

      .timing-value {
        width: var(--request-timings-value-width, 120px);
        text-align: right;
        user-select: text;
        cursor: text;
      }

      .total {
        margin-top: 12px;
        padding-top: 12px;
        font-weight: 500;
        border-top: 2px var(--paper-grey-200, rgba(255, 0, 0, 0.74)) solid;
      }

      .row.is-total {
        justify-content: flex-end;
      }

      :host([narrow]) .row {
        flex-direction: column;
        align-items: start;
        margin: 8px 0;
      }

      :host([narrow]) paper-progress {
        width: 100%;
        flex: auto;
        order: 3;
      }

      :host([narrow]) .timing-value {
        text-align: left;
        order: 2;
      }

      :host([narrow]) .timing-label {
        order: 1;
        width: auto;
      }
    `;
  }

  render() {
    const {
      _startTime: startTime,
      _blocked: blocked,
      _fullTime: fullTime,
      _dns: dns,
      _connect: connect,
      _ssl: ssl,
      _send: send,
      _wait: wait,
      _receive: receive
    } = this;
    const hasStartTime = this._hasValue(startTime);
    const hasBlockedTime = this._hasValue(blocked);
    const hasDnsTime = this._hasValue(dns);
    const hasConnectTime = this._hasValue(connect);
    const hasSslTime = this._hasValue(ssl);
    const hasSendTime = this._hasValue(send);
    const hasWaitTime = this._hasValue(wait);
    const hasReceiveTime = this._hasValue(receive);
    const blockedProgressValue = this._computeSum(blocked);
    const ttcProgressValue = this._computeSum(blocked, dns);
    const sslProgressValue = this._computeSum(ttcProgressValue, connect);
    const sendProgressValue = this._computeSum(sslProgressValue, ssl);
    const ttfbProgressValue = this._computeSum(sendProgressValue, send);
    const receiveProgressValue = this._computeSum(ttfbProgressValue, wait);
    const receive2ProgressValue = this._computeSum(receiveProgressValue, receive);

    return html`
      ${hasStartTime
        ? html`
            <div class="row" data-type="start-time">
              <span class="label">Start date:</span>
              <date-time
                year="numeric"
                month="numeric"
                day="numeric"
                hour="numeric"
                minute="numeric"
                second="numeric"
                class="date-value"
                .date="${startTime}"
              ></date-time>
            </div>
          `
        : undefined}
      ${hasBlockedTime
        ? html`
            <div class="row" data-type="block-time">
              <div class="timing-label label">
                Queueing:
              </div>
              <paper-progress
                aria-label="Queueing time"
                value="0"
                .secondaryProgress="${blocked}"
                .max="${fullTime}"
                step="0.0001"
              ></paper-progress>
              <span class="timing-value">${this._round(blocked)} ms</span>
            </div>
          `
        : undefined}
      ${hasDnsTime
        ? html`
            <div class="row" data-type="dns-time">
              <div class="timing-label label">
                DNS Lookup:
              </div>
              <paper-progress
                aria-label="DNS lookup time"
                .value="${blockedProgressValue}"
                .secondaryProgress="${ttcProgressValue}"
                .max="${fullTime}"
                step="0.0001"
              ></paper-progress>
              <span class="timing-value">${this._round(dns)} ms</span>
            </div>
          `
        : undefined}
      ${hasConnectTime
        ? html`
            <div class="row" data-type="ttc-time">
              <div class="timing-label label">
                Time to connect:
              </div>
              <paper-progress
                aria-label="Time to connect"
                .value="${ttcProgressValue}"
                .secondaryProgress="${sslProgressValue}"
                .max="${fullTime}"
                step="0.0001"
              ></paper-progress>
              <span class="timing-value">${this._round(connect)} ms</span>
            </div>
          `
        : undefined}
      ${hasSslTime
        ? html`
            <div class="row" data-type="ssl-time">
              <div class="timing-label label">
                SSL negotiation:
              </div>
              <paper-progress
                aria-label="SSL negotiation time"
                .value="${sslProgressValue}"
                .secondaryProgress="${sendProgressValue}"
                .max="${fullTime}"
                step="0.0001"
              ></paper-progress>
              <span class="timing-value">${this._round(ssl)} ms</span>
            </div>
          `
        : undefined}
      ${hasSendTime
        ? html`
            <div class="row" data-type="send-time">
              <div class="timing-label label">
                Send time:
              </div>
              <paper-progress
                aria-label="Send time"
                value="${sendProgressValue}"
                .secondaryProgress="${ttfbProgressValue}"
                .max="${fullTime}"
                step="0.0001"
              ></paper-progress>
              <span class="timing-value">${this._round(send)} ms</span>
            </div>
          `
        : undefined}
      ${hasWaitTime
        ? html`
            <div class="row" data-type="ttfb-time">
              <div class="timing-label label">
                Wait time (TTFB):
              </div>
              <paper-progress
                aria-label="Time to first byte"
                .value="${ttfbProgressValue}"
                .secondaryProgress="${receiveProgressValue}"
                .max="${fullTime}"
                step="0.0001"
              ></paper-progress>
              <span class="timing-value">${this._round(wait)} ms</span>
            </div>
          `
        : undefined}
      ${hasReceiveTime
        ? html`
            <div class="row" data-type="receive-time">
              <div class="timing-label label">
                Content download:
              </div>
              <paper-progress
                aria-label="Receiving time"
                .value="${receiveProgressValue}"
                .secondaryProgress="${receive2ProgressValue}"
                .max="${fullTime}"
                step="0.0001"
              ></paper-progress>
              <span class="timing-value">${this._round(receive)} ms</span>
            </div>
          `
        : undefined}
      <div class="row is-total">
        <span class="timing-value total">${this._round(fullTime)} ms</span>
      </div>
    `;
  }

  static get properties() {
    return {
      /**
       * A timings object as described in HAR 1.2 spec.
       */
      timings: { type: Object },
      /**
       * Request stat time. It can be either Date object,
       * timestamp or a string representing the date.
       *
       * If the `timings` property contains the `startTime` property it
       * will be overwritten.
       *
       * @type {String|Date}
       */
      _startTime: {},
      /**
       * Computed value. Calculated full time of the request and response
       */
      _fullTime: { type: Number },
      // Computed value. Time required to establish the connection
      _connect: { type: Number },

      // Computed value. Time of receiving data from the remote machine.
      _receive: { type: Number },
      // Computed value. Time to send data to the remote machine.
      _send: { type: Number },
      // Computed value. Wait time for the first byte to arrive.
      _wait: { type: Number },
      // Computed value. Time spent in a queue waiting for a network connection
      _blocked: { type: Number },
      // Computed value. DNS resolution time.
      _dns: { type: Number },
      // Computed value. Time required for SSL/TLS negotiation.
      _ssl: { type: Number }
    };
  }

  get timings() {
    return this._timings;
  }

  set timings(value) {
    const old = this._timings;
    if (old === value) {
      return;
    }
    this._timings = value;
    this._update(value);
  }

  // Updates the view after `timings` change.
  _update() {
    const timings = this.timings || {};
    let fullTime = 0;
    let connect = Number(timings.connect);
    let receive = Number(timings.receive);
    let send = Number(timings.send);
    let wait = Number(timings.wait);
    let blocked = Number(timings.blocked);
    let dns = Number(timings.dns);
    let ssl = Number(timings.ssl);
    if (connect !== connect || connect < 0) {
      connect = 0;
    }
    if (receive !== receive || receive < 0) {
      receive = 0;
    }
    if (send !== send || send < 0) {
      send = 0;
    }
    if (wait !== wait || wait < 0) {
      wait = 0;
    }
    if (dns !== dns || dns < 0) {
      dns = -1;
    }
    if (blocked !== blocked || blocked < 0) {
      blocked = -1;
    }
    if (ssl !== ssl || ssl < 0) {
      ssl = -1;
    }
    fullTime += connect + receive + send + wait;
    if (dns > 0) {
      fullTime += dns;
    }
    if (blocked > 0) {
      fullTime += blocked;
    }
    if (ssl > 0) {
      fullTime += ssl;
    }
    this._fullTime = fullTime;
    this._connect = connect;
    this._receive = receive;
    this._send = send;
    this._wait = wait;
    this._dns = dns;
    this._blocked = blocked;
    this._ssl = ssl;
    if (timings.startTime) {
      this._startTime = timings.startTime;
    } else {
      this._startTime = this._startTime || -1;
    }
  }
  /**
   * Round numeric value to presision defined in the `power` argument.
   *
   * @param {Number} value The value to round
   * @return {Number} Rounded value.
   */
  _round(value) {
    value = Number(value);
    if (value !== value) {
      return 'unknown';
    }
    const factor = Math.pow(10, 4);
    return Math.round(value * factor) / factor;
  }
  /**
   * Sums two HAR times.
   * If any argument is `undefined` or `-1` then `0` is assumed.
   * @param {Number} a Time #1
   * @param {Number} b Time #2
   * @return {Number} Sum of both
   */
  _computeSum(a, b) {
    if (a === undefined) {
      a = 0;
    } else {
      a = Number(a);
      if (a < 0) {
        a = 0;
      }
    }
    if (b === undefined) {
      b = 0;
    } else {
      b = Number(b);
      if (b < 0) {
        b = 0;
      }
    }
    return a + b;
  }

  _hasValue(num) {
    if (num === undefined) {
      return false;
    }
    if (typeof num === 'string') {
      return !!num;
    }
    return num > 0;
  }
}
window.customElements.define('request-timings', RequestTimings);
