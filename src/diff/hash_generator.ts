/**
 * Created by antoniogarrote on 18/05/2017.
 */

import * as sha1 from "js-sha1";

export const TRIPLE_SEPARATOR = '////';

export class HashGenerator {
    public idMap: {[id:string]: string[]} = {};
    public links: {[id: string]: string[]} = {};
    public counters: {[id: string]: number} = {};
    public hashes: {[id: string]: string} = {};

    public hash: string | null = null;
    public count: number = 0;

    constructor(flatten: any[]) {
        (flatten || []).forEach(node => {
            const id = node["@id"];
            const types = node["@type"] || [];
            types.forEach(t => this.assert(id, "@type", {"@id": t}));
            for (let p in node) {
                if (node.hasOwnProperty(p) && p !== "@type" && p !== "@id") {
                    let o = node[p];
                    this.assert(id, p, o);
                }
            }
        });
        this.sign();
    }

    protected assert(s: string, p: string, o: any) {
        if (p === "@type") {
            this.newAssertion(s, `<${s}>${TRIPLE_SEPARATOR}<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>${TRIPLE_SEPARATOR}<${o["@id"]}>`);
        } else {
            if (o instanceof Array) {
                o.sort((a,b) => {
                    const va = a["@id"] || a["@value"];
                    const vb = b["@id"] || b["@value"];
                    if (va < vb) {
                        return 1;
                    } else if (va > vb) {
                        return -1;
                    } else {
                        return 0;
                    }
                }).forEach(v => {
                    this.assert(s, p, v);
                })
            } else if (o["@id"] != null && o["@id"] !== s) {
                this.link(s,o["@id"]);
                this.newAssertion(s, `<${s}>${TRIPLE_SEPARATOR}<${p}>${TRIPLE_SEPARATOR}<${o["@id"]}>`);
            } else if (o["@list"] != null) {
                (o["@list"] || []).forEach((e, i) => {
                    this.assert(s, `${p}:${i}`, e);
                })
            } else if (o["@value"] != null) {
                const value = o["@value"];
                const language = o["@language"];
                let type = o["@type"];
                if (type == null) {
                    const jsType = typeof(value);
                    if (jsType === 'boolean') {
                        type = "boolean";
                    } else if (jsType === 'number' && `${value}`.indexOf(".") > -1) {
                        type = "float";
                    } else if (jsType === 'number' && `${value}`.indexOf(".") === -1) {
                        type = "integer";
                    }
                }
                this.newAssertion(s, `<${s}>${TRIPLE_SEPARATOR}<${p}>${TRIPLE_SEPARATOR}'${value}:${type}:${language}'`)
            }
        }
    }

    protected link(s,t) {
        const links = (this.links[s] || []);
        links.push(t);
        this.links[s] = links;
    }

    protected incAssertions(id) {
        const count = (this.counters[id] || 0);
        this.count++;
        this.counters[id] = count + 1;
    }

    protected newAssertion(id, assertion) {
        this.incAssertions(id);
        const assertions = (this.idMap[id] || []);
        assertions.push(assertion);
        this.idMap[id] = assertions;
    }

    public sign(): string {
        const docHash = sha1.create();

        Object.keys(this.idMap).sort().forEach(id => {
            const nodeHash = sha1.create();
            const assertions = this.idMap[id] || [];
            assertions.sort().forEach(a => {
                docHash.update(a);
                nodeHash.update(a);
            });
            this.hashes[id] = nodeHash.hex();
        });

        this.hash = docHash.hex();

        return this.hash;
    }
}