import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null
let authCallback: ((user: User | null) => void) | null = null
let storagePath = ''

function getStoragePath(): string {
  if (storagePath) return storagePath
  const dir = app.getPath('userData')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  storagePath = join(dir, 'supabase-auth.json')
  return storagePath
}

const fileStorage = {
  getItem: (key: string): string | null => {
    try {
      const filePath = getStoragePath()
      if (!existsSync(filePath)) return null
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      return data[key] ?? null
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      const filePath = getStoragePath()
      let data: Record<string, string> = {}
      if (existsSync(filePath)) {
        data = JSON.parse(readFileSync(filePath, 'utf-8'))
      }
      data[key] = value
      writeFileSync(filePath, JSON.stringify(data, null, 2))
    } catch {
      // best effort
    }
  },
  removeItem: (key: string): void => {
    try {
      const filePath = getStoragePath()
      if (!existsSync(filePath)) return
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      delete data[key]
      writeFileSync(filePath, JSON.stringify(data, null, 2))
    } catch {
      // best effort
    }
  }
}

export function initSupabase(url: string, anonKey: string): void {
  supabase = createClient(url, anonKey, {
    auth: {
      storage: fileStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null
    authCallback?.(user)
  })
}

export function onAuthChange(callback: (user: User | null) => void): void {
  authCallback = callback
}

export async function signUp(email: string, password: string): Promise<{
  user: User | null
  error?: string
  needsEmailConfirmation?: boolean
}> {
  if (!supabase) return { user: null, error: 'Supabase not initialized' }
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { user: null, error: error.message }
  if (!data.session && data.user?.identities?.length === 0) {
    return { user: null, error: 'Este email já está registrado.' }
  }
  if (!data.session) {
    return { user: data.user, needsEmailConfirmation: true }
  }
  return { user: data.user }
}

export async function signIn(email: string, password: string): Promise<{
  user: User | null
  error?: string
}> {
  if (!supabase) return { user: null, error: 'Supabase not initialized' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error?.message?.toLowerCase().includes('email not confirmed')) {
    return {
      user: null,
      error:
        'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação, ou peça um novo link em "Esqueci minha senha".'
    }
  }

  if (error) return { user: null, error: error.message }
  return { user: data.user }
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function restoreSession(): Promise<User | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) return data.session.user

  const { data: refreshData } = await supabase.auth.refreshSession()
  return refreshData.session?.user ?? null
}

export async function callRefineEdgeFunction(
  rawText: string,
  durationSeconds: number,
  skillPrompt?: string
): Promise<{ refinedText: string; error?: string }> {
  if (!supabase) return { refinedText: '', error: 'Supabase not initialized' }

  const body: Record<string, unknown> = { rawText, durationSeconds }
  if (skillPrompt) {
    body.skillPrompt = skillPrompt
    console.log('[supabase] calling refine with skillPrompt:', skillPrompt.substring(0, 60))
  } else {
    console.log('[supabase] calling refine without skillPrompt')
  }

  const { data, error } = await supabase.functions.invoke('refine', { body })

  if (error) return { refinedText: '', error: error.message }
  if (!data.success) return { refinedText: '', error: data.error || 'Unknown error' }

  return { refinedText: data.data.refinedText }
}

export async function fetchHistory(
  limit = 50,
  offset = 0
): Promise<{ entries: unknown[]; total: number }> {
  if (!supabase) return { entries: [], total: 0 }

  const { data, error, count } = await supabase
    .from('transcriptions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { entries: [], total: 0 }
  return { entries: data || [], total: count || 0 }
}

export async function deleteTranscription(id: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase.from('transcriptions').delete().eq('id', id)
  return !error
}

export async function fetchSkills(): Promise<{ id: string; user_id: string; name: string; prompt: string; description?: string; created_at: string; updated_at: string }[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('user_skills')
    .select('*')
    .order('created_at', { ascending: false })
  return (data as { id: string; user_id: string; name: string; prompt: string; description?: string; created_at: string; updated_at: string }[]) || []
}

export async function createSkill(input: { name: string; prompt: string; description?: string }): Promise<Record<string, unknown> | null> {
  if (!supabase) {
    console.error('[supabase] createSkill: not initialized')
    return null
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('[supabase] createSkill: no authenticated user', userError?.message)
    return null
  }
  const { data, error } = await supabase
    .from('user_skills')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()
  if (error) {
    console.error('[supabase] createSkill: insert failed', error.message)
    return null
  }
  return data || null
}

export async function updateSkill(id: string, data: { name?: string; prompt?: string; description?: string }): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from('user_skills')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function deleteUserSkill(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('user_skills').delete().eq('id', id)
  return !error
}
