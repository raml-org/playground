import { ModelType } from './playground_window'
import * as jsonld from 'jsonld'
import { UnitModel } from './units_model'
import { WebApiParser as wap, model, core } from 'webapi-parser'

export type ModelLevel = 'document' | 'domain';

/**
 * A proxy class to interact with the clojure code containing the logic to interact with a API Model
 */
export class ModelProxy {
  // holders for the generated strings
  public ramlString: string = '';
  public generatedRamlModel: model.document.BaseUnit;
  public oasString: string = '';
  public generatedOasModel: model.document.BaseUnit;
  public apiModelString: string = '';
  public raw: string = '';

  constructor (public model: model.document.BaseUnit, public sourceType: ModelType) {
    // we setup the default model with the value passed in the constructor
    // for the kind of model.
    if (this.sourceType === 'raml') {
      this.generatedRamlModel = model
    } else if (this.sourceType === 'oas') {
      this.generatedOasModel = model
    }

    this.raw = this.model.raw
  }

  location (): string {
    return this.model.location
  }

  /**
   * Serialises the model as RAML/YAML document for the provided document level
   * @param level: document, domain
   * @param cb
   */
  toRaml (level: ModelLevel, options: any, cb) {
    try {
      if (level === 'document') {
        wap.raml10.generateString(this.model)
          .then((text) => {
            this.ramlString = text
            cb(null, text)
          })
          .catch(cb)
      } else { // domain level
        wap.raml10.resolve(this.model)
          .then((resolved) => {
            return wap.raml10.generateString(resolved)
          })
          .then((text) => {
            this.ramlString = text
            cb(null, text)
          })
          .catch(cb)
      }
    } catch (e) {
      cb(e)
    }
  }

  /**
   * Serialised the model as a OpenAPI/JSON document for the provided doucmnet level
   * @param level: document, domain
   * @param cb
   */
  toOas (level: ModelLevel, options: any, cb) {
    try {
      if (level === 'document') {
        wap.oas20.generateYamlString(this.model).then((text) => {
          this.oasString = text
          cb(null, text)
        }).catch(cb)
      } else { // domain level
        wap.oas20.resolve(this.model)
          .then((resolved) => {
            return wap.oas20.generateYamlString(resolved)
          })
          .then((text) => {
            this.oasString = text
            cb(null, text)
          })
          .catch(cb)
      }
    } catch (e) {
      cb(e)
    }
  }

  update (location: string, text: string, modelType: ModelType, cb: (e: any) => void): void {
    let parsingProm
    if (modelType === 'raml') {
      parsingProm = wap.raml10.parse(location, text)
    } else if (modelType === 'oas') {
      parsingProm = wap.oas20.parseYaml(location, text)
    } else {
      parsingProm = wap.amfGraph.parse(location, text)
    }
    if (location === this.model.location) {
      // we need to update the main document model
      parsingProm.then((model) => {
        this.model = model
        this.raw = model.raw
      }).catch((err) => {
        console.log(`Error updating refs: ${err}`)
      })
    } else {
      // we need to update one reference in the document model
      const ref = this.model.references().filter((ref) => ref.location === location)[0]
      if (ref != null) {
        parsingProm.then((model) => {
          const newRefs = this.model.references().map((ref) => {
            if (ref.location !== location) {
              return ref
            } else {
              return model
            }
          })
          this.model.withReferences(newRefs)
          cb(model)
        }).catch((err) => {
          console.log(`Error updating refs: ${err}`)
        })
      }
    }
  }

  toAPIModel (level: ModelLevel, options: any, cb) {
    this.toAPIModelProcessed(level, true, true, options, cb)
  }

  toAPIModelProcessed (level: ModelLevel, compacted: boolean, stringify: boolean, options: any, cb) {
    try {
      const liftedModel = (level === 'document') ? this.model : wap.raml10.resolve(this.model)
      wap.amfGraph.generateString(liftedModel)
        .then((res) => {
          const parsed = JSON.parse(res)[0]
          if (compacted) {
            const context = {
              'raml-doc': 'http://a.ml/vocabularies/document#',
              'raml-http': 'http://a.ml/vocabularies/http#',
              'raml-shapes': 'http://a.ml/vocabularies/shapes#',
              'hydra': 'http://www.w3.org/ns/hydra/core#',
              'shacl': 'http://www.w3.org/ns/shacl#',
              'schema-org': 'http://schema.org/',
              'xsd': 'http://www.w3.org/2001/XMLSchema#'
            }
            jsonld.compact(parsed, context, (err, compacted) => {
              if (err != null) {
                console.log(`ERROR COMPACTING: ${err}`)
                console.log(JSON.stringify(parsed, null, 2))
              }
              const finalJson = (err == null) ? compacted : parsed
              this.apiModelString = JSON.stringify(finalJson, null, 2)
              if (stringify) {
                cb(err, this.apiModelString)
              } else {
                cb(err, finalJson)
              }
            })
          } else {
            this.apiModelString = JSON.stringify(parsed, null, 2)
            if (stringify) {
              cb(null, this.apiModelString)
            } else {
              cb(null, parsed)
            }
          }
        })
        .catch(cb)
    } catch (e) {
      console.log(`Error generating JSON-LD: ${e}`)
      cb(e)
    }
  }

  public units (modelLevel: ModelLevel, cb) {
    new UnitModel(this).process(modelLevel, cb)
  }

  /**
   * Returns all the files referenced in a document model
   * @returns {string[]}
   */
  references (): string[] {
    const files: string[] = []
    files.push(this.location())
    return files.concat(this.transitiveReferences().map((u) => u.location))
  }

  nestedModel (location: string): ModelProxy {
    if (location === this.model.location) {
      return this
    } else {
      const unit = this.transitiveReferences().filter((ref) => {
        return ref.location === location ||
                  ref.location === location.substring(0, location.length - 1)
      })[0]
      return new ModelProxy(unit, this.sourceType)
    }
  }

  private _transitiveRefs: model.document.BaseUnit[] = null;

  transitiveReferences (): model.document.BaseUnit[] {
    if (this._transitiveRefs == null) {
      const refsAcc = {}
      this.model.references().forEach((ref) => { refsAcc[ref.location] = ref })
      var pending: model.document.BaseUnit[] = this.model.references()
      while (pending.length > 0) {
        const next: model.document.BaseUnit = pending.pop()
        next.references().forEach((ref) => {
          if (refsAcc[ref.location] == null) {
            refsAcc[ref.location] = ref
            pending = pending.concat(ref.references())
          }
        })
      }
      var acc: model.document.BaseUnit[] = []
      for (var p in refsAcc) {
        acc.push(refsAcc[p])
      }
      this._transitiveRefs = acc
    }

    return this._transitiveRefs
  }

  findElement (id: string): model.domain.DomainElement | undefined {
    return this.model.findById(id)
  }

  elementLexicalInfo (id: string): core.parser.Range | undefined {
    const element = this.findElement(id)
    if (element != null) {
      return element.position
    }
  }
}
