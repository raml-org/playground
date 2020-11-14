import * as ko from 'knockout'

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

  public fileUrl: ko.Observable<string> = ko.observable<string>('');

  // Array of elements similar to:
  // {name: "myApi.raml", url: "https://example.com/myApi.raml"}
  public ghExamples: ko.ObservableArray<any> = ko.observableArray([]);
  public selectedGhExample: ko.Observable<any> = ko.observable<any>();

  public constructor () {
    this.selectedGhExample.subscribe((newValue) => {
      if (newValue != null) {
        this.fileUrl(newValue.url)
      }
    })

    this.loadRamlExamples()
  }

  /*
    Loads RAML examples data from a JSON file. The file is populated by
    `gulp reloadRamlExamples` command.
  */
  public loadRamlExamples () {
    const urlPieces = window.location.href.split('/').slice(0, -1)
    urlPieces.push('raml-examples.json')
    return fetch(urlPieces.join('/'))
      .then(resp => resp.text())
      .then(text => {
        JSON.parse(text).forEach(x => this.ghExamples.push(x))
      })
      .catch(e => {
        console.error(`Failed to load RAML examples: ${e.toString()}`)
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
