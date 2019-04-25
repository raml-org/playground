/**
 * Created by antoniogarrote on 12/05/2017.
 */

import * as ko from "knockout";
import * as amf from "amf-client-js";
import AnyShape = amf.model.domain.AnyShape
import { UI } from "../view_models/ui";


export type NavigatorSection = "shapes" | "errors"

interface Shape {
    id: string,
    target: string,
    message: string,
    isCustom: boolean
}

const createModel = function(text, mode) {
    return window["monaco"].editor.createModel(text, mode);
};

export class ViewModel {

    public env: amf.client.environment.Environment = null;
    public navigatorSection: KnockoutObservable<NavigatorSection> = ko.observable<NavigatorSection>("errors");

    public shapes: KnockoutObservableArray<Shape> = ko.observableArray<Shape>([]);
    public errors: KnockoutObservableArray<amf.validate.ValidationResult> = ko.observableArray<amf.validate.ValidationResult>([]);
    public selectedModel: KnockoutObservable<amf.model.document.BaseUnit|null> = ko.observable(null);

    public editorSection: KnockoutObservable<string> = ko.observable<string>("raml");
    public validationSection: KnockoutObservable<string> = ko.observable<string>("custom");
    public customValidation?: string;

    public selectedError: KnockoutObservable<any> = ko.observable<any>();
    public errorsMapShape: {[id: string]: boolean} = {};
    public ui: UI = new UI();

    public model: any | null = null;
    public modelSyntax: string | null = null;
    public modelText: string | null = null;

    public changesFromLastUpdate = 0;
    public documentModelChanged = false;
    public RELOAD_PERIOD = 1000;

    public ramlParser?
    public profilePath = "file://PlaygroundValidationProfile.aml";
    public profileName: amf.ProfileName;

    public init(): Promise<any> {
        return amf.AMF.init()
    }

    public constructor(public dataEditor: any, public shapeEditor: any) {
        const parsingApiFn = () => {
            if (this.editorSection() === "raml") {
                const toParse = shapeEditor.getValue();
                return this.ramlParser.parseStringAsync(toParse)
                    .then((parsed: amf.model.document.Document) => {
                        this.selectedModel(parsed);
                        const oldErrors = this.errors();
                        try {
                            this.doValidate();
                        } catch (e) {
                            console.log("Exception parsing API");
                            console.log(e);
                            this.errors(oldErrors);
                        }
                    }).catch((e) => {
                        console.log("Error parsing RAML API");
                    })
            }
        };

        const parsingProfileFn = () => {
            const self = this;
            if (this.validationSection() === "custom") {
                return amf.AMF.loadValidationProfile(this.profilePath, this.getEnv(dataEditor))
                    .then((profileName) => {
                        self.profileName = profileName;
                        this.loadShapes();
                        this.doValidate()
                    })
            }
        };

        this.editorSection.subscribe((section) => this.onEditorSectionChange(section));
        this.validationSection.subscribe((section) => this.onValidationSectionChange(section));

        this.init().then(() => {
            this.ramlParser = amf.AMF.raml10Parser();
            return parsingProfileFn();
        }).then(() => {
            return parsingApiFn();
        }).then(() => {
            this.loadShapes();
        }).catch((e) => {
            console.log("ERROR!!! " + e);
        });

        shapeEditor.onDidChangeModelContent(() => {
            this.changesFromLastUpdate++;
            this.documentModelChanged = true;
            ((number) => {
                setTimeout(() => {
                    if (this.changesFromLastUpdate === number) {
                        this.changesFromLastUpdate = 0;
                        parsingApiFn()
                    }
                }, this.RELOAD_PERIOD);
            })(this.changesFromLastUpdate);
        });
        dataEditor.onDidChangeModelContent(() => {
            this.changesFromLastUpdate++;
            this.documentModelChanged = true;
            ((number) => {
                setTimeout(() => {
                    if (this.changesFromLastUpdate === number) {
                        this.changesFromLastUpdate = 0;
                        parsingProfileFn();
                    }
                }, this.RELOAD_PERIOD);
            })(this.changesFromLastUpdate);
        });
    }

