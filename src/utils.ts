import { extract_value, LABEL, NAME, SHACL_NAME } from './main/domain_model'

export function label (uri: string): string {
  if (uri.indexOf('#') > -1) {
    const hashPart = uri.split('#')[1]
    const base = uri.split('#')[0]
    return '/' + base.split('/').pop() + '#' + hashPart
  } else {
    return ('/' + uri.split('/').pop()) || uri
  }
}

// to make URLs absolute
const anchor = document.createElement('a')

export function absoluteURL (url): string {
  anchor.href = url
  return anchor.href
}

export function nestedLabel (parent: any, child: any): string {
  const uri = child['@id']
  const label = extract_value(child, NAME) || extract_value(child, LABEL) || extract_value(child, SHACL_NAME)
  if (label != null) {
    return label
  } else {
    if (uri.indexOf(parent['@id']) > -1) {
      return uri.replace(parent['@id'], '')
    } else {
      this.label(uri)
    }
  }
}
