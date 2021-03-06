import { ModelProxy } from '../main/model_proxy'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { CommonViewModel } from '../view_models/common_view_model'
import { WebApiParser as wap } from 'webapi-parser'

export type EditorSection = 'raml';
export type ModelType = 'raml';

export class ViewModel extends CommonViewModel {
  public base = this.makeBase('resolution')

  constructor (public unresRamlEditor: any, public resRamlEditor: any) {
    super()

    unresRamlEditor.onDidChangeModelContent(this.changeModelContent(
      'ramlChangesFromLastUpdate', 'raml'))

    this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (evt: LoadFileEvent) => {
      return wap.raml10.parse(evt.location)
        .then((parsedModel) => {
          this.loadedRamlUrl = evt.location
          this.model = new ModelProxy(parsedModel, 'raml')
          this.unresRamlEditor.setModel(
            this.createModel(this.model.raw, 'raml'))
          return this.updateEditorsModels()
        })
        .catch((err) => {
          console.error(`Failed to parse file: ${err}`)
        })
    })
  }

  public getMainModel(): any {
    return this.unresRamlEditor.getModel()
  }

  public parseEditorSection (section?: EditorSection) {
    const value = this.unresRamlEditor.getValue()
    if (!value) { return } // Don't parse editor content if it's empty
    return wap.raml10.parse(value, this.loadedRamlUrl).then(model => {
      this.model = new ModelProxy(model, 'raml')
      return this.updateEditorsModels()
    }).catch(err => {
      console.error(`Failed to parse editor: ${err}`)
    })
  }

  protected updateEditorsModels () {
    if (this.model === null || this.model.raw === null) {
      return
    }

    // Generate and set resolved RAML
    return wap.raml10.resolve(this.model.model)
      .then(resolved => wap.raml10.generateString(resolved))
      .then(resolvedStr => {
        this.resRamlEditor.setModel(this.createModel(resolvedStr, 'raml'))
      })
  }
}
