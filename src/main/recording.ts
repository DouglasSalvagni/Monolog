import { BrowserWindow } from 'electron'
import { setTrayRecording, setTrayIdle } from './tray'
import {
  startCapture,
  stopCapture,
  setListener,
  isRecording,
  cleanupCapture,
  type AudioErrorPayload
} from './audio-capture'

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

function onError(error: AudioErrorPayload): void {
  send('audio:error', error)
}

function onStop(): void {
  send('recording:stopped')
  send('recording:state-changed', { status: 'idle' })
  setTrayIdle()
}

export function initRecording(): void {
  setListener({
    onLevel,
    onError,
    onStop
  })
}

export function toggleRecording(): void {
  if (isRecording()) {
    const buf = stopCapture()
    if (buf) {
      console.log(`[recording] captured ${buf.length} bytes (${(buf.length / 32000).toFixed(1)}s)`)
    }
    send('recording:stopped')
    send('recording:state-changed', { status: 'idle' })
    setTrayIdle()
  } else {
    const started = startCapture()
    if (started) {
      console.log('[recording] audio capture started')
      send('recording:started')
      send('recording:state-changed', { status: 'recording' })
      setTrayRecording()
    }
  }
}

export function resetRecording(): void {
  stopCapture()
  cleanupCapture()
}
