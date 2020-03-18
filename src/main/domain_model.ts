// Namespaces
export const HYDRA_NS: string = 'http://www.w3.org/ns/hydra/core#'
export const DOCUMENT_NS: string = 'http://a.ml/vocabularies/document#'
export const HTTP_NS: string = 'http://a.ml/vocabularies/http#'
export const SHAPES_NS: string = 'http://a.ml/vocabularies/shapes#'
export const RDF_NS: string = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
export const RDFS_NS: string = 'http://www.w3.org/2000/01/rdf-schema#'
export const SHACL_NS: string = 'http://www.w3.org/ns/shacl#'
export const XSD_NS: string = 'http://www.w3.org/2001/XMLSchema#'
export const CORE_NS: string = 'http://a.ml/vocabularies/core#'
export const META: string = 'http://a.ml/vocabularies/meta#'
export const MUSIC: string = 'http://mulesoft.com/vocabularies/music#'
export const MUSIC_CURATION: string = 'http://mulesoft.com/vocabularies/music_curation#'

export const NS_MAPPING = {}
NS_MAPPING[HYDRA_NS] = 'hydra'
NS_MAPPING[DOCUMENT_NS] = 'doc'
NS_MAPPING[HTTP_NS] = 'http'
NS_MAPPING[SHAPES_NS] = 'shapes'
NS_MAPPING[SHACL_NS] = 'shacl'
NS_MAPPING[RDF_NS] = 'rdf'
NS_MAPPING[RDFS_NS] = 'rdfs'
NS_MAPPING[XSD_NS] = 'xsd'
NS_MAPPING[CORE_NS] = 'core'
NS_MAPPING[META] = 'meta'
NS_MAPPING[MUSIC] = 'music'
NS_MAPPING[MUSIC_CURATION] = 'music-curation'

// RDF Classes
export const DOMAIN_ELEMENT: string = DOCUMENT_NS + 'DomainElement'
export const API_DOCUMENTATION: string = CORE_NS + 'WebAPI'
export const TRAIT: string = DOCUMENT_NS + 'Trait'
export const END_POINT: string = HTTP_NS + 'EndPoint'
export const OPERATION: string = HYDRA_NS + 'Operation'
export const RESPONSE: string = HTTP_NS + 'Response'
export const REQUEST: string = HTTP_NS + 'Request'
export const PAYLOAD: string = HTTP_NS + 'Payload'
export const SHAPE: string = SHACL_NS + 'Shape'
export const DOMAIN_PROPERTY_SCHEMA: string = DOCUMENT_NS + 'DomainPropertySchema'

// RDF Properties
export const LABEL: string = DOCUMENT_NS + 'label'
export const NAME: string = CORE_NS + 'name'
export const SHACL_NAME: string = SHACL_NS + 'name'
export const ENCODES: string = DOCUMENT_NS + 'encodes'
export const ENDPOINT: string = HTTP_NS + 'endpoint'
export const PATH: string = HTTP_NS + 'path'
export const SUPPORTED_OPERATION: string = HYDRA_NS + 'supportedOperation'
export const METHOD: string = HYDRA_NS + 'method'
export const RETURNS: string = HYDRA_NS + 'returns'
export const EXPECTS: string = HYDRA_NS + 'expects'
export const STATUS_CODE: string = HYDRA_NS + 'statusCode'
export const RESPONSE_PAYLOAD: string = HTTP_NS + 'payload'
export const MEDIA_TYPE: string = HTTP_NS + 'mediaType'
export const SCHEMA_SHAPE: string = HTTP_NS + 'shape'
export const PAYLOAD_SCHEMA: string = HTTP_NS + 'schema'
export const TARGET: string = DOCUMENT_NS + 'target'
export const DOMAIN: string = DOCUMENT_NS + 'domain'
export const RANGE: string = DOCUMENT_NS + 'range'

// Utility functions
export function extract_link (node: any, property: string) {
  return ((node[property] || [])[0]) || {}
}

