import { Model } from '@manuscripts/manuscripts-json-schema'
import React from 'react'
import styled from 'styled-components'

const Modal = styled.div`
  min-width: 400px;
  max-width: 600px;
  height: auto;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  border: 1px solid #eee;
  background: #fff;
  border-radius: 8px;
`

const ModalBody = styled.div<{ status: string }>`
  padding: 16px;
  font-weight: bold;
  color: ${props => (props.status === 'error' ? '#f00' : '#444')};
`

const ModalFooter = styled.div`
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`

const ModalAction = styled.button<{ primary: boolean }>`
  border: 2px solid #7fb5d5;
  background: ${props => (props.primary ? '#7fb5d5' : '#fff')};
  color: ${props => (props.primary ? '#fff' : '#7fb5d5')};
  cursor: pointer;
  font-size: inherit;
  border-radius: 4px;
  font-weight: bold;
  padding: 4px;
`

interface Props {
  importFile: (file: File) => Promise<Model[]>
  openFilePicker: () => Promise<File>
  importManuscript: (models: Model[]) => Promise<void>
  handleComplete: () => void
}

interface State {
  canCancel: boolean
  cancelled: boolean
  status: string
  error: Error | null
}

export class Importer extends React.Component<Props, State> {
  public state: Readonly<State> = {
    canCancel: false,
    cancelled: false,
    error: null,
    status: 'Importing…',
  }

  public async componentDidMount() {
    try {
      this.setState({
        canCancel: true,
        status: 'Opening…',
      })

      const data = await this.props.openFilePicker()

      this.setState({
        status: 'Converting…',
      })

      const models = await this.props.importFile(data)

      if (this.state.cancelled) {
        return
      }

      this.setState({
        canCancel: false,
        status: 'Importing…',
      })

      await this.props.importManuscript(models)

      this.setState({
        status: 'Complete',
      })

      this.props.handleComplete()
    } catch (error) {
      this.setState({ error })
    }
  }

  public render() {
    const { error, status, canCancel } = this.state

    if (error) {
      return (
        <Modal>
          <ModalBody status={'error'}>{error.message}</ModalBody>
          <ModalFooter>
            <ModalAction onClick={this.props.handleComplete}>OK</ModalAction>
          </ModalFooter>
        </Modal>
      )
    }

    return (
      <Modal>
        <ModalBody>{status}</ModalBody>
        <ModalFooter>
          {canCancel && (
            <ModalAction onClick={this.handleCancel}>Cancel</ModalAction>
          )}
        </ModalFooter>
      </Modal>
    )
  }

  private handleCancel = () => {
    this.setState(
      {
        cancelled: true,
      },
      this.props.handleComplete
    )
  }
}
