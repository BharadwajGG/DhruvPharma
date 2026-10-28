import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PrescriptionQueueView from '../components/PrescriptionQueueView'
import {
    ClipboardList,
    LogOut,
    ExternalLink,
    Shield,
    User,
    Pill,
} from 'lucide-react'

export default function PrescriptionQueuePage() {
    const { currentUser, isAdmin, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/prescription-queue/login', { replace: true })
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* ── Dedicated Prescription Operations Header ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                    {/* Logo & Queue Title */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
                                <Pill size={20} />
                            </div>
                            <span className="font-bold text-gray-900 text-lg hidden sm:inline">
                                Dhruv<span className="text-emerald-600">Pharma</span>
                            </span>
                        </Link>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-200">
                            <ClipboardList size={14} />
                            <span>Prescription Queue</span>
                        </div>
                    </div>

                    {/* User Info & Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 text-right">
                            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs">
                                <User size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-900 truncate max-w-[180px]">
                                    {currentUser?.displayName || currentUser?.email}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {isAdmin ? 'Admin (Full Access)' : 'Prescription Reviewer'}
                                </p>
                            </div>
                        </div>

                        {/* Switch to Admin if user has Admin privileges */}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Shield size={13} />
                                <span className="hidden sm:inline">Admin Dashboard</span>
                            </Link>
                        )}

                        <Link
                            to="/cart"
                            className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden sm:inline-flex items-center gap-1"
                        >
                            <ExternalLink size={13} />
                            Storefront
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <LogOut size={13} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Queue Workspace ── */}
            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
                <PrescriptionQueueView
                    title="Incoming Prescription Requests"
                    subtitle="Review verified customer prescriptions, approve eligible orders, and manage dispatch readiness."
                />
            </main>
        </div>
    )
}

