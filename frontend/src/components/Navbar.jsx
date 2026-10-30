import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import {
    ShoppingCart,
    FileText,
    Search,
    Menu,
    X,
    Phone,
    MapPin,
    Pill,
    Shield,
    User,
    ShieldCheck,
    ChevronDown,
    LogOut,
    ArrowRight,
} from 'lucide-react'

const NAV_LINKS = [
    { label: 'Home',                path: '/' },
    { label: 'Medicine Store',      path: '/medicines' },
    { label: 'Upload Prescription', path: '/prescription' },
    { label: 'My Orders',           path: '/my-orders' },
    { label: 'Contact Us',          path: '/contact' },
]

export default function Navbar() {
    const [menuOpen, setMenuOpen]                   = useState(false)
    const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery]             = useState('')

    const location = useLocation()
    const navigate = useNavigate()
    const { currentUser, isAdmin, logout } = useAuth()
    const { totalItems } = useCart()

    const dropdownRef = useRef(null)

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setLoginDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close dropdown on route change
    useEffect(() => {
        setLoginDropdownOpen(false)
        setMenuOpen(false)
    }, [location.pathname])

    const isActive = (path) =>
        path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)

    const handleLogout = async () => {
        try {
            await logout()
            setLoginDropdownOpen(false)
            navigate('/', { replace: true })
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const userDisplayName = currentUser?.displayName
        ? currentUser.displayName
        : currentUser?.email
            ? currentUser.email.split('@')[0]
            : 'Account'

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">

            {/* ── Top Bar ── */}
            <div className="bg-blue-700 text-white text-sm py-2">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5">
                            <Phone size={13} />
                            +91 98765 43210
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin size={13} />
                            Serving: Pune · Nashik · Ahmednagar · Aurangabad
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline font-medium text-xs text-blue-100">
                            🕒 Mon – Sat | 9:00 AM – 8:00 PM
                        </span>
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="inline-flex items-center gap-1.5 text-xs bg-blue-800/80 hover:bg-white hover:text-blue-700 px-2.5 py-1 rounded transition-colors font-medium border border-blue-500/40"
                            >
                                <Shield size={12} />
                                Pharmacist Portal
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main Navbar ── */}
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <Pill size={22} />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-blue-700 leading-none">
                            Dhruv
                        </span>
                        <span className="text-xl font-bold text-gray-800 leading-none">
                            Pharma
                        </span>
                        <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                            Your Trusted Medicine Partner
                        </p>
                    </div>
                </Link>

                {/* Search Bar (desktop) */}
                <div className="hidden md:flex flex-1 max-w-xl items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search size={18} className="ml-3 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search medicines, health products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                    />
                    <Link
                        to={`/medicines?q=${searchQuery}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 font-medium transition-colors"
                    >
                        Search
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-3">

                    {/* Upload Rx Button */}
                    <Link
                        to="/prescription"
                        className="hidden sm:flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                        <FileText size={15} />
                        Upload Rx
                    </Link>

                    {/* Cart Button */}
                    <Link
                        to="/cart"
                        className="relative flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
                    >
                        <ShoppingCart size={16} />
                        <span className="hidden sm:inline">Cart</span>
                        {totalItems > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                                {totalItems}
                            </span>
                        )}
                    </Link>

                    {/* ── Login Button (at the right side of Cart button) ── */}
                    <div className="relative" ref={dropdownRef}>
                        {currentUser ? (
                            // Logged-in State Button
                            <button
                                type="button"
                                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                                aria-expanded={loginDropdownOpen}
                                aria-label="User account menu"
                            >
                                {currentUser.photoURL ? (
                                    <img
                                        src={currentUser.photoURL}
                                        alt={userDisplayName}
                                        className="w-5 h-5 rounded-full object-cover border border-blue-300"
                                    />
                                ) : (
                                    <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {userDisplayName[0].toUpperCase()}
                                    </div>
                                )}
                                <span className="hidden sm:inline truncate max-w-[110px]">
                                    {userDisplayName}
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${
                                        loginDropdownOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                        ) : (
                            // Guest Login Button
                            <button
                                type="button"
                                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-sm font-semibold px-3 py-2 rounded-lg transition-all shadow-xs"
                                aria-expanded={loginDropdownOpen}
                                aria-label="Open login options"
                            >
                                <User size={15} className="text-slate-700" />
                                <span>Login</span>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-500 transition-transform duration-200 ${
                                        loginDropdownOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                        )}

                        {/* ── Login Options Dropdown ── */}
                        {loginDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                {currentUser ? (
                                    // Authenticated User Dropdown Content
                                    <div className="space-y-1">
                                        <div className="px-3 py-2.5 bg-gray-50 rounded-xl mb-1 flex items-center gap-2.5">
                                            {currentUser.photoURL ? (
                                                <img
                                                    src={currentUser.photoURL}
                                                    alt={userDisplayName}
                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                    {userDisplayName[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-gray-900 truncate">
                                                    {currentUser.displayName || 'Signed In User'}
                                                </p>
                                                <p className="text-[11px] text-gray-500 truncate">
                                                    {currentUser.email}
                                                </p>
                                                <span className={`inline-block mt-0.5 text-[9px] font-semibold px-2 py-0.2 rounded-full ${
                                                    isAdmin
                                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {isAdmin ? '🛡️ Administrator' : '👤 Customer'}
                                                </span>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setLoginDropdownOpen(false)}
                                                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Shield size={14} />
                                                    Admin Dashboard
                                                </span>
                                                <ArrowRight size={12} />
                                            </Link>
                                        )}

                                        <Link
                                            to="/cart"
                                            onClick={() => setLoginDropdownOpen(false)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <ShoppingCart size={14} />
                                                View Cart
                                            </span>
                                            <ArrowRight size={12} />
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                        >
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    // Guest User Options (User Login & Admin Login)
                                    <div>
                                        <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                Choose Portal
                                            </p>
                                        </div>

                                        {/* Option 1: User Login (Redirects to Home Page after login) */}
                                        <Link
                                            to="/login"
                                            onClick={() => setLoginDropdownOpen(false)}
                                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group"
                                        >
                                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                                                <User size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                                                        User Login
                                                    </p>
                                                    <ArrowRight size={13} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                                                    For patients &amp; customers. Redirects to website Home Page.
                                                </p>
                                            </div>
                                        </Link>

                                        {/* Option 2: Admin Login (Redirects to Admin Dashboard after login) */}
                                        <Link
                                            to="/admin/login"
                                            onClick={() => setLoginDropdownOpen(false)}
                                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group mt-1"
                                        >
                                            <div className="p-2 bg-slate-900 text-white rounded-lg shrink-0 mt-0.5">
                                                <ShieldCheck size={18} className="text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-slate-900">
                                                        Admin Login
                                                    </p>
                                                    <ArrowRight size={13} className="text-gray-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                                                    For pharmacy owner. Directly redirects to Admin Dashboard.
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hamburger (mobile) */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* ── Desktop Nav Links ── */}
            <nav className="hidden md:block border-t border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <ul className="flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`block px-4 py-3 text-sm font-medium transition-colors border-b-2
                                        ${isActive(link.path)
                                            ? 'text-blue-600 border-blue-600'
                                            : 'text-gray-600 hover:text-blue-600 border-transparent hover:border-blue-300'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* ── Mobile Menu ── */}
            {menuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
                    {/* Mobile Search */}
                    <div className="px-4 pt-3 pb-2">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <Search size={16} className="ml-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search medicines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-3 py-2.5 text-sm outline-none"
                            />
                        </div>
                    </div>

                    {/* Mobile Login Options */}
                    <div className="px-4 py-2 border-b border-gray-100 bg-slate-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Account Portals
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                to="/login"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-center gap-1.5 bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center"
                            >
                                <User size={13} />
                                User Login
                            </Link>
                            <Link
                                to="/admin/login"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-center gap-1.5 bg-slate-900 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center"
                            >
                                <ShieldCheck size={13} className="text-blue-400" />
                                Admin Login
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Nav Links */}
                    <ul className="py-2">
                        {NAV_LINKS.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    onClick={() => setMenuOpen(false)}
                                    className={`block px-4 py-3 text-sm font-medium transition-colors
                                        ${isActive(link.path)
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </header>
    )
}
