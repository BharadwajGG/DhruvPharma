import { useState, useMemo, useEffect, useRef, memo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import MedicineImage from '../components/MedicineImage'
import { parsePackInfo, detectDosageForm } from '../utils/packFormat'
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
    ArrowRight,
    Eye,
    ZoomIn,
    Plus,
    Minus,
    CheckCircle2,
    Truck,
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

// Cleans manufacturer prefix e.g. "Manufactured by ZYDUS" -> "ZYDUS"
export function cleanManufacturer(mfd) {
    if (!mfd || typeof mfd !== 'string') return ''
    return mfd.replace(/^(?:manufactured\s+by|mfd\s+by|marketed\s+by|by)\s*[:\-]?\s*/i, '').trim()
}

/* ── Shimmer Skeleton Placeholder Component ── */
function MedicineCardSkeleton() {
    return (
        <div className="card-modern overflow-hidden flex flex-col justify-between bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="skeleton-shimmer h-48 w-full" />
            <div className="p-4 space-y-3">
                <div className="skeleton-shimmer h-3 w-20 rounded" />
                <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                <div className="flex justify-between items-center pt-2">
                    <div className="skeleton-shimmer h-6 w-20 rounded" />
                    <div className="skeleton-shimmer h-9 w-24 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

/* ── Medicine Card Component (Memoized for high FPS) ── */
const MedicineCard = memo(function MedicineCard({ medicine, onQuickView }) {
    const navigate = useNavigate()
    const { cart, addToCart, updateQty } = useCart()
    const { isInWishlist, toggleWishlist } = useWishlist()
    const [justAdded, setJustAdded] = useState(false)

    const mrp = medicine.mrp || 0
    const price = medicine.price || medicine.sellingPrice || 0
    const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : (medicine.discount || medicine.discountPct || 0)
    const requiresRx = medicine.requires_rx || medicine.requiresPrescription
    const isSaved = isInWishlist(medicine.id)

    const pack = useMemo(() => parsePackInfo(medicine.name), [medicine.name])
    const perUnitPrice = pack.unitCount > 1 && price > 0 ? (price / pack.unitCount).toFixed(2) : null
    const dosageForm = useMemo(() => detectDosageForm(medicine.name, medicine.salt, medicine.category), [medicine.name, medicine.salt, medicine.category])
    const cleanBrand = useMemo(() => cleanManufacturer(medicine.brand || medicine.manufacturer || 'Dhruv Certified'), [medicine.brand, medicine.manufacturer])

    // Real-time cart state for this item
    const cartItem = cart?.find((item) => item.id === medicine.id)

    const handleAdd = (e) => {
        e.stopPropagation()
        e.preventDefault()
        addToCart(medicine, 1)
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1400)
    }

    const handleQuickViewClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onQuickView) onQuickView(medicine)
    }

    return (
        <div
            onClick={() => navigate(`/medicines/${medicine.id}`)}
            className={`card-modern group overflow-hidden flex flex-col cursor-pointer transition-all duration-200 bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 ${
                !medicine.inStock ? 'opacity-75' : ''
            }`}
        >
            {/* Image area with Pack Shot & In-Place Inspect Zoom */}
            <div className="relative overflow-hidden bg-slate-50 border-b border-slate-100 group-hover:bg-slate-50/80 transition-colors">
                <MedicineImage medicine={medicine} aspectRatio="card" />

                {/* Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    {discount > 0 && (
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                            {discount}% OFF
                        </span>
                    )}
                </div>

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    {requiresRx ? (
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200 shadow-2xs" title="Doctor's prescription needed">
                            Rx Needed
                        </span>
                    ) : (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs" title="Direct buy (No prescription needed)">
                            Direct Buy
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
                                : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white'
                        }`}
                        title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
                    >
                        <Heart size={14} className={isSaved ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                </div>

                {/* Quick View Button on Image Hover */}
                <button
                    type="button"
                    onClick={handleQuickViewClick}
                    className="absolute bottom-2.5 right-2.5 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-slate-200 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                    title="Quick inspect medicine image"
                >
                    <Eye size={13} />
                    <span>View</span>
                </button>

                {!medicine.inStock && (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-20">
                        <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
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
                        <span className="text-[10px] text-slate-400 font-mono">
                            HSN 3004
                        </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors" title={medicine.name}>
                        {medicine.name}
                    </h3>

                    {medicine.salt && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mb-1 font-mono italic" title={medicine.salt}>
                            {medicine.salt}
                        </p>
                    )}

                    <p className="text-xs text-slate-600 font-medium truncate mb-2">
                        {cleanBrand}
                    </p>

                    {/* Pack Size & Real-Time Dosage Form Pill Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                            {dosageForm}
                        </span>
                        <span className="inline-block bg-slate-50 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200">
                            {pack.packLabel}
                        </span>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={10}
                                    className={i < Math.floor(medicine.rating || 4.7) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-slate-400 ml-0.5">({medicine.reviews || 80})</span>
                    </div>
                </div>

                {/* Pricing & Add / Quantity Controls */}
                <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        {/* MRP with strike-through & savings */}
                        <div className="flex items-center gap-1.5 text-xs leading-none mb-1 flex-wrap">
                            {mrp > price ? (
                                <>
                                    <span className="text-slate-500 text-[11px]">
                                        MRP <span className="line-through text-slate-400 font-medium">₹{mrp}</span>
                                    </span>
                                    {discount > 0 && (
                                        <span className="text-emerald-700 font-bold text-xs">
                                            {discount}% OFF
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-slate-500 text-[11px]">MRP ₹{mrp || price}</span>
                            )}
                        </div>

                        {/* Bold Selling Price */}
                        <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                            ₹{price}
                        </div>

                        {/* Per-Unit Price */}
                        {perUnitPrice && (
                            <div className="text-[10px] text-slate-400 mt-1 font-normal leading-tight">
                                ₹{perUnitPrice}/{pack.unitType}
                            </div>
                        )}
                    </div>

                    {medicine.inStock ? (
                        cartItem && cartItem.qty > 0 ? (
                            /* Active Quantity Counter inside Cart */
                            <div
                                onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                }}
                                className="inline-flex items-center bg-blue-600 text-white rounded-xl overflow-hidden shadow-xs shrink-0"
                            >
                                <button
                                    type="button"
                                    onClick={() => updateQty(medicine.id, -1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors font-bold text-sm cursor-pointer"
                                    title="Decrease quantity"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center font-black text-xs select-none">
                                    {cartItem.qty}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => addToCart(medicine, 1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors font-bold text-sm cursor-pointer"
                                    title="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAdd}
                                className={`inline-flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 active:scale-95 ${
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
                        )
                    ) : (
                        <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded-lg shrink-0">
                            Unavailable
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
})

/* ── In-Memory Cache to preserve Catalog & Pagination Position on Back-Navigation ── */
let cachedStoreMedicines = null
let cachedStoreVisibleCount = 24

/* ── Main Store Page ── */
export default function MedicineStorePage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { cart, addToCart } = useCart()

    const [medicines, setMedicines] = useState(() => cachedStoreMedicines || [])
    const [isLoading, setIsLoading] = useState(!cachedStoreMedicines)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '')
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All')
    const [sortBy, setSortBy] = useState('popular')
    const [showFilters, setShowFilters] = useState(false)
    const [rxFilter, setRxFilter] = useState('all') // 'all' | 'rx' | 'otc'
    const [inStockOnly, setInStockOnly] = useState(false)
    const [discountOnly, setDiscountOnly] = useState(false)
    const [maxPrice, setMaxPrice] = useState(1000)
    const [visibleCount, setVisibleCount] = useState(() => cachedStoreVisibleCount || 24)
    const [searchFocused, setSearchFocused] = useState(false)
    const [previewMedicine, setPreviewMedicine] = useState(null)
    const searchContainerRef = useRef(null)

    // Handle outside click to close auto suggestions
    useEffect(() => {
        function handleClickOutside(e) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setSearchFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close preview modal on ESC
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                setPreviewMedicine(null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Smart Case-Insensitive Multi-Field Auto Suggestions
    const suggestions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q || q.length < 1) return []

        const pool = medicines && medicines.length > 0 ? medicines : FALLBACK_MEDICINES
        const exactMatches = []
        const nameMatches = []
        const saltMatches = []

        for (const m of pool) {
            const name = (m.name || '').toLowerCase()
            const salt = (m.salt || '').toLowerCase()
            const brand = (m.brand || m.manufacturer || '').toLowerCase()

            if (name.startsWith(q)) {
                exactMatches.push(m)
            } else if (name.includes(q) || brand.includes(q)) {
                nameMatches.push(m)
            } else if (salt.includes(q)) {
                saltMatches.push(m)
            }
            if (exactMatches.length + nameMatches.length + saltMatches.length >= 25) break
        }

        return [...exactMatches, ...nameMatches, ...saltMatches].slice(0, 6)
    }, [searchQuery, medicines])

    // Sync with URL params
    useEffect(() => {
        const urlQ = searchParams.get('q') || ''
        const urlCat = searchParams.get('category')
        setSearchQuery(urlQ)
        setDebouncedSearch(urlQ)

        if (urlCat) {
            const targetLower = urlCat.trim().toLowerCase()
            const match = STORE_CATEGORIES.find((c) => {
                const cLower = c.toLowerCase()
                if (cLower === targetLower) return true
                if (targetLower.includes('vitamin') && cLower.includes('vitamin')) return true
                if ((targetLower.includes('heart') || targetLower.includes('bp')) && (cLower.includes('heart') || cLower.includes('blood pressure'))) return true
                if (targetLower.includes('skin') && cLower.includes('skin')) return true
                if (targetLower.includes('pain') && cLower.includes('pain')) return true
                if (targetLower.includes('diabet') && cLower.includes('diabet')) return true
                return false
            })
            setActiveCategory(match || urlCat)
        }
    }, [searchParams])

    // Debounce search keystrokes
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 150)
        return () => clearTimeout(handler)
    }, [searchQuery])

    // Update cached visible count
    useEffect(() => {
        cachedStoreVisibleCount = visibleCount
    }, [visibleCount])

    // Reset pagination batch
    useEffect(() => {
        if (debouncedSearch || activeCategory !== 'All' || rxFilter !== 'all' || inStockOnly || discountOnly || maxPrice < 1000) {
            setVisibleCount(24)
        }
    }, [debouncedSearch, activeCategory, sortBy, rxFilter, inStockOnly, discountOnly, maxPrice])

    // Fetch live published medicines from backend
    useEffect(() => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        const fetchMedicines = async () => {
            if (!cachedStoreMedicines) {
                setIsLoading(true)
            }
            try {
                const res = await fetch('http://localhost:8000/api/medicines', {
                    signal: controller.signal,
                })
                clearTimeout(timeoutId)
                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data) && data.length > 0) {
                        cachedStoreMedicines = data
                        setMedicines(data)
                        return
                    }
                }
                if (!cachedStoreMedicines) setMedicines(FALLBACK_MEDICINES)
            } catch (err) {
                console.warn('Backend unavailable or timed out, using fallback medicines:', err)
                if (!cachedStoreMedicines) setMedicines(FALLBACK_MEDICINES)
            } finally {
                clearTimeout(timeoutId)
                setIsLoading(false)
            }
        }

        fetchMedicines()

        const handleCatalogUpdated = () => {
            cachedStoreMedicines = null
            fetchMedicines()
        }
        window.addEventListener('catalog-updated', handleCatalogUpdated)

        return () => {
            window.removeEventListener('catalog-updated', handleCatalogUpdated)
            controller.abort()
            clearTimeout(timeoutId)
        }
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

        if (activeCategory && activeCategory !== 'All') {
            const catLower = activeCategory.trim().toLowerCase()
            result = result.filter((m) => {
                const mCat = (m.category || '').toLowerCase()
                if (mCat === catLower) return true
                if (catLower.includes('vitamin') && mCat.includes('vitamin')) return true
                if ((catLower.includes('heart') || catLower.includes('bp')) && (mCat.includes('heart') || mCat.includes('bp') || mCat.includes('blood pressure'))) return true
                if (catLower.includes('skin') && mCat.includes('skin')) return true
                if (catLower.includes('pain') && mCat.includes('pain')) return true
                if (catLower.includes('diabet') && mCat.includes('diabet')) return true
                if (catLower.includes('digest') && mCat.includes('digest')) return true
                if (catLower.includes('infection') && mCat.includes('infect')) return true
                if (catLower.includes('eye') && mCat.includes('eye')) return true
                return false
            })
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
        if (discountOnly) {
            result = result.filter((m) => {
                const mrp = m.mrp || 0
                const price = m.price || m.sellingPrice || 0
                const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : (m.discount || 0)
                return discount >= 15
            })
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
    }, [medicines, debouncedSearch, activeCategory, sortBy, rxFilter, inStockOnly, discountOnly, maxPrice])

    const visibleMedicines = useMemo(() => {
        return filteredMedicines.slice(0, visibleCount)
    }, [filteredMedicines, visibleCount])

    const handleResetFilters = () => {
        setActiveCategory('All')
        setRxFilter('all')
        setInStockOnly(false)
        setDiscountOnly(false)
        setMaxPrice(1000)
        setSearchQuery('')
        setDebouncedSearch('')
        setVisibleCount(24)
    }

    const hasActiveFilters = activeCategory !== 'All' || rxFilter !== 'all' || inStockOnly || discountOnly || maxPrice < 1000 || debouncedSearch

    return (
        <div className="bg-slate-50 min-h-screen pb-16">

            {/* ── Page Header Banner ── */}
            <div className="bg-white border-b border-slate-200/80 py-6 sm:py-7">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Dhruv Pharma Store
                            </h1>
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                                <Sparkles size={12} className="text-emerald-600" />
                                100% Genuine Catalog
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Authentic medicines verified by licensed pharmacists · 2–4 hours doorstep delivery in Nandurbar &amp; regional hubs
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 bg-slate-50 p-2 sm:px-3 sm:py-2 rounded-2xl border border-slate-200 self-start md:self-auto">
                        <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                        <span>All batches inspected under <strong>FDA License 20B/21B</strong></span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* ── Search + Filter + Sort Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative" ref={searchContainerRef}>
                        <div className="flex items-center bg-white border border-slate-300 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-xs">
                            <Search size={18} className="ml-4 text-slate-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search by brand name (e.g. Dolo, Augmentin, Pan-40) or active salt (e.g. Paracetamol, Metformin)..."
                                value={searchQuery}
                                onFocus={() => setSearchFocused(true)}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setSearchFocused(true)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchFocused(false)
                                    }
                                }}
                                className="flex-1 px-3 py-3 text-xs sm:text-sm outline-none bg-transparent text-slate-800 placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setDebouncedSearch('')
                                        setSearchFocused(false)
                                    }}
                                    className="mr-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Floating Auto-Suggestion Dropdown */}
                        {searchFocused && searchQuery.trim().length >= 1 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-1 text-left">
                                {suggestions.length > 0 ? (
                                    <div>
                                        <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1.5">
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles size={11} className="text-blue-500" />
                                                Suggested Medicines
                                            </span>
                                            <span className="text-blue-600 font-semibold lowercase">instant match</span>
                                        </div>

                                        <div className="space-y-1">
                                            {suggestions.map((med) => {
                                                const price = med.price || med.sellingPrice || 0
                                                const requiresRx = Boolean(med.requires_rx || med.requiresPrescription)
                                                return (
                                                    <div
                                                        key={med.id}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            setSearchFocused(false)
                                                            navigate(`/medicines/${med.id}`)
                                                        }}
                                                        className="flex items-center gap-3 p-2.5 hover:bg-blue-50/70 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                                                            <MedicineImage medicine={med} aspectRatio="square" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                                                                    {med.name}
                                                                </h4>
                                                                <span className="text-xs font-black text-slate-900 shrink-0">
                                                                    ₹{price}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-1 mt-0.5">
                                                                <p className="text-[10px] text-slate-500 italic truncate font-mono">
                                                                    {med.salt || med.category || 'Dhruv Genuine'}
                                                                </p>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                                                    requiresRx
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                }`}>
                                                                    {requiresRx ? 'Rx Needed' : 'Direct Buy'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setSearchFocused(false)
                                                setDebouncedSearch(searchQuery)
                                            }}
                                            className="w-full mt-2 py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Search size={13} className="text-blue-200" />
                                                <span>Filter store catalog for <span className="underline decoration-blue-300 font-extrabold">"{searchQuery}"</span></span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-100 group-hover:translate-x-1 transition-transform">
                                                <span>Apply filter</span>
                                                <ArrowRight size={13} />
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-3 text-center space-y-1">
                                        <p className="text-xs font-bold text-slate-800">No instant preview for "{searchQuery}"</p>
                                        <p className="text-[11px] text-slate-500">Press enter to filter the store catalog by this keyword.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Sort Selector */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-2xl px-4 py-3 pr-8 text-xs sm:text-sm text-slate-700 font-semibold outline-none cursor-pointer hover:border-blue-400 transition-colors shadow-xs"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 border rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition-all sm:hidden shadow-xs cursor-pointer ${
                                showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                            }`}
                        >
                            <SlidersHorizontal size={14} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                {/* ── Quick Filter Chips (Horizontal Swipe on Mobile) ── */}
                <div className="flex items-center gap-2 pt-1 text-xs overflow-x-auto scrollbar-none pb-1.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
                    <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1 shrink-0">Quick Filters:</span>

                    <button
                        type="button"
                        onClick={() => setRxFilter(rxFilter === 'otc' ? 'all' : 'otc')}
                        className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer border shrink-0 text-xs ${
                            rxFilter === 'otc'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        ⚡ Direct Buy (No Rx)
                    </button>

                    <button
                        type="button"
                        onClick={() => setRxFilter(rxFilter === 'rx' ? 'all' : 'rx')}
                        className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer border shrink-0 text-xs ${
                            rxFilter === 'rx'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        📄 Prescription (Rx)
                    </button>

                    <button
                        type="button"
                        onClick={() => setDiscountOnly(!discountOnly)}
                        className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer border shrink-0 text-xs ${
                            discountOnly
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        🏷️ Big Savings (≥15%)
                    </button>

                    <button
                        type="button"
                        onClick={() => setInStockOnly(!inStockOnly)}
                        className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer border shrink-0 text-xs ${
                            inStockOnly
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        📦 In-Stock Only
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold px-2.5 py-1.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer shrink-0 text-xs"
                        >
                            <RotateCcw size={12} />
                            <span>Reset Filters</span>
                        </button>
                    )}
                </div>

                {/* ── Catalog Summary Count Strip ── */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 pb-1">
                    <p>
                        Showing <strong className="text-slate-900 font-bold">{visibleMedicines.length}</strong> of{' '}
                        <strong className="text-slate-900 font-bold">{filteredMedicines.length}</strong> medicines
                    </p>
                    <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline-flex items-center gap-1">
                        <Truck size={13} className="text-emerald-600" />
                        Doorstep Delivery available across all 7 regional hubs
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">

                    {/* ── Left Sidebar Filters ── */}
                    <aside className={`shrink-0 w-full sm:w-64 ${showFilters ? 'block' : 'hidden'} sm:block`}>
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sticky top-24 space-y-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h2 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                    <Filter size={15} className="text-blue-600" /> Filter Catalog
                                </h2>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        <RotateCcw size={11} /> Reset
                                    </button>
                                )}
                            </div>

                            {/* Category List */}
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Health Categories
                                </p>
                                <ul className="space-y-1 max-h-[46vh] overflow-y-auto pr-1 scrollbar-thin">
                                    {STORE_CATEGORIES.map((cat) => (
                                        <li key={cat}>
                                            <button
                                                type="button"
                                                onClick={() => setActiveCategory(cat)}
                                                className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                                    activeCategory === cat
                                                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>{cat}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Prescription Type */}
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Prescription Type
                                </p>
                                {[
                                    { value: 'all', label: 'All Medicines' },
                                    { value: 'otc', label: 'Direct Buy (No Rx)' },
                                    { value: 'rx',  label: 'Prescription Required (Rx)' },
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-700 py-1.5 cursor-pointer hover:text-slate-900 font-medium">
                                        <input
                                            type="radio"
                                            name="rx"
                                            value={opt.value}
                                            checked={rxFilter === opt.value}
                                            onChange={() => setRxFilter(opt.value)}
                                            className="accent-blue-600 cursor-pointer"
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* In-Stock Only */}
                            <div className="pt-3 border-t border-slate-100">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
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
                            <div className="pt-3 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-1.5">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[...Array(6)].map((_, i) => (
                                    <MedicineCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-2xs">
                                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                                    <Pill size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900">No matching medicines found</h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        We couldn't find any medicines matching your search or filters. Try adjusting your search term or reset all filters.
                                    </p>
                                </div>
                                <div className="pt-2 flex justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {visibleMedicines.map((med) => (
                                        <MedicineCard
                                            key={med.id}
                                            medicine={med}
                                            onQuickView={(target) => setPreviewMedicine(target)}
                                        />
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {filteredMedicines.length > visibleCount && (
                                    <div className="mt-8 pt-4 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setVisibleCount((prev) => Math.min(prev + 24, filteredMedicines.length))}
                                            className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 hover:border-blue-500 font-bold text-sm px-8 py-3 rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                                        >
                                            <Sparkles size={14} className="text-blue-500" />
                                            <span>Load More Medicines ({filteredMedicines.length - visibleCount} remaining)</span>
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>

                </div>
            </div>

            {/* ── In-Place Medicine Lightbox Preview Modal ── */}
            {previewMedicine && (
                <div
                    onClick={() => setPreviewMedicine(null)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl relative animate-in zoom-in-95 duration-200"
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setPreviewMedicine(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-white/90 hover:bg-slate-100 p-2 rounded-full transition-colors z-20 cursor-pointer shadow-xs"
                        >
                            <X size={18} />
                        </button>

                        {/* Large Image Preview Area */}
                        <div className="relative bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6">
                            <MedicineImage medicine={previewMedicine} aspectRatio="square" className="max-h-64 object-contain" />
                            {previewMedicine.discount && previewMedicine.discount > 0 && (
                                <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                                    {previewMedicine.discount}% OFF
                                </span>
                            )}
                        </div>

                        {/* Details */}
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                                        {previewMedicine.category}
                                    </span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                                        {detectDosageForm(previewMedicine.name, previewMedicine.salt, previewMedicine.category)}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                        previewMedicine.requires_rx || previewMedicine.requiresPrescription
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {previewMedicine.requires_rx || previewMedicine.requiresPrescription ? 'Rx Required' : 'Direct Buy'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 pt-1">
                                    {previewMedicine.name}
                                </h3>

                                {previewMedicine.salt && (
                                    <p className="text-xs text-slate-500 font-mono italic">
                                        Salt Composition: {previewMedicine.salt}
                                    </p>
                                )}

                                <p className="text-xs text-slate-600 font-medium">
                                    Manufacturer: <strong>{cleanManufacturer(previewMedicine.brand || previewMedicine.manufacturer || 'Dhruv Certified')}</strong>
                                </p>
                            </div>

                            <div className="flex items-baseline gap-3 pt-2 border-t border-slate-100">
                                <span className="text-3xl font-black text-slate-900">
                                    ₹{previewMedicine.price || previewMedicine.sellingPrice || 0}
                                </span>
                                {previewMedicine.mrp && previewMedicine.mrp > (previewMedicine.price || previewMedicine.sellingPrice || 0) && (
                                    <span className="text-sm text-slate-400 line-through">
                                        MRP ₹{previewMedicine.mrp}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        addToCart(previewMedicine, 1)
                                        setPreviewMedicine(null)
                                    }}
                                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <ShoppingCart size={16} />
                                    <span>Add to Cart</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const medId = previewMedicine.id
                                        setPreviewMedicine(null)
                                        navigate(`/medicines/${medId}`)
                                    }}
                                    className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer"
                                >
                                    Full Details &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
