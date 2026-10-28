import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    ClipboardList,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Pill,
    Info,
    Check,
} from 'lucide-react'

export default function PrescriptionQueueLoginPage() {
    const { login, register, isFirebaseConfigured } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/prescription-queue'

    const [isSignUp, setIsSignUp]                 = useState(false)
    const [fullName, setFullName]                 = useState('')
    const [email, setEmail]                       = useState('')
    const [password, setPassword]                 = useState('')
    const [confirmPassword, setConfirmPassword]   = useState('')
    const [showPassword, setShowPassword]         = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading]                   = useState(false)
    const [error, setError]                       = useState('')
    const [successMessage, setSuccessMessage]     = useState('')

    // Password strength evaluator
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccessMessage('')

        if (!validateForm()) return

        setLoading(true)
        try {
            if (isSignUp) {
                // Public sign-up strictly assigns standard user permissions, never admin privileges
                await register(email.trim(), password, fullName.trim())
                setSuccessMessage('Account created successfully! Redirecting to Prescription Queue...')
                setTimeout(() => {
                    navigate(from, { replace: true })
                }, 1000)
            } else {
                await login(email.trim(), password)
                navigate(from, { replace: true })
            }
        } catch (err) {
            console.error('Prescription queue auth error:', err)
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('An account with this email address already exists. Please sign in instead.')
                    break
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('Invalid email address or password. Please try again.')
                    break
                case 'auth/weak-password':
                    setError('Password is too weak. Please use at least 6 characters with mixed letters and numbers.')
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
                            <p className="text-[10px] text-gray-500 font-medium">Prescription Operations</p>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 text-center">
                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                        <ClipboardList size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Prescription Queue Login
                    </h1>
                </div>
                <p className="mt-1 text-center text-xs text-gray-500">
                    Sign in or register to access and review patient prescription requests
                </p>

                {/* Mode Toggle Tabs */}
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

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        {/* Full Name (Sign Up only) */}
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        required={isSignUp}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Dr. Rajesh / Staff Name"
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
                            <div className="relative rounded-xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@dhruvpharma.com"
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
                            <div className="relative rounded-xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
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

                            {/* Password strength indicator for registration */}
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
                                <div className="relative rounded-xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
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
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 transition-colors shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {isSignUp ? 'Creating Account...' : 'Authenticating...'}
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList size={16} />
                                        {isSignUp ? 'Complete Registration & Access Queue' : 'Sign In to Prescription Queue'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-2.5 text-xs text-gray-500">
                        <p className="text-center text-[11px] text-gray-400">
                            Prescription Queue access is monitored. Public registration does not grant administrative privileges.
                        </p>
                        <Link
                            to="/cart"
                            className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                            <ArrowLeft size={13} />
                            Back to Add to Cart / Store
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

