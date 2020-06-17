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
import { Model } from '@manuscripts/manuscripts-json-schema'
import {
  createRequirementsValidator,
  findModelFromNode,
  NodeStatistics,
  RequirementsAlerts,
} from '@manuscripts/requirements'
import * as Comlink from 'comlink'
import React, { createContext } from 'react'

const StatisticsWorker = Comlink.wrap<{
  countCharacters: (text: string) => number
  countWords: (text: string) => number
}>(new Worker('../../lib/statistics.worker', { type: 'module' }))

export type ValidateRequirements = (
  node: ManuscriptNode,
  statistics?: NodeStatistics
) => Promise<RequirementsAlerts>

export const RequirementsContext = createContext<ValidateRequirements>(
  async () => {
    throw new Error('RequirementsProvider is not mounted')
  }
)

export const RequirementsProvider: React.FC<{
  modelMap: Map<string, Model>
}> = ({ modelMap, children }) => {
  const validateRequirements = createRequirementsValidator(modelMap, {
    countCharacters: StatisticsWorker.countCharacters,
    countWords: StatisticsWorker.countWords,
  })

  const validateNodeRequirements: ValidateRequirements = async (
    node,
    statistics
  ) => {
    let model

    try {
      model = findModelFromNode(node, modelMap)
    } catch (error) {
      return {}
    }

    return validateRequirements(node, model, statistics)
  }

  return (
    <RequirementsContext.Provider value={validateNodeRequirements}>
      {children}
    </RequirementsContext.Provider>
  )
}
