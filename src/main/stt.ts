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

export function setSttListener(l: SttListener | null): void {
  listener = l
}

export function initSTT(key: string): void {
  apiKey = key
  client = new DeepgramClient({ apiKey: key })
}

export async function startTranscription(): Promise<void> {
  if (!client) {
    listener?.onError?.(new Error('Deepgram client not initialized'))
    return
  }

  try {
    const conn = await client.listen.v2.connect({
      model: 'flux-general-multi',
      encoding: 'linear16',
      sample_rate: SAMPLE_RATE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Authorization: `Token ${apiKey}` as any
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket = conn as any

    conn.on('open', () => {
      console.log('[stt] websocket connected')
    })

    conn.on('message', (msg: { type: string; transcript?: string; event?: string }) => {
      if (msg.type === 'TurnInfo') {
        const text = msg.transcript?.trim() || ''
        if (!text) return

        if (msg.event === 'EndOfTurn' || msg.event === 'EagerEndOfTurn') {
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
  if (socket && socket.readyState === 1) {
    try {
      socket.sendMedia(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength))
    } catch {
      // ignore send errors during shutdown
    }
  }
}

export function stopTranscription(): void {
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
