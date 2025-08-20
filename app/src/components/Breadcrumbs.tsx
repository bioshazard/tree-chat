import React from 'react'

type Crumb = {
  id: string
  title: string
}

export function Breadcrumbs({ path, onSelect }: { path: Crumb[]; onSelect?: (id: string) => void }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
      {path.map((c, i) => {
        const active = i === path.length - 1
        return (
          <React.Fragment key={c.id}>
            <button
              className={
                'rounded-full px-2 py-0.5 transition ' +
                (active
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200'
                  : 'bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/60')
              }
              onClick={() => onSelect?.(c.id)}
            >
              {c.title}
            </button>
            {i < path.length - 1 && <span className="px-1 text-zinc-400">›</span>}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
