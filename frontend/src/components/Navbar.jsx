import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useDelivery } from '../context/DeliveryContext'
import {
    ShoppingCart,
    Heart,
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
    Crosshair,
    Check,
    AlertCircle,
    Sparkles,
    CheckCircle2,
    Loader2,
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
    const { totalWishlistItems } = useWishlist()

    const dropdownRef = useRef(null)
    const locationRef = useRef(null)

    // ── Delivery Location Popover State (Deliver to ⌵) ──
    const {
        selectedLocation,
        serviceableAreas,
        setLocationByPincode,
        detectCurrentLocation,
        isLocating,
    } = useDelivery()
    const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)
    const [pinInput, setPinInput] = useState('')
    const [pinFeedback, setPinFeedback] = useState(null)

    // Close popovers on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setLoginDropdownOpen(false)
            }
            if (locationRef.current && !locationRef.current.contains(event.target)) {
                setLocationPopoverOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleVerifyPin = (e) => {
        if (e) e.preventDefault()
        if (!pinInput || pinInput.trim().length !== 6) {
            setPinFeedback({
                success: false,
                message: 'Please enter a valid 6-digit PIN code.',
            })
            return
        }

        const res = setLocationByPincode(pinInput.trim())
        setPinFeedback(res)
        if (res.success) {
            setTimeout(() => {
                setLocationPopoverOpen(false)
                setPinFeedback(null)
                setPinInput('')
            }, 1800)
        }
    }

    const handleSelectArea = (area) => {
        const res = setLocationByPincode(area.pincode)
        setPinFeedback(res)
        setTimeout(() => {
            setLocationPopoverOpen(false)
            setPinFeedback(null)
            setPinInput('')
        }, 1200)
    }

    const handleDetectLocation = async () => {
        const res = await detectCurrentLocation()
        setPinFeedback(res)
        if (res.success) {
            setTimeout(() => {
                setLocationPopoverOpen(false)
                setPinFeedback(null)
            }, 1800)
        }
    }

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
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-200/80 transition-all">

            {/* ── Top Bar ── */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white text-xs sm:text-sm py-1.5 sm:py-2">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <a
                            href="tel:+919503500725"
                            className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors font-bold text-xs sm:text-sm"
                            title="Call Dhruv Pharma to Order"
                        >
                            <Phone size={13} className="text-yellow-300" />
                            <span>Order via Call: <strong>+91 95035 00725</strong></span>
                        </a>
                        <span className="hidden md:flex items-center gap-1.5 text-xs text-blue-100 font-medium">
                            <MapPin size={12} className="text-emerald-400" />
                            Hubs: Nandurbar · Shahada · Taloda · Nijampur · Akkalkuwa · Shirpur · Sakri
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline font-semibold text-xs text-emerald-200">
                            ⚡ 24/7 Service Available
                        </span>
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="inline-flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white hover:text-blue-800 px-2.5 py-1 rounded-lg transition-all font-bold border border-white/25"
                            >
                                <Shield size={12} />
                                Pharmacist Portal
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main Navbar ── */}
            <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                    <div className="bg-blue-600 group-hover:bg-blue-700 text-white p-2 rounded-xl transition-all shadow-xs group-hover:scale-105">
                        <Pill size={22} />
                    </div>
                    <div>
                        <div className="flex items-center leading-none">
                            <span className="text-xl font-black text-blue-700">Dhruv</span>
                            <span className="text-xl font-black text-gray-900 ml-1">Pharma</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5 tracking-wide">
                            Genuine Medicine Hub
                        </p>
                    </div>
                </Link>

                {/* ── Unified Search & Delivery Bar (desktop) ── */}
                <div
                    className="hidden md:flex flex-1 max-w-2xl items-center border border-gray-300 rounded-2xl bg-white shadow-2xs hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all relative"
                    ref={locationRef}
                >
                    {/* 📍 Deliver to Pill (Matches Truemeds UI from User Image 1) */}
                    <button
                        type="button"
                        onClick={() => setLocationPopoverOpen(!locationPopoverOpen)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 hover:bg-gray-50 border-r border-gray-200 text-xs font-semibold text-gray-800 transition-colors shrink-0 cursor-pointer rounded-l-2xl"
                        title="Check and select delivery location"
                    >
                        <MapPin size={15} className="text-blue-600 shrink-0" />
                        <span className="text-gray-500 font-normal">Deliver to</span>
                        <span className="font-bold text-gray-900 truncate max-w-[125px]">
                            {selectedLocation.name} ({selectedLocation.pincode})
                        </span>
                        <ChevronDown size={13} className={`text-gray-400 transition-transform ${locationPopoverOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Location Popover Card (Matches Image 1) */}
                    {locationPopoverOpen && (
                        <div className="absolute top-full left-0 mt-2 w-84 sm:w-96 bg-white rounded-3xl border border-gray-100 shadow-2xl p-5 z-50 space-y-4 animate-in fade-in slide-in-from-top-2 text-left">
                            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Choose your location</h4>
                                    <p className="text-[11px] text-gray-500">Check delivery availability &amp; delivery time</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLocationPopoverOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* PIN Code Input form */}
                            <form onSubmit={handleVerifyPin} className="space-y-2">
                                <div className="flex items-center border border-gray-300 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 bg-gray-50/50 p-1">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="Enter your 6 digit PIN code"
                                        value={pinInput}
                                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                                        className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-mono"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                    >
                                        <Check size={13} />
                                        <span>Check</span>
                                    </button>
                                </div>
                            </form>

                            {/* Feedback Message */}
                            {pinFeedback && (
                                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in ${
                                    pinFeedback.success
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                    {pinFeedback.success ? (
                                        <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="font-bold">{pinFeedback.success ? 'Delivery Available' : 'Unserviceable Area'}</p>
                                        <p className="text-[11px] leading-relaxed mt-0.5">{pinFeedback.message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Quick 7 Serviceable Hubs Selection Chips */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Authorized Service Areas (Delivery in 3–4 Days)
                                    </p>
                                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                                        7 Hubs
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {serviceableAreas.map((area) => (
                                        <button
                                            key={area.pincode}
                                            type="button"
                                            onClick={() => handleSelectArea(area)}
                                            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                                                selectedLocation.pincode === area.pincode
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                                                    : 'bg-gray-50 hover:bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                                            }`}
                                        >
                                            <span>{area.name}</span>
                                            <span className="text-[10px] opacity-75 font-mono">({area.pincode})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Actions: Current Location & Saved Addresses */}
                            <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
                                <button
                                    type="button"
                                    onClick={handleDetectLocation}
                                    disabled={isLocating}
                                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/60 text-blue-700 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Crosshair size={15} className={`text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                                        <span className="font-semibold">Use current location</span>
                                    </div>
                                    <span className="text-gray-400 text-xs group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                                </button>

                                <div className="flex items-center justify-between p-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <User size={15} className="text-gray-400" />
                                        <span>
                                            {currentUser ? `Saved address for ${currentUser.displayName || currentUser.email}` : 'Login to view saved addresses'}
                                        </span>
                                    </div>
                                    {!currentUser && (
                                        <Link
                                            to="/login"
                                            onClick={() => setLocationPopoverOpen(false)}
                                            className="text-blue-600 font-bold hover:underline"
                                        >
                                            Login
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Input */}
                    <Search size={16} className="ml-3 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search medicines, health products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-xs outline-none bg-transparent"
                    />
                    <Link
                        to={`/medicines?q=${searchQuery}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 font-semibold transition-colors rounded-r-2xl"
                    >
                        Search
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-3">

                    {/* Upload Rx Button */}
                    <Link
                        to="/prescription"
                        className="btn-tap hidden sm:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-all shadow-2xs"
                    >
                        <FileText size={15} />
                        <span>Upload Rx</span>
                    </Link>

                    {/* Wishlist Button */}
                    <Link
                        to="/wishlist"
                        className="btn-tap relative flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl transition-all shadow-2xs"
                        title="Saved Medicines (Wishlist)"
                    >
                        <Heart size={16} className={totalWishlistItems > 0 ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
                        <span className="hidden sm:inline">Wishlist</span>
                        {totalWishlistItems > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in shadow-xs">
                                {totalWishlistItems}
                            </span>
                        )}
                    </Link>

                    {/* Cart Button */}
                    <Link
                        to="/cart"
                        className="btn-tap relative flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
                    >
                        <ShoppingCart size={16} />
                        <span className="hidden sm:inline">Cart</span>
                        {totalItems > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-subtle-pulse shadow-xs">
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
                                className="btn-tap flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
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
                                className="btn-tap flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
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
                                            to="/profile"
                                            onClick={() => setLoginDropdownOpen(false)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <User size={14} className="text-emerald-600" />
                                                My Profile &amp; Addresses
                                            </span>
                                            <ArrowRight size={12} />
                                        </Link>

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
                    {/* Mobile Location Selector */}
                    <div className="px-4 pt-3 pb-1">
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false)
                                setLocationPopoverOpen(true)
                            }}
                            className="w-full flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <MapPin size={14} className="text-blue-600 shrink-0" />
                                <span>Deliver to: <strong>{selectedLocation.name} ({selectedLocation.pincode})</strong></span>
                            </div>
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                                3–4 Days
                            </span>
                        </button>
                    </div>

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
                        <li>
                            <Link
                                to="/wishlist"
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                                    isActive('/wishlist') ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Heart size={16} className={totalWishlistItems > 0 ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
                                    <span>My Wishlist</span>
                                </span>
                                {totalWishlistItems > 0 && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {totalWishlistItems}
                                    </span>
                                )}
                            </Link>
                        </li>
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
