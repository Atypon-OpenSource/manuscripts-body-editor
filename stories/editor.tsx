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
import { action } from '@storybook/addon-actions'
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
import { Editor } from '../src/components/Editor'
import { PopperManager } from '../src/lib/popper'
import '../styles/Editor.css'

storiesOf('Editor', module).add('basic', () => (
  <Editor
    allAttachments={async () => []}
    doc={doc}
    getCurrentUser={() => user}
    getManuscript={() => manuscript}
    getModel={getModel}
    getLibraryItem={getModel}
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
    getCitationProcessor={() => undefined}
    plugins={[]}
    subscribe={action('subscribe to changes')}
    setLibraryItem={action('set library item')}
    filterLibraryItems={() => Promise.resolve([])}
    matchLibraryItemByIdentifier={x => x}
    setView={action('set view')}
    handleStateChange={action('change the state')}
    permissions={{ write: true }}
    history={createBrowserHistory()} // why is this here? can we live without it?
    jupyterConfig={{ url: '', token: '' }} // can we get rid of this? Can it be an external component somehow?
    saveModel={console.log} // (model) => Promise<void>
    deleteModel={console.log} // (id: string) => Promise<void>
    putAttachment={console.log} // (id: string, File: File/Blob) => Promise<void>
  />
))
