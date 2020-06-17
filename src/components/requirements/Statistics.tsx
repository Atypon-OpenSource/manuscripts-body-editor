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

import '@manuscripts/style-guide/styles/tip.css'

import AttentionOrange from '@manuscripts/assets/react/AttentionOrange'
import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import {
  buildText,
  NodeStatistics,
  RequirementsAlerts,
} from '@manuscripts/requirements'
import { Tip } from '@manuscripts/style-guide'
import * as Comlink from 'comlink'
import React, { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'

import { RequirementsContext } from './RequirementsProvider'

const StatisticsWorker = Comlink.wrap<{
  countCharacters: (text: string) => number
  countWords: (text: string) => number
}>(new Worker('../../lib/statistics.worker', { type: 'module' }))

const AlertContainer = styled.div`
  display: inline-flex;
  align-items: center;
  width: ${(props) => props.theme.grid.unit * 5}px;
  cursor: pointer;
`

const StatisticContainer = styled.div`
  display: flex;
  align-items: center;
  margin: ${(props) => props.theme.grid.unit * 2}px 0;
`

const Statistic: React.FC<{
  value: number
  singular: string
  plural: string
  alert?: string
}> = ({ value, singular, plural, alert }) => (
  <StatisticContainer>
    <AlertContainer>
      {alert && (
        <Tip placement={'left'} title={alert}>
          <AttentionOrange width={12} height={12} />
        </Tip>
      )}
    </AlertContainer>
    {value.toLocaleString()} {value === 1 ? singular : plural}
  </StatisticContainer>
)

const chooseAlertMessage = (
  requirements: RequirementsAlerts,
  types: Array<keyof RequirementsAlerts>
) => {
  for (const type of types) {
    const result = requirements[type]

    if (result && !result.passed) {
      return result.message
    }
  }
}

export const Statistics: React.FC<{
  node: ManuscriptNode
}> = ({ node }) => {
  const [statistics, setStatistics] = useState<NodeStatistics>()
  const [alerts, setAlerts] = useState<RequirementsAlerts>()

  const validateRequirements = useContext(RequirementsContext)

  useEffect(() => {
    const timer = setTimeout(async () => {
      const text = buildText(node)

      const statistics = {
        text,
        characters: await StatisticsWorker.countCharacters(text),
        words: await StatisticsWorker.countWords(text),
      }

      setStatistics(statistics)

      const alerts = await validateRequirements(node, statistics)

      setAlerts(alerts)
    }, 250)

    return () => {
      clearTimeout(timer)
    }
  }, [validateRequirements, node])

  if (!statistics || !alerts) {
    return null
  }

  return (
    <Container>
      <Statistic
        value={statistics.words}
        alert={chooseAlertMessage(alerts, ['words_maximum', 'words_minimum'])}
        singular={'word'}
        plural={'words'}
      />

      <Statistic
        value={statistics.characters}
        alert={chooseAlertMessage(alerts, [
          'characters_maximum',
          'characters_minimum',
        ])}
        singular={'character'}
        plural={'characters'}
      />
    </Container>
  )
}

const Container = styled.div`
  margin: 8px 0;
`
