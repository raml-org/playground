import * as ko from 'knockout'
import { ModelProxy } from '../main/model_proxy'
import { Document } from '../main/units_model'
import { PlaygroundGraph } from '../view_models/graph'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { CommonViewModel } from '../view_models/common_view_model'
import { WebApiParser as wap, core } from 'webapi-parser'

export type EditorSection = 'raml' | 'graph';
export type ModelType = 'raml';

export class ViewModel extends CommonViewModel {
  // Units to be displayed in graph
  public documentUnits: KnockoutObservableArray<Document> = ko.observableArray<Document>([]);
  public graph: any;
  // Selected editor segment decorations
  private decorations: any = [];

  constructor (public ramlEditor: any) {
    super()

    ramlEditor.onDidChangeModelContent(this.changeModelContent(
      'ramlChangesFromLastUpdate', 'raml'))

    this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (evt: LoadFileEvent) => {
      return wap.raml10.parse(evt.location)
        .then((parsedModel) => {
          this.model = new ModelProxy(parsedModel, 'raml')
          this.updateEditorsModels()
        })
        .catch((err) => {
          console.error(`Failed to parse file: ${err}`)
        })
    })
  }

  public getMainModel (): monaco.editor.ITextModel {
    return this.ramlEditor.getModel()
  }

  public parseEditorSection (section?: EditorSection) {
    console.log(`Parsing text from editor section '${section}'`)
    const value = this.ramlEditor.getModel().getValue()
    if (!value) { return } // Don't parse editor content if it's empty
    this.parseString(section as 'raml', value, (err, model) => {
      if (err) {
        console.error(`Failed to parse editor section '${section}': ${err}`)
      } else {
        this.model = model
        this.updateEditorsModels()
      }
    })
  }

  public parseString (type: ModelType, value: string, cb: (err, model) => any) {
    wap.raml10.parse(value).then((model) => {
      cb(null, new ModelProxy(model, type))
    }).catch((err) => {
      console.error(`Failed to parse string: ${err}`)
      cb(err, null)
    })
  }

  protected updateEditorsModels () {
    console.log('Updating editors models')
    if (this.model === null || this.model.raw === null) {
      return
    }

    console.log('Updating RAML editor with existing model')
    this.ramlEditor.setModel(this.createModel(this.model.raw, 'raml'))
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
      const oldGraph = this.graph
      this.graph = new PlaygroundGraph(
        this.model!.location(),
        'domain',
        (id: string, unit: any) => {
          this.onSelectedGraphId(id, unit)
        }
      )
      this.graph.process(this.documentUnits())
      this.graph.render('graph-container-inner')
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
        const unitsMap = {}
        this.documentUnits().forEach(unit => {
          unitsMap[unit.id] = unit
        })

        this.documentUnits.removeAll()
        units.documents.forEach(doc => {
          if (unitsMap[doc.id] != null) {
            doc.expanded = unitsMap[doc.id].expanded
          }
          this.documentUnits.push(doc)
        })
      } else {
        console.error(`Error loading units: ${err}`)
      }
      if (cb) { cb() }
    })
  }
}
