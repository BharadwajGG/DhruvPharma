import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
    Search,
    Filter,
    Star,
    Pill,
    ShoppingCart,
    SlidersHorizontal,
    X,
    ChevronDown,
} from 'lucide-react'

/* ── Mock medicine data ── */
const ALL_MEDICINES = [
    { id: 1,  name: 'Metformin 500mg',        brand: 'Glucophage',   price: 45,  mrp: 60,  category: 'Diabetes Care',       rating: 4.8, reviews: 120, requires_rx: true,  inStock: true },
    { id: 2,  name: 'Metformin 1000mg',       brand: 'Glycomet',     price: 80,  mrp: 110, category: 'Diabetes Care',       rating: 4.7, reviews: 85,  requires_rx: true,  inStock: true },
    { id: 3,  name: 'Glimepiride 1mg',        brand: 'Amaryl',       price: 65,  mrp: 90,  category: 'Diabetes Care',       rating: 4.6, reviews: 62,  requires_rx: true,  inStock: true },
    { id: 4,  name: 'Amlodipine 5mg',         brand: 'Norvasc',      price: 55,  mrp: 75,  category: 'Heart & BP',          rating: 4.7, reviews: 98,  requires_rx: true,  inStock: true },
    { id: 5,  name: 'Telmisartan 40mg',       brand: 'Telma',        price: 90,  mrp: 130, category: 'Heart & BP',          rating: 4.5, reviews: 73,  requires_rx: true,  inStock: true },
    { id: 6,  name: 'Atorvastatin 10mg',      brand: 'Lipitor',      price: 75,  mrp: 100, category: 'Heart & BP',          rating: 4.8, reviews: 140, requires_rx: true,  inStock: true },
    { id: 7,  name: 'Vitamin D3 60K IU',      brand: 'Calcirol',     price: 90,  mrp: 120, category: 'Vitamins',            rating: 4.9, reviews: 210, requires_rx: false, inStock: true },
    { id: 8,  name: 'Vitamin B12 500mcg',     brand: 'Cobadex',      price: 55,  mrp: 70,  category: 'Vitamins',            rating: 4.7, reviews: 165, requires_rx: false, inStock: true },
    { id: 9,  name: 'Paracetamol 500mg',      brand: 'Crocin',       price: 18,  mrp: 25,  category: 'Pain Relief',         rating: 4.9, reviews: 450, requires_rx: false, inStock: true },
    { id: 10, name: 'Ibuprofen 400mg',        brand: 'Brufen',       price: 28,  mrp: 40,  category: 'Pain Relief',         rating: 4.6, reviews: 210, requires_rx: false, inStock: true },
    { id: 11, name: 'Pantoprazole 40mg',      brand: 'Pan-D',        price: 60,  mrp: 85,  category: 'Digestive Health',   rating: 4.6, reviews: 75,  requires_rx: true,  inStock: true },
    { id: 12, name: 'Domperidone 10mg',       brand: 'Domstal',      price: 30,  mrp: 45,  category: 'Digestive Health',   rating: 4.4, reviews: 55,  requires_rx: false, inStock: true },
    { id: 13, name: 'Cetirizine 10mg',        brand: 'Okacet',       price: 22,  mrp: 30,  category: 'Allergy',             rating: 4.7, reviews: 185, requires_rx: false, inStock: true },
    { id: 14, name: 'Loratadine 10mg',        brand: 'Lorfast',      price: 35,  mrp: 50,  category: 'Allergy',             rating: 4.5, reviews: 90,  requires_rx: false, inStock: false },
    { id: 15, name: 'Betamethasone Cream',    brand: 'Betnovate',    price: 55,  mrp: 75,  category: 'Skin Care',           rating: 4.3, reviews: 42,  requires_rx: true,  inStock: true },
    { id: 16, name: 'Clotrimazole Cream',     brand: 'Canesten',     price: 48,  mrp: 65,  category: 'Skin Care',           rating: 4.6, reviews: 88,  requires_rx: false, inStock: true },
]

