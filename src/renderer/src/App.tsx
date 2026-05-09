import { useEffect } from 'react'
import { RecordingOverlay } from './components/RecordingOverlay'
import { useRecordingStore } from './store/recordingStore'

function App(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)
  const startRecording = useRecordingStore((s) => s.startRecording)
  const stopRecording = useRecordingStore((s) => s.stopRecording)
  const setAudioLevel = useRecordingStore((s) => s.setAudioLevel)
  const setError = useRecordingStore((s) => s.setError)
  const setInterimText = useRecordingStore((s) => s.setInterimText)
  const setFinalText = useRecordingStore((s) => s.setFinalText)
  const clearFinalText = useRecordingStore((s) => s.clearFinalText)
  const finalText = useRecordingStore((s) => s.finalText)
  const isIdle = status === 'idle'
  const isRecording = status === 'recording'
  const hasIPC = typeof window.api?.toggleRecording === 'function'

  useEffect(() => {
    if (!hasIPC) {
      console.warn('[renderer] window.api not available — running in standalone mode')
      return
    }

    const cleanups: (() => void)[] = []

    cleanups.push(
      window.api.onRecordingStarted(() => {
        startRecording()
      })
    )

    cleanups.push(
      window.api.onRecordingStopped(() => {
        stopRecording()
      })
    )

    cleanups.push(
      window.api.onRecordingStateChanged((payload) => {
        if (payload.status === 'recording') {
          startRecording()
        } else {
          stopRecording()
        }
      })
    )

    cleanups.push(
      window.api.onAudioLevel((level) => {
        setAudioLevel(level)
      })
    )

    if (window.api.onAudioError) {
      cleanups.push(
        window.api.onAudioError((error) => {
          console.error('[renderer] audio error:', error)
          setError(error)
          stopRecording()
        })
      )
    }

    if (window.api.onTranscriptionInterim) {
      cleanups.push(
        window.api.onTranscriptionInterim((text) => {
          setInterimText(text)
        })
      )
    }

    if (window.api.onTranscriptionFinal) {
      cleanups.push(
        window.api.onTranscriptionFinal((text) => {
          setFinalText(text)
        })
      )
    }

    return () => {
      cleanups.forEach((c) => c())
    }
  }, [hasIPC, startRecording, stopRecording, setAudioLevel, setError, setInterimText, setFinalText])

  const handleCopy = (): void => {
    if (!finalText) return
    if (hasIPC) {
      window.api.writeClipboard(finalText)
    } else {
      navigator.clipboard.writeText(finalText).catch(console.error)
    }
  }

  const handleToggle = (): void => {
    if (hasIPC) {
      try {
        if (isRecording) {
          window.api.stopCapture()
        } else {
          window.api.startCapture()
        }
      } catch (err) {
        console.error('[renderer] IPC failed:', err)
      }
    } else {
      if (isIdle) {
        startRecording()
      } else {
        stopRecording()
      }
    }
  }

  return (
    <div className="flex h-screen w-screen select-none flex-col items-center justify-center bg-gray-50">
      <RecordingOverlay />

      <div className="flex flex-col items-center gap-6 max-w-2xl w-full px-6">
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
          className={`flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-95 ${
            isIdle
              ? 'bg-red-500 hover:bg-red-600 hover:shadow-xl'
              : 'bg-gray-500 hover:bg-gray-600 hover:shadow-xl'
          }`}
        >
          <span className={`h-3 w-3 rounded-full ${isIdle ? 'bg-white' : 'bg-white/80'}`} />
          {isIdle ? 'Start Recording' : 'Stop Recording'}
        </button>

        {isIdle && finalText && (
          <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
              {finalText}
            </p>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors active:scale-95"
              >
                Copy
              </button>
              <button
                onClick={clearFinalText}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
