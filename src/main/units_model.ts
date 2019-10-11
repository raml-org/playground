import { ModelProxy, ModelLevel } from './model_proxy'
import { absoluteURL, label, nestedLabel } from '../utils'
import { DomainModel, extract_value, LABEL, NAME } from './domain_model'

export type DocumentKind = 'DomainElement' | 'DocumentDeclaration' | 'Document' | 'Fragment' | 'Module';
export interface DocumentId {
    id: string;
    label: string;
    // This is required just because of Electron remoting, I cannot use instanceof and sometimes I want to know the "class"
    kind: DocumentKind;
}

export interface Unit {
    references: (string | DocumentId)[];
}

export class DomainElement implements DocumentId {
    public kind: DocumentKind = 'DomainElement';
    public domain: DomainModel;
    constructor (public id: string, public raw: any, public label: string, public elementClass: string, isAbstract: boolean) {
      this.domain = new DomainModel(raw)
    }
}

export class DocumentDeclaration implements DocumentId {
    public kind: DocumentKind = 'DocumentDeclaration';
    public domain: DomainModel;
    constructor (public id: string, raw: any, public label: string, public elementClass: string, public traitAlias?: string) {
      this.domain = new DomainModel(raw)
    }
}

export class Document implements DocumentId, Unit {
    public kind: DocumentKind = 'Document';
    constructor (public id: string, public label: string, public references: (string | DocumentId)[], public declares: DocumentDeclaration[], public encodes?: DomainElement) { }
}

export class Fragment implements DocumentId, Unit {
    public kind: DocumentKind = 'Fragment';
    constructor (public id: string, public label: string, public references: (string | DocumentId)[], public encodes?: DomainElement) { }
}

export class Module implements DocumentId, Unit {
    public kind: DocumentKind = 'Module';
    constructor (public id: string, public label: string, public references: (string | DocumentId)[], public declares: DocumentDeclaration[]) { }
}

function consumePromises<T> (promises: ((ke: (e) => void, kd:(T) => void) => void)[], k:(e:any | undefined) => void) {
  if (promises.length > 0) {
    const next = promises.pop()
    if (next != null) {
      next((_) => {
        consumePromises(promises, k)
      }, (e) => {
        k(e)
      })
    } else {
      consumePromises(promises, k)
    }
  } else {
    k(undefined)
  }
}

export class UnitModel {
  constructor (public model: ModelProxy) { }

  public process (modelLevel: ModelLevel, cb) {
    const acc = { documents: [], fragments: [], modules: [] }

    const promises = this.model.references().map(ref => {
      if (modelLevel == 'document' || ref == this.model.location()) {
        const reference = this.model.nestedModel(ref)
        return (resolve, reject) => {
          reference.toAPIModelProcessed(modelLevel, false, false, { 'source-maps?': true }, (err, jsonld: any) => {
            if (err != null) {
              reject(err)
            } else {
              if (this.isDocument(jsonld)) {
                this.parseDocument(jsonld, acc)
              } else if (this.isFragment(jsonld)) {
                this.parseFragment(jsonld, acc)
              } else if (this.isModule(jsonld)) {
                this.parseModule(jsonld, acc)
              }
              resolve(undefined)
            }
          })
        }
      } else {
        return null
      }
    }).filter(p => p != null)

    consumePromises(promises, (e) => {
      if (e != null) {
        cb(e, null)
      } else {
        this.foldReferences(acc)
        cb(null, acc)
      }
    })
  }

  isDocument (doc: any) {
    return (doc['@type'] || []).filter((type: string) => {
      return type === 'http://a.ml/vocabularies/document#Document'
    }).length > 0
  }

  isModule (doc: any) {
    return (doc['@type'] || []).filter((type: string) => {
      return type === 'http://a.ml/vocabularies/document#Module'
    }).length > 0
  }

  isFragment (doc: any) {
    return (doc['@type'] || []).filter((type: string) => {
      return type === 'http://a.ml/vocabularies/document#Fragment'
    }).length > 0
  }

