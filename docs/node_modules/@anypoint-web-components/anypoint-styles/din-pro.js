import { css } from 'lit-element';
/* eslint-disable max-len */
const style = css`
  html {
    @font-face {
      font-family: 'DIN Pro';
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/DINPro-Light.eot');
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/DINPro-Light.woff2') format('woff2'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/DINPro-Light.woff') format('woff'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/DINPro-Light.ttf') format('truetype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/DINPro-Light.svg') format('svg');
      font-weight: 300;
      font-style: normal;
    }
    /* Regular - OpenSans */
    @font-face {
      font-family: 'Open Sans';
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Regular.eot');
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Regular.eot?#iefix')
          format('embedded-opentype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Regular.woff2') format('woff2'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Regular.woff') format('woff'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Regular.ttf') format('truetype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Regular.svg') format('svg');
      font-weight: 400;
      font-style: normal;
    }
    /* Semibold - OpenSansSemiBold */
    @font-face {
      font-family: 'Open Sans';
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Semibold.eot');
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Semibold.eot?#iefix')
          format('embedded-opentype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Semibold.woff2') format('woff2'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Semibold.woff') format('woff'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Semibold.ttf') format('truetype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Semibold.svg') format('svg');
      font-weight: 600;
      font-style: normal;
    }
    /* Bold - OpenSansBold */
    @font-face {
      font-family: 'Open Sans';
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Bold.eot');
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Bold.eot?#iefix')
          format('embedded-opentype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Bold.woff2') format('woff2'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Bold.woff') format('woff'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Bold.ttf') format('truetype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Bold.svg') format('svg');
      font-weight: 700;
      font-style: normal;
    }
    /* Light - OpenSansLight */
    @font-face {
      font-family: 'Open Sans';
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Light.eot');
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Light.eot?#iefix')
          format('embedded-opentype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Light.woff2') format('woff2'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Light.woff') format('woff'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Light.ttf') format('truetype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-Light.svg') format('svg');
      font-weight: 200;
      font-style: normal;
    }
    /* Light Italic - OpenSansLightItalic */
    @font-face {
      font-family: 'Open Sans';
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-LightItalic.eot');
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-LightItalic.eot?#iefix')
          format('embedded-opentype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-LightItalic.woff2')
          format('woff2'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-LightItalic.woff') format('woff'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-LightItalic.ttf')
          format('truetype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/OpenSans-LightItalic.svg') format('svg');
      font-weight: 200;
      font-style: italic;
    }
    /* Monospaced (for code examples, logs, etc) */
    @font-face {
      font-family: 'Source Code Pro';
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/SourceCodePro-Regular.eot');
      src: url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/SourceCodePro-Regular.eot?#iefix')
          format('embedded-opentype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/SourceCodePro-Regular.woff2')
          format('woff2'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/SourceCodePro-Regular.woff') format('woff'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/SourceCodePro-Regular.ttf')
          format('truetype'),
        url('https://cdn.anypoint.mulesoft.com/artifacts/anypoint-styles/fonts/SourceCodePro-Regular.svg') format('svg');
      font-weight: 400;
      font-style: normal;
    }
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
