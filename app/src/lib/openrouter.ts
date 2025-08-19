import type { RuntimeConfig } from '../settings'

export async function streamOpenRouterChat({
  cfg,
  messages,
  signal,
  onToken,
}: {
  cfg: RuntimeConfig
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  signal: AbortSignal
  onToken: (delta: string) => void
}) {
  const url = cfg.baseUrl.replace(/\/$/, '') + '/chat/completions'
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  if (cfg.baseUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'TreeChat Dev'
  }
  // eslint-disable-next-line no-console
  console.debug('OpenRouter POST /chat/completions', { url, model: cfg.model, headers, messagesPreview: messages.map(m => ({ role: m.role, content: m.content.slice(0, 40) })) })

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: cfg.model, stream: true, messages }),
    signal,
  })
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const lines = chunk.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const delta = json?.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta) onToken(delta)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('SSE parse error', { line: trimmed, err })
        }
      }
    }
  }
}

