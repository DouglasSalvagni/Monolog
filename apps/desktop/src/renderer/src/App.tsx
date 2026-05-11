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

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />
  }

  return (
    <div className="relative flex h-screen w-screen select-none flex-col items-center justify-center bg-studio-bg overflow-hidden animate-in fade-in duration-700">
      <RecordingOverlay />

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-studio-ink flex items-center justify-center">
            <div className="w-1.5 h-4 bg-white rounded-full mx-0.5 animate-ink-pulse" />
          </div>
          <h1 className="text-sm font-bold tracking-widest uppercase text-studio-ink">Monolog</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-studio-ink/30">Current Account</span>
            <span className="text-xs font-medium text-studio-ink/60">{authUser.email}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-studio-metal pl-6">
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-full p-2 text-studio-ink/40 hover:bg-white hover:text-studio-ink hover:shadow-studio-soft transition-all active:scale-95"
              title="Configurações"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-[10px] font-bold uppercase tracking-widest text-studio-red/60 hover:text-studio-red px-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-12 max-w-3xl w-full px-12 pt-24 pb-12">

        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-studio-ink/20">
            Intelligent Speech-to-Text
          </p>
          <h2 className="text-4xl font-serif italic text-studio-ink">O que você está pensando agora?</h2>
        </div>

        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex items-center gap-3 p-1.5 rounded-full bg-white border border-studio-metal shadow-studio-soft">
            <SkillSelector />
            <button
              onClick={handleToggle}
              className={`flex items-center gap-2 rounded-full px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-300 active:scale-95 ${
                isIdle
                  ? 'bg-studio-ink hover:bg-black hover:shadow-xl'
                  : 'bg-studio-red hover:bg-red-600 hover:shadow-xl'
              }`}
            >
              {isIdle ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-studio-amber animate-pulse" />
                  Start Capture
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Finish
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] font-medium text-studio-ink/30">
            Pressione{' '}
            <kbd className="rounded border border-studio-metal bg-white px-2 py-0.5 font-mono text-[10px] text-studio-ink/60 shadow-sm">
              Alt + Shift + R
            </kbd>{' '}
            em qualquer lugar
          </p>
        </div>

        {showResult && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

            <div className={`relative bg-white/80 rounded-3xl border shadow-studio-glass p-10 transition-all duration-700 ${
              isProcessing ? 'border-studio-amber/20' : 'border-studio-metal/50'
            }`}>
              <div className="absolute -top-3 left-10 px-4 py-1 rounded-full bg-studio-ink text-[10px] font-bold uppercase tracking-widest text-white">
                {isProcessing ? 'Refining with AI...' : refinedText ? 'Studio Refined' : 'Transcription'}
              </div>
              
              <div className="relative">
                <p className={`transcript-text text-studio-ink transition-all duration-700 ${
                  isProcessing ? 'opacity-30 blur-[1px] translate-y-1' : 'opacity-100 translate-y-0'
                }`}>
                  {refinedText || finalText}
                </p>
                
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-studio-amber animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-studio-amber animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-studio-amber animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {finalText && refinedText && finalText !== refinedText && (
              <details className="group">
                <summary className="text-[10px] font-bold uppercase tracking-widest text-studio-ink/30 cursor-pointer hover:text-studio-ink/60 transition-colors list-none flex items-center gap-2">
                  <span className="w-4 h-px bg-studio-metal group-open:w-8 transition-all" />
                  View Original Capture
                </summary>
                <div className="mt-4 p-6 rounded-2xl bg-studio-metal/10 border border-studio-metal/20">
                  <p className="text-xs text-studio-ink/50 leading-relaxed italic">"{finalText}"</p>
                </div>
              </details>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleCopy}
                disabled={!!isProcessing}
                className="flex items-center gap-2 rounded-full bg-studio-ink px-10 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:bg-black transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                Copy to Clipboard
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              <button
                onClick={() => {
                  clearResult()
                  setActiveSkill(null)
                  if (hasIPC) window.api.setSkillPrompt('')
                }}
                disabled={!!isProcessing}
                className="rounded-full bg-white border border-studio-metal px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-studio-ink/40 hover:text-studio-ink hover:border-studio-ink transition-all disabled:opacity-20 shadow-sm"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {showSkillManager && <SkillManager onClose={() => setShowSkillManager(false)} />}
    </div>
  )
}

export default App
