import { create } from 'zustand'

export type RecordingStatus = 'idle' | 'recording'

interface AudioErrorState {
  message: string
  code: string
}

interface ActiveSkill {
  id: string
  name: string
  prompt: string
}

interface RecordingState {
  status: RecordingStatus
  audioLevel: number
  interimText: string
  finalText: string | null
  refinedText: string | null
  error: AudioErrorState | null
  activeSkill: ActiveSkill | null
  startRecording: () => void
  stopRecording: () => void
  setAudioLevel: (level: number) => void
  setInterimText: (text: string) => void
  setFinalText: (text: string) => void
  setRefinedText: (text: string) => void
  clearResult: () => void
  setError: (error: AudioErrorState | null) => void
  setActiveSkill: (skill: ActiveSkill | null) => void
  resetToIdle: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  status: 'idle',
  audioLevel: 0,
  interimText: '',
  finalText: null,
  refinedText: null,
  error: null,
  activeSkill: null,

  startRecording: () =>
    set({
      status: 'recording',
      error: null,
      interimText: '',
      finalText: null,
      refinedText: null
    }),

  stopRecording: () => set({ status: 'idle', audioLevel: 0, interimText: '' }),

  setAudioLevel: (level: number) => set({ audioLevel: level }),

  setInterimText: (text: string) => set({ interimText: text }),

  setFinalText: (text: string) => set({ finalText: text }),

  setRefinedText: (text: string) => set({ refinedText: text }),

  clearResult: () => set({ finalText: null, refinedText: null }),

  setError: (error: AudioErrorState | null) => set({ error, status: error ? 'idle' : 'idle' }),

  setActiveSkill: (skill: ActiveSkill | null) => set({ activeSkill: skill }),

  resetToIdle: () =>
    set({
      status: 'idle',
      audioLevel: 0,
      interimText: '',
      finalText: null,
      refinedText: null,
      error: null,
      activeSkill: null
    })
}))
