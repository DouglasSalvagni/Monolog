import { create } from 'zustand'
import type { SkillData, CreateSkillInput } from '@monolog/shared'
import { useRecordingStore } from './recordingStore'

interface SkillStoreState {
  skills: SkillData[]
  loading: boolean
  error: string | null
  fetchSkills: () => Promise<void>
  createSkill: (input: CreateSkillInput) => Promise<SkillData | null>
  updateSkill: (
    id: string,
    data: Partial<Pick<SkillData, 'name' | 'prompt' | 'description'>>
  ) => Promise<void>
  deleteSkill: (id: string) => Promise<void>
}

export const useSkillStore = create<SkillStoreState>((set) => ({
  skills: [],
  loading: false,
  error: null,

  fetchSkills: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.fetchSkills()
      set({ skills: result, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch skills'
      set({ error: message, loading: false })
    }
  },

  createSkill: async (input) => {
    set({ error: null })
    try {
      const skill = await window.api.createSkill(input)
      if (skill) {
        set((state) => ({ skills: [skill, ...state.skills] }))
      } else {
        console.error('[skillStore] createSkill returned null')
      }
      return skill
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create skill'
      console.error('[skillStore] createSkill error:', message)
      set({ error: message })
      return null
    }
  },

  updateSkill: async (id, data) => {
    set({ error: null })
    try {
      await window.api.updateSkill(id, data)
      set((state) => {
        const updatedSkills = state.skills.map((s) =>
          s.id === id ? { ...s, ...data, updated_at: new Date().toISOString() } : s
        )
        return { skills: updatedSkills }
      })
      const activeSkill = useRecordingStore.getState().activeSkill
      if (activeSkill?.id === id && data.prompt) {
        useRecordingStore.getState().setActiveSkill({ ...activeSkill, prompt: data.prompt })
        if (typeof window.api?.setSkillPrompt === 'function') {
          window.api.setSkillPrompt(data.prompt)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update skill'
      set({ error: message })
    }
  },

  deleteSkill: async (id) => {
    set({ error: null })
    try {
      await window.api.deleteSkill(id)
      set((state) => ({
        skills: state.skills.filter((s) => s.id !== id)
      }))
      const activeSkill = useRecordingStore.getState().activeSkill
      if (activeSkill?.id === id) {
        useRecordingStore.getState().setActiveSkill(null)
        if (typeof window.api?.setSkillPrompt === 'function') {
          window.api.setSkillPrompt('')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete skill'
      set({ error: message })
    }
  }
}))
