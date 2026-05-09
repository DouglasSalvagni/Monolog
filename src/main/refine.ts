import OpenAI from 'openai'

let client: OpenAI | null = null
let model = 'gpt-3.5-turbo'

export function initRefine(config: { apiKey: string; baseUrl?: string; model?: string }): void {
  if (!config.apiKey) {
    console.warn('[refine] OPENAI_API_KEY not set — refinement disabled')
    return
  }

  if (config.model) {
    model = config.model
  }

  client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'https://api.openai.com/v1'
  })

  console.log('[refine] initialized, model:', model, 'base:', config.baseUrl || '(openai)')
}

export async function refineText(raw: string): Promise<string> {
  if (!client) {
    throw new Error('Refinement client not initialized')
  }

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a text refinement assistant. Your job is to clean up speech transcripts. Fix punctuation, capitalization, and remove filler words (um, uh, é, tipo, né, assim). Do NOT add new information, do NOT summarize, do NOT change the meaning. Return ONLY the refined text, no explanations.'
      },
      {
        role: 'user',
        content: `Refine this transcript:\n\n${raw}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2048
  })

  const refined = response.choices[0]?.message?.content?.trim()
  if (!refined) {
    throw new Error('Empty response from LLM')
  }

  return refined
}

export function cleanupRefine(): void {
  client = null
}
