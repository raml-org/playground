import * as ko from 'knockout'
import * as jsonld from 'jsonld'
import { WebApiParser as wap } from 'webapi-parser'

import { ModelProxy } from '../main/model_proxy'
import { LoadModal, LoadFileEvent } from '../view_models/load_modal'
import { CommonViewModel } from '../view_models/common_view_model'

import { HashGenerator } from './hash_generator'
import { DiffGenerator, NodeDiff } from './diff_generator'
import { Graph } from './graph'

export class ViewModel extends CommonViewModel {
  public base = this.makeBase('diff')
  public leftHash: ko.Observable<HashGenerator> = ko.observable<HashGenerator>(new HashGenerator([]));
  public rightHash: ko.Observable<HashGenerator> = ko.observable<HashGenerator>(new HashGenerator([]));
  public started: ko.Observable<boolean> = ko.observable<boolean>(false);
  public diff: ko.Observable<DiffGenerator> = ko.observable<DiffGenerator>(new DiffGenerator(new HashGenerator([]), new HashGenerator([])));
  public editorSection: ko.Observable<string> = ko.observable<string>('editor');
  public graph: Graph | null = null;
  public allNodes: ko.Observable<NodeDiff[]> = ko.observable<NodeDiff[]>([]);
  public sortBy: string = 'assertionsAdded';
  public sortDirection: number = 1;
  public selectedNode: ko.Observable<NodeDiff> = ko.observable<NodeDiff>(new NodeDiff('', ''));
  public isLoading: ko.Observable<boolean> = ko.observable<boolean>(false);

  public constructor (public leftEditor: any, public rightEditor: any) {
    super()

    this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (evt: LoadFileEvent) => {
      return wap.raml10.parse(evt.location)
        .then((parsedModel) => {
          this.loadedRamlUrl = evt.location
          this.model = new ModelProxy(parsedModel, 'raml')
          this.getMainModel().setValue(parsedModel.raw)
        })
        .catch(err => console.error(`Failed to parse file: ${err}`))
    })
  }

  public apply (): any {
    super.apply().then(() => {
      this.editorSection.subscribe(value => {
        if (value === 'graph') {
          if (this.graph != null) {
            this.graph.clear()
          }
          this.graph = new Graph(this.diff())
        }
      })
    })
  }

  public unselectModal () {
    this.selectedNode(new NodeDiff('', ''))
  }

  public nodesSortBy (property: string) {
    if (this.sortBy === property) {
      this.sortDirection = this.sortDirection * -1
    } else {
      this.sortDirection = 1
    }
    this.sortBy = property
    this.allNodes(this.sortedNodes())
  }

  public computeDiff () {
    this.isLoading(true)
    this.started(true)
    this.hashEditor(this.leftEditor, l => {
      this.hashEditor(this.rightEditor, r => {
        this.leftHash(l)
        this.rightHash(r)
        this.diff(new DiffGenerator(this.leftHash(), this.rightHash()))
        this.allNodes(this.sortedNodes())
        this.isLoading(false)
      })
    })
  }

  private sortedNodes () {
    return this.diff().allNodes().sort((a, b) => {
      let objA = a[this.sortBy]
      let objB = b[this.sortBy]
      let valA: number | string = 0
      let valB: number | string = 0

      if (typeof (objA) === 'string') {
        valA = objA || ''
        valB = objB || ''
      } else if (objA instanceof Array) {
        valA = objA.length
        valB = objB.length
      }
      if (valA < valB) {
        return this.sortDirection
      } else if (valA > valB) {
        return -1 * this.sortDirection
      } else {
        return 0
      }
    })
  }

  protected hashEditor (editor, cb) {
    wap.raml10.parse(editor.getValue(), this.loadedRamlUrl)
      .then(model => wap.raml10.resolve(model))
      .then(model => wap.amfGraph.generateString(model))
      .then(text => {
        jsonld.flatten(JSON.parse(text), (e, flattened) => {
          if (e !== null) {
            console.error(`Error processing JSON-LD: ${e.toString()}`)
            return
          }
          cb(new HashGenerator(flattened as any[]))
        })
      })
      .catch(e => {
        console.error(`Error generating hash: ${e.toString()}`)
      })
  }

  public getMainModel (): any {
    return this.leftEditor.getModel()
  }

  public parseEditorSection (section?: any) {}
  public updateEditorsModels () {}
}
