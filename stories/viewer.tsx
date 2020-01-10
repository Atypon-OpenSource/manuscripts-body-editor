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

import { storiesOf } from '@storybook/react'
import { createBrowserHistory } from 'history'
import React from 'react'
import {
  doc,
  getModel,
  manuscript,
  modelMap,
  project,
  user,
} from '../docs/lib/data'
import { renderReactComponent, unmountReactComponent } from '../docs/lib/render'
import { Viewer } from '../src/components/Viewer'
import { PopperManager } from '../src/lib/popper'
import '../styles/Editor.css'

storiesOf('Viewer', module).add('basic', () => (
  <Viewer
    allAttachments={async () => []}
    doc={doc}
    getCurrentUser={() => user}
    getManuscript={() => manuscript}
    getModel={getModel}
    getLibraryItem={getModel}
    history={createBrowserHistory()}
    locale={'en-US'}
    manuscript={manuscript}
    modelMap={modelMap}
    popper={new PopperManager()}
    projectID={project._id}
    renderReactComponent={renderReactComponent}
    unmountReactComponent={unmountReactComponent}
    components={{
      CitationViewer: () => null,
    }}
  />
))
