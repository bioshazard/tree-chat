import { useMemo, useRef, useState } from 'react'
import type { BranchNode, Message } from '../state/types'
import { appendMessage, createInitialState, forkBranch, getChildren, getPath, getTranscript, renameBranch, setActiveBranch, updateMessageContent, type TreeState } from '../state/tree'

export function useTreeChat() {
  const [version, setVersion] = useState(0)
  const stateRef = useRef<TreeState>(createInitialState())

  const api = useMemo(() => {
    const get = () => stateRef.current
    const bump = () => setVersion((v) => v + 1)

    return {
      get activeBranchId() {
        return get().activeBranchId
      },
      get branches(): Map<string, BranchNode> {
        return get().branches
      },
      path(): BranchNode[] {
        return getPath(get(), get().activeBranchId)
      },
      transcript(): Message[] {
        return getTranscript(get(), get().activeBranchId)
      },
      children(): BranchNode[] {
        return getChildren(get(), get().activeBranchId)
      },
      sendUser(content: string): Message {
        const msg = appendMessage(get(), {
          branchId: get().activeBranchId,
          role: 'user',
          content,
        })
        bump()
        return msg
      },
      appendAssistant(content: string): Message {
        const msg = appendMessage(get(), {
          branchId: get().activeBranchId,
          role: 'assistant',
          content,
        })
        bump()
        return msg
      },
      updateMessage(id: string, content: string) {
        updateMessageContent(get(), id, content)
        bump()
      },
      fork(fromMessageId: string) {
        forkBranch(get(), fromMessageId)
        bump()
      },
      setActiveBranch(id: string) {
        setActiveBranch(get(), id)
        bump()
      },
      renameBranch(id: string, title: string) {
        renameBranch(get(), id, title)
        bump()
      },
    }
  }, [])

  // tie version to api to refresh derived getters
  useMemo(() => version, [version])

  return api
}
