import { useRef, useState } from 'react'
import { Breadcrumbs } from './components/Breadcrumbs'
import { Composer } from './components/Composer'
import { MessageList } from './components/MessageList'
import { useTreeChat } from './hooks/useTreeChat'
import { loadConfig, loadPersistFlag, saveConfig, savePersistFlag } from './settings'
import type { RuntimeConfig } from './settings'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { DevPanel } from './components/DevPanel'

function App() {
  const [openSettings, setOpenSettings] = useState(false)
  const [busy, setBusy] = useState(false)
  const [persist, setPersist] = useState(loadPersistFlag())
  const [cfg, setCfg] = useState<RuntimeConfig | null>(() => (persist ? loadConfig() : null))
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const tree = useTreeChat()
  const path = tree.path()
  const transcript = tree.transcript()

  async function handleSend(content: string) {
    setError(null)
    if (!cfg?.baseUrl || !cfg?.model || !cfg?.apiKey) {
      setError('Please configure Base URL, API Key, and Model in Settings.')
      return
    }
    tree.sendUser(content)
    const assistantMsg = tree.appendAssistant('')
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    try {
      const extraHeaders: Record<string, string> = {}
      if (cfg.baseUrl.includes('openrouter.ai')) {
        extraHeaders['HTTP-Referer'] = window.location.origin
        extraHeaders['X-Title'] = 'TreeChat Dev'
      }
      const openai = createOpenAI({ baseURL: cfg.baseUrl, apiKey: cfg.apiKey, headers: extraHeaders, compatibility: 'strict' })
      const transcript = tree.transcript()
      // eslint-disable-next-line no-console
      console.debug('Streaming start', {
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        messages: transcript.map((m) => ({ role: m.role, content: m.content.slice(0, 40) })),
        headers: extraHeaders,
      })
      const result = await streamText({
        model: openai.chat(cfg.model),
        messages: transcript.map((m) => ({ role: m.role, content: m.content })),
        abortSignal: controller.signal,
      })

      for await (const delta of result.textStream) {
        tree.updateMessage(assistantMsg.id, (assistantMsg.content += delta))
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // eslint-disable-next-line no-console
        console.log('Streaming aborted')
      } else {
        setError(e?.message ?? 'Streaming failed')
        // eslint-disable-next-line no-console
        console.error('Streaming error', e)
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">TreeChat</h1>
        <button
          className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          onClick={() => setOpenSettings(true)}
        >
          Settings
        </button>
      </header>

      <main className="container mx-auto flex max-w-3xl flex-1 flex-col gap-3 p-3">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <Breadcrumbs
          path={path.map((n) => ({ id: n.id, title: n.title ?? 'untitled' }))}
          onSelect={(id) => tree.setActiveBranch(id)}
        />

        <MessageList messages={transcript} onFork={(id) => tree.fork(id)} />

        <Composer
          onSend={handleSend}
          busy={busy}
          onAbort={() => {
            abortRef.current?.abort()
          }}
        />

        <DevPanel cfg={cfg} />
      </main>

      {openSettings && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Settings</h2>
              <button
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() => setOpenSettings(false)}
              >
                Close
              </button>
            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (persist) saveConfig(cfg)
                else saveConfig(null)
                savePersistFlag(persist)
                setOpenSettings(false)
              }}
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Base URL</span>
                <input
                  className="rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                  placeholder="https://api.openai.com/v1"
                  value={cfg?.baseUrl ?? ''}
                  onChange={(e) => setCfg({ ...(cfg ?? { apiKey: '', model: '' }), baseUrl: e.target.value })}
                />
              </label>
              {cfg?.baseUrl?.includes('openrouter.ai') && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  Using OpenRouter: browser headers (HTTP-Referer, X-Title) will be added automatically for dev.
                </div>
              )}
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">API Key</span>
                <input
                  className="rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                  placeholder="sk-..."
                  value={cfg?.apiKey ?? ''}
                  onChange={(e) => setCfg({ ...(cfg ?? { baseUrl: '', model: '' }), apiKey: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Model</span>
                <input
                  className="rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                  placeholder="gpt-4o-mini"
                  value={cfg?.model ?? ''}
                  onChange={(e) => setCfg({ ...(cfg ?? { baseUrl: '', apiKey: '' }), model: e.target.value })}
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                />
                <span>Persist in localStorage</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  onClick={() => setOpenSettings(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
