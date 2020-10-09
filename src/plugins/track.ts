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
import { Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { Mapping, Step, StepMap as Map, Transform } from 'prosemirror-transform'
import { Decoration, DecorationSet } from 'prosemirror-view'
import uuid from 'uuid/v4'

import { isTextSelection } from '../commands'

export class Commit {
  public id: string
  public steps: Step[]
  public maps: Map[]
  public message: string
  public status: 'accepted' | 'rejected' | null

  constructor(steps: Step[], maps: Map[], message?: string) {
    this.id = uuid()
    this.steps = steps
    this.maps = maps
    this.message = message || ''
    this.status = null
  }

  reject() {
    return {
      ...this,
      status: 'rejected',
    }
  }

  toJSON() {
    // TODO TRACKCHANGES
  }

  static fromJSON() {
    // TODO TRACKCHANGES
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

  toJSON() {
    return JSON.stringify({
      commit: this.commit,
      from: this.from,
      to: this.to,
    })
  }

  static fromJSON(json: string) {
    const { from, to, commit } = JSON.parse(json)
    return new Span(from, to, commit)
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

export class TrackState {
  public commits: Commit[]
  public blameMap: Span[]
  public uncommittedSteps: Step[]
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
    console.log(this.uncommittedMaps)
    const commit = new Commit(
      this.uncommittedSteps,
      this.uncommittedMaps,
      message
    )
    return new TrackState(this.blameMap, this.commits.concat(commit))
  }

  revertCommit(index: number) {
    // Reverting is only possible if there are no uncommitted changes
    if (this.uncommittedSteps.length) {
      return this
    }
    const commits = this.commits.map((commit, i) =>
      i === index ? commit.reject() : commit
    )
    return new TrackState(this.blameMap, commits)
  }

  getRevertTr(index: number, tr: Transaction) {
    // Reverting is only possible if there are no uncommitted changes
    if (this.uncommittedSteps.length) {
      throw new Error('Cannot revert when there are uncommitted changes')
    }

    const commitToRevert = this.commits[index]

    // This is the mapping from the document as it was at the start of
    // the commit to the current document.
    const remap = new Mapping(
      this.commits
        .slice(index)
        .reduce((maps, c) => maps.concat(c.maps), [] as Map[])
    )

    // Build up a transaction that includes all (inverted) steps in this
    // commit, rebased to the current document. They have to be applied
    // in reverse order.
    for (let i = commitToRevert.steps.length - 1; i >= 0; i--) {
      // The mapping is sliced to not include maps for this step and the
      // ones before it.
      const remapped = commitToRevert.steps[i].map(remap.slice(i + 1))
      if (!remapped) {
        continue
      }
      const result = tr.maybeStep(remapped)
      // If the step can be applied, add its map to our mapping
      // pipeline, so that subsequent steps are mapped over it.
      if (result.doc) {
        remap.appendMap(remapped.getMap(), i)
      }
    }

    return tr
  }

  findInBlameMap(pos: number) {
    const { blameMap } = this

    for (let i = 0; i < blameMap.length; i++) {
      const span = blameMap[i]
      if (span.commit === null) {
        continue
      }
      if (
        span.to >= pos &&
        span.from <= pos &&
        span.commit < this.commits.length &&
        !this.commits[span.commit].status
      ) {
        return blameMap[i].commit
      }
    }

    return null
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
          if (this.commits[span.commit].status) {
            return null
          }
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

  toJSON() {
    return JSON.stringify({
      blameMap: this.blameMap.map((span) => span.toJSON()),
      commits: this.commits.map((commit) => commit.toJSON()),
      uncommittedSteps: this.uncommittedSteps.map((step) => step.toJSON()),
      // TODO TRACKCHANGES: figure out how to serialize and deserialize a stepmap
      uncommittedMaps: this.uncommittedMaps.map((map) =>
        map.forEach(console.log)
      ),
    })
  }

  static fromJSON(json: string) {
    const { blameMap, commits, uncommittedSteps } = JSON.parse(json)
    // TODO Deserialize the uncommittedMaps
    return new TrackState(
      blameMap.map(Span.fromJSON),
      commits.map(Commit.fromJSON),
      uncommittedSteps.map((json: { [key: string]: any }) =>
        Step.fromJSON(schema, json)
      )
    )
  }
}

export interface TrackPluginState {
  tracked: TrackState
  deco: DecorationSet
  focusedCommit: number | null
}

export const trackPluginKey = new PluginKey('track-changes-plugin')

export enum TRACK_PLUGIN_ACTIONS {
  COMMIT = 'COMMIT',
  FOCUS = 'FOCUS',
  REVERT = 'REVERT',
}

const applyAction = (
  state: TrackPluginState,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  action?: { type: string; [key: string]: any }
): TrackPluginState => {
  if (!action) {
    return state
  }

  switch (action.type) {
    case TRACK_PLUGIN_ACTIONS.COMMIT: {
      return {
        ...state,
        tracked: state.tracked.applyCommit(action.message),
      }
    }
    case TRACK_PLUGIN_ACTIONS.FOCUS: {
      return {
        ...state,
        focusedCommit: action.commit,
      }
    }
    case TRACK_PLUGIN_ACTIONS.REVERT: {
      return {
        ...state,
        tracked: state.tracked.revertCommit(action.commit),
      }
    }
    default: {
      return state
    }
  }
}

export default () => {
  const trackPlugin: Plugin<TrackPluginState, typeof schema> = new Plugin({
    key: trackPluginKey,

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

      apply(tr, state: TrackPluginState, _, editorState) {
        const { selection } = editorState
        const action = tr.getMeta(trackPluginKey)

        // FIRST update the TrackState object
        // THEN apply specific commands relating to this plugin
        const nextState = applyAction(
          {
            ...state,
            tracked: tr.docChanged
              ? state.tracked.applyTransform(tr)
              : state.tracked,
          },
          action
        )

        // FINALLY recalculate the decorations based on this new state
        const focusedCommit =
          isTextSelection(selection) && !action
            ? nextState.tracked.findInBlameMap(selection.head)
            : nextState.focusedCommit

        const deco = DecorationSet.create(
          editorState.doc,
          nextState.tracked.decorateBlameMap(focusedCommit)
        )

        return {
          ...nextState,
          deco,
          focusedCommit,
        }
      },
    },
    props: {
      decorations(state) {
        return trackPluginKey.getState(state).deco
      },
    },
    appendTransaction(trs, _, newState) {
      const revert = trs.find((tr) => {
        const action = tr.getMeta(trackPluginKey)
        return action && action.type === TRACK_PLUGIN_ACTIONS.REVERT
      })
      if (!revert) {
        return
      }

      const { tracked } = trackPluginKey.getState(newState)
      const revertTr = tracked.getRevertTr(
        revert.getMeta(trackPluginKey).commit,
        revert
      )

      return revertTr.docChanged ? revertTr : undefined
    },
  })

  return trackPlugin
}
