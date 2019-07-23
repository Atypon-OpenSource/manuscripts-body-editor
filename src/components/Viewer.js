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
import { schema, } from '@manuscripts/manuscript-transform';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import React from 'react';
import '../lib/smooth-scroll';
import plugins from '../plugins/viewer';
import views from '../views/viewer';
export class Viewer extends React.PureComponent {
    constructor(props) {
        super(props);
        this.editorRef = React.createRef();
        const { attributes, doc } = this.props;
        debugger;
        this.view = new EditorView(undefined, {
            editable: () => false,
            state: EditorState.create({
                doc,
                schema,
                plugins: plugins(this.props),
            }),
            nodeViews: views(this.props),
            attributes,
        });
    }
    componentDidMount() {
        if (this.editorRef.current) {
            this.editorRef.current.appendChild(this.view.dom);
        }
    }
    render() {
        return React.createElement("div", { ref: this.editorRef });
    }
}
