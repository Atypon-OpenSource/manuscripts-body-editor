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

import { CHANGE_STATUS, trackCommands } from '@manuscripts/track-changes-plugin'
import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import { PopperManager } from '../lib/popper'

const POPOVER_ID = 'track-changes-control-popover'

const ACCEPT_BUTTON_XLINK = '#track-changes-action-accept'

const REJECT_BUTTON_XLINK = '#track-changes-action-reject'

const trackChangesControlsKey = new PluginKey<PopperManager>('track-changes-ui')

const UPDATE_POPOVER = 'UPDATE_POPOVER'

const createControl = (
  view: EditorView,
  changeId: string,
  status: CHANGE_STATUS
) => {
  const xLink =
    (status === CHANGE_STATUS.rejected && REJECT_BUTTON_XLINK) ||
    ACCEPT_BUTTON_XLINK
  const button = document.createElement('button')

  button.innerHTML = `<svg><use href="${xLink}"></use></svg>`
  button.onclick = () => {
    trackCommands.setChangeStatuses(status, [changeId])(
      view.state,
      view.dispatch
    )
    const popover = trackChangesControlsKey.getState(view.state)
    popover?.destroy()
  }

  return button
}

const createControls = (view: EditorView, changeId: string) => {
  const el = document.createElement('div')
  el.classList.add('track-changes-inline-control')
  el.id = POPOVER_ID
  el.dataset.changeid = changeId

  el.appendChild(createControl(view, changeId, CHANGE_STATUS.rejected))
  el.appendChild(createControl(view, changeId, CHANGE_STATUS.accepted))
  return el
}

/**
 * This plugin show popover control for the pending node that we track.
 * to accept or reject them
 */
export default () =>
  new Plugin<PopperManager>({
    key: trackChangesControlsKey,
    state: {
      init: () => {
        return new PopperManager()
      },
      apply: (tr, value, state) => {
        const meta = tr.getMeta(trackChangesControlsKey)
        if (meta && UPDATE_POPOVER in meta) {
          return meta[UPDATE_POPOVER]
        }

        const popover = trackChangesControlsKey.getState(state)
        return popover || new PopperManager()
      },
    },
    props: {
      handleDOMEvents: {
        mouseover: (view, event) => {
          const target = event.target as HTMLElement | null
          const trackStatus = target?.getAttribute('data-track-status')

          if (target && trackStatus === 'pending') {
            const changeId = target.getAttribute('data-track-id') as string
            const controllerDom = createControls(view, changeId)
            const popover = trackChangesControlsKey.getState(view.state)

            popover?.show(target, controllerDom, 'auto', false)
            controllerDom.addEventListener('mouseleave', () => {
              popover?.destroy()
            })
            updateState(view, popover)
          }
        },
        mouseout: (view, event) => {
          const target = event.target as HTMLElement | null
          const trackStatus = target?.getAttribute('data-track-status')

          if (target && trackStatus === 'pending') {
            const controllerDom = document.querySelector(`#${POPOVER_ID}`)

            if (controllerDom && !controllerDom.matches(':hover')) {
              const popover = trackChangesControlsKey.getState(view.state)
              popover?.destroy()
            }
          }
        },
      },
    },
  })

const updateState = (view: EditorView, popover?: PopperManager) => {
  view.dispatch(
    view.state.tr.setMeta(trackChangesControlsKey, {
      [UPDATE_POPOVER]: popover,
    })
  )
}
