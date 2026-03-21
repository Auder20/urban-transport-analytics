import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bus, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react'
import api from '@/services/api'

export default function Register() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation
  const validatePassword = (password) => {
    return password.length >= 6
  }

  // Name validation
  const validateName = (name) => {
    return name.trim().length >= 2
  }

  // Validate individual fields
  const validateField = (name, value) => {
    let error = ''
    
    if (name === 'fullName') {
      if (!value) {
        error = 'Full name is required'
      } else if (!validateName(value)) {
        error = 'Full name must be at least 2 characters'
      }
    } else if (name === 'email') {
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

  // Password confirmation
  const [confirmPassword, setConfirmPassword] = useState('')

  // Validate entire form
  const validateForm = () => {
    const nameValid = validateField('fullName', formData.fullName)
    const emailValid = validateField('email', formData.email)
    const passwordValid = validateField('password', formData.password)
    const passwordsMatch = formData.password === confirmPassword
    
    return nameValid && emailValid && passwordValid && passwordsMatch
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
    setSuccess('')

    try {
      await api.post('/auth/register', formData)
      setSuccess('Account created successfully! Redirecting to login...')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.'
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
            <UserPlus size={32} className="text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Urban Transport Analytics
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <AlertCircle size={16} className="text-green-500" />
                <span className="text-sm text-green-600">{success}</span>
              </div>
            )}

            {/* Form-level Error */}
            {errors.form && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm text-red-600">{errors.form}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="label">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className={`input ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
              )}
            </div>

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
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
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
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
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
