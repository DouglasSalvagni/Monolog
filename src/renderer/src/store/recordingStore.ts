import { create } from 'zustand'

export type RecordingStatus = 'idle' | 'recording'

interface AudioErrorState {
  message: string
  code: string
}

interface RecordingState {
  status: RecordingStatus
  audioLevel: number
  interimText: string
  finalText: string | null
  error: AudioErrorState | null
  startRecording: () => void
  stopRecording: () => void
  setAudioLevel: (level: number) => void
  setInterimText: (text: string) => void
  setFinalText: (text: string) => void
  setError: (error: AudioErrorState | null) => void
  resetToIdle: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  status: 'idle',
  audioLevel: 0,
  interimText: '',
  finalText: null,
  error: null,

  startRecording: () => set({ status: 'recording', error: null, interimText: '', finalText: null }),

  stopRecording: () => set({ status: 'idle', audioLevel: 0 }),

  setAudioLevel: (level: number) => set({ audioLevel: level }),

  setInterimText: (text: string) => set({ interimText: text }),

  setFinalText: (text: string) => set({ finalText: text }),

  setError: (error: AudioErrorState | null) => set({ error, status: error ? 'idle' : 'idle' }),

  resetToIdle: () =>
    set({
      status: 'idle',
      audioLevel: 0,
      interimText: '',
      finalText: null,
      error: null
    })
}))
