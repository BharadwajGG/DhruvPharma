import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    ShieldCheck,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Pill,
    Info,
} from 'lucide-react'

export default function AdminLoginPage() {
    const { login, logout, isFirebaseConfigured } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/admin'

    const [email, setEmail]               = useState('')
    const [password, setPassword]         = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading]           = useState(false)
    const [error, setError]               = useState('')

    const validateForm = () => {
        if (!email.trim()) {
            setError('Please enter your administrator email address.')
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
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateForm()) return

        setLoading(true)
        try {
            const { isAdmin } = await login(email.trim(), password)

            if (!isAdmin) {
                // Strict Admin Safeguard: Immediately sign out non-admin accounts
                await logout()
                setError(
                    'Access Denied: This account does not have administrator privileges. Only authorized pharmacy administrators may access the Admin Dashboard.'
                )
                setLoading(false)
                return
            }

            // Redirect verified admin
            navigate(from, { replace: true })
        } catch (err) {
            console.error('Admin login error:', err)
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('Invalid administrator email or password. Please try again.')
                    break
                case 'auth/too-many-requests':
                    setError('Too many unsuccessful attempts. Access temporarily disabled for security. Please try again later.')
                    break
                case 'auth/network-request-failed':
                    setError('Network connection failed. Please check your internet connection.')
                    break
                default:
                    setError(err.message || 'An error occurred during authentication. Please try again.')
            }
        } finally {
            setLoading(false)
        }
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
                            <p className="text-[10px] text-gray-500 font-medium">Administrator Security Portal</p>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 text-center">
                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                        <ShieldCheck size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Admin Login
                    </h1>
                </div>
                <p className="mt-1 text-center text-xs text-gray-500">
                    Restricted exclusively to authorized Dhruv Pharma administrators
                </p>
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm border border-gray-200/80 rounded-2xl sm:px-10">

                    {!isFirebaseConfigured && (
                        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left flex gap-2.5">
                            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800 leading-relaxed">
                                <p className="font-semibold mb-0.5">Firebase Configuration Notice</p>
                                <p>
                                    Firebase credentials are using placeholder values. Configure your Firebase Web App keys in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> to connect your live Firebase project.
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

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                Administrator Email <span className="text-red-500">*</span>
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
                                    placeholder="admin@dhruvpharma.com"
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
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
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
                        </div>

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
                                        Verifying Credentials...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={16} />
                                        Sign In as Administrator
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-2.5 text-xs text-gray-500">
                        <p className="text-center text-[11px] text-gray-400">
                            Protected by Firebase Authentication &amp; Server-Verified Custom Claims.
                        </p>
                        <Link
                            to="/cart"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
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

