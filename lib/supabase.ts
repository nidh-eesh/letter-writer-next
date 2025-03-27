import { createClient } from '@supabase/supabase-js'
import type { Draft } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function createDraft(draft: {
  title: string
  content: string
  user_id: string
}) {
  const { data, error } = await supabase
    .from('drafts')
    .insert([
      {
        title: draft.title,
        content: draft.content,
        user_id: draft.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ])
    .select()
    .single()
  console.log('New draft created:', data)
  console.log('Error:', error)
  if (error) throw error
  return data
}

export async function updateDraft(id: string, updates: Partial<Draft>) {
  const { data, error } = await supabase
    .from('drafts')
    .update({
      title: updates.title,
      content: updates.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getDraft(id: string) {
  const { data, error } = await supabase
    .from('drafts')
    .select()
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getDraftsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('drafts')
    .select()
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteDraft(id: string) {
  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('id', id)

  if (error) throw error
} 