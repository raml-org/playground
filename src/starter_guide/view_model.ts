import { ModelProxy } from '../main/model_proxy'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { CommonViewModel } from '../view_models/common_view_model'
import { WebApiParser as wap } from 'webapi-parser'

export type EditorSection = 'raml' | 'api-console';
export type ModelType = 'raml';

export class ViewModel extends CommonViewModel {
  public base = window.location.href.toString().split('/starter_guide.html')[0];
  public wapModel: any = undefined;

  constructor (public ramlEditor: any) {
    super()

    ramlEditor.onDidChangeModelContent(this.changeModelContent(
      'ramlChangesFromLastUpdate', 'raml'))

    this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (evt: LoadFileEvent) => {
      return this.parseRamlInput(evt.location)
        .then(this.updateEditorsModels.bind(this))
        .then(this.resetApiConsole.bind(this))
    })
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

  public loadInitialDocument () {
    const params = new URLSearchParams(window.location.search)
    if (params.get(this.queryParamName)) {
      return
    }

    this.loadModal.fileUrl(
      `${this.base}/examples/world-music-api/api.raml`)
    this.loadModal.save()
  }

  public parseEditorSection (section?: EditorSection) {
    console.log(`Parsing text from editor section '${section}'`)
    let value = this.ramlEditor.getModel().getValue()
    if (!value) { return } // Don't parse editor content if it's empty
    return this.parseRamlInput(value)
      .then(this.updateEditorsModels.bind(this))
      .then(this.resetApiConsole.bind(this))
  }

  protected updateEditorsModels () {
    console.log(`Updating editors models`)
    if (this.model === null || this.model.raw === null) {
      return
    }
    this.ramlEditor.setModel(this.createModel(this.model.raw, 'raml'))
  }

  private resetApiConsole () {
    return wap.raml10.resolve(this.wapModel)
      .then(resolved => {
        return wap.amfGraph.generateString(resolved)
      })
      .then(graph => {
        const apid = document.querySelector('api-documentation')
        apid.amf = JSON.parse(graph)
        apid.selected = 'summary'
        apid.selectedType = 'summary'
      })
  }
}
