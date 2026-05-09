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
  clipboard.writeText(text)
  console.log(`[recording] final: "${text}"`)
  send('transcription:final', { text })
}

function onAudioError(error: AudioErrorPayload): void {
  send('audio:error', error)
  stopTranscription()
}

function onSttError(error: Error): void {
  console.error('[recording] STT error:', error.message)
  send('audio:error', { message: error.message, code: 'STREAM_ERROR' })
}

export function initRecording(apiKey: string): void {
  initSTT(apiKey)

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
}
