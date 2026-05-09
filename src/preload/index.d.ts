import { ElectronAPI } from '@electron-toolkit/preload'

interface RecordingApi {
  onRecordingStarted: (callback: () => void) => () => void
  onRecordingStopped: (callback: () => void) => () => void
  onRecordingStateChanged: (
    callback: (payload: { status: string }) => void
  ) => () => void
  showWindow: () => void
  quitApp: () => void
  writeClipboard: (text: string) => void
  toggleRecording: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RecordingApi
  }
}
