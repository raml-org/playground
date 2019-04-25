/**
 * Created by antoniogarrote on 18/05/2017.
 */

import * as amf from "amf-client-js";
import * as vis from 'vis';

interface GraphModel {
    nodes: vis.Node[],
    edges: vis.Edge[]

}
export class AstGraph {
    private options: vis.Options = {};
    public network: vis.Network;
    public minScale: number = null;
    public maxScale: number = null;

    constructor(public dialect: any) {
        const container = document.getElementById("taxonomyContainerClasses");
        const data = this.model();

        this.options = {
            layout: {
                hierarchical: {
                    direction: "UD"
                }
            },
            nodes: {
                shape: 'box',
                margin: 10,
                font: {
                    size: 12,
                    face: 'Tahoma',
                    color: "white"
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
                font: {
                    size: 12,
                    face: 'Tahoma',
                    color: "white"
                },
                color:{inherit:true},
                width: 0.15
            },
            autoResize: true,
        };


        this.resize();

        this.network = new vis.Network(container, data, this.options);
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
            return id.split("#").pop()
        } else {
            return id.split("/").pop()
        }
    }

    model(): GraphModel {
        let edges: vis.Edge[] = [];
        let missingProperties = {};
        const nodes: vis.Node[] = [];
        const mappings = {};
        this.dialect.declares.forEach((mapping) => {
            mappings[mapping.id] = mapping;
        });

        var dialectTitle = this.dialect.name().value() + " " + this.dialect.version().value();
        nodes.push({
            id: "ROOT",
            label: dialectTitle,
            title: dialectTitle,
            color: this.ROOT_COLOR
        });

        const rootId = this.dialect.documents().root().encoded().value();
        edges.push({
            from: "ROOT",
            to: rootId,
            label: "root node",
            font: {strokeWidth: 0}
        });
        this.traverse(rootId, edges, nodes, mappings);
        return {
            nodes: nodes,
            edges: edges
        }
    }

    protected traverse(id: string, edges: vis.Edge[], nodes: vis.Node[], mappings: any, acc: {} = {}) {
        if (acc[id] == null) {
            acc[id] = true;
            const mapping = mappings[id];
            const classTerm = mapping.nodetypeMapping.value();
            nodes.push({
                id: id,
                label: this.defaultLabel(classTerm),
                title: this.defaultLabel(classTerm),
                color: this.NODE_COLOR
            });
            mapping.propertiesMapping().forEach((property) => {
                const label = property.name().value();

                if (property.literalRange().isNull === false) {
                    edges.push({
                        from: id,
                        to: property.id,
                        label: label,
                        font: {strokeWidth: 0}
                    });
                    nodes.push({
                        id: property.id,
                        label: this.defaultLabel(property.literalRange().value()),
                        color: this.PROPERTY_COLOR
                    });
                } else {
                    property.objectRange().forEach((obj) => {
                        const targetId = obj.value();
                        edges.push({
                            from: id,
                            to: targetId,
                            label: label,
                            font: {strokeWidth: 0}
                        });
                        this.traverse(targetId, edges, nodes, mappings, acc);
                    });
                }
            });
        }
    }

    PROPERTY_COLOR = "#aa00ff";
    NODE_COLOR = "#14A7DE";
    ROOT_COLOR = "#aa4400";
}