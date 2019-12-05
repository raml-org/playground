import * as ko from 'knockout'
import * as amf from 'amf-client-js'
import { CommonViewModel } from '../view_models/common_view_model'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { WebApiParser as wap } from 'webapi-parser'
import { UI } from "../view_models/ui";

import AnyShape = amf.model.domain.AnyShape

export type NavigatorSection = 'shapes' | 'errors'

interface Shape {
    id: string,
    target: string,
    message: string,
    isCustom: boolean
}

const createModel = function (text, mode) {
  return globalThis.monaco.editor.createModel(text, mode)
}

export class ViewModel extends CommonViewModel {
  public env: amf.client.environment.Environment = null;
  public navigatorSection: ko.Observable<NavigatorSection> = ko.observable<NavigatorSection>('errors');

  public shapes: ko.ObservableArray<Shape> = ko.observableArray<Shape>([]);
  public errors: ko.ObservableArray<amf.client.validate.ValidationResult> = ko.observableArray<amf.client.validate.ValidationResult>([]);
  public selectedModel: ko.Observable<amf.model.document.BaseUnit|null> = ko.observable(null);

  public editorSection: ko.Observable<string> = ko.observable<string>('raml');
  public validationSection: ko.Observable<string> = ko.observable<string>('custom');
  public customValidation?: string;

  public selectedError: ko.Observable<any> = ko.observable<any>();
  public errorsMapShape: {[id: string]: boolean} = {};

  public model: any | null = null;
  public modelSyntax: string | null = null;
  public modelText: string | null = null;

  public changesFromLastUpdate = 0;
  public documentModelChanged = false;
  public RELOAD_PERIOD = 1000;
  public ui: UI = new UI();

  public ramlParser?
  public profileName: amf.ProfileName;
  public profilePath: string = 'http://a.ml/amf/default_document';


  public init (): Promise<any> {
    return amf.AMF.init()
  }

