/*!
 * © 2021 Atypon Systems LLC
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
import React from 'react'

import TableCellBorderOptions from './TableCellBorderOptions'
import TableCellOptions from './TableCellOptions'
import TableOptions from './TableOptions'
import { Props } from './types'
export { DialogNames } from './types'

const Lookup = {
  TableOptions,
  TableCellOptions,
  TableCellBorderOptions,
}

export const DialogController: React.FC<Props> = (props) => {
  const { currentDialog } = props

  if (!currentDialog) {
    return null
  }

  const Component = Lookup[currentDialog]

  return <Component {...props} />
}
