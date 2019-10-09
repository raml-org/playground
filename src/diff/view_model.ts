import { ModelProxy } from '../main/model_proxy'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { CommonViewModel } from '../view_models/common_view_model'
import { WebApiParser as wap } from 'webapi-parser'

export type EditorSection = 'raml';
export type ModelType = 'raml';

export class ViewModel extends CommonViewModel {

  public constructor (public diffEditor: any) {
    super()

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

  protected updateEditorsModels () {
    console.log(`Updating editors models`)
    if (this.model === null || this.model.raw === null) {
      return
    }

    console.log('Updating RAML editor with existing model')
    const editorModel = this.diffEditor.getModel()
    editorModel.original = this.createModel(this.model.raw, 'raml')
    this.diffEditor.setModel(editorModel)
  }

  public getMainModel (): monaco.editor.ITextModel {
    return this.diffEditor.getModel().original
  }

  public parseEditorSection (section?: EditorSection) {}
}
