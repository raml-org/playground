import * as ko from 'knockout'
import * as amf from 'amf-client-js'
import * as jsonld from 'jsonld'
import { HashGenerator } from './hash_generator'
import { DiffGenerator, NodeDiff } from './diff_generator'
import { Graph } from './graph'

export class ViewModel {
  public leftHash: ko.KnockoutObservable<HashGenerator> = ko.observable<HashGenerator>(new HashGenerator([]));
  public rightHash: ko.KnockoutObservable<HashGenerator> = ko.observable<HashGenerator>(new HashGenerator([]));
  public started: ko.KnockoutObservable<boolean> = ko.observable<boolean>(false);
  public diff: ko.KnockoutObservable<DiffGenerator> = ko.observable<DiffGenerator>(new DiffGenerator(new HashGenerator([]), new HashGenerator([])));
  public editorSection: ko.KnockoutObservable<string> = ko.observable<string>('editor');
  public graph: Graph | null = null;
  public allNodes: ko.KnockoutObservable<NodeDiff[]> = ko.observable<NodeDiff[]>([]);
  public sortBy: string = 'assertionsAdded';
  public sortDirection: number = 1;
  public selectedNode: ko.KnockoutObservable<NodeDiff> = ko.observable<NodeDiff>(new NodeDiff('', ''));
  public isLoading: ko.KnockoutObservable<boolean> = ko.observable<boolean>(false);

  public apply (location: Node) {
    window['viewModel'] = this
    amf.plugins.features.AMFValidation.register()
    amf.plugins.document.Vocabularies.register()
    amf.plugins.document.WebApi.register()
    amf.Core.init().then(() => {
      ko.applyBindings(this)
      this.editorSection.subscribe((value) => {
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
    this.hashEditor(this.leftEditor, (l) => {
      this.hashEditor(this.rightEditor, (r) => {
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
    const toParse = editor.getValue()
    amf.Core
      .parser('RAML 1.0', 'application/yaml')
      .parseStringAsync(toParse).then((model) => {
        try {
          return amf.Core
            .generator('AMF Graph', 'application/ld+json')
            .generateString(model).then((text) => {
              jsonld.flatten(JSON.parse(text), (e, flattened) => {
                if (e == null) {
                  const g = new HashGenerator(flattened as any[])
                  cb(g)
                } else {
                  console.log(e)
                  console.log('Error processing JSON-LD')
                }
              })
            }).catch((e) => {
              console.log('Exception parsing shape')
              console.log(e)
            })
        } catch (e) {
          console.log('Exception parsing shape')
          console.log(e)
        }
      }).catch((e) => {
        console.log('Error parsing RAML Type')
      })
  }
}
