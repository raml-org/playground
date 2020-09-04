/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = typeof window !== 'undefined' &&
    window.customElements != null &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (container, start, end = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.removeChild(start);
        start = n;
    }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updatable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        const nodesToRemove = [];
        const stack = [];
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        // Keeps track of the last index associated with a part. We try to delete
        // unnecessary nodes, but we never want to associate two different parts
        // to the same index. They must have a constant node between.
        let lastPartIndex = 0;
        let index = -1;
        let partIndex = 0;
        const { strings, values: { length } } = result;
        while (partIndex < length) {
            const node = walker.nextNode();
            if (node === null) {
                // We've exhausted the content inside a nested template element.
                // Because we still have parts (the outer for-loop), we know:
                // - There is a template in the stack
                // - The walker will find a nextNode outside the template
                walker.currentNode = stack.pop();
                continue;
            }
            index++;
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                if (node.hasAttributes()) {
                    const attributes = node.attributes;
                    const { length } = attributes;
                    // Per
                    // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                    // attributes are not guaranteed to be returned in document order.
                    // In particular, Edge/IE can return them out of order, so we cannot
                    // assume a correspondence between part index and attribute index.
                    let count = 0;
                    for (let i = 0; i < length; i++) {
                        if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                            count++;
                        }
                    }
                    while (count-- > 0) {
                        // Get the template literal section leading up to the first
                        // expression in this attribute
                        const stringForPart = strings[partIndex];
                        // Find the attribute name
                        const name = lastAttributeNameRegex.exec(stringForPart)[2];
                        // Find the corresponding attribute
                        // All bound attributes have had a suffix added in
                        // TemplateResult#getHTML to opt out of special attribute
                        // handling. To look up the attribute value we also need to add
                        // the suffix.
                        const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                        const attributeValue = node.getAttribute(attributeLookupName);
                        node.removeAttribute(attributeLookupName);
                        const statics = attributeValue.split(markerRegex);
                        this.parts.push({ type: 'attribute', index, name, strings: statics });
                        partIndex += statics.length - 1;
                    }
                }
                if (node.tagName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
            }
            else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                const data = node.data;
                if (data.indexOf(marker) >= 0) {
                    const parent = node.parentNode;
                    const strings = data.split(markerRegex);
                    const lastIndex = strings.length - 1;
                    // Generate a new text node for each literal section
                    // These nodes are also used as the markers for node parts
                    for (let i = 0; i < lastIndex; i++) {
                        let insert;
                        let s = strings[i];
                        if (s === '') {
                            insert = createMarker();
                        }
                        else {
                            const match = lastAttributeNameRegex.exec(s);
                            if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                s = s.slice(0, match.index) + match[1] +
                                    match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                            }
                            insert = document.createTextNode(s);
                        }
                        parent.insertBefore(insert, node);
                        this.parts.push({ type: 'node', index: ++index });
                    }
                    // If there's no text, we must insert a comment to mark our place.
                    // Else, we can trust it will stick around after cloning.
                    if (strings[lastIndex] === '') {
                        parent.insertBefore(createMarker(), node);
                        nodesToRemove.push(node);
                    }
                    else {
                        node.data = strings[lastIndex];
                    }
                    // We have a part for each match found
                    partIndex += lastIndex;
                }
            }
            else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                if (node.data === marker) {
                    const parent = node.parentNode;
                    // Add a new marker node to be the startNode of the Part if any of
                    // the following are true:
                    //  * We don't have a previousSibling
                    //  * The previousSibling is already the start of a previous part
                    if (node.previousSibling === null || index === lastPartIndex) {
                        index++;
                        parent.insertBefore(createMarker(), node);
                    }
                    lastPartIndex = index;
                    this.parts.push({ type: 'node', index });
                    // If we don't have a nextSibling, keep this node so we have an end.
                    // Else, we can remove it to save future costs.
                    if (node.nextSibling === null) {
                        node.data = '';
                    }
                    else {
                        nodesToRemove.push(node);
                        index--;
                    }
                    partIndex++;
                }
                else {
                    let i = -1;
                    while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                        // Comment node has a binding marker inside, make an inactive part
                        // The binding won't work, but subsequent bindings will
                        // TODO (justinfagnani): consider whether it's even worth it to
                        // make bindings in comments work
                        this.parts.push({ type: 'node', index: -1 });
                        partIndex++;
                    }
                }
            }
        }
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const endsWith = (str, suffix) => {
    const index = str.length - suffix.length;
    return index >= 0 && str.slice(index) === suffix;
};
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = 
// eslint-disable-next-line no-control-regex
/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const walkerNodeFilter = 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */;
/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 *
 * As the template is walked the removal state is tracked and
 * part indices are adjusted as needed.
 *
 * div
 *   div#1 (remove) <-- start removing (removing node is div#1)
 *     div
 *       div#2 (remove)  <-- continue removing (removing node is still div#1)
 *         div
 * div <-- stop removing since previous sibling is the removing node (div#1,
 * removed 4 nodes)
 */
function removeNodesFromTemplate(template, nodesToRemove) {
    const { element: { content }, parts } = template;
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let part = parts[partIndex];
    let nodeIndex = -1;
    let removeCount = 0;
    const nodesToRemoveInTemplate = [];
    let currentRemovingNode = null;
    while (walker.nextNode()) {
        nodeIndex++;
        const node = walker.currentNode;
        // End removal if stepped past the removing node
        if (node.previousSibling === currentRemovingNode) {
            currentRemovingNode = null;
        }
        // A node to remove was found in the template
        if (nodesToRemove.has(node)) {
            nodesToRemoveInTemplate.push(node);
            // Track node we're removing
            if (currentRemovingNode === null) {
                currentRemovingNode = node;
            }
        }
        // When removing, increment count by which to adjust subsequent part indices
        if (currentRemovingNode !== null) {
            removeCount++;
        }
        while (part !== undefined && part.index === nodeIndex) {
            // If part is in a removed node deactivate it by setting index to -1 or
            // adjust the index as needed.
            part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
            // go to the next active part.
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
            part = parts[partIndex];
        }
    }
    nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
}
const countNodes = (node) => {
    let count = (node.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */) ? 0 : 1;
    const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
    while (walker.nextNode()) {
        count++;
    }
    return count;
};
const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
    for (let i = startIndex + 1; i < parts.length; i++) {
        const part = parts[i];
        if (isTemplatePartActive(part)) {
            return i;
        }
    }
    return -1;
};
/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */
function insertNodeIntoTemplate(template, node, refNode = null) {
    const { element: { content }, parts } = template;
    // If there's no refNode, then put node at end of template.
    // No part indices need to be shifted in this case.
    if (refNode === null || refNode === undefined) {
        content.appendChild(node);
        return;
    }
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let insertCount = 0;
    let walkerIndex = -1;
    while (walker.nextNode()) {
        walkerIndex++;
        const walkerNode = walker.currentNode;
        if (walkerNode === refNode) {
            insertCount = countNodes(node);
            refNode.parentNode.insertBefore(node, refNode);
        }
        while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
            // If we've inserted the node, simply adjust all subsequent parts
            if (insertCount > 0) {
                while (partIndex !== -1) {
                    parts[partIndex].index += insertCount;
                    partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                }
                return;
            }
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
        }
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this.__parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // There are a number of steps in the lifecycle of a template instance's
        // DOM fragment:
        //  1. Clone - create the instance fragment
        //  2. Adopt - adopt into the main document
        //  3. Process - find part markers and create parts
        //  4. Upgrade - upgrade custom elements
        //  5. Update - set node, attribute, property, etc., values
        //  6. Connect - connect to the document. Optional and outside of this
        //     method.
        //
        // We have a few constraints on the ordering of these steps:
        //  * We need to upgrade before updating, so that property values will pass
        //    through any property setters.
        //  * We would like to process before upgrading so that we're sure that the
        //    cloned fragment is inert and not disturbed by self-modifying DOM.
        //  * We want custom elements to upgrade even in disconnected fragments.
        //
        // Given these constraints, with full custom elements support we would
        // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
        //
        // But Safari does not implement CustomElementRegistry#upgrade, so we
        // can not implement that order and still have upgrade-before-update and
        // upgrade disconnected fragments. So we instead sacrifice the
        // process-before-upgrade constraint, since in Custom Elements v1 elements
        // must not modify their light DOM in the constructor. We still have issues
        // when co-existing with CEv0 elements like Polymer 1, and with polyfills
        // that don't strictly adhere to the no-modification rule because shadow
        // DOM, which may be created in the constructor, is emulated by being placed
        // in the light DOM.
        //
        // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
        // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
        // in one step.
        //
        // The Custom Elements v1 polyfill supports upgrade(), so the order when
        // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
        // Connect.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const stack = [];
        const parts = this.template.parts;
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        let partIndex = 0;
        let nodeIndex = 0;
        let part;
        let node = walker.nextNode();
        // Loop through all the nodes and parts of a template
        while (partIndex < parts.length) {
            part = parts[partIndex];
            if (!isTemplatePartActive(part)) {
                this.__parts.push(undefined);
                partIndex++;
                continue;
            }
            // Progress the tree walker until we find our next part's node.
            // Note that multiple parts may share the same node (attribute parts
            // on a single element), so this loop may not run at all.
            while (nodeIndex < part.index) {
                nodeIndex++;
                if (node.nodeName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
                if ((node = walker.nextNode()) === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    node = walker.nextNode();
                }
            }
            // We've arrived at our part's node.
            if (part.type === 'node') {
                const part = this.processor.handleTextExpression(this.options);
                part.insertAfterNode(node.previousSibling);
                this.__parts.push(part);
            }
            else {
                this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
            }
            partIndex++;
        }
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const commentMarker = ` ${marker} `;
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const l = this.strings.length - 1;
        let html = '';
        let isCommentBinding = false;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            // For each binding we want to determine the kind of marker to insert
            // into the template source before it's parsed by the browser's HTML
            // parser. The marker type is based on whether the expression is in an
            // attribute, text, or comment position.
            //   * For node-position bindings we insert a comment with the marker
            //     sentinel as its text content, like <!--{{lit-guid}}-->.
            //   * For attribute bindings we insert just the marker sentinel for the
            //     first binding, so that we support unquoted attribute bindings.
            //     Subsequent bindings can use a comment marker because multi-binding
            //     attributes must be quoted.
            //   * For comment bindings we insert just the marker sentinel so we don't
            //     close the comment.
            //
            // The following code scans the template source, but is *not* an HTML
            // parser. We don't need to track the tree structure of the HTML, only
            // whether a binding is inside a comment, and if not, if it appears to be
            // the first binding in an attribute.
            const commentOpen = s.lastIndexOf('<!--');
            // We're in comment position if we have a comment open with no following
            // comment close. Because <-- can appear in an attribute value there can
            // be false positives.
            isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                s.indexOf('-->', commentOpen + 1) === -1;
            // Check to see if we have an attribute-like sequence preceding the
            // expression. This can match "name=value" like structures in text,
            // comments, and attribute values, so there can be false-positives.
            const attributeMatch = lastAttributeNameRegex.exec(s);
            if (attributeMatch === null) {
                // We're only in this branch if we don't have a attribute-like
                // preceding sequence. For comments, this guards against unusual
                // attribute values like <div foo="<!--${'bar'}">. Cases like
                // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                // below.
                html += s + (isCommentBinding ? commentMarker : nodeMarker);
            }
            else {
                // For attributes we use just a marker sentinel, and also append a
                // $lit$ suffix to the name to opt-out of attribute-specific parsing
                // that IE and Edge do for style and certain SVG attributes.
                html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                    attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                    marker;
            }
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement('template');
        template.innerHTML = this.getHTML();
        return template;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
const isIterable = (value) => {
    return Array.isArray(value) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(value && value[Symbol.iterator]);
};
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attribute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = this.parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (isPrimitive(v) || !isIterable(v)) {
                    text += typeof v === 'string' ? v : String(v);
                }
                else {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
/**
 * A Part that controls all or part of an attribute value.
 */
class AttributePart {
    constructor(committer) {
        this.value = undefined;
        this.committer = committer;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
class NodePart {
    constructor(options) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.options = options;
    }
    /**
     * Appends this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part after the `ref` node (between `ref` and `ref`'s next
     * sibling). Both `ref` and its next sibling must be static, unchanging nodes
     * such as those that appear in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part.__insert(this.startNode = createMarker());
        part.__insert(this.endNode = createMarker());
    }
    /**
     * Inserts this part after the `ref` part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref.__insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        if (this.startNode.parentNode === null) {
            return;
        }
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        const value = this.__pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this.__commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this.__commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this.__commitNode(value);
        }
        else if (isIterable(value)) {
            this.__commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this.__commitText(value);
        }
    }
    __insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    __commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this.__insert(value);
        this.value = value;
    }
    __commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        // If `value` isn't already a string, we explicitly convert it here in case
        // it can't be implicitly converted - i.e. it's a symbol.
        const valueAsString = typeof value === 'string' ? value : String(value);
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = valueAsString;
        }
        else {
            this.__commitNode(document.createTextNode(valueAsString));
        }
        this.value = value;
    }
    __commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this.__commitNode(fragment);
            this.value = instance;
        }
    }
    __commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this.__pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const value = !!this.__pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
            this.value = value;
        }
        this.__pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the third
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
// Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
// blocks right into the body of a module
(() => {
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.addEventListener('test', options, options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
        // event options not supported
    }
})();
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this.__boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const newListener = this.__pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        if (shouldAddListener) {
            this.__options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        this.value = newListener;
        this.__pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const committer = new PropertyCommitter(element, name.slice(1), strings);
            return committer.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const committer = new AttributeCommitter(element, name, strings);
        return committer.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
if (typeof window !== 'undefined') {
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.2.1');
}
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// Get a key to lookup in `templateCaches`.
const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
let compatibleShadyCSSVersion = true;
if (typeof window.ShadyCSS === 'undefined') {
    compatibleShadyCSSVersion = false;
}
else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
    console.warn(`Incompatible ShadyCSS version detected. ` +
        `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` +
        `@webcomponents/shadycss@1.3.1.`);
    compatibleShadyCSSVersion = false;
}
/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
const shadyTemplateFactory = (scopeName) => (result) => {
    const cacheKey = getTemplateCacheKey(result.type, scopeName);
    let templateCache = templateCaches.get(cacheKey);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(cacheKey, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    const key = result.strings.join(marker);
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        const element = result.getTemplateElement();
        if (compatibleShadyCSSVersion) {
            window.ShadyCSS.prepareTemplateDom(element, scopeName);
        }
        template = new Template(result, element);
        templateCache.keyString.set(key, template);
    }
    templateCache.stringsArray.set(result.strings, template);
    return template;
};
const TEMPLATE_TYPES = ['html', 'svg'];
/**
 * Removes all style elements from Templates for the given scopeName.
 */
const removeStylesFromLitTemplates = (scopeName) => {
    TEMPLATE_TYPES.forEach((type) => {
        const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
        if (templates !== undefined) {
            templates.keyString.forEach((template) => {
                const { element: { content } } = template;
                // IE 11 doesn't support the iterable param Set constructor
                const styles = new Set();
                Array.from(content.querySelectorAll('style')).forEach((s) => {
                    styles.add(s);
                });
                removeNodesFromTemplate(template, styles);
            });
        }
    });
};
const shadyRenderSet = new Set();
/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered
 * output.
 */
const prepareTemplateStyles = (scopeName, renderedDOM, template) => {
    shadyRenderSet.add(scopeName);
    // If `renderedDOM` is stamped from a Template, then we need to edit that
    // Template's underlying template element. Otherwise, we create one here
    // to give to ShadyCSS, which still requires one while scoping.
    const templateElement = !!template ? template.element : document.createElement('template');
    // Move styles out of rendered DOM and store.
    const styles = renderedDOM.querySelectorAll('style');
    const { length } = styles;
    // If there are no styles, skip unnecessary work
    if (length === 0) {
        // Ensure prepareTemplateStyles is called to support adding
        // styles via `prepareAdoptedCssText` since that requires that
        // `prepareTemplateStyles` is called.
        //
        // ShadyCSS will only update styles containing @apply in the template
        // given to `prepareTemplateStyles`. If no lit Template was given,
        // ShadyCSS will not be able to update uses of @apply in any relevant
        // template. However, this is not a problem because we only create the
        // template for the purpose of supporting `prepareAdoptedCssText`,
        // which doesn't support @apply at all.
        window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
        return;
    }
    const condensedStyle = document.createElement('style');
    // Collect styles into a single style. This helps us make sure ShadyCSS
    // manipulations will not prevent us from being able to fix up template
    // part indices.
    // NOTE: collecting styles is inefficient for browsers but ShadyCSS
    // currently does this anyway. When it does not, this should be changed.
    for (let i = 0; i < length; i++) {
        const style = styles[i];
        style.parentNode.removeChild(style);
        condensedStyle.textContent += style.textContent;
    }
    // Remove styles from nested templates in this scope.
    removeStylesFromLitTemplates(scopeName);
    // And then put the condensed style into the "root" template passed in as
    // `template`.
    const content = templateElement.content;
    if (!!template) {
        insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
    }
    else {
        content.insertBefore(condensedStyle, content.firstChild);
    }
    // Note, it's important that ShadyCSS gets the template that `lit-html`
    // will actually render so that it can update the style inside when
    // needed (e.g. @apply native Shadow DOM case).
    window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
    const style = content.querySelector('style');
    if (window.ShadyCSS.nativeShadow && style !== null) {
        // When in native Shadow DOM, ensure the style created by ShadyCSS is
        // included in initially rendered output (`renderedDOM`).
        renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
    }
    else if (!!template) {
        // When no style is left in the template, parts will be broken as a
        // result. To fix this, we put back the style node ShadyCSS removed
        // and then tell lit to remove that node from the template.
        // There can be no style in the template in 2 cases (1) when Shady DOM
        // is in use, ShadyCSS removes all styles, (2) when native Shadow DOM
        // is in use ShadyCSS removes the style if it contains no content.
        // NOTE, ShadyCSS creates its own style so we can safely add/remove
        // `condensedStyle` here.
        content.insertBefore(condensedStyle, content.firstChild);
        const removes = new Set();
        removes.add(condensedStyle);
        removeNodesFromTemplate(template, removes);
    }
};
/**
 * Extension to the standard `render` method which supports rendering
 * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
 * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
 * or when the webcomponentsjs
 * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
 *
 * Adds a `scopeName` option which is used to scope element DOM and stylesheets
 * when native ShadowDOM is unavailable. The `scopeName` will be added to
 * the class attribute of all rendered DOM. In addition, any style elements will
 * be automatically re-written with this `scopeName` selector and moved out
 * of the rendered DOM and into the document `<head>`.
 *
 * It is common to use this render method in conjunction with a custom element
 * which renders a shadowRoot. When this is done, typically the element's
 * `localName` should be used as the `scopeName`.
 *
 * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
 * custom properties (needed only on older browsers like IE11) and a shim for
 * a deprecated feature called `@apply` that supports applying a set of css
 * custom properties to a given location.
 *
 * Usage considerations:
 *
 * * Part values in `<style>` elements are only applied the first time a given
 * `scopeName` renders. Subsequent changes to parts in style elements will have
 * no effect. Because of this, parts in style elements should only be used for
 * values that will never change, for example parts that set scope-wide theme
 * values or parts which render shared style elements.
 *
 * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
 * custom element's `constructor` is not supported. Instead rendering should
 * either done asynchronously, for example at microtask timing (for example
 * `Promise.resolve()`), or be deferred until the first time the element's
 * `connectedCallback` runs.
 *
 * Usage considerations when using shimmed custom properties or `@apply`:
 *
 * * Whenever any dynamic changes are made which affect
 * css custom properties, `ShadyCSS.styleElement(element)` must be called
 * to update the element. There are two cases when this is needed:
 * (1) the element is connected to a new parent, (2) a class is added to the
 * element that causes it to match different custom properties.
 * To address the first case when rendering a custom element, `styleElement`
 * should be called in the element's `connectedCallback`.
 *
 * * Shimmed custom properties may only be defined either for an entire
 * shadowRoot (for example, in a `:host` rule) or via a rule that directly
 * matches an element with a shadowRoot. In other words, instead of flowing from
 * parent to child as do native css custom properties, shimmed custom properties
 * flow only from shadowRoots to nested shadowRoots.
 *
 * * When using `@apply` mixing css shorthand property names with
 * non-shorthand names (for example `border` and `border-width`) is not
 * supported.
 */
const render$1 = (result, container, options) => {
    if (!options || typeof options !== 'object' || !options.scopeName) {
        throw new Error('The `scopeName` option is required.');
    }
    const scopeName = options.scopeName;
    const hasRendered = parts.has(container);
    const needsScoping = compatibleShadyCSSVersion &&
        container.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */ &&
        !!container.host;
    // Handle first render to a scope specially...
    const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
    // On first scope render, render into a fragment; this cannot be a single
    // fragment that is reused since nested renders can occur synchronously.
    const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
    render(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
    // When performing first scope render,
    // (1) We've rendered into a fragment so that there's a chance to
    // `prepareTemplateStyles` before sub-elements hit the DOM
    // (which might cause them to render based on a common pattern of
    // rendering in a custom element's `connectedCallback`);
    // (2) Scope the template with ShadyCSS one time only for this scope.
    // (3) Render the fragment into the container and make sure the
    // container knows its `part` is the one we just rendered. This ensures
    // DOM will be re-used on subsequent renders.
    if (firstScopeRender) {
        const part = parts.get(renderContainer);
        parts.delete(renderContainer);
        // ShadyCSS might have style sheets (e.g. from `prepareAdoptedCssText`)
        // that should apply to `renderContainer` even if the rendered value is
        // not a TemplateInstance. However, it will only insert scoped styles
        // into the document if `prepareTemplateStyles` has already been called
        // for the given scope name.
        const template = part.value instanceof TemplateInstance ?
            part.value.template :
            undefined;
        prepareTemplateStyles(scopeName, renderContainer, template);
        removeNodes(container, container.firstChild);
        container.appendChild(renderContainer);
        parts.set(container, part);
    }
    // After elements have hit the DOM, update styling if this is the
    // initial render to this container.
    // This is needed whenever dynamic changes are made so it would be
    // safest to do every render; however, this would regress performance
    // so we leave it up to the user to call `ShadyCSS.styleElement`
    // for dynamic changes.
    if (!hasRendered && needsScoping) {
        window.ShadyCSS.styleElement(container.host);
    }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
var _a;
/**
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
window.JSCompiler_renameProperty =
    (prop, _obj) => prop;
const defaultConverter = {
    toAttribute(value, type) {
        switch (type) {
            case Boolean:
                return value ? '' : null;
            case Object:
            case Array:
                // if the value is `null` or `undefined` pass this through
                // to allow removing/no change behavior.
                return value == null ? value : JSON.stringify(value);
        }
        return value;
    },
    fromAttribute(value, type) {
        switch (type) {
            case Boolean:
                return value !== null;
            case Number:
                return value === null ? null : Number(value);
            case Object:
            case Array:
                return JSON.parse(value);
        }
        return value;
    }
};
/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
const notEqual = (value, old) => {
    // This ensures (old==NaN, value==NaN) always returns false
    return old !== value && (old === old || value === value);
};
const defaultPropertyDeclaration = {
    attribute: true,
    type: String,
    converter: defaultConverter,
    reflect: false,
    hasChanged: notEqual
};
const STATE_HAS_UPDATED = 1;
const STATE_UPDATE_REQUESTED = 1 << 2;
const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
/**
 * The Closure JS Compiler doesn't currently have good support for static
 * property semantics where "this" is dynamic (e.g.
 * https://github.com/google/closure-compiler/issues/3177 and others) so we use
 * this hack to bypass any rewriting by the compiler.
 */
const finalized = 'finalized';
/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 */
class UpdatingElement extends HTMLElement {
    constructor() {
        super();
        this._updateState = 0;
        this._instanceProperties = undefined;
        // Initialize to an unresolved Promise so we can make sure the element has
        // connected before first update.
        this._updatePromise = new Promise((res) => this._enableUpdatingResolver = res);
        /**
         * Map with keys for any properties that have changed since the last
         * update cycle with previous values.
         */
        this._changedProperties = new Map();
        /**
         * Map with keys of properties that should be reflected when updated.
         */
        this._reflectingProperties = undefined;
        this.initialize();
    }
    /**
     * Returns a list of attributes corresponding to the registered properties.
     * @nocollapse
     */
    static get observedAttributes() {
        // note: piggy backing on this to ensure we're finalized.
        this.finalize();
        const attributes = [];
        // Use forEach so this works even if for/of loops are compiled to for loops
        // expecting arrays
        this._classProperties.forEach((v, p) => {
            const attr = this._attributeNameForProperty(p, v);
            if (attr !== undefined) {
                this._attributeToPropertyMap.set(attr, p);
                attributes.push(attr);
            }
        });
        return attributes;
    }
    /**
     * Ensures the private `_classProperties` property metadata is created.
     * In addition to `finalize` this is also called in `createProperty` to
     * ensure the `@property` decorator can add property metadata.
     */
    /** @nocollapse */
    static _ensureClassProperties() {
        // ensure private storage for property declarations.
        if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
            this._classProperties = new Map();
            // NOTE: Workaround IE11 not supporting Map constructor argument.
            const superProperties = Object.getPrototypeOf(this)._classProperties;
            if (superProperties !== undefined) {
                superProperties.forEach((v, k) => this._classProperties.set(k, v));
            }
        }
    }
    /**
     * Creates a property accessor on the element prototype if one does not exist
     * and stores a PropertyDeclaration for the property with the given options.
     * The property setter calls the property's `hasChanged` property option
     * or uses a strict identity check to determine whether or not to request
     * an update.
     *
     * This method may be overridden to customize properties; however,
     * when doing so, it's important to call `super.createProperty` to ensure
     * the property is setup correctly. This method calls
     * `getPropertyDescriptor` internally to get a descriptor to install.
     * To customize what properties do when they are get or set, override
     * `getPropertyDescriptor`. To customize the options for a property,
     * implement `createProperty` like this:
     *
     * static createProperty(name, options) {
     *   options = Object.assign(options, {myOption: true});
     *   super.createProperty(name, options);
     * }
     *
     * @nocollapse
     */
    static createProperty(name, options = defaultPropertyDeclaration) {
        // Note, since this can be called by the `@property` decorator which
        // is called before `finalize`, we ensure storage exists for property
        // metadata.
        this._ensureClassProperties();
        this._classProperties.set(name, options);
        // Do not generate an accessor if the prototype already has one, since
        // it would be lost otherwise and that would never be the user's intention;
        // Instead, we expect users to call `requestUpdate` themselves from
        // user-defined accessors. Note that if the super has an accessor we will
        // still overwrite it
        if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
            return;
        }
        const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
        const descriptor = this.getPropertyDescriptor(name, key, options);
        if (descriptor !== undefined) {
            Object.defineProperty(this.prototype, name, descriptor);
        }
    }
    /**
     * Returns a property descriptor to be defined on the given named property.
     * If no descriptor is returned, the property will not become an accessor.
     * For example,
     *
     *   class MyElement extends LitElement {
     *     static getPropertyDescriptor(name, key, options) {
     *       const defaultDescriptor =
     *           super.getPropertyDescriptor(name, key, options);
     *       const setter = defaultDescriptor.set;
     *       return {
     *         get: defaultDescriptor.get,
     *         set(value) {
     *           setter.call(this, value);
     *           // custom action.
     *         },
     *         configurable: true,
     *         enumerable: true
     *       }
     *     }
     *   }
     *
     * @nocollapse
     */
    static getPropertyDescriptor(name, key, _options) {
        return {
            // tslint:disable-next-line:no-any no symbol in index
            get() {
                return this[key];
            },
            set(value) {
                const oldValue = this[name];
                this[key] = value;
                this._requestUpdate(name, oldValue);
            },
            configurable: true,
            enumerable: true
        };
    }
    /**
     * Returns the property options associated with the given property.
     * These options are defined with a PropertyDeclaration via the `properties`
     * object or the `@property` decorator and are registered in
     * `createProperty(...)`.
     *
     * Note, this method should be considered "final" and not overridden. To
     * customize the options for a given property, override `createProperty`.
     *
     * @nocollapse
     * @final
     */
    static getPropertyOptions(name) {
        return this._classProperties && this._classProperties.get(name) ||
            defaultPropertyDeclaration;
    }
    /**
     * Creates property accessors for registered properties and ensures
     * any superclasses are also finalized.
     * @nocollapse
     */
    static finalize() {
        // finalize any superclasses
        const superCtor = Object.getPrototypeOf(this);
        if (!superCtor.hasOwnProperty(finalized)) {
            superCtor.finalize();
        }
        this[finalized] = true;
        this._ensureClassProperties();
        // initialize Map populated in observedAttributes
        this._attributeToPropertyMap = new Map();
        // make any properties
        // Note, only process "own" properties since this element will inherit
        // any properties defined on the superClass, and finalization ensures
        // the entire prototype chain is finalized.
        if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
            const props = this.properties;
            // support symbols in properties (IE11 does not support this)
            const propKeys = [
                ...Object.getOwnPropertyNames(props),
                ...(typeof Object.getOwnPropertySymbols === 'function') ?
                    Object.getOwnPropertySymbols(props) :
                    []
            ];
            // This for/of is ok because propKeys is an array
            for (const p of propKeys) {
                // note, use of `any` is due to TypeSript lack of support for symbol in
                // index types
                // tslint:disable-next-line:no-any no symbol in index
                this.createProperty(p, props[p]);
            }
        }
    }
    /**
     * Returns the property name for the given attribute `name`.
     * @nocollapse
     */
    static _attributeNameForProperty(name, options) {
        const attribute = options.attribute;
        return attribute === false ?
            undefined :
            (typeof attribute === 'string' ?
                attribute :
                (typeof name === 'string' ? name.toLowerCase() : undefined));
    }
    /**
     * Returns true if a property should request an update.
     * Called when a property value is set and uses the `hasChanged`
     * option for the property if present or a strict identity check.
     * @nocollapse
     */
    static _valueHasChanged(value, old, hasChanged = notEqual) {
        return hasChanged(value, old);
    }
    /**
     * Returns the property value for the given attribute value.
     * Called via the `attributeChangedCallback` and uses the property's
     * `converter` or `converter.fromAttribute` property option.
     * @nocollapse
     */
    static _propertyValueFromAttribute(value, options) {
        const type = options.type;
        const converter = options.converter || defaultConverter;
        const fromAttribute = (typeof converter === 'function' ? converter : converter.fromAttribute);
        return fromAttribute ? fromAttribute(value, type) : value;
    }
    /**
     * Returns the attribute value for the given property value. If this
     * returns undefined, the property will *not* be reflected to an attribute.
     * If this returns null, the attribute will be removed, otherwise the
     * attribute will be set to the value.
     * This uses the property's `reflect` and `type.toAttribute` property options.
     * @nocollapse
     */
    static _propertyValueToAttribute(value, options) {
        if (options.reflect === undefined) {
            return;
        }
        const type = options.type;
        const converter = options.converter;
        const toAttribute = converter && converter.toAttribute ||
            defaultConverter.toAttribute;
        return toAttribute(value, type);
    }
    /**
     * Performs element initialization. By default captures any pre-set values for
     * registered properties.
     */
    initialize() {
        this._saveInstanceProperties();
        // ensures first update will be caught by an early access of
        // `updateComplete`
        this._requestUpdate();
    }
    /**
     * Fixes any properties set on the instance before upgrade time.
     * Otherwise these would shadow the accessor and break these properties.
     * The properties are stored in a Map which is played back after the
     * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
     * (<=41), properties created for native platform properties like (`id` or
     * `name`) may not have default values set in the element constructor. On
     * these browsers native properties appear on instances and therefore their
     * default value will overwrite any element default (e.g. if the element sets
     * this.id = 'id' in the constructor, the 'id' will become '' since this is
     * the native platform default).
     */
    _saveInstanceProperties() {
        // Use forEach so this works even if for/of loops are compiled to for loops
        // expecting arrays
        this.constructor
            ._classProperties.forEach((_v, p) => {
            if (this.hasOwnProperty(p)) {
                const value = this[p];
                delete this[p];
                if (!this._instanceProperties) {
                    this._instanceProperties = new Map();
                }
                this._instanceProperties.set(p, value);
            }
        });
    }
    /**
     * Applies previously saved instance properties.
     */
    _applyInstanceProperties() {
        // Use forEach so this works even if for/of loops are compiled to for loops
        // expecting arrays
        // tslint:disable-next-line:no-any
        this._instanceProperties.forEach((v, p) => this[p] = v);
        this._instanceProperties = undefined;
    }
    connectedCallback() {
        // Ensure first connection completes an update. Updates cannot complete
        // before connection.
        this.enableUpdating();
    }
    enableUpdating() {
        if (this._enableUpdatingResolver !== undefined) {
            this._enableUpdatingResolver();
            this._enableUpdatingResolver = undefined;
        }
    }
    /**
     * Allows for `super.disconnectedCallback()` in extensions while
     * reserving the possibility of making non-breaking feature additions
     * when disconnecting at some point in the future.
     */
    disconnectedCallback() {
    }
    /**
     * Synchronizes property values when attributes change.
     */
    attributeChangedCallback(name, old, value) {
        if (old !== value) {
            this._attributeToProperty(name, value);
        }
    }
    _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
        const ctor = this.constructor;
        const attr = ctor._attributeNameForProperty(name, options);
        if (attr !== undefined) {
            const attrValue = ctor._propertyValueToAttribute(value, options);
            // an undefined value does not change the attribute.
            if (attrValue === undefined) {
                return;
            }
            // Track if the property is being reflected to avoid
            // setting the property again via `attributeChangedCallback`. Note:
            // 1. this takes advantage of the fact that the callback is synchronous.
            // 2. will behave incorrectly if multiple attributes are in the reaction
            // stack at time of calling. However, since we process attributes
            // in `update` this should not be possible (or an extreme corner case
            // that we'd like to discover).
            // mark state reflecting
            this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
            if (attrValue == null) {
                this.removeAttribute(attr);
            }
            else {
                this.setAttribute(attr, attrValue);
            }
            // mark state not reflecting
            this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
        }
    }
    _attributeToProperty(name, value) {
        // Use tracking info to avoid deserializing attribute value if it was
        // just set from a property setter.
        if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
            return;
        }
        const ctor = this.constructor;
        // Note, hint this as an `AttributeMap` so closure clearly understands
        // the type; it has issues with tracking types through statics
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const propName = ctor._attributeToPropertyMap.get(name);
        if (propName !== undefined) {
            const options = ctor.getPropertyOptions(propName);
            // mark state reflecting
            this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
            this[propName] =
                // tslint:disable-next-line:no-any
                ctor._propertyValueFromAttribute(value, options);
            // mark state not reflecting
            this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
        }
    }
    /**
     * This private version of `requestUpdate` does not access or return the
     * `updateComplete` promise. This promise can be overridden and is therefore
     * not free to access.
     */
    _requestUpdate(name, oldValue) {
        let shouldRequestUpdate = true;
        // If we have a property key, perform property update steps.
        if (name !== undefined) {
            const ctor = this.constructor;
            const options = ctor.getPropertyOptions(name);
            if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
                if (!this._changedProperties.has(name)) {
                    this._changedProperties.set(name, oldValue);
                }
                // Add to reflecting properties set.
                // Note, it's important that every change has a chance to add the
                // property to `_reflectingProperties`. This ensures setting
                // attribute + property reflects correctly.
                if (options.reflect === true &&
                    !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
                    if (this._reflectingProperties === undefined) {
                        this._reflectingProperties = new Map();
                    }
                    this._reflectingProperties.set(name, options);
                }
            }
            else {
                // Abort the request if the property should not be considered changed.
                shouldRequestUpdate = false;
            }
        }
        if (!this._hasRequestedUpdate && shouldRequestUpdate) {
            this._updatePromise = this._enqueueUpdate();
        }
    }
    /**
     * Requests an update which is processed asynchronously. This should
     * be called when an element should update based on some state not triggered
     * by setting a property. In this case, pass no arguments. It should also be
     * called when manually implementing a property setter. In this case, pass the
     * property `name` and `oldValue` to ensure that any configured property
     * options are honored. Returns the `updateComplete` Promise which is resolved
     * when the update completes.
     *
     * @param name {PropertyKey} (optional) name of requesting property
     * @param oldValue {any} (optional) old value of requesting property
     * @returns {Promise} A Promise that is resolved when the update completes.
     */
    requestUpdate(name, oldValue) {
        this._requestUpdate(name, oldValue);
        return this.updateComplete;
    }
    /**
     * Sets up the element to asynchronously update.
     */
    async _enqueueUpdate() {
        this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
        try {
            // Ensure any previous update has resolved before updating.
            // This `await` also ensures that property changes are batched.
            await this._updatePromise;
        }
        catch (e) {
            // Ignore any previous errors. We only care that the previous cycle is
            // done. Any error should have been handled in the previous update.
        }
        const result = this.performUpdate();
        // If `performUpdate` returns a Promise, we await it. This is done to
        // enable coordinating updates with a scheduler. Note, the result is
        // checked to avoid delaying an additional microtask unless we need to.
        if (result != null) {
            await result;
        }
        return !this._hasRequestedUpdate;
    }
    get _hasRequestedUpdate() {
        return (this._updateState & STATE_UPDATE_REQUESTED);
    }
    get hasUpdated() {
        return (this._updateState & STATE_HAS_UPDATED);
    }
    /**
     * Performs an element update. Note, if an exception is thrown during the
     * update, `firstUpdated` and `updated` will not be called.
     *
     * You can override this method to change the timing of updates. If this
     * method is overridden, `super.performUpdate()` must be called.
     *
     * For instance, to schedule updates to occur just before the next frame:
     *
     * ```
     * protected async performUpdate(): Promise<unknown> {
     *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
     *   super.performUpdate();
     * }
     * ```
     */
    performUpdate() {
        // Mixin instance properties once, if they exist.
        if (this._instanceProperties) {
            this._applyInstanceProperties();
        }
        let shouldUpdate = false;
        const changedProperties = this._changedProperties;
        try {
            shouldUpdate = this.shouldUpdate(changedProperties);
            if (shouldUpdate) {
                this.update(changedProperties);
            }
            else {
                this._markUpdated();
            }
        }
        catch (e) {
            // Prevent `firstUpdated` and `updated` from running when there's an
            // update exception.
            shouldUpdate = false;
            // Ensure element can accept additional updates after an exception.
            this._markUpdated();
            throw e;
        }
        if (shouldUpdate) {
            if (!(this._updateState & STATE_HAS_UPDATED)) {
                this._updateState = this._updateState | STATE_HAS_UPDATED;
                this.firstUpdated(changedProperties);
            }
            this.updated(changedProperties);
        }
    }
    _markUpdated() {
        this._changedProperties = new Map();
        this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
    }
    /**
     * Returns a Promise that resolves when the element has completed updating.
     * The Promise value is a boolean that is `true` if the element completed the
     * update without triggering another update. The Promise result is `false` if
     * a property was set inside `updated()`. If the Promise is rejected, an
     * exception was thrown during the update.
     *
     * To await additional asynchronous work, override the `_getUpdateComplete`
     * method. For example, it is sometimes useful to await a rendered element
     * before fulfilling this Promise. To do this, first await
     * `super._getUpdateComplete()`, then any subsequent state.
     *
     * @returns {Promise} The Promise returns a boolean that indicates if the
     * update resolved without triggering another update.
     */
    get updateComplete() {
        return this._getUpdateComplete();
    }
    /**
     * Override point for the `updateComplete` promise.
     *
     * It is not safe to override the `updateComplete` getter directly due to a
     * limitation in TypeScript which means it is not possible to call a
     * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
     * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
     * This method should be overridden instead. For example:
     *
     *   class MyElement extends LitElement {
     *     async _getUpdateComplete() {
     *       await super._getUpdateComplete();
     *       await this._myChild.updateComplete;
     *     }
     *   }
     */
    _getUpdateComplete() {
        return this._updatePromise;
    }
    /**
     * Controls whether or not `update` should be called when the element requests
     * an update. By default, this method always returns `true`, but this can be
     * customized to control when to update.
     *
     * @param _changedProperties Map of changed properties with old values
     */
    shouldUpdate(_changedProperties) {
        return true;
    }
    /**
     * Updates the element. This method reflects property values to attributes.
     * It can be overridden to render and keep updated element DOM.
     * Setting properties inside this method will *not* trigger
     * another update.
     *
     * @param _changedProperties Map of changed properties with old values
     */
    update(_changedProperties) {
        if (this._reflectingProperties !== undefined &&
            this._reflectingProperties.size > 0) {
            // Use forEach so this works even if for/of loops are compiled to for
            // loops expecting arrays
            this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
            this._reflectingProperties = undefined;
        }
        this._markUpdated();
    }
    /**
     * Invoked whenever the element is updated. Implement to perform
     * post-updating tasks via DOM APIs, for example, focusing an element.
     *
     * Setting properties inside this method will trigger the element to update
     * again after this update cycle completes.
     *
     * @param _changedProperties Map of changed properties with old values
     */
    updated(_changedProperties) {
    }
    /**
     * Invoked when the element is first updated. Implement to perform one time
     * work on the element after update.
     *
     * Setting properties inside this method will trigger the element to update
     * again after this update cycle completes.
     *
     * @param _changedProperties Map of changed properties with old values
     */
    firstUpdated(_changedProperties) {
    }
}
_a = finalized;
/**
 * Marks class as having finished creating properties.
 */
UpdatingElement[_a] = true;

/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
const supportsAdoptingStyleSheets = ('adoptedStyleSheets' in Document.prototype) &&
    ('replace' in CSSStyleSheet.prototype);
const constructionToken = Symbol();
class CSSResult {
    constructor(cssText, safeToken) {
        if (safeToken !== constructionToken) {
            throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
        }
        this.cssText = cssText;
    }
    // Note, this is a getter so that it's lazy. In practice, this means
    // stylesheets are not created until the first element instance is made.
    get styleSheet() {
        if (this._styleSheet === undefined) {
            // Note, if `adoptedStyleSheets` is supported then we assume CSSStyleSheet
            // is constructable.
            if (supportsAdoptingStyleSheets) {
                this._styleSheet = new CSSStyleSheet();
                this._styleSheet.replaceSync(this.cssText);
            }
            else {
                this._styleSheet = null;
            }
        }
        return this._styleSheet;
    }
    toString() {
        return this.cssText;
    }
}
const textFromCSSResult = (value) => {
    if (value instanceof CSSResult) {
        return value.cssText;
    }
    else if (typeof value === 'number') {
        return value;
    }
    else {
        throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
    }
};
/**
 * Template tag which which can be used with LitElement's `style` property to
 * set element styles. For security reasons, only literal string values may be
 * used. To incorporate non-literal values `unsafeCSS` may be used inside a
 * template string part.
 */
const css = (strings, ...values) => {
    const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
    return new CSSResult(cssText, constructionToken);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time
(window['litElementVersions'] || (window['litElementVersions'] = []))
    .push('2.3.1');
/**
 * Sentinal value used to avoid calling lit-html's render function when
 * subclasses do not implement `render`
 */
const renderNotImplemented = {};
class LitElement extends UpdatingElement {
    /**
     * Return the array of styles to apply to the element.
     * Override this method to integrate into a style management system.
     *
     * @nocollapse
     */
    static getStyles() {
        return this.styles;
    }
    /** @nocollapse */
    static _getUniqueStyles() {
        // Only gather styles once per class
        if (this.hasOwnProperty(JSCompiler_renameProperty('_styles', this))) {
            return;
        }
        // Take care not to call `this.getStyles()` multiple times since this
        // generates new CSSResults each time.
        // TODO(sorvell): Since we do not cache CSSResults by input, any
        // shared styles will generate new stylesheet objects, which is wasteful.
        // This should be addressed when a browser ships constructable
        // stylesheets.
        const userStyles = this.getStyles();
        if (userStyles === undefined) {
            this._styles = [];
        }
        else if (Array.isArray(userStyles)) {
            // De-duplicate styles preserving the _last_ instance in the set.
            // This is a performance optimization to avoid duplicated styles that can
            // occur especially when composing via subclassing.
            // The last item is kept to try to preserve the cascade order with the
            // assumption that it's most important that last added styles override
            // previous styles.
            const addStyles = (styles, set) => styles.reduceRight((set, s) => 
            // Note: On IE set.add() does not return the set
            Array.isArray(s) ? addStyles(s, set) : (set.add(s), set), set);
            // Array.from does not work on Set in IE, otherwise return
            // Array.from(addStyles(userStyles, new Set<CSSResult>())).reverse()
            const set = addStyles(userStyles, new Set());
            const styles = [];
            set.forEach((v) => styles.unshift(v));
            this._styles = styles;
        }
        else {
            this._styles = [userStyles];
        }
    }
    /**
     * Performs element initialization. By default this calls `createRenderRoot`
     * to create the element `renderRoot` node and captures any pre-set values for
     * registered properties.
     */
    initialize() {
        super.initialize();
        this.constructor._getUniqueStyles();
        this.renderRoot =
            this.createRenderRoot();
        // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
        // element's getRootNode(). While this could be done, we're choosing not to
        // support this now since it would require different logic around de-duping.
        if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
            this.adoptStyles();
        }
    }
    /**
     * Returns the node into which the element should render and by default
     * creates and returns an open shadowRoot. Implement to customize where the
     * element's DOM is rendered. For example, to render into the element's
     * childNodes, return `this`.
     * @returns {Element|DocumentFragment} Returns a node into which to render.
     */
    createRenderRoot() {
        return this.attachShadow({ mode: 'open' });
    }
    /**
     * Applies styling to the element shadowRoot using the `static get styles`
     * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
     * available and will fallback otherwise. When Shadow DOM is polyfilled,
     * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
     * is available but `adoptedStyleSheets` is not, styles are appended to the
     * end of the `shadowRoot` to [mimic spec
     * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
     */
    adoptStyles() {
        const styles = this.constructor._styles;
        if (styles.length === 0) {
            return;
        }
        // There are three separate cases here based on Shadow DOM support.
        // (1) shadowRoot polyfilled: use ShadyCSS
        // (2) shadowRoot.adoptedStyleSheets available: use it.
        // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
        // rendering
        if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
            window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
        }
        else if (supportsAdoptingStyleSheets) {
            this.renderRoot.adoptedStyleSheets =
                styles.map((s) => s.styleSheet);
        }
        else {
            // This must be done after rendering so the actual style insertion is done
            // in `update`.
            this._needsShimAdoptedStyleSheets = true;
        }
    }
    connectedCallback() {
        super.connectedCallback();
        // Note, first update/render handles styleElement so we only call this if
        // connected after first update.
        if (this.hasUpdated && window.ShadyCSS !== undefined) {
            window.ShadyCSS.styleElement(this);
        }
    }
    /**
     * Updates the element. This method reflects property values to attributes
     * and calls `render` to render DOM via lit-html. Setting properties inside
     * this method will *not* trigger another update.
     * @param _changedProperties Map of changed properties with old values
     */
    update(changedProperties) {
        // Setting properties in `render` should not trigger an update. Since
        // updates are allowed after super.update, it's important to call `render`
        // before that.
        const templateResult = this.render();
        super.update(changedProperties);
        // If render is not implemented by the component, don't call lit-html render
        if (templateResult !== renderNotImplemented) {
            this.constructor
                .render(templateResult, this.renderRoot, { scopeName: this.localName, eventContext: this });
        }
        // When native Shadow DOM is used but adoptedStyles are not supported,
        // insert styling after rendering to ensure adoptedStyles have highest
        // priority.
        if (this._needsShimAdoptedStyleSheets) {
            this._needsShimAdoptedStyleSheets = false;
            this.constructor._styles.forEach((s) => {
                const style = document.createElement('style');
                style.textContent = s.cssText;
                this.renderRoot.appendChild(style);
            });
        }
    }
    /**
     * Invoked on each update to perform rendering tasks. This method may return
     * any value renderable by lit-html's NodePart - typically a TemplateResult.
     * Setting properties inside this method will *not* trigger the element to
     * update.
     */
    render() {
        return renderNotImplemented;
    }
}
/**
 * Ensure this class is marked as `finalized` as an optimization ensuring
 * it will not needlessly try to `finalize`.
 *
 * Note this property name is a string to prevent breaking Closure JS Compiler
 * optimizations. See updating-element.ts for more information.
 */
LitElement['finalized'] = true;
/**
 * Render method used to render the value to the element's DOM.
 * @param result The value to render.
 * @param container Node into which to render.
 * @param options Element name.
 * @nocollapse
 */
LitElement.render = render$1;

/**
 * A namespace for AMF properties.
 * @type {Object}
 */
const ns = {};

// RAML namespace
ns.aml = {};
ns.raml = ns.aml;
ns.aml.key = 'http://a.ml/';
ns.aml.vocabularies = {};
ns.aml.vocabularies.key = ns.aml.key + 'vocabularies/';
ns.aml.vocabularies.document = {};
const docKey = ns.aml.vocabularies.document.key = ns.aml.vocabularies.key + 'document#';
ns.aml.vocabularies.document.toString = () => docKey;
ns.aml.vocabularies.document.Module = docKey + 'Module';
ns.aml.vocabularies.document.Document = docKey + 'Document';
ns.aml.vocabularies.document.SecuritySchemeFragment = docKey + 'SecuritySchemeFragment';
ns.aml.vocabularies.document.UserDocumentation = docKey + 'UserDocumentation';
ns.aml.vocabularies.document.DataType = docKey + 'DataType';
// ns.aml.vocabularies.document.Example = docKey + 'Example';
ns.aml.vocabularies.document.NamedExamples = docKey + 'NamedExamples';
ns.aml.vocabularies.document.DomainElement = docKey + 'DomainElement';
ns.aml.vocabularies.document.ParametrizedDeclaration = docKey + 'ParametrizedDeclaration';
// ns.aml.vocabularies.document.ParametrizedResourceType = docKey + 'ParametrizedResourceType';
// ns.aml.vocabularies.document.ParametrizedTrait = docKey + 'ParametrizedTrait';
ns.aml.vocabularies.document.ExternalDomainElement = docKey + 'ExternalDomainElement';
ns.aml.vocabularies.document.customDomainProperties = docKey + 'customDomainProperties';
ns.aml.vocabularies.document.encodes = docKey + 'encodes';
ns.aml.vocabularies.document.declares = docKey + 'declares';
ns.aml.vocabularies.document.references = docKey + 'references';
ns.aml.vocabularies.document.examples = docKey + 'examples';
ns.aml.vocabularies.document.linkTarget = docKey + 'link-target';
ns.aml.vocabularies.document.referenceId = docKey + 'reference-id';
ns.aml.vocabularies.document.structuredValue = docKey + 'structuredValue';
ns.aml.vocabularies.document.raw = docKey + 'raw';
ns.aml.vocabularies.document.extends = docKey + 'extends';
ns.aml.vocabularies.document.value = docKey + 'value';
ns.aml.vocabularies.document.name = docKey + 'name';
ns.aml.vocabularies.core = {};
const coreKey = ns.aml.vocabularies.core.key = ns.aml.vocabularies.key + 'core#';
ns.aml.vocabularies.core.toString = () => coreKey;
ns.aml.vocabularies.core.CreativeWork = coreKey + 'CreativeWork';
ns.aml.vocabularies.core.version = coreKey + 'version';
ns.aml.vocabularies.core.urlTemplate = coreKey + 'urlTemplate';
ns.aml.vocabularies.core.displayName = coreKey + 'displayName';
ns.aml.vocabularies.core.title = coreKey + 'title';
ns.aml.vocabularies.core.name = coreKey + 'name';
ns.aml.vocabularies.core.description = coreKey + 'description';
ns.aml.vocabularies.core.documentation = coreKey + 'documentation';
ns.aml.vocabularies.core.provider = coreKey + 'provider';
ns.aml.vocabularies.core.email = coreKey + 'email';
ns.aml.vocabularies.core.url = coreKey + 'url';
ns.aml.vocabularies.core.termsOfService = coreKey + 'termsOfService';
ns.aml.vocabularies.core.license = coreKey + 'license';
ns.aml.vocabularies.core.mediaType = coreKey + 'mediaType';
ns.aml.vocabularies.core.extensionName = coreKey + 'extensionName';
ns.aml.vocabularies.security = {};
const secKey = ns.aml.vocabularies.security.key = ns.aml.vocabularies.key + 'security#';
ns.aml.vocabularies.security.toString = () => secKey;
ns.aml.vocabularies.security.ParametrizedSecurityScheme = secKey + 'ParametrizedSecurityScheme';
ns.aml.vocabularies.security.SecuritySchemeFragment = secKey + 'SecuritySchemeFragment';
ns.aml.vocabularies.security.SecurityScheme = secKey + 'SecurityScheme';
ns.aml.vocabularies.security.OAuth1Settings = secKey + 'OAuth1Settings';
ns.aml.vocabularies.security.OAuth2Settings = secKey + 'OAuth2Settings';
ns.aml.vocabularies.security.OAuth2Flow = secKey + 'OAuth2Flow';
ns.aml.vocabularies.security.Scope = secKey + 'Scope';
ns.aml.vocabularies.security.security = secKey + 'security';
ns.aml.vocabularies.security.scheme = secKey + 'scheme';
ns.aml.vocabularies.security.schemes = secKey + 'schemes';
ns.aml.vocabularies.security.settings = secKey + 'settings';
ns.aml.vocabularies.security.name = secKey + 'name';
ns.aml.vocabularies.security.type = secKey + 'type';
ns.aml.vocabularies.security.scope = secKey + 'scope';
ns.aml.vocabularies.security.accessTokenUri = secKey + 'accessTokenUri';
ns.aml.vocabularies.security.authorizationUri = secKey + 'authorizationUri';
ns.aml.vocabularies.security.authorizationGrant = secKey + 'authorizationGrant';
ns.aml.vocabularies.security.flows = secKey + 'flows';
ns.aml.vocabularies.security.flow = secKey + 'flow';
ns.aml.vocabularies.security.signature = secKey + 'signature';
ns.aml.vocabularies.security.tokenCredentialsUri = secKey + 'tokenCredentialsUri';
ns.aml.vocabularies.security.requestTokenUri = secKey + 'requestTokenUri';
ns.aml.vocabularies.security.securityRequirement = secKey + 'SecurityRequirement';
ns.aml.vocabularies.security.in = secKey + 'in';
ns.aml.vocabularies.apiContract = {};
ns.aml.vocabularies.http = ns.aml.vocabularies.apiContract;
const contractKey = ns.aml.vocabularies.apiContract.key = ns.aml.vocabularies.key + 'apiContract#';
ns.aml.vocabularies.apiContract.toString = () => contractKey;
ns.aml.vocabularies.apiContract.Payload = contractKey + 'Payload';
ns.aml.vocabularies.apiContract.Request = contractKey + 'Request';
ns.aml.vocabularies.apiContract.EndPoint = contractKey + 'EndPoint';
ns.aml.vocabularies.apiContract.Parameter = contractKey + 'Parameter';
ns.aml.vocabularies.apiContract.Operation = contractKey + 'Operation';
ns.aml.vocabularies.apiContract.WebAPI = contractKey + 'WebAPI';
ns.aml.vocabularies.apiContract.UserDocumentationFragment = contractKey + 'UserDocumentationFragment';
ns.aml.vocabularies.apiContract.Example = contractKey + 'Example';
ns.aml.vocabularies.apiContract.Server = contractKey + 'Server';
ns.aml.vocabularies.apiContract.ParametrizedResourceType = contractKey + 'ParametrizedResourceType';
ns.aml.vocabularies.apiContract.ParametrizedTrait = contractKey + 'ParametrizedTrait';
ns.aml.vocabularies.apiContract.Callback = contractKey + 'Callback';
ns.aml.vocabularies.apiContract.TemplatedLink = contractKey + 'TemplatedLink';
ns.aml.vocabularies.apiContract.IriTemplateMapping = contractKey + 'IriTemplateMapping';
ns.aml.vocabularies.apiContract.header = contractKey + 'header';
ns.aml.vocabularies.apiContract.parameter = contractKey + 'parameter';
ns.aml.vocabularies.apiContract.paramName = contractKey + 'paramName';
ns.aml.vocabularies.apiContract.uriParameter = contractKey + 'uriParameter';
ns.aml.vocabularies.apiContract.variable = contractKey + 'variable';
ns.aml.vocabularies.apiContract.payload = contractKey + 'payload';
ns.aml.vocabularies.apiContract.server = contractKey + 'server';
ns.aml.vocabularies.apiContract.path = contractKey + 'path';
ns.aml.vocabularies.apiContract.url = contractKey + 'url';
ns.aml.vocabularies.apiContract.scheme = contractKey + 'scheme';
ns.aml.vocabularies.apiContract.endpoint = contractKey + 'endpoint';
ns.aml.vocabularies.apiContract.queryString = contractKey + 'queryString';
// ns.aml.vocabularies.apiContract.mediaType = contractKey + 'mediaType';
ns.aml.vocabularies.apiContract.accepts = contractKey + 'accepts';
ns.aml.vocabularies.apiContract.guiSummary = contractKey + 'guiSummary';
ns.aml.vocabularies.apiContract.binding = contractKey + 'binding';
ns.aml.vocabularies.apiContract.response = contractKey + 'response';
ns.aml.vocabularies.apiContract.returns = contractKey + 'returns';
ns.aml.vocabularies.apiContract.expects = contractKey + 'expects';
ns.aml.vocabularies.apiContract.examples = contractKey + 'examples';
ns.aml.vocabularies.apiContract.supportedOperation = contractKey + 'supportedOperation';
ns.aml.vocabularies.apiContract.statusCode = contractKey + 'statusCode';
ns.aml.vocabularies.apiContract.method = contractKey + 'method';
ns.aml.vocabularies.apiContract.required = contractKey + 'required';
ns.aml.vocabularies.apiContract.callback = contractKey + 'callback';
ns.aml.vocabularies.apiContract.expression = contractKey + 'expression';
ns.aml.vocabularies.apiContract.link = contractKey + 'link';
ns.aml.vocabularies.apiContract.linkExpression = contractKey + 'linkExpression';
ns.aml.vocabularies.apiContract.templateVariable = contractKey + 'templateVariable';
ns.aml.vocabularies.apiContract.mapping = contractKey + 'mapping';
ns.aml.vocabularies.apiContract.operationId = contractKey + 'operationId';
ns.aml.vocabularies.shapes = {};
const shapesKey = ns.aml.vocabularies.shapes.key = ns.aml.vocabularies.key + 'shapes#';
ns.aml.vocabularies.shapes.toString = () => shapesKey;
ns.aml.vocabularies.shapes.ScalarShape = shapesKey + 'ScalarShape';
ns.aml.vocabularies.shapes.ArrayShape = shapesKey + 'ArrayShape';
ns.aml.vocabularies.shapes.UnionShape = shapesKey + 'UnionShape';
ns.aml.vocabularies.shapes.NilShape = shapesKey + 'NilShape';
ns.aml.vocabularies.shapes.FileShape = shapesKey + 'FileShape';
ns.aml.vocabularies.shapes.AnyShape = shapesKey + 'AnyShape';
ns.aml.vocabularies.shapes.SchemaShape = shapesKey + 'SchemaShape';
ns.aml.vocabularies.shapes.MatrixShape = shapesKey + 'MatrixShape';
ns.aml.vocabularies.shapes.TupleShape = shapesKey + 'TupleShape';
ns.aml.vocabularies.shapes.DataTypeFragment = shapesKey + 'DataTypeFragment';
ns.aml.vocabularies.shapes.RecursiveShape = shapesKey + 'RecursiveShape';
ns.aml.vocabularies.shapes.range = shapesKey + 'range';
ns.aml.vocabularies.shapes.items = shapesKey + 'items';
ns.aml.vocabularies.shapes.anyOf = shapesKey + 'anyOf';
ns.aml.vocabularies.shapes.fileType = shapesKey + 'fileType';
ns.aml.vocabularies.shapes.number = shapesKey + 'number';
ns.aml.vocabularies.shapes.integer = shapesKey + 'integer';
ns.aml.vocabularies.shapes.long = shapesKey + 'long';
ns.aml.vocabularies.shapes.double = shapesKey + 'double';
ns.aml.vocabularies.shapes.boolean = shapesKey + 'boolean';
ns.aml.vocabularies.shapes.float = shapesKey + 'float';
ns.aml.vocabularies.shapes.nil = shapesKey + 'nil';
ns.aml.vocabularies.shapes.dateTimeOnly = shapesKey + 'dateTimeOnly';
ns.aml.vocabularies.shapes.password = shapesKey + 'password';
ns.aml.vocabularies.shapes.schema = shapesKey + 'schema';
ns.aml.vocabularies.shapes.xmlSerialization = shapesKey + 'xmlSerialization';
ns.aml.vocabularies.shapes.xmlName = shapesKey + 'xmlName';
ns.aml.vocabularies.shapes.xmlAttribute = shapesKey + 'xmlAttribute';
ns.aml.vocabularies.shapes.xmlWrapped = shapesKey + 'xmlWrapped';
ns.aml.vocabularies.shapes.readOnly = shapesKey + 'readOnly';
ns.aml.vocabularies.data = {};
const dataKey = ns.aml.vocabularies.data.key = ns.aml.vocabularies.key + 'data#';
ns.aml.vocabularies.data.toString = () => dataKey;
ns.aml.vocabularies.data.Scalar = dataKey + 'Scalar';
ns.aml.vocabularies.data.Object = dataKey + 'Object';
ns.aml.vocabularies.data.Array = dataKey + 'Array';
ns.aml.vocabularies.data.value = dataKey + 'value';
ns.aml.vocabularies.data.type = dataKey + 'type';
ns.aml.vocabularies.data.description = dataKey + 'description';
ns.aml.vocabularies.data.required = dataKey + 'required';
ns.aml.vocabularies.data.displayName = dataKey + 'displayName';
ns.aml.vocabularies.data.minLength = dataKey + 'minLength';
ns.aml.vocabularies.data.maxLength = dataKey + 'maxLength';
ns.aml.vocabularies.data.default = dataKey + 'default';
ns.aml.vocabularies.data.multipleOf = dataKey + 'multipleOf';
ns.aml.vocabularies.data.minimum = dataKey + 'minimum';
ns.aml.vocabularies.data.maximum = dataKey + 'maximum';
ns.aml.vocabularies.data.enum = dataKey + 'enum';
ns.aml.vocabularies.data.pattern = dataKey + 'pattern';
ns.aml.vocabularies.data.items = dataKey + 'items';
ns.aml.vocabularies.data.format = dataKey + 'format';
ns.aml.vocabularies.data.example = dataKey + 'example';
ns.aml.vocabularies.data.examples = dataKey + 'examples';

ns.aml.vocabularies.docSourceMaps = {};
const dsmKey = ns.aml.vocabularies.docSourceMaps.key = ns.aml.vocabularies.key + 'document-source-maps#';
ns.aml.vocabularies.docSourceMaps.toString = () => dsmKey;
ns.aml.vocabularies.docSourceMaps.sources = dsmKey + 'sources';
ns.aml.vocabularies.docSourceMaps.element = dsmKey + 'element';
ns.aml.vocabularies.docSourceMaps.value = dsmKey + 'value';
ns.aml.vocabularies.docSourceMaps.declaredElement = dsmKey + 'declared-element';
ns.aml.vocabularies.docSourceMaps.trackedElement = dsmKey + 'tracked-element';
ns.aml.vocabularies.docSourceMaps.parsedJsonSchema = dsmKey + 'parsed-json-schema';

// W3 namespace
ns.w3 = {};
ns.w3.key = 'http://www.w3.org/';
ns.w3.rdfSyntax = {};
ns.w3.rdfSyntax.key = ns.w3.key + '1999/02/22-rdf-syntax-ns#';
ns.w3.rdfSyntax.toString = () => ns.w3.rdfSyntax.key;
// TODO: is this unescesary?
ns.w3.rdfSyntax.member = ns.w3.rdfSyntax.key + 'member';
ns.w3.rdfSyntax.Seq = ns.w3.rdfSyntax.key + 'Seq';
ns.w3.rdfSchema = {};
ns.w3.rdfSchema.key = ns.w3.key + '2000/01/rdf-schema#';
ns.w3.rdfSchema.toString = () => ns.w3.rdfSchema.key;
ns.w3.rdfSchema.member = ns.w3.rdfSchema.key + 'member';
ns.w3.rdfSchema.Seq = ns.w3.rdfSchema.key + 'Seq';
ns.w3.hydra = {};
ns.w3.hydra.key = ns.w3.key + 'ns/hydra/';
ns.w3.hydra.toString = () => ns.w3.hydra.key;
ns.w3.hydra.core = ns.aml.vocabularies.apiContract;
ns.w3.xmlSchema = {};
ns.w3.xmlSchema.key = ns.w3.key + '2001/XMLSchema#';
ns.w3.xmlSchema.toString = () => ns.w3.xmlSchema.key;
ns.w3.xmlSchema.boolean = ns.w3.xmlSchema.key + 'boolean';
ns.w3.xmlSchema.string = ns.w3.xmlSchema.key + 'string';
ns.w3.xmlSchema.number = ns.w3.xmlSchema.key + 'number';
ns.w3.xmlSchema.integer = ns.w3.xmlSchema.key + 'integer';
ns.w3.xmlSchema.long = ns.w3.xmlSchema.key + 'long';
ns.w3.xmlSchema.double = ns.w3.xmlSchema.key + 'double';
ns.w3.xmlSchema.float = ns.w3.xmlSchema.key + 'float';
ns.w3.xmlSchema.nil = ns.w3.xmlSchema.key + 'nil';
ns.w3.xmlSchema.dateTime = ns.w3.xmlSchema.key + 'dateTime';
ns.w3.xmlSchema.time = ns.w3.xmlSchema.key + 'time';
ns.w3.xmlSchema.date = ns.w3.xmlSchema.key + 'date';
ns.w3.xmlSchema.base64Binary = ns.w3.xmlSchema.key + 'base64Binary';
// w3 types
ns.w3.shacl = {};
const n2shaclName = ns.w3.shacl.key = ns.w3.key + 'ns/shacl#';
ns.w3.shacl.toString = () => n2shaclName;
ns.w3.shacl.Shape = n2shaclName + 'Shape';
ns.w3.shacl.NodeShape = n2shaclName + 'NodeShape';
ns.w3.shacl.SchemaShape = n2shaclName + 'SchemaShape';
ns.w3.shacl.PropertyShape = n2shaclName + 'PropertyShape';
ns.w3.shacl.in = n2shaclName + 'in';
ns.w3.shacl.defaultValue = n2shaclName + 'defaultValue';
ns.w3.shacl.defaultValueStr = n2shaclName + 'defaultValueStr';
ns.w3.shacl.pattern = n2shaclName + 'pattern';
ns.w3.shacl.minInclusive = n2shaclName + 'minInclusive';
ns.w3.shacl.maxInclusive = n2shaclName + 'maxInclusive';
ns.w3.shacl.multipleOf = n2shaclName + 'multipleOf';
ns.w3.shacl.minLength = n2shaclName + 'minLength';
ns.w3.shacl.maxLength = n2shaclName + 'maxLength';
ns.w3.shacl.fileType = n2shaclName + 'fileType';
ns.w3.shacl.and = n2shaclName + 'and';
ns.w3.shacl.property = n2shaclName + 'property';
ns.w3.shacl.name = n2shaclName + 'name';
ns.w3.shacl.raw = n2shaclName + 'raw';
ns.w3.shacl.datatype = n2shaclName + 'datatype';
ns.w3.shacl.minCount = n2shaclName + 'minCount';
ns.w3.shacl.xone = n2shaclName + 'xone';
ns.w3.shacl.not = n2shaclName + 'not';
ns.w3.shacl.or = n2shaclName + 'or';
// Hydra shortcuts
ns.w3.hydra.supportedOperation = contractKey + 'supportedOperation';
// Schema org namespace
ns.schema = {};
ns.schema.key = coreKey;
ns.schema.toString = () => coreKey;
ns.schema.name = ns.schema.key + 'name';
ns.schema.desc = ns.schema.key + 'description';
ns.schema.doc = ns.schema.key + 'documentation';
ns.schema.webApi = contractKey + 'WebAPI';
ns.schema.creativeWork = coreKey + 'CreativeWork';
ns.schema.displayName = coreKey + 'displayName';
ns.schema.title = coreKey + 'title';

Object.freeze(ns.raml);
Object.freeze(ns.aml);
Object.freeze(ns.aml.vocabularies);
Object.freeze(ns.aml.vocabularies.shapes);
Object.freeze(ns.aml.vocabularies.data);
Object.freeze(ns.aml.vocabularies.apiContract);
Object.freeze(ns.aml.vocabularies.security);
Object.freeze(ns.aml.vocabularies.core);
Object.freeze(ns.aml.vocabularies.document);
Object.freeze(ns.w3);
Object.freeze(ns.w3.rdfSyntax);
Object.freeze(ns.w3.hydra);
Object.freeze(ns.w3.shacl);
Object.freeze(ns.schema);
Object.freeze(ns);

/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/

/** @typedef {import('./Namespace').ns} Namespace */

/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */

/**
 * Common functions used by AMF components to compute AMF values.
 *
 * ## Updating API's base URI
 *
 * (Only applies when using `_computeUri()` function)
 *
 * By default the component render the documentation as it is defined
 * in the AMF model. Sometimes, however, you may need to replace the base URI
 * of the API with something else. It is useful when the API does not
 * have base URI property defined (therefore this component render relative
 * paths instead of URIs) or when you want to manage different environments.
 *
 * To update base URI value update the `baseUri` property.
 *
 * When the component constructs the final URI for the endpoint it does the following:
 * - if `baseUri` is set it uses this value as a base uri for the endpoint
 * - else if `amf` is set then it computes base uri value from main
 * model document
 * Then it concatenates computed base URI with `endpoint`'s path property.
 *
 * @param {*} base
 * @return {*}
 * @mixin
 */
const AmfHelperMixin = (base) => class extends base {
  static get properties() {
    return {
      /**
       * Generated AMF json/ld model form the API spec.
       * The element assumes the object of the first array item to be a
       * type of `"http://raml.org/vocabularies/document#Document`
       * on AMF vocabulary.
       *
       * It is only usefult for the element to resolve references.
       *
       * @type {Object|Array<Object>}
       */
      amf: { type: Object }
    };
  }

  /**
   * A namespace for AMF model.
   * @return {Namespace}
   */
  get ns() {
    return ns;
  }

  get amf() {
    return this._amf;
  }

  set amf(value) {
    const old = this._amf;
    if (old === value) {
      return;
    }
    // Cached keys cannot be static as this element can be using in the sane
    // document with different AMF models
    this.__cachedKeys = {};
    this._amf = value;
    this.__amfChanged(value);
    if (this.requestUpdate) {
      this.requestUpdate('amf', old);
    }
  }

  /**
   * This is an abstract method to be implemented by the components.
   * If, instead, the component uses `amf` setter you must use `super.amf` to
   * set the value.
   * @param {Array|Object} amf Current AMF model. Can be undefined.
   * @abstract
   */
  /* eslint-disable-next-line no-unused-vars */
  __amfChanged(amf) {}

  /**
   * Returns compact model key for given value.
   * @param {string} property AMF orioginal property
   * @return {string} Compact model property name or the same value if
   * value not found in the context.
   */
  _getAmfKey(property) {
    if (!property) {
      return undefined;
    }
    let {amf} = this;
    if (!amf) {
      return property;
    }
    if (Array.isArray(amf)) {
      [amf] = amf;
    }
    if (!this.__cachedKeys) {
      this.__cachedKeys = {};
    }
    const ctx = amf['@context'];
    if (!ctx || !property) {
      return property;
    }
    const cache = this.__cachedKeys;
    if (property in cache) {
      return cache[property];
    }
    /* eslint-disable-next-line no-param-reassign */
    property = String(property);
    const hashIndex = property.indexOf('#');
    const hashProperty = property.substr(0, hashIndex + 1);
    const keys = Object.keys(ctx);
    for (let i = 0, len = keys.length; i < len; i++) {
      const k = keys[i];
      if (ctx[k] === property) {
        cache[property] = k;
        return k;
      } if (hashIndex === -1 && property.indexOf(ctx[k]) === 0) {
        const result = property.replace(ctx[k], `${k  }:`);
        cache[property] = result;
        return result;
      } if (ctx[k] === hashProperty) {
        const result = `${k  }:${  property.substr(hashIndex + 1)}`;
        cache[property] = result;
        return result;
      }
    }
    return property;
  }

  /**
   * Ensures that the model is AMF object.
   *
   * @param {Object|Array} amf AMF json/ld model
   * @return {Object|undefined} API spec
   */
  _ensureAmfModel(amf) {
    if (!amf) {
      return undefined;
    }
    if (Array.isArray(amf)) {
      /* eslint-disable-next-line no-param-reassign */
      [amf] = amf;
    }
    if (this._hasType(amf, ns.aml.vocabularies.document.Document)) {
      return amf;
    }
    return undefined;
  }

  /**
   * Ensures that the value is an array.
   * It returns undefined when there's no value.
   * It returns the same array if the value is already an array.
   * It returns new array of the item is not an array.
   *
   * @param {Array|any} value An item to test
   * @return {Array|undefined}
   */
  _ensureArray(value) {
    if (!value) {
      return undefined;
    }
    if (value instanceof Array) {
      return value;
    }
    return [value];
  }

  /**
   * Gets a signle scalar value from a model.
   * @param {Object} model Amf model to extract the value from.
   * @param {string} key Model key to search for the value
   * @return {string|number|boolean|undefined|null} Value for key
   */
  _getValue(model, key) {
    /* eslint-disable-next-line no-param-reassign */
    key = this._getAmfKey(key);
    let data = model && model[key];
    if (!data) {
      // This includes "undefined", "false", "null" and "0"
      return data;
    }
    if (Array.isArray(data)) {
      /* eslint-disable-next-line no-param-reassign */
      [data] = data;
    }
    if (!data) {
      return undefined;
    }
    const type = typeof data;
    if (['string', 'number', 'boolean', 'undefined'].indexOf(type) !== -1) {
      return data;
    }
    return data['@value'];
  }

  /**
   * Gets values from a model as an array of `@value` properties.
   * @param {Object} model Amf model to extract the value from.
   * @param {string} key Model key to search for the value
   * @return {Array<string|number|boolean|null>|undefined} Value for key
   */
  _getValueArray(model, key) {
    /* eslint-disable-next-line no-param-reassign */
    key = this._getAmfKey(key);
    const data = model && this._ensureArray(model[key]);
    if (!data || !(data instanceof Array)) {
      return undefined;
    }
    return data.map((item) => item['@value'] || item);
  }

  /**
   * Checks if a model has a type.
   * @param {Object} model Model to test
   * @param {string} type Type name
   * @return {boolean} True if model has a type.
   */
  _hasType(model, type) {
    const types = this._ensureArray(model && model['@type']);
    if (!types || !types.length) {
      return false;
    }
    const key = this._getAmfKey(type);
    for (let i = 0; i < types.length; i++) {
      if (types[i] === key) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if a shape has a property.
   * @param {Object} shape The shape to test
   * @param {string} key Property name to test
   * @return {boolean}
   */
  _hasProperty(shape, key) {
    /* eslint-disable-next-line no-param-reassign */
    key = this._getAmfKey(key);
    return !!(shape && key && key in shape);
  }

  /**
   * Computes array value of a property in a model (shape).
   *
   * @param {Object} shape AMF shape object
   * @param {string} key Property name
   * @return {Array<string|number|boolean|null|Object>|undefined}
   */
  _computePropertyArray(shape, key) {
    if (!shape) {
      return undefined;
    }
    /* eslint-disable-next-line no-param-reassign */
    key = this._getAmfKey(key);
    const data = this._ensureArray(shape && shape[key]);
    if (!data || !(data instanceof Array)) {
      return undefined;
    }
    return data;
  }

  /**
   * Computes a value of a property in a model (shape).
   * It takes first value of a property, if exists.
   *
   * @param {Object} shape AMF shape object
   * @param {string} key Property name
   * @return {string|number|boolean|null|Object|undefined}
   */
  _computePropertyObject(shape, key) {
    /* eslint-disable-next-line no-param-reassign */
    key = this._getAmfKey(key);
    const data = this._computePropertyArray(shape, key);
    return data && data[0];
  }

  /**
   * Tests if a passed argumet exists.
   *
   * @param {string|Object|number} value A value to test
   * @return {boolean}
   */
  _computeHasStringValue(value) {
    return !!value || value === 0;
  }

  /**
   * Computes if passed argument is an array and has a value.
   * It does not check for type or value of the array items.
   * @param {Array} value Value to test
   * @return {boolean}
   */
  _computeHasArrayValue(value) {
    return !!(value instanceof Array && value.length);
  }

  /**
   * Computes description for a shape.
   * @param {Object} shape AMF shape
   * @return {string} Description value.
   */
  _computeDescription(shape) {
    return /** @type string */ (this._getValue(shape, this.ns.schema.desc));
  }

  /**
   * Computes a list of headers
   * @param {Object} shape
   * @return {Array<Object>|undefined}
   */
  _computeHeaders(shape) {
    return (this._computePropertyArray(shape, this.ns.aml.vocabularies.apiContract.header));
  }

  /**
   * Computes a list of query parameters
   * @param {Object} shape
   * @return {Array<Object>|undefined}
   */
  _computeQueryParameters(shape) {
    return this._computePropertyArray(shape, this.ns.aml.vocabularies.apiContract.parameter);
  }

  /**
   * In OAS URI parmaeters can be defined on an operation level under `uriParameter` proeprty.
   * Normally `_computeQueryParameters()` function would be used to extract parameters from an endpoint.
   * This is a fallback option to test when an API is OAS.
   * @param {Object} shape Method or Expects model
   * @return {Array<Object>}
   */
  _computeUriParameters(shape) {
    if (!shape) {
      return undefined;
    }
    const operationKey = this.ns.aml.vocabularies.apiContract.Operation;
    const parameterKey = this.ns.aml.vocabularies.apiContract.uriParameter;
    if (this._hasType(shape, operationKey)) {
      /* eslint-disable-next-line no-param-reassign */
      shape = this._computeExpects(shape);
    }
    return this._computePropertyArray(shape, parameterKey);
  }

  /**
   * Computes a list of responses
   * @param {Object} shape
   * @return {Array<Object>|undefined}
   */
  _computeResponses(shape) {
    return this._computePropertyArray(shape, this.ns.aml.vocabularies.apiContract.response);
  }

  /**
   * Computes value for `serverVariables` property.
   *
   * @param {Object} server AMF API model for Server.
   * @return {Array<Object>|undefined} Variables if defined.
   */
  _computeServerVariables(server) {
    return this._computePropertyArray(server, this.ns.aml.vocabularies.apiContract.variable);
  }

  /**
   * Computes value for `endpointVariables` property.
   *
   * @param {Object} endpoint Endpoint model
   * @param {Object=} method Optional method to be used to llokup the parameters from
   * This is used for OAS model which can defined path parameters on a method level.
   * @return {Array<Object>|undefined} Parameters if defined.
   */
  _computeEndpointVariables(endpoint, method) {
    let result = this._computeQueryParameters(endpoint);
    if (!result && method) {
      result = this._computeUriParameters(method);
    }
    return result;
  }

  /**
   * Computes value for the `payload` property
   *
   * @param {Object} expects Current value of `expects` property.
   * @return {Array<Object>|undefined} Payload model if defined.
   */
  _computePayload(expects) {
    return this._computePropertyArray(expects, this.ns.aml.vocabularies.apiContract.payload);
  }

  /**
   * Computes value for `returns` property
   *
   * @param {Object} method AMF `supportedOperation` model
   * @return {Array<Object>|undefined}
   */
  _computeReturns(method) {
    return this._computePropertyArray(method, this.ns.aml.vocabularies.apiContract.returns);
  }

  /**
   * Computes value for `security` property
   *
   * @param {Object} method AMF `supportedOperation` model
   * @return {Array<Object>|undefined}
   */
  _computeSecurity(method) {
    return this._computePropertyArray(method, this.ns.aml.vocabularies.security.security);
  }

  /**
   * Computes value for `hasCustomProperties` property.
   *
   * @param {Object} shape AMF `supportedOperation` model
   * @return {boolean}
   */
  _computeHasCustomProperties(shape) {
    return this._hasProperty(shape, this.ns.aml.vocabularies.document.customDomainProperties);
  }

  /**
   * Computes API version from the AMF model.
   *
   * @param {Object|Array<Object>} amf
   * @return {string}
   */
  _computeApiVersion(amf) {
    const api = this._computeWebApi(amf);
    if (!api) {
      return undefined;
    }
    return /** @type string */ (this._getValue(api, this.ns.aml.vocabularies.core.version));
  }

  /**
   * Computes model's `encodes` property.
   *
   * @param {Array<Object>|Object} model AMF data model
   * @return {Array<Object>} List of encodes
   */
  _computeEncodes(model) {
    if (!model) {
      return undefined;
    }
    if (Array.isArray(model)) {
      /* eslint-disable-next-line no-param-reassign */
      [model] = model;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.document.encodes);
    const data = model[key];
    if (data) {
      return data instanceof Array ? data[0] : data;
    }
    return undefined;
  }

  /**
   * Computes list of declarations in the AMF api model.
   *
   * @param {Array<Object>|Object} model AMF json/ld model for an API
   * @return {Array<Object>} List of declarations
   */
  _computeDeclares(model) {
    if (!model) {
      return undefined;
    }
    if (Array.isArray(model)) {
      /* eslint-disable-next-line no-param-reassign */
      [model] = model;
    }
    if (!model) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.document.declares);
    const data = this._ensureArray(model[key]);
    return data instanceof Array ? data : undefined;
  }

  /**
   * Computes list of references in the AMF api model.
   *
   * @param {Array<Object>|Object} model AMF json/ld model for an API
   * @return {Array<Object>} List of declarations
   */
  _computeReferences(model) {
    if (!model) {
      return undefined;
    }
    if (Array.isArray(model)) {
      /* eslint-disable-next-line no-param-reassign */
      [model] = model;
    }
    if (!model) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.document.references);
    const data = this._ensureArray(model[key]);
    return data instanceof Array ? data : undefined;
  }

  /**
   * Computes AMF's `http://schema.org/WebAPI` model
   *
   * @param {Array<Object>|Object} model AMF json/ld model for an API
   * @return {Object} Web API declaration.
   */
  _computeWebApi(model) {
    const enc = this._computeEncodes(model);
    if (!enc) {
      return undefined;
    }
    if (this._hasType(enc, this.ns.schema.webApi)) {
      return enc;
    }
    return undefined;
  }

  /**
   * Computes value for `server` property that is later used with other computations.
   *
   * @param {Array<Object>|Object} model AMF model for an API
   * @return {Object|undefined} The server model
   */
  _computeServer(model) {
    const api = this._computeWebApi(model);
    if (!api) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.server);
    const srv = this._ensureArray(api[key]);
    return srv ? srv[0] : undefined;
  }

  /**
   * Determines whether a partial model is valid for reading servers from
   * Current valid values:
   * - Operation
   * - Endpoint
   * @param {Object} model The partial model to evaluate
   * @return {boolean} Whether the model's type is part of the array of valid node types from which
   * to read servers
   * @private
   */
  _isValidServerPartial(model) {
    if (Array.isArray(model)) {
      /* eslint-disable-next-line no-param-reassign */
      [model] = model;
    }
    if (!model) {
      return false;
    }
    const oKey = this.ns.aml.vocabularies.apiContract.Operation;
    const eKey = this.ns.aml.vocabularies.apiContract.EndPoint;
    const allowedPartialModelTypes = [this._getAmfKey(oKey), this._getAmfKey(eKey)];
    const types = model['@type'];
    for (const type of types) {
      if (allowedPartialModelTypes.indexOf(type) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {Object} options
   * @param {string=} options.endpointId Optional endpoint to look for the servers in
   * @param {string=} options.methodId Optional method to look for the servers in
   * @return {Array<Object>} List of servers for method, if defined, or endpoint, if defined, or root level
   */
  _getServers({ endpointId, methodId }){
    const { amf } = this;
    if (!amf) {
      return undefined;
    }
    let api = this._computeWebApi(amf);
    if (Array.isArray(api)) {
      [api] = api;
    }
    if (!api) {
      if (this._isValidServerPartial(amf)) {
        api = amf;
      } else {
        return undefined;
      }
    }

    const serverKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.server);

    const getRootServers = () => {
      return this._getValueArray(api, serverKey);
    };
    const getEndpointServers = () => {
      const endpoint = this._computeEndpointModel(api, endpointId);
      const servers = this._getValueArray(endpoint, serverKey);
      if (servers) {
        return servers;
      }
      return getRootServers();
    };
    const getMethodServers = () => {
      const method = this._computeMethodModel(api, methodId);
      const servers = this._getValueArray(method, serverKey);
      if (servers) {
        return servers;
      }
      return getEndpointServers();
    };

    if (methodId) {
      return getMethodServers();
    } if (endpointId) {
      return getEndpointServers();
    }
    return getRootServers();
  }

  /**
   * Compute values for `server` property based on node an optional selected id.
   *
   * @param {Object} options
   * @param {String=} options.endpointId Optional endpoint id, required if method is provided
   * @param {String=} options.methodId Optional method id
   * @param {String=} options.id Optional selected server id
   * @return {Array<Object>|undefined} The server list or undefined if node has no servers
   */
  _getServer({ endpointId, methodId, id }) {
    const servers = this._getServers({ endpointId, methodId });
    return servers ? servers.filter((srv) => this._getValue(srv, '@id') === id) : undefined;
  }

  /**
   * Computes endpoint's URI based on `amf` and `endpoint` models.
   *
   * @param {Object} server Server model of AMF API.
   * @param {Object} endpoint Endpoint model
   * @param {string=} baseUri Current value of `baseUri` property
   * @param {string=} version API current version
   * @return {string} Endpoint's URI
   * @deprecated Use `_computeUri()` instead
   */
  _computeEndpointUri(server, endpoint, baseUri, version) {
    let baseValue = this._getBaseUri(baseUri, server) || '';
    if (baseValue && baseValue[baseValue.length - 1] === '/') {
      baseValue = baseValue.substr(0, baseValue.length - 1);
    }
    baseValue = this._ensureUrlScheme(baseValue);
    const path = this._getValue(endpoint, this.ns.aml.vocabularies.apiContract.path);
    let result = baseValue + (path || '');
    if (version && result) {
      result = result.replace('{version}', version);
    }
    return result;
  }

  /**
   * Computes endpoint's URI based on `endpoint` model.
   *
   * @param {Object} endpoint Model for the endpoint
   * @param {Object} opts Configuration options
   * @param {Object=} opts.server Model for current server, if available.
   * @param {string=} opts.baseUri Base URI to be used with the endpoint's paht.
   * Note, base URI is ignored when `ignoreBase` is set
   * @param {string=} opts.version Current version of the API. It is used to replace
   * `{version}` from the URI template.
   * @param {boolean=} [opts.ignoreBase = false] Whether or not to ignore rendering
   * of the base URI with path.
   * @return {string} The base uri for the endpoint.
   */
  _computeUri(endpoint, { server, baseUri, version, ignoreBase=false } = {}) {
    let baseValue = '';
    if (ignoreBase === false) {
      baseValue = this._getBaseUri(baseUri, server) || '';
      if (baseValue && baseValue[baseValue.length - 1] === '/') {
        baseValue = baseValue.substr(0, baseValue.length - 1);
      }
      baseValue = this._ensureUrlScheme(baseValue);
    }
    const path = this._getValue(endpoint, this.ns.aml.vocabularies.apiContract.path);
    let result = baseValue + (path || '');
    if (version && result) {
      result = result.replace('{version}', version);
    }
    return result;
  }

  /**
   * Computes base URI value from either `baseUri` or `amf` value (in this order).
   *
   * @param {string} baseUri Value of `baseUri` property
   * @param {Object} server AMF API model for Server.
   * @param {Array<string>=} protocols List of supported protocols
   * @return {string} Base uri value. Can be empty string.
   */
  _getBaseUri(baseUri, server, protocols) {
    if (baseUri) {
      return baseUri;
    }
    return this._getAmfBaseUri(server, protocols) || '';
  }

  /**
   * Computes base URI from AMF model.
   *
   * @param {Object} server AMF API model for Server.
   * @param {?Array<string>} protocols Listy of supporte dprotocols. If not
   * provided and required to compute the url it uses `amf` to compute
   * protocols
   * @return {string|undefined} Base uri value if exists.
   */
  _getAmfBaseUri(server, protocols) {
    const key = this.ns.aml.vocabularies.core.urlTemplate;
    let value = /** @type string */ (this._getValue(server, key));
    value = this._ensureUrlScheme(value, protocols);
    return value;
  }

  /**
   * A function that makes sure that the URL has a scheme definition.
   * If no supported protocols information is available it assumes `http`.
   *
   * @param {String} value A url value
   * @param {Array<string>=} protocols List of supported by the API protocols
   * An array of string like: `['HTTP', 'HTTPS']`. It lowercase the value.
   * If not set it tries to read supported protocols value from `amf`
   * property.
   * @return {string} Url with scheme.
   */
  _ensureUrlScheme(value, protocols) {
    if (value && typeof value === 'string') {
      if (value.indexOf('http') !== 0) {
        if (!protocols || !protocols.length) {
          /* eslint-disable-next-line no-param-reassign */
          protocols = this._computeProtocols(this.amf);
        }
        if (protocols && protocols.length) {
          /* eslint-disable-next-line no-param-reassign */
          value = `${protocols[0].toLowerCase()  }://${  value}`;
        } else {
          /* eslint-disable-next-line no-param-reassign */
          value = `http://${  value}`;
        }
      }
    }
    return value;
  }

  /**
   * Computes supported protocols by the API.
   *
   * @param {Object|Array} model AMF data model
   * @return {Array<string>|undefined}
   */
  _computeProtocols(model) {
    const api = this._computeWebApi(model);
    if (!api) {
      return undefined;
    }
    return /** @type {Array<string>} */ (this._getValueArray(api, this.ns.aml.vocabularies.apiContract.scheme));
  }

  /**
   * Computes value for the `expects` property.
   *
   * @param {Object} method AMF `supportedOperation` model
   * @return {Object}
   */
  _computeExpects(method) {
    const operationKey = this.ns.aml.vocabularies.apiContract.Operation;
    const expectsKey = this.ns.aml.vocabularies.apiContract.expects;
    if (this._hasType(method, operationKey)) {
      const key = this._getAmfKey(expectsKey);
      const expects = this._ensureArray(method[key]);
      if (expects) {
        return expects instanceof Array ? expects[0] : expects;
      }
    }
    return undefined;
  }

  /**
   * Tries to find an example value (whether it's default value or from an
   * example) to put it into snippet's values.
   *
   * @param {Object} item A http://raml.org/vocabularies/http#Parameter property
   * @return {string|undefined}
   */
  _computePropertyValue(item) {
    const exKey = this.ns.aml.vocabularies.apiContract.examples;
    const schemaKey = this.ns.aml.vocabularies.shapes.schema;
    const rawKey = this.ns.aml.vocabularies.document.raw;
    const skey = this._getAmfKey(schemaKey);
    let schema = item && item[skey];
    if (!schema) {
      return undefined;
    }
    if (Array.isArray(schema)) {
      [schema] = schema;
    }
    let value = this._getValue(schema, this.ns.w3.shacl.defaultValue);
    if (!value) {
      const examplesKey = this._getAmfKey(exKey);
      let example = schema[examplesKey];
      if (example) {
        if (example instanceof Array) {
          [example] = example;
        }
        value = this._getValue(example, rawKey);
      }
    }
    return /** @type string */ (value);
  }

  /**
   * Computes list of endpoints from a WebApi model.
   * @param {Object} webApi
   * @return {Array<Object>|undefined} An array of endpoints.
   */
  _computeEndpoints(webApi) {
    if (!webApi) {
      return [];
    }
    const endpointKey = this.ns.aml.vocabularies.apiContract.endpoint;
    const key = this._getAmfKey(endpointKey);
    return this._ensureArray(webApi[key]);
  }

  /**
   * Computes model for an endpoint documentation.
   *
   * @param {Object} webApi Current value of `webApi` property
   * @param {string} id Selected shape ID
   * @return {Object} An endponit definition
   */
  _computeEndpointModel(webApi, id) {
    const endpoints = this._computeEndpoints(webApi);
    if (!endpoints) {
      return undefined;
    }
    return endpoints.find((item) => item['@id'] === id);
  }

  /**
   * Computes model for an endpoint documentation using it's path.
   *
   * @param {Object} webApi Current value of `webApi` property
   * @param {string} path Endpoint path
   * @return {Object|undefined} An endponit definition
   */
  _computeEndpointByPath(webApi, path) {
    if (!path || !webApi) {
      return undefined;
    }
    const endpoints = this._computeEndpoints(webApi);
    if (!endpoints) {
      return undefined;
    }
    const pathKey = this.ns.aml.vocabularies.apiContract.path;
    for (let i = 0; i < endpoints.length; i++) {
      const ePath = this._getValue(endpoints[i], pathKey);
      if (ePath === path) {
        return endpoints[i];
      }
    }
    return undefined;
  }

  /**
   * Computes method for the method documentation.
   *
   * @param {Object} webApi Current value of `webApi` property
   * @param {string} selected Selected shape
   * @return {Object} A method definition
   */
  _computeMethodModel(webApi, selected) {
    const methods = this.__computeMethodsListForMethod(webApi, selected);
    if (!methods) {
      return undefined;
    }
    return methods.find((item) => item['@id'] === selected);
  }

  /**
   * Computes list of operations in an endpoint
   * @param {Object} webApi The WebApi AMF model
   * @param {string} id Endpoint ID
   * @return {Array<Object>} List of SupportedOperation objects
   */
  _computeOperations(webApi, id) {
    const endpoint = this._computeEndpointModel(webApi, id);
    if (!endpoint) {
      return [];
    }
    const opKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.supportedOperation);
    return this._ensureArray(endpoint[opKey]);
  }

  /**
   * Computes an endpoint for a method.
   * @param {Object} webApi The WebApi AMF model
   * @param {string} methodId Method id
   * @return {Object|undefined} An endpoint model of undefined.
   */
  _computeMethodEndpoint(webApi, methodId) {
    if (!webApi || !methodId) {
      return undefined;
    }
    const endpoints = this._computeEndpoints(webApi);
    if (!endpoints) {
      return undefined;
    }
    const opKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.supportedOperation);
    for (let i = 0, len = endpoints.length; i < len; i++) {
      const endpoint = endpoints[i];
      let methods = endpoint[opKey];
      if (!methods) {
        continue;
      }
      if (!(methods instanceof Array)) {
        methods = [methods];
      }
      for (let j = 0, jLen = methods.length; j < jLen; j++) {
        if (methods[j]['@id'] === methodId) {
          return endpoint;
        }
      }
    }
    return undefined;
  }

  /**
   * Computes a list of methods for an endpoint that contains a method with
   * given id.
   *
   * @param {Object} webApi WebApi model
   * @param {string} methodId Method id.
   * @return {Array<Object>|undefined} A list of sibling methods or undefined.
   */
  __computeMethodsListForMethod(webApi, methodId) {
    const endpoint = this._computeMethodEndpoint(webApi, methodId);
    if (!endpoint) {
      return undefined;
    }
    const opKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.supportedOperation);
    return this._ensureArray(endpoint[opKey]);
  }

  /**
   * Computes a type documentation model.
   *
   * @param {Array<Object>} declares Current value of `declares` property
   * @param {Array<Object>} references Current value of `references` property
   * @param {string} selected Selected shape
   * @return {Object} A type definition
   */
  _computeType(declares, references, selected) {
    if ((!declares && !references) || !selected) {
      return undefined;
    }
    // In compact model some IDs are presented in long version (in source maps for examples)
    // This must test for this case as well.
    const compactId = selected.replace('amf://id', '');
    let type = declares && declares.find((item) => item['@id'] === selected || item['@id'] === compactId);
    if (!type && references && references.length) {
      for (let i = 0, len = references.length; i < len; i++) {
        if (!this._hasType(references[i], this.ns.aml.vocabularies.document.Module)) {
          continue;
        }
        type = this._computeReferenceType(references[i], selected);
        if (type) {
          break;
        }
      }
    }
    return type;
  }

  /**
   * Computes a type model from a reference (library for example).
   * @param {Object} reference AMF model for a reference to extract the data from
   * @param {string} selected Node ID to look for
   * @return {Object|undefined} Type definition or undefined if not found.
   */
  _computeReferenceType(reference, selected) {
    const declare = this._computeDeclares(reference);
    if (!declare) {
      return undefined;
    }
    // In compact model some IDs are presented in long version (in source maps for examples)
    // This must test for this case as well.
    const compactId = selected.replace('amf://id#', '');
    let result = declare.find((item) => {
      if (Array.isArray(item)) {
        /* eslint-disable-next-line no-param-reassign */
        [item] = item;
      }
      return item['@id'] === selected || item['@id'] === compactId;
    });
    if (Array.isArray(result)) {
      [result] = result;
    }
    return this._resolve(result);
  }

  /**
   * Computes model for selected security definition.
   *
   * @param {Array<Object>} declares Current value of `declares` property
   * @param {string} selected Selected shape
   * @return {Object|undefined} A security definition
   */
  _computeSecurityModel(declares, selected) {
    if (!declares || !selected) {
      return undefined;
    }
    return declares.find((item) => item['@id'] === selected);
  }

  /**
   * Computes a documentation model.
   *
   * @param {Object} webApi Current value of `webApi` property
   * @param {string} selected Selected shape
   * @return {Object} A method definition
   */
  _computeDocument(webApi, selected) {
    if (!webApi || !selected) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.schema.doc);
    const docs = this._ensureArray(webApi[key]);
    return docs && docs.find((item) => item['@id'] === selected);
  }

  /**
   * Resolves a reference to an external fragment.
   *
   * @param {Object} shape A shape to resolve
   * @return {Object} Resolved shape.
   */
  _resolve(shape) {
    const {amf} = this;
    if (typeof shape !== 'object' || shape instanceof Array || !amf || shape.__apicResolved) {
      return shape;
    }
    let refKey = this._getAmfKey(this.ns.aml.vocabularies.document.linkTarget);
    let refValue = this._ensureArray(shape[refKey]);
    let refData;
    if (refValue) {
      const rk = refValue[0]['@id'];
      if (rk === shape['@id']) {
        // recursive shape.
        /* eslint-disable-next-line no-param-reassign */
        shape.__apicResolved = true;
        return shape;
      }
      refData = this._getLinkTarget(amf, rk);
    } else {
      refKey = this._getAmfKey(this.ns.aml.vocabularies.document.referenceId);
      refValue = this._ensureArray(shape[refKey]);
      if (refValue) {
        const rk = refValue[0]['@id'];
        if (rk === shape['@id']) {
          // recursive shape.
          /* eslint-disable-next-line no-param-reassign */
          shape.__apicResolved = true;
          return shape;
        }
        refData = this._getReferenceId(amf, rk);
      }
    }
    if (!refData) {
      this._resolveRecursive(shape);
      /* eslint-disable-next-line no-param-reassign */
      shape.__apicResolved = true;
      return shape;
    }
    const copy = { ...refData};
    delete copy['@id'];
    const types = copy['@type'];
    if (types) {
      if (shape['@type']) {
        /* eslint-disable-next-line no-param-reassign */
        shape['@type'] = shape['@type'].concat(types);
      } else {
        /* eslint-disable-next-line no-param-reassign */
        shape['@type'] = types;
      }
      delete copy['@type'];
    }
    Object.assign(shape, copy);
    /* eslint-disable-next-line no-param-reassign */
    shape.__apicResolved = true;
    this._resolveRecursive(shape);
    return shape;
  }

  /**
   * @param {Object} amf References object to search in
   * @param {string} id Id of the shape to resolve
   * @return {Object | undefined} Resolved shape for given reference, undefined otherwise
   */
  _getLinkTarget(amf, id) {
    if (!amf || !id) {
      return undefined;
    }
    let target;
    const declares = this._computeDeclares(amf);
    if (declares) {
      target = this._findById(declares, id);
    }
    if (!target) {
      const references = this._computeReferences(amf);
      target = this._obtainShapeFromReferences(references, id);
    }
    if (!target) {
      return undefined;
    }
    // Declaration may contain references
    target = this._resolve(target);
    return target;
  }

  /**
   * Resolves the shape of a given reference.
   *
   * @param {Object} references References object to search in
   * @param {string} id Id of the shape to resolve
   * @return {Object | undefined} Resolved shape for given reference, undefined otherwise
   */
  _obtainShapeFromReferences(references, id) {
    let target;
    for (let i = 0; i < references.length; i++) {
      const _ref = references[i];
      // case of fragment that encodes the shape
      const encoded = this._computeEncodes(_ref);
      if (encoded && encoded['@id'] === id) {
        target = encoded;
        break;
      }
      // case of a library which declares types
      if (!encoded) {
        target = this._findById(this._computeDeclares(_ref), id);
        if (target) break;
      }
    }
    return target;
  }

  /**
   * Searches a node with a given ID in an array
   *
   * @param {Array<Object>} array Array to search for a given ID
   * @param {string} id Id to search for
   * @return {Object | undefined} Node with the given ID when found, undefined otherwise
   */
  _findById(array, id) {
    if (!array) return undefined;
    let target;
    for (let i = 0; i < array.length; i++) {
      const _current = array[i];
      if (_current && _current['@id'] === id) {
        target = _current;
        break;
      }
    }
    return target;
  }

  _getReferenceId(amf, id) {
    if (!amf || !id) {
      return undefined;
    }
    const refs = this._computeReferences(amf);
    if (!refs) {
      return undefined;
    }
    for (let i = 0; i < refs.length; i++) {
      const _ref = refs[i];
      const enc = this._computeEncodes(_ref);
      if (enc) {
        if (enc['@id'] === id) {
          return enc;
        }
      }
    }
    return undefined;
  }

  _resolveRecursive(shape) {
    Object.keys(shape).forEach((key) => {
      const currentShape = shape[key];
      if (currentShape instanceof Array) {
        for (let i = 0, len = currentShape.length; i < len; i++) {
          currentShape[i] = this._resolve(currentShape[i]);
        }
      } else if (typeof currentShape === 'object') {
        /* eslint-disable-next-line no-param-reassign */
        shape[key] = this._resolve(currentShape);
      }
    });
  }
};

/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
var markdownStyles = css`[slot="markdown-html"] {
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  font-size: var(--arc-font-body1-font-size, 14px);
  font-weight: var(--arc-font-body1-font-weight, 400);
  line-height: var(--arc-font-body1-line-height, 20px);
}

[slot="markdown-html"] h1,
[slot="markdown-html"] h2,
[slot="markdown-html"] h3,
[slot="markdown-html"] h4,
[slot="markdown-html"] h5,
[slot="markdown-html"] h6 {
  font-size: var(--arc-font-title-font-size, 20px);
  font-weight: var(--arc-font-title-font-weight, 500);
  line-height: var(--arc-font-title-line-height, 28px);
}

[slot="markdown-html"] h1 tt,
[slot="markdown-html"] h1 code,
[slot="markdown-html"] h2 tt,
[slot="markdown-html"] h2 code,
[slot="markdown-html"] h3 tt,
[slot="markdown-html"] h3 code,
[slot="markdown-html"] h4 tt,
[slot="markdown-html"] h4 code,
[slot="markdown-html"] h5 tt,
[slot="markdown-html"] h5 code,
[slot="markdown-html"] h6 tt,
[slot="markdown-html"] h6 code {
  font-size: inherit;
}

[slot="markdown-html"] h1 {
  font-size: var(--arc-font-display1-font-size, 34px);
  font-weight: var(--arc-font-display1-font-weight, 400);
  letter-spacing: var(--arc-font-display1-letter-spacing, -.01em);
  line-height: var(--arc-font-display1-line-height, 40px);
  border-bottom: 1px solid var(--markdown-styles-title-border-bottom-color, #eee);
  padding-top: 1rem;
  padding-bottom: 0.5rem;
}

[slot="markdown-html"] h2 {
  font-size: var(--arc-font-title-font-size, 20px);
  font-weight: var(--arc-font-title-font-weight, 500);
  line-height: var(--arc-font-title-line-height, 28px);
  border-bottom: 1px solid var(--markdown-styles-title-border-bottom-color, #eee);
}

[slot="markdown-html"] h3 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  font-size: 1.5em;
  line-height: 1.43;
}

[slot="markdown-html"] h4 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  line-height: var(--arc-font-subhead-line-height, 24px);
  font-size: 1.25em;
}

[slot="markdown-html"] h5 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  line-height: var(--arc-font-subhead-line-height, 24px);
  font-size: 1em;
}

[slot="markdown-html"] h6 {
  font-weight: var(--arc-font-subhead-font-weight, 400);
  line-height: var(--arc-font-subhead-line-height, 24px);
  font-size: 1em;
  color: var(--markdown-styles-h6-color, #777);
}

[slot="markdown-html"] p,
[slot="markdown-html"] blockquote,
[slot="markdown-html"] ul,
[slot="markdown-html"] ol,
[slot="markdown-html"] dl,
[slot="markdown-html"] table,
[slot="markdown-html"] pre {
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  font-size: var(--arc-font-body1-font-size, 14px);
  font-weight: var(--arc-font-body1-font-weight, 400);
  line-height: var(--arc-font-body1-line-height, 20px);
  margin-top: 0;
  margin-bottom: 16px;
}

[slot="markdown-html"] > *:last-child {
  margin-bottom: 0;
}

[slot="markdown-html"] hr {
  height: 4px;
  padding: 0;
  margin: 16px 0;
  background-color: var(--markdown-styles-hr-color, #e7e7e7);
  border: 0 none;
}

[slot="markdown-html"] ul,
[slot="markdown-html"] ol {
  padding-left: 2em;
}

[slot="markdown-html"] ul.no-list,
[slot="markdown-html"] ol.no-list {
  padding: 0;
  list-style-type: none;
}

[slot="markdown-html"] ul ul,
[slot="markdown-html"] ul ol,
[slot="markdown-html"] ol ol,
[slot="markdown-html"] ol ul {
  margin-top: 0;
  margin-bottom: 0;
}

[slot="markdown-html"] li>p {
  margin-top: 16px;
}

[slot="markdown-html"] dl {
  padding: 0;
}

[slot="markdown-html"] dl dt {
  padding: 0;
  margin-top: 16px;
  font-size: 1em;
  font-style: italic;
  font-weight: bold;
}

[slot="markdown-html"] dl dd {
  padding: 0 16px;
  margin-bottom: 16px;
}

[slot="markdown-html"] blockquote {
  padding: 0 15px;
  color: var(--markdown-styles-blockquote-color, #777);
  border-left: 4px solid var(--markdown-styles-blockquote-border-left-color, #ddd);
}

[slot="markdown-html"] blockquote>:first-child {
  margin-top: 0;
}

[slot="markdown-html"] blockquote>:last-child {
  margin-bottom: 0;
}

[slot="markdown-html"] table {
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  font-size: var(--arc-font-body1-font-size, 14px);
  font-weight: var(--arc-font-body1-font-weight, 400);
  line-height: var(--arc-font-body1-line-height, 20px);
  display: block;
  width: 100%;
  overflow: auto;
  word-break: normal;
  word-break: keep-all;
  border-collapse: collapse;
}

[slot="markdown-html"] table th {
  font-weight: bold;
}

[slot="markdown-html"] table th,
[slot="markdown-html"] table td {
  padding: 6px 13px;
  border: 1px solid var(--markdown-styles-table-header-border-color, #ddd);
}

[slot="markdown-html"] table tr {
  background-color: var(--markdown-styles-table-row-background-color, #fff);
  border-top: 1px solid #ccc;
}

[slot="markdown-html"] table tr:nth-child(2n) {
  background-color: var(--markdown-styles-table-even-row-background-color, #f8f8f8);
}

[slot="markdown-html"] img {
  max-width: 100%;
  box-sizing: content-box;
  background-color: var(--markdown-styles-image-background-color, #fff);
}

[slot="markdown-html"] img[align=right] {
  padding-left: 20px;
}

[slot="markdown-html"] img[align=left] {
  padding-right: 20px;
}

[slot="markdown-html"] code,
[slot="markdown-html"] tt {
  font-family: var(--arc-font-code-family, "Roboto Mono, Consolas, Menlo, monospace");
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  padding: 0;
  padding-top: 0.2em;
  padding-bottom: 0.2em;
  margin: 0;
  background-color: var(--markdown-styles-code-background-color, rgba(0, 0, 0, 0.04));
  border-radius: 2px;
}

[slot="markdown-html"] pre {
  word-wrap: normal;
}

/**
* prism.js default theme for JavaScript, CSS and HTML
* Based on dabblet (http://dabblet.com)
* @author Lea Verou
*/
[slot="markdown-html"] code,
[slot="markdown-html"] pre {
  font-family: var(--arc-font-code-family, "Roboto Mono, Consolas, Menlo, monospace");
  -webkit-font-smoothing: var(--arc-font-font-smoothing);
  color: var(--code-color, black);
  background-color: var(--code-background-color);
  text-shadow: var(--markdown-styles-code-text-shadow, 0 1px white);
  text-align: left;
  word-break: break-all;
  white-space: pre-wrap;
  word-spacing: normal;
  line-height: 1.5;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;

  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
}

[slot="markdown-html"] pre::-moz-selection,
[slot="markdown-html"] pre ::-moz-selection,
[slot="markdown-html"] code::-moz-selection,
[slot="markdown-html"] code ::-moz-selection {
  text-shadow: none;
  background: var(--markdown-styles-code-selection-background-color, #b3d4fc);
}

[slot="markdown-html"] pre::selection,
[slot="markdown-html"] pre ::selection,
[slot="markdown-html"] code::selection,
[slot="markdown-html"] code ::selection {
  text-shadow: none;
  background: var(--markdown-styles-code-selection-background-color, #b3d4fc);
}

@media print {
  [slot="markdown-html"] code,
  [slot="markdown-html"] pre {
    text-shadow: none;
  }
}

/* Code blocks */
[slot="markdown-html"] pre {
  padding: 1em;
  margin: .5em 0;
  overflow: auto;
}

[slot="markdown-html"] :not(pre) > code,
[slot="markdown-html"] pre,
pre[slot="markdown-html"] {
  background: var(--code-background-color, #f5f2f0);
}

/* Inline code */
[slot="markdown-html"] :not(pre) > code {
  padding: .1em;
  border-radius: .3em;
  white-space: normal;
}

[slot="markdown-html"] .token.comment,
[slot="markdown-html"] .token.prolog,
[slot="markdown-html"] .token.doctype,
[slot="markdown-html"] .token.cdata {
  color: var(--markdown-styles-code-cdata-color, slategray);
}

[slot="markdown-html"] .token.punctuation {
  color: var(--code-punctuation-value-color, #999);
}

[slot="markdown-html"] .namespace {
  opacity: .7;
}

[slot="markdown-html"] .token.property,
[slot="markdown-html"] .token.tag,
[slot="markdown-html"] .token.boolean,
[slot="markdown-html"] .token.number,
[slot="markdown-html"] .token.constant,
[slot="markdown-html"] .token.symbol,
[slot="markdown-html"] .token.deleted {
  color: var(--code-type-number-value-color, #905);
}

[slot="markdown-html"] .token.selector,
[slot="markdown-html"] .token.attr-name,
[slot="markdown-html"] .token.string,
[slot="markdown-html"] .token.char,
[slot="markdown-html"] .token.builtin,
[slot="markdown-html"] .token.inserted {
  color: var(--code-type-text-value-color, #690);
}

[slot="markdown-html"] .token.operator,
[slot="markdown-html"] .token.entity,
[slot="markdown-html"] .token.url,
[slot="markdown-html"] .language-css .token.string,
[slot="markdown-html"] .style .token.string {
  color: var(--code-punctuation-value-color, #a67f59);
  background: hsla(0, 0%, 100%, .5);
}

[slot="markdown-html"] .token.atrule,
[slot="markdown-html"] .token.attr-value,
[slot="markdown-html"] .token.keyword {
  color: var(--markdown-styles-code-keyword-color, #07a);
}

[slot="markdown-html"] .token.function {
  color: var(--markdown-styles-code-function-color, #DD4A68);
}

[slot="markdown-html"] .token.regex,
[slot="markdown-html"] .token.important,
[slot="markdown-html"] .token.variable {
  color: var(--markdown-styles-variable-color, #e90);
}

[slot="markdown-html"] .token.important,
[slot="markdown-html"] .token.bold {
  font-weight: bold;
}
[slot="markdown-html"] .token.italic {
  font-style: italic;
}

[slot="markdown-html"] .token.entity {
  cursor: help;
}`;

const hostDefaultStyles = css`
  --method-label-default-background-color: rgba(128, 128, 128, 0.12);
  --method-label-default-color: rgb(128, 128, 128);
`;

const labelCommon = css`
  display: inline-block;
  margin: var(--http-method-label-margin, 0px 8px 8px 0px);
  padding: var(--http-method-label-padding, 2px 6px);
  background-color: var(
    --http-method-label-background-color,
    var(--method-label-default-background-color)
  );
  color: var(--http-method-label-color, var(--method-label-default-color));
  text-transform: uppercase;
  border-radius: var(--http-method-label-border-radius, 3px);
  font-weight: var(--http-method-label-font-weigth, 400);
  font: inherit;
  font-size: inherit;
`;

const labelGet = css`
  background-color: var(
    --http-method-label-get-background-color,
    rgba(0, 128, 0, 0.12)
  );
  color: var(--http-method-label-get-color, rgb(0, 128, 0));
`;

const labelPost = css`
  background-color: var(
    --http-method-label-post-background-color,
    rgba(33, 150, 243, 0.12)
  );
  color: var(--http-method-label-post-color, rgb(33, 150, 243));
`;

const labelPut = css`
  background-color: var(
    --http-method-label-put-background-color,
    rgba(255, 165, 0, 0.12)
  );
  color: var(--http-method-label-put-color, rgb(255, 165, 0));
`;

const labelDelete = css`
  background-color: var(
    --http-method-label-delete-background-color,
    rgba(244, 67, 54, 0.12)
  );
  color: var(--http-method-label-delete-color, rgb(244, 67, 54));
`;

const labelPatch = css`
  background-color: var(
    --http-method-label-patch-background-color,
    rgba(156, 39, 176, 0.12)
  );
  color: var(--http-method-label-patch-color, rgb(156, 39, 176));
`;

const labelOptions = css`
  background-color: var(
    --http-method-label-options-background-color,
    var(--method-label-default-background-color)
  );
  color: var(
    --http-method-label-options-color,
    var(--method-label-default-color)
  );
`;

const labelHead = css`
  background-color: var(
    --http-method-label-head-background-color,
    var(--method-label-default-background-color)
  );
  color: var(--http-method-label-head-color, var(--method-label-default-color));
`;

const labelTrace = css`
  background-color: var(
    --http-method-label-trace-background-color,
    var(--method-label-default-background-color)
  );
  color: var(
    --http-method-label-trace-color,
    var(--method-label-default-color)
  );
`;

const labelConnect = css`
  background-color: var(
    --http-method-label-connect-background-color,
    var(--method-label-default-background-color)
  );
  color: var(
    --http-method-label-connect-color,
    var(--method-label-default-color)
  );
`;

var labelStyles = css`
  :host {
    ${hostDefaultStyles}
  }

  .method-label {
    ${labelCommon}
  }

  .method-label[data-method='get'],
  .method-label[data-method='GET'] {
    ${labelGet}
  }

  .method-label[data-method='post'],
  .method-label[data-method='POST'] {
    ${labelPost}
  }

  .method-label[data-method='put'],
  .method-label[data-method='PUT'] {
    ${labelPut}
  }

  .method-label[data-method='delete'],
  .method-label[data-method='DELETE'] {
    ${labelDelete}
  }

  .method-label[data-method='patch'],
  .method-label[data-method='PATCH'] {
    ${labelPatch}
  }

  .method-label[data-method='options'],
  .method-label[data-method='OPTIONS'] {
    ${labelOptions}
  }

  .method-label[data-method='head'],
  .method-label[data-method='HEAD'] {
    ${labelHead}
  }

  .method-label[data-method='trace'],
  .method-label[data-method='TRACE'] {
    ${labelTrace}
  }

  .method-label[data-method='connect'],
  .method-label[data-method='CONNECT'] {
    ${labelConnect}
  }
`;

/*! @license DOMPurify | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/2.0.8/LICENSE */

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var hasOwnProperty = Object.hasOwnProperty,
    setPrototypeOf = Object.setPrototypeOf,
    isFrozen = Object.isFrozen,
    objectKeys = Object.keys;
var freeze = Object.freeze,
    seal = Object.seal; // eslint-disable-line import/no-mutable-exports

var _ref = typeof Reflect !== 'undefined' && Reflect,
    apply = _ref.apply,
    construct = _ref.construct;

if (!apply) {
  apply = function apply(fun, thisValue, args) {
    return fun.apply(thisValue, args);
  };
}

if (!freeze) {
  freeze = function freeze(x) {
    return x;
  };
}

if (!seal) {
  seal = function seal(x) {
    return x;
  };
}

if (!construct) {
  construct = function construct(Func, args) {
    return new (Function.prototype.bind.apply(Func, [null].concat(_toConsumableArray(args))))();
  };
}

var arrayForEach = unapply(Array.prototype.forEach);
var arrayIndexOf = unapply(Array.prototype.indexOf);
var arrayJoin = unapply(Array.prototype.join);
var arrayPop = unapply(Array.prototype.pop);
var arrayPush = unapply(Array.prototype.push);
var arraySlice = unapply(Array.prototype.slice);

var stringToLowerCase = unapply(String.prototype.toLowerCase);
var stringMatch = unapply(String.prototype.match);
var stringReplace = unapply(String.prototype.replace);
var stringIndexOf = unapply(String.prototype.indexOf);
var stringTrim = unapply(String.prototype.trim);

var regExpTest = unapply(RegExp.prototype.test);
var regExpCreate = unconstruct(RegExp);

var typeErrorCreate = unconstruct(TypeError);

function unapply(func) {
  return function (thisArg) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return apply(func, thisArg, args);
  };
}

function unconstruct(func) {
  return function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return construct(func, args);
  };
}

/* Add properties to a lookup table */
function addToSet(set, array) {
  if (setPrototypeOf) {
    // Make 'in' and truthy checks like Boolean(set.constructor)
    // independent of any properties defined on Object.prototype.
    // Prevent prototype setters from intercepting set as a this value.
    setPrototypeOf(set, null);
  }

  var l = array.length;
  while (l--) {
    var element = array[l];
    if (typeof element === 'string') {
      var lcElement = stringToLowerCase(element);
      if (lcElement !== element) {
        // Config presets (e.g. tags.js, attrs.js) are immutable.
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }

        element = lcElement;
      }
    }

    set[element] = true;
  }

  return set;
}

/* Shallow clone an object */
function clone(object) {
  var newObject = {};

  var property = void 0;
  for (property in object) {
    if (apply(hasOwnProperty, object, [property])) {
      newObject[property] = object[property];
    }
  }

  return newObject;
}

var html$1 = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'section', 'select', 'shadow', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);

// SVG
var svg = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'audio', 'canvas', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'video', 'view', 'vkern']);

var svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);

var mathMl = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover']);

var text = freeze(['#text']);

var html$1$1 = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'pattern', 'placeholder', 'playsinline', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'xmlns']);

var svg$1 = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'tabindex', 'targetx', 'targety', 'transform', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);

var mathMl$1 = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);

var xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

// eslint-disable-next-line unicorn/better-regex
var MUSTACHE_EXPR = seal(/\{\{[\s\S]*|[\s\S]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
var ERB_EXPR = seal(/<%[\s\S]*|[\s\S]*%>/gm);
var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]/); // eslint-disable-line no-useless-escape
var ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
);
var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g // eslint-disable-line no-control-regex
);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var getGlobal = function getGlobal() {
  return typeof window === 'undefined' ? null : window;
};

/**
 * Creates a no-op policy for internal use only.
 * Don't export this function outside this module!
 * @param {?TrustedTypePolicyFactory} trustedTypes The policy factory.
 * @param {Document} document The document object (to determine policy name suffix)
 * @return {?TrustedTypePolicy} The policy created (or null, if Trusted Types
 * are not supported).
 */
var _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, document) {
  if ((typeof trustedTypes === 'undefined' ? 'undefined' : _typeof(trustedTypes)) !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
    return null;
  }

  // Allow the callers to control the unique policy name
  // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
  // Policy creation with duplicate names throws in Trusted Types.
  var suffix = null;
  var ATTR_NAME = 'data-tt-policy-suffix';
  if (document.currentScript && document.currentScript.hasAttribute(ATTR_NAME)) {
    suffix = document.currentScript.getAttribute(ATTR_NAME);
  }

  var policyName = 'dompurify' + (suffix ? '#' + suffix : '');

  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML: function createHTML(html$$1) {
        return html$$1;
      }
    });
  } catch (_) {
    // Policy creation failed (most likely another DOMPurify script has
    // already run). Skip creating the policy, as this will only cause errors
    // if TT are enforced.
    console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
    return null;
  }
};

function createDOMPurify() {
  var window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();

  var DOMPurify = function DOMPurify(root) {
    return createDOMPurify(root);
  };

  /**
   * Version label, exposed for easier checks
   * if DOMPurify is up to date or not
   */
  DOMPurify.version = '2.0.12';

  /**
   * Array of elements that DOMPurify removed during sanitation.
   * Empty if nothing was removed.
   */
  DOMPurify.removed = [];

  if (!window || !window.document || window.document.nodeType !== 9) {
    // Not running in a browser, provide a factory function
    // so that you can pass your own Window
    DOMPurify.isSupported = false;

    return DOMPurify;
  }

  var originalDocument = window.document;
  var removeTitle = false;

  var document = window.document;
  var DocumentFragment = window.DocumentFragment,
      HTMLTemplateElement = window.HTMLTemplateElement,
      Node = window.Node,
      NodeFilter = window.NodeFilter,
      _window$NamedNodeMap = window.NamedNodeMap,
      NamedNodeMap = _window$NamedNodeMap === undefined ? window.NamedNodeMap || window.MozNamedAttrMap : _window$NamedNodeMap,
      Text = window.Text,
      Comment = window.Comment,
      DOMParser = window.DOMParser,
      trustedTypes = window.trustedTypes;

  // As per issue #47, the web-components registry is inherited by a
  // new document created via createHTMLDocument. As per the spec
  // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
  // a new empty registry is used when creating a template contents owner
  // document, so we use that as our parent document to ensure nothing
  // is inherited.

  if (typeof HTMLTemplateElement === 'function') {
    var template = document.createElement('template');
    if (template.content && template.content.ownerDocument) {
      document = template.content.ownerDocument;
    }
  }

  var trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, originalDocument);
  var emptyHTML = trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML('') : '';

  var _document = document,
      implementation = _document.implementation,
      createNodeIterator = _document.createNodeIterator,
      getElementsByTagName = _document.getElementsByTagName,
      createDocumentFragment = _document.createDocumentFragment;
  var importNode = originalDocument.importNode;


  var hooks = {};

  /**
   * Expose whether this browser supports running the full DOMPurify.
   */
  DOMPurify.isSupported = implementation && typeof implementation.createHTMLDocument !== 'undefined' && document.documentMode !== 9;

  var MUSTACHE_EXPR$$1 = MUSTACHE_EXPR,
      ERB_EXPR$$1 = ERB_EXPR,
      DATA_ATTR$$1 = DATA_ATTR,
      ARIA_ATTR$$1 = ARIA_ATTR,
      IS_SCRIPT_OR_DATA$$1 = IS_SCRIPT_OR_DATA,
      ATTR_WHITESPACE$$1 = ATTR_WHITESPACE;
  var IS_ALLOWED_URI$$1 = IS_ALLOWED_URI;

  /**
   * We consider the elements and attributes below to be safe. Ideally
   * don't add any new ones but feel free to remove unwanted ones.
   */

  /* allowed element names */

  var ALLOWED_TAGS = null;
  var DEFAULT_ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(html$1), _toConsumableArray$1(svg), _toConsumableArray$1(svgFilters), _toConsumableArray$1(mathMl), _toConsumableArray$1(text)));

  /* Allowed attribute names */
  var ALLOWED_ATTR = null;
  var DEFAULT_ALLOWED_ATTR = addToSet({}, [].concat(_toConsumableArray$1(html$1$1), _toConsumableArray$1(svg$1), _toConsumableArray$1(mathMl$1), _toConsumableArray$1(xml)));

  /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
  var FORBID_TAGS = null;

  /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
  var FORBID_ATTR = null;

  /* Decide if ARIA attributes are okay */
  var ALLOW_ARIA_ATTR = true;

  /* Decide if custom data attributes are okay */
  var ALLOW_DATA_ATTR = true;

  /* Decide if unknown protocols are okay */
  var ALLOW_UNKNOWN_PROTOCOLS = false;

  /* Output should be safe for jQuery's $() factory? */
  var SAFE_FOR_JQUERY = false;

  /* Output should be safe for common template engines.
   * This means, DOMPurify removes data attributes, mustaches and ERB
   */
  var SAFE_FOR_TEMPLATES = false;

  /* Decide if document with <html>... should be returned */
  var WHOLE_DOCUMENT = false;

  /* Track whether config is already set on this instance of DOMPurify. */
  var SET_CONFIG = false;

  /* Decide if all elements (e.g. style, script) must be children of
   * document.body. By default, browsers might move them to document.head */
  var FORCE_BODY = false;

  /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
   * string (or a TrustedHTML object if Trusted Types are supported).
   * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
   */
  var RETURN_DOM = false;

  /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
   * string  (or a TrustedHTML object if Trusted Types are supported) */
  var RETURN_DOM_FRAGMENT = false;

  /* If `RETURN_DOM` or `RETURN_DOM_FRAGMENT` is enabled, decide if the returned DOM
   * `Node` is imported into the current `Document`. If this flag is not enabled the
   * `Node` will belong (its ownerDocument) to a fresh `HTMLDocument`, created by
   * DOMPurify. */
  var RETURN_DOM_IMPORT = false;

  /* Try to return a Trusted Type object instead of a string, retrun a string in
   * case Trusted Types are not supported  */
  var RETURN_TRUSTED_TYPE = false;

  /* Output should be free from DOM clobbering attacks? */
  var SANITIZE_DOM = true;

  /* Keep element content when removing element? */
  var KEEP_CONTENT = true;

  /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
   * of importing it into a new Document and returning a sanitized copy */
  var IN_PLACE = false;

  /* Allow usage of profiles like html, svg and mathMl */
  var USE_PROFILES = {};

  /* Tags to ignore content of when KEEP_CONTENT is true */
  var FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);

  /* Tags that are safe for data: URIs */
  var DATA_URI_TAGS = null;
  var DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);

  /* Attributes safe for values like "javascript:" */
  var URI_SAFE_ATTRIBUTES = null;
  var DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'summary', 'title', 'value', 'style', 'xmlns']);

  /* Keep a reference to config to pass to hooks */
  var CONFIG = null;

  /* Ideally, do not touch anything below this line */
  /* ______________________________________________ */

  var formElement = document.createElement('form');

  /**
   * _parseConfig
   *
   * @param  {Object} cfg optional config literal
   */
  // eslint-disable-next-line complexity
  var _parseConfig = function _parseConfig(cfg) {
    if (CONFIG && CONFIG === cfg) {
      return;
    }

    /* Shield configuration object from tampering */
    if (!cfg || (typeof cfg === 'undefined' ? 'undefined' : _typeof(cfg)) !== 'object') {
      cfg = {};
    }

    /* Set configuration parameters */
    ALLOWED_TAGS = 'ALLOWED_TAGS' in cfg ? addToSet({}, cfg.ALLOWED_TAGS) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = 'ALLOWED_ATTR' in cfg ? addToSet({}, cfg.ALLOWED_ATTR) : DEFAULT_ALLOWED_ATTR;
    URI_SAFE_ATTRIBUTES = 'ADD_URI_SAFE_ATTR' in cfg ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = 'ADD_DATA_URI_TAGS' in cfg ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS) : DEFAULT_DATA_URI_TAGS;
    FORBID_TAGS = 'FORBID_TAGS' in cfg ? addToSet({}, cfg.FORBID_TAGS) : {};
    FORBID_ATTR = 'FORBID_ATTR' in cfg ? addToSet({}, cfg.FORBID_ATTR) : {};
    USE_PROFILES = 'USE_PROFILES' in cfg ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
    SAFE_FOR_JQUERY = cfg.SAFE_FOR_JQUERY || false; // Default false
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
    RETURN_DOM = cfg.RETURN_DOM || false; // Default false
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
    RETURN_DOM_IMPORT = cfg.RETURN_DOM_IMPORT || false; // Default false
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
    FORCE_BODY = cfg.FORCE_BODY || false; // Default false
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
    IN_PLACE = cfg.IN_PLACE || false; // Default false
    IS_ALLOWED_URI$$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI$$1;
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }

    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }

    /* Parse profile info */
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(text)));
      ALLOWED_ATTR = [];
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html$1$1);
      }

      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg);
        addToSet(ALLOWED_ATTR, svg$1);
        addToSet(ALLOWED_ATTR, xml);
      }

      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg$1);
        addToSet(ALLOWED_ATTR, xml);
      }

      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl);
        addToSet(ALLOWED_ATTR, mathMl$1);
        addToSet(ALLOWED_ATTR, xml);
      }
    }

    /* Merge configuration parameters */
    if (cfg.ADD_TAGS) {
      if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
        ALLOWED_TAGS = clone(ALLOWED_TAGS);
      }

      addToSet(ALLOWED_TAGS, cfg.ADD_TAGS);
    }

    if (cfg.ADD_ATTR) {
      if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
        ALLOWED_ATTR = clone(ALLOWED_ATTR);
      }

      addToSet(ALLOWED_ATTR, cfg.ADD_ATTR);
    }

    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR);
    }

    /* Add #text in case KEEP_CONTENT is set to true */
    if (KEEP_CONTENT) {
      ALLOWED_TAGS['#text'] = true;
    }

    /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
    }

    /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ['tbody']);
      delete FORBID_TAGS.tbody;
    }

    // Prevent further manipulation of configuration.
    // Not available in IE8, Safari 5, etc.
    if (freeze) {
      freeze(cfg);
    }

    CONFIG = cfg;
  };

  /**
   * _forceRemove
   *
   * @param  {Node} node a DOM node
   */
  var _forceRemove = function _forceRemove(node) {
    arrayPush(DOMPurify.removed, { element: node });
    try {
      // eslint-disable-next-line unicorn/prefer-node-remove
      node.parentNode.removeChild(node);
    } catch (_) {
      node.outerHTML = emptyHTML;
    }
  };

  /**
   * _removeAttribute
   *
   * @param  {String} name an Attribute name
   * @param  {Node} node a DOM node
   */
  var _removeAttribute = function _removeAttribute(name, node) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: node.getAttributeNode(name),
        from: node
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: node
      });
    }

    node.removeAttribute(name);
  };

  /**
   * _initDocument
   *
   * @param  {String} dirty a string of dirty markup
   * @return {Document} a DOM, filled with the dirty markup
   */
  var _initDocument = function _initDocument(dirty) {
    /* Create a HTML document */
    var doc = void 0;
    var leadingWhitespace = void 0;

    if (FORCE_BODY) {
      dirty = '<remove></remove>' + dirty;
    } else {
      /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
      var matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }

    var dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    /* Use the DOMParser API by default, fallback later if needs be */
    try {
      doc = new DOMParser().parseFromString(dirtyPayload, 'text/html');
    } catch (_) {}

    /* Remove title to fix a mXSS bug in older MS Edge */
    if (removeTitle) {
      addToSet(FORBID_TAGS, ['title']);
    }

    /* Use createHTMLDocument in case DOMParser is not available */
    if (!doc || !doc.documentElement) {
      doc = implementation.createHTMLDocument('');
      var _doc = doc,
          body = _doc.body;

      body.parentNode.removeChild(body.parentNode.firstElementChild);
      body.outerHTML = dirtyPayload;
    }

    if (dirty && leadingWhitespace) {
      doc.body.insertBefore(document.createTextNode(leadingWhitespace), doc.body.childNodes[0] || null);
    }

    /* Work on whole document or just its body */
    return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
  };

  /* Here we test for a broken feature in Edge that might cause mXSS */
  if (DOMPurify.isSupported) {
    (function () {
      try {
        var doc = _initDocument('<x/><title>&lt;/title&gt;&lt;img&gt;');
        if (regExpTest(/<\/title/, doc.querySelector('title').innerHTML)) {
          removeTitle = true;
        }
      } catch (_) {}
    })();
  }

  /**
   * _createIterator
   *
   * @param  {Document} root document/fragment to create iterator for
   * @return {Iterator} iterator instance
   */
  var _createIterator = function _createIterator(root) {
    return createNodeIterator.call(root.ownerDocument || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT, function () {
      return NodeFilter.FILTER_ACCEPT;
    }, false);
  };

  /**
   * _isClobbered
   *
   * @param  {Node} elm element to check for clobbering attacks
   * @return {Boolean} true if clobbered, false if safe
   */
  var _isClobbered = function _isClobbered(elm) {
    if (elm instanceof Text || elm instanceof Comment) {
      return false;
    }

    if (typeof elm.nodeName !== 'string' || typeof elm.textContent !== 'string' || typeof elm.removeChild !== 'function' || !(elm.attributes instanceof NamedNodeMap) || typeof elm.removeAttribute !== 'function' || typeof elm.setAttribute !== 'function' || typeof elm.namespaceURI !== 'string') {
      return true;
    }

    return false;
  };

  /**
   * _isNode
   *
   * @param  {Node} obj object to check whether it's a DOM node
   * @return {Boolean} true is object is a DOM node
   */
  var _isNode = function _isNode(object) {
    return (typeof Node === 'undefined' ? 'undefined' : _typeof(Node)) === 'object' ? object instanceof Node : object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string';
  };

  /**
   * _executeHook
   * Execute user configurable hooks
   *
   * @param  {String} entryPoint  Name of the hook's entry point
   * @param  {Node} currentNode node to work on with the hook
   * @param  {Object} data additional hook parameters
   */
  var _executeHook = function _executeHook(entryPoint, currentNode, data) {
    if (!hooks[entryPoint]) {
      return;
    }

    arrayForEach(hooks[entryPoint], function (hook) {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  };

  /**
   * _sanitizeElements
   *
   * @protect nodeName
   * @protect textContent
   * @protect removeChild
   *
   * @param   {Node} currentNode to check for permission to exist
   * @return  {Boolean} true if node was killed, false if left alive
   */
  // eslint-disable-next-line complexity
  var _sanitizeElements = function _sanitizeElements(currentNode) {
    var content = void 0;

    /* Execute a hook if present */
    _executeHook('beforeSanitizeElements', currentNode, null);

    /* Check if element is clobbered or can clobber */
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }

    /* Now let's check the element's type and name */
    var tagName = stringToLowerCase(currentNode.nodeName);

    /* Execute a hook if present */
    _executeHook('uponSanitizeElement', currentNode, {
      tagName: tagName,
      allowedTags: ALLOWED_TAGS
    });

    /* Take care of an mXSS pattern using p, br inside svg, math */
    if ((tagName === 'svg' || tagName === 'math') && currentNode.querySelectorAll('p, br').length !== 0) {
      _forceRemove(currentNode);
      return true;
    }

    /* Remove element if anything forbids its presence */
    if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
      /* Keep content except for bad-listed elements */
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName] && typeof currentNode.insertAdjacentHTML === 'function') {
        try {
          var htmlToInsert = currentNode.innerHTML;
          currentNode.insertAdjacentHTML('AfterEnd', trustedTypesPolicy ? trustedTypesPolicy.createHTML(htmlToInsert) : htmlToInsert);
        } catch (_) {}
      }

      _forceRemove(currentNode);
      return true;
    }

    /* Remove in case a noscript/noembed XSS is suspected */
    if (tagName === 'noscript' && regExpTest(/<\/noscript/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }

    if (tagName === 'noembed' && regExpTest(/<\/noembed/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }

    /* Convert markup to cover jQuery behavior */
    if (SAFE_FOR_JQUERY && !currentNode.firstElementChild && (!currentNode.content || !currentNode.content.firstElementChild) && regExpTest(/</g, currentNode.textContent)) {
      arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
      if (currentNode.innerHTML) {
        currentNode.innerHTML = stringReplace(currentNode.innerHTML, /</g, '&lt;');
      } else {
        currentNode.innerHTML = stringReplace(currentNode.textContent, /</g, '&lt;');
      }
    }

    /* Sanitize element content to be template-safe */
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === 3) {
      /* Get the element's text content */
      content = currentNode.textContent;
      content = stringReplace(content, MUSTACHE_EXPR$$1, ' ');
      content = stringReplace(content, ERB_EXPR$$1, ' ');
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
        currentNode.textContent = content;
      }
    }

    /* Execute a hook if present */
    _executeHook('afterSanitizeElements', currentNode, null);

    return false;
  };

  /**
   * _isValidAttribute
   *
   * @param  {string} lcTag Lowercase tag name of containing element.
   * @param  {string} lcName Lowercase attribute name.
   * @param  {string} value Attribute value.
   * @return {Boolean} Returns true if `value` is valid, otherwise false.
   */
  // eslint-disable-next-line complexity
  var _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
    /* Make sure attribute cannot clobber */
    if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
      return false;
    }

    /* Allow valid data-* attributes: At least one character after "-"
        (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
        XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
        We don't need to check the value; it's always URI safe. */
    if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$$1, lcName)) ; else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$$1, lcName)) ; else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      return false;

      /* Check value is safe. First, is attr inert? If so, is safe */
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ; else if (regExpTest(IS_ALLOWED_URI$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ; else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if (!value) ; else {
      return false;
    }

    return true;
  };

  /**
   * _sanitizeAttributes
   *
   * @protect attributes
   * @protect nodeName
   * @protect removeAttribute
   * @protect setAttribute
   *
   * @param  {Node} currentNode to sanitize
   */
  // eslint-disable-next-line complexity
  var _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
    var attr = void 0;
    var value = void 0;
    var lcName = void 0;
    var idAttr = void 0;
    var l = void 0;
    /* Execute a hook if present */
    _executeHook('beforeSanitizeAttributes', currentNode, null);

    var attributes = currentNode.attributes;

    /* Check if we have attributes; if not we might have a text node */

    if (!attributes) {
      return;
    }

    var hookEvent = {
      attrName: '',
      attrValue: '',
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR
    };
    l = attributes.length;

    /* Go backwards over all attributes; safely remove bad ones */
    while (l--) {
      attr = attributes[l];
      var _attr = attr,
          name = _attr.name,
          namespaceURI = _attr.namespaceURI;

      value = stringTrim(attr.value);
      lcName = stringToLowerCase(name);

      /* Execute a hook if present */
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
      _executeHook('uponSanitizeAttribute', currentNode, hookEvent);
      value = hookEvent.attrValue;
      /* Did the hooks approve of the attribute? */
      if (hookEvent.forceKeepAttr) {
        continue;
      }

      /* Remove attribute */
      // Safari (iOS + Mac), last tested v8.0.5, crashes if you try to
      // remove a "name" attribute from an <img> tag that has an "id"
      // attribute at the time.
      if (lcName === 'name' && currentNode.nodeName === 'IMG' && attributes.id) {
        idAttr = attributes.id;
        attributes = arraySlice(attributes, []);
        _removeAttribute('id', currentNode);
        _removeAttribute(name, currentNode);
        if (arrayIndexOf(attributes, idAttr) > l) {
          currentNode.setAttribute('id', idAttr.value);
        }
      } else if (
      // This works around a bug in Safari, where input[type=file]
      // cannot be dynamically set after type has been removed
      currentNode.nodeName === 'INPUT' && lcName === 'type' && value === 'file' && hookEvent.keepAttr && (ALLOWED_ATTR[lcName] || !FORBID_ATTR[lcName])) {
        continue;
      } else {
        // This avoids a crash in Safari v9.0 with double-ids.
        // The trick is to first set the id to be empty and then to
        // remove the attribute
        if (name === 'id') {
          currentNode.setAttribute(name, '');
        }

        _removeAttribute(name, currentNode);
      }

      /* Did the hooks approve of the attribute? */
      if (!hookEvent.keepAttr) {
        continue;
      }

      /* Work around a security issue in jQuery 3.0 */
      if (SAFE_FOR_JQUERY && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }

      /* Take care of an mXSS pattern using namespace switches */
      if (regExpTest(/svg|math/i, currentNode.namespaceURI) && regExpTest(regExpCreate('</(' + arrayJoin(objectKeys(FORBID_CONTENTS), '|') + ')', 'i'), value)) {
        _removeAttribute(name, currentNode);
        continue;
      }

      /* Sanitize attribute content to be template-safe */
      if (SAFE_FOR_TEMPLATES) {
        value = stringReplace(value, MUSTACHE_EXPR$$1, ' ');
        value = stringReplace(value, ERB_EXPR$$1, ' ');
      }

      /* Is `value` valid for this attribute? */
      var lcTag = currentNode.nodeName.toLowerCase();
      if (!_isValidAttribute(lcTag, lcName, value)) {
        continue;
      }

      /* Handle invalid data-* attribute set by try-catching it */
      try {
        if (namespaceURI) {
          currentNode.setAttributeNS(namespaceURI, name, value);
        } else {
          /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
          currentNode.setAttribute(name, value);
        }

        arrayPop(DOMPurify.removed);
      } catch (_) {}
    }

    /* Execute a hook if present */
    _executeHook('afterSanitizeAttributes', currentNode, null);
  };

  /**
   * _sanitizeShadowDOM
   *
   * @param  {DocumentFragment} fragment to iterate over recursively
   */
  var _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
    var shadowNode = void 0;
    var shadowIterator = _createIterator(fragment);

    /* Execute a hook if present */
    _executeHook('beforeSanitizeShadowDOM', fragment, null);

    while (shadowNode = shadowIterator.nextNode()) {
      /* Execute a hook if present */
      _executeHook('uponSanitizeShadowNode', shadowNode, null);

      /* Sanitize tags and elements */
      if (_sanitizeElements(shadowNode)) {
        continue;
      }

      /* Deep shadow DOM detected */
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(shadowNode.content);
      }

      /* Check attributes, sanitize if necessary */
      _sanitizeAttributes(shadowNode);
    }

    /* Execute a hook if present */
    _executeHook('afterSanitizeShadowDOM', fragment, null);
  };

  /**
   * Sanitize
   * Public method providing core sanitation functionality
   *
   * @param {String|Node} dirty string or DOM node
   * @param {Object} configuration object
   */
  // eslint-disable-next-line complexity
  DOMPurify.sanitize = function (dirty, cfg) {
    var body = void 0;
    var importedNode = void 0;
    var currentNode = void 0;
    var oldNode = void 0;
    var returnNode = void 0;
    /* Make sure we have a string to sanitize.
      DO NOT return early, as this will return the wrong type if
      the user has requested a DOM object rather than a string */
    if (!dirty) {
      dirty = '<!-->';
    }

    /* Stringify, in case dirty is an object */
    if (typeof dirty !== 'string' && !_isNode(dirty)) {
      // eslint-disable-next-line no-negated-condition
      if (typeof dirty.toString !== 'function') {
        throw typeErrorCreate('toString is not a function');
      } else {
        dirty = dirty.toString();
        if (typeof dirty !== 'string') {
          throw typeErrorCreate('dirty is not a string, aborting');
        }
      }
    }

    /* Check we can run. Otherwise fall back or ignore */
    if (!DOMPurify.isSupported) {
      if (_typeof(window.toStaticHTML) === 'object' || typeof window.toStaticHTML === 'function') {
        if (typeof dirty === 'string') {
          return window.toStaticHTML(dirty);
        }

        if (_isNode(dirty)) {
          return window.toStaticHTML(dirty.outerHTML);
        }
      }

      return dirty;
    }

    /* Assign config vars */
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }

    /* Clean up removed elements */
    DOMPurify.removed = [];

    /* Check if dirty is correctly typed for IN_PLACE */
    if (typeof dirty === 'string') {
      IN_PLACE = false;
    }

    if (IN_PLACE) ; else if (dirty instanceof Node) {
      /* If dirty is a DOM element, append to an empty document to avoid
         elements being stripped by the parser */
      body = _initDocument('<!-->');
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === 1 && importedNode.nodeName === 'BODY') {
        /* Node is already a body, use as is */
        body = importedNode;
      } else if (importedNode.nodeName === 'HTML') {
        body = importedNode;
      } else {
        // eslint-disable-next-line unicorn/prefer-node-append
        body.appendChild(importedNode);
      }
    } else {
      /* Exit directly if we have nothing to do */
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
      // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf('<') === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }

      /* Initialize the document to work on */
      body = _initDocument(dirty);

      /* Check we have a DOM node from the data */
      if (!body) {
        return RETURN_DOM ? null : emptyHTML;
      }
    }

    /* Remove first element node (ours) if FORCE_BODY is set */
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }

    /* Get node iterator */
    var nodeIterator = _createIterator(IN_PLACE ? dirty : body);

    /* Now start iterating over the created document */
    while (currentNode = nodeIterator.nextNode()) {
      /* Fix IE's strange behavior with manipulated textNodes #89 */
      if (currentNode.nodeType === 3 && currentNode === oldNode) {
        continue;
      }

      /* Sanitize tags and elements */
      if (_sanitizeElements(currentNode)) {
        continue;
      }

      /* Shadow DOM detected, sanitize it */
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(currentNode.content);
      }

      /* Check attributes, sanitize if necessary */
      _sanitizeAttributes(currentNode);

      oldNode = currentNode;
    }

    oldNode = null;

    /* If we sanitized `dirty` in-place, return it. */
    if (IN_PLACE) {
      return dirty;
    }

    /* Return sanitized string or DOM */
    if (RETURN_DOM) {
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);

        while (body.firstChild) {
          // eslint-disable-next-line unicorn/prefer-node-append
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }

      if (RETURN_DOM_IMPORT) {
        /*
          AdoptNode() is not used because internal state is not reset
          (e.g. the past names map of a HTMLFormElement), this is safe
          in theory but we would rather not risk another attack vector.
          The state that is cloned by importNode() is explicitly defined
          by the specs.
        */
        returnNode = importNode.call(originalDocument, returnNode, true);
      }

      return returnNode;
    }

    var serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;

    /* Sanitize final string template-safe */
    if (SAFE_FOR_TEMPLATES) {
      serializedHTML = stringReplace(serializedHTML, MUSTACHE_EXPR$$1, ' ');
      serializedHTML = stringReplace(serializedHTML, ERB_EXPR$$1, ' ');
    }

    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };

  /**
   * Public method to set the configuration once
   * setConfig
   *
   * @param {Object} cfg configuration object
   */
  DOMPurify.setConfig = function (cfg) {
    _parseConfig(cfg);
    SET_CONFIG = true;
  };

  /**
   * Public method to remove the configuration
   * clearConfig
   *
   */
  DOMPurify.clearConfig = function () {
    CONFIG = null;
    SET_CONFIG = false;
  };

  /**
   * Public method to check if an attribute value is valid.
   * Uses last set config, if any. Otherwise, uses config defaults.
   * isValidAttribute
   *
   * @param  {string} tag Tag name of containing element.
   * @param  {string} attr Attribute name.
   * @param  {string} value Attribute value.
   * @return {Boolean} Returns true if `value` is valid. Otherwise, returns false.
   */
  DOMPurify.isValidAttribute = function (tag, attr, value) {
    /* Initialize shared config vars if necessary. */
    if (!CONFIG) {
      _parseConfig({});
    }

    var lcTag = stringToLowerCase(tag);
    var lcName = stringToLowerCase(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };

  /**
   * AddHook
   * Public method to add DOMPurify hooks
   *
   * @param {String} entryPoint entry point for the hook to add
   * @param {Function} hookFunction function to execute
   */
  DOMPurify.addHook = function (entryPoint, hookFunction) {
    if (typeof hookFunction !== 'function') {
      return;
    }

    hooks[entryPoint] = hooks[entryPoint] || [];
    arrayPush(hooks[entryPoint], hookFunction);
  };

  /**
   * RemoveHook
   * Public method to remove a DOMPurify hook at a given entryPoint
   * (pops it from the stack of hooks if more are present)
   *
   * @param {String} entryPoint entry point for the hook to remove
   */
  DOMPurify.removeHook = function (entryPoint) {
    if (hooks[entryPoint]) {
      arrayPop(hooks[entryPoint]);
    }
  };

  /**
   * RemoveHooks
   * Public method to remove all DOMPurify hooks at a given entryPoint
   *
   * @param  {String} entryPoint entry point for the hooks to remove
   */
  DOMPurify.removeHooks = function (entryPoint) {
    if (hooks[entryPoint]) {
      hooks[entryPoint] = [];
    }
  };

  /**
   * RemoveAllHooks
   * Public method to remove all DOMPurify hooks
   *
   */
  DOMPurify.removeAllHooks = function () {
    hooks = {};
  };

  return DOMPurify;
}

var purify = createDOMPurify();

/**
@license
Copyright 2018 The Advanced REST client authors
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
const ApiAware = {
  defaultScope: 'default',
  /**
   * List of registered awares
   * @type {Array}
   */
  awares: [],
  /**
   * Store for RAML definitions.
   * @type {Object<String, Object>} The key is a scope (`default` by default)
   * and the value is the API definition for this scope.
   */
  apis: {},
  /**
   * Attaches new RAML aware to the system. Added aware element will get
   * updates about new content.
   *
   * @param {RamlAware} aware The aware instance.
   */
  attachAware: function(aware) {
    if (this.awares.indexOf(aware) === -1) {
      this.awares.push(aware);
      if (!aware.scope) {
        aware.scope = this.defaultScope;
      } else {
        this.scopeChanged(aware);
      }
    }
  },
  /**
   * Removes avare from the map.
   * @param {RamlAware} aware Instance of the aware
   */
  detachAware: function(aware) {
    const index = this.awares.indexOf(aware);
    if (index !== -1) {
      this.awares.splice(index, 1);
      this.cleanUpData(aware.scope);
    } else {
      console.warn('The aware wasn\'t attached!');
    }
  },
  /**
   * Registers API data and aware.
   * @param {HTMLElement} srcAware The aware that notified about the change
   */
  setApi: function(srcAware) {
    const scope = srcAware.scope || this.defaultScope;
    const raml = srcAware.raml || undefined;
    this.apis[scope] = raml;
    const defaultScope = this.defaultScope;
    this.awares.forEach(function(aware) {
      if (aware === srcAware) {
        return;
      }
      const localScope = aware.scope || defaultScope;
      if (localScope !== scope) {
        return;
      }
      aware.raml = raml;
    });
  },

  scopeChanged: function(aware) {
    const scope = aware.scope || this.defaultScope;
    if (this.apis[scope]) {
      aware.raml = this.apis[scope];
    }
  },
  /**
   * Checks if
   * @param {String} scope
   */
  cleanUpData: function(scope) {
    const awares = this.awares;
    for (let i = 0, len = awares.length; i < len; i++) {
      if (awares[i].scope === scope) {
        return;
      }
    }
    delete this.apis[scope];
  }
};
/**
 *
 * Element that is aware of the AMF (RAML, OAS) content.
 *
 * The element contains the same RAML data as other elements whenever their
 * location in the document. The RAML data are encapsulated in `scope` attribute.
 * By default the `scope` is `default`. If you create two `<raml-aware>`s with
 * different scopes then changing one raml will not affect the other.
 *
 * Setting a RAML data on a `<raml-aware>` will notify other awares with the same
 * scopes about the change and update their RAML data so it can be transfered
 * between different parts of application on even different web components.
 *
 * ### Example
 *
 * ```html
 * <raml-aware raml="{{raml}}" scope="request"></raml-aware>
 * <raml-aware raml="{{importRaml}}" scope="import"></raml-aware>
 * ```
 *
 * ```javascript
 * const r1 = document.querySelector('raml-aware[scope="request"]');
 * const r2 = document.querySelector('raml-aware[scope="import"]');
 * r1.raml = {};
 * r2.raml = null;
 * assert(r1.raml !== r2.raml);
 * ```
 *
 * ## Limitations
 *
 * `RamlAware` has to be attached to DOM for it to work. This element uses
 * web components callback methods to initialize value. If the component is
 * never attached it will never initialize it's values.
 *
 * @customElement
 * @polymer
 * @memberof ApiElements
 * @demo demo/index.html
 */
class RamlAware extends HTMLElement {
  static get observedAttributes() {
    return [
      'scope'
    ];
  }
  /**
   * @return {Array|Object} Previously set API data
   * @deprecated Use `api` property instead
   */
  get raml() {
    return this.api;
  }
  /**
   * The RAML/AMF definition.
   * @param {Array|Object} value
   * @deprecated Use `api` property instead
   */
  set raml(value) {
    if (this._api === value) {
      return;
    }
    this.api = value;
    this.dispatchEvent(new CustomEvent('raml-changed', {
      composed: true,
      detail: {
        value
      }
    }));
  }
  /**
   * @return {Array|Object} Previously set API data
   */
  get api() {
    return this._api;
  }
  /**
   * The RAML/AMF definition.
   * @param {Array|Object} value
   */
  set api(value) {
    if (this._api === value) {
      return;
    }
    this._api = value;
    ApiAware.setApi(this);
    this.dispatchEvent(new CustomEvent('api-changed', {
      composed: true,
      detail: {
        value
      }
    }));
  }
  /**
   * @return {String} Scope for the RAML file.
   */
  get scope() {
    return this._scope;
  }
  /**
   * Scope for the RAML file.
   * Different awares may have different scope and keep different RAML objects.
   * It can be useful when one aware supports request panel and another
   * RAML import for example. In this case first one may have scope not set
   * (`default` scope) and second one `import` scope. Then both RAMLs are
   * encapsulated to the scope.
   *
   * @type {String}
   * @param {String} value
   */
  set scope(value) {
    if (this._scope === value) {
      return;
    }
    this._scope = value;
    ApiAware.scopeChanged(this);
    if (value) {
      this.setAttribute('scope', value);
    } else {
      this.removeAttribute('scope');
    }
  }

  connectedCallback() {
    ApiAware.attachAware(this);
  }

  disconnectedCallback() {
    ApiAware.detachAware(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // currently only "scope" is supported
    this.scope = newValue;
  }
}
window.customElements.define('raml-aware', RamlAware);

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var marked$1 = createCommonjsModule(function (module, exports) {
(function(root) {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: /^ {0,3}(`{3,}|~{3,})([^`~\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6}) +([^\n]*?)(?: +#+)? *(?:\n+|$)/,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: '^ {0,3}(?:' // optional indentation
    + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
    + '|comment[^\\n]*(\\n+|$)' // (2)
    + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
    + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
    + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
    + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
    + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
    + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
    + ')',
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  nptable: noop,
  table: noop,
  lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
  // regex template, placeholders will be replaced according to different paragraph
  // interruption rules of commonmark and the original markdown spec:
  _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html)[^\n]+)*)/,
  text: /^[^\n]+/
};

block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
block.def = edit(block.def)
  .replace('label', block._label)
  .replace('title', block._title)
  .getRegex();

block.bullet = /(?:[*+-]|\d{1,9}\.)/;
block.item = /^( *)(bull) ?[^\n]*(?:\n(?!\1bull ?)[^\n]*)*/;
block.item = edit(block.item, 'gm')
  .replace(/bull/g, block.bullet)
  .getRegex();

block.list = edit(block.list)
  .replace(/bull/g, block.bullet)
  .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
  .replace('def', '\\n+(?=' + block.def.source + ')')
  .getRegex();

block._tag = 'address|article|aside|base|basefont|blockquote|body|caption'
  + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
  + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
  + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
  + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
  + '|track|ul';
block._comment = /<!--(?!-?>)[\s\S]*?-->/;
block.html = edit(block.html, 'i')
  .replace('comment', block._comment)
  .replace('tag', block._tag)
  .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
  .getRegex();

block.paragraph = edit(block._paragraph)
  .replace('hr', block.hr)
  .replace('heading', ' {0,3}#{1,6} +')
  .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
  .replace('blockquote', ' {0,3}>')
  .replace('fences', ' {0,3}(?:`{3,}|~{3,})[^`\\n]*\\n')
  .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)')
  .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
  .getRegex();

block.blockquote = edit(block.blockquote)
  .replace('paragraph', block.paragraph)
  .getRegex();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
});

/**
 * Pedantic grammar (original John Gruber's loose markdown specification)
 */

block.pedantic = merge({}, block.normal, {
  html: edit(
    '^ *(?:comment *(?:\\n|\\s*$)'
    + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
    .replace('comment', block._comment)
    .replace(/tag/g, '(?!(?:'
      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
      + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
      + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
    .getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
  fences: noop, // fences not supported
  paragraph: edit(block.normal._paragraph)
    .replace('hr', block.hr)
    .replace('heading', ' *#{1,6} *[^\n]')
    .replace('lheading', block.lheading)
    .replace('blockquote', ' {0,3}>')
    .replace('|fences', '')
    .replace('|list', '')
    .replace('|html', '')
    .getRegex()
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = Object.create(null);
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.pedantic) {
    this.rules = block.pedantic;
  } else if (this.options.gfm) {
    this.rules = block.gfm;
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  src = src.replace(/^ +$/gm, '');
  var next,
      loose,
      cap,
      bull,
      b,
      item,
      listStart,
      listItems,
      t,
      space,
      i,
      tag,
      l,
      isordered,
      istask,
      ischecked;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      var lastToken = this.tokens[this.tokens.length - 1];
      src = src.substring(cap[0].length);
      // An indented code block cannot interrupt a paragraph.
      if (lastToken && lastToken.type === 'paragraph') {
        lastToken.text += '\n' + cap[0].trimRight();
      } else {
        cap = cap[0].replace(/^ {4}/gm, '');
        this.tokens.push({
          type: 'code',
          codeBlockStyle: 'indented',
          text: !this.options.pedantic
            ? rtrim(cap, '\n')
            : cap
        });
      }
      continue;
    }

    // fences
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2] ? cap[2].trim() : cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (cap = this.rules.nptable.exec(src)) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      };

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length);

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(item.cells[i], item.header.length);
        }

        this.tokens.push(item);

        continue;
      }
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];
      isordered = bull.length > 1;

      listStart = {
        type: 'list_start',
        ordered: isordered,
        start: isordered ? +bull : '',
        loose: false
      };

      this.tokens.push(listStart);

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      listItems = [];
      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) */, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull.length > 1 ? b.length === 1
            : (b.length > 1 || (this.options.smartLists && b !== bull))) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        if (loose) {
          listStart.loose = true;
        }

        // Check for task list items
        istask = /^\[[ xX]\] /.test(item);
        ischecked = undefined;
        if (istask) {
          ischecked = item[1] !== ' ';
          item = item.replace(/^\[[ xX]\] +/, '');
        }

        t = {
          type: 'list_item_start',
          task: istask,
          checked: ischecked,
          loose: loose
        };

        listItems.push(t);
        this.tokens.push(t);

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      if (listStart.loose) {
        l = listItems.length;
        i = 0;
        for (; i < l; i++) {
          listItems[i].loose = true;
        }
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
      tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
      if (!this.tokens.links[tag]) {
        this.tokens.links[tag] = {
          href: cap[2],
          title: cap[3]
        };
      }
      continue;
    }

    // table (gfm)
    if (cap = this.rules.table.exec(src)) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      };

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length);

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(
            item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
            item.header.length);
        }

        this.tokens.push(item);

        continue;
      }
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2].charAt(0) === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
  url: noop,
  tag: '^comment'
    + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
  link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
  reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
  nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
  strong: /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
  em: /^_([^\s_])_(?!_)|^\*([^\s*<\[])\*(?!\*)|^_([^\s<][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_<][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s<"][\s\S]*?[^\s\*])\*(?!\*|[^\spunctuation])|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  del: noop,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n))|(?= {2,}\n))/
};

// list of punctuation marks from common mark spec
// without ` and ] to workaround Rule 17 (inline code blocks/links)
inline._punctuation = '!"#$%&\'()*+,\\-./:;<=>?@\\[^_{|}~';
inline.em = edit(inline.em).replace(/punctuation/g, inline._punctuation).getRegex();

inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;

inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
inline.autolink = edit(inline.autolink)
  .replace('scheme', inline._scheme)
  .replace('email', inline._email)
  .getRegex();

inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

inline.tag = edit(inline.tag)
  .replace('comment', block._comment)
  .replace('attribute', inline._attribute)
  .getRegex();

inline._label = /(?:\[[^\[\]]*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
inline._href = /<(?:\\[<>]?|[^\s<>\\])*>|[^\s\x00-\x1f]*/;
inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

inline.link = edit(inline.link)
  .replace('label', inline._label)
  .replace('href', inline._href)
  .replace('title', inline._title)
  .getRegex();

inline.reflink = edit(inline.reflink)
  .replace('label', inline._label)
  .getRegex();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
  link: edit(/^!?\[(label)\]\((.*?)\)/)
    .replace('label', inline._label)
    .getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
    .replace('label', inline._label)
    .getRegex()
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: edit(inline.escape).replace('])', '~|])').getRegex(),
  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
  del: /^~+(?=\S)([\s\S]*?\S)~+/,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
});

inline.gfm.url = edit(inline.gfm.url, 'i')
  .replace('email', inline.gfm._extended_email)
  .getRegex();
/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: edit(inline.br).replace('{2,}', '*').getRegex(),
  text: edit(inline.gfm.text)
    .replace('\\b_', '\\b_| {2,}\\n')
    .replace(/\{2,\}/g, '*')
    .getRegex()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer();
  this.renderer.options = this.options;

  if (!this.links) {
    throw new Error('Tokens array requires a `links` property.');
  }

  if (this.options.pedantic) {
    this.rules = inline.pedantic;
  } else if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = '',
      link,
      text,
      href,
      title,
      cap,
      prevCapZero;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[1]);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      if (!this.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = true;
      } else if (this.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = false;
      }

      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      var lastParenIndex = findClosingBracket(cap[2], '()');
      if (lastParenIndex > -1) {
        var linkLen = 4 + cap[1].length + lastParenIndex;
        cap[2] = cap[2].substring(0, lastParenIndex);
        cap[0] = cap[0].substring(0, linkLen).trim();
        cap[3] = '';
      }
      src = src.substring(cap[0].length);
      this.inLink = true;
      href = cap[2];
      if (this.options.pedantic) {
        link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

        if (link) {
          href = link[1];
          title = link[3];
        } else {
          title = '';
        }
      } else {
        title = cap[3] ? cap[3].slice(1, -1) : '';
      }
      href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
      out += this.outputLink(cap, {
        href: InlineLexer.escapes(href),
        title: InlineLexer.escapes(title)
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[4] || cap[3] || cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2].trim(), true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = escape(this.mangle(cap[1]));
        href = 'mailto:' + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      if (cap[2] === '@') {
        text = escape(cap[0]);
        href = 'mailto:' + text;
      } else {
        // do extended autolink path validation
        do {
          prevCapZero = cap[0];
          cap[0] = this.rules._backpedal.exec(cap[0])[0];
        } while (prevCapZero !== cap[0]);
        text = escape(cap[0]);
        if (cap[1] === 'www.') {
          href = 'http://' + text;
        } else {
          href = text;
        }
      }
      src = src.substring(cap[0].length);
      out += this.renderer.link(href, null, text);
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      if (this.inRawBlock) {
        out += this.renderer.text(this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0]);
      } else {
        out += this.renderer.text(escape(this.smartypants(cap[0])));
      }
      continue;
    }

    if (src) {
      throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

InlineLexer.escapes = function(text) {
  return text ? text.replace(InlineLexer.rules._escapes, '$1') : text;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = link.href,
      title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = '',
      l = text.length,
      i = 0,
      ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || marked.defaults;
}

Renderer.prototype.code = function(code, infostring, escaped) {
  var lang = (infostring || '').match(/\S*/)[0];
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw, slugger) {
  if (this.options.headerIds) {
    return '<h'
      + level
      + ' id="'
      + this.options.headerPrefix
      + slugger.slug(raw)
      + '">'
      + text
      + '</h'
      + level
      + '>\n';
  }
  // ignore IDs
  return '<h' + level + '>' + text + '</h' + level + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered, start) {
  var type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
  return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.checkbox = function(checked) {
  return '<input '
    + (checked ? 'checked="" ' : '')
    + 'disabled="" type="checkbox"'
    + (this.options.xhtml ? ' /' : '')
    + '> ';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  if (body) body = '<tbody>' + body + '</tbody>';

  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + body
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' align="' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
  if (href === null) {
    return text;
  }
  var out = '<a href="' + escape(href) + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
  if (href === null) {
    return text;
  }

  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * TextRenderer
 * returns only the textual part of the token
 */

function TextRenderer() {}

// no need for block level renderers

TextRenderer.prototype.strong =
TextRenderer.prototype.em =
TextRenderer.prototype.codespan =
TextRenderer.prototype.del =
TextRenderer.prototype.text = function(text) {
  return text;
};

TextRenderer.prototype.link =
TextRenderer.prototype.image = function(href, title, text) {
  return '' + text;
};

TextRenderer.prototype.br = function() {
  return '';
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer();
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
  this.slugger = new Slugger();
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  // use an InlineLexer with a TextRenderer to extract pure text
  this.inlineText = new InlineLexer(
    src.links,
    merge({}, this.options, { renderer: new TextRenderer() })
  );
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  this.token = this.tokens.pop();
  return this.token;
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        unescape(this.inlineText.output(this.token.text)),
        this.slugger);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = '',
          body = '',
          i,
          row,
          cell,
          j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      body = '';
      var ordered = this.token.ordered,
          start = this.token.start;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered, start);
    }
    case 'list_item_start': {
      body = '';
      var loose = this.token.loose;
      var checked = this.token.checked;
      var task = this.token.task;

      if (this.token.task) {
        body += this.renderer.checkbox(checked);
      }

      while (this.next().type !== 'list_item_end') {
        body += !loose && this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }
      return this.renderer.listitem(body, task, checked);
    }
    case 'html': {
      // TODO parse inline content if parameter markdown=1
      return this.renderer.html(this.token.text);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
    default: {
      var errMsg = 'Token with "' + this.token.type + '" type was not found.';
      if (this.options.silent) {
        console.log(errMsg);
      } else {
        throw new Error(errMsg);
      }
    }
  }
};

/**
 * Slugger generates header id
 */

function Slugger() {
  this.seen = {};
}

/**
 * Convert string to unique id
 */

Slugger.prototype.slug = function(value) {
  var slug = value
    .toLowerCase()
    .trim()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    .replace(/\s/g, '-');

  if (this.seen.hasOwnProperty(slug)) {
    var originalSlug = slug;
    do {
      this.seen[originalSlug]++;
      slug = originalSlug + '-' + this.seen[originalSlug];
    } while (this.seen.hasOwnProperty(slug));
  }
  this.seen[slug] = 0;

  return slug;
};

/**
 * Helpers
 */

function escape(html, encode) {
  if (encode) {
    if (escape.escapeTest.test(html)) {
      return html.replace(escape.escapeReplace, function(ch) { return escape.replacements[ch]; });
    }
  } else {
    if (escape.escapeTestNoEncode.test(html)) {
      return html.replace(escape.escapeReplaceNoEncode, function(ch) { return escape.replacements[ch]; });
    }
  }

  return html;
}

escape.escapeTest = /[&<>"']/;
escape.escapeReplace = /[&<>"']/g;
escape.replacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

escape.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
escape.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;

function unescape(html) {
  // explicitly match decimal, hex, and named HTML entities
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function edit(regex, opt) {
  regex = regex.source || regex;
  opt = opt || '';
  return {
    replace: function(name, val) {
      val = val.source || val;
      val = val.replace(/(^|[^\[])\^/g, '$1');
      regex = regex.replace(name, val);
      return this;
    },
    getRegex: function() {
      return new RegExp(regex, opt);
    }
  };
}

function cleanUrl(sanitize, base, href) {
  if (sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return null;
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
      return null;
    }
  }
  if (base && !originIndependentUrl.test(href)) {
    href = resolveUrl(base, href);
  }
  try {
    href = encodeURI(href).replace(/%25/g, '%');
  } catch (e) {
    return null;
  }
  return href;
}

function resolveUrl(base, href) {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (/^[^:]+:\/*[^/]*$/.test(base)) {
      baseUrls[' ' + base] = base + '/';
    } else {
      baseUrls[' ' + base] = rtrim(base, '/', true);
    }
  }
  base = baseUrls[' ' + base];

  if (href.slice(0, 2) === '//') {
    return base.replace(/:[\s\S]*/, ':') + href;
  } else if (href.charAt(0) === '/') {
    return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href;
  } else {
    return base + href;
  }
}
var baseUrls = {};
var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1,
      target,
      key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

function splitCells(tableRow, count) {
  // ensure that every cell-delimiting pipe has a space
  // before it to distinguish it from an escaped pipe
  var row = tableRow.replace(/\|/g, function(match, offset, str) {
        var escaped = false,
            curr = offset;
        while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
        if (escaped) {
          // odd number of slashes means | is escaped
          // so we leave it alone
          return '|';
        } else {
          // add space before unescaped |
          return ' |';
        }
      }),
      cells = row.split(/ \|/),
      i = 0;

  if (cells.length > count) {
    cells.splice(count);
  } else {
    while (cells.length < count) cells.push('');
  }

  for (; i < cells.length; i++) {
    // leading or trailing whitespace is ignored per the gfm spec
    cells[i] = cells[i].trim().replace(/\\\|/g, '|');
  }
  return cells;
}

// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.
function rtrim(str, c, invert) {
  if (str.length === 0) {
    return '';
  }

  // Length of suffix matching the invert condition.
  var suffLen = 0;

  // Step left until we fail to match the invert condition.
  while (suffLen < str.length) {
    var currChar = str.charAt(str.length - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }

  return str.substr(0, str.length - suffLen);
}

function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }
  var level = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  return -1;
}

function checkSanitizeDeprecation(opt) {
  if (opt && opt.sanitize && !opt.silent) {
    console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
  }
}

/**
 * Marked
 */

function marked(src, opt, callback) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked(): input parameter is undefined or null');
  }
  if (typeof src !== 'string') {
    throw new Error('marked(): input parameter is of type '
      + Object.prototype.toString.call(src) + ', string expected');
  }

  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});
    checkSanitizeDeprecation(opt);

    var highlight = opt.highlight,
        tokens,
        pending,
        i = 0;

    try {
      tokens = Lexer.lex(src, opt);
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    checkSanitizeDeprecation(opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occurred:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.getDefaults = function() {
  return {
    baseUrl: null,
    breaks: false,
    gfm: true,
    headerIds: true,
    headerPrefix: '',
    highlight: null,
    langPrefix: 'language-',
    mangle: true,
    pedantic: false,
    renderer: new Renderer(),
    sanitize: false,
    sanitizer: null,
    silent: false,
    smartLists: false,
    smartypants: false,
    xhtml: false
  };
};

marked.defaults = marked.getDefaults();

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.Slugger = Slugger;

marked.parse = marked;

{
  module.exports = marked;
}
})();
});

var marked$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': marked$1,
    __moduleExports: marked$1
});

/* istanbul ignore if */
if (!window.marked) {
  // For webpack support for the Polymer 3 version created by the Polymer
  // Modulizer More info:
  // https://github.com/PolymerElements/marked-element/issues/81
  window.marked = marked$2;
}

/**
Element wrapper for the [marked](https://github.com/chjj/marked) library.

Based on Polymer's `marked-element`.

`<marked-element>` accepts Markdown source and renders it to a child
element with the class `markdown-html`. This child element can be styled
as you would a normal DOM element. If you do not provide a child element
with the `markdown-html` class, the Markdown source will still be rendered,
but to a shadow DOM child that cannot be styled.

### Markdown Content

The Markdown source can be specified several ways:

#### Use the `markdown` attribute to bind markdown

```html
<marked-element markdown="`Markdown` is _awesome_!">
  <div slot="markdown-html"></div>
</marked-element>
```
#### Use `<script type="text/markdown">` element child to inline markdown

```html
<marked-element>
  <div slot="markdown-html"></div>
  <script type="text/markdown">
    Check out my markdown!
    We can even embed elements without fear of the HTML parser mucking up their
    textual representation:
  </script>
</marked-element>
```
#### Use `<script type="text/markdown" src="URL">` element child to specify remote markdown

```html
<marked-element>
  <div slot="markdown-html"></div>
  <script type="text/markdown" src="../guidelines.md"></script>
</marked-element>
```

Note that the `<script type="text/markdown">` approach is *static*. Changes to
the script content will *not* update the rendered markdown!

Though, you can data bind to the `src` attribute to change the markdown.

```html
<marked-element>
  <div slot="markdown-html"></div>
  <script type="text/markdown" src$="[[source]]"></script>
</marked-element>
<script>
  ...
  this.source = '../guidelines.md';
</script>
```

### Styling

If you are using a child with the `markdown-html` class, you can style it
as you would a regular DOM element:

```css
[slot="markdown-html"] p {
  color: red;
}
[slot="markdown-html"] td:first-child {
  padding-left: 24px;
}
```

@demo demo/index.html
 */
class ArcMarked extends LitElement {
  get styles() {
    return css`
      :host {
        display: block;
        padding: 4px;
      }
    `;
  }

  static get properties() {
    return {
      /**
       * The markdown source that should be rendered by this element.
       */
      markdown: { type: String },
      /**
       * Enable GFM line breaks (regular newlines instead of two spaces for
       * breaks)
       */
      breaks: { type: Boolean },
      /**
       * Conform to obscure parts of markdown.pl as much as possible. Don't fix
       * any of the original markdown bugs or poor behavior.
       */
      pedantic: { type: Boolean },
      /**
       * Function used to customize a renderer based on the [API specified in the
       * Marked
       * library](https://github.com/chjj/marked#overriding-renderer-methods).
       * It takes one argument: a marked renderer object, which is mutated by the
       * function.
       */
      renderer: { type: Function },
      /**
       * Sanitize the output. Ignore any HTML that has been input.
       */
      sanitize: { type: Boolean },
      /**
       * Function used to customize a sanitize behavior.
       * It takes one argument: element String without text Contents.
       *
       * e.g. `<div>` `<a href="/">` `</p>'.
       * Note: To enable this function, must set `sanitize` to true.
       * WARNING: If you are using this option to untrusted text, you must to
       * prevent XSS Attacks.
       */
      sanitizer: { type: Function },
      /**
       * If true, disables the default sanitization of any markdown received by
       * a request and allows fetched unsanitized markdown
       *
       * e.g. fetching markdown via `src` that has HTML.
       * Note: this value overrides `sanitize` if a request is made.
       */
      disableRemoteSanitization: { type: Boolean },
      /**
       * Use "smart" typographic punctuation for things like quotes and dashes.
       */
      smartypants: { type: Boolean }
    };
  }

  get markdown() {
    return this._markdown;
  }

  set markdown(value) {
    if (this._setObservableProperty('markdown', value)) {
      this.renderMarkdown();
    }
  }

  get breaks() {
    return this._breaks;
  }

  set breaks(value) {
    if (this._setObservableProperty('breaks', value)) {
      this.renderMarkdown();
    }
  }

  get pedantic() {
    return this._pedantic;
  }

  set pedantic(value) {
    if (this._setObservableProperty('pedantic', value)) {
      this.renderMarkdown();
    }
  }

  get renderer() {
    return this._renderer;
  }

  set renderer(value) {
    if (this._setObservableProperty('renderer', value)) {
      this.renderMarkdown();
    }
  }

  get sanitize() {
    return this._sanitize;
  }

  set sanitize(value) {
    if (this._setObservableProperty('sanitize', value)) {
      this.renderMarkdown();
    }
  }

  get sanitizer() {
    return this._sanitizer;
  }

  set sanitizer(value) {
    if (this._setObservableProperty('sanitizer', value)) {
      this.renderMarkdown();
    }
  }

  get smartypants() {
    return this._smartypants;
  }

  set smartypants(value) {
    if (this._setObservableProperty('smartypants', value)) {
      this.renderMarkdown();
    }
  }

  _setObservableProperty(prop, value) {
    const key = `_${prop}`;
    const old = this[key];
    if (old === value) {
      return false;
    }
    this[key] = value;
    this.requestUpdate(prop, old);
    return true;
  }

  constructor() {
    super();
    this.breaks = false;
    this.pedantic = false;
    this.sanitize = false;
    this.disableRemoteSanitization = false;
    this.smartypants = false;
  }

  firstUpdated() {
    this._outputElement = this.outputElement;
    if (this.markdown) {
      this.renderMarkdown();
      return;
    }

    // Use the Markdown from the first `<script>` descendant whose MIME type
    // starts with "text/markdown". Script elements beyond the first are
    // ignored.
    this._markdownElement = this.querySelector('[type="text/markdown"]');
    if (!this._markdownElement) {
      return;
    }

    if (this._markdownElement.src) {
      this._request(this._markdownElement.src);
    }

    if (this._markdownElement.textContent.trim() !== '') {
      this.markdown = this._unindent(this._markdownElement.textContent);
    }

    const observer = new MutationObserver(this._onScriptAttributeChanged.bind(this));
    observer.observe(this._markdownElement, { attributes: true });
  }

  connectedCallback() {
    super.connectedCallback();
    this._attached = true;
    this._outputElement = this.outputElement;
    this.renderMarkdown();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._attached = false;
  }

  /**
   * Unindents the markdown source that will be rendered.
   *
   * @param {string} text
   * @return {string}
   */
  unindent(text) {
    return this._unindent(text);
  }

  get outputElement() {
    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) {
      return null;
    }
    const child = slot
      .assignedNodes()
      .find((node) => node.nodeType === 1 && node.getAttribute('slot') === 'markdown-html');
    return child || this.shadowRoot.querySelector('#content');
  }

  /**
   * Renders `markdown` into this element's DOM.
   *
   * This is automatically called whenever the `markdown` property is changed.
   *
   * The only case where you should be calling this is if you are providing
   * markdown via `<script type="text/markdown">` after this element has been
   * constructed (or updating that markdown).
   */
  renderMarkdown() {
    if (!this._attached) {
      return;
    }
    if (!this._outputElement) {
      return;
    }

    if (!this.markdown) {
      this._outputElement.innerHTML = '';
      return;
    }
    /* global marked */
    const renderer = new marked.Renderer();

    if (this.renderer) {
      this.renderer(renderer);
    }
    const data = this.markdown;
    const opts = {
      renderer: renderer,
      highlight: this._highlight.bind(this),
      breaks: this.breaks,
      pedantic: this.pedantic,
      smartypants: this.smartypants
    };
    let out = marked(data, opts);
    if (this.sanitize) {
      if (this.sanitizer) {
        out = this.sanitizer(out);
      } else {
        const result = purify.sanitize(out);
        if (typeof result === 'string') {
          out = result;
        } else {
          out = result.toString();
        }
      }
    }
    this._outputElement.innerHTML = out;
    this.dispatchEvent(
      new CustomEvent('marked-render-complete', {
        composed: true
      })
    );
  }

  /**
   * Fired when the content is being processed and before it is rendered.
   * Provides an opportunity to highlight code blocks based on the programming
   * language used. This is also known as syntax highlighting. One example would
   * be to use a prebuilt syntax highlighting library, e.g with
   * [highlightjs](https://highlightjs.org/).
   *
   * @param {string} code
   * @param {string} lang
   * @return {string}
   * @event syntax-highlight
   */
  _highlight(code, lang) {
    const e = new CustomEvent('syntax-highlight', {
      composed: true,
      bubbles: true,
      detail: {
        code,
        lang
      }
    });
    this.dispatchEvent(e);
    return e.detail.code || code;
  }

  /**
   * @param {string} text
   * @return {string}
   */
  _unindent(text) {
    if (!text) {
      return text;
    }
    const lines = text.replace(/\t/g, '  ').split('\n');
    const indent = lines.reduce(function(prev, line) {
      if (/^\s*$/.test(line)) {
        return prev; // Completely ignore blank lines.
      }
      const lineIndent = line.match(/^(\s*)/)[0].length;
      if (prev === null) {
        return lineIndent;
      }
      return lineIndent < prev ? lineIndent : prev;
    }, null);

    return lines.map((l) => l.substr(indent)).join('\n');
  }

  /**
   * Fired when the XHR finishes loading
   *
   * @param {string} url
   * @event marked-loadend
   */
  _request(url) {
    this._xhr = new XMLHttpRequest();
    const xhr = this._xhr;

    if (xhr.readyState > 0) {
      return;
    }

    xhr.addEventListener('error', this._handleError.bind(this));
    xhr.addEventListener(
      'loadend',
      function(e) {
        const status = this._xhr.status || 0;
        // Note: if we are using the file:// protocol, the status code will be 0
        // for all outcomes (successful or otherwise).
        if (status === 0 || (status >= 200 && status < 300)) {
          this.sanitize = !this.disableRemoteSanitization;
          this.markdown = e.target.response;
        } else {
          this._handleError(e);
        }

        this.dispatchEvent(
          new CustomEvent('marked-loadend', {
            composed: true,
            bubbles: true,
            detail: e
          })
        );
      }.bind(this)
    );

    xhr.open('GET', url);
    xhr.setRequestHeader('Accept', 'text/markdown');
    xhr.send();
  }

  /**
   * Fired when an error is received while fetching remote markdown content.
   *
   * @param {!Event} e
   * @event marked-request-error
   */
  _handleError(e) {
    const evt = new CustomEvent('marked-request-error', {
      composed: true,
      bubbles: true,
      cancelable: true,
      detail: e
    });
    this.dispatchEvent(evt);
    if (!evt.defaultPrevented) {
      this.markdown = 'Failed loading markdown source';
    }
  }

  /**
   * @param {!Array<!MutationRecord>} mutation
   */
  _onScriptAttributeChanged(mutation) {
    if (mutation[0].attributeName !== 'src') {
      return;
    }

    this._request(this._markdownElement.src);
  }

  render() {
    return html`
      <style>
        ${this.styles}
      </style>
      <slot name="markdown-html">
        <div id="content"></div>
      </slot>
    `;
  }
}

window.customElements.define('arc-marked', ArcMarked);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const nativeShadow = !(window['ShadyDOM'] && window['ShadyDOM']['inUse']);
let nativeCssVariables_;

/**
 * @param {(ShadyCSSOptions | ShadyCSSInterface)=} settings
 */
function calcCssVariables(settings) {
  if (settings && settings['shimcssproperties']) {
    nativeCssVariables_ = false;
  } else {
    // chrome 49 has semi-working css vars, check if box-shadow works
    // safari 9.1 has a recalc bug: https://bugs.webkit.org/show_bug.cgi?id=155782
    // However, shim css custom properties are only supported with ShadyDOM enabled,
    // so fall back on native if we do not detect ShadyDOM
    // Edge 15: custom properties used in ::before and ::after will also be used in the parent element
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12414257/
    nativeCssVariables_ = nativeShadow || Boolean(!navigator.userAgent.match(/AppleWebKit\/601|Edge\/15/) &&
      window.CSS && CSS.supports && CSS.supports('box-shadow', '0 0 0 var(--foo)'));
  }
}

/** @type {string | undefined} */
let cssBuild;
if (window.ShadyCSS && window.ShadyCSS.cssBuild !== undefined) {
  cssBuild = window.ShadyCSS.cssBuild;
}

/** @type {boolean} */
const disableRuntime = Boolean(window.ShadyCSS && window.ShadyCSS.disableRuntime);

if (window.ShadyCSS && window.ShadyCSS.nativeCss !== undefined) {
  nativeCssVariables_ = window.ShadyCSS.nativeCss;
} else if (window.ShadyCSS) {
  calcCssVariables(window.ShadyCSS);
  // reset window variable to let ShadyCSS API take its place
  window.ShadyCSS = undefined;
} else {
  calcCssVariables(window['WebComponents'] && window['WebComponents']['flags']);
}

// Hack for type error under new type inference which doesn't like that
// nativeCssVariables is updated in a function and assigns the type
// `function(): ?` instead of `boolean`.
const nativeCssVariables = /** @type {boolean} */(nativeCssVariables_);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/** @unrestricted */
class StyleNode {
  constructor() {
    /** @type {number} */
    this['start'] = 0;
    /** @type {number} */
    this['end'] = 0;
    /** @type {StyleNode} */
    this['previous'] = null;
    /** @type {StyleNode} */
    this['parent'] = null;
    /** @type {Array<StyleNode>} */
    this['rules'] = null;
    /** @type {string} */
    this['parsedCssText'] = '';
    /** @type {string} */
    this['cssText'] = '';
    /** @type {boolean} */
    this['atRule'] = false;
    /** @type {number} */
    this['type'] = 0;
    /** @type {string} */
    this['keyframesName'] = '';
    /** @type {string} */
    this['selector'] = '';
    /** @type {string} */
    this['parsedSelector'] = '';
  }
}

// given a string of css, return a simple rule tree
/**
 * @param {string} text
 * @return {StyleNode}
 */
function parse(text) {
  text = clean(text);
  return parseCss(lex(text), text);
}

// remove stuff we don't care about that may hinder parsing
/**
 * @param {string} cssText
 * @return {string}
 */
function clean(cssText) {
  return cssText.replace(RX.comments, '').replace(RX.port, '');
}

// super simple {...} lexer that returns a node tree
/**
 * @param {string} text
 * @return {!StyleNode}
 */
function lex(text) {
  let root = new StyleNode();
  root['start'] = 0;
  root['end'] = text.length;
  let n = root;
  for (let i = 0, l = text.length; i < l; i++) {
    if (text[i] === OPEN_BRACE) {
      if (!n['rules']) {
        n['rules'] = [];
      }
      let p = n;
      let previous = p['rules'][p['rules'].length - 1] || null;
      n = new StyleNode();
      n['start'] = i + 1;
      n['parent'] = p;
      n['previous'] = previous;
      p['rules'].push(n);
    } else if (text[i] === CLOSE_BRACE) {
      n['end'] = i + 1;
      n = n['parent'] || root;
    }
  }
  return root;
}

// add selectors/cssText to node tree
/**
 * @param {StyleNode} node
 * @param {string} text
 * @return {!StyleNode}
 */
function parseCss(node, text) {
  let t = text.substring(node['start'], node['end'] - 1);
  node['parsedCssText'] = node['cssText'] = t.trim();
  if (node['parent']) {
    let ss = node['previous'] ? node['previous']['end'] : node['parent']['start'];
    t = text.substring(ss, node['start'] - 1);
    t = _expandUnicodeEscapes(t);
    t = t.replace(RX.multipleSpaces, ' ');
    // TODO(sorvell): ad hoc; make selector include only after last ;
    // helps with mixin syntax
    t = t.substring(t.lastIndexOf(';') + 1);
    let s = node['parsedSelector'] = node['selector'] = t.trim();
    node['atRule'] = (s.indexOf(AT_START) === 0);
    // note, support a subset of rule types...
    if (node['atRule']) {
      if (s.indexOf(MEDIA_START) === 0) {
        node['type'] = types.MEDIA_RULE;
      } else if (s.match(RX.keyframesRule)) {
        node['type'] = types.KEYFRAMES_RULE;
        node['keyframesName'] =
          node['selector'].split(RX.multipleSpaces).pop();
      }
    } else {
      if (s.indexOf(VAR_START) === 0) {
        node['type'] = types.MIXIN_RULE;
      } else {
        node['type'] = types.STYLE_RULE;
      }
    }
  }
  let r$ = node['rules'];
  if (r$) {
    for (let i = 0, l = r$.length, r;
      (i < l) && (r = r$[i]); i++) {
      parseCss(r, text);
    }
  }
  return node;
}

/**
 * conversion of sort unicode escapes with spaces like `\33 ` (and longer) into
 * expanded form that doesn't require trailing space `\000033`
 * @param {string} s
 * @return {string}
 */
function _expandUnicodeEscapes(s) {
  return s.replace(/\\([0-9a-f]{1,6})\s/gi, function() {
    let code = arguments[1],
      repeat = 6 - code.length;
    while (repeat--) {
      code = '0' + code;
    }
    return '\\' + code;
  });
}

/**
 * stringify parsed css.
 * @param {StyleNode} node
 * @param {boolean=} preserveProperties
 * @param {string=} text
 * @return {string}
 */
function stringify(node, preserveProperties, text = '') {
  // calc rule cssText
  let cssText = '';
  if (node['cssText'] || node['rules']) {
    let r$ = node['rules'];
    if (r$ && !_hasMixinRules(r$)) {
      for (let i = 0, l = r$.length, r;
        (i < l) && (r = r$[i]); i++) {
        cssText = stringify(r, preserveProperties, cssText);
      }
    } else {
      cssText = preserveProperties ? node['cssText'] :
        removeCustomProps(node['cssText']);
      cssText = cssText.trim();
      if (cssText) {
        cssText = '  ' + cssText + '\n';
      }
    }
  }
  // emit rule if there is cssText
  if (cssText) {
    if (node['selector']) {
      text += node['selector'] + ' ' + OPEN_BRACE + '\n';
    }
    text += cssText;
    if (node['selector']) {
      text += CLOSE_BRACE + '\n\n';
    }
  }
  return text;
}

/**
 * @param {Array<StyleNode>} rules
 * @return {boolean}
 */
function _hasMixinRules(rules) {
  let r = rules[0];
  return Boolean(r) && Boolean(r['selector']) && r['selector'].indexOf(VAR_START) === 0;
}

/**
 * @param {string} cssText
 * @return {string}
 */
function removeCustomProps(cssText) {
  cssText = removeCustomPropAssignment(cssText);
  return removeCustomPropApply(cssText);
}

/**
 * @param {string} cssText
 * @return {string}
 */
function removeCustomPropAssignment(cssText) {
  return cssText
    .replace(RX.customProp, '')
    .replace(RX.mixinProp, '');
}

/**
 * @param {string} cssText
 * @return {string}
 */
function removeCustomPropApply(cssText) {
  return cssText
    .replace(RX.mixinApply, '')
    .replace(RX.varApply, '');
}

/** @enum {number} */
const types = {
  STYLE_RULE: 1,
  KEYFRAMES_RULE: 7,
  MEDIA_RULE: 4,
  MIXIN_RULE: 1000
};

const OPEN_BRACE = '{';
const CLOSE_BRACE = '}';

// helper regexp's
const RX = {
  comments: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,
  port: /@import[^;]*;/gim,
  customProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,
  mixinProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,
  mixinApply: /@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim,
  varApply: /[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,
  keyframesRule: /^@[^\s]*keyframes/,
  multipleSpaces: /\s+/g
};

const VAR_START = '--';
const MEDIA_START = '@media';
const AT_START = '@';

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const VAR_ASSIGN = /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};{])+)|\{([^}]*)\}(?:(?=[;\s}])|$))/gi;
const MIXIN_MATCH = /(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi;
const MEDIA_MATCH = /@media\s(.*)/;

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/** @type {!Set<string>} */
const styleTextSet = new Set();

const scopingAttribute = 'shady-unscoped';

/**
 * Add a specifically-marked style to the document directly, and only one copy of that style.
 *
 * @param {!HTMLStyleElement} style
 * @return {undefined}
 */
function processUnscopedStyle(style) {
  const text = style.textContent;
  if (!styleTextSet.has(text)) {
    styleTextSet.add(text);
    const newStyle = document.createElement('style');
    newStyle.setAttribute('shady-unscoped', '');
    newStyle.textContent = text;
    document.head.appendChild(newStyle);
  }
}

/**
 * Check if a style is supposed to be unscoped
 * @param {!HTMLStyleElement} style
 * @return {boolean} true if the style has the unscoping attribute
 */
function isUnscopedStyle(style) {
  return style.hasAttribute(scopingAttribute);
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * @param {string|StyleNode} rules
 * @param {function(StyleNode)=} callback
 * @return {string}
 */
function toCssText (rules, callback) {
  if (!rules) {
    return '';
  }
  if (typeof rules === 'string') {
    rules = parse(rules);
  }
  if (callback) {
    forEachRule(rules, callback);
  }
  return stringify(rules, nativeCssVariables);
}

/**
 * @param {HTMLStyleElement} style
 * @return {StyleNode}
 */
function rulesForStyle(style) {
  if (!style['__cssRules'] && style.textContent) {
    style['__cssRules'] = parse(style.textContent);
  }
  return style['__cssRules'] || null;
}

/**
 * @param {StyleNode} node
 * @param {Function=} styleRuleCallback
 * @param {Function=} keyframesRuleCallback
 * @param {boolean=} onlyActiveRules
 */
function forEachRule(node, styleRuleCallback, keyframesRuleCallback, onlyActiveRules) {
  if (!node) {
    return;
  }
  let skipRules = false;
  let type = node['type'];
  if (onlyActiveRules) {
    if (type === types.MEDIA_RULE) {
      let matchMedia = node['selector'].match(MEDIA_MATCH);
      if (matchMedia) {
        // if rule is a non matching @media rule, skip subrules
        if (!window.matchMedia(matchMedia[1]).matches) {
          skipRules = true;
        }
      }
    }
  }
  if (type === types.STYLE_RULE) {
    styleRuleCallback(node);
  } else if (keyframesRuleCallback &&
    type === types.KEYFRAMES_RULE) {
    keyframesRuleCallback(node);
  } else if (type === types.MIXIN_RULE) {
    skipRules = true;
  }
  let r$ = node['rules'];
  if (r$ && !skipRules) {
    for (let i=0, l=r$.length, r; (i<l) && (r=r$[i]); i++) {
      forEachRule(r, styleRuleCallback, keyframesRuleCallback, onlyActiveRules);
    }
  }
}

/**
 * Walk from text[start] matching parens and
 * returns position of the outer end paren
 * @param {string} text
 * @param {number} start
 * @return {number}
 */
function findMatchingParen(text, start) {
  let level = 0;
  for (let i=start, l=text.length; i < l; i++) {
    if (text[i] === '(') {
      level++;
    } else if (text[i] === ')') {
      if (--level === 0) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * @param {string} str
 * @param {function(string, string, string, string)} callback
 */
function processVariableAndFallback(str, callback) {
  // find 'var('
  let start = str.indexOf('var(');
  if (start === -1) {
    // no var?, everything is prefix
    return callback(str, '', '', '');
  }
  //${prefix}var(${inner})${suffix}
  let end = findMatchingParen(str, start + 3);
  let inner = str.substring(start + 4, end);
  let prefix = str.substring(0, start);
  // suffix may have other variables
  let suffix = processVariableAndFallback(str.substring(end + 1), callback);
  let comma = inner.indexOf(',');
  // value and fallback args should be trimmed to match in property lookup
  if (comma === -1) {
    // variable, no fallback
    return callback(prefix, inner.trim(), '', suffix);
  }
  // var(${value},${fallback})
  let value = inner.substring(0, comma).trim();
  let fallback = inner.substring(comma + 1).trim();
  return callback(prefix, value, fallback, suffix);
}

/**
 * @type {function(*):*}
 */
const wrap = window['ShadyDOM'] && window['ShadyDOM']['wrap'] || ((node) => node);

/**
 * @param {Element | {is: string, extends: string}} element
 * @return {{is: string, typeExtension: string}}
 */
function getIsExtends(element) {
  let localName = element['localName'];
  let is = '', typeExtension = '';
  /*
  NOTE: technically, this can be wrong for certain svg elements
  with `-` in the name like `<font-face>`
  */
  if (localName) {
    if (localName.indexOf('-') > -1) {
      is = localName;
    } else {
      typeExtension = localName;
      is = (element.getAttribute && element.getAttribute('is')) || '';
    }
  } else {
    is = /** @type {?} */(element).is;
    typeExtension = /** @type {?} */(element).extends;
  }
  return {is, typeExtension};
}

/**
 * @param {Element|DocumentFragment} element
 * @return {string}
 */
function gatherStyleText(element) {
  /** @type {!Array<string>} */
  const styleTextParts = [];
  const styles = /** @type {!NodeList<!HTMLStyleElement>} */(element.querySelectorAll('style'));
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    if (isUnscopedStyle(style)) {
      if (!nativeShadow) {
        processUnscopedStyle(style);
        style.parentNode.removeChild(style);
      }
    } else {
      styleTextParts.push(style.textContent);
      style.parentNode.removeChild(style);
    }
  }
  return styleTextParts.join('').trim();
}

const CSS_BUILD_ATTR = 'css-build';

/**
 * Return the polymer-css-build "build type" applied to this element
 *
 * @param {!HTMLElement} element
 * @return {string} Can be "", "shady", or "shadow"
 */
function getCssBuild(element) {
  if (cssBuild !== undefined) {
    return /** @type {string} */(cssBuild);
  }
  if (element.__cssBuild === undefined) {
    // try attribute first, as it is the common case
    const attrValue = element.getAttribute(CSS_BUILD_ATTR);
    if (attrValue) {
      element.__cssBuild = attrValue;
    } else {
      const buildComment = getBuildComment(element);
      if (buildComment !== '') {
        // remove build comment so it is not needlessly copied into every element instance
        removeBuildComment(element);
      }
      element.__cssBuild = buildComment;
    }
  }
  return element.__cssBuild || '';
}

/**
 * Check if the given element, either a <template> or <style>, has been processed
 * by polymer-css-build.
 *
 * If so, then we can make a number of optimizations:
 * - polymer-css-build will decompose mixins into individual CSS Custom Properties,
 * so the ApplyShim can be skipped entirely.
 * - Under native ShadowDOM, the style text can just be copied into each instance
 * without modification
 * - If the build is "shady" and ShadyDOM is in use, the styling does not need
 * scoping beyond the shimming of CSS Custom Properties
 *
 * @param {!HTMLElement} element
 * @return {boolean}
 */
function elementHasBuiltCss(element) {
  return getCssBuild(element) !== '';
}

/**
 * For templates made with tagged template literals, polymer-css-build will
 * insert a comment of the form `<!--css-build:shadow-->`
 *
 * @param {!HTMLElement} element
 * @return {string}
 */
function getBuildComment(element) {
  const buildComment = element.localName === 'template' ?
      /** @type {!HTMLTemplateElement} */ (element).content.firstChild :
      element.firstChild;
  if (buildComment instanceof Comment) {
    const commentParts = buildComment.textContent.trim().split(':');
    if (commentParts[0] === CSS_BUILD_ATTR) {
      return commentParts[1];
    }
  }
  return '';
}

/**
 * @param {!HTMLElement} element
 */
function removeBuildComment(element) {
  const buildComment = element.localName === 'template' ?
      /** @type {!HTMLTemplateElement} */ (element).content.firstChild :
      element.firstChild;
  buildComment.parentNode.removeChild(buildComment);
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * @param {Element} element
 * @param {Object=} properties
 */
function updateNativeProperties(element, properties) {
  // remove previous properties
  for (let p in properties) {
    // NOTE: for bc with shim, don't apply null values.
    if (p === null) {
      element.style.removeProperty(p);
    } else {
      element.style.setProperty(p, properties[p]);
    }
  }
}

/**
 * @param {Element} element
 * @param {string} property
 * @return {string}
 */
function getComputedStyleValue(element, property) {
  /**
   * @const {string}
   */
  const value = window.getComputedStyle(element).getPropertyValue(property);
  if (!value) {
    return '';
  } else {
    return value.trim();
  }
}

/**
 * return true if `cssText` contains a mixin definition or consumption
 * @param {string} cssText
 * @return {boolean}
 */
function detectMixin(cssText) {
  const has = MIXIN_MATCH.test(cssText) || VAR_ASSIGN.test(cssText);
  // reset state of the regexes
  MIXIN_MATCH.lastIndex = 0;
  VAR_ASSIGN.lastIndex = 0;
  return has;
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const APPLY_NAME_CLEAN = /;\s*/m;
const INITIAL_INHERIT = /^\s*(initial)|(inherit)\s*$/;
const IMPORTANT = /\s*!important/;

// separator used between mixin-name and mixin-property-name when producing properties
// NOTE: plain '-' may cause collisions in user styles
const MIXIN_VAR_SEP = '_-_';

// map of mixin to property names
// --foo: {border: 2px} -> {properties: {(--foo, ['border'])}, dependants: {'element-name': proto}}
class MixinMap {
  constructor() {
    /** @type {!Object<string, !MixinMapEntry>} */
    this._map = {};
  }
  /**
   * @param {string} name
   * @param {!PropertyEntry} props
   */
  set(name, props) {
    name = name.trim();
    this._map[name] = {
      properties: props,
      dependants: {}
    };
  }
  /**
   * @param {string} name
   * @return {MixinMapEntry}
   */
  get(name) {
    name = name.trim();
    return this._map[name] || null;
  }
}

/**
 * Callback for when an element is marked invalid
 * @type {?function(string)}
 */
let invalidCallback = null;

/** @unrestricted */
class ApplyShim {
  constructor() {
    /** @type {?string} */
    this._currentElement = null;
    /** @type {HTMLMetaElement} */
    this._measureElement = null;
    this._map = new MixinMap();
  }
  /**
   * return true if `cssText` contains a mixin definition or consumption
   * @param {string} cssText
   * @return {boolean}
   */
  detectMixin(cssText) {
    return detectMixin(cssText);
  }

  /**
   * Gather styles into one style for easier processing
   * @param {!HTMLTemplateElement} template
   * @return {HTMLStyleElement}
   */
  gatherStyles(template) {
    const styleText = gatherStyleText(template.content);
    if (styleText) {
      const style = /** @type {!HTMLStyleElement} */(document.createElement('style'));
      style.textContent = styleText;
      template.content.insertBefore(style, template.content.firstChild);
      return style;
    }
    return null;
  }
  /**
   * @param {!HTMLTemplateElement} template
   * @param {string} elementName
   * @return {StyleNode}
   */
  transformTemplate(template, elementName) {
    if (template._gatheredStyle === undefined) {
      template._gatheredStyle = this.gatherStyles(template);
    }
    /** @type {HTMLStyleElement} */
    const style = template._gatheredStyle;
    return style ? this.transformStyle(style, elementName) : null;
  }
  /**
   * @param {!HTMLStyleElement} style
   * @param {string} elementName
   * @return {StyleNode}
   */
  transformStyle(style, elementName = '') {
    let ast = rulesForStyle(style);
    this.transformRules(ast, elementName);
    style.textContent = toCssText(ast);
    return ast;
  }
  /**
   * @param {!HTMLStyleElement} style
   * @return {StyleNode}
   */
  transformCustomStyle(style) {
    let ast = rulesForStyle(style);
    forEachRule(ast, (rule) => {
      if (rule['selector'] === ':root') {
        rule['selector'] = 'html';
      }
      this.transformRule(rule);
    });
    style.textContent = toCssText(ast);
    return ast;
  }
  /**
   * @param {StyleNode} rules
   * @param {string} elementName
   */
  transformRules(rules, elementName) {
    this._currentElement = elementName;
    forEachRule(rules, (r) => {
      this.transformRule(r);
    });
    this._currentElement = null;
  }
  /**
   * @param {!StyleNode} rule
   */
  transformRule(rule) {
    rule['cssText'] = this.transformCssText(rule['parsedCssText'], rule);
    // :root was only used for variable assignment in property shim,
    // but generates invalid selectors with real properties.
    // replace with `:host > *`, which serves the same effect
    if (rule['selector'] === ':root') {
      rule['selector'] = ':host > *';
    }
  }
  /**
   * @param {string} cssText
   * @param {!StyleNode} rule
   * @return {string}
   */
  transformCssText(cssText, rule) {
    // produce variables
    cssText = cssText.replace(VAR_ASSIGN, (matchText, propertyName, valueProperty, valueMixin) =>
      this._produceCssProperties(matchText, propertyName, valueProperty, valueMixin, rule));
    // consume mixins
    return this._consumeCssProperties(cssText, rule);
  }
  /**
   * @param {string} property
   * @return {string}
   */
  _getInitialValueForProperty(property) {
    if (!this._measureElement) {
      this._measureElement = /** @type {HTMLMetaElement} */(document.createElement('meta'));
      this._measureElement.setAttribute('apply-shim-measure', '');
      this._measureElement.style.all = 'initial';
      document.head.appendChild(this._measureElement);
    }
    return window.getComputedStyle(this._measureElement).getPropertyValue(property);
  }
  /**
   * Walk over all rules before this rule to find fallbacks for mixins
   *
   * @param {!StyleNode} startRule
   * @return {!Object}
   */
  _fallbacksFromPreviousRules(startRule) {
    // find the "top" rule
    let topRule = startRule;
    while (topRule['parent']) {
      topRule = topRule['parent'];
    }
    const fallbacks = {};
    let seenStartRule = false;
    forEachRule(topRule, (r) => {
      // stop when we hit the input rule
      seenStartRule = seenStartRule || r === startRule;
      if (seenStartRule) {
        return;
      }
      // NOTE: Only matching selectors are "safe" for this fallback processing
      // It would be prohibitive to run `matchesSelector()` on each selector,
      // so we cheat and only check if the same selector string is used, which
      // guarantees things like specificity matching
      if (r['selector'] === startRule['selector']) {
        Object.assign(fallbacks, this._cssTextToMap(r['parsedCssText']));
      }
    });
    return fallbacks;
  }
  /**
   * replace mixin consumption with variable consumption
   * @param {string} text
   * @param {!StyleNode=} rule
   * @return {string}
   */
  _consumeCssProperties(text, rule) {
    /** @type {Array} */
    let m = null;
    // loop over text until all mixins with defintions have been applied
    while((m = MIXIN_MATCH.exec(text))) {
      let matchText = m[0];
      let mixinName = m[1];
      let idx = m.index;
      // collect properties before apply to be "defaults" if mixin might override them
      // match includes a "prefix", so find the start and end positions of @apply
      let applyPos = idx + matchText.indexOf('@apply');
      let afterApplyPos = idx + matchText.length;
      // find props defined before this @apply
      let textBeforeApply = text.slice(0, applyPos);
      let textAfterApply = text.slice(afterApplyPos);
      let defaults = rule ? this._fallbacksFromPreviousRules(rule) : {};
      Object.assign(defaults, this._cssTextToMap(textBeforeApply));
      let replacement = this._atApplyToCssProperties(mixinName, defaults);
      // use regex match position to replace mixin, keep linear processing time
      text = `${textBeforeApply}${replacement}${textAfterApply}`;
      // move regex search to _after_ replacement
      MIXIN_MATCH.lastIndex = idx + replacement.length;
    }
    return text;
  }
  /**
   * produce variable consumption at the site of mixin consumption
   * `@apply` --foo; -> for all props (${propname}: var(--foo_-_${propname}, ${fallback[propname]}}))
   * Example:
   *  border: var(--foo_-_border); padding: var(--foo_-_padding, 2px)
   *
   * @param {string} mixinName
   * @param {Object} fallbacks
   * @return {string}
   */
  _atApplyToCssProperties(mixinName, fallbacks) {
    mixinName = mixinName.replace(APPLY_NAME_CLEAN, '');
    let vars = [];
    let mixinEntry = this._map.get(mixinName);
    // if we depend on a mixin before it is created
    // make a sentinel entry in the map to add this element as a dependency for when it is defined.
    if (!mixinEntry) {
      this._map.set(mixinName, {});
      mixinEntry = this._map.get(mixinName);
    }
    if (mixinEntry) {
      if (this._currentElement) {
        mixinEntry.dependants[this._currentElement] = true;
      }
      let p, parts, f;
      const properties = mixinEntry.properties;
      for (p in properties) {
        f = fallbacks && fallbacks[p];
        parts = [p, ': var(', mixinName, MIXIN_VAR_SEP, p];
        if (f) {
          parts.push(',', f.replace(IMPORTANT, ''));
        }
        parts.push(')');
        if (IMPORTANT.test(properties[p])) {
          parts.push(' !important');
        }
        vars.push(parts.join(''));
      }
    }
    return vars.join('; ');
  }

  /**
   * @param {string} property
   * @param {string} value
   * @return {string}
   */
  _replaceInitialOrInherit(property, value) {
    let match = INITIAL_INHERIT.exec(value);
    if (match) {
      if (match[1]) {
        // initial
        // replace `initial` with the concrete initial value for this property
        value = this._getInitialValueForProperty(property);
      } else {
        // inherit
        // with this purposfully illegal value, the variable will be invalid at
        // compute time (https://www.w3.org/TR/css-variables/#invalid-at-computed-value-time)
        // and for inheriting values, will behave similarly
        // we cannot support the same behavior for non inheriting values like 'border'
        value = 'apply-shim-inherit';
      }
    }
    return value;
  }

  /**
   * "parse" a mixin definition into a map of properties and values
   * cssTextToMap('border: 2px solid black') -> ('border', '2px solid black')
   * @param {string} text
   * @param {boolean=} replaceInitialOrInherit
   * @return {!Object<string, string>}
   */
  _cssTextToMap(text, replaceInitialOrInherit = false) {
    let props = text.split(';');
    let property, value;
    let out = {};
    for (let i = 0, p, sp; i < props.length; i++) {
      p = props[i];
      if (p) {
        sp = p.split(':');
        // ignore lines that aren't definitions like @media
        if (sp.length > 1) {
          property = sp[0].trim();
          // some properties may have ':' in the value, like data urls
          value = sp.slice(1).join(':');
          if (replaceInitialOrInherit) {
            value = this._replaceInitialOrInherit(property, value);
          }
          out[property] = value;
        }
      }
    }
    return out;
  }

  /**
   * @param {MixinMapEntry} mixinEntry
   */
  _invalidateMixinEntry(mixinEntry) {
    if (!invalidCallback) {
      return;
    }
    for (let elementName in mixinEntry.dependants) {
      if (elementName !== this._currentElement) {
        invalidCallback(elementName);
      }
    }
  }

  /**
   * @param {string} matchText
   * @param {string} propertyName
   * @param {?string} valueProperty
   * @param {?string} valueMixin
   * @param {!StyleNode} rule
   * @return {string}
   */
  _produceCssProperties(matchText, propertyName, valueProperty, valueMixin, rule) {
    // handle case where property value is a mixin
    if (valueProperty) {
      // form: --mixin2: var(--mixin1), where --mixin1 is in the map
      processVariableAndFallback(valueProperty, (prefix, value) => {
        if (value && this._map.get(value)) {
          valueMixin = `@apply ${value};`;
        }
      });
    }
    if (!valueMixin) {
      return matchText;
    }
    let mixinAsProperties = this._consumeCssProperties('' + valueMixin, rule);
    let prefix = matchText.slice(0, matchText.indexOf('--'));
    // `initial` and `inherit` as properties in a map should be replaced because
    // these keywords are eagerly evaluated when the mixin becomes CSS Custom Properties,
    // and would set the variable value, rather than carry the keyword to the `var()` usage.
    let mixinValues = this._cssTextToMap(mixinAsProperties, true);
    let combinedProps = mixinValues;
    let mixinEntry = this._map.get(propertyName);
    let oldProps = mixinEntry && mixinEntry.properties;
    if (oldProps) {
      // NOTE: since we use mixin, the map of properties is updated here
      // and this is what we want.
      combinedProps = Object.assign(Object.create(oldProps), mixinValues);
    } else {
      this._map.set(propertyName, combinedProps);
    }
    let out = [];
    let p, v;
    // set variables defined by current mixin
    let needToInvalidate = false;
    for (p in combinedProps) {
      v = mixinValues[p];
      // if property not defined by current mixin, set initial
      if (v === undefined) {
        v = 'initial';
      }
      if (oldProps && !(p in oldProps)) {
        needToInvalidate = true;
      }
      out.push(`${propertyName}${MIXIN_VAR_SEP}${p}: ${v}`);
    }
    if (needToInvalidate) {
      this._invalidateMixinEntry(mixinEntry);
    }
    if (mixinEntry) {
      mixinEntry.properties = combinedProps;
    }
    // because the mixinMap is global, the mixin might conflict with
    // a different scope's simple variable definition:
    // Example:
    // some style somewhere:
    // --mixin1:{ ... }
    // --mixin2: var(--mixin1);
    // some other element:
    // --mixin1: 10px solid red;
    // --foo: var(--mixin1);
    // In this case, we leave the original variable definition in place.
    if (valueProperty) {
      prefix = `${matchText};${prefix}`;
    }
    return `${prefix}${out.join('; ')};`;
  }
}

/* exports */
/* eslint-disable no-self-assign */
ApplyShim.prototype['detectMixin'] = ApplyShim.prototype.detectMixin;
ApplyShim.prototype['transformStyle'] = ApplyShim.prototype.transformStyle;
ApplyShim.prototype['transformCustomStyle'] = ApplyShim.prototype.transformCustomStyle;
ApplyShim.prototype['transformRules'] = ApplyShim.prototype.transformRules;
ApplyShim.prototype['transformRule'] = ApplyShim.prototype.transformRule;
ApplyShim.prototype['transformTemplate'] = ApplyShim.prototype.transformTemplate;
ApplyShim.prototype['_separator'] = MIXIN_VAR_SEP;
/* eslint-enable no-self-assign */
Object.defineProperty(ApplyShim.prototype, 'invalidCallback', {
  /** @return {?function(string)} */
  get() {
    return invalidCallback;
  },
  /** @param {?function(string)} cb */
  set(cb) {
    invalidCallback = cb;
  }
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * @const {!Object<string, !HTMLTemplateElement>}
 */
const templateMap = {};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/*
 * Utilities for handling invalidating apply-shim mixins for a given template.
 *
 * The invalidation strategy involves keeping track of the "current" version of a template's mixins, and updating that count when a mixin is invalidated.
 * The template
 */

/** @const {string} */
const CURRENT_VERSION = '_applyShimCurrentVersion';

/** @const {string} */
const NEXT_VERSION = '_applyShimNextVersion';

/** @const {string} */
const VALIDATING_VERSION = '_applyShimValidatingVersion';

/**
 * @const {Promise<void>}
 */
const promise = Promise.resolve();

/**
 * @param {string} elementName
 */
function invalidate(elementName){
  let template = templateMap[elementName];
  if (template) {
    invalidateTemplate(template);
  }
}

/**
 * This function can be called multiple times to mark a template invalid
 * and signal that the style inside must be regenerated.
 *
 * Use `startValidatingTemplate` to begin an asynchronous validation cycle.
 * During that cycle, call `templateIsValidating` to see if the template must
 * be revalidated
 * @param {HTMLTemplateElement} template
 */
function invalidateTemplate(template) {
  // default the current version to 0
  template[CURRENT_VERSION] = template[CURRENT_VERSION] || 0;
  // ensure the "validating for" flag exists
  template[VALIDATING_VERSION] = template[VALIDATING_VERSION] || 0;
  // increment the next version
  template[NEXT_VERSION] = (template[NEXT_VERSION] || 0) + 1;
}

/**
 * @param {HTMLTemplateElement} template
 * @return {boolean}
 */
function templateIsValid(template) {
  return template[CURRENT_VERSION] === template[NEXT_VERSION];
}

/**
 * Returns true if the template is currently invalid and `startValidating` has been called since the last invalidation.
 * If false, the template must be validated.
 * @param {HTMLTemplateElement} template
 * @return {boolean}
 */
function templateIsValidating(template) {
  return !templateIsValid(template) && template[VALIDATING_VERSION] === template[NEXT_VERSION];
}

/**
 * Begin an asynchronous invalidation cycle.
 * This should be called after every validation of a template
 *
 * After one microtask, the template will be marked as valid until the next call to `invalidateTemplate`
 * @param {HTMLTemplateElement} template
 */
function startValidatingTemplate(template) {
  // remember that the current "next version" is the reason for this validation cycle
  template[VALIDATING_VERSION] = template[NEXT_VERSION];
  // however, there only needs to be one async task to clear the counters
  if (!template._validating) {
    template._validating = true;
    promise.then(function() {
      // sync the current version to let future invalidations cause a refresh cycle
      template[CURRENT_VERSION] = template[NEXT_VERSION];
      template._validating = false;
    });
  }
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/** @type {Promise<void>} */
let readyPromise = null;

/** @type {?function(?function())} */
let whenReady = window['HTMLImports'] && window['HTMLImports']['whenReady'] || null;

/** @type {function()} */
let resolveFn;

/**
 * @param {?function()} callback
 */
function documentWait(callback) {
  requestAnimationFrame(function() {
    if (whenReady) {
      whenReady(callback);
    } else {
      if (!readyPromise) {
        readyPromise = new Promise((resolve) => {resolveFn = resolve;});
        if (document.readyState === 'complete') {
          resolveFn();
        } else {
          document.addEventListener('readystatechange', () => {
            if (document.readyState === 'complete') {
              resolveFn();
            }
          });
        }
      }
      readyPromise.then(function(){ callback && callback(); });
    }
  });
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const SEEN_MARKER = '__seenByShadyCSS';
const CACHED_STYLE = '__shadyCSSCachedStyle';

/** @type {?function(!HTMLStyleElement)} */
let transformFn = null;

/** @type {?function()} */
let validateFn = null;

/**
This interface is provided to add document-level <style> elements to ShadyCSS for processing.
These styles must be processed by ShadyCSS to simulate ShadowRoot upper-bound encapsulation from outside styles
In addition, these styles may also need to be processed for @apply rules and CSS Custom Properties

To add document-level styles to ShadyCSS, one can call `ShadyCSS.addDocumentStyle(styleElement)` or `ShadyCSS.addDocumentStyle({getStyle: () => styleElement})`

In addition, if the process used to discover document-level styles can be synchronously flushed, one should set `ShadyCSS.documentStyleFlush`.
This function will be called when calculating styles.

An example usage of the document-level styling api can be found in `examples/document-style-lib.js`

@unrestricted
*/
class CustomStyleInterface {
  constructor() {
    /** @type {!Array<!CustomStyleProvider>} */
    this['customStyles'] = [];
    this['enqueued'] = false;
    // NOTE(dfreedm): use quotes here to prevent closure inlining to `function(){}`;
    documentWait(() => {
      if (window['ShadyCSS']['flushCustomStyles']) {
        window['ShadyCSS']['flushCustomStyles']();
      }
    });
  }
  /**
   * Queue a validation for new custom styles to batch style recalculations
   */
  enqueueDocumentValidation() {
    if (this['enqueued'] || !validateFn) {
      return;
    }
    this['enqueued'] = true;
    documentWait(validateFn);
  }
  /**
   * @param {!HTMLStyleElement} style
   */
  addCustomStyle(style) {
    if (!style[SEEN_MARKER]) {
      style[SEEN_MARKER] = true;
      this['customStyles'].push(style);
      this.enqueueDocumentValidation();
    }
  }
  /**
   * @param {!CustomStyleProvider} customStyle
   * @return {HTMLStyleElement}
   */
  getStyleForCustomStyle(customStyle) {
    if (customStyle[CACHED_STYLE]) {
      return customStyle[CACHED_STYLE];
    }
    let style;
    if (customStyle['getStyle']) {
      style = customStyle['getStyle']();
    } else {
      style = customStyle;
    }
    return style;
  }
  /**
   * @return {!Array<!CustomStyleProvider>}
   */
  processStyles() {
    const cs = this['customStyles'];
    for (let i = 0; i < cs.length; i++) {
      const customStyle = cs[i];
      if (customStyle[CACHED_STYLE]) {
        continue;
      }
      const style = this.getStyleForCustomStyle(customStyle);
      if (style) {
        // HTMLImports polyfill may have cloned the style into the main document,
        // which is referenced with __appliedElement.
        const styleToTransform = /** @type {!HTMLStyleElement} */(style['__appliedElement'] || style);
        if (transformFn) {
          transformFn(styleToTransform);
        }
        customStyle[CACHED_STYLE] = styleToTransform;
      }
    }
    return cs;
  }
}

/* eslint-disable no-self-assign */
CustomStyleInterface.prototype['addCustomStyle'] = CustomStyleInterface.prototype.addCustomStyle;
CustomStyleInterface.prototype['getStyleForCustomStyle'] = CustomStyleInterface.prototype.getStyleForCustomStyle;
CustomStyleInterface.prototype['processStyles'] = CustomStyleInterface.prototype.processStyles;
/* eslint-enable no-self-assign */

Object.defineProperties(CustomStyleInterface.prototype, {
  'transformCallback': {
    /** @return {?function(!HTMLStyleElement)} */
    get() {
      return transformFn;
    },
    /** @param {?function(!HTMLStyleElement)} fn */
    set(fn) {
      transformFn = fn;
    }
  },
  'validateCallback': {
    /** @return {?function()} */
    get() {
      return validateFn;
    },
    /**
     * @param {?function()} fn
     * @this {CustomStyleInterface}
     */
    set(fn) {
      let needsEnqueue = false;
      if (!validateFn) {
        needsEnqueue = true;
      }
      validateFn = fn;
      if (needsEnqueue) {
        this.enqueueDocumentValidation();
      }
    },
  }
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/** @const {ApplyShim} */
const applyShim = new ApplyShim();

class ApplyShimInterface {
  constructor() {
    /** @type {?CustomStyleInterfaceInterface} */
    this.customStyleInterface = null;
    applyShim['invalidCallback'] = invalidate;
  }
  ensure() {
    if (this.customStyleInterface) {
      return;
    }
    if (window.ShadyCSS.CustomStyleInterface) {
      this.customStyleInterface =
          /** @type {!CustomStyleInterfaceInterface} */ (
              window.ShadyCSS.CustomStyleInterface);
      this.customStyleInterface['transformCallback'] = (style) => {
        applyShim.transformCustomStyle(style);
      };
      this.customStyleInterface['validateCallback'] = () => {
        requestAnimationFrame(() => {
          if (this.customStyleInterface['enqueued']) {
            this.flushCustomStyles();
          }
        });
      };
    }
  }
  /**
   * @param {!HTMLTemplateElement} template
   * @param {string} elementName
   */
  prepareTemplate(template, elementName) {
    this.ensure();
    if (elementHasBuiltCss(template)) {
      return;
    }
    templateMap[elementName] = template;
    let ast = applyShim.transformTemplate(template, elementName);
    // save original style ast to use for revalidating instances
    template['_styleAst'] = ast;
  }
  flushCustomStyles() {
    this.ensure();
    if (!this.customStyleInterface) {
      return;
    }
    let styles = this.customStyleInterface['processStyles']();
    if (!this.customStyleInterface['enqueued']) {
      return;
    }
    for (let i = 0; i < styles.length; i++ ) {
      let cs = styles[i];
      let style = this.customStyleInterface['getStyleForCustomStyle'](cs);
      if (style) {
        applyShim.transformCustomStyle(style);
      }
    }
    this.customStyleInterface['enqueued'] = false;
  }
  /**
   * @param {HTMLElement} element
   * @param {Object=} properties
   */
  styleSubtree(element, properties) {
    this.ensure();
    if (properties) {
      updateNativeProperties(element, properties);
    }
    if (element.shadowRoot) {
      this.styleElement(element);
      let shadowChildren =
          /** @type {!ParentNode} */ (element.shadowRoot).children ||
          element.shadowRoot.childNodes;
      for (let i = 0; i < shadowChildren.length; i++) {
        this.styleSubtree(/** @type {HTMLElement} */(shadowChildren[i]));
      }
    } else {
      let children = element.children || element.childNodes;
      for (let i = 0; i < children.length; i++) {
        this.styleSubtree(/** @type {HTMLElement} */(children[i]));
      }
    }
  }
  /**
   * @param {HTMLElement} element
   */
  styleElement(element) {
    this.ensure();
    let {is} = getIsExtends(element);
    let template = templateMap[is];
    if (template && elementHasBuiltCss(template)) {
      return;
    }
    if (template && !templateIsValid(template)) {
      // only revalidate template once
      if (!templateIsValidating(template)) {
        this.prepareTemplate(template, is);
        startValidatingTemplate(template);
      }
      // update this element instance
      let root = element.shadowRoot;
      if (root) {
        let style = /** @type {HTMLStyleElement} */(root.querySelector('style'));
        if (style) {
          // reuse the template's style ast, it has all the original css text
          style['__cssRules'] = template['_styleAst'];
          style.textContent = toCssText(template['_styleAst']);
        }
      }
    }
  }
  /**
   * @param {Object=} properties
   */
  styleDocument(properties) {
    this.ensure();
    this.styleSubtree(document.body, properties);
  }
}

if (!window.ShadyCSS || !window.ShadyCSS.ScopingShim) {
  const applyShimInterface = new ApplyShimInterface();
  let CustomStyleInterface = window.ShadyCSS && window.ShadyCSS.CustomStyleInterface;

  /** @suppress {duplicate} */
  window.ShadyCSS = {
    /**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     * @param {string=} elementExtends
     */
    prepareTemplate(template, elementName, elementExtends) { // eslint-disable-line no-unused-vars
      applyShimInterface.flushCustomStyles();
      applyShimInterface.prepareTemplate(template, elementName);
    },

    /**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     * @param {string=} elementExtends
     */
    prepareTemplateStyles(template, elementName, elementExtends) {
      window.ShadyCSS.prepareTemplate(template, elementName, elementExtends);
    },

    /**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     */
    prepareTemplateDom(template, elementName) {}, // eslint-disable-line no-unused-vars

    /**
     * @param {!HTMLElement} element
     * @param {Object=} properties
     */
    styleSubtree(element, properties) {
      applyShimInterface.flushCustomStyles();
      applyShimInterface.styleSubtree(element, properties);
    },

    /**
     * @param {!HTMLElement} element
     */
    styleElement(element) {
      applyShimInterface.flushCustomStyles();
      applyShimInterface.styleElement(element);
    },

    /**
     * @param {Object=} properties
     */
    styleDocument(properties) {
      applyShimInterface.flushCustomStyles();
      applyShimInterface.styleDocument(properties);
    },

    /**
     * @param {Element} element
     * @param {string} property
     * @return {string}
     */
    getComputedStyleValue(element, property) {
      return getComputedStyleValue(element, property);
    },

    flushCustomStyles() {
      applyShimInterface.flushCustomStyles();
    },

    nativeCss: nativeCssVariables,
    nativeShadow: nativeShadow,
    cssBuild: cssBuild,
    disableRuntime: disableRuntime,
  };

  if (CustomStyleInterface) {
    window.ShadyCSS.CustomStyleInterface = CustomStyleInterface;
  }
}

window.ShadyCSS.ApplyShim = applyShim;

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/* eslint-disable no-unused-vars */
/**
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is replaced by the munged name for object[property]
 * We cannot alias this function, so we have to use a small shim that has the same behavior when not compiling.
 *
 * @param {?} prop Property name
 * @param {*} obj Reference object
 * @return {string} Potentially renamed property name
 */
window.JSCompiler_renameProperty = function(prop, obj) {
  return prop;
};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

let CSS_URL_RX = /(url\()([^)]*)(\))/g;
let ABS_URL = /(^\/[^\/])|(^#)|(^[\w-\d]*:)/;
let workingURL;
let resolveDoc;
/**
 * Resolves the given URL against the provided `baseUri'.
 *
 * Note that this function performs no resolution for URLs that start
 * with `/` (absolute URLs) or `#` (hash identifiers).  For general purpose
 * URL resolution, use `window.URL`.
 *
 * @param {string} url Input URL to resolve
 * @param {?string=} baseURI Base URI to resolve the URL against
 * @return {string} resolved URL
 */
function resolveUrl(url, baseURI) {
  if (url && ABS_URL.test(url)) {
    return url;
  }
  if (url === '//') {
    return url;
  }
  // Lazy feature detection.
  if (workingURL === undefined) {
    workingURL = false;
    try {
      const u = new URL('b', 'http://a');
      u.pathname = 'c%20d';
      workingURL = (u.href === 'http://a/c%20d');
    } catch (e) {
      // silently fail
    }
  }
  if (!baseURI) {
    baseURI = document.baseURI || window.location.href;
  }
  if (workingURL) {
    try {
      return (new URL(url, baseURI)).href;
    } catch (e) {
      // Bad url or baseURI structure. Do not attempt to resolve.
      return url;
    }
  }
  // Fallback to creating an anchor into a disconnected document.
  if (!resolveDoc) {
    resolveDoc = document.implementation.createHTMLDocument('temp');
    resolveDoc.base = resolveDoc.createElement('base');
    resolveDoc.head.appendChild(resolveDoc.base);
    resolveDoc.anchor = resolveDoc.createElement('a');
    resolveDoc.body.appendChild(resolveDoc.anchor);
  }
  resolveDoc.base.href = baseURI;
  resolveDoc.anchor.href = url;
  return resolveDoc.anchor.href || url;

}

/**
 * Resolves any relative URL's in the given CSS text against the provided
 * `ownerDocument`'s `baseURI`.
 *
 * @param {string} cssText CSS text to process
 * @param {string} baseURI Base URI to resolve the URL against
 * @return {string} Processed CSS text with resolved URL's
 */
function resolveCss(cssText, baseURI) {
  return cssText.replace(CSS_URL_RX, function(m, pre, url, post) {
    return pre + '\'' +
      resolveUrl(url.replace(/["']/g, ''), baseURI) +
      '\'' + post;
  });
}

/**
 * Returns a path from a given `url`. The path includes the trailing
 * `/` from the url.
 *
 * @param {string} url Input URL to transform
 * @return {string} resolved path
 */
function pathFromUrl(url) {
  return url.substring(0, url.lastIndexOf('/') + 1);
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
const useShadow = !(window.ShadyDOM) || !(window.ShadyDOM.inUse);
const useNativeCSSProperties = Boolean(!window.ShadyCSS || window.ShadyCSS.nativeCss);
const supportsAdoptingStyleSheets$1 = useShadow &&
    ('adoptedStyleSheets' in Document.prototype) &&
    ('replaceSync' in CSSStyleSheet.prototype) &&
    // Since spec may change, feature detect exact API we need
    (() => {
      try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync('');
        const host = document.createElement('div');
        host.attachShadow({mode: 'open'});
        host.shadowRoot.adoptedStyleSheets = [sheet];
        return (host.shadowRoot.adoptedStyleSheets[0] === sheet);
      } catch(e) {
        return false;
      }
    })();

/**
 * Globally settable property that is automatically assigned to
 * `ElementMixin` instances, useful for binding in templates to
 * make URL's relative to an application's root.  Defaults to the main
 * document URL, but can be overridden by users.  It may be useful to set
 * `rootPath` to provide a stable application mount path when
 * using client side routing.
 */
let rootPath = window.Polymer && window.Polymer.rootPath ||
  pathFromUrl(document.baseURI || window.location.href);

/**
 * A global callback used to sanitize any value before inserting it into the DOM.
 * The callback signature is:
 *
 *  function sanitizeDOMValue(value, name, type, node) { ... }
 *
 * Where:
 *
 * `value` is the value to sanitize.
 * `name` is the name of an attribute or property (for example, href).
 * `type` indicates where the value is being inserted: one of property, attribute, or text.
 * `node` is the node where the value is being inserted.
 *
 * @type {(function(*,string,string,?Node):*)|undefined}
 */
let sanitizeDOMValue =
  window.Polymer && window.Polymer.sanitizeDOMValue || undefined;

/**
 * Globally settable property to make Polymer Gestures use passive TouchEvent listeners when recognizing gestures.
 * When set to `true`, gestures made from touch will not be able to prevent scrolling, allowing for smoother
 * scrolling performance.
 * Defaults to `false` for backwards compatibility.
 */
let passiveTouchGestures =
  window.Polymer && window.Polymer.setPassiveTouchGestures || false;

/**
 * Setting to ensure Polymer template evaluation only occurs based on tempates
 * defined in trusted script.  When true, `<dom-module>` re-registration is
 * disallowed, `<dom-bind>` is disabled, and `<dom-if>`/`<dom-repeat>`
 * templates will only evaluate in the context of a trusted element template.
 */
let strictTemplatePolicy =
  window.Polymer && window.Polymer.strictTemplatePolicy || false;

/**
 * Setting to enable dom-module lookup from Polymer.Element.  By default,
 * templates must be defined in script using the `static get template()`
 * getter and the `html` tag function.  To enable legacy loading of templates
 * via dom-module, set this flag to true.
 */
let allowTemplateFromDomModule =
  window.Polymer && window.Polymer.allowTemplateFromDomModule || false;

/**
 * Setting to skip processing style includes and re-writing urls in css styles.
 * Normally "included" styles are pulled into the element and all urls in styles
 * are re-written to be relative to the containing script url.
 * If no includes or relative urls are used in styles, these steps can be
 * skipped as an optimization.
 */
let legacyOptimizations =
  window.Polymer && window.Polymer.legacyOptimizations || false;

/**
 * Setting to add warnings useful when migrating from Polymer 1.x to 2.x.
 */
let legacyWarnings =
  window.Polymer && window.Polymer.legacyWarnings || false;

/**
 * Setting to perform initial rendering synchronously when running under ShadyDOM.
 * This matches the behavior of Polymer 1.
 */
let syncInitialRender =
  window.Polymer && window.Polymer.syncInitialRender || false;

/**
 * Setting to retain the legacy Polymer 1 behavior for multi-property
 * observers around undefined values. Observers and computed property methods
 * are not called until no argument is undefined.
 */
let legacyUndefined =
  window.Polymer && window.Polymer.legacyUndefined || false;

/**
 * Setting to ensure computed properties are computed in order to ensure
 * re-computation never occurs in a given turn.
 */
let orderedComputed =
  window.Polymer && window.Polymer.orderedComputed || false;

/**
 * Setting to remove nested templates inside `dom-if` and `dom-repeat` as
 * part of element template parsing.  This is a performance optimization that
 * eliminates most of the tax of needing two elements due to the loss of
 * type-extended templates as a result of the V1 specification changes.
 */
let removeNestedTemplates =
  window.Polymer && window.Polymer.removeNestedTemplates || false;

/**
 * Setting to place `dom-if` elements in a performance-optimized mode that takes
 * advantage of lighter-weight host runtime template stamping to eliminate the
 * need for an intermediate Templatizer `TemplateInstance` to mange the nodes
 * stamped by `dom-if`.  Under this setting, any Templatizer-provided API's
 * such as `modelForElement` will not be available for nodes stamped by
 * `dom-if`.
 */
let fastDomIf = window.Polymer && window.Polymer.fastDomIf || false;

/**
 * Setting to disable `dom-change` and `rendered-item-count` events from
 * `dom-if` and `dom-repeat`. Users can opt back into `dom-change` events by
 * setting the `notify-dom-change` attribute (`notifyDomChange: true` property)
 * to `dom-if`/`don-repeat` instances.
 */
let suppressTemplateNotifications =
  window.Polymer && window.Polymer.suppressTemplateNotifications || false;

/**
 * Setting to disable use of dynamic attributes. This is an optimization
 * to avoid setting `observedAttributes`. Instead attributes are read
 * once at create time and set/removeAttribute are patched.
 */
let legacyNoObservedAttributes =
  window.Polymer && window.Polymer.legacyNoObservedAttributes || false;

/**
 * Setting to enable use of `adoptedStyleSheets` for sharing style sheets
 * between component instances' shadow roots, if the app uses built Shady CSS
 * styles.
 */
let useAdoptedStyleSheetsWithBuiltCSS =
  window.Polymer && window.Polymer.useAdoptedStyleSheetsWithBuiltCSS || false;

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// unique global id for deduping mixins.
let dedupeId = 0;

/* eslint-disable valid-jsdoc */
/**
 * Wraps an ES6 class expression mixin such that the mixin is only applied
 * if it has not already been applied its base argument. Also memoizes mixin
 * applications.
 *
 * @template T
 * @param {T} mixin ES6 class expression mixin to wrap
 * @return {T}
 * @suppress {invalidCasts}
 */
const dedupingMixin = function(mixin) {
  let mixinApplications = /** @type {!MixinFunction} */(mixin).__mixinApplications;
  if (!mixinApplications) {
    mixinApplications = new WeakMap();
    /** @type {!MixinFunction} */(mixin).__mixinApplications = mixinApplications;
  }
  // maintain a unique id for each mixin
  let mixinDedupeId = dedupeId++;
  function dedupingMixin(base) {
    let baseSet = /** @type {!MixinFunction} */(base).__mixinSet;
    if (baseSet && baseSet[mixinDedupeId]) {
      return base;
    }
    let map = mixinApplications;
    let extended = map.get(base);
    if (!extended) {
      extended = /** @type {!Function} */(mixin)(base);
      map.set(base, extended);
      // copy inherited mixin set from the extended class, or the base class
      // NOTE: we avoid use of Set here because some browser (IE11)
      // cannot extend a base Set via the constructor.
      let mixinSet = Object.create(/** @type {!MixinFunction} */(extended).__mixinSet || baseSet || null);
      mixinSet[mixinDedupeId] = true;
      /** @type {!MixinFunction} */(extended).__mixinSet = mixinSet;
    }
    return extended;
  }

  return dedupingMixin;
};
/* eslint-enable valid-jsdoc */

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

let modules = {};
let lcModules = {};
/**
 * Sets a dom-module into the global registry by id.
 *
 * @param {string} id dom-module id
 * @param {DomModule} module dom-module instance
 * @return {void}
 */
function setModule(id, module) {
  // store id separate from lowercased id so that
  // in all cases mixedCase id will stored distinctly
  // and lowercase version is a fallback
  modules[id] = lcModules[id.toLowerCase()] = module;
}
/**
 * Retrieves a dom-module from the global registry by id.
 *
 * @param {string} id dom-module id
 * @return {DomModule!} dom-module instance
 */
function findModule(id) {
  return modules[id] || lcModules[id.toLowerCase()];
}

function styleOutsideTemplateCheck(inst) {
  if (inst.querySelector('style')) {
    console.warn('dom-module %s has style outside template', inst.id);
  }
}

/**
 * The `dom-module` element registers the dom it contains to the name given
 * by the module's id attribute. It provides a unified database of dom
 * accessible via its static `import` API.
 *
 * A key use case of `dom-module` is for providing custom element `<template>`s
 * via HTML imports that are parsed by the native HTML parser, that can be
 * relocated during a bundling pass and still looked up by `id`.
 *
 * Example:
 *
 *     <dom-module id="foo">
 *       <img src="stuff.png">
 *     </dom-module>
 *
 * Then in code in some other location that cannot access the dom-module above
 *
 *     let img = customElements.get('dom-module').import('foo', 'img');
 *
 * @customElement
 * @extends HTMLElement
 * @summary Custom element that provides a registry of relocatable DOM content
 *   by `id` that is agnostic to bundling.
 * @unrestricted
 */
class DomModule extends HTMLElement {

  /** @override */
  static get observedAttributes() { return ['id']; }

  /**
   * Retrieves the element specified by the css `selector` in the module
   * registered by `id`. For example, this.import('foo', 'img');
   * @param {string} id The id of the dom-module in which to search.
   * @param {string=} selector The css selector by which to find the element.
   * @return {Element} Returns the element which matches `selector` in the
   * module registered at the specified `id`.
   *
   * @export
   * @nocollapse Referred to indirectly in style-gather.js
   */
  static import(id, selector) {
    if (id) {
      let m = findModule(id);
      if (m && selector) {
        return m.querySelector(selector);
      }
      return m;
    }
    return null;
  }

  /* eslint-disable no-unused-vars */
  /**
   * @param {string} name Name of attribute.
   * @param {?string} old Old value of attribute.
   * @param {?string} value Current value of attribute.
   * @param {?string} namespace Attribute namespace.
   * @return {void}
   * @override
   */
  attributeChangedCallback(name, old, value, namespace) {
    if (old !== value) {
      this.register();
    }
  }
  /* eslint-enable no-unused-args */

  /**
   * The absolute URL of the original location of this `dom-module`.
   *
   * This value will differ from this element's `ownerDocument` in the
   * following ways:
   * - Takes into account any `assetpath` attribute added during bundling
   *   to indicate the original location relative to the bundled location
   * - Uses the HTMLImports polyfill's `importForElement` API to ensure
   *   the path is relative to the import document's location since
   *   `ownerDocument` is not currently polyfilled
   */
  get assetpath() {
    // Don't override existing assetpath.
    if (!this.__assetpath) {
      // note: assetpath set via an attribute must be relative to this
      // element's location; accomodate polyfilled HTMLImports
      const owner = window.HTMLImports && HTMLImports.importForElement ?
        HTMLImports.importForElement(this) || document : this.ownerDocument;
      const url = resolveUrl(
        this.getAttribute('assetpath') || '', owner.baseURI);
      this.__assetpath = pathFromUrl(url);
    }
    return this.__assetpath;
  }

  /**
   * Registers the dom-module at a given id. This method should only be called
   * when a dom-module is imperatively created. For
   * example, `document.createElement('dom-module').register('foo')`.
   * @param {string=} id The id at which to register the dom-module.
   * @return {void}
   */
  register(id) {
    id = id || this.id;
    if (id) {
      // Under strictTemplatePolicy, reject and null out any re-registered
      // dom-module since it is ambiguous whether first-in or last-in is trusted
      if (strictTemplatePolicy && findModule(id) !== undefined) {
        setModule(id, null);
        throw new Error(`strictTemplatePolicy: dom-module ${id} re-registered`);
      }
      this.id = id;
      setModule(id, this);
      styleOutsideTemplateCheck(this);
    }
  }
}

DomModule.prototype['modules'] = modules;

customElements.define('dom-module', DomModule);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const MODULE_STYLE_LINK_SELECTOR = 'link[rel=import][type~=css]';
const INCLUDE_ATTR = 'include';
const SHADY_UNSCOPED_ATTR = 'shady-unscoped';

/**
 * @param {string} moduleId .
 * @return {?DomModule} .
 */
function importModule(moduleId) {
  return /** @type {?DomModule} */(DomModule.import(moduleId));
}

function styleForImport(importDoc) {
  // NOTE: polyfill affordance.
  // under the HTMLImports polyfill, there will be no 'body',
  // but the import pseudo-doc can be used directly.
  let container = importDoc.body ? importDoc.body : importDoc;
  const importCss = resolveCss(container.textContent,
    importDoc.baseURI);
  const style = document.createElement('style');
  style.textContent = importCss;
  return style;
}


/**
 * Returns a list of <style> elements in a space-separated list of `dom-module`s.
 *
 * @function
 * @param {string} moduleIds List of dom-module id's within which to
 * search for css.
 * @return {!Array<!HTMLStyleElement>} Array of contained <style> elements
 */
function stylesFromModules(moduleIds) {
 const modules = moduleIds.trim().split(/\s+/);
 const styles = [];
 for (let i=0; i < modules.length; i++) {
   styles.push(...stylesFromModule(modules[i]));
 }
 return styles;
}

/**
 * Returns a list of <style> elements in a given `dom-module`.
 * Styles in a `dom-module` can come either from `<style>`s within the
 * first `<template>`, or else from one or more
 * `<link rel="import" type="css">` links outside the template.
 *
 * @param {string} moduleId dom-module id to gather styles from
 * @return {!Array<!HTMLStyleElement>} Array of contained styles.
 */
function stylesFromModule(moduleId) {
  const m = importModule(moduleId);

  if (!m) {
    console.warn('Could not find style data in module named', moduleId);
    return [];
  }

  if (m._styles === undefined) {
    const styles = [];
    // module imports: <link rel="import" type="css">
    styles.push(..._stylesFromModuleImports(m));
    // include css from the first template in the module
    const template = /** @type {?HTMLTemplateElement} */(
        m.querySelector('template'));
    if (template) {
      styles.push(...stylesFromTemplate(template,
        /** @type {templateWithAssetPath} */(m).assetpath));
    }

    m._styles = styles;
  }

  return m._styles;
}

/**
 * Returns the `<style>` elements within a given template.
 *
 * @param {!HTMLTemplateElement} template Template to gather styles from
 * @param {string=} baseURI baseURI for style content
 * @return {!Array<!HTMLStyleElement>} Array of styles
 */
function stylesFromTemplate(template, baseURI) {
  if (!template._styles) {
    const styles = [];
    // if element is a template, get content from its .content
    const e$ = template.content.querySelectorAll('style');
    for (let i=0; i < e$.length; i++) {
      let e = e$[i];
      // support style sharing by allowing styles to "include"
      // other dom-modules that contain styling
      let include = e.getAttribute(INCLUDE_ATTR);
      if (include) {
        styles.push(...stylesFromModules(include).filter(function(item, index, self) {
          return self.indexOf(item) === index;
        }));
      }
      if (baseURI) {
        e.textContent =
            resolveCss(e.textContent, /** @type {string} */ (baseURI));
      }
      styles.push(e);
    }
    template._styles = styles;
  }
  return template._styles;
}

/**
 * Returns a list of <style> elements  from stylesheets loaded via `<link rel="import" type="css">` links within the specified `dom-module`.
 *
 * @param {string} moduleId Id of `dom-module` to gather CSS from
 * @return {!Array<!HTMLStyleElement>} Array of contained styles.
 */
function stylesFromModuleImports(moduleId) {
 let m = importModule(moduleId);
 return m ? _stylesFromModuleImports(m) : [];
}

/**
 * @param {!HTMLElement} module dom-module element that could contain `<link rel="import" type="css">` styles
 * @return {!Array<!HTMLStyleElement>} Array of contained styles
 */
function _stylesFromModuleImports(module) {
  const styles = [];
  const p$ = module.querySelectorAll(MODULE_STYLE_LINK_SELECTOR);
  for (let i=0; i < p$.length; i++) {
    let p = p$[i];
    if (p.import) {
      const importDoc = p.import;
      const unscoped = p.hasAttribute(SHADY_UNSCOPED_ATTR);
      if (unscoped && !importDoc._unscopedStyle) {
        const style = styleForImport(importDoc);
        style.setAttribute(SHADY_UNSCOPED_ATTR, '');
        importDoc._unscopedStyle = style;
      } else if (!importDoc._style) {
        importDoc._style = styleForImport(importDoc);
      }
      styles.push(unscoped ? importDoc._unscopedStyle : importDoc._style);
    }
  }
  return styles;
}

/**
 *
 * Returns CSS text of styles in a space-separated list of `dom-module`s.
 * Note: This method is deprecated, use `stylesFromModules` instead.
 *
 * @deprecated
 * @param {string} moduleIds List of dom-module id's within which to
 * search for css.
 * @return {string} Concatenated CSS content from specified `dom-module`s
 */
function cssFromModules(moduleIds) {
 let modules = moduleIds.trim().split(/\s+/);
 let cssText = '';
 for (let i=0; i < modules.length; i++) {
   cssText += cssFromModule(modules[i]);
 }
 return cssText;
}

/**
 * Returns CSS text of styles in a given `dom-module`.  CSS in a `dom-module`
 * can come either from `<style>`s within the first `<template>`, or else
 * from one or more `<link rel="import" type="css">` links outside the
 * template.
 *
 * Any `<styles>` processed are removed from their original location.
 * Note: This method is deprecated, use `styleFromModule` instead.
 *
 * @deprecated
 * @param {string} moduleId dom-module id to gather styles from
 * @return {string} Concatenated CSS content from specified `dom-module`
 */
function cssFromModule(moduleId) {
  let m = importModule(moduleId);
  if (m && m._cssText === undefined) {
    // module imports: <link rel="import" type="css">
    let cssText = _cssFromModuleImports(m);
    // include css from the first template in the module
    let t = /** @type {?HTMLTemplateElement} */(m.querySelector('template'));
    if (t) {
      cssText += cssFromTemplate(t,
        /** @type {templateWithAssetPath} */(m).assetpath);
    }
    m._cssText = cssText || null;
  }
  if (!m) {
    console.warn('Could not find style data in module named', moduleId);
  }
  return m && m._cssText || '';
}

/**
 * Returns CSS text of `<styles>` within a given template.
 *
 * Any `<styles>` processed are removed from their original location.
 * Note: This method is deprecated, use `styleFromTemplate` instead.
 *
 * @deprecated
 * @param {!HTMLTemplateElement} template Template to gather styles from
 * @param {string} baseURI Base URI to resolve the URL against
 * @return {string} Concatenated CSS content from specified template
 */
function cssFromTemplate(template, baseURI) {
  let cssText = '';
  const e$ = stylesFromTemplate(template, baseURI);
  // if element is a template, get content from its .content
  for (let i=0; i < e$.length; i++) {
    let e = e$[i];
    if (e.parentNode) {
      e.parentNode.removeChild(e);
    }
    cssText += e.textContent;
  }
  return cssText;
}

/**
 * @deprecated
 * @param {!HTMLElement} module dom-module element that could contain `<link rel="import" type="css">` styles
 * @return {string} Concatenated CSS content from links in the dom-module
 */
function _cssFromModuleImports(module) {
  let cssText = '';
  let styles = _stylesFromModuleImports(module);
  for (let i=0; i < styles.length; i++) {
    cssText += styles[i].textContent;
  }
  return cssText;
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/* eslint-disable valid-jsdoc */
/**
 * Node wrapper to ensure ShadowDOM safe operation regardless of polyfill
 * presence or mode. Note that with the introduction of `ShadyDOM.noPatch`,
 * a node wrapper must be used to access ShadowDOM API.
 * This is similar to using `Polymer.dom` but relies exclusively
 * on the presence of the ShadyDOM polyfill rather than requiring the loading
 * of legacy (Polymer.dom) API.
 * @type {function(Node):Node}
 */
const wrap$1 = (window['ShadyDOM'] && window['ShadyDOM']['noPatch'] && window['ShadyDOM']['wrap']) ?
  window['ShadyDOM']['wrap'] :
  (window['ShadyDOM'] ? (n) => ShadyDOM['patch'](n) : (n) => n);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Module with utilities for manipulating structured data path strings.
 *
 * @summary Module with utilities for manipulating structured data path strings.
 */

/**
 * Returns true if the given string is a structured data path (has dots).
 *
 * Example:
 *
 * ```
 * isPath('foo.bar.baz') // true
 * isPath('foo')         // false
 * ```
 *
 * @param {string} path Path string
 * @return {boolean} True if the string contained one or more dots
 */
function isPath(path) {
  return path.indexOf('.') >= 0;
}

/**
 * Returns the root property name for the given path.
 *
 * Example:
 *
 * ```
 * root('foo.bar.baz') // 'foo'
 * root('foo')         // 'foo'
 * ```
 *
 * @param {string} path Path string
 * @return {string} Root property name
 */
function root(path) {
  let dotIndex = path.indexOf('.');
  if (dotIndex === -1) {
    return path;
  }
  return path.slice(0, dotIndex);
}

/**
 * Given `base` is `foo.bar`, `foo` is an ancestor, `foo.bar` is not
 * Returns true if the given path is an ancestor of the base path.
 *
 * Example:
 *
 * ```
 * isAncestor('foo.bar', 'foo')         // true
 * isAncestor('foo.bar', 'foo.bar')     // false
 * isAncestor('foo.bar', 'foo.bar.baz') // false
 * ```
 *
 * @param {string} base Path string to test against.
 * @param {string} path Path string to test.
 * @return {boolean} True if `path` is an ancestor of `base`.
 */
function isAncestor(base, path) {
  //     base.startsWith(path + '.');
  return base.indexOf(path + '.') === 0;
}

/**
 * Given `base` is `foo.bar`, `foo.bar.baz` is an descendant
 *
 * Example:
 *
 * ```
 * isDescendant('foo.bar', 'foo.bar.baz') // true
 * isDescendant('foo.bar', 'foo.bar')     // false
 * isDescendant('foo.bar', 'foo')         // false
 * ```
 *
 * @param {string} base Path string to test against.
 * @param {string} path Path string to test.
 * @return {boolean} True if `path` is a descendant of `base`.
 */
function isDescendant(base, path) {
  //     path.startsWith(base + '.');
  return path.indexOf(base + '.') === 0;
}

/**
 * Replaces a previous base path with a new base path, preserving the
 * remainder of the path.
 *
 * User must ensure `path` has a prefix of `base`.
 *
 * Example:
 *
 * ```
 * translate('foo.bar', 'zot', 'foo.bar.baz') // 'zot.baz'
 * ```
 *
 * @param {string} base Current base string to remove
 * @param {string} newBase New base string to replace with
 * @param {string} path Path to translate
 * @return {string} Translated string
 */
function translate(base, newBase, path) {
  return newBase + path.slice(base.length);
}

/**
 * @param {string} base Path string to test against
 * @param {string} path Path string to test
 * @return {boolean} True if `path` is equal to `base`
 */
function matches(base, path) {
  return (base === path) ||
         isAncestor(base, path) ||
         isDescendant(base, path);
}

/**
 * Converts array-based paths to flattened path.  String-based paths
 * are returned as-is.
 *
 * Example:
 *
 * ```
 * normalize(['foo.bar', 0, 'baz'])  // 'foo.bar.0.baz'
 * normalize('foo.bar.0.baz')        // 'foo.bar.0.baz'
 * ```
 *
 * @param {string | !Array<string|number>} path Input path
 * @return {string} Flattened path
 */
function normalize(path) {
  if (Array.isArray(path)) {
    let parts = [];
    for (let i=0; i<path.length; i++) {
      let args = path[i].toString().split('.');
      for (let j=0; j<args.length; j++) {
        parts.push(args[j]);
      }
    }
    return parts.join('.');
  } else {
    return path;
  }
}

/**
 * Splits a path into an array of property names. Accepts either arrays
 * of path parts or strings.
 *
 * Example:
 *
 * ```
 * split(['foo.bar', 0, 'baz'])  // ['foo', 'bar', '0', 'baz']
 * split('foo.bar.0.baz')        // ['foo', 'bar', '0', 'baz']
 * ```
 *
 * @param {string | !Array<string|number>} path Input path
 * @return {!Array<string>} Array of path parts
 * @suppress {checkTypes}
 */
function split(path) {
  if (Array.isArray(path)) {
    return normalize(path).split('.');
  }
  return path.toString().split('.');
}

/**
 * Reads a value from a path.  If any sub-property in the path is `undefined`,
 * this method returns `undefined` (will never throw.
 *
 * @param {Object} root Object from which to dereference path from
 * @param {string | !Array<string|number>} path Path to read
 * @param {Object=} info If an object is provided to `info`, the normalized
 *  (flattened) path will be set to `info.path`.
 * @return {*} Value at path, or `undefined` if the path could not be
 *  fully dereferenced.
 */
function get(root, path, info) {
  let prop = root;
  let parts = split(path);
  // Loop over path parts[0..n-1] and dereference
  for (let i=0; i<parts.length; i++) {
    if (!prop) {
      return;
    }
    let part = parts[i];
    prop = prop[part];
  }
  if (info) {
    info.path = parts.join('.');
  }
  return prop;
}

/**
 * Sets a value to a path.  If any sub-property in the path is `undefined`,
 * this method will no-op.
 *
 * @param {Object} root Object from which to dereference path from
 * @param {string | !Array<string|number>} path Path to set
 * @param {*} value Value to set to path
 * @return {string | undefined} The normalized version of the input path
 */
function set(root, path, value) {
  let prop = root;
  let parts = split(path);
  let last = parts[parts.length-1];
  if (parts.length > 1) {
    // Loop over path parts[0..n-2] and dereference
    for (let i=0; i<parts.length-1; i++) {
      let part = parts[i];
      prop = prop[part];
      if (!prop) {
        return;
      }
    }
    // Set value to object at end of path
    prop[last] = value;
  } else {
    // Simple property set
    prop[path] = value;
  }
  return parts.join('.');
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const caseMap = {};
const DASH_TO_CAMEL = /-[a-z]/g;
const CAMEL_TO_DASH = /([A-Z])/g;

/**
 * @fileoverview Module with utilities for converting between "dash-case" and
 * "camelCase" identifiers.
 */

/**
 * Converts "dash-case" identifier (e.g. `foo-bar-baz`) to "camelCase"
 * (e.g. `fooBarBaz`).
 *
 * @param {string} dash Dash-case identifier
 * @return {string} Camel-case representation of the identifier
 */
function dashToCamelCase(dash) {
  return caseMap[dash] || (
    caseMap[dash] = dash.indexOf('-') < 0 ? dash : dash.replace(DASH_TO_CAMEL,
      (m) => m[1].toUpperCase()
    )
  );
}

/**
 * Converts "camelCase" identifier (e.g. `fooBarBaz`) to "dash-case"
 * (e.g. `foo-bar-baz`).
 *
 * @param {string} camel Camel-case identifier
 * @return {string} Dash-case representation of the identifier
 */
function camelToDashCase(camel) {
  return caseMap[camel] || (
    caseMap[camel] = camel.replace(CAMEL_TO_DASH, '-$1').toLowerCase()
  );
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// Microtask implemented using Mutation Observer
let microtaskCurrHandle = 0;
let microtaskLastHandle = 0;
let microtaskCallbacks = [];
let microtaskNodeContent = 0;
let microtaskScheduled = false;
let microtaskNode = document.createTextNode('');
new window.MutationObserver(microtaskFlush).observe(microtaskNode, {characterData: true});

function microtaskFlush() {
  microtaskScheduled = false;
  const len = microtaskCallbacks.length;
  for (let i = 0; i < len; i++) {
    let cb = microtaskCallbacks[i];
    if (cb) {
      try {
        cb();
      } catch (e) {
        setTimeout(() => { throw e; });
      }
    }
  }
  microtaskCallbacks.splice(0, len);
  microtaskLastHandle += len;
}

/**
 * Async interface wrapper around `setTimeout`.
 *
 * @namespace
 * @summary Async interface wrapper around `setTimeout`.
 */
const timeOut = {
  /**
   * Returns a sub-module with the async interface providing the provided
   * delay.
   *
   * @memberof timeOut
   * @param {number=} delay Time to wait before calling callbacks in ms
   * @return {!AsyncInterface} An async timeout interface
   */
  after(delay) {
    return {
      run(fn) { return window.setTimeout(fn, delay); },
      cancel(handle) {
        window.clearTimeout(handle);
      }
    };
  },
  /**
   * Enqueues a function called in the next task.
   *
   * @memberof timeOut
   * @param {!Function} fn Callback to run
   * @param {number=} delay Delay in milliseconds
   * @return {number} Handle used for canceling task
   */
  run(fn, delay) {
    return window.setTimeout(fn, delay);
  },
  /**
   * Cancels a previously enqueued `timeOut` callback.
   *
   * @memberof timeOut
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */
  cancel(handle) {
    window.clearTimeout(handle);
  }
};

/**
 * Async interface for enqueuing callbacks that run at microtask timing.
 *
 * Note that microtask timing is achieved via a single `MutationObserver`,
 * and thus callbacks enqueued with this API will all run in a single
 * batch, and not interleaved with other microtasks such as promises.
 * Promises are avoided as an implementation choice for the time being
 * due to Safari bugs that cause Promises to lack microtask guarantees.
 *
 * @namespace
 * @summary Async interface for enqueuing callbacks that run at microtask
 *   timing.
 */
const microTask = {

  /**
   * Enqueues a function called at microtask timing.
   *
   * @memberof microTask
   * @param {!Function=} callback Callback to run
   * @return {number} Handle used for canceling task
   */
  run(callback) {
    if (!microtaskScheduled) {
      microtaskScheduled = true;
      microtaskNode.textContent = microtaskNodeContent++;
    }
    microtaskCallbacks.push(callback);
    return microtaskCurrHandle++;
  },

  /**
   * Cancels a previously enqueued `microTask` callback.
   *
   * @memberof microTask
   * @param {number} handle Handle returned from `run` of callback to cancel
   * @return {void}
   */
  cancel(handle) {
    const idx = handle - microtaskLastHandle;
    if (idx >= 0) {
      if (!microtaskCallbacks[idx]) {
        throw new Error('invalid async handle: ' + handle);
      }
      microtaskCallbacks[idx] = null;
    }
  }

};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/** @const {!AsyncInterface} */
const microtask = microTask;

/**
 * Element class mixin that provides basic meta-programming for creating one
 * or more property accessors (getter/setter pair) that enqueue an async
 * (batched) `_propertiesChanged` callback.
 *
 * For basic usage of this mixin, call `MyClass.createProperties(props)`
 * once at class definition time to create property accessors for properties
 * named in props, implement `_propertiesChanged` to react as desired to
 * property changes, and implement `static get observedAttributes()` and
 * include lowercase versions of any property names that should be set from
 * attributes. Last, call `this._enableProperties()` in the element's
 * `connectedCallback` to enable the accessors.
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin for reacting to property changes from
 *   generated property accessors.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const PropertiesChanged = dedupingMixin(
    /**
     * @template T
     * @param {function(new:T)} superClass Class to apply mixin to.
     * @return {function(new:T)} superClass with mixin applied.
     */
    (superClass) => {

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_PropertiesChanged}
   * @unrestricted
   */
  class PropertiesChanged extends superClass {

    /**
     * Creates property accessors for the given property names.
     * @param {!Object} props Object whose keys are names of accessors.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createProperties(props) {
      const proto = this.prototype;
      for (let prop in props) {
        // don't stomp an existing accessor
        if (!(prop in proto)) {
          proto._createPropertyAccessor(prop);
        }
      }
    }

    /**
     * Returns an attribute name that corresponds to the given property.
     * The attribute name is the lowercased property name. Override to
     * customize this mapping.
     * @param {string} property Property to convert
     * @return {string} Attribute name corresponding to the given property.
     *
     * @protected
     * @nocollapse
     */
    static attributeNameForProperty(property) {
      return property.toLowerCase();
    }

    /**
     * Override point to provide a type to which to deserialize a value to
     * a given property.
     * @param {string} name Name of property
     *
     * @protected
     * @nocollapse
     */
    static typeForProperty(name) { } //eslint-disable-line no-unused-vars

    /**
     * Creates a setter/getter pair for the named property with its own
     * local storage.  The getter returns the value in the local storage,
     * and the setter calls `_setProperty`, which updates the local storage
     * for the property and enqueues a `_propertiesChanged` callback.
     *
     * This method may be called on a prototype or an instance.  Calling
     * this method may overwrite a property value that already exists on
     * the prototype/instance by creating the accessor.
     *
     * @param {string} property Name of the property
     * @param {boolean=} readOnly When true, no setter is created; the
     *   protected `_setProperty` function must be used to set the property
     * @return {void}
     * @protected
     * @override
     */
    _createPropertyAccessor(property, readOnly) {
      this._addPropertyToAttributeMap(property);
      if (!this.hasOwnProperty(JSCompiler_renameProperty('__dataHasAccessor', this))) {
        this.__dataHasAccessor = Object.assign({}, this.__dataHasAccessor);
      }
      if (!this.__dataHasAccessor[property]) {
        this.__dataHasAccessor[property] = true;
        this._definePropertyAccessor(property, readOnly);
      }
    }

    /**
     * Adds the given `property` to a map matching attribute names
     * to property names, using `attributeNameForProperty`. This map is
     * used when deserializing attribute values to properties.
     *
     * @param {string} property Name of the property
     * @override
     */
    _addPropertyToAttributeMap(property) {
      if (!this.hasOwnProperty(JSCompiler_renameProperty('__dataAttributes', this))) {
        this.__dataAttributes = Object.assign({}, this.__dataAttributes);
      }
      // This check is technically not correct; it's an optimization that
      // assumes that if a _property_ name is already in the map (note this is
      // an attr->property map), the property mapped directly to the attribute
      // and it has already been mapped.  This would fail if
      // `attributeNameForProperty` were overridden such that this was not the
      // case.
      let attr = this.__dataAttributes[property];
      if (!attr) {
        attr = this.constructor.attributeNameForProperty(property);
        this.__dataAttributes[attr] = property;
      }
      return attr;
    }

    /**
     * Defines a property accessor for the given property.
     * @param {string} property Name of the property
     * @param {boolean=} readOnly When true, no setter is created
     * @return {void}
     * @override
     */
     _definePropertyAccessor(property, readOnly) {
      Object.defineProperty(this, property, {
        /* eslint-disable valid-jsdoc */
        /** @this {PropertiesChanged} */
        get() {
          // Inline for perf instead of using `_getProperty`
          return this.__data[property];
        },
        /** @this {PropertiesChanged} */
        set: readOnly ? function () {} : function (value) {
          // Inline for perf instead of using `_setProperty`
          if (this._setPendingProperty(property, value, true)) {
            this._invalidateProperties();
          }
        }
        /* eslint-enable */
      });
    }

    constructor() {
      super();
      /** @type {boolean} */
      this.__dataEnabled = false;
      this.__dataReady = false;
      this.__dataInvalid = false;
      this.__data = {};
      this.__dataPending = null;
      this.__dataOld = null;
      this.__dataInstanceProps = null;
      /** @type {number} */
      // NOTE: used to track re-entrant calls to `_flushProperties`
      this.__dataCounter = 0;
      this.__serializing = false;
      this._initializeProperties();
    }

    /**
     * Lifecycle callback called when properties are enabled via
     * `_enableProperties`.
     *
     * Users may override this function to implement behavior that is
     * dependent on the element having its property data initialized, e.g.
     * from defaults (initialized from `constructor`, `_initializeProperties`),
     * `attributeChangedCallback`, or values propagated from host e.g. via
     * bindings.  `super.ready()` must be called to ensure the data system
     * becomes enabled.
     *
     * @return {void}
     * @public
     * @override
     */
    ready() {
      this.__dataReady = true;
      this._flushProperties();
    }

    /**
     * Initializes the local storage for property accessors.
     *
     * Provided as an override point for performing any setup work prior
     * to initializing the property accessor system.
     *
     * @return {void}
     * @protected
     * @override
     */
    _initializeProperties() {
      // Capture instance properties; these will be set into accessors
      // during first flush. Don't set them here, since we want
      // these to overwrite defaults/constructor assignments
      for (let p in this.__dataHasAccessor) {
        if (this.hasOwnProperty(p)) {
          this.__dataInstanceProps = this.__dataInstanceProps || {};
          this.__dataInstanceProps[p] = this[p];
          delete this[p];
        }
      }
    }

    /**
     * Called at ready time with bag of instance properties that overwrote
     * accessors when the element upgraded.
     *
     * The default implementation sets these properties back into the
     * setter at ready time.  This method is provided as an override
     * point for customizing or providing more efficient initialization.
     *
     * @param {Object} props Bag of property values that were overwritten
     *   when creating property accessors.
     * @return {void}
     * @protected
     * @override
     */
    _initializeInstanceProperties(props) {
      Object.assign(this, props);
    }

    /**
     * Updates the local storage for a property (via `_setPendingProperty`)
     * and enqueues a `_proeprtiesChanged` callback.
     *
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @return {void}
     * @protected
     * @override
     */
    _setProperty(property, value) {
      if (this._setPendingProperty(property, value)) {
        this._invalidateProperties();
      }
    }

    /**
     * Returns the value for the given property.
     * @param {string} property Name of property
     * @return {*} Value for the given property
     * @protected
     * @override
     */
    _getProperty(property) {
      return this.__data[property];
    }

    /* eslint-disable no-unused-vars */
    /**
     * Updates the local storage for a property, records the previous value,
     * and adds it to the set of "pending changes" that will be passed to the
     * `_propertiesChanged` callback.  This method does not enqueue the
     * `_propertiesChanged` callback.
     *
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @param {boolean=} ext Not used here; affordance for closure
     * @return {boolean} Returns true if the property changed
     * @protected
     * @override
     */
    _setPendingProperty(property, value, ext) {
      let old = this.__data[property];
      let changed = this._shouldPropertyChange(property, value, old);
      if (changed) {
        if (!this.__dataPending) {
          this.__dataPending = {};
          this.__dataOld = {};
        }
        // Ensure old is captured from the last turn
        if (this.__dataOld && !(property in this.__dataOld)) {
          this.__dataOld[property] = old;
        }
        this.__data[property] = value;
        this.__dataPending[property] = value;
      }
      return changed;
    }
    /* eslint-enable */

    /**
     * @param {string} property Name of the property
     * @return {boolean} Returns true if the property is pending.
     */
    _isPropertyPending(property) {
      return !!(this.__dataPending && this.__dataPending.hasOwnProperty(property));
    }

    /**
     * Marks the properties as invalid, and enqueues an async
     * `_propertiesChanged` callback.
     *
     * @return {void}
     * @protected
     * @override
     */
    _invalidateProperties() {
      if (!this.__dataInvalid && this.__dataReady) {
        this.__dataInvalid = true;
        microtask.run(() => {
          if (this.__dataInvalid) {
            this.__dataInvalid = false;
            this._flushProperties();
          }
        });
      }
    }

    /**
     * Call to enable property accessor processing. Before this method is
     * called accessor values will be set but side effects are
     * queued. When called, any pending side effects occur immediately.
     * For elements, generally `connectedCallback` is a normal spot to do so.
     * It is safe to call this method multiple times as it only turns on
     * property accessors once.
     *
     * @return {void}
     * @protected
     * @override
     */
    _enableProperties() {
      if (!this.__dataEnabled) {
        this.__dataEnabled = true;
        if (this.__dataInstanceProps) {
          this._initializeInstanceProperties(this.__dataInstanceProps);
          this.__dataInstanceProps = null;
        }
        this.ready();
      }
    }

    /**
     * Calls the `_propertiesChanged` callback with the current set of
     * pending changes (and old values recorded when pending changes were
     * set), and resets the pending set of changes. Generally, this method
     * should not be called in user code.
     *
     * @return {void}
     * @protected
     * @override
     */
    _flushProperties() {
      this.__dataCounter++;
      const props = this.__data;
      const changedProps = this.__dataPending;
      const old = this.__dataOld;
      if (this._shouldPropertiesChange(props, changedProps, old)) {
        this.__dataPending = null;
        this.__dataOld = null;
        this._propertiesChanged(props, changedProps, old);
      }
      this.__dataCounter--;
    }

    /**
     * Called in `_flushProperties` to determine if `_propertiesChanged`
     * should be called. The default implementation returns true if
     * properties are pending. Override to customize when
     * `_propertiesChanged` is called.
     * @param {!Object} currentProps Bag of all current accessor values
     * @param {?Object} changedProps Bag of properties changed since the last
     *   call to `_propertiesChanged`
     * @param {?Object} oldProps Bag of previous values for each property
     *   in `changedProps`
     * @return {boolean} true if changedProps is truthy
     * @override
     */
    _shouldPropertiesChange(currentProps, changedProps, oldProps) { // eslint-disable-line no-unused-vars
      return Boolean(changedProps);
    }

    /**
     * Callback called when any properties with accessors created via
     * `_createPropertyAccessor` have been set.
     *
     * @param {!Object} currentProps Bag of all current accessor values
     * @param {?Object} changedProps Bag of properties changed since the last
     *   call to `_propertiesChanged`
     * @param {?Object} oldProps Bag of previous values for each property
     *   in `changedProps`
     * @return {void}
     * @protected
     * @override
     */
    _propertiesChanged(currentProps, changedProps, oldProps) { // eslint-disable-line no-unused-vars
    }

    /**
     * Method called to determine whether a property value should be
     * considered as a change and cause the `_propertiesChanged` callback
     * to be enqueued.
     *
     * The default implementation returns `true` if a strict equality
     * check fails. The method always returns false for `NaN`.
     *
     * Override this method to e.g. provide stricter checking for
     * Objects/Arrays when using immutable patterns.
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     *   and enqueue a `_proeprtiesChanged` callback
     * @protected
     * @override
     */
    _shouldPropertyChange(property, value, old) {
      return (
        // Strict equality check
        (old !== value &&
          // This ensures (old==NaN, value==NaN) always returns false
          (old === old || value === value))
      );
    }

    /**
     * Implements native Custom Elements `attributeChangedCallback` to
     * set an attribute value to a property via `_attributeToProperty`.
     *
     * @param {string} name Name of attribute that changed
     * @param {?string} old Old attribute value
     * @param {?string} value New attribute value
     * @param {?string} namespace Attribute namespace.
     * @return {void}
     * @suppress {missingProperties} Super may or may not implement the callback
     * @override
     */
    attributeChangedCallback(name, old, value, namespace) {
      if (old !== value) {
        this._attributeToProperty(name, value);
      }
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, old, value, namespace);
      }
    }

    /**
     * Deserializes an attribute to its associated property.
     *
     * This method calls the `_deserializeValue` method to convert the string to
     * a typed value.
     *
     * @param {string} attribute Name of attribute to deserialize.
     * @param {?string} value of the attribute.
     * @param {*=} type type to deserialize to, defaults to the value
     * returned from `typeForProperty`
     * @return {void}
     * @override
     */
    _attributeToProperty(attribute, value, type) {
      if (!this.__serializing) {
        const map = this.__dataAttributes;
        const property = map && map[attribute] || attribute;
        this[property] = this._deserializeValue(value, type ||
          this.constructor.typeForProperty(property));
      }
    }

    /**
     * Serializes a property to its associated attribute.
     *
     * @suppress {invalidCasts} Closure can't figure out `this` is an element.
     *
     * @param {string} property Property name to reflect.
     * @param {string=} attribute Attribute name to reflect to.
     * @param {*=} value Property value to refect.
     * @return {void}
     * @override
     */
    _propertyToAttribute(property, attribute, value) {
      this.__serializing = true;
      value = (arguments.length < 3) ? this[property] : value;
      this._valueToNodeAttribute(/** @type {!HTMLElement} */(this), value,
        attribute || this.constructor.attributeNameForProperty(property));
      this.__serializing = false;
    }

    /**
     * Sets a typed value to an HTML attribute on a node.
     *
     * This method calls the `_serializeValue` method to convert the typed
     * value to a string.  If the `_serializeValue` method returns `undefined`,
     * the attribute will be removed (this is the default for boolean
     * type `false`).
     *
     * @param {Element} node Element to set attribute to.
     * @param {*} value Value to serialize.
     * @param {string} attribute Attribute name to serialize to.
     * @return {void}
     * @override
     */
    _valueToNodeAttribute(node, value, attribute) {
      const str = this._serializeValue(value);
      if (attribute === 'class' || attribute === 'name' || attribute === 'slot') {
        node = /** @type {?Element} */(wrap$1(node));
      }
      if (str === undefined) {
        node.removeAttribute(attribute);
      } else {
        node.setAttribute(attribute, str);
      }
    }

    /**
     * Converts a typed JavaScript value to a string.
     *
     * This method is called when setting JS property values to
     * HTML attributes.  Users may override this method to provide
     * serialization for custom types.
     *
     * @param {*} value Property value to serialize.
     * @return {string | undefined} String serialized from the provided
     * property  value.
     * @override
     */
    _serializeValue(value) {
      switch (typeof value) {
        case 'boolean':
          return value ? '' : undefined;
        default:
          return value != null ? value.toString() : undefined;
      }
    }

    /**
     * Converts a string to a typed JavaScript value.
     *
     * This method is called when reading HTML attribute values to
     * JS properties.  Users may override this method to provide
     * deserialization for custom `type`s. Types for `Boolean`, `String`,
     * and `Number` convert attributes to the expected types.
     *
     * @param {?string} value Value to deserialize.
     * @param {*=} type Type to deserialize the string to.
     * @return {*} Typed value deserialized from the provided string.
     * @override
     */
    _deserializeValue(value, type) {
      switch (type) {
        case Boolean:
          return (value !== null);
        case Number:
          return Number(value);
        default:
          return value;
      }
    }

  }

  return PropertiesChanged;
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// Save map of native properties; this forms a blacklist or properties
// that won't have their values "saved" by `saveAccessorValue`, since
// reading from an HTMLElement accessor from the context of a prototype throws
const nativeProperties = {};
let proto = HTMLElement.prototype;
while (proto) {
  let props = Object.getOwnPropertyNames(proto);
  for (let i=0; i<props.length; i++) {
    nativeProperties[props[i]] = true;
  }
  proto = Object.getPrototypeOf(proto);
}

/**
 * Used to save the value of a property that will be overridden with
 * an accessor. If the `model` is a prototype, the values will be saved
 * in `__dataProto`, and it's up to the user (or downstream mixin) to
 * decide how/when to set these values back into the accessors.
 * If `model` is already an instance (it has a `__data` property), then
 * the value will be set as a pending property, meaning the user should
 * call `_invalidateProperties` or `_flushProperties` to take effect
 *
 * @param {Object} model Prototype or instance
 * @param {string} property Name of property
 * @return {void}
 * @private
 */
function saveAccessorValue(model, property) {
  // Don't read/store value for any native properties since they could throw
  if (!nativeProperties[property]) {
    let value = model[property];
    if (value !== undefined) {
      if (model.__data) {
        // Adding accessor to instance; update the property
        // It is the user's responsibility to call _flushProperties
        model._setPendingProperty(property, value);
      } else {
        // Adding accessor to proto; save proto's value for instance-time use
        if (!model.__dataProto) {
          model.__dataProto = {};
        } else if (!model.hasOwnProperty(JSCompiler_renameProperty('__dataProto', model))) {
          model.__dataProto = Object.create(model.__dataProto);
        }
        model.__dataProto[property] = value;
      }
    }
  }
}

/**
 * Element class mixin that provides basic meta-programming for creating one
 * or more property accessors (getter/setter pair) that enqueue an async
 * (batched) `_propertiesChanged` callback.
 *
 * For basic usage of this mixin:
 *
 * -   Declare attributes to observe via the standard `static get
 *     observedAttributes()`. Use `dash-case` attribute names to represent
 *     `camelCase` property names.
 * -   Implement the `_propertiesChanged` callback on the class.
 * -   Call `MyClass.createPropertiesForAttributes()` **once** on the class to
 *     generate property accessors for each observed attribute. This must be
 *     called before the first instance is created, for example, by calling it
 *     before calling `customElements.define`. It can also be called lazily from
 *     the element's `constructor`, as long as it's guarded so that the call is
 *     only made once, when the first instance is created.
 * -   Call `this._enableProperties()` in the element's `connectedCallback` to
 *     enable the accessors.
 *
 * Any `observedAttributes` will automatically be
 * deserialized via `attributeChangedCallback` and set to the associated
 * property using `dash-case`-to-`camelCase` convention.
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin PropertiesChanged
 * @summary Element class mixin for reacting to property changes from
 *   generated property accessors.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const PropertyAccessors = dedupingMixin(superClass => {

  /**
   * @constructor
   * @implements {Polymer_PropertiesChanged}
   * @unrestricted
   * @private
   */
   const base = PropertiesChanged(superClass);

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_PropertyAccessors}
   * @extends {base}
   * @unrestricted
   */
  class PropertyAccessors extends base {

    /**
     * Generates property accessors for all attributes in the standard
     * static `observedAttributes` array.
     *
     * Attribute names are mapped to property names using the `dash-case` to
     * `camelCase` convention
     *
     * @return {void}
     * @nocollapse
     */
    static createPropertiesForAttributes() {
      let a$ =  /** @type {?} */ (this).observedAttributes;
      for (let i=0; i < a$.length; i++) {
        this.prototype._createPropertyAccessor(dashToCamelCase(a$[i]));
      }
    }

    /**
     * Returns an attribute name that corresponds to the given property.
     * By default, converts camel to dash case, e.g. `fooBar` to `foo-bar`.
     * @param {string} property Property to convert
     * @return {string} Attribute name corresponding to the given property.
     *
     * @protected
     * @nocollapse
     */
    static attributeNameForProperty(property) {
      return camelToDashCase(property);
    }

    /**
     * Overrides PropertiesChanged implementation to initialize values for
     * accessors created for values that already existed on the element
     * prototype.
     *
     * @return {void}
     * @protected
     * @override
     */
    _initializeProperties() {
      if (this.__dataProto) {
        this._initializeProtoProperties(this.__dataProto);
        this.__dataProto = null;
      }
      super._initializeProperties();
    }

    /**
     * Called at instance time with bag of properties that were overwritten
     * by accessors on the prototype when accessors were created.
     *
     * The default implementation sets these properties back into the
     * setter at instance time.  This method is provided as an override
     * point for customizing or providing more efficient initialization.
     *
     * @param {Object} props Bag of property values that were overwritten
     *   when creating property accessors.
     * @return {void}
     * @protected
     * @override
     */
    _initializeProtoProperties(props) {
      for (let p in props) {
        this._setProperty(p, props[p]);
      }
    }

    /**
     * Ensures the element has the given attribute. If it does not,
     * assigns the given value to the attribute.
     *
     * @suppress {invalidCasts} Closure can't figure out `this` is infact an
     *     element
     *
     * @param {string} attribute Name of attribute to ensure is set.
     * @param {string} value of the attribute.
     * @return {void}
     * @override
     */
    _ensureAttribute(attribute, value) {
      const el = /** @type {!HTMLElement} */(this);
      if (!el.hasAttribute(attribute)) {
        this._valueToNodeAttribute(el, value, attribute);
      }
    }

    /**
     * Overrides PropertiesChanged implemention to serialize objects as JSON.
     *
     * @param {*} value Property value to serialize.
     * @return {string | undefined} String serialized from the provided property
     *     value.
     * @override
     */
    _serializeValue(value) {
      /* eslint-disable no-fallthrough */
      switch (typeof value) {
        case 'object':
          if (value instanceof Date) {
            return value.toString();
          } else if (value) {
            try {
              return JSON.stringify(value);
            } catch(x) {
              return '';
            }
          }

        default:
          return super._serializeValue(value);
      }
    }

    /**
     * Converts a string to a typed JavaScript value.
     *
     * This method is called by Polymer when reading HTML attribute values to
     * JS properties.  Users may override this method on Polymer element
     * prototypes to provide deserialization for custom `type`s.  Note,
     * the `type` argument is the value of the `type` field provided in the
     * `properties` configuration object for a given property, and is
     * by convention the constructor for the type to deserialize.
     *
     *
     * @param {?string} value Attribute value to deserialize.
     * @param {*=} type Type to deserialize the string to.
     * @return {*} Typed value deserialized from the provided string.
     * @override
     */
    _deserializeValue(value, type) {
      /**
       * @type {*}
       */
      let outValue;
      switch (type) {
        case Object:
          try {
            outValue = JSON.parse(/** @type {string} */(value));
          } catch(x) {
            // allow non-JSON literals like Strings and Numbers
            outValue = value;
          }
          break;
        case Array:
          try {
            outValue = JSON.parse(/** @type {string} */(value));
          } catch(x) {
            outValue = null;
            console.warn(`Polymer::Attributes: couldn't decode Array as JSON: ${value}`);
          }
          break;
        case Date:
          outValue = isNaN(value) ? String(value) : Number(value);
          outValue = new Date(outValue);
          break;
        default:
          outValue = super._deserializeValue(value, type);
          break;
      }
      return outValue;
    }
    /* eslint-enable no-fallthrough */

    /**
     * Overrides PropertiesChanged implementation to save existing prototype
     * property value so that it can be reset.
     * @param {string} property Name of the property
     * @param {boolean=} readOnly When true, no setter is created
     *
     * When calling on a prototype, any overwritten values are saved in
     * `__dataProto`, and it is up to the subclasser to decide how/when
     * to set those properties back into the accessor.  When calling on an
     * instance, the overwritten value is set via `_setPendingProperty`,
     * and the user should call `_invalidateProperties` or `_flushProperties`
     * for the values to take effect.
     * @protected
     * @return {void}
     * @override
     */
    _definePropertyAccessor(property, readOnly) {
      saveAccessorValue(this, property);
      super._definePropertyAccessor(property, readOnly);
    }

    /**
     * Returns true if this library created an accessor for the given property.
     *
     * @param {string} property Property name
     * @return {boolean} True if an accessor was created
     * @override
     */
    _hasAccessor(property) {
      return this.__dataHasAccessor && this.__dataHasAccessor[property];
    }

    /**
     * Returns true if the specified property has a pending change.
     *
     * @param {string} prop Property name
     * @return {boolean} True if property has a pending change
     * @protected
     * @override
     */
    _isPropertyPending(prop) {
      return Boolean(this.__dataPending && (prop in this.__dataPending));
    }

  }

  return PropertyAccessors;

});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// 1.x backwards-compatible auto-wrapper for template type extensions
// This is a clear layering violation and gives favored-nation status to
// dom-if and dom-repeat templates.  This is a conceit we're choosing to keep
// a.) to ease 1.x backwards-compatibility due to loss of `is`, and
// b.) to maintain if/repeat capability in parser-constrained elements
//     (e.g. table, select) in lieu of native CE type extensions without
//     massive new invention in this space (e.g. directive system)
const templateExtensions = {
  'dom-if': true,
  'dom-repeat': true
};

let placeholderBugDetect = false;
let placeholderBug = false;

function hasPlaceholderBug() {
  if (!placeholderBugDetect) {
    placeholderBugDetect = true;
    const t = document.createElement('textarea');
    t.placeholder = 'a';
    placeholderBug = t.placeholder === t.textContent;
  }
  return placeholderBug;
}

/**
 * Some browsers have a bug with textarea, where placeholder text is copied as
 * a textnode child of the textarea.
 *
 * If the placeholder is a binding, this can break template stamping in two
 * ways.
 *
 * One issue is that when the `placeholder` attribute is removed when the
 * binding is processed, the textnode child of the textarea is deleted, and the
 * template info tries to bind into that node.
 *
 * With `legacyOptimizations` in use, when the template is stamped and the
 * `textarea.textContent` binding is processed, no corresponding node is found
 * because it was removed during parsing. An exception is generated when this
 * binding is updated.
 *
 * With `legacyOptimizations` not in use, the template is cloned before
 * processing and this changes the above behavior. The cloned template also has
 * a value property set to the placeholder and textContent. This prevents the
 * removal of the textContent when the placeholder attribute is removed.
 * Therefore the exception does not occur. However, there is an extra
 * unnecessary binding.
 *
 * @param {!Node} node Check node for placeholder bug
 * @return {void}
 */
function fixPlaceholder(node) {
  if (hasPlaceholderBug() && node.localName === 'textarea' && node.placeholder
        && node.placeholder === node.textContent) {
    node.textContent = null;
  }
}

function wrapTemplateExtension(node) {
  let is = node.getAttribute('is');
  if (is && templateExtensions[is]) {
    let t = node;
    t.removeAttribute('is');
    node = t.ownerDocument.createElement(is);
    t.parentNode.replaceChild(node, t);
    node.appendChild(t);
    while(t.attributes.length) {
      node.setAttribute(t.attributes[0].name, t.attributes[0].value);
      t.removeAttribute(t.attributes[0].name);
    }
  }
  return node;
}

function findTemplateNode(root, nodeInfo) {
  // recursively ascend tree until we hit root
  let parent = nodeInfo.parentInfo && findTemplateNode(root, nodeInfo.parentInfo);
  // unwind the stack, returning the indexed node at each level
  if (parent) {
    // note: marginally faster than indexing via childNodes
    // (http://jsperf.com/childnodes-lookup)
    for (let n=parent.firstChild, i=0; n; n=n.nextSibling) {
      if (nodeInfo.parentIndex === i++) {
        return n;
      }
    }
  } else {
    return root;
  }
}

// construct `$` map (from id annotations)
function applyIdToMap(inst, map, node, nodeInfo) {
  if (nodeInfo.id) {
    map[nodeInfo.id] = node;
  }
}

// install event listeners (from event annotations)
function applyEventListener(inst, node, nodeInfo) {
  if (nodeInfo.events && nodeInfo.events.length) {
    for (let j=0, e$=nodeInfo.events, e; (j<e$.length) && (e=e$[j]); j++) {
      inst._addMethodEventListenerToNode(node, e.name, e.value, inst);
    }
  }
}

// push configuration references at configure time
function applyTemplateInfo(inst, node, nodeInfo, parentTemplateInfo) {
  if (nodeInfo.templateInfo) {
    // Give the node an instance of this templateInfo and set its parent
    node._templateInfo = nodeInfo.templateInfo;
    node._parentTemplateInfo = parentTemplateInfo;
  }
}

function createNodeEventHandler(context, eventName, methodName) {
  // Instances can optionally have a _methodHost which allows redirecting where
  // to find methods. Currently used by `templatize`.
  context = context._methodHost || context;
  let handler = function(e) {
    if (context[methodName]) {
      context[methodName](e, e.detail);
    } else {
      console.warn('listener method `' + methodName + '` not defined');
    }
  };
  return handler;
}

/**
 * Element mixin that provides basic template parsing and stamping, including
 * the following template-related features for stamped templates:
 *
 * - Declarative event listeners (`on-eventname="listener"`)
 * - Map of node id's to stamped node instances (`this.$.id`)
 * - Nested template content caching/removal and re-installation (performance
 *   optimization)
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin that provides basic template parsing and stamping
 */
const TemplateStamp = dedupingMixin(
    /**
     * @template T
     * @param {function(new:T)} superClass Class to apply mixin to.
     * @return {function(new:T)} superClass with mixin applied.
     */
    (superClass) => {

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_TemplateStamp}
   */
  class TemplateStamp extends superClass {

    /**
     * Scans a template to produce template metadata.
     *
     * Template-specific metadata are stored in the object returned, and node-
     * specific metadata are stored in objects in its flattened `nodeInfoList`
     * array.  Only nodes in the template that were parsed as nodes of
     * interest contain an object in `nodeInfoList`.  Each `nodeInfo` object
     * contains an `index` (`childNodes` index in parent) and optionally
     * `parent`, which points to node info of its parent (including its index).
     *
     * The template metadata object returned from this method has the following
     * structure (many fields optional):
     *
     * ```js
     *   {
     *     // Flattened list of node metadata (for nodes that generated metadata)
     *     nodeInfoList: [
     *       {
     *         // `id` attribute for any nodes with id's for generating `$` map
     *         id: {string},
     *         // `on-event="handler"` metadata
     *         events: [
     *           {
     *             name: {string},   // event name
     *             value: {string},  // handler method name
     *           }, ...
     *         ],
     *         // Notes when the template contained a `<slot>` for shady DOM
     *         // optimization purposes
     *         hasInsertionPoint: {boolean},
     *         // For nested `<template>`` nodes, nested template metadata
     *         templateInfo: {object}, // nested template metadata
     *         // Metadata to allow efficient retrieval of instanced node
     *         // corresponding to this metadata
     *         parentInfo: {number},   // reference to parent nodeInfo>
     *         parentIndex: {number},  // index in parent's `childNodes` collection
     *         infoIndex: {number},    // index of this `nodeInfo` in `templateInfo.nodeInfoList`
     *       },
     *       ...
     *     ],
     *     // When true, the template had the `strip-whitespace` attribute
     *     // or was nested in a template with that setting
     *     stripWhitespace: {boolean},
     *     // For nested templates, nested template content is moved into
     *     // a document fragment stored here; this is an optimization to
     *     // avoid the cost of nested template cloning
     *     content: {DocumentFragment}
     *   }
     * ```
     *
     * This method kicks off a recursive treewalk as follows:
     *
     * ```
     *    _parseTemplate <---------------------+
     *      _parseTemplateContent              |
     *        _parseTemplateNode  <------------|--+
     *          _parseTemplateNestedTemplate --+  |
     *          _parseTemplateChildNodes ---------+
     *          _parseTemplateNodeAttributes
     *            _parseTemplateNodeAttribute
     *
     * ```
     *
     * These methods may be overridden to add custom metadata about templates
     * to either `templateInfo` or `nodeInfo`.
     *
     * Note that this method may be destructive to the template, in that
     * e.g. event annotations may be removed after being noted in the
     * template metadata.
     *
     * @param {!HTMLTemplateElement} template Template to parse
     * @param {TemplateInfo=} outerTemplateInfo Template metadata from the outer
     *   template, for parsing nested templates
     * @return {!TemplateInfo} Parsed template metadata
     * @nocollapse
     */
    static _parseTemplate(template, outerTemplateInfo) {
      // since a template may be re-used, memo-ize metadata
      if (!template._templateInfo) {
        // TODO(rictic): fix typing
        let /** ? */ templateInfo = template._templateInfo = {};
        templateInfo.nodeInfoList = [];
        templateInfo.nestedTemplate = Boolean(outerTemplateInfo);
        templateInfo.stripWhiteSpace =
          (outerTemplateInfo && outerTemplateInfo.stripWhiteSpace) ||
          template.hasAttribute('strip-whitespace');
         // TODO(rictic): fix typing
         this._parseTemplateContent(
             template, templateInfo, /** @type {?} */ ({parent: null}));
      }
      return template._templateInfo;
    }

    /**
     * See docs for _parseTemplateNode.
     *
     * @param {!HTMLTemplateElement} template .
     * @param {!TemplateInfo} templateInfo .
     * @param {!NodeInfo} nodeInfo .
     * @return {boolean} .
     * @nocollapse
     */
    static _parseTemplateContent(template, templateInfo, nodeInfo) {
      return this._parseTemplateNode(template.content, templateInfo, nodeInfo);
    }

    /**
     * Parses template node and adds template and node metadata based on
     * the current node, and its `childNodes` and `attributes`.
     *
     * This method may be overridden to add custom node or template specific
     * metadata based on this node.
     *
     * @param {Node} node Node to parse
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNode(node, templateInfo, nodeInfo) {
      let noted = false;
      let element = /** @type {!HTMLTemplateElement} */ (node);
      if (element.localName == 'template' && !element.hasAttribute('preserve-content')) {
        noted = this._parseTemplateNestedTemplate(element, templateInfo, nodeInfo) || noted;
      } else if (element.localName === 'slot') {
        // For ShadyDom optimization, indicating there is an insertion point
        templateInfo.hasInsertionPoint = true;
      }
      fixPlaceholder(element);
      if (element.firstChild) {
        this._parseTemplateChildNodes(element, templateInfo, nodeInfo);
      }
      if (element.hasAttributes && element.hasAttributes()) {
        noted = this._parseTemplateNodeAttributes(element, templateInfo, nodeInfo) || noted;
      }
      // Checking `nodeInfo.noted` allows a child node of this node (who gets
      // access to `parentInfo`) to cause the parent to be noted, which
      // otherwise has no return path via `_parseTemplateChildNodes` (used by
      // some optimizations)
      return noted || nodeInfo.noted;
    }

    /**
     * Parses template child nodes for the given root node.
     *
     * This method also wraps whitelisted legacy template extensions
     * (`is="dom-if"` and `is="dom-repeat"`) with their equivalent element
     * wrappers, collapses text nodes, and strips whitespace from the template
     * if the `templateInfo.stripWhitespace` setting was provided.
     *
     * @param {Node} root Root node whose `childNodes` will be parsed
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {void}
     */
    static _parseTemplateChildNodes(root, templateInfo, nodeInfo) {
      if (root.localName === 'script' || root.localName === 'style') {
        return;
      }
      for (let node=root.firstChild, parentIndex=0, next; node; node=next) {
        // Wrap templates
        if (node.localName == 'template') {
          node = wrapTemplateExtension(node);
        }
        // collapse adjacent textNodes: fixes an IE issue that can cause
        // text nodes to be inexplicably split =(
        // note that root.normalize() should work but does not so we do this
        // manually.
        next = node.nextSibling;
        if (node.nodeType === Node.TEXT_NODE) {
          let /** Node */ n = next;
          while (n && (n.nodeType === Node.TEXT_NODE)) {
            node.textContent += n.textContent;
            next = n.nextSibling;
            root.removeChild(n);
            n = next;
          }
          // optionally strip whitespace
          if (templateInfo.stripWhiteSpace && !node.textContent.trim()) {
            root.removeChild(node);
            continue;
          }
        }
        let childInfo =
            /** @type {!NodeInfo} */ ({parentIndex, parentInfo: nodeInfo});
        if (this._parseTemplateNode(node, templateInfo, childInfo)) {
          childInfo.infoIndex = templateInfo.nodeInfoList.push(childInfo) - 1;
        }
        // Increment if not removed
        if (node.parentNode) {
          parentIndex++;
        }
      }
    }

    /**
     * Parses template content for the given nested `<template>`.
     *
     * Nested template info is stored as `templateInfo` in the current node's
     * `nodeInfo`. `template.content` is removed and stored in `templateInfo`.
     * It will then be the responsibility of the host to set it back to the
     * template and for users stamping nested templates to use the
     * `_contentForTemplate` method to retrieve the content for this template
     * (an optimization to avoid the cost of cloning nested template content).
     *
     * @param {HTMLTemplateElement} node Node to parse (a <template>)
     * @param {TemplateInfo} outerTemplateInfo Template metadata for current template
     *   that includes the template `node`
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNestedTemplate(node, outerTemplateInfo, nodeInfo) {
      // TODO(rictic): the type of node should be non-null
      let element = /** @type {!HTMLTemplateElement} */ (node);
      let templateInfo = this._parseTemplate(element, outerTemplateInfo);
      let content = templateInfo.content =
          element.content.ownerDocument.createDocumentFragment();
      content.appendChild(element.content);
      nodeInfo.templateInfo = templateInfo;
      return true;
    }

    /**
     * Parses template node attributes and adds node metadata to `nodeInfo`
     * for nodes of interest.
     *
     * @param {Element} node Node to parse
     * @param {!TemplateInfo} templateInfo Template metadata for current
     *     template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNodeAttributes(node, templateInfo, nodeInfo) {
      // Make copy of original attribute list, since the order may change
      // as attributes are added and removed
      let noted = false;
      let attrs = Array.from(node.attributes);
      for (let i=attrs.length-1, a; (a=attrs[i]); i--) {
        noted = this._parseTemplateNodeAttribute(node, templateInfo, nodeInfo, a.name, a.value) || noted;
      }
      return noted;
    }

    /**
     * Parses a single template node attribute and adds node metadata to
     * `nodeInfo` for attributes of interest.
     *
     * This implementation adds metadata for `on-event="handler"` attributes
     * and `id` attributes.
     *
     * @param {Element} node Node to parse
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @param {string} name Attribute name
     * @param {string} value Attribute value
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @nocollapse
     */
    static _parseTemplateNodeAttribute(node, templateInfo, nodeInfo, name, value) {
      // events (on-*)
      if (name.slice(0, 3) === 'on-') {
        node.removeAttribute(name);
        nodeInfo.events = nodeInfo.events || [];
        nodeInfo.events.push({
          name: name.slice(3),
          value
        });
        return true;
      }
      // static id
      else if (name === 'id') {
        nodeInfo.id = value;
        return true;
      }
      return false;
    }

    /**
     * Returns the `content` document fragment for a given template.
     *
     * For nested templates, Polymer performs an optimization to cache nested
     * template content to avoid the cost of cloning deeply nested templates.
     * This method retrieves the cached content for a given template.
     *
     * @param {HTMLTemplateElement} template Template to retrieve `content` for
     * @return {DocumentFragment} Content fragment
     * @nocollapse
     */
    static _contentForTemplate(template) {
      let templateInfo = /** @type {HTMLTemplateElementWithInfo} */ (template)._templateInfo;
      return (templateInfo && templateInfo.content) || template.content;
    }

    /**
     * Clones the provided template content and returns a document fragment
     * containing the cloned dom.
     *
     * The template is parsed (once and memoized) using this library's
     * template parsing features, and provides the following value-added
     * features:
     * * Adds declarative event listeners for `on-event="handler"` attributes
     * * Generates an "id map" for all nodes with id's under `$` on returned
     *   document fragment
     * * Passes template info including `content` back to templates as
     *   `_templateInfo` (a performance optimization to avoid deep template
     *   cloning)
     *
     * Note that the memoized template parsing process is destructive to the
     * template: attributes for bindings and declarative event listeners are
     * removed after being noted in notes, and any nested `<template>.content`
     * is removed and stored in notes as well.
     *
     * @param {!HTMLTemplateElement} template Template to stamp
     * @param {TemplateInfo=} templateInfo Optional template info associated
     *   with the template to be stamped; if omitted the template will be
     *   automatically parsed.
     * @return {!StampedTemplate} Cloned template content
     * @override
     */
    _stampTemplate(template, templateInfo) {
      // Polyfill support: bootstrap the template if it has not already been
      if (template && !template.content &&
          window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
        HTMLTemplateElement.decorate(template);
      }
      // Accepting the `templateInfo` via an argument allows for creating
      // instances of the `templateInfo` by the caller, useful for adding
      // instance-time information to the prototypical data
      templateInfo = templateInfo || this.constructor._parseTemplate(template);
      let nodeInfo = templateInfo.nodeInfoList;
      let content = templateInfo.content || template.content;
      let dom = /** @type {DocumentFragment} */ (document.importNode(content, true));
      // NOTE: ShadyDom optimization indicating there is an insertion point
      dom.__noInsertionPoint = !templateInfo.hasInsertionPoint;
      let nodes = dom.nodeList = new Array(nodeInfo.length);
      dom.$ = {};
      for (let i=0, l=nodeInfo.length, info; (i<l) && (info=nodeInfo[i]); i++) {
        let node = nodes[i] = findTemplateNode(dom, info);
        applyIdToMap(this, dom.$, node, info);
        applyTemplateInfo(this, node, info, templateInfo);
        applyEventListener(this, node, info);
      }
      dom = /** @type {!StampedTemplate} */(dom); // eslint-disable-line no-self-assign
      return dom;
    }

    /**
     * Adds an event listener by method name for the event provided.
     *
     * This method generates a handler function that looks up the method
     * name at handling time.
     *
     * @param {!EventTarget} node Node to add listener on
     * @param {string} eventName Name of event
     * @param {string} methodName Name of method
     * @param {*=} context Context the method will be called on (defaults
     *   to `node`)
     * @return {Function} Generated handler function
     * @override
     */
    _addMethodEventListenerToNode(node, eventName, methodName, context) {
      context = context || node;
      let handler = createNodeEventHandler(context, eventName, methodName);
      this._addEventListenerToNode(node, eventName, handler);
      return handler;
    }

    /**
     * Override point for adding custom or simulated event handling.
     *
     * @param {!EventTarget} node Node to add event listener to
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to add
     * @return {void}
     * @override
     */
    _addEventListenerToNode(node, eventName, handler) {
      node.addEventListener(eventName, handler);
    }

    /**
     * Override point for adding custom or simulated event handling.
     *
     * @param {!EventTarget} node Node to remove event listener from
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to remove
     * @return {void}
     * @override
     */
    _removeEventListenerFromNode(node, eventName, handler) {
      node.removeEventListener(eventName, handler);
    }

  }

  return TemplateStamp;

});

/**
 * @fileoverview
 * @suppress {checkPrototypalTypes}
 * @license Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

// Monotonically increasing unique ID used for de-duping effects triggered
// from multiple properties in the same turn
let dedupeId$1 = 0;

const NOOP = [];

/**
 * Property effect types; effects are stored on the prototype using these keys
 * @enum {string}
 */
const TYPES = {
  COMPUTE: '__computeEffects',
  REFLECT: '__reflectEffects',
  NOTIFY: '__notifyEffects',
  PROPAGATE: '__propagateEffects',
  OBSERVE: '__observeEffects',
  READ_ONLY: '__readOnly'
};

const COMPUTE_INFO = '__computeInfo';

/** @const {!RegExp} */
const capitalAttributeRegex = /[A-Z]/;

/**
 * Ensures that the model has an own-property map of effects for the given type.
 * The model may be a prototype or an instance.
 *
 * Property effects are stored as arrays of effects by property in a map,
 * by named type on the model. e.g.
 *
 *   __computeEffects: {
 *     foo: [ ... ],
 *     bar: [ ... ]
 *   }
 *
 * If the model does not yet have an effect map for the type, one is created
 * and returned.  If it does, but it is not an own property (i.e. the
 * prototype had effects), the the map is deeply cloned and the copy is
 * set on the model and returned, ready for new effects to be added.
 *
 * @param {Object} model Prototype or instance
 * @param {string} type Property effect type
 * @param {boolean=} cloneArrays Clone any arrays assigned to the map when
 *   extending a superclass map onto this subclass
 * @return {Object} The own-property map of effects for the given type
 * @private
 */
function ensureOwnEffectMap(model, type, cloneArrays) {
  let effects = model[type];
  if (!effects) {
    effects = model[type] = {};
  } else if (!model.hasOwnProperty(type)) {
    effects = model[type] = Object.create(model[type]);
    if (cloneArrays) {
      for (let p in effects) {
        let protoFx = effects[p];
        // Perf optimization over Array.slice
        let instFx = effects[p] = Array(protoFx.length);
        for (let i=0; i<protoFx.length; i++) {
          instFx[i] = protoFx[i];
        }
      }
    }
  }
  return effects;
}

// -- effects ----------------------------------------------

/**
 * Runs all effects of a given type for the given set of property changes
 * on an instance.
 *
 * @param {!Polymer_PropertyEffects} inst The instance with effects to run
 * @param {?Object} effects Object map of property-to-Array of effects
 * @param {?Object} props Bag of current property changes
 * @param {?Object=} oldProps Bag of previous values for changed properties
 * @param {boolean=} hasPaths True with `props` contains one or more paths
 * @param {*=} extraArgs Additional metadata to pass to effect function
 * @return {boolean} True if an effect ran for this property
 * @private
 */
function runEffects(inst, effects, props, oldProps, hasPaths, extraArgs) {
  if (effects) {
    let ran = false;
    const id = dedupeId$1++;
    for (let prop in props) {
      // Inline `runEffectsForProperty` for perf.
      let rootProperty = hasPaths ? root(prop) : prop;
      let fxs = effects[rootProperty];
      if (fxs) {
        for (let i=0, l=fxs.length, fx; (i<l) && (fx=fxs[i]); i++) {
          if ((!fx.info || fx.info.lastRun !== id) &&
              (!hasPaths || pathMatchesTrigger(prop, fx.trigger))) {
            if (fx.info) {
              fx.info.lastRun = id;
            }
            fx.fn(inst, prop, props, oldProps, fx.info, hasPaths, extraArgs);
            ran = true;
          }
        }
      }
    }
    return ran;
  }
  return false;
}

/**
 * Runs a list of effects for a given property.
 *
 * @param {!Polymer_PropertyEffects} inst The instance with effects to run
 * @param {!Object} effects Object map of property-to-Array of effects
 * @param {number} dedupeId Counter used for de-duping effects
 * @param {string} prop Name of changed property
 * @param {*} props Changed properties
 * @param {*} oldProps Old properties
 * @param {boolean=} hasPaths True with `props` contains one or more paths
 * @param {*=} extraArgs Additional metadata to pass to effect function
 * @return {boolean} True if an effect ran for this property
 * @private
 */
function runEffectsForProperty(inst, effects, dedupeId, prop, props, oldProps, hasPaths, extraArgs) {
  let ran = false;
  let rootProperty = hasPaths ? root(prop) : prop;
  let fxs = effects[rootProperty];
  if (fxs) {
    for (let i=0, l=fxs.length, fx; (i<l) && (fx=fxs[i]); i++) {
      if ((!fx.info || fx.info.lastRun !== dedupeId) &&
          (!hasPaths || pathMatchesTrigger(prop, fx.trigger))) {
        if (fx.info) {
          fx.info.lastRun = dedupeId;
        }
        fx.fn(inst, prop, props, oldProps, fx.info, hasPaths, extraArgs);
        ran = true;
      }
    }
  }
  return ran;
}

/**
 * Determines whether a property/path that has changed matches the trigger
 * criteria for an effect.  A trigger is a descriptor with the following
 * structure, which matches the descriptors returned from `parseArg`.
 * e.g. for `foo.bar.*`:
 * ```
 * trigger: {
 *   name: 'a.b',
 *   structured: true,
 *   wildcard: true
 * }
 * ```
 * If no trigger is given, the path is deemed to match.
 *
 * @param {string} path Path or property that changed
 * @param {?DataTrigger} trigger Descriptor
 * @return {boolean} Whether the path matched the trigger
 */
function pathMatchesTrigger(path, trigger) {
  if (trigger) {
    let triggerPath = /** @type {string} */ (trigger.name);
    return (triggerPath == path) ||
        !!(trigger.structured && isAncestor(triggerPath, path)) ||
        !!(trigger.wildcard && isDescendant(triggerPath, path));
  } else {
    return true;
  }
}

/**
 * Implements the "observer" effect.
 *
 * Calls the method with `info.methodName` on the instance, passing the
 * new and old values.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {void}
 * @private
 */
function runObserverEffect(inst, property, props, oldProps, info) {
  let fn = typeof info.method === "string" ? inst[info.method] : info.method;
  let changedProp = info.property;
  if (fn) {
    fn.call(inst, inst.__data[changedProp], oldProps[changedProp]);
  } else if (!info.dynamicFn) {
    console.warn('observer method `' + info.method + '` not defined');
  }
}

/**
 * Runs "notify" effects for a set of changed properties.
 *
 * This method differs from the generic `runEffects` method in that it
 * will dispatch path notification events in the case that the property
 * changed was a path and the root property for that path didn't have a
 * "notify" effect.  This is to maintain 1.0 behavior that did not require
 * `notify: true` to ensure object sub-property notifications were
 * sent.
 *
 * @param {!Polymer_PropertyEffects} inst The instance with effects to run
 * @param {Object} notifyProps Bag of properties to notify
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @return {void}
 * @private
 */
function runNotifyEffects(inst, notifyProps, props, oldProps, hasPaths) {
  // Notify
  let fxs = inst[TYPES.NOTIFY];
  let notified;
  let id = dedupeId$1++;
  // Try normal notify effects; if none, fall back to try path notification
  for (let prop in notifyProps) {
    if (notifyProps[prop]) {
      if (fxs && runEffectsForProperty(inst, fxs, id, prop, props, oldProps, hasPaths)) {
        notified = true;
      } else if (hasPaths && notifyPath(inst, prop, props)) {
        notified = true;
      }
    }
  }
  // Flush host if we actually notified and host was batching
  // And the host has already initialized clients; this prevents
  // an issue with a host observing data changes before clients are ready.
  let host;
  if (notified && (host = inst.__dataHost) && host._invalidateProperties) {
    host._invalidateProperties();
  }
}

/**
 * Dispatches {property}-changed events with path information in the detail
 * object to indicate a sub-path of the property was changed.
 *
 * @param {!Polymer_PropertyEffects} inst The element from which to fire the
 *     event
 * @param {string} path The path that was changed
 * @param {Object} props Bag of current property changes
 * @return {boolean} Returns true if the path was notified
 * @private
 */
function notifyPath(inst, path, props) {
  let rootProperty = root(path);
  if (rootProperty !== path) {
    let eventName = camelToDashCase(rootProperty) + '-changed';
    dispatchNotifyEvent(inst, eventName, props[path], path);
    return true;
  }
  return false;
}

/**
 * Dispatches {property}-changed events to indicate a property (or path)
 * changed.
 *
 * @param {!Polymer_PropertyEffects} inst The element from which to fire the
 *     event
 * @param {string} eventName The name of the event to send
 *     ('{property}-changed')
 * @param {*} value The value of the changed property
 * @param {string | null | undefined} path If a sub-path of this property
 *     changed, the path that changed (optional).
 * @return {void}
 * @private
 * @suppress {invalidCasts}
 */
function dispatchNotifyEvent(inst, eventName, value, path) {
  let detail = {
    value: value,
    queueProperty: true
  };
  if (path) {
    detail.path = path;
  }
  // As a performance optimization, we could elide the wrap here since notifying
  // events are non-bubbling and shouldn't need retargeting. However, a very
  // small number of internal tests failed in obscure ways, which may indicate
  // user code relied on timing differences resulting from ShadyDOM flushing
  // as a result of the wrapped `dispatchEvent`.
  wrap$1(/** @type {!HTMLElement} */(inst)).dispatchEvent(new CustomEvent(eventName, { detail }));
}

/**
 * Implements the "notify" effect.
 *
 * Dispatches a non-bubbling event named `info.eventName` on the instance
 * with a detail object containing the new `value`.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @return {void}
 * @private
 */
function runNotifyEffect(inst, property, props, oldProps, info, hasPaths) {
  let rootProperty = hasPaths ? root(property) : property;
  let path = rootProperty != property ? property : null;
  let value = path ? get(inst, path) : inst.__data[property];
  if (path && value === undefined) {
    value = props[property];  // specifically for .splices
  }
  dispatchNotifyEvent(inst, info.eventName, value, path);
}

/**
 * Handler function for 2-way notification events. Receives context
 * information captured in the `addNotifyListener` closure from the
 * `__notifyListeners` metadata.
 *
 * Sets the value of the notified property to the host property or path.  If
 * the event contained path information, translate that path to the host
 * scope's name for that path first.
 *
 * @param {CustomEvent} event Notification event (e.g. '<property>-changed')
 * @param {!Polymer_PropertyEffects} inst Host element instance handling the
 *     notification event
 * @param {string} fromProp Child element property that was bound
 * @param {string} toPath Host property/path that was bound
 * @param {boolean} negate Whether the binding was negated
 * @return {void}
 * @private
 */
function handleNotification(event, inst, fromProp, toPath, negate) {
  let value;
  let detail = /** @type {Object} */(event.detail);
  let fromPath = detail && detail.path;
  if (fromPath) {
    toPath = translate(fromProp, toPath, fromPath);
    value = detail && detail.value;
  } else {
    value = event.currentTarget[fromProp];
  }
  value = negate ? !value : value;
  if (!inst[TYPES.READ_ONLY] || !inst[TYPES.READ_ONLY][toPath]) {
    if (inst._setPendingPropertyOrPath(toPath, value, true, Boolean(fromPath))
      && (!detail || !detail.queueProperty)) {
      inst._invalidateProperties();
    }
  }
}

/**
 * Implements the "reflect" effect.
 *
 * Sets the attribute named `info.attrName` to the given property value.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {void}
 * @private
 */
function runReflectEffect(inst, property, props, oldProps, info) {
  let value = inst.__data[property];
  if (sanitizeDOMValue) {
    value = sanitizeDOMValue(value, info.attrName, 'attribute', /** @type {Node} */(inst));
  }
  inst._propertyToAttribute(property, info.attrName, value);
}

/**
 * Runs "computed" effects for a set of changed properties.
 *
 * This method differs from the generic `runEffects` method in that it
 * continues to run computed effects based on the output of each pass until
 * there are no more newly computed properties.  This ensures that all
 * properties that will be computed by the initial set of changes are
 * computed before other effects (binding propagation, observers, and notify)
 * run.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {?Object} changedProps Bag of changed properties
 * @param {?Object} oldProps Bag of previous values for changed properties
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @return {void}
 * @private
 */
function runComputedEffects(inst, changedProps, oldProps, hasPaths) {
  let computeEffects = inst[TYPES.COMPUTE];
  if (computeEffects) {
    if (orderedComputed) {
      // Runs computed effects in efficient order by keeping a topologically-
      // sorted queue of compute effects to run, and inserting subsequently
      // invalidated effects as they are run
      dedupeId$1++;
      const order = getComputedOrder(inst);
      const queue = [];
      for (let p in changedProps) {
        enqueueEffectsFor(p, computeEffects, queue, order, hasPaths);
      }
      let info;
      while ((info = queue.shift())) {
        if (runComputedEffect(inst, '', changedProps, oldProps, info)) {
          enqueueEffectsFor(info.methodInfo, computeEffects, queue, order, hasPaths);
        }
      }
      Object.assign(/** @type {!Object} */ (oldProps), inst.__dataOld);
      Object.assign(/** @type {!Object} */ (changedProps), inst.__dataPending);
      inst.__dataPending = null;
    } else {
      // Original Polymer 2.x computed effects order, which continues running
      // effects until no further computed properties have been invalidated
      let inputProps = changedProps;
      while (runEffects(inst, computeEffects, inputProps, oldProps, hasPaths)) {
        Object.assign(/** @type {!Object} */ (oldProps), inst.__dataOld);
        Object.assign(/** @type {!Object} */ (changedProps), inst.__dataPending);
        inputProps = inst.__dataPending;
        inst.__dataPending = null;
      }
    }
  }
}

/**
 * Inserts a computed effect into a queue, given the specified order. Performs
 * the insert using a binary search.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {Object} info Property effects metadata
 * @param {Array<Object>} queue Ordered queue of effects
 * @param {Map<string,number>} order Map of computed property name->topological
 *   sort order
 */
const insertEffect = (info, queue, order) => {
  let start = 0;
  let end = queue.length - 1;
  let idx = -1;
  while (start <= end) {
    const mid = (start + end) >> 1;
    // Note `methodInfo` is where the computed property name is stored in
    // the effect metadata
    const cmp = order.get(queue[mid].methodInfo) - order.get(info.methodInfo);
    if (cmp < 0) {
      start = mid + 1;
    } else if (cmp > 0) {
      end = mid - 1;
    } else {
      idx = mid;
      break;
    }
  }
  if (idx < 0) {
    idx = end + 1;
  }
  queue.splice(idx, 0, info);
};

/**
 * Inserts all downstream computed effects invalidated by the specified property
 * into the topologically-sorted queue of effects to be run.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {string} prop Property name
 * @param {Object} computeEffects Computed effects for this element
 * @param {Array<Object>} queue Topologically-sorted queue of computed effects
 *   to be run
 * @param {Map<string,number>} order Map of computed property name->topological
 *   sort order
 * @param {boolean} hasPaths True with `changedProps` contains one or more paths
 */
const enqueueEffectsFor = (prop, computeEffects, queue, order, hasPaths) => {
  const rootProperty = hasPaths ? root(prop) : prop;
  const fxs = computeEffects[rootProperty];
  if (fxs) {
    for (let i=0; i<fxs.length; i++) {
      const fx = fxs[i];
      if ((fx.info.lastRun !== dedupeId$1) &&
          (!hasPaths || pathMatchesTrigger(prop, fx.trigger))) {
        fx.info.lastRun = dedupeId$1;
        insertEffect(fx.info, queue, order);
      }
    }
  }
};

/**
 * Generates and retrieves a memoized map of computed property name to its
 * topologically-sorted order.
 *
 * The map is generated by first assigning a "dependency count" to each property
 * (defined as number properties it depends on, including its method for
 * "dynamic functions"). Any properties that have no dependencies are added to
 * the `ready` queue, which are properties whose order can be added to the final
 * order map. Properties are popped off the `ready` queue one by one and a.) added as
 * the next property in the order map, and b.) each property that it is a
 * dependency for has its dep count decremented (and if that property's dep
 * count goes to zero, it is added to the `ready` queue), until all properties
 * have been visited and ordered.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {!Polymer_PropertyEffects} inst The instance to retrieve the computed
 *   effect order for.
 * @return {Map<string,number>} Map of computed property name->topological sort
 *   order
 */
function getComputedOrder(inst) {
  let ordered = inst.constructor.__orderedComputedDeps;
  if (!ordered) {
    ordered = new Map();
    const effects = inst[TYPES.COMPUTE];
    let {counts, ready, total} = dependencyCounts(inst);
    let curr;
    while ((curr = ready.shift())) {
      ordered.set(curr, ordered.size);
      const computedByCurr = effects[curr];
      if (computedByCurr) {
        computedByCurr.forEach(fx => {
          // Note `methodInfo` is where the computed property name is stored
          const computedProp = fx.info.methodInfo;
          --total;
          if (--counts[computedProp] === 0) {
            ready.push(computedProp);
          }
        });
      }
    }
    if (total !== 0) {
      const el = /** @type {HTMLElement} */ (inst);
      console.warn(`Computed graph for ${el.localName} incomplete; circular?`);
    }
    inst.constructor.__orderedComputedDeps = ordered;
  }
  return ordered;
}

/**
 * Generates a map of property-to-dependency count (`counts`, where "dependency
 * count" is the number of dependencies a given property has assuming it is a
 * computed property, otherwise 0).  It also returns a pre-populated list of
 * `ready` properties that have no dependencies and a `total` count, which is
 * used for error-checking the graph.
 *
 * Used by `orderedComputed: true` computed property algorithm.
 *
 * @param {!Polymer_PropertyEffects} inst The instance to generate dependency
 *   counts for.
 * @return {!Object} Object containing `counts` map (property-to-dependency
 *   count) and pre-populated `ready` array of properties that had zero
 *   dependencies.
 */
function dependencyCounts(inst) {
  const infoForComputed = inst[COMPUTE_INFO];
  const counts = {};
  const computedDeps = inst[TYPES.COMPUTE];
  const ready = [];
  let total = 0;
  // Count dependencies for each computed property
  for (let p in infoForComputed) {
    const info = infoForComputed[p];
    // Be sure to add the method name itself in case of "dynamic functions"
    total += counts[p] =
      info.args.filter(a => !a.literal).length + (info.dynamicFn ? 1 : 0);
  }
  // Build list of ready properties (that aren't themselves computed)
  for (let p in computedDeps) {
    if (!infoForComputed[p]) {
      ready.push(p);
    }
  }
  return {counts, ready, total};
}

/**
 * Implements the "computed property" effect by running the method with the
 * values of the arguments specified in the `info` object and setting the
 * return value to the computed property specified.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {?Object} changedProps Bag of current property changes
 * @param {?Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {boolean} True when the property being computed changed
 * @private
 */
function runComputedEffect(inst, property, changedProps, oldProps, info) {
  // Dirty check dependencies and run if any invalid
  let result = runMethodEffect(inst, property, changedProps, oldProps, info);
  // Abort if method returns a no-op result
  if (result === NOOP) {
    return false;
  }
  let computedProp = info.methodInfo;
  if (inst.__dataHasAccessor && inst.__dataHasAccessor[computedProp]) {
    return inst._setPendingProperty(computedProp, result, true);
  } else {
    inst[computedProp] = result;
    return false;
  }
}

/**
 * Computes path changes based on path links set up using the `linkPaths`
 * API.
 *
 * @param {!Polymer_PropertyEffects} inst The instance whose props are changing
 * @param {string} path Path that has changed
 * @param {*} value Value of changed path
 * @return {void}
 * @private
 */
function computeLinkedPaths(inst, path, value) {
  let links = inst.__dataLinkedPaths;
  if (links) {
    let link;
    for (let a in links) {
      let b = links[a];
      if (isDescendant(a, path)) {
        link = translate(a, b, path);
        inst._setPendingPropertyOrPath(link, value, true, true);
      } else if (isDescendant(b, path)) {
        link = translate(b, a, path);
        inst._setPendingPropertyOrPath(link, value, true, true);
      }
    }
  }
}

// -- bindings ----------------------------------------------

/**
 * Adds binding metadata to the current `nodeInfo`, and binding effects
 * for all part dependencies to `templateInfo`.
 *
 * @param {Function} constructor Class that `_parseTemplate` is currently
 *   running on
 * @param {TemplateInfo} templateInfo Template metadata for current template
 * @param {NodeInfo} nodeInfo Node metadata for current template node
 * @param {string} kind Binding kind, either 'property', 'attribute', or 'text'
 * @param {string} target Target property name
 * @param {!Array<!BindingPart>} parts Array of binding part metadata
 * @param {string=} literal Literal text surrounding binding parts (specified
 *   only for 'property' bindings, since these must be initialized as part
 *   of boot-up)
 * @return {void}
 * @private
 */
function addBinding(constructor, templateInfo, nodeInfo, kind, target, parts, literal) {
  // Create binding metadata and add to nodeInfo
  nodeInfo.bindings = nodeInfo.bindings || [];
  let /** Binding */ binding = { kind, target, parts, literal, isCompound: (parts.length !== 1) };
  nodeInfo.bindings.push(binding);
  // Add listener info to binding metadata
  if (shouldAddListener(binding)) {
    let {event, negate} = binding.parts[0];
    binding.listenerEvent = event || (camelToDashCase(target) + '-changed');
    binding.listenerNegate = negate;
  }
  // Add "propagate" property effects to templateInfo
  let index = templateInfo.nodeInfoList.length;
  for (let i=0; i<binding.parts.length; i++) {
    let part = binding.parts[i];
    part.compoundIndex = i;
    addEffectForBindingPart(constructor, templateInfo, binding, part, index);
  }
}

/**
 * Adds property effects to the given `templateInfo` for the given binding
 * part.
 *
 * @param {Function} constructor Class that `_parseTemplate` is currently
 *   running on
 * @param {TemplateInfo} templateInfo Template metadata for current template
 * @param {!Binding} binding Binding metadata
 * @param {!BindingPart} part Binding part metadata
 * @param {number} index Index into `nodeInfoList` for this node
 * @return {void}
 */
function addEffectForBindingPart(constructor, templateInfo, binding, part, index) {
  if (!part.literal) {
    if (binding.kind === 'attribute' && binding.target[0] === '-') {
      console.warn('Cannot set attribute ' + binding.target +
        ' because "-" is not a valid attribute starting character');
    } else {
      let dependencies = part.dependencies;
      let info = { index, binding, part, evaluator: constructor };
      for (let j=0; j<dependencies.length; j++) {
        let trigger = dependencies[j];
        if (typeof trigger == 'string') {
          trigger = parseArg(trigger);
          trigger.wildcard = true;
        }
        constructor._addTemplatePropertyEffect(templateInfo, trigger.rootProperty, {
          fn: runBindingEffect,
          info, trigger
        });
      }
    }
  }
}

/**
 * Implements the "binding" (property/path binding) effect.
 *
 * Note that binding syntax is overridable via `_parseBindings` and
 * `_evaluateBinding`.  This method will call `_evaluateBinding` for any
 * non-literal parts returned from `_parseBindings`.  However,
 * there is no support for _path_ bindings via custom binding parts,
 * as this is specific to Polymer's path binding syntax.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} path Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @param {boolean} hasPaths True with `props` contains one or more paths
 * @param {Array} nodeList List of nodes associated with `nodeInfoList` template
 *   metadata
 * @return {void}
 * @private
 */
function runBindingEffect(inst, path, props, oldProps, info, hasPaths, nodeList) {
  let node = nodeList[info.index];
  let binding = info.binding;
  let part = info.part;
  // Subpath notification: transform path and set to client
  // e.g.: foo="{{obj.sub}}", path: 'obj.sub.prop', set 'foo.prop'=obj.sub.prop
  if (hasPaths && part.source && (path.length > part.source.length) &&
      (binding.kind == 'property') && !binding.isCompound &&
      node.__isPropertyEffectsClient &&
      node.__dataHasAccessor && node.__dataHasAccessor[binding.target]) {
    let value = props[path];
    path = translate(part.source, binding.target, path);
    if (node._setPendingPropertyOrPath(path, value, false, true)) {
      inst._enqueueClient(node);
    }
  } else {
    let value = info.evaluator._evaluateBinding(inst, part, path, props, oldProps, hasPaths);
    // Propagate value to child
    // Abort if value is a no-op result
    if (value !== NOOP) {
      applyBindingValue(inst, node, binding, part, value);
    }
  }
}

/**
 * Sets the value for an "binding" (binding) effect to a node,
 * either as a property or attribute.
 *
 * @param {!Polymer_PropertyEffects} inst The instance owning the binding effect
 * @param {Node} node Target node for binding
 * @param {!Binding} binding Binding metadata
 * @param {!BindingPart} part Binding part metadata
 * @param {*} value Value to set
 * @return {void}
 * @private
 */
function applyBindingValue(inst, node, binding, part, value) {
  value = computeBindingValue(node, value, binding, part);
  if (sanitizeDOMValue) {
    value = sanitizeDOMValue(value, binding.target, binding.kind, node);
  }
  if (binding.kind == 'attribute') {
    // Attribute binding
    inst._valueToNodeAttribute(/** @type {Element} */(node), value, binding.target);
  } else {
    // Property binding
    let prop = binding.target;
    if (node.__isPropertyEffectsClient &&
        node.__dataHasAccessor && node.__dataHasAccessor[prop]) {
      if (!node[TYPES.READ_ONLY] || !node[TYPES.READ_ONLY][prop]) {
        if (node._setPendingProperty(prop, value)) {
          inst._enqueueClient(node);
        }
      }
    } else {
      // In legacy no-batching mode, bindings applied before dataReady are
      // equivalent to the "apply config" phase, which only set managed props
      inst._setUnmanagedPropertyToNode(node, prop, value);
    }
  }
}

/**
 * Transforms an "binding" effect value based on compound & negation
 * effect metadata, as well as handling for special-case properties
 *
 * @param {Node} node Node the value will be set to
 * @param {*} value Value to set
 * @param {!Binding} binding Binding metadata
 * @param {!BindingPart} part Binding part metadata
 * @return {*} Transformed value to set
 * @private
 */
function computeBindingValue(node, value, binding, part) {
  if (binding.isCompound) {
    let storage = node.__dataCompoundStorage[binding.target];
    storage[part.compoundIndex] = value;
    value = storage.join('');
  }
  if (binding.kind !== 'attribute') {
    // Some browsers serialize `undefined` to `"undefined"`
    if (binding.target === 'textContent' ||
        (binding.target === 'value' &&
          (node.localName === 'input' || node.localName === 'textarea'))) {
      value = value == undefined ? '' : value;
    }
  }
  return value;
}

/**
 * Returns true if a binding's metadata meets all the requirements to allow
 * 2-way binding, and therefore a `<property>-changed` event listener should be
 * added:
 * - used curly braces
 * - is a property (not attribute) binding
 * - is not a textContent binding
 * - is not compound
 *
 * @param {!Binding} binding Binding metadata
 * @return {boolean} True if 2-way listener should be added
 * @private
 */
function shouldAddListener(binding) {
  return Boolean(binding.target) &&
         binding.kind != 'attribute' &&
         binding.kind != 'text' &&
         !binding.isCompound &&
         binding.parts[0].mode === '{';
}

/**
 * Setup compound binding storage structures, notify listeners, and dataHost
 * references onto the bound nodeList.
 *
 * @param {!Polymer_PropertyEffects} inst Instance that bas been previously
 *     bound
 * @param {TemplateInfo} templateInfo Template metadata
 * @return {void}
 * @private
 */
function setupBindings(inst, templateInfo) {
  // Setup compound storage, dataHost, and notify listeners
  let {nodeList, nodeInfoList} = templateInfo;
  if (nodeInfoList.length) {
    for (let i=0; i < nodeInfoList.length; i++) {
      let info = nodeInfoList[i];
      let node = nodeList[i];
      let bindings = info.bindings;
      if (bindings) {
        for (let i=0; i<bindings.length; i++) {
          let binding = bindings[i];
          setupCompoundStorage(node, binding);
          addNotifyListener(node, inst, binding);
        }
      }
      // This ensures all bound elements have a host set, regardless
      // of whether they upgrade synchronous to creation
      node.__dataHost = inst;
    }
  }
}

/**
 * Initializes `__dataCompoundStorage` local storage on a bound node with
 * initial literal data for compound bindings, and sets the joined
 * literal parts to the bound property.
 *
 * When changes to compound parts occur, they are first set into the compound
 * storage array for that property, and then the array is joined to result in
 * the final value set to the property/attribute.
 *
 * @param {Node} node Bound node to initialize
 * @param {Binding} binding Binding metadata
 * @return {void}
 * @private
 */
function setupCompoundStorage(node, binding) {
  if (binding.isCompound) {
    // Create compound storage map
    let storage = node.__dataCompoundStorage ||
      (node.__dataCompoundStorage = {});
    let parts = binding.parts;
    // Copy literals from parts into storage for this binding
    let literals = new Array(parts.length);
    for (let j=0; j<parts.length; j++) {
      literals[j] = parts[j].literal;
    }
    let target = binding.target;
    storage[target] = literals;
    // Configure properties with their literal parts
    if (binding.literal && binding.kind == 'property') {
      // Note, className needs style scoping so this needs wrapping.
      // We may also want to consider doing this for `textContent` and
      // `innerHTML`.
      if (target === 'className') {
        node = wrap$1(node);
      }
      node[target] = binding.literal;
    }
  }
}

/**
 * Adds a 2-way binding notification event listener to the node specified
 *
 * @param {Object} node Child element to add listener to
 * @param {!Polymer_PropertyEffects} inst Host element instance to handle
 *     notification event
 * @param {Binding} binding Binding metadata
 * @return {void}
 * @private
 */
function addNotifyListener(node, inst, binding) {
  if (binding.listenerEvent) {
    let part = binding.parts[0];
    node.addEventListener(binding.listenerEvent, function(e) {
      handleNotification(e, inst, binding.target, part.source, part.negate);
    });
  }
}

// -- for method-based effects (complexObserver & computed) --------------

/**
 * Adds property effects for each argument in the method signature (and
 * optionally, for the method name if `dynamic` is true) that calls the
 * provided effect function.
 *
 * @param {Element | Object} model Prototype or instance
 * @param {!MethodSignature} sig Method signature metadata
 * @param {string} type Type of property effect to add
 * @param {Function} effectFn Function to run when arguments change
 * @param {*=} methodInfo Effect-specific information to be included in
 *   method effect metadata
 * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
 *   method names should be included as a dependency to the effect. Note,
 *   defaults to true if the signature is static (sig.static is true).
 * @return {!Object} Effect metadata for this method effect
 * @private
 */
function createMethodEffect(model, sig, type, effectFn, methodInfo, dynamicFn) {
  dynamicFn = sig.static || (dynamicFn &&
    (typeof dynamicFn !== 'object' || dynamicFn[sig.methodName]));
  let info = {
    methodName: sig.methodName,
    args: sig.args,
    methodInfo,
    dynamicFn
  };
  for (let i=0, arg; (i<sig.args.length) && (arg=sig.args[i]); i++) {
    if (!arg.literal) {
      model._addPropertyEffect(arg.rootProperty, type, {
        fn: effectFn, info: info, trigger: arg
      });
    }
  }
  if (dynamicFn) {
    model._addPropertyEffect(sig.methodName, type, {
      fn: effectFn, info: info
    });
  }
  return info;
}

/**
 * Calls a method with arguments marshaled from properties on the instance
 * based on the method signature contained in the effect metadata.
 *
 * Multi-property observers, computed properties, and inline computing
 * functions call this function to invoke the method, then use the return
 * value accordingly.
 *
 * @param {!Polymer_PropertyEffects} inst The instance the effect will be run on
 * @param {string} property Name of property
 * @param {Object} props Bag of current property changes
 * @param {Object} oldProps Bag of previous values for changed properties
 * @param {?} info Effect metadata
 * @return {*} Returns the return value from the method invocation
 * @private
 */
function runMethodEffect(inst, property, props, oldProps, info) {
  // Instances can optionally have a _methodHost which allows redirecting where
  // to find methods. Currently used by `templatize`.
  let context = inst._methodHost || inst;
  let fn = context[info.methodName];
  if (fn) {
    let args = inst._marshalArgs(info.args, property, props);
    return args === NOOP ? NOOP : fn.apply(context, args);
  } else if (!info.dynamicFn) {
    console.warn('method `' + info.methodName + '` not defined');
  }
}

const emptyArray = [];

// Regular expressions used for binding
const IDENT  = '(?:' + '[a-zA-Z_$][\\w.:$\\-*]*' + ')';
const NUMBER = '(?:' + '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?' + ')';
const SQUOTE_STRING = '(?:' + '\'(?:[^\'\\\\]|\\\\.)*\'' + ')';
const DQUOTE_STRING = '(?:' + '"(?:[^"\\\\]|\\\\.)*"' + ')';
const STRING = '(?:' + SQUOTE_STRING + '|' + DQUOTE_STRING + ')';
const ARGUMENT = '(?:(' + IDENT + '|' + NUMBER + '|' +  STRING + ')\\s*' + ')';
const ARGUMENTS = '(?:' + ARGUMENT + '(?:,\\s*' + ARGUMENT + ')*' + ')';
const ARGUMENT_LIST = '(?:' + '\\(\\s*' +
                              '(?:' + ARGUMENTS + '?' + ')' +
                            '\\)\\s*' + ')';
const BINDING = '(' + IDENT + '\\s*' + ARGUMENT_LIST + '?' + ')'; // Group 3
const OPEN_BRACKET = '(\\[\\[|{{)' + '\\s*';
const CLOSE_BRACKET = '(?:]]|}})';
const NEGATE = '(?:(!)\\s*)?'; // Group 2
const EXPRESSION = OPEN_BRACKET + NEGATE + BINDING + CLOSE_BRACKET;
const bindingRegex = new RegExp(EXPRESSION, "g");

/**
 * Create a string from binding parts of all the literal parts
 *
 * @param {!Array<BindingPart>} parts All parts to stringify
 * @return {string} String made from the literal parts
 */
function literalFromParts(parts) {
  let s = '';
  for (let i=0; i<parts.length; i++) {
    let literal = parts[i].literal;
    s += literal || '';
  }
  return s;
}

/**
 * Parses an expression string for a method signature, and returns a metadata
 * describing the method in terms of `methodName`, `static` (whether all the
 * arguments are literals), and an array of `args`
 *
 * @param {string} expression The expression to parse
 * @return {?MethodSignature} The method metadata object if a method expression was
 *   found, otherwise `undefined`
 * @private
 */
function parseMethod(expression) {
  // tries to match valid javascript property names
  let m = expression.match(/([^\s]+?)\(([\s\S]*)\)/);
  if (m) {
    let methodName = m[1];
    let sig = { methodName, static: true, args: emptyArray };
    if (m[2].trim()) {
      // replace escaped commas with comma entity, split on un-escaped commas
      let args = m[2].replace(/\\,/g, '&comma;').split(',');
      return parseArgs(args, sig);
    } else {
      return sig;
    }
  }
  return null;
}

/**
 * Parses an array of arguments and sets the `args` property of the supplied
 * signature metadata object. Sets the `static` property to false if any
 * argument is a non-literal.
 *
 * @param {!Array<string>} argList Array of argument names
 * @param {!MethodSignature} sig Method signature metadata object
 * @return {!MethodSignature} The updated signature metadata object
 * @private
 */
function parseArgs(argList, sig) {
  sig.args = argList.map(function(rawArg) {
    let arg = parseArg(rawArg);
    if (!arg.literal) {
      sig.static = false;
    }
    return arg;
  }, this);
  return sig;
}

/**
 * Parses an individual argument, and returns an argument metadata object
 * with the following fields:
 *
 *   {
 *     value: 'prop',        // property/path or literal value
 *     literal: false,       // whether argument is a literal
 *     structured: false,    // whether the property is a path
 *     rootProperty: 'prop', // the root property of the path
 *     wildcard: false       // whether the argument was a wildcard '.*' path
 *   }
 *
 * @param {string} rawArg The string value of the argument
 * @return {!MethodArg} Argument metadata object
 * @private
 */
function parseArg(rawArg) {
  // clean up whitespace
  let arg = rawArg.trim()
    // replace comma entity with comma
    .replace(/&comma;/g, ',')
    // repair extra escape sequences; note only commas strictly need
    // escaping, but we allow any other char to be escaped since its
    // likely users will do this
    .replace(/\\(.)/g, '\$1')
    ;
  // basic argument descriptor
  let a = {
    name: arg,
    value: '',
    literal: false
  };
  // detect literal value (must be String or Number)
  let fc = arg[0];
  if (fc === '-') {
    fc = arg[1];
  }
  if (fc >= '0' && fc <= '9') {
    fc = '#';
  }
  switch(fc) {
    case "'":
    case '"':
      a.value = arg.slice(1, -1);
      a.literal = true;
      break;
    case '#':
      a.value = Number(arg);
      a.literal = true;
      break;
  }
  // if not literal, look for structured path
  if (!a.literal) {
    a.rootProperty = root(arg);
    // detect structured path (has dots)
    a.structured = isPath(arg);
    if (a.structured) {
      a.wildcard = (arg.slice(-2) == '.*');
      if (a.wildcard) {
        a.name = arg.slice(0, -2);
      }
    }
  }
  return a;
}

function getArgValue(data, props, path) {
  let value = get(data, path);
  // when data is not stored e.g. `splices`, get the value from changedProps
  // TODO(kschaaf): Note, this can cause a rare issue where the wildcard
  // info.value could pull a stale value out of changedProps during a reentrant
  // change that sets the value back to undefined.
  // https://github.com/Polymer/polymer/issues/5479
  if (value === undefined) {
    value = props[path];
  }
  return value;
}

// data api

/**
 * Sends array splice notifications (`.splices` and `.length`)
 *
 * Note: this implementation only accepts normalized paths
 *
 * @param {!Polymer_PropertyEffects} inst Instance to send notifications to
 * @param {Array} array The array the mutations occurred on
 * @param {string} path The path to the array that was mutated
 * @param {Array} splices Array of splice records
 * @return {void}
 * @private
 */
function notifySplices(inst, array, path, splices) {
  const splicesData = { indexSplices: splices };
  // Legacy behavior stored splices in `__data__` so it was *not* ephemeral.
  // To match this behavior, we store splices directly on the array.
  if (legacyUndefined && !inst._overrideLegacyUndefined) {
    array.splices = splicesData;
  }
  inst.notifyPath(path + '.splices', splicesData);
  inst.notifyPath(path + '.length', array.length);
  // Clear splice data only when it's stored on the array.
  if (legacyUndefined && !inst._overrideLegacyUndefined) {
    splicesData.indexSplices = [];
  }
}

/**
 * Creates a splice record and sends an array splice notification for
 * the described mutation
 *
 * Note: this implementation only accepts normalized paths
 *
 * @param {!Polymer_PropertyEffects} inst Instance to send notifications to
 * @param {Array} array The array the mutations occurred on
 * @param {string} path The path to the array that was mutated
 * @param {number} index Index at which the array mutation occurred
 * @param {number} addedCount Number of added items
 * @param {Array} removed Array of removed items
 * @return {void}
 * @private
 */
function notifySplice(inst, array, path, index, addedCount, removed) {
  notifySplices(inst, array, path, [{
    index: index,
    addedCount: addedCount,
    removed: removed,
    object: array,
    type: 'splice'
  }]);
}

/**
 * Returns an upper-cased version of the string.
 *
 * @param {string} name String to uppercase
 * @return {string} Uppercased string
 * @private
 */
function upper(name) {
  return name[0].toUpperCase() + name.substring(1);
}

/**
 * Element class mixin that provides meta-programming for Polymer's template
 * binding and data observation (collectively, "property effects") system.
 *
 * This mixin uses provides the following key static methods for adding
 * property effects to an element class:
 * - `addPropertyEffect`
 * - `createPropertyObserver`
 * - `createMethodObserver`
 * - `createNotifyingProperty`
 * - `createReadOnlyProperty`
 * - `createReflectedProperty`
 * - `createComputedProperty`
 * - `bindTemplate`
 *
 * Each method creates one or more property accessors, along with metadata
 * used by this mixin's implementation of `_propertiesChanged` to perform
 * the property effects.
 *
 * Underscored versions of the above methods also exist on the element
 * prototype for adding property effects on instances at runtime.
 *
 * Note that this mixin overrides several `PropertyAccessors` methods, in
 * many cases to maintain guarantees provided by the Polymer 1.x features;
 * notably it changes property accessors to be synchronous by default
 * whereas the default when using `PropertyAccessors` standalone is to be
 * async by default.
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin TemplateStamp
 * @appliesMixin PropertyAccessors
 * @summary Element class mixin that provides meta-programming for Polymer's
 * template binding and data observation system.
 */
const PropertyEffects = dedupingMixin(superClass => {

  /**
   * @constructor
   * @implements {Polymer_PropertyAccessors}
   * @implements {Polymer_TemplateStamp}
   * @unrestricted
   * @private
   */
  const propertyEffectsBase = TemplateStamp(PropertyAccessors(superClass));

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_PropertyEffects}
   * @extends {propertyEffectsBase}
   * @unrestricted
   */
  class PropertyEffects extends propertyEffectsBase {

    constructor() {
      super();
      /** @type {boolean} */
      // Used to identify users of this mixin, ala instanceof
      this.__isPropertyEffectsClient = true;
      /** @type {boolean} */
      this.__dataClientsReady;
      /** @type {Array} */
      this.__dataPendingClients;
      /** @type {Object} */
      this.__dataToNotify;
      /** @type {Object} */
      this.__dataLinkedPaths;
      /** @type {boolean} */
      this.__dataHasPaths;
      /** @type {Object} */
      this.__dataCompoundStorage;
      /** @type {Polymer_PropertyEffects} */
      this.__dataHost;
      /** @type {!Object} */
      this.__dataTemp;
      /** @type {boolean} */
      this.__dataClientsInitialized;
      /** @type {!Object} */
      this.__data;
      /** @type {!Object|null} */
      this.__dataPending;
      /** @type {!Object} */
      this.__dataOld;
      /** @type {Object} */
      this.__computeEffects;
      /** @type {Object} */
      this.__computeInfo;
      /** @type {Object} */
      this.__reflectEffects;
      /** @type {Object} */
      this.__notifyEffects;
      /** @type {Object} */
      this.__propagateEffects;
      /** @type {Object} */
      this.__observeEffects;
      /** @type {Object} */
      this.__readOnly;
      /** @type {!TemplateInfo} */
      this.__templateInfo;
      /** @type {boolean} */
      this._overrideLegacyUndefined;
    }

    get PROPERTY_EFFECT_TYPES() {
      return TYPES;
    }

    /**
     * @override
     * @return {void}
     */
    _initializeProperties() {
      super._initializeProperties();
      this._registerHost();
      this.__dataClientsReady = false;
      this.__dataPendingClients = null;
      this.__dataToNotify = null;
      this.__dataLinkedPaths = null;
      this.__dataHasPaths = false;
      // May be set on instance prior to upgrade
      this.__dataCompoundStorage = this.__dataCompoundStorage || null;
      this.__dataHost = this.__dataHost || null;
      this.__dataTemp = {};
      this.__dataClientsInitialized = false;
    }

    _registerHost() {
      if (hostStack.length) {
        let host = hostStack[hostStack.length-1];
        host._enqueueClient(this);
        // This ensures even non-bound elements have a host set, as
        // long as they upgrade synchronously
        this.__dataHost = host;
      }
    }

    /**
     * Overrides `PropertyAccessors` implementation to provide a
     * more efficient implementation of initializing properties from
     * the prototype on the instance.
     *
     * @override
     * @param {Object} props Properties to initialize on the prototype
     * @return {void}
     */
    _initializeProtoProperties(props) {
      this.__data = Object.create(props);
      this.__dataPending = Object.create(props);
      this.__dataOld = {};
    }

    /**
     * Overrides `PropertyAccessors` implementation to avoid setting
     * `_setProperty`'s `shouldNotify: true`.
     *
     * @override
     * @param {Object} props Properties to initialize on the instance
     * @return {void}
     */
    _initializeInstanceProperties(props) {
      let readOnly = this[TYPES.READ_ONLY];
      for (let prop in props) {
        if (!readOnly || !readOnly[prop]) {
          this.__dataPending = this.__dataPending || {};
          this.__dataOld = this.__dataOld || {};
          this.__data[prop] = this.__dataPending[prop] = props[prop];
        }
      }
    }

    // Prototype setup ----------------------------------------

    /**
     * Equivalent to static `addPropertyEffect` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property that should trigger the effect
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     */
    _addPropertyEffect(property, type, effect) {
      this._createPropertyAccessor(property, type == TYPES.READ_ONLY);
      // effects are accumulated into arrays per property based on type
      let effects = ensureOwnEffectMap(this, type, true)[property];
      if (!effects) {
        effects = this[type][property] = [];
      }
      effects.push(effect);
    }

    /**
     * Removes the given property effect.
     *
     * @override
     * @param {string} property Property the effect was associated with
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object to remove
     * @return {void}
     */
    _removePropertyEffect(property, type, effect) {
      let effects = ensureOwnEffectMap(this, type, true)[property];
      let idx = effects.indexOf(effect);
      if (idx >= 0) {
        effects.splice(idx, 1);
      }
    }

    /**
     * Returns whether the current prototype/instance has a property effect
     * of a certain type.
     *
     * @override
     * @param {string} property Property name
     * @param {string=} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasPropertyEffect(property, type) {
      let effects = this[type];
      return Boolean(effects && effects[property]);
    }

    /**
     * Returns whether the current prototype/instance has a "read only"
     * accessor for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasReadOnlyEffect(property) {
      return this._hasPropertyEffect(property, TYPES.READ_ONLY);
    }

    /**
     * Returns whether the current prototype/instance has a "notify"
     * property effect for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasNotifyEffect(property) {
      return this._hasPropertyEffect(property, TYPES.NOTIFY);
    }

    /**
     * Returns whether the current prototype/instance has a "reflect to
     * attribute" property effect for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasReflectEffect(property) {
      return this._hasPropertyEffect(property, TYPES.REFLECT);
    }

    /**
     * Returns whether the current prototype/instance has a "computed"
     * property effect for the given property.
     *
     * @override
     * @param {string} property Property name
     * @return {boolean} True if the prototype/instance has an effect of this
     *     type
     * @protected
     */
    _hasComputedEffect(property) {
      return this._hasPropertyEffect(property, TYPES.COMPUTE);
    }

    // Runtime ----------------------------------------

    /**
     * Sets a pending property or path.  If the root property of the path in
     * question had no accessor, the path is set, otherwise it is enqueued
     * via `_setPendingProperty`.
     *
     * This function isolates relatively expensive functionality necessary
     * for the public API (`set`, `setProperties`, `notifyPath`, and property
     * change listeners via {{...}} bindings), such that it is only done
     * when paths enter the system, and not at every propagation step.  It
     * also sets a `__dataHasPaths` flag on the instance which is used to
     * fast-path slower path-matching code in the property effects host paths.
     *
     * `path` can be a path string or array of path parts as accepted by the
     * public API.
     *
     * @override
     * @param {string | !Array<number|string>} path Path to set
     * @param {*} value Value to set
     * @param {boolean=} shouldNotify Set to true if this change should
     *  cause a property notification event dispatch
     * @param {boolean=} isPathNotification If the path being set is a path
     *   notification of an already changed value, as opposed to a request
     *   to set and notify the change.  In the latter `false` case, a dirty
     *   check is performed and then the value is set to the path before
     *   enqueuing the pending property change.
     * @return {boolean} Returns true if the property/path was enqueued in
     *   the pending changes bag.
     * @protected
     */
    _setPendingPropertyOrPath(path, value, shouldNotify, isPathNotification) {
      if (isPathNotification ||
          root(Array.isArray(path) ? path[0] : path) !== path) {
        // Dirty check changes being set to a path against the actual object,
        // since this is the entry point for paths into the system; from here
        // the only dirty checks are against the `__dataTemp` cache to prevent
        // duplicate work in the same turn only. Note, if this was a notification
        // of a change already set to a path (isPathNotification: true),
        // we always let the change through and skip the `set` since it was
        // already dirty checked at the point of entry and the underlying
        // object has already been updated
        if (!isPathNotification) {
          let old = get(this, path);
          path = /** @type {string} */ (set(this, path, value));
          // Use property-accessor's simpler dirty check
          if (!path || !super._shouldPropertyChange(path, value, old)) {
            return false;
          }
        }
        this.__dataHasPaths = true;
        if (this._setPendingProperty(/**@type{string}*/(path), value, shouldNotify)) {
          computeLinkedPaths(this, /**@type{string}*/ (path), value);
          return true;
        }
      } else {
        if (this.__dataHasAccessor && this.__dataHasAccessor[path]) {
          return this._setPendingProperty(/**@type{string}*/(path), value, shouldNotify);
        } else {
          this[path] = value;
        }
      }
      return false;
    }

    /**
     * Applies a value to a non-Polymer element/node's property.
     *
     * The implementation makes a best-effort at binding interop:
     * Some native element properties have side-effects when
     * re-setting the same value (e.g. setting `<input>.value` resets the
     * cursor position), so we do a dirty-check before setting the value.
     * However, for better interop with non-Polymer custom elements that
     * accept objects, we explicitly re-set object changes coming from the
     * Polymer world (which may include deep object changes without the
     * top reference changing), erring on the side of providing more
     * information.
     *
     * Users may override this method to provide alternate approaches.
     *
     * @override
     * @param {!Node} node The node to set a property on
     * @param {string} prop The property to set
     * @param {*} value The value to set
     * @return {void}
     * @protected
     */
    _setUnmanagedPropertyToNode(node, prop, value) {
      // It is a judgment call that resetting primitives is
      // "bad" and resettings objects is also "good"; alternatively we could
      // implement a whitelist of tag & property values that should never
      // be reset (e.g. <input>.value && <select>.value)
      if (value !== node[prop] || typeof value == 'object') {
        // Note, className needs style scoping so this needs wrapping.
        if (prop === 'className') {
          node = /** @type {!Node} */(wrap$1(node));
        }
        node[prop] = value;
      }
    }

    /**
     * Overrides the `PropertiesChanged` implementation to introduce special
     * dirty check logic depending on the property & value being set:
     *
     * 1. Any value set to a path (e.g. 'obj.prop': 42 or 'obj.prop': {...})
     *    Stored in `__dataTemp`, dirty checked against `__dataTemp`
     * 2. Object set to simple property (e.g. 'prop': {...})
     *    Stored in `__dataTemp` and `__data`, dirty checked against
     *    `__dataTemp` by default implementation of `_shouldPropertyChange`
     * 3. Primitive value set to simple property (e.g. 'prop': 42)
     *    Stored in `__data`, dirty checked against `__data`
     *
     * The dirty-check is important to prevent cycles due to two-way
     * notification, but paths and objects are only dirty checked against any
     * previous value set during this turn via a "temporary cache" that is
     * cleared when the last `_propertiesChanged` exits. This is so:
     * a. any cached array paths (e.g. 'array.3.prop') may be invalidated
     *    due to array mutations like shift/unshift/splice; this is fine
     *    since path changes are dirty-checked at user entry points like `set`
     * b. dirty-checking for objects only lasts one turn to allow the user
     *    to mutate the object in-place and re-set it with the same identity
     *    and have all sub-properties re-propagated in a subsequent turn.
     *
     * The temp cache is not necessarily sufficient to prevent invalid array
     * paths, since a splice can happen during the same turn (with pathological
     * user code); we could introduce a "fixup" for temporarily cached array
     * paths if needed: https://github.com/Polymer/polymer/issues/4227
     *
     * @override
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @param {boolean=} shouldNotify True if property should fire notification
     *   event (applies only for `notify: true` properties)
     * @return {boolean} Returns true if the property changed
     */
    _setPendingProperty(property, value, shouldNotify) {
      let propIsPath = this.__dataHasPaths && isPath(property);
      let prevProps = propIsPath ? this.__dataTemp : this.__data;
      if (this._shouldPropertyChange(property, value, prevProps[property])) {
        if (!this.__dataPending) {
          this.__dataPending = {};
          this.__dataOld = {};
        }
        // Ensure old is captured from the last turn
        if (!(property in this.__dataOld)) {
          this.__dataOld[property] = this.__data[property];
        }
        // Paths are stored in temporary cache (cleared at end of turn),
        // which is used for dirty-checking, all others stored in __data
        if (propIsPath) {
          this.__dataTemp[property] = value;
        } else {
          this.__data[property] = value;
        }
        // All changes go into pending property bag, passed to _propertiesChanged
        this.__dataPending[property] = value;
        // Track properties that should notify separately
        if (propIsPath || (this[TYPES.NOTIFY] && this[TYPES.NOTIFY][property])) {
          this.__dataToNotify = this.__dataToNotify || {};
          this.__dataToNotify[property] = shouldNotify;
        }
        return true;
      }
      return false;
    }

    /**
     * Overrides base implementation to ensure all accessors set `shouldNotify`
     * to true, for per-property notification tracking.
     *
     * @override
     * @param {string} property Name of the property
     * @param {*} value Value to set
     * @return {void}
     */
    _setProperty(property, value) {
      if (this._setPendingProperty(property, value, true)) {
        this._invalidateProperties();
      }
    }

    /**
     * Overrides `PropertyAccessor`'s default async queuing of
     * `_propertiesChanged`: if `__dataReady` is false (has not yet been
     * manually flushed), the function no-ops; otherwise flushes
     * `_propertiesChanged` synchronously.
     *
     * @override
     * @return {void}
     */
    _invalidateProperties() {
      if (this.__dataReady) {
        this._flushProperties();
      }
    }

    /**
     * Enqueues the given client on a list of pending clients, whose
     * pending property changes can later be flushed via a call to
     * `_flushClients`.
     *
     * @override
     * @param {Object} client PropertyEffects client to enqueue
     * @return {void}
     * @protected
     */
    _enqueueClient(client) {
      this.__dataPendingClients = this.__dataPendingClients || [];
      if (client !== this) {
        this.__dataPendingClients.push(client);
      }
    }

    /**
     * Flushes any clients previously enqueued via `_enqueueClient`, causing
     * their `_flushProperties` method to run.
     *
     * @override
     * @return {void}
     * @protected
     */
    _flushClients() {
      if (!this.__dataClientsReady) {
        this.__dataClientsReady = true;
        this._readyClients();
        // Override point where accessors are turned on; importantly,
        // this is after clients have fully readied, providing a guarantee
        // that any property effects occur only after all clients are ready.
        this.__dataReady = true;
      } else {
        this.__enableOrFlushClients();
      }
    }

    // NOTE: We ensure clients either enable or flush as appropriate. This
    // handles two corner cases:
    // (1) clients flush properly when connected/enabled before the host
    // enables; e.g.
    //   (a) Templatize stamps with no properties and does not flush and
    //   (b) the instance is inserted into dom and
    //   (c) then the instance flushes.
    // (2) clients enable properly when not connected/enabled when the host
    // flushes; e.g.
    //   (a) a template is runtime stamped and not yet connected/enabled
    //   (b) a host sets a property, causing stamped dom to flush
    //   (c) the stamped dom enables.
    __enableOrFlushClients() {
      let clients = this.__dataPendingClients;
      if (clients) {
        this.__dataPendingClients = null;
        for (let i=0; i < clients.length; i++) {
          let client = clients[i];
          if (!client.__dataEnabled) {
            client._enableProperties();
          } else if (client.__dataPending) {
            client._flushProperties();
          }
        }
      }
    }

    /**
     * Perform any initial setup on client dom. Called before the first
     * `_flushProperties` call on client dom and before any element
     * observers are called.
     *
     * @override
     * @return {void}
     * @protected
     */
    _readyClients() {
      this.__enableOrFlushClients();
    }

    /**
     * Sets a bag of property changes to this instance, and
     * synchronously processes all effects of the properties as a batch.
     *
     * Property names must be simple properties, not paths.  Batched
     * path propagation is not supported.
     *
     * @override
     * @param {Object} props Bag of one or more key-value pairs whose key is
     *   a property and value is the new value to set for that property.
     * @param {boolean=} setReadOnly When true, any private values set in
     *   `props` will be set. By default, `setProperties` will not set
     *   `readOnly: true` root properties.
     * @return {void}
     * @public
     */
    setProperties(props, setReadOnly) {
      for (let path in props) {
        if (setReadOnly || !this[TYPES.READ_ONLY] || !this[TYPES.READ_ONLY][path]) {
          //TODO(kschaaf): explicitly disallow paths in setProperty?
          // wildcard observers currently only pass the first changed path
          // in the `info` object, and you could do some odd things batching
          // paths, e.g. {'foo.bar': {...}, 'foo': null}
          this._setPendingPropertyOrPath(path, props[path], true);
        }
      }
      this._invalidateProperties();
    }

    /**
     * Overrides `PropertyAccessors` so that property accessor
     * side effects are not enabled until after client dom is fully ready.
     * Also calls `_flushClients` callback to ensure client dom is enabled
     * that was not enabled as a result of flushing properties.
     *
     * @override
     * @return {void}
     */
    ready() {
      // It is important that `super.ready()` is not called here as it
      // immediately turns on accessors. Instead, we wait until `readyClients`
      // to enable accessors to provide a guarantee that clients are ready
      // before processing any accessors side effects.
      this._flushProperties();
      // If no data was pending, `_flushProperties` will not `flushClients`
      // so ensure this is done.
      if (!this.__dataClientsReady) {
        this._flushClients();
      }
      // Before ready, client notifications do not trigger _flushProperties.
      // Therefore a flush is necessary here if data has been set.
      if (this.__dataPending) {
        this._flushProperties();
      }
    }

    /**
     * Implements `PropertyAccessors`'s properties changed callback.
     *
     * Runs each class of effects for the batch of changed properties in
     * a specific order (compute, propagate, reflect, observe, notify).
     *
     * @override
     * @param {!Object} currentProps Bag of all current accessor values
     * @param {?Object} changedProps Bag of properties changed since the last
     *   call to `_propertiesChanged`
     * @param {?Object} oldProps Bag of previous values for each property
     *   in `changedProps`
     * @return {void}
     */
    _propertiesChanged(currentProps, changedProps, oldProps) {
      // ----------------------------
      // let c = Object.getOwnPropertyNames(changedProps || {});
      // window.debug && console.group(this.localName + '#' + this.id + ': ' + c);
      // if (window.debug) { debugger; }
      // ----------------------------
      let hasPaths = this.__dataHasPaths;
      this.__dataHasPaths = false;
      let notifyProps;
      // Compute properties
      runComputedEffects(this, changedProps, oldProps, hasPaths);
      // Clear notify properties prior to possible reentry (propagate, observe),
      // but after computing effects have a chance to add to them
      notifyProps = this.__dataToNotify;
      this.__dataToNotify = null;
      // Propagate properties to clients
      this._propagatePropertyChanges(changedProps, oldProps, hasPaths);
      // Flush clients
      this._flushClients();
      // Reflect properties
      runEffects(this, this[TYPES.REFLECT], changedProps, oldProps, hasPaths);
      // Observe properties
      runEffects(this, this[TYPES.OBSERVE], changedProps, oldProps, hasPaths);
      // Notify properties to host
      if (notifyProps) {
        runNotifyEffects(this, notifyProps, changedProps, oldProps, hasPaths);
      }
      // Clear temporary cache at end of turn
      if (this.__dataCounter == 1) {
        this.__dataTemp = {};
      }
      // ----------------------------
      // window.debug && console.groupEnd(this.localName + '#' + this.id + ': ' + c);
      // ----------------------------
    }

    /**
     * Called to propagate any property changes to stamped template nodes
     * managed by this element.
     *
     * @override
     * @param {Object} changedProps Bag of changed properties
     * @param {Object} oldProps Bag of previous values for changed properties
     * @param {boolean} hasPaths True with `props` contains one or more paths
     * @return {void}
     * @protected
     */
    _propagatePropertyChanges(changedProps, oldProps, hasPaths) {
      if (this[TYPES.PROPAGATE]) {
        runEffects(this, this[TYPES.PROPAGATE], changedProps, oldProps, hasPaths);
      }
      if (this.__templateInfo) {
        this._runEffectsForTemplate(this.__templateInfo, changedProps, oldProps, hasPaths);
      }
    }

    _runEffectsForTemplate(templateInfo, changedProps, oldProps, hasPaths) {
      const baseRunEffects = (changedProps, hasPaths) => {
        runEffects(this, templateInfo.propertyEffects, changedProps, oldProps,
          hasPaths, templateInfo.nodeList);
        for (let info=templateInfo.firstChild; info; info=info.nextSibling) {
          this._runEffectsForTemplate(info, changedProps, oldProps, hasPaths);
        }
      };
      if (templateInfo.runEffects) {
        templateInfo.runEffects(baseRunEffects, changedProps, hasPaths);
      } else {
        baseRunEffects(changedProps, hasPaths);
      }
    }

    /**
     * Aliases one data path as another, such that path notifications from one
     * are routed to the other.
     *
     * @override
     * @param {string | !Array<string|number>} to Target path to link.
     * @param {string | !Array<string|number>} from Source path to link.
     * @return {void}
     * @public
     */
    linkPaths(to, from) {
      to = normalize(to);
      from = normalize(from);
      this.__dataLinkedPaths = this.__dataLinkedPaths || {};
      this.__dataLinkedPaths[to] = from;
    }

    /**
     * Removes a data path alias previously established with `_linkPaths`.
     *
     * Note, the path to unlink should be the target (`to`) used when
     * linking the paths.
     *
     * @override
     * @param {string | !Array<string|number>} path Target path to unlink.
     * @return {void}
     * @public
     */
    unlinkPaths(path) {
      path = normalize(path);
      if (this.__dataLinkedPaths) {
        delete this.__dataLinkedPaths[path];
      }
    }

    /**
     * Notify that an array has changed.
     *
     * Example:
     *
     *     this.items = [ {name: 'Jim'}, {name: 'Todd'}, {name: 'Bill'} ];
     *     ...
     *     this.items.splice(1, 1, {name: 'Sam'});
     *     this.items.push({name: 'Bob'});
     *     this.notifySplices('items', [
     *       { index: 1, removed: [{name: 'Todd'}], addedCount: 1,
     *         object: this.items, type: 'splice' },
     *       { index: 3, removed: [], addedCount: 1,
     *         object: this.items, type: 'splice'}
     *     ]);
     *
     * @param {string} path Path that should be notified.
     * @param {Array} splices Array of splice records indicating ordered
     *   changes that occurred to the array. Each record should have the
     *   following fields:
     *    * index: index at which the change occurred
     *    * removed: array of items that were removed from this index
     *    * addedCount: number of new items added at this index
     *    * object: a reference to the array in question
     *    * type: the string literal 'splice'
     *
     *   Note that splice records _must_ be normalized such that they are
     *   reported in index order (raw results from `Object.observe` are not
     *   ordered and must be normalized/merged before notifying).
     *
     * @override
     * @return {void}
     * @public
     */
    notifySplices(path, splices) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      notifySplices(this, array, info.path, splices);
    }

    /**
     * Convenience method for reading a value from a path.
     *
     * Note, if any part in the path is undefined, this method returns
     * `undefined` (this method does not throw when dereferencing undefined
     * paths).
     *
     * @override
     * @param {(string|!Array<(string|number)>)} path Path to the value
     *   to read.  The path may be specified as a string (e.g. `foo.bar.baz`)
     *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
     *   bracketed expressions are not supported; string-based path parts
     *   *must* be separated by dots.  Note that when dereferencing array
     *   indices, the index may be used as a dotted part directly
     *   (e.g. `users.12.name` or `['users', 12, 'name']`).
     * @param {Object=} root Root object from which the path is evaluated.
     * @return {*} Value at the path, or `undefined` if any part of the path
     *   is undefined.
     * @public
     */
    get(path, root) {
      return get(root || this, path);
    }

    /**
     * Convenience method for setting a value to a path and notifying any
     * elements bound to the same path.
     *
     * Note, if any part in the path except for the last is undefined,
     * this method does nothing (this method does not throw when
     * dereferencing undefined paths).
     *
     * @override
     * @param {(string|!Array<(string|number)>)} path Path to the value
     *   to write.  The path may be specified as a string (e.g. `'foo.bar.baz'`)
     *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
     *   bracketed expressions are not supported; string-based path parts
     *   *must* be separated by dots.  Note that when dereferencing array
     *   indices, the index may be used as a dotted part directly
     *   (e.g. `'users.12.name'` or `['users', 12, 'name']`).
     * @param {*} value Value to set at the specified path.
     * @param {Object=} root Root object from which the path is evaluated.
     *   When specified, no notification will occur.
     * @return {void}
     * @public
     */
    set(path, value, root) {
      if (root) {
        set(root, path, value);
      } else {
        if (!this[TYPES.READ_ONLY] || !this[TYPES.READ_ONLY][/** @type {string} */(path)]) {
          if (this._setPendingPropertyOrPath(path, value, true)) {
            this._invalidateProperties();
          }
        }
      }
    }

    /**
     * Adds items onto the end of the array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.push`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @param {...*} items Items to push onto array
     * @return {number} New length of the array.
     * @public
     */
    push(path, ...items) {
      let info = {path: ''};
      let array = /** @type {Array}*/(get(this, path, info));
      let len = array.length;
      let ret = array.push(...items);
      if (items.length) {
        notifySplice(this, array, info.path, len, items.length, []);
      }
      return ret;
    }

    /**
     * Removes an item from the end of array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.pop`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @return {*} Item that was removed.
     * @public
     */
    pop(path) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      let hadLength = Boolean(array.length);
      let ret = array.pop();
      if (hadLength) {
        notifySplice(this, array, info.path, array.length, 0, [ret]);
      }
      return ret;
    }

    /**
     * Starting from the start index specified, removes 0 or more items
     * from the array and inserts 0 or more new items in their place.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.splice`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @param {number} start Index from which to start removing/inserting.
     * @param {number=} deleteCount Number of items to remove.
     * @param {...*} items Items to insert into array.
     * @return {!Array} Array of removed items.
     * @public
     */
    splice(path, start, deleteCount, ...items) {
      let info = {path : ''};
      let array = /** @type {Array} */(get(this, path, info));
      // Normalize fancy native splice handling of crazy start values
      if (start < 0) {
        start = array.length - Math.floor(-start);
      } else if (start) {
        start = Math.floor(start);
      }
      // array.splice does different things based on the number of arguments
      // you pass in. Therefore, array.splice(0) and array.splice(0, undefined)
      // do different things. In the former, the whole array is cleared. In the
      // latter, no items are removed.
      // This means that we need to detect whether 1. one of the arguments
      // is actually passed in and then 2. determine how many arguments
      // we should pass on to the native array.splice
      //
      let ret;
      // Omit any additional arguments if they were not passed in
      if (arguments.length === 2) {
        ret = array.splice(start);
      // Either start was undefined and the others were defined, but in this
      // case we can safely pass on all arguments
      //
      // Note: this includes the case where none of the arguments were passed in,
      // e.g. this.splice('array'). However, if both start and deleteCount
      // are undefined, array.splice will not modify the array (as expected)
      } else {
        ret = array.splice(start, deleteCount, ...items);
      }
      // At the end, check whether any items were passed in (e.g. insertions)
      // or if the return array contains items (e.g. deletions).
      // Only notify if items were added or deleted.
      if (items.length || ret.length) {
        notifySplice(this, array, info.path, start, items.length, ret);
      }
      return ret;
    }

    /**
     * Removes an item from the beginning of array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.pop`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @return {*} Item that was removed.
     * @public
     */
    shift(path) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      let hadLength = Boolean(array.length);
      let ret = array.shift();
      if (hadLength) {
        notifySplice(this, array, info.path, 0, 0, [ret]);
      }
      return ret;
    }

    /**
     * Adds items onto the beginning of the array at the path specified.
     *
     * The arguments after `path` and return value match that of
     * `Array.prototype.push`.
     *
     * This method notifies other paths to the same array that a
     * splice occurred to the array.
     *
     * @override
     * @param {string | !Array<string|number>} path Path to array.
     * @param {...*} items Items to insert info array
     * @return {number} New length of the array.
     * @public
     */
    unshift(path, ...items) {
      let info = {path: ''};
      let array = /** @type {Array} */(get(this, path, info));
      let ret = array.unshift(...items);
      if (items.length) {
        notifySplice(this, array, info.path, 0, items.length, []);
      }
      return ret;
    }

    /**
     * Notify that a path has changed.
     *
     * Example:
     *
     *     this.item.user.name = 'Bob';
     *     this.notifyPath('item.user.name');
     *
     * @override
     * @param {string} path Path that should be notified.
     * @param {*=} value Value at the path (optional).
     * @return {void}
     * @public
     */
    notifyPath(path, value) {
      /** @type {string} */
      let propPath;
      if (arguments.length == 1) {
        // Get value if not supplied
        let info = {path: ''};
        value = get(this, path, info);
        propPath = info.path;
      } else if (Array.isArray(path)) {
        // Normalize path if needed
        propPath = normalize(path);
      } else {
        propPath = /** @type{string} */(path);
      }
      if (this._setPendingPropertyOrPath(propPath, value, true, true)) {
        this._invalidateProperties();
      }
    }

    /**
     * Equivalent to static `createReadOnlyProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @param {boolean=} protectedSetter Creates a custom protected setter
     *   when `true`.
     * @return {void}
     * @protected
     */
    _createReadOnlyProperty(property, protectedSetter) {
      this._addPropertyEffect(property, TYPES.READ_ONLY);
      if (protectedSetter) {
        this['_set' + upper(property)] = /** @this {PropertyEffects} */function(value) {
          this._setProperty(property, value);
        };
      }
    }

    /**
     * Equivalent to static `createPropertyObserver` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @param {string|function(*,*)} method Function or name of observer method
     *     to call
     * @param {boolean=} dynamicFn Whether the method name should be included as
     *   a dependency to the effect.
     * @return {void}
     * @protected
     */
    _createPropertyObserver(property, method, dynamicFn) {
      let info = { property, method, dynamicFn: Boolean(dynamicFn) };
      this._addPropertyEffect(property, TYPES.OBSERVE, {
        fn: runObserverEffect, info, trigger: {name: property}
      });
      if (dynamicFn) {
        this._addPropertyEffect(/** @type {string} */(method), TYPES.OBSERVE, {
          fn: runObserverEffect, info, trigger: {name: method}
        });
      }
    }

    /**
     * Equivalent to static `createMethodObserver` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating
     *   whether method names should be included as a dependency to the effect.
     * @return {void}
     * @protected
     */
    _createMethodObserver(expression, dynamicFn) {
      let sig = parseMethod(expression);
      if (!sig) {
        throw new Error("Malformed observer expression '" + expression + "'");
      }
      createMethodEffect(this, sig, TYPES.OBSERVE, runMethodEffect, null, dynamicFn);
    }

    /**
     * Equivalent to static `createNotifyingProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @return {void}
     * @protected
     */
    _createNotifyingProperty(property) {
      this._addPropertyEffect(property, TYPES.NOTIFY, {
        fn: runNotifyEffect,
        info: {
          eventName: camelToDashCase(property) + '-changed',
          property: property
        }
      });
    }

    /**
     * Equivalent to static `createReflectedProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Property name
     * @return {void}
     * @protected
     * @suppress {missingProperties} go/missingfnprops
     */
    _createReflectedProperty(property) {
      let attr = this.constructor.attributeNameForProperty(property);
      if (attr[0] === '-') {
        console.warn('Property ' + property + ' cannot be reflected to attribute ' +
          attr + ' because "-" is not a valid starting attribute name. Use a lowercase first letter for the property instead.');
      } else {
        this._addPropertyEffect(property, TYPES.REFLECT, {
          fn: runReflectEffect,
          info: {
            attrName: attr
          }
        });
      }
    }

    /**
     * Equivalent to static `createComputedProperty` API but can be called on
     * an instance to add effects at runtime.  See that method for
     * full API docs.
     *
     * @override
     * @param {string} property Name of computed property to set
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating
     *   whether method names should be included as a dependency to the effect.
     * @return {void}
     * @protected
     */
    _createComputedProperty(property, expression, dynamicFn) {
      let sig = parseMethod(expression);
      if (!sig) {
        throw new Error("Malformed computed expression '" + expression + "'");
      }
      const info = createMethodEffect(this, sig, TYPES.COMPUTE, runComputedEffect, property, dynamicFn);
      // Effects are normally stored as map of dependency->effect, but for
      // ordered computation, we also need tree of computedProp->dependencies
      ensureOwnEffectMap(this, COMPUTE_INFO)[property] = info;
    }

    /**
     * Gather the argument values for a method specified in the provided array
     * of argument metadata.
     *
     * The `path` and `value` arguments are used to fill in wildcard descriptor
     * when the method is being called as a result of a path notification.
     *
     * @param {!Array<!MethodArg>} args Array of argument metadata
     * @param {string} path Property/path name that triggered the method effect
     * @param {Object} props Bag of current property changes
     * @return {!Array<*>} Array of argument values
     * @private
     */
    _marshalArgs(args, path, props) {
      const data = this.__data;
      const values = [];
      for (let i=0, l=args.length; i<l; i++) {
        let {name, structured, wildcard, value, literal} = args[i];
        if (!literal) {
          if (wildcard) {
            const matches = isDescendant(name, path);
            const pathValue = getArgValue(data, props, matches ? path : name);
            value = {
              path: matches ? path : name,
              value: pathValue,
              base: matches ? get(data, name) : pathValue
            };
          } else {
            value = structured ? getArgValue(data, props, name) : data[name];
          }
        }
        // When the `legacyUndefined` flag is enabled, pass a no-op value
        // so that the observer, computed property, or compound binding is aborted.
        if (legacyUndefined && !this._overrideLegacyUndefined && value === undefined && args.length > 1) {
          return NOOP;
        }
        values[i] = value;
      }
      return values;
    }

    // -- static class methods ------------

    /**
     * Ensures an accessor exists for the specified property, and adds
     * to a list of "property effects" that will run when the accessor for
     * the specified property is set.  Effects are grouped by "type", which
     * roughly corresponds to a phase in effect processing.  The effect
     * metadata should be in the following form:
     *
     *     {
     *       fn: effectFunction, // Reference to function to call to perform effect
     *       info: { ... }       // Effect metadata passed to function
     *       trigger: {          // Optional triggering metadata; if not provided
     *         name: string      // the property is treated as a wildcard
     *         structured: boolean
     *         wildcard: boolean
     *       }
     *     }
     *
     * Effects are called from `_propertiesChanged` in the following order by
     * type:
     *
     * 1. COMPUTE
     * 2. PROPAGATE
     * 3. REFLECT
     * 4. OBSERVE
     * 5. NOTIFY
     *
     * Effect functions are called with the following signature:
     *
     *     effectFunction(inst, path, props, oldProps, info, hasPaths)
     *
     * @param {string} property Property that should trigger the effect
     * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     * @nocollapse
     */
    static addPropertyEffect(property, type, effect) {
      this.prototype._addPropertyEffect(property, type, effect);
    }

    /**
     * Creates a single-property observer for the given property.
     *
     * @param {string} property Property name
     * @param {string|function(*,*)} method Function or name of observer method to call
     * @param {boolean=} dynamicFn Whether the method name should be included as
     *   a dependency to the effect.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createPropertyObserver(property, method, dynamicFn) {
      this.prototype._createPropertyObserver(property, method, dynamicFn);
    }

    /**
     * Creates a multi-property "method observer" based on the provided
     * expression, which should be a string in the form of a normal JavaScript
     * function signature: `'methodName(arg1, [..., argn])'`.  Each argument
     * should correspond to a property or path in the context of this
     * prototype (or instance), or may be a literal string or number.
     *
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating
     * @return {void}
     *   whether method names should be included as a dependency to the effect.
     * @protected
     * @nocollapse
     */
    static createMethodObserver(expression, dynamicFn) {
      this.prototype._createMethodObserver(expression, dynamicFn);
    }

    /**
     * Causes the setter for the given property to dispatch `<property>-changed`
     * events to notify of changes to the property.
     *
     * @param {string} property Property name
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createNotifyingProperty(property) {
      this.prototype._createNotifyingProperty(property);
    }

    /**
     * Creates a read-only accessor for the given property.
     *
     * To set the property, use the protected `_setProperty` API.
     * To create a custom protected setter (e.g. `_setMyProp()` for
     * property `myProp`), pass `true` for `protectedSetter`.
     *
     * Note, if the property will have other property effects, this method
     * should be called first, before adding other effects.
     *
     * @param {string} property Property name
     * @param {boolean=} protectedSetter Creates a custom protected setter
     *   when `true`.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createReadOnlyProperty(property, protectedSetter) {
      this.prototype._createReadOnlyProperty(property, protectedSetter);
    }

    /**
     * Causes the setter for the given property to reflect the property value
     * to a (dash-cased) attribute of the same name.
     *
     * @param {string} property Property name
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createReflectedProperty(property) {
      this.prototype._createReflectedProperty(property);
    }

    /**
     * Creates a computed property whose value is set to the result of the
     * method described by the given `expression` each time one or more
     * arguments to the method changes.  The expression should be a string
     * in the form of a normal JavaScript function signature:
     * `'methodName(arg1, [..., argn])'`
     *
     * @param {string} property Name of computed property to set
     * @param {string} expression Method expression
     * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
     *   method names should be included as a dependency to the effect.
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createComputedProperty(property, expression, dynamicFn) {
      this.prototype._createComputedProperty(property, expression, dynamicFn);
    }

    /**
     * Parses the provided template to ensure binding effects are created
     * for them, and then ensures property accessors are created for any
     * dependent properties in the template.  Binding effects for bound
     * templates are stored in a linked list on the instance so that
     * templates can be efficiently stamped and unstamped.
     *
     * @param {!HTMLTemplateElement} template Template containing binding
     *   bindings
     * @return {!TemplateInfo} Template metadata object
     * @protected
     * @nocollapse
     */
    static bindTemplate(template) {
      return this.prototype._bindTemplate(template);
    }

    // -- binding ----------------------------------------------

    /*
     * Overview of binding flow:
     *
     * During finalization (`instanceBinding==false`, `wasPreBound==false`):
     *  `_bindTemplate(t, false)` called directly during finalization - parses
     *  the template (for the first time), and then assigns that _prototypical_
     *  template info to `__preboundTemplateInfo` _on the prototype_; note in
     *  this case `wasPreBound` is false; this is the first time we're binding
     *  it, thus we create accessors.
     *
     * During first stamping (`instanceBinding==true`, `wasPreBound==true`):
     *   `_stampTemplate` calls `_bindTemplate(t, true)`: the `templateInfo`
     *   returned matches the prebound one, and so this is `wasPreBound == true`
     *   state; thus we _skip_ creating accessors, but _do_ create an instance
     *   of the template info to serve as the start of our linked list (needs to
     *   be an instance, not the prototypical one, so that we can add `nodeList`
     *   to it to contain the `nodeInfo`-ordered list of instance nodes for
     *   bindings, and so we can chain runtime-stamped template infos off of
     *   it). At this point, the call to `_stampTemplate` calls
     *   `applyTemplateInfo` for each nested `<template>` found during parsing
     *   to hand prototypical `_templateInfo` to them; we also pass the _parent_
     *   `templateInfo` to the `<template>` so that we have the instance-time
     *   parent to link the `templateInfo` under in the case it was
     *   runtime-stamped.
     *
     * During subsequent runtime stamping (`instanceBinding==true`,
     *   `wasPreBound==false`): `_stampTemplate` calls `_bindTemplate(t, true)`
     *   - here `templateInfo` is guaranteed to _not_ match the prebound one,
     *   because it was either a different template altogether, or even if it
     *   was the same template, the step above created a instance of the info;
     *   in this case `wasPreBound == false`, so we _do_ create accessors, _and_
     *   link a instance into the linked list.
     */

    /**
     * Equivalent to static `bindTemplate` API but can be called on an instance
     * to add effects at runtime.  See that method for full API docs.
     *
     * This method may be called on the prototype (for prototypical template
     * binding, to avoid creating accessors every instance) once per prototype,
     * and will be called with `runtimeBinding: true` by `_stampTemplate` to
     * create and link an instance of the template metadata associated with a
     * particular stamping.
     *
     * @override
     * @param {!HTMLTemplateElement} template Template containing binding
     * bindings
     * @param {boolean=} instanceBinding When false (default), performs
     * "prototypical" binding of the template and overwrites any previously
     * bound template for the class. When true (as passed from
     * `_stampTemplate`), the template info is instanced and linked into the
     * list of bound templates.
     * @return {!TemplateInfo} Template metadata object; for `runtimeBinding`,
     * this is an instance of the prototypical template info
     * @protected
     * @suppress {missingProperties} go/missingfnprops
     */
    _bindTemplate(template, instanceBinding) {
      let templateInfo = this.constructor._parseTemplate(template);
      let wasPreBound = this.__preBoundTemplateInfo == templateInfo;
      // Optimization: since this is called twice for proto-bound templates,
      // don't attempt to recreate accessors if this template was pre-bound
      if (!wasPreBound) {
        for (let prop in templateInfo.propertyEffects) {
          this._createPropertyAccessor(prop);
        }
      }
      if (instanceBinding) {
        // For instance-time binding, create instance of template metadata
        // and link into tree of templates if necessary
        templateInfo = /** @type {!TemplateInfo} */(Object.create(templateInfo));
        templateInfo.wasPreBound = wasPreBound;
        if (!this.__templateInfo) {
          // Set the info to the root of the tree
          this.__templateInfo = templateInfo;
        } else {
          // Append this template info onto the end of its parent template's
          // list, which will determine the tree structure via which property
          // effects are run; if this template was not nested in another
          // template, use the root template (the first stamped one) as the
          // parent. Note, `parent` is the `templateInfo` instance for this
          // template's parent (containing) template, which was set up in
          // `applyTemplateInfo`.  While a given template's `parent` is set
          // apriori, it is only added to the parent's child list at the point
          // that it is being bound, since a template may or may not ever be
          // stamped, and may be stamped more than once (in which case instances
          // of the template info will be in the tree under its parent more than
          // once).
          const parent = template._parentTemplateInfo || this.__templateInfo;
          const previous = parent.lastChild;
          templateInfo.parent = parent;
          parent.lastChild = templateInfo;
          templateInfo.previousSibling = previous;
          if (previous) {
            previous.nextSibling = templateInfo;
          } else {
            parent.firstChild = templateInfo;
          }
        }
      } else {
        this.__preBoundTemplateInfo = templateInfo;
      }
      return templateInfo;
    }

    /**
     * Adds a property effect to the given template metadata, which is run
     * at the "propagate" stage of `_propertiesChanged` when the template
     * has been bound to the element via `_bindTemplate`.
     *
     * The `effect` object should match the format in `_addPropertyEffect`.
     *
     * @param {Object} templateInfo Template metadata to add effect to
     * @param {string} prop Property that should trigger the effect
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     * @nocollapse
     */
    static _addTemplatePropertyEffect(templateInfo, prop, effect) {
      let hostProps = templateInfo.hostProps = templateInfo.hostProps || {};
      hostProps[prop] = true;
      let effects = templateInfo.propertyEffects = templateInfo.propertyEffects || {};
      let propEffects = effects[prop] = effects[prop] || [];
      propEffects.push(effect);
    }

    /**
     * Stamps the provided template and performs instance-time setup for
     * Polymer template features, including data bindings, declarative event
     * listeners, and the `this.$` map of `id`'s to nodes.  A document fragment
     * is returned containing the stamped DOM, ready for insertion into the
     * DOM.
     *
     * This method may be called more than once; however note that due to
     * `shadycss` polyfill limitations, only styles from templates prepared
     * using `ShadyCSS.prepareTemplate` will be correctly polyfilled (scoped
     * to the shadow root and support CSS custom properties), and note that
     * `ShadyCSS.prepareTemplate` may only be called once per element. As such,
     * any styles required by in runtime-stamped templates must be included
     * in the main element template.
     *
     * @param {!HTMLTemplateElement} template Template to stamp
     * @param {TemplateInfo=} templateInfo Optional bound template info associated
     *   with the template to be stamped; if omitted the template will be
     *   automatically bound.
     * @return {!StampedTemplate} Cloned template content
     * @override
     * @protected
     */
    _stampTemplate(template, templateInfo) {
      templateInfo =  templateInfo || /** @type {!TemplateInfo} */(this._bindTemplate(template, true));
      // Ensures that created dom is `_enqueueClient`'d to this element so
      // that it can be flushed on next call to `_flushProperties`
      hostStack.push(this);
      let dom = super._stampTemplate(template, templateInfo);
      hostStack.pop();
      // Add template-instance-specific data to instanced templateInfo
      templateInfo.nodeList = dom.nodeList;
      // Capture child nodes to allow unstamping of non-prototypical templates
      if (!templateInfo.wasPreBound) {
        let nodes = templateInfo.childNodes = [];
        for (let n=dom.firstChild; n; n=n.nextSibling) {
          nodes.push(n);
        }
      }
      dom.templateInfo = templateInfo;
      // Setup compound storage, 2-way listeners, and dataHost for bindings
      setupBindings(this, templateInfo);
      // Flush properties into template nodes; the check on `__dataClientsReady`
      // ensures we don't needlessly run effects for an element's initial
      // prototypical template stamping since they will happen as a part of the
      // first call to `_propertiesChanged`. This flag is set to true
      // after running the initial propagate effects, and immediately before
      // flushing clients. Since downstream clients could cause stamping on
      // this host (e.g. a fastDomIf `dom-if` being forced to render
      // synchronously), this flag ensures effects for runtime-stamped templates
      // are run at this point during the initial element boot-up.
      if (this.__dataClientsReady) {
        this._runEffectsForTemplate(templateInfo, this.__data, null, false);
        this._flushClients();
      }
      return dom;
    }

    /**
     * Removes and unbinds the nodes previously contained in the provided
     * DocumentFragment returned from `_stampTemplate`.
     *
     * @override
     * @param {!StampedTemplate} dom DocumentFragment previously returned
     *   from `_stampTemplate` associated with the nodes to be removed
     * @return {void}
     * @protected
     */
    _removeBoundDom(dom) {
      // Unlink template info; Note that while the child is unlinked from its
      // parent list, a template's `parent` reference is never removed, since
      // this is is determined by the tree structure and applied at
      // `applyTemplateInfo` time.
      const templateInfo = dom.templateInfo;
      const {previousSibling, nextSibling, parent} = templateInfo;
      if (previousSibling) {
        previousSibling.nextSibling = nextSibling;
      } else if (parent) {
        parent.firstChild = nextSibling;
      }
      if (nextSibling) {
        nextSibling.previousSibling = previousSibling;
      } else if (parent) {
        parent.lastChild = previousSibling;
      }
      templateInfo.nextSibling = templateInfo.previousSibling = null;
      // Remove stamped nodes
      let nodes = templateInfo.childNodes;
      for (let i=0; i<nodes.length; i++) {
        let node = nodes[i];
        wrap$1(wrap$1(node).parentNode).removeChild(node);
      }
    }

    /**
     * Overrides default `TemplateStamp` implementation to add support for
     * parsing bindings from `TextNode`'s' `textContent`.  A `bindings`
     * array is added to `nodeInfo` and populated with binding metadata
     * with information capturing the binding target, and a `parts` array
     * with one or more metadata objects capturing the source(s) of the
     * binding.
     *
     * @param {Node} node Node to parse
     * @param {TemplateInfo} templateInfo Template metadata for current template
     * @param {NodeInfo} nodeInfo Node metadata for current template node
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateNode(node, templateInfo, nodeInfo) {
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      let noted = propertyEffectsBase._parseTemplateNode.call(
        this, node, templateInfo, nodeInfo);
      if (node.nodeType === Node.TEXT_NODE) {
        let parts = this._parseBindings(node.textContent, templateInfo);
        if (parts) {
          // Initialize the textContent with any literal parts
          // NOTE: default to a space here so the textNode remains; some browsers
          // (IE) omit an empty textNode following cloneNode/importNode.
          node.textContent = literalFromParts(parts) || ' ';
          addBinding(this, templateInfo, nodeInfo, 'text', 'textContent', parts);
          noted = true;
        }
      }
      return noted;
    }

    /**
     * Overrides default `TemplateStamp` implementation to add support for
     * parsing bindings from attributes.  A `bindings`
     * array is added to `nodeInfo` and populated with binding metadata
     * with information capturing the binding target, and a `parts` array
     * with one or more metadata objects capturing the source(s) of the
     * binding.
     *
     * @param {Element} node Node to parse
     * @param {TemplateInfo} templateInfo Template metadata for current template
     * @param {NodeInfo} nodeInfo Node metadata for current template node
     * @param {string} name Attribute name
     * @param {string} value Attribute value
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateNodeAttribute(node, templateInfo, nodeInfo, name, value) {
      let parts = this._parseBindings(value, templateInfo);
      if (parts) {
        // Attribute or property
        let origName = name;
        let kind = 'property';
        // The only way we see a capital letter here is if the attr has
        // a capital letter in it per spec. In this case, to make sure
        // this binding works, we go ahead and make the binding to the attribute.
        if (capitalAttributeRegex.test(name)) {
          kind = 'attribute';
        } else if (name[name.length-1] == '$') {
          name = name.slice(0, -1);
          kind = 'attribute';
        }
        // Initialize attribute bindings with any literal parts
        let literal = literalFromParts(parts);
        if (literal && kind == 'attribute') {
          // Ensure a ShadyCSS template scoped style is not removed
          // when a class$ binding's initial literal value is set.
          if (name == 'class' && node.hasAttribute('class')) {
            literal += ' ' + node.getAttribute(name);
          }
          node.setAttribute(name, literal);
        }
        // support disable-upgrade
        if (kind == 'attribute' && origName == 'disable-upgrade$') {
          node.setAttribute(name, '');
        }
        // Clear attribute before removing, since IE won't allow removing
        // `value` attribute if it previously had a value (can't
        // unconditionally set '' before removing since attributes with `$`
        // can't be set using setAttribute)
        if (node.localName === 'input' && origName === 'value') {
          node.setAttribute(origName, '');
        }
        // Remove annotation
        node.removeAttribute(origName);
        // Case hackery: attributes are lower-case, but bind targets
        // (properties) are case sensitive. Gambit is to map dash-case to
        // camel-case: `foo-bar` becomes `fooBar`.
        // Attribute bindings are excepted.
        if (kind === 'property') {
          name = dashToCamelCase(name);
        }
        addBinding(this, templateInfo, nodeInfo, kind, name, parts, literal);
        return true;
      } else {
        // TODO(https://github.com/google/closure-compiler/issues/3240):
        //     Change back to just super.methodCall()
        return propertyEffectsBase._parseTemplateNodeAttribute.call(
          this, node, templateInfo, nodeInfo, name, value);
      }
    }

    /**
     * Overrides default `TemplateStamp` implementation to add support for
     * binding the properties that a nested template depends on to the template
     * as `_host_<property>`.
     *
     * @param {Node} node Node to parse
     * @param {TemplateInfo} templateInfo Template metadata for current template
     * @param {NodeInfo} nodeInfo Node metadata for current template node
     * @return {boolean} `true` if the visited node added node-specific
     *   metadata to `nodeInfo`
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateNestedTemplate(node, templateInfo, nodeInfo) {
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      let noted = propertyEffectsBase._parseTemplateNestedTemplate.call(
        this, node, templateInfo, nodeInfo);
      const parent = node.parentNode;
      const nestedTemplateInfo = nodeInfo.templateInfo;
      const isDomIf = parent.localName === 'dom-if';
      const isDomRepeat = parent.localName === 'dom-repeat';
      // Remove nested template and redirect its host bindings & templateInfo
      // onto the parent (dom-if/repeat element)'s nodeInfo
      if (removeNestedTemplates && (isDomIf || isDomRepeat)) {
        parent.removeChild(node);
        // Use the parent's nodeInfo (for the dom-if/repeat) to record the
        // templateInfo, and use that for any host property bindings below
        nodeInfo = nodeInfo.parentInfo;
        nodeInfo.templateInfo = nestedTemplateInfo;
        // Ensure the parent dom-if/repeat is noted since it now may have host
        // bindings; it may not have been if it did not have its own bindings
        nodeInfo.noted = true;
        noted = false;
      }
      // Merge host props into outer template and add bindings
      let hostProps = nestedTemplateInfo.hostProps;
      if (fastDomIf && isDomIf) {
        // `fastDomIf` mode uses runtime-template stamping to add accessors/
        // effects to properties used in its template; as such we don't need to
        // tax the host element with `_host_` bindings for the `dom-if`.
        // However, in the event it is nested in a `dom-repeat`, it is still
        // important that its host properties are added to the
        // TemplateInstance's `hostProps` so that they are forwarded to the
        // TemplateInstance.
        if (hostProps) {
          templateInfo.hostProps =
            Object.assign(templateInfo.hostProps || {}, hostProps);
          // Ensure the dom-if is noted so that it has a __dataHost, since
          // `fastDomIf` uses the host for runtime template stamping; note this
          // was already ensured above in the `removeNestedTemplates` case
          if (!removeNestedTemplates) {
            nodeInfo.parentInfo.noted = true;
          }
        }
      } else {
        let mode = '{';
        for (let source in hostProps) {
          let parts = [{ mode, source, dependencies: [source], hostProp: true }];
          addBinding(this, templateInfo, nodeInfo, 'property', '_host_' + source, parts);
        }
      }
      return noted;
    }

    /**
     * Called to parse text in a template (either attribute values or
     * textContent) into binding metadata.
     *
     * Any overrides of this method should return an array of binding part
     * metadata  representing one or more bindings found in the provided text
     * and any "literal" text in between.  Any non-literal parts will be passed
     * to `_evaluateBinding` when any dependencies change.  The only required
     * fields of each "part" in the returned array are as follows:
     *
     * - `dependencies` - Array containing trigger metadata for each property
     *   that should trigger the binding to update
     * - `literal` - String containing text if the part represents a literal;
     *   in this case no `dependencies` are needed
     *
     * Additional metadata for use by `_evaluateBinding` may be provided in
     * each part object as needed.
     *
     * The default implementation handles the following types of bindings
     * (one or more may be intermixed with literal strings):
     * - Property binding: `[[prop]]`
     * - Path binding: `[[object.prop]]`
     * - Negated property or path bindings: `[[!prop]]` or `[[!object.prop]]`
     * - Two-way property or path bindings (supports negation):
     *   `{{prop}}`, `{{object.prop}}`, `{{!prop}}` or `{{!object.prop}}`
     * - Inline computed method (supports negation):
     *   `[[compute(a, 'literal', b)]]`, `[[!compute(a, 'literal', b)]]`
     *
     * The default implementation uses a regular expression for best
     * performance. However, the regular expression uses a white-list of
     * allowed characters in a data-binding, which causes problems for
     * data-bindings that do use characters not in this white-list.
     *
     * Instead of updating the white-list with all allowed characters,
     * there is a StrictBindingParser (see lib/mixins/strict-binding-parser)
     * that uses a state machine instead. This state machine is able to handle
     * all characters. However, it is slightly less performant, therefore we
     * extracted it into a separate optional mixin.
     *
     * @param {string} text Text to parse from attribute or textContent
     * @param {Object} templateInfo Current template metadata
     * @return {Array<!BindingPart>} Array of binding part metadata
     * @protected
     * @nocollapse
     */
    static _parseBindings(text, templateInfo) {
      let parts = [];
      let lastIndex = 0;
      let m;
      // Example: "literal1{{prop}}literal2[[!compute(foo,bar)]]final"
      // Regex matches:
      //        Iteration 1:  Iteration 2:
      // m[1]: '{{'          '[['
      // m[2]: ''            '!'
      // m[3]: 'prop'        'compute(foo,bar)'
      while ((m = bindingRegex.exec(text)) !== null) {
        // Add literal part
        if (m.index > lastIndex) {
          parts.push({literal: text.slice(lastIndex, m.index)});
        }
        // Add binding part
        let mode = m[1][0];
        let negate = Boolean(m[2]);
        let source = m[3].trim();
        let customEvent = false, notifyEvent = '', colon = -1;
        if (mode == '{' && (colon = source.indexOf('::')) > 0) {
          notifyEvent = source.substring(colon + 2);
          source = source.substring(0, colon);
          customEvent = true;
        }
        let signature = parseMethod(source);
        let dependencies = [];
        if (signature) {
          // Inline computed function
          let {args, methodName} = signature;
          for (let i=0; i<args.length; i++) {
            let arg = args[i];
            if (!arg.literal) {
              dependencies.push(arg);
            }
          }
          let dynamicFns = templateInfo.dynamicFns;
          if (dynamicFns && dynamicFns[methodName] || signature.static) {
            dependencies.push(methodName);
            signature.dynamicFn = true;
          }
        } else {
          // Property or path
          dependencies.push(source);
        }
        parts.push({
          source, mode, negate, customEvent, signature, dependencies,
          event: notifyEvent
        });
        lastIndex = bindingRegex.lastIndex;
      }
      // Add a final literal part
      if (lastIndex && lastIndex < text.length) {
        let literal = text.substring(lastIndex);
        if (literal) {
          parts.push({
            literal: literal
          });
        }
      }
      if (parts.length) {
        return parts;
      } else {
        return null;
      }
    }

    /**
     * Called to evaluate a previously parsed binding part based on a set of
     * one or more changed dependencies.
     *
     * @param {!Polymer_PropertyEffects} inst Element that should be used as
     *     scope for binding dependencies
     * @param {BindingPart} part Binding part metadata
     * @param {string} path Property/path that triggered this effect
     * @param {Object} props Bag of current property changes
     * @param {Object} oldProps Bag of previous values for changed properties
     * @param {boolean} hasPaths True with `props` contains one or more paths
     * @return {*} Value the binding part evaluated to
     * @protected
     * @nocollapse
     */
    static _evaluateBinding(inst, part, path, props, oldProps, hasPaths) {
      let value;
      if (part.signature) {
        value = runMethodEffect(inst, path, props, oldProps, part.signature);
      } else if (path != part.source) {
        value = get(inst, part.source);
      } else {
        if (hasPaths && isPath(path)) {
          value = get(inst, path);
        } else {
          value = inst.__data[path];
        }
      }
      if (part.negate) {
        value = !value;
      }
      return value;
    }

  }

  return PropertyEffects;
});

/**
 * Stack for enqueuing client dom created by a host element.
 *
 * By default elements are flushed via `_flushProperties` when
 * `connectedCallback` is called. Elements attach their client dom to
 * themselves at `ready` time which results from this first flush.
 * This provides an ordering guarantee that the client dom an element
 * creates is flushed before the element itself (i.e. client `ready`
 * fires before host `ready`).
 *
 * However, if `_flushProperties` is called *before* an element is connected,
 * as for example `Templatize` does, this ordering guarantee cannot be
 * satisfied because no elements are connected. (Note: Bound elements that
 * receive data do become enqueued clients and are properly ordered but
 * unbound elements are not.)
 *
 * To maintain the desired "client before host" ordering guarantee for this
 * case we rely on the "host stack. Client nodes registers themselves with
 * the creating host element when created. This ensures that all client dom
 * is readied in the proper order, maintaining the desired guarantee.
 *
 * @private
 */
const hostStack = [];

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Registers a class prototype for telemetry purposes.
 * @param {!PolymerElementConstructor} prototype Element prototype to register
 * @protected
 */
function register(prototype) {
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Creates a copy of `props` with each property normalized such that
 * upgraded it is an object with at least a type property { type: Type}.
 *
 * @param {!Object} props Properties to normalize
 * @return {!Object} Copy of input `props` with normalized properties that
 * are in the form {type: Type}
 * @private
 */
function normalizeProperties(props) {
  const output = {};
  for (let p in props) {
    const o = props[p];
    output[p] = (typeof o === 'function') ? {type: o} : o;
  }
  return output;
}

/**
 * Mixin that provides a minimal starting point to using the PropertiesChanged
 * mixin by providing a mechanism to declare properties in a static
 * getter (e.g. static get properties() { return { foo: String } }). Changes
 * are reported via the `_propertiesChanged` method.
 *
 * This mixin provides no specific support for rendering. Users are expected
 * to create a ShadowRoot and put content into it and update it in whatever
 * way makes sense. This can be done in reaction to properties changing by
 * implementing `_propertiesChanged`.
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin PropertiesChanged
 * @summary Mixin that provides a minimal starting point for using
 * the PropertiesChanged mixin by providing a declarative `properties` object.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const PropertiesMixin = dedupingMixin(superClass => {

 /**
  * @constructor
  * @implements {Polymer_PropertiesChanged}
  * @private
  */
 const base = PropertiesChanged(superClass);

 /**
  * Returns the super class constructor for the given class, if it is an
  * instance of the PropertiesMixin.
  *
  * @param {!PropertiesMixinConstructor} constructor PropertiesMixin constructor
  * @return {?PropertiesMixinConstructor} Super class constructor
  */
 function superPropertiesClass(constructor) {
   const superCtor = Object.getPrototypeOf(constructor);

   // Note, the `PropertiesMixin` class below only refers to the class
   // generated by this call to the mixin; the instanceof test only works
   // because the mixin is deduped and guaranteed only to apply once, hence
   // all constructors in a proto chain will see the same `PropertiesMixin`
   return (superCtor.prototype instanceof PropertiesMixin) ?
     /** @type {!PropertiesMixinConstructor} */ (superCtor) : null;
 }

 /**
  * Returns a memoized version of the `properties` object for the
  * given class. Properties not in object format are converted to at
  * least {type}.
  *
  * @param {PropertiesMixinConstructor} constructor PropertiesMixin constructor
  * @return {Object} Memoized properties object
  */
 function ownProperties(constructor) {
   if (!constructor.hasOwnProperty(JSCompiler_renameProperty('__ownProperties', constructor))) {
     let props = null;

     if (constructor.hasOwnProperty(JSCompiler_renameProperty('properties', constructor))) {
       const properties = constructor.properties;

       if (properties) {
        props = normalizeProperties(properties);
       }
     }

     constructor.__ownProperties = props;
   }
   return constructor.__ownProperties;
 }

 /**
  * @polymer
  * @mixinClass
  * @extends {base}
  * @implements {Polymer_PropertiesMixin}
  * @unrestricted
  */
 class PropertiesMixin extends base {

   /**
    * Implements standard custom elements getter to observes the attributes
    * listed in `properties`.
    * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
    * @nocollapse
    */
   static get observedAttributes() {
     if (!this.hasOwnProperty(JSCompiler_renameProperty('__observedAttributes', this))) {
       register(this.prototype);
       const props = this._properties;
       this.__observedAttributes = props ? Object.keys(props).map(p => this.prototype._addPropertyToAttributeMap(p)) : [];
     }
     return this.__observedAttributes;
   }

   /**
    * Finalizes an element definition, including ensuring any super classes
    * are also finalized. This includes ensuring property
    * accessors exist on the element prototype. This method calls
    * `_finalizeClass` to finalize each constructor in the prototype chain.
    * @return {void}
    * @nocollapse
    */
   static finalize() {
     if (!this.hasOwnProperty(JSCompiler_renameProperty('__finalized', this))) {
       const superCtor = superPropertiesClass(/** @type {!PropertiesMixinConstructor} */(this));
       if (superCtor) {
         superCtor.finalize();
       }
       this.__finalized = true;
       this._finalizeClass();
     }
   }

   /**
    * Finalize an element class. This includes ensuring property
    * accessors exist on the element prototype. This method is called by
    * `finalize` and finalizes the class constructor.
    *
    * @protected
    * @nocollapse
    */
   static _finalizeClass() {
     const props = ownProperties(/** @type {!PropertiesMixinConstructor} */(this));
     if (props) {
       /** @type {?} */ (this).createProperties(props);
     }
   }

   /**
    * Returns a memoized version of all properties, including those inherited
    * from super classes. Properties not in object format are converted to
    * at least {type}.
    *
    * @return {Object} Object containing properties for this class
    * @protected
    * @nocollapse
    */
   static get _properties() {
     if (!this.hasOwnProperty(
       JSCompiler_renameProperty('__properties', this))) {
       const superCtor = superPropertiesClass(/** @type {!PropertiesMixinConstructor} */(this));
       this.__properties = Object.assign({},
         superCtor && superCtor._properties,
         ownProperties(/** @type {PropertiesMixinConstructor} */(this)));
     }
     return this.__properties;
   }

   /**
    * Overrides `PropertiesChanged` method to return type specified in the
    * static `properties` object for the given property.
    * @param {string} name Name of property
    * @return {*} Type to which to deserialize attribute
    *
    * @protected
    * @nocollapse
    */
   static typeForProperty(name) {
     const info = this._properties[name];
     return info && info.type;
   }

   /**
    * Overrides `PropertiesChanged` method and adds a call to
    * `finalize` which lazily configures the element's property accessors.
    * @override
    * @return {void}
    */
   _initializeProperties() {
     this.constructor.finalize();
     super._initializeProperties();
   }

   /**
    * Called when the element is added to a document.
    * Calls `_enableProperties` to turn on property system from
    * `PropertiesChanged`.
    * @suppress {missingProperties} Super may or may not implement the callback
    * @return {void}
    * @override
    */
   connectedCallback() {
     if (super.connectedCallback) {
       super.connectedCallback();
     }
     this._enableProperties();
   }

   /**
    * Called when the element is removed from a document
    * @suppress {missingProperties} Super may or may not implement the callback
    * @return {void}
    * @override
    */
   disconnectedCallback() {
     if (super.disconnectedCallback) {
       super.disconnectedCallback();
     }
   }

 }

 return PropertiesMixin;

});

/**
 * @fileoverview
 * @suppress {checkPrototypalTypes}
 * @license Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * Current Polymer version in Semver notation.
 * @type {string} Semver notation of the current version of Polymer.
 */
const version = '3.4.1';

const builtCSS = window.ShadyCSS && window.ShadyCSS['cssBuild'];

/**
 * Element class mixin that provides the core API for Polymer's meta-programming
 * features including template stamping, data-binding, attribute deserialization,
 * and property change observation.
 *
 * Subclassers may provide the following static getters to return metadata
 * used to configure Polymer's features for the class:
 *
 * - `static get is()`: When the template is provided via a `dom-module`,
 *   users should return the `dom-module` id from a static `is` getter.  If
 *   no template is needed or the template is provided directly via the
 *   `template` getter, there is no need to define `is` for the element.
 *
 * - `static get template()`: Users may provide the template directly (as
 *   opposed to via `dom-module`) by implementing a static `template` getter.
 *   The getter must return an `HTMLTemplateElement`.
 *
 * - `static get properties()`: Should return an object describing
 *   property-related metadata used by Polymer features (key: property name
 *   value: object containing property metadata). Valid keys in per-property
 *   metadata include:
 *   - `type` (String|Number|Object|Array|...): Used by
 *     `attributeChangedCallback` to determine how string-based attributes
 *     are deserialized to JavaScript property values.
 *   - `notify` (boolean): Causes a change in the property to fire a
 *     non-bubbling event called `<property>-changed`. Elements that have
 *     enabled two-way binding to the property use this event to observe changes.
 *   - `readOnly` (boolean): Creates a getter for the property, but no setter.
 *     To set a read-only property, use the private setter method
 *     `_setProperty(property, value)`.
 *   - `observer` (string): Observer method name that will be called when
 *     the property changes. The arguments of the method are
 *     `(value, previousValue)`.
 *   - `computed` (string): String describing method and dependent properties
 *     for computing the value of this property (e.g. `'computeFoo(bar, zot)'`).
 *     Computed properties are read-only by default and can only be changed
 *     via the return value of the computing method.
 *
 * - `static get observers()`: Array of strings describing multi-property
 *   observer methods and their dependent properties (e.g.
 *   `'observeABC(a, b, c)'`).
 *
 * The base class provides default implementations for the following standard
 * custom element lifecycle callbacks; users may override these, but should
 * call the super method to ensure
 * - `constructor`: Run when the element is created or upgraded
 * - `connectedCallback`: Run each time the element is connected to the
 *   document
 * - `disconnectedCallback`: Run each time the element is disconnected from
 *   the document
 * - `attributeChangedCallback`: Run each time an attribute in
 *   `observedAttributes` is set or removed (note: this element's default
 *   `observedAttributes` implementation will automatically return an array
 *   of dash-cased attributes based on `properties`)
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin PropertyEffects
 * @appliesMixin PropertiesMixin
 * @property rootPath {string} Set to the value of `rootPath`,
 *   which defaults to the main document path
 * @property importPath {string} Set to the value of the class's static
 *   `importPath` property, which defaults to the path of this element's
 *   `dom-module` (when `is` is used), but can be overridden for other
 *   import strategies.
 * @summary Element class mixin that provides the core API for Polymer's
 * meta-programming features.
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const ElementMixin = dedupingMixin(base => {
  /**
   * @constructor
   * @implements {Polymer_PropertyEffects}
   * @implements {Polymer_PropertiesMixin}
   * @extends {HTMLElement}
   * @private
   */
  const polymerElementBase = PropertiesMixin(PropertyEffects(base));

  /**
   * Returns a list of properties with default values.
   * This list is created as an optimization since it is a subset of
   * the list returned from `_properties`.
   * This list is used in `_initializeProperties` to set property defaults.
   *
   * @param {PolymerElementConstructor} constructor Element class
   * @return {PolymerElementProperties} Flattened properties for this class
   *   that have default values
   * @private
   */
  function propertyDefaults(constructor) {
    if (!constructor.hasOwnProperty(
      JSCompiler_renameProperty('__propertyDefaults', constructor))) {
      constructor.__propertyDefaults = null;
      let props = constructor._properties;
      for (let p in props) {
        let info = props[p];
        if ('value' in info) {
          constructor.__propertyDefaults = constructor.__propertyDefaults || {};
          constructor.__propertyDefaults[p] = info;
        }
      }
    }
    return constructor.__propertyDefaults;
  }

  /**
   * Returns a memoized version of the `observers` array.
   * @param {PolymerElementConstructor} constructor Element class
   * @return {Array} Array containing own observers for the given class
   * @protected
   */
  function ownObservers(constructor) {
    if (!constructor.hasOwnProperty(
      JSCompiler_renameProperty('__ownObservers', constructor))) {
      constructor.__ownObservers =
          constructor.hasOwnProperty(
              JSCompiler_renameProperty('observers', constructor)) ?
          /** @type {PolymerElementConstructor} */ (constructor).observers :
          null;
    }
    return constructor.__ownObservers;
  }

  /**
   * Creates effects for a property.
   *
   * Note, once a property has been set to
   * `readOnly`, `computed`, `reflectToAttribute`, or `notify`
   * these values may not be changed. For example, a subclass cannot
   * alter these settings. However, additional `observers` may be added
   * by subclasses.
   *
   * The info object should contain property metadata as follows:
   *
   * * `type`: {function} type to which an attribute matching the property
   * is deserialized. Note the property is camel-cased from a dash-cased
   * attribute. For example, 'foo-bar' attribute is deserialized to a
   * property named 'fooBar'.
   *
   * * `readOnly`: {boolean} creates a readOnly property and
   * makes a private setter for the private of the form '_setFoo' for a
   * property 'foo',
   *
   * * `computed`: {string} creates a computed property. A computed property
   * is also automatically set to `readOnly: true`. The value is calculated
   * by running a method and arguments parsed from the given string. For
   * example 'compute(foo)' will compute a given property when the
   * 'foo' property changes by executing the 'compute' method. This method
   * must return the computed value.
   *
   * * `reflectToAttribute`: {boolean} If true, the property value is reflected
   * to an attribute of the same name. Note, the attribute is dash-cased
   * so a property named 'fooBar' is reflected as 'foo-bar'.
   *
   * * `notify`: {boolean} sends a non-bubbling notification event when
   * the property changes. For example, a property named 'foo' sends an
   * event named 'foo-changed' with `event.detail` set to the value of
   * the property.
   *
   * * observer: {string} name of a method that runs when the property
   * changes. The arguments of the method are (value, previousValue).
   *
   * Note: Users may want control over modifying property
   * effects via subclassing. For example, a user might want to make a
   * reflectToAttribute property not do so in a subclass. We've chosen to
   * disable this because it leads to additional complication.
   * For example, a readOnly effect generates a special setter. If a subclass
   * disables the effect, the setter would fail unexpectedly.
   * Based on feedback, we may want to try to make effects more malleable
   * and/or provide an advanced api for manipulating them.
   *
   * @param {!PolymerElement} proto Element class prototype to add accessors
   *   and effects to
   * @param {string} name Name of the property.
   * @param {Object} info Info object from which to create property effects.
   * Supported keys:
   * @param {Object} allProps Flattened map of all properties defined in this
   *   element (including inherited properties)
   * @return {void}
   * @private
   */
  function createPropertyFromConfig(proto, name, info, allProps) {
    // computed forces readOnly...
    if (info.computed) {
      info.readOnly = true;
    }
    // Note, since all computed properties are readOnly, this prevents
    // adding additional computed property effects (which leads to a confusing
    // setup where multiple triggers for setting a property)
    // While we do have `hasComputedEffect` this is set on the property's
    // dependencies rather than itself.
    if (info.computed) {
      if (proto._hasReadOnlyEffect(name)) {
        console.warn(`Cannot redefine computed property '${name}'.`);
      } else {
        proto._createComputedProperty(name, info.computed, allProps);
      }
    }
    if (info.readOnly && !proto._hasReadOnlyEffect(name)) {
      proto._createReadOnlyProperty(name, !info.computed);
    } else if (info.readOnly === false && proto._hasReadOnlyEffect(name)) {
      console.warn(`Cannot make readOnly property '${name}' non-readOnly.`);
    }
    if (info.reflectToAttribute && !proto._hasReflectEffect(name)) {
      proto._createReflectedProperty(name);
    } else if (info.reflectToAttribute === false && proto._hasReflectEffect(name)) {
      console.warn(`Cannot make reflected property '${name}' non-reflected.`);
    }
    if (info.notify && !proto._hasNotifyEffect(name)) {
      proto._createNotifyingProperty(name);
    } else if (info.notify === false && proto._hasNotifyEffect(name)) {
      console.warn(`Cannot make notify property '${name}' non-notify.`);
    }
    // always add observer
    if (info.observer) {
      proto._createPropertyObserver(name, info.observer, allProps[info.observer]);
    }
    // always create the mapping from attribute back to property for deserialization.
    proto._addPropertyToAttributeMap(name);
  }

  /**
   * Process all style elements in the element template. Styles with the
   * `include` attribute are processed such that any styles in
   * the associated "style modules" are included in the element template.
   * @param {PolymerElementConstructor} klass Element class
   * @param {!HTMLTemplateElement} template Template to process
   * @param {string} is Name of element
   * @param {string} baseURI Base URI for element
   * @private
   */
  function processElementStyles(klass, template, is, baseURI) {
    if (!builtCSS) {
      const templateStyles = template.content.querySelectorAll('style');
      const stylesWithImports = stylesFromTemplate(template);
      // insert styles from <link rel="import" type="css"> at the top of the template
      const linkedStyles = stylesFromModuleImports(is);
      const firstTemplateChild = template.content.firstElementChild;
      for (let idx = 0; idx < linkedStyles.length; idx++) {
        let s = linkedStyles[idx];
        s.textContent = klass._processStyleText(s.textContent, baseURI);
        template.content.insertBefore(s, firstTemplateChild);
      }
      // keep track of the last "concrete" style in the template we have encountered
      let templateStyleIndex = 0;
      // ensure all gathered styles are actually in this template.
      for (let i = 0; i < stylesWithImports.length; i++) {
        let s = stylesWithImports[i];
        let templateStyle = templateStyles[templateStyleIndex];
        // if the style is not in this template, it's been "included" and
        // we put a clone of it in the template before the style that included it
        if (templateStyle !== s) {
          s = s.cloneNode(true);
          templateStyle.parentNode.insertBefore(s, templateStyle);
        } else {
          templateStyleIndex++;
        }
        s.textContent = klass._processStyleText(s.textContent, baseURI);
      }
    }
    if (window.ShadyCSS) {
      window.ShadyCSS.prepareTemplate(template, is);
    }
    // Support for `adoptedStylesheets` relies on using native Shadow DOM
    // and built CSS. Built CSS is required because runtime transformation of
    // `@apply` is not supported. This is because ShadyCSS relies on being able
    // to update a `style` element in the element template and this is
    // removed when using `adoptedStyleSheets`.
    // Note, it would be more efficient to allow style includes to become
    // separate stylesheets; however, because of `@apply` these are
    // potentially not shareable and sharing the ones that could be shared
    // would require some coordination. To keep it simple, all the includes
    // and styles are collapsed into a single shareable stylesheet.
    if (useAdoptedStyleSheetsWithBuiltCSS && builtCSS &&
        supportsAdoptingStyleSheets$1) {
      // Remove styles in template and make a shareable stylesheet
      const styles = template.content.querySelectorAll('style');
      if (styles) {
        let css = '';
        Array.from(styles).forEach(s => {
          css += s.textContent;
          s.parentNode.removeChild(s);
        });
        klass._styleSheet = new CSSStyleSheet();
        klass._styleSheet.replaceSync(css);
      }
    }
  }

  /**
   * Look up template from dom-module for element
   *
   * @param {string} is Element name to look up
   * @return {?HTMLTemplateElement|undefined} Template found in dom module, or
   *   undefined if not found
   * @protected
   */
  function getTemplateFromDomModule(is) {
    let template = null;
    // Under strictTemplatePolicy in 3.x+, dom-module lookup is only allowed
    // when opted-in via allowTemplateFromDomModule
    if (is && (!strictTemplatePolicy || allowTemplateFromDomModule)) {
      template = /** @type {?HTMLTemplateElement} */ (
          DomModule.import(is, 'template'));
      // Under strictTemplatePolicy, require any element with an `is`
      // specified to have a dom-module
      if (strictTemplatePolicy && !template) {
        throw new Error(`strictTemplatePolicy: expecting dom-module or null template for ${is}`);
      }
    }
    return template;
  }

  /**
   * @polymer
   * @mixinClass
   * @unrestricted
   * @implements {Polymer_ElementMixin}
   * @extends {polymerElementBase}
   */
  class PolymerElement extends polymerElementBase {

    /**
     * Current Polymer version in Semver notation.
     * @type {string} Semver notation of the current version of Polymer.
     * @nocollapse
     */
    static get polymerElementVersion() {
      return version;
    }

    /**
     * Override of PropertiesMixin _finalizeClass to create observers and
     * find the template.
     * @return {void}
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _finalizeClass() {
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      polymerElementBase._finalizeClass.call(this);
      const observers = ownObservers(this);
      if (observers) {
        this.createObservers(observers, this._properties);
      }
      this._prepareTemplate();
    }

    /** @nocollapse */
    static _prepareTemplate() {
      // note: create "working" template that is finalized at instance time
      let template = /** @type {PolymerElementConstructor} */ (this).template;
      if (template) {
        if (typeof template === 'string') {
          console.error('template getter must return HTMLTemplateElement');
          template = null;
        } else if (!legacyOptimizations) {
          template = template.cloneNode(true);
        }
      }

      /** @override */
      this.prototype._template = template;
    }

    /**
     * Override of PropertiesChanged createProperties to create accessors
     * and property effects for all of the properties.
     * @param {!Object} props .
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createProperties(props) {
      for (let p in props) {
        createPropertyFromConfig(
            /** @type {?} */ (this.prototype), p, props[p], props);
      }
    }

    /**
     * Creates observers for the given `observers` array.
     * Leverages `PropertyEffects` to create observers.
     * @param {Object} observers Array of observer descriptors for
     *   this class
     * @param {Object} dynamicFns Object containing keys for any properties
     *   that are functions and should trigger the effect when the function
     *   reference is changed
     * @return {void}
     * @protected
     * @nocollapse
     */
    static createObservers(observers, dynamicFns) {
      const proto = this.prototype;
      for (let i=0; i < observers.length; i++) {
        proto._createMethodObserver(observers[i], dynamicFns);
      }
    }

    /**
     * Returns the template that will be stamped into this element's shadow root.
     *
     * If a `static get is()` getter is defined, the default implementation will
     * return the first `<template>` in a `dom-module` whose `id` matches this
     * element's `is` (note that a `_template` property on the class prototype
     * takes precedence over the `dom-module` template, to maintain legacy
     * element semantics; a subclass will subsequently fall back to its super
     * class template if neither a `prototype._template` or a `dom-module` for
     * the class's `is` was found).
     *
     * Users may override this getter to return an arbitrary template
     * (in which case the `is` getter is unnecessary). The template returned
     * must be an `HTMLTemplateElement`.
     *
     * Note that when subclassing, if the super class overrode the default
     * implementation and the subclass would like to provide an alternate
     * template via a `dom-module`, it should override this getter and
     * return `DomModule.import(this.is, 'template')`.
     *
     * If a subclass would like to modify the super class template, it should
     * clone it rather than modify it in place.  If the getter does expensive
     * work such as cloning/modifying a template, it should memoize the
     * template for maximum performance:
     *
     *   let memoizedTemplate;
     *   class MySubClass extends MySuperClass {
     *     static get template() {
     *       if (!memoizedTemplate) {
     *         memoizedTemplate = super.template.cloneNode(true);
     *         let subContent = document.createElement('div');
     *         subContent.textContent = 'This came from MySubClass';
     *         memoizedTemplate.content.appendChild(subContent);
     *       }
     *       return memoizedTemplate;
     *     }
     *   }
     *
     * @return {!HTMLTemplateElement|string} Template to be stamped
     * @nocollapse
     */
    static get template() {
      // Explanation of template-related properties:
      // - constructor.template (this getter): the template for the class.
      //     This can come from the prototype (for legacy elements), from a
      //     dom-module, or from the super class's template (or can be overridden
      //     altogether by the user)
      // - constructor._template: memoized version of constructor.template
      // - prototype._template: working template for the element, which will be
      //     parsed and modified in place. It is a cloned version of
      //     constructor.template, saved in _finalizeClass(). Note that before
      //     this getter is called, for legacy elements this could be from a
      //     _template field on the info object passed to Polymer(), a behavior,
      //     or set in registered(); once the static getter runs, a clone of it
      //     will overwrite it on the prototype as the working template.
      if (!this.hasOwnProperty(JSCompiler_renameProperty('_template', this))) {
        const protoTemplate = this.prototype.hasOwnProperty(
          JSCompiler_renameProperty('_template', this.prototype)) ?
          this.prototype._template : undefined;
        this._template =
          // If user has put template on prototype (e.g. in legacy via registered
          // callback or info object), prefer that first. Note that `null` is
          // used as a sentinel to indicate "no template" and can be used to
          // override a super template, whereas `undefined` is used as a
          // sentinel to mean "fall-back to default template lookup" via
          // dom-module and/or super.template.
          protoTemplate !== undefined ? protoTemplate :
          // Look in dom-module associated with this element's is
          ((this.hasOwnProperty(JSCompiler_renameProperty('is', this)) &&
          (getTemplateFromDomModule(/** @type {PolymerElementConstructor}*/ (this).is))) ||
          // Next look for superclass template (call the super impl this
          // way so that `this` points to the superclass)
          Object.getPrototypeOf(/** @type {PolymerElementConstructor}*/ (this).prototype).constructor.template);
      }
      return this._template;
    }

    /**
     * Set the template.
     *
     * @param {!HTMLTemplateElement|string} value Template to set.
     * @nocollapse
     */
    static set template(value) {
      this._template = value;
    }

    /**
     * Path matching the url from which the element was imported.
     *
     * This path is used to resolve url's in template style cssText.
     * The `importPath` property is also set on element instances and can be
     * used to create bindings relative to the import path.
     *
     * For elements defined in ES modules, users should implement
     * `static get importMeta() { return import.meta; }`, and the default
     * implementation of `importPath` will  return `import.meta.url`'s path.
     * For elements defined in HTML imports, this getter will return the path
     * to the document containing a `dom-module` element matching this
     * element's static `is` property.
     *
     * Note, this path should contain a trailing `/`.
     *
     * @return {string} The import path for this element class
     * @suppress {missingProperties}
     * @nocollapse
     */
    static get importPath() {
      if (!this.hasOwnProperty(JSCompiler_renameProperty('_importPath', this))) {
        const meta = this.importMeta;
        if (meta) {
          this._importPath = pathFromUrl(meta.url);
        } else {
          const module = DomModule.import(/** @type {PolymerElementConstructor} */ (this).is);
          this._importPath = (module && module.assetpath) ||
            Object.getPrototypeOf(/** @type {PolymerElementConstructor}*/ (this).prototype).constructor.importPath;
        }
      }
      return this._importPath;
    }

    constructor() {
      super();
      /** @type {HTMLTemplateElement} */
      this._template;
      /** @type {string} */
      this._importPath;
      /** @type {string} */
      this.rootPath;
      /** @type {string} */
      this.importPath;
      /** @type {StampedTemplate | HTMLElement | ShadowRoot} */
      this.root;
      /** @type {!Object<string, !Element>} */
      this.$;
    }

    /**
     * Overrides the default `PropertyAccessors` to ensure class
     * metaprogramming related to property accessors and effects has
     * completed (calls `finalize`).
     *
     * It also initializes any property defaults provided via `value` in
     * `properties` metadata.
     *
     * @return {void}
     * @override
     * @suppress {invalidCasts,missingProperties} go/missingfnprops
     */
    _initializeProperties() {
      this.constructor.finalize();
      // note: finalize template when we have access to `localName` to
      // avoid dependence on `is` for polyfilling styling.
      this.constructor._finalizeTemplate(/** @type {!HTMLElement} */(this).localName);
      super._initializeProperties();
      // set path defaults
      this.rootPath = rootPath;
      this.importPath = this.constructor.importPath;
      // apply property defaults...
      let p$ = propertyDefaults(this.constructor);
      if (!p$) {
        return;
      }
      for (let p in p$) {
        let info = p$[p];
        if (this._canApplyPropertyDefault(p)) {
          let value = typeof info.value == 'function' ?
            info.value.call(this) :
            info.value;
          // Set via `_setProperty` if there is an accessor, to enable
          // initializing readOnly property defaults
          if (this._hasAccessor(p)) {
            this._setPendingProperty(p, value, true);
          } else {
            this[p] = value;
          }
        }
      }
    }

    /**
     * Determines if a property dfeault can be applied. For example, this
     * prevents a default from being applied when a property that has no
     * accessor is overridden by its host before upgrade (e.g. via a binding).
     * @override
     * @param {string} property Name of the property
     * @return {boolean} Returns true if the property default can be applied.
     */
    _canApplyPropertyDefault(property) {
      return !this.hasOwnProperty(property);
    }

    /**
     * Gather style text for a style element in the template.
     *
     * @param {string} cssText Text containing styling to process
     * @param {string} baseURI Base URI to rebase CSS paths against
     * @return {string} The processed CSS text
     * @protected
     * @nocollapse
     */
    static _processStyleText(cssText, baseURI) {
      return resolveCss(cssText, baseURI);
    }

    /**
    * Configures an element `proto` to function with a given `template`.
    * The element name `is` and extends `ext` must be specified for ShadyCSS
    * style scoping.
    *
    * @param {string} is Tag name (or type extension name) for this element
    * @return {void}
    * @protected
    * @nocollapse
    */
    static _finalizeTemplate(is) {
      /** @const {HTMLTemplateElement} */
      const template = this.prototype._template;
      if (template && !template.__polymerFinalized) {
        template.__polymerFinalized = true;
        const importPath = this.importPath;
        const baseURI = importPath ? resolveUrl(importPath) : '';
        // e.g. support `include="module-name"`, and ShadyCSS
        processElementStyles(this, template, is, baseURI);
        this.prototype._bindTemplate(template);
      }
    }

    /**
     * Provides a default implementation of the standard Custom Elements
     * `connectedCallback`.
     *
     * The default implementation enables the property effects system and
     * flushes any pending properties, and updates shimmed CSS properties
     * when using the ShadyCSS scoping/custom properties polyfill.
     *
     * @override
     * @suppress {missingProperties, invalidCasts} Super may or may not
     *     implement the callback
     * @return {void}
     */
    connectedCallback() {
      if (window.ShadyCSS && this._template) {
        window.ShadyCSS.styleElement(/** @type {!HTMLElement} */(this));
      }
      super.connectedCallback();
    }

    /**
     * Stamps the element template.
     *
     * @return {void}
     * @override
     */
    ready() {
      if (this._template) {
        this.root = this._stampTemplate(this._template);
        this.$ = this.root.$;
      }
      super.ready();
    }

    /**
     * Implements `PropertyEffects`'s `_readyClients` call. Attaches
     * element dom by calling `_attachDom` with the dom stamped from the
     * element's template via `_stampTemplate`. Note that this allows
     * client dom to be attached to the element prior to any observers
     * running.
     *
     * @return {void}
     * @override
     */
    _readyClients() {
      if (this._template) {
        this.root = this._attachDom(/** @type {StampedTemplate} */(this.root));
      }
      // The super._readyClients here sets the clients initialized flag.
      // We must wait to do this until after client dom is created/attached
      // so that this flag can be checked to prevent notifications fired
      // during this process from being handled before clients are ready.
      super._readyClients();
    }


    /**
     * Attaches an element's stamped dom to itself. By default,
     * this method creates a `shadowRoot` and adds the dom to it.
     * However, this method may be overridden to allow an element
     * to put its dom in another location.
     *
     * @override
     * @throws {Error}
     * @suppress {missingReturn}
     * @param {StampedTemplate} dom to attach to the element.
     * @return {ShadowRoot} node to which the dom has been attached.
     */
    _attachDom(dom) {
      const n = wrap$1(this);
      if (n.attachShadow) {
        if (dom) {
          if (!n.shadowRoot) {
            n.attachShadow({mode: 'open', shadyUpgradeFragment: dom});
            n.shadowRoot.appendChild(dom);
            // When `adoptedStyleSheets` is supported a stylesheet is made
            // available on the element constructor.
            if (this.constructor._styleSheet) {
              n.shadowRoot.adoptedStyleSheets = [this.constructor._styleSheet];
            }
          }
          if (syncInitialRender && window.ShadyDOM) {
            window.ShadyDOM.flushInitial(n.shadowRoot);
          }
          return n.shadowRoot;
        }
        return null;
      } else {
        throw new Error('ShadowDOM not available. ' +
          // TODO(sorvell): move to compile-time conditional when supported
        'PolymerElement can create dom as children instead of in ' +
        'ShadowDOM by setting `this.root = this;\` before \`ready\`.');
      }
    }

    /**
     * When using the ShadyCSS scoping and custom property shim, causes all
     * shimmed styles in this element (and its subtree) to be updated
     * based on current custom property values.
     *
     * The optional parameter overrides inline custom property styles with an
     * object of properties where the keys are CSS properties, and the values
     * are strings.
     *
     * Example: `this.updateStyles({'--color': 'blue'})`
     *
     * These properties are retained unless a value of `null` is set.
     *
     * Note: This function does not support updating CSS mixins.
     * You can not dynamically change the value of an `@apply`.
     *
     * @override
     * @param {Object=} properties Bag of custom property key/values to
     *   apply to this element.
     * @return {void}
     * @suppress {invalidCasts}
     */
    updateStyles(properties) {
      if (window.ShadyCSS) {
        window.ShadyCSS.styleSubtree(/** @type {!HTMLElement} */(this), properties);
      }
    }

    /**
     * Rewrites a given URL relative to a base URL. The base URL defaults to
     * the original location of the document containing the `dom-module` for
     * this element. This method will return the same URL before and after
     * bundling.
     *
     * Note that this function performs no resolution for URLs that start
     * with `/` (absolute URLs) or `#` (hash identifiers).  For general purpose
     * URL resolution, use `window.URL`.
     *
     * @override
     * @param {string} url URL to resolve.
     * @param {string=} base Optional base URL to resolve against, defaults
     * to the element's `importPath`
     * @return {string} Rewritten URL relative to base
     */
    resolveUrl(url, base) {
      if (!base && this.importPath) {
        base = resolveUrl(this.importPath);
      }
      return resolveUrl(url, base);
    }

    /**
     * Overrides `PropertyEffects` to add map of dynamic functions on
     * template info, for consumption by `PropertyEffects` template binding
     * code. This map determines which method templates should have accessors
     * created for them.
     *
     * @param {!HTMLTemplateElement} template Template
     * @param {!TemplateInfo} templateInfo Template metadata for current template
     * @param {!NodeInfo} nodeInfo Node metadata for current template.
     * @return {boolean} .
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _parseTemplateContent(template, templateInfo, nodeInfo) {
      templateInfo.dynamicFns = templateInfo.dynamicFns || this._properties;
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      return polymerElementBase._parseTemplateContent.call(
        this, template, templateInfo, nodeInfo);
    }

    /**
     * Overrides `PropertyEffects` to warn on use of undeclared properties in
     * template.
     *
     * @param {Object} templateInfo Template metadata to add effect to
     * @param {string} prop Property that should trigger the effect
     * @param {Object=} effect Effect metadata object
     * @return {void}
     * @protected
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _addTemplatePropertyEffect(templateInfo, prop, effect) {
      // Warn if properties are used in template without being declared.
      // Properties must be listed in `properties` to be included in
      // `observedAttributes` since CE V1 reads that at registration time, and
      // since we want to keep template parsing lazy, we can't automatically
      // add undeclared properties used in templates to `observedAttributes`.
      // The warning is only enabled in `legacyOptimizations` mode, since
      // we don't want to spam existing users who might have adopted the
      // shorthand when attribute deserialization is not important.
      if (legacyWarnings && !(prop in this._properties) &&
          // Methods used in templates with no dependencies (or only literal
          // dependencies) become accessors with template effects; ignore these
          !(effect.info.part.signature && effect.info.part.signature.static) &&
          // Warnings for bindings added to nested templates are handled by
          // templatizer so ignore both the host-to-template bindings
          // (`hostProp`) and TemplateInstance-to-child bindings
          // (`nestedTemplate`)
          !effect.info.part.hostProp && !templateInfo.nestedTemplate) {
        console.warn(`Property '${prop}' used in template but not declared in 'properties'; ` +
          `attribute will not be observed.`);
      }
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      return polymerElementBase._addTemplatePropertyEffect.call(
        this, templateInfo, prop, effect);
    }

  }

  return PolymerElement;
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * @summary Collapse multiple callbacks into one invocation after a timer.
 */
class Debouncer {
  constructor() {
    this._asyncModule = null;
    this._callback = null;
    this._timer = null;
  }
  /**
   * Sets the scheduler; that is, a module with the Async interface,
   * a callback and optional arguments to be passed to the run function
   * from the async module.
   *
   * @param {!AsyncInterface} asyncModule Object with Async interface.
   * @param {function()} callback Callback to run.
   * @return {void}
   */
  setConfig(asyncModule, callback) {
    this._asyncModule = asyncModule;
    this._callback = callback;
    this._timer = this._asyncModule.run(() => {
      this._timer = null;
      debouncerQueue.delete(this);
      this._callback();
    });
  }
  /**
   * Cancels an active debouncer and returns a reference to itself.
   *
   * @return {void}
   */
  cancel() {
    if (this.isActive()) {
      this._cancelAsync();
      // Canceling a debouncer removes its spot from the flush queue,
      // so if a debouncer is manually canceled and re-debounced, it
      // will reset its flush order (this is a very minor difference from 1.x)
      // Re-debouncing via the `debounce` API retains the 1.x FIFO flush order
      debouncerQueue.delete(this);
    }
  }
  /**
   * Cancels a debouncer's async callback.
   *
   * @return {void}
   */
  _cancelAsync() {
    if (this.isActive()) {
      this._asyncModule.cancel(/** @type {number} */(this._timer));
      this._timer = null;
    }
  }
  /**
   * Flushes an active debouncer and returns a reference to itself.
   *
   * @return {void}
   */
  flush() {
    if (this.isActive()) {
      this.cancel();
      this._callback();
    }
  }
  /**
   * Returns true if the debouncer is active.
   *
   * @return {boolean} True if active.
   */
  isActive() {
    return this._timer != null;
  }
  /**
   * Creates a debouncer if no debouncer is passed as a parameter
   * or it cancels an active debouncer otherwise. The following
   * example shows how a debouncer can be called multiple times within a
   * microtask and "debounced" such that the provided callback function is
   * called once. Add this method to a custom element:
   *
   * ```js
   * import {microTask} from '@polymer/polymer/lib/utils/async.js';
   * import {Debouncer} from '@polymer/polymer/lib/utils/debounce.js';
   * // ...
   *
   * _debounceWork() {
   *   this._debounceJob = Debouncer.debounce(this._debounceJob,
   *       microTask, () => this._doWork());
   * }
   * ```
   *
   * If the `_debounceWork` method is called multiple times within the same
   * microtask, the `_doWork` function will be called only once at the next
   * microtask checkpoint.
   *
   * Note: In testing it is often convenient to avoid asynchrony. To accomplish
   * this with a debouncer, you can use `enqueueDebouncer` and
   * `flush`. For example, extend the above example by adding
   * `enqueueDebouncer(this._debounceJob)` at the end of the
   * `_debounceWork` method. Then in a test, call `flush` to ensure
   * the debouncer has completed.
   *
   * @param {Debouncer?} debouncer Debouncer object.
   * @param {!AsyncInterface} asyncModule Object with Async interface
   * @param {function()} callback Callback to run.
   * @return {!Debouncer} Returns a debouncer object.
   */
  static debounce(debouncer, asyncModule, callback) {
    if (debouncer instanceof Debouncer) {
      // Cancel the async callback, but leave in debouncerQueue if it was
      // enqueued, to maintain 1.x flush order
      debouncer._cancelAsync();
    } else {
      debouncer = new Debouncer();
    }
    debouncer.setConfig(asyncModule, callback);
    return debouncer;
  }
}

let debouncerQueue = new Set();

/**
 * Adds a `Debouncer` to a list of globally flushable tasks.
 *
 * @param {!Debouncer} debouncer Debouncer to enqueue
 * @return {void}
 */
const enqueueDebouncer = function(debouncer) {
  debouncerQueue.add(debouncer);
};

/**
 * Flushes any enqueued debouncers
 *
 * @return {boolean} Returns whether any debouncers were flushed
 */
const flushDebouncers = function() {
  const didFlush = Boolean(debouncerQueue.size);
  // If new debouncers are added while flushing, Set.forEach will ensure
  // newly added ones are also flushed
  debouncerQueue.forEach(debouncer => {
    try {
      debouncer.flush();
    } catch(e) {
      setTimeout(() => {
        throw e;
      });
    }
  });
  return didFlush;
};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// detect native touch action support
let HAS_NATIVE_TA = typeof document.head.style.touchAction === 'string';
let GESTURE_KEY = '__polymerGestures';
let HANDLED_OBJ = '__polymerGesturesHandled';
let TOUCH_ACTION = '__polymerGesturesTouchAction';
// radius for tap and track
let TAP_DISTANCE = 25;
let TRACK_DISTANCE = 5;
// number of last N track positions to keep
let TRACK_LENGTH = 2;

// Disabling "mouse" handlers for 2500ms is enough
let MOUSE_TIMEOUT = 2500;
let MOUSE_EVENTS = ['mousedown', 'mousemove', 'mouseup', 'click'];
// an array of bitmask values for mapping MouseEvent.which to MouseEvent.buttons
let MOUSE_WHICH_TO_BUTTONS = [0, 1, 4, 2];
let MOUSE_HAS_BUTTONS = (function() {
  try {
    return new MouseEvent('test', {buttons: 1}).buttons === 1;
  } catch (e) {
    return false;
  }
})();

/**
 * @param {string} name Possible mouse event name
 * @return {boolean} true if mouse event, false if not
 */
function isMouseEvent(name) {
  return MOUSE_EVENTS.indexOf(name) > -1;
}

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
// check for passive event listeners
let supportsPassive = false;
(function() {
  try {
    let opts = Object.defineProperty({}, 'passive', {get() {supportsPassive = true;}});
    window.addEventListener('test', null, opts);
    window.removeEventListener('test', null, opts);
  } catch(e) {}
})();

/**
 * Generate settings for event listeners, dependant on `passiveTouchGestures`
 *
 * @param {string} eventName Event name to determine if `{passive}` option is
 *   needed
 * @return {{passive: boolean} | undefined} Options to use for addEventListener
 *   and removeEventListener
 */
function PASSIVE_TOUCH(eventName) {
  if (isMouseEvent(eventName) || eventName === 'touchend') {
    return;
  }
  if (HAS_NATIVE_TA && supportsPassive && passiveTouchGestures) {
    return {passive: true};
  } else {
    return;
  }
}

// Check for touch-only devices
let IS_TOUCH_ONLY = navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);

// keep track of any labels hit by the mouseCanceller
/** @type {!Array<!HTMLLabelElement>} */
const clickedLabels = [];

/** @type {!Object<boolean>} */
const labellable = {
  'button': true,
  'input': true,
  'keygen': true,
  'meter': true,
  'output': true,
  'textarea': true,
  'progress': true,
  'select': true
};

// Defined at https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#enabling-and-disabling-form-controls:-the-disabled-attribute
/** @type {!Object<boolean>} */
const canBeDisabled = {
  'button': true,
  'command': true,
  'fieldset': true,
  'input': true,
  'keygen': true,
  'optgroup': true,
  'option': true,
  'select': true,
  'textarea': true
};

/**
 * @param {HTMLElement} el Element to check labelling status
 * @return {boolean} element can have labels
 */
function canBeLabelled(el) {
  return labellable[el.localName] || false;
}

/**
 * @param {HTMLElement} el Element that may be labelled.
 * @return {!Array<!HTMLLabelElement>} Relevant label for `el`
 */
function matchingLabels(el) {
  let labels = Array.prototype.slice.call(/** @type {HTMLInputElement} */(el).labels || []);
  // IE doesn't have `labels` and Safari doesn't populate `labels`
  // if element is in a shadowroot.
  // In this instance, finding the non-ancestor labels is enough,
  // as the mouseCancellor code will handle ancstor labels
  if (!labels.length) {
    labels = [];
    let root = el.getRootNode();
    // if there is an id on `el`, check for all labels with a matching `for` attribute
    if (el.id) {
      let matching = root.querySelectorAll(`label[for = ${el.id}]`);
      for (let i = 0; i < matching.length; i++) {
        labels.push(/** @type {!HTMLLabelElement} */(matching[i]));
      }
    }
  }
  return labels;
}

// touch will make synthetic mouse events
// `preventDefault` on touchend will cancel them,
// but this breaks `<input>` focus and link clicks
// disable mouse handlers for MOUSE_TIMEOUT ms after
// a touchend to ignore synthetic mouse events
let mouseCanceller = function(mouseEvent) {
  // Check for sourceCapabilities, used to distinguish synthetic events
  // if mouseEvent did not come from a device that fires touch events,
  // it was made by a real mouse and should be counted
  // http://wicg.github.io/InputDeviceCapabilities/#dom-inputdevicecapabilities-firestouchevents
  let sc = mouseEvent.sourceCapabilities;
  if (sc && !sc.firesTouchEvents) {
    return;
  }
  // skip synthetic mouse events
  mouseEvent[HANDLED_OBJ] = {skip: true};
  // disable "ghost clicks"
  if (mouseEvent.type === 'click') {
    let clickFromLabel = false;
    let path = getComposedPath(mouseEvent);
    for (let i = 0; i < path.length; i++) {
      if (path[i].nodeType === Node.ELEMENT_NODE) {
        if (path[i].localName === 'label') {
          clickedLabels.push(/** @type {!HTMLLabelElement} */ (path[i]));
        } else if (canBeLabelled(/** @type {!HTMLElement} */ (path[i]))) {
          let ownerLabels =
              matchingLabels(/** @type {!HTMLElement} */ (path[i]));
          // check if one of the clicked labels is labelling this element
          for (let j = 0; j < ownerLabels.length; j++) {
            clickFromLabel = clickFromLabel || clickedLabels.indexOf(ownerLabels[j]) > -1;
          }
        }
      }
      if (path[i] === POINTERSTATE.mouse.target) {
        return;
      }
    }
    // if one of the clicked labels was labelling the target element,
    // this is not a ghost click
    if (clickFromLabel) {
      return;
    }
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
  }
};

/**
 * @param {boolean=} setup True to add, false to remove.
 * @return {void}
 */
function setupTeardownMouseCanceller(setup) {
  let events = IS_TOUCH_ONLY ? ['click'] : MOUSE_EVENTS;
  for (let i = 0, en; i < events.length; i++) {
    en = events[i];
    if (setup) {
      // reset clickLabels array
      clickedLabels.length = 0;
      document.addEventListener(en, mouseCanceller, true);
    } else {
      document.removeEventListener(en, mouseCanceller, true);
    }
  }
}

function ignoreMouse(e) {
  if (!POINTERSTATE.mouse.mouseIgnoreJob) {
    setupTeardownMouseCanceller(true);
  }
  let unset = function() {
    setupTeardownMouseCanceller();
    POINTERSTATE.mouse.target = null;
    POINTERSTATE.mouse.mouseIgnoreJob = null;
  };
  POINTERSTATE.mouse.target = getComposedPath(e)[0];
  POINTERSTATE.mouse.mouseIgnoreJob = Debouncer.debounce(
        POINTERSTATE.mouse.mouseIgnoreJob
      , timeOut.after(MOUSE_TIMEOUT)
      , unset);
}

/**
 * @param {MouseEvent} ev event to test for left mouse button down
 * @return {boolean} has left mouse button down
 */
function hasLeftMouseButton(ev) {
  let type = ev.type;
  // exit early if the event is not a mouse event
  if (!isMouseEvent(type)) {
    return false;
  }
  // ev.button is not reliable for mousemove (0 is overloaded as both left button and no buttons)
  // instead we use ev.buttons (bitmask of buttons) or fall back to ev.which (deprecated, 0 for no buttons, 1 for left button)
  if (type === 'mousemove') {
    // allow undefined for testing events
    let buttons = ev.buttons === undefined ? 1 : ev.buttons;
    if ((ev instanceof window.MouseEvent) && !MOUSE_HAS_BUTTONS) {
      buttons = MOUSE_WHICH_TO_BUTTONS[ev.which] || 0;
    }
    // buttons is a bitmask, check that the left button bit is set (1)
    return Boolean(buttons & 1);
  } else {
    // allow undefined for testing events
    let button = ev.button === undefined ? 0 : ev.button;
    // ev.button is 0 in mousedown/mouseup/click for left button activation
    return button === 0;
  }
}

function isSyntheticClick(ev) {
  if (ev.type === 'click') {
    // ev.detail is 0 for HTMLElement.click in most browsers
    if (ev.detail === 0) {
      return true;
    }
    // in the worst case, check that the x/y position of the click is within
    // the bounding box of the target of the event
    // Thanks IE 10 >:(
    let t = _findOriginalTarget(ev);
    // make sure the target of the event is an element so we can use getBoundingClientRect,
    // if not, just assume it is a synthetic click
    if (!t.nodeType || /** @type {Element} */(t).nodeType !== Node.ELEMENT_NODE) {
      return true;
    }
    let bcr = /** @type {Element} */(t).getBoundingClientRect();
    // use page x/y to account for scrolling
    let x = ev.pageX, y = ev.pageY;
    // ev is a synthetic click if the position is outside the bounding box of the target
    return !((x >= bcr.left && x <= bcr.right) && (y >= bcr.top && y <= bcr.bottom));
  }
  return false;
}

let POINTERSTATE = {
  mouse: {
    target: null,
    mouseIgnoreJob: null
  },
  touch: {
    x: 0,
    y: 0,
    id: -1,
    scrollDecided: false
  }
};

function firstTouchAction(ev) {
  let ta = 'auto';
  let path = getComposedPath(ev);
  for (let i = 0, n; i < path.length; i++) {
    n = path[i];
    if (n[TOUCH_ACTION]) {
      ta = n[TOUCH_ACTION];
      break;
    }
  }
  return ta;
}

function trackDocument(stateObj, movefn, upfn) {
  stateObj.movefn = movefn;
  stateObj.upfn = upfn;
  document.addEventListener('mousemove', movefn);
  document.addEventListener('mouseup', upfn);
}

function untrackDocument(stateObj) {
  document.removeEventListener('mousemove', stateObj.movefn);
  document.removeEventListener('mouseup', stateObj.upfn);
  stateObj.movefn = null;
  stateObj.upfn = null;
}

{
  // use a document-wide touchend listener to start the ghost-click prevention mechanism
  // Use passive event listeners, if supported, to not affect scrolling performance
  document.addEventListener('touchend', ignoreMouse, supportsPassive ? {passive: true} : false);
}

/**
 * Returns the composedPath for the given event.
 * @param {Event} event to process
 * @return {!Array<!EventTarget>} Path of the event
 */
const getComposedPath = window.ShadyDOM && window.ShadyDOM.noPatch ?
  window.ShadyDOM.composedPath :
  (event) => event.composedPath && event.composedPath() || [];

/** @type {!Object<string, !GestureRecognizer>} */
const gestures = {};

/** @type {!Array<!GestureRecognizer>} */
const recognizers = [];

/**
 * Finds the element rendered on the screen at the provided coordinates.
 *
 * Similar to `document.elementFromPoint`, but pierces through
 * shadow roots.
 *
 * @param {number} x Horizontal pixel coordinate
 * @param {number} y Vertical pixel coordinate
 * @return {Element} Returns the deepest shadowRoot inclusive element
 * found at the screen position given.
 */
function deepTargetFind(x, y) {
  let node = document.elementFromPoint(x, y);
  let next = node;
  // this code path is only taken when native ShadowDOM is used
  // if there is a shadowroot, it may have a node at x/y
  // if there is not a shadowroot, exit the loop
  while (next && next.shadowRoot && !window.ShadyDOM) {
    // if there is a node at x/y in the shadowroot, look deeper
    let oldNext = next;
    next = next.shadowRoot.elementFromPoint(x, y);
    // on Safari, elementFromPoint may return the shadowRoot host
    if (oldNext === next) {
      break;
    }
    if (next) {
      node = next;
    }
  }
  return node;
}

/**
 * a cheaper check than ev.composedPath()[0];
 *
 * @private
 * @param {Event|Touch} ev Event.
 * @return {EventTarget} Returns the event target.
 */
function _findOriginalTarget(ev) {
  const path = getComposedPath(/** @type {?Event} */ (ev));
  // It shouldn't be, but sometimes path is empty (window on Safari).
  return path.length > 0 ? path[0] : ev.target;
}

/**
 * @private
 * @param {Event} ev Event.
 * @return {void}
 */
function _handleNative(ev) {
  let handled;
  let type = ev.type;
  let node = ev.currentTarget;
  let gobj = node[GESTURE_KEY];
  if (!gobj) {
    return;
  }
  let gs = gobj[type];
  if (!gs) {
    return;
  }
  if (!ev[HANDLED_OBJ]) {
    ev[HANDLED_OBJ] = {};
    if (type.slice(0, 5) === 'touch') {
      ev = /** @type {TouchEvent} */(ev); // eslint-disable-line no-self-assign
      let t = ev.changedTouches[0];
      if (type === 'touchstart') {
        // only handle the first finger
        if (ev.touches.length === 1) {
          POINTERSTATE.touch.id = t.identifier;
        }
      }
      if (POINTERSTATE.touch.id !== t.identifier) {
        return;
      }
      if (!HAS_NATIVE_TA) {
        if (type === 'touchstart' || type === 'touchmove') {
          _handleTouchAction(ev);
        }
      }
    }
  }
  handled = ev[HANDLED_OBJ];
  // used to ignore synthetic mouse events
  if (handled.skip) {
    return;
  }
  // reset recognizer state
  for (let i = 0, r; i < recognizers.length; i++) {
    r = recognizers[i];
    if (gs[r.name] && !handled[r.name]) {
      if (r.flow && r.flow.start.indexOf(ev.type) > -1 && r.reset) {
        r.reset();
      }
    }
  }
  // enforce gesture recognizer order
  for (let i = 0, r; i < recognizers.length; i++) {
    r = recognizers[i];
    if (gs[r.name] && !handled[r.name]) {
      handled[r.name] = true;
      r[type](ev);
    }
  }
}

/**
 * @private
 * @param {TouchEvent} ev Event.
 * @return {void}
 */
function _handleTouchAction(ev) {
  let t = ev.changedTouches[0];
  let type = ev.type;
  if (type === 'touchstart') {
    POINTERSTATE.touch.x = t.clientX;
    POINTERSTATE.touch.y = t.clientY;
    POINTERSTATE.touch.scrollDecided = false;
  } else if (type === 'touchmove') {
    if (POINTERSTATE.touch.scrollDecided) {
      return;
    }
    POINTERSTATE.touch.scrollDecided = true;
    let ta = firstTouchAction(ev);
    let shouldPrevent = false;
    let dx = Math.abs(POINTERSTATE.touch.x - t.clientX);
    let dy = Math.abs(POINTERSTATE.touch.y - t.clientY);
    if (!ev.cancelable) ; else if (ta === 'none') {
      shouldPrevent = true;
    } else if (ta === 'pan-x') {
      shouldPrevent = dy > dx;
    } else if (ta === 'pan-y') {
      shouldPrevent = dx > dy;
    }
    if (shouldPrevent) {
      ev.preventDefault();
    } else {
      prevent('track');
    }
  }
}

/**
 * Adds an event listener to a node for the given gesture type.
 *
 * @param {!EventTarget} node Node to add listener on
 * @param {string} evType Gesture type: `down`, `up`, `track`, or `tap`
 * @param {!function(!Event):void} handler Event listener function to call
 * @return {boolean} Returns true if a gesture event listener was added.
 */
function addListener(node, evType, handler) {
  if (gestures[evType]) {
    _add(node, evType, handler);
    return true;
  }
  return false;
}

/**
 * Removes an event listener from a node for the given gesture type.
 *
 * @param {!EventTarget} node Node to remove listener from
 * @param {string} evType Gesture type: `down`, `up`, `track`, or `tap`
 * @param {!function(!Event):void} handler Event listener function previously passed to
 *  `addListener`.
 * @return {boolean} Returns true if a gesture event listener was removed.
 */
function removeListener(node, evType, handler) {
  if (gestures[evType]) {
    _remove(node, evType, handler);
    return true;
  }
  return false;
}

/**
 * automate the event listeners for the native events
 *
 * @private
 * @param {!EventTarget} node Node on which to add the event.
 * @param {string} evType Event type to add.
 * @param {function(!Event)} handler Event handler function.
 * @return {void}
 */
function _add(node, evType, handler) {
  let recognizer = gestures[evType];
  let deps = recognizer.deps;
  let name = recognizer.name;
  let gobj = node[GESTURE_KEY];
  if (!gobj) {
    node[GESTURE_KEY] = gobj = {};
  }
  for (let i = 0, dep, gd; i < deps.length; i++) {
    dep = deps[i];
    // don't add mouse handlers on iOS because they cause gray selection overlays
    if (IS_TOUCH_ONLY && isMouseEvent(dep) && dep !== 'click') {
      continue;
    }
    gd = gobj[dep];
    if (!gd) {
      gobj[dep] = gd = {_count: 0};
    }
    if (gd._count === 0) {
      node.addEventListener(dep, _handleNative, PASSIVE_TOUCH(dep));
    }
    gd[name] = (gd[name] || 0) + 1;
    gd._count = (gd._count || 0) + 1;
  }
  node.addEventListener(evType, handler);
  if (recognizer.touchAction) {
    setTouchAction(node, recognizer.touchAction);
  }
}

/**
 * automate event listener removal for native events
 *
 * @private
 * @param {!EventTarget} node Node on which to remove the event.
 * @param {string} evType Event type to remove.
 * @param {function(!Event): void} handler Event handler function.
 * @return {void}
 */
function _remove(node, evType, handler) {
  let recognizer = gestures[evType];
  let deps = recognizer.deps;
  let name = recognizer.name;
  let gobj = node[GESTURE_KEY];
  if (gobj) {
    for (let i = 0, dep, gd; i < deps.length; i++) {
      dep = deps[i];
      gd = gobj[dep];
      if (gd && gd[name]) {
        gd[name] = (gd[name] || 1) - 1;
        gd._count = (gd._count || 1) - 1;
        if (gd._count === 0) {
          node.removeEventListener(dep, _handleNative, PASSIVE_TOUCH(dep));
        }
      }
    }
  }
  node.removeEventListener(evType, handler);
}

/**
 * Registers a new gesture event recognizer for adding new custom
 * gesture event types.
 *
 * @param {!GestureRecognizer} recog Gesture recognizer descriptor
 * @return {void}
 */
function register$1(recog) {
  recognizers.push(recog);
  for (let i = 0; i < recog.emits.length; i++) {
    gestures[recog.emits[i]] = recog;
  }
}

/**
 * @private
 * @param {string} evName Event name.
 * @return {Object} Returns the gesture for the given event name.
 */
function _findRecognizerByEvent(evName) {
  for (let i = 0, r; i < recognizers.length; i++) {
    r = recognizers[i];
    for (let j = 0, n; j < r.emits.length; j++) {
      n = r.emits[j];
      if (n === evName) {
        return r;
      }
    }
  }
  return null;
}

/**
 * Sets scrolling direction on node.
 *
 * This value is checked on first move, thus it should be called prior to
 * adding event listeners.
 *
 * @param {!EventTarget} node Node to set touch action setting on
 * @param {string} value Touch action value
 * @return {void}
 */
function setTouchAction(node, value) {
  if (HAS_NATIVE_TA && node instanceof HTMLElement) {
    // NOTE: add touchAction async so that events can be added in
    // custom element constructors. Otherwise we run afoul of custom
    // elements restriction against settings attributes (style) in the
    // constructor.
    microTask.run(() => {
      node.style.touchAction = value;
    });
  }
  node[TOUCH_ACTION] = value;
}

/**
 * Dispatches an event on the `target` element of `type` with the given
 * `detail`.
 * @private
 * @param {!EventTarget} target The element on which to fire an event.
 * @param {string} type The type of event to fire.
 * @param {!Object=} detail The detail object to populate on the event.
 * @return {void}
 */
function _fire(target, type, detail) {
  let ev = new Event(type, { bubbles: true, cancelable: true, composed: true });
  ev.detail = detail;
  wrap$1(/** @type {!Node} */(target)).dispatchEvent(ev);
  // forward `preventDefault` in a clean way
  if (ev.defaultPrevented) {
    let preventer = detail.preventer || detail.sourceEvent;
    if (preventer && preventer.preventDefault) {
      preventer.preventDefault();
    }
  }
}

/**
 * Prevents the dispatch and default action of the given event name.
 *
 * @param {string} evName Event name.
 * @return {void}
 */
function prevent(evName) {
  let recognizer = _findRecognizerByEvent(evName);
  if (recognizer.info) {
    recognizer.info.prevent = true;
  }
}

/* eslint-disable valid-jsdoc */

register$1({
  name: 'downup',
  deps: ['mousedown', 'touchstart', 'touchend'],
  flow: {
    start: ['mousedown', 'touchstart'],
    end: ['mouseup', 'touchend']
  },
  emits: ['down', 'up'],

  info: {
    movefn: null,
    upfn: null
  },

  /**
   * @this {GestureRecognizer}
   * @return {void}
   */
  reset: function() {
    untrackDocument(this.info);
  },

  /**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */
  mousedown: function(e) {
    if (!hasLeftMouseButton(e)) {
      return;
    }
    let t = _findOriginalTarget(e);
    let self = this;
    let movefn = function movefn(e) {
      if (!hasLeftMouseButton(e)) {
        downupFire('up', t, e);
        untrackDocument(self.info);
      }
    };
    let upfn = function upfn(e) {
      if (hasLeftMouseButton(e)) {
        downupFire('up', t, e);
      }
      untrackDocument(self.info);
    };
    trackDocument(this.info, movefn, upfn);
    downupFire('down', t, e);
  },
  /**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */
  touchstart: function(e) {
    downupFire('down', _findOriginalTarget(e), e.changedTouches[0], e);
  },
  /**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */
  touchend: function(e) {
    downupFire('up', _findOriginalTarget(e), e.changedTouches[0], e);
  }
});

/**
 * @param {string} type
 * @param {EventTarget} target
 * @param {Event|Touch} event
 * @param {Event=} preventer
 * @return {void}
 */
function downupFire(type, target, event, preventer) {
  if (!target) {
    return;
  }
  _fire(target, type, {
    x: event.clientX,
    y: event.clientY,
    sourceEvent: event,
    preventer: preventer,
    prevent: function(e) {
      return prevent(e);
    }
  });
}

register$1({
  name: 'track',
  touchAction: 'none',
  deps: ['mousedown', 'touchstart', 'touchmove', 'touchend'],
  flow: {
    start: ['mousedown', 'touchstart'],
    end: ['mouseup', 'touchend']
  },
  emits: ['track'],

  info: {
    x: 0,
    y: 0,
    state: 'start',
    started: false,
    moves: [],
    /** @this {GestureInfo} */
    addMove: function(move) {
      if (this.moves.length > TRACK_LENGTH) {
        this.moves.shift();
      }
      this.moves.push(move);
    },
    movefn: null,
    upfn: null,
    prevent: false
  },

  /**
   * @this {GestureRecognizer}
   * @return {void}
   */
  reset: function() {
    this.info.state = 'start';
    this.info.started = false;
    this.info.moves = [];
    this.info.x = 0;
    this.info.y = 0;
    this.info.prevent = false;
    untrackDocument(this.info);
  },

  /**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */
  mousedown: function(e) {
    if (!hasLeftMouseButton(e)) {
      return;
    }
    let t = _findOriginalTarget(e);
    let self = this;
    let movefn = function movefn(e) {
      let x = e.clientX, y = e.clientY;
      if (trackHasMovedEnough(self.info, x, y)) {
        // first move is 'start', subsequent moves are 'move', mouseup is 'end'
        self.info.state = self.info.started ? (e.type === 'mouseup' ? 'end' : 'track') : 'start';
        if (self.info.state === 'start') {
          // if and only if tracking, always prevent tap
          prevent('tap');
        }
        self.info.addMove({x: x, y: y});
        if (!hasLeftMouseButton(e)) {
          // always fire "end"
          self.info.state = 'end';
          untrackDocument(self.info);
        }
        if (t) {
          trackFire(self.info, t, e);
        }
        self.info.started = true;
      }
    };
    let upfn = function upfn(e) {
      if (self.info.started) {
        movefn(e);
      }

      // remove the temporary listeners
      untrackDocument(self.info);
    };
    // add temporary document listeners as mouse retargets
    trackDocument(this.info, movefn, upfn);
    this.info.x = e.clientX;
    this.info.y = e.clientY;
  },
  /**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */
  touchstart: function(e) {
    let ct = e.changedTouches[0];
    this.info.x = ct.clientX;
    this.info.y = ct.clientY;
  },
  /**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */
  touchmove: function(e) {
    let t = _findOriginalTarget(e);
    let ct = e.changedTouches[0];
    let x = ct.clientX, y = ct.clientY;
    if (trackHasMovedEnough(this.info, x, y)) {
      if (this.info.state === 'start') {
        // if and only if tracking, always prevent tap
        prevent('tap');
      }
      this.info.addMove({x: x, y: y});
      trackFire(this.info, t, ct);
      this.info.state = 'track';
      this.info.started = true;
    }
  },
  /**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */
  touchend: function(e) {
    let t = _findOriginalTarget(e);
    let ct = e.changedTouches[0];
    // only trackend if track was started and not aborted
    if (this.info.started) {
      // reset started state on up
      this.info.state = 'end';
      this.info.addMove({x: ct.clientX, y: ct.clientY});
      trackFire(this.info, t, ct);
    }
  }
});

/**
 * @param {!GestureInfo} info
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
function trackHasMovedEnough(info, x, y) {
  if (info.prevent) {
    return false;
  }
  if (info.started) {
    return true;
  }
  let dx = Math.abs(info.x - x);
  let dy = Math.abs(info.y - y);
  return (dx >= TRACK_DISTANCE || dy >= TRACK_DISTANCE);
}

/**
 * @param {!GestureInfo} info
 * @param {?EventTarget} target
 * @param {Touch} touch
 * @return {void}
 */
function trackFire(info, target, touch) {
  if (!target) {
    return;
  }
  let secondlast = info.moves[info.moves.length - 2];
  let lastmove = info.moves[info.moves.length - 1];
  let dx = lastmove.x - info.x;
  let dy = lastmove.y - info.y;
  let ddx, ddy = 0;
  if (secondlast) {
    ddx = lastmove.x - secondlast.x;
    ddy = lastmove.y - secondlast.y;
  }
  _fire(target, 'track', {
    state: info.state,
    x: touch.clientX,
    y: touch.clientY,
    dx: dx,
    dy: dy,
    ddx: ddx,
    ddy: ddy,
    sourceEvent: touch,
    hover: function() {
      return deepTargetFind(touch.clientX, touch.clientY);
    }
  });
}

register$1({
  name: 'tap',
  deps: ['mousedown', 'click', 'touchstart', 'touchend'],
  flow: {
    start: ['mousedown', 'touchstart'],
    end: ['click', 'touchend']
  },
  emits: ['tap'],
  info: {
    x: NaN,
    y: NaN,
    prevent: false
  },
  /**
   * @this {GestureRecognizer}
   * @return {void}
   */
  reset: function() {
    this.info.x = NaN;
    this.info.y = NaN;
    this.info.prevent = false;
  },
  /**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */
  mousedown: function(e) {
    if (hasLeftMouseButton(e)) {
      this.info.x = e.clientX;
      this.info.y = e.clientY;
    }
  },
  /**
   * @this {GestureRecognizer}
   * @param {MouseEvent} e
   * @return {void}
   */
  click: function(e) {
    if (hasLeftMouseButton(e)) {
      trackForward(this.info, e);
    }
  },
  /**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */
  touchstart: function(e) {
    const touch = e.changedTouches[0];
    this.info.x = touch.clientX;
    this.info.y = touch.clientY;
  },
  /**
   * @this {GestureRecognizer}
   * @param {TouchEvent} e
   * @return {void}
   */
  touchend: function(e) {
    trackForward(this.info, e.changedTouches[0], e);
  }
});

/**
 * @param {!GestureInfo} info
 * @param {Event | Touch} e
 * @param {Event=} preventer
 * @return {void}
 */
function trackForward(info, e, preventer) {
  let dx = Math.abs(e.clientX - info.x);
  let dy = Math.abs(e.clientY - info.y);
  // find original target from `preventer` for TouchEvents, or `e` for MouseEvents
  let t = _findOriginalTarget((preventer || e));
  if (!t || (canBeDisabled[/** @type {!HTMLElement} */(t).localName] && t.hasAttribute('disabled'))) {
    return;
  }
  // dx,dy can be NaN if `click` has been simulated and there was no `down` for `start`
  if (isNaN(dx) || isNaN(dy) || (dx <= TAP_DISTANCE && dy <= TAP_DISTANCE) || isSyntheticClick(e)) {
    // prevent taps from being generated if an event has canceled them
    if (!info.prevent) {
      _fire(t, 'tap', {
        x: e.clientX,
        y: e.clientY,
        sourceEvent: e,
        preventer: preventer
      });
    }
  }
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Element class mixin that provides API for adding Polymer's cross-platform
 * gesture events to nodes.
 *
 * The API is designed to be compatible with override points implemented
 * in `TemplateStamp` such that declarative event listeners in
 * templates will support gesture events when this mixin is applied along with
 * `TemplateStamp`.
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin that provides API for adding Polymer's
 *   cross-platform gesture events to nodes
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const GestureEventListeners = dedupingMixin((superClass) => {
  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_GestureEventListeners}
   */
  class GestureEventListeners extends superClass {
    /**
     * Add the event listener to the node if it is a gestures event.
     *
     * @param {!EventTarget} node Node to add event listener to
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to add
     * @return {void}
     * @override
     */
    _addEventListenerToNode(node, eventName, handler) {
      if (!addListener(node, eventName, handler)) {
        super._addEventListenerToNode(node, eventName, handler);
      }
    }

    /**
     * Remove the event listener to the node if it is a gestures event.
     *
     * @param {!EventTarget} node Node to remove event listener from
     * @param {string} eventName Name of event
     * @param {function(!Event):void} handler Listener function to remove
     * @return {void}
     * @override
     */
    _removeEventListenerFromNode(node, eventName, handler) {
      if (!removeListener(node, eventName, handler)) {
        super._removeEventListenerFromNode(node, eventName, handler);
      }
    }
  }

  return GestureEventListeners;
});

/**
 * @fileoverview
 * @suppress {checkPrototypalTypes}
 * @license Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

const HOST_DIR = /:host\(:dir\((ltr|rtl)\)\)/g;
const HOST_DIR_REPLACMENT = ':host([dir="$1"])';

const EL_DIR = /([\s\w-#\.\[\]\*]*):dir\((ltr|rtl)\)/g;
const EL_DIR_REPLACMENT = ':host([dir="$2"]) $1';

const DIR_CHECK = /:dir\((?:ltr|rtl)\)/;

const SHIM_SHADOW = Boolean(window['ShadyDOM'] && window['ShadyDOM']['inUse']);

/**
 * @type {!Array<!Polymer_DirMixin>}
 */
const DIR_INSTANCES = [];

/** @type {?MutationObserver} */
let observer = null;

let documentDir = '';

function getRTL() {
  documentDir = document.documentElement.getAttribute('dir');
}

/**
 * @param {!Polymer_DirMixin} instance Instance to set RTL status on
 */
function setRTL(instance) {
  if (!instance.__autoDirOptOut) {
    const el = /** @type {!HTMLElement} */(instance);
    el.setAttribute('dir', documentDir);
  }
}

function updateDirection() {
  getRTL();
  documentDir = document.documentElement.getAttribute('dir');
  for (let i = 0; i < DIR_INSTANCES.length; i++) {
    setRTL(DIR_INSTANCES[i]);
  }
}

function takeRecords() {
  if (observer && observer.takeRecords().length) {
    updateDirection();
  }
}

/**
 * Element class mixin that allows elements to use the `:dir` CSS Selector to
 * have text direction specific styling.
 *
 * With this mixin, any stylesheet provided in the template will transform
 * `:dir` into `:host([dir])` and sync direction with the page via the
 * element's `dir` attribute.
 *
 * Elements can opt out of the global page text direction by setting the `dir`
 * attribute directly in `ready()` or in HTML.
 *
 * Caveats:
 * - Applications must set `<html dir="ltr">` or `<html dir="rtl">` to sync
 *   direction
 * - Automatic left-to-right or right-to-left styling is sync'd with the
 *   `<html>` element only.
 * - Changing `dir` at runtime is supported.
 * - Opting out of the global direction styling is permanent
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin PropertyAccessors
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const DirMixin = dedupingMixin((base) => {

  if (!SHIM_SHADOW) {
    if (!observer) {
      getRTL();
      observer = new MutationObserver(updateDirection);
      observer.observe(document.documentElement, {attributes: true, attributeFilter: ['dir']});
    }
  }

  /**
   * @constructor
   * @implements {Polymer_PropertyAccessors}
   * @private
   */
  const elementBase = PropertyAccessors(base);

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_DirMixin}
   */
  class Dir extends elementBase {

    /**
     * @param {string} cssText .
     * @param {string} baseURI .
     * @return {string} .
     * @suppress {missingProperties} Interfaces in closure do not inherit statics, but classes do
     * @nocollapse
     */
    static _processStyleText(cssText, baseURI) {
      // TODO(https://github.com/google/closure-compiler/issues/3240):
      //     Change back to just super.methodCall()
      cssText = elementBase._processStyleText.call(this, cssText, baseURI);
      if (!SHIM_SHADOW && DIR_CHECK.test(cssText)) {
        cssText = this._replaceDirInCssText(cssText);
        this.__activateDir = true;
      }
      return cssText;
    }

    /**
     * Replace `:dir` in the given CSS text
     *
     * @param {string} text CSS text to replace DIR
     * @return {string} Modified CSS
     * @nocollapse
     */
    static _replaceDirInCssText(text) {
      let replacedText = text;
      replacedText = replacedText.replace(HOST_DIR, HOST_DIR_REPLACMENT);
      replacedText = replacedText.replace(EL_DIR, EL_DIR_REPLACMENT);
      return replacedText;
    }

    constructor() {
      super();
      /** @type {boolean} */
      this.__autoDirOptOut = false;
    }

    /**
     * @override
     * @suppress {invalidCasts} Closure doesn't understand that `this` is an
     *     HTMLElement
     * @return {void}
     */
    ready() {
      super.ready();
      this.__autoDirOptOut = /** @type {!HTMLElement} */(this).hasAttribute('dir');
    }

    /**
     * @override
     * @suppress {missingProperties} If it exists on elementBase, it can be
     *   super'd
     * @return {void}
     */
    connectedCallback() {
      if (elementBase.prototype.connectedCallback) {
        super.connectedCallback();
      }
      if (this.constructor.__activateDir) {
        takeRecords();
        DIR_INSTANCES.push(this);
        setRTL(this);
      }
    }

    /**
     * @override
     * @suppress {missingProperties} If it exists on elementBase, it can be
     *   super'd
     * @return {void}
     */
    disconnectedCallback() {
      if (elementBase.prototype.disconnectedCallback) {
        super.disconnectedCallback();
      }
      if (this.constructor.__activateDir) {
        const idx = DIR_INSTANCES.indexOf(this);
        if (idx > -1) {
          DIR_INSTANCES.splice(idx, 1);
        }
      }
    }
  }

  Dir.__activateDir = false;

  return Dir;
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

function resolve() {
  document.body.removeAttribute('unresolved');
}

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  resolve();
} else {
  window.addEventListener('DOMContentLoaded', resolve);
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

function newSplice(index, removed, addedCount) {
  return {
    index: index,
    removed: removed,
    addedCount: addedCount
  };
}

const EDIT_LEAVE = 0;
const EDIT_UPDATE = 1;
const EDIT_ADD = 2;
const EDIT_DELETE = 3;

// Note: This function is *based* on the computation of the Levenshtein
// "edit" distance. The one change is that "updates" are treated as two
// edits - not one. With Array splices, an update is really a delete
// followed by an add. By retaining this, we optimize for "keeping" the
// maximum array items in the original array. For example:
//
//   'xxxx123' -> '123yyyy'
//
// With 1-edit updates, the shortest path would be just to update all seven
// characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
// leaves the substring '123' intact.
function calcEditDistances(current, currentStart, currentEnd,
                            old, oldStart, oldEnd) {
  // "Deletion" columns
  let rowCount = oldEnd - oldStart + 1;
  let columnCount = currentEnd - currentStart + 1;
  let distances = new Array(rowCount);

  // "Addition" rows. Initialize null column.
  for (let i = 0; i < rowCount; i++) {
    distances[i] = new Array(columnCount);
    distances[i][0] = i;
  }

  // Initialize null row
  for (let j = 0; j < columnCount; j++)
    distances[0][j] = j;

  for (let i = 1; i < rowCount; i++) {
    for (let j = 1; j < columnCount; j++) {
      if (equals(current[currentStart + j - 1], old[oldStart + i - 1]))
        distances[i][j] = distances[i - 1][j - 1];
      else {
        let north = distances[i - 1][j] + 1;
        let west = distances[i][j - 1] + 1;
        distances[i][j] = north < west ? north : west;
      }
    }
  }

  return distances;
}

// This starts at the final weight, and walks "backward" by finding
// the minimum previous weight recursively until the origin of the weight
// matrix.
function spliceOperationsFromEditDistances(distances) {
  let i = distances.length - 1;
  let j = distances[0].length - 1;
  let current = distances[i][j];
  let edits = [];
  while (i > 0 || j > 0) {
    if (i == 0) {
      edits.push(EDIT_ADD);
      j--;
      continue;
    }
    if (j == 0) {
      edits.push(EDIT_DELETE);
      i--;
      continue;
    }
    let northWest = distances[i - 1][j - 1];
    let west = distances[i - 1][j];
    let north = distances[i][j - 1];

    let min;
    if (west < north)
      min = west < northWest ? west : northWest;
    else
      min = north < northWest ? north : northWest;

    if (min == northWest) {
      if (northWest == current) {
        edits.push(EDIT_LEAVE);
      } else {
        edits.push(EDIT_UPDATE);
        current = northWest;
      }
      i--;
      j--;
    } else if (min == west) {
      edits.push(EDIT_DELETE);
      i--;
      current = west;
    } else {
      edits.push(EDIT_ADD);
      j--;
      current = north;
    }
  }

  edits.reverse();
  return edits;
}

/**
 * Splice Projection functions:
 *
 * A splice map is a representation of how a previous array of items
 * was transformed into a new array of items. Conceptually it is a list of
 * tuples of
 *
 *   <index, removed, addedCount>
 *
 * which are kept in ascending index order of. The tuple represents that at
 * the |index|, |removed| sequence of items were removed, and counting forward
 * from |index|, |addedCount| items were added.
 */

/**
 * Lacking individual splice mutation information, the minimal set of
 * splices can be synthesized given the previous state and final state of an
 * array. The basic approach is to calculate the edit distance matrix and
 * choose the shortest path through it.
 *
 * Complexity: O(l * p)
 *   l: The length of the current array
 *   p: The length of the old array
 *
 * @param {!Array} current The current "changed" array for which to
 * calculate splices.
 * @param {number} currentStart Starting index in the `current` array for
 * which splices are calculated.
 * @param {number} currentEnd Ending index in the `current` array for
 * which splices are calculated.
 * @param {!Array} old The original "unchanged" array to compare `current`
 * against to determine splices.
 * @param {number} oldStart Starting index in the `old` array for
 * which splices are calculated.
 * @param {number} oldEnd Ending index in the `old` array for
 * which splices are calculated.
 * @return {!Array} Returns an array of splice record objects. Each of these
 * contains: `index` the location where the splice occurred; `removed`
 * the array of removed items from this location; `addedCount` the number
 * of items added at this location.
 */
function calcSplices(current, currentStart, currentEnd,
                      old, oldStart, oldEnd) {
  let prefixCount = 0;
  let suffixCount = 0;
  let splice;

  let minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
  if (currentStart == 0 && oldStart == 0)
    prefixCount = sharedPrefix(current, old, minLength);

  if (currentEnd == current.length && oldEnd == old.length)
    suffixCount = sharedSuffix(current, old, minLength - prefixCount);

  currentStart += prefixCount;
  oldStart += prefixCount;
  currentEnd -= suffixCount;
  oldEnd -= suffixCount;

  if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
    return [];

  if (currentStart == currentEnd) {
    splice = newSplice(currentStart, [], 0);
    while (oldStart < oldEnd)
      splice.removed.push(old[oldStart++]);

    return [ splice ];
  } else if (oldStart == oldEnd)
    return [ newSplice(currentStart, [], currentEnd - currentStart) ];

  let ops = spliceOperationsFromEditDistances(
      calcEditDistances(current, currentStart, currentEnd,
                             old, oldStart, oldEnd));

  splice = undefined;
  let splices = [];
  let index = currentStart;
  let oldIndex = oldStart;
  for (let i = 0; i < ops.length; i++) {
    switch(ops[i]) {
      case EDIT_LEAVE:
        if (splice) {
          splices.push(splice);
          splice = undefined;
        }

        index++;
        oldIndex++;
        break;
      case EDIT_UPDATE:
        if (!splice)
          splice = newSplice(index, [], 0);

        splice.addedCount++;
        index++;

        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
      case EDIT_ADD:
        if (!splice)
          splice = newSplice(index, [], 0);

        splice.addedCount++;
        index++;
        break;
      case EDIT_DELETE:
        if (!splice)
          splice = newSplice(index, [], 0);

        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
    }
  }

  if (splice) {
    splices.push(splice);
  }
  return splices;
}

function sharedPrefix(current, old, searchLength) {
  for (let i = 0; i < searchLength; i++)
    if (!equals(current[i], old[i]))
      return i;
  return searchLength;
}

function sharedSuffix(current, old, searchLength) {
  let index1 = current.length;
  let index2 = old.length;
  let count = 0;
  while (count < searchLength && equals(current[--index1], old[--index2]))
    count++;

  return count;
}

/**
 * Returns an array of splice records indicating the minimum edits required
 * to transform the `previous` array into the `current` array.
 *
 * Splice records are ordered by index and contain the following fields:
 * - `index`: index where edit started
 * - `removed`: array of removed items from this index
 * - `addedCount`: number of items added at this index
 *
 * This function is based on the Levenshtein "minimum edit distance"
 * algorithm. Note that updates are treated as removal followed by addition.
 *
 * The worst-case time complexity of this algorithm is `O(l * p)`
 *   l: The length of the current array
 *   p: The length of the previous array
 *
 * However, the worst-case complexity is reduced by an `O(n)` optimization
 * to detect any shared prefix & suffix between the two arrays and only
 * perform the more expensive minimum edit distance calculation over the
 * non-shared portions of the arrays.
 *
 * @function
 * @param {!Array} current The "changed" array for which splices will be
 * calculated.
 * @param {!Array} previous The "unchanged" original array to compare
 * `current` against to determine the splices.
 * @return {!Array} Returns an array of splice record objects. Each of these
 * contains: `index` the location where the splice occurred; `removed`
 * the array of removed items from this location; `addedCount` the number
 * of items added at this location.
 */
function calculateSplices(current, previous) {
  return calcSplices(current, 0, current.length, previous, 0,
                          previous.length);
}

function equals(currentValue, previousValue) {
  return currentValue === previousValue;
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Returns true if `node` is a slot element
 * @param {!Node} node Node to test.
 * @return {boolean} Returns true if the given `node` is a slot
 * @private
 */
function isSlot(node) {
  return (node.localName === 'slot');
}

/**
 * Class that listens for changes (additions or removals) to
 * "flattened nodes" on a given `node`. The list of flattened nodes consists
 * of a node's children and, for any children that are `<slot>` elements,
 * the expanded flattened list of `assignedNodes`.
 * For example, if the observed node has children `<a></a><slot></slot><b></b>`
 * and the `<slot>` has one `<div>` assigned to it, then the flattened
 * nodes list is `<a></a><div></div><b></b>`. If the `<slot>` has other
 * `<slot>` elements assigned to it, these are flattened as well.
 *
 * The provided `callback` is called whenever any change to this list
 * of flattened nodes occurs, where an addition or removal of a node is
 * considered a change. The `callback` is called with one argument, an object
 * containing an array of any `addedNodes` and `removedNodes`.
 *
 * Note: the callback is called asynchronous to any changes
 * at a microtask checkpoint. This is because observation is performed using
 * `MutationObserver` and the `<slot>` element's `slotchange` event which
 * are asynchronous.
 *
 * An example:
 * ```js
 * class TestSelfObserve extends PolymerElement {
 *   static get is() { return 'test-self-observe';}
 *   connectedCallback() {
 *     super.connectedCallback();
 *     this._observer = new FlattenedNodesObserver(this, (info) => {
 *       this.info = info;
 *     });
 *   }
 *   disconnectedCallback() {
 *     super.disconnectedCallback();
 *     this._observer.disconnect();
 *   }
 * }
 * customElements.define(TestSelfObserve.is, TestSelfObserve);
 * ```
 *
 * @summary Class that listens for changes (additions or removals) to
 * "flattened nodes" on a given `node`.
 * @implements {PolymerDomApi.ObserveHandle}
 */
let FlattenedNodesObserver = class {

  /**
   * Returns the list of flattened nodes for the given `node`.
   * This list consists of a node's children and, for any children
   * that are `<slot>` elements, the expanded flattened list of `assignedNodes`.
   * For example, if the observed node has children `<a></a><slot></slot><b></b>`
   * and the `<slot>` has one `<div>` assigned to it, then the flattened
   * nodes list is `<a></a><div></div><b></b>`. If the `<slot>` has other
   * `<slot>` elements assigned to it, these are flattened as well.
   *
   * @param {!HTMLElement|!HTMLSlotElement} node The node for which to
   *      return the list of flattened nodes.
   * @return {!Array<!Node>} The list of flattened nodes for the given `node`.
   * @nocollapse See https://github.com/google/closure-compiler/issues/2763
   */
  // eslint-disable-next-line
  static getFlattenedNodes(node) {
    const wrapped = wrap$1(node);
    if (isSlot(node)) {
      node = /** @type {!HTMLSlotElement} */(node); // eslint-disable-line no-self-assign
      return wrapped.assignedNodes({flatten: true});
    } else {
      return Array.from(wrapped.childNodes).map((node) => {
        if (isSlot(node)) {
          node = /** @type {!HTMLSlotElement} */(node); // eslint-disable-line no-self-assign
          return wrap$1(node).assignedNodes({flatten: true});
        } else {
          return [node];
        }
      }).reduce((a, b) => a.concat(b), []);
    }
  }

  /**
   * @param {!HTMLElement} target Node on which to listen for changes.
   * @param {?function(this: Element, { target: !HTMLElement, addedNodes: !Array<!Element>, removedNodes: !Array<!Element> }):void} callback Function called when there are additions
   * or removals from the target's list of flattened nodes.
   */
  // eslint-disable-next-line
  constructor(target, callback) {
    /**
     * @type {MutationObserver}
     * @private
     */
    this._shadyChildrenObserver = null;
    /**
     * @type {MutationObserver}
     * @private
     */
    this._nativeChildrenObserver = null;
    this._connected = false;
    /**
     * @type {!HTMLElement}
     * @private
     */
    this._target = target;
    this.callback = callback;
    this._effectiveNodes = [];
    this._observer = null;
    this._scheduled = false;
    /**
     * @type {function()}
     * @private
     */
    this._boundSchedule = () => {
      this._schedule();
    };
    this.connect();
    this._schedule();
  }

  /**
   * Activates an observer. This method is automatically called when
   * a `FlattenedNodesObserver` is created. It should only be called to
   * re-activate an observer that has been deactivated via the `disconnect` method.
   *
   * @return {void}
   */
  connect() {
    if (isSlot(this._target)) {
      this._listenSlots([this._target]);
    } else if (wrap$1(this._target).children) {
      this._listenSlots(
          /** @type {!NodeList<!Node>} */ (wrap$1(this._target).children));
      if (window.ShadyDOM) {
        this._shadyChildrenObserver =
          window.ShadyDOM.observeChildren(this._target, (mutations) => {
            this._processMutations(mutations);
          });
      } else {
        this._nativeChildrenObserver =
          new MutationObserver((mutations) => {
            this._processMutations(mutations);
          });
        this._nativeChildrenObserver.observe(this._target, {childList: true});
      }
    }
    this._connected = true;
  }

  /**
   * Deactivates the flattened nodes observer. After calling this method
   * the observer callback will not be called when changes to flattened nodes
   * occur. The `connect` method may be subsequently called to reactivate
   * the observer.
   *
   * @return {void}
   * @override
   */
  disconnect() {
    if (isSlot(this._target)) {
      this._unlistenSlots([this._target]);
    } else if (wrap$1(this._target).children) {
      this._unlistenSlots(
          /** @type {!NodeList<!Node>} */ (wrap$1(this._target).children));
      if (window.ShadyDOM && this._shadyChildrenObserver) {
        window.ShadyDOM.unobserveChildren(this._shadyChildrenObserver);
        this._shadyChildrenObserver = null;
      } else if (this._nativeChildrenObserver) {
        this._nativeChildrenObserver.disconnect();
        this._nativeChildrenObserver = null;
      }
    }
    this._connected = false;
  }

  /**
   * @return {void}
   * @private
   */
  _schedule() {
    if (!this._scheduled) {
      this._scheduled = true;
      microTask.run(() => this.flush());
    }
  }

  /**
   * @param {Array<MutationRecord>} mutations Mutations signaled by the mutation observer
   * @return {void}
   * @private
   */
  _processMutations(mutations) {
    this._processSlotMutations(mutations);
    this.flush();
  }

  /**
   * @param {Array<MutationRecord>} mutations Mutations signaled by the mutation observer
   * @return {void}
   * @private
   */
  _processSlotMutations(mutations) {
    if (mutations) {
      for (let i=0; i < mutations.length; i++) {
        let mutation = mutations[i];
        if (mutation.addedNodes) {
          this._listenSlots(mutation.addedNodes);
        }
        if (mutation.removedNodes) {
          this._unlistenSlots(mutation.removedNodes);
        }
      }
    }
  }

  /**
   * Flushes the observer causing any pending changes to be immediately
   * delivered the observer callback. By default these changes are delivered
   * asynchronously at the next microtask checkpoint.
   *
   * @return {boolean} Returns true if any pending changes caused the observer
   * callback to run.
   */
  flush() {
    if (!this._connected) {
      return false;
    }
    if (window.ShadyDOM) {
      ShadyDOM.flush();
    }
    if (this._nativeChildrenObserver) {
      this._processSlotMutations(this._nativeChildrenObserver.takeRecords());
    } else if (this._shadyChildrenObserver) {
      this._processSlotMutations(this._shadyChildrenObserver.takeRecords());
    }
    this._scheduled = false;
    let info = {
      target: this._target,
      addedNodes: [],
      removedNodes: []
    };
    let newNodes = this.constructor.getFlattenedNodes(this._target);
    let splices = calculateSplices(newNodes,
      this._effectiveNodes);
    // process removals
    for (let i=0, s; (i<splices.length) && (s=splices[i]); i++) {
      for (let j=0, n; (j < s.removed.length) && (n=s.removed[j]); j++) {
        info.removedNodes.push(n);
      }
    }
    // process adds
    for (let i=0, s; (i<splices.length) && (s=splices[i]); i++) {
      for (let j=s.index; j < s.index + s.addedCount; j++) {
        info.addedNodes.push(newNodes[j]);
      }
    }
    // update cache
    this._effectiveNodes = newNodes;
    let didFlush = false;
    if (info.addedNodes.length || info.removedNodes.length) {
      didFlush = true;
      this.callback.call(this._target, info);
    }
    return didFlush;
  }

  /**
   * @param {!Array<!Node>|!NodeList<!Node>} nodeList Nodes that could change
   * @return {void}
   * @private
   */
  _listenSlots(nodeList) {
    for (let i=0; i < nodeList.length; i++) {
      let n = nodeList[i];
      if (isSlot(n)) {
        n.addEventListener('slotchange', this._boundSchedule);
      }
    }
  }

  /**
   * @param {!Array<!Node>|!NodeList<!Node>} nodeList Nodes that could change
   * @return {void}
   * @private
   */
  _unlistenSlots(nodeList) {
    for (let i=0; i < nodeList.length; i++) {
      let n = nodeList[i];
      if (isSlot(n)) {
        n.removeEventListener('slotchange', this._boundSchedule);
      }
    }
  }

};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Forces several classes of asynchronously queued tasks to flush:
 * - Debouncers added via `enqueueDebouncer`
 * - ShadyDOM distribution
 *
 * @return {void}
 */
const flush = function() {
  let shadyDOM, debouncers;
  do {
    shadyDOM = window.ShadyDOM && ShadyDOM.flush();
    if (window.ShadyCSS && window.ShadyCSS.ScopingShim) {
      window.ShadyCSS.ScopingShim.flush();
    }
    debouncers = flushDebouncers();
  } while (shadyDOM || debouncers);
};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
/* eslint-enable no-unused-vars */

const p = Element.prototype;
/**
 * @const {function(this:Node, string): boolean}
 */
const normalizedMatchesSelector = p.matches || p.matchesSelector ||
  p.mozMatchesSelector || p.msMatchesSelector ||
  p.oMatchesSelector || p.webkitMatchesSelector;

/**
 * Cross-platform `element.matches` shim.
 *
 * @function matchesSelector
 * @param {!Node} node Node to check selector against
 * @param {string} selector Selector to match
 * @return {boolean} True if node matched selector
 */
const matchesSelector = function(node, selector) {
  return normalizedMatchesSelector.call(node, selector);
};

/**
 * Node API wrapper class returned from `Polymer.dom.(target)` when
 * `target` is a `Node`.
 * @implements {PolymerDomApi}
 * @unrestricted
 */
class DomApiNative {

  /**
   * @param {!Node} node Node for which to create a Polymer.dom helper object.
   */
  constructor(node) {
    if (window['ShadyDOM'] && window['ShadyDOM']['inUse']) {
      window['ShadyDOM']['patch'](node);
    }
    this.node = node;
  }

  /**
   * Returns an instance of `FlattenedNodesObserver` that
   * listens for node changes on this element.
   *
   * @param {function(this:HTMLElement, { target: !HTMLElement, addedNodes: !Array<!Element>, removedNodes: !Array<!Element> }):void} callback Called when direct or distributed children
   *   of this element changes
   * @return {!PolymerDomApi.ObserveHandle} Observer instance
   * @override
   */
  observeNodes(callback) {
    return new FlattenedNodesObserver(
        /** @type {!HTMLElement} */(this.node), callback);
  }

  /**
   * Disconnects an observer previously created via `observeNodes`
   *
   * @param {!PolymerDomApi.ObserveHandle} observerHandle Observer instance
   *   to disconnect.
   * @return {void}
   * @override
   */
  unobserveNodes(observerHandle) {
    observerHandle.disconnect();
  }

  /**
   * Provided as a backwards-compatible API only.  This method does nothing.
   * @return {void}
   */
  notifyObserver() {}

  /**
   * Returns true if the provided node is contained with this element's
   * light-DOM children or shadow root, including any nested shadow roots
   * of children therein.
   *
   * @param {Node} node Node to test
   * @return {boolean} Returns true if the given `node` is contained within
   *   this element's light or shadow DOM.
   * @override
   */
  deepContains(node) {
    if (wrap$1(this.node).contains(node)) {
      return true;
    }
    let n = node;
    let doc = node.ownerDocument;
    // walk from node to `this` or `document`
    while (n && n !== doc && n !== this.node) {
      // use logical parentnode, or native ShadowRoot host
      n = wrap$1(n).parentNode || wrap$1(n).host;
    }
    return n === this.node;
  }

  /**
   * Returns the root node of this node.  Equivalent to `getRootNode()`.
   *
   * @return {!Node} Top most element in the dom tree in which the node
   * exists. If the node is connected to a document this is either a
   * shadowRoot or the document; otherwise, it may be the node
   * itself or a node or document fragment containing it.
   * @override
   */
  getOwnerRoot() {
    return wrap$1(this.node).getRootNode();
  }

  /**
   * For slot elements, returns the nodes assigned to the slot; otherwise
   * an empty array. It is equivalent to `<slot>.addignedNodes({flatten:true})`.
   *
   * @return {!Array<!Node>} Array of assigned nodes
   * @override
   */
  getDistributedNodes() {
    return (this.node.localName === 'slot') ?
      wrap$1(this.node).assignedNodes({flatten: true}) :
      [];
  }

  /**
   * Returns an array of all slots this element was distributed to.
   *
   * @return {!Array<!HTMLSlotElement>} Description
   * @override
   */
  getDestinationInsertionPoints() {
    let ip$ = [];
    let n = wrap$1(this.node).assignedSlot;
    while (n) {
      ip$.push(n);
      n = wrap$1(n).assignedSlot;
    }
    return ip$;
  }

  /**
   * Calls `importNode` on the `ownerDocument` for this node.
   *
   * @param {!Node} node Node to import
   * @param {boolean} deep True if the node should be cloned deeply during
   *   import
   * @return {Node} Clone of given node imported to this owner document
   */
  importNode(node, deep) {
    let doc = this.node instanceof Document ? this.node :
      this.node.ownerDocument;
    return wrap$1(doc).importNode(node, deep);
  }

  /**
   * @return {!Array<!Node>} Returns a flattened list of all child nodes and
   * nodes assigned to child slots.
   * @override
   */
  getEffectiveChildNodes() {
    return FlattenedNodesObserver.getFlattenedNodes(
        /** @type {!HTMLElement} */ (this.node));
  }

  /**
   * Returns a filtered list of flattened child elements for this element based
   * on the given selector.
   *
   * @param {string} selector Selector to filter nodes against
   * @return {!Array<!HTMLElement>} List of flattened child elements
   * @override
   */
  queryDistributedElements(selector) {
    let c$ = this.getEffectiveChildNodes();
    let list = [];
    for (let i=0, l=c$.length, c; (i<l) && (c=c$[i]); i++) {
      if ((c.nodeType === Node.ELEMENT_NODE) &&
          matchesSelector(c, selector)) {
        list.push(c);
      }
    }
    return list;
  }

  /**
   * For shadow roots, returns the currently focused element within this
   * shadow root.
   *
   * return {Node|undefined} Currently focused element
   * @override
   */
  get activeElement() {
    let node = this.node;
    return node._activeElement !== undefined ? node._activeElement : node.activeElement;
  }
}

function forwardMethods(proto, methods) {
  for (let i=0; i < methods.length; i++) {
    let method = methods[i];
    /* eslint-disable valid-jsdoc */
    proto[method] = /** @this {DomApiNative} */ function() {
      return this.node[method].apply(this.node, arguments);
    };
    /* eslint-enable */
  }
}

function forwardReadOnlyProperties(proto, properties) {
  for (let i=0; i < properties.length; i++) {
    let name = properties[i];
    Object.defineProperty(proto, name, {
      get: function() {
        const domApi = /** @type {DomApiNative} */(this);
        return domApi.node[name];
      },
      configurable: true
    });
  }
}

function forwardProperties(proto, properties) {
  for (let i=0; i < properties.length; i++) {
    let name = properties[i];
    Object.defineProperty(proto, name, {
      /**
       * @this {DomApiNative}
       * @return {*} .
       */
      get: function() {
        return this.node[name];
      },
      /**
       * @this {DomApiNative}
       * @param {*} value .
       */
      set: function(value) {
        this.node[name] = value;
      },
      configurable: true
    });
  }
}


/**
 * Event API wrapper class returned from `dom.(target)` when
 * `target` is an `Event`.
 */
class EventApi {
  constructor(event) {
    this.event = event;
  }

  /**
   * Returns the first node on the `composedPath` of this event.
   *
   * @return {!EventTarget} The node this event was dispatched to
   */
  get rootTarget() {
    return this.path[0];
  }

  /**
   * Returns the local (re-targeted) target for this event.
   *
   * @return {!EventTarget} The local (re-targeted) target for this event.
   */
  get localTarget() {
    return this.event.target;
  }

  /**
   * Returns the `composedPath` for this event.
   * @return {!Array<!EventTarget>} The nodes this event propagated through
   */
  get path() {
    return this.event.composedPath();
  }
}

/**
 * @function
 * @param {boolean=} deep
 * @return {!Node}
 */
DomApiNative.prototype.cloneNode;
/**
 * @function
 * @param {!Node} node
 * @return {!Node}
 */
DomApiNative.prototype.appendChild;
/**
 * @function
 * @param {!Node} newChild
 * @param {Node} refChild
 * @return {!Node}
 */
DomApiNative.prototype.insertBefore;
/**
 * @function
 * @param {!Node} node
 * @return {!Node}
 */
DomApiNative.prototype.removeChild;
/**
 * @function
 * @param {!Node} oldChild
 * @param {!Node} newChild
 * @return {!Node}
 */
DomApiNative.prototype.replaceChild;
/**
 * @function
 * @param {string} name
 * @param {string} value
 * @return {void}
 */
DomApiNative.prototype.setAttribute;
/**
 * @function
 * @param {string} name
 * @return {void}
 */
DomApiNative.prototype.removeAttribute;
/**
 * @function
 * @param {string} selector
 * @return {?Element}
 */
DomApiNative.prototype.querySelector;
/**
 * @function
 * @param {string} selector
 * @return {!NodeList<!Element>}
 */
DomApiNative.prototype.querySelectorAll;

/** @type {?Node} */
DomApiNative.prototype.parentNode;
/** @type {?Node} */
DomApiNative.prototype.firstChild;
/** @type {?Node} */
DomApiNative.prototype.lastChild;
/** @type {?Node} */
DomApiNative.prototype.nextSibling;
/** @type {?Node} */
DomApiNative.prototype.previousSibling;
/** @type {?HTMLElement} */
DomApiNative.prototype.firstElementChild;
/** @type {?HTMLElement} */
DomApiNative.prototype.lastElementChild;
/** @type {?HTMLElement} */
DomApiNative.prototype.nextElementSibling;
/** @type {?HTMLElement} */
DomApiNative.prototype.previousElementSibling;
/** @type {!Array<!Node>} */
DomApiNative.prototype.childNodes;
/** @type {!Array<!HTMLElement>} */
DomApiNative.prototype.children;
/** @type {?DOMTokenList} */
DomApiNative.prototype.classList;

/** @type {string} */
DomApiNative.prototype.textContent;
/** @type {string} */
DomApiNative.prototype.innerHTML;

let DomApiImpl = DomApiNative;

if (window['ShadyDOM'] && window['ShadyDOM']['inUse'] && window['ShadyDOM']['noPatch'] && window['ShadyDOM']['Wrapper']) {

  /**
   * @private
   * @extends {HTMLElement}
   */
  class Wrapper extends window['ShadyDOM']['Wrapper'] {}

  // copy bespoke API onto wrapper
  Object.getOwnPropertyNames(DomApiNative.prototype).forEach((prop) => {
    if (prop != 'activeElement') {
      Wrapper.prototype[prop] = DomApiNative.prototype[prop];
    }
  });

  // Note, `classList` is here only for legacy compatibility since it does not
  // trigger distribution in v1 Shadow DOM.
  forwardReadOnlyProperties(Wrapper.prototype, [
    'classList'
  ]);

  DomApiImpl = Wrapper;

  Object.defineProperties(EventApi.prototype, {

    // Returns the "lowest" node in the same root as the event's currentTarget.
    // When in `noPatch` mode, this must be calculated by walking the event's
    // path.
    localTarget: {
      get() {
        const current = this.event.currentTarget;
        const currentRoot = current && dom(current).getOwnerRoot();
        const p$ = this.path;
        for (let i = 0; i < p$.length; i++) {
          const e = p$[i];
          if (dom(e).getOwnerRoot() === currentRoot) {
            return e;
          }
        }
      },
      configurable: true
    },

    path: {
      get() {
        return window['ShadyDOM']['composedPath'](this.event);
      },
      configurable: true
    }
  });

} else {

  // Methods that can provoke distribution or must return the logical, not
  // composed tree.
  forwardMethods(DomApiNative.prototype, [
    'cloneNode', 'appendChild', 'insertBefore', 'removeChild',
    'replaceChild', 'setAttribute', 'removeAttribute',
    'querySelector', 'querySelectorAll'
  ]);

  // Properties that should return the logical, not composed tree. Note, `classList`
  // is here only for legacy compatibility since it does not trigger distribution
  // in v1 Shadow DOM.
  forwardReadOnlyProperties(DomApiNative.prototype, [
    'parentNode', 'firstChild', 'lastChild',
    'nextSibling', 'previousSibling', 'firstElementChild',
    'lastElementChild', 'nextElementSibling', 'previousElementSibling',
    'childNodes', 'children', 'classList'
  ]);

  forwardProperties(DomApiNative.prototype, [
    'textContent', 'innerHTML', 'className'
  ]);
}

/**
 * Legacy DOM and Event manipulation API wrapper factory used to abstract
 * differences between native Shadow DOM and "Shady DOM" when polyfilling on
 * older browsers.
 *
 * Note that in Polymer 2.x use of `Polymer.dom` is no longer required and
 * in the majority of cases simply facades directly to the standard native
 * API.
 *
 * @summary Legacy DOM and Event manipulation API wrapper factory used to
 * abstract differences between native Shadow DOM and "Shady DOM."
 * @param {(Node|Event|DomApiNative|EventApi)=} obj Node or event to operate on
 * @return {!DomApiNative|!EventApi} Wrapper providing either node API or event API
 */
const dom = function(obj) {
  obj = obj || document;
  if (obj instanceof DomApiImpl) {
    return /** @type {!DomApi} */(obj);
  }
  if (obj instanceof EventApi) {
    return /** @type {!EventApi} */(obj);
  }
  let helper = obj['__domApi'];
  if (!helper) {
    if (obj instanceof Event) {
      helper = new EventApi(obj);
    } else {
      helper = new DomApiImpl(/** @type {Node} */(obj));
    }
    obj['__domApi'] = helper;
  }
  return helper;
};

/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const ShadyDOM$1 = window.ShadyDOM;
const ShadyCSS = window.ShadyCSS;

/**
 * Return true if node scope is correct.
 *
 * @param {!Element} node Node to check scope
 * @param {!Node} scope Scope reference
 * @return {boolean} True if node is in scope
 */
function sameScope(node, scope) {
  return wrap$1(node).getRootNode() === scope;
}

/**
 * Ensure that elements in a ShadowDOM container are scoped correctly.
 * This function is only needed when ShadyDOM is used and unpatched DOM APIs are used in third party code.
 * This can happen in noPatch mode or when specialized APIs like ranges or tables are used to mutate DOM.
 *
 * @param  {!Element} container Container element to scope
 * @param  {boolean=} shouldObserve if true, start a mutation observer for added nodes to the container
 * @return {?MutationObserver} Returns a new MutationObserver on `container` if `shouldObserve` is true.
 */
function scopeSubtree(container, shouldObserve = false) {
  // If using native ShadowDOM, abort
  if (!ShadyDOM$1 || !ShadyCSS) {
    return null;
  }
  // ShadyCSS handles DOM mutations when ShadyDOM does not handle scoping itself
  if (!ShadyDOM$1['handlesDynamicScoping']) {
    return null;
  }
  const ScopingShim = ShadyCSS['ScopingShim'];
  // if ScopingShim is not available, abort
  if (!ScopingShim) {
    return null;
  }
  // capture correct scope for container
  const containerScope = ScopingShim['scopeForNode'](container);
  const root = wrap$1(container).getRootNode();

  const scopify = (node) => {
    if (!sameScope(node, root)) {
      return;
    }
    // NOTE: native qSA does not honor scoped DOM, but it is faster, and the same behavior as Polymer v1
    const elements = Array.from(ShadyDOM$1['nativeMethods']['querySelectorAll'].call(node, '*'));
    elements.push(node);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!sameScope(el, root)) {
        continue;
      }
      const currentScope = ScopingShim['currentScopeForNode'](el);
      if (currentScope !== containerScope) {
        if (currentScope !== '') {
          ScopingShim['unscopeNode'](el, currentScope);
        }
        ScopingShim['scopeNode'](el, containerScope);
      }
    }
  };

  // scope everything in container
  scopify(container);

  if (shouldObserve) {
    const mo = new MutationObserver((mxns) => {
      for (let i = 0; i < mxns.length; i++) {
        const mxn = mxns[i];
        for (let j = 0; j < mxn.addedNodes.length; j++) {
          const addedNode = mxn.addedNodes[j];
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            scopify(addedNode);
          }
        }
      }
    });
    mo.observe(container, {childList: true, subtree: true});
    return mo;
  } else {
    return null;
  }
}

/**
 * @fileoverview
 * @suppress {checkPrototypalTypes}
 * @license Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

const DISABLED_ATTR = 'disable-upgrade';

const findObservedAttributesGetter = (ctor) => {
  while (ctor) {
    const desc = Object.getOwnPropertyDescriptor(ctor, 'observedAttributes');
    if (desc) {
      return desc.get;
    }
    ctor = Object.getPrototypeOf(ctor.prototype).constructor;
  }
  return () => [];
};

/**
 * Element class mixin that allows the element to boot up in a non-enabled
 * state when the `disable-upgrade` attribute is present. This mixin is
 * designed to be used with element classes like PolymerElement that perform
 * initial startup work when they are first connected. When the
 * `disable-upgrade` attribute is removed, if the element is connected, it
 * boots up and "enables" as it otherwise would; if it is not connected, the
 * element boots up when it is next connected.
 *
 * Using `disable-upgrade` with PolymerElement prevents any data propagation
 * to the element, any element DOM from stamping, or any work done in
 * connected/disconnctedCallback from occuring, but it does not prevent work
 * done in the element constructor.
 *
 * Note, this mixin must be applied on top of any element class that
 * itself implements a `connectedCallback` so that it can control the work
 * done in `connectedCallback`. For example,
 *
 *     MyClass = DisableUpgradeMixin(class extends BaseClass {...});
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin ElementMixin
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const DisableUpgradeMixin = dedupingMixin((base) => {
  /**
   * @constructor
   * @implements {Polymer_ElementMixin}
   * @extends {HTMLElement}
   * @private
   */
  const superClass = ElementMixin(base);

  // Work around for closure bug #126934458. Using `super` in a property
  // getter does not work so instead we search the Base prototype for an
  // implementation of observedAttributes so that we can override and call
  // the `super` getter. Note, this is done one time ever because we assume
  // that `Base` is always comes from `Polymer.LegacyElementMixn`.
  let observedAttributesGetter = findObservedAttributesGetter(superClass);

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_DisableUpgradeMixin}
   */
  class DisableUpgradeClass extends superClass {

    constructor() {
      super();
      /** @type {boolean|undefined} */
      this.__isUpgradeDisabled;
    }

    static get observedAttributes() {
      return observedAttributesGetter.call(this).concat(DISABLED_ATTR);
    }

    // Prevent element from initializing properties when it's upgrade disabled.
    /** @override */
    _initializeProperties() {
      if (this.hasAttribute(DISABLED_ATTR)) {
        this.__isUpgradeDisabled = true;
      } else {
        super._initializeProperties();
      }
    }

    // Prevent element from enabling properties when it's upgrade disabled.
    // Normally overriding connectedCallback would be enough, but dom-* elements
    /** @override */
    _enableProperties() {
      if (!this.__isUpgradeDisabled) {
        super._enableProperties();
      }
    }

    // If the element starts upgrade-disabled and a property is set for
    // which an accessor exists, the default should not be applied.
    // This additional check is needed because defaults are applied via
    // `_initializeProperties` which is called after initial properties
    // have been set when the element starts upgrade-disabled.
    /** @override */
    _canApplyPropertyDefault(property) {
      return super._canApplyPropertyDefault(property) &&
        !(this.__isUpgradeDisabled && this._isPropertyPending(property));
    }

    /**
     * @override
     * @param {string} name Attribute name.
     * @param {?string} old The previous value for the attribute.
     * @param {?string} value The new value for the attribute.
     * @param {?string} namespace The XML namespace for the attribute.
     * @return {void}
     */
    attributeChangedCallback(name, old, value, namespace) {
      if (name == DISABLED_ATTR) {
        // When disable-upgrade is removed, intialize properties and
        // provoke connectedCallback if the element is already connected.
        if (this.__isUpgradeDisabled && value == null) {
          super._initializeProperties();
          this.__isUpgradeDisabled = false;
          if (wrap$1(this).isConnected) {
            super.connectedCallback();
          }
        }
      } else {
        super.attributeChangedCallback(
            name, old, value, /** @type {null|string} */ (namespace));
      }
    }

    // Prevent element from connecting when it's upgrade disabled.
    // This prevents user code in `attached` from being called.
    /** @override */
    connectedCallback() {
      if (!this.__isUpgradeDisabled) {
        super.connectedCallback();
      }
    }

    // Prevent element from disconnecting when it's upgrade disabled.
    // This avoids allowing user code `detached` from being called without a
    // paired call to `attached`.
    /** @override */
    disconnectedCallback() {
      if (!this.__isUpgradeDisabled) {
        super.disconnectedCallback();
      }
    }

  }

  return DisableUpgradeClass;
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const DISABLED_ATTR$1 = 'disable-upgrade';

let styleInterface = window.ShadyCSS;

/**
 * Element class mixin that provides Polymer's "legacy" API intended to be
 * backward-compatible to the greatest extent possible with the API
 * found on the Polymer 1.x `Polymer.Base` prototype applied to all elements
 * defined using the `Polymer({...})` function.
 *
 * @mixinFunction
 * @polymer
 * @appliesMixin ElementMixin
 * @appliesMixin GestureEventListeners
 * @appliesMixin DirMixin
 * @property isAttached {boolean} Set to `true` in this element's
 *   `connectedCallback` and `false` in `disconnectedCallback`
 * @summary Element class mixin that provides Polymer's "legacy" API
 */
const LegacyElementMixin = dedupingMixin((base) => {

  // TODO(kschaaf): Note, the `@implements {Polymer_DirMixin}` is required here
  // (rather than on legacyElementBase) for unknown reasons.
  /**
   * @constructor
   * @implements {Polymer_ElementMixin}
   * @implements {Polymer_GestureEventListeners}
   * @implements {Polymer_DirMixin}
   * @extends {HTMLElement}
   * @private
   */
  const GesturesElement = GestureEventListeners(ElementMixin(base));

  // Note, the DirMixin does nothing if css is built so avoid including it
  // in that case.

  /**
   * @constructor
   * @extends {GesturesElement}
   * @private
   */
  const legacyElementBase = builtCSS ? GesturesElement :
    DirMixin(GesturesElement);

  const observedAttributesGetter = findObservedAttributesGetter(legacyElementBase);

  /**
   * Map of simple names to touch action names
   * @dict
   */
  const DIRECTION_MAP = {
    'x': 'pan-x',
    'y': 'pan-y',
    'none': 'none',
    'all': 'auto'
  };

  /**
   * @polymer
   * @mixinClass
   * @extends {legacyElementBase}
   * @implements {Polymer_LegacyElementMixin}
   * @unrestricted
   */
  class LegacyElement extends legacyElementBase {

    constructor() {
      super();
      /** @type {boolean} */
      this.isAttached;
      /** @type {?WeakMap<!Element, !Object<string, !Function>>} */
      this.__boundListeners;
      /** @type {?Object<string, ?Function>} */
      this._debouncers;
      // NOTE: Inlined for perf from version of DisableUpgradeMixin.
      /** @type {boolean|undefined} */
      this.__isUpgradeDisabled;
      /** @type {boolean|undefined} */
      this.__needsAttributesAtConnected;
      /** @type {boolean|undefined} */
      this._legacyForceObservedAttributes;
    }

    /**
     * Forwards `importMeta` from the prototype (i.e. from the info object
     * passed to `Polymer({...})`) to the static API.
     *
     * @return {!Object} The `import.meta` object set on the prototype
     * @suppress {missingProperties} `this` is always in the instance in
     *  closure for some reason even in a static method, rather than the class
     * @nocollapse
     */
    static get importMeta() {
      return this.prototype.importMeta;
    }

    /**
     * Legacy callback called during the `constructor`, for overriding
     * by the user.
     * @override
     * @return {void}
     */
    created() {}

    /**
     * Processes an attribute reaction when the `legacyNoObservedAttributes`
     * setting is in use.
     * @param {string} name Name of attribute that changed
     * @param {?string} old Old attribute value
     * @param {?string} value New attribute value
     * @return {void}
     */
    __attributeReaction(name, old, value) {
      if ((this.__dataAttributes && this.__dataAttributes[name]) || name === DISABLED_ATTR$1) {
        this.attributeChangedCallback(name, old, value, null);
      }
    }

    /**
     * Sets the value of an attribute.
     * @override
     * @param {string} name The name of the attribute to change.
     * @param {string|number|boolean|!TrustedHTML|!TrustedScriptURL|!TrustedURL} value The new attribute value.
     */
    setAttribute(name, value) {
      if (legacyNoObservedAttributes && !this._legacyForceObservedAttributes) {
        const oldValue = this.getAttribute(name);
        super.setAttribute(name, value);
        // value coerced to String for closure's benefit
        this.__attributeReaction(name, oldValue, String(value));
      } else {
        super.setAttribute(name, value);
      }
    }

    /**
     * Removes an attribute.
     * @override
     * @param {string} name The name of the attribute to remove.
     */
    removeAttribute(name) {
      if (legacyNoObservedAttributes && !this._legacyForceObservedAttributes) {
        const oldValue = this.getAttribute(name);
        super.removeAttribute(name);
        this.__attributeReaction(name, oldValue, null);
      } else {
        super.removeAttribute(name);
      }
    }

    // NOTE: Inlined for perf from version of DisableUpgradeMixin.
    static get observedAttributes() {
      if (legacyNoObservedAttributes && !this.prototype._legacyForceObservedAttributes) {
        // Ensure this element is property registered with the telemetry system.
        if (!this.hasOwnProperty(JSCompiler_renameProperty('__observedAttributes', this))) {
          this.__observedAttributes = [];
          register(this.prototype);
        }
        return this.__observedAttributes;
      } else {
        return observedAttributesGetter.call(this).concat(DISABLED_ATTR$1);
      }
    }

    // NOTE: Inlined for perf from version of DisableUpgradeMixin.
    // Prevent element from enabling properties when it's upgrade disabled.
    // Normally overriding connectedCallback would be enough, but dom-* elements
    /** @override */
    _enableProperties() {
      if (!this.__isUpgradeDisabled) {
        super._enableProperties();
      }
    }

    // NOTE: Inlined for perf from version of DisableUpgradeMixin.
    // If the element starts upgrade-disabled and a property is set for
    // which an accessor exists, the default should not be applied.
    // This additional check is needed because defaults are applied via
    // `_initializeProperties` which is called after initial properties
    // have been set when the element starts upgrade-disabled.
    /** @override */
    _canApplyPropertyDefault(property) {
      return super._canApplyPropertyDefault(property) &&
        !(this.__isUpgradeDisabled && this._isPropertyPending(property));
    }

    /**
     * Provides an implementation of `connectedCallback`
     * which adds Polymer legacy API's `attached` method.
     * @return {void}
     * @override
     */
    connectedCallback() {
      if (this.__needsAttributesAtConnected) {
        this._takeAttributes();
      }
      // NOTE: Inlined for perf from version of DisableUpgradeMixin.
      if (!this.__isUpgradeDisabled) {
        super.connectedCallback();
        this.isAttached = true;
        this.attached();
      }
    }

    /**
     * Legacy callback called during `connectedCallback`, for overriding
     * by the user.
     * @override
     * @return {void}
     */
    attached() {}

    /**
     * Provides an implementation of `disconnectedCallback`
     * which adds Polymer legacy API's `detached` method.
     * @return {void}
     * @override
     */
    disconnectedCallback() {
      // NOTE: Inlined for perf from version of DisableUpgradeMixin.
      if (!this.__isUpgradeDisabled) {
        super.disconnectedCallback();
        this.isAttached = false;
        this.detached();
      }
    }

    /**
     * Legacy callback called during `disconnectedCallback`, for overriding
     * by the user.
     * @override
     * @return {void}
     */
    detached() {}

    /**
     * Provides an override implementation of `attributeChangedCallback`
     * which adds the Polymer legacy API's `attributeChanged` method.
     * @param {string} name Name of attribute.
     * @param {?string} old Old value of attribute.
     * @param {?string} value Current value of attribute.
     * @param {?string} namespace Attribute namespace.
     * @return {void}
     * @override
     */
    attributeChangedCallback(name, old, value, namespace) {
      if (old !== value) {
        // NOTE: Inlined for perf from version of DisableUpgradeMixin.
        if (name == DISABLED_ATTR$1) {
          // When disable-upgrade is removed, intialize properties and
          // provoke connectedCallback if the element is already connected.
          if (this.__isUpgradeDisabled && value == null) {
            this._initializeProperties();
            this.__isUpgradeDisabled = false;
            if (wrap$1(this).isConnected) {
              this.connectedCallback();
            }
          }
        } else {
          super.attributeChangedCallback(name, old, value, namespace);
          this.attributeChanged(name, old, value);
        }
      }
    }

    /**
     * Legacy callback called during `attributeChangedChallback`, for overriding
     * by the user.
     * @param {string} name Name of attribute.
     * @param {?string} old Old value of attribute.
     * @param {?string} value Current value of attribute.
     * @return {void}
     * @override
     */
    attributeChanged(name, old, value) {} // eslint-disable-line no-unused-vars

    /**
     * Overrides the default `Polymer.PropertyEffects` implementation to
     * add support for class initialization via the `_registered` callback.
     * This is called only when the first instance of the element is created.
     *
     * @return {void}
     * @override
     * @suppress {invalidCasts}
     */
    _initializeProperties() {
      // NOTE: Inlined for perf from version of DisableUpgradeMixin.
      // Only auto-use disable-upgrade if legacyOptimizations is set.
      if (legacyOptimizations && this.hasAttribute(DISABLED_ATTR$1)) {
        this.__isUpgradeDisabled = true;
      } else {
        let proto = Object.getPrototypeOf(this);
        if (!proto.hasOwnProperty(JSCompiler_renameProperty('__hasRegisterFinished', proto))) {
          this._registered();
          // backstop in case the `_registered` implementation does not set this
          proto.__hasRegisterFinished = true;
        }
        super._initializeProperties();
        this.root = /** @type {HTMLElement} */(this);
        this.created();
        // Pull all attribute values 1x if `legacyNoObservedAttributes` is set.
        if (legacyNoObservedAttributes && !this._legacyForceObservedAttributes) {
          if (this.hasAttributes()) {
            this._takeAttributes();
          // Element created from scratch or parser generated
          } else if (!this.parentNode) {
            this.__needsAttributesAtConnected = true;
          }
        }
        // Ensure listeners are applied immediately so that they are
        // added before declarative event listeners. This allows an element to
        // decorate itself via an event prior to any declarative listeners
        // seeing the event. Note, this ensures compatibility with 1.x ordering.
        this._applyListeners();
      }
    }

    _takeAttributes() {
      const a = this.attributes;
      for (let i=0, l=a.length; i < l; i++) {
        const attr = a[i];
        this.__attributeReaction(attr.name, null, attr.value);
      }
    }

    /**
     * Called automatically when an element is initializing.
     * Users may override this method to perform class registration time
     * work. The implementation should ensure the work is performed
     * only once for the class.
     * @protected
     * @return {void}
     * @override
     */
    _registered() {}

    /**
     * Overrides the default `Polymer.PropertyEffects` implementation to
     * add support for installing `hostAttributes` and `listeners`.
     *
     * @return {void}
     * @override
     */
    ready() {
      this._ensureAttributes();
      super.ready();
    }

    /**
     * Ensures an element has required attributes. Called when the element
     * is being readied via `ready`. Users should override to set the
     * element's required attributes. The implementation should be sure
     * to check and not override existing attributes added by
     * the user of the element. Typically, setting attributes should be left
     * to the element user and not done here; reasonable exceptions include
     * setting aria roles and focusability.
     * @protected
     * @return {void}
     * @override
     */
    _ensureAttributes() {}

    /**
     * Adds element event listeners. Called when the element
     * is being readied via `ready`. Users should override to
     * add any required element event listeners.
     * In performance critical elements, the work done here should be kept
     * to a minimum since it is done before the element is rendered. In
     * these elements, consider adding listeners asynchronously so as not to
     * block render.
     * @protected
     * @return {void}
     * @override
     */
    _applyListeners() {}

    /**
     * Converts a typed JavaScript value to a string.
     *
     * Note this method is provided as backward-compatible legacy API
     * only.  It is not directly called by any Polymer features. To customize
     * how properties are serialized to attributes for attribute bindings and
     * `reflectToAttribute: true` properties as well as this method, override
     * the `_serializeValue` method provided by `Polymer.PropertyAccessors`.
     *
     * @param {*} value Value to deserialize
     * @return {string | undefined} Serialized value
     * @override
     */
    serialize(value) {
      return this._serializeValue(value);
    }

    /**
     * Converts a string to a typed JavaScript value.
     *
     * Note this method is provided as backward-compatible legacy API
     * only.  It is not directly called by any Polymer features.  To customize
     * how attributes are deserialized to properties for in
     * `attributeChangedCallback`, override `_deserializeValue` method
     * provided by `Polymer.PropertyAccessors`.
     *
     * @param {string} value String to deserialize
     * @param {*} type Type to deserialize the string to
     * @return {*} Returns the deserialized value in the `type` given.
     * @override
     */
    deserialize(value, type) {
      return this._deserializeValue(value, type);
    }

    /**
     * Serializes a property to its associated attribute.
     *
     * Note this method is provided as backward-compatible legacy API
     * only.  It is not directly called by any Polymer features.
     *
     * @param {string} property Property name to reflect.
     * @param {string=} attribute Attribute name to reflect.
     * @param {*=} value Property value to reflect.
     * @return {void}
     * @override
     */
    reflectPropertyToAttribute(property, attribute, value) {
      this._propertyToAttribute(property, attribute, value);
    }

    /**
     * Sets a typed value to an HTML attribute on a node.
     *
     * Note this method is provided as backward-compatible legacy API
     * only.  It is not directly called by any Polymer features.
     *
     * @param {*} value Value to serialize.
     * @param {string} attribute Attribute name to serialize to.
     * @param {Element} node Element to set attribute to.
     * @return {void}
     * @override
     */
    serializeValueToAttribute(value, attribute, node) {
      this._valueToNodeAttribute(/** @type {Element} */ (node || this), value, attribute);
    }

    /**
     * Copies own properties (including accessor descriptors) from a source
     * object to a target object.
     *
     * @param {Object} prototype Target object to copy properties to.
     * @param {Object} api Source object to copy properties from.
     * @return {Object} prototype object that was passed as first argument.
     * @override
     */
    extend(prototype, api) {
      if (!(prototype && api)) {
        return prototype || api;
      }
      let n$ = Object.getOwnPropertyNames(api);
      for (let i=0, n; (i<n$.length) && (n=n$[i]); i++) {
        let pd = Object.getOwnPropertyDescriptor(api, n);
        if (pd) {
          Object.defineProperty(prototype, n, pd);
        }
      }
      return prototype;
    }

    /**
     * Copies props from a source object to a target object.
     *
     * Note, this method uses a simple `for...in` strategy for enumerating
     * properties.  To ensure only `ownProperties` are copied from source
     * to target and that accessor implementations are copied, use `extend`.
     *
     * @param {!Object} target Target object to copy properties to.
     * @param {!Object} source Source object to copy properties from.
     * @return {!Object} Target object that was passed as first argument.
     * @override
     */
    mixin(target, source) {
      for (let i in source) {
        target[i] = source[i];
      }
      return target;
    }

    /**
     * Sets the prototype of an object.
     *
     * Note this method is provided as backward-compatible legacy API
     * only.  It is not directly called by any Polymer features.
     * @param {Object} object The object on which to set the prototype.
     * @param {Object} prototype The prototype that will be set on the given
     * `object`.
     * @return {Object} Returns the given `object` with its prototype set
     * to the given `prototype` object.
     * @override
     */
    chainObject(object, prototype) {
      if (object && prototype && object !== prototype) {
        object.__proto__ = prototype;
      }
      return object;
    }

    /* **** Begin Template **** */

    /**
     * Calls `importNode` on the `content` of the `template` specified and
     * returns a document fragment containing the imported content.
     *
     * @param {HTMLTemplateElement} template HTML template element to instance.
     * @return {!DocumentFragment} Document fragment containing the imported
     *   template content.
     * @override
     * @suppress {missingProperties} go/missingfnprops
     */
    instanceTemplate(template) {
      let content = this.constructor._contentForTemplate(template);
      let dom = /** @type {!DocumentFragment} */
        (document.importNode(content, true));
      return dom;
    }

    /* **** Begin Events **** */



    /**
     * Dispatches a custom event with an optional detail value.
     *
     * @param {string} type Name of event type.
     * @param {*=} detail Detail value containing event-specific
     *   payload.
     * @param {{ bubbles: (boolean|undefined), cancelable: (boolean|undefined),
     *     composed: (boolean|undefined) }=}
     *  options Object specifying options.  These may include:
     *  `bubbles` (boolean, defaults to `true`),
     *  `cancelable` (boolean, defaults to false), and
     *  `node` on which to fire the event (HTMLElement, defaults to `this`).
     * @return {!Event} The new event that was fired.
     * @override
     */
    fire(type, detail, options) {
      options = options || {};
      detail = (detail === null || detail === undefined) ? {} : detail;
      let event = new Event(type, {
        bubbles: options.bubbles === undefined ? true : options.bubbles,
        cancelable: Boolean(options.cancelable),
        composed: options.composed === undefined ? true: options.composed
      });
      event.detail = detail;
      let node = options.node || this;
      wrap$1(node).dispatchEvent(event);
      return event;
    }

    /**
     * Convenience method to add an event listener on a given element,
     * late bound to a named method on this element.
     *
     * @param {?EventTarget} node Element to add event listener to.
     * @param {string} eventName Name of event to listen for.
     * @param {string} methodName Name of handler method on `this` to call.
     * @return {void}
     * @override
     */
    listen(node, eventName, methodName) {
      node = /** @type {!EventTarget} */ (node || this);
      let hbl = this.__boundListeners ||
        (this.__boundListeners = new WeakMap());
      let bl = hbl.get(node);
      if (!bl) {
        bl = {};
        hbl.set(node, bl);
      }
      let key = eventName + methodName;
      if (!bl[key]) {
        bl[key] = this._addMethodEventListenerToNode(
            /** @type {!Node} */ (node), eventName, methodName, this);
      }
    }

    /**
     * Convenience method to remove an event listener from a given element,
     * late bound to a named method on this element.
     *
     * @param {?EventTarget} node Element to remove event listener from.
     * @param {string} eventName Name of event to stop listening to.
     * @param {string} methodName Name of handler method on `this` to not call
     anymore.
     * @return {void}
     * @override
     */
    unlisten(node, eventName, methodName) {
      node = /** @type {!EventTarget} */ (node || this);
      let bl = this.__boundListeners &&
          this.__boundListeners.get(/** @type {!Element} */ (node));
      let key = eventName + methodName;
      let handler = bl && bl[key];
      if (handler) {
        this._removeEventListenerFromNode(
            /** @type {!Node} */ (node), eventName, handler);
        bl[key] = /** @type {?} */ (null);
      }
    }

    /**
     * Override scrolling behavior to all direction, one direction, or none.
     *
     * Valid scroll directions:
     *   - 'all': scroll in any direction
     *   - 'x': scroll only in the 'x' direction
     *   - 'y': scroll only in the 'y' direction
     *   - 'none': disable scrolling for this node
     *
     * @param {string=} direction Direction to allow scrolling
     * Defaults to `all`.
     * @param {Element=} node Element to apply scroll direction setting.
     * Defaults to `this`.
     * @return {void}
     * @override
     */
    setScrollDirection(direction, node) {
      setTouchAction(
          /** @type {!Element} */ (node || this),
          DIRECTION_MAP[direction] || 'auto');
    }
    /* **** End Events **** */

    /**
     * Convenience method to run `querySelector` on this local DOM scope.
     *
     * This function calls `Polymer.dom(this.root).querySelector(slctr)`.
     *
     * @param {string} slctr Selector to run on this local DOM scope
     * @return {Element} Element found by the selector, or null if not found.
     * @override
     */
    $$(slctr) {
      // Note, no need to `wrap` this because root is always patched
      return this.root.querySelector(slctr);
    }

    /**
     * Return the element whose local dom within which this element
     * is contained. This is a shorthand for
     * `this.getRootNode().host`.
     * @this {Element}
     * @return {?Node} The element whose local dom within which this element is
     * contained.
     * @override
     */
    get domHost() {
      let root = wrap$1(this).getRootNode();
      return (root instanceof DocumentFragment) ? /** @type {ShadowRoot} */ (root).host : root;
    }

    /**
     * Force this element to distribute its children to its local dom.
     * This should not be necessary as of Polymer 2.0.2 and is provided only
     * for backwards compatibility.
     * @return {void}
     * @override
     */
    distributeContent() {
      const thisEl = /** @type {Element} */ (this);
      const domApi = /** @type {PolymerDomApi} */(dom(thisEl));
      if (window.ShadyDOM && domApi.shadowRoot) {
        ShadyDOM.flush();
      }
    }

    /**
     * Returns a list of nodes that are the effective childNodes. The effective
     * childNodes list is the same as the element's childNodes except that
     * any `<content>` elements are replaced with the list of nodes distributed
     * to the `<content>`, the result of its `getDistributedNodes` method.
     * @return {!Array<!Node>} List of effective child nodes.
     * @suppress {invalidCasts} LegacyElementMixin must be applied to an
     *     HTMLElement
     * @override
     */
    getEffectiveChildNodes() {
      const thisEl = /** @type {Element} */ (this);
      const domApi = /** @type {PolymerDomApi} */ (dom(thisEl));
      return domApi.getEffectiveChildNodes();
    }

    /**
     * Returns a list of nodes distributed within this element that match
     * `selector`. These can be dom children or elements distributed to
     * children that are insertion points.
     * @param {string} selector Selector to run.
     * @return {!Array<!Node>} List of distributed elements that match selector.
     * @suppress {invalidCasts} LegacyElementMixin must be applied to an
     * HTMLElement
     * @override
     */
    queryDistributedElements(selector) {
      const thisEl = /** @type {Element} */ (this);
      const domApi = /** @type {PolymerDomApi} */ (dom(thisEl));
      return domApi.queryDistributedElements(selector);
    }

    /**
     * Returns a list of elements that are the effective children. The effective
     * children list is the same as the element's children except that
     * any `<content>` elements are replaced with the list of elements
     * distributed to the `<content>`.
     *
     * @return {!Array<!Node>} List of effective children.
     * @override
     */
    getEffectiveChildren() {
      let list = this.getEffectiveChildNodes();
      return list.filter(function(/** @type {!Node} */ n) {
        return (n.nodeType === Node.ELEMENT_NODE);
      });
    }

    /**
     * Returns a string of text content that is the concatenation of the
     * text content's of the element's effective childNodes (the elements
     * returned by <a href="#getEffectiveChildNodes>getEffectiveChildNodes</a>.
     *
     * @return {string} List of effective children.
     * @override
     */
    getEffectiveTextContent() {
      let cn = this.getEffectiveChildNodes();
      let tc = [];
      for (let i=0, c; (c = cn[i]); i++) {
        if (c.nodeType !== Node.COMMENT_NODE) {
          tc.push(c.textContent);
        }
      }
      return tc.join('');
    }

    /**
     * Returns the first effective childNode within this element that
     * match `selector`. These can be dom child nodes or elements distributed
     * to children that are insertion points.
     * @param {string} selector Selector to run.
     * @return {Node} First effective child node that matches selector.
     * @override
     */
    queryEffectiveChildren(selector) {
      let e$ = this.queryDistributedElements(selector);
      return e$ && e$[0];
    }

    /**
     * Returns a list of effective childNodes within this element that
     * match `selector`. These can be dom child nodes or elements distributed
     * to children that are insertion points.
     * @param {string} selector Selector to run.
     * @return {!Array<!Node>} List of effective child nodes that match
     *     selector.
     * @override
     */
    queryAllEffectiveChildren(selector) {
      return this.queryDistributedElements(selector);
    }

    /**
     * Returns a list of nodes distributed to this element's `<slot>`.
     *
     * If this element contains more than one `<slot>` in its local DOM,
     * an optional selector may be passed to choose the desired content.
     *
     * @param {string=} slctr CSS selector to choose the desired
     *   `<slot>`.  Defaults to `content`.
     * @return {!Array<!Node>} List of distributed nodes for the `<slot>`.
     * @override
     */
    getContentChildNodes(slctr) {
      // Note, no need to `wrap` this because root is always
      let content = this.root.querySelector(slctr || 'slot');
      return content ?
          /** @type {PolymerDomApi} */ (dom(content)).getDistributedNodes() :
          [];
    }

    /**
     * Returns a list of element children distributed to this element's
     * `<slot>`.
     *
     * If this element contains more than one `<slot>` in its
     * local DOM, an optional selector may be passed to choose the desired
     * content.  This method differs from `getContentChildNodes` in that only
     * elements are returned.
     *
     * @param {string=} slctr CSS selector to choose the desired
     *   `<content>`.  Defaults to `content`.
     * @return {!Array<!HTMLElement>} List of distributed nodes for the
     *   `<slot>`.
     * @suppress {invalidCasts}
     * @override
     */
    getContentChildren(slctr) {
      let children = /** @type {!Array<!HTMLElement>} */(this.getContentChildNodes(slctr).filter(function(n) {
        return (n.nodeType === Node.ELEMENT_NODE);
      }));
      return children;
    }

    /**
     * Checks whether an element is in this element's light DOM tree.
     *
     * @param {?Node} node The element to be checked.
     * @return {boolean} true if node is in this element's light DOM tree.
     * @suppress {invalidCasts} LegacyElementMixin must be applied to an
     * HTMLElement
     * @override
     */
    isLightDescendant(node) {
      const thisNode = /** @type {Node} */ (this);
      return thisNode !== node && wrap$1(thisNode).contains(node) &&
        wrap$1(thisNode).getRootNode() === wrap$1(node).getRootNode();
    }

    /**
     * Checks whether an element is in this element's local DOM tree.
     *
     * @param {!Element} node The element to be checked.
     * @return {boolean} true if node is in this element's local DOM tree.
     * @override
     */
    isLocalDescendant(node) {
      return this.root === wrap$1(node).getRootNode();
    }

    /**
     * No-op for backwards compatibility. This should now be handled by
     * ShadyCss library.
     * @param  {!Element} container Container element to scope
     * @param  {boolean=} shouldObserve if true, start a mutation observer for added nodes to the container
     * @return {?MutationObserver} Returns a new MutationObserver on `container` if `shouldObserve` is true.
     * @override
     */
    scopeSubtree(container, shouldObserve = false) {
      return scopeSubtree(container, shouldObserve);
    }

    /**
     * Returns the computed style value for the given property.
     * @param {string} property The css property name.
     * @return {string} Returns the computed css property value for the given
     * `property`.
     * @suppress {invalidCasts} LegacyElementMixin must be applied to an
     *     HTMLElement
     * @override
     */
    getComputedStyleValue(property) {
      return styleInterface.getComputedStyleValue(/** @type {!Element} */(this), property);
    }

    // debounce

    /**
     * Call `debounce` to collapse multiple requests for a named task into
     * one invocation which is made after the wait time has elapsed with
     * no new request.  If no wait time is given, the callback will be called
     * at microtask timing (guaranteed before paint).
     *
     *     debouncedClickAction(e) {
     *       // will not call `processClick` more than once per 100ms
     *       this.debounce('click', function() {
     *        this.processClick();
     *       } 100);
     *     }
     *
     * @param {string} jobName String to identify the debounce job.
     * @param {function():void} callback Function that is called (with `this`
     *   context) when the wait time elapses.
     * @param {number=} wait Optional wait time in milliseconds (ms) after the
     *   last signal that must elapse before invoking `callback`
     * @return {!Object} Returns a debouncer object on which exists the
     * following methods: `isActive()` returns true if the debouncer is
     * active; `cancel()` cancels the debouncer if it is active;
     * `flush()` immediately invokes the debounced callback if the debouncer
     * is active.
     * @override
     */
    debounce(jobName, callback, wait) {
      this._debouncers = this._debouncers || {};
      return this._debouncers[jobName] = Debouncer.debounce(
            this._debouncers[jobName]
          , wait > 0 ? timeOut.after(wait) : microTask
          , callback.bind(this));
    }

    /**
     * Returns whether a named debouncer is active.
     *
     * @param {string} jobName The name of the debouncer started with `debounce`
     * @return {boolean} Whether the debouncer is active (has not yet fired).
     * @override
     */
    isDebouncerActive(jobName) {
      this._debouncers = this._debouncers || {};
      let debouncer = this._debouncers[jobName];
      return !!(debouncer && debouncer.isActive());
    }

    /**
     * Immediately calls the debouncer `callback` and inactivates it.
     *
     * @param {string} jobName The name of the debouncer started with `debounce`
     * @return {void}
     * @override
     */
    flushDebouncer(jobName) {
      this._debouncers = this._debouncers || {};
      let debouncer = this._debouncers[jobName];
      if (debouncer) {
        debouncer.flush();
      }
    }

    /**
     * Cancels an active debouncer.  The `callback` will not be called.
     *
     * @param {string} jobName The name of the debouncer started with `debounce`
     * @return {void}
     * @override
     */
    cancelDebouncer(jobName) {
      this._debouncers = this._debouncers || {};
      let debouncer = this._debouncers[jobName];
      if (debouncer) {
        debouncer.cancel();
      }
    }

    /**
     * Runs a callback function asynchronously.
     *
     * By default (if no waitTime is specified), async callbacks are run at
     * microtask timing, which will occur before paint.
     *
     * @param {!Function} callback The callback function to run, bound to
     *     `this`.
     * @param {number=} waitTime Time to wait before calling the
     *   `callback`.  If unspecified or 0, the callback will be run at microtask
     *   timing (before paint).
     * @return {number} Handle that may be used to cancel the async job.
     * @override
     */
    async(callback, waitTime) {
      return waitTime > 0 ? timeOut.run(callback.bind(this), waitTime) :
          ~microTask.run(callback.bind(this));
    }

    /**
     * Cancels an async operation started with `async`.
     *
     * @param {number} handle Handle returned from original `async` call to
     *   cancel.
     * @return {void}
     * @override
     */
    cancelAsync(handle) {
      handle < 0 ? microTask.cancel(~handle) :
          timeOut.cancel(handle);
    }

    // other

    /**
     * Convenience method for creating an element and configuring it.
     *
     * @param {string} tag HTML element tag to create.
     * @param {Object=} props Object of properties to configure on the
     *    instance.
     * @return {!Element} Newly created and configured element.
     * @override
     */
    create(tag, props) {
      let elt = document.createElement(tag);
      if (props) {
        if (elt.setProperties) {
          elt.setProperties(props);
        } else {
          for (let n in props) {
            elt[n] = props[n];
          }
        }
      }
      return elt;
    }

    /**
     * Polyfill for Element.prototype.matches, which is sometimes still
     * prefixed.
     *
     * @param {string} selector Selector to test.
     * @param {!Element=} node Element to test the selector against.
     * @return {boolean} Whether the element matches the selector.
     * @override
     */
    elementMatches(selector, node) {
      return matchesSelector( (node || this), selector);
    }

    /**
     * Toggles an HTML attribute on or off.
     *
     * @param {string} name HTML attribute name
     * @param {boolean=} bool Boolean to force the attribute on or off.
     *    When unspecified, the state of the attribute will be reversed.
     * @return {boolean} true if the attribute now exists
     * @override
     */
    toggleAttribute(name, bool) {
      let node = /** @type {Element} */(this);
      if (arguments.length === 3) {
        node = /** @type {Element} */(arguments[2]);
      }
      if (arguments.length == 1) {
        bool = !node.hasAttribute(name);
      }
      if (bool) {
        wrap$1(node).setAttribute(name, '');
        return true;
      } else {
        wrap$1(node).removeAttribute(name);
        return false;
      }
    }


    /**
     * Toggles a CSS class on or off.
     *
     * @param {string} name CSS class name
     * @param {boolean=} bool Boolean to force the class on or off.
     *    When unspecified, the state of the class will be reversed.
     * @param {Element=} node Node to target.  Defaults to `this`.
     * @return {void}
     * @override
     */
    toggleClass(name, bool, node) {
      node = /** @type {Element} */ (node || this);
      if (arguments.length == 1) {
        bool = !node.classList.contains(name);
      }
      if (bool) {
        node.classList.add(name);
      } else {
        node.classList.remove(name);
      }
    }

    /**
     * Cross-platform helper for setting an element's CSS `transform` property.
     *
     * @param {string} transformText Transform setting.
     * @param {Element=} node Element to apply the transform to.
     * Defaults to `this`
     * @return {void}
     * @override
     */
    transform(transformText, node) {
      node = /** @type {Element} */ (node || this);
      node.style.webkitTransform = transformText;
      node.style.transform = transformText;
    }

    /**
     * Cross-platform helper for setting an element's CSS `translate3d`
     * property.
     *
     * @param {number|string} x X offset.
     * @param {number|string} y Y offset.
     * @param {number|string} z Z offset.
     * @param {Element=} node Element to apply the transform to.
     * Defaults to `this`.
     * @return {void}
     * @override
     */
    translate3d(x, y, z, node) {
      node = /** @type {Element} */ (node || this);
      this.transform('translate3d(' + x + ',' + y + ',' + z + ')', node);
    }

    /**
     * Removes an item from an array, if it exists.
     *
     * If the array is specified by path, a change notification is
     * generated, so that observers, data bindings and computed
     * properties watching that path can update.
     *
     * If the array is passed directly, **no change
     * notification is generated**.
     *
     * @param {string | !Array<number|string>} arrayOrPath Path to array from
     *     which to remove the item
     *   (or the array itself).
     * @param {*} item Item to remove.
     * @return {Array} Array containing item removed.
     * @override
     */
    arrayDelete(arrayOrPath, item) {
      let index;
      if (Array.isArray(arrayOrPath)) {
        index = arrayOrPath.indexOf(item);
        if (index >= 0) {
          return arrayOrPath.splice(index, 1);
        }
      } else {
        let arr = get(this, arrayOrPath);
        index = arr.indexOf(item);
        if (index >= 0) {
          return this.splice(arrayOrPath, index, 1);
        }
      }
      return null;
    }

    // logging

    /**
     * Facades `console.log`/`warn`/`error` as override point.
     *
     * @param {string} level One of 'log', 'warn', 'error'
     * @param {Array} args Array of strings or objects to log
     * @return {void}
     * @override
     */
    _logger(level, args) {
      // accept ['foo', 'bar'] and [['foo', 'bar']]
      if (Array.isArray(args) && args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }
      switch(level) {
        case 'log':
        case 'warn':
        case 'error':
          console[level](...args);
      }
    }

    /**
     * Facades `console.log` as an override point.
     *
     * @param {...*} args Array of strings or objects to log
     * @return {void}
     * @override
     */
    _log(...args) {
      this._logger('log', args);
    }

    /**
     * Facades `console.warn` as an override point.
     *
     * @param {...*} args Array of strings or objects to log
     * @return {void}
     * @override
     */
    _warn(...args) {
      this._logger('warn', args);
    }

    /**
     * Facades `console.error` as an override point.
     *
     * @param {...*} args Array of strings or objects to log
     * @return {void}
     * @override
     */
    _error(...args) {
      this._logger('error', args);
    }

    /**
     * Formats a message using the element type an a method name.
     *
     * @param {string} methodName Method name to associate with message
     * @param {...*} args Array of strings or objects to log
     * @return {!Array} Array with formatting information for `console`
     *   logging.
     * @override
     */
    _logf(methodName, ...args) {
      return ['[%s::%s]', this.is, methodName, ...args];
    }

  }

  LegacyElement.prototype.is = '';

  return LegacyElement;
});

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const lifecycleProps = {
  attached: true,
  detached: true,
  ready: true,
  created: true,
  beforeRegister: true,
  registered: true,
  attributeChanged: true,
  listeners: true,
  hostAttributes: true
};

const excludeOnInfo = {
  attached: true,
  detached: true,
  ready: true,
  created: true,
  beforeRegister: true,
  registered: true,
  attributeChanged: true,
  behaviors: true,
  _noAccessors: true
};

const excludeOnBehaviors = Object.assign({
  listeners: true,
  hostAttributes: true,
  properties: true,
  observers: true,
}, excludeOnInfo);

function copyProperties(source, target, excludeProps) {
  const noAccessors = source._noAccessors;
  const propertyNames = Object.getOwnPropertyNames(source);
  for (let i = 0; i < propertyNames.length; i++) {
    let p = propertyNames[i];
    if (p in excludeProps) {
      continue;
    }
    if (noAccessors) {
      target[p] = source[p];
    } else {
      let pd = Object.getOwnPropertyDescriptor(source, p);
      if (pd) {
        // ensure property is configurable so that a later behavior can
        // re-configure it.
        pd.configurable = true;
        Object.defineProperty(target, p, pd);
      }
    }
  }
}

// NOTE:
// 1.x
// Behaviors were mixed in *in reverse order* and de-duped on the fly.
// The rule was that behavior properties were copied onto the element
// prototype if and only if the property did not already exist.
// Given: Polymer{ behaviors: [A, B, C, A, B]}, property copy order was:
// (1), B, (2), A, (3) C. This means prototype properties win over
// B properties win over A win over C. This mirrors what would happen
// with inheritance if element extended B extended A extended C.
//
// Again given, Polymer{ behaviors: [A, B, C, A, B]}, the resulting
// `behaviors` array was [C, A, B].
// Behavior lifecycle methods were called in behavior array order
// followed by the element, e.g. (1) C.created, (2) A.created,
// (3) B.created, (4) element.created. There was no support for
// super, and "super-behavior" methods were callable only by name).
//
// 2.x
// Behaviors are made into proper mixins which live in the
// element's prototype chain. Behaviors are placed in the element prototype
// eldest to youngest and de-duped youngest to oldest:
// So, first [A, B, C, A, B] becomes [C, A, B] then,
// the element prototype becomes (oldest) (1) PolymerElement, (2) class(C),
// (3) class(A), (4) class(B), (5) class(Polymer({...})).
// Result:
// This means element properties win over B properties win over A win
// over C. (same as 1.x)
// If lifecycle is called (super then me), order is
// (1) C.created, (2) A.created, (3) B.created, (4) element.created
// (again same as 1.x)
function applyBehaviors(proto, behaviors, lifecycle) {
  for (let i=0; i<behaviors.length; i++) {
    applyInfo(proto, behaviors[i], lifecycle, excludeOnBehaviors);
  }
}

function applyInfo(proto, info, lifecycle, excludeProps) {
  copyProperties(info, proto, excludeProps);
  for (let p in lifecycleProps) {
    if (info[p]) {
      lifecycle[p] = lifecycle[p] || [];
      lifecycle[p].push(info[p]);
    }
  }
}

/**
 * @param {Array} behaviors List of behaviors to flatten.
 * @param {Array=} list Target list to flatten behaviors into.
 * @param {Array=} exclude List of behaviors to exclude from the list.
 * @return {!Array} Returns the list of flattened behaviors.
 */
function flattenBehaviors(behaviors, list, exclude) {
  list = list || [];
  for (let i=behaviors.length-1; i >= 0; i--) {
    let b = behaviors[i];
    if (b) {
      if (Array.isArray(b)) {
        flattenBehaviors(b, list);
      } else {
        // dedup
        if (list.indexOf(b) < 0 && (!exclude || exclude.indexOf(b) < 0)) {
          list.unshift(b);
        }
      }
    } else {
      console.warn('behavior is null, check for missing or 404 import');
    }
  }
  return list;
}

/**
 * Copies property descriptors from source to target, overwriting all fields
 * of any previous descriptor for a property *except* for `value`, which is
 * merged in from the target if it does not exist on the source.
 *
 * @param {*} target Target properties object
 * @param {*} source Source properties object
 */
function mergeProperties(target, source) {
  for (const p in source) {
    const targetInfo = target[p];
    const sourceInfo = source[p];
    if (!('value' in sourceInfo) && targetInfo && ('value' in targetInfo)) {
      target[p] = Object.assign({value: targetInfo.value}, sourceInfo);
    } else {
      target[p] = sourceInfo;
    }
  }
}

const LegacyElement = LegacyElementMixin(HTMLElement);

/* Note about construction and extension of legacy classes.
  [Changed in Q4 2018 to optimize performance.]

  When calling `Polymer` or `mixinBehaviors`, the generated class below is
  made. The list of behaviors was previously made into one generated class per
  behavior, but this is no longer the case as behaviors are now called
  manually. Note, there may *still* be multiple generated classes in the
  element's prototype chain if extension is used with `mixinBehaviors`.

  The generated class is directly tied to the info object and behaviors
  used to create it. That list of behaviors is filtered so it's only the
  behaviors not active on the superclass. In order to call through to the
  entire list of lifecycle methods, it's important to call `super`.

  The element's `properties` and `observers` are controlled via the finalization
  mechanism provided by `PropertiesMixin`. `Properties` and `observers` are
  collected by manually traversing the prototype chain and merging.

  To limit changes, the `_registered` method is called via `_initializeProperties`
  and not `_finalizeClass`.

*/
/**
 * @param {!PolymerInit} info Polymer info object
 * @param {function(new:HTMLElement)} Base base class to extend with info object
 * @param {Object=} behaviors behaviors to copy into the element
 * @return {function(new:HTMLElement)} Generated class
 * @suppress {checkTypes}
 * @private
 */
function GenerateClassFromInfo(info, Base, behaviors) {

  // manages behavior and lifecycle processing (filled in after class definition)
  let behaviorList;
  const lifecycle = {};

  /** @private */
  class PolymerGenerated extends Base {

    // explicitly not calling super._finalizeClass
    /** @nocollapse */
    static _finalizeClass() {
      // if calling via a subclass that hasn't been generated, pass through to super
      if (!this.hasOwnProperty(JSCompiler_renameProperty('generatedFrom', this))) {
        // TODO(https://github.com/google/closure-compiler/issues/3240):
        //     Change back to just super.methodCall()
        Base._finalizeClass.call(this);
      } else {
        // interleave properties and observers per behavior and `info`
        if (behaviorList) {
          for (let i=0, b; i < behaviorList.length; i++) {
            b = behaviorList[i];
            if (b.properties) {
              this.createProperties(b.properties);
            }
            if (b.observers) {
              this.createObservers(b.observers, b.properties);
            }
          }
        }
        if (info.properties) {
          this.createProperties(info.properties);
        }
        if (info.observers) {
          this.createObservers(info.observers, info.properties);
        }
        // make sure to prepare the element template
        this._prepareTemplate();
      }
    }

    /** @nocollapse */
    static get properties() {
      const properties = {};
      if (behaviorList) {
        for (let i=0; i < behaviorList.length; i++) {
          mergeProperties(properties, behaviorList[i].properties);
        }
      }
      mergeProperties(properties, info.properties);
      return properties;
    }

    /** @nocollapse */
    static get observers() {
      let observers = [];
      if (behaviorList) {
        for (let i=0, b; i < behaviorList.length; i++) {
          b = behaviorList[i];
          if (b.observers) {
            observers = observers.concat(b.observers);
          }
        }
      }
      if (info.observers) {
        observers = observers.concat(info.observers);
      }
      return observers;
    }

    /**
     * @return {void}
     */
    created() {
      super.created();
      const list = lifecycle.created;
      if (list) {
        for (let i=0; i < list.length; i++) {
          list[i].call(this);
        }
      }
    }

    /**
     * @return {void}
     */
    _registered() {
      /* NOTE: `beforeRegister` is called here for bc, but the behavior
        is different than in 1.x. In 1.0, the method was called *after*
        mixing prototypes together but *before* processing of meta-objects.
        However, dynamic effects can still be set here and can be done either
        in `beforeRegister` or `registered`. It is no longer possible to set
        `is` in `beforeRegister` as you could in 1.x.
      */
      // only proceed if the generated class' prototype has not been registered.
      const generatedProto = PolymerGenerated.prototype;
      if (!generatedProto.hasOwnProperty(JSCompiler_renameProperty('__hasRegisterFinished', generatedProto))) {
        generatedProto.__hasRegisterFinished = true;
        // ensure superclass is registered first.
        super._registered();
        // copy properties onto the generated class lazily if we're optimizing,
        if (legacyOptimizations) {
          copyPropertiesToProto(generatedProto);
        }
        // make sure legacy lifecycle is called on the *element*'s prototype
        // and not the generated class prototype; if the element has been
        // extended, these are *not* the same.
        const proto = Object.getPrototypeOf(this);
        let list = lifecycle.beforeRegister;
        if (list) {
          for (let i=0; i < list.length; i++) {
            list[i].call(proto);
          }
        }
        list = lifecycle.registered;
        if (list) {
          for (let i=0; i < list.length; i++) {
            list[i].call(proto);
          }
        }
      }
    }

    /**
     * @return {void}
     */
    _applyListeners() {
      super._applyListeners();
      const list = lifecycle.listeners;
      if (list) {
        for (let i=0; i < list.length; i++) {
          const listeners = list[i];
          if (listeners) {
            for (let l in listeners) {
              this._addMethodEventListenerToNode(this, l, listeners[l]);
            }
          }
        }
      }
    }

    // note: exception to "super then me" rule;
    // do work before calling super so that super attributes
    // only apply if not already set.
    /**
     * @return {void}
     */
    _ensureAttributes() {
      const list = lifecycle.hostAttributes;
      if (list) {
        for (let i=list.length-1; i >= 0; i--) {
          const hostAttributes = list[i];
          for (let a in hostAttributes) {
              this._ensureAttribute(a, hostAttributes[a]);
            }
        }
      }
      super._ensureAttributes();
    }

    /**
     * @return {void}
     */
    ready() {
      super.ready();
      let list = lifecycle.ready;
      if (list) {
        for (let i=0; i < list.length; i++) {
          list[i].call(this);
        }
      }
    }

    /**
     * @return {void}
     */
    attached() {
      super.attached();
      let list = lifecycle.attached;
      if (list) {
        for (let i=0; i < list.length; i++) {
          list[i].call(this);
        }
      }
    }

    /**
     * @return {void}
     */
    detached() {
      super.detached();
      let list = lifecycle.detached;
      if (list) {
        for (let i=0; i < list.length; i++) {
          list[i].call(this);
        }
      }
    }

    /**
     * Implements native Custom Elements `attributeChangedCallback` to
     * set an attribute value to a property via `_attributeToProperty`.
     *
     * @param {string} name Name of attribute that changed
     * @param {?string} old Old attribute value
     * @param {?string} value New attribute value
     * @return {void}
     */
    attributeChanged(name, old, value) {
      super.attributeChanged();
      let list = lifecycle.attributeChanged;
      if (list) {
        for (let i=0; i < list.length; i++) {
          list[i].call(this, name, old, value);
        }
      }
    }
  }

  // apply behaviors, note actual copying is done lazily at first instance creation
  if (behaviors) {
    // NOTE: ensure the behavior is extending a class with
    // legacy element api. This is necessary since behaviors expect to be able
    // to access 1.x legacy api.
    if (!Array.isArray(behaviors)) {
      behaviors = [behaviors];
    }
    let superBehaviors = Base.prototype.behaviors;
    // get flattened, deduped list of behaviors *not* already on super class
    behaviorList = flattenBehaviors(behaviors, null, superBehaviors);
    PolymerGenerated.prototype.behaviors = superBehaviors ?
      superBehaviors.concat(behaviors) : behaviorList;
  }

  const copyPropertiesToProto = (proto) => {
    if (behaviorList) {
      applyBehaviors(proto, behaviorList, lifecycle);
    }
    applyInfo(proto, info, lifecycle, excludeOnInfo);
  };

  // copy properties if we're not optimizing
  if (!legacyOptimizations) {
    copyPropertiesToProto(PolymerGenerated.prototype);
  }

  PolymerGenerated.generatedFrom = info;

  return PolymerGenerated;
}

/**
 * Generates a class that extends `LegacyElement` based on the
 * provided info object.  Metadata objects on the `info` object
 * (`properties`, `observers`, `listeners`, `behaviors`, `is`) are used
 * for Polymer's meta-programming systems, and any functions are copied
 * to the generated class.
 *
 * Valid "metadata" values are as follows:
 *
 * `is`: String providing the tag name to register the element under. In
 * addition, if a `dom-module` with the same id exists, the first template
 * in that `dom-module` will be stamped into the shadow root of this element,
 * with support for declarative event listeners (`on-...`), Polymer data
 * bindings (`[[...]]` and `{{...}}`), and id-based node finding into
 * `this.$`.
 *
 * `properties`: Object describing property-related metadata used by Polymer
 * features (key: property names, value: object containing property metadata).
 * Valid keys in per-property metadata include:
 * - `type` (String|Number|Object|Array|...): Used by
 *   `attributeChangedCallback` to determine how string-based attributes
 *   are deserialized to JavaScript property values.
 * - `notify` (boolean): Causes a change in the property to fire a
 *   non-bubbling event called `<property>-changed`. Elements that have
 *   enabled two-way binding to the property use this event to observe changes.
 * - `readOnly` (boolean): Creates a getter for the property, but no setter.
 *   To set a read-only property, use the private setter method
 *   `_setProperty(property, value)`.
 * - `observer` (string): Observer method name that will be called when
 *   the property changes. The arguments of the method are
 *   `(value, previousValue)`.
 * - `computed` (string): String describing method and dependent properties
 *   for computing the value of this property (e.g. `'computeFoo(bar, zot)'`).
 *   Computed properties are read-only by default and can only be changed
 *   via the return value of the computing method.
 *
 * `observers`: Array of strings describing multi-property observer methods
 *  and their dependent properties (e.g. `'observeABC(a, b, c)'`).
 *
 * `listeners`: Object describing event listeners to be added to each
 *  instance of this element (key: event name, value: method name).
 *
 * `behaviors`: Array of additional `info` objects containing metadata
 * and callbacks in the same format as the `info` object here which are
 * merged into this element.
 *
 * `hostAttributes`: Object listing attributes to be applied to the host
 *  once created (key: attribute name, value: attribute value).  Values
 *  are serialized based on the type of the value.  Host attributes should
 *  generally be limited to attributes such as `tabIndex` and `aria-...`.
 *  Attributes in `hostAttributes` are only applied if a user-supplied
 *  attribute is not already present (attributes in markup override
 *  `hostAttributes`).
 *
 * In addition, the following Polymer-specific callbacks may be provided:
 * - `registered`: called after first instance of this element,
 * - `created`: called during `constructor`
 * - `attached`: called during `connectedCallback`
 * - `detached`: called during `disconnectedCallback`
 * - `ready`: called before first `attached`, after all properties of
 *   this element have been propagated to its template and all observers
 *   have run
 *
 * @param {!PolymerInit} info Object containing Polymer metadata and functions
 *   to become class methods.
 * @template T
 * @param {function(T):T} mixin Optional mixin to apply to legacy base class
 *   before extending with Polymer metaprogramming.
 * @return {function(new:HTMLElement)} Generated class
 */
const Class = function(info, mixin) {
  if (!info) {
    console.warn('Polymer.Class requires `info` argument');
  }
  let klass = mixin ? mixin(LegacyElement) :
      LegacyElement;
  klass = GenerateClassFromInfo(info, klass, info.behaviors);
  // decorate klass with registration info
  klass.is = klass.prototype.is = info.is;
  return klass;
};

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Legacy class factory and registration helper for defining Polymer
 * elements.
 *
 * This method is equivalent to
 *
 *     import {Class} from '@polymer/polymer/lib/legacy/class.js';
 *     customElements.define(info.is, Class(info));
 *
 * See `Class` for details on valid legacy metadata format for `info`.
 *
 * @global
 * @override
 * @function
 * @param {!PolymerInit} info Object containing Polymer metadata and functions
 *   to become class methods.
 * @return {function(new: HTMLElement)} Generated class
 * @suppress {duplicate, invalidCasts, checkTypes}
 */
const Polymer = function(info) {
  // if input is a `class` (aka a function with a prototype), use the prototype
  // remember that the `constructor` will never be called
  let klass;
  if (typeof info === 'function') {
    klass = info;
  } else {
    klass = Polymer.Class(info);
  }
  // Copy opt out for `legacyNoObservedAttributes` from info object to class.
  if (info._legacyForceObservedAttributes) {
    klass.prototype._legacyForceObservedAttributes = info._legacyForceObservedAttributes;
  }
  customElements.define(klass.is, /** @type {!HTMLElement} */(klass));
  return klass;
};

Polymer.Class = Class;

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// Common implementation for mixin & behavior
function mutablePropertyChange(inst, property, value, old, mutableData) {
  let isObject;
  if (mutableData) {
    isObject = (typeof value === 'object' && value !== null);
    // Pull `old` for Objects from temp cache, but treat `null` as a primitive
    if (isObject) {
      old = inst.__dataTemp[property];
    }
  }
  // Strict equality check, but return false for NaN===NaN
  let shouldChange = (old !== value && (old === old || value === value));
  // Objects are stored in temporary cache (cleared at end of
  // turn), which is used for dirty-checking
  if (isObject && shouldChange) {
    inst.__dataTemp[property] = value;
  }
  return shouldChange;
}

/**
 * Element class mixin to skip strict dirty-checking for objects and arrays
 * (always consider them to be "dirty"), for use on elements utilizing
 * `PropertyEffects`
 *
 * By default, `PropertyEffects` performs strict dirty checking on
 * objects, which means that any deep modifications to an object or array will
 * not be propagated unless "immutable" data patterns are used (i.e. all object
 * references from the root to the mutation were changed).
 *
 * Polymer also provides a proprietary data mutation and path notification API
 * (e.g. `notifyPath`, `set`, and array mutation API's) that allow efficient
 * mutation and notification of deep changes in an object graph to all elements
 * bound to the same object graph.
 *
 * In cases where neither immutable patterns nor the data mutation API can be
 * used, applying this mixin will cause Polymer to skip dirty checking for
 * objects and arrays (always consider them to be "dirty").  This allows a
 * user to make a deep modification to a bound object graph, and then either
 * simply re-set the object (e.g. `this.items = this.items`) or call `notifyPath`
 * (e.g. `this.notifyPath('items')`) to update the tree.  Note that all
 * elements that wish to be updated based on deep mutations must apply this
 * mixin or otherwise skip strict dirty checking for objects/arrays.
 * Specifically, any elements in the binding tree between the source of a
 * mutation and the consumption of it must apply this mixin or enable the
 * `OptionalMutableData` mixin.
 *
 * In order to make the dirty check strategy configurable, see
 * `OptionalMutableData`.
 *
 * Note, the performance characteristics of propagating large object graphs
 * will be worse as opposed to using strict dirty checking with immutable
 * patterns or Polymer's path notification API.
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin to skip strict dirty-checking for objects
 *   and arrays
 * @template T
 * @param {function(new:T)} superClass Class to apply mixin to.
 * @return {function(new:T)} superClass with mixin applied.
 */
const MutableData = dedupingMixin(superClass => {

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_MutableData}
   */
  class MutableData extends superClass {
    /**
     * Overrides `PropertyEffects` to provide option for skipping
     * strict equality checking for Objects and Arrays.
     *
     * This method pulls the value to dirty check against from the `__dataTemp`
     * cache (rather than the normal `__data` cache) for Objects.  Since the temp
     * cache is cleared at the end of a turn, this implementation allows
     * side-effects of deep object changes to be processed by re-setting the
     * same object (using the temp cache as an in-turn backstop to prevent
     * cycles due to 2-way notification).
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     * @protected
     */
    _shouldPropertyChange(property, value, old) {
      return mutablePropertyChange(this, property, value, old, true);
    }

  }

  return MutableData;

});

/**
 * Element class mixin to add the optional ability to skip strict
 * dirty-checking for objects and arrays (always consider them to be
 * "dirty") by setting a `mutable-data` attribute on an element instance.
 *
 * By default, `PropertyEffects` performs strict dirty checking on
 * objects, which means that any deep modifications to an object or array will
 * not be propagated unless "immutable" data patterns are used (i.e. all object
 * references from the root to the mutation were changed).
 *
 * Polymer also provides a proprietary data mutation and path notification API
 * (e.g. `notifyPath`, `set`, and array mutation API's) that allow efficient
 * mutation and notification of deep changes in an object graph to all elements
 * bound to the same object graph.
 *
 * In cases where neither immutable patterns nor the data mutation API can be
 * used, applying this mixin will allow Polymer to skip dirty checking for
 * objects and arrays (always consider them to be "dirty").  This allows a
 * user to make a deep modification to a bound object graph, and then either
 * simply re-set the object (e.g. `this.items = this.items`) or call `notifyPath`
 * (e.g. `this.notifyPath('items')`) to update the tree.  Note that all
 * elements that wish to be updated based on deep mutations must apply this
 * mixin or otherwise skip strict dirty checking for objects/arrays.
 * Specifically, any elements in the binding tree between the source of a
 * mutation and the consumption of it must enable this mixin or apply the
 * `MutableData` mixin.
 *
 * While this mixin adds the ability to forgo Object/Array dirty checking,
 * the `mutableData` flag defaults to false and must be set on the instance.
 *
 * Note, the performance characteristics of propagating large object graphs
 * will be worse by relying on `mutableData: true` as opposed to using
 * strict dirty checking with immutable patterns or Polymer's path notification
 * API.
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin to optionally skip strict dirty-checking
 *   for objects and arrays
 */
const OptionalMutableData = dedupingMixin(superClass => {

  /**
   * @mixinClass
   * @polymer
   * @implements {Polymer_OptionalMutableData}
   */
  class OptionalMutableData extends superClass {

    /** @nocollapse */
    static get properties() {
      return {
        /**
         * Instance-level flag for configuring the dirty-checking strategy
         * for this element.  When true, Objects and Arrays will skip dirty
         * checking, otherwise strict equality checking will be used.
         */
        mutableData: Boolean
      };
    }

    /**
     * Overrides `PropertyEffects` to provide option for skipping
     * strict equality checking for Objects and Arrays.
     *
     * When `this.mutableData` is true on this instance, this method
     * pulls the value to dirty check against from the `__dataTemp` cache
     * (rather than the normal `__data` cache) for Objects.  Since the temp
     * cache is cleared at the end of a turn, this implementation allows
     * side-effects of deep object changes to be processed by re-setting the
     * same object (using the temp cache as an in-turn backstop to prevent
     * cycles due to 2-way notification).
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     * @protected
     */
    _shouldPropertyChange(property, value, old) {
      return mutablePropertyChange(this, property, value, old, this.mutableData);
    }
  }

  return OptionalMutableData;

});

// Export for use by legacy behavior
MutableData._mutablePropertyChange = mutablePropertyChange;

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// Base class for HTMLTemplateElement extension that has property effects
// machinery for propagating host properties to children. This is an ES5
// class only because Babel (incorrectly) requires super() in the class
// constructor even though no `this` is used and it returns an instance.
let newInstance = null;

/**
 * @constructor
 * @extends {HTMLTemplateElement}
 * @private
 */
function HTMLTemplateElementExtension() { return newInstance; }
HTMLTemplateElementExtension.prototype = Object.create(HTMLTemplateElement.prototype, {
  constructor: {
    value: HTMLTemplateElementExtension,
    writable: true
  }
});

/**
 * @constructor
 * @implements {Polymer_PropertyEffects}
 * @extends {HTMLTemplateElementExtension}
 * @private
 */
const DataTemplate = PropertyEffects(HTMLTemplateElementExtension);

/**
 * @constructor
 * @implements {Polymer_MutableData}
 * @extends {DataTemplate}
 * @private
 */
const MutableDataTemplate = MutableData(DataTemplate);

// Applies a DataTemplate subclass to a <template> instance
function upgradeTemplate(template, constructor) {
  newInstance = template;
  Object.setPrototypeOf(template, constructor.prototype);
  new constructor();
  newInstance = null;
}

/**
 * Base class for TemplateInstance.
 * @constructor
 * @extends {HTMLElement}
 * @implements {Polymer_PropertyEffects}
 * @private
 */
const templateInstanceBase = PropertyEffects(class {});

function showHideChildren(hide, children) {
  for (let i=0; i<children.length; i++) {
    let n = children[i];
    // Ignore non-changes
    if (Boolean(hide) != Boolean(n.__hideTemplateChildren__)) {
      // clear and restore text
      if (n.nodeType === Node.TEXT_NODE) {
        if (hide) {
          n.__polymerTextContent__ = n.textContent;
          n.textContent = '';
        } else {
          n.textContent = n.__polymerTextContent__;
        }
      // remove and replace slot
      } else if (n.localName === 'slot') {
        if (hide) {
          n.__polymerReplaced__ = document.createComment('hidden-slot');
          wrap$1(wrap$1(n).parentNode).replaceChild(n.__polymerReplaced__, n);
        } else {
          const replace = n.__polymerReplaced__;
          if (replace) {
            wrap$1(wrap$1(replace).parentNode).replaceChild(n, replace);
          }
        }
      }
      // hide and show nodes
      else if (n.style) {
        if (hide) {
          n.__polymerDisplay__ = n.style.display;
          n.style.display = 'none';
        } else {
          n.style.display = n.__polymerDisplay__;
        }
      }
    }
    n.__hideTemplateChildren__ = hide;
    if (n._showHideChildren) {
      n._showHideChildren(hide);
    }
  }
}

/**
 * @polymer
 * @customElement
 * @appliesMixin PropertyEffects
 * @unrestricted
 */
class TemplateInstanceBase extends templateInstanceBase {
  constructor(props) {
    super();
    this._configureProperties(props);
    /** @type {!StampedTemplate} */
    this.root = this._stampTemplate(this.__dataHost);
    // Save list of stamped children
    let children = [];
    /** @suppress {invalidCasts} */
    this.children = /** @type {!NodeList} */ (children);
    // Polymer 1.x did not use `Polymer.dom` here so not bothering.
    for (let n = this.root.firstChild; n; n=n.nextSibling) {
      children.push(n);
      n.__templatizeInstance = this;
    }
    if (this.__templatizeOwner &&
      this.__templatizeOwner.__hideTemplateChildren__) {
      this._showHideChildren(true);
    }
    // Flush props only when props are passed if instance props exist
    // or when there isn't instance props.
    let options = this.__templatizeOptions;
    if ((props && options.instanceProps) || !options.instanceProps) {
      this._enableProperties();
    }
  }
  /**
   * Configure the given `props` by calling `_setPendingProperty`. Also
   * sets any properties stored in `__hostProps`.
   * @private
   * @param {Object} props Object of property name-value pairs to set.
   * @return {void}
   */
  _configureProperties(props) {
    let options = this.__templatizeOptions;
    if (options.forwardHostProp) {
      for (let hprop in this.__hostProps) {
        this._setPendingProperty(hprop, this.__dataHost['_host_' + hprop]);
      }
    }
    // Any instance props passed in the constructor will overwrite host props;
    // normally this would be a user error but we don't specifically filter them
    for (let iprop in props) {
      this._setPendingProperty(iprop, props[iprop]);
    }
  }
  /**
   * Forwards a host property to this instance.  This method should be
   * called on instances from the `options.forwardHostProp` callback
   * to propagate changes of host properties to each instance.
   *
   * Note this method enqueues the change, which are flushed as a batch.
   *
   * @param {string} prop Property or path name
   * @param {*} value Value of the property to forward
   * @return {void}
   */
  forwardHostProp(prop, value) {
    if (this._setPendingPropertyOrPath(prop, value, false, true)) {
      this.__dataHost._enqueueClient(this);
    }
  }

  /**
   * Override point for adding custom or simulated event handling.
   *
   * @override
   * @param {!Node} node Node to add event listener to
   * @param {string} eventName Name of event
   * @param {function(!Event):void} handler Listener function to add
   * @return {void}
   */
  _addEventListenerToNode(node, eventName, handler) {
    if (this._methodHost && this.__templatizeOptions.parentModel) {
      // If this instance should be considered a parent model, decorate
      // events this template instance as `model`
      this._methodHost._addEventListenerToNode(node, eventName, (e) => {
        e.model = this;
        handler(e);
      });
    } else {
      // Otherwise delegate to the template's host (which could be)
      // another template instance
      let templateHost = this.__dataHost.__dataHost;
      if (templateHost) {
        templateHost._addEventListenerToNode(node, eventName, handler);
      }
    }
  }
  /**
   * Shows or hides the template instance top level child elements. For
   * text nodes, `textContent` is removed while "hidden" and replaced when
   * "shown."
   * @param {boolean} hide Set to true to hide the children;
   * set to false to show them.
   * @return {void}
   * @protected
   */
  _showHideChildren(hide) {
    showHideChildren(hide, this.children);
  }
  /**
   * Overrides default property-effects implementation to intercept
   * textContent bindings while children are "hidden" and cache in
   * private storage for later retrieval.
   *
   * @override
   * @param {!Node} node The node to set a property on
   * @param {string} prop The property to set
   * @param {*} value The value to set
   * @return {void}
   * @protected
   */
  _setUnmanagedPropertyToNode(node, prop, value) {
    if (node.__hideTemplateChildren__ &&
        node.nodeType == Node.TEXT_NODE && prop == 'textContent') {
      node.__polymerTextContent__ = value;
    } else {
      super._setUnmanagedPropertyToNode(node, prop, value);
    }
  }
  /**
   * Find the parent model of this template instance.  The parent model
   * is either another templatize instance that had option `parentModel: true`,
   * or else the host element.
   *
   * @return {!Polymer_PropertyEffects} The parent model of this instance
   */
  get parentModel() {
    let model = this.__parentModel;
    if (!model) {
      let options;
      model = this;
      do {
        // A template instance's `__dataHost` is a <template>
        // `model.__dataHost.__dataHost` is the template's host
        model = model.__dataHost.__dataHost;
      } while ((options = model.__templatizeOptions) && !options.parentModel);
      this.__parentModel = model;
    }
    return model;
  }

  /**
   * Stub of HTMLElement's `dispatchEvent`, so that effects that may
   * dispatch events safely no-op.
   *
   * @param {Event} event Event to dispatch
   * @return {boolean} Always true.
   * @override
   */
   dispatchEvent(event) { // eslint-disable-line no-unused-vars
     return true;
  }
}

/** @type {!DataTemplate} */
TemplateInstanceBase.prototype.__dataHost;
/** @type {!TemplatizeOptions} */
TemplateInstanceBase.prototype.__templatizeOptions;
/** @type {!Polymer_PropertyEffects} */
TemplateInstanceBase.prototype._methodHost;
/** @type {!Object} */
TemplateInstanceBase.prototype.__templatizeOwner;
/** @type {!Object} */
TemplateInstanceBase.prototype.__hostProps;

/**
 * @constructor
 * @extends {TemplateInstanceBase}
 * @implements {Polymer_MutableData}
 * @private
 */
const MutableTemplateInstanceBase = MutableData(
    // This cast shouldn't be neccessary, but Closure doesn't understand that
    // TemplateInstanceBase is a constructor function.
    /** @type {function(new:TemplateInstanceBase)} */ (TemplateInstanceBase));

function findMethodHost(template) {
  // Technically this should be the owner of the outermost template.
  // In shadow dom, this is always getRootNode().host, but we can
  // approximate this via cooperation with our dataHost always setting
  // `_methodHost` as long as there were bindings (or id's) on this
  // instance causing it to get a dataHost.
  let templateHost = template.__dataHost;
  return templateHost && templateHost._methodHost || templateHost;
}

/* eslint-disable valid-jsdoc */
/**
 * @suppress {missingProperties} class.prototype is not defined for some reason
 */
function createTemplatizerClass(template, templateInfo, options) {
  /**
   * @constructor
   * @extends {TemplateInstanceBase}
   */
  let templatizerBase = options.mutableData ?
    MutableTemplateInstanceBase : TemplateInstanceBase;

  // Affordance for global mixins onto TemplatizeInstance
  if (templatize.mixin) {
    templatizerBase = templatize.mixin(templatizerBase);
  }

  /**
   * Anonymous class created by the templatize
   * @constructor
   * @private
   */
  let klass = class extends templatizerBase { };
  /** @override */
  klass.prototype.__templatizeOptions = options;
  klass.prototype._bindTemplate(template);
  addNotifyEffects(klass, template, templateInfo, options);
  return klass;
}

/**
 * Adds propagate effects from the template to the template instance for
 * properties that the host binds to the template using the `_host_` prefix.
 *
 * @suppress {missingProperties} class.prototype is not defined for some reason
 */
function addPropagateEffects(target, templateInfo, options, methodHost) {
  let userForwardHostProp = options.forwardHostProp;
  if (userForwardHostProp && templateInfo.hasHostProps) {
    // Under the `removeNestedTemplates` optimization, a custom element like
    // `dom-if` or `dom-repeat` can itself be treated as the "template"; this
    // flag is used to switch between upgrading a `<template>` to be a property
    // effects client vs. adding the effects directly to the custom element
    const isTemplate = target.localName == 'template';
    // Provide data API and property effects on memoized template class
    let klass = templateInfo.templatizeTemplateClass;
    if (!klass) {
      if (isTemplate) {
        /**
         * @constructor
         * @extends {DataTemplate}
         */
        let templatizedBase =
            options.mutableData ? MutableDataTemplate : DataTemplate;

        // NOTE: due to https://github.com/google/closure-compiler/issues/2928,
        // combining the next two lines into one assignment causes a spurious
        // type error.
        /** @private */
        class TemplatizedTemplate extends templatizedBase {}
        klass = templateInfo.templatizeTemplateClass = TemplatizedTemplate;
      } else {
        /**
         * @constructor
         * @extends {PolymerElement}
         */
        const templatizedBase = target.constructor;

        // Create a cached subclass of the base custom element class onto which
        // to put the template-specific propagate effects
        // NOTE: due to https://github.com/google/closure-compiler/issues/2928,
        // combining the next two lines into one assignment causes a spurious
        // type error.
        /** @private */
        class TemplatizedTemplateExtension extends templatizedBase {}
        klass = templateInfo.templatizeTemplateClass =
            TemplatizedTemplateExtension;
      }
      // Add template - >instances effects
      // and host <- template effects
      let hostProps = templateInfo.hostProps;
      for (let prop in hostProps) {
        klass.prototype._addPropertyEffect('_host_' + prop,
          klass.prototype.PROPERTY_EFFECT_TYPES.PROPAGATE,
          {fn: createForwardHostPropEffect(prop, userForwardHostProp)});
        klass.prototype._createNotifyingProperty('_host_' + prop);
      }
      if (legacyWarnings && methodHost) {
        warnOnUndeclaredProperties(templateInfo, options, methodHost);
      }
    }
    // Mix any pre-bound data into __data; no need to flush this to
    // instances since they pull from the template at instance-time
    if (target.__dataProto) {
      // Note, generally `__dataProto` could be chained, but it's guaranteed
      // to not be since this is a vanilla template we just added effects to
      Object.assign(target.__data, target.__dataProto);
    }
    if (isTemplate) {
      upgradeTemplate(target, klass);
      // Clear any pending data for performance
      target.__dataTemp = {};
      target.__dataPending = null;
      target.__dataOld = null;
      target._enableProperties();
    } else {
      // Swizzle the cached subclass prototype onto the custom element
      Object.setPrototypeOf(target, klass.prototype);
      // Check for any pre-bound instance host properties, and do the
      // instance property delete/assign dance for those (directly into data;
      // not need to go through accessor since they are pulled at instance time)
      const hostProps = templateInfo.hostProps;
      for (let prop in hostProps) {
        prop = '_host_' + prop;
        if (prop in target) {
          const val = target[prop];
          delete target[prop];
          target.__data[prop] = val;
        }
      }
    }
  }
}
/* eslint-enable valid-jsdoc */

function createForwardHostPropEffect(hostProp, userForwardHostProp) {
  return function forwardHostProp(template, prop, props) {
    userForwardHostProp.call(template.__templatizeOwner,
      prop.substring('_host_'.length), props[prop]);
  };
}

function addNotifyEffects(klass, template, templateInfo, options) {
  let hostProps = templateInfo.hostProps || {};
  for (let iprop in options.instanceProps) {
    delete hostProps[iprop];
    let userNotifyInstanceProp = options.notifyInstanceProp;
    if (userNotifyInstanceProp) {
      klass.prototype._addPropertyEffect(iprop,
        klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,
        {fn: createNotifyInstancePropEffect(iprop, userNotifyInstanceProp)});
    }
  }
  if (options.forwardHostProp && template.__dataHost) {
    for (let hprop in hostProps) {
      // As we're iterating hostProps in this function, note whether
      // there were any, for an optimization in addPropagateEffects
      if (!templateInfo.hasHostProps) {
        templateInfo.hasHostProps = true;
      }
      klass.prototype._addPropertyEffect(hprop,
        klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,
        {fn: createNotifyHostPropEffect()});
    }
  }
}

function createNotifyInstancePropEffect(instProp, userNotifyInstanceProp) {
  return function notifyInstanceProp(inst, prop, props) {
    userNotifyInstanceProp.call(inst.__templatizeOwner,
      inst, prop, props[prop]);
  };
}

function createNotifyHostPropEffect() {
  return function notifyHostProp(inst, prop, props) {
    inst.__dataHost._setPendingPropertyOrPath('_host_' + prop, props[prop], true, true);
  };
}


/**
 * Returns an anonymous `PropertyEffects` class bound to the
 * `<template>` provided.  Instancing the class will result in the
 * template being stamped into a document fragment stored as the instance's
 * `root` property, after which it can be appended to the DOM.
 *
 * Templates may utilize all Polymer data-binding features as well as
 * declarative event listeners.  Event listeners and inline computing
 * functions in the template will be called on the host of the template.
 *
 * The constructor returned takes a single argument dictionary of initial
 * property values to propagate into template bindings.  Additionally
 * host properties can be forwarded in, and instance properties can be
 * notified out by providing optional callbacks in the `options` dictionary.
 *
 * Valid configuration in `options` are as follows:
 *
 * - `forwardHostProp(property, value)`: Called when a property referenced
 *   in the template changed on the template's host. As this library does
 *   not retain references to templates instanced by the user, it is the
 *   templatize owner's responsibility to forward host property changes into
 *   user-stamped instances.  The `instance.forwardHostProp(property, value)`
 *    method on the generated class should be called to forward host
 *   properties into the template to prevent unnecessary property-changed
 *   notifications. Any properties referenced in the template that are not
 *   defined in `instanceProps` will be notified up to the template's host
 *   automatically.
 * - `instanceProps`: Dictionary of property names that will be added
 *   to the instance by the templatize owner.  These properties shadow any
 *   host properties, and changes within the template to these properties
 *   will result in `notifyInstanceProp` being called.
 * - `mutableData`: When `true`, the generated class will skip strict
 *   dirty-checking for objects and arrays (always consider them to be
 *   "dirty").
 * - `notifyInstanceProp(instance, property, value)`: Called when
 *   an instance property changes.  Users may choose to call `notifyPath`
 *   on e.g. the owner to notify the change.
 * - `parentModel`: When `true`, events handled by declarative event listeners
 *   (`on-event="handler"`) will be decorated with a `model` property pointing
 *   to the template instance that stamped it.  It will also be returned
 *   from `instance.parentModel` in cases where template instance nesting
 *   causes an inner model to shadow an outer model.
 *
 * All callbacks are called bound to the `owner`. Any context
 * needed for the callbacks (such as references to `instances` stamped)
 * should be stored on the `owner` such that they can be retrieved via
 * `this`.
 *
 * When `options.forwardHostProp` is declared as an option, any properties
 * referenced in the template will be automatically forwarded from the host of
 * the `<template>` to instances, with the exception of any properties listed in
 * the `options.instanceProps` object.  `instanceProps` are assumed to be
 * managed by the owner of the instances, either passed into the constructor
 * or set after the fact.  Note, any properties passed into the constructor will
 * always be set to the instance (regardless of whether they would normally
 * be forwarded from the host).
 *
 * Note that `templatize()` can be run only once for a given `<template>`.
 * Further calls will result in an error. Also, there is a special
 * behavior if the template was duplicated through a mechanism such as
 * `<dom-repeat>` or `<test-fixture>`. In this case, all calls to
 * `templatize()` return the same class for all duplicates of a template.
 * The class returned from `templatize()` is generated only once using
 * the `options` from the first call. This means that any `options`
 * provided to subsequent calls will be ignored. Therefore, it is very
 * important not to close over any variables inside the callbacks. Also,
 * arrow functions must be avoided because they bind the outer `this`.
 * Inside the callbacks, any contextual information can be accessed
 * through `this`, which points to the `owner`.
 *
 * @param {!HTMLTemplateElement} template Template to templatize
 * @param {Polymer_PropertyEffects=} owner Owner of the template instances;
 *   any optional callbacks will be bound to this owner.
 * @param {Object=} options Options dictionary (see summary for details)
 * @return {function(new:TemplateInstanceBase, Object=)} Generated class bound
 *   to the template provided
 * @suppress {invalidCasts}
 */
function templatize(template, owner, options) {
  // Under strictTemplatePolicy, the templatized element must be owned
  // by a (trusted) Polymer element, indicated by existence of _methodHost;
  // e.g. for dom-if & dom-repeat in main document, _methodHost is null
  if (strictTemplatePolicy && !findMethodHost(template)) {
    throw new Error('strictTemplatePolicy: template owner not trusted');
  }
  options = /** @type {!TemplatizeOptions} */(options || {});
  if (template.__templatizeOwner) {
    throw new Error('A <template> can only be templatized once');
  }
  template.__templatizeOwner = owner;
  const ctor = owner ? owner.constructor : TemplateInstanceBase;
  let templateInfo = ctor._parseTemplate(template);
  // Get memoized base class for the prototypical template, which
  // includes property effects for binding template & forwarding
  /**
   * @constructor
   * @extends {TemplateInstanceBase}
   */
  let baseClass = templateInfo.templatizeInstanceClass;
  if (!baseClass) {
    baseClass = createTemplatizerClass(template, templateInfo, options);
    templateInfo.templatizeInstanceClass = baseClass;
  }
  const methodHost = findMethodHost(template);
  // Host property forwarding must be installed onto template instance
  addPropagateEffects(template, templateInfo, options, methodHost);
  // Subclass base class and add reference for this specific template
  /** @private */
  let klass = class TemplateInstance extends baseClass {};
  /** @override */
  klass.prototype._methodHost = methodHost;
  /** @override */
  klass.prototype.__dataHost = /** @type {!DataTemplate} */ (template);
  /** @override */
  klass.prototype.__templatizeOwner = /** @type {!Object} */ (owner);
  /** @override */
  klass.prototype.__hostProps = templateInfo.hostProps;
  klass = /** @type {function(new:TemplateInstanceBase)} */(klass); //eslint-disable-line no-self-assign
  return klass;
}

function warnOnUndeclaredProperties(templateInfo, options, methodHost) {
  const declaredProps = methodHost.constructor._properties;
  const {propertyEffects} = templateInfo;
  const {instanceProps} = options;
  for (let prop in propertyEffects) {
    // Ensure properties with template effects are declared on the outermost
    // host (`methodHost`), unless they are instance props or static functions
    if (!declaredProps[prop] && !(instanceProps && instanceProps[prop])) {
      const effects = propertyEffects[prop];
      for (let i=0; i<effects.length; i++) {
        const {part} = effects[i].info;
        if (!(part.signature && part.signature.static)) {
          console.warn(`Property '${prop}' used in template but not ` +
            `declared in 'properties'; attribute will not be observed.`);
          break;
        }
      }
    }
  }
}

/**
 * Returns the template "model" associated with a given element, which
 * serves as the binding scope for the template instance the element is
 * contained in. A template model is an instance of
 * `TemplateInstanceBase`, and should be used to manipulate data
 * associated with this template instance.
 *
 * Example:
 *
 *   let model = modelForElement(el);
 *   if (model.index < 10) {
 *     model.set('item.checked', true);
 *   }
 *
 * @param {HTMLElement} template The model will be returned for
 *   elements stamped from this template (accepts either an HTMLTemplateElement)
 *   or a `<dom-if>`/`<dom-repeat>` element when using `removeNestedTemplates`
 *   optimization.
 * @param {Node=} node Node for which to return a template model.
 * @return {TemplateInstanceBase} Template instance representing the
 *   binding scope for the element
 */
function modelForElement(template, node) {
  let model;
  while (node) {
    // An element with a __templatizeInstance marks the top boundary
    // of a scope; walk up until we find one, and then ensure that
    // its __dataHost matches `this`, meaning this dom-repeat stamped it
    if ((model = node.__dataHost ? node : node.__templatizeInstance)) {
      // Found an element stamped by another template; keep walking up
      // from its __dataHost
      if (model.__dataHost != template) {
        node = model.__dataHost;
      } else {
        return model;
      }
    } else {
      // Still in a template scope, keep going up until
      // a __templatizeInstance is found
      node = wrap$1(node).parentNode;
    }
  }
  return null;
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

let elementsHidden = false;

/**
 * @return {boolean} True if elements will be hidden globally
 */
function hideElementsGlobally() {
  if (legacyOptimizations && !useShadow) {
    if (!elementsHidden) {
      elementsHidden = true;
      const style = document.createElement('style');
      style.textContent = 'dom-bind,dom-if,dom-repeat{display:none;}';
      document.head.appendChild(style);
    }
    return true;
  }
  return false;
}

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * @constructor
 * @extends {HTMLElement}
 * @implements {Polymer_PropertyEffects}
 * @implements {Polymer_OptionalMutableData}
 * @implements {Polymer_GestureEventListeners}
 * @private
 */
const domBindBase =
  GestureEventListeners(
    OptionalMutableData(
      PropertyEffects(HTMLElement)));

/**
 * Custom element to allow using Polymer's template features (data binding,
 * declarative event listeners, etc.) in the main document without defining
 * a new custom element.
 *
 * `<template>` tags utilizing bindings may be wrapped with the `<dom-bind>`
 * element, which will immediately stamp the wrapped template into the main
 * document and bind elements to the `dom-bind` element itself as the
 * binding scope.
 *
 * @polymer
 * @customElement
 * @appliesMixin PropertyEffects
 * @appliesMixin OptionalMutableData
 * @appliesMixin GestureEventListeners
 * @extends {domBindBase}
 * @summary Custom element to allow using Polymer's template features (data
 *   binding, declarative event listeners, etc.) in the main document.
 */
class DomBind extends domBindBase {

  static get observedAttributes() { return ['mutable-data']; }

  constructor() {
    super();
    if (strictTemplatePolicy) {
      throw new Error(`strictTemplatePolicy: dom-bind not allowed`);
    }
    this.root = null;
    this.$ = null;
    this.__children = null;
  }

  /* eslint-disable no-unused-vars */
  /**
   * @override
   * @param {string} name Name of attribute that changed
   * @param {?string} old Old attribute value
   * @param {?string} value New attribute value
   * @param {?string} namespace Attribute namespace.
   * @return {void}
   */
  attributeChangedCallback(name, old, value, namespace) {
    // assumes only one observed attribute
    this.mutableData = true;
  }

  /**
   * @override
   * @return {void}
   */
  connectedCallback() {
    if (!hideElementsGlobally()) {
      this.style.display = 'none';
    }
    this.render();
  }

  /**
   * @override
   * @return {void}
   */
  disconnectedCallback() {
    this.__removeChildren();
  }

  __insertChildren() {
    wrap$1(wrap$1(this).parentNode).insertBefore(this.root, this);
  }

  __removeChildren() {
    if (this.__children) {
      for (let i=0; i<this.__children.length; i++) {
        this.root.appendChild(this.__children[i]);
      }
    }
  }

  /**
   * Forces the element to render its content. This is typically only
   * necessary to call if HTMLImports with the async attribute are used.
   * @return {void}
   */
  render() {
    let template;
    if (!this.__children) {
      template = /** @type {?HTMLTemplateElement} */(template || this.querySelector('template'));
      if (!template) {
        // Wait until childList changes and template should be there by then
        let observer = new MutationObserver(() => {
          template = /** @type {HTMLTemplateElement} */(this.querySelector('template'));
          if (template) {
            observer.disconnect();
            this.render();
          } else {
            throw new Error('dom-bind requires a <template> child');
          }
        });
        observer.observe(this, {childList: true});
        return;
      }
      this.root = this._stampTemplate(
        /** @type {!HTMLTemplateElement} */(template));
      this.$ = this.root.$;
      this.__children = [];
      for (let n=this.root.firstChild; n; n=n.nextSibling) {
        this.__children[this.__children.length] = n;
      }
      this._enableProperties();
    }
    this.__insertChildren();
    this.dispatchEvent(new CustomEvent('dom-change', {
      bubbles: true,
      composed: true
    }));
  }

}

customElements.define('dom-bind', DomBind);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Base class that provides the core API for Polymer's meta-programming
 * features including template stamping, data-binding, attribute deserialization,
 * and property change observation.
 *
 * @customElement
 * @polymer
 * @constructor
 * @implements {Polymer_ElementMixin}
 * @extends HTMLElement
 * @appliesMixin ElementMixin
 * @summary Custom element base class that provides the core API for Polymer's
 *   key meta-programming features including template stamping, data-binding,
 *   attribute deserialization, and property change observation
 */
const PolymerElement = ElementMixin(HTMLElement);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * @constructor
 * @implements {Polymer_OptionalMutableData}
 * @extends {PolymerElement}
 * @private
 */
const domRepeatBase = OptionalMutableData(PolymerElement);

/**
 * The `<dom-repeat>` element will automatically stamp and binds one instance
 * of template content to each object in a user-provided array.
 * `dom-repeat` accepts an `items` property, and one instance of the template
 * is stamped for each item into the DOM at the location of the `dom-repeat`
 * element.  The `item` property will be set on each instance's binding
 * scope, thus templates should bind to sub-properties of `item`.
 *
 * Example:
 *
 * ```html
 * <dom-module id="employee-list">
 *
 *   <template>
 *
 *     <div> Employee list: </div>
 *     <dom-repeat items="{{employees}}">
 *       <template>
 *         <div>First name: <span>{{item.first}}</span></div>
 *         <div>Last name: <span>{{item.last}}</span></div>
 *       </template>
 *     </dom-repeat>
 *
 *   </template>
 *
 * </dom-module>
 * ```
 *
 * With the following custom element definition:
 *
 * ```js
 * class EmployeeList extends PolymerElement {
 *   static get is() { return 'employee-list'; }
 *   static get properties() {
 *     return {
 *       employees: {
 *         value() {
 *           return [
 *             {first: 'Bob', last: 'Smith'},
 *             {first: 'Sally', last: 'Johnson'},
 *             ...
 *           ];
 *         }
 *       }
 *     };
 *   }
 * }
 * ```
 *
 * Notifications for changes to items sub-properties will be forwarded to template
 * instances, which will update via the normal structured data notification system.
 *
 * Mutations to the `items` array itself should be made using the Array
 * mutation API's on the PropertyEffects mixin (`push`, `pop`, `splice`,
 * `shift`, `unshift`), and template instances will be kept in sync with the
 * data in the array.
 *
 * Events caught by event handlers within the `dom-repeat` template will be
 * decorated with a `model` property, which represents the binding scope for
 * each template instance.  The model should be used to manipulate data on the
 * instance, for example `event.model.set('item.checked', true);`.
 *
 * Alternatively, the model for a template instance for an element stamped by
 * a `dom-repeat` can be obtained using the `modelForElement` API on the
 * `dom-repeat` that stamped it, for example
 * `this.$.domRepeat.modelForElement(event.target).set('item.checked', true);`.
 * This may be useful for manipulating instance data of event targets obtained
 * by event handlers on parents of the `dom-repeat` (event delegation).
 *
 * A view-specific filter/sort may be applied to each `dom-repeat` by supplying a
 * `filter` and/or `sort` property.  This may be a string that names a function on
 * the host, or a function may be assigned to the property directly.  The functions
 * should implemented following the standard `Array` filter/sort API.
 *
 * In order to re-run the filter or sort functions based on changes to sub-fields
 * of `items`, the `observe` property may be set as a space-separated list of
 * `item` sub-fields that should cause a re-filter/sort when modified.  If
 * the filter or sort function depends on properties not contained in `items`,
 * the user should observe changes to those properties and call `render` to update
 * the view based on the dependency change.
 *
 * For example, for an `dom-repeat` with a filter of the following:
 *
 * ```js
 * isEngineer(item) {
 *   return item.type == 'engineer' || item.manager.type == 'engineer';
 * }
 * ```
 *
 * Then the `observe` property should be configured as follows:
 *
 * ```html
 * <dom-repeat items="{{employees}}" filter="isEngineer" observe="type manager.type">
 * ```
 *
 * @customElement
 * @polymer
 * @extends {domRepeatBase}
 * @appliesMixin OptionalMutableData
 * @summary Custom element for stamping instance of a template bound to
 *   items in an array.
 */
class DomRepeat extends domRepeatBase {

  // Not needed to find template; can be removed once the analyzer
  // can find the tag name from customElements.define call
  static get is() { return 'dom-repeat'; }

  static get template() { return null; }

  static get properties() {

    /**
     * Fired whenever DOM is added or removed by this template (by
     * default, rendering occurs lazily).  To force immediate rendering, call
     * `render`.
     *
     * @event dom-change
     */
    return {

      /**
       * An array containing items determining how many instances of the template
       * to stamp and that that each template instance should bind to.
       */
      items: {
        type: Array
      },

      /**
       * The name of the variable to add to the binding scope for the array
       * element associated with a given template instance.
       */
      as: {
        type: String,
        value: 'item'
      },

      /**
       * The name of the variable to add to the binding scope with the index
       * of the instance in the sorted and filtered list of rendered items.
       * Note, for the index in the `this.items` array, use the value of the
       * `itemsIndexAs` property.
       */
      indexAs: {
        type: String,
        value: 'index'
      },

      /**
       * The name of the variable to add to the binding scope with the index
       * of the instance in the `this.items` array. Note, for the index of
       * this instance in the sorted and filtered list of rendered items,
       * use the value of the `indexAs` property.
       */
      itemsIndexAs: {
        type: String,
        value: 'itemsIndex'
      },

      /**
       * A function that should determine the sort order of the items.  This
       * property should either be provided as a string, indicating a method
       * name on the element's host, or else be an actual function.  The
       * function should match the sort function passed to `Array.sort`.
       * Using a sort function has no effect on the underlying `items` array.
       */
      sort: {
        type: Function,
        observer: '__sortChanged'
      },

      /**
       * A function that can be used to filter items out of the view.  This
       * property should either be provided as a string, indicating a method
       * name on the element's host, or else be an actual function.  The
       * function should match the sort function passed to `Array.filter`.
       * Using a filter function has no effect on the underlying `items` array.
       */
      filter: {
        type: Function,
        observer: '__filterChanged'
      },

      /**
       * When using a `filter` or `sort` function, the `observe` property
       * should be set to a space-separated list of the names of item
       * sub-fields that should trigger a re-sort or re-filter when changed.
       * These should generally be fields of `item` that the sort or filter
       * function depends on.
       */
      observe: {
        type: String,
        observer: '__observeChanged'
      },

      /**
       * When using a `filter` or `sort` function, the `delay` property
       * determines a debounce time in ms after a change to observed item
       * properties that must pass before the filter or sort is re-run.
       * This is useful in rate-limiting shuffling of the view when
       * item changes may be frequent.
       */
      delay: Number,

      /**
       * Count of currently rendered items after `filter` (if any) has been applied.
       * If "chunking mode" is enabled, `renderedItemCount` is updated each time a
       * set of template instances is rendered.
       *
       */
      renderedItemCount: {
        type: Number,
        notify: !suppressTemplateNotifications,
        readOnly: true
      },

      /**
       * When greater than zero, defines an initial count of template instances
       * to render after setting the `items` array, before the next paint, and
       * puts the `dom-repeat` into "chunking mode".  The remaining items (and
       * any future items as a result of pushing onto the array) will be created
       * and rendered incrementally at each animation frame thereof until all
       * instances have been rendered.
       */
      initialCount: {
        type: Number
      },

      /**
       * When `initialCount` is used, this property defines a frame rate (in
       * fps) to target by throttling the number of instances rendered each
       * frame to not exceed the budget for the target frame rate.  The
       * framerate is effectively the number of `requestAnimationFrame`s that
       * it tries to allow to actually fire in a given second. It does this
       * by measuring the time between `rAF`s and continuously adjusting the
       * number of items created each `rAF` to maintain the target framerate.
       * Setting this to a higher number allows lower latency and higher
       * throughput for event handlers and other tasks, but results in a
       * longer time for the remaining items to complete rendering.
       */
      targetFramerate: {
        type: Number,
        value: 20
      },

      _targetFrameTime: {
        type: Number,
        computed: '__computeFrameTime(targetFramerate)'
      },

      /**
       * When the global `suppressTemplateNotifications` setting is used, setting
       * `notifyDomChange: true` will enable firing `dom-change` events on this
       * element.
       */
      notifyDomChange: {
        type: Boolean
      },

      /**
       * When chunking is enabled via `initialCount` and the `items` array is
       * set to a new array, this flag controls whether the previously rendered
       * instances are reused or not.
       *
       * When `true`, any previously rendered template instances are updated in
       * place to their new item values synchronously in one shot, and then any
       * further items (if any) are chunked out.  When `false`, the list is
       * returned back to its `initialCount` (any instances over the initial
       * count are discarded) and the remainder of the list is chunked back in.
       * Set this to `true` to avoid re-creating the list and losing scroll
       * position, although note that when changing the list to completely
       * different data the render thread will be blocked until all existing
       * instances are updated to their new data.
       */
      reuseChunkedInstances: {
        type: Boolean
      }

    };

  }

  static get observers() {
    return [ '__itemsChanged(items.*)' ];
  }

  constructor() {
    super();
    this.__instances = [];
    this.__renderDebouncer = null;
    this.__itemsIdxToInstIdx = {};
    this.__chunkCount = null;
    this.__renderStartTime = null;
    this.__itemsArrayChanged = false;
    this.__shouldMeasureChunk = false;
    this.__shouldContinueChunking = false;
    this.__chunkingId = 0;
    this.__sortFn = null;
    this.__filterFn = null;
    this.__observePaths = null;
    /** @type {?function(new:TemplateInstanceBase, Object=)} */
    this.__ctor = null;
    this.__isDetached = true;
    this.template = null;
    /** @type {TemplateInfo} */
    this._templateInfo;
  }

  /**
   * @override
   * @return {void}
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    this.__isDetached = true;
    for (let i=0; i<this.__instances.length; i++) {
      this.__detachInstance(i);
    }
  }

  /**
   * @override
   * @return {void}
   */
  connectedCallback() {
    super.connectedCallback();
    if (!hideElementsGlobally()) {
      this.style.display = 'none';
    }
    // only perform attachment if the element was previously detached.
    if (this.__isDetached) {
      this.__isDetached = false;
      let wrappedParent = wrap$1(wrap$1(this).parentNode);
      for (let i=0; i<this.__instances.length; i++) {
        this.__attachInstance(i, wrappedParent);
      }
    }
  }

  __ensureTemplatized() {
    // Templatizing (generating the instance constructor) needs to wait
    // until ready, since won't have its template content handed back to
    // it until then
    if (!this.__ctor) {
      // When `removeNestedTemplates` is true, the "template" is the element
      // itself, which has been given a `_templateInfo` property
      const thisAsTemplate = /** @type {!HTMLTemplateElement} */ (
          /** @type {!HTMLElement} */ (this));
      let template = this.template = thisAsTemplate._templateInfo ?
          thisAsTemplate :
          /** @type {!HTMLTemplateElement} */ (this.querySelector('template'));
      if (!template) {
        // Wait until childList changes and template should be there by then
        let observer = new MutationObserver(() => {
          if (this.querySelector('template')) {
            observer.disconnect();
            this.__render();
          } else {
            throw new Error('dom-repeat requires a <template> child');
          }
        });
        observer.observe(this, {childList: true});
        return false;
      }
      // Template instance props that should be excluded from forwarding
      let instanceProps = {};
      instanceProps[this.as] = true;
      instanceProps[this.indexAs] = true;
      instanceProps[this.itemsIndexAs] = true;
      this.__ctor = templatize(template, this, {
        mutableData: this.mutableData,
        parentModel: true,
        instanceProps: instanceProps,
        /**
         * @this {DomRepeat}
         * @param {string} prop Property to set
         * @param {*} value Value to set property to
         */
        forwardHostProp: function(prop, value) {
          let i$ = this.__instances;
          for (let i=0, inst; (i<i$.length) && (inst=i$[i]); i++) {
            inst.forwardHostProp(prop, value);
          }
        },
        /**
         * @this {DomRepeat}
         * @param {Object} inst Instance to notify
         * @param {string} prop Property to notify
         * @param {*} value Value to notify
         */
        notifyInstanceProp: function(inst, prop, value) {
          if (matches(this.as, prop)) {
            let idx = inst[this.itemsIndexAs];
            if (prop == this.as) {
              this.items[idx] = value;
            }
            let path = translate(this.as, `${JSCompiler_renameProperty('items', this)}.${idx}`, prop);
            this.notifyPath(path, value);
          }
        }
      });
    }
    return true;
  }

  __getMethodHost() {
    // Technically this should be the owner of the outermost template.
    // In shadow dom, this is always getRootNode().host, but we can
    // approximate this via cooperation with our dataHost always setting
    // `_methodHost` as long as there were bindings (or id's) on this
    // instance causing it to get a dataHost.
    return this.__dataHost._methodHost || this.__dataHost;
  }

  __functionFromPropertyValue(functionOrMethodName) {
    if (typeof functionOrMethodName === 'string') {
      let methodName = functionOrMethodName;
      let obj = this.__getMethodHost();
      return function() { return obj[methodName].apply(obj, arguments); };
    }

    return functionOrMethodName;
  }

  __sortChanged(sort) {
    this.__sortFn = this.__functionFromPropertyValue(sort);
    if (this.items) { this.__debounceRender(this.__render); }
  }

  __filterChanged(filter) {
    this.__filterFn = this.__functionFromPropertyValue(filter);
    if (this.items) { this.__debounceRender(this.__render); }
  }

  __computeFrameTime(rate) {
    return Math.ceil(1000/rate);
  }

  __observeChanged() {
    this.__observePaths = this.observe &&
      this.observe.replace('.*', '.').split(' ');
  }

  __handleObservedPaths(path) {
    // Handle cases where path changes should cause a re-sort/filter
    if (this.__sortFn || this.__filterFn) {
      if (!path) {
        // Always re-render if the item itself changed
        this.__debounceRender(this.__render, this.delay);
      } else if (this.__observePaths) {
        // Otherwise, re-render if the path changed matches an observed path
        let paths = this.__observePaths;
        for (let i=0; i<paths.length; i++) {
          if (path.indexOf(paths[i]) === 0) {
            this.__debounceRender(this.__render, this.delay);
          }
        }
      }
    }
  }

  __itemsChanged(change) {
    if (this.items && !Array.isArray(this.items)) {
      console.warn('dom-repeat expected array for `items`, found', this.items);
    }
    // If path was to an item (e.g. 'items.3' or 'items.3.foo'), forward the
    // path to that instance synchronously (returns false for non-item paths)
    if (!this.__handleItemPath(change.path, change.value)) {
      // Otherwise, the array was reset ('items') or spliced ('items.splices'),
      // so queue a render.  Restart chunking when the items changed (for
      // backward compatibility), unless `reuseChunkedInstances` option is set
      if (change.path === 'items') {
        this.__itemsArrayChanged = true;
      }
      this.__debounceRender(this.__render);
    }
  }

  /**
   * @param {function(this:DomRepeat)} fn Function to debounce.
   * @param {number=} delay Delay in ms to debounce by.
   */
  __debounceRender(fn, delay = 0) {
    this.__renderDebouncer = Debouncer.debounce(
          this.__renderDebouncer
        , delay > 0 ? timeOut.after(delay) : microTask
        , fn.bind(this));
    enqueueDebouncer(this.__renderDebouncer);
  }

  /**
   * Forces the element to render its content. Normally rendering is
   * asynchronous to a provoking change. This is done for efficiency so
   * that multiple changes trigger only a single render. The render method
   * should be called if, for example, template rendering is required to
   * validate application state.
   * @return {void}
   */
  render() {
    // Queue this repeater, then flush all in order
    this.__debounceRender(this.__render);
    flush();
  }

  __render() {
    if (!this.__ensureTemplatized()) {
      // No template found yet
      return;
    }
    let items = this.items || [];
    // Sort and filter the items into a mapping array from instance->item
    const isntIdxToItemsIdx = this.__sortAndFilterItems(items);
    // If we're chunking, increase the limit if there are new instances to
    // create and schedule the next chunk
    const limit = this.__calculateLimit(isntIdxToItemsIdx.length);
    // Create, update, and/or remove instances
    this.__updateInstances(items, limit, isntIdxToItemsIdx);
    // If we're chunking, schedule a rAF task to measure/continue chunking.     
    // Do this before any notifying events (renderedItemCount & dom-change)
    // since those could modify items and enqueue a new full render which will
    // pre-empt this measurement.
    if (this.initialCount &&
       (this.__shouldMeasureChunk || this.__shouldContinueChunking)) {
      cancelAnimationFrame(this.__chunkingId);
      this.__chunkingId = requestAnimationFrame(() => this.__continueChunking());
    }
    // Set rendered item count
    this._setRenderedItemCount(this.__instances.length);
    // Notify users
    if (!suppressTemplateNotifications || this.notifyDomChange) {
      this.dispatchEvent(new CustomEvent('dom-change', {
        bubbles: true,
        composed: true
      }));
    }
  }

  __sortAndFilterItems(items) {
    // Generate array maping the instance index to the items array index
    let isntIdxToItemsIdx = new Array(items.length);
    for (let i=0; i<items.length; i++) {
      isntIdxToItemsIdx[i] = i;
    }
    // Apply user filter
    if (this.__filterFn) {
      isntIdxToItemsIdx = isntIdxToItemsIdx.filter((i, idx, array) =>
        this.__filterFn(items[i], idx, array));
    }
    // Apply user sort
    if (this.__sortFn) {
      isntIdxToItemsIdx.sort((a, b) => this.__sortFn(items[a], items[b]));
    }
    return isntIdxToItemsIdx;
  }

  __calculateLimit(filteredItemCount) {
    let limit = filteredItemCount;
    const currentCount = this.__instances.length;
    // When chunking, we increase the limit from the currently rendered count
    // by the chunk count that is re-calculated after each rAF (with special
    // cases for reseting the limit to initialCount after changing items)
    if (this.initialCount) {
      let newCount;
      if (!this.__chunkCount ||
        (this.__itemsArrayChanged && !this.reuseChunkedInstances)) {
        // Limit next render to the initial count
        limit = Math.min(filteredItemCount, this.initialCount);
        // Subtract off any existing instances to determine the number of
        // instances that will be created
        newCount = Math.max(limit - currentCount, 0);
        // Initialize the chunk size with how many items we're creating
        this.__chunkCount = newCount || 1;
      } else {
        // The number of new instances that will be created is based on the
        // existing instances, the new list size, and the chunk size
        newCount = Math.min(
          Math.max(filteredItemCount - currentCount, 0), 
          this.__chunkCount);
        // Update the limit based on how many new items we're making, limited
        // buy the total size of the list
        limit = Math.min(currentCount + newCount, filteredItemCount);
      }
      // Record some state about chunking for use in `__continueChunking`
      this.__shouldMeasureChunk = newCount === this.__chunkCount;
      this.__shouldContinueChunking = limit < filteredItemCount;
      this.__renderStartTime = performance.now();
    }
    this.__itemsArrayChanged = false;
    return limit;
  }

  __continueChunking() {
    // Simple auto chunkSize throttling algorithm based on feedback loop:
    // measure actual time between frames and scale chunk count by ratio of
    // target/actual frame time.  Only modify chunk size if our measurement
    // reflects the cost of a creating a full chunk's worth of instances; this
    // avoids scaling up the chunk size if we e.g. quickly re-rendered instances
    // in place
    if (this.__shouldMeasureChunk) {
      const renderTime = performance.now() - this.__renderStartTime;
      const ratio = this._targetFrameTime / renderTime;
      this.__chunkCount = Math.round(this.__chunkCount * ratio) || 1;
    }
    // Enqueue a new render if we haven't reached the full size of the list
    if (this.__shouldContinueChunking) {
      this.__debounceRender(this.__render);
    }
  }
  
  __updateInstances(items, limit, isntIdxToItemsIdx) {
    // items->inst map kept for item path forwarding
    const itemsIdxToInstIdx = this.__itemsIdxToInstIdx = {};
    let instIdx;
    // Generate instances and assign items
    for (instIdx=0; instIdx<limit; instIdx++) {
      let inst = this.__instances[instIdx];
      let itemIdx = isntIdxToItemsIdx[instIdx];
      let item = items[itemIdx];
      itemsIdxToInstIdx[itemIdx] = instIdx;
      if (inst) {
        inst._setPendingProperty(this.as, item);
        inst._setPendingProperty(this.indexAs, instIdx);
        inst._setPendingProperty(this.itemsIndexAs, itemIdx);
        inst._flushProperties();
      } else {
        this.__insertInstance(item, instIdx, itemIdx);
      }
    }
    // Remove any extra instances from previous state
    for (let i=this.__instances.length-1; i>=instIdx; i--) {
      this.__detachAndRemoveInstance(i);
    }
  }

  __detachInstance(idx) {
    let inst = this.__instances[idx];
    const wrappedRoot = wrap$1(inst.root);
    for (let i=0; i<inst.children.length; i++) {
      let el = inst.children[i];
      wrappedRoot.appendChild(el);
    }
    return inst;
  }

  __attachInstance(idx, parent) {
    let inst = this.__instances[idx];
    // Note, this is pre-wrapped as an optimization
    parent.insertBefore(inst.root, this);
  }

  __detachAndRemoveInstance(idx) {
    this.__detachInstance(idx);
    this.__instances.splice(idx, 1);
  }

  __stampInstance(item, instIdx, itemIdx) {
    let model = {};
    model[this.as] = item;
    model[this.indexAs] = instIdx;
    model[this.itemsIndexAs] = itemIdx;
    return new this.__ctor(model);
  }

  __insertInstance(item, instIdx, itemIdx) {
    const inst = this.__stampInstance(item, instIdx, itemIdx);
    let beforeRow = this.__instances[instIdx + 1];
    let beforeNode = beforeRow ? beforeRow.children[0] : this;
    wrap$1(wrap$1(this).parentNode).insertBefore(inst.root, beforeNode);
    this.__instances[instIdx] = inst;
    return inst;
  }

  // Implements extension point from Templatize mixin
  /**
   * Shows or hides the template instance top level child elements. For
   * text nodes, `textContent` is removed while "hidden" and replaced when
   * "shown."
   * @param {boolean} hidden Set to true to hide the children;
   * set to false to show them.
   * @return {void}
   * @protected
   */
  _showHideChildren(hidden) {
    for (let i=0; i<this.__instances.length; i++) {
      this.__instances[i]._showHideChildren(hidden);
    }
  }

  // Called as a side effect of a host items.<key>.<path> path change,
  // responsible for notifying item.<path> changes to inst for key
  __handleItemPath(path, value) {
    let itemsPath = path.slice(6); // 'items.'.length == 6
    let dot = itemsPath.indexOf('.');
    let itemsIdx = dot < 0 ? itemsPath : itemsPath.substring(0, dot);
    // If path was index into array...
    if (itemsIdx == parseInt(itemsIdx, 10)) {
      let itemSubPath = dot < 0 ? '' : itemsPath.substring(dot+1);
      // If the path is observed, it will trigger a full refresh
      this.__handleObservedPaths(itemSubPath);
      // Note, even if a rull refresh is triggered, always do the path
      // notification because unless mutableData is used for dom-repeat
      // and all elements in the instance subtree, a full refresh may
      // not trigger the proper update.
      let instIdx = this.__itemsIdxToInstIdx[itemsIdx];
      let inst = this.__instances[instIdx];
      if (inst) {
        let itemPath = this.as + (itemSubPath ? '.' + itemSubPath : '');
        // This is effectively `notifyPath`, but avoids some of the overhead
        // of the public API
        inst._setPendingPropertyOrPath(itemPath, value, false, true);
        inst._flushProperties();
      }
      return true;
    }
  }

  /**
   * Returns the item associated with a given element stamped by
   * this `dom-repeat`.
   *
   * Note, to modify sub-properties of the item,
   * `modelForElement(el).set('item.<sub-prop>', value)`
   * should be used.
   *
   * @param {!HTMLElement} el Element for which to return the item.
   * @return {*} Item associated with the element.
   */
  itemForElement(el) {
    let instance = this.modelForElement(el);
    return instance && instance[this.as];
  }

  /**
   * Returns the inst index for a given element stamped by this `dom-repeat`.
   * If `sort` is provided, the index will reflect the sorted order (rather
   * than the original array order).
   *
   * @param {!HTMLElement} el Element for which to return the index.
   * @return {?number} Row index associated with the element (note this may
   *   not correspond to the array index if a user `sort` is applied).
   */
  indexForElement(el) {
    let instance = this.modelForElement(el);
    return instance && instance[this.indexAs];
  }

  /**
   * Returns the template "model" associated with a given element, which
   * serves as the binding scope for the template instance the element is
   * contained in. A template model
   * should be used to manipulate data associated with this template instance.
   *
   * Example:
   *
   *   let model = modelForElement(el);
   *   if (model.index < 10) {
   *     model.set('item.checked', true);
   *   }
   *
   * @param {!HTMLElement} el Element for which to return a template model.
   * @return {TemplateInstanceBase} Model representing the binding scope for
   *   the element.
   */
  modelForElement(el) {
    return modelForElement(this.template, el);
  }

}

customElements.define(DomRepeat.is, DomRepeat);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * @customElement
 * @polymer
 * @extends PolymerElement
 * @summary Base class for dom-if element; subclassed into concrete
 *   implementation.
 */
class DomIfBase extends PolymerElement {

  // Not needed to find template; can be removed once the analyzer
  // can find the tag name from customElements.define call
  static get is() { return 'dom-if'; }

  static get template() { return null; }

  static get properties() {

    return {

      /**
       * Fired whenever DOM is added or removed/hidden by this template (by
       * default, rendering occurs lazily).  To force immediate rendering, call
       * `render`.
       *
       * @event dom-change
       */

      /**
       * A boolean indicating whether this template should stamp.
       */
      if: {
        type: Boolean,
        observer: '__debounceRender'
      },

      /**
       * When true, elements will be removed from DOM and discarded when `if`
       * becomes false and re-created and added back to the DOM when `if`
       * becomes true.  By default, stamped elements will be hidden but left
       * in the DOM when `if` becomes false, which is generally results
       * in better performance.
       */
      restamp: {
        type: Boolean,
        observer: '__debounceRender'
      },

      /**
       * When the global `suppressTemplateNotifications` setting is used, setting
       * `notifyDomChange: true` will enable firing `dom-change` events on this
       * element.
       */
      notifyDomChange: {
        type: Boolean
      }
    };

  }

  constructor() {
    super();
    this.__renderDebouncer = null;
    this._lastIf = false;
    this.__hideTemplateChildren__ = false;
    /** @type {!HTMLTemplateElement|undefined} */
    this.__template;
    /** @type {!TemplateInfo|undefined} */
    this._templateInfo;
  }

  __debounceRender() {
    // Render is async for 2 reasons:
    // 1. To eliminate dom creation trashing if user code thrashes `if` in the
    //    same turn. This was more common in 1.x where a compound computed
    //    property could result in the result changing multiple times, but is
    //    mitigated to a large extent by batched property processing in 2.x.
    // 2. To avoid double object propagation when a bag including values bound
    //    to the `if` property as well as one or more hostProps could enqueue
    //    the <dom-if> to flush before the <template>'s host property
    //    forwarding. In that scenario creating an instance would result in
    //    the host props being set once, and then the enqueued changes on the
    //    template would set properties a second time, potentially causing an
    //    object to be set to an instance more than once.  Creating the
    //    instance async from flushing data ensures this doesn't happen. If
    //    we wanted a sync option in the future, simply having <dom-if> flush
    //    (or clear) its template's pending host properties before creating
    //    the instance would also avoid the problem.
    this.__renderDebouncer = Debouncer.debounce(
          this.__renderDebouncer
        , microTask
        , () => this.__render());
    enqueueDebouncer(this.__renderDebouncer);
  }

  /**
   * @override
   * @return {void}
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    const parent = wrap$1(this).parentNode;
    if (!parent || (parent.nodeType == Node.DOCUMENT_FRAGMENT_NODE &&
        !wrap$1(parent).host)) {
      this.__teardownInstance();
    }
  }

  /**
   * @override
   * @return {void}
   */
  connectedCallback() {
    super.connectedCallback();
    if (!hideElementsGlobally()) {
      this.style.display = 'none';
    }
    if (this.if) {
      this.__debounceRender();
    }
  }

  /**
   * Ensures a template has been assigned to `this.__template`.  If it has not
   * yet been, it querySelectors for it in its children and if it does not yet
   * exist (e.g. in parser-generated case), opens a mutation observer and
   * waits for it to appear (returns false if it has not yet been found,
   * otherwise true).  In the `removeNestedTemplates` case, the "template" will
   * be the `dom-if` element itself.
   *
   * @return {boolean} True when a template has been found, false otherwise
   */
  __ensureTemplate() {
    if (!this.__template) {
      // When `removeNestedTemplates` is true, the "template" is the element
      // itself, which has been given a `_templateInfo` property
      const thisAsTemplate = /** @type {!HTMLTemplateElement} */ (
          /** @type {!HTMLElement} */ (this));
      let template = thisAsTemplate._templateInfo ?
          thisAsTemplate :
          /** @type {!HTMLTemplateElement} */
          (wrap$1(thisAsTemplate).querySelector('template'));
      if (!template) {
        // Wait until childList changes and template should be there by then
        let observer = new MutationObserver(() => {
          if (wrap$1(this).querySelector('template')) {
            observer.disconnect();
            this.__render();
          } else {
            throw new Error('dom-if requires a <template> child');
          }
        });
        observer.observe(this, {childList: true});
        return false;
      }
      this.__template = template;
    }
    return true;
  }

  /**
   * Ensures a an instance of the template has been created and inserted. This
   * method may return false if the template has not yet been found or if
   * there is no `parentNode` to insert the template into (in either case,
   * connection or the template-finding mutation observer firing will queue
   * another render, causing this method to be called again at a more
   * appropriate time).
   *
   * Subclasses should implement the following methods called here:
   * - `__hasInstance`
   * - `__createAndInsertInstance`
   * - `__getInstanceNodes`
   *
   * @return {boolean} True if the instance was created, false otherwise.
   */
  __ensureInstance() {
    let parentNode = wrap$1(this).parentNode;
    if (!this.__hasInstance()) {
      // Guard against element being detached while render was queued
      if (!parentNode) {
        return false;
      }
      // Find the template (when false, there was no template yet)
      if (!this.__ensureTemplate()) {
        return false;
      }
      this.__createAndInsertInstance(parentNode);
    } else {
      // Move instance children if necessary
      let children = this.__getInstanceNodes();
      if (children && children.length) {
        // Detect case where dom-if was re-attached in new position
        let lastChild = wrap$1(this).previousSibling;
        if (lastChild !== children[children.length-1]) {
          for (let i=0, n; (i<children.length) && (n=children[i]); i++) {
            wrap$1(parentNode).insertBefore(n, this);
          }
        }
      }
    }
    return true;
  }

  /**
   * Forces the element to render its content. Normally rendering is
   * asynchronous to a provoking change. This is done for efficiency so
   * that multiple changes trigger only a single render. The render method
   * should be called if, for example, template rendering is required to
   * validate application state.
   *
   * @return {void}
   */
  render() {
    flush();
  }

  /**
   * Performs the key rendering steps:
   * 1. Ensure a template instance has been stamped (when true)
   * 2. Remove the template instance (when false and restamp:true)
   * 3. Sync the hidden state of the instance nodes with the if/restamp state
   * 4. Fires the `dom-change` event when necessary
   *
   * @return {void}
   */
  __render() {
    if (this.if) {
      if (!this.__ensureInstance()) {
        // No template found yet
        return;
      }
    } else if (this.restamp) {
      this.__teardownInstance();
    }
    this._showHideChildren();
    if ((!suppressTemplateNotifications || this.notifyDomChange)
        && this.if != this._lastIf) {
      this.dispatchEvent(new CustomEvent('dom-change', {
        bubbles: true,
        composed: true
      }));
      this._lastIf = this.if;
    }
  }

  // Ideally these would be annotated as abstract methods in an abstract class,
  // but closure compiler is finnicky
  /* eslint-disable valid-jsdoc */
  /**
   * Abstract API to be implemented by subclass: Returns true if a template
   * instance has been created and inserted.
   *
   * @protected
   * @return {boolean} True when an instance has been created.
   */
  __hasInstance() { }

  /**
   * Abstract API to be implemented by subclass: Returns the child nodes stamped
   * from a template instance.
   *
   * @protected
   * @return {Array<Node>} Array of child nodes stamped from the template
   * instance.
   */
  __getInstanceNodes() { }

  /**
   * Abstract API to be implemented by subclass: Creates an instance of the
   * template and inserts it into the given parent node.
   *
   * @protected
   * @param {Node} parentNode The parent node to insert the instance into
   * @return {void}
   */
  __createAndInsertInstance(parentNode) { } // eslint-disable-line no-unused-vars

  /**
   * Abstract API to be implemented by subclass: Removes nodes created by an
   * instance of a template and any associated cleanup.
   *
   * @protected
   * @return {void}
   */
  __teardownInstance() { }

  /**
   * Abstract API to be implemented by subclass: Shows or hides any template
   * instance childNodes based on the `if` state of the element and its
   * `__hideTemplateChildren__` property.
   *
   * @protected
   * @return {void}
   */
  _showHideChildren() { }
  /* eslint-enable valid-jsdoc */
}

/**
 * The version of DomIf used when `fastDomIf` setting is in use, which is
 * optimized for first-render (but adds a tax to all subsequent property updates
 * on the host, whether they were used in a given `dom-if` or not).
 *
 * This implementation avoids use of `Templatizer`, which introduces a new scope
 * (a non-element PropertyEffects instance), which is not strictly necessary
 * since `dom-if` never introduces new properties to its scope (unlike
 * `dom-repeat`). Taking advantage of this fact, the `dom-if` reaches up to its
 * `__dataHost` and stamps the template directly from the host using the host's
 * runtime `_stampTemplate` API, which binds the property effects of the
 * template directly to the host. This both avoids the intermediary
 * `Templatizer` instance, but also avoids the need to bind host properties to
 * the `<template>` element and forward those into the template instance.
 *
 * In this version of `dom-if`, the `this.__instance` method is the
 * `DocumentFragment` returned from `_stampTemplate`, which also serves as the
 * handle for later removing it using the `_removeBoundDom` method.
 */
class DomIfFast extends DomIfBase {

  constructor() {
    super();
    this.__instance = null;
    this.__syncInfo = null;
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * @override
   * @return {boolean} True when an instance has been created.
   */
  __hasInstance() {
    return Boolean(this.__instance);
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * @override
   * @return {Array<Node>} Array of child nodes stamped from the template
   * instance.
   */
  __getInstanceNodes() {
    return this.__instance.templateInfo.childNodes;
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * Stamps the template by calling `_stampTemplate` on the `__dataHost` of this
   * element and then inserts the resulting nodes into the given `parentNode`.
   *
   * @override
   * @param {Node} parentNode The parent node to insert the instance into
   * @return {void}
   */
  __createAndInsertInstance(parentNode) {
    const host = this.__dataHost || this;
    if (strictTemplatePolicy) {
      if (!this.__dataHost) {
        throw new Error('strictTemplatePolicy: template owner not trusted');
      }
    }
    // Pre-bind and link the template into the effects system
    const templateInfo = host._bindTemplate(
        /** @type {!HTMLTemplateElement} */ (this.__template), true);
    // Install runEffects hook that prevents running property effects
    // (and any nested template effects) when the `if` is false
    templateInfo.runEffects = (runEffects, changedProps, hasPaths) => {
      let syncInfo = this.__syncInfo;
      if (this.if) {
        // Mix any props that changed while the `if` was false into `changedProps`
        if (syncInfo) {
          // If there were properties received while the `if` was false, it is
          // important to sync the hidden state with the element _first_, so that
          // new bindings to e.g. `textContent` do not get stomped on by
          // pre-hidden values if `_showHideChildren` were to be called later at
          // the next render. Clearing `__invalidProps` here ensures
          // `_showHideChildren`'s call to `__syncHostProperties` no-ops, so
          // that we don't call `runEffects` more often than necessary.
          this.__syncInfo = null;
          this._showHideChildren();
          changedProps = Object.assign(syncInfo.changedProps, changedProps);
        }
        runEffects(changedProps, hasPaths);
      } else {
        // Accumulate any values changed while `if` was false, along with the
        // runEffects method to sync them, so that we can replay them once `if`
        // becomes true
        if (this.__instance) {
          if (!syncInfo) {
            syncInfo = this.__syncInfo = { runEffects, changedProps: {} };
          }
          if (hasPaths) {
            // Store root object of any paths; this will ensure direct bindings
            // like [[obj.foo]] bindings run after a `set('obj.foo', v)`, but
            // note that path notifications like `set('obj.foo.bar', v)` will
            // not propagate. Since batched path notifications are not
            // supported, we cannot simply accumulate path notifications. This
            // is equivalent to the non-fastDomIf case, which stores root(p) in
            // __invalidProps.
            for (const p in changedProps) {
              const rootProp = root(p);
              syncInfo.changedProps[rootProp] = this.__dataHost[rootProp];
            }
          } else {
            Object.assign(syncInfo.changedProps, changedProps);
          }
        }
      }
    };
    // Stamp the template, and set its DocumentFragment to the "instance"
    this.__instance = host._stampTemplate(
        /** @type {!HTMLTemplateElement} */ (this.__template), templateInfo);
    wrap$1(parentNode).insertBefore(this.__instance, this);
  }

  /**
   * Run effects for any properties that changed while the `if` was false.
   *
   * @return {void}
   */
  __syncHostProperties() {
    const syncInfo = this.__syncInfo;
    if (syncInfo) {
      this.__syncInfo = null;
      syncInfo.runEffects(syncInfo.changedProps, false);
    }
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * Remove the instance and any nodes it created.  Uses the `__dataHost`'s
   * runtime `_removeBoundDom` method.
   *
   * @override
   * @return {void}
   */
  __teardownInstance() {
    const host = this.__dataHost || this;
    if (this.__instance) {
      host._removeBoundDom(this.__instance);
      this.__instance = null;
      this.__syncInfo = null;
    }
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * Shows or hides the template instance top level child nodes. For
   * text nodes, `textContent` is removed while "hidden" and replaced when
   * "shown."
   *
   * @override
   * @return {void}
   * @protected
   * @suppress {visibility}
   */
  _showHideChildren() {
    const hidden = this.__hideTemplateChildren__ || !this.if;
    if (this.__instance && Boolean(this.__instance.__hidden) !== hidden) {
      this.__instance.__hidden = hidden;
      showHideChildren(hidden, this.__instance.templateInfo.childNodes);
    }
    if (!hidden) {
      this.__syncHostProperties();
    }
  }
}

/**
 * The "legacy" implementation of `dom-if`, implemented using `Templatizer`.
 *
 * In this version, `this.__instance` is the `TemplateInstance` returned
 * from the templatized constructor.
 */
class DomIfLegacy extends DomIfBase {

  constructor() {
    super();
    this.__ctor = null;
    this.__instance = null;
    this.__invalidProps = null;
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * @override
   * @return {boolean} True when an instance has been created.
   */
  __hasInstance() {
    return Boolean(this.__instance);
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * @override
   * @return {Array<Node>} Array of child nodes stamped from the template
   * instance.
   */
  __getInstanceNodes() {
    return this.__instance.children;
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * Stamps the template by creating a new instance of the templatized
   * constructor (which is created lazily if it does not yet exist), and then
   * inserts its resulting `root` doc fragment into the given `parentNode`.
   *
   * @override
   * @param {Node} parentNode The parent node to insert the instance into
   * @return {void}
   */
  __createAndInsertInstance(parentNode) {
    // Ensure we have an instance constructor
    if (!this.__ctor) {
      this.__ctor = templatize(
          /** @type {!HTMLTemplateElement} */ (this.__template), this, {
            // dom-if templatizer instances require `mutable: true`, as
            // `__syncHostProperties` relies on that behavior to sync objects
            mutableData: true,
            /**
             * @param {string} prop Property to forward
             * @param {*} value Value of property
             * @this {DomIfLegacy}
             */
            forwardHostProp: function(prop, value) {
              if (this.__instance) {
                if (this.if) {
                  this.__instance.forwardHostProp(prop, value);
                } else {
                  // If we have an instance but are squelching host property
                  // forwarding due to if being false, note the invalidated
                  // properties so `__syncHostProperties` can sync them the next
                  // time `if` becomes true
                  this.__invalidProps =
                      this.__invalidProps || Object.create(null);
                  this.__invalidProps[root(prop)] = true;
                }
              }
            }
          });
    }
    // Create and insert the instance
    this.__instance = new this.__ctor();
    wrap$1(parentNode).insertBefore(this.__instance.root, this);
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * Removes the instance and any nodes it created.
   *
   * @override
   * @return {void}
   */
  __teardownInstance() {
    if (this.__instance) {
      let c$ = this.__instance.children;
      if (c$ && c$.length) {
        // use first child parent, for case when dom-if may have been detached
        let parent = wrap$1(c$[0]).parentNode;
        // Instance children may be disconnected from parents when dom-if
        // detaches if a tree was innerHTML'ed
        if (parent) {
          parent = wrap$1(parent);
          for (let i=0, n; (i<c$.length) && (n=c$[i]); i++) {
            parent.removeChild(n);
          }
        }
      }
      this.__invalidProps = null;
      this.__instance = null;
    }
  }

  /**
   * Forwards any properties that changed while the `if` was false into the
   * template instance and flushes it.
   *
   * @return {void}
   */
  __syncHostProperties() {
    let props = this.__invalidProps;
    if (props) {
      this.__invalidProps = null;
      for (let prop in props) {
        this.__instance._setPendingProperty(prop, this.__dataHost[prop]);
      }
      this.__instance._flushProperties();
    }
  }

  /**
   * Implementation of abstract API needed by DomIfBase.
   *
   * Shows or hides the template instance top level child elements. For
   * text nodes, `textContent` is removed while "hidden" and replaced when
   * "shown."
   *
   * @override
   * @protected
   * @return {void}
   * @suppress {visibility}
   */
  _showHideChildren() {
    const hidden = this.__hideTemplateChildren__ || !this.if;
    if (this.__instance && Boolean(this.__instance.__hidden) !== hidden) {
      this.__instance.__hidden = hidden;
      this.__instance._showHideChildren(hidden);
    }
    if (!hidden) {
      this.__syncHostProperties();
    }
  }
}

/**
 * The `<dom-if>` element will stamp a light-dom `<template>` child when
 * the `if` property becomes truthy, and the template can use Polymer
 * data-binding and declarative event features when used in the context of
 * a Polymer element's template.
 *
 * When `if` becomes falsy, the stamped content is hidden but not
 * removed from dom. When `if` subsequently becomes truthy again, the content
 * is simply re-shown. This approach is used due to its favorable performance
 * characteristics: the expense of creating template content is paid only
 * once and lazily.
 *
 * Set the `restamp` property to true to force the stamped content to be
 * created / destroyed when the `if` condition changes.
 *
 * @customElement
 * @polymer
 * @extends DomIfBase
 * @constructor
 * @summary Custom element that conditionally stamps and hides or removes
 *   template content based on a boolean flag.
 */
const DomIf = fastDomIf ? DomIfFast : DomIfLegacy;

customElements.define(DomIf.is, DomIf);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/**
 * Element mixin for recording dynamic associations between item paths in a
 * master `items` array and a `selected` array such that path changes to the
 * master array (at the host) element or elsewhere via data-binding) are
 * correctly propagated to items in the selected array and vice-versa.
 *
 * The `items` property accepts an array of user data, and via the
 * `select(item)` and `deselect(item)` API, updates the `selected` property
 * which may be bound to other parts of the application, and any changes to
 * sub-fields of `selected` item(s) will be kept in sync with items in the
 * `items` array.  When `multi` is false, `selected` is a property
 * representing the last selected item.  When `multi` is true, `selected`
 * is an array of multiply selected items.
 *
 * @polymer
 * @mixinFunction
 * @appliesMixin ElementMixin
 * @summary Element mixin for recording dynamic associations between item paths in a
 * master `items` array and a `selected` array
 */
let ArraySelectorMixin = dedupingMixin(superClass => {

  /**
   * @constructor
   * @implements {Polymer_ElementMixin}
   * @private
   */
  let elementBase = ElementMixin(superClass);

  /**
   * @polymer
   * @mixinClass
   * @implements {Polymer_ArraySelectorMixin}
   * @unrestricted
   */
  class ArraySelectorMixin extends elementBase {

    static get properties() {
      return {

        /**
         * An array containing items from which selection will be made.
         */
        items: {
          type: Array,
        },

        /**
         * When `true`, multiple items may be selected at once (in this case,
         * `selected` is an array of currently selected items).  When `false`,
         * only one item may be selected at a time.
         */
        multi: {
          type: Boolean,
          value: false,
        },

        /**
         * When `multi` is true, this is an array that contains any selected.
         * When `multi` is false, this is the currently selected item, or `null`
         * if no item is selected.
         * @type {?Object|?Array<!Object>}
         */
        selected: {type: Object, notify: true},

        /**
         * When `multi` is false, this is the currently selected item, or `null`
         * if no item is selected.
         * @type {?Object}
         */
        selectedItem: {type: Object, notify: true},

        /**
         * When `true`, calling `select` on an item that is already selected
         * will deselect the item.
         */
        toggle: {type: Boolean, value: false}

      };
    }

    static get observers() {
      return ['__updateSelection(multi, items.*)'];
    }

    constructor() {
      super();
      this.__lastItems = null;
      this.__lastMulti = null;
      this.__selectedMap = null;
    }

    __updateSelection(multi, itemsInfo) {
      let path = itemsInfo.path;
      if (path == JSCompiler_renameProperty('items', this)) {
        // Case 1 - items array changed, so diff against previous array and
        // deselect any removed items and adjust selected indices
        let newItems = itemsInfo.base || [];
        let lastItems = this.__lastItems;
        let lastMulti = this.__lastMulti;
        if (multi !== lastMulti) {
          this.clearSelection();
        }
        if (lastItems) {
          let splices = calculateSplices(newItems, lastItems);
          this.__applySplices(splices);
        }
        this.__lastItems = newItems;
        this.__lastMulti = multi;
      } else if (itemsInfo.path == `${JSCompiler_renameProperty('items', this)}.splices`) {
        // Case 2 - got specific splice information describing the array mutation:
        // deselect any removed items and adjust selected indices
        this.__applySplices(itemsInfo.value.indexSplices);
      } else {
        // Case 3 - an array element was changed, so deselect the previous
        // item for that index if it was previously selected
        let part = path.slice(`${JSCompiler_renameProperty('items', this)}.`.length);
        let idx = parseInt(part, 10);
        if ((part.indexOf('.') < 0) && part == idx) {
          this.__deselectChangedIdx(idx);
        }
      }
    }

    __applySplices(splices) {
      let selected = this.__selectedMap;
      // Adjust selected indices and mark removals
      for (let i=0; i<splices.length; i++) {
        let s = splices[i];
        selected.forEach((idx, item) => {
          if (idx < s.index) ; else if (idx >= s.index + s.removed.length) {
            // adjust index
            selected.set(item, idx + s.addedCount - s.removed.length);
          } else {
            // remove index
            selected.set(item, -1);
          }
        });
        for (let j=0; j<s.addedCount; j++) {
          let idx = s.index + j;
          if (selected.has(this.items[idx])) {
            selected.set(this.items[idx], idx);
          }
        }
      }
      // Update linked paths
      this.__updateLinks();
      // Remove selected items that were removed from the items array
      let sidx = 0;
      selected.forEach((idx, item) => {
        if (idx < 0) {
          if (this.multi) {
            this.splice(JSCompiler_renameProperty('selected', this), sidx, 1);
          } else {
            this.selected = this.selectedItem = null;
          }
          selected.delete(item);
        } else {
          sidx++;
        }
      });
    }

    __updateLinks() {
      this.__dataLinkedPaths = {};
      if (this.multi) {
        let sidx = 0;
        this.__selectedMap.forEach(idx => {
          if (idx >= 0) {
            this.linkPaths(
                `${JSCompiler_renameProperty('items', this)}.${idx}`,
                `${JSCompiler_renameProperty('selected', this)}.${sidx++}`);
          }
        });
      } else {
        this.__selectedMap.forEach(idx => {
          this.linkPaths(
              JSCompiler_renameProperty('selected', this),
              `${JSCompiler_renameProperty('items', this)}.${idx}`);
          this.linkPaths(
              JSCompiler_renameProperty('selectedItem', this),
              `${JSCompiler_renameProperty('items', this)}.${idx}`);
        });
      }
    }

    /**
     * Clears the selection state.
     * @override
     * @return {void}
     */
    clearSelection() {
      // Unbind previous selection
      this.__dataLinkedPaths = {};
      // The selected map stores 3 pieces of information:
      // key: items array object
      // value: items array index
      // order: selected array index
      this.__selectedMap = new Map();
      // Initialize selection
      this.selected = this.multi ? [] : null;
      this.selectedItem = null;
    }

    /**
     * Returns whether the item is currently selected.
     *
     * @override
     * @param {*} item Item from `items` array to test
     * @return {boolean} Whether the item is selected
     */
    isSelected(item) {
      return this.__selectedMap.has(item);
    }

    /**
     * Returns whether the item is currently selected.
     *
     * @override
     * @param {number} idx Index from `items` array to test
     * @return {boolean} Whether the item is selected
     */
    isIndexSelected(idx) {
      return this.isSelected(this.items[idx]);
    }

    __deselectChangedIdx(idx) {
      let sidx = this.__selectedIndexForItemIndex(idx);
      if (sidx >= 0) {
        let i = 0;
        this.__selectedMap.forEach((idx, item) => {
          if (sidx == i++) {
            this.deselect(item);
          }
        });
      }
    }

    __selectedIndexForItemIndex(idx) {
      let selected = this.__dataLinkedPaths[`${JSCompiler_renameProperty('items', this)}.${idx}`];
      if (selected) {
        return parseInt(selected.slice(`${JSCompiler_renameProperty('selected', this)}.`.length), 10);
      }
    }

    /**
     * Deselects the given item if it is already selected.
     *
     * @override
     * @param {*} item Item from `items` array to deselect
     * @return {void}
     */
    deselect(item) {
      let idx = this.__selectedMap.get(item);
      if (idx >= 0) {
        this.__selectedMap.delete(item);
        let sidx;
        if (this.multi) {
          sidx = this.__selectedIndexForItemIndex(idx);
        }
        this.__updateLinks();
        if (this.multi) {
          this.splice(JSCompiler_renameProperty('selected', this), sidx, 1);
        } else {
          this.selected = this.selectedItem = null;
        }
      }
    }

    /**
     * Deselects the given index if it is already selected.
     *
     * @override
     * @param {number} idx Index from `items` array to deselect
     * @return {void}
     */
    deselectIndex(idx) {
      this.deselect(this.items[idx]);
    }

    /**
     * Selects the given item.  When `toggle` is true, this will automatically
     * deselect the item if already selected.
     *
     * @override
     * @param {*} item Item from `items` array to select
     * @return {void}
     */
    select(item) {
      this.selectIndex(this.items.indexOf(item));
    }

    /**
     * Selects the given index.  When `toggle` is true, this will automatically
     * deselect the item if already selected.
     *
     * @override
     * @param {number} idx Index from `items` array to select
     * @return {void}
     */
    selectIndex(idx) {
      let item = this.items[idx];
      if (!this.isSelected(item)) {
        if (!this.multi) {
          this.__selectedMap.clear();
        }
        this.__selectedMap.set(item, idx);
        this.__updateLinks();
        if (this.multi) {
          this.push(JSCompiler_renameProperty('selected', this), item);
        } else {
          this.selected = this.selectedItem = item;
        }
      } else if (this.toggle) {
        this.deselectIndex(idx);
      }
    }

  }

  return ArraySelectorMixin;

});

/**
 * @constructor
 * @extends {PolymerElement}
 * @implements {Polymer_ArraySelectorMixin}
 * @private
 */
let baseArraySelector = ArraySelectorMixin(PolymerElement);

/**
 * Element implementing the `ArraySelector` mixin, which records
 * dynamic associations between item paths in a master `items` array and a
 * `selected` array such that path changes to the master array (at the host)
 * element or elsewhere via data-binding) are correctly propagated to items
 * in the selected array and vice-versa.
 *
 * The `items` property accepts an array of user data, and via the
 * `select(item)` and `deselect(item)` API, updates the `selected` property
 * which may be bound to other parts of the application, and any changes to
 * sub-fields of `selected` item(s) will be kept in sync with items in the
 * `items` array.  When `multi` is false, `selected` is a property
 * representing the last selected item.  When `multi` is true, `selected`
 * is an array of multiply selected items.
 *
 * Example:
 *
 * ```js
 * import {PolymerElement} from '@polymer/polymer';
 * import '@polymer/polymer/lib/elements/array-selector.js';
 *
 * class EmployeeList extends PolymerElement {
 *   static get _template() {
 *     return html`
 *         <div> Employee list: </div>
 *         <dom-repeat id="employeeList" items="{{employees}}">
 *           <template>
 *             <div>First name: <span>{{item.first}}</span></div>
 *               <div>Last name: <span>{{item.last}}</span></div>
 *               <button on-click="toggleSelection">Select</button>
 *           </template>
 *         </dom-repeat>
 *
 *         <array-selector id="selector"
 *                         items="{{employees}}"
 *                         selected="{{selected}}"
 *                         multi toggle></array-selector>
 *
 *         <div> Selected employees: </div>
 *         <dom-repeat items="{{selected}}">
 *           <template>
 *             <div>First name: <span>{{item.first}}</span></div>
 *             <div>Last name: <span>{{item.last}}</span></div>
 *           </template>
 *         </dom-repeat>`;
 *   }
 *   static get is() { return 'employee-list'; }
 *   static get properties() {
 *     return {
 *       employees: {
 *         value() {
 *           return [
 *             {first: 'Bob', last: 'Smith'},
 *             {first: 'Sally', last: 'Johnson'},
 *             ...
 *           ];
 *         }
 *       }
 *     };
 *   }
 *   toggleSelection(e) {
 *     const item = this.$.employeeList.itemForElement(e.target);
 *     this.$.selector.select(item);
 *   }
 * }
 * ```
 *
 * @polymer
 * @customElement
 * @extends {baseArraySelector}
 * @appliesMixin ArraySelectorMixin
 * @summary Custom element that links paths between an input `items` array and
 *   an output `selected` item or array based on calls to its selection API.
 */
class ArraySelector extends baseArraySelector {
  // Not needed to find template; can be removed once the analyzer
  // can find the tag name from customElements.define call
  static get is() { return 'array-selector'; }
  static get template() { return null; }
}
customElements.define(ArraySelector.is, ArraySelector);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const customStyleInterface = new CustomStyleInterface();

if (!window.ShadyCSS) {
  window.ShadyCSS = {
    /**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     * @param {string=} elementExtends
     */
    prepareTemplate(template, elementName, elementExtends) {}, // eslint-disable-line no-unused-vars

    /**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     */
    prepareTemplateDom(template, elementName) {}, // eslint-disable-line no-unused-vars

    /**
     * @param {!HTMLTemplateElement} template
     * @param {string} elementName
     * @param {string=} elementExtends
     */
    prepareTemplateStyles(template, elementName, elementExtends) {}, // eslint-disable-line no-unused-vars

    /**
     * @param {Element} element
     * @param {Object=} properties
     */
    styleSubtree(element, properties) {
      customStyleInterface.processStyles();
      updateNativeProperties(element, properties);
    },

    /**
     * @param {Element} element
     */
    styleElement(element) { // eslint-disable-line no-unused-vars
      customStyleInterface.processStyles();
    },

    /**
     * @param {Object=} properties
     */
    styleDocument(properties) {
      customStyleInterface.processStyles();
      updateNativeProperties(document.body, properties);
    },

    /**
     * @param {Element} element
     * @param {string} property
     * @return {string}
     */
    getComputedStyleValue(element, property) {
      return getComputedStyleValue(element, property);
    },

    flushCustomStyles() {},
    nativeCss: nativeCssVariables,
    nativeShadow: nativeShadow,
    cssBuild: cssBuild,
    disableRuntime: disableRuntime,
  };
}

window.ShadyCSS.CustomStyleInterface = customStyleInterface;

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const attr = 'include';

const CustomStyleInterface$1 = window.ShadyCSS.CustomStyleInterface;

/**
 * Custom element for defining styles in the main document that can take
 * advantage of [shady DOM](https://github.com/webcomponents/shadycss) shims
 * for style encapsulation, custom properties, and custom mixins.
 *
 * - Document styles defined in a `<custom-style>` are shimmed to ensure they
 *   do not leak into local DOM when running on browsers without native
 *   Shadow DOM.
 * - Custom properties can be defined in a `<custom-style>`. Use the `html` selector
 *   to define custom properties that apply to all custom elements.
 * - Custom mixins can be defined in a `<custom-style>`, if you import the optional
 *   [apply shim](https://github.com/webcomponents/shadycss#about-applyshim)
 *   (`shadycss/apply-shim.html`).
 *
 * To use:
 *
 * - Import `custom-style.html`.
 * - Place a `<custom-style>` element in the main document, wrapping an inline `<style>` tag that
 *   contains the CSS rules you want to shim.
 *
 * For example:
 *
 * ```html
 * <!-- import apply shim--only required if using mixins -->
 * <link rel="import" href="bower_components/shadycss/apply-shim.html">
 * <!-- import custom-style element -->
 * <link rel="import" href="bower_components/polymer/lib/elements/custom-style.html">
 *
 * <custom-style>
 *   <style>
 *     html {
 *       --custom-color: blue;
 *       --custom-mixin: {
 *         font-weight: bold;
 *         color: red;
 *       };
 *     }
 *   </style>
 * </custom-style>
 * ```
 *
 * @customElement
 * @extends HTMLElement
 * @summary Custom element for defining styles in the main document that can
 *   take advantage of Polymer's style scoping and custom properties shims.
 */
class CustomStyle extends HTMLElement {
  constructor() {
    super();
    this._style = null;
    CustomStyleInterface$1.addCustomStyle(this);
  }
  /**
   * Returns the light-DOM `<style>` child this element wraps.  Upon first
   * call any style modules referenced via the `include` attribute will be
   * concatenated to this element's `<style>`.
   *
   * @export
   * @return {HTMLStyleElement} This element's light-DOM `<style>`
   */
  getStyle() {
    if (this._style) {
      return this._style;
    }
    const style = /** @type {HTMLStyleElement} */(this.querySelector('style'));
    if (!style) {
      return null;
    }
    this._style = style;
    const include = style.getAttribute(attr);
    if (include) {
      style.removeAttribute(attr);
      /** @suppress {deprecated} */
      style.textContent = cssFromModules(include) + style.textContent;
    }
    /*
    HTML Imports styling the main document are deprecated in Chrome
    https://crbug.com/523952

    If this element is not in the main document, then it must be in an HTML Import document.
    In that case, move the custom style to the main document.

    The ordering of `<custom-style>` should stay the same as when loaded by HTML Imports, but there may be odd
    cases of ordering w.r.t the main document styles.
    */
    if (this.ownerDocument !== window.document) {
      window.document.head.appendChild(this);
    }
    return this._style;
  }
}

window.customElements.define('custom-style', CustomStyle);

/**
@license
Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// bc
const Base = LegacyElementMixin(HTMLElement).prototype;

/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/

class IronMeta {
  /**
   * @param {{
   *   type: (string|null|undefined),
   *   key: (string|null|undefined),
   *   value: *,
   * }=} options
   */
  constructor(options) {
    IronMeta[' '](options);

    /** @type {string} */
    this.type = (options && options.type) || 'default';
    /** @type {string|null|undefined} */
    this.key = options && options.key;
    if (options && 'value' in options) {
      /** @type {*} */
      this.value = options.value;
    }
  }

  /** @return {*} */
  get value() {
    var type = this.type;
    var key = this.key;

    if (type && key) {
      return IronMeta.types[type] && IronMeta.types[type][key];
    }
  }

  /** @param {*} value */
  set value(value) {
    var type = this.type;
    var key = this.key;

    if (type && key) {
      type = IronMeta.types[type] = IronMeta.types[type] || {};
      if (value == null) {
        delete type[key];
      } else {
        type[key] = value;
      }
    }
  }

  /** @return {!Array<*>} */
  get list() {
    var type = this.type;

    if (type) {
      var items = IronMeta.types[this.type];
      if (!items) {
        return [];
      }

      return Object.keys(items).map(function(key) {
        return metaDatas[this.type][key];
      }, this);
    }
  }

  /**
   * @param {string} key
   * @return {*}
   */
  byKey(key) {
    this.key = key;
    return this.value;
  }
}
// This function is used to convince Closure not to remove constructor calls
// for instances that are not held anywhere. For example, when
// `new IronMeta({...})` is used only for the side effect of adding a value.
IronMeta[' '] = function() {};

IronMeta.types = {};

var metaDatas = IronMeta.types;

/**
`iron-meta` is a generic element you can use for sharing information across the
DOM tree. It uses [monostate pattern](http://c2.com/cgi/wiki?MonostatePattern)
such that any instance of iron-meta has access to the shared information. You
can use `iron-meta` to share whatever you want (or create an extension [like
x-meta] for enhancements).

The `iron-meta` instances containing your actual data can be loaded in an
import, or constructed in any way you see fit. The only requirement is that you
create them before you try to access them.

Examples:

If I create an instance like this:

    <iron-meta key="info" value="foo/bar"></iron-meta>

Note that value="foo/bar" is the metadata I've defined. I could define more
attributes or use child nodes to define additional metadata.

Now I can access that element (and it's metadata) from any iron-meta instance
via the byKey method, e.g.

    meta.byKey('info');

Pure imperative form would be like:

    document.createElement('iron-meta').byKey('info');

Or, in a Polymer element, you can include a meta in your template:

    <iron-meta id="meta"></iron-meta>
    ...
    this.$.meta.byKey('info');

@group Iron Elements
@demo demo/index.html
@element iron-meta
*/
Polymer({

  is: 'iron-meta',

  properties: {

    /**
     * The type of meta-data.  All meta-data of the same type is stored
     * together.
     * @type {string}
     */
    type: {
      type: String,
      value: 'default',
    },

    /**
     * The key used to store `value` under the `type` namespace.
     * @type {?string}
     */
    key: {
      type: String,
    },

    /**
     * The meta-data to store or retrieve.
     * @type {*}
     */
    value: {
      type: String,
      notify: true,
    },

    /**
     * If true, `value` is set to the iron-meta instance itself.
     */
    self: {type: Boolean, observer: '_selfChanged'},

    __meta: {type: Boolean, computed: '__computeMeta(type, key, value)'}
  },

  hostAttributes: {hidden: true},

  __computeMeta: function(type, key, value) {
    var meta = new IronMeta({type: type, key: key});

    if (value !== undefined && value !== meta.value) {
      meta.value = value;
    } else if (this.value !== meta.value) {
      this.value = meta.value;
    }

    return meta;
  },

  get list() {
    return this.__meta && this.__meta.list;
  },

  _selfChanged: function(self) {
    if (self) {
      this.value = this;
    }
  },

  /**
   * Retrieves meta data value by key.
   *
   * @method byKey
   * @param {string} key The key of the meta-data to be returned.
   * @return {*}
   */
  byKey: function(key) {
    return new IronMeta({type: this.type, key: key}).value;
  }
});

var styles = css`
:host {
  display: block;
  color: var(--api-summary-color, inherit);
}

.api-title {
  margin: 12px 0;
}

arc-marked {
  padding: 0;
}

.marked-description {
  margin: 24px 0;
}

.markdown-body {
  margin-bottom: 28px;
}

:host([narrow]) h1 {
  font-size: var(--api-summary-title-narrow-font-size, 1.2rem);
  margin: 0;
}

.url-area {
  display: flex;
  flex-direction: column;
  font-family: var(--arc-font-code-family);

  margin-bottom: 40px;
  margin-top: 20px;
  background-color: var(--code-background-color);
  color: var(--code-color);
  padding: 8px;
  border-radius: var(--api-endpoint-documentation-url-border-radius, 4px);
}

.url-label {
  font-size: 0.75rem;
  font-weight: 700;
}

.url-value {
  font-size: var(--api-endpoint-documentation-url-font-size, 1.07rem);
  word-break: break-all;
}

.method-value {
  text-transform: uppercase;
  white-space: nowrap;
}

label.section {
  font-weight: var(--arc-font-subhead-font-weight);
  line-height: var(--arc-font-subhead-line-height);
  /* font-size: 18px; */
  margin-top: 20px;
  display: block;
}

a {
  color: var(--link-color);
}

a:hover {
  color: var(--link-hover-color);
}

.chip {
  display: inline-block;
  white-space: nowrap;
  padding: 2px 4px;
  margin-right: 8px;
  background-color: var(--api-summary-chip-background-color, #f0f0f0);
  color: var(--api-summary-chip-color, #616161);
  border-radius: var(--api-summary-chip-border-radius, 2px);
}

.app-link {
  color: var(--link-color);
}

.link-padding {
  margin-left: 8px;
}

.inline-description {
  padding: 0;
  margin: 0;
}

.docs-section {
  margin-bottom: 40px;
}

.separator {
  background-color: var(--api-summary-separator-color, rgba(0, 0, 0, 0.12));
  height: 1px;
  margin: 40px 0;
}

.endpoint-item {
  margin-bottom: 32px;
}

.method-label {
  margin-right: 8px;
  margin-bottom: 8px;
  text-decoration: none;
}

.method-label:hover,
.method-label:focus {
  text-decoration: underline;
}

.endpoint-path {
  display: block;
  text-decoration: none;
  cursor: pointer;
  margin-bottom: 4px;
  display: inline-block;
  font-weight: 500;
  color: var(--link-color, #0277BD);
  margin: 4px 0;
  word-break: break-all;
}

.endpoint-path:hover,
.endpoint-path:focus {
  text-decoration: underline;
  color: var(--link-color, #0277BD);
}

.toc .section {
  margin-bottom: 24px;
}

.section.endpoints-title {
  font-weight: 500;
}

.endpoint-path-name {
  word-break: break-all;
  margin: 8px 0;
}

.servers .servers-label {
  font-size: 0.75rem;
  font-weight: 700;
  margin: 0.8em 0 0.2em 0;
}
`;

/**
 * `api-summary`
 *
 * A summary view for an API base on AMF data model
 *
 * ## Styling
 *
 * `<api-summary>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-summary` | Mixin applied to this elment | `{}`
 * `--api-summary-color` | Color of text labels | ``
 * `--api-summary-url-font-size` | Font size of endpoin URL | `16px`
 * `--api-summary-url-background-color` | Background color of the URL section | `#424242`
 * `--api-summary-url-font-color` | Font color of the URL area | `#fff`
 * `--api-summary-separator-color` | Color of section separator | `rgba(0, 0, 0, 0.12)`
 *
 * @customElement
 * @demo demo/index.html
 * @appliesMixin AmfHelperMixin
 */
class ApiSummary extends AmfHelperMixin(LitElement) {
  get styles() {
    return [
      markdownStyles,
      labelStyles,
      styles,
    ];
  }

  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: { type: String },
      /**
       * A property to set to override AMF's model base URI information.
       * When this property is set, the `endpointUri` property is recalculated.
       */
      baseUri: { type: String, value: '' },
      /**
       * API title header level in value range from 1 to 6.
       * This is made for accessibility. It the component is used in a context
       * where headers order matters then this property is to be set to
       * arrange headers in the right order.
       *
       * @default 2
       */
      titleLevel: { type: String },

      _providerName: { type: String },
      _providerEmail: { type: String },
      _providerUrl: { type: String },
      _licenseName: { type: String },
      _licenseUrl: { type: String },
      _endpoints: { type: Array },
      _termsOfService: { type: String },
      _version: { type: String },
      _apiTitle: { type: String },
      _description: { type: String },
      _protocols: { type: Array }
    };
  }

  // get baseUri() {
  //   return this._baseUri;
  // }
  //
  // set baseUri(value) {
  //   const old = this._baseUri;
  //   /* istanbul ignore if */
  //   if (old === value) {
  //     return;
  //   }
  //   this._baseUri = value;
  //   // this._apiBaseUri = this._computeBaseUri(this.server, value, this.protocols);
  //   this.requestUpdate('baseUri', old);
  // }

  // get _protocols() {
  //   return this.__protocols;
  // }
  //
  // set _protocols(value) {
  //   const old = this.__protocols;
  //   /* istanbul ignore if */
  //   if (old === value) {
  //     return;
  //   }
  //   this.__protocols = value;
  //   this._apiBaseUri = this._computeBaseUri(this.server, this.baseUri, value);
  //   this.requestUpdate('_protocols', old);
  // }

  constructor() {
    super();
    this.titleLevel = 2;
  }

  __amfChanged() {
    if (this.__amfProcessingDebouncer) {
      return;
    }
    this.__amfProcessingDebouncer = true;
    setTimeout(() => this._processModelChange());
  }

  _processModelChange() {
    this.__amfProcessingDebouncer = false;
    const { amf } = this;
    if (!amf) {
      return;
    }

    this.servers = this._getServers({});
    const webApi = this.webApi = this._computeWebApi(amf);
    this._protocols = this._computeProtocols(amf);

    this._webApiChanged(webApi);
  }

  _webApiChanged(webApi) {
    if (!webApi) {
      return;
    }

    this._apiTitle = this._computeApiTitle(webApi);
    this._description = this._computeDescription(webApi);
    this._version = this._computeVersion(webApi);
    this._termsOfService = this._computeToS(webApi);
    this._endpoints = this._computeEndpoints(webApi);

    const provider = this._computeProvider(webApi);
    this._providerName = this._computeName(provider);
    this._providerEmail = this._computeEmail(provider);
    this._providerUrl = this._computeUrl(provider);

    const license = this._computeLicense(webApi);
    this._licenseName = this._computeName(license);
    this._licenseUrl = this._computeUrl(license);
  }

  /**
   * Computes value of `apiTitle` property.
   *
   * @param {Object} shape Shape of AMF model.
   * @return {String|undefined} Description if defined.
   */
  _computeApiTitle(shape) {
    return this._getValue(shape, this.ns.aml.vocabularies.core.name);
  }
  /**
   * Computes value for `version` property
   * @param {Object} webApi AMF's WebApi shape
   * @return {String|undefined}
   */
  _computeVersion(webApi) {
    return this._getValue(webApi, this.ns.aml.vocabularies.core.version);
  }
  /**
   * Computes API's URI based on `amf` and `baseUri` property.
   *
   * @param {Object} server Server model of AMF API.
   * @param {?String} baseUri Current value of `baseUri` property
   * @param {?Array<String>} protocols List of supported protocols
   * @return {String} Endpoint's URI
   */
  _computeBaseUri(server, baseUri, protocols) {
    let base = this._getBaseUri(baseUri, server, protocols);
    if (base && base[base.length - 1] === '/') {
      base = base.substr(0, base.length - 1);
    }
    return base;
  }
  /**
   * Computes information about provider of the API.
   *
   * @param {Object} webApi WebApi shape
   * @return {Object|undefined}
   */
  _computeProvider(webApi) {
    if (!webApi) {
      return;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.provider);
    let data = this._ensureArray(webApi[key]);
    if (!data) {
      return;
    }
    data = data[0];
    if (data instanceof Array) {
      data = data[0];
    }
    return data;
  }

  _computeName(provider) {
    return this._getValue(provider, this.ns.aml.vocabularies.core.name);
  }

  _computeEmail(provider) {
    return this._getValue(provider, this.ns.aml.vocabularies.core.email);
  }

  _computeUrl(provider) {
    let value = this._getValue(provider, this.ns.aml.vocabularies.core.url);
    if (!value && provider) {
      const key = this._getAmfKey(this.ns.aml.vocabularies.core.url);
      const data = provider[key];
      if (data) {
        value = data instanceof Array ? data[0]['@id'] : data['@id'];
      }
    }
    return value;
  }

  _computeToS(webApi) {
    return this._getValue(webApi, this.ns.aml.vocabularies.core.termsOfService);
  }

  _computeLicense(webApi) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.license);
    const data = webApi && webApi[key];
    if (!data) {
      return;
    }
    return data instanceof Array ? data[0] : data;
  }
  /**
   * Computes view model for endpoints list.
   * @param {Object} webApi Web API model
   * @return {Array<Object>|undefined}
   */
  _computeEndpoints(webApi) {
    if (!webApi) {
      return;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.endpoint);
    const endpoints = this._ensureArray(webApi[key]);
    if (!endpoints || !endpoints.length) {
      return;
    }
    return endpoints.map((item) => {
      const result = {
        name: this._getValue(item, this.ns.aml.vocabularies.core.name),
        path: this._getValue(item, this.ns.aml.vocabularies.apiContract.path),
        id: item['@id'],
        ops: this._endpointOperations(item)
      };
      return result;
    });
  }
  /**
   * Computes a view model for supported operations for an endpoint.
   * @param {Object} endpoint Endpoint model.
   * @return {Array<Object>|unbdefined}
   */
  _endpointOperations(endpoint) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.supportedOperation);
    const so = this._ensureArray(endpoint[key]);
    if (!so || !so.length) {
      return;
    }
    return so.map((item) => {
      return {
        id: item['@id'],
        method: this._getValue(item, this.ns.aml.vocabularies.apiContract.method)
      };
    });
  }

  _navigateItem(e) {
    e.preventDefault();
    const data = e.composedPath()[0].dataset;
    if (!data.id || !data.shapeType) {
      return;
    }
    const ev = new CustomEvent('api-navigation-selection-changed', {
      bubbles: true,
      composed: true,
      detail: {
        selected: data.id,
        type: data.shapeType
      }
    });
    this.dispatchEvent(ev);
  }

  _apiHandler(e) {
    this.amf = e.target.api;
  }

  render() {
    const { aware } = this;
    return html`<style>${this.styles}</style>
      ${aware ?
        html`<raml-aware @api-changed="${this._apiHandler}" .scope="${aware}"></raml-aware>` :
        ''}

      <div>
        ${this._titleTemplate()}
        ${this._versionTemplate()}
        ${this._descriptionTemplate()}
        ${this._serversTemplate()}
        ${this._protocolsTemplate()}
        ${this._contactInfoTemplate()}
        ${this._licenseTemplate()}
        ${this._termsOfServiceTemplate()}
      </div>

      ${this._endpointsTemplate()}
    `;
  }

  _titleTemplate() {
    const { _apiTitle, titleLevel } = this;
    if (!_apiTitle) {
      return '';
    }
    return html`
    <div class="api-title" role="heading" aria-level="${titleLevel}">
    <label>API title:</label>
    <span>${_apiTitle}</span>
    </div>`;
  }

  _versionTemplate() {
    const { _version } = this;
    if (!_version) {
      return '';
    }
    return html`
    <p class="inline-description version">
      <label>Version:</label>
      <span>${_version}</span>
    </p>`;
  }

  _descriptionTemplate() {
    const { _description } = this;
    if (!_description) {
      return '';
    }
    return html`
    <div role="region" class="marked-description">
      <arc-marked .markdown="${_description}" sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>`;
  }

  /**
   * @param {Object} server Server definition
   * @return {TemplateResult|String} A template for a server, servers, or no servers
   * whether it's defined in the main API definition or not.
   */
  _serversTemplate() {
    const { servers } = this;
    if (!servers || !servers.length) {
      return '';
    }
    if (servers.length === 1) {
      return this._baseUriTemplate(servers[0]);
    }

    return html`
    <div class="servers" slot="markdown-html">
      <p class="servers-label">API servers</p>
      <ul class="server-lists">
      ${servers.map((server) => this._serverListTemplate(server))}
      </ul>
    </div>`;
  }

  /**
   * @param {Object} server Server definition
   * @return {TemplateResult} Template for a server list items when there is more
   * than one server.
   */
  _serverListTemplate(server) {
    const { baseUri, protocols } = this;
    const uri = this._computeBaseUri(server, baseUri, protocols);
    return html`<li>${uri}</li>`;
  }

  /**
   * @param {Object} server Server definition
   * @return {TemplateResult} A template for a single server in the main API definition
   */
  _baseUriTemplate(server) {
    const { baseUri, protocols } = this;
    const uri = this._computeBaseUri(server, baseUri, protocols);
    return html`
    <div class="url-area">
      <span class="url-label">API base URI</span>
      <div class="url-value">${uri}</div>
    </div>`;
  }

  _protocolsTemplate() {
    const { _protocols } = this;
    if (!_protocols || !_protocols.length) {
      return '';
    }
    const result = _protocols.map((item) => html`<span class="chip">${item}</span>`);

    return html`
    <label class="section">Supported protocols</label>
    <div class="protocol-chips">${result}</div>`;
  }

  _contactInfoTemplate() {
    const { _providerName, _providerEmail, _providerUrl } = this;
    if (!_providerName) {
      return '';
    }
    return html`
    <section role="contentinfo" class="docs-section">
      <label class="section">Contact information</label>
      <p class="inline-description">
        <span class="provider-name">${_providerName}</span>
        ${_providerEmail ? html`<a
            class="app-link link-padding provider-email"
            href="mailto:${_providerEmail}">${_providerEmail}</a>` : ''}
      </p>
      ${_providerUrl ? html([`
        <p class="inline-description">
          ${this._sanitizeHTML(
            `<a href="${_providerUrl}" target="_blank" class="app-link provider-url">${_providerUrl}</a>`,
          )}
        </p>`]) : ''}
    </section>`;
  }

  _licenseTemplate() {
    const { _licenseUrl, _licenseName } = this;
    if (!_licenseUrl || !_licenseName) {
      return '';
    }
    return html([`
    <section role="region" aria-labelledby="licenseLabel" class="docs-section">
      <label class="section" id="licenseLabel">License</label>
      <p class="inline-description">
        ${this._sanitizeHTML(
          `<a href="${_licenseUrl}" target="_blank" class="app-link">${_licenseName}</a>`,
        )}
      </p>
    </section>`]);
  }

  _termsOfServiceTemplate() {
    const { _termsOfService } = this;
    if (!_termsOfService || !_termsOfService.length) {
      return '';
    }
    return html`
    <section role="region" aria-labelledby="tocLabel" class="docs-section">
      <label class="section" id="tocLabel">Terms of service</label>
      <arc-marked .markdown="${_termsOfService}" sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </section>`;
  }

  _endpointsTemplate() {
    const { _endpoints } = this;
    if (!_endpoints || !_endpoints.length) {
      return;
    }
    const result = _endpoints.map((item) => this._endpointTemplate(item));
    return html`
    <div class="separator"></div>
    <div class="toc">
      <label class="section endpoints-title">API endpoints</label>
      ${result}
    </div>
    `;
  }

  _endpointTemplate(item) {
    const ops = item.ops && item.ops.length ? item.ops.map((op) => this._methodTemplate(op, item)) : '';
    return html`
    <div class="endpoint-item" @click="${this._navigateItem}">
      ${item.name ? this._endpointNameTemplate(item) : this._endpointPathTemplate(item)}
      <div class="endpoint-header">
        ${ops}
      </div>
    </div>`;
  }

  _endpointPathTemplate(item) {
    return html`
    <a
      class="endpoint-path"
      href="#${item.path}"
      data-id="${item.id}"
      data-shape-type="endpoint"
      title="Open endpoint documentation">${item.path}</a>
    `;
  }

  _endpointNameTemplate(item) {
    if (!item.name) {
      return '';
    }
    return html`
    <a
      class="endpoint-path"
      href="#${item.path}"
      data-id="${item.id}"
      data-shape-type="endpoint"
      title="Open endpoint documentation">${item.name}</a>
    <p class="endpoint-path-name">${item.path}</p>
    `;
  }

  _methodTemplate(item, endpoint) {
    return html`
      <a
        href="#${endpoint.path + '/' + item.method}"
        class="method-label"
        data-method="${item.method}"
        data-id="${item.id}"
        data-shape-type="method"
        title="Open method documentation">${item.method}</a>
    `;
  }

  _sanitizeHTML(HTML) {
    const result = purify.sanitize(HTML, { ADD_ATTR: ['target'] });

    if (typeof result === 'string') {
      return result;
    }

    return result.toString();
  }
}

// import { ApiDocumentation } from '@api-components/api-documentation/api-documentation.js';

function replaceComponentsTags (strings) {
  const tags = ['API title:'];
  return strings.map(str => {
    tags.forEach(tag => {
      str = str.replaceAll(tag, `x-${tag}`);
    });
    return str
  })
}

class XApiSummary extends ApiSummary {
  _titleTemplate() {
    const res = super._titleTemplate();
    res.strings = replaceComponentsTags(res.strings);
    return res
  }
}
window.customElements.define('x-api-summary', XApiSummary);

// export class XApiDocumentation extends ApiDocumentation {
//   render() {
//     const res = super.render();
//     console.log(res)
//     console.log(res.strings)
//     return res
//   }
// }
// window.customElements.define('x-api-documentation', XApiDocumentation);

export { XApiSummary };
