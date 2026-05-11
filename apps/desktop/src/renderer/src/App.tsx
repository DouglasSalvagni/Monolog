import { useEffect, useCallback, useState } from 'react'
import { RecordingOverlay } from './components/RecordingOverlay'
import { LoginScreen } from './components/LoginScreen'
import { SkillSelector } from './components/SkillSelector'
import { SkillManager } from './components/SkillManager'
import { SettingsPage } from './components/SettingsPage'
import { useRecordingStore } from './store/recordingStore'
import { useAuthStore } from './store/authStore'

function App(): React.JSX.Element {
  const [showSkillManager, setShowSkillManager] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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
  const activeSkill = useRecordingStore((s) => s.activeSkill)
  const setActiveSkill = useRecordingStore((s) => s.setActiveSkill)
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
        } else if (result.needsEmailConfirmation) {
          setAuthError('Conta criada! Verifique seu email para confirmar o cadastro antes de fazer login.')
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

  useEffect(() => {
    if (!hasIPC || !activeSkill) return
    window.api.setSkillPrompt(activeSkill.prompt)
  }, [activeSkill, hasIPC])

  const showResult = isIdle && finalText
  const isProcessing = showResult && !refinedText

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
    <div className="relative flex h-screen w-screen select-none flex-col items-center justify-center bg-gray-50">
      <RecordingOverlay />

      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span className="text-xs text-gray-400">{authUser.email}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Logout
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="ml-2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:rotate-45"
          title="Configurações"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

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

        <div className="flex items-center justify-center gap-4 w-full max-w-sm">
          <SkillSelector />
        </div>

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

            <div className={`bg-white rounded-lg border shadow-sm p-4 transition-all duration-500 ${
              isProcessing ? 'border-blue-200 border-t-2 border-t-blue-400' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium uppercase tracking-wide ${
                  isProcessing ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  {isProcessing ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                      </span>
                      Refining
                    </span>
                  ) : refinedText && finalText && finalText !== refinedText ? 'Refined' : 'Transcript'}
                </span>
              </div>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words transition-colors duration-500 ${
                isProcessing ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {refinedText || finalText}
              </p>
              {isProcessing && (
                <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-blue-300 via-blue-500 to-blue-300" />
                </div>
              )}
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
                disabled={!!isProcessing}
                className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  clearResult()
                  setActiveSkill(null)
                  if (hasIPC) window.api.setSkillPrompt('')
                }}
                disabled={!!isProcessing}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {showSkillManager && <SkillManager onClose={() => setShowSkillManager(false)} />}
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
