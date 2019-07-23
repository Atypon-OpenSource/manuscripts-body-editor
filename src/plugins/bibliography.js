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
import { isCitationNode, } from '@manuscripts/manuscript-transform';
import { isEqual } from 'lodash-es';
import { Plugin, PluginKey } from 'prosemirror-state';
import { getChildOfType } from '..';
const needsBibliographySection = (hadBibliographySection, hasBibliographySection, oldCitations, citations) => {
    if (hasBibliographySection)
        return false;
    if (hadBibliographySection)
        return false;
    if (citations.length === 0)
        return false;
    return oldCitations.length === 0;
};
const needsUpdate = (hadBibliographySection, hasBibliographySection, oldCitations, citations) => hadBibliographySection !== hasBibliographySection ||
    !isEqual(citations, oldCitations);
const createBibliographySection = (state) => state.schema.nodes.bibliography_section.createAndFill({}, state.schema.nodes.section_title.create({}, state.schema.text('Bibliography')));
export const bibliographyKey = new PluginKey('bibliography');
export default (props) => {
    const buildCitationNodes = (state) => {
        const citationNodes = [];
        state.doc.descendants((node, pos) => {
            if (isCitationNode(node)) {
                const citation = props.getModel(node.attrs.rid);
                if (citation) {
                    citationNodes.push([node, pos, citation]);
                }
            }
        });
        return citationNodes;
    };
    const buildCitations = (citationNodes) => citationNodes.map(([node, pos, citation]) => ({
        citationID: citation._id,
        citationItems: citation.embeddedCitationItems.map((citationItem) => ({
            id: citationItem.bibliographyItem,
            data: props.getLibraryItem(citationItem.bibliographyItem),
        })),
        properties: { noteIndex: 0 },
        manuscript: props.getManuscript(),
    }));
    return new Plugin({
        key: bibliographyKey,
        state: {
            init(config, instance) {
                const citationNodes = buildCitationNodes(instance);
                const citations = buildCitations(citationNodes);
                return {
                    citationNodes,
                    citations,
                };
            },
            apply(tr, value, oldState, newState) {
                const citationNodes = buildCitationNodes(newState);
                const citations = buildCitations(citationNodes);
                return {
                    citationNodes,
                    citations,
                };
            },
        },
        appendTransaction(transactions, oldState, newState) {
            const citationProcessor = props.getCitationProcessor();
            if (!citationProcessor) {
                return null;
            }
            const { citations: oldCitations } = bibliographyKey.getState(oldState);
            const { citationNodes, citations } = bibliographyKey.getState(newState);
            const hadBibliographySection = getChildOfType(oldState.tr.doc, oldState.schema.nodes.bibliography_section);
            const hasBibliographySection = getChildOfType(newState.tr.doc, newState.schema.nodes.bibliography_section);
            if (!needsUpdate(hadBibliographySection, hasBibliographySection, oldCitations, citations)) {
                return null;
            }
            const generatedCitations = citationProcessor
                .rebuildProcessorState(citations)
                .map(item => item[2]);
            const tr = newState.tr;
            citationNodes.forEach(([node, pos], index) => {
                let contents = generatedCitations[index];
                if (contents === '[NO_PRINTED_FORM]') {
                    contents = '';
                }
                tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, { contents }));
            });
            if (needsBibliographySection(hadBibliographySection, hasBibliographySection, oldCitations, citations)) {
                tr.insert(tr.doc.content.size, createBibliographySection(newState));
            }
            const bibliography = citationProcessor.makeBibliography();
            if (bibliography) {
                const [bibmeta, generatedBibliographyItems] = bibliography;
                if (bibmeta.bibliography_errors.length) {
                    console.warn(bibmeta.bibliography_errors);
                }
                tr.doc.descendants((node, pos) => {
                    if (node.type.name === 'bibliography_element') {
                        const contents = generatedBibliographyItems.length
                            ? `<div class="csl-bib-body" id="${node.attrs.id}">${generatedBibliographyItems.join('\n')}</div>`
                            : `<div class="csl-bib-body empty-node" data-placeholder="${node.attrs.placeholder}"></div>`;
                        tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, { contents }));
                    }
                });
            }
            return tr.setSelection(newState.selection);
        },
    });
};
