import { useRecordingStore } from '../store/recordingStore'

const statusColors: Record<string, string> = {
  idle: 'bg-gray-400',
  recording: 'bg-red-500',
  processing: 'bg-yellow-500'
}

const statusLabels: Record<string, string> = {
  idle: 'Idle',
  recording: 'Recording',
  processing: 'Processing'
}

export function StatusIndicator(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
      <span>{statusLabels[status]}</span>
    </div>
  )
}