  public constructor (public profileEditor: any, public ramlEditor: any) {
    super()
    this.ramlParser = amf.AMF.raml10Parser()

    const parsingApiFn = () => {
      if (this.editorSection() === 'raml') {
        const toParse = ramlEditor.getValue()
        this.ramlParser.parseStringAsync(toParse).then((parsed: amf.model.document.Document) => {
          this.selectedModel(parsed)
          const oldErrors = this.errors()
          try {
            this.doValidate()
          } catch (e) {
            console.error(`Exception parsing API: ${e}`)
            this.errors(oldErrors)
          }
        }).catch((e) => {
          console.error(`Exception parsing API: ${e}`)
        })
      }
    }

    const parsingProfileFn = (cb?: () => void) => {
      if (this.validationSection() === 'custom') {
        return amf.AMF.loadValidationProfile(this.profilePath, this.getEnv())
         .then((profileName) => {
            this.profileName = profileName
            this.loadShapes()
            if (cb) {
              cb()
            } else {
              this.doValidate()
            }
          })
      }
    }

    this.editorSection.subscribe((section) => this.onEditorSectionChange(section))
    this.validationSection.subscribe((section) => this.onValidationSectionChange(section))

    this.init()
      .then(() => parsingProfileFn(parsingApiFn))
      .then(() => {
        return this.loadShapes()
      }).catch((e) => {
        console.error(`Error: ${e}`)
      })

    ramlEditor.onDidChangeModelContent(() => {
      this.changesFromLastUpdate++
      this.documentModelChanged = true;
      ((number) => {
        setTimeout(() => {
          if (this.changesFromLastUpdate === number) {
            this.changesFromLastUpdate = 0
            parsingApiFn()
          }
        }, this.RELOAD_PERIOD)
      })(this.changesFromLastUpdate)
    })
    profileEditor.onDidChangeModelContent(() => {
      this.changesFromLastUpdate++
      this.documentModelChanged = true;
      ((number) => {
        setTimeout(() => {
          if (this.changesFromLastUpdate === number) {
            this.changesFromLastUpdate = 0
            parsingProfileFn()
          }
        }, this.RELOAD_PERIOD)
      })(this.changesFromLastUpdate)
    })

    this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (evt: LoadFileEvent) => {
      return wap.raml10.parse(evt.location)
        .then((parsedModel) => {
          this.getMainModel().setValue(parsedModel.raw)

          this.validationSection('custom')
          parsingProfileFn()
        })
    })
  }

  public getEnv () {
    const profilePath = this.profilePath
    const editor = this.profileEditor
    const EditorProfileLoader = {
      fetch: function (resource: string): Promise<amf.client.remote.Content> {
        return new Promise(function (resolve, reject) {
          resolve(new amf.client.remote.Content(
            editor.getValue(), profilePath))
        })
      },
      accepts: function (resource: string): boolean {
        return true
      }
    }
    const env = new amf.client.environment.Environment()
    return env.addClientLoader(EditorProfileLoader)
  }

  public hasError (shape: AnyShape): boolean {
    const errors = this.errorsMapShape || {}
    return errors[(shape.id || '').split('#').pop()] || false
  }

  public selectError (error: any) {
    if (this.selectedError() == null || this.selectedError().id !== error.id) {
      this.selectedError(error)
    }
  }

  public apply () {
    globalThis.viewModel = this
    ko.applyBindings(this)
  }

  public doValidate () {
    const model = this.selectedModel()
    if (model != null) {
      this.ramlParser.reportValidation((this.profileName || 'RAML 1.0'), 'RAML').then((report) => {
        var violations = report.results.filter((result) => {
          return result.level === 'Violation'
        })

        const editorModel = this.ramlEditor.getModel()
        const monacoErrors = report.results.map((result) => this.buildMonacoErro(result))
        globalThis.monaco.editor.setModelMarkers(editorModel, editorModel.id, monacoErrors)

        this.errors(violations)
        this.errorsMapShape = this.errors()
          .map(e => {
            return e.validationId.split('#').pop()
          })
          .reduce((a, s) => { a[s] = true; return a }, {})
        globalThis.resizeFn()
      }).catch((e) => {
        console.error(`Error validating API: ${e}`)
      })
    }
  }

  private onEditorSectionChange (section: string) {
    if (this.selectedModel() !== null) {
      if (section === 'raml') {
        amf.Core.generator('RAML 1.0', 'application/yaml').generateString(this.selectedModel())
          .then((generated) => {
            this.ramlEditor.setModel(createModel(generated, 'yaml'))
          })
      } else if (section === 'api-model') {
        amf.AMF.amfGraphGenerator().generateString(this.selectedModel(), new amf.render.RenderOptions().withCompactUris)
          .then((generated) => {
            const json = JSON.parse(generated)
            this.ramlEditor.setModel(createModel(JSON.stringify(json, null, 2), 'json'))
          })
      }
      globalThis.resizeFn()
    }
  }

  private onValidationSectionChange (section: string) {
    if (section === 'custom') {
      this.profileEditor.setModel(createModel(this.customValidation, 'yaml'))
    } else {
      this.customValidation = this.profileEditor.getValue()
      const shapes = amf.AMF.emitShapesGraph(this.profileName)
      const json = JSON.parse(shapes)
      this.profileEditor.setModel(createModel(JSON.stringify(json, null, 2), 'json'))
    }
  }

  Hint = 1;
  Info = 2;
  Warning = 4;
  Error = 8;

  protected buildMonacoErro (error: amf.client.validate.ValidationResult): any {
    let severity = this.Info
    if (error.level == 'Violation') { severity = this.Error }
    if (error.level === 'Warning') { severity = this.Warning }
    const startLineNumber = error.position.start.line
    const startColumn = error.position.start.column
    const endLineNumber = error.position.end.line
    const endColumn = error.position.end.column
    const message = error.message
    return {
      severity, // hardcoded error severity
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
      message
    }
  }

  protected loadShapes () {
    const shapes = amf.AMF.emitShapesGraph(this.profileName)
    const shapesModels = JSON.parse(shapes).map((n) => {
      const id = n['@id'].split('#').pop()
      const isCustom = n['@id'].indexOf('amf/parser#') > -1
      const message = (n['http://www.w3.org/ns/shacl#message'] || {})['@value'] || ''
      const targetId = ((n['http://www.w3.org/ns/shacl#targetClass'] || [])[0] || {})['@id'] || ''
      const target = this.ui.bindingLabel({ token: 'uri', value: targetId })
      return {
        id,
        target,
        isCustom,
        message
      }
    })
    this.shapes(shapesModels)
  }

  public getMainModel (): any {
    return this.ramlEditor.getModel()
  }
  public parseEditorSection () {}
  public updateEditorsModels () {}
}
