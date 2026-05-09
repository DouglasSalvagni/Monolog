import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { clipboard } from 'electron'

let supabase: SupabaseClient | null = null
let authCallback: ((user: User | null) => void) | null = null

export function initSupabase(url: string, anonKey: string): void {
  supabase = createClient(url, anonKey)

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null
    authCallback?.(user)
  })
}

export function onAuthChange(callback: (user: User | null) => void): void {
  authCallback = callback
}

export async function signUp(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  if (!supabase) return { user: null, error: 'Supabase not initialized' }
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { user: null, error: error.message }
  return { user: data.user }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  if (!supabase) return { user: null, error: 'Supabase not initialized' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
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
  return data.session?.user ?? null
}

export async function callRefineEdgeFunction(
  rawText: string,
  durationSeconds: number
): Promise<{ refinedText: string; error?: string }> {
  if (!supabase) return { refinedText: '', error: 'Supabase not initialized' }

  const { data, error } = await supabase.functions.invoke('refine', {
    body: { rawText, durationSeconds }
  })

  if (error) return { refinedText: '', error: error.message }
  if (!data.success) return { refinedText: '', error: data.error || 'Unknown error' }

  clipboard.writeText(data.data.refinedText)
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
