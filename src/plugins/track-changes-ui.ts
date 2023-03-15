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

import {
  trackChangesPluginKey,
  TrackChangesState,
  TrackedChange,
} from '@manuscripts/track-changes-plugin'
import { EditorState, Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const ACCEPT_BUTTON_XLINK = '#track-changes-action-accept'

const REJECT_BUTTON_XLINK = '#track-changes-action-reject'

const BASE_CLASS = 'track-changes'

enum CLASSES {
  focused = 'focused',
  control = 'control',
}

const createControl = (
  change: TrackedChange,
  action: string,
  xLink: string
) => {
  return `
        <button type="button" data-action="${action}" data-changeid="${change.id}">
          <svg><use href="${xLink}"></use></svg>
        </button>
      `
}
const getClassnames = (...types: Array<CLASSES | null>): string[] => {
  return [BASE_CLASS].concat(
    types.filter(Boolean).map((type) => `${BASE_CLASS}--${type}`)
  )
}

const addClassnamesToEl = (
  el: HTMLElement,
  ...types: Array<CLASSES | null>
) => {
  getClassnames(...types).forEach((classname) => el.classList.add(classname))
}

const createControls = (change: TrackedChange) => {
  return Decoration.widget(
    change.to,
    () => {
      const el = document.createElement('div')
      addClassnamesToEl(el, CLASSES.control)
      el.dataset.changeid = change.id
      el.innerHTML =
        createControl(change, 'reject', REJECT_BUTTON_XLINK) +
        createControl(change, 'accept', ACCEPT_BUTTON_XLINK)
      return el
    },
    { side: -1 }
  )
}
const decorateChanges = (state: EditorState): Decoration[] => {
  const pluginState = trackChangesPluginKey.getState(state)

  if (!pluginState) {
    return []
  }

  const { pending } = pluginState.changeSet

  return pending.reduce((decorations, change) => {
    if (change.id === null) {
      return decorations
    }

    return [...decorations, createControls(change)]
  }, [] as Decoration[])
}

/**
 * This plugin adds decoration
 */
export default () =>
  new Plugin<TrackChangesState>({
    props: {
      decorations: (state) => {
        return DecorationSet.create(state.doc, decorateChanges(state))
      },
    },
  })
