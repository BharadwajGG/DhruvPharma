import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import MedicineImage from '../components/MedicineImage'
import MarketingBannerCarousel from '../components/MarketingBannerCarousel'
import {
    Upload,
    ShoppingBag,
    Truck,
    Shield,
    Clock,
    Star,
    ChevronRight,
    ChevronLeft,
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
    Flame,
    PackagePlus,
    ShoppingCart,
    Check,
} from 'lucide-react'

/* ── Category Data (Exact 8 Categories from Reference Screenshot) ── */
const CATEGORIES = [
    { icon: Activity,    label: 'Diabetes Care',          color: 'bg-blue-50 text-blue-600',   border: 'border-blue-100 hover:border-blue-300' },
    { icon: Heart,       label: 'Heart & BP',             color: 'bg-red-50 text-red-600',     border: 'border-red-100 hover:border-red-300' },
    { icon: Zap,         label: 'Vitamins & Minerals',    color: 'bg-amber-50 text-amber-600', border: 'border-amber-100 hover:border-amber-300' },
    { icon: Thermometer, label: 'Pain Relief & Fever',    color: 'bg-orange-50 text-orange-600', border: 'border-orange-100 hover:border-orange-300' },
    { icon: Leaf,        label: 'Skin & Antifungals',     color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300' },
    { icon: Eye,         label: 'Eye & Ear Drops',        color: 'bg-purple-50 text-purple-600', border: 'border-purple-100 hover:border-purple-300' },
    { icon: Baby,        label: 'Baby & Mother Care',     color: 'bg-pink-50 text-pink-600',   border: 'border-pink-100 hover:border-pink-300' },
    { icon: Pill,        label: 'General Healthcare',     color: 'bg-teal-50 text-teal-600',   border: 'border-teal-100 hover:border-teal-300' },
]

/* ── Fallback Best-Sellers (Mapped to Authentic Pack Shots) ── */
const FALLBACK_POPULAR = [
    { id: 1, name: 'Augmentin 625 Duo Tablet', brand: 'GlaxoSmithKline', price: 196,  mrp: 223.5, category: 'Antibiotics', rating: 4.8, reviews: 120, requires_rx: true, imageUrl: '/images/medicines/augmentin-625.svg' },
    { id: 2, name: 'Telma 40 Tablet',          brand: 'Glenmark',        price: 125,  mrp: 142,   category: 'Heart & BP',  rating: 4.7, reviews: 98,  requires_rx: true, imageUrl: '/images/medicines/telma-40.svg' },
    { id: 3, name: 'Shelcal 500 Tablet',       brand: 'Torrent Pharma',  price: 115,  mrp: 131,   category: 'Vitamins',    rating: 4.9, reviews: 210, requires_rx: false, imageUrl: '/images/medicines/shelcal-500.svg' },
    { id: 4, name: 'Dolo 650 Tablet',          brand: 'Micro Labs Ltd',  price: 29,   mrp: 34,    category: 'Pain Relief', rating: 4.9, reviews: 450, requires_rx: false, imageUrl: '/images/medicines/dolo-650.svg' },
    { id: 5, name: 'Pan-40 Tablet',            brand: 'Alkem Labs',      price: 175,  mrp: 199,   category: 'Digestion',   rating: 4.6, reviews: 75,  requires_rx: true, imageUrl: '/images/medicines/pan-40.svg' },
    { id: 6, name: 'Limcee 500mg Chewable',    brand: 'Abbott Healthcare',price: 22,  mrp: 27.5,  category: 'Immunity',    rating: 4.8, reviews: 310, requires_rx: false, imageUrl: '/images/medicines/limcee-500.svg' },
]

/* ── Verified Customer Testimonials ── */
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
    {
        name: 'Mahesh Chaudhari',
        location: 'Taloda Hub (425413)',
        text: 'Finding chronic heart tablets in Taloda used to be difficult. Dhruv Pharma delivered right to my doorstep with manufacturer batch verification.',
        rating: 5,
        badge: 'Verified Buyer',
    },
    {
        name: 'Pooja Marathe',
        location: 'Sakri Hub (424304)',
        text: 'The order via call feature is a blessing for my elderly parents. One quick phone call and the medicines arrive in 3 days with a proper GST invoice.',
        rating: 5,
        badge: 'Regular Customer',
    },
    {
        name: 'Ganesh Shinde',
        location: 'Akkalkuwa Hub (425415)',
        text: 'Authentic medicines at discounted prices. Coupon DHRUV10 saved me 10% extra on our family’s seasonal allergy & fever medicines.',
        rating: 5,
        badge: 'Verified Buyer',
    },
]

/* ── Interactive Medicine Product Card ── */
function ShowcaseMedicineCard({ medicine, badgeLabel, badgeType }) {
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const [justAdded, setJustAdded] = useState(false)

    const mrp = medicine.mrp || 0
    const price = medicine.sellingPrice || medicine.price || 0
    const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0
    const requiresRx = Boolean(medicine.requires_rx || medicine.requiresPrescription)

    const handleAdd = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(medicine, 1)
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1400)
    }

    return (
        <div
            onClick={() => navigate(`/medicines/${medicine.id}`)}
            className="card-modern group overflow-hidden flex flex-col justify-between w-56 sm:w-64 min-w-[220px] sm:min-w-[250px] shrink-0 cursor-pointer snap-start"
        >
            {/* Real Pack Shot Image with Tier-1 Fallback */}
            <div className="relative overflow-hidden bg-slate-50 border-b border-gray-100">
                <MedicineImage medicine={medicine} aspectRatio="card" />

                {/* Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    {badgeLabel && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider ${
                            badgeType === 'trending'
                                ? 'bg-amber-500 text-white'
                                : badgeType === 'new_arrival'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-blue-600 text-white'
                        }`}>
                            {badgeLabel}
                        </span>
                    )}
                    {discount > 0 && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wider w-fit">
                            {discount}% OFF
                        </span>
                    )}
                </div>

                {requiresRx && (
                    <span className="absolute top-2.5 right-2.5 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 z-10">
                        Rx
                    </span>
                )}
            </div>

            {/* Content Details */}
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1 truncate">
                        {medicine.category || 'General Health'}
                    </p>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {medicine.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">{medicine.brand || medicine.manufacturer}</p>

                    {/* Ratings */}
                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={11}
                                    className={i < Math.floor(medicine.rating || 4.7) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                />
                            ))}
                        </div>
                        <span className="text-[11px] text-gray-400 ml-1">({medicine.reviews || 85})</span>
                    </div>
                </div>

                <div>
                    {/* Price & Add to Cart Action */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                        <div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-black text-gray-900">₹{price}</span>
                                {mrp > price && (
                                    <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-400 block leading-none">GST incl.</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleAdd}
                            className={`btn-tap inline-flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                                justAdded
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {justAdded ? (
                                <>
                                    <Check size={13} />
                                    <span>Added</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={13} />
                                    <span>+ Add</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Main Home Page ── */
export default function HomePage() {
    const categoryScrollRef = useRef(null)
    const trendingScrollRef = useRef(null)
    const newLaunchesScrollRef = useRef(null)
    const reviewsScrollRef = useRef(null)

    // Dynamic Showcase Data (Trending & New Launches)
    const [showcaseData, setShowcaseData] = useState({ trending: [], new_launches: [] })
    const [isLoadingShowcase, setIsLoadingShowcase] = useState(true)

    useEffect(() => {
        const fetchShowcase = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/medicines/showcase')
                if (res.ok) {
                    const data = await res.json()
                    setShowcaseData(data)
                }
            } catch (err) {
                console.warn('Failed to fetch medicine showcase, using fallback:', err)
            } finally {
                setIsLoadingShowcase(false)
            }
        }
        fetchShowcase()
    }, [])

    // Smooth manual scroll handler for horizontal tracks
    const handleScroll = (ref, direction) => {
        if (!ref.current) return
        const scrollAmount = direction === 'left' ? -320 : 320
        ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }

    const trendingItems = showcaseData.trending.length > 0 ? showcaseData.trending : FALLBACK_POPULAR
    const newLaunchesItems = showcaseData.new_launches.length > 0 ? showcaseData.new_launches : FALLBACK_POPULAR.slice().reverse()

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
                DYNAMIC MARKETING ADVERTISEMENT CAROUSEL
                (Auto-Scrolling 2-Card Horizontal Carousel)
            ══════════════════════════════════════════════ */}
            <MarketingBannerCarousel />

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
                SHOP BY HEALTH CATEGORY (Manual Horizontal Scroll Only)
                Exact 8 Categories as Requested (Zero Auto-Scroll)
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            Shop by Health Category
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Curated medicinal formulations for everyday and chronic conditions
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/medicines"
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                            <span>View All Categories</span>
                            <ChevronRight size={14} />
                        </Link>

                        {/* Desktop Manual Navigation Arrows */}
                        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-gray-200">
                            <button
                                type="button"
                                onClick={() => handleScroll(categoryScrollRef, 'left')}
                                className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                                aria-label="Scroll categories left"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleScroll(categoryScrollRef, 'right')}
                                className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                                aria-label="Scroll categories right"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Horizontal Scroll Track (Manual Scroll Only) */}
                <div
                    ref={categoryScrollRef}
                    className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth scrollbar-none pb-2 pt-1 px-0.5 snap-x"
                >
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.label}
                            to={`/medicines?category=${encodeURIComponent(cat.label)}`}
                            className={`card-modern min-w-[135px] sm:min-w-[148px] shrink-0 flex flex-col items-center justify-center p-4 text-center group cursor-pointer snap-start ${cat.border}`}
                        >
                            <div className={`${cat.color.replace('text-', 'bg-').replace('600', '100')} p-3 rounded-2xl mb-2.5 group-hover:scale-110 transition-transform`}>
                                <cat.icon size={24} className={cat.color.split(' ')[1]} />
                            </div>
                            <p className="text-xs font-bold text-gray-800 leading-snug group-hover:text-blue-600 transition-colors">
                                {cat.label}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 1: TRENDING MEDICINES
                (Data-driven from Customer Orders & Sales Trends)
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                            <Flame size={14} className="fill-amber-500 text-amber-500" />
                            <span>High Demand in Our Hubs</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            Trending Products
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/medicines"
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                            <span>Explore All</span>
                            <ChevronRight size={14} />
                        </Link>

                        {/* Shelf Scroll Buttons */}
                        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-gray-200">
                            <button
                                type="button"
                                onClick={() => handleScroll(trendingScrollRef, 'left')}
                                className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                                aria-label="Scroll trending left"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleScroll(trendingScrollRef, 'right')}
                                className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                                aria-label="Scroll trending right"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Horizontal Product Rail */}
                <div
                    ref={trendingScrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-none pb-3 pt-1 px-0.5 snap-x"
                >
                    {trendingItems.map((med) => (
                        <ShowcaseMedicineCard
                            key={med.id}
                            medicine={med}
                            badgeLabel={med.badge || '🔥 Trending'}
                            badgeType={med.badge_type || 'trending'}
                        />
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 2: NEW LAUNCHES & RECENT ARRIVALS
                (Automatically populated from newly published CSVs)
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
                            <PackagePlus size={14} />
                            <span>Fresh Stock & Additions</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            New Launches &amp; Arrivals
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/medicines"
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                            <span>View All Arrivals</span>
                            <ChevronRight size={14} />
                        </Link>

                        {/* Shelf Scroll Buttons */}
                        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-gray-200">
                            <button
                                type="button"
                                onClick={() => handleScroll(newLaunchesScrollRef, 'left')}
                                className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                                aria-label="Scroll new launches left"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleScroll(newLaunchesScrollRef, 'right')}
                                className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                                aria-label="Scroll new launches right"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Horizontal Product Rail */}
                <div
                    ref={newLaunchesScrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-none pb-3 pt-1 px-0.5 snap-x"
                >
                    {newLaunchesItems.map((med) => (
                        <ShowcaseMedicineCard
                            key={med.id}
                            medicine={med}
                            badgeLabel={med.badge || '✨ New Launch'}
                            badgeType={med.badge_type || 'new_arrival'}
                        />
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
                CUSTOMER TESTIMONIALS & REVIEWS (Horizontal Scroll)
            ══════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            What Our Customers Say
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Serving thousands of families across Maharashtra with dedicated care and genuine medicines
                        </p>
                    </div>

                    {/* Shelf Scroll Buttons */}
                    <div className="hidden sm:flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => handleScroll(reviewsScrollRef, 'left')}
                            className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                            aria-label="Scroll reviews left"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleScroll(reviewsScrollRef, 'right')}
                            className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-xs flex items-center justify-center text-gray-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                            aria-label="Scroll reviews right"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Horizontal Scrollable Reviews Rail */}
                <div
                    ref={reviewsScrollRef}
                    className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth scrollbar-none pb-3 pt-1 px-0.5 snap-x"
                >
                    {TESTIMONIALS.map((t) => (
                        <div
                            key={t.name}
                            className="card-modern p-5 sm:p-6 flex flex-col justify-between w-[310px] sm:w-[360px] min-w-[290px] sm:min-w-[340px] shrink-0 snap-start"
                        >
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