const CATEGORIES = [
    'All',
    'Diabetes Care',
    'Heart & BP',
    'Vitamins',
    'Pain Relief',
    'Digestive Health',
    'Allergy',
    'Skin Care',
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
    const discount = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100)

    return (
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col ${!medicine.inStock ? 'opacity-60' : ''}`}>
            {/* Image area */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-xl h-32 flex items-center justify-center relative">
                <Pill size={40} className="text-blue-200 group-hover:text-blue-300 transition-colors" />
                {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {discount}% OFF
                    </span>
                )}
                {medicine.requires_rx && (
                    <span className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-orange-200">
                        Rx
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

            <div className="p-3 flex flex-col flex-1">
                <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide mb-0.5">
                    {medicine.category}
                </p>
                <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-0.5">
                    {medicine.name}
                </h3>
                <p className="text-xs text-gray-400 mb-2">{medicine.brand}</p>

                <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={10}
                            className={i < Math.floor(medicine.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-0.5">({medicine.reviews})</span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-3 mt-auto">
                    <span className="text-base font-bold text-gray-900">₹{medicine.price}</span>
                    <span className="text-xs text-gray-400 line-through">₹{medicine.mrp}</span>
                </div>

                <div className="flex gap-2">
                    <Link
                        to={`/medicines/${medicine.id}`}
                        className="flex-1 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-medium py-1.5 rounded-lg transition-colors"
                    >
                        Details
                    </Link>
                    {medicine.inStock ? (
                        <button className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
                            <ShoppingCart size={12} />
                            Add
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
    const [searchQuery, setSearchQuery]     = useState(searchParams.get('q') || '')
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All')
    const [sortBy, setSortBy]               = useState('popular')
    const [showFilters, setShowFilters]     = useState(false)
    const [rxFilter, setRxFilter]           = useState('all')   // 'all' | 'rx' | 'otc'
    const [inStockOnly, setInStockOnly]     = useState(false)

    /* Filtered + sorted list */
    const filteredMedicines = useMemo(() => {
        let result = [...ALL_MEDICINES]

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (m) =>
                    m.name.toLowerCase().includes(q) ||
                    m.brand.toLowerCase().includes(q) ||
                    m.category.toLowerCase().includes(q)
            )
        }

        if (activeCategory !== 'All') {
            result = result.filter((m) => m.category === activeCategory)
        }

        if (rxFilter === 'rx')  result = result.filter((m) =>  m.requires_rx)
        if (rxFilter === 'otc') result = result.filter((m) => !m.requires_rx)
        if (inStockOnly)        result = result.filter((m) =>  m.inStock)

        switch (sortBy) {
            case 'price_asc':  result.sort((a, b) => a.price - b.price);          break
            case 'price_desc': result.sort((a, b) => b.price - a.price);          break
            case 'rating':     result.sort((a, b) => b.rating - a.rating);        break
            case 'discount':   result.sort((a, b) => (b.mrp - b.price) - (a.mrp - a.price)); break
            default:           result.sort((a, b) => b.reviews - a.reviews);      break
        }

        return result
    }, [searchQuery, activeCategory, sortBy, rxFilter, inStockOnly])

    return (
        <div className="bg-gray-50 min-h-screen">

            {/* ── Page Header ── */}
            <div className="bg-white border-b border-gray-100 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Medicine Store</h1>
                    <p className="text-gray-500 text-sm">
                        {filteredMedicines.length} medicines available for delivery in your area
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* ── Search + Sort Bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Search size={16} className="ml-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by medicine name, brand..."
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
                                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-8 text-sm text-gray-700 outline-none cursor-pointer hover:border-blue-400 transition-colors"
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
                            className={`flex items-center gap-2 border rounded-xl px-4 py-3 text-sm font-medium transition-colors sm:hidden
                                ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
                        >
                            <SlidersHorizontal size={14} />
                            Filters
                        </button>
                    </div>
                </div>

                <div className="flex gap-6">

                    {/* ── Sidebar Filters ── */}
                    <aside className={`shrink-0 w-56 ${showFilters ? 'block' : 'hidden'} sm:block`}>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-28">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                    <Filter size={14} /> Filters
                                </h2>
                                <button
                                    onClick={() => { setActiveCategory('All'); setRxFilter('all'); setInStockOnly(false) }}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>

                            {/* Category filter */}
                            <div className="mb-5">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Category
                                </p>
                                <ul className="space-y-1">
                                    {CATEGORIES.map((cat) => (
                                        <li key={cat}>
                                            <button
                                                onClick={() => setActiveCategory(cat)}
                                                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors
                                                    ${activeCategory === cat
                                                        ? 'bg-blue-600 text-white font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Prescription filter */}
                            <div className="mb-5">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Prescription
                                </p>
                                {[
                                    { value: 'all', label: 'All Medicines' },
                                    { value: 'otc', label: 'OTC (No Rx needed)' },
                                    { value: 'rx',  label: 'Prescription Required' },
                                ].map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600 py-1 cursor-pointer hover:text-gray-800">
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
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="accent-blue-600 w-4 h-4"
                                />
                                In Stock Only
                            </label>
                        </div>
                    </aside>

                    {/* ── Medicine Grid ── */}
                    <div className="flex-1">
                        {filteredMedicines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <Pill size={56} className="text-gray-200 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-1">No medicines found</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Try a different search term or remove some filters
                                </p>
                                <button
                                    onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                                    className="text-blue-600 text-sm font-medium hover:underline"
                                >
                                    Clear search
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
