/**
 * Created by antoniogarrote on 12/05/2017.
 */

import * as ko from "knockout";
import * as amf from "amf-client-js";
import {Taxonomy} from "./taxonomy";
import {AstGraph} from "./ast_graph";
import {RdfGraph} from "./rdf_graph";
import {PredefinedQuery, Query} from "../view_models/query";
import { UI } from "../view_models/ui";
import {Unit} from "../main/units_model";

export type NavigatorSection = "files"
export type Formats = "aml" | "jsonld" | "taxonomy" | "taxonomy-properties" | "query"

interface Ref {
    name: string,
    url: string,
    kind: string,
    jsonld?: string,
    aml?: string,
    model?: any
    errors?: amf.client.validate.ValidationReport
}

export class ViewModel implements amf.resource.ResourceLoader {

    public navigatorSection: KnockoutObservable<NavigatorSection> = ko.observable<NavigatorSection>("files");
    public selectedReference: KnockoutObservable<Ref | null> = ko.observable<Ref | null>(null);
    public selectedFormat: KnockoutObservable<Formats> = ko.observable<Formats>("aml");
    public amlParser = null;
    public jsonldRenderer = null;
    public taxonomy: Taxonomy | null = null;
    public astGraph: AstGraph | null = null;
    public rdfGraph: RdfGraph | null = null;
    public ui: UI = new UI();
    public query: Query = new Query();
    // checks if we need to reparse the document
    public changesFromLastUpdate = 0;
    public documentModelChanged = false;
    public RELOAD_PERIOD = 500;

    public base = window.location.href.toString().replace("vocabularies.html","");

    public vocabsFiles: KnockoutObservableArray<Ref> = ko.observableArray([
        {"name": "music.yaml", "url": this.base + "vocabs/music/vocabulary/music.yaml", "kind": "vocabulary"},
        {"name": "music_curation.yaml", "url": this.base + "vocabs/music/vocabulary/music_curation.yaml", "kind": "vocabulary"},
        {"name": "asynchronous.yaml", "url": this.base + "vocabs/asynchronous_apis/vocabulary/asynchronous.yaml", "kind": "vocabulary"}

    ]);

    public asyncAPIDialect = {"name": "async_api.yaml", "url": this.base + "vocabs/asynchronous_apis/dialect/async_api.yaml", "kind": "dialect"}
    public dialectFiles: KnockoutObservableArray<Ref> = ko.observableArray([
        {"name": "playlist.yaml", "url": this.base + "vocabs/music/dialect/playlist.yaml", "kind": "dialect"},
        this.asyncAPIDialect
    ]);

    public instanceFiles: KnockoutObservableArray<Ref> = ko.observableArray([
        {"name": "playlist1.yaml", "url": this.base + "vocabs/music/instances/playlist1.yaml", "kind": "document"},
        {"name": "playlist2.yaml", "url": this.base + "vocabs/music/instances/playlist2.yaml", "kind": "document"},
        {"name": "basic.yaml", "url": this.base + "vocabs/asynchronous_apis/instances/basic.yaml", "kind": "document"},
        {"name": "slack.yaml", "url": this.base + "vocabs/asynchronous_apis/instances/slack.yaml", "kind": "document"}
    ]);

    public vocabularyPredefinedQueries = [
        new PredefinedQuery("Class Terms", "SELECT * { \n" +
            "  ?id rdf:type owl:Class . \n" +
            "  OPTIONAL { ?id meta:displayName ?name } .\n" +
            "  OPTIONAL { ?id schema-org:description ?description } \n" +
            "}"),
        new PredefinedQuery("Property Terms", "SELECT * { \n" +
            "  ?id rdf:type meta:Property . \n" +
            "  OPTIONAL { ?id meta:displayName ?name } .\n" +
            "  OPTIONAL { ?id schema-org:description ?description } \n" +
            "}"),
        new PredefinedQuery("Literal Property Terms", "SELECT * { \n" +
            "  ?id rdf:type owl:DatatypeProperty . \n" +
            "  OPTIONAL { ?id meta:displayName ?name } .\n" +
            "  OPTIONAL { ?id schema-org:description ?description } .\n" +
            "  OPTIONAL { ?id rdfs:range ?range } .\n" +
            "}"),
        new PredefinedQuery("Object Property Terms", "SELECT * { \n" +
            "  ?id rdf:type owl:ObjectProperty . \n" +
            "  OPTIONAL { ?id meta:displayName ?name } .\n" +
            "  OPTIONAL { ?id schema-org:description ?description } .\n" +
            "  OPTIONAL { ?id rdfs:range ?range } .\n" +
            "}")
    ];

    public dialectPredefinedQueries = [
        new PredefinedQuery("All Node Mappings", "SELECT ?id ?classTerm (count(?propertyMapping) AS ?numProperties) WHERE {\n" +
            "  ?id a meta:NodeMapping ; \n" +
            "  shacl:targetClass ?classTerm ;\n" +
            "  shacl:property ?propertyMapping\n" +
            "} \n" +
            "GROUP BY ?id ?classTerm"),
        new PredefinedQuery("All Property Mappings", "SELECT * {\n" +
            "  ?id a meta:NodePropertyMapping ; \n" +
            "  schema-org:name ?label ; \n" +
            "  shacl:path ?propertyTerm\n" +
            "}")
    ];

    public documentPredefinedQueries = [
        new PredefinedQuery("Total Playlist Duration", "SELECT ?playlist_name (SUM(?o) AS ?total_duration) WHERE { \n" +
            "  ?playlist ?p ?selection . \n" +
            "  ?playlist schema-org:name ?playlist_name .\n" +
            "  ?selection music-curation:selectedTrack ?s . \n" +
            "  ?s music:duration ?o \n" +
            "} group by ?playlist_name"),
        new PredefinedQuery("Average Playlist Score", "SELECT ?playlist_name (AVG(?score) as ?avg_score) WHERE { \n" +
            "  ?playlist ?p ?selection . \n" +
            "  ?playlist schema-org:name ?playlist_name .\n" +
            "  ?selection music-curation:score ?score\n" +
            "} GROUP BY ?playlist_name"),
        new PredefinedQuery("Songs per Artist", "SELECT ?name (COUNT(*) AS ?num_songs) WHERE { \n" +
            "  {\n" +
            "    ?playlist music:performer ?artist .\n" +
            "    ?artist schema-org:name ?name .\n" +
            "  } UNION\n" +
            "  {\n" +
            "    ?playlist music:composer ?artist .\n" +
            "    ?artist schema-org:name ?name\n" +
            "  }\n" +
            "} GROUP BY ?name")
    ];

    public constructor(public editor: any) {
        this.navigatorSection.subscribe((section) => {
            switch(section) {
                case "files": {
                    console.log("** SELECTED FILES!");
                    break;
                }
            }
        });

        this.vocabsFiles().forEach((data) => {
            this.loadFile(data.url);
        });
        this.dialectFiles().forEach((data) => {
            this.loadFile(data.url);
        });
        this.instanceFiles().forEach((data) => {
            this.loadFile(data.url);
        });

        this.selectedFormat.subscribe((format) => {
            const ref = this.selectedReference();
            if (format === "jsonld") {
                if (ref != null) {
                    this.render(ref, (err) => {
                        if (err == null && this.selectedFormat() == "jsonld" && this.selectedReference().url == ref.url) {
                            this.setEditorRawFileText(ref.jsonld, "json");
                        }
                    });
                }
            } else if (format === "aml") {
                this.setEditorRawFileText(ref.aml, "yaml");
                this.displayErrors(ref);
            } else if (format === "taxonomy" || format === "taxonomy-properties") {
                if (ref != null && ref.model == null) {
                    this.render(ref, (err) => {
                        if (err == null && (this.selectedFormat() === "taxonomy" || this.selectedFormat() === "taxonomy-properties")&& this.selectedReference().url == ref.url) {
                            if (ref.kind === "document" && ref.jsonld == null) {
                                this.render(ref, (err) => {
                                    if (err == null && (this.selectedFormat() === "taxonomy" || this.selectedFormat() === "taxonomy-properties") && this.selectedReference().url == ref.url) {
                                        this.renderGraphs(this.selectedFormat());
                                    }
                                })
                            } else {
                                this.renderGraphs(this.selectedFormat());
                            }
                        }
                    })
                } else {
                    this.renderGraphs(this.selectedFormat());
                }
            } else if (format === "query") {

                if (this.selectedReference().kind === "vocabulary")
                    this.query.predefinedQueries(this.vocabularyPredefinedQueries);
                if (this.selectedReference().kind === "dialect")
                    this.query.predefinedQueries(this.dialectPredefinedQueries);
                if (this.selectedReference().kind === "document")
                    this.query.predefinedQueries(this.documentPredefinedQueries);
                if (this.selectedReference().jsonld != null) {
                    this.query.process(this.selectedReference().jsonld, () => {})
                } else {
                    this.render(ref, (err) => {
                        this.query.process(this.selectedReference().jsonld, () => {})
                    });
                }
            }
        });

        this.editor.onDidChangeModelContent(() => {
            if (this.selectedFormat() !== "aml") {
                return;
            }
            this.changesFromLastUpdate++;
            this.documentModelChanged = true;
            ((number) => {
                setTimeout(() => {
                    const ref = this.selectedReference();
                    const text = this.editor.getModel().getValue();
                    if (ref) {
                        if (this.changesFromLastUpdate === number) {
                            this.changesFromLastUpdate = 0;
                            console.log("** Updating source text for " + ref.url);
                            ref.aml = text;
                            delete ref.model;
                            delete ref.jsonld;
                            this.parse(ref, (err) => {
                                this.displayErrors(ref)
                            });
                        }
                    }
                }, this.RELOAD_PERIOD);
            })(this.changesFromLastUpdate);
        });

        this.init().then((res) => {
            console.log("** AMF Initialised");
            setTimeout(() => {
                this.parse(this.asyncAPIDialect, (err) => {
                    console.log("Finished initial parsing of async API");
                    console.log(err);
                });
            }, 1000);
        })
    }

    protected renderGraphs(format: Formats) {
        if (this.selectedReference() && this.selectedReference().kind == "dialect") {
            setTimeout(() => {
                if (this.astGraph != null) {
                    this.astGraph.clear();
                }
                this.astGraph = new AstGraph(this.selectedReference().model);
            }, 300);
        } else if (this.selectedReference() && this.selectedReference().kind == "document") {
            setTimeout(() => {
                if (this.rdfGraph != null) {
                    this.rdfGraph.clear();
                }
                this.rdfGraph = new RdfGraph(this.selectedReference().jsonld);
            }, 300);
        } else {
            setTimeout(() => {
                if (this.taxonomy != null) {
                    this.taxonomy.clear();
                }
                const models = this.vocabsFiles().map((vocab) => vocab.model).filter((m) => m != null);
                this.taxonomy = new Taxonomy(models, format);
            }, 300);
        }
    }

    protected displayErrors(ref: Ref) {
        const model = this.editor.getModel();
        if (ref.errors && !ref.errors.conforms) {
            const errors = ref.errors.results.map((result) => this.buildMonacoErro(result));
            monaco.editor.setModelMarkers(model, model.id, errors);
        } else {
            monaco.editor.setModelMarkers(model, model.id, [])
        }
    }

    public init(): Promise<any> {
        amf.plugins.features.AMFValidation.register();
        amf.plugins.document.Vocabularies.register();
        amf.plugins.document.WebApi.register();
        this.env = new amf.client.environment.Environment();
        this.env = this.env["addClientLoader"](this);
        this.amlParser = new amf.Aml10Parser("application/yaml", this.env);
        this.jsonldRenderer = amf.AMF.amfGraphGenerator();
        return amf.Core.init();
    }

