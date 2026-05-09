import WebSocket from 'ws'

export type SttListener = {
  onInterim?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (error: Error) => void
}

const SAMPLE_RATE = 16000

let ws: WebSocket | null = null
let listener: SttListener | null = null
let apiKey: string = ''
let pendingChunks: Buffer[] = []
let finalTimeout: ReturnType<typeof setTimeout> | null = null
let lastText = ''

export function setSttListener(l: SttListener | null): void {
  listener = l
}

export function initSTT(key: string): void {
  apiKey = key
}

function buildUrl(): string {
  const params = new URLSearchParams({
    model: 'nova-2',
    language: 'pt',
    encoding: 'linear16',
    sample_rate: String(SAMPLE_RATE),
    channels: '1',
    smart_format: 'true',
    punctuate: 'true',
    interim_results: 'true',
    endpointing: '200'
  })
  return `wss://api.deepgram.com/v1/listen?${params.toString()}`
}

export function startTranscription(): void {
  pendingChunks = []
  lastText = ''
  if (finalTimeout) {
    clearTimeout(finalTimeout)
    finalTimeout = null
  }

  try {
    const url = buildUrl()
    ws = new WebSocket(url, {
      headers: { Authorization: `Token ${apiKey}` }
    })

    ws.on('open', () => {
      console.log('[stt] websocket connected')
      for (const chunk of pendingChunks) {
        ws?.send(chunk)
      }
      pendingChunks = []
    })

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type !== 'Results') return

        const alt = msg.channel?.alternatives?.[0]
        if (!alt) return
        const text = (alt.transcript || '').trim()

        if (msg.is_final) {
          console.log('[stt] final:', text)
          if (text) {
            lastText = text
            listener?.onFinal?.(text)
          }
        } else if (text) {
          lastText = text
          listener?.onInterim?.(text)
        }
      } catch {
        // ignore parse errors
      }
    })

    ws.on('error', (err: Error) => {
      console.error('[stt] error:', err.message)
      listener?.onError?.(err)
    })

    ws.on('close', () => {
      console.log('[stt] websocket closed')
      ws = null
    })

    console.log('[stt] transcription started')
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to start transcription')
    console.error('[stt] failed to connect:', error)
    listener?.onError?.(error)
  }
}

export function sendAudioChunk(chunk: Buffer): void {
  if (!ws) {
    pendingChunks.push(chunk)
    return
  }
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(chunk)
    } catch {
      // ignore send errors during shutdown
    }
  } else {
    pendingChunks.push(chunk)
  }
}

export function requestFinal(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return

  try {
    ws.send(JSON.stringify({ type: 'CloseStream' }))
  } catch {
    // best effort
  }

  const finalText = lastText
  if (finalText) {
    listener?.onFinal?.(finalText)
  }

  finalTimeout = setTimeout(() => {
    stopTranscription()
  }, 1000)
}

export function stopTranscription(): void {
  pendingChunks = []
  if (finalTimeout) {
    clearTimeout(finalTimeout)
    finalTimeout = null
  }
  if (ws) {
    try {
      ws.close()
    } catch {
      // best effort cleanup
    }
    ws = null
  }
  lastText = ''
}

export function cleanupSTT(): void {
  stopTranscription()
  listener = null
}
