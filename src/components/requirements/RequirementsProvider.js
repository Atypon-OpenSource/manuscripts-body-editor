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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Comlink from 'comlink';
import React, { createContext } from 'react';
import { buildText } from '../../lib/statistics';
const StatisticsWorker = Comlink.wrap(new Worker('../../lib/statistics.worker', { type: 'module' }));
export const RequirementsContext = createContext(() => __awaiter(this, void 0, void 0, function* () { return ({}); }));
export const RequirementsProvider = ({ modelMap, children }) => {
    const getActiveRequirementCount = (id) => {
        if (!id) {
            return undefined;
        }
        const requirement = modelMap.get(id);
        if (!requirement) {
            return undefined;
        }
        if (requirement.ignored) {
            return undefined;
        }
        return requirement.count;
    };
    const buildRequirementsAlerts = (node, statistics) => __awaiter(this, void 0, void 0, function* () {
        const output = {};
        const { id } = node.attrs;
        if (!id) {
            return output;
        }
        const model = modelMap.get(id);
        if (!model) {
            return output;
        }
        const requirements = {
            words: {
                minimum: getActiveRequirementCount(model.minWordCountRequirement),
                maximum: getActiveRequirementCount(model.maxWordCountRequirement),
            },
            characters: {
                minimum: getActiveRequirementCount(model.minCharacterCountRequirement),
                maximum: getActiveRequirementCount(model.maxCharacterCountRequirement),
            },
        };
        const hasWordsRequirement = requirements.words.maximum || requirements.words.minimum;
        const hasCharactersRequirement = requirements.characters.maximum || requirements.characters.minimum;
        const hasAnyRequirement = hasWordsRequirement || hasCharactersRequirement;
        if (hasAnyRequirement) {
            const type = node.type.name;
            const text = statistics ? statistics.text : buildText(node);
            if (hasWordsRequirement) {
                const count = statistics
                    ? statistics.words
                    : yield StatisticsWorker.countWords(text);
                const { maximum, minimum } = requirements.words;
                if (maximum !== undefined && count > maximum) {
                    output.words = `The ${type} should have a maximum of ${maximum.toLocaleString()} words`;
                }
                if (minimum !== undefined && count < minimum) {
                    output.words = `The ${type} should have a minimum of ${minimum.toLocaleString()} words`;
                }
            }
            if (hasCharactersRequirement) {
                const count = statistics
                    ? statistics.characters
                    : yield StatisticsWorker.countCharacters(text);
                const { maximum, minimum } = requirements.characters;
                if (maximum !== undefined && count > maximum) {
                    output.characters = `The ${type} should have a maximum of ${maximum.toLocaleString()} characters`;
                }
                if (minimum !== undefined && count < minimum) {
                    output.characters = `The ${type} should have a minimum of ${minimum.toLocaleString()} characters`;
                }
            }
        }
        return output;
    });
    return (React.createElement(RequirementsContext.Provider, { value: buildRequirementsAlerts }, children));
};
