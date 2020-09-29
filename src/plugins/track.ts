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

import { schema } from '@manuscripts/manuscript-transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Step, StepMap as Map, Transform } from 'prosemirror-transform'
import { Decoration, DecorationSet } from 'prosemirror-view'
import uuid from 'uuid/v4'

export class Commit {
  public id: string
  public steps: Step[]
  public maps: Map[]
  public message: string

  constructor(steps: Step[], maps: Map[], message?: string) {
    this.id = uuid()
    this.steps = steps
    this.maps = maps
    this.message = message || ''
  }
}

class Span {
  public commit: number | null
  public from: number
  public to: number

  constructor(from: number, to: number, commit: number | null) {
    this.from = from
    this.to = to
    this.commit = commit
  }
}

const insertIntoBlameMap = (
  map: Span[],
  from: number,
  to: number,
  commit: number
) => {
  // if (from >= to) return

  let pos = 0,
    next
  for (; pos < map.length; pos++) {
    next = map[pos]
    if (next.commit === commit && next.to >= from) {
      break
    } else if (next.to > from) {
      // Different commit, not before
      if (next.from < from) {
        // Sticks out to the left (loop below will handle right side)
        const left = new Span(next.from, from, next.commit)
        if (next.to > to) {
          map.splice(pos++, 0, left)
        } else {
          map[pos++] = left
        }
      }
      break
    }
  }

  while ((next = map[pos])) {
    if (next.commit === commit && next.from > to) {
      break
    } else if (next.commit === commit) {
      from = Math.min(from, next.from)
      to = Math.max(to, next.to)
      map.splice(pos, 1)
    } else if (next.from >= to) {
      break
    } else if (next.to > to) {
      map[pos] = new Span(to, next.to, next.commit)
      break
    } else {
      map.splice(pos, 1)
    }
  }

  map.splice(pos, 0, new Span(from, to, commit))
}

const updateBlameMap = (map: Span[], transform: Transform, id: number) => {
  const result: Span[] = []
  const mapping = transform.mapping

  for (let i = 0; i < map.length; i++) {
    const span = map[i]
    const from = mapping.map(span.from, 1)
    const to = mapping.map(span.to, -1)
    if (from < to) {
      result.push(new Span(from, to, span.commit))
    }
  }

  for (let i = 0; i < mapping.maps.length; i++) {
    const map = mapping.maps[i]
    const after = mapping.slice(i + 1)
    map.forEach((_s, _e, start, end) => {
      insertIntoBlameMap(result, after.map(start, 1), after.map(end, -1), id)
    })
  }

  return result
}

// TrackState{
export class TrackState {
  public commits: Commit[]
  public blameMap: Span[]
  private uncommittedSteps: Step[]
  private uncommittedMaps: Map[]

  constructor(
    blameMap: Span[],
    commits?: Commit[],
    uncommittedSteps?: Step[],
    uncommittedMaps?: Map[]
  ) {
    // The blame map is a data structure that lists a sequence of
    // document ranges, along with the commit that inserted them. This
    // can be used to, for example, highlight the part of the document
    // that was inserted by a commit.
    this.blameMap = blameMap
    // The commit history, as an array of objects.
    this.commits = commits || []
    // Inverted steps and their maps corresponding to the changes that
    // have been made since the last commit.
    this.uncommittedSteps = uncommittedSteps || []
    this.uncommittedMaps = uncommittedMaps || []
  }

  // Apply a transform to this state
  applyTransform(transform: Transform) {
    // Invert the steps in the transaction, to be able to save them in
    // the next commit
    const inverted = transform.steps.map((step, i) =>
      step.invert(transform.docs[i])
    )
    const newBlame = updateBlameMap(
      this.blameMap,
      transform,
      this.commits.length
    )
    // Create a new state—since these are part of the editor state, a
    // persistent data structure, they must not be mutated.
    return new TrackState(
      newBlame,
      this.commits,
      this.uncommittedSteps.concat(inverted),
      this.uncommittedMaps.concat(transform.mapping.maps)
    )
  }

  // When a transaction is marked as a commit, this is used to put any
  // uncommitted steps into a new commit.
  applyCommit(message?: string) {
    if (this.uncommittedSteps.length === 0) {
      return this
    }
    const commit = new Commit(
      this.uncommittedSteps,
      this.uncommittedMaps,
      message
    )
    return new TrackState(this.blameMap, this.commits.concat(commit))
  }

  decorateBlameMap(focusedCommit: number | null) {
    return this.blameMap
      .map((span) => {
        if (span.commit === null) {
          return null
        }
        if (span.commit === focusedCommit) {
          return this.createBlameDecoration(span.from, span.to, 'focused')
        }
        if (span.commit < this.commits.length) {
          return this.createBlameDecoration(span.from, span.to, 'committed')
        }
        return this.createBlameDecoration(span.from, span.to, 'uncommitted')
      })
      .filter(Boolean) as Decoration[]
  }

  createBlameDecoration(from: number, to: number, type: string) {
    if (from === to) {
      return Decoration.widget(from, () => {
        const el = document.createElement('span')
        el.classList.add(`blame-${type}-point`)
        return el
      })
    }
    return Decoration.inline(from, to, {
      class: `blame-${type}`,
    })
  }
}

export interface TrackPluginState {
  tracked: TrackState
  deco: DecorationSet
  focusedCommit: number | null
}

export const trackChangesKey = new PluginKey('track-changes')

export default () => {
  const trackPlugin: Plugin<TrackPluginState, typeof schema> = new Plugin({
    key: trackChangesKey,
    state: {
      init(_, instance): TrackPluginState {
        return {
          tracked: new TrackState([
            new Span(0, instance.doc.content.size, null),
          ]),
          deco: DecorationSet.empty,
          focusedCommit: null,
        }
      },
      apply(tr, state, _, editorState) {
        // calculate the default next state if no actions in this domain
        // are taken
        const tracked = tr.docChanged
          ? state.tracked.applyTransform(tr)
          : state.tracked
        const deco = DecorationSet.create(
          editorState.doc,
          tracked.decorateBlameMap(state.focusedCommit)
        )
        const nextState = {
          ...state,
          deco,
          tracked,
        }

        const action = tr.getMeta(trackChangesKey)
        if (!action) {
          return nextState
        }

        switch (action.type) {
          case 'COMMIT': {
            return {
              ...nextState,
              tracked: tracked.applyCommit(action.message),
            }
          }
          case 'FOCUS': {
            return {
              ...nextState,
              focusedCommit: action.commit,
              deco: DecorationSet.create(
                editorState.doc,
                tracked.decorateBlameMap(action.commit)
              ),
            }
          }
        }

        return nextState
      },
    },
    props: {
      decorations(state) {
        return trackChangesKey.getState(state).deco
      },
    },
  })

  return trackPlugin
}
