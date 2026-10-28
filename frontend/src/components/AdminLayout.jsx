import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard,
    FileText,
    ShoppingBag,
    Package,
    LogOut,
    Pill,
    Bell,
    ChevronRight,
    ExternalLink,
} from 'lucide-react'

const NAV = [
    { icon: LayoutDashboard, label: 'Dashboard',     path: '/admin' },
    { icon: FileText,        label: 'Prescriptions', path: '/admin/prescriptions', badge: 5 },
    { icon: ShoppingBag,     label: 'Orders',        path: '/admin/orders',        badge: 3 },
    { icon: Package,         label: 'Inventory',     path: '/admin/inventory' },
]

export default function AdminLayout({ children }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { currentUser, logout } = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/admin/login', { replace: true })
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const adminInitial = currentUser?.displayName
        ? currentUser.displayName[0].toUpperCase()
        : currentUser?.email
            ? currentUser.email[0].toUpperCase()
            : 'A'

    const adminDisplay = currentUser?.displayName || currentUser?.email || 'Administrator'

    return (
        <div className="min-h-screen flex bg-gray-50">

            {/* ── Sidebar ── */}
            <aside className="w-60 bg-gray-900 flex flex-col shrink-0">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Pill size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm leading-none">Dhruv Pharma</p>
                            <p className="text-gray-500 text-[10px] mt-0.5">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV.map((item) => {
                        const active = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                                    ${active
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={16} />
                                <span className="flex-1">{item.label}</span>
                                {item.badge && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                        ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Info & Actions */}
                <div className="px-3 pb-5 border-t border-gray-800 pt-4 space-y-2">
                    <div className="flex items-center gap-3 px-2 py-1.5 mb-1">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {adminInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white text-xs font-medium truncate" title={adminDisplay}>
                                {adminDisplay}
                            </p>
                            <span className="inline-block bg-blue-900/60 text-blue-300 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                                Verified Admin
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs px-3 py-2 rounded-lg transition-colors font-medium text-left"
                    >
                        <LogOut size={14} />
                        Sign Out (Logout)
                    </button>

                    <Link
                        to="/"
                        className="flex items-center gap-2 text-gray-500 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <ExternalLink size={13} />
                        View Storefront
                    </Link>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top bar */}
                <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Admin</span>
                        <ChevronRight size={12} />
                        <span className="text-gray-800 font-medium">
                            {NAV.find((n) => n.path === location.pathname)?.label || 'Dashboard'}
                        </span>
                    </div>
                    <button className="relative text-gray-500 hover:text-gray-800">
                        <Bell size={18} />
                        <span className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                            8
                        </span>
                    </button>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {children}
                </main>
            </div>
        </div>
    )
}
