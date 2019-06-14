import * as joint from 'jointjs'
import {
  DocumentId, Fragment, Module, Document, Unit,
  DomainElement } from '../main/units_model'
import * as domain from '../main/domain_model'
import {
  APIDocumentation, EndPoint, Operation,
  Response, Request, Payload,
  IncludeRelationship } from '../main/domain_model'
import * as utils from '../utils'
import Rect = joint.shapes.basic.Rect;
import Link = joint.dia.Link;
import Generic = joint.shapes.basic.Generic;
import Cell = joint.dia.Cell;
import Graph = joint.dia.Graph;
import Paper = joint.dia.Paper;

const CHAR_SIZE = 10

const DEFAULT_LINK_COLOR = '#748599'
const SELECTED_STROKE_COLOR = '#748599'
const DEFAULT_LABEL_COLOR = '#748599'
const NODE_TEXT_COLOR = '#fff'

const COLORS = {
  'encodes': '#748599',
  'declares': '#748599',
  'references': '#748599',

  'unit': '#115CD4',
  'domain': '#115CD4',
  'declaration': '#115CD4'
}

export class PlaygroundGraph {
  public nodes: {[id:string]: Rect};
  public links: Link[];
  public paper: Paper;
  public scaleX = 1;
  public scaleY = 1;
  public elements: (DocumentId & Unit)[];

  constructor (public selectedId: string, public level: 'domain' | 'document', public handler: (id: string, unit: any) => void) {}

  process (elements: (DocumentId & Unit)[]) {
    this.nodes = {}
    this.links = []
    this.elements = elements
    this.elements.forEach(element => {
      if (element.kind === 'Fragment') {
        this.processFragmentNode(element as Fragment)
      } else if (element.kind === 'Module') {
        this.processModuleNode(element as Module)
      } else if (element.kind === 'Document') {
        this.processDocumentNode(element as Document)
      }
    })

    this.elements.forEach(element => {
      this.processReferences(element)
    })
  }

  render (div: string, cb: () => undefined) {
    setTimeout(() => {
      const graphContainer = document.getElementById(div)
      if (graphContainer != null) {
        let classes: Cell[] = []
        for (let p in this.nodes) {
          classes.push(this.nodes[p])
        }

        let cells: Cell[] = (classes).concat(this.links)
        let acc = {}
        cells.forEach(c => acc[c.id] = true)

        const finalCells = cells.filter(c => {
          return (c.attributes.source == null) || (acc[c.attributes.source.id] && acc[c.attributes.target.id])
        })
        // const finalCells = cells;
        if (joint.layout != null) {
          joint.layout.DirectedGraph.layout(finalCells, {
            marginX: 50,
            marginY: 50,
            nodeSep: 100,
            edgeSep: 100,
            rankSep: 100,
            rankDir: 'TB'
          })
        }

        let sorter = (a, b) => {
          if (a > b) {
            return -1
          } else if (a < b) {
            return 1
          } else {
            return 0
          }
        }

        const widths = finalCells.map(c => {
          return c['attributes'].position ? (c['attributes'].position.x + c['attributes'].size.width) : 0
        }).sort(sorter)

        const heights = finalCells.map(c => {
          return c['attributes'].position ? (c['attributes'].position.y + c['attributes'].size.height) : 0
        }).sort(sorter)

        const maxX = widths[0]
        const maxY = heights[0]

        const graph: any = new Graph()
        let width = maxX + 100
        let height = maxY + 100

        if (graphContainer != null) {
          graphContainer.innerHTML = ''

          let minWidth = graphContainer.clientWidth
          // let minHeight = graphContainer.clientHeight;
          let minHeight = window.innerHeight - 300

          const options = {
            el: graphContainer,
            width: (minWidth > width ? minWidth : width),
            height: (minHeight > height ? minHeight : height),
            gridSize: 1,
            interactive: false
          }
          options['model'] = graph
          this.paper = new Paper(options)

          this.paper.on('cell:pointerdown',
            (cellView, evt, x, y) => {
              const nodeId = cellView.model.attributes.attrs.nodeId
              const unit = cellView.model.attributes.attrs.unit
              this.handler(nodeId, unit)
            }
          )

          graph.addCells(finalCells)
          // this.paper.fitToContent();
          // this.resetZoom();

          let zoomx = 1
          let zoomy = 1
          if (minWidth < width) {
            zoomx = minWidth / width
          }
          if (minHeight < height) {
            zoomy = minHeight / height
          }
          let zoom = zoomy < zoomx ? zoomy : zoomx
          this.paperScale(zoom, zoom)
          this.paper.removeTools()
          if (cb) {
            cb()
          } else {

          }
          return true
        }
      }
    }, 100)
  }

