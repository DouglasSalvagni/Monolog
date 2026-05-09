import { useEffect } from 'react'
import { RecordingOverlay } from './components/RecordingOverlay'
import { StatusIndicator } from './components/StatusIndicator'
import { useRecordingStore } from './store/recordingStore'

function App(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)
  const startRecording = useRecordingStore((s) => s.startRecording)
  const stopRecording = useRecordingStore((s) => s.stopRecording)
  const finishProcessing = useRecordingStore((s) => s.finishProcessing)
  const isIdle = status === 'idle'
  const isProcessing = status === 'processing'
  const hasIPC = typeof window.api?.toggleRecording === 'function'

  useEffect(() => {
    if (!hasIPC) {
      console.warn('[renderer] window.api not available — running in standalone mode')
      return
    }

    const cleanupStarted = window.api.onRecordingStarted(() => {
      console.log('[renderer] received recording:started')
      startRecording()
    })

    const cleanupStopped = window.api.onRecordingStopped(() => {
      console.log('[renderer] received recording:stopped')
      stopRecording()
      setTimeout(() => {
        const mockText = 'Mock transcription text — Monolog'
        navigator.clipboard
          .writeText(mockText)
          .then(() => console.log('[renderer] copied to clipboard'))
          .catch((e) => console.error('[renderer] clipboard write failed:', e))
        finishProcessing()
        console.log('[renderer] processing complete')
      }, 2000)
    })

    return () => {
      cleanupStarted()
      cleanupStopped()
    }
  }, [startRecording, stopRecording, finishProcessing, hasIPC])

  const handleToggle = (): void => {
    if (isProcessing) return
    console.log('[renderer] handleToggle clicked, hasIPC:', hasIPC, 'status:', status)

    if (hasIPC) {
      console.log('[renderer] sending IPC recording:toggle')
      try {
        window.api.toggleRecording()
      } catch (err) {
        console.error('[renderer] IPC failed:', err)
      }
    } else {
      console.log('[renderer] direct toggle (no IPC)')
      if (isIdle) {
        startRecording()
      } else {
        stopRecording()
        setTimeout(() => {
          const mockText = 'Mock transcription text — Monolog'
          navigator.clipboard
            .writeText(mockText)
            .catch((e) => console.error('[renderer] clipboard write failed:', e))
          finishProcessing()
        }, 2000)
      }
    }
  }

  return (
    <div className="flex h-screen w-screen select-none flex-col items-center justify-center bg-gray-50">
      <RecordingOverlay />
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Monolog</h1>

        <p className="text-sm text-gray-500">
          Press{' '}
          <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
            Alt+Shift+R
          </kbd>{' '}
          or click the button below
        </p>

        {!hasIPC && (
          <p className="rounded bg-yellow-100 px-3 py-1 text-xs text-yellow-800">
            Running without IPC bridge — using direct mode
          </p>
        )}

        <button
          onClick={handleToggle}
          disabled={isProcessing}
          className={`flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            isIdle
              ? 'bg-red-500 hover:bg-red-600 hover:shadow-xl active:scale-95'
              : 'bg-gray-500 hover:bg-gray-600 hover:shadow-xl active:scale-95'
          }`}
        >
          <span
            className={`h-3 w-3 rounded-full ${isIdle ? 'bg-white' : 'bg-white/80'}`}
          />
          {isIdle ? 'Start Recording' : 'Stop Recording'}
        </button>

        <StatusIndicator />
      </div>
    </div>
  )
}

export default App
