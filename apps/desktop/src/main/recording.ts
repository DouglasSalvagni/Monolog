import { BrowserWindow, clipboard } from 'electron'
import { setTrayRecording, setTrayIdle } from './tray'
import {
  startCapture,
  stopCapture,
  setListener,
  isRecording,
  cleanupCapture,
  type AudioErrorPayload
} from './audio-capture'
import {
  startTranscription,
  sendAudioChunk,
  requestFinal,
  stopTranscription,
  setSttListener,
  cleanupSTT,
  initSTT
} from './stt'
import { initRefine, refineText, cleanupRefine, isRefineAvailable } from './refine'
import { callRefineEdgeFunction } from './supabase'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}

function send(channel: string, ...args: unknown[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

function onLevel(level: number): void {
  send('audio:level', { level })
}

function onChunk(chunk: Buffer): void {
  sendAudioChunk(chunk)
}

function onInterim(text: string): void {
  send('transcription:interim', { text })
}

function onFinal(text: string): void {
  console.log(`[recording] final: "${text}"`)
  send('transcription:final', { text })

  const duration = 0

  callRefineEdgeFunction(text, duration)
    .then(({ refinedText, error: edgeError }) => {
      if (!edgeError && refinedText) {
        console.log('[recording] edge function success:', refinedText)
        clipboard.writeText(refinedText)
        send('transcription:refined', { refined: refinedText })
        return
      }

      console.log('[recording] edge function failed:', edgeError || 'no result')
      fallbackRefine(text)
    })
    .catch((err) => {
      console.log('[recording] edge function error, falling back:', err.message)
      fallbackRefine(text)
    })
}

function fallbackRefine(text: string): void {
  if (!isRefineAvailable()) {
    clipboard.writeText(text)
    send('transcription:refined', { refined: text })
    return
  }

  refineText(text)
    .then((refined) => {
      clipboard.writeText(refined)
      console.log(`[recording] local refine: "${refined}"`)
      send('transcription:refined', { refined })
    })
    .catch((err) => {
      console.error('[recording] local refine failed:', err.message)
      clipboard.writeText(text)
      send('transcription:refined', { refined: text })
    })
}

function onAudioError(error: AudioErrorPayload): void {
  send('audio:error', error)
  stopTranscription()
}

function onSttError(error: Error): void {
  console.error('[recording] STT error:', error.message)
  send('audio:error', { message: error.message, code: 'STREAM_ERROR' })
}

export function initRecording(
  sttKey: string,
  refineConfig: { apiKey: string; baseUrl?: string; model?: string }
): void {
  initSTT(sttKey)
  initRefine(refineConfig)

  setSttListener({
    onInterim,
    onFinal,
    onError: onSttError
  })

  setListener({
    onLevel,
    onChunk,
    onError: onAudioError
  })
}

export function toggleRecording(): void {
  if (isRecording()) {
    stopCapture()
    requestFinal()

    send('recording:stopped')
    send('recording:state-changed', { status: 'idle' })
    setTrayIdle()
  } else {
    stopTranscription()

    const started = startCapture()
    if (started) {
      console.log('[recording] audio capture started')
      startTranscription()
      send('recording:started')
      send('recording:state-changed', { status: 'recording' })
      setTrayRecording()
    }
  }
}

export function resetRecording(): void {
  stopCapture()
  stopTranscription()
  cleanupCapture()
  cleanupSTT()
  cleanupRefine()
}
