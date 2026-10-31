import { Link } from 'react-router-dom'
import {
    Pill,
    Phone,
    Mail,
    MapPin,
    Clock,
    Share2,
    Camera,
    MessageCircle,
    Shield,
    Truck,
    HeartHandshake,
} from 'lucide-react'

const MEDICINE_CATEGORIES = [
    'Diabetes Care',
    'Heart & BP',
    'Vitamins & Supplements',
    'Pain Relief',
    'Antibiotics',
    'Skin Care',
    'Eye & Ear Drops',
    'Digestive Health',
]

const QUICK_LINKS = [
    { label: 'Home',               path: '/' },
    { label: 'Medicine Store',     path: '/medicines' },
    { label: 'Upload Prescription',path: '/prescription' },
    { label: 'Track Your Order',   path: '/track-order' },
    { label: 'Contact Us',         path: '/contact' },
]

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">

            {/* ── Trust Badges Strip ── */}
            <div className="bg-blue-700 py-6">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-white text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Shield size={28} />
                        <p className="font-semibold text-sm">Licensed Pharmacy</p>
                        <p className="text-blue-200 text-xs">Govt. approved drug license</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Truck size={28} />
                        <p className="font-semibold text-sm">Local Delivery</p>
                        <p className="text-blue-200 text-xs">Fast delivery in 3-4 districts</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <HeartHandshake size={28} />
                        <p className="font-semibold text-sm">Prescription Verified</p>
                        <p className="text-blue-200 text-xs">Owner personally reviews all Rx</p>
                    </div>
                </div>
            </div>

            {/* ── Main Footer ── */}
            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

                {/* Brand Column */}
                <div>
                    <Link to="/" className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <Pill size={20} />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-white">Dhruv</span>
                            <span className="text-lg font-bold text-blue-400">Pharma</span>
                        </div>
                    </Link>
                    <p className="text-sm text-gray-400 leading-relaxed mb-5">
                        Your trusted regional medicine partner serving Nandurbar &amp; Dhule
                        districts across 7 authorized hubs with 100% genuine medicines.
                    </p>
                    <div className="flex items-center gap-3">
                        <a
                            href="https://wa.me/919503500725"
                            aria-label="WhatsApp"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-gray-800 hover:bg-green-600 text-gray-400 hover:text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        >
                            <MessageCircle size={16} />
                        </a>
                        <a
                            href="tel:+919503500725"
                            aria-label="Call Us"
                            className="bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        >
                            <Phone size={16} />
                        </a>
                        <a
                            href="mailto:dhruvpharma25@gmail.com"
                            aria-label="Email"
                            className="bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        >
                            <Mail size={16} />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Quick Links
                    </h3>
                    <ul className="space-y-2.5">
                        {QUICK_LINKS.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="w-1 h-1 bg-blue-500 rounded-full" />
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Categories */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Medicine Categories
                    </h3>
                    <ul className="space-y-2.5">
                        {MEDICINE_CATEGORIES.map((cat) => (
                            <li key={cat}>
                                <Link
                                    to={`/medicines?category=${cat}`}
                                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="w-1 h-1 bg-blue-500 rounded-full" />
                                    {cat}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                        Contact Us
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                First Floor, Plot No. 122-133,<br />
                                Shop No. C/135, Gokuldham Complex,<br />
                                Shahada Road, Nandurbar – 425412
                            </p>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={16} className="text-blue-400 shrink-0" />
                            <a
                                href="tel:+919503500725"
                                className="text-sm text-gray-400 hover:text-blue-400 transition-colors font-medium"
                            >
                                +91 95035 00725
                            </a>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail size={16} className="text-blue-400 shrink-0" />
                            <a
                                href="mailto:dhruvpharma25@gmail.com"
                                className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                            >
                                dhruvpharma25@gmail.com
                            </a>
                        </li>
                        <li className="flex items-center gap-3">
                            <Clock size={16} className="text-emerald-400 shrink-0" />
                            <p className="text-xs font-semibold text-emerald-400">
                                24/7 Service Available · Always Open
                            </p>
                        </li>
                    </ul>
                </div>
            </div>

            {/* ── Bottom Bar ── */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
                    <p>© 2024 Dhruv Pharma. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-gray-300 transition-colors">Drug License: MH-XXXX</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
