import * as ko from "knockout";

export type ParserType = "raml" | "open-api";
export class LoadFileEvent {
    constructor(public type: ParserType, public location: string) { }
}

function getBaseUrl() {
    var re = new RegExp(/^.*\//);
    return re.exec(window.location.href)[0];
};

export class LoadModal {
    static LOAD_FILE_EVENT: string = "load-file";
    public fileUrl: KnockoutObservable<string> = ko.observable<string>("");
    public parserTypes: KnockoutObservableArray<any> = ko.observableArray([
        { name: "RAML 1.0", key: "raml" },
        { name: "OpenAPI 2.0", key: "open-api" }
    ]);
    public apiExamples: KnockoutObservableArray<any> = ko.observableArray([
        { name: "Banking API (RAML)", key: "raml", url: getBaseUrl() + "raml/banking-api/api.raml" },
        { name: "World Music API (RAML)", key: "raml", url: getBaseUrl() + "raml/world-music-api/api.raml" },
        { name: "Mobile Order API (RAML)", key: "raml", url: getBaseUrl() + "raml/mobile-order-api/api.raml" },
        { name: "Spotify (RAML)", key: "raml", url: getBaseUrl() + "raml/spotify/api.raml" },
        { name: "Pet Store API (Open API)", key: "open-api", url: getBaseUrl() + "openapi/petstore.yaml" },
        { name: "Uber API (Open API)", key: "open-api", url: getBaseUrl() + "openapi/uber.yaml" },
    ]);

    public selectedParserType: KnockoutObservable<any> = ko.observable<any>(this.parserTypes[0]);
    public selectedApiExample: KnockoutObservable<any> = ko.observable<any>();

    public constructor() {
        this.selectedApiExample.subscribe((newValue) => {
            if (newValue != null) {
                let parserType = null;
                this.parserTypes().forEach((e) => {
                    if (e.key === newValue.key) {
                        parserType = e;
                    }
                });
                if (parserType != null) {
                    this.selectedParserType(parserType);
                }
                this.fileUrl(newValue.url);
            }
        });
    }

    public show() {
        this.fileUrl("");
        this.selectedApiExample(null);
        this.el().className += " is-active";
    }

    public hide() {
        const el = this.el();
        el.className = el.className.replace("is-active", "");
    }

    public cancel() {
        this.fileUrl("");
        this.selectedApiExample(null);
        this.hide();
    }


    public loadLocalFile() {
        /*
        (remote.getCurrentWindow() as AmfPlaygroundWindow).checkFile((err, fileName) => {
            if (err == null && fileName != null) {
                this.fileUrl(fileName);
            }
        });
        */
    }

    public save() {
        this.emit(LoadModal.LOAD_FILE_EVENT, new LoadFileEvent(this.selectedParserType().key, this.fileUrl()));
        this.hide();
    }

    private listeners: ((e: LoadFileEvent) => undefined)[] = [];

    on(evt, listener) {
        this.listeners.push(listener);
    }

    emit(evtName: string, evt: LoadFileEvent) {
        this.listeners.forEach(l => l(evt))
    }

    public el() {
        const el = document.getElementById("load-modal");
        if (el != null) {
            return el;
        } else {
            throw new Error("Cannot find load-model modal element");
        }
    }
}
