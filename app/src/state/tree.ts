import type { BranchNode, Message } from './types'
import { generateId } from 'ai'

export type TreeState = {
  branches: Map<string, BranchNode>
  messages: Map<string, Message>
  messagesByBranch: Map<string, Message[]>
  activeBranchId: string
}

export function createInitialState(): TreeState {
  const root: BranchNode = {
    id: crypto.randomUUID(),
    parentId: null,
    forkSeq: null,
    title: 'root',
    createdAt: Date.now(),
  }
  const state: TreeState = {
    branches: new Map([[root.id, root]]),
    messages: new Map(),
    messagesByBranch: new Map([[root.id, []]]),
    activeBranchId: root.id,
  }
  return state
}

export function appendMessage(state: TreeState, m: Omit<Message, 'id' | 'seq' | 'createdAt'> & Partial<Pick<Message, 'createdAt'>>): Message {
  const list = state.messagesByBranch.get(m.branchId)
  if (!list) throw new Error('Unknown branch')
  const seq = (list[list.length - 1]?.seq ?? 0) + 1
  const msg: Message = {
    id: crypto.randomUUID(),
    createdAt: m.createdAt ?? Date.now(),
    seq,
    ...m,
  }
  list.push(msg)
  state.messages.set(msg.id, msg)
  return msg
}

export function forkBranch(state: TreeState, fromMessageId: string): BranchNode {
  const from = state.messages.get(fromMessageId)
  if (!from) throw new Error('Unknown message id to fork from')
  const parentBranch = state.branches.get(from.branchId)!
  const node: BranchNode = {
    id: crypto.randomUUID(),
    parentId: parentBranch.id,
    forkSeq: from.seq,
    title: generateId().slice(0, 6),
    createdAt: Date.now(),
  }
  state.branches.set(node.id, node)
  state.messagesByBranch.set(node.id, [])
  state.activeBranchId = node.id
  return node
}

export function setActiveBranch(state: TreeState, id: string) {
  if (!state.branches.has(id)) throw new Error('Unknown branch id')
  state.activeBranchId = id
}

export function updateMessageContent(state: TreeState, messageId: string, content: string) {
  const m = state.messages.get(messageId)
  if (!m) throw new Error('Unknown message id')
  m.content = content
}

export function getPath(state: TreeState, leafId: string): BranchNode[] {
  const path: BranchNode[] = []
  let cur: BranchNode | undefined = state.branches.get(leafId)
  while (cur) {
    path.push(cur)
    cur = cur.parentId ? state.branches.get(cur.parentId) : undefined
  }
  return path.reverse()
}

export function getTranscript(state: TreeState, leafId: string): Message[] {
  const path = getPath(state, leafId)
  const result: Message[] = []
  for (let i = 0; i < path.length; i++) {
    const node = path[i]
    const list = state.messagesByBranch.get(node.id) ?? []
    if (i === path.length - 1) {
      // active leaf: include all
      result.push(...list)
    } else {
      const child = path[i + 1]
      const cutoff = child.forkSeq ?? 0
      for (const m of list) {
        if (m.seq <= cutoff) result.push(m)
        else break
      }
    }
  }
  return result
}

export function getChildren(state: TreeState, parentId: string): BranchNode[] {
  const out: BranchNode[] = []
  for (const b of state.branches.values()) {
    if (b.parentId === parentId) out.push(b)
  }
  out.sort((a, b) => a.createdAt - b.createdAt)
  return out
}

export function renameBranch(state: TreeState, id: string, title: string) {
  const b = state.branches.get(id)
  if (!b) throw new Error('Unknown branch id')
  b.title = title
}
