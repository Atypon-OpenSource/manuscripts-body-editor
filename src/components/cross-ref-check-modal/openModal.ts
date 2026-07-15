/*!
 * © 2026 Atypon Systems LLC
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

import { ManuscriptEditorView } from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'

import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'
import { CrossRefWarningModal, XrefGroup } from './CrossRefWarningModal'

export const openCrossRefWarningModal = (
  view: ManuscriptEditorView,
  xrefGroups: XrefGroup[],
  onConfirm: () => void,
  onClose: () => void,
  selectAndScrollTo: ($pos: ResolvedPos) => void
): HTMLDivElement => {
  const { state } = view
  const props = getEditorProps(state)
  const componentProps = {
    xrefs: xrefGroups,
    onConfirm,
    onClose,
    selectAndScrollTo,
  }

  const dialog = ReactSubView(
    props,
    CrossRefWarningModal,
    componentProps,
    state.doc,
    () => 0,
    view
  )
  document.body.appendChild(dialog)
  return dialog
}
