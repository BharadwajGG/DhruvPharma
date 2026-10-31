import { useState, useMemo, useEffect, memo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import MedicineImage from '../components/MedicineImage'
import {
    Search,
    Filter,
    Star,
    Pill,
    ShoppingCart,
    Heart,
    SlidersHorizontal,
    X,
    ChevronDown,
    Loader2,
    Sparkles,
    Check,
    RotateCcw,
    ShieldCheck,
    Info,
} from 'lucide-react'

/* ── Fallback mock data if server is unreachable ── */
const FALLBACK_MEDICINES = [
    { id: 1,  name: 'Augmentin 625 Duo Tablet',  salt: 'Amoxycillin + Clavulanic Acid', brand: 'GlaxoSmithKline', price: 196, mrp: 223.5, category: 'Antibiotics & Infections', rating: 4.8, reviews: 140, requires_rx: true,  inStock: true },
    { id: 2,  name: 'Dolo 650 Tablet',           salt: 'Paracetamol 650mg',             brand: 'Micro Labs Ltd',   price: 29,  mrp: 34,   category: 'Pain Relief & Fever',      rating: 4.9, reviews: 450, requires_rx: false, inStock: true },
    { id: 3,  name: 'Glycomet 500mg Tablet',     salt: 'Metformin 500mg',               brand: 'USV Ltd',          price: 42,  mrp: 48,   category: 'Diabetes Care',            rating: 4.7, reviews: 95,  requires_rx: true,  inStock: true },
    { id: 4,  name: 'Telma 40 Tablet',           salt: 'Telmisartan 40mg',              brand: 'Glenmark Pharma',  price: 125, mrp: 142,  category: 'Heart & Blood Pressure',   rating: 4.6, reviews: 88,  requires_rx: true,  inStock: true },
    { id: 5,  name: 'Pan-40 Tablet',             salt: 'Pantoprazole 40mg',             brand: 'Alkem Labs',       price: 175, mrp: 199,  category: 'Acidity & Digestion',      rating: 4.7, reviews: 110, requires_rx: true,  inStock: true },
    { id: 6,  name: 'Shelcal 500 Tablet',        salt: 'Calcium + Vitamin D3',          brand: 'Torrent Pharma',   price: 115, mrp: 131,  category: 'Vitamins & Supplements',   rating: 4.8, reviews: 210, requires_rx: false, inStock: true },
]

const STORE_CATEGORIES = [
    'All',
    'Pain Relief & Fever',
    'Antibiotics & Infections',
    'Acidity & Digestion',
    'Cold, Cough & Allergy',
    'Diabetes Care',
    'Heart & Blood Pressure',
    'Vitamins & Supplements',
    'Skin Care & Antifungals',
    'Eye & Ear Drops',
    'Ayurvedic & Herbal',
    'Surgical & Medical Supplies',
    'General Healthcare',
]

const SORT_OPTIONS = [
    { value: 'popular',    label: 'Most Popular' },
    { value: 'price_asc',  label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating',     label: 'Highest Rated' },
    { value: 'discount',   label: 'Biggest Discount' },
]

/* ── Shimmer Skeleton Placeholder Component ── */
function MedicineCardSkeleton() {
    return (
        <div className="card-modern overflow-hidden flex flex-col justify-between">
            <div className="skeleton-shimmer h-44 w-full" />
            <div className="p-4 space-y-3">
                <div className="skeleton-shimmer h-3 w-20 rounded" />
                <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                <div className="flex justify-between items-center pt-2">
                    <div className="skeleton-shimmer h-5 w-16 rounded" />
                    <div className="skeleton-shimmer h-8 w-24 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

/* ── Medicine Card Component (Memoized for high FPS) ── */
const MedicineCard = memo(function MedicineCard({ medicine }) {
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const { isInWishlist, toggleWishlist } = useWishlist()
    const [justAdded, setJustAdded] = useState(false)

    const mrp = medicine.mrp || 0
    const price = medicine.price || medicine.sellingPrice || 0
    const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0
    const requiresRx = medicine.requires_rx || medicine.requiresPrescription
    const isSaved = isInWishlist(medicine.id)

    const handleAdd = (e) => {
        e.stopPropagation()
        e.preventDefault()
        addToCart(medicine, 1)
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1400)
    }

    return (
        <div
            onClick={() => navigate(`/medicines/${medicine.id}`)}
            className={`card-modern group overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-1 ${
                !medicine.inStock ? 'opacity-75' : ''
            }`}
        >
            {/* Image area with Tier 2 Pack Shot & Tier 1 Vector Fallback */}
            <div className="relative overflow-hidden bg-slate-50 border-b border-gray-100">
                <MedicineImage medicine={medicine} aspectRatio="card" />

                {/* Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    {discount > 0 && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                            {discount}% OFF
                        </span>
                    )}
                </div>

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                    {requiresRx && (
                        <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                            Rx
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleWishlist(medicine)
                        }}
                        className={`p-1.5 rounded-full shadow-xs backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                            isSaved
                                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
                        }`}
                        title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
                    >
                        <Heart size={14} className={isSaved ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                </div>

                {!medicine.inStock && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Content Details */}
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider truncate">
                            {medicine.category}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono">
                            HSN 3004
                        </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors" title={medicine.name}>
                        {medicine.name}
                    </h3>

                    {medicine.salt && (
                        <p className="text-[11px] text-gray-500 line-clamp-1 mb-1 font-mono italic" title={medicine.salt}>
                            {medicine.salt}
                        </p>
                    )}

                    <p className="text-xs text-gray-400 mb-2">{medicine.brand || medicine.manufacturer || 'Dhruv Certified'}</p>

                    {/* Ratings */}
                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={10}
                                    className={i < Math.floor(medicine.rating || 4.7) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400 ml-0.5">({medicine.reviews || 80})</span>
                    </div>
                </div>

                {/* Pricing & Add To Cart Button */}
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-gray-900">₹{price}</span>
                            {mrp > price && (
                                <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
                            )}
                        </div>
                        <span className="text-[10px] text-gray-400 block leading-none">GST included</span>
                    </div>

                    {medicine.inStock ? (
                        <button
                            onClick={handleAdd}
                            className={`btn-tap inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                                justAdded
                                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {justAdded ? (
                                <>
                                    <Check size={13} />
                                    <span>Added!</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={13} />
                                    <span>+ Add</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded-lg">
                            Unavailable
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
})

/* ── Main Store Page ── */
export default function MedicineStorePage() {
    const [searchParams] = useSearchParams()
    const [medicines, setMedicines] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '')
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All')
    const [sortBy, setSortBy] = useState('popular')
    const [showFilters, setShowFilters] = useState(false)
    const [rxFilter, setRxFilter] = useState('all') // 'all' | 'rx' | 'otc'
    const [inStockOnly, setInStockOnly] = useState(false)
    const [maxPrice, setMaxPrice] = useState(1000)
    const [visibleCount, setVisibleCount] = useState(24)

    // Debounce search keystrokes to ensure 60 FPS input smoothness
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 150)
        return () => clearTimeout(handler)
    }, [searchQuery])

    // Reset pagination batch to initial 24 whenever search or filters change
    useEffect(() => {
        setVisibleCount(24)
    }, [debouncedSearch, activeCategory, sortBy, rxFilter, inStockOnly, maxPrice])

    // Fetch live published medicines from backend
    useEffect(() => {
        const fetchMedicines = async () => {
            setIsLoading(true)
            try {
                const res = await fetch('http://localhost:8000/api/medicines')
                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data) && data.length > 0) {
                        setMedicines(data)
                        return
                    }
                }
                setMedicines(FALLBACK_MEDICINES)
            } catch (err) {
                console.warn('Backend unavailable, using fallback medicines:', err)
                setMedicines(FALLBACK_MEDICINES)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMedicines()
    }, [])

    /* Filtered + sorted list */
    const filteredMedicines = useMemo(() => {
        let result = [...medicines]

        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase().trim()
            result = result.filter(
                (m) =>
                    (m.name && m.name.toLowerCase().includes(q)) ||
                    (m.salt && m.salt.toLowerCase().includes(q)) ||
                    (m.brand && m.brand.toLowerCase().includes(q)) ||
                    (m.manufacturer && m.manufacturer.toLowerCase().includes(q)) ||
                    (m.category && m.category.toLowerCase().includes(q))
            )
        }

        if (activeCategory !== 'All') {
            result = result.filter((m) => m.category === activeCategory)
        }

        if (rxFilter === 'rx') {
            result = result.filter((m) => m.requires_rx || m.requiresPrescription)
        }
        if (rxFilter === 'otc') {
            result = result.filter((m) => !(m.requires_rx || m.requiresPrescription))
        }
        if (inStockOnly) {
            result = result.filter((m) => m.inStock)
        }
        if (maxPrice < 1000) {
            result = result.filter((m) => (m.price || m.sellingPrice || 0) <= maxPrice)
        }

        switch (sortBy) {
            case 'price_asc':
                result.sort((a, b) => (a.price || a.sellingPrice || 0) - (b.price || b.sellingPrice || 0))
                break
            case 'price_desc':
                result.sort((a, b) => (b.price || b.sellingPrice || 0) - (a.price || a.sellingPrice || 0))
                break
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
                break
            case 'discount':
                result.sort(
                    (a, b) =>
                        ((b.mrp || 0) - (b.price || b.sellingPrice || 0)) -
                        ((a.mrp || 0) - (a.price || a.sellingPrice || 0))
                )
                break
            default:
                result.sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
                break
        }

        return result
    }, [medicines, debouncedSearch, activeCategory, sortBy, rxFilter, inStockOnly, maxPrice])

    // Sliced medicines for virtual/windowed rendering
    const visibleMedicines = useMemo(() => {
        return filteredMedicines.slice(0, visibleCount)
    }, [filteredMedicines, visibleCount])

    const handleResetFilters = () => {
        setActiveCategory('All')
        setRxFilter('all')
        setInStockOnly(false)
        setMaxPrice(1000)
        setSearchQuery('')
        setDebouncedSearch('')
        setVisibleCount(24)
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">

            {/* ── Page Header ── */}
            <div className="bg-white border-b border-gray-100 py-6">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dhruv Pharma Store</h1>
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <Sparkles size={11} /> Genuine Catalog
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                            {filteredMedicines.length} verified medicines · Delivery in 3–4 Days across Maharashtra
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60 self-start sm:self-auto">
                        <ShieldCheck size={14} className="text-blue-600" />
                        <span>All batches inspected under FDA License 20B/21B</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* ── Search + Filter + Sort Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-xs">
                        <Search size={16} className="ml-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by brand name (e.g. Dolo, Augmentin, Pan-40) or active salt (e.g. Paracetamol, Metformin)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-3 py-3 text-xs sm:text-sm outline-none bg-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mr-3 text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Sort Selector */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-2xl px-4 py-3 pr-8 text-xs sm:text-sm text-gray-700 font-medium outline-none cursor-pointer hover:border-blue-400 transition-colors shadow-xs"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 border rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition-all sm:hidden shadow-xs cursor-pointer
                                ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                        >
                            <SlidersHorizontal size={14} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">

                    {/* ── Left Sidebar Filters ── */}
                    <aside className={`shrink-0 w-full sm:w-64 ${showFilters ? 'block' : 'hidden'} sm:block`}>
                        <div className="card-modern p-5 sticky top-24 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                                    <Filter size={15} className="text-blue-600" /> Filter Catalog
                                </h2>
                                <button
                                    onClick={handleResetFilters}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw size={11} /> Reset
                                </button>
                            </div>

                            {/* Category List */}
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Health Categories
                                </p>
                                <ul className="space-y-1 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                                    {STORE_CATEGORIES.map((cat) => (
                                        <li key={cat}>
                                            <button
                                                onClick={() => setActiveCategory(cat)}
                                                className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer
                                                    ${activeCategory === cat
                                                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span>{cat}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Prescription Type */}
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Prescription Requirement
                                </p>
                                {[
                                    { value: 'all', label: 'All Formulations' },
                                    { value: 'otc', label: 'OTC (Over-The-Counter)' },
                                    { value: 'rx',  label: 'Prescription Required (Rx)' },
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 text-xs text-gray-600 py-1.5 cursor-pointer hover:text-gray-900">
                                        <input
                                            type="radio"
                                            name="rx"
                                            value={opt.value}
                                            checked={rxFilter === opt.value}
                                            onChange={() => setRxFilter(opt.value)}
                                            className="accent-blue-600"
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* In-Stock Only */}
                            <div className="pt-3 border-t border-gray-100">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        className="accent-blue-600 w-4 h-4 rounded cursor-pointer"
                                    />
                                    <span>In-Stock Only</span>
                                </label>
                            </div>

                            {/* Price Slider */}
                            <div className="pt-3 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-1.5">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Max Price Limit
                                    </p>
                                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                        {maxPrice >= 1000 ? 'Any Price' : `≤ ₹${maxPrice}`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="30"
                                    max="1000"
                                    step="20"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-full accent-blue-600 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                                    <span>₹30</span>
                                    <span>₹500</span>
                                    <span>₹1,000+</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ── Main Medicine Product Grid ── */}
                    <main className="flex-1">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <MedicineCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="card-modern p-12 text-center space-y-3">
                                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                                    <Pill size={32} />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">No matching medicines found</h3>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                    We couldn't find any medicines matching your search or filters. You can also dial our pharmacy helpline to order by phone.
                                </p>
                                <div className="pt-2 flex justify-center gap-3">
                                    <button
                                        onClick={handleResetFilters}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {visibleMedicines.map((med) => (
                                        <MedicineCard key={med.id} medicine={med} />
                                    ))}
                                </div>

                                {/* Load More Pagination Controls */}
                                {filteredMedicines.length > visibleCount && (
                                    <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col items-center justify-center gap-3">
                                        <p className="text-xs text-gray-500 font-medium">
                                            Showing <span className="font-bold text-gray-800">{visibleMedicines.length}</span> of{' '}
                                            <span className="font-bold text-gray-800">{filteredMedicines.length}</span> medicines
                                        </p>
                                        <div className="w-full max-w-xs bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                                style={{ width: `${(visibleMedicines.length / filteredMedicines.length) * 100}%` }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVisibleCount((prev) => Math.min(prev + 24, filteredMedicines.length))}
                                            className="mt-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-400 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                                        >
                                            <Sparkles size={14} className="text-blue-500" />
                                            <span>Load Next 24 Medicines ({filteredMedicines.length - visibleMedicines.length} remaining)</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>

                </div>
            </div>
        </div>
    )
}
