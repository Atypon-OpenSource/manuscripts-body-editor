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

import AttentionOrange from '@manuscripts/assets/react/AttentionOrange'
import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import { Tip } from '@manuscripts/style-guide'
import '@manuscripts/style-guide/styles/tip.css'
import React, { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import { buildNodeStatistics, NodeStatistics } from '../../lib/statistics'
import { RequirementsAlerts, RequirementsContext } from './RequirementsProvider'

const AlertContainer = styled.div`
  display: inline-flex;
  align-items: center;
  height: 1em;
  width: 24px;
`

const StatisticContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0;
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
          <AttentionOrange height={'1em'} />
        </Tip>
      )}
    </AlertContainer>
    {value.toLocaleString()} {value === 1 ? singular : plural}
  </StatisticContainer>
)

export const Statistics: React.FC<{
  node: ManuscriptNode
}> = ({ node }) => {
  const [statistics, setStatistics] = useState<NodeStatistics>()
  const [alerts, setAlerts] = useState<RequirementsAlerts>()

  const buildRequirementsAlerts = useContext(RequirementsContext)

  useEffect(() => {
    const statistics = buildNodeStatistics(node)

    setAlerts(buildRequirementsAlerts(node, statistics))
    setStatistics(statistics)
  }, [buildRequirementsAlerts, setStatistics, setAlerts, node])

  if (!statistics || !alerts) {
    return null
  }

  return (
    <Container>
      <Statistic
        value={statistics.words}
        alert={alerts.words}
        singular={'word'}
        plural={'words'}
      />

      <Statistic
        value={statistics.characters}
        alert={alerts.characters}
        singular={'character'}
        plural={'characters'}
      />
    </Container>
  )
}

const Container = styled.div`
  margin: 8px 0;
`
