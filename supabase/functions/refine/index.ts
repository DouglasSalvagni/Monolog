import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

interface RefineRequest {
  rawText: string
  durationSeconds?: number
  skillPrompt?: string
}

function buildSystemPrompt(skillPrompt?: string): string {
  if (skillPrompt && skillPrompt.trim()) {
    return `You are a text refinement assistant. Clean up the transcript (punctuation, capitalization, filler words). Then apply the following user skill instruction to the cleaned text. The skill instruction takes priority over the base cleanup.

Skill instruction: ${skillPrompt.trim()}

Return ONLY the refined text.`
  }
  return 'You are a text refinement assistant. Clean up speech transcripts. Fix punctuation, capitalization, and remove filler words (um, uh, é, tipo, né, assim). Do NOT add new information, do NOT summarize. Return ONLY the refined text.'
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { rawText, durationSeconds, skillPrompt }: RefineRequest = await req.json()
    if (!rawText) {
      return new Response(
        JSON.stringify({ success: false, error: 'rawText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    const baseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1'
    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-3.5-turbo'

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = buildSystemPrompt(skillPrompt)

    const llmResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Refine this transcript:\n\n${rawText}` }
        ],
        temperature: 0.3,
        max_tokens: 2048
      })
    })

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      throw new Error(`LLM error (${llmResponse.status}): ${errText}`)
    }

    const llmData = await llmResponse.json()
    const refinedText = (llmData.choices?.[0]?.message?.content || '').trim()
    if (!refinedText) {
      throw new Error('Empty response from LLM')
    }

    const { error: insertError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        raw_text: rawText,
        refined_text: refinedText,
        duration_seconds: durationSeconds || 0
      })

    if (insertError) {
      throw new Error(`DB insert failed: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { refinedText }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[refine] error:', message)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
