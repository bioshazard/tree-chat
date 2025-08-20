import { useState } from 'react'
import type { RuntimeConfig } from '../settings'

function buildHeaders(cfg: RuntimeConfig) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    'Content-Type': 'application/json',
  }
  if (cfg.baseUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'TreeChat Dev'
  }
  return headers
}

export function DevPanel({ cfg }: { cfg: RuntimeConfig | null }) {
  const [busy, setBusy] = useState(false)
  const [output, setOutput] = useState<string>('')

  async function testModels() {
    setOutput('')
    if (!cfg) {
      setOutput('Configure Settings first.')
      return
    }
    setBusy(true)
    try {
      const url = cfg.baseUrl.replace(/\/$/, '') + '/models'
      const res = await fetch(url, { headers: buildHeaders(cfg) })
      const text = await res.text()
      setOutput(`GET ${url}\nstatus: ${res.status}\n${text.slice(0, 2000)}`)
      // eslint-disable-next-line no-console
      console.debug('DevPanel /models response', { status: res.status, text })
    } catch (e: any) {
      setOutput('Error: ' + (e?.message ?? String(e)))
      // eslint-disable-next-line no-console
      console.error('DevPanel /models error', e)
    } finally {
      setBusy(false)
    }
  }

  async function testChatCompletions() {
    setOutput('')
    if (!cfg) return setOutput('Configure Settings first.')
    setBusy(true)
    try {
      const url = cfg.baseUrl.replace(/\/$/, '') + '/chat/completions'
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...buildHeaders(cfg),
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: cfg.model,
          stream: true,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say hello briefly.' },
          ],
        }),
      })
      const reader = res.body?.getReader()
      let received = ''
      if (reader) {
        const decoder = new TextDecoder()
        for (let i = 0; i < 10; i++) {
          const { value, done } = await reader.read()
          if (done) break
          received += decoder.decode(value, { stream: true })
          if (received.length > 2000) break
        }
      }
      setOutput(`POST ${url}\nstatus: ${res.status}\nfirst-bytes:\n${received || '(no stream data)'}`)
      console.debug('DevPanel chat/completions stream bytes', { status: res.status, received })
    } catch (e: any) {
      setOutput('Error: ' + (e?.message ?? String(e)))
      console.error('DevPanel chat/completions error', e)
    } finally {
      setBusy(false)
    }
  }

  async function testResponses() {
    setOutput('')
    if (!cfg) return setOutput('Configure Settings first.')
    setBusy(true)
    try {
      const url = cfg.baseUrl.replace(/\/$/, '') + '/responses'
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...buildHeaders(cfg),
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model: cfg.model,
          input: 'Say hello briefly.',
          stream: true,
        }),
      })
      const reader = res.body?.getReader()
      let received = ''
      if (reader) {
        const decoder = new TextDecoder()
        for (let i = 0; i < 10; i++) {
          const { value, done } = await reader.read()
          if (done) break
          received += decoder.decode(value, { stream: true })
          if (received.length > 2000) break
        }
      }
      setOutput(`POST ${url}\nstatus: ${res.status}\nfirst-bytes:\n${received || '(no stream data)'}`)
      console.debug('DevPanel responses stream bytes', { status: res.status, received })
    } catch (e: any) {
      setOutput('Error: ' + (e?.message ?? String(e)))
      console.error('DevPanel responses error', e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-200/80 bg-white/70 p-4 text-xs text-zinc-700 shadow-sm ring-1 ring-white/40 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-300">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Dev Tools</div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 shadow-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-800"
            onClick={testModels}
            disabled={busy}
          >
            Test /models
          </button>
          <button
            className="rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 shadow-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-800"
            onClick={testChatCompletions}
            disabled={busy}
          >
            Test /chat/completions
          </button>
          <button
            className="rounded-lg border border-zinc-300 bg-white/70 px-2 py-1 shadow-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-800"
            onClick={testResponses}
            disabled={busy}
          >
            Test /responses
          </button>
        </div>
      </div>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-2 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-950/40 dark:ring-zinc-800">{output || 'No output yet.'}</pre>
      <div className="mt-2 text-zinc-500">
        Tip: OpenRouter requires browser headers (HTTP-Referer, X-Title); these are added automatically when base URL contains openrouter.ai
      </div>
    </div>
  )
}
