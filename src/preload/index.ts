import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  onRecordingStarted: (callback: () => void): (() => void) => {
    ipcRenderer.on('recording:started', callback)
    return () => ipcRenderer.removeListener('recording:started', callback)
  },

  onRecordingStopped: (callback: () => void): (() => void) => {
    ipcRenderer.on('recording:stopped', callback)
    return () => ipcRenderer.removeListener('recording:stopped', callback)
  },

  onRecordingStateChanged: (
    callback: (payload: { status: string }) => void
  ): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { status: string }
    ): void => callback(payload)
    ipcRenderer.on('recording:state-changed', handler)
    return () => ipcRenderer.removeListener('recording:state-changed', handler)
  },

  onAudioLevel: (callback: (level: number) => void): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { level: number }
    ): void => callback(payload.level)
    ipcRenderer.on('audio:level', handler)
    return () => ipcRenderer.removeListener('audio:level', handler)
  },

  onAudioError: (
    callback: (error: { message: string; code: string }) => void
  ): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      error: { message: string; code: string }
    ): void => callback(error)
    ipcRenderer.on('audio:error', handler)
    return () => ipcRenderer.removeListener('audio:error', handler)
  },

  showWindow: (): void => ipcRenderer.send('app:show-window'),

  quitApp: (): void => ipcRenderer.send('app:quit'),

  writeClipboard: (text: string): void =>
    ipcRenderer.send('clipboard:write', { text }),

  toggleRecording: (): void => ipcRenderer.send('recording:toggle'),

  startCapture: (): void => ipcRenderer.send('audio:start-capture'),

  stopCapture: (): void => ipcRenderer.send('audio:stop-capture')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
    // @ts-expect-error defined in index.d.ts
    window.electron = electronAPI
    // @ts-expect-error defined in index.d.ts
    window.api = api
}
