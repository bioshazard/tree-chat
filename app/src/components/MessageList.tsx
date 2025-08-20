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
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center text-zinc-500 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/50">
        No messages yet. Try sending one.
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-4">
      {messages.map((m) => {
        const isUser = m.role === 'user'
        return (
          <li key={m.id} className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] items-end gap-2`}>
              {!isUser && (
                <div className="flex h-7 w-7 select-none items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold uppercase text-white">
                  AI
                </div>
              )}
              <div
                className={
                  'relative rounded-2xl px-4 py-2 text-sm shadow-sm ring-1 ' +
                  (isUser
                    ? 'bg-blue-600 text-white ring-blue-500/40'
                    : 'bg-indigo-50 text-zinc-900 ring-indigo-100 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700')
                }
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                {!isUser && (
                  <div className="absolute -right-2 -top-2">
                    <button
                      className={
                        'rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm transition ' +
                      'border-indigo-200 bg-indigo-100/70 text-indigo-700 hover:bg-indigo-200 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }
                      onClick={() => onFork?.(m.id)}
                      title="Fork from here"
                    >
                      Fork
                    </button>
                  </div>
                )}
              </div>
              {isUser && (
                <div className="flex h-7 w-7 select-none items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold uppercase text-white">
                  You
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
