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
import { css } from 'lit-element';
export default css`
.status-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: var(--arc-font-subhead-font-size);
  font-weight: var(--arc-font-subhead-font-weight);
  line-height: var(--arc-font-subhead-line-height);
  min-height: 56px;
  padding: 20px 0;
}

:host([narrow]) .status-row {
  align-items: start;
  flex-direction: column;
}

.status-value {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
}

.status-value > span {
  display: block;
}

.status-value.status.text > span:not(:first-child) {
  margin-left: 8px;
}

.text {
  user-select: text;
}

headers-list-view {
  margin-top: 12px;
}

.status-code-value {
  padding: 4px 8px;
  color: var(--response-status-view-code-value-color, #fff);
  border-radius: 3px;
  display: block;
  background-color: var(--arc-status-code-color-200, rgb(36, 107, 39));
}

.info.status-code-value {
  background-color: var(--arc-status-code-color-300, rgb(48, 63, 159));
}

.warning.status-code-value {
  background-color: var(--arc-status-code-color-400, rgb(171, 86, 0));
}

.error.status-code-value {
  background-color: var(--arc-status-code-color-500, rgb(211, 47, 47));
}

.no-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-info {
  font-style: italic;
}`;
