import * as ko from 'knockout'
import { ModelProxy, ModelLevel } from '../main/model_proxy'
import { Document } from '../main/units_model'
import { PlaygroundGraph } from '../view_models/graph'
import { DomainElement } from '../main/domain_model'
import { WebApiParser as wap, core } from 'webapi-parser'

export type EditorSection = 'raml' | 'graph';
export type ModelType = 'raml';

export interface ReferenceFile {
  id: string;
  label: string;
  type: 'local' | 'remote'
}

const createModel = function (text, mode) {
  return window['monaco'].editor.createModel(text, mode)
}

export class ViewModel {
  // The global 'level' for the active document
  public documentLevel: ModelLevel = 'document';
  // The model used to show the spec text in the editor, this can change as different parts of the global
  // model are selected and we need to show different spec texts
  public model?: ModelProxy = undefined;
  public documentUnits: KnockoutObservableArray<Document> = ko.observableArray<Document>([]);

  // Observables for the main interface state
  public baseUrl: KnockoutObservable<string> = ko.observable<string>('');
  public generationOptions: KnockoutObservable<any> = ko.observable<any>({ 'source-maps?': false });

  public graph: any;

  // checks if we need to reparse the document
  public ramlChangesFromLastUpdate = 0;
  public modelChanged = false;
  public RELOAD_PERIOD = 2000;

  private decorations: any = [];

  constructor (public ramlEditor: any) {
    function changeModelContent (counter: string, section: EditorSection) {
      let self = this
      return function (evt) {
        self[counter]++
        self.modelChanged = true;
        ((number) => {
          setTimeout(() => {
            if (self[counter] === number) {
              self.updateModels(section)
            }
          }, self.RELOAD_PERIOD)
        })(self[counter])
      }
    }

    ramlEditor.onDidChangeModelContent(changeModelContent.call(
      this, 'ramlChangesFromLastUpdate', 'raml'))
  }

  public apply (location: Node) {
    window['viewModel'] = this
    wap.init().then(() => {
      ko.applyBindings(this)
    })
  }

  public updateModels (section: EditorSection) {
    if (!this.modelChanged) {
      return
    }
    this.modelChanged = false
    this.ramlChangesFromLastUpdate = 0
    this.parseEditorSection(section)
  }

  public parseEditorSection (section?: EditorSection) {
    console.log(`Parsing text from editor section '${section}'`)
    let value = this.ramlEditor.getModel().getValue()
    if (!value) { return } // Don't parse editor content if it's empty
    let baseUrl = this.baseUrl() || ''
    this.parseString(section as 'raml', baseUrl, value, (err, model) => {
      if (err) {
        console.error(`Failed to parse editor section '${section}': ${err}`)
      } else {
        this.model = model
        this.updateEditorsModels()
      }
    })
  }

  public parseString (type: ModelType, baseUrl: string, value: string, cb: (err, model) => any) {
    wap.raml10.parse(value).then((model) => {
      cb(null, new ModelProxy(model, type))
    }).catch((err) => {
      console.error(`Failed to parse string: ${err}`)
      cb(err, null)
    })
  }

  private updateEditorsModels () {
    console.log(`Updating editors models`)
    if (this.model === null || this.model.raw === null) {
      return
    }

    console.log('Updating RAML editor with existing model')
    this.ramlEditor.setModel(createModel(this.model.raw, 'raml'))
    console.log('Updating graph representation')
    this.resetUnits(() => {
      this.resetGraph()
    })
  }

  private onSelectedGraphId (id, unit) {
    if (this.model === null || id === undefined || unit === undefined) {
      return
    }

    const lexicalInfo: core.parser.Range = this.model.elementLexicalInfo(id)
    if (lexicalInfo != null) {
      this.ramlEditor.revealRangeInCenter({
        startLineNumber: lexicalInfo.start.line,
        startColumn: lexicalInfo.start.column,
        endLineNumber: lexicalInfo.end.line,
        endColumn: lexicalInfo.end.column
      })
      this.decorations = this.ramlEditor.deltaDecorations(this.decorations, [
        {
          range: new monaco.Range(
            lexicalInfo.start.line,
            lexicalInfo.start.column,
            lexicalInfo.end.line,
            lexicalInfo.end.column),
          options: {
            linesDecorationsClassName: 'selected-element-line-decoration',
            isWholeLine: true
          }
        }
      ])
    } else {
      this.decorations = this.ramlEditor.deltaDecorations(this.decorations, [])
    }
  }

  public resetGraph () {
    try {
      document.getElementById('graph-container-inner').innerHTML = ''
      let oldGraph = this.graph
      this.graph = new PlaygroundGraph(
        this.model!.location(),
        'domain',
        (id: string, unit: any) => {
          this.onSelectedGraphId(id, unit)
        }
      )
      this.graph.process(this.documentUnits())
      this.graph.render('graph-container-inner', () => {
        if (oldGraph != null) {
          if (this.graph.paper) {
            this.graph.paperScale(oldGraph.scaleX, oldGraph.scaleY)
          }
        }
      })
    } catch (err) {
      console.error(`Failed to reset graph: ${err}`)
    }
  }

  private resetUnits (cb: () => void = () => {}) {
    if (this.model === null) {
      this.documentUnits.removeAll()
      return
    }

    this.model.units(this.documentLevel, (err, units) => {
      if (err === null) {
        let unitsMap = {}
        this.documentUnits().forEach(unit => {
          unitsMap[unit.id] = unit
        })

        this.documentUnits.removeAll()
        units.documents.forEach(doc => {
          if (unitsMap[doc.id] != null) {
            doc['expanded'] = unitsMap[doc.id]['expanded']
          }
          this.documentUnits.push(doc)
        })
      } else {
        console.log(`Error loading units: ${err}`)
      }
      if (cb) { cb() }
    })
  }
}
