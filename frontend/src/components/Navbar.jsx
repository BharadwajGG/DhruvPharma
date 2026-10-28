import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    ShoppingCart,
    FileText,
    Search,
    Menu,
    X,
    Phone,
    MapPin,
    Pill,
} from 'lucide-react'

const NAV_LINKS = [
    { label: 'Home',          path: '/' },
    { label: 'Medicine Store', path: '/medicines' },
    { label: 'Upload Prescription', path: '/prescription' },
    { label: 'Track Order',   path: '/track-order' },
    { label: 'Contact Us',    path: '/contact' },
]

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const location = useLocation()

    const isActive = (path) =>
        path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)

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
                    <span className="hidden sm:inline font-medium">
                        🕒 Mon – Sat &nbsp;|&nbsp; 9:00 AM – 8:00 PM
                    </span>
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
                <div className="flex items-center gap-3">
                    <Link
                        to="/prescription"
                        className="hidden sm:flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                        <FileText size={15} />
                        Upload Rx
                    </Link>

                    <Link
                        to="/cart"
                        className="relative flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                        <ShoppingCart size={16} />
                        <span className="hidden sm:inline">Cart</span>
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            0
                        </span>
                    </Link>

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
                                className="flex-1 px-3 py-2.5 text-sm outline-none"
                            />
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
