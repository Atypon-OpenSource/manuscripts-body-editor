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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { nodeNames } from '@manuscripts/manuscript-transform';
import { ContextMenu } from '../lib/context-menu';
export const EditableBlock = (Base) => {
    return class extends Base {
        constructor() {
            super(...arguments);
            this.gutterButtons = () => [
                this.createAddButton(false),
                this.createEditButton(),
                this.createSpacer(),
                this.createAddButton(true),
            ].filter(Boolean);
            this.actionGutterButtons = () => [this.createSyncWarningButton()].filter(Boolean);
            this.createSpacer = () => {
                const spacer = document.createElement('div');
                spacer.classList.add('block-gutter-spacer');
                return spacer;
            };
            this.createSyncWarningButton = () => {
                if (!this.props.permissions.write) {
                    return null;
                }
                const { retrySync } = this.props;
                const warningButton = document.createElement('button');
                warningButton.classList.add('action-button');
                warningButton.classList.add('sync-warning-button');
                if (retrySync) {
                    warningButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                        const errors = this.syncErrors.map(error => error._id);
                        yield retrySync(errors);
                    }));
                }
                warningButton.addEventListener('mouseenter', () => {
                    const warning = document.createElement('div');
                    warning.className = 'sync-warning';
                    warning.appendChild((() => {
                        const node = document.createElement('p');
                        const humanReadableType = nodeNames.get(this.node.type) || 'element';
                        node.textContent = `This ${humanReadableType.toLowerCase()} failed to be saved.`;
                        return node;
                    })());
                    if (retrySync) {
                        warning.appendChild((() => {
                            const node = document.createElement('p');
                            node.textContent = `Please click to retry, and contact support@manuscriptsapp.com if the failure continues.`;
                            return node;
                        })());
                    }
                    this.props.popper.show(warningButton, warning, 'left');
                });
                warningButton.addEventListener('mouseleave', () => {
                    this.props.popper.destroy();
                });
                return warningButton;
            };
            this.createAddButton = (after) => {
                if (!this.props.permissions.write) {
                    return null;
                }
                const button = document.createElement('a');
                button.classList.add('add-block');
                button.classList.add(after ? 'add-block-after' : 'add-block-before');
                button.title = 'Add a new block';
                button.addEventListener('mousedown', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    const menu = this.createMenu();
                    menu.showAddMenu(event.currentTarget, after);
                });
                return button;
            };
            this.createEditButton = () => {
                const button = document.createElement('a');
                button.classList.add('edit-block');
                button.title = 'Edit block';
                button.addEventListener('mousedown', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    const menu = this.createMenu();
                    menu.showEditMenu(event.currentTarget);
                });
                return button;
            };
            this.createMenu = () => {
                const { setCommentTarget } = this.props;
                return new ContextMenu(this.node, this.view, this.getPos, {
                    setCommentTarget,
                });
            };
        }
    };
};
