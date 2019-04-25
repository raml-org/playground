/**
 * Created by antoniogarrote on 18/05/2017.
 */
import {HashGenerator, TRIPLE_SEPARATOR} from "./hash_generator";

export interface TripleComponent {
    kind: string;
    value: string;
    datatype?: string;
    change: string;
}

const prefixes = {
    'https://mulesoft-labs.github.io/amf-playground#': '',
    "http://a.ml/vocabularies/document#": "raml-doc:",
    "http://a.ml/vocabularies/http#": "raml-http:",
    "http://a.ml/vocabularies/shapes#": "raml-shapes:",
    "http://www.w3.org/ns/hydra/core#": "hydra:",
    "http://www.w3.org/ns/shacl#": "shacl:",
    "http://schema.org/": "schema-org:",
    "http://www.w3.org/2001/XMLSchema#": "xsd:",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "rdf:"
};

export class NodeDiff {
    public nodeClass: string;
    public nodeName: string | null = null;
    public newHash: string;

    public assertionsAdded: string[] = [];
    public assertionsRemoved: string[] = [];
    public assertionsNotChanged: string[] = [];
    public linksAdded: string[] = [];
    public linksRemoved: string[] = [];
    public linksNotChanged: string[] = [];


    private assertions: {[assertion: string]: boolean} = {};
    private links: {[target: string]: boolean} = {};

    constructor(public id: string, public hash: string) {}

    public assertionPairs(): TripleComponent[][] {
        return this.assertionsAdded.map(a => {
            let parts = a.split(TRIPLE_SEPARATOR);
            return parts.map(x => this.cleanTripleComponent(x, 'added'));
        }).concat(this.assertionsRemoved.map(a => {
            let parts = a.split(TRIPLE_SEPARATOR);
            return parts.map(x => this.cleanTripleComponent(x, 'removed'));
        })).concat(this.assertionsNotChanged.map(a => {
            let parts = a.split(TRIPLE_SEPARATOR);
            return parts.map(x => this.cleanTripleComponent(x, 'not_changed'))
        })).sort((l,r) => {
            const valLeft = l[1].value;
            const valRight = r[1].value;
            if (valLeft < valRight) {
                return 1;
            } else if (valLeft > valRight) {
                return -1;
            } else {
                return 0;
            }
        });
    }

    private cleanTripleComponent(component: string, change: string): TripleComponent {
        if (component[0] === '<') {
            let uri = component.replace('<','').replace('>','');
            for(let p in prefixes) {
                if (uri.indexOf(p) === 0) {
                    uri = uri.replace(p, prefixes[p]);
                    break;
                }
            }
            return {kind: 'uri', value: uri, change: change}
        } else {
            const [value, datatype, language] = component.substring(1).substring(0, component.length -2).split(":");
            return {kind: 'literal', value: value, datatype: (datatype === 'undefined' ? null : datatype), change: change};
        }
    }

    public assertionsCount(): number {
        return (this.assertionsAdded || []).length +
            (this.assertionsRemoved || []).length +
            (this.assertionsNotChanged || []).length;
    }

    public assert(assertion: string) {
        this.assertions[assertion] = true;
    }

    public assertLink(target: string) {
        this.links[target] = true;
    }

    public update(assertion: string) {
        if (this.assertions[assertion]) {
            delete this.assertions[assertion];
            this.assertionsNotChanged.push(assertion);
        } else {
            this.assertionsAdded.push(assertion)
        }
    }

    public updateLink(target: string) {
        if (this.links[target]) {
            delete this.links[target];
            this.linksNotChanged.push(target);
        } else {
            this.linksAdded.push(target)
        }
    }

    public finishRemove() {
        for (let assertion in this.assertions) {
            delete this.assertions[assertion]
            this.assertionsRemoved.push(assertion);
        }

        for(let target in this.links) {
            delete this.links[target];
            this.linksRemoved.push(target)
        }
    }

    public finishAdd() {
        for (let assertion in this.assertions) {
            delete this.assertions[assertion]
            this.assertionsAdded.push(assertion);
        }

        for (let target in this.links) {
            delete this.links[target];
            this.linksAdded.push(target)
        }
    }

    public classLabel(): string {
        return ((this.nodeClass || "DomainElement").split("#")[1] || "").replace(">","");
    }

    public hashLabel(): string {
        if (this.hash == null) {
            return "";
        } else {
            return this.hash.substring(0, 10) + "..."
        }
    }

    public newHashLabel(): string {
        if (this.newHash == null) {
            return "";
        } else {
            return  this.newHash.substring(0, 10) + "..."
        }
    }

