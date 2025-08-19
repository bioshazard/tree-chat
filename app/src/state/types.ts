export type BranchNode = {
  id: string
  parentId: string | null
  forkSeq: number | null
  title?: string
  createdAt: number
}

export type Message = {
  id: string
  branchId: string
  seq: number
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

