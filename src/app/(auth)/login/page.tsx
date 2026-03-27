'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)

  // Show error from NextAuth callback (e.g. OAuthCallbackError)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'OAuthAccountNotLinked') {
        setError('This email is already associated with another sign-in method.')
      } else if (errorParam === 'AccessDenied') {
        setError('Access denied. Your account may not be authorized.')
      } else {
        setError(`Sign-in error: ${errorParam}`)
      }
    }
  }, [searchParams])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error || 'Invalid credentials')
      } else if (result?.ok) {
        router.push('/dashboard')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoftSignIn = () => {
    setSsoLoading(true)
    signIn('microsoft-entra-id', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">RX</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2 text-center">RX Skin</h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          ConnectWise Modern Portal
        </p>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950 border border-red-800 flex gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Microsoft SSO button */}
        <button
          onClick={handleMicrosoftSignIn}
          disabled={ssoLoading || loading}
          className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 mb-6"
        >
          {ssoLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
          )}
          {ssoLoading ? 'Redirecting...' : 'Sign in with Microsoft'}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-950 px-3 text-gray-500">or sign in with email</span>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading || ssoLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading || ssoLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || ssoLoading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
