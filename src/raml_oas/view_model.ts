import * as ko from 'knockout'
import { ModelProxy } from '../main/model_proxy'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { CommonViewModel } from '../view_models/common_view_model'
import { WebApiParser as wap } from 'webapi-parser'

export type EditorSection = 'raml' | 'oas';
export type ModelType = 'raml' | 'oas';

export class ViewModel extends CommonViewModel {
  // Editor section parsed most recently
  public lastParsedSection: KnockoutObservable<EditorSection|undefined> = ko.observable<EditorSection|undefined>(undefined);
  // Checks if we need to reparse the document
  public oasChangesFromLastUpdate = 0;
  // OAS, RAML generation options
  public generationOptions: KnockoutObservable<any> = ko.observable<any>({ 'source-maps?': false });

  constructor (public ramlEditor: any, public oasEditor: any) {
    super()

    ramlEditor.onDidChangeModelContent(this.changeModelContent(
      'ramlChangesFromLastUpdate', 'raml'))
    oasEditor.onDidChangeModelContent(this.changeModelContent(
      'oasChangesFromLastUpdate', 'oas'))

    this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (evt: LoadFileEvent) => {
      return wap.raml10.parse(evt.location)
        .then((parsedModel) => {
          this.lastParsedSection('raml')
          this.model = new ModelProxy(parsedModel, 'raml')
          this.updateEditorsModels()
        })
        .catch((err) => {
          console.error(`Failed to parse file: ${err}`)
          alert(`Failed to parse file: ${err}`)
        })
    })
  }

  public updateModels (section: EditorSection) {
    this.oasChangesFromLastUpdate = 0
    super.updateModels(section)
  }

  public parseEditorSection (section?: EditorSection) {
    console.log(`Parsing text from editor section '${section}'`)
    let editor = section === 'raml' ? this.ramlEditor : this.oasEditor
    let value = editor.getValue()
    if (!value) { return } // Don't parse editor content if it's empty
    this.parseString(section as 'raml' | 'oas', value, (err, model) => {
      if (err) {
        console.error(`Failed to parse editor section '${section}': ${err}`)
      } else {
        this.lastParsedSection(section)
        this.model = model
        this.updateEditorsModels()
      }
    })
  }

  public parseString (type: ModelType, value: string, cb: (err, model) => any) {
    let parsingProm = type === 'raml'
      ? wap.raml10.parse(value)
      : wap.oas20.parseYaml(value)
    parsingProm.then((model) => {
      cb(null, new ModelProxy(model, type))
    }).catch((err) => {
      console.error(`Failed to parse string: ${err}`)
      cb(err, null)
    })
  }

  protected updateEditorsModels () {
    console.log(`Updating editors models (last parsed '${this.lastParsedSection()}')`)
    if (this.model === null || this.model.raw === null) {
      return
    }

    // Update RAML editor with existing model
    // Generate model for OAS editor
    if (this.lastParsedSection() === 'raml') {
      console.log('Generating model for OAS editor')
      this.model.toOas(this.documentLevel, this.generationOptions(), (err, string) => {
        if (err !== null) {
          console.error(`Failed to generate OAS: ${err}`)
        } else {
          this.oasEditor.setModel(this.createModel(this.model!.oasString, 'raml'))
        }
      })
    }

    // Update OAS editor with existing model
    // Generate model for RAML editor
    if (this.lastParsedSection() === 'oas') {
      console.log('Generating model for RAML editor')
      this.model.toRaml(this.documentLevel, this.generationOptions(), (err, string) => {
        if (err !== null) {
          console.error(`Failed to generate RAML: ${err}`)
        } else {
          this.ramlEditor.setModel(this.createModel(this.model!.ramlString, 'raml'))
        }
      })
    }
  }
}
