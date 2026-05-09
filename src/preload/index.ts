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
    const handler = (_event: Electron.IpcRendererEvent, payload: { status: string }): void =>
      callback(payload)
    ipcRenderer.on('recording:state-changed', handler)
    return () => ipcRenderer.removeListener('recording:state-changed', handler)
  },

  showWindow: (): void => ipcRenderer.send('app:show-window'),

  quitApp: (): void => ipcRenderer.send('app:quit'),

  writeClipboard: (text: string): void =>
    ipcRenderer.send('clipboard:write', { text }),

  toggleRecording: (): void => ipcRenderer.send('recording:toggle')
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
