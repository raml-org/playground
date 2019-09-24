import '@anypoint-web-components/anypoint-styles/colors.js';

import { css } from 'lit-element';
export default css`
  :host,
  .anypoint-item {
    display: block;
    position: relative;
    min-height: var(--anypoint-item-min-height, 48px);
    padding: var(--anypoint-item-padding, 0px 12px);
    cursor: pointer;

    -webkit-transition: background-color 0.16s ease-in-out 0s;
    transition: background-color 0.16s ease-in-out 0s;
  }

  :host([compatibility]),
  .anypoint-item[compatibility] {
    padding: var(--anypoint-item-padding, 0px 10px);
    min-height: var(--anypoint-item-min-height, 40px);

    border-left-width: 2px;
    border-right-width: 2px;
    border-left-color: var(--anypoint-item-border-left-color, var(--anypoint-color-aluminum4));
    border-right-color: var(--anypoint-item-border-right-color, var(--anypoint-color-aluminum4));
    border-left-style: solid;
    border-right-style: solid;
  }

  :host([compatibility]:hover),
  .anypoint-item[compatibility]:hover {
    color: var(--anypoint-item-focus-color, var(--anypoint-color-coreBlue3));
    border-left-color: var(
      --anypoint-item-border-left-hover-color,
      var(--anypoint-color-coreBlue3)
    );
    border-right-color: var(
      --anypoint-item-border-right-hover-color,
      var(--anypoint-color-coreBlue3)
    );
    background-color: var(--anypoint-item-hover-background-color, initial);
  }

  :host(:hover),
  .anypoint-item:hover {
    background-color: var(--anypoint-item-hover-background-color, #F5F5F5);
  }

  :host(:focus),
  .anypoint-item:focus {
    position: relative;
    outline: 0;
    background-color: var(--anypoint-item-focused-background-color, initial);
    font-weight: var(--anypoint-item-focused-font-weight, initial);
  }

  :host([compatibility]:focus),
  .anypoint-item[compatibility]:focus {
    color: var(--anypoint-item-focused-color, var(--anypoint-color-coreBlue3));
  }

  :host(:focus):before,
  .anypoint-item:focus:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--anypoint-item-before-background, currentColor);
    content: '';
    opacity: var(--anypoint-item-before-opacity, var(--dark-divider-opacity));
    pointer-events: none;
  }

  :host([compatibility]:focus):before,
  .anypoint-item[compatibility]:focus:before {
    background: var(--anypoint-item-before-background);
    opacity: var(--anypoint-item-before-opacity);
  }

  .anypoint-item {
    outline: none;
    width: 100%;
    text-align: left;
  }

  :host([hidden]),
  .anypoint-item[hidden] {
    display: none !important;
  }

  :host(.iron-selected),
  :host(.selected),
  .anypoint-item.iron-selected,
  .anypoint-item.selected {
    font-weight: var(--anypoint-item-selected-weight, bold);
  }

  :host([disabled]),
  .anypoint-item[disabled] {
    color: var(--anypoint-item-disabled-color, var(--disabled-text-color));
  }

  :host([pressed]),
  .anypoint-item[pressed],
  .anypoint-item.pressed {
    position: relative;
    outline: 0;
    background-color: var(--anypoint-item-pressed-background-color, #BDBDBD);
  }

  :host([compatibility][pressed]),
  .anypoint-item[compatibility][pressed],
  .anypoint-item[compatibility].pressed {
    background-color: var(--anypoint-item-pressed-background-color, initial);
  }
`;
