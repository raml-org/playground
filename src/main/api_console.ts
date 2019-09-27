import { WebApiParser as wap } from 'webapi-parser'

export class ApiConsole {
  public elsRanges: any[]
  public container: any
  public defaultSelected: string = 'summary'
  public defaultSelectedType: string = 'summary'

  constructor () {
    this.reloadContainer()
  }

  reloadContainer () {
    this.container = document.querySelector('api-documentation')
    return this.container
  }

  /* Resets container amf, selected and selectedType. */
  reset (wapModel: any) {
    return wap.amfGraph.generateString(wapModel)
      .then(graph => {
        this.container.amf = JSON.parse(graph)
        this.container.selected = this.defaultSelected
        this.container.selectedType = this.defaultSelectedType
        this.collectElementsRanges(wapModel)
      })
  }

  /* Collects elements ranges info. */
  collectElementsRanges (wapModel: any) {
    const creds = [
      { type: 'http://www.w3.org/ns/shacl#NodeShape', selectedType: 'type' },
      { type: 'http://a.ml/vocabularies/http#EndPoint', selectedType: 'endpoint' },
      { type: 'http://www.w3.org/ns/hydra/core#Operation', selectedType: 'method' },
      { type: 'http://a.ml/vocabularies/security#SecurityScheme', selectedType: 'security' },
      { type: 'http://schema.org/CreativeWork', selectedType: 'documentation' }
    ]
    this.elsRanges = []
    creds.forEach(cred => {
      wapModel.findByType(cred.type)
        .filter(el => !!el.position)
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
  findNearestElement (pos: monaco.Position): any | undefined {
    let withinRange = this.elsRanges.filter(el => {
      console.log(el.id, el.rng.start.line, pos.lineNumber, el.rng.end.line) // DEBUG
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

  switchSelected (pos: monaco.Position) {
    const nearest = this.findNearestElement(pos)
    if (nearest !== undefined && this.container.selected !== nearest.id) {
      this.container.selected = nearest.id
      this.container.selectedType = nearest.selectedType
      console.log(nearest.selectedType, nearest.id) // DEBUG
    }
  }
}
