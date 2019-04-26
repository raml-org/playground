import * as ko from 'knockout'
import { ParserType } from '../view_models/load_modal'
import { ModelProxy, ModelLevel } from '../main/model_proxy'
import { Document, Fragment, Module } from '../main/units_model'
import { DomainElement, DomainModel } from '../main/domain_model'
import * as amf from 'amf-client-js'

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
  // The model information stored as the global information, this will be used to generate the units and
  // navigation options, subsets of this model can be selected and become the active model
  public documentModel?: ModelProxy = undefined;
  // The global 'level' for the active document
  public documentLevel: ModelLevel = 'document';
  // The model used to show the spec text in the editor, this can change as different parts of the global
  // model are selected and we need to show different spec texts
  public model?: ModelProxy = undefined;
  public referenceToDomainUnits: { [id: string]: DomainModel[] } = {};

  // Observables for the main interface state
  public baseUrl: KnockoutObservable<string> = ko.observable<string>('');
  public editorSection: KnockoutObservable<EditorSection> = ko.observable<EditorSection>('raml');
  public generationOptions: KnockoutObservable<any> = ko.observable<any>({ 'source-maps?': false });
  public generateSourceMaps: KnockoutObservable<string> = ko.observable<string>('no');
  public focusedId: KnockoutObservable<string> = ko.observable<string>('');
  public selectedParserType: KnockoutObservable<ParserType|undefined> = ko.observable<ParserType|undefined>(undefined);
  public lastLoadedFile: KnockoutObservable<string|undefined> = ko.observable<string|undefined>(undefined);
  public canParse: KnockoutComputed<boolean> = ko.computed<boolean>(() => {
    return (this.selectedParserType() == null || this.editorSection() === this.selectedParserType())
  });

  // checks if we need to reparse the document
  public ramlChangesFromLastUpdate = 0;
  public oasChangesFromLastUpdate = 0;
  public documentModelChanged = false;
  public RELOAD_PERIOD = 2000;

  constructor (public ramlEditor: any, public oasEditor: any) {
    ramlEditor.onDidChangeModelContent((e) => {
      this.ramlChangesFromLastUpdate++
      this.documentModelChanged = true;
      ((number) => {
        setTimeout(() => {
          if (this.ramlChangesFromLastUpdate === number) {
            this.updateDocumentModel()
          }
        }, this.RELOAD_PERIOD)
      })(this.ramlChangesFromLastUpdate)
    })

    oasEditor.onDidChangeModelContent((e) => {
      this.oasChangesFromLastUpdate++
      this.documentModelChanged = true;
      ((number) => {
        setTimeout(() => {
          if (this.oasChangesFromLastUpdate === number) {
            this.updateDocumentModel()
          }
        }, this.RELOAD_PERIOD)
      })(this.oasChangesFromLastUpdate)
    })
  }

  public parseString (type: ModelType, baseUrl: string, value: string, cb: (err, model) => any) {
    let parser: any
    if (type === 'raml') {
      parser = amf.Core.parser('RAML 1.0', 'application/yaml')
    } else if (type === 'oas') {
      parser = amf.Core.parser('OAS 2.0', 'application/yaml')
    }
    parser.parseStringAsync(value).then((model) => {
      cb(null, new ModelProxy(model, type))
    }).catch((err) => {
      console.log('Error parsing text')
      console.log(err)
      cb(err, null)
    })
  }

  public updateDocumentModel (section?: EditorSection) {
    if (!this.documentModelChanged) {
      return
    }
    this.documentModelChanged = false
    this.ramlChangesFromLastUpdate = 0
    this.oasChangesFromLastUpdate = 0
    if (!this.model) {
      return this.parseEditorsSection(section)
    }
    let location = this.model.location()
    let editor = section === 'raml' ? this.ramlEditor : this.oasEditor
    let value = editor.getModel().getValue()
    let modelType = <ModelType>(section || this.editorSection())
    this.documentModel.update(location, value, modelType, (e) => {
      if (e) { console.log(e) }
    })
  }

  public parseEditorsSection (section?: EditorSection) {
    console.log(`** Parsing text for section ${section}`)
    section = section || this.editorSection()
    if (section === 'raml' || section === 'oas') {
      let value = this.ramlEditor.getModel().getValue()
      let baseUrl = this.baseUrl() || ''
      this.parseString(section as 'raml' | 'oas', baseUrl, value, (err, model) => {
        if (err) {
          console.log(err)
          alert('Error parsing model, see console for details')
        } else {
          this.selectedParserType(<ParserType>section)
          this.documentModel = model
          this.model = model
          this.focusedId(this.documentModel!.location())
          this.resetDocuments()
        }
      })
    }
  }

  apply (location: Node) {
    window['viewModel'] = this
    amf.plugins.document.WebApi.register()
    amf.plugins.document.Vocabularies.register()
    amf.plugins.features.AMFValidation.register()
    amf.Core.init().then(() => {
      ko.applyBindings(this)
    })
  }

  // Reset the view model state when a document has changed
  private resetDocuments () {
    if (this.model != null) {
      // We generate the RAML representation
      if (this.selectedParserType() === 'raml' && this.editorSection() === 'raml' && this.model.raw != null) {
        this.ramlEditor.setModel(createModel(this.model.raw, 'yaml'))
      } else {
        this.model.toRaml(this.documentLevel, this.generationOptions(), (err, string) => {
          if (err != null) {
            console.log('Error generating RAML')
            console.log(err)
          } else {
            if (this.editorSection() === 'raml') {
              this.ramlEditor.setModel(createModel(this.model!.ramlString, 'yaml'))
            }
          }
        })
      }

      // We generate the OpenAPI representation
      if (this.selectedParserType() === 'oas' && this.editorSection() === 'oas' && this.model.raw != null) {
        this.ramlEditor.setModel(createModel(this.model.raw, 'yaml'))
      } else {
        this.model.toOas(this.documentLevel, this.generationOptions(), (err, string) => {
          if (err != null) {
            console.log('Error getting OpenAPI')
            console.log(err)
          } else {
            if (this.editorSection() === 'oas') {
              this.ramlEditor.setModel(createModel(this.model!.openAPIString, 'yaml'))
            }
          }
        })
      }
    }
  }
}
