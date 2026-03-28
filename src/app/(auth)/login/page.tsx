'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2, Shield } from 'lucide-react'

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

  // Show error from NextAuth callback (e.g. OAuthCallbackError)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'OAuthAccountNotLinked') {
        setError('This email is already associated with another sign-in method.')
      } else if (errorParam === 'AccessDenied') {
        setError('Access denied. Your account may not be authorized.')
      } else if (errorParam === 'Configuration') {
        setError('Microsoft SSO is not configured yet. Contact your administrator.')
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
        <button
          onClick={handleMicrosoftSignIn}
          disabled={ssoLoading}
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

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Shield size={14} />
          <span>Secured with Microsoft Entra ID</span>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-gray-600 text-xs">
          RX Technology &middot; Internal Portal
        </p>
      </div>
    </div>
  )
}