    public getEnv(dataEditor: any) {
        const profilePath = this.profilePath;
        const EditorProfileLoader = {
            fetch: function (resource) {
                return new Promise(function(resolve, reject) {
                    resolve(new amf.client.remote.Content(
                        dataEditor.getValue(), profilePath));
                })
            },
            accepts: function (resource) {
                return true;
            }
         };
        const env = new amf.client.environment.Environment()
        return env.addClientLoader(EditorProfileLoader)
    }

    public hasError(shape: AnyShape): boolean {
        console.log("ERROR? " + shape.id);
        const errors = this.errorsMapShape || {};
        return errors[(shape.id||"").split("document/type")[1]] || false;
    }

    public selectError(error: any) {
        if (this.selectedError() == null || this.selectedError().id !== error.id) {
            this.selectedError(error);
        }
    }

    public apply(location: Node) {
        window["viewModel"] = this;
        ko.applyBindings(this);
    }


    public doValidate() {
        const model = this.selectedModel();
        if (model != null) {
            this.ramlParser.reportValidation(this.profileName).then((report) => {
                var violations = report.results.filter((result) => {
                    return result.level == "Violation"
                });

                const editorModel = this.shapeEditor.getModel();
                const monacoErrors = report.results.map((result) => this.buildMonacoErro(result));
                monaco.editor.setModelMarkers(editorModel, editorModel.id, monacoErrors);

                this.errors(violations);
                console.log("CONFORMS: " + report.conforms);
                console.log(report.results);
                this.errorsMapShape = this.errors()
                    .map(e  => {
                        console.log(e.validationId.split("document/type")[1]);
                        return e.validationId.split("document/type")[1]
                    })
                    .reduce((a, s) => { a[s] = true; return a}, {});
                window['resizeFn']();
            }).catch((e) => {
                console.log("Error validating API");
                console.error(e)
            })
        }
    }


    private onEditorSectionChange(section: string) {
        if (this.selectedModel() != null) {
             if (section === "raml") {
                 amf.Core.generator("RAML 1.0", "application/yaml").generateString(this.selectedModel())
                     .then((generated) => {
                         this.shapeEditor.setModel(createModel(generated, "yaml"));
                     });
            } else if (section === "api-model") {
                 amf.AMF.amfGraphGenerator().generateString(this.selectedModel(), new amf.render.RenderOptions().withCompactUris)
                     .then((generated) => {
                         const json = JSON.parse(generated);
                         this.shapeEditor.setModel(createModel(JSON.stringify(json, null, 2), "json"));
                     });
            }
            window['resizeFn']();
        }
    }

    private onValidationSectionChange(section: string) {
        if (section === "custom") {
            this.dataEditor.setModel(createModel(this.customValidation, "yaml"))
        } else {
            this.customValidation = this.dataEditor.getValue();
            const shapes = amf.AMF.emitShapesGraph(this.profileName);
            const json = JSON.parse(shapes);
            this.dataEditor.setModel(createModel(JSON.stringify(json, null, 2), "json"));
        }
    }

    Hint = 1;
    Info = 2;
    Warning = 4;
    Error = 8;

    protected buildMonacoErro(error: amf.validate.ValidationResult): any {
        console.log("BUILDING ERROR " + error.targetNode);
        let severity = this.Info;
        if (error.level == "Violation")
            severity = this.Error;
        if (error.level === "Warning")
            severity = this.Warning;
        const startLineNumber = error.position.start.line;
        const startColumn = error.position.start.column;
        const endLineNumber = error.position.end.line;
        const endColumn = error.position.end.column;
        const message = error.message;
        return {
            severity, // hardcoded error severity
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
            message
        }
    }

    protected loadShapes() {
        const shapes = amf.AMF.emitShapesGraph(this.profileName);
        const shapesModels = JSON.parse(shapes).map((mdl) => {
            let id = mdl["@id"]
                .replace("http://a.ml/vocabularies/amf/parser#", "amf-parser")
                .replace("http://a.ml/vocabularies/data#", "");
            let isCustom = mdl["@id"].indexOf("amf/parser#") > -1;
            let message = (mdl["http://www.w3.org/ns/shacl#message"] || {})["@value"] || "";
            let targetId = ((mdl["http://www.w3.org/ns/shacl#targetClass"]||[])[0] || {})["@id"] || "";
            let target = this.ui.bindingLabel({token: 'uri', value: targetId});
            return {
                id,
                target,
                isCustom,
                message
            }
        });
        this.shapes(shapesModels);
    }
}