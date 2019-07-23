/*!
 * © 2019 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { nodeNames, schema, } from '@manuscripts/manuscript-transform';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
export const objectsKey = new PluginKey('objects');
const types = [
    schema.nodes.figure_element,
    schema.nodes.table_element,
    schema.nodes.equation_element,
    schema.nodes.listing_element,
];
const buildTargets = (doc) => {
    const counters = {};
    for (const type of types) {
        counters[type.name] = {
            label: nodeNames.get(type),
            index: 0,
        };
    }
    const buildLabel = (type) => {
        const counter = counters[type.name];
        counter.index++;
        return `${counter.label} ${counter.index}`;
    };
    const targets = new Map();
    doc.descendants(node => {
        if (node.type.name in counters) {
            const label = buildLabel(node.type);
            targets.set(node.attrs.id, {
                type: node.type.name,
                id: node.attrs.id,
                label,
                caption: node.textContent,
            });
        }
    });
    return targets;
};
export default (props) => {
    return new Plugin({
        key: objectsKey,
        state: {
            init: (config, state) => buildTargets(state.doc),
            apply: (tr, old) => {
                return tr.docChanged ? buildTargets(tr.doc) : old;
            },
        },
        props: {
            decorations: state => {
                const targets = objectsKey.getState(state);
                const decorations = [];
                state.doc.descendants((node, pos) => {
                    const { id } = node.attrs;
                    if (id) {
                        const target = targets.get(id);
                        if (target) {
                            const labelNode = document.createElement('span');
                            labelNode.className = 'figure-label';
                            labelNode.textContent = target.label + ':';
                            node.forEach((child, offset) => {
                                if (child.type.name === 'figcaption') {
                                    decorations.push(Decoration.widget(pos + 1 + offset + 1, labelNode, {
                                        side: -1,
                                        key: `figure-label-${id}-${target.label}`,
                                    }));
                                }
                            });
                        }
                    }
                });
                return DecorationSet.create(state.doc, decorations);
            },
        },
        appendTransaction: (transactions, oldState, newState) => {
            const targets = objectsKey.getState(newState);
            let updated = 0;
            const tr = newState.tr;
            newState.doc.descendants((node, pos) => {
                if (node.type === newState.schema.nodes.cross_reference) {
                    const auxiliaryObjectReference = props.getModel(node.attrs.rid);
                    if (auxiliaryObjectReference &&
                        auxiliaryObjectReference.referencedObject) {
                        const target = targets.get(auxiliaryObjectReference.referencedObject);
                        if (target && target.label && target.label !== node.attrs.label) {
                            tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, { label: target.label }));
                            updated++;
                        }
                    }
                }
            });
            if (updated) {
                return tr.setSelection(newState.selection);
            }
        },
    });
};
