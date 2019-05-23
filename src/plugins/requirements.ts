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
  DEFAULT_BUNDLE,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  Manuscript,
  Model,
  Requirement,
} from '@manuscripts/manuscripts-json-schema'
import { Plugin } from 'prosemirror-state'

interface ManuscriptTemplate extends Model {
  parent?: string
  title: string
  desc?: string
  aim: string
  category: string
  bundle?: string
  publisher?: string
  requirementIDs: string[]
  priority?: number
  requirements: object
  styles: object
}

interface Props {
  getManuscript: () => Manuscript
  modelMap: Map<string, Model>
}

const findTemplate = (modelMap: Map<string, Model>) => {
  for (const model of modelMap.values()) {
    if (model.objectType === 'MPManuscriptTemplate') {
      return model as ManuscriptTemplate
    }
  }
}

const buildTemplate = (
  modelMap: Map<string, Model>
): ManuscriptTemplate | undefined => {
  let template = findTemplate(modelMap)

  if (template) {
    while (template.parent) {
      const parent = modelMap.get(template.parent)

      delete template.parent

      if (parent) {
        template = {
          ...parent,
          ...template,
        }
      }
    }
  }

  return template
}

interface PluginState {
  template?: ManuscriptTemplate
  bundle?: Model
  requirements?: Requirement[]
}

export default (props: Props) =>
  new Plugin<PluginState, ManuscriptSchema>({
    state: {
      init() {
        const { modelMap, getManuscript } = props

        const template = buildTemplate(modelMap)

        if (!template) {
          return {}
        }

        const manuscript = getManuscript()

        const bundle = modelMap.get(
          manuscript.bundle || template.bundle || DEFAULT_BUNDLE
        )

        const requirements = (template.requirementIDs || []).map(id =>
          modelMap.get(id)
        ) as Requirement[]

        return {
          template,
          bundle,
          requirements,
        }
      },
      apply(tr, value, oldState, newState) {
        return value
      },
    },
  })
