import * as ko from 'knockout'
import { ModelProxy, ModelLevel } from '../main/model_proxy'
import { WebApiParser as wap } from 'webapi-parser'

export type EditorSection = 'raml' | 'oas';
export type ModelType = 'raml' | 'oas';

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

  // Observables for the main interface state
  public baseUrl: KnockoutObservable<string> = ko.observable<string>('');
  public generationOptions: KnockoutObservable<any> = ko.observable<any>({ 'source-maps?': false });
  // Editor section parsed most recently
  public lastParsedSection: KnockoutObservable<EditorSection|undefined> = ko.observable<EditorSection|undefined>(undefined);

  // checks if we need to reparse the document
  public ramlChangesFromLastUpdate = 0;
  public oasChangesFromLastUpdate = 0;
  public modelChanged = false;
  public RELOAD_PERIOD = 2000;

  constructor (public ramlEditor: any, public oasEditor: any) {
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
    oasEditor.onDidChangeModelContent(changeModelContent.call(
      this, 'oasChangesFromLastUpdate', 'oas'))
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
    this.oasChangesFromLastUpdate = 0
    this.parseEditorSection(section)
  }

  public parseEditorSection (section?: EditorSection) {
    console.log(`Parsing text from editor section '${section}'`)
    let editor = section === 'raml' ? this.ramlEditor : this.oasEditor
    let value = editor.getModel().getValue()
    if (!value) { return } // Don't parse editor content if it's empty
    let baseUrl = this.baseUrl() || ''
    this.parseString(section as 'raml' | 'oas', baseUrl, value, (err, model) => {
      if (err) {
        alert(`Failed to parse editor section '${section}'`)
        console.error(`Failed to parse editor section '${section}': ${err}`)
      } else {
        this.lastParsedSection(section)
        this.model = model
        this.updateEditorsModels()
      }
    })
  }

  public parseString (type: ModelType, baseUrl: string, value: string, cb: (err, model) => any) {
    let parser = type === 'raml' ? wap.raml10 : wap.oas20
    parser.parse(value).then((model) => {
      cb(null, new ModelProxy(model, type))
    }).catch((err) => {
      console.error(`Failed to parse string: ${err}`)
      cb(err, null)
    })
  }

  private updateEditorsModels () {
    console.log(`Updating editors models (last parsed '${this.lastParsedSection()}')`)
    if (this.model === null || this.model.raw === null) {
      return
    }

    // Update RAML editor with existing model
    // Generate model for OAS editor
    if (this.lastParsedSection() === 'raml') {
      console.log('Updating RAML editor with existing model')
      this.ramlEditor.setModel(createModel(this.model.raw, 'yaml'))
      console.log('Generating model for OAS editor')
      this.model.toOas(this.documentLevel, this.generationOptions(), (err, string) => {
        if (err !== null) {
          alert('Failed to generate OAS')
          console.error(`Failed to generate OAS: ${err}`)
        } else {
          this.oasEditor.setModel(createModel(this.model!.oasString, 'yaml'))
        }
      })
    }

    // Update OAS editor with existing model
    // Generate model for RAML editor
    if (this.lastParsedSection() === 'oas') {
      console.log('Updating OAS editor with existing model')
      this.oasEditor.setModel(createModel(this.model.raw, 'yaml'))
      console.log('Generating model for RAML editor')
      this.model.toRaml(this.documentLevel, this.generationOptions(), (err, string) => {
        if (err !== null) {
          alert('Failed to generate RAML')
          console.error(`Failed to generate RAML: ${err}`)
        } else {
          this.ramlEditor.setModel(createModel(this.model!.ramlString, 'yaml'))
        }
      })
    }
  }
}
