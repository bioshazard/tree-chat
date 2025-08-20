import { useState } from 'react'

export function Composer({
  onSend,
  busy = false,
  onAbort,
}: {
  onSend: (content: string) => void
  busy?: boolean
  onAbort?: () => void
}) {
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    onSend(t)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-12 w-full resize-y rounded-xl border border-zinc-300 bg-white/70 p-3 text-sm outline-none ring-1 ring-white/40 backdrop-blur focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900/60"
        placeholder="Type a message"
      />
      {busy ? (
        <button
          type="button"
          onClick={onAbort}
          className="shrink-0 rounded-xl border border-zinc-300 bg-white/70 px-3 py-2 text-sm shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-800"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Send
        </button>
      )}
    </form>
  )
}
