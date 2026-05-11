import { useState, useEffect } from 'react'
import { useSkillStore } from '../store/skillStore'
import { SkillForm } from './SkillForm'
import type { SkillData } from '@monolog/shared'

type ViewMode = 'list' | 'create' | 'edit'

export function SkillManager({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }): React.JSX.Element {
  const { skills, loading, error, fetchSkills, createSkill, updateSkill, deleteSkill } = useSkillStore()
  const [mode, setMode] = useState<ViewMode>('list')
  const [editingSkill, setEditingSkill] = useState<SkillData | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const handleCreate = async (data: { name: string; prompt: string; description?: string }): Promise<void> => {
    setSaving(true)
    const skill = await createSkill(data)
    setSaving(false)
    if (skill) setMode('list')
  }

  const handleUpdate = async (data: { name: string; prompt: string; description?: string }): Promise<void> => {
    if (!editingSkill) return
    setSaving(true)
    await updateSkill(editingSkill.id, data)
    setSaving(false)
    setEditingSkill(null)
    setMode('list')
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this skill?')) return
    await deleteSkill(id)
  }

  const content = (
    <>
      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}

      {mode === 'list' && (
        <div className="space-y-2">
          <button
            onClick={() => setMode('create')}
            className="w-full rounded-md border-2 border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + New Skill
          </button>

          {loading ? (
            <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
          ) : skills.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No skills yet. Create one!</p>
          ) : (
            skills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-md border border-gray-200 p-3 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{skill.name}</p>
                    {skill.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{skill.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 truncate">{skill.prompt}</p>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => { setEditingSkill(skill); setMode('edit') }}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(mode === 'create' || mode === 'edit') && (
        <SkillForm
          initialName={editingSkill?.name}
          initialPrompt={editingSkill?.prompt}
          initialDescription={editingSkill?.description}
          onSave={mode === 'create' ? handleCreate : handleUpdate}
          onCancel={() => { setEditingSkill(null); setMode('list') }}
          saving={saving}
        />
      )}
    </>
  )

  if (embedded) {
    return <div className="h-full">{content}</div>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">
            {mode === 'create' ? 'New Skill' : mode === 'edit' ? 'Edit Skill' : 'Skills'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-gray-50/30">
          {content}
        </div>
      </div>
    </div>
  )
}
