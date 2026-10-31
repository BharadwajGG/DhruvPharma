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
    Store,
    ShieldCheck,
} from 'lucide-react'

const NAV = [
    { icon: LayoutDashboard, label: 'Store Overview',        path: '/admin' },
    { icon: ShoppingBag,     label: 'Customer Orders',       path: '/admin/orders' },
    { icon: FileText,        label: 'Customer Prescriptions', path: '/admin/prescriptions' },
    { icon: Package,         label: 'Medicine Inventory',    path: '/admin/inventory' },
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
            : 'D'

    const adminDisplay = currentUser?.displayName || currentUser?.email || 'Store Admin'

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-800">

            {/* ── Sidebar ── */}
            <aside className="w-64 bg-slate-900 flex flex-col shrink-0 border-r border-slate-800 select-none">
                {/* Logo & Store Identity */}
                <div className="px-5 py-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm text-white shrink-0">
                            <Pill size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-white text-base leading-tight tracking-wide">Dhruv Pharma</p>
                            <p className="text-emerald-400 text-xs font-medium flex items-center gap-1 mt-0.5">
                                <ShieldCheck size={12} /> Chemist &amp; Druggist
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1.5">
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Main Menu
                    </p>
                    {NAV.map((item) => {
                        const active = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all
                                    ${active
                                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30 font-bold'
                                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                                <span className="flex-1">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* User & Store Actions */}
                <div className="px-3 pb-5 border-t border-slate-800 pt-4 space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                            {adminInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white text-xs font-bold truncate" title={adminDisplay}>
                                {adminDisplay}
                            </p>
                            <span className="text-[10px] text-emerald-400 font-medium">
                                Store Manager
                            </span>
                        </div>
                    </div>

                    <Link
                        to="/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                    >
                        <Store size={14} className="text-emerald-400" />
                        <span>Open Customer Website</span>
                        <ExternalLink size={12} className="text-slate-400" />
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs px-3 py-2 rounded-xl transition-colors font-semibold"
                    >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Clean Top Bar */}
                <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                        <span className="text-slate-400">Store Admin</span>
                        <ChevronRight size={13} className="text-slate-300" />
                        <span className="text-slate-900 font-bold">
                            {NAV.find((n) => n.path === location.pathname)?.label || 'Store Overview'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Store Status: <strong className="text-emerald-700 font-bold">Online &amp; Active</strong></span>
                        </div>

                        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

                        <span className="text-xs text-slate-500 font-medium hidden md:inline">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {children}
                </main>
            </div>
        </div>
    )
}
