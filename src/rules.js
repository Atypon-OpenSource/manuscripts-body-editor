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
import { schema } from '@manuscripts/manuscript-transform';
import { ellipsis, emDash, inputRules, smartQuotes, textblockTypeInputRule, wrappingInputRule, } from 'prosemirror-inputrules';
export default inputRules({
    rules: [
        ...smartQuotes,
        ellipsis,
        emDash,
        wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote),
        wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, match => ({ order: +match[1] }), (match, node) => node.childCount + node.attrs.order === +match[1]),
        wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list),
        textblockTypeInputRule(/^```$/, schema.nodes.listing_element),
        textblockTypeInputRule(new RegExp('^(#{1,6})\\s$'), schema.nodes.heading, match => ({ level: match[1].length })),
    ],
});
