import { useRecordingStore } from '../store/recordingStore'
import { AudioMeter } from './AudioMeter'

export function RecordingOverlay(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)
  const audioLevel = useRecordingStore((s) => s.audioLevel)
  const error = useRecordingStore((s) => s.error)

  if (status === 'idle' && !error) return <></>

  return (
    <div className="fixed top-4 right-4 z-50 rounded-lg bg-black/80 px-4 py-3 text-white shadow-lg backdrop-blur-sm select-none pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        {error ? (
          <span className="text-sm text-red-400 font-medium">{error.message}</span>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
            <AudioMeter level={audioLevel} />
          </>
        )}
      </div>
    </div>
  )
}
