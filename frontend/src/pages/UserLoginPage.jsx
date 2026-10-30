import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Pill,
    Shield,
    Info,
} from 'lucide-react'

export default function UserLoginPage() {
    const { login, register, loginWithGoogle, isFirebaseConfigured } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from?.pathname || location.state?.from || '/'

    const [isSignUp, setIsSignUp]                       = useState(false)
    const [fullName, setFullName]                       = useState('')
    const [email, setEmail]                             = useState('')
    const [password, setPassword]                       = useState('')
    const [confirmPassword, setConfirmPassword]         = useState('')
    const [showPassword, setShowPassword]               = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading]                         = useState(false)
    const [googleLoading, setGoogleLoading]             = useState(false)
    const [error, setError]                             = useState('')
    const [successMessage, setSuccessMessage]           = useState('')

    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: 'bg-gray-200' }
        let score = 0
        if (pass.length >= 6) score++
        if (pass.length >= 8) score++
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++
        if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++

        switch (score) {
            case 1:
                return { score, label: 'Weak', color: 'bg-red-500' }
            case 2:
                return { score, label: 'Fair', color: 'bg-yellow-500' }
            case 3:
                return { score, label: 'Good', color: 'bg-blue-500' }
            case 4:
                return { score, label: 'Strong', color: 'bg-green-500' }
            default:
                return { score: 0, label: 'Too short', color: 'bg-red-400' }
        }
    }

    const passwordStrength = getPasswordStrength(password)

    const validateForm = () => {
        if (isSignUp && !fullName.trim()) {
            setError('Please enter your full name.')
            return false
        }
        if (!email.trim()) {
            setError('Please enter your email address.')
            return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.')
            return false
        }
        if (!password) {
            setError('Please enter your password.')
            return false
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.')
            return false
        }
        if (isSignUp && password !== confirmPassword) {
            setError('Passwords do not match. Please re-enter confirmation password.')
            return false
        }
        return true
    }

    const handleGoogleSignIn = async () => {
        setError('')
        setSuccessMessage('')
        setGoogleLoading(true)
        try {
            await loginWithGoogle()
            setSuccessMessage('Successfully signed in with Google! Redirecting...')
            setTimeout(() => {
                navigate(from, { replace: true })
            }, 500)
        } catch (err) {
            console.error('Google sign-in error:', err)
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Google sign-in failed. Please try again.')
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccessMessage('')

        if (!validateForm()) return

        setLoading(true)
        try {
            if (isSignUp) {
                await register(email.trim(), password, fullName.trim())
                setSuccessMessage('Account created successfully! Redirecting...')
                setTimeout(() => {
                    navigate(from, { replace: true })
                }, 800)
            } else {
                await login(email.trim(), password)
                navigate(from, { replace: true })
            }
        } catch (err) {
            console.error('User login error:', err)
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('An account with this email already exists. Please sign in instead.')
                    break
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('Invalid email address or password. Please try again.')
                    break
                case 'auth/weak-password':
                    setError('Password is too weak. Please use at least 6 characters.')
                    break
                case 'auth/network-request-failed':
                    setError('Network request failed. Please check your internet connection.')
                    break
                case 'auth/too-many-requests':
                    setError('Too many failed attempts. Please try again in a few minutes.')
                    break
                default:
                    setError(err.message || 'Authentication failed. Please check your details.')
            }
        } finally {
            setLoading(false)
        }
    }

    const switchMode = (signUp) => {
        setIsSignUp(signUp)
        setError('')
        setSuccessMessage('')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">

                {/* Brand Header */}
                <div className="flex justify-center mb-3">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-sm">
                            <Pill size={24} />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-blue-700 leading-none">Dhruv</span>
                                <span className="text-2xl font-bold text-gray-900 leading-none">Pharma</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium">Customer Portal</p>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 text-center">
                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                        <User size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        User Login
                    </h1>
                </div>
                <p className="mt-1 text-center text-xs text-gray-500">
                    Sign in to track orders, upload prescriptions, and manage monthly medicine refills
                </p>

                {/* Mode Toggle */}
                <div className="mt-6 flex bg-gray-200/80 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => switchMode(false)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            !isSignUp
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode(true)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            isSignUp
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Create Account
                    </button>
                </div>
            </div>

            <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm border border-gray-200/80 rounded-2xl sm:px-10">

                    {!isFirebaseConfigured && (
                        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left flex gap-2.5">
                            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800 leading-relaxed">
                                <p className="font-semibold mb-0.5">Firebase Configuration Notice</p>
                                <p>
                                    Firebase credentials are using placeholder values. Configure your Firebase Web App keys in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> for live cloud authentication.
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs leading-relaxed">
                            <AlertCircle size={17} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs leading-relaxed">
                            <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Primary Google Sign-In Button */}
                    <div className="mb-5">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading || googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl border border-gray-300 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
                        >
                            {googleLoading ? (
                                <Loader2 size={18} className="animate-spin text-blue-600" />
                            ) : (
                                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                            )}
                            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">
                                    or with email & password
                                </span>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        {/* Full Name (Sign Up only) */}
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        required={isSignUp}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        disabled={loading}
                                        className="block w-full pl-10 pr-3 py-2.5 text-sm text-gray-800 rounded-xl outline-none bg-transparent disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="patient@example.com"
                                    disabled={loading}
                                    className="block w-full pl-10 pr-3 py-2.5 text-sm text-gray-800 rounded-xl outline-none bg-transparent disabled:bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    disabled={loading}
                                    className="block w-full pl-10 pr-10 py-2.5 text-sm text-gray-800 rounded-xl outline-none bg-transparent disabled:bg-gray-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {isSignUp && password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                                        <span>Strength: <strong className="text-gray-700">{passwordStrength.label}</strong></span>
                                        <span>Min 6 chars</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password (Sign Up only) */}
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat your password"
                                        disabled={loading}
                                        className="block w-full pl-10 pr-10 py-2.5 text-sm text-gray-800 rounded-xl outline-none bg-transparent disabled:bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {isSignUp ? 'Creating Account...' : 'Signing in...'}
                                    </>
                                ) : (
                                    <>
                                        <User size={16} />
                                        {isSignUp ? 'Create Account & Go to Store' : 'Sign In & Go to Store'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <span>Are you a pharmacy administrator?</span>
                            <Link
                                to="/admin/login"
                                className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                            >
                                <Shield size={12} />
                                Admin Login
                            </Link>
                        </div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                        >
                            <ArrowLeft size={13} />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

