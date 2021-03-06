import { WebApiParser as wap } from 'webapi-parser'

export class ApiConsole {
  public elsRanges: any[]
  public container: any
  public navContainer: any
  public defaultSelected: string = 'summary'
  public defaultSelectedType: string = 'summary'

  constructor () {
    this.reloadContainers()
  }

  reloadContainers () {
    this.container = document.querySelector('x-api-documentation')
    this.navContainer = document.querySelector('api-navigation')
  }

  /* Resets container amf, selected and selectedType. */
  reset (wapModel: any) {
    return wap.amfGraph.generateString(wapModel)
      .then(graph => {
        const parsedGraph = JSON.parse(graph)
        this.container.amf = parsedGraph
        this.navContainer.amf = parsedGraph
        this.dispatchNavEvent(this.defaultSelected, this.defaultSelectedType)
        this.collectElementsRanges(wapModel)
      })
  }

  /* Collects elements ranges info. */
  collectElementsRanges (wapModel: any) {
    const creds = [
      { type: 'http://www.w3.org/ns/shacl#NodeShape', selectedType: 'type' },
      { type: 'http://a.ml/vocabularies/apiContract#EndPoint', selectedType: 'endpoint' },
      { type: 'http://a.ml/vocabularies/apiContract#Operation', selectedType: 'method' },
      { type: 'http://a.ml/vocabularies/security#SecurityScheme', selectedType: 'security' },
      { type: 'http://a.ml/vocabularies/core#CreativeWork', selectedType: 'documentation' }
    ]
    this.elsRanges = []
    creds.forEach(cred => {
      wapModel.findByType(cred.type)
        .filter(el => {
          let hasPosition = !!el.position
          let notLink = !el.isLink
          let notInherited = (
            !el.inherits ||
            (el.inherits && el.inherits.length === 0)
          )
          return hasPosition && notLink && notInherited
        })
        .forEach(el => {
          this.elsRanges.push({
            rng: el.position,
            blockSize: el.position.end.line - el.position.start.line,
            id: el.id,
            selectedType: cred.selectedType
          })
        })
    })
  }

  /** Finds element nearest to the position.
  *
  * Element is considered to be the nearest if:
  *  1. It wraps the position;
  *  2. Has the smallest block size.
  */
  findNearestElement (pos: any): any | undefined {
    let withinRange = this.elsRanges.filter(el => {
      return (
        pos.lineNumber >= el.rng.start.line &&
        pos.lineNumber < el.rng.end.line
      )
    })
    if (withinRange.length < 1) {
      return
    }
    withinRange.sort((x, y) => {
      if (x.blockSize > y.blockSize) {
        return 1
      }
      if (x.blockSize < y.blockSize) {
        return -1
      }
      return 0
    })
    return withinRange[0]
  }

  switchSelected (pos: any) {
    const nearest = this.findNearestElement(pos)
    if (nearest === undefined) {
      this.dispatchNavEvent(this.defaultSelected, this.defaultSelectedType)
    } else if (this.container.selected !== nearest.id) {
      this.dispatchNavEvent(nearest.id, nearest.selectedType)
    }
  }

  /* Dispatches api-navigation "selection changed" event. */
  dispatchNavEvent (selected: string, type: string) {
    window.dispatchEvent(new CustomEvent(
      'api-navigation-selection-changed',
      { detail: { selected, type } }
    ))
  }
}
