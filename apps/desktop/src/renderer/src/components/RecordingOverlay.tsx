import { useRecordingStore } from '../store/recordingStore'
import { AudioMeter } from './AudioMeter'

export function RecordingOverlay(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)
  const audioLevel = useRecordingStore((s) => s.audioLevel)
  const interimText = useRecordingStore((s) => s.interimText)
  const error = useRecordingStore((s) => s.error)

  if (status === 'idle' && !error) return <></>

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-studio-bg/90 backdrop-blur-md select-none animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-12 max-w-lg w-full px-12 text-center pointer-events-auto">
        {/* The Signal */}
        <div className="flex flex-col items-center gap-4">
          <AudioMeter level={audioLevel} isRecording={status === 'recording'} />
          <div className="flex items-center gap-2 mt-8">
            <span
              className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-studio-red' : 'bg-studio-amber'} animate-pulse`}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-studio-ink/40">
              {error ? 'System Error' : status === 'recording' ? 'Capturing Audio' : 'Processing'}
            </span>
          </div>
        </div>

        {/* Interim Result */}
        {error ? (
          <p className="text-sm text-studio-red font-medium max-w-sm">{error.message}</p>
        ) : (
          <div className="min-h-[100px] flex items-center justify-center">
            {interimText ? (
              <p className="transcript-text text-studio-ink opacity-60 italic">"{interimText}"</p>
            ) : (
              <p className="text-xs text-studio-ink/20 font-medium">Sua voz aparecerá aqui...</p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => window.api.stopCapture()}
            className="group relative flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-studio-red-glow blur-md group-hover:opacity-40 transition-all scale-150" />
            <div className="relative h-16 w-16 rounded-full bg-studio-red flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
              <div className="h-5 w-5 bg-white rounded-sm" />
            </div>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-studio-red">
            Parar Gravação
          </span>
        </div>

        {/* Tip */}
        {!error && (
          <div className="mt-8 px-4 py-2 rounded-full border border-studio-metal/30 bg-white/50">
            <p className="text-[10px] text-studio-ink/30 font-medium">
              Use Alt + Shift + R para parar rápido.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
