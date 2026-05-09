import { useRecordingStore } from '../store/recordingStore'
import { AudioMeter } from './AudioMeter'

export function RecordingOverlay(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)
  const audioLevel = useRecordingStore((s) => s.audioLevel)
  const interimText = useRecordingStore((s) => s.interimText)
  const error = useRecordingStore((s) => s.error)

  if (status === 'idle' && !error) return <></>

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg bg-black/80 px-4 py-3 text-white shadow-lg backdrop-blur-sm select-none pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {error ? (
            <span className="text-sm text-red-400 font-medium">{error.message}</span>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-sm font-medium shrink-0">Recording...</span>
              <AudioMeter level={audioLevel} />
            </>
          )}
        </div>
        {interimText && status === 'recording' && (
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{interimText}</p>
        )}
      </div>
    </div>
  )
}
