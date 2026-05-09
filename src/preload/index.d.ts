import { ElectronAPI } from '@electron-toolkit/preload'

interface AudioErrorPayload {
  message: string
  code: string
}

interface RecordingApi {
  onRecordingStarted: (callback: () => void) => () => void
  onRecordingStopped: (callback: () => void) => () => void
  onRecordingStateChanged: (callback: (payload: { status: string }) => void) => () => void
  onAudioLevel: (callback: (level: number) => void) => () => void
  onAudioError: (callback: (error: AudioErrorPayload) => void) => () => void
  onTranscriptionInterim: (callback: (text: string) => void) => () => void
  onTranscriptionFinal: (callback: (text: string) => void) => () => void
  showWindow: () => void
  quitApp: () => void
  writeClipboard: (text: string) => void
  toggleRecording: () => void
  startCapture: () => void
  stopCapture: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RecordingApi
  }
}
