import { useState } from 'react'
import type { BranchNode } from '../state/types'

export function BranchExplorer({
  branches,
  activeId,
  onSelect,
  onRename,
}: {
  branches: Map<string, BranchNode>
  activeId: string
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const nodes = Array.from(branches.values())
  const roots = nodes.filter((b) => b.parentId === null)

  function childrenOf(id: string) {
    return nodes
      .filter((b) => b.parentId === id)
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  function startEdit(b: BranchNode) {
    setEditingId(b.id)
    setDraft(b.title ?? '')
  }

  function submit() {
    if (editingId != null) {
      onRename(editingId, draft.trim() || draft)
      setEditingId(null)
    }
  }

  function Node({ b, depth }: { b: BranchNode; depth: number }) {
    const isActive = b.id === activeId
    const kids = childrenOf(b.id)
    return (
      <li>
        <div className="flex items-center gap-2">
          <button
            className={`rounded-md border px-2 py-1 text-xs shadow-sm transition ${
              isActive
                ? 'border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:border-blue-800/60 dark:bg-blue-900/40 dark:text-blue-200'
                : 'border-zinc-300 bg-white/70 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60'
            }`}
            onClick={() => onSelect(b.id)}
            title={b.id}
          >
            {b.title ?? 'untitled'}
          </button>
          {editingId === b.id ? (
            <>
              <input
                className="min-w-32 rounded-md border border-zinc-300 bg-transparent p-1 text-xs outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit()
                  if (e.key === 'Escape') setEditingId(null)
                }}
              />
              <button
                className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white"
                onClick={submit}
              >
                Save
              </button>
            </>
          ) : (
            <button
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              onClick={() => startEdit(b)}
            >
              Rename
            </button>
          )}
        </div>
        {kids.length > 0 && (
          <ul className="ml-3 mt-1 border-l border-dashed border-zinc-300 pl-3 dark:border-zinc-700">
            {kids.map((c) => (
              <Node key={c.id} b={c} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3 shadow-sm ring-1 ring-white/40 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Branch Explorer</div>
      {roots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">No branches</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {roots.map((r) => (
            <Node key={r.id} b={r} depth={0} />
          ))}
        </ul>
      )}
    </div>
  )
}
