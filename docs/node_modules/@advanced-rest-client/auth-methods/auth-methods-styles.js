import { css } from 'lit-element';
export default css `
anypoint-input,
anypoint-masked-input {
  width: auto;
  display: block;
}

.edit-icon {
  visibility: hidden;
}

[hidden] {
  display: none !important;
}

.adv-toggle {
  margin-top: 8px;
}

.markdown-body,
.docs-container {
  font-size: var(--arc-font-body1-font-size);
  font-weight: var(--arc-font-body1-font-weight);
  line-height: var(--arc-font-body1-line-height);
  color: var(--inline-documentation-color, rgba(0, 0, 0, 0.87));
}

arc-marked {
  background-color: var(--inline-documentation-background-color, #FFF3E0);
  padding: 4px;
}

.markdown-body p:first-child {
  margin-top: 0;
  padding-top: 0;
}

.markdown-body p:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
}

.form-title {
  font-size: 1.25rem;
  margin: 12px 8px;
}

.subtitle {
  font-size: var(--arc-font-subhead-font-size);
  font-weight: var(--arc-font-subhead-font-weight);
  line-height: var(--arc-font-subhead-line-height);
  margin: 12px 8px;
}

anypoint-input,
anypoint-masked-input {
  margin: 20px 8px;
}

.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  fill: currentColor;
}
`;
