import { DeepgramClient } from '@deepgram/sdk'

export type SttListener = {
  onInterim?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (error: Error) => void
}

const SAMPLE_RATE = 16000

let client: DeepgramClient | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let socket: any = null
let listener: SttListener | null = null
let apiKey: string = ''
let pendingChunks: Buffer[] = []

export function setSttListener(l: SttListener | null): void {
  listener = l
}

export function initSTT(key: string): void {
  apiKey = key
  client = new DeepgramClient({ apiKey: key })
}

function flushPending(): void {
  if (!socket || socket.readyState !== 1) return
  for (const chunk of pendingChunks) {
    socket.sendMedia(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength))
  }
  pendingChunks = []
}

export async function startTranscription(): Promise<void> {
  if (!client) {
    listener?.onError?.(new Error('Deepgram client not initialized'))
    return
  }

  pendingChunks = []

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn: any = await client.listen.v2.connect({
      model: 'flux-general-multi',
      encoding: 'linear16',
      sample_rate: SAMPLE_RATE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Authorization: `Token ${apiKey}` as any,
      queryParams: {
        smart_format: 'true',
        punctuate: 'true',
        interim_results: 'true'
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket = conn as any

    conn.on('open', () => {
      console.log('[stt] websocket connected')
      flushPending()
    })

    conn.on('message', (msg: Record<string, unknown>) => {
      console.log('[stt] msg type:', msg.type, 'event:', (msg as { event?: string }).event)
      if (msg.type === 'TurnInfo') {
        const text = ((msg as { transcript?: string }).transcript || '').trim()
        if (!text) return

        const event = (msg as { event?: string }).event
        if (event === 'EndOfTurn' || event === 'EagerEndOfTurn') {
          console.log('[stt] final:', text)
          listener?.onFinal?.(text)
        } else {
          listener?.onInterim?.(text)
        }
      }
    })

    conn.on('error', (err: Error) => {
      console.error('[stt] error:', err)
      listener?.onError?.(err instanceof Error ? err : new Error(String(err)))
    })

    conn.on('close', () => {
      console.log('[stt] websocket closed')
      socket = null
    })

    console.log('[stt] transcription started')
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to start transcription')
    console.error('[stt] failed to connect:', error)
    listener?.onError?.(error)
  }
}

export function sendAudioChunk(chunk: Buffer): void {
  if (!socket) {
    pendingChunks.push(chunk)
    return
  }
  if (socket.readyState === 1) {
    try {
      socket.sendMedia(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength))
    } catch {
      // ignore send errors during shutdown
    }
  } else {
    pendingChunks.push(chunk)
  }
}

export function stopTranscription(): void {
  pendingChunks = []
  if (socket) {
    try {
      socket.sendCloseStream({ type: 'CloseStream' })
      socket.close()
    } catch {
      // best effort cleanup
    }
    socket = null
  }
}

export function cleanupSTT(): void {
  stopTranscription()
  client = null
  listener = null
}
