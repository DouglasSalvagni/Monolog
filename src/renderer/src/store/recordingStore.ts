import { create } from 'zustand'

export type RecordingStatus = 'idle' | 'recording'

interface AudioErrorState {
  message: string
  code: string
}

interface RecordingState {
  status: RecordingStatus
  audioLevel: number
  error: AudioErrorState | null
  startRecording: () => void
  stopRecording: () => void
  setAudioLevel: (level: number) => void
  setError: (error: AudioErrorState | null) => void
  resetToIdle: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  status: 'idle',
  audioLevel: 0,
  error: null,

  startRecording: () =>
    set({ status: 'recording', error: null }),

  stopRecording: () =>
    set({ status: 'idle', audioLevel: 0 }),

  setAudioLevel: (level: number) =>
    set({ audioLevel: level }),

  setError: (error: AudioErrorState | null) =>
    set({ error, status: error ? 'idle' : 'idle' }),

  resetToIdle: () =>
    set({
      status: 'idle',
      audioLevel: 0,
      error: null
    })
}))
