const AmfHelper = {};
AmfHelper.getEndpoint = function(element, amf, path) {
  const webApi = element._computeWebApi(amf);
  return element._computeEndpointByPath(webApi, path);
};

AmfHelper.getMethod = function(element, amf, path, method) {
  const endPoint = AmfHelper.getEndpoint(element, amf, path);
  const opKey = element._getAmfKey(element.ns.w3.hydra.supportedOperation);
  const ops = element._ensureArray(endPoint[opKey]);
  return ops.find((item) => element._getValue(item, element.ns.w3.hydra.core + 'method') === method);
};