  parseDocument (doc: any, acc) {
    const docId = absoluteURL(doc['@id'])
    const declares = (doc['http://a.ml/vocabularies/document#declares'] || []).map((declaration) => {
      return new DocumentDeclaration(
        absoluteURL(declaration['@id']),
        declaration,
        nestedLabel(doc, declaration),
        (declaration['@type'] || [])[0],
        this.extractTag('is-trait-tag', declaration)
      )
    })
    const references = this.extractReferences(doc)
    acc.documents.push(new Document(docId, label(docId), references, declares, this.extractEncodedElement(doc)))
  }

  parseFragment (doc: any, acc) {
    const references = this.extractReferences(doc)
    const encoded = this.extractEncodedElement(doc)
    const encodedLabel = extract_value(encoded, NAME) || extract_value(encoded, LABEL)
    acc.fragments.push(new Fragment(absoluteURL(doc['@id']), encodedLabel || label(absoluteURL(doc['@id'])), references, encoded))
  }

  parseModule (doc: any, acc) {
    const docId = absoluteURL(doc['@id'])
    const declares = (doc['http://a.ml/vocabularies/document#declares'] || []).map((declaration) => {
      return new DocumentDeclaration(
        absoluteURL(declaration['@id']),
        declaration,
        nestedLabel(doc, declaration),
        (declaration['@type'] || [])[0],
        this.extractTag('is-trait-tag', declaration)
      )
    })
    const references = this.extractReferences(doc)
    acc.modules.push(new Module(docId, label(docId), references, declares))
  }

  flatten (array, mutable) {
    const toString = Object.prototype.toString
    const arrayTypeStr = '[object Array]'

    const result: any[] = []
    const nodes = (mutable && array) || array.slice()
    let node: any

    if (!array.length) {
      return result
    }

    node = nodes.pop()

    do {
      if (toString.call(node) === arrayTypeStr) {
        nodes.push.apply(nodes, node)
      } else {
        result.push(node)
      }
    } while (nodes.length && (node = nodes.pop()) !== undefined)

    result.reverse() // we reverse result to restore the original order
    return result
  }

  extractTag (tagId, node) {
    try {
      const sources = (node['http://a.ml/vocabularies/document#source'] || [])
      const tagFound = this
        .flatten(sources.map(source => source['http://a.ml/vocabularies/document#tag'] || []), true)
        .filter(tag => {
          return tag['http://a.ml/vocabularies/document#tagId'][0]['@value'] === tagId
        })[0]
      if (tagFound) {
        return tagFound['http://a.ml/vocabularies/document#tagValue'][0]['@value']
      } else {
        return undefined
      }
    } catch (e) {
      return undefined
    }
  }

  extractEncodedElement (node: any) {
    const encoded = (node['http://a.ml/vocabularies/document#encodes'] || [])[0]
    if (encoded != null) {
      const isAbstract = encoded['@type'].find(t => t === 'http://a.ml/vocabularies/document#AbstractDomainElement')
      return new DomainElement(absoluteURL(encoded['@id']), encoded, nestedLabel(node, encoded), encoded['@type'][0], isAbstract)
    } else {
      return undefined
    }
  }

  extractReferences (doc: any) {
    const references = (doc['http://a.ml/vocabularies/document#references'] || [])
    return references.map((ref) => absoluteURL(ref['@id']))
  }

  private foldReferences (acc: { documents: Document[]; fragments: Fragment[]; modules: Module[] }) {
    const mapping: { [id: string]: DocumentId } = {}
    acc.documents.forEach(doc => mapping[absoluteURL(doc.id)] = doc)
    acc.fragments.forEach(doc => mapping[absoluteURL(doc.id)] = doc)
    acc.modules.forEach(doc => mapping[absoluteURL(doc.id)] = doc)

    acc.documents.forEach((doc: Document) => {
      const references = doc.references.map((ref) => mapping[absoluteURL(ref)])
      doc.references = references
    })
    acc.fragments.forEach((doc: Document) => {
      const references = doc.references.map((ref) => mapping[absoluteURL(ref)])
      doc.references = references
    })
    acc.modules.forEach((doc: Document) => {
      const references = doc.references.map((ref) => mapping[absoluteURL(ref)])
      doc.references = references
    })
  }
}
