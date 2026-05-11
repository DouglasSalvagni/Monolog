import { useState } from 'react'

interface SkillFormProps {
  initialName?: string
  initialPrompt?: string
  initialDescription?: string
  onSave: (data: { name: string; prompt: string; description?: string }) => void
  onCancel: () => void
  saving?: boolean
}

export function SkillForm({ initialName, initialPrompt, initialDescription, onSave, onCancel, saving }: SkillFormProps): React.JSX.Element {
  const [name, setName] = useState(initialName || '')
  const [prompt, setPrompt] = useState(initialPrompt || '')
  const [description, setDescription] = useState(initialDescription || '')

  const canSave = name.trim().length > 0 && name.trim().length <= 100 && prompt.trim().length > 0 && prompt.trim().length <= 2000

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!canSave) return
    onSave({ name: name.trim(), prompt: prompt.trim(), description: description.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="e.g., Tom Formal"
        />
        <span className="text-[10px] text-gray-400">{name.length}/100</span>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Prompt *</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={2000}
          required
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none resize-none"
          placeholder="e.g., Reescreva em tom formal"
        />
        <span className="text-[10px] text-gray-400">{prompt.length}/2000</span>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Optional description"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave || saving}
          className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