export function extract_links (node: any, property: string) {
  return (node[property] || [])
}

export function extract_value (node: any, property: string) {
  const value = ((node[property] || [])[0]) || {}
  return value['@value']
}

export function has_type (node, type) {
  const types = node['@type'] || []
  return types.find(t => t === type) != null
}

// Model Classes
export type DomainElementKind = 'APIDocumentation'
  | 'EndPoint'
  | 'Operation'
  | 'Response'
  | 'Request'
  | 'Payload'
  | 'DomainElement'
  | 'Shape'
  | 'Include'
  | 'Extends'
  | 'DomainPropertySchema'
  | 'Trait';

export interface DomainModelElement {
    id: string;
    raw: any;
    label: string;
    kind: DomainElementKind;
}

export class DomainElement implements DomainModelElement {
    kind: DomainElementKind = 'DomainElement';
    constructor (public raw: any, public id: string, public label: string) {}
}

export class APIDocumentation extends DomainElement {
    kind: DomainElementKind = 'APIDocumentation';

    constructor (public raw: any, public id: string, public label: string, public endpoints: EndPoint[]) { super(raw, id, label) }
}

export class EndPoint extends DomainElement {
    kind: DomainElementKind = 'EndPoint';

    constructor (public raw: any, public id: string, public label: string, public path: string, public operations: Operation[]) { super(raw, id, label) }
}

export class Operation extends DomainElement {
    kind: DomainElementKind = 'Operation';

    constructor (public raw: any, public id: string, public label: string, public method: string, public requests: Request[], public responses: Response[]) { super(raw, id, label) }
}

export class Request extends DomainElement {
    kind: DomainElementKind = 'Request';

    constructor (public raw: any, public id: string, public label: string, public payloads: Payload[]) { super(raw, id, label) }
}

export class Response extends DomainElement {
    kind: DomainElementKind = 'Response';

    constructor (public raw: any, public id: string, public label: string, public status: string, public payloads: Payload[]) { super(raw, id, label) }
}

export class Payload extends DomainElement {
    kind: DomainElementKind = 'Payload';

    constructor (public raw: any, public id: string, public label: string, public mediaType: string, public schema: Shape | IncludeRelationship | undefined) { super(raw, id, label) }
}

export class Shape extends DomainElement {
    kind: DomainElementKind = 'Shape';

    constructor (public raw: any, public id: string, public label: string) { super(raw, id, label) }
}

export class IncludeRelationship extends DomainElement {
    kind: DomainElementKind = 'Include';

    constructor (public raw: any, public id, public target: string, public label: string) { super(raw, id, label) };
}

export class DomainPropertySchema extends DomainElement {
    kind: DomainElementKind = 'DomainPropertySchema';

    constructor (public raw: any, public id, public domain: string, public range: string, public label: string) { super(raw, id, label) }
}

export class Trait extends DomainElement {
    kind: DomainElementKind = 'Trait';

    constructor (public raw: any, public id, public label: string) { super(raw, id, label) }
}

// Factory
export class DomainModel {
[name: string]: any;

    public elements: {[id: string] : DomainElement} = {};
    public root: DomainElement | undefined;

    constructor (public jsonld: any) {
      this.root = this.process()
    }

    public process (): DomainElement {
      const encoded = this.jsonld
      if (has_type(encoded, API_DOCUMENTATION)) {
        return this.buildAPIDocumentation(encoded)
      } else if (has_type(encoded, END_POINT)) {
        return this.buildEndPoint(encoded)
      } else if (has_type(encoded, OPERATION)) {
        return this.buildOperation(encoded)
      } else if (has_type(encoded, REQUEST)) {
        return this.buildRequest(encoded)
      } else if (has_type(encoded, RESPONSE)) {
        return this.buildResponse(encoded)
      } else if (has_type(encoded, PAYLOAD)) {
        return this.buildPayload(encoded)
      } else if (has_type(encoded, SHAPE)) {
        return this.buildShape(encoded)
      } else if (has_type(encoded, DOMAIN_PROPERTY_SCHEMA)) {
        return this.buildDomainPropertySchema(encoded)
      } else if (has_type(encoded, TRAIT)) {
        return this.buildTrait(encoded)
      } else {
        return this.buildDomainElement(encoded)
      }
    }

