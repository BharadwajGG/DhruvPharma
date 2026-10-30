import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import {
    Search,
    Filter,
    Star,
    Pill,
    ShoppingCart,
    SlidersHorizontal,
    X,
    ChevronDown,
    Loader2,
    Sparkles,
    Check,
} from 'lucide-react'

/* ── Fallback mock data if server is unreachable ── */
const FALLBACK_MEDICINES = [
    { id: 1,  name: 'Augmentin 625 Duo Tablet',  salt: 'Amoxycillin + Clavulanic Acid', brand: 'GlaxoSmithKline', price: 196, mrp: 223.5, category: 'Antibiotics & Infections', rating: 4.8, reviews: 140, requires_rx: true,  inStock: true },
    { id: 2,  name: 'Dolo 650 Tablet',           salt: 'Paracetamol 650mg',             brand: 'Micro Labs Ltd',   price: 29,  mrp: 34,   category: 'Pain Relief & Fever',      rating: 4.9, reviews: 450, requires_rx: false, inStock: true },
    { id: 3,  name: 'Glycomet 500mg Tablet',     salt: 'Metformin 500mg',               brand: 'USV Ltd',          price: 42,  mrp: 48,   category: 'Diabetes Care',            rating: 4.7, reviews: 95,  requires_rx: true,  inStock: true },
    { id: 4,  name: 'Telma 40 Tablet',           salt: 'Telmisartan 40mg',              brand: 'Glenmark Pharma',  price: 125, mrp: 142,  category: 'Heart & Blood Pressure',   rating: 4.6, reviews: 88,  requires_rx: true,  inStock: true },
    { id: 5,  name: 'Pan-D Capsule',             salt: 'Pantoprazole + Domperidone',    brand: 'Alkem Labs',       price: 175, mrp: 199,  category: 'Acidity & Digestion',      rating: 4.7, reviews: 110, requires_rx: true,  inStock: true },
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

/* ── Medicine Card ── */
function MedicineCard({ medicine }) {
    const { addToCart } = useCart()
    const [justAdded, setJustAdded] = useState(false)

    const mrp = medicine.mrp || 0
    const price = medicine.price || medicine.sellingPrice || 0
    const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0
    const requiresRx = medicine.requires_rx || medicine.requiresPrescription

    const handleAdd = () => {
        addToCart(medicine, 1)
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 1500)
    }

    return (
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col ${!medicine.inStock ? 'opacity-60' : ''}`}>
            {/* Image area */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-xl h-32 flex items-center justify-center relative">
                <Pill size={40} className="text-blue-200 group-hover:text-blue-300 transition-colors" />
                {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {discount}% OFF
                    </span>
                )}
                {requiresRx && (
                    <span className="absolute top-2 right-2 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                        Rx Required
                    </span>
                )}
                {!medicine.inStock && (
                    <div className="absolute inset-0 bg-white/60 rounded-t-xl flex items-center justify-center">
                        <span className="bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            <div className="p-3.5 flex flex-col flex-1">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1 line-clamp-1">
                    {medicine.category}
                </p>
                <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-1" title={medicine.name}>
                    {medicine.name}
                </h3>
                {medicine.salt && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mb-1 italic" title={medicine.salt}>
                        {medicine.salt}
                    </p>
                )}
                <p className="text-xs text-gray-400 mb-2">{medicine.brand || medicine.manufacturer}</p>

                <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={10}
                            className={i < Math.floor(medicine.rating || 4.7) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-0.5">({medicine.reviews || 80})</span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-3 mt-auto">
                    <span className="text-base font-bold text-gray-900">₹{price}</span>
                    {mrp > price && (
                        <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
                    )}
                </div>

                <div className="flex gap-2">
                    <Link
                        to={`/medicines/${medicine.id}`}
                        className="flex-1 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                    >
                        Details
                    </Link>
                    {medicine.inStock ? (
                        <button
                            onClick={handleAdd}
                            className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg transition-all shadow-2xs ${
                                justAdded
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
                            }`}
                        >
                            {justAdded ? (
                                <>
                                    <Check size={12} /> Added!
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={12} /> Add
                                </>
                            )}
                        </button>
                    ) : (
                        <button disabled className="flex-1 bg-gray-200 text-gray-400 text-xs font-medium py-1.5 rounded-lg cursor-not-allowed">
                            Unavailable
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ── Main Page ── */
export default function MedicineStorePage() {
    const [searchParams] = useSearchParams()
    const [medicines, setMedicines] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All')
    const [sortBy, setSortBy] = useState('popular')
    const [showFilters, setShowFilters] = useState(false)
    const [rxFilter, setRxFilter] = useState('all') // 'all' | 'rx' | 'otc'
    const [inStockOnly, setInStockOnly] = useState(false)

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

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
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
    }, [medicines, searchQuery, activeCategory, sortBy, rxFilter, inStockOnly])

    return (
        <div className="bg-gray-50 min-h-screen">

            {/* ── Page Header ── */}
            <div className="bg-white border-b border-gray-100 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">Dhruv Pharma Store</h1>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles size={11} /> Live Catalog
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {filteredMedicines.length} verified medicines available for doorstep delivery across Maharashtra districts
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* ── Search + Sort Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                        <Search size={16} className="ml-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by brand name (e.g. Dolo, Augmentin) or active salt (e.g. Paracetamol, Metformin)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mr-3 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Sort */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-8 text-sm text-gray-700 outline-none cursor-pointer hover:border-blue-400 transition-colors shadow-2xs"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Filter Toggle (mobile) */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 border rounded-xl px-4 py-3 text-sm font-medium transition-colors sm:hidden shadow-2xs
                                ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
                        >
                            <SlidersHorizontal size={14} />
                            Filters
                        </button>
                    </div>
                </div>

                <div className="flex gap-6">

                    {/* ── Sidebar Filters ── */}
                    <aside className={`shrink-0 w-64 ${showFilters ? 'block' : 'hidden'} sm:block`}>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 sticky top-28 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Filter size={15} className="text-blue-600" /> Categories
                                </h2>
                                <button
                                    onClick={() => { setActiveCategory('All'); setRxFilter('all'); setInStockOnly(false) }}
                                    className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Category List */}
                            <div>
                                <ul className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
                                    {STORE_CATEGORIES.map((cat) => (
                                        <li key={cat}>
                                            <button
                                                onClick={() => setActiveCategory(cat)}
                                                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-between
                                                    ${activeCategory === cat
                                                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span>{cat}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Prescription filter */}
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Prescription Type
                                </p>
                                {[
                                    { value: 'all', label: 'All Medicines' },
                                    { value: 'otc', label: 'OTC (Over-The-Counter)' },
                                    { value: 'rx',  label: 'Prescription Required (Rx)' },
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 text-xs text-gray-600 py-1 cursor-pointer hover:text-gray-900">
                                        <input
                                            type="radio"
                                            name="rx"
                                            value={opt.value}
                                            checked={rxFilter === opt.value}
                                            onChange={() => setRxFilter(opt.value)}
                                            className="accent-blue-600"
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>

                            {/* In-stock filter */}
                            <div className="pt-3 border-t border-gray-100">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                        className="accent-blue-600 w-4 h-4 rounded"
                                    />
                                    In Stock Only
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* ── Medicine Grid ── */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <Loader2 size={36} className="text-blue-600 animate-spin mb-3" />
                                <p className="text-sm text-gray-500">Loading catalog...</p>
                            </div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100 p-8">
                                <Pill size={48} className="text-gray-200 mb-3" />
                                <h3 className="text-base font-bold text-gray-800 mb-1">No medicines found</h3>
                                <p className="text-xs text-gray-400 mb-4 max-w-sm">
                                    No medicines match your current search or category filter. Try clearing filters or searching for an active salt formula.
                                </p>
                                <button
                                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); setRxFilter('all') }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredMedicines.map((med) => (
                                    <MedicineCard key={med.id} medicine={med} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
