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

export * from './citation-sources'
export * from './commands'
export * from './components/application-menu'
export { DialogController, DialogNames } from './components/dialog'
export { ManuscriptOutline } from './components/outline/ManuscriptOutline'
export { OutlineItemIcon } from './components/outline/Outline'
export { OutlineManuscript } from './components/outline/OutlineManuscript'
export {
  ManuscriptToolbar,
  ToolbarButtonConfig,
} from './components/toolbar/ManuscriptToolbar'
export { Checks } from './components/requirements/Checks'
export { Statistics } from './components/requirements/Statistics'
export {
  RequirementsAlerts,
  RequirementsContext,
  RequirementsProvider,
} from './components/requirements/RequirementsProvider'
export { default as getMenus } from './menus'
export { ChangeReceiver } from './types'
export { PopperManager } from './lib/popper'
export { toolbar } from './toolbar'
export * from './plugins/highlight'
export { commentScroll } from './plugins/comment_annotation'
export * from './plugins/keywords'
export * from './lib/utils'
export * from './lib/external-files'
export { default as useEditor } from './useEditor'
export { default as ManuscriptsViewer } from './configs/lean-workflow/ManuscriptsViewer'
export { default as ManuscriptsEditor } from './configs/lean-workflow/ManuscriptsEditor'
