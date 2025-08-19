export type RuntimeConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

const LS_KEY = 'treechat.settings.persist'
const LS_CFG = 'treechat.settings.config'

export function loadPersistFlag(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === '1'
  } catch {
    return false
  }
}

export function savePersistFlag(v: boolean) {
  try {
    localStorage.setItem(LS_KEY, v ? '1' : '0')
  } catch {}
}

export function loadConfig(): RuntimeConfig | null {
  try {
    const raw = localStorage.getItem(LS_CFG)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveConfig(cfg: RuntimeConfig | null) {
  try {
    if (cfg) localStorage.setItem(LS_CFG, JSON.stringify(cfg))
    else localStorage.removeItem(LS_CFG)
  } catch {}
}

