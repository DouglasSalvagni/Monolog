import { useEffect, useCallback } from 'react'
import { RecordingOverlay } from './components/RecordingOverlay'
import { LoginScreen } from './components/LoginScreen'
import { useRecordingStore } from './store/recordingStore'
import { useAuthStore } from './store/authStore'

function App(): React.JSX.Element {
  const status = useRecordingStore((s) => s.status)
  const startRecording = useRecordingStore((s) => s.startRecording)
  const stopRecording = useRecordingStore((s) => s.stopRecording)
  const setAudioLevel = useRecordingStore((s) => s.setAudioLevel)
  const setError = useRecordingStore((s) => s.setError)
  const setInterimText = useRecordingStore((s) => s.setInterimText)
  const setFinalText = useRecordingStore((s) => s.setFinalText)
  const setRefinedText = useRecordingStore((s) => s.setRefinedText)
  const clearResult = useRecordingStore((s) => s.clearResult)
  const finalText = useRecordingStore((s) => s.finalText)
  const refinedText = useRecordingStore((s) => s.refinedText)
  const isIdle = status === 'idle'
  const isRecording = status === 'recording'
  const hasIPC = typeof window.api?.toggleRecording === 'function'

  const authUser = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const authError = useAuthStore((s) => s.error)
  const setUser = useAuthStore((s) => s.setUser)
  const setAuthLoading = useAuthStore((s) => s.setLoading)
  const setAuthError = useAuthStore((s) => s.setError)

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true)
      try {
        const result = await window.api.login(email, password)
        if (result.error) {
          setAuthError(result.error)
        } else {
          setUser(result.user)
        }
      } catch {
        setAuthError('Connection failed')
      }
    },
    [setUser, setAuthLoading, setAuthError]
  )

  const handleSignup = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true)
      try {
        const result = await window.api.signup(email, password)
        if (result.error) {
          setAuthError(result.error)
        } else {
          setUser(result.user)
        }
      } catch {
        setAuthError('Connection failed')
      }
    },
    [setUser, setAuthLoading, setAuthError]
  )

  const handleLogout = useCallback(async () => {
    await window.api.logout()
    setUser(null)
  }, [setUser])

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
          console.log('[renderer] final transcript:', text)
          setFinalText(text)
        })
      )
    }

    if (window.api.onTranscriptionRefined) {
      cleanups.push(
        window.api.onTranscriptionRefined((refined) => {
          console.log('[renderer] refined:', refined)
          setRefinedText(refined)
        })
      )
    }

    return () => {
      cleanups.forEach((c) => c())
    }
  }, [
    hasIPC,
    startRecording,
    stopRecording,
    setAudioLevel,
    setError,
    setInterimText,
    setFinalText,
    setRefinedText,
    setUser,
    setAuthLoading
  ])

  useEffect(() => {
    if (!window.api?.restoreSession) return
    window.api.restoreSession().then((user) => {
      setUser(user)
    })
  }, [setUser, setAuthLoading])

  useEffect(() => {
    if (!window.api?.onAuthStateChanged) return
    const cleanup = window.api.onAuthStateChanged((user) => {
      setUser(user)
    })
    return cleanup
  }, [setUser])

  const handleCopy = (): void => {
    const text = refinedText || finalText
    if (!text) return
    if (hasIPC) {
      window.api.writeClipboard(text)
    } else {
      navigator.clipboard.writeText(text).catch(console.error)
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

  const showResult = isIdle && finalText

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen select-none flex-col items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!authUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSignup={handleSignup}
        error={authError}
        loading={authLoading}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen select-none flex-col items-center justify-center bg-gray-50">
      <RecordingOverlay />

      <div className="flex flex-col items-center gap-6 max-w-2xl w-full px-6">
        <div className="self-end flex items-center gap-2">
          <span className="text-xs text-gray-400">{authUser.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Logout
          </button>
        </div>

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

        {showResult && (
          <div className="w-full space-y-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {finalText && refinedText && finalText !== refinedText ? 'Refined' : 'Transcript'}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {refinedText || finalText}
              </p>
            </div>

            {finalText && refinedText && finalText !== refinedText && (
              <details className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <summary className="text-xs font-medium text-gray-400 cursor-pointer">
                  Raw transcript
                </summary>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{finalText}</p>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors active:scale-95"
              >
                Copy
              </button>
              <button
                onClick={clearResult}
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