    public idLabel(): string {
        const suffix = (this.id || "").split("#")[1] || "/";
        /*
        if (suffix.length > 23) {
            return "..." + suffix.substring(suffix.length - 20);
        } else {
            return suffix;
        }
        */
        return suffix;
    }

}

export class DiffGenerator {

    public assertionsAdded: number = 0;
    public assertionsRemoved: number = 0;
    public assertionsNotChanged: number = 0;

    public nodeDiffs: {[id: string]: NodeDiff} = {};
    public diffsMap: {[id: string]: NodeDiff} = {};
    public nodesAdded: NodeDiff[] = [];
    public nodesNotChanged: NodeDiff[] = [];
    public nodesRemoved: NodeDiff[] = [];

    constructor(public hashLeft: HashGenerator, public hashRight: HashGenerator) {
        this.walkReferences(hashLeft);
        this.updateReferences(hashRight);
    }

    public allNodes(): NodeDiff[] {
        return (this.nodesAdded || [])
            .concat(this.nodesRemoved || [])
            .concat(this.nodesNotChanged || []);
    }
    public walkReferences(hash: HashGenerator) {
        for (let id in hash.idMap) {
            this.nodeDiffs[id] = this.processNewHash(id, hash);
        }
    }

    public updateReferences(hash: HashGenerator) {
        for (let id in hash.idMap) {
            let diff = this.nodeDiffs[id];
            if (diff != null) {
                diff.newHash = hash.hashes[id];
                // node has remained in the graph
                delete this.nodeDiffs[id];
                this.nodesNotChanged.push(diff);
                this.updateHash(diff, id, hash);
                diff.finishRemove();
            } else {
                // is a new node in the graph
                let diff = this.processNewHash(id, hash);
                diff.newHash = diff.hash;
                diff.hash = null;
                this.nodesAdded.push(diff);
                diff.finishAdd();
            }
        }
        for (let id in this.nodeDiffs) {
            // remaining nodes have been removed
            const diff = this.nodeDiffs[id];
            delete this.nodeDiffs[id];
            this.nodesRemoved.push(diff);
            diff.finishRemove();
        }

        // update counts
        this.nodesAdded.forEach(diff => this.assertionsAdded = this.assertionsAdded + diff.assertionsAdded.length);
        this.nodesRemoved.forEach(diff => this.assertionsRemoved = this.assertionsRemoved + diff.assertionsRemoved.length);
        this.nodesNotChanged.forEach(diff => {
            this.assertionsAdded = this.assertionsAdded + diff.assertionsAdded.length;
            this.assertionsRemoved = this.assertionsRemoved + diff.assertionsRemoved.length;
            this.assertionsNotChanged = this.assertionsNotChanged + diff.assertionsNotChanged.length;
        })
    }

    public isClass(assertion: string): boolean {
        return (
            assertion.indexOf("http://www.w3.org/1999/02/22-rdf-syntax-ns#type") > -1 &&
            assertion.indexOf("DomainElement") === -1 &&
            assertion.indexOf("Unit") === -1
        );
    }

    public isName(assertion: string): boolean {
        return assertion.indexOf("http://schema.org/name") > -1 || assertion.indexOf("http://a.ml/vocabularies/http#path") > -1;
    }

    public predicate(assertion: string): string {
        const parts = assertion.split(TRIPLE_SEPARATOR);
        return parts[parts.length - 1];
    }

    public value(assertion: string): string {
        let object = assertion.split(TRIPLE_SEPARATOR)[2];
        const [value, datatype, language] = object.substring(1).substring(0, object.length -2).split(":");
        return value;
    }

    private processNewHash(id: string, hash: HashGenerator): NodeDiff {
        const diff = new NodeDiff(id, hash.hashes[id]);

        hash.idMap[id].forEach(assertion => {
            if (diff.nodeClass == null && this.isClass(assertion)) {
                diff.nodeClass = this.predicate(assertion);
            }
            if (diff.nodeName == null && this.isName(assertion)) {
                diff.nodeName = this.value(assertion);
            }
            diff.assert(assertion);
        });

        (hash.links[id] || []).forEach(target => diff.assertLink(target));
        this.diffsMap[diff.id] = diff;
        return diff;
    }

    private updateHash(diff: NodeDiff, id: string, hash: HashGenerator) {
        hash.idMap[id].forEach(assertion => {
            diff.update(assertion);
        });

        (hash.links[id] || []).forEach(link => {
            diff.updateLink(link);
        });
    }

}
