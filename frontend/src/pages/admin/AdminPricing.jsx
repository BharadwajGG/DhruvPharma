import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    BadgePercent,
    ShieldCheck,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Sparkles,
    TrendingUp,
    Info,
    HelpCircle,
    Pill,
    Layers,
    Sliders,
    ArrowRight,
    DollarSign,
} from 'lucide-react'

// Clinical guidance for Indian Chemist & Druggist retail trade margins
const CATEGORY_MARGIN_ADVISORY = {
    DEFAULT: {
        label: 'Default / Uncategorized',
        advice: 'Fallback rule applied to any medicine without a specific category.',
        typicalMargin: '16% – 20%',
        recommendedDiscount: 0,
        sampleMrp: 100,
        sampleCost: 82,
    },
    'Antibiotics & Infections': {
        label: 'Antibiotics & Anti-Infectives',
        advice: 'Tight DPCO / ethical manufacturer margin. Recommended 0% (Full MRP) or max 5% to avoid net losses.',
        typicalMargin: '16% DPCO',
        recommendedDiscount: 0,
        sampleMrp: 100,
        sampleCost: 84,
    },
    'Pain Relief & Fever': {
        label: 'Pain Relief & Fever (Analgesics)',
        advice: 'High-turnover daily essentials (e.g. Paracetamol, Dolo). Sell at Full MRP or 0%–5% to maximize daily volume profit.',
        typicalMargin: '16% – 20%',
        recommendedDiscount: 0,
        sampleMrp: 100,
        sampleCost: 82,
    },
    'Diabetes Care': {
        label: 'Diabetes Care (Anti-Diabetic)',
        advice: 'High-volume repeat monthly prescription patients. A 5% discount retains patients while ensuring profitable repeat orders.',
        typicalMargin: '18% – 20%',
        recommendedDiscount: 5,
        sampleMrp: 100,
        sampleCost: 80,
    },
    'Heart & Blood Pressure': {
        label: 'Heart & Blood Pressure (Cardiovascular)',
        advice: 'Chronic life-long therapy medicines. A modest 5% discount builds strong customer loyalty while protecting trade margins.',
        typicalMargin: '18% – 20%',
        recommendedDiscount: 5,
        sampleMrp: 100,
        sampleCost: 80,
    },
    'Acidity & Digestion': {
        label: 'Acidity, Reflux & Digestion (GI)',
        advice: 'High-demand antacids & PPIs (e.g. Omee, Pan-D). Safe for 5% discount.',
        typicalMargin: '20%',
        recommendedDiscount: 5,
        sampleMrp: 100,
        sampleCost: 78,
    },
    'Cold, Cough & Allergy': {
        label: 'Cold, Cough & Allergy (Respiratory)',
        advice: 'Seasonal OTC syrups and anti-histamines. 5% discount keeps prices competitive with online pharmacies.',
        typicalMargin: '20% – 25%',
        recommendedDiscount: 5,
        sampleMrp: 100,
        sampleCost: 76,
    },
    'Vitamins & Supplements': {
        label: 'Vitamins, Minerals & Supplements',
        advice: 'Highest distributor margins in retail pharmacy (30% to 50%). Allows safe 10% to 12% customer discounts.',
        typicalMargin: '30% – 45%',
        recommendedDiscount: 10,
        sampleMrp: 100,
        sampleCost: 65,
    },
    'Skin Care & Antiseptic': {
        label: 'Dermatology & Skin Care',
        advice: 'Ointments, antiseptic creams, and medicated soaps. 8% discount is both attractive and highly profitable.',
        typicalMargin: '25% – 30%',
        recommendedDiscount: 8,
        sampleMrp: 100,
        sampleCost: 72,
    },
    'General Healthcare': {
        label: 'General Healthcare & OTC',
        advice: 'Standard wellness & healthcare items. Default to 0% (Full MRP) or a modest 5% retail discount.',
        typicalMargin: '20%',
        recommendedDiscount: 0,
        sampleMrp: 100,
        sampleCost: 80,
    },
}

