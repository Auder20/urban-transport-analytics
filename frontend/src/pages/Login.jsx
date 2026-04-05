import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bus, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import api from '@/services/api'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setToken, setRefreshToken } = useAppStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation
  const validatePassword = (password) => {
    return password.length >= 6
  }

  // Validate individual fields
  const validateField = (name, value) => {
    let error = ''
    
    if (name === 'email') {
      if (!value) {
        error = 'Email is required'
      } else if (!validateEmail(value)) {
        error = 'Please enter a valid email address'
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Password is required'
      } else if (!validatePassword(value)) {
        error = 'Password must be at least 6 characters'
      }
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
    
    return !error
  }

  // Validate entire form
  const validateForm = () => {
    const emailValid = validateField('email', formData.email)
    const passwordValid = validateField('password', formData.password)
    return emailValid && passwordValid
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setErrors({})

    try {
      const response = await api.post('/auth/login', formData)
      
      // Store user data and token
      setUser(response.data.user)
      setToken(response.data.accessToken)
      setRefreshToken(response.data.refreshToken)
      
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.'
      setErrors({ form: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <Bus size={32} className="text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Urban Transport Analytics
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Form-level Error */}
            {errors.form && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm text-red-600">{errors.form}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || Object.keys(errors).some(key => errors[key])}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>Email: admin@uta.com</p>
              <p>Password: Configurar en .env</p>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Urban Transport Analytics. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
