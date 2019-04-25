import {ModelProxy} from "./model_proxy";
import * as amf from "amf-client-js";
export type ModelType = "raml" | "open-api" | "api-model";
export class AmfPlaygroundWindow {


    static functions: string[] = [
        "existsFile", "parseModelFile", "generateString"
    ];

    existsFile(fileName, cb) {
        cb(null, fileName);
    }

    parseModelFile(type: ModelType, fileLocation: string, cb) {
        console.log("PARSING FILE " + fileLocation + " TYPE " + type);

        let parser: any;

        if (type === "raml") {
            parser = amf.Core.parser("RAML 1.0", "application/yaml");
        } else if(type === "open-api") {
            parser = amf.Core.parser("OAS 2.0", "application/yaml");
        }

        parser.parseFileAsync(fileLocation).then((model) => {
            cb(null, new ModelProxy(model, type));
        }).catch((err) => {
            console.log("Error parsing file");
            console.log(err);
            cb(err, null);
        });
    }


    parseString(type: ModelType, baseUrl: string, value: string, cb: (err, model) => any) {
        let parser: any;
        if (type === "raml") {
            parser = amf.Core.parser("RAML 1.0", "application/yaml");
        } else if(type === "open-api") {
            parser = amf.Core.parser("OAS 2.0", "application/yaml");
        } else if(type === "api-model") {
            parser = amf.Core.parser("AMF Graph", "application/ld+json");
        }
        parser.parseStringAsync(value).then((model) => {
            cb(null, new ModelProxy(model, type));
        }).catch((err) => {
            console.log("Error parsing text");
            console.log(err);
            cb(err, null);
        });
    }
}
