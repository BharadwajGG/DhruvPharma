import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, LogOut, ArrowLeft, Loader2 } from 'lucide-react'

/* ── Fullscreen Loading Spinner ── */
export function AuthLoadingScreen({ message = 'Verifying authentication...' }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-sm w-full text-center">
                <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
                <h3 className="font-semibold text-gray-800 text-base mb-1">Dhruv Pharma Security</h3>
                <p className="text-xs text-gray-500">{message}</p>
            </div>
        </div>
    )
}

/* ── Dedicated Access Denied Screen (Strict Admin Authorization) ── */
export function AccessDeniedScreen() {
    const { currentUser, logout } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-600">
                    <ShieldAlert size={34} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Access Denied: Admin Privileges Required
                </h2>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    You are signed in as <strong className="text-gray-900">{currentUser?.email}</strong>, but this account has not been assigned administrator privileges.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mb-6">
                    <p className="text-[11px] text-amber-800 leading-snug">
                        <strong>Security Policy:</strong> Ordinary users and customers cannot access the Admin Dashboard. Admin privileges must be provisioned by the system administrator via Firebase Custom Claims.
                    </p>
                </div>
                <div className="flex flex-col gap-2.5">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                    >
                        <LogOut size={15} />
                        Sign Out &amp; Use Admin Account
                    </button>
                    <Link
                        to="/"
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
                    >
                        <ArrowLeft size={15} />
                        Return to Storefront
                    </Link>
                </div>
            </div>
        </div>
    )
}

/* ── Admin Route Guard ── */
export function AdminRoute({ children }) {
    const { currentUser, isAdmin, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <AuthLoadingScreen message="Verifying administrator authorization..." />
    }

    if (!currentUser) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />
    }

    if (!isAdmin) {
        return <AccessDeniedScreen />
    }

    return children
}

/* ── Prescription Queue Route Guard ── */
export function PrescriptionQueueRoute({ children }) {
    const { currentUser, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <AuthLoadingScreen message="Verifying prescription queue access..." />
    }

    if (!currentUser) {
        return <Navigate to="/prescription-queue/login" state={{ from: location }} replace />
    }

    return children
}

