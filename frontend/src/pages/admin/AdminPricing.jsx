import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    BadgePercent,
    ShieldCheck,
    Save,
    CheckCircle,
    AlertCircle,
    HelpCircle,
    Sliders,
    Sparkles,
    Check,
} from 'lucide-react'

// Simple real-life guidance for each medicine category
const CATEGORY_SIMPLE_GUIDE = {
    DEFAULT: {
        title: 'Other / General Medicines',
        tip: 'Applied to any medicine that does not have its own specific rule below.',
        recommended: 0,
        sampleMrp: 100,
        sampleCost: 82,
    },
    'Antibiotics & Infections': {
        title: 'Antibiotics & Injections',
        tip: 'Company margin is very small (16%). Recommended: 0% (Full MRP) or max 5% to avoid loss.',
        recommended: 0,
        sampleMrp: 100,
        sampleCost: 84,
    },
    'Pain Relief & Fever': {
        title: 'Pain Relief & Fever (e.g. Paracetamol, Dolo)',
        tip: 'Everyday high-demand medicines. Recommended: 0% (Full MRP) to maximize daily earnings.',
        recommended: 0,
        sampleMrp: 100,
        sampleCost: 82,
    },
    'Diabetes Care': {
        title: 'Diabetes Medicines',
        tip: 'Regular monthly repeat patients. A small 5% discount keeps patients coming back every month.',
        recommended: 5,
        sampleMrp: 100,
        sampleCost: 80,
    },
    'Heart & Blood Pressure': {
        title: 'BP & Heart Medicines',
        tip: 'Life-long daily medicines. Recommended 5% discount builds strong patient loyalty.',
        recommended: 5,
        sampleMrp: 100,
        sampleCost: 80,
    },
    'Acidity & Digestion': {
        title: 'Acidity & Gas (e.g. Omee, Pan-D)',
        tip: 'High-selling digestive capsules. Recommended: 5% discount.',
        recommended: 5,
        sampleMrp: 100,
        sampleCost: 78,
    },
    'Cold, Cough & Allergy': {
        title: 'Cough Syrups & Cold Tablets',
        tip: 'Seasonal medicines. Recommended: 5% discount.',
        recommended: 5,
        sampleMrp: 100,
        sampleCost: 76,
    },
    'Vitamins & Supplements': {
        title: 'Vitamins, Calcium & Energy Supplements',
        tip: 'Distributors give high profit margins (30%+). Safe to give 10% to 12% customer discount.',
        recommended: 10,
        sampleMrp: 100,
        sampleCost: 65,
    },
    'Skin Care & Antiseptic': {
        title: 'Skin Creams, Ointments & Soaps',
        tip: 'Good distributor margins. Recommended: 8% to 10% discount.',
        recommended: 8,
        sampleMrp: 100,
        sampleCost: 72,
    },
    'General Healthcare': {
        title: 'General Healthcare Items',
        tip: 'Daily health essentials. Recommended: 0% (Full MRP).',
        recommended: 0,
        sampleMrp: 100,
        sampleCost: 80,
    },
}

