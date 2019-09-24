import { css } from 'lit-element';

export const hostDefaultStyles = css`
--method-label-default-background-color: rgba(128, 128, 128, 0.12);
--method-label-default-color: rgb(128, 128, 128);
`;

export const labelCommon = css`
display: inline-block;
margin: var(--http-method-label-margin, 0px 8px 8px 0px);
padding: var(--http-method-label-padding, 2px 6px);
background-color: var(--http-method-label-background-color, var(--method-label-default-background-color));
color: var(--http-method-label-color, var(--method-label-default-color));
text-transform: uppercase;
border-radius: var(--http-method-label-border-radius, 3px);
font-weight: var(--http-method-label-font-weigth, 400);
font: inherit;
font-size: inherit;
`;

export const labelGet = css`
background-color: var(--http-method-label-get-background-color, rgba(0, 128, 0, 0.12));
color: var(--http-method-label-get-color, rgb(0, 128, 0));
`;

export const labelPost = css`
background-color: var(--http-method-label-post-background-color, rgba(33, 150, 243, 0.12));
color: var(--http-method-label-post-color, rgb(33, 150, 243));
`;

export const labelPut = css`
background-color: var(--http-method-label-put-background-color, rgba(255, 165, 0, 0.12));
color: var(--http-method-label-put-color, rgb(255, 165, 0));
`;

export const labelDelete = css`
background-color: var(--http-method-label-delete-background-color, rgba(244, 67, 54, 0.12));
color: var(--http-method-label-delete-color, rgb(244, 67, 54));
`;

export const labelPatch = css`
background-color: var(--http-method-label-patch-background-color, rgba(156, 39, 176, 0.12));
color: var(--http-method-label-patch-color, rgb(156, 39, 176));
`;

export const labelOptions = css`
background-color: var(--http-method-label-options-background-color, var(--method-label-default-background-color));
color: var(--http-method-label-options-color, var(--method-label-default-color));
`;

export const labelHead = css`
background-color: var(--http-method-label-head-background-color, var(--method-label-default-background-color));
color: var(--http-method-label-head-color, var(--method-label-default-color));
`;

export const labelTrace = css`
background-color: var(--http-method-label-trace-background-color, var(--method-label-default-background-color));
color: var(--http-method-label-trace-color, var(--method-label-default-color));
`;

export const labelConnect = css`
background-color: var(--http-method-label-connect-background-color, var(--method-label-default-background-color));
color: var(--http-method-label-connect-color, var(--method-label-default-color));
`;

export default css`
:host {
  ${hostDefaultStyles}
}

.method-label {
  ${labelCommon}
}

.method-label[data-method="get"],
.method-label[data-method="GET"] {
  ${labelGet}
}

.method-label[data-method="post"],
.method-label[data-method="POST"] {
  ${labelPost}
}

.method-label[data-method="put"],
.method-label[data-method="PUT"] {
  ${labelPut}
}

.method-label[data-method="delete"],
.method-label[data-method="DELETE"] {
  ${labelDelete}
}

.method-label[data-method="patch"],
.method-label[data-method="PATCH"] {
  ${labelPatch}
}

.method-label[data-method="options"],
.method-label[data-method="OPTIONS"] {
  ${labelOptions}
}

.method-label[data-method="head"],
.method-label[data-method="HEAD"] {
  ${labelHead}
}

.method-label[data-method="trace"],
.method-label[data-method="TRACE"] {
  ${labelTrace}
}

.method-label[data-method="connect"],
.method-label[data-method="CONNECT"] {
  ${labelConnect}
}
`;
