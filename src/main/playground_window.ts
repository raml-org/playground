import { ModelProxy } from './model_proxy'
import { WebApiParser as wap } from 'webapi-parser'

export type ModelType = 'raml' | 'oas';

export class PlaygroundWindow {
  static functions: string[] = [
    'existsFile', 'parseModelFile', 'generateString'
  ];

  existsFile (fileName, cb) {
    cb(null, fileName)
  }

  parseModelFile (type: ModelType, fileLocation: string, cb) {
    const parser = type === 'raml' ? wap.raml10 : wap.oas20
    parser.parse(fileLocation).then((model) => {
      cb(null, new ModelProxy(model, type))
    }).catch((err) => {
      console.error(`Error parsing file: ${err}`)
      cb(err, null)
    })
  }

  parseString (type: ModelType, baseUrl: string, value: string, cb: (err, model) => any) {
    const parser = type === 'raml' ? wap.raml10 : wap.oas20
    parser.parse(value).then((model) => {
      cb(null, new ModelProxy(model, type))
    }).catch((err) => {
      console.error(`Error parsing text: ${err}`)
      cb(err, null)
    })
  }
}