  paperScale (sx, sy) {
    this.scaleX = sx
    this.scaleY = sy
    this.paper.scale(sx, sy)
    this.paper.fitToContent()
    this.centerGraphX()
  }

  centerGraphX () {
    let container = document.getElementById('graph-container')
    let containerWidth = container.clientWidth
    let contentWidth = this.paper.getContentBBox().width
    let offset = (containerWidth - contentWidth) / 2
    if (contentWidth + offset > containerWidth) {
      container.scroll(Math.abs(offset), 0)
    } else {
      this.paper.translate(offset)
      this.paper.setDimensions('100%')
    }
  }

  zoomOut () {
    this.scaleX -= 0.05
    this.scaleY -= 0.05
    this.paperScale(this.scaleX, this.scaleY)
  }

  zoomIn () {
    this.scaleX += 0.05
    this.scaleY += 0.05
    this.paperScale(this.scaleX, this.scaleY)
  }

  resetZoom () {
    this.scaleX = 1
    this.scaleY = 1
    this.paperScale(this.scaleX, this.scaleY)
  }

  private processFragmentNode (element: Fragment) {
    this.makeNode(element, 'unit', element)
    if (element.encodes != null) {
      const encodes = element.encodes
      const encoded = encodes.domain ? encodes.domain.root : undefined
      if (encoded && this.level === 'domain') {
        this.processDomainElement(element.id, encodes.domain ? encodes.domain.root : undefined)
      } else if (this.level === 'document') {
        this.makeNode(encodes, 'domain', encodes)
        this.makeLink(element.id, encodes.id, 'encodes')
      }
    }
  }

  private processModuleNode (element: Module) {
    this.makeNode(element, 'unit', element)
    if (element.declares != null) {
      element.declares.forEach(declaration => {
        if (this.nodes[declaration.id] == null) {
          this.makeNode(declaration, 'declaration', declaration)
        }
        this.makeLink(element.id, declaration.id, 'declares')
      })
    }
  }

  private processDocumentNode (document: Document) {
    this.makeNode(document, 'unit', document)
    // first declarations to avoid refs in the domain level pointing
    // to declarations not added yet
    if (document.declares != null) {
      document.declares.forEach(declaration => {
        if (this.nodes[declaration.id] == null) {
          this.makeNode(declaration, 'declaration', declaration)
        }
        this.makeLink(document.id, declaration.id, 'declares')
      })
    }
    if (document.encodes != null) {
      const encodes = document.encodes
      const encoded = encodes.domain ? encodes.domain.root : undefined
      if (encoded && this.level === 'domain') {
        this.processDomainElement(document.id, encodes.domain ? encodes.domain.root : undefined)
      } else {
        this.makeNode(encodes, 'domain', encodes)
        this.makeLink(document.id, encodes.id, 'encodes')
      }
    }
  }

