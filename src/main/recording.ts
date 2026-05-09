import { BrowserWindow } from 'electron'
import { setTrayRecording, setTrayIdle } from './tray'

let isRecording = false
let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}

export function toggleRecording(): void {
  console.log('[recording] toggleRecording called, mainWindow:', !!mainWindow, 'isRecording:', isRecording)

  if (!mainWindow) {
    console.warn('[recording] mainWindow is null — cannot send IPC')
    return
  }

  if (isRecording) {
    isRecording = false
    setTrayIdle()
    console.log('[recording] stopping — sending recording:stopped')
    mainWindow.webContents.send('recording:stopped')
    mainWindow.webContents.send('recording:state-changed', { status: 'idle' })
  } else {
    isRecording = true
    setTrayRecording()
    console.log('[recording] starting — sending recording:started')
    mainWindow.webContents.send('recording:started')
    mainWindow.webContents.send('recording:state-changed', { status: 'recording' })
  }
}

export function getIsRecording(): boolean {
  return isRecording
}

export function resetRecording(): void {
  isRecording = false
}
