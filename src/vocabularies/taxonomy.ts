/**
 * Created by antoniogarrote on 18/05/2017.
 */

import * as amf from "amf-client-js";
import * as vis from 'vis';
import {Formats} from "./view_model";

interface GraphModel {
    nodes: vis.Node[],
    edges: vis.Edge[]

}
export class Taxonomy {
    private options: vis.Options = {};
    public network: vis.Network;
    public minScale: number = null;
    public maxScale: number = null;
    public format: Formats;

    constructor(public models: amf.model.document.DeclaresModel[], format: Formats) {
        this.format = format;
        const container = document.getElementById(this.format === "taxonomy" ? "taxonomyContainerClasses" : "taxonomyContainerProperties");
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

        this.network = new vis.Network(container, data, this.options);
        this.network.startSimulation();
        setTimeout(() => {
            this.network.stopSimulation();
        }, 5000);
    }

    resize() {

        var height = document.documentElement.clientHeight;
        var editors = ["taxonomyContainerClasses", "taxonomyContainerProperties"];
        editors.forEach(function (editor) {
            var containerDiv = document.getElementById(editor);
            if (containerDiv != null) {
                var style = window.getComputedStyle(containerDiv);
                var hidden = style.display == "none";
                if (!hidden) {
                    containerDiv.setAttribute("style", "height: " + (height - 170) + "px; background-color: #272b30");
                }
            }
        });
    }


    clear() {
        let container = document.getElementById(this.format === "taxonomy" ? "taxonomyContainerClasses" : "taxonomyContainerProperties");
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
        let acc: vis.Edge[] = [];
        let missingClasses = {};
        let missingProperties = {};
        const classTerms = [
            {
                id: "owl:Thing",
                label: "Thing",
                title: "Thing",
                color: "#14A7DE"
            }
        ];
        const propertyTerms = [
            {
                id: "owl:Property",
                label: "Property",
                title: "Property",
                color: "#23d160"
            }
        ];

        this.models.forEach((model) => {
            model.declares.forEach((elem) => {
                if (elem instanceof amf.model.domain.ClassTerm) {
                    const classTerm = elem as amf.model.domain.ClassTerm;
                    missingClasses[(classTerm as any).id] = true;
                    const name = (classTerm.displayName as any).isNull ? this.defaultLabel((classTerm as any).id): (classTerm.displayName as any).value();
                    classTerms.push({
                        id: (classTerm as any).id,
                        label: name,
                        title: name,
                        color: "#14A7DE"
                    });
                } else {
                    const propertyTerm = elem as any;
                    const name = (propertyTerm.displayName as any).isNull ? this.defaultLabel((propertyTerm as any).id): (propertyTerm.displayName as any).value();
                    missingProperties[(propertyTerm as any).id] = true;
                    propertyTerms.push({
                        id: (propertyTerm as any).id,
                        label: name,
                        title: name,
                        color: "#23d160"
                    });
                }
            });
        });

        this.models.forEach((model) => {
            model.declares.forEach((elem) => {
                if (elem instanceof amf.model.domain.ClassTerm) {
                    missingClasses[(elem as any).id] = true;
                    let defaultNode = "owl:Thing";
                    if ((elem["subClassOf"] || []).length == 0) {
                        acc.push({
                            color: "#ffffff",
                            from: (elem as any).id,
                            to: defaultNode
                        })
                    } else {
                        (elem["subClassOf"] || []).forEach((f) => {
                            if (missingClasses[f.value()] == null) {
                                missingClasses[f.value()] = false
                            }
                            acc.push({
                                color: "#ffffff",
                                from: (elem as any).id,
                                to: f.value()
                            });
                        })
                    }
                } else {
                    let defaultNode = "owl:Property";
                    missingProperties[(elem as any).id] = true;
                    if ((elem["subPropertyOf"] || []).length == 0) {
                        acc.push({
                            color: "#ffffff",
                            from: (elem as any).id,
                            to: defaultNode
                        })
                    } else {
                        (elem["subPropertyOf"] || []).forEach((f) => {
                            if (missingProperties[f.value()] == null) {
                                missingProperties[f.value()] = false
                            }
                            acc.push({
                                color: "#ffffff",
                                from: (elem as any).id,
                                to: f.value()
                            });
                        })
                    }
                }
            });
        });

        for (let missingClass in missingClasses) {
            if (missingClasses[missingClass] === false) {
                const name = this.defaultLabel(missingClass);
                classTerms.push({
                    id: missingClass,
                    label: name,
                    title: name,
                    color: "#14A7DE"
                });
                acc.push({
                    color: "#ffffff",
                    from: missingClass,
                    to: "owl:Thing"
                });
            }
        }
        for (let missingProp in missingProperties) {
            if (missingProperties[missingProp] === false) {
                const name = this.defaultLabel(missingProp);
                propertyTerms.push({
                    id: (missingProp as any),
                    label: name,
                    title: name,
                    color: "#23d160"
                });
                acc.push({
                    color: "#ffffff",
                    from: missingProp,
                    to: "owl:Property"
                });
            }
        }
        if (this.format === "taxonomy-properties") {
            return {
                nodes: propertyTerms,
                edges: acc
            };
        } else {
            return {
                nodes: classTerms,
                edges: acc
            }
        }
    }
}