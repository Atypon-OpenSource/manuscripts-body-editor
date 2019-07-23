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

// adapted from https://github.com/podefr/react-debounce-render/pull/12/

import { DebounceSettings } from 'lodash'
import { debounce } from 'lodash-es'
import React, { Component } from 'react'

export const debounceRender = <Props extends {}>(
  DebouncedComponent: React.ComponentType<Props>, // tslint:disable-line:no-any
  wait?: number,
  options?: DebounceSettings
) => {
  return class DebouncedContainer extends Component<Props> {
    public updateDebounced = debounce(this.forceUpdate, wait, options)

    public shouldComponentUpdate() {
      this.updateDebounced()
      return false
    }

    public componentWillUnmount() {
      this.updateDebounced.cancel()
    }

    public render() {
      return <DebouncedComponent {...this.props} />
    }
  }
}
