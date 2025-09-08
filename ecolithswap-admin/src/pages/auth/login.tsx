import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../../stores/auth-store'
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, isAuthenticated, loading } = useAuthStore()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Login successful!')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E7D32] to-[#00796B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-[#2E7D32]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">EcolithSwap</h1>
          <p className="text-green-100">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-900">
              Sign In
            </CardTitle>
            <p className="text-center text-gray-600">
              Enter your credentials to access the admin dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ecolithswap.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#2E7D32] focus:ring-[#2E7D32] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm text-[#2E7D32] hover:text-[#1B5E20]">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || loading}
              >
                {(isLoading || loading) ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Demo Credentials:</strong>
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Email: admin@ecolithswap.com</p>
                <p>Password: admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-green-100 text-sm">
            © 2025 EcolithSwap. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
