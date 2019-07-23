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
import Popper from 'popper.js';
export class PopperManager {
    show(target, contents, placement = 'bottom', showArrow = true) {
        if (this.activePopper) {
            return this.destroy();
        }
        window.requestAnimationFrame(() => {
            const container = document.createElement('div');
            container.className = 'popper';
            const modifiers = {};
            if (showArrow) {
                const arrow = document.createElement('div');
                arrow.className = 'popper-arrow';
                container.appendChild(arrow);
                modifiers.arrow = {
                    element: arrow,
                };
            }
            else {
                modifiers.arrow = {
                    enabled: false,
                };
            }
            container.appendChild(contents);
            document.body.appendChild(container);
            this.activePopper = new Popper(target, container, {
                placement,
                removeOnDestroy: true,
                modifiers,
                onCreate: () => {
                    this.focusInput(container);
                },
            });
        });
    }
    destroy() {
        if (this.activePopper) {
            this.activePopper.destroy();
            delete this.activePopper;
        }
    }
    update() {
        if (this.activePopper) {
            this.activePopper.update();
        }
    }
    focusInput(container) {
        const element = container.querySelector('input');
        if (element) {
            element.focus();
        }
    }
}
