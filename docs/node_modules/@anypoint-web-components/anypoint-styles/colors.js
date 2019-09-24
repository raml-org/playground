import { css } from 'lit-element';
const style = css`
  html {
    --anypoint-color-primary: #00a2df;
    --anypoint-color-secondary: #506773;
    --anypoint-color-danger: #d1344e;
    --anypoint-color-success: #17bc65;
    --anypoint-color-tertiary: #ffffff;

    --anypoint-color-coreBlue1: #abe2f5;
    --anypoint-color-coreBlue2: #48c1ed;
    --anypoint-color-coreBlue3: #00a2df;
    --anypoint-color-coreBlue4: #087299;
    --anypoint-color-coreBlue5: #114459;

    --anypoint-color-robustBlue1: #a1b1b8;
    --anypoint-color-robustBlue2: #6b8a99;
    --anypoint-color-robustBlue3: #506773;
    --anypoint-color-robustBlue4: #32444d;
    --anypoint-color-robustBlue5: #272f33;

    --anypoint-color-futureGreen1: #aaf2cb;
    --anypoint-color-futureGreen2: #33cc7a;
    --anypoint-color-futureGreen3: #17bc65;
    --anypoint-color-futureGreen4: #0e8c48;
    --anypoint-color-futureGreen5: #174d30;

    --anypoint-color-aluminum1: #f9fafb;
    --anypoint-color-aluminum2: #f4f5f6;
    --anypoint-color-aluminum3: #e8e9ea;
    --anypoint-color-aluminum4: #cacbcc;
    --anypoint-color-aluminum5: #989a9b;

    --anypoint-color-steel1: #6b6c6d;
    --anypoint-color-steel2: #58595a;
    --anypoint-color-steel3: #3a3b3c;
    --anypoint-color-steel4: #262728;
    --anypoint-color-steel5: #121314;

    --anypoint-color-yellow3: #f2be24;
    --anypoint-color-viridian3: #00b49d;
    --anypoint-color-teal3: #00b5d1;
    --anypoint-color-navy3: #178bea;
    --anypoint-color-indigo3: #5e66f9;
    --anypoint-color-violet3: #9a63f9;
    --anypoint-color-red3: #d1344e;
  }
`;

try {
  document.adoptedStyleSheets = document.adoptedStyleSheets.concat(style.styleSheet);
} catch (_) {
  /* istanbul ignore next */
  {
    const s = document.createElement('style');
    s.type = 'text/css';
    s.innerHTML = style.cssText;
    document.getElementsByTagName('head')[0].appendChild(s);
  }
}
