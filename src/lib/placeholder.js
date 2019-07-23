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
export const placeholderContent = (label = 'A component', supportEmail) => `
  <div class="placeholder-item-icon">
    <svg width="24" height="24">
      <path d="M12 1.5c5.799 0 10.5 4.701 10.5 10.5S17.799 22.5 12 22.5 1.5 17.799 1.5 12 6.2 1.5 12 1.5zM12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.372 0 12 0zm0 18.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12.02 6a.9.9 0 0 0-.9.9v7.2a.9.9 0 1 0 1.8 0V6.9a.9.9 0 0 0-.9-.9z" fill="#DC5030" fill-rule="evenodd"/>
    </svg>
  </div>
  <div class="placeholder-item-message">
    <div>${label} at this position is failing to sync to this device.</div>
    <div>Please contact <a href="mailto:${supportEmail}" class="placeholder-item-link" target="_blank">${supportEmail}</a> for further assistance.</div>
    </div>
  </div>
`;
