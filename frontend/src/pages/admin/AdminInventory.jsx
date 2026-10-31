import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import MedicineImage from '../../components/MedicineImage'
import {
    Search,
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    Trash2,
    RefreshCw,
    Download,
    SlidersHorizontal,
    Rocket,
    Eye,
    Pill,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    Loader2,
} from 'lucide-react'

const ALL_CATEGORIES = [
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

const CATEGORY_COLORS = {
    'Pain Relief & Fever': 'bg-amber-100 text-amber-800 border-amber-200',
    'Antibiotics & Infections': 'bg-red-100 text-red-800 border-red-200',
    'Acidity & Digestion': 'bg-orange-100 text-orange-800 border-orange-200',
    'Cold, Cough & Allergy': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Diabetes Care': 'bg-purple-100 text-purple-800 border-purple-200',
    'Heart & Blood Pressure': 'bg-rose-100 text-rose-800 border-rose-200',
    'Vitamins & Supplements': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Skin Care & Antifungals': 'bg-pink-100 text-pink-800 border-pink-200',
    'Eye & Ear Drops': 'bg-blue-100 text-blue-800 border-blue-200',
    'Ayurvedic & Herbal': 'bg-green-100 text-green-800 border-green-200',
    'Surgical & Medical Supplies': 'bg-slate-100 text-slate-800 border-slate-200',
    'General Healthcare': 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function AdminInventory() {
    const fileInputRef = useRef(null)

    // Active View Tab: 'staged' (Drafts / Ingestion) or 'live' (Storefront)
    const [activeTab, setActiveTab] = useState('staged')

    // Staging State
    const [stagedItems, setStagedItems] = useState([])
    const [stagedTotal, setStagedTotal] = useState(0)
    const [stagedCategoryCounts, setStagedCategoryCounts] = useState({})
    const [stagedPage, setStagedPage] = useState(1)
    const [stagedLimit, setStagedLimit] = useState(50)
    const [stagedSearch, setStagedSearch] = useState('')
    const [stagedCategory, setStagedCategory] = useState('All')

    // Live Catalog State
    const [liveItems, setLiveItems] = useState([])
    const [liveTotal, setLiveTotal] = useState(0)
    const [livePage, setLivePage] = useState(1)
    const [liveLimit, setLiveLimit] = useState(50)
    const [liveSearch, setLiveSearch] = useState('')
    const [liveCategory, setLiveCategory] = useState('All')

    // Upload & UI Status
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSummary, setUploadSummary] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoadingStaged, setIsLoadingStaged] = useState(false)
    const [isLoadingLive, setIsLoadingLive] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [feedbackMsg, setFeedbackMsg] = useState(null)

    // Fetch Staged Items
    const fetchStaged = async () => {
        setIsLoadingStaged(true)
        try {
            const params = new URLSearchParams({
                page: stagedPage,
                limit: stagedLimit,
                search: stagedSearch,
                category: stagedCategory,
            })
            const res = await fetch(`http://localhost:8000/api/inventory/staged?${params}`)
            if (res.ok) {
                const data = await res.json()
                setStagedItems(data.items || [])
                setStagedTotal(data.total || 0)
                setStagedCategoryCounts(data.categoryCounts || {})
            }
        } catch (err) {
            console.error('Failed to fetch staged inventory:', err)
        } finally {
            setIsLoadingStaged(false)
        }
    }

    // Fetch Live Store Catalog
    const fetchLive = async () => {
        setIsLoadingLive(true)
        try {
            const params = new URLSearchParams({
                page: livePage,
                limit: liveLimit,
                search: liveSearch,
                category: liveCategory,
            })
            const res = await fetch(`http://localhost:8000/api/inventory/live?${params}`)
            if (res.ok) {
                const data = await res.json()
                setLiveItems(data.items || [])
                setLiveTotal(data.total || 0)
            }
        } catch (err) {
            console.error('Failed to fetch live inventory:', err)
        } finally {
            setIsLoadingLive(false)
        }
    }

    useEffect(() => {
        fetchStaged()
    }, [stagedPage, stagedLimit, stagedSearch, stagedCategory])

    useEffect(() => {
        fetchLive()
    }, [livePage, liveLimit, liveSearch, liveCategory])

    // File Upload Handler
    const handleFileUpload = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
            alert('Please select a valid CSV file (.csv)')
            return
        }

        setIsUploading(true)
        setUploadSummary(null)
        setFeedbackMsg(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('http://localhost:8000/api/inventory/upload', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.detail || 'Upload failed.')
            }

            setUploadSummary(data.stats)
            setFeedbackMsg({ type: 'success', text: data.message })
            setActiveTab('staged')
            setStagedPage(1)
            fetchStaged()
        } catch (err) {
            console.error('Upload error:', err)
            setFeedbackMsg({ type: 'error', text: err.message || 'Failed to upload and parse distributor CSV.' })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Inline Update Item Handler
    const handleUpdateItem = async (itemId, field, value) => {
        // Optimistic UI update
        const updater = (prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))

        if (activeTab === 'staged') {
            setStagedItems(updater)
        } else {
            setLiveItems(updater)
        }

        // Backend sync payload mapping
        const payload = {}
        if (field === 'category') payload.category = value
        if (field === 'price' || field === 'sellingPrice') payload.selling_price = parseFloat(value) || 0
        if (field === 'mrp') payload.mrp = parseFloat(value) || 0
        if (field === 'stock') payload.stock_quantity = parseInt(value) || 0
        if (field === 'requires_rx' || field === 'requiresPrescription') payload.requires_prescription = Boolean(value)

        try {
            const res = await fetch(`http://localhost:8000/api/inventory/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                console.error('Failed to sync inline update with server.')
            }
        } catch (err) {
            console.error('Inline update network error:', err)
        }
    }

    // Delete Item Handler
    const handleDeleteItem = async (itemId, itemName) => {
        if (!window.confirm(`Remove "${itemName}" from ${activeTab === 'staged' ? 'staging' : 'live store'}?`)) {
            return
        }

        try {
            const res = await fetch(`http://localhost:8000/api/inventory/${itemId}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                if (activeTab === 'staged') {
                    setStagedItems((prev) => prev.filter((i) => i.id !== itemId))
                    setStagedTotal((prev) => Math.max(0, prev - 1))
                } else {
                    setLiveItems((prev) => prev.filter((i) => i.id !== itemId))
                    setLiveTotal((prev) => Math.max(0, prev - 1))
                }
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    // Discard All Staged Items
    const handleClearStaging = async () => {
        if (!window.confirm(`Are you sure you want to discard all ${stagedTotal} draft items from staging? This action cannot be undone.`)) {
            return
        }

        try {
            const res = await fetch('http://localhost:8000/api/inventory/staged/clear', {
                method: 'DELETE',
            })
            if (res.ok) {
                setStagedItems([])
                setStagedTotal(0)
                setStagedCategoryCounts({})
                setFeedbackMsg({ type: 'info', text: 'All staged drafts have been discarded.' })
            }
        } catch (err) {
            console.error('Clear staging error:', err)
        }
    }

    // Publish to Live Storefront
    const handlePublishAll = async () => {
        setIsPublishing(true)
        try {
            const res = await fetch('http://localhost:8000/api/inventory/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })
            const data = await res.json()
            if (res.ok) {
                setShowPublishModal(false)
                setFeedbackMsg({
                    type: 'success',
                    text: `🚀 ${data.publishedCount} medicines have been published to the live patient storefront!`,
                })
                fetchStaged()
                fetchLive()
                setActiveTab('live')
            } else {
                alert(data.detail || 'Failed to publish.')
            }
        } catch (err) {
            console.error('Publish error:', err)
            alert('Error publishing medicines to live storefront.')
        } finally {
            setIsPublishing(false)
        }
    }

    const currentItems = activeTab === 'staged' ? stagedItems : liveItems
    const currentTotal = activeTab === 'staged' ? stagedTotal : liveTotal
    const currentPage = activeTab === 'staged' ? stagedPage : livePage
    const currentLimit = activeTab === 'staged' ? stagedLimit : liveLimit
    const totalPages = Math.max(1, Math.ceil(currentTotal / currentLimit))

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Top Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Medicine Catalog &amp; Staging</h1>
                            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles size={12} /> Auto-Categorizer Active
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Upload raw distributor CSVs, auto-tag clinical categories &amp; Schedule H molecules, inspect in Staging, and publish to live patients.
                        </p>
                    </div>

                    {/* Quick Sample CSV Download */}
                    <a
                        href="http://localhost:8000/api/inventory/sample-csv"
                        download="DHRUV_PHARMA_DISTRIBUTOR_SAMPLE.csv"
                        className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0"
                    >
                        <Download size={14} className="text-blue-600" />
                        Download Sample Distributor CSV
                    </a>
                </div>

                {/* ── Feedback Banner ── */}
                {feedbackMsg && (
                    <div
                        className={`p-4 rounded-xl flex items-start gap-3 border text-sm transition-all ${
                            feedbackMsg.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : feedbackMsg.type === 'error'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {feedbackMsg.type === 'success' ? (
                            <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                        ) : feedbackMsg.type === 'error' ? (
                            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                        ) : (
                            <Pill size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 font-medium">{feedbackMsg.text}</div>
                        <button
                            onClick={() => setFeedbackMsg(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* ── CSV Upload & Ingestion Dropzone ── */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleFileUpload(e.dataTransfer.files[0])
                        }
                    }}
                    className={`rounded-2xl border-2 border-dashed p-6 transition-all text-center relative ${
                        isDragging
                            ? 'border-blue-500 bg-blue-50/70 scale-[1.005]'
                            : 'border-gray-200 bg-white hover:border-blue-300 shadow-xs'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0])
                            }
                        }}
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                {isUploading ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <FileSpreadsheet size={24} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">
                                    {isUploading
                                        ? 'Parsing & Auto-Categorizing Distributor CSV...'
                                        : 'Import Distributor CSV File'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Supports Marg ERP, Busy, and MedSys exports. Blank salts are automatically resolved from medicine brand names.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                            >
                                <Upload size={14} />
                                <span>{isUploading ? 'Uploading...' : 'Upload CSV File'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Instant Parsing Breakdown Summary */}
                    {uploadSummary && (
                        <div className="mt-5 pt-4 border-t border-gray-100 text-left bg-blue-50/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                    <CheckCircle size={14} className="text-green-600" />
                                    Parsing Complete: {uploadSummary.totalParsed} Medicines Ingested
                                </span>
                                <span className="text-[11px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                    {uploadSummary.rxFlagged} Flagged as Prescription (Rx)
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {Object.entries(uploadSummary.categoryBreakdown || {}).map(([cat, count]) => (
                                    <span
                                        key={cat}
                                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                                            CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {cat}: <strong className="font-bold">{count}</strong>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tabs Navigation ── */}
                <div className="flex items-center justify-between border-b border-gray-200">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('staged')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                                activeTab === 'staged'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <span>Stage 1: Staging Queue (Drafts)</span>
                            <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    activeTab === 'staged'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {stagedTotal}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('live')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                                activeTab === 'live'
                                    ? 'border-green-600 text-green-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <span>Stage 2: Live Storefront Catalog</span>
                            <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    activeTab === 'live'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {liveTotal}
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={activeTab === 'staged' ? fetchStaged : fetchLive}
                        className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors pb-3"
                    >
                        <RefreshCw size={12} className={isLoadingStaged || isLoadingLive ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* ── Staging Sticky Action Bar (When in Staging) ── */}
                {activeTab === 'staged' && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shrink-0">
                                <ShieldAlert size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">
                                    {stagedTotal} Draft Medicines Waiting in Staging
                                </h4>
                                <p className="text-xs text-amber-700">
                                    Patients CANNOT see these medicines. Verify categories, prices, and Rx requirements below before publishing.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {stagedTotal > 0 && (
                                <button
                                    onClick={handleClearStaging}
                                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
                                >
                                    Discard Drafts
                                </button>
                            )}
                            <button
                                disabled={stagedTotal === 0}
                                onClick={() => setShowPublishModal(true)}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                                <Rocket size={14} />
                                <span>Publish to Live Storefront</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Search & Category Filter Bar ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by medicine name, salt composition, company or code..."
                                value={activeTab === 'staged' ? stagedSearch : liveSearch}
                                onChange={(e) => {
                                    if (activeTab === 'staged') {
                                        setStagedSearch(e.target.value)
                                        setStagedPage(1)
                                    } else {
                                        setLiveSearch(e.target.value)
                                        setLivePage(1)
                                    }
                                }}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 font-medium">Rows:</label>
                            <select
                                value={activeTab === 'staged' ? stagedLimit : liveLimit}
                                onChange={(e) => {
                                    const val = Number(e.target.value)
                                    if (activeTab === 'staged') {
                                        setStagedLimit(val)
                                        setStagedPage(1)
                                    } else {
                                        setLiveLimit(val)
                                        setLivePage(1)
                                    }
                                }}
                                className="border border-gray-200 rounded-xl px-2.5 py-2 text-xs outline-none focus:border-blue-500 bg-white"
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    {/* Category Filter Badges */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                        {ALL_CATEGORIES.map((cat) => {
                            const isSelected = (activeTab === 'staged' ? stagedCategory : liveCategory) === cat
                            const count = activeTab === 'staged' ? stagedCategoryCounts[cat] : null

                            return (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        if (activeTab === 'staged') {
                                            setStagedCategory(cat)
                                            setStagedPage(1)
                                        } else {
                                            setLiveCategory(cat)
                                            setLivePage(1)
                                        }
                                    }}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg font-medium transition-colors border text-[11px] flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    {count !== undefined && count !== null && (
                                        <span
                                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Interactive Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                                    <th className="py-3 px-4">Code</th>
                                    <th className="py-3 px-4 min-w-[220px]">Medicine Name &amp; Composition</th>
                                    <th className="py-3 px-4 min-w-[190px]">Category (Click to Change)</th>
                                    <th className="py-3 px-3 text-right">MRP (₹)</th>
                                    <th className="py-3 px-3 text-right">Selling Price (₹)</th>
                                    <th className="py-3 px-3 text-center">Stock</th>
                                    <th className="py-3 px-3 text-center">Rx Required</th>
                                    <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                        {/* Code */}
                                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                                            {item.itemCode}
                                        </td>

                                        {/* Name & Composition */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-white shadow-2xs flex items-center justify-center">
                                                    <MedicineImage medicine={item} aspectRatio="thumb" showGenuineBadge={false} className="w-full h-full" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-gray-900 text-xs truncate" title={item.name}>{item.name}</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1" title={item.salt}>
                                                        {item.salt || <span className="italic text-gray-400">No composition listed</span>}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{item.manufacturer}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Interactive Category Dropdown Pill */}
                                        <td className="py-3 px-4">
                                            <select
                                                value={item.category}
                                                onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                                                className={`text-[11px] font-semibold py-1 px-2.5 rounded-lg border outline-none cursor-pointer transition-all ${
                                                    CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}
                                            >
                                                {ALL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                                                    <option key={cat} value={cat} className="bg-white text-gray-800">
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* MRP */}
                                        <td className="py-3 px-3 text-right">
                                            <input
                                                type="number"
                                                step="0.5"
                                                defaultValue={item.mrp}
                                                onBlur={(e) => handleUpdateItem(item.id, 'mrp', e.target.value)}
                                                className="w-18 text-right px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                                            />
                                        </td>

                                        {/* Selling Price */}
                                        <td className="py-3 px-3 text-right">
                                            <input
                                                type="number"
                                                step="0.5"
                                                defaultValue={item.sellingPrice || item.price}
                                                onBlur={(e) => handleUpdateItem(item.id, 'sellingPrice', e.target.value)}
                                                className="w-18 text-right font-semibold text-blue-700 px-2 py-1 border border-blue-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-blue-50/40"
                                            />
                                        </td>

                                        {/* Stock */}
                                        <td className="py-3 px-3 text-center">
                                            <input
                                                type="number"
                                                defaultValue={item.stock}
                                                onBlur={(e) => handleUpdateItem(item.id, 'stock', e.target.value)}
                                                className={`w-14 text-center px-1.5 py-1 border rounded-lg text-xs outline-none focus:border-blue-500 ${
                                                    item.stock <= 0
                                                        ? 'border-red-300 text-red-600 bg-red-50'
                                                        : item.stock <= (item.minStock || 15)
                                                        ? 'border-orange-300 text-orange-600 bg-orange-50'
                                                        : 'border-gray-200 text-gray-800 bg-white'
                                                }`}
                                            />
                                        </td>

                                        {/* Rx Required Toggle Pill */}
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateItem(
                                                        item.id,
                                                        'requires_rx',
                                                        !(item.requires_rx || item.requiresPrescription)
                                                    )
                                                }
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                                    item.requires_rx || item.requiresPrescription
                                                        ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                                        : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                                }`}
                                                title="Click to toggle Prescription requirement"
                                            >
                                                {item.requires_rx || item.requiresPrescription ? '⚡ Rx Required' : '✓ OTC'}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleDeleteItem(item.id, item.name)}
                                                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                title="Remove medicine"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-gray-400">
                                            <Pill size={36} className="mx-auto mb-2 text-gray-200" />
                                            <p className="font-semibold text-gray-600 text-sm">
                                                No medicines found in {activeTab === 'staged' ? 'Staging' : 'Live Catalog'}.
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {activeTab === 'staged'
                                                    ? 'Upload a distributor CSV above or download the sample CSV to begin.'
                                                    : 'Publish verified draft medicines from the Staging queue to display here.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>
                            Showing{' '}
                            <strong>{currentItems.length > 0 ? (currentPage - 1) * currentLimit + 1 : 0}</strong>{' '}
                            to{' '}
                            <strong>{Math.min(currentPage * currentLimit, currentTotal)}</strong> of{' '}
                            <strong>{currentTotal}</strong> items
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => {
                                    if (activeTab === 'staged') setStagedPage((p) => Math.max(1, p - 1))
                                    else setLivePage((p) => Math.max(1, p - 1))
                                }}
                                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <span className="font-medium text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => {
                                    if (activeTab === 'staged') setStagedPage((p) => Math.min(totalPages, p + 1))
                                    else setLivePage((p) => Math.min(totalPages, p + 1))
                                }}
                                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Publish Confirmation Modal ── */}
                {showPublishModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-700 font-bold text-base">
                                    <Rocket size={20} />
                                    <h3>Publish to Patient Storefront</h3>
                                </div>
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed">
                                You are about to publish <strong className="text-gray-900 font-bold">{stagedTotal}</strong> staged medicine(s) to the public storefront at{' '}
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">/medicines</code>.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                                <p className="font-semibold">What happens after publishing:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-blue-700 text-[11px]">
                                    <li>Patients can immediately search, browse, and order these medicines.</li>
                                    <li>Prescription flags (Rx) and auto-assigned categories become active.</li>
                                    <li>Staging queue is cleared and moved to Live Catalog.</li>
                                </ul>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPublishModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-50 transition-colors"
                                >
                                    Cancel &amp; Continue Reviewing
                                </button>
                                <button
                                    type="button"
                                    disabled={isPublishing}
                                    onClick={handlePublishAll}
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                    {isPublishing ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Publishing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Rocket size={14} />
                                            <span>Confirm &amp; Publish</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
