import * as ko from 'knockout'
import axios from 'axios'

export class LoadFileEvent {
  constructor (public location: string) {

  }
}

function getBaseUrl () {
  var re = new RegExp(/^.*\//)
  return re.exec(window.location.href)[0]
}

export class LoadModal {
  static LOAD_FILE_EVENT: string = 'load-file';

  public fileUrl: KnockoutObservable<string> = ko.observable<string>('');

  public ghExamplesRepo = 'raml-org/raml-examples';
  public ghExamples: KnockoutObservableArray<any> = ko.observableArray([]);
  public selectedGhExample: KnockoutObservable<any> = ko.observable<any>();

  public constructor () {
    this.selectedGhExample.subscribe((newValue) => {
      if (newValue != null) {
        this.fileUrl(newValue.url)
      }
    })

    this.loadGhExamples()
  }

  /*
    Loads RAML examples from `this.ghExamplesRepo` github repository.
    First gets SHA of the latest commit on default branch and then
    loads files tree of that commit.
  */
  public loadGhExamples () {
    const apiBase = `https://api.github.com/repos/${this.ghExamplesRepo}`
    return axios.get(`${apiBase}/commits`)
      .then(resp => {
        const latestCommit = resp.data[0].sha
        return axios.get(`${apiBase}/git/trees/${latestCommit}?recursive=1`)
      })
      .then(resp => {
        const ramlFiles = resp.data.tree.filter(el => {
          return el.type === 'blob' && el.path.endsWith('.raml')
        })
        ramlFiles.forEach(el => {
          this.ghExamples.push({
            name: el.path,
            url: `https://raw.githubusercontent.com/${this.ghExamplesRepo}/master/${el.path}`
          })
        })
      })
  }

  public show () {
    this.fileUrl('')
    this.selectedGhExample(null)
    this.el().className += ' is-active'
  }

  public hide () {
    const el = this.el()
    el.className = el.className.replace('is-active', '')
  }

  public cancel () {
    this.fileUrl('')
    this.selectedGhExample(null)
    this.hide()
  }

  public save () {
    this.emit(LoadModal.LOAD_FILE_EVENT, new LoadFileEvent(this.fileUrl()))
    this.hide()
  }

  private listeners: ((e: LoadFileEvent) => undefined)[] = [];

  on (evt, listener) {
    this.listeners.push(listener)
  }

  emit (evtName: string, evt: LoadFileEvent) {
    this.listeners.forEach(l => l(evt))
  }

  public el () {
    const el = document.getElementById('load-modal')
    if (el != null) {
      return el
    } else {
      console.error('Cannot find load-model modal element')
    }
  }
}