    private buildDomainElement (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const label = this.extractLabel(encoded, 'DomainElement')
      const element = new DomainElement(encoded, encoded['@id'], label)
      this.elements[element.id] = element
      return element
    }

    private buildAPIDocumentation (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const label = this.extractLabel(encoded, 'WebAPI')
      const endpoints = extract_links(encoded, ENDPOINT)
        .map(elm => this.buildEndPoint(elm))
      const element = new APIDocumentation(encoded, encoded['@id'], label, endpoints)
      this.elements[element.id] = element
      return element
    }

    private buildEndPoint (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const path = extract_value(encoded, PATH)
      const label = this.extractLabel(encoded, 'EndPoint')
      const operations = extract_links(encoded, SUPPORTED_OPERATION)
        .map(elm => this.buildOperation(elm))
      const element = new EndPoint(encoded, encoded['@id'], path, label, operations)
      this.elements[element.id] = element
      return element
    }

    private buildOperation (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const method = extract_value(encoded, METHOD)
      const label = this.extractLabel(encoded, 'Operation')
      const requests = extract_links(encoded, EXPECTS)
        .map(elm => this.buildRequest(elm))
      const responses = extract_links(encoded, RETURNS)
        .map(elm => this.buildResponse(elm))
      const element = new Operation(
        encoded, encoded['@id'], label, method, requests, responses)
      this.elements[element.id] = element
      return element
    }

    private buildResponse (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const status = extract_value(encoded, STATUS_CODE)
      const payloads = extract_links(encoded, RESPONSE_PAYLOAD)
        .map(elm => this.buildPayload(elm))
      const label = this.extractLabel(encoded, 'Response')
      const element = new Response(encoded, encoded['@id'], label, status, payloads)
      this.elements[element.id] = element
      return element
    }

    private buildRequest (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const payloads = extract_links(encoded, RESPONSE_PAYLOAD)
        .map(elm => this.buildPayload(elm))
      const label = this.extractLabel(encoded, 'Request')
      const element = new Request(encoded, encoded['@id'], label, payloads)
      this.elements[element.id] = element
      return element
    }

    private buildPayload (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const mediaType = extract_value(encoded, MEDIA_TYPE)
      const shape = this.buildShape(extract_link(encoded, PAYLOAD_SCHEMA)) as Shape | IncludeRelationship
      const label = this.extractLabel(encoded, 'Payload')
      const element = new Payload(encoded, encoded['@id'], label, mediaType, shape)
      this.elements[element.id] = element
      return element
    }

    private buildShape (encoded: any): DomainElement {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      let label = this.extractLabel(encoded, 'Shape')
      if ((label as string).indexOf('/') === 0) {
        label = 'Data Shape'
      }

      const element = new Shape(encoded, encoded['@id'], label)
      this.elements[element.id] = element
      return element
    }

    private buildDomainPropertySchema (encoded: any) {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const label = this.extractLabel(encoded, 'Property Shape')
      const domain = extract_link(encoded, DOMAIN)
      const range = extract_link(encoded, RANGE)
      const element = new DomainPropertySchema(
        encoded, encoded['@id'], domain, range, label)
      this.elements[element.id] = element
      return element
    }

    private buildTrait (encoded: any) {
      if (encoded == null || encoded['@id'] == null) { return undefined }
      const label = this.extractLabel(encoded, 'Trait')
      const element = new Trait(encoded, encoded['@id'], label)
      this.elements[element.id] = element
      return element
    }

    private extractLabel (encoded: any, defaultName: string) {
      return extract_value(encoded, NAME)
        || extract_value(encoded, LABEL)
        || extract_value(encoded, SHACL_NAME)
        || defaultName
    }
}
