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
import { nodeNames, } from '@manuscripts/manuscript-transform';
import { Fragment, Slice } from 'prosemirror-model';
import { createBlock } from '../commands';
import { PopperManager } from './popper';
import { getRandomId, MarkerCommentPlacingStrategy } from './rmq-markup-strategy';
const popper = new PopperManager();
export const sectionLevel = (depth) => {
    switch (depth) {
        case 1:
            return 'Section';
        default:
            return 'Sub' + 'sub'.repeat(depth - 2) + 'section';
    }
};
export class ContextMenu {
    constructor(node, view, getPos, actions = {}) {
        this.suppressibleAttrs = new Map([
            ['suppressCaption', 'Caption'],
            ['suppressHeader', 'Header'],
            ['suppressFooter', 'Footer'],
        ]);
        this.showAddMenu = (target, after) => {
            const menu = document.createElement('div');
            menu.className = 'menu';
            const $pos = this.resolvePos();
            const insertPos = after ? $pos.after($pos.depth) : $pos.before($pos.depth);
            const endPos = $pos.end();
            const insertableTypes = this.insertableTypes(after, insertPos, endPos);
            const { nodes } = this.view.state.schema;
            if (this.showMenuSection(insertableTypes, ['section', 'subsection'])) {
                menu.appendChild(this.createMenuSection((section) => {
                    const labelPosition = after ? 'After' : 'Before';
                    const sectionTitle = $pos.node($pos.depth).child(0).textContent;
                    const itemTitle = sectionTitle ? `“${sectionTitle}”` : 'This Section';
                    const itemLabel = `New ${sectionLevel($pos.depth)} ${labelPosition} ${itemTitle}`;
                    if (insertableTypes.section) {
                        section.appendChild(this.createMenuItem(itemLabel, () => {
                            this.addBlock(nodes.section, after, insertPos);
                            popper.destroy();
                        }));
                    }
                    if (insertableTypes.subsection) {
                        const subItemLabel = `New ${sectionLevel($pos.depth + 1)} to ${itemTitle}`;
                        section.appendChild(this.createMenuItem(subItemLabel, () => {
                            this.addBlock(nodes.section, after, endPos);
                            popper.destroy();
                        }));
                    }
                }));
            }
            if (this.showMenuSection(insertableTypes, [
                'paragraph',
                'orderedList',
                'bulletList',
            ])) {
                menu.appendChild(this.createMenuSection((section) => {
                    if (insertableTypes.paragraphElement) {
                        section.appendChild(this.createMenuItem('Paragraph', () => {
                            this.addBlock(nodes.paragraph, after);
                            popper.destroy();
                        }));
                    }
                    if (insertableTypes.orderedList) {
                        section.appendChild(this.createMenuItem('Numbered List', () => {
                            this.addBlock(nodes.ordered_list, after);
                            popper.destroy();
                        }));
                    }
                    if (insertableTypes.bulletList) {
                        section.appendChild(this.createMenuItem('Bullet list', () => {
                            this.addBlock(nodes.bullet_list, after);
                            popper.destroy();
                        }));
                    }
                }));
            }
            if (this.showMenuSection(insertableTypes, [
                'figure',
                'tableElement',
                'equationElement',
                'listingElement',
            ])) {
                menu.appendChild(this.createMenuSection((section) => {
                    if (insertableTypes.figureElement) {
                        section.appendChild(this.createMenuItem('Figure Panel', () => {
                            this.addBlock(nodes.figure_element, after);
                            popper.destroy();
                        }));
                    }
                    if (insertableTypes.tableElement) {
                        section.appendChild(this.createMenuItem('Table', () => {
                            this.addBlock(nodes.table_element, after);
                            popper.destroy();
                        }));
                    }
                    if (insertableTypes.equationElement) {
                        section.appendChild(this.createMenuItem('Equation', () => {
                            this.addBlock(nodes.equation_element, after);
                            popper.destroy();
                        }));
                    }
                    if (insertableTypes.listingElement) {
                        section.appendChild(this.createMenuItem('Listing', () => {
                            this.addBlock(nodes.listing_element, after);
                            popper.destroy();
                        }));
                    }
                }));
            }
            popper.show(target, menu, 'right-end');
            this.addPopperEventListeners();
        };
        this.showEditMenu = (target) => {
            const menu = document.createElement('div');
            menu.className = 'menu';
            const $pos = this.resolvePos();
            const nodeType = this.node.type;
            const { nodes } = this.view.state.schema;
            if (this.isListType(nodeType.name)) {
                menu.appendChild(this.createMenuSection((section) => {
                    if (nodeType === nodes.bullet_list) {
                        section.appendChild(this.createMenuItem('Change to Numbered List', () => {
                            this.changeNodeType(nodes.ordered_list);
                            popper.destroy();
                        }));
                    }
                    if (nodeType === nodes.ordered_list) {
                        section.appendChild(this.createMenuItem('Change to Bullet List', () => {
                            this.changeNodeType(nodes.bullet_list);
                            popper.destroy();
                        }));
                    }
                }));
            }
            const { setCommentTarget } = this.actions;
            if (setCommentTarget) {
                menu.appendChild(this.createMenuSection((section) => {
                    section.appendChild(this.createMenuItem('Comment', () => {
                        setCommentTarget(this.node.attrs.id);
                        const { from, to } = this.view.state.selection;
                        if (from !== to) {
                            const commentId = "tmp_" + getRandomId();
                            const _strategy = new MarkerCommentPlacingStrategy(this.view);
                            const strategy = (tr) => _strategy.setTransaction(tr);
                            const transaction = this.view.state.tr;
                            strategy(transaction).addCommentMark(commentId, 0, false, from, to);
                        }
                        popper.destroy();
                    }));
                }));
            }
            const suppressOptions = this.buildSuppressOptions();
            if (suppressOptions.length) {
                menu.appendChild(this.createMenuSection((section) => {
                    for (const option of suppressOptions) {
                        const label = option.attrs[option.attr]
                            ? `Show ${option.label}`
                            : `Hide ${option.label}`;
                        section.appendChild(this.createMenuItem(label, () => {
                            this.toggleNodeAttr(option);
                            popper.destroy();
                        }));
                    }
                }));
            }
            if (nodeType === nodes.paragraph && $pos.parent.type === nodes.section) {
                menu.appendChild(this.createMenuSection((section) => {
                    section.appendChild(this.createMenuItem(`Split to New ${sectionLevel($pos.depth)}`, () => {
                        this.splitSection();
                        popper.destroy();
                    }));
                }));
            }
            menu.appendChild(this.createMenuSection((section) => {
                const nodeName = nodeNames.get(nodeType) || '';
                section.appendChild(this.createMenuItem(`Delete ${nodeName}`, () => {
                    this.deleteNode(nodeType);
                    popper.destroy();
                }));
            }));
            popper.show(target, menu, 'right-end');
            this.addPopperEventListeners();
        };
        this.addBlock = (nodeType, after, position) => {
            const { state, dispatch } = this.view;
            if (position === undefined) {
                position = after ? this.getPos() + this.node.nodeSize : this.getPos();
            }
            createBlock(nodeType, position, state, dispatch);
        };
        this.canAddBlock = (nodeType, after, position) => {
            const { state: { doc }, } = this.view;
            if (position === undefined) {
                position = after ? this.getPos() + this.node.nodeSize : this.getPos();
            }
            const $position = doc.resolve(position);
            const index = $position.index();
            return $position.parent.canReplaceWith(index, index, nodeType);
        };
        this.createMenuItem = (contents, handler) => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.textContent = contents;
            item.addEventListener('mousedown', event => {
                event.preventDefault();
                handler(event);
            });
            return item;
        };
        this.createMenuSection = (createMenuItems) => {
            const section = document.createElement('div');
            section.className = 'menu-section';
            createMenuItems(section);
            return section;
        };
        this.insertableTypes = (after, insertPos, endPos) => {
            const { nodes } = this.view.state.schema;
            return {
                section: this.canAddBlock(nodes.section, after, insertPos),
                subsection: this.canAddBlock(nodes.section, after, endPos),
                paragraphElement: this.canAddBlock(nodes.paragraph, after),
                orderedList: this.canAddBlock(nodes.ordered_list, after),
                bulletList: this.canAddBlock(nodes.bullet_list, after),
                figureElement: this.canAddBlock(nodes.figure_element, after),
                tableElement: this.canAddBlock(nodes.table_element, after),
                equationElement: this.canAddBlock(nodes.equation_element, after),
                listingElement: this.canAddBlock(nodes.listing_element, after),
            };
        };
        this.showMenuSection = (insertableTypes, types) => types.some(type => insertableTypes[type]);
        this.changeNodeType = (nodeType) => {
            this.view.dispatch(this.view.state.tr.setNodeMarkup(this.getPos(), nodeType, {
                id: this.node.attrs.id,
            }));
            popper.destroy();
        };
        this.deleteNode = (nodeType) => {
            switch (nodeType.name) {
                case 'section_title': {
                    const $pos = this.resolvePos();
                    this.view.dispatch(this.view.state.tr.delete($pos.before(), $pos.after()));
                    break;
                }
                case 'bibliography_element': {
                    const $pos = this.resolvePos();
                    this.view.dispatch(this.view.state.tr.delete($pos.before($pos.depth), $pos.after($pos.depth)));
                    break;
                }
                default: {
                    const pos = this.getPos();
                    this.view.dispatch(this.view.state.tr.delete(pos, pos + this.node.nodeSize));
                    break;
                }
            }
        };
        this.resolvePos = () => this.view.state.doc.resolve(this.getPos());
        this.splitSection = () => {
            const { schema, tr } = this.view.state;
            const from = this.getPos();
            const to = from + this.node.nodeSize;
            const slice = new Slice(Fragment.from([
                schema.nodes.section.create(),
                schema.nodes.section.create({}, [
                    schema.nodes.section_title.create(),
                    this.node,
                ]),
            ]), 1, 1);
            this.view.dispatch(tr.replaceRange(from, to, slice));
        };
        this.toggleNodeAttr = (option) => {
            const { getPos, attr, attrs } = option;
            this.view.dispatch(this.view.state.tr.setNodeMarkup(getPos(), undefined, Object.assign({}, attrs, { [attr]: !attrs[attr] })));
        };
        this.parentAttrs = () => {
            const $pos = this.resolvePos();
            return $pos.parent.attrs;
        };
        this.getParentPos = () => {
            const $pos = this.resolvePos();
            return $pos.before();
        };
        this.isListType = (type) => ['bullet_list', 'ordered_list'].includes(type);
        this.buildSuppressOptions = () => {
            const items = [];
            const attrs = this.node.attrs;
            for (const [attr, label] of this.suppressibleAttrs.entries()) {
                if (attr in attrs) {
                    items.push({
                        attr,
                        attrs,
                        label,
                        getPos: this.getPos,
                    });
                }
            }
            switch (this.node.type.name) {
                case 'section':
                    items.push({
                        attr: 'titleSuppressed',
                        attrs,
                        label: 'Heading',
                        getPos: this.getPos,
                    });
                    break;
                case 'section_title':
                    items.push({
                        attr: 'titleSuppressed',
                        attrs: this.parentAttrs(),
                        label: 'Heading',
                        getPos: this.getParentPos,
                    });
                    break;
            }
            return items;
        };
        this.addPopperEventListeners = () => {
            const mouseListener = () => {
                window.requestAnimationFrame(() => {
                    window.removeEventListener('mousedown', mouseListener);
                    popper.destroy();
                });
            };
            const keyListener = event => {
                if (event.key === 'Escape') {
                    window.removeEventListener('keydown', keyListener);
                    popper.destroy();
                }
            };
            window.addEventListener('mousedown', mouseListener);
            window.addEventListener('keydown', keyListener);
        };
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.actions = actions;
    }
}
