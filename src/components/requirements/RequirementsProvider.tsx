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

import { ManuscriptNode, nodeNames } from '@manuscripts/manuscript-transform'
import {
  CountRequirement,
  Manuscript,
  Model,
  Section,
} from '@manuscripts/manuscripts-json-schema'
import * as Comlink from 'comlink'
import React, { createContext } from 'react'
import { buildText, NodeStatistics } from '../../lib/statistics'

const StatisticsWorker = Comlink.wrap<{
  countCharacters: (text: string) => number
  countWords: (text: string) => number
}>(new Worker('../../lib/statistics.worker', { type: 'module' }))

export interface RequirementResult {
  message: string
  passed?: boolean
}

export interface RequirementsAlerts {
  words_maximum?: RequirementResult
  words_minimum?: RequirementResult
  characters_maximum?: RequirementResult
  characters_minimum?: RequirementResult
}

export type RequirementsValue = (
  node: ManuscriptNode,
  statistics?: NodeStatistics
) => Promise<RequirementsAlerts>

export const RequirementsContext = createContext<RequirementsValue>(
  async () => {
    throw new Error('RequirementsProvider is not mounted')
  }
)

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
  const buildRequirementsAlerts = async (
    node: ManuscriptNode,
    statistics?: NodeStatistics
  ): Promise<RequirementsAlerts> => {
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
      const nodeTypeName = nodeNames.get(node.type)
      const nodeName = nodeTypeName
        ? nodeTypeName.toLowerCase()
        : node.type.name

      const text = statistics ? statistics.text : buildText(node)

      if (hasWordsRequirement) {
        const count = statistics
          ? statistics.words
          : await StatisticsWorker.countWords(text)

        const { maximum, minimum } = requirements.words

        if (maximum !== undefined) {
          output.words_maximum = {
            message: `The ${nodeName} should have a maximum of ${maximum.toLocaleString()} words`,
            passed: count <= maximum,
          }
        }

        if (minimum !== undefined) {
          output.words_minimum = {
            message: `The ${nodeName} should have a minimum of ${minimum.toLocaleString()} words`,
            passed: count >= minimum,
          }
        }
      }

      if (hasCharactersRequirement) {
        const count = statistics
          ? statistics.characters
          : await StatisticsWorker.countCharacters(text)

        const { maximum, minimum } = requirements.characters

        if (maximum !== undefined) {
          output.characters_maximum = {
            message: `The ${nodeName} should have a maximum of ${maximum.toLocaleString()} characters`,
            passed: count <= maximum,
          }
        }

        if (minimum !== undefined) {
          output.characters_minimum = {
            message: `The ${nodeName} should have a minimum of ${minimum.toLocaleString()} characters`,
            passed: count >= minimum,
          }
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
