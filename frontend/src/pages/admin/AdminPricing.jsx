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

    return (
        <AdminLayout>
            <div className="space-y-6 text-left max-w-5xl mx-auto pb-16">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                                <BadgePercent size={22} />
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Medicine Pricing &amp; Discounts
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Choose how much discount customers get on each type of medicine. You are in 100% control of your profit.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAndApply}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-emerald-300 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 p-5 text-slate-800 space-y-3">
                    <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                        <HelpCircle size={17} className="text-blue-700" />
                        <span>How This Works (Simple &amp; Easy):</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed">
                        <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                            <span className="font-bold text-blue-900 block mb-0.5">1. CSV Rate (Default - Auto % OFF)</span>
                            Customer pays the distributor <strong>Rate</strong> from your CSV. The store automatically displays the exact discount off MRP (e.g. MRP ₹100, Rate ₹75 = 25% OFF).
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                            <span className="font-bold text-blue-900 block mb-0.5">2. Fixed % Discount (e.g. 5% or 10%)</span>
                            Applies a flat discount off printed MRP (e.g. ₹5 or ₹10 off on ₹100) while safeguarding that price never falls below your wholesale cost.
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                            <span className="font-bold text-blue-900 block mb-0.5">3. Full MRP (No Discount)</span>
                            Customer pays the 100% printed MRP price on the box without any discount cut line.
                        </div>
                    </div>
                </div>

                {/* ── Category Discount Cards ── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                        <h3 className="font-bold text-slate-900 text-sm">Choose Discounts by Medicine Category:</h3>
                        <span className="text-xs text-slate-400">Click a button or type your own percentage</span>
                    </div>

                    {rules.map((rule) => {
                        const guide = CATEGORY_SIMPLE_GUIDE[rule.category] || CATEGORY_SIMPLE_GUIDE.DEFAULT
                        const currentDisc = rule.discountPct ?? rule.discount_pct ?? 0
                        const ex = getExample(currentDisc)

                        return (
                            <div
                                key={rule.category}
                                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                {/* Category Name & Simple Tip */}
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                                            {guide.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                                            {rule.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-normal pl-4">
                                        💡 {guide.tip}
                                    </p>
                                </div>

                                {/* Discount Controls & Example Box */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 pl-4 md:pl-0">
                                    {/* Quick Selection Buttons */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => handleSetDiscount(rule.category, 0)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                currentDisc === 0
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            CSV Rate (Auto % OFF)
                                        </button>
                                        {[5, 8, 10, 12].map((preset) => {
                                            const isSelected = currentDisc === preset
                                            return (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => handleSetDiscount(rule.category, preset)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}
                                                >
                                                    {preset}% OFF
                                                </button>
                                            )
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => handleSetDiscount(rule.category, -1)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                currentDisc === -1
                                                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            Full MRP (0% OFF)
                                        </button>

                                        {/* Custom input */}
                                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                                            <input
                                                type="number"
                                                min="-1"
                                                max="50"
                                                step="0.5"
                                                value={currentDisc}
                                                onChange={(e) => handleSetDiscount(rule.category, e.target.value)}
                                                className="w-12 bg-transparent text-xs font-bold text-slate-900 text-center outline-none"
                                            />
                                            <span className="text-xs font-bold text-slate-500">%</span>
                                        </div>
                                    </div>

                                    {/* Customer Price Preview Pill */}
                                    <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-right min-w-[160px]">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                            Customer Pays
                                        </p>
                                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                                            {ex.custPays}
                                        </p>
                                        <span className="text-[11px] font-black text-emerald-700 block">
                                            {ex.custSaves}
                                        </span>
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
                            <p className="text-xs font-bold text-white">Ready to update your store prices?</p>
                            <p className="text-[11px] text-slate-400">
                                Clicking the button will apply your discounts to all medicines in the live store instantly.
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
