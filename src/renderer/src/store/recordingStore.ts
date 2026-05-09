import { create } from 'zustand'

export type RecordingStatus = 'idle' | 'recording' | 'processing'

interface RecordingState {
  status: RecordingStatus
  transcriptText: string
  lastTransitionAt: string | null
  startRecording: () => void
  stopRecording: () => void
  setTranscript: (text: string) => void
  finishProcessing: () => void
  resetToIdle: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  status: 'idle',
  transcriptText: '',
  lastTransitionAt: null,

  startRecording: () =>
    set({ status: 'recording', lastTransitionAt: new Date().toISOString() }),

  stopRecording: () =>
    set({ status: 'processing', lastTransitionAt: new Date().toISOString() }),

  setTranscript: (text: string) =>
    set({ transcriptText: text }),

  finishProcessing: () =>
    set({
      status: 'idle',
      lastTransitionAt: new Date().toISOString()
    }),

  resetToIdle: () =>
    set({
      status: 'idle',
      transcriptText: '',
      lastTransitionAt: new Date().toISOString()
    })
}))