  private processDomainElement (parentId: string, element: domain.DomainElement | undefined) {
    if (element) {
      const domainKind = element.kind
      switch (domainKind) {
        case 'APIDocumentation': {
          this.makeNode(element, 'domain', element)
          this.makeLink(parentId, element.id, 'encodes');
          ((element as APIDocumentation).endpoints || []).forEach(endpoint => {
            this.processDomainElement(element.id, endpoint)
          })
          break
        }
        case 'EndPoint': {
          this.makeNode(element, 'domain', element)
          this.makeLink(parentId, element.id, 'endpoint');
          ((element as EndPoint).operations || []).forEach(operation => {
            this.processDomainElement(element.id, operation)
          })
          break
        }
        case 'Operation': {
          this.makeNode({ id: element.id, label: (element as Operation).method }, 'domain', element)
          this.makeLink(parentId, element.id, 'supportedOperation');
          ((element as Operation).requests || []).forEach(request => {
            this.processDomainElement(element.id, request)
          });
          ((element as Operation).responses || []).forEach(response => {
            this.processDomainElement(element.id, response)
          })
          break
        }
        case 'Response': {
          this.makeNode({ id: element.id, label: (element as Response).status }, 'domain', element)
          this.makeLink(parentId, element.id, 'returns');
          ((element as Response).payloads || []).forEach(payload => {
            this.processDomainElement(element.id, payload)
          })
          break
        }
        case 'Request': {
          this.makeNode({ id: element.id, label: 'request' }, 'domain', element)
          this.makeLink(parentId, element.id, 'expects');
          ((element as Request).payloads || []).forEach(payload => {
            this.processDomainElement(element.id, payload)
          })
          break
        }
        case 'Payload': {
          this.makeNode({ id: element.id, label: (element as Payload).mediaType || '*/*' }, 'domain', element)
          this.makeLink(parentId, element.id, 'payload')
          this.processDomainElement(element.id, (element as Payload).schema)
          break
        }
        case 'Shape': {
          this.makeNode(element, 'domain', element)
          this.makeLink(parentId, element.id, 'shape')
          break
        }
        case 'Include': {
          this.makeNode(element, 'relationship', element)
          this.makeLink(parentId, element.id, 'include')
          this.makeLink(element.id, (element as IncludeRelationship).target, 'includes')
          break
        }
        default: {
          this.makeNode(element, 'domain', element)
          break
        }
      }
    } else {
      return undefined
    }
  }

  private processReferences (element: DocumentId & Unit) {
    if (element.references) {
      element.references.forEach(ref => {
        const reference = ref as DocumentId
        if (reference.id && this.nodes[reference.id] != null) {
          this.makeLink(element.id, reference.id, 'references')
        }
      })
    }
  }

  private makeNode (node: {id: string, label: string}, kind: string, unit: any) {
    const label = node.label != null ? node.label : utils.label(node.id)
    if (this.nodes[node.id] == null) {
      this.nodes[node.id] = new Rect({
        attrs: {
          rect: {
            fill: COLORS[kind],
            stroke: node.id === this.selectedId ? SELECTED_STROKE_COLOR : NODE_TEXT_COLOR,
            'stroke-width': node.id === this.selectedId ? '3' : '1'
          },
          text: {
            text: label,
            fill: NODE_TEXT_COLOR
          }
        },
        position: {
          x: 0,
          y: 0
        },
        size: {
          width: label.length * CHAR_SIZE,
          height: 30
        }
      })
      this.nodes[node.id].attributes.attrs.nodeId = node.id
      this.nodes[node.id].attributes.attrs.unit = unit
    }
  }

  private makeLink (sourceId: string, targetId: string, label: string) {
    if (this.nodes[sourceId] && this.nodes[targetId]) {
      this.links.push(new Link({
        source: { id: this.nodes[sourceId].id },
        target: { id: this.nodes[targetId].id },
        attrs: {
          '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z',
            fill: COLORS[label] || DEFAULT_LINK_COLOR,
            stroke: COLORS[label] || DEFAULT_LINK_COLOR
          },
          '.connection': { stroke: COLORS[label] || DEFAULT_LINK_COLOR }
        },
        arrowheadMarkup: '<g />',
        labels: [{
          position: 0.5,
          attrs: {
            text: {
              text: label,
              stroke: DEFAULT_LABEL_COLOR
            }
          }
        }]
      }))
    }
  }
}
