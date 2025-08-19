export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export function MessageList({
  messages,
  onFork,
}: {
  messages: ChatMessage[]
  onFork?: (messageId: string) => void
}) {
  if (messages.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
        No messages yet. Try sending one.
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((m) => (
        <li key={m.id} className="group">
          <div
            className={
              'flex items-start gap-3 rounded-md border p-3 ' +
              (m.role === 'user'
                ? 'border-blue-200/60 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900')
            }
          >
            <div className="mt-0.5 shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {m.role}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
            <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
              <button
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() => onFork?.(m.id)}
                title="Fork from here"
              >
                Fork
              </button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
