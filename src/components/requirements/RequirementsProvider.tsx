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

import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import {
  CountRequirement,
  Manuscript,
  Model,
  Section,
} from '@manuscripts/manuscripts-json-schema'
import React, { createContext } from 'react'
import {
  buildText,
  countCharacters,
  countWords,
  NodeStatistics,
} from '../../lib/statistics'

export interface RequirementsAlerts {
  words?: string
  characters?: string
}

type RequirementsValue = (
  node: ManuscriptNode,
  statistics?: NodeStatistics
) => RequirementsAlerts

export const RequirementsContext = createContext<RequirementsValue>(() => ({}))

export const RequirementsProvider: React.FC<{
  modelMap: Map<string, Model>
}> = ({ modelMap, children }) => {
  const getActiveRequirementCount = (id?: string) => {
    if (!id) {
      return undefined
    }

    const requirement = modelMap.get(id) as CountRequirement | undefined

    if (!requirement) {
      return undefined
    }

    if (requirement.ignored) {
      return undefined
    }

    return requirement.count
  }

  // tslint:disable-next-line:cyclomatic-complexity
  const buildRequirementsAlerts = (
    node: ManuscriptNode,
    statistics?: NodeStatistics
  ): RequirementsAlerts => {
    const output: RequirementsAlerts = {}

    const { id } = node.attrs

    if (!id) {
      return output
    }

    const model = modelMap.get(id) as Manuscript | Section | undefined

    if (!model) {
      return output
    }

    const requirements = {
      words: {
        minimum: getActiveRequirementCount(model.minWordCountRequirement),
        maximum: getActiveRequirementCount(model.maxWordCountRequirement),
      },
      characters: {
        minimum: getActiveRequirementCount(model.minCharacterCountRequirement),
        maximum: getActiveRequirementCount(model.maxCharacterCountRequirement),
      },
    }

    const hasWordsRequirement =
      requirements.words.maximum || requirements.words.minimum

    const hasCharactersRequirement =
      requirements.characters.maximum || requirements.characters.minimum

    const hasAnyRequirement = hasWordsRequirement || hasCharactersRequirement

    if (hasAnyRequirement) {
      const type = node.type.name

      const text = statistics ? statistics.text : buildText(node)

      if (hasWordsRequirement) {
        const count = statistics ? statistics.words : countWords(text)

        const { maximum, minimum } = requirements.words

        if (maximum !== undefined && count > maximum) {
          output.words = `The ${type} should have a maximum of ${maximum.toLocaleString()} words`
        }

        if (minimum !== undefined && count < minimum) {
          output.words = `The ${type} should have a minimum of ${minimum.toLocaleString()} words`
        }
      }

      if (hasCharactersRequirement) {
        const count = statistics ? statistics.characters : countCharacters(text)

        const { maximum, minimum } = requirements.characters

        if (maximum !== undefined && count > maximum) {
          output.characters = `The ${type} should have a maximum of ${maximum.toLocaleString()} characters`
        }

        if (minimum !== undefined && count < minimum) {
          output.characters = `The ${type} should have a minimum of ${minimum.toLocaleString()} characters`
        }
      }
    }

    return output
  }

  return (
    <RequirementsContext.Provider value={buildRequirementsAlerts}>
      {children}
    </RequirementsContext.Provider>
  )
}
