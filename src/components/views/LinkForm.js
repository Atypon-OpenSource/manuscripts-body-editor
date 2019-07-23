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
import { Button, MiniButton, PrimarySubmitButton, TextField, } from '@manuscripts/style-guide';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
export const LinkForm = ({ handleCancel, handleRemove, handleSave, value }) => {
    const [href, setHref] = useState(value.href);
    const [text, setText] = useState(value.text);
    const handleSubmit = useCallback(event => {
        event.preventDefault();
        handleSave({ href, text });
    }, [href, text]);
    return (React.createElement(Form, { onSubmit: handleSubmit },
        React.createElement(Field, null,
            React.createElement(FieldHeading, null,
                React.createElement(Label, null, "URL"),
                href && React.createElement(Open, { href: href, target: '_blank' })),
            React.createElement(TextField, { type: 'url', name: 'href', value: href, autoComplete: 'off', autoFocus: true, required: true, pattern: 'https?://.+', onChange: event => {
                    setHref(event.target.value);
                } })),
        React.createElement(Field, null,
            React.createElement(FieldHeading, null,
                React.createElement(Label, null, "Text")),
            React.createElement(TextField, { type: 'text', name: 'text', value: text, autoComplete: 'off', required: true, onChange: event => {
                    setText(event.target.value);
                } })),
        React.createElement(Actions, null,
            React.createElement(ActionGroup, null,
                React.createElement(MiniButton, { onClick: handleRemove }, "Remove Link")),
            React.createElement(ActionGroup, null,
                React.createElement(Button, { onClick: handleCancel }, "Cancel"),
                React.createElement(PrimarySubmitButton, null, "Save")))));
};
const Form = styled.form `
  padding: 16px;
`;
const Actions = styled.div `
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;
const ActionGroup = styled.span `
  display: flex;
  align-items: center;
`;
const Field = styled.div `
  margin-bottom: 16px;
`;
const FieldHeading = styled.div `
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;
const Label = styled.label `
  display: flex;
  align-items: center;
  color: #777777;
  font-size: 14px;
`;
const Open = styled.a `
  display: inline-block;
  margin-left: 8px;
  text-transform: uppercase;
  color: inherit;
  font-size: 12px;
  text-decoration: none;

  &:after {
    content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
    margin-left: 4px;
  }
`;
