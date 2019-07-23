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
import { schema, } from '@manuscripts/manuscript-transform';
import { EditorState, NodeSelection, TextSelection, } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import React from 'react';
import { transformPasted } from '../lib/paste';
import '../lib/smooth-scroll';
import plugins from '../plugins/editor';
import views from '../views/editor';
export class Editor extends React.PureComponent {
    constructor(props) {
        super(props);
        this.editorRef = React.createRef();
        this.isMouseDown = false;
        this.handleMouseDown = () => {
            this.isMouseDown = true;
        };
        this.handleMouseUp = () => {
            this.isMouseDown = false;
        };
        this.dispatchTransaction = (transaction, external = false) => {
            const { state, transactions } = this.view.state.applyTransaction(transaction);
            this.view.updateState(state);
            if (!external) {
                this.props.handleStateChange(this.view, transactions.some(tr => tr.docChanged));
            }
        };
        this.receive = (op, id, newNode) => {
            const { state } = this.view;
            if (!id) {
                return;
            }
            console.log({ op, id, newNode });
            switch (op) {
                case 'INSERT':
                    if (!newNode) {
                        return this.dispatchTransaction(state.tr.setMeta('update', true), true);
                    }
                    switch (newNode.type) {
                        case state.schema.nodes.section:
                            const sectionIndex = newNode.attrs.priority + 1;
                            state.doc.forEach((node, offset, index) => {
                                if (index === sectionIndex) {
                                    this.dispatchTransaction(state.tr.insert(offset, newNode), true);
                                    return false;
                                }
                            });
                            break;
                        default:
                            const { schema: { nodes }, tr, } = state;
                            state.doc.descendants((node, pos) => {
                                if (node.attrs.id === id &&
                                    (node.type === nodes.placeholder_element ||
                                        node.type === nodes.placeholder)) {
                                    tr.replaceWith(pos, pos + node.nodeSize, newNode);
                                    tr.setMeta('addToHistory', false);
                                    this.dispatchTransaction(tr, true);
                                    return false;
                                }
                            });
                            break;
                    }
                    break;
                case 'UPDATE':
                    if (!newNode) {
                        return this.dispatchTransaction(state.tr.setMeta('update', true), true);
                    }
                    state.doc.descendants((node, pos) => {
                        const tr = state.tr;
                        if (node.attrs.id === id) {
                            tr.setNodeMarkup(pos, undefined, newNode.attrs);
                            const start = newNode.content.findDiffStart(node.content);
                            if (typeof start === 'number') {
                                const diffEnd = newNode.content.findDiffEnd(node.content);
                                if (diffEnd) {
                                    let { a: newNodeDiffEnd, b: nodeDiffEnd } = diffEnd;
                                    const overlap = start - Math.min(nodeDiffEnd, newNodeDiffEnd);
                                    if (overlap > 0) {
                                        nodeDiffEnd += overlap;
                                        newNodeDiffEnd += overlap;
                                    }
                                    tr.replace(pos + start + 1, pos + nodeDiffEnd + 1, newNode.slice(start, newNodeDiffEnd));
                                }
                            }
                            tr.setMeta('addToHistory', false);
                            this.dispatchTransaction(tr, true);
                            return false;
                        }
                    });
                    break;
                case 'REMOVE':
                    state.doc.descendants((node, pos) => {
                        if (node.attrs.id === id) {
                            const tr = state.tr
                                .delete(pos, pos + node.nodeSize)
                                .setMeta('addToHistory', false);
                            this.dispatchTransaction(tr, true);
                            return false;
                        }
                    });
                    break;
            }
        };
        this.handleHistoryChange = location => {
            this.focusNodeWithId(location.hash.substring(1));
        };
        const { attributes, doc, handleStateChange, permissions } = this.props;
        debugger;
        console.log(schema);
        this.view = new EditorView(undefined, {
            editable: () => permissions.write,
            state: EditorState.create({
                doc,
                schema,
                plugins: plugins(this.props),
            }),
            scrollThreshold: 100,
            scrollMargin: {
                top: 100,
                bottom: 100,
                left: 0,
                right: 0,
            },
            dispatchTransaction: this.dispatchTransaction,
            nodeViews: views(this.props),
            attributes,
            transformPasted,
            handleDOMEvents: {
                focus: () => {
                    handleStateChange(this.view, false);
                    if (!this.isMouseDown) {
                        this.view.focus();
                    }
                    return false;
                },
            },
        });
    }
    componentDidMount() {
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        if (this.editorRef.current) {
            this.editorRef.current.appendChild(this.view.dom);
        }
        this.props.subscribe(this.receive);
        this.props.handleStateChange(this.view, false);
        this.props.setView(this.view);
        this.view.dispatch(this.view.state.tr.setMeta('update', true));
        if (this.props.autoFocus) {
            this.view.focus();
        }
        this.handleHistoryChange(this.props.history.location, 'PUSH');
        this.unregisterHistoryListener = this.props.history.listen(this.handleHistoryChange);
    }
    componentWillUnmount() {
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        if (this.unregisterHistoryListener) {
            this.unregisterHistoryListener();
        }
    }
    render() {
        return React.createElement("div", { ref: this.editorRef });
    }
    focusNodeWithId(id) {
        if (!id || !this.view)
            return;
        const { state } = this.view;
        state.doc.descendants((node, pos) => {
            if (node.attrs.id === id) {
                this.view.focus();
                const selection = node.isAtom
                    ? NodeSelection.create(state.doc, pos)
                    : TextSelection.near(state.doc.resolve(pos + 1));
                this.dispatchTransaction(state.tr.setSelection(selection));
                const dom = this.view.domAtPos(pos + 1);
                if (dom.node instanceof Element) {
                    dom.node.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest',
                    });
                }
                return false;
            }
        });
    }
}
