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

import fuzzysort from 'fuzzysort'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'
import styled from 'styled-components'

interface Character {
  character: string
  codepoint: string
  names: string[]
  namesJoined: string
}

export const SymbolPicker: React.FC<{
  handleSelect: (character: string) => void
}> = React.memo(({ handleSelect }) => {
  const [input, setInput] = useState<string>()
  // const [blocks, setBlocks] = useState()
  const [characters, setCharacters] = useState<Character[]>()
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>()

  useEffect(() => {
    // import('./blocks.json').then(({ default: data }) => setBlocks(data))

    import('./characters.json').then(({ default: data }) =>
      setCharacters(
        Object.entries(data).map(([codepoint, names]) => {
          return {
            codepoint,
            names,
            namesJoined: names.join(', '),
            character: String.fromCodePoint(parseInt(codepoint, 16)),
          }
        })
      )
    )
  }, [])

  const getItemKey = useCallback(
    (index: number) => filteredCharacters![index].codepoint,
    [filteredCharacters]
  )

  const listRef = useRef<FixedSizeList>(null)

  useEffect(() => {
    if (!input) {
      setFilteredCharacters([])
      return
    }

    // TODO: debounce or cancel?
    fuzzysort
      .goAsync<Character>(input, characters!, {
        keys: ['namesJoined'],
        limit: 25,
        allowTypo: false,
        threshold: -100,
      })
      .then(results => {
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
      <SymbolSearch
        type={'search'}
        value={input}
        onChange={handleInputChange}
        autoFocus={true}
        placeholder={'Enter the name of a symbol…'}
      />
      <FixedSizeList
        ref={listRef}
        height={300}
        width={600}
        itemCount={filteredCharacters.length}
        itemSize={32}
        itemKey={getItemKey}
      >
        {({ index, style }) => {
          const { character, codepoint, names } = filteredCharacters[index]

          return (
            <SymbolListItem
              style={style}
              key={codepoint}
              id={codepoint}
              onClick={() => handleSelect(character)}
            >
              <Symbol>{character}</Symbol>
              <SymbolName>{names[0]}</SymbolName>
            </SymbolListItem>
          )
        }}
      </FixedSizeList>
    </div>
  )
})

const SymbolSearch = styled.input`
  display: block;
  padding: 8px;
  width: 100%;
  border: none;
  font-size: 16px;
`

const SymbolListItem = styled.div`
  transition: all 200ms ease-in-out;
  padding: 4px 8px;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 24px;

  &:hover {
    background: #eee;
  }
`

const Symbol = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  width: 2em;
`

const SymbolName = styled.div`
  flex: 1;
  color: #777;
`
