'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession, getProviders } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2, Shield, ChevronDown, ChevronUp } from 'lucide-react'

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

  const [error, setError] = useState('')
  const [ssoLoading, setSsoLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [hasMicrosoft, setHasMicrosoft] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [providersLoaded, setProvidersLoaded] = useState(false)

  // Detect which providers are configured
  useEffect(() => {
    getProviders().then((p) => {
      if (p) {
        setHasMicrosoft(!!p['microsoft-entra-id'])
        setHasCredentials(!!p['credentials'])
      }
      setProvidersLoaded(true)
    })
  }, [])

  // Show error from NextAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'OAuthAccountNotLinked') {
        setError('This email is already associated with another sign-in method.')
      } else if (errorParam === 'AccessDenied') {
        setError('Access denied. Your account may not be authorized.')
      } else if (errorParam === 'Configuration') {
        setError('SSO is not configured yet. Contact your administrator.')
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

  const handleMicrosoftSignIn = () => {
    setSsoLoading(true)
    setError('')
    signIn('microsoft-entra-id', { callbackUrl: '/dashboard' })
  }

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
        setError('Invalid credentials')
      } else if (result?.ok) {
        router.push('/dashboard')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!providersLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <span className="text-white font-bold text-xl">RX</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-1 text-center">RX Skin</h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          ConnectWise Modern Portal
        </p>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/50 border border-red-800/50 flex gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Microsoft SSO button */}
        {hasMicrosoft && (
          <button
            onClick={handleMicrosoftSignIn}
            disabled={ssoLoading || loading}
            className="w-full px-4 py-3.5 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 shadow-lg"
          >
            {ssoLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
            )}
            {ssoLoading ? 'Redirecting to Microsoft...' : 'Sign in with Microsoft'}
          </button>
        )}

        {/* Admin login — collapsible if Microsoft SSO is also available */}
        {hasCredentials && (
          <>
            {hasMicrosoft && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="w-full mt-4 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-400 text-xs transition-colors"
              >
                <span>Admin login</span>
                {showAdmin ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            {(showAdmin || !hasMicrosoft) && (
              <form onSubmit={handleSubmit} className={`space-y-4 ${hasMicrosoft ? 'mt-4' : ''}`}>
                {hasMicrosoft && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800" />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rxtech.app"
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading || ssoLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || ssoLoading}
                  className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            )}
          </>
        )}

        {/* No providers configured */}
        {!hasMicrosoft && !hasCredentials && (
          <div className="p-4 rounded-lg bg-yellow-950/50 border border-yellow-800/50 text-yellow-400 text-sm text-center">
            No authentication providers configured. Contact your administrator.
          </div>
        )}

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Shield size={14} />
          <span>{hasMicrosoft ? 'Secured with Microsoft Entra ID' : 'RX Skin Admin Portal'}</span>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-gray-600 text-xs">
          RX Technology &middot; Internal Portal
        </p>
      </div>
    </div>
  )
}