export default function AdminPricing() {
    const [rules, setRules] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [feedback, setFeedback] = useState(null)

    // Recalculate Catalog Modal State
    const [recalculateModalOpen, setRecalculateModalOpen] = useState(false)
    const [isRecalculating, setIsRecalculating] = useState(false)
    const [recalcSummary, setRecalcSummary] = useState(null)

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

    // Update rule in local state
    const handleUpdateRule = (category, field, value) => {
        setRules((prev) =>
            prev.map((r) => {
                if (r.category === category) {
                    return { ...r, [field]: value }
                }
                return r
            })
        )
    }

    // Save rules to backend
    const handleSaveRules = async () => {
        setIsSaving(true)
        setFeedback(null)
        try {
            const payload = {
                rules: rules.map((r) => ({
                    category: r.category,
                    discount_pct: parseFloat(r.discountPct ?? r.discount_pct) || 0.0,
                    min_margin_pct: parseFloat(r.minMarginPct ?? r.min_margin_pct) || 5.0,
                    enabled: Boolean(r.enabled),
                    notes: r.notes || '',
                })),
            }

            const res = await fetch('http://localhost:8000/api/admin/pricing-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok) {
                setFeedback({
                    type: 'success',
                    text: 'Pricing rules saved successfully! Future CSV imports will automatically use these profit-protecting rates.',
                })
                setRules(data.rules)
            } else {
                throw new Error(data.detail || 'Failed to save pricing rules.')
            }
        } catch (err) {
            console.error('Save rules error:', err)
            setFeedback({ type: 'error', text: err.message || 'Error saving rules to server.' })
        } finally {
            setIsSaving(false)
        }
    }

    // Execute Catalog-Wide Recalculation
    const handleRecalculateCatalog = async () => {
        setIsRecalculating(true)
        setRecalcSummary(null)
        try {
            // First ensure current rules are saved
            await handleSaveRules()

            const res = await fetch('http://localhost:8000/api/admin/pricing-rules/recalculate-catalog', {
                method: 'POST',
            })
            const data = await res.json()
            if (res.ok) {
                setRecalcSummary(data)
                setFeedback({
                    type: 'success',
                    text: `All ${data.totalCatalog} medicines updated! ${data.updatedCount} selling prices were safely adjusted to match your current margin rules.`,
                })
                // Broadcast update so storefront tabs re-sync
                try {
                    window.dispatchEvent(new CustomEvent('catalog-updated'))
                } catch (e) {}
            } else {
                throw new Error(data.detail || 'Failed to recalculate catalog.')
            }
        } catch (err) {
            console.error('Recalculate error:', err)
            setFeedback({ type: 'error', text: err.message || 'Error updating catalog prices.' })
        } finally {
            setIsRecalculating(false)
        }
    }

    // Helper: calculate live simulated customer price and owner profit
    const calculateSimulation = (rule) => {
        const catInfo = CATEGORY_MARGIN_ADVISORY[rule.category] || CATEGORY_MARGIN_ADVISORY.DEFAULT
        const mrp = catInfo.sampleMrp
        const cost = catInfo.sampleCost
        const disc = parseFloat(rule.discountPct ?? rule.discount_pct) || 0.0
        const minMargin = parseFloat(rule.minMarginPct ?? rule.min_margin_pct) || 5.0

        // Discounted customer price
        let sellPrice = mrp * (1 - disc / 100)
        // Profit protection floor
        const floorPrice = cost * (1 + minMargin / 100)
        sellPrice = Math.max(sellPrice, floorPrice, cost)
        sellPrice = Math.min(sellPrice, mrp)
        sellPrice = Math.round(sellPrice * 100) / 100

        const profitRupees = Math.round((sellPrice - cost) * 100) / 100
        const marginPct = Math.round((profitRupees / sellPrice) * 1000) / 10

        return {
            mrp,
            cost,
            sellPrice,
            profitRupees,
            marginPct,
            isFloorProtected: sellPrice > mrp * (1 - disc / 100),
        }
    }

    const defaultRule = rules.find((r) => r.category === 'DEFAULT') || {
        category: 'DEFAULT',
        discountPct: 0.0,
        minMarginPct: 5.0,
    }

    return (
        <AdminLayout>
            <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
                {/* ── Top Header & Hero Actions ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                                <BadgePercent size={20} />
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Pricing &amp; Profit Margins
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Set custom discount rules by medicine category, safeguard your wholesale profits, and prevent selling below cost.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setRecalculateModalOpen(true)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Recalculate customer selling prices for all medicines in current catalog"
                        >
                            <RefreshCw size={14} className={isRecalculating ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
                            <span>Recalculate Catalog</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSaveRules}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-emerald-300 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <Save size={14} />
                            <span>{isSaving ? 'Saving Rules...' : 'Save Pricing Rules'}</span>
                        </button>
                    </div>
                </div>

                {/* ── Feedback Banner ── */}
                {feedback && (
                    <div
                        className={`p-4 rounded-xl flex items-start gap-3 border text-xs sm:text-sm transition-all ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                    >
                        {feedback.type === 'success' ? (
                            <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 font-semibold leading-relaxed">{feedback.text}</div>
                        <button
                            onClick={() => setFeedback(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── Metric Snapshot Highlights ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <Sliders size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default Fallback</p>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                                {defaultRule.discountPct ?? defaultRule.discount_pct}% OFF MRP
                            </p>
                            <span className="text-[10px] text-slate-500">Uncategorized medicines</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Profit Floor Guard</p>
                            <p className="text-base font-black text-emerald-700 mt-0.5">Cost + 5% Min</p>
                            <span className="text-[10px] text-slate-500">Zero selling below cost</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Layers size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories Mapped</p>
                            <p className="text-base font-black text-slate-900 mt-0.5">{rules.length} Categories</p>
                            <span className="text-[10px] text-slate-500">Tailored trade margins</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <DollarSign size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distributor CSV Priority</p>
                            <p className="text-base font-black text-indigo-700 mt-0.5">SellingPrice First</p>
                            <span className="text-[10px] text-slate-500">Respects custom rate sheets</span>
                        </div>
                    </div>
                </div>

                {/* ── Option 1: Global Store Policy (Fallback & Protection Floor) ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sliders size={16} className="text-blue-600" />
                                <span>Global Store Policy (Option 1)</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Sets the baseline discount when uploading medicines that do not fall under any specific category.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold self-start">
                            <Info size={13} />
                            <span>Storewide Baseline</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                        {/* Default Discount Input */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800">
                                    Default Medicine Discount (% OFF MRP)
                                </label>
                                <span className="text-xs font-black text-blue-600">
                                    {defaultRule.discountPct ?? defaultRule.discount_pct}% OFF
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    step="0.5"
                                    value={defaultRule.discountPct ?? defaultRule.discount_pct}
                                    onChange={(e) =>
                                        handleUpdateRule('DEFAULT', 'discountPct', Math.max(0, parseFloat(e.target.value) || 0))
                                    }
                                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {[0, 5, 8, 10].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleUpdateRule('DEFAULT', 'discountPct', val)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                                (defaultRule.discountPct ?? defaultRule.discount_pct) === val
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            {val === 0 ? '0% (Full MRP)' : `${val}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Setting to <strong>0% (Full MRP)</strong> guarantees medicines without a category discount are sold at standard retail printed MRP.
                            </p>
                        </div>

                        {/* Minimum Margin Floor Buffer */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800">
                                    Minimum Profit Margin Buffer (% over Wholesale Cost)
                                </label>
                                <span className="text-xs font-black text-emerald-700">
                                    +{defaultRule.minMarginPct ?? defaultRule.min_margin_pct}% Buffer
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    step="0.5"
                                    value={defaultRule.minMarginPct ?? defaultRule.min_margin_pct}
                                    onChange={(e) =>
                                        handleUpdateRule('DEFAULT', 'minMarginPct', Math.max(0, parseFloat(e.target.value) || 0))
                                    }
                                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {[2, 5, 8, 10].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleUpdateRule('DEFAULT', 'minMarginPct', val)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                                (defaultRule.minMarginPct ?? defaultRule.min_margin_pct) === val
                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            +{val}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Prevents negative margins. Even if a heavy discount is requested, selling price will never drop below wholesale cost price plus this safety buffer.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Option 2: Category-Wise Smart Margin Rules Table ── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                <BadgePercent size={17} className="text-emerald-600" />
                                <span>Category-Wise Smart Discount Rules (Option 2)</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Tailor customer discounts based on actual manufacturer trade margins to stay competitive while safeguarding your bottom line.
                            </p>
                        </div>
                        <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold self-start">
                            Live Trade Margin Guidelines
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3 px-4">Medicine Category</th>
                                    <th className="py-3 px-4">Trade Margin Advisory</th>
                                    <th className="py-3 px-4">Customer Discount (% OFF MRP)</th>
                                    <th className="py-3 px-4">Profit Floor Buffer</th>
                                    <th className="py-3 px-4 text-right">Live Profit Simulation (₹100 MRP)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rules
                                    .filter((r) => r.category !== 'DEFAULT')
                                    .map((rule) => {
                                        const advisory = CATEGORY_MARGIN_ADVISORY[rule.category] || CATEGORY_MARGIN_ADVISORY.DEFAULT
                                        const sim = calculateSimulation(rule)
                                        const currentDiscount = rule.discountPct ?? rule.discount_pct

                                        return (
                                            <tr key={rule.category} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Category Info */}
                                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-xs">{rule.category}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-normal block pl-4 mt-0.5">
                                                        {advisory.typicalMargin} Trade Margin
                                                    </span>
                                                </td>

                                                {/* Clinical Trade Guidance */}
                                                <td className="py-3.5 px-4 max-w-xs text-[11px] text-slate-500 leading-relaxed">
                                                    {advisory.advice}
                                                </td>

                                                {/* Discount Input & Presets */}
                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="50"
                                                                step="0.5"
                                                                value={currentDiscount}
                                                                onChange={(e) =>
                                                                    handleUpdateRule(
                                                                        rule.category,
                                                                        'discountPct',
                                                                        Math.max(0, parseFloat(e.target.value) || 0)
                                                                    )
                                                                }
                                                                className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 text-center"
                                                            />
                                                            <span className="text-xs font-semibold text-slate-600">% OFF</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {[0, 5, 8, 10, 12].map((preset) => (
                                                                <button
                                                                    key={preset}
                                                                    type="button"
                                                                    onClick={() => handleUpdateRule(rule.category, 'discountPct', preset)}
                                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                                                        currentDiscount === preset
                                                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    {preset === 0 ? 'MRP' : `${preset}%`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Margin Floor Buffer */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="25"
                                                            step="1"
                                                            value={rule.minMarginPct ?? rule.min_margin_pct}
                                                            onChange={(e) =>
                                                                handleUpdateRule(
                                                                    rule.category,
                                                                    'minMarginPct',
                                                                    Math.max(0, parseFloat(e.target.value) || 0)
                                                                )
                                                            }
                                                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none text-center focus:border-emerald-500"
                                                        />
                                                        <span className="text-[11px] text-slate-500 font-semibold">% min</span>
                                                    </div>
                                                </td>

                                                {/* Real-time Profit Simulation */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="inline-block bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-right min-w-[170px]">
                                                        <div className="text-[11px] text-slate-600">
                                                            Cust. Pays: <strong className="text-slate-900 font-bold">₹{sim.sellPrice}</strong>
                                                            {sim.sellPrice < sim.mrp ? (
                                                                <span className="text-emerald-700 ml-1">({sim.mrp - sim.sellPrice} off)</span>
                                                            ) : (
                                                                <span className="text-slate-400 ml-1">(Full MRP)</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] font-black text-emerald-700 mt-0.5">
                                                            Your Profit: ₹{sim.profitRupees} ({sim.marginPct}%)
                                                        </div>
                                                        {sim.isFloorProtected && (
                                                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full mt-1 inline-block">
                                                                Floor Guard Applied
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Bottom Save Action Bar ── */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Save Changes to Protect Store Margins</p>
                            <p className="text-[11px] text-slate-400">
                                Changes are saved immediately for all future distributor CSV uploads and manual inventory entries.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setRecalculateModalOpen(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                            Apply to Existing Catalog Now
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveRules}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                            <Save size={14} />
                            <span>{isSaving ? 'Saving Rules...' : 'Save Pricing Rules'}</span>
                        </button>
                    </div>
                </div>

                {/* ── Modal: Recalculate Catalog Confirmation ── */}
                {recalculateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                                <RefreshCw size={24} className={isRecalculating ? 'animate-spin' : ''} />
                            </div>

                            <div className="text-center">
                                <h3 className="text-base font-bold text-slate-900">
                                    Recalculate Entire Catalog Prices?
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    This will recalculate selling prices for all 2,450+ medicines currently in your store according to your active category rules.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between text-slate-700">
                                    <span>Antibiotics &amp; Injections:</span>
                                    <strong className="text-slate-900">Full MRP (0% OFF)</strong>
                                </div>
                                <div className="flex items-center justify-between text-slate-700">
                                    <span>Diabetes &amp; Heart Care:</span>
                                    <strong className="text-slate-900">5% OFF MRP</strong>
                                </div>
                                <div className="flex items-center justify-between text-slate-700">
                                    <span>Vitamins &amp; Supplements:</span>
                                    <strong className="text-slate-900">10% OFF MRP</strong>
                                </div>
                                <div className="flex items-center justify-between text-slate-700 border-t border-slate-200 pt-1.5 mt-1.5">
                                    <span>Minimum Margin Guarantee:</span>
                                    <strong className="text-emerald-700">Cost + 5% Floor</strong>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={isRecalculating}
                                    onClick={() => setRecalculateModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isRecalculating}
                                    onClick={async () => {
                                        await handleRecalculateCatalog()
                                        setRecalculateModalOpen(false)
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    {isRecalculating ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            <span>Updating Prices...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={14} />
                                            <span>Confirm &amp; Recalculate</span>
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
