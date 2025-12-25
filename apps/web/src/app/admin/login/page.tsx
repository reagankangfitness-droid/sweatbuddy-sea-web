'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Logo } from '@/components/logo'

const ADMIN_SECRET = 'sweatbuddies-admin-2024'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (password === ADMIN_SECRET) {
      localStorage.setItem('admin-auth', password)
      toast.success('Welcome back!')
      router.push('/admin')
    } else {
      toast.error('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-coral/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-teal/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size={56} />
          </div>
          <h1 className="font-sans text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>SweatBuddies Admin</h1>
          <p className="text-base mt-2" style={{ color: '#9CA3AF' }}>Enter your password to continue</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700 p-8">
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#D1D5DB' }}>
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-neutral-500" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-forest-500 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20 transition-all"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-neutral-900 py-3 rounded-full font-semibold text-base hover:bg-neutral-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
          SweatBuddies Admin Panel
        </p>
      </div>
    </div>
  )
}
