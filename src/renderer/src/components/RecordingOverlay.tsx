import { useRecordingStore } from '../store/recordingStore'

const statusConfig: Record<string, { label: string; color: string }> = {
  idle: { label: '', color: 'bg-gray-400' },
  recording: { label: 'Recording...', color: 'bg-red-500' },
  processing: { label: 'Processing...', color: 'bg-yellow-500' }
}

export function RecordingOverlay(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)

  if (status === 'idle') return <></>

  const config = statusConfig[status]

  return (
    <div className="fixed top-4 right-4 z-50 rounded-lg bg-black/80 px-4 py-3 text-white shadow-lg backdrop-blur-sm select-none pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${config.color} animate-pulse`} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    </div>
  )
}
