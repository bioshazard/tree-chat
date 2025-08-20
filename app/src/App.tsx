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
import { BranchExplorer } from './components/BranchExplorer'

function App() {
  const [openSettings, setOpenSettings] = useState(false)
  const [busy, setBusy] = useState(false)
  const [persist, setPersist] = useState(loadPersistFlag())
  const [cfg, setCfg] = useState<RuntimeConfig | null>(() => (persist ? loadConfig() : null))
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [showExplorer, setShowExplorer] = useState(false)
  const tree = useTreeChat()
  const path = tree.path()
  const [openBranchIds, setOpenBranchIds] = useState<string[]>([
    path[path.length - 1]?.id ?? tree.activeBranchId,
  ])

  function addOpenBranch(id: string, makeActive = true) {
    setOpenBranchIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    if (makeActive) tree.setActiveBranch(id)
  }

  function closeBranch(id: string) {
    setOpenBranchIds((prev) => prev.filter((b) => b !== id))
    if (tree.activeBranchId === id) {
      // pick last remaining or fallback to root path head
      const next = openBranchIds.filter((b) => b !== id).at(-1) ?? path[0]?.id ?? tree.activeBranchId
      tree.setActiveBranch(next)
    }
  }
  // const transcript = tree.transcript()

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
      const openai = createOpenAI({ baseURL: cfg.baseUrl, apiKey: cfg.apiKey, headers: extraHeaders })
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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-900/70">
        <div className="flex w-full items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <button
              className="rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 sm:hidden"
              onClick={() => setShowExplorer((v) => !v)}
            >
              Branches
            </button>
            <h1 className="text-2xl font-semibold tracking-tight">TreeChat</h1>
          </div>
          <button
            className="rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            onClick={() => setOpenSettings(true)}
          >
            Settings
          </button>
        </div>
      </header>

      <main className="w-full flex-1 p-4 sm:p-6">
        {showExplorer && (
          <div className="mb-4 sm:hidden">
            <BranchExplorer
              branches={tree.branches}
              activeId={tree.activeBranchId}
              onSelect={(id) => {
                addOpenBranch(id)
                setShowExplorer(false)
              }}
              onRename={(id, title) => tree.renameBranch(id, title)}
            />
          </div>
        )}

        <div className="sm:flex sm:gap-6">
          <aside className="hidden sm:block sm:w-60 md:w-72 shrink-0">
            <BranchExplorer
              branches={tree.branches}
              activeId={tree.activeBranchId}
              onSelect={(id) => addOpenBranch(id)}
              onRename={(id, title) => tree.renameBranch(id, title)}
            />
          </aside>
          <section className="flex min-h-[60dvh] flex-1 flex-col gap-6">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}

          <div className="rounded-xl border border-zinc-200/80 bg-white/80 p-3 shadow-sm ring-1 ring-white/40 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/70">
            <Breadcrumbs
              path={path.map((n) => ({ id: n.id, title: n.title ?? 'untitled' }))}
              onSelect={(id) => tree.setActiveBranch(id)}
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            {openBranchIds.map((bid) => {
              const t = tree.transcriptFor(bid)
              const node = tree.branches.get(bid)
              return (
                <div key={bid} className="flex min-w-0 flex-1 flex-col rounded-xl border border-zinc-200/80 bg-white/80 p-3 shadow-sm ring-1 ring-white/40 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/70">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{node?.title ?? 'untitled'}</div>
                    <div className="flex items-center gap-2">
                      {tree.activeBranchId !== bid && (
                        <button
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          onClick={() => tree.setActiveBranch(bid)}
                        >
                          Focus
                        </button>
                      )}
                      <button
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        onClick={() => closeBranch(bid)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1">
                    <MessageList
                      messages={t}
                      onFork={(mid) => {
                        const newId = tree.fork(mid)
                        addOpenBranch(newId)
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="sticky bottom-0 z-10 -mx-2 mt-2 rounded-xl border border-zinc-200/80 bg-white/80 p-3 shadow-xl ring-1 ring-white/40 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-900/70">
            <Composer
              onSend={handleSend}
              busy={busy}
              onAbort={() => {
                abortRef.current?.abort()
              }}
            />
          </div>

          <DevPanel cfg={cfg} />
          </section>
        </div>
      </main>

      {openSettings && (
        <div className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
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