export default function AdminPricing() {
    const [rules, setRules] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [feedback, setFeedback] = useState(null)

    // Fetch existing pricing rules
    const fetchRules = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('http://localhost:8000/api/admin/pricing-rules')
            if (res.ok) {
                const data = await res.json()
                setRules(data)
            }
        } catch (err) {
            console.error('Failed to fetch pricing rules:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRules()
    }, [])

    // Update rule discount in local state
    const handleSetDiscount = (category, discountVal) => {
        const val = Math.max(0, Math.min(50, parseFloat(discountVal) || 0))
        setRules((prev) =>
            prev.map((r) => (r.category === category ? { ...r, discountPct: val, discount_pct: val } : r))
        )
    }

    // Save rules AND immediately apply to live store
    const handleSaveAndApply = async () => {
        setIsSaving(true)
        setFeedback(null)
        try {
            const payload = {
                apply_to_catalog: true, // Automatically recalculates all store medicines right now!
                rules: rules.map((r) => ({
                    category: r.category,
                    discount_pct: parseFloat(r.discountPct ?? r.discount_pct) || 0.0,
                    min_margin_pct: 5.0, // Safe wholesale floor buffer
                    enabled: true,
                })),
            }

            const res = await fetch('http://localhost:8000/api/admin/pricing-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()

            if (res.ok) {
                setRules(data.rules)
                setFeedback({
                    type: 'success',
                    text: `✅ Saved & Applied! Updated ${data.totalCatalog || 'all'} medicines in your live store. Customers will now see these exact prices!`,
                })

                // Notify all open tabs & storefront components to refresh their prices in real-time
                try {
                    window.dispatchEvent(new CustomEvent('catalog-updated', { detail: data }))
                } catch (e) {}
            } else {
                throw new Error(data.detail || 'Failed to update pricing rules.')
            }
        } catch (err) {
            console.error('Save error:', err)
            setFeedback({ type: 'error', text: err.message || 'Error updating store prices.' })
        } finally {
            setIsSaving(false)
        }
    }

    // Calculate customer price example for ₹100 medicine
    const getExample = (discountVal) => {
        const d = parseFloat(discountVal)
        if (d === -1) {
            return {
                mode: 'mrp',
                label: 'Full MRP (100%)',
                desc: 'Sold at printed MRP without discount',
                custPays: '₹100 (Full MRP)',
                custSaves: 'No Discount (0% OFF)',
            }
        }
        if (d === 0 || isNaN(d)) {
            return {
                mode: 'rate',
                label: 'CSV Distributor Rate',
                desc: 'Sells at CSV Rate (Auto % OFF)',
                custPays: 'CSV Rate (e.g. ₹75)',
                custSaves: 'Auto % OFF (e.g. 25% OFF)',
            }
        }
        const custPays = Math.round((100 * (1 - d / 100)) * 100) / 100
        const custSaves = Math.round((100 - custPays) * 100) / 100
        return {
            mode: 'custom',
            label: `${d}% OFF`,
            desc: `Customer saves ₹${custSaves} on ₹100`,
            custPays: `₹${custPays}`,
            custSaves: `Customer Saves ₹${custSaves} (${d}% OFF)`,
        }
    }

    // Helper to set all categories to a specific preset at once
    const handleSetAll = (preset) => {
        setRules((prev) =>
            prev.map((r) => ({
                ...r,
                discountPct: preset,
                discount_pct: preset,
            }))
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6 text-left max-w-5xl mx-auto pb-16">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 shadow-2xs">
                                <BadgePercent size={22} />
                            </span>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                    Medicine Pricing &amp; Profit Margins
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Control customer discounts and sell prices across all medicine categories.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAndApply}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-emerald-300 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                        <Save size={16} />
                        <span>{isSaving ? 'Updating Store Prices...' : 'Save & Apply to Store Now'}</span>
                    </button>
                </div>

                {/* ── Success / Error Notification ── */}
                {feedback && (
                    <div
                        className={`p-4 rounded-xl flex items-start gap-3 border text-xs sm:text-sm transition-all shadow-xs ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                        }`}
                    >
                        {feedback.type === 'success' ? (
                            <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 leading-relaxed">{feedback.text}</div>
                        <button
                            onClick={() => setFeedback(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── Simple How It Works Card ── */}
                <div className="bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 rounded-2xl border border-blue-200/70 p-5 text-slate-800 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                            <HelpCircle size={16} className="text-blue-700" />
                            <span>Pricing Rules Guide:</span>
                        </h2>
                        {/* 1-Click Batch Preset Buttons */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Setup:</span>
                            <button
                                type="button"
                                onClick={() => handleSetAll(0)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                            >
                                Set All to CSV Rate (Auto % OFF)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetAll(5)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                            >
                                Set All to 5% OFF
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed">
                        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                            <span className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                                <Check size={14} className="text-emerald-600" /> 1. CSV Rate (Default)
                            </span>
                            Customer buys at distributor <strong>Rate</strong> from CSV. Store automatically shows strikethrough MRP and dynamic % OFF (e.g. MRP ₹100, Rate ₹75 = <strong>25% OFF</strong>).
                        </div>
                        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                            <span className="font-bold text-blue-800 flex items-center gap-1.5 mb-1">
                                <BadgePercent size={14} className="text-blue-600" /> 2. Category % Discount
                            </span>
                            Customer gets a specific discount off printed MRP (e.g. 5% or 10% OFF), while never selling below your wholesale purchase rate.
                        </div>
                        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                                <ShieldCheck size={14} className="text-slate-500" /> 3. Full MRP (No Discount)
                            </span>
                            Sold at 100% printed MRP price without strikethrough or discount badge. Maximum earnings for low-margin items.
                        </div>
                    </div>
                </div>

                {/* ── Category Discount Cards ── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                        <h3 className="font-bold text-slate-900 text-sm">Category-Wise Rules:</h3>
                        <span className="text-xs text-slate-400">Live preview updates instantly</span>
                    </div>

                    {rules.map((rule) => {
                        const guide = CATEGORY_SIMPLE_GUIDE[rule.category] || CATEGORY_SIMPLE_GUIDE.DEFAULT
                        const currentDisc = rule.discountPct ?? rule.discount_pct ?? 0
                        const ex = getExample(currentDisc)

                        return (
                            <div
                                key={rule.category}
                                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Left: Category Header & Tip */}
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                                {guide.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                                                {rule.category}
                                            </span>
                                            {currentDisc === 0 && (
                                                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                    CSV Rate Active
                                                </span>
                                            )}
                                            {currentDisc === -1 && (
                                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                                    Full MRP
                                                </span>
                                            )}
                                            {currentDisc > 0 && (
                                                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                                    {currentDisc}% Store Discount
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-normal">
                                            💡 {guide.tip}
                                        </p>
                                    </div>

                                    {/* Right: Controls & Impact Box */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                                        {/* Segmented Preset Buttons */}
                                        <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 flex-wrap border border-slate-200/80">
                                            <button
                                                type="button"
                                                onClick={() => handleSetDiscount(rule.category, 0)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    currentDisc === 0
                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                        : 'text-slate-700 hover:bg-white/80'
                                                }`}
                                            >
                                                CSV Rate (Auto %)
                                            </button>
                                            {[5, 8, 10, 12].map((preset) => {
                                                const isSelected = currentDisc === preset
                                                return (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => handleSetDiscount(rule.category, preset)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-blue-600 text-white shadow-xs'
                                                                : 'text-slate-700 hover:bg-white/80'
                                                        }`}
                                                    >
                                                        {preset}%
                                                    </button>
                                                )
                                            })}
                                            <button
                                                type="button"
                                                onClick={() => handleSetDiscount(rule.category, -1)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    currentDisc === -1
                                                        ? 'bg-slate-800 text-white shadow-xs'
                                                        : 'text-slate-700 hover:bg-white/80'
                                                }`}
                                            >
                                                Full MRP
                                            </button>

                                            {/* Custom percentage input */}
                                            <div className="flex items-center bg-white rounded-lg px-2 py-0.5 border border-slate-200 ml-0.5">
                                                <input
                                                    type="number"
                                                    min="-1"
                                                    max="50"
                                                    step="0.5"
                                                    value={currentDisc}
                                                    onChange={(e) => handleSetDiscount(rule.category, e.target.value)}
                                                    className="w-10 text-xs font-bold text-slate-800 text-center outline-none bg-transparent"
                                                    title="Custom Discount %"
                                                />
                                                <span className="text-[11px] font-bold text-slate-400">%</span>
                                            </div>
                                        </div>

                                        {/* Impact Preview Pill */}
                                        <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-right min-w-[155px]">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                Customer Storefront
                                            </p>
                                            <p className="text-xs font-bold text-slate-900 mt-0.5">
                                                {ex.custPays}
                                            </p>
                                            <span className="text-[11px] font-bold text-emerald-700 block">
                                                {ex.custSaves}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Fixed Bottom Floating Bar ── */}
                <div className="sticky bottom-4 z-20 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Save &amp; Update Live Store</p>
                            <p className="text-[11px] text-slate-400">
                                Applies your pricing rules to all medicines in the customer store immediately.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAndApply}
                        disabled={isSaving}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                        <Save size={15} />
                        <span>{isSaving ? 'Updating Store Prices...' : 'Save & Apply to Store Now'}</span>
                    </button>
                </div>
            </div>
        </AdminLayout>
    )
}
