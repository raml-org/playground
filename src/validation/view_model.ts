/**
 * Created by antoniogarrote on 12/05/2017.
 */

import * as ko from "knockout";
import * as amf from "amf-client-js";
import AnyShape = amf.model.domain.AnyShape


export type NavigatorSection = "shapes" | "errors"

const createModel = function(text, mode) {
    return window["monaco"].editor.createModel(text, mode);
};

export class ViewModel {

    public navigatorSection: KnockoutObservable<NavigatorSection> = ko.observable<NavigatorSection>("shapes");

    public shapes: KnockoutObservableArray<AnyShape> = ko.observableArray<AnyShape>([]);
    public errors: KnockoutObservableArray<amf.client.validate.ValidationResult> = ko.observableArray<amf.validate.ValidationResult>([]);

    public editorSection: KnockoutObservable<string> = ko.observable<string>("raml");

    public selectedShape: KnockoutObservable<AnyShape> = ko.observable<AnyShape>();
    public selectedError: KnockoutObservable<any> = ko.observable<any>();
    public errorsMapShape: {[id: string]: boolean} = {};

    public model: any | null = null;
    public modelSyntax: string | null = null;
    public modelText: string | null = null;

    public changesFromLastUpdate = 0;
    public documentModelChanged = false;
    public RELOAD_PERIOD = 1000;


    public constructor(public dataEditor: any, public shapeEditor: any) {
        this.editorSection.subscribe((section) => this.onEditorSectionChange(section));
        this.shapeEditor.onDidChangeModelContent(this.onEditorContentChange.bind(this));
        this.dataEditor.onDidChangeModelContent(this.onEditorContentChange.bind(this));
    }

    public loadShapes() {
        return amf.AMF.init()
            .then(() => {
                return this.parseEditorContent()
            })
            .catch((e) => {
                console.log("ERROR!!! " + e);
            });
    }

    public parseEditorContent() {
        let toParse, parser, doc, profileName
        if (this.editorSection() === "raml") {
            toParse = "#%RAML 1.0 DataType\n" + this.shapeEditor.getValue();
            parser = amf.AMF.raml10Parser();
            profileName = amf.ProfileNames.RAML10;
        } else if (this.editorSection() === "open-api") {
            toParse = this.shapeEditor.getValue();
            toParse = JSON.stringify({
                swagger: '2.0',
                info: {title: 'asd', version: '123'},
                definitions: {
                    Root: JSON.parse(toParse)
                }
            });
            parser = amf.AMF.oas20Parser();
            profileName = amf.ProfileNames.OAS20;
        } else {
            toParse = JSON.stringify({
                "@id": "https://mulesoft-labs.github.io/amf-playground",
                "@type": [
                    "http://a.ml/vocabularies/document#Fragment",
                    "http://a.ml/vocabularies/document#Unit"
                ],
                "http://a.ml/vocabularies/document#encodes": [
                    JSON.parse(this.shapeEditor.getValue())
                ]
            });
            parser = amf.AMF.amfGraphParser();
            profileName = amf.ProfileNames.AMF;
        }
        return parser.parseStringAsync(toParse)
            .then((parsed: amf.model.document.Document) => {
                doc = parsed;
                return parser.reportValidation(profileName)
            })
            .then((report) => {
                // Only save section content if it's valid
                if (report.conforms) {
                    return this.parseEditorSyntax(doc, this.editorSection());
                } else {
                    console.log("Invalid section content", this.editorSection());
                }
            })
            .catch((e) => {
                console.log("Error parsing editor section", this.editorSection());
                console.log(e.toString());
            });
    }

    public onEditorContentChange() {
        this.changesFromLastUpdate++;
        this.documentModelChanged = true;
        ((number) => {
            setTimeout(() => {
                if (this.changesFromLastUpdate === number) {
                    this.changesFromLastUpdate = 0;
                    this.parseEditorContent();
                }
            }, this.RELOAD_PERIOD);
        })(this.changesFromLastUpdate);
    }

    public parseEditorSyntax(parsed: amf.model.document.Document, syntax: string) {
        const oldShape = this.selectedShape();
        const oldShapes = this.shapes();
        const oldErrors = this.errors();
        try {
            let shape
            if (parsed.declares !== undefined && parsed.declares[0] !== undefined) {
                shape = parsed.declares[0]
            } else {
                shape = parsed.encodes
            }
            if (shape != null && shape instanceof AnyShape) {
                if (this.model !== null) {
                    this.model = this.model.withEncodes(shape);
                } else {
                    this.model = parsed;
                }
                this.modelSyntax = syntax;
                this.modelText = this.shapeEditor.getValue();
                const parsedShape = shape as AnyShape;
                this.selectedShape(parsedShape);
                this.shapes([parsedShape]);
                this.doValidate();
            }
        } catch (e) {
            console.log("Exception parsing shape");
            console.log(e);
            this.selectedShape(oldShape);
            this.shapes(oldShapes);
            this.errors(oldErrors);
        }
    }

    public hasError(shape: AnyShape): boolean {
        const errors = this.errorsMapShape || {};
        return errors[(shape.id||"").split("document/type")[1]] || false;
    }

    public selectShape(shape: AnyShape) {
        if (this.selectedShape() == null || this.selectedShape().id !== shape.id) {
            this.selectedShape(shape);
        }
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
        const shape = this.selectedShape();
        if (shape != null) {
            shape.validate(this.dataEditor.getValue()).then((report) => {
                this.errors(report.results);
                this.errorsMapShape = this.errors()
                    .map(e  => {
                        return e.validationId.split("document/type")[1]
                    })
                    .reduce((a, s) => { a[s] = true; return a}, {});
                // just triggering a redraw
                const last = this.shapes.pop();
                this.shapes.push(last);
                window['resizeFn']();
            }).catch((e) => {
                console.log("Error parsing and validating JSON data");
                console.error(e)
            })
        }
    }

    private onEditorSectionChange(section: string) {
        if (this.model != null) {
             if (section === "raml") {
                 amf.AMF.raml10Generator().generateString(this.model)
                     .then((generated) => {
                         let lines = generated.split("\n");
                         lines.shift();
                         this.shapeEditor.setModel(createModel(lines.join("\n"), "yaml"));
                     });
            } else if (section === "open-api") {
                 amf.AMF.oas20Generator().generateString(this.model)
                     .then((generated) => {
                         const shape = JSON.parse(generated);
                         delete shape["x-amf-fragmentType"];
                         this.shapeEditor.setModel(createModel(JSON.stringify(shape, null, 2), "json"));
                     });
            } else if (section === "api-model") {
                 amf.AMF.amfGraphGenerator().generateString(this.model, new amf.render.RenderOptions().withCompactUris)
                     .then((generated) => {
                         const json = JSON.parse(generated);
                         const shape = json[0]["doc:encodes"][0];
                         this.shapeEditor.setModel(createModel(JSON.stringify(shape, null, 2), "json"));
                     });
            }
            window['resizeFn']();
        }
    }

}