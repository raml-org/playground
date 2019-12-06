import { ModelProxy } from '../main/model_proxy'
import { ApiConsole } from '../main/api_console'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { CommonViewModel } from '../view_models/common_view_model'
import { WebApiParser as wap } from 'webapi-parser'

export type EditorSection = 'raml';
export type ModelType = 'raml';

export class ViewModel extends CommonViewModel {
  public base = this.makeBase('starter_guide')
  public wapModel: any = undefined;
  public apiConsole: ApiConsole;

  constructor (public ramlEditor: any) {
    super()

    this.apiConsole = new ApiConsole()

    ramlEditor.onDidChangeModelContent(this.changeModelContent(
      'ramlChangesFromLastUpdate', 'raml'))

    this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (evt: LoadFileEvent) => {
      return this.parseRamlInput(evt.location)
        .then(this.updateEditorsModels.bind(this))
        .then(() => {
          return this.apiConsole.reset(this.wapModel)
        })
    })
  }

  public getMainModel (): any {
    return this.ramlEditor.getModel()
  }

  public parseRamlInput (inp) {
    return wap.raml10.parse(inp)
      .then(parsedModel => {
        this.wapModel = parsedModel
        this.model = new ModelProxy(this.wapModel, 'raml')
      })
      .catch(err => {
        console.error(`Failed to parse: ${err}`)
      })
  }

  public parseEditorSection (section?: EditorSection) {
    const value = this.ramlEditor.getModel().getValue()
    if (!value) { return } // Don't parse editor content if it's empty
    return this.parseRamlInput(value)
      .then(() => {
        return this.apiConsole.reset(this.wapModel)
      })
  }

  protected updateEditorsModels () {
    if (this.model === null || this.model.raw === null) {
      return
    }
    this.ramlEditor.setValue(this.model.raw)
  }
}
