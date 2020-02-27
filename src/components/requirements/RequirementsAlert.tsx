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
import {
  ActualManuscriptNode,
  isNodeType,
  ManuscriptNode,
  SectionNode,
} from '@manuscripts/manuscript-transform'
import { Tip } from '@manuscripts/style-guide'
import React, { useContext, useEffect, useState } from 'react'
import { RequirementsContext } from './RequirementsProvider'

export const RequirementsAlert: React.FC<{ node: ManuscriptNode }> = ({
  node,
}) => {
  const [items, setItems] = useState<string[]>()

  const buildRequirementsAlerts = useContext(RequirementsContext)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (
        isNodeType<ActualManuscriptNode>(node, 'manuscript') ||
        isNodeType<SectionNode>(node, 'section')
      ) {
        const alerts = await buildRequirementsAlerts(node)

        const items = Object.values(alerts).filter(_ => _)

        setItems(items)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
    }
  }, [buildRequirementsAlerts, node])

  if (items && items.length) {
    return (
      <Tip placement={'right'} title={items.join('. ')}>
        <AttentionOrange height={'1em'} />
      </Tip>
    )
  }

  return null
}
