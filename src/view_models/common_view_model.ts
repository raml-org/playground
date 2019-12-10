import * as ko from 'knockout'
import * as url from 'url'
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
  public base: string;
  public loadedRamlUrl = '';
  public ramlUrlQueryParam = 'loadedRamlUrl'

  constructor () {
    const params = new URLSearchParams(window.location.search)
    const value = params.get(this.ramlUrlQueryParam)
    if (value) {
      this.loadedRamlUrl = value
    }
  }

  public makeBase (name: string): string {
    const href = window.location.href.toString()
    const sep = href.includes(`${name}.html`) ? `${name}.html` : name
    return href.split(sep)[0]
  }

  public apply (): any {
    globalThis.viewModel = this
    return wap.init().then(() => {
      ko.applyBindings(this)
    })
  }

  public switchDemo (obj, event) {
    const URL_LENGTH_LIMIT = 1850
    let href = event.target.value
    if (this.loadedRamlUrl) {
      href += `?${this.ramlUrlQueryParam}=${this.loadedRamlUrl}`
    }
    const value = this.getMainModel().getValue()
    const encoded = encodeURIComponent(value)
    if (value) {
      const qch = this.loadedRamlUrl ? '&' : '?'
      href += `${qch}${this.queryParamName}=${encoded.slice(0, URL_LENGTH_LIMIT)}`
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

  protected isUrl (val: string) {
    try {
      new URL(val)
      return true
    } catch (err) {
      return false
    }
  }

  public loadRamlFromQueryParam () {
    const params = new URLSearchParams(window.location.search)
    let value = params.get(this.queryParamName)
    // Query param is not provided or has no value
    if (!value) {
      return
    }

    if (this.isUrl(value)) {
      // Query param value is a RAML file URL
      this.loadModal.fileUrl(value.trim())
      this.loadModal.save()
    } else {
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

  public loadDefaultRaml (fpath: string) {
    const params = new URLSearchParams(window.location.search)
    if (params.get(this.queryParamName)) {
      return
    }
    if (!this.isUrl(fpath)) {
      fpath = url.resolve(this.base, fpath)
    }
    this.loadModal.fileUrl(fpath)
    this.loadModal.save()
  }

  abstract getMainModel (): any
  abstract parseEditorSection (section?: EditorSection): void
  protected abstract updateEditorsModels (): void
}
