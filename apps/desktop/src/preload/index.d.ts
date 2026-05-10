import { ElectronAPI } from '@electron-toolkit/preload'

interface AudioErrorPayload {
  message: string
  code: string
}

interface AuthResult {
  user: { id: string; email: string } | null
  error?: string
  needsEmailConfirmation?: boolean
}

interface RecordingApi {
  onRecordingStarted: (callback: () => void) => () => void
  onRecordingStopped: (callback: () => void) => () => void
  onRecordingStateChanged: (callback: (payload: { status: string }) => void) => () => void
  onAudioLevel: (callback: (level: number) => void) => () => void
  onAudioError: (callback: (error: AudioErrorPayload) => void) => () => void
  onTranscriptionInterim: (callback: (text: string) => void) => () => void
  onTranscriptionFinal: (callback: (text: string) => void) => () => void
  onTranscriptionRefined: (callback: (refined: string) => void) => () => void
  onAuthStateChanged: (callback: (user: { id: string; email: string } | null) => void) => () => void
  showWindow: () => void
  quitApp: () => void
  writeClipboard: (text: string) => void
  toggleRecording: () => void
  startCapture: () => void
  stopCapture: () => void
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  restoreSession: () => Promise<{ id: string; email: string } | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RecordingApi
  }
}
