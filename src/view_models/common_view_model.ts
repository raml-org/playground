import * as ko from 'knockout'
import { ModelProxy, ModelLevel } from '../main/model_proxy'
import { LoadModal } from '../view_models/load_modal'
import { WebApiParser as wap } from 'webapi-parser'

export type EditorSection = 'raml' | 'graph' | 'oas';
export type ModelType = 'raml' | 'oas';

export abstract class CommonViewModel {
  // The global 'level' for the active document
  public documentLevel: ModelLevel = 'document';

  // The model used to show the spec text in the editor, this can change as different
  // parts of the global model are selected and we need to show different spec texts
  public model?: ModelProxy = undefined;

  public loadModal: LoadModal = new LoadModal();

  // checks if we need to reparse the document
  public ramlChangesFromLastUpdate = 0;
  public modelChanged = false;
  public RELOAD_PERIOD = 2000;

  public queryParamName = 'raml';

  public apply (): any {
    globalThis.viewModel = this
    return wap.init().then(() => {
      ko.applyBindings(this)
    })
  }

  public switchDemo (obj, event) {
    let href = event.target.value
    const value = this.getMainModel().getValue()
    if (value) {
      href += `?${this.queryParamName}=${encodeURIComponent(value)}`
    }
    window.location.href = href
  }

  public changeModelContent (counter: string, section: EditorSection) {
    const self = this
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

  protected createModel (text, mode) {
    return globalThis.monaco.editor.createModel(text, mode)
  }

  public loadRamlFromQueryParam () {
    const params = new URLSearchParams(window.location.search)
    let value = params.get(this.queryParamName)
    // Query param is not provided or has no value
    if (!value) {
      return
    }
    try {
      // Query param value is a RAML file URL
      new URL(value)
      this.loadModal.fileUrl(value.trim())
      this.loadModal.save()
    } catch (e) {
      // Query param value is a RAML file content
      try { value = decodeURIComponent(value) } catch (err) {}
      this.getMainModel().setValue(value.trim())
      this.updateModels('raml')
    }
  }

  public updateModels (section: EditorSection) {
    if (!this.modelChanged) {
      return
    }
    this.modelChanged = false
    this.ramlChangesFromLastUpdate = 0
    this.parseEditorSection(section)
  }

  abstract getMainModel (): any
  abstract parseEditorSection (section?: EditorSection): void
  protected abstract updateEditorsModels (): void
}
