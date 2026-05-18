import { useEffect, useState } from 'react'
import { SkillManager } from './SkillManager'

interface AudioDevice {
  id: number
  name: string
  isDefault: boolean
}

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'audio' | 'skills'>('audio')
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        const [deviceList, currentId] = await Promise.all([
          window.api.getAudioDevices(),
          window.api.getSelectedAudioDevice()
        ])
        setDevices(deviceList)
        setSelectedId(currentId)
      } catch (err) {
        console.error('Failed to load settings data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleDeviceChange = (id: number): void => {
    setSelectedId(id)
    window.api.setAudioDevice(id)
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-studio-bg overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
      {/* Header */}
      <div className="flex items-center justify-between p-8 z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-studio-ink/40 hover:text-studio-ink transition-colors group"
          >
            <div className="p-2 rounded-full border border-studio-metal/30 group-hover:border-studio-ink group-hover:shadow-studio-soft transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Back to Canvas</span>
          </button>
          <div className="h-6 w-px bg-studio-metal" />
          <h1 className="text-xl font-serif italic text-studio-ink">Preferências do Sistema</h1>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-12 pb-12 gap-12">
        {/* Navigation */}
        <div className="w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'audio'
                ? 'bg-studio-ink text-white shadow-lg'
                : 'text-studio-ink/40 hover:text-studio-ink hover:bg-white/50'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 33 3 0 01-3-3V4a3 3 0 013-3z"
              />
            </svg>
            Hardware de Áudio
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'skills'
                ? 'bg-studio-ink text-white shadow-lg'
                : 'text-studio-ink/40 hover:text-studio-ink hover:bg-white/50'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Habilidades de IA
          </button>
        </div>

        {/* Content Canvas */}
        <div className="flex-1 bg-white/60 rounded-[32px] border border-studio-metal/50 shadow-studio-glass backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="p-10 flex-1 overflow-y-auto min-h-0">
            {activeTab === 'audio' && (
              <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h3 className="text-xl font-serif text-studio-ink mb-2">
                    Dispositivos de Entrada
                  </h3>
                  <p className="text-xs text-studio-ink/40">
                    Selecione o microfone que o Studio deve utilizar para captura.
                  </p>
                </div>

                {loading ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-studio-metal/20 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {devices.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl border border-dashed border-studio-metal/50 text-studio-red/60 text-xs font-medium">
                        Nenhum microfone encontrado. Verifique suas conexões.
                      </div>
                    ) : (
                      devices.map((device) => {
                        const isSelected = selectedId === device.id || (selectedId === null && device.isDefault)
                        return (
                          <label
                            key={device.id}
                            className={`group flex cursor-pointer items-center justify-between rounded-2xl border p-6 transition-colors ${
                              isSelected
                                ? 'border-studio-ink bg-studio-ink text-white shadow-lg'
                                : 'border-studio-metal/50 bg-white hover:border-studio-ink/30 hover:shadow-studio-soft'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="radio"
                                name="audio-device"
                                className="sr-only"
                                checked={isSelected}
                                onChange={() => handleDeviceChange(device.id)}
                              />
                              <div
                                className={`w-2 h-2 rounded-full ${isSelected ? 'bg-studio-amber' : 'bg-studio-metal group-hover:bg-studio-ink/30'}`}
                              />
                              <div className="flex flex-col">
                                <span
                                  className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-studio-ink'}`}
                                >
                                  {device.name}
                                </span>
                                {device.isDefault && (
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-studio-amber' : 'text-studio-ink/30'}`}
                                  >
                                    Padrão do Sistema
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="bg-studio-amber/20 px-3 py-1 rounded-full">
                                <span className="text-[9px] font-bold text-studio-amber uppercase">
                                  Active Signal
                                </span>
                              </div>
                            )}
                          </label>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h3 className="text-xl font-serif text-studio-ink mb-2">Habilidades de IA</h3>
                  <p className="text-xs text-studio-ink/40">
                    Configure prompts e comportamentos para o refinamento de texto.
                  </p>
                </div>
                <SkillManager embedded />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
