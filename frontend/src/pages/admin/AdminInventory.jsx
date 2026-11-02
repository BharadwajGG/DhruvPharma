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
    EyeOff,
    Pill,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    Loader2,
    Pencil,
    Check,
    Plus,
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
    const [editingNameId, setEditingNameId] = useState(null)
    const [editingNameValue, setEditingNameValue] = useState('')

    // CSV Ingestion Strategy Modal State
    const [pendingFile, setPendingFile] = useState(null)
    const [showUploadModeModal, setShowUploadModeModal] = useState(false)
    const [uploadMode, setUploadMode] = useState('merge') // 'merge' or 'replace'
    const [mergeStrategy, setMergeStrategy] = useState('keep_live') // 'keep_live' or 'send_to_drafts'
    const [uploadPublishImmediately, setUploadPublishImmediately] = useState(false)

    // Add Medicine Modal State
    const [showAddMedicineModal, setShowAddMedicineModal] = useState(false)
    const [isSubmittingMedicine, setIsSubmittingMedicine] = useState(false)
    const [addMedicineForm, setAddMedicineForm] = useState({
        itemCode: '',
        name: '',
        company: '',
        salt: '',
        category: 'General Healthcare',
        mrp: '',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '25',
        minStock: '15',
        requiresPrescription: false,
        isPublished: true,
        isVisible: true,
    })

    // Fetch Staged Items
    const fetchStaged = async () => {
        setIsLoadingStaged(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        try {
            const params = new URLSearchParams({
                page: stagedPage,
                limit: stagedLimit,
                search: stagedSearch,
                category: stagedCategory,
            })
            const res = await fetch(`http://localhost:8000/api/inventory/staged?${params}`, {
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
            if (res.ok) {
                const data = await res.json()
                setStagedItems(data.items || [])
                setStagedTotal(data.total || 0)
                setStagedCategoryCounts(data.categoryCounts || {})
            }
        } catch (err) {
            console.warn('Staged inventory fetch timed out or unavailable:', err)
        } finally {
            clearTimeout(timeoutId)
            setIsLoadingStaged(false)
        }
    }

    // Fetch Live Store Catalog
    const fetchLive = async () => {
        setIsLoadingLive(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        try {
            const params = new URLSearchParams({
                page: livePage,
                limit: liveLimit,
                search: liveSearch,
                category: liveCategory,
            })
            const res = await fetch(`http://localhost:8000/api/inventory/live?${params}`, {
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
            if (res.ok) {
                const data = await res.json()
                setLiveItems(data.items || [])
                setLiveTotal(data.total || 0)
            }
        } catch (err) {
            console.warn('Live inventory fetch timed out or unavailable:', err)
        } finally {
            clearTimeout(timeoutId)
            setIsLoadingLive(false)
        }
    }

    useEffect(() => {
        fetchStaged()
    }, [stagedPage, stagedLimit, stagedSearch, stagedCategory])

    useEffect(() => {
        fetchLive()
    }, [livePage, liveLimit, liveSearch, liveCategory])

    // Step 1: When user selects/drops CSV file, trigger Choice Strategy Modal
    const handleFileSelected = (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
            alert('Please select a valid CSV file (.csv)')
            return
        }
        setPendingFile(file)
        setUploadMode('merge')
        setMergeStrategy('keep_live')
        setUploadPublishImmediately(false)
        setShowUploadModeModal(true)
    }

    // Step 2: Ingest CSV with chosen strategy (Merge vs Replace)
    const handleExecuteUpload = async () => {
        if (!pendingFile) return
        setIsUploading(true)
        setUploadSummary(null)
        setFeedbackMsg(null)
        setShowUploadModeModal(false)

        const formData = new FormData()
        formData.append('file', pendingFile)
        formData.append('mode', uploadMode)
        formData.append('update_strategy', mergeStrategy)
        formData.append('publish_immediately', uploadPublishImmediately)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        try {
            const res = await fetch('http://localhost:8000/api/inventory/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.detail || 'Upload failed.')
            }

            setUploadSummary(data.stats)
            setFeedbackMsg({ type: 'success', text: data.message })

            // Broadcast real-time catalog update to any open storefront windows or components
            try {
                window.dispatchEvent(new CustomEvent('catalog-updated', { detail: data }))
            } catch (e) {}

            if (uploadPublishImmediately || (uploadMode === 'merge' && mergeStrategy === 'keep_live' && (!data.stats || data.stats.created === 0))) {
                setActiveTab('live')
                setLivePage(1)
            } else {
                setActiveTab('staged')
                setStagedPage(1)
            }
            fetchStaged()
            fetchLive()
        } catch (err) {
            console.error('Upload error:', err)
            setFeedbackMsg({
                type: 'error',
                text: err.name === 'AbortError'
                    ? 'Upload took too long. Please verify the CSV size.'
                    : (err.message || 'Failed to upload and parse distributor CSV.')
            })
        } finally {
            clearTimeout(timeoutId)
            setIsUploading(false)
            setPendingFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Inline Update Item Handler (Supports Category, Price, Stock, Rx, and Name)
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
        if (field === 'name') payload.name = String(value).trim()
        if (field === 'category') payload.category = value
        if (field === 'price' || field === 'sellingPrice') payload.selling_price = parseFloat(value) || 0
        if (field === 'mrp') payload.mrp = parseFloat(value) || 0
        if (field === 'stock') payload.stock_quantity = parseInt(value) || 0
        if (field === 'requires_rx' || field === 'requiresPrescription') payload.requires_prescription = Boolean(value)
        if (field === 'is_visible' || field === 'isVisible') payload.is_visible = Boolean(value)

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

    // Toggle Showcase / Hidden in live storefront
    const handleToggleVisibility = async (itemId, currentVal) => {
        const nextVal = !currentVal
        const updater = (prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, isVisible: nextVal, is_visible: nextVal } : item))

        if (activeTab === 'staged') {
            setStagedItems(updater)
        } else {
            setLiveItems(updater)
        }

        try {
            const res = await fetch(`http://localhost:8000/api/inventory/${itemId}/toggle-visibility`, {
                method: 'PATCH',
            })
            const data = await res.json()
            if (res.ok) {
                setFeedbackMsg({
                    type: 'success',
                    text: data.message || `Medicine visibility updated.`,
                })
                setTimeout(() => setFeedbackMsg(null), 3000)
            }
        } catch (err) {
            console.error('Toggle visibility network error:', err)
        }
    }

    // Save edited medicine name handler
    const handleSaveName = async (itemId) => {
        const trimmed = editingNameValue.trim()
        if (!trimmed) {
            setEditingNameId(null)
            return
        }
        setEditingNameId(null)
        await handleUpdateItem(itemId, 'name', trimmed)
        setFeedbackMsg({
            type: 'success',
            text: `Medicine renamed to "${trimmed}" in ${activeTab === 'staged' ? 'draft staging' : 'live catalog'}!`,
        })
        setTimeout(() => setFeedbackMsg(null), 3000)
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
                try {
                    window.dispatchEvent(new CustomEvent('catalog-updated', { detail: data }))
                } catch (e) {}
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

    // Open Add Medicine Modal
    const handleOpenAddMedicineModal = () => {
        setAddMedicineForm({
            itemCode: '',
            name: '',
            company: '',
            salt: '',
            category: 'General Healthcare',
            mrp: '',
            costPrice: '',
            sellingPrice: '',
            stockQuantity: '25',
            minStock: '15',
            requiresPrescription: false,
            isPublished: activeTab === 'live',
            isVisible: true,
        })
        setShowAddMedicineModal(true)
    }

    // Submit Add Medicine Form
    const handleSubmitAddMedicine = async (e) => {
        e.preventDefault()
        if (!addMedicineForm.name.trim()) {
            alert('Please enter medicine name.')
            return
        }

        const mrpNum = parseFloat(addMedicineForm.mrp) || 0
        const costNum = parseFloat(addMedicineForm.costPrice) || 0
        let sellNum = parseFloat(addMedicineForm.sellingPrice) || 0

        // If selling price not entered, pass undefined so backend calculates based on active Category Pricing Rules
        const finalSellingPrice = sellNum > 0 ? sellNum : undefined

        setIsSubmittingMedicine(true)
        try {
            const payload = {
                itemCode: addMedicineForm.itemCode.trim() || undefined,
                name: addMedicineForm.name.trim(),
                company: addMedicineForm.company.trim(),
                salt: addMedicineForm.salt.trim(),
                category: addMedicineForm.category,
                mrp: mrpNum,
                costPrice: costNum,
                sellingPrice: finalSellingPrice,
                stockQuantity: parseInt(addMedicineForm.stockQuantity) || 0,
                minStock: parseInt(addMedicineForm.minStock) || 15,
                requiresPrescription: Boolean(addMedicineForm.requiresPrescription),
                isPublished: Boolean(addMedicineForm.isPublished),
                isVisible: Boolean(addMedicineForm.isVisible),
            }

            const res = await fetch('http://localhost:8000/api/inventory/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to add medicine.')
            }

            setShowAddMedicineModal(false)
            setFeedbackMsg({ type: 'success', text: data.message })
            if (payload.isPublished) {
                setActiveTab('live')
                fetchLive()
            } else {
                setActiveTab('staged')
                fetchStaged()
            }
        } catch (err) {
            console.error('Add medicine error:', err)
            alert(err.message || 'Error adding medicine.')
        } finally {
            setIsSubmittingMedicine(false)
        }
    }

    // Export Catalog CSV
    const handleExportCatalogCSV = () => {
        window.open('http://localhost:8000/api/inventory/export-csv', '_blank')
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
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-slate-900">Medicine Stock &amp; Catalog</h1>
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                                <Sparkles size={13} /> Smart Category Assistant
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Upload distributor CSV files, review medicine details and prices, and put medicines into the live customer store.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* + Add Medicine Button */}
                        <button
                            type="button"
                            onClick={handleOpenAddMedicineModal}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={15} />
                            <span>+ Add Medicine</span>
                        </button>

                        {/* Export Catalog CSV */}
                        <button
                            type="button"
                            onClick={handleExportCatalogCSV}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Export all inventory medicines to CSV spreadsheet"
                        >
                            <Download size={14} className="text-blue-600" />
                            <span>Export CSV</span>
                        </button>

                        {/* Quick Sample CSV Download */}
                        <a
                            href="http://localhost:8000/api/inventory/sample-csv"
                            download="DHRUV_PHARMA_DISTRIBUTOR_SAMPLE.csv"
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs shrink-0"
                        >
                            <Download size={14} className="text-emerald-700" />
                            <span>Sample CSV</span>
                        </a>
                    </div>
                </div>

                {/* ── Feedback Banner ── */}
                {feedbackMsg && (
                    <div
                        className={`p-4 rounded-xl flex items-start gap-3 border text-sm transition-all ${
                            feedbackMsg.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : feedbackMsg.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {feedbackMsg.type === 'success' ? (
                            <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : feedbackMsg.type === 'error' ? (
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                            <Pill size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 font-semibold">{feedbackMsg.text}</div>
                        <button
                            onClick={() => setFeedbackMsg(null)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* ── CSV Upload Dropzone ── */}
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
                            handleFileSelected(e.dataTransfer.files[0])
                        }
                    }}
                    className={`rounded-2xl border-2 border-dashed p-6 transition-all text-center relative ${
                        isDragging
                            ? 'border-emerald-500 bg-emerald-50/70 scale-[1.005]'
                            : 'border-slate-200 bg-white hover:border-emerald-300 shadow-xs'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFileSelected(e.target.files[0])
                            }
                        }}
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                                {isUploading ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <FileSpreadsheet size={24} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">
                                    {isUploading
                                        ? 'Reading & Organizing Distributor File...'
                                        : 'Upload Distributor Medicine File (.CSV)'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Supports CSV exports from Marg ERP, Busy, or Excel spreadsheets. Salts and categories are assigned automatically.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <Upload size={14} />
                                <span>{isUploading ? 'Uploading...' : 'Select CSV File'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Instant Parsing Breakdown Summary */}
                    {uploadSummary && (
                        <div className="mt-5 pt-4 border-t border-slate-100 text-left bg-emerald-50/40 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <CheckCircle size={15} className="text-emerald-600" />
                                    Upload Finished: {uploadSummary.totalParsed} Medicines Ready in Drafts
                                </span>
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                    {uploadSummary.rxFlagged} Require Doctor Prescription
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {Object.entries(uploadSummary.categoryBreakdown || {}).map(([cat, count]) => (
                                    <span
                                        key={cat}
                                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                            CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-700'
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
                <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('staged')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                                activeTab === 'staged'
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>New Uploads (Drafts)</span>
                            <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    activeTab === 'staged'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {stagedTotal}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('live')}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                                activeTab === 'live'
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>Store Catalog (Live)</span>
                            <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    activeTab === 'live'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {liveTotal}
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={activeTab === 'staged' ? fetchStaged : fetchLive}
                        className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 transition-colors pb-3 font-semibold cursor-pointer"
                    >
                        <RefreshCw size={12} className={isLoadingStaged || isLoadingLive ? 'animate-spin' : ''} />
                        Refresh List
                    </button>
                </div>

                {/* ── Staging Action Bar (When in Drafts) ── */}
                {activeTab === 'staged' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                <ShieldAlert size={19} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-950">
                                    {stagedTotal} Draft Medicines Waiting for Approval
                                </h4>
                                <p className="text-xs text-amber-800">
                                    Customers cannot see these draft medicines yet. You can edit names, prices, or categories below, then click &ldquo;Put in Store&rdquo;.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            {stagedTotal > 0 && (
                                <button
                                    onClick={handleClearStaging}
                                    className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
                                >
                                    Clear Drafts
                                </button>
                            )}
                            <button
                                disabled={stagedTotal === 0}
                                onClick={() => setShowPublishModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Rocket size={14} />
                                <span>Put in Store (Publish All)</span>
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
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3 px-4">Item Code</th>
                                    <th className="py-3 px-4 min-w-[220px]">Medicine Name &amp; Salt</th>
                                    <th className="py-3 px-4 min-w-[190px]">Category</th>
                                    <th className="py-3 px-3 text-right">MRP (₹)</th>
                                    <th className="py-3 px-3 text-right">Selling Price (₹)</th>
                                    <th className="py-3 px-3 text-center">Stock Qty</th>
                                    <th className="py-3 px-3 text-center">Doctor Rx Needed?</th>
                                    <th className="py-3 px-3 text-center">Show in Store?</th>
                                    <th className="py-3 px-4 text-center">Remove</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Code */}
                                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                            {item.itemCode}
                                        </td>

                                        {/* Name & Composition (Editable) */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-white shadow-2xs flex items-center justify-center">
                                                    <MedicineImage medicine={item} aspectRatio="thumb" showGenuineBadge={false} className="w-full h-full" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    {editingNameId === item.id ? (
                                                        <div className="flex items-center gap-1.5 my-0.5">
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={editingNameValue}
                                                                onChange={(e) => setEditingNameValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveName(item.id)
                                                                    if (e.key === 'Escape') setEditingNameId(null)
                                                                }}
                                                                className="w-full px-2 py-1 text-xs font-bold border-2 border-emerald-600 rounded-lg outline-none bg-emerald-50/60 text-slate-900 shadow-xs"
                                                                placeholder="Edit medicine name..."
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveName(item.id)}
                                                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                                                                title="Save name"
                                                            >
                                                                <Check size={13} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingNameId(null)}
                                                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                                                                title="Cancel"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 group/name">
                                                            <p className="font-bold text-slate-900 text-xs truncate" title={item.name}>
                                                                {item.name}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingNameId(item.id)
                                                                    setEditingNameValue(item.name)
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-all cursor-pointer shrink-0"
                                                                title="Click pencil to edit medicine name"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1" title={item.salt}>
                                                        {item.salt || <span className="italic text-slate-400">No salt listed</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{item.manufacturer}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Interactive Category Dropdown Pill */}
                                        <td className="py-3 px-4">
                                            <select
                                                value={item.category}
                                                onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                                                className={`text-[11px] font-semibold py-1 px-2.5 rounded-lg border outline-none cursor-pointer transition-all ${
                                                    CATEGORY_COLORS[item.category] || 'bg-slate-100 text-slate-800 border-slate-200'
                                                }`}
                                            >
                                                {ALL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                                                    <option key={cat} value={cat} className="bg-white text-slate-800">
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
                                                className="w-18 text-right px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-600 bg-white"
                                            />
                                        </td>

                                        {/* Selling Price */}
                                        <td className="py-3 px-3 text-right">
                                            <input
                                                type="number"
                                                step="0.5"
                                                defaultValue={item.sellingPrice || item.price}
                                                onBlur={(e) => handleUpdateItem(item.id, 'sellingPrice', e.target.value)}
                                                className="w-18 text-right font-bold text-emerald-800 px-2 py-1 border border-emerald-200 rounded-lg text-xs outline-none focus:border-emerald-600 bg-emerald-50/30"
                                            />
                                        </td>

                                        {/* Stock */}
                                        <td className="py-3 px-3 text-center">
                                            <input
                                                type="number"
                                                defaultValue={item.stock}
                                                onBlur={(e) => handleUpdateItem(item.id, 'stock', e.target.value)}
                                                className={`w-14 text-center px-1.5 py-1 border rounded-lg text-xs outline-none focus:border-emerald-600 font-semibold ${
                                                    item.stock <= 0
                                                        ? 'border-rose-300 text-rose-600 bg-rose-50'
                                                        : item.stock <= (item.minStock || 15)
                                                        ? 'border-amber-300 text-amber-700 bg-amber-50'
                                                        : 'border-slate-200 text-slate-800 bg-white'
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
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                                    item.requires_rx || item.requiresPrescription
                                                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                }`}
                                                title="Click to toggle Prescription requirement"
                                            >
                                                {item.requires_rx || item.requiresPrescription ? 'Yes (Rx Required)' : 'No (Without Rx)'}
                                            </button>
                                        </td>

                                        {/* Showcase / Hide Toggle Pill */}
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            {(() => {
                                                const isVis = item.isVisible !== false && item.is_visible !== false
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleVisibility(item.id, isVis)}
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                                            isVis
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                                                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                                        }`}
                                                        title={
                                                            isVis
                                                                ? 'Currently visible on customer storefront. Click to hide.'
                                                                : 'Currently hidden from customer storefront. Click to showcase.'
                                                        }
                                                    >
                                                        {isVis ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-slate-400" />}
                                                        <span>{isVis ? 'Visible' : 'Hidden'}</span>
                                                    </button>
                                                )
                                            })()}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleDeleteItem(item.id, item.name)}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Remove medicine"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-slate-400">
                                            <Pill size={36} className="mx-auto mb-2 text-slate-300" />
                                            <p className="font-bold text-slate-600 text-sm">
                                                No medicines found in {activeTab === 'staged' ? 'New Uploads (Drafts)' : 'Store Catalog (Live)'}.
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {activeTab === 'staged'
                                                    ? 'Upload a distributor CSV file above to begin adding medicines.'
                                                    : 'Put draft medicines into the store from the New Uploads tab to display them here.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Showing{' '}
                            <strong>{currentItems.length > 0 ? (currentPage - 1) * currentLimit + 1 : 0}</strong>{' '}
                            to{' '}
                            <strong>{Math.min(currentPage * currentLimit, currentTotal)}</strong> of{' '}
                            <strong>{currentTotal}</strong> medicines
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => {
                                    if (activeTab === 'staged') setStagedPage((p) => Math.max(1, p - 1))
                                    else setLivePage((p) => Math.max(1, p - 1))
                                }}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <span className="font-semibold text-slate-700">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => {
                                    if (activeTab === 'staged') setStagedPage((p) => Math.min(totalPages, p + 1))
                                    else setLivePage((p) => Math.min(totalPages, p + 1))
                                }}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
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
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                                    <Rocket size={20} />
                                    <h3>Put Medicines in Live Store</h3>
                                </div>
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                                You are about to make <strong className="text-slate-900 font-bold">{stagedTotal}</strong> draft medicines available on the Dhruv Pharma website for customers to buy online.
                            </p>

                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1">
                                <p className="font-bold">What happens next:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-emerald-800 text-[11px]">
                                    <li>Customers can immediately search, view, and order these medicines.</li>
                                    <li>Prescription rules and categories will be live.</li>
                                    <li>Drafts will move into your Live Store Catalog.</li>
                                </ul>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPublishModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isPublishing}
                                    onClick={handlePublishAll}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                    {isPublishing ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Putting in Store...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Rocket size={14} />
                                            <span>Confirm &amp; Put in Store</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* ── Add Medicine to Inventory Modal ── */}
                {showAddMedicineModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl relative max-h-[92vh] flex flex-col">
                            {/* Close */}
                            <button
                                type="button"
                                onClick={() => setShowAddMedicineModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Plus size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Add Medicine to Inventory</h3>
                                    <p className="text-xs text-slate-500">
                                        Fill in all columns matching the distributor CSV &amp; live catalog chart
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitAddMedicine} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                                {/* 1. Basic Medicine Info */}
                                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                        <Pill size={14} className="text-emerald-700" />
                                        <span>1. Medicine Identification</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="sm:col-span-2">
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Medicine Name &amp; Pack Details <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. AUGMENTIN 625 DUO TAB (10 Tablets / Strip)"
                                                value={addMedicineForm.name}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, name: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Item Code <span className="text-slate-400 font-normal">(optional - auto generated)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. ITM-1025 or 002574"
                                                value={addMedicineForm.itemCode}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, itemCode: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Company / Manufacturer
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. GlaxoSmithKline, Cipla, Abbott"
                                                value={addMedicineForm.company}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, company: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Salt Composition / Generic Formulation
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. AMOXYCILLIN 500MG + CLAVULANIC ACID 125MG"
                                                value={addMedicineForm.salt}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, salt: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block font-semibold text-slate-700 mb-1">Category</label>
                                            <select
                                                value={addMedicineForm.category}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, category: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold"
                                            >
                                                {ALL_CATEGORIES.filter(c => c !== 'All').map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Pricing & Stock Columns */}
                                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                        <FileSpreadsheet size={14} className="text-blue-600" />
                                        <span>2. Pricing &amp; Inventory Columns</span>
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                M.R.P. (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 223.50"
                                                value={addMedicineForm.mrp}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, mrp: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-xs"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Cost Rate (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 175.20"
                                                value={addMedicineForm.costPrice}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, costPrice: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Selling Price (₹)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Auto (Category Rule)"
                                                value={addMedicineForm.sellingPrice}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, sellingPrice: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-100 font-bold text-emerald-700 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">
                                                Stock Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 50"
                                                value={addMedicineForm.stockQuantity}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, stockQuantity: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-xs"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        💡 If selling price is left blank, it will be automatically calculated according to your active Pricing &amp; Margins rules.
                                    </p>
                                </div>

                                {/* 3. Compliance & Publishing Settings */}
                                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldAlert size={14} className="text-purple-600" />
                                        <span>3. Prescription &amp; Storefront Controls</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={addMedicineForm.requiresPrescription}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, requiresPrescription: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                            />
                                            <span className="font-semibold text-slate-700 text-xs">
                                                Requires Doctor Rx
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={addMedicineForm.isPublished}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, isPublished: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                            />
                                            <span className="font-semibold text-slate-700 text-xs">
                                                Put in Live Catalog
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={addMedicineForm.isVisible}
                                                onChange={(e) => setAddMedicineForm({ ...addMedicineForm, isVisible: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                            />
                                            <span className="font-semibold text-slate-700 text-xs">
                                                Show in Customer Store
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingMedicine}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer"
                                >
                                    {isSubmittingMedicine ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Adding Medicine to Inventory...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            <span>Save &amp; Add Medicine to Inventory</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {/* ── Modal: Choose CSV Ingestion Strategy (Merge vs Fresh Start) ── */}
                {showUploadModeModal && pendingFile && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Choose CSV Import Strategy</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Choose how you want to handle existing catalog data
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUploadModeModal(false)
                                        setPendingFile(null)
                                    }}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Selected File Chip */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <FileSpreadsheet size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{pendingFile.name}</p>
                                    <p className="text-[11px] text-slate-500">{(pendingFile.size / 1024).toFixed(1)} KB · CSV File</p>
                                </div>
                            </div>

                            {/* Mode Options */}
                            <div className="space-y-3">
                                {/* Option 1: Merge */}
                                <div
                                    onClick={() => setUploadMode('merge')}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                                        uploadMode === 'merge'
                                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="uploadStrategy"
                                        checked={uploadMode === 'merge'}
                                        onChange={() => setUploadMode('merge')}
                                        className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-900">Merge with Existing Catalog</span>
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Recommended
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Keeps your existing medicines safe. Updates prices, stock, real pack photos, and clinical data for matching medicines.
                                        </p>
                                        {uploadMode === 'merge' && (
                                            <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                                                <p className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                                                    Handling Existing Catalog Medicines:
                                                </p>
                                                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/90 border border-emerald-200 cursor-pointer hover:bg-white transition-all">
                                                    <input
                                                        type="radio"
                                                        name="mergeSubStrategy"
                                                        checked={mergeStrategy === 'keep_live'}
                                                        onChange={() => setMergeStrategy('keep_live')}
                                                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-slate-800">Keep Live in Store (Recommended)</span>
                                                        <p className="text-[11px] text-slate-500 leading-normal">Updates rates, stock & photos directly on live store shelves. Only brand-new medicines go to Drafts.</p>
                                                    </div>
                                                </label>
                                                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/90 border border-emerald-200 cursor-pointer hover:bg-white transition-all">
                                                    <input
                                                        type="radio"
                                                        name="mergeSubStrategy"
                                                        checked={mergeStrategy === 'send_to_drafts'}
                                                        onChange={() => setMergeStrategy('send_to_drafts')}
                                                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-slate-800">Send All to Drafts for Review</span>
                                                        <p className="text-[11px] text-slate-500 leading-normal">Moves both updated and new medicines to Drafts so you can inspect all changes before publishing.</p>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Option 2: Fresh Start (Replace) */}
                                <div
                                    onClick={() => setUploadMode('replace')}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                                        uploadMode === 'replace'
                                            ? 'border-amber-600 bg-amber-50/40 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="uploadStrategy"
                                        checked={uploadMode === 'replace'}
                                        onChange={() => setUploadMode('replace')}
                                        className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-900">Fresh Start (Replace Catalog)</span>
                                            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                New File
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Wipes out the existing medicine list and replaces it entirely with the medicines from this new CSV file. Perfect when uploading a brand new master stock sheet.
                                        </p>
                                        {uploadMode === 'replace' && (
                                            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300/80 text-[11px] text-amber-900 flex items-start gap-2">
                                                <AlertCircle size={14} className="shrink-0 text-amber-700 mt-0.5" />
                                                <span>
                                                    <strong>Safe Notice:</strong> Historical customer orders and invoices are preserved. Only the medicine catalog items will be replaced.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Immediate Publish Checkbox */}
                            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={uploadPublishImmediately}
                                    onChange={(e) => setUploadPublishImmediately(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                />
                                <div className="text-xs">
                                    <span className="font-bold text-slate-800">Publish directly to Live Customer Storefront</span>
                                    <p className="text-[11px] text-slate-500">Skip the drafts queue and make medicines visible in the customer store immediately.</p>
                                </div>
                            </label>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUploadModeModal(false)
                                        setPendingFile(null)
                                    }}
                                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExecuteUpload}
                                    className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                                        uploadMode === 'replace'
                                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                    }`}
                                >
                                    <Upload size={14} />
                                    <span>
                                        {uploadMode === 'replace' ? 'Replace & Ingest CSV' : 'Merge & Ingest CSV'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
