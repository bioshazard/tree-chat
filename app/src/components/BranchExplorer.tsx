import { useState } from 'react'
import type { BranchNode } from '../state/types'

export function BranchExplorer({
  path,
  children,
  activeId,
  onSelect,
  onRename,
}: {
  path: BranchNode[]
  children: BranchNode[]
  activeId: string
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

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

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-3 shadow-sm ring-1 ring-white/40 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/70">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Branch Explorer</div>

      <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        Path:
        <span className="ml-2">
          {path.map((b, i) => (
            <span key={b.id}>
              <button
                className={`rounded px-1.5 py-0.5 ${b.id === activeId ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                onClick={() => onSelect(b.id)}
              >
                {b.title ?? 'untitled'}
              </button>
              {i < path.length - 1 && <span className="px-1 text-zinc-400">›</span>}
            </span>
          ))}
        </span>
      </div>

      <div className="text-sm">
        <div className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Children</div>
        {children.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">No child branches</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {children.map((b) => (
              <li key={b.id} className="flex items-center gap-2">
                <button
                  className={`rounded-md border px-2 py-1 text-xs shadow-sm transition ${
                    b.id === activeId
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

