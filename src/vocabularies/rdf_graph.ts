/**
 * Created by antoniogarrote on 18/05/2017.
 */

import * as amf from "amf-client-js";
import * as vis from 'vis';

interface GraphModel {
    nodes: vis.Node[],
    edges: vis.Edge[]

}
export class RdfGraph {
    private options: vis.Options = {};
    public network: vis.Network;
    public minScale: number = null;
    public maxScale: number = null;
    public edges: vis.Edge[] = [];
    public nodes: vis.Node[] = [];

    constructor(public jsonld: string) {
        const container = document.getElementById("taxonomyContainerClasses");
        this.model(JSON.parse(jsonld));

        this.options = {
            interaction: {
                selectConnectedEdges: true,
                keyboard: {
                    bindToWindow: true
                },
                tooltipDelay: 500,
                navigationButtons: true
            },
            physics: {
                barnesHut: {
                    centralGravity: .15
                },
                solver: "barnesHut",
                timestep: .6
            },
            nodes: {
                shape: 'dot',
                font: {
                    size: 12,
                    face: 'Tahoma',
                    color: "white",
                    strokeWidth: 1,
                    strokeColor: "#101010"
                },
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: "dynamic",
                    roundness: .5
                },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: .5
                    }
                },
                color:{inherit:true},
                width: 0.15,
                shadow: {
                    enabled: false,
                    size: 10,
                    x: 5,
                    y: 5
                },
            },
            autoResize: true,
        };


        this.resize();

        this.network = new vis.Network(container, {nodes: this.nodes, edges: this.edges}, this.options);
        this.network.startSimulation();
        setTimeout(() => {
            this.network.stopSimulation();
        }, 5000);
    }

    resize() {

        var height = document.documentElement.clientHeight;
        var editors = ["taxonomyContainerClasses"];
        editors.forEach(function (editor) {
            var containerDiv = document.getElementById(editor);
            var style = window.getComputedStyle(containerDiv);
            var hidden = style.display == "none";
            if (!hidden) {
                containerDiv.setAttribute("style", "height: " + (height - 150) + "px; background-color: #272b30");
            }
        });
    }


    clear() {
        let container = document.getElementById("taxonomyContainerClasses");
        container.removeChild(container.firstChild);
    }

    protected defaultLabel(id: string) {
        if (id.indexOf("#") > -1) {
            const res = id.split("#").pop()
            if (res !== "") {
                return res;
            } else {
                return id;
            }
        } else {
            return id.split("/").pop()
        }
    }

    model(nodes: any): GraphModel {
        const topNode = nodes[0];
        var dups = {};
        this.traverse(topNode, dups)
    }

    protected traverse(node: any, dups: any) {
        var id = node["@id"];
        if (!dups[id]) {
            dups[id] = true;
            this.nodes.push({
                id: id,
                label: this.defaultLabel(id),
                title: this.defaultLabel(id),
                color: this.NODE_COLOR
            });
            for (let p in node) {
                if (p != "@type") {
                    var val = node[p];
                    if (val.constructor == Array) {
                        (val as any[]).forEach((elem) => {
                            if (elem["@id"] != null) {
                                var targetId = elem["@id"];
                                this.edges.push({
                                    from: id,
                                    to: targetId,
                                    label: this.defaultLabel(p),
                                    font: {strokeWidth: 0, color: "white"}
                                });
                                this.traverse(elem, dups)
                            }
                        })
                    } else if (typeof val == "object") {
                        if (val["@id"] != null) {
                            var targetId = val["@id"];
                            this.edges.push({
                                from: id,
                                to: targetId,
                                label: this.defaultLabel(p),
                                font: {strokeWidth: 0, color: "white"}
                            });
                            this.traverse(val, dups)
                        }
                    }
                } else {
                    for (var type of node["@type"]) {
                        if (!dups[type]) {
                            dups[type] = true;
                            this.nodes.push({
                                id: type,
                                label: this.defaultLabel(type),
                                title: this.defaultLabel(type),
                                color: this.PROPERTY_COLOR
                            });
                        }
                        this.edges.push({
                            from: id,
                            to: type
                        })
                    }
                }
            }
        }
    }

    PROPERTY_COLOR = "#aa00ff";
    NODE_COLOR = "#14A7DE";
    ROOT_COLOR = "#aa4400";
}