import { Link } from 'react-router-dom'
import MedicineImage from '../components/MedicineImage'
import {
    Upload,
    ShoppingBag,
    Truck,
    Shield,
    Clock,
    Star,
    ChevronRight,
    Pill,
    Heart,
    Activity,
    Zap,
    Eye,
    Baby,
    Leaf,
    Thermometer,
    CheckCircle2,
    Sparkles,
    PhoneCall,
    MapPin,
    ArrowUpRight,
} from 'lucide-react'

/* ── Category Data ── */
const CATEGORIES = [
    { icon: Activity,    label: 'Diabetes Care',          color: 'bg-blue-50 text-blue-600',   border: 'border-blue-100' },
    { icon: Heart,       label: 'Heart & BP',             color: 'bg-red-50 text-red-600',     border: 'border-red-100' },
    { icon: Zap,         label: 'Vitamins & Minerals',    color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    { icon: Thermometer, label: 'Pain Relief & Fever',    color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
    { icon: Leaf,        label: 'Skin & Antifungals',     color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { icon: Eye,         label: 'Eye & Ear Drops',        color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
    { icon: Baby,        label: 'Baby & Mother Care',     color: 'bg-pink-50 text-pink-600',   border: 'border-pink-100' },
    { icon: Pill,        label: 'General Healthcare',     color: 'bg-teal-50 text-teal-600',   border: 'border-teal-100' },
]

/* ── Curated Best-Sellers (Mapped to Authentic Pack Shots) ── */
const FEATURED_MEDICINES = [
    { id: 1, name: 'Augmentin 625 Duo Tablet', brand: 'GlaxoSmithKline', price: 196,  mrp: 223.5, category: 'Antibiotics', rating: 4.8, reviews: 120, requires_rx: true, imageUrl: '/images/medicines/augmentin-625.svg' },
    { id: 2, name: 'Telma 40 Tablet',          brand: 'Glenmark',        price: 125,  mrp: 142,   category: 'Heart & BP',  rating: 4.7, reviews: 98,  requires_rx: true, imageUrl: '/images/medicines/telma-40.svg' },
    { id: 3, name: 'Shelcal 500 Tablet',       brand: 'Torrent Pharma',  price: 115,  mrp: 131,   category: 'Vitamins',    rating: 4.9, reviews: 210, requires_rx: false, imageUrl: '/images/medicines/shelcal-500.svg' },
    { id: 4, name: 'Dolo 650 Tablet',          brand: 'Micro Labs Ltd',  price: 29,   mrp: 34,    category: 'Pain Relief', rating: 4.9, reviews: 450, requires_rx: false, imageUrl: '/images/medicines/dolo-650.svg' },
    { id: 5, name: 'Pan-40 Tablet',            brand: 'Alkem Labs',      price: 175,  mrp: 199,   category: 'Digestion',   rating: 4.6, reviews: 75,  requires_rx: true, imageUrl: '/images/medicines/pan-40.svg' },
    { id: 6, name: 'Limcee 500mg Chewable',    brand: 'Abbott Healthcare',price: 22,  mrp: 27.5,  category: 'Immunity',    rating: 4.8, reviews: 310, requires_rx: false, imageUrl: '/images/medicines/limcee-500.svg' },
]

/* ── Verified Patient Testimonials ── */
const TESTIMONIALS = [
    {
        name: 'Rajesh Patil',
        location: 'Shahada Hub (425409)',
        text: 'Dhruv Pharma delivers our monthly BP and diabetes medicines reliably within 3 days. Clean packing and genuine bills every single time.',
        rating: 5,
        badge: 'Regular Customer',
    },
    {
        name: 'Dr. Sunita Deshmukh',
        location: 'Nandurbar Hub (425412)',
        text: 'Uploaded my patient prescription via phone; the pharmacist confirmed the salt and dosage in 15 minutes. Very competent staff.',
        rating: 5,
        badge: 'Verified Healthcare Provider',
    },
    {
        name: 'Anil Kulkarni',
        location: 'Shirpur Hub (424405)',
        text: 'Best pharmacy service in our district. Genuine manufacturer pack shots on website and Cash on Delivery is super convenient.',
        rating: 5,
        badge: 'Verified Buyer',
    },
]

/* ── Sub-component: Medicine Card with Interactive Elevation ── */
function FeaturedMedicineCard({ medicine }) {
    const discount = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100)

    return (
        <div className="card-modern group overflow-hidden flex flex-col justify-between">
            {/* Real Pack Shot Image with Tier-1 Fallback */}
            <div className="relative overflow-hidden bg-slate-50 border-b border-gray-100">
                <MedicineImage medicine={medicine} aspectRatio="card" />

                {discount > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full z-10 shadow-xs tracking-wider">
                        {discount}% OFF
                    </span>
                )}
                {medicine.requires_rx && (
                    <span className="absolute top-2.5 right-2.5 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 z-10">
                        Rx Required
                    </span>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                        {medicine.category}
                    </p>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {medicine.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{medicine.brand}</p>

                    {/* Ratings */}
                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={11}
                                    className={i < Math.floor(medicine.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                />
                            ))}
                        </div>
                        <span className="text-[11px] text-gray-400 ml-1">({medicine.reviews})</span>
                    </div>
                </div>

                <div>
                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-black text-gray-900">₹{medicine.price}</span>
                        <span className="text-xs text-gray-400 line-through">₹{medicine.mrp}</span>
                    </div>

                    <Link
                        to={`/medicines/${medicine.id}`}
                        className="w-full inline-flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                    >
                        <span>View Details</span>
                        <ArrowUpRight size={13} />
                    </Link>
                </div>
            </div>
        </div>
    )
}

/* ── Main Home Page ── */
export default function HomePage() {
    return (
        <div className="space-y-12 sm:space-y-16 pb-12">

            {/* ══════════════════════════════════════════════
                HERO SECTION — High Trust Clinical Blue
            ══════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
                {/* Ambient Soft Glow Orbs */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 py-12 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                        {/* Left Column: Heading & Value Proposition (7 cols) */}
                        <div className="lg:col-span-7 text-center lg:text-left space-y-5">
                            {/* Live Service Pill */}
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-inner animate-in fade-in">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>3–4 Days Delivery Across 7 Service Hubs</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                                Genuine Medicines,<br />
                                Delivered to Your <span className="text-yellow-300 underline decoration-yellow-400/60 decoration-wavy decoration-2">Doorstep</span>.
                            </h1>

                            <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Maharashtra’s trusted licensed pharmacy partner. Serving <strong>Nandurbar, Shahada, Taloda, Nijampur, Akkalkuwa, Shirpur &amp; Sakri</strong> with 100% authentic medicines, temperature-controlled transit, and direct pharmacist helpline.
                            </p>

                            {/* Dual CTAs */}
                            <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start pt-2">
                                <Link
                                    to="/prescription"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                                >
                                    <Upload size={18} />
                                    <span>Upload Doctor's Prescription</span>
                                </Link>

                                <Link
                                    to="/medicines"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/30 text-white font-bold text-sm px-6 py-3.5 rounded-2xl backdrop-blur-sm transition-all"
                                >
                                    <ShoppingBag size={18} />
                                    <span>Browse Medicines</span>
                                </Link>
                            </div>

                            {/* Quick Trust Highlights */}
                            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
                                <div>
                                    <p className="text-xl sm:text-2xl font-black text-yellow-300">100%</p>
                                    <p className="text-[11px] text-blue-200">Genuine Pack Shots</p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-black text-yellow-300">3–4 Days</p>
                                    <p className="text-[11px] text-blue-200">Hub Delivery Time</p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-black text-yellow-300">₹0 Fee</p>
                                    <p className="text-[11px] text-blue-200">On Orders &gt; ₹300</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Interactive Rx Quick Order Card (5 cols) */}
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/30 shadow-2xl text-gray-900 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                            <Pill size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm text-gray-900">Quick Rx Order</h2>
                                            <p className="text-[11px] text-gray-500">Verified by Licensed Pharmacist</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Free Service
                                    </span>
                                </div>

                                {/* Step Sequence */}
                                <div className="space-y-3 text-xs">
                                    {[
                                        { step: '1', title: 'Upload Prescription', desc: 'Snap photo or upload PDF of your doctor slip' },
                                        { step: '2', title: 'Pharmacist Reviews', desc: 'We verify dosages, salts and check genuine stock' },
                                        { step: '3', title: 'Doorstep Delivery', desc: 'Dispatched to your hub in 3–4 days with GST bill' },
                                    ].map((item) => (
                                        <div key={item.step} className="flex items-start gap-3 p-2.5 rounded-2xl bg-gray-50/80 hover:bg-blue-50/50 transition-colors">
                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                                                {item.step}
                                            </span>
                                            <div>
                                                <p className="font-bold text-gray-900">{item.title}</p>
                                                <p className="text-[11px] text-gray-500 leading-tight">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    to="/prescription"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs py-3.5 rounded-2xl transition-all shadow-md cursor-pointer"
                                >
                                    <Upload size={15} />
                                    <span>Upload Doctor's Slip Now</span>
                                </Link>

                                <p className="text-center text-[10px] text-gray-400">
                                    Govt. Drug License Reg: 20B/21B · Dhruv Pharma Nandurbar
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SERVICE HUBS BANNER TICKER
            ══════════════════════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-20">
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-md p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-xs sm:text-sm text-gray-900">
                                Authorized Maharashtra Delivery Hubs (3–4 Days Expected)
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Nandurbar (425412) · Shahada (425409) · Taloda (425413) · Nijampur (424305) · Akkalkuwa (425415) · Shirpur (424405) · Sakri (424304)
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/medicines"
                        className="shrink-0 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                    >
                        <span>Check Service</span>
                        <ChevronRight size={14} />
                    </Link>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                FOUR TRUST PILLARS
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                    {[
                        { icon: Shield,  title: '100% Genuine Medicines', desc: 'Directly sourced with batch numbers and authentic pack shots', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Clock,   title: '3–4 Days Delivery',      desc: 'Prompt doorstep delivery across our 7 regional hubs', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { icon: Truck,   title: 'Cash on Delivery & UPI', desc: 'Pay via cash, UPI QR, or test mode payment at checkout', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { icon: Heart,   title: 'Pharmacist Support',     desc: 'Direct call helpline 9503500725 for telephone orders', color: 'text-red-500', bg: 'bg-red-50' },
                    ].map((item) => (
                        <div key={item.title} className="card-modern p-4 sm:p-5 flex flex-col items-start gap-2.5">
                            <div className={`${item.bg} p-2.5 rounded-2xl`}>
                                <item.icon size={22} className={item.color} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-xs sm:text-sm">{item.title}</h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SHOP BY HEALTH CATEGORY
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            Shop by Health Category
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Curated medicinal formulations for everyday and chronic conditions
                        </p>
                    </div>
                    <Link
                        to="/medicines"
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                        <span>View All Categories</span>
                        <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.label}
                            to={`/medicines?category=${encodeURIComponent(cat.label)}`}
                            className={`card-modern flex flex-col items-center justify-center p-4 text-center group cursor-pointer ${cat.border}`}
                        >
                            <div className={`${cat.color.replace('text-', 'bg-').replace('600', '100')} p-3 rounded-2xl mb-2.5 group-hover:scale-110 transition-transform`}>
                                <cat.icon size={22} className={cat.color.split(' ')[1]} />
                            </div>
                            <p className="text-xs font-bold text-gray-800 leading-snug group-hover:text-blue-600 transition-colors">
                                {cat.label}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                FEATURED & POPULAR MEDICINES
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                            <Sparkles size={13} />
                            <span>Authentic Indian Brands</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            Top Ordered Medicines
                        </h2>
                    </div>
                    <Link
                        to="/medicines"
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                        <span>Explore Full Catalog</span>
                        <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
                    {FEATURED_MEDICINES.map((med) => (
                        <FeaturedMedicineCard key={med.id} medicine={med} />
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                EXPRESS ORDER VIA CALL HERO BANNER
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <span className="text-[11px] font-bold bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-wider">
                            Phone Ordering Available
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black">
                            Prefer to Order via Call or WhatsApp?
                        </h3>
                        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                            Our licensed pharmacist is available Mon–Sat from 9:00 AM to 8:00 PM. Tell us your medicines or read your prescription directly over the phone!
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                        <a
                            href="tel:+919503500725"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-emerald-800 font-extrabold text-sm px-6 py-3.5 rounded-2xl hover:bg-emerald-50 active:scale-95 transition-all shadow-md"
                        >
                            <PhoneCall size={18} />
                            <span>Dial: 95035 00725</span>
                        </a>

                        <a
                            href="https://wa.me/919503500725?text=Hello%20Dhruv%20Pharma,%20I%20want%20to%20order%20medicines"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-800/80 hover:bg-emerald-900 active:scale-95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl border border-white/20 transition-all"
                        >
                            <span>WhatsApp Us</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                PATIENT TESTIMONIALS & REVIEWS
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="text-center max-w-xl mx-auto mb-8">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        What Our Patients Say
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Serving thousands of families across Maharashtra with dedicated care and genuine medicines
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {TESTIMONIALS.map((t) => (
                        <div key={t.name} className="card-modern p-5 sm:p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        {t.badge}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4 italic">
                                    "{t.text}"
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">{t.name}</p>
                                    <p className="text-[11px] text-gray-400">{t.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    )
}
