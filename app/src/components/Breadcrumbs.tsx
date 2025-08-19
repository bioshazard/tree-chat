import React from 'react'

type Crumb = {
  id: string
  title: string
}

export function Breadcrumbs({ path, onSelect }: { path: Crumb[]; onSelect?: (id: string) => void }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
      {path.map((c, i) => (
        <React.Fragment key={c.id}>
          <button
            className="rounded px-1.5 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => onSelect?.(c.id)}
          >
            {c.title}
          </button>
          {i < path.length - 1 && <span className="px-1">/</span>}
        </React.Fragment>
      ))}
    </nav>
  )
}
