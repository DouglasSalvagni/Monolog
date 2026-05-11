import { useEffect, useRef } from 'react'
import { useRecordingStore } from '../store/recordingStore'
import { useSkillStore } from '../store/skillStore'

export function SkillSelector(): React.JSX.Element {
  const { skills, fetchSkills } = useSkillStore()
  const activeSkill = useRecordingStore((s) => s.activeSkill)
  const setActiveSkill = useRecordingStore((s) => s.setActiveSkill)
  const initialised = useRef(false)

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true
      fetchSkills()
    }
  }, [fetchSkills])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const skillId = e.target.value
    if (!skillId) {
      setActiveSkill(null)
      window.api.setSkillPrompt('')
      return
    }
    const skill = skills.find((s) => s.id === skillId)
    if (skill) {
      setActiveSkill({ id: skill.id, name: skill.name, prompt: skill.prompt })
      window.api.setSkillPrompt(skill.prompt)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400 whitespace-nowrap">Skill:</label>
      <select
        value={activeSkill?.id || ''}
        onChange={handleChange}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none bg-white max-w-[180px]"
      >
        <option value="">No skill</option>
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.name}
          </option>
        ))}
      </select>
    </div>
  )
}
