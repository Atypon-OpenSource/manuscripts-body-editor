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

import { TextField } from '@manuscripts/style-guide'
import fuzzysort from 'fuzzysort'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'
import styled from 'styled-components'

interface Character {
  character: string
  entity: string
  group: string
  name: string
}

let sortPromise: Fuzzysort.CancelablePromise<Fuzzysort.KeysResults<Character>>

export const SymbolPicker: React.FC<{
  handleSelectCharacter: (character: string) => void
}> = React.memo(({ handleSelectCharacter }) => {
  const [input, setInput] = useState<string>()
  const [characters, setCharacters] = useState<Character[]>()
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>()

  useEffect(() => {
    import('./grouped.json').then(
      ({ default: data }: { default: { [key: string]: object[] } }) => {
        const output: Character[] = []

        for (const [group, items] of Object.entries(data)) {
          for (const item of items) {
            // @ts-ignore
            const [character, entity, _codepoint, name] = item

            output.push({
              character,
              entity,
              group,
              name,
            })
          }
        }

        setCharacters(output)
      }
    )
  }, [])

  const getItemKey = useCallback(
    (index: number) => filteredCharacters![index].character,
    [filteredCharacters]
  )

  const listRef = useRef<FixedSizeList>(null)

  useEffect(() => {
    if (sortPromise) {
      sortPromise.cancel()
    }

    if (!input) {
      setFilteredCharacters([])
      return
    }

    // TODO: debounce?
    sortPromise = fuzzysort.goAsync<Character>(input, characters!, {
      keys: ['entity', 'name'],
      limit: 100,
      allowTypo: false,
      threshold: -100,
    })

    sortPromise.then(results => {
      const output = results.map(result => result.obj)
      setFilteredCharacters(output)
    })
  }, [characters, input])

  const handleInputChange = useCallback(event => {
    setInput(event.target.value)
  }, [])

  if (!filteredCharacters) {
    return null // TODO: loading
  }

  return (
    <div>
      <SearchContainer>
        <TextField
          type={'search'}
          value={input}
          onChange={handleInputChange}
          autoFocus={true}
          placeholder={'Enter the name of a symbol…'}
        />
      </SearchContainer>

      <FixedSizeList
        ref={listRef}
        height={300}
        width={600}
        itemCount={filteredCharacters.length}
        itemSize={64}
        itemKey={getItemKey}
      >
        {({ index, style }) => {
          const { character, name, entity, group } = filteredCharacters[index]

          return (
            <SymbolListItem
              style={style}
              key={character}
              id={character}
              onClick={() => handleSelectCharacter(character)}
            >
              <SymbolListItemSection>
                <Symbol>{character}</Symbol>
                <SymbolName>
                  {name} {entity && <code>{entity}</code>}
                </SymbolName>
              </SymbolListItemSection>
              <SymbolListItemSection>
                <SymbolGroup>{group}</SymbolGroup>
              </SymbolListItemSection>
            </SymbolListItem>
          )
        }}
      </FixedSizeList>
    </div>
  )
})

const SearchContainer = styled.div`
  padding: 8px;
`

const SymbolListItem = styled.div`
  transition: all 200ms ease-in-out;
  padding: 8px;
  white-space: nowrap;
  cursor: pointer;
  box-sizing: border-box;

  &:hover {
    background: #f5fbfc;
  }
`

const SymbolListItemSection = styled.div`
  display: flex;
  align-items: center;
`

const Symbol = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  width: 32px;
  font-size: 20px;
`

const SymbolName = styled.div`
  flex: 1;
  color: #777;
  font-size: 16px;
`

const SymbolGroup = styled.div`
  flex: 1;
  color: #777;
  font-size: 16px;
  padding-left: 32px;
`
