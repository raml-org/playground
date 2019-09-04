const AmfLoader = {};
AmfLoader.load = function(endpointIndex, operationIndex, compact) {
  endpointIndex = endpointIndex || 0;
  operationIndex = operationIndex || 0;
  const file = '/demo-api' + (compact ? '-compact' : '') + '.json';
  const url = location.protocol + '//' + location.host +
    location.pathname.substr(0, location.pathname.lastIndexOf('/'))
    .replace('/test', '/demo') + file;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', (e) => {
      let data;
      try {
        data = JSON.parse(e.target.response);
      } catch (e) {
        reject(e);
        return;
      }
      const ns = ApiElements.Amf.ns;
      const original = data;
      if (data instanceof Array) {
        data = data[0];
      }
      const encKey = compact ? 'doc:encodes' :
        ns.raml.vocabularies.document + 'encodes';
      let encodes = data[encKey];
      if (encodes instanceof Array) {
        encodes = encodes[0];
      }
      const endKey = compact ? 'raml-http:endpoint' :
        ns.raml.vocabularies.http + 'endpoint';
      let endpoints = encodes[endKey];
      if (endpoints && !(endpoints instanceof Array)) {
        endpoints = [endpoints];
      }
      const endpoint = endpoints[endpointIndex];
      const opKey = compact ? 'hydra:supportedOperation' :
        ns.w3.hydra.core + 'supportedOperation';
      let methods = endpoint[opKey];
      if (!(methods instanceof Array)) {
        methods = [methods];
      }
      const method = methods[operationIndex];
      resolve([original, method]);
    });
    xhr.addEventListener('error',
      () => reject(new Error('Unable to load model file')));
    xhr.open('GET', url);
    xhr.send();
  });
};
