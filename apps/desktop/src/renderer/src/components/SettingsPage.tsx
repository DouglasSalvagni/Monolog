import { useEffect, useState } from 'react'
import { SkillManager } from './SkillManager'

interface AudioDevice {
  id: number
  name: string
  isDefault: boolean
}

interface SettingsPageProps {
  onClose: () => void
}

export function SettingsPage({ onClose }: SettingsPageProps): React.JSX.Element {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="relative flex h-[500px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white/90 shadow-2xl backdrop-blur-md ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Configurações</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-100 bg-gray-50/50 p-4 space-y-1">
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'audio' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 33 3 0 01-3-3V4a3 3 0 013-3z" />
              </svg>
              Áudio
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'skills' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Skills
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Dispositivos de Entrada</h3>
                  {loading ? (
                    <div className="flex animate-pulse space-x-4">
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {devices.length === 0 ? (
                        <p className="text-sm text-red-500">Nenhum microfone encontrado.</p>
                      ) : (
                        devices.map((device) => (
                          <label
                            key={device.id}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30 ${
                              selectedId === device.id || (selectedId === null && device.isDefault)
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="audio-device"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                checked={selectedId === device.id || (selectedId === null && device.isDefault)}
                                onChange={() => handleDeviceChange(device.id)}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{device.name}</span>
                                {device.isDefault && <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Padrão do Sistema</span>}
                              </div>
                            </div>
                            {selectedId === device.id && (
                              <div className="rounded-full bg-blue-100 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className="text-blue-600">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                  <p className="mt-4 text-xs text-gray-500">
                    Selecione o microfone que deseja usar para as gravações. O dispositivo escolhido será salvo para as próximas sessões.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="h-full">
                <SkillManager embedded />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