    public selectNavigatorFile(file: Ref) {
        this.selectedReference(file);
        this.selectedFormat("aml");
        if (file.aml != null) {
            this.setEditorRawFileText(file.aml, "yaml");
            if (file.jsonld == null) {
                this.parse(file, () => {})
            }
        }
    }

    protected setEditorRawFileText(text: string, mode: string) {
        const model = window["monaco"].editor.createModel(text, mode);
        this.editor.setModel(model);
    }

    public loadFile(file: string, cb:(Ref) => Unit = null) {
        const xhttp = new XMLHttpRequest();
        const that = this;
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const text = xhttp.responseText;
                console.log("** LOADED " + file);
                const doc = (
                    that.vocabsFiles().filter((f) => f.url == file)[0] ||
                    that.dialectFiles().filter((f) => f.url == file)[0] ||
                    that.instanceFiles().filter((f) => f.url == file)[0]
                );
                doc.aml = text;
                // this is the one we load by default
                if (file.indexOf("asynchronous.yaml") > -1) { that.selectNavigatorFile(doc); }
                if (cb != null) { cb(doc) }
            }
        };
        xhttp.open("GET", file, true);
        xhttp.send();
    }
    public apply(location: Node) {
        window["viewModel"] = this;
        ko.applyBindings(this);
    }

    accepts(resource: string): boolean {
        return true;
    }

    fetch(resource: string): Promise<amf.client.remote.Content> {
        return new Promise<amf.client.remote.Content>((resolve, reject) => {
            const doc = (
                this.vocabsFiles().filter((f) => resource.indexOf(f.url) > 0)[0] ||
                this.dialectFiles().filter((f) => resource.indexOf(f.url) > 0)[0] ||
                this.instanceFiles().filter((f) => resource.indexOf(f.url) > 0)[0]
            );

            if (doc != null) {
                resolve(new amf.client.remote.Content(doc.aml, resource))
            } else {
                const xhttp = new XMLHttpRequest();
                var that = this;
                xhttp.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                        const text = xhttp.responseText;
                        resolve(new amf.client.remote.Content(text, resource))
                    }
                };
                xhttp.open("GET", resource, true);
                xhttp.send();
            }
        })
    }

    protected parse(doc: Ref, cb:(report: amf.client.validate.ValidationReport) => void) {
        if (this.amlParser == null) {
            setTimeout(() => {
                this.parse(doc, cb);
            }, 500)
        } else {
            console.log("** parsing...");
            this.amlParser.parseStringAsync(doc.url, doc.aml).then((model) => {
                doc.model = model;
                console.log("** validating...");
                this.amlParser.reportValidation("AMF").then((report) => {
                    doc.errors = report;
                    cb(null);
                });
            }).catch((e) => {
                console.log("Error parsing doc " + doc.url + " => " + e);
                console.error(e);
                cb(e);
            })
        }
    }

    protected render(doc: Ref, cb: (e: Error|null) => void) {
        if (this.amlParser == null) {
            setTimeout(() => {
                this.render(doc, cb);
            }, 500)
        } else {
            if (doc.model != null) {
                console.log("** rendering...");
                this.jsonldRenderer
                    .generateString(doc.model, new amf.render.RenderOptions().withCompactUris)
                    .then((jsonld) => {
                        doc.jsonld = JSON.stringify(JSON.parse(jsonld), null, 2);
                        cb(null);
                    })
                    .catch((e) => {
                        console.log("Error generating jsonld " + doc.url + " => " + e);
                        console.error(e);
                        cb(e);
                    })
            } else {
                this.parse(doc, () => {
                    this.render(doc, cb)
                });
            }
        }
    }

    protected buildMonacoErro(error: amf.client.validate.ValidationResult): any {
        console.log("BUILDING ERROR " + error.targetNode);
        console.log(error);
        const startLineNumber = error.position.start.line;
        const startColumn = error.position.start.column;
        const endLineNumber = error.position.end.line;
        const endColumn = error.position.end.column;
        const message = error.message;
        return {
            severity: 8, // hardcoded error severity
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
            message
        }
    }
}