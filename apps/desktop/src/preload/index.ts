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

  onRecordingStateChanged: (callback: (payload: { status: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { status: string }): void =>
      callback(payload)
    ipcRenderer.on('recording:state-changed', handler)
    return () => ipcRenderer.removeListener('recording:state-changed', handler)
  },

  onAudioLevel: (callback: (level: number) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { level: number }): void =>
      callback(payload.level)
    ipcRenderer.on('audio:level', handler)
    return () => ipcRenderer.removeListener('audio:level', handler)
  },

  onAudioError: (callback: (error: { message: string; code: string }) => void): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      error: { message: string; code: string }
    ): void => callback(error)
    ipcRenderer.on('audio:error', handler)
    return () => ipcRenderer.removeListener('audio:error', handler)
  },

  onTranscriptionInterim: (callback: (text: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { text: string }): void =>
      callback(payload.text)
    ipcRenderer.on('transcription:interim', handler)
    return () => ipcRenderer.removeListener('transcription:interim', handler)
  },

  onTranscriptionFinal: (callback: (text: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { text: string }): void =>
      callback(payload.text)
    ipcRenderer.on('transcription:final', handler)
    return () => ipcRenderer.removeListener('transcription:final', handler)
  },

  onTranscriptionRefined: (callback: (refined: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { refined: string }): void =>
      callback(payload.refined)
    ipcRenderer.on('transcription:refined', handler)
    return () => ipcRenderer.removeListener('transcription:refined', handler)
  },

  showWindow: (): void => ipcRenderer.send('app:show-window'),

  quitApp: (): void => ipcRenderer.send('app:quit'),

  writeClipboard: (text: string): void => ipcRenderer.send('clipboard:write', { text }),

  toggleRecording: (): void => ipcRenderer.send('recording:toggle'),

  startCapture: (): void => ipcRenderer.send('audio:start-capture'),

  stopCapture: (): void => ipcRenderer.send('audio:stop-capture'),

  onAuthStateChanged: (callback: (user: { id: string; email: string } | null) => void): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      user: { id: string; email: string } | null
    ): void => callback(user)
    ipcRenderer.on('auth:state-changed', handler)
    return () => ipcRenderer.removeListener('auth:state-changed', handler)
  },

  login: (email: string, password: string): Promise<{ user: { id: string; email: string } | null; error?: string }> =>
    ipcRenderer.invoke('auth:login', { email, password }),

  signup: (email: string, password: string): Promise<{ user: { id: string; email: string } | null; error?: string }> =>
    ipcRenderer.invoke('auth:signup', { email, password }),

  logout: (): Promise<void> => ipcRenderer.invoke('auth:logout'),

  restoreSession: (): Promise<{ id: string; email: string } | null> =>
    ipcRenderer.invoke('auth:restore-session'),

  setSkillPrompt: (prompt: string): void =>
    ipcRenderer.send('refine:set-skill-prompt', { prompt }),

  fetchSkills: (): Promise<{ id: string; user_id: string; name: string; prompt: string; description?: string; created_at: string; updated_at: string }[]> =>
    ipcRenderer.invoke('skills:fetch'),

  createSkill: (input: { name: string; prompt: string; description?: string }): Promise<{ id: string; user_id: string; name: string; prompt: string; description?: string; created_at: string; updated_at: string } | null> =>
    ipcRenderer.invoke('skills:create', input),

  updateSkill: (id: string, data: { name?: string; prompt?: string; description?: string }): Promise<boolean> =>
    ipcRenderer.invoke('skills:update', { id, data }),

  deleteSkill: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('skills:delete', { id })
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
