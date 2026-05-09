import { useState } from 'react'

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void
  onSignup: (email: string, password: string) => void
  error: string | null
  loading: boolean
}

export function LoginScreen({ onLogin, onSignup, error, loading }: LoginScreenProps): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (isSignup) {
      onSignup(email, password)
    } else {
      onLogin(email, password)
    }
  }

  return (
    <div className="flex h-screen w-screen select-none flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Monolog</h1>
        <p className="text-sm text-gray-500">{isSignup ? 'Create your account' : 'Sign in to your account'}</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            required
            minLength={6}
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-blue-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-gray-500">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignup(!isSignup); setPassword('') }}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
