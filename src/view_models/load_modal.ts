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
  public fileUrl: KnockoutObservable<string> = ko.observable<string>('');

  public show () {
    this.fileUrl('')
    this.el().className += ' is-active'
  }

  public hide () {
    const el = this.el()
    el.className = el.className.replace('is-active', '')
  }

  public cancel () {
    this.fileUrl('')
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
