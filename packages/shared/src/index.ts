export type RecordingStatus = 'idle' | 'recording'

export interface AudioLevelPayload {
  level: number
}

export interface AudioErrorPayload {
  message: string
  code: string
}

export interface TranscriptionData {
  id: string
  rawText: string
  refinedText: string
  durationSeconds: number
  createdAt: string
}

export interface AuthState {
  user: { id: string; email: string } | null
  loading: boolean
}

export interface SkillData {
  id: string
  user_id: string
  name: string
  prompt: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CreateSkillInput {
  name: string
  prompt: string
  description?: string
}

export interface RefineRequest {
  rawText: string
  durationSeconds?: number
  skillPrompt?: string
}

export interface RefineResponse {
  success: boolean
  data?: { id: string; refinedText: string; createdAt: string }
  error?: string
}
