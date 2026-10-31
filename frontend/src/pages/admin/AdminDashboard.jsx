import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    FileText,
    ShoppingBag,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    RefreshCw,
    Clock,
    CheckCircle,
    BarChart3,
    Tag,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    IndianRupee,
    MapPin,
    CreditCard,
    Award,
    Check,
    X,
    Loader2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'reports' | 'coupons'
    const [orders, setOrders] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [salesReport, setSalesReport] = useState(null)
    const [coupons, setCoupons] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false)
    const [isLoadingReport, setIsLoadingReport] = useState(false)
    const [lastUpdated, setLastUpdated] = useState(new Date())

    // New Coupon Form state with comprehensive customization
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_amount: 0,
        max_discount: null,
        max_uses_total: null, // null = unlimited, 1 = single use total
        max_uses_per_user: 1, // 1 = 1 time per person
        is_active: true,
        show_in_cart: false, // Default: NOT showcased in cart unless owner opts in
    })
    const [isCreatingCoupon, setIsCreatingCoupon] = useState(false)
    const [couponMessage, setCouponMessage] = useState(null)

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [ordersRes, rxRes] = await Promise.all([
                fetch('http://localhost:8000/api/orders'),
                fetch('http://localhost:8000/api/prescriptions')
            ])

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json()
                setOrders(ordersData)
            }
            if (rxRes.ok) {
                const rxData = await rxRes.json()
                setPrescriptions(rxData)
            }
            setLastUpdated(new Date())
        } catch (err) {
            console.error('Failed to load dashboard metrics:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const loadSalesReport = async (silent = false) => {
        if (!silent && !salesReport) {
            setIsLoadingReport(true)
        }
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        try {
            const res = await fetch('http://localhost:8000/api/admin/sales-report', {
                signal: controller.signal,
            })
            clearTimeout(timeoutId)
            if (res.ok) {
                const data = await res.json()
                setSalesReport(data)
                return
            }
        } catch (err) {
            console.warn('Backend sales-report request timed out or unavailable:', err)
        } finally {
            clearTimeout(timeoutId)
            setIsLoadingReport(false)
        }

        // Resilient fallback: calculate instant financial analytics directly from current orders if server report unavailable
        setSalesReport((prev) => {
            if (prev) return prev
            const nonCancelled = (orders || []).filter((o) => (o.status || '').toLowerCase() !== 'cancelled')
            const totalRev = nonCancelled.reduce((sum, o) => sum + (Number(o.total_amount || o.totalAmount || 0)), 0)
            const delivered = (orders || []).filter((o) => (o.status || '').toLowerCase() === 'delivered').length
            const cancelled = (orders || []).filter((o) => (o.status || '').toLowerCase() === 'cancelled').length
            const pending = Math.max(0, (orders || []).length - delivered - cancelled)
            const avgVal = nonCancelled.length > 0 ? Math.round(totalRev / nonCancelled.length) : 0

            return {
                total_revenue: totalRev,
                totalRevenue: totalRev,
                total_orders: (orders || []).length,
                totalOrders: (orders || []).length,
                delivered_orders: delivered,
                deliveredOrders: delivered,
                cancelled_orders: cancelled,
                cancelledOrders: cancelled,
                pending_orders: pending,
                pendingOrders: pending,
                avg_order_value: avgVal,
                averageOrderValue: avgVal,
                payment_methods: { COD: (orders || []).filter((o) => o.payment_method === 'COD').length, UPI: (orders || []).filter((o) => o.payment_method === 'UPI').length },
                district_sales: { Nandurbar: nonCancelled.length },
                top_medicines: [],
                daily_revenue: [],
            }
        })
    }

    const loadCoupons = async () => {
        setIsLoadingCoupons(true)
        try {
            const res = await fetch('http://localhost:8000/api/coupons')
            if (res.ok) {
                const data = await res.json()
                setCoupons(data)
            }
        } catch (err) {
            console.error('Failed to load coupons:', err)
        } finally {
            setIsLoadingCoupons(false)
        }
    }

    useEffect(() => {
        loadData()
        loadSalesReport()
        loadCoupons()
    }, [])

    // Real-Time Server-Sent Events (SSE) Listener
    useEffect(() => {
        let eventSource = null
        try {
            eventSource = new EventSource('http://localhost:8000/api/orders/stream')

            eventSource.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data)

                    if (parsed.type === 'new_order' && parsed.order) {
                        setOrders((prev) => [parsed.order, ...prev.filter((o) => o.id !== parsed.order.id)])
                        setLastUpdated(new Date())
                        loadSalesReport(true)
                    } else if (parsed.type === 'status_update' && parsed.order) {
                        setOrders((prev) =>
                            prev.map((o) => (o.id === parsed.order.id ? { ...o, ...parsed.order } : o))
                        )
                        setLastUpdated(new Date())
                        loadSalesReport(true)
                    } else if (parsed.type === 'order_deleted' && parsed.orderId) {
                        setOrders((prev) => prev.filter((o) => o.id !== parsed.orderId))
                        setLastUpdated(new Date())
                        loadSalesReport(true)
                    }
                } catch (e) {
                    console.error('SSE JSON parse error in AdminDashboard:', e)
                }
            }

            eventSource.onerror = () => {
                eventSource.close()
            }
        } catch (err) {
            console.warn('Could not connect to SSE in AdminDashboard:', err)
        }

        return () => {
            if (eventSource) eventSource.close()
        }
    }, [])

    // Coupon handlers
    const handleCreateCoupon = async (e) => {
        e.preventDefault()
        if (!newCoupon.code.trim()) {
            setCouponMessage({ type: 'error', text: 'Please enter a discount code.' })
            return
        }
        setIsCreatingCoupon(true)
        setCouponMessage(null)
        try {
            const payload = {
                code: newCoupon.code.trim().toUpperCase(),
                description: newCoupon.description.trim(),
                discount_type: newCoupon.discount_type,
                discount_value: parseFloat(newCoupon.discount_value) || 0,
                min_order_amount: parseFloat(newCoupon.min_order_amount) || 0,
                max_discount: newCoupon.max_discount ? parseFloat(newCoupon.max_discount) : null,
                max_uses_total: newCoupon.max_uses_total ? parseInt(newCoupon.max_uses_total) : null,
                max_uses_per_user: newCoupon.max_uses_per_user ? parseInt(newCoupon.max_uses_per_user) : 1,
                is_active: Boolean(newCoupon.is_active),
                show_in_cart: Boolean(newCoupon.show_in_cart),
            }
            const res = await fetch('http://localhost:8000/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok) {
                setCouponMessage({ type: 'success', text: `Discount code ${data.coupon?.code || payload.code} created successfully (${payload.is_active ? 'Active' : 'Inactive'})!` })
                setNewCoupon({
                    code: '',
                    description: '',
                    discount_type: 'percentage',
                    discount_value: 10,
                    min_order_amount: 0,
                    max_discount: null,
                    max_uses_total: null,
                    max_uses_per_user: 1,
                    is_active: true,
                    show_in_cart: false,
                })
                loadCoupons()
            } else {
                setCouponMessage({ type: 'error', text: data.detail || 'Failed to create discount code.' })
            }
        } catch (err) {
            setCouponMessage({ type: 'error', text: 'Network error creating coupon.' })
        } finally {
            setIsCreatingCoupon(false)
        }
    }

    const handleToggleCoupon = async (couponId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/coupons/${couponId}/toggle`, {
                method: 'PATCH',
            })
            if (res.ok) {
                const updated = await res.json()
                const newActive = updated.isActive !== undefined ? updated.isActive : updated.is_active
                setCoupons((prev) =>
                    prev.map((c) => (c.id === couponId ? { ...c, is_active: newActive, isActive: newActive } : c))
                )
            }
        } catch (err) {
            console.error('Toggle coupon error:', err)
        }
    }

    const handleToggleCouponCartDisplay = async (couponId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/coupons/${couponId}/toggle-cart-display`, {
                method: 'PATCH',
            })
            if (res.ok) {
                const data = await res.json()
                setCoupons((prev) =>
                    prev.map((c) =>
                        c.id === couponId
                            ? { ...c, show_in_cart: data.showInCart, showInCart: data.showInCart }
                            : c
                    )
                )
            }
        } catch (err) {
            console.error('Toggle coupon cart display error:', err)
        }
    }

    const handleDeleteCoupon = async (couponId) => {
        if (!window.confirm('Are you sure you want to delete this discount offer?')) return
        try {
            const res = await fetch(`http://localhost:8000/api/coupons/${couponId}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setCoupons((prev) => prev.filter((c) => c.id !== couponId))
            }
        } catch (err) {
            console.error('Delete coupon error:', err)
        }
    }

    // Dynamic Overview Metrics
    const pendingPrescriptions = prescriptions.filter(
        (rx) => rx.status?.toLowerCase() === 'pending'
    )
    const pendingOrders = orders.filter(
        (o) => o.status?.toLowerCase() === 'pending'
    )
    const nonCancelledOrders = orders.filter(
        (o) => o.status?.toLowerCase() !== 'cancelled'
    )
    const totalRevenue = nonCancelledOrders.reduce(
        (sum, o) => sum + (Number(o.totalAmount || o.amount) || 0),
        0
    )

    const stats = [
        {
            label: 'Prescriptions Waiting',
            value: pendingPrescriptions.length,
            sub: `${prescriptions.length} total customer prescriptions`,
            icon: FileText,
            color: 'bg-amber-50 text-amber-600',
            border: 'border-amber-200',
            path: '/admin/prescriptions',
            badge: pendingPrescriptions.length > 0 ? `${pendingPrescriptions.length} Waiting` : 'Queue Clear',
            badgeColor: pendingPrescriptions.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        },
        {
            label: 'Customer Orders',
            value: orders.length,
            sub: `${pendingOrders.length} waiting to pack & deliver`,
            icon: ShoppingBag,
            color: 'bg-blue-50 text-blue-600',
            border: 'border-blue-200',
            path: '/admin/orders',
            badge: `${pendingOrders.length} New`,
            badgeColor: 'bg-blue-100 text-blue-800',
        },
        {
            label: 'Total Sales Revenue',
            value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            sub: `From ${nonCancelledOrders.length} customer orders`,
            icon: TrendingUp,
            color: 'bg-emerald-50 text-emerald-600',
            border: 'border-emerald-200',
            path: '/admin/orders',
            badge: 'Cash + UPI',
            badgeColor: 'bg-emerald-100 text-emerald-800',
        },
    ]

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Welcome Header with Live Store Indicator ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-bold text-slate-900">Dhruv Pharma Management</h1>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Store Connected
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Quick summary of customer orders, prescriptions, revenue reports, and discount offers.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={() => {
                                loadData()
                                loadSalesReport()
                                loadCoupons()
                            }}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            Refresh Numbers
                        </button>
                    </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'overview'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        <TrendingUp size={15} />
                        Store Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'reports'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        <BarChart3 size={15} />
                        Sales &amp; Revenue Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'coupons'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        <Tag size={15} />
                        Discount Offers &amp; Coupons
                        {coupons.length > 0 && (
                            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                                activeTab === 'coupons' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {coupons.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* ══════════════════════════════════════════════
                    TAB 1: STORE OVERVIEW
                ══════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* 3 Summary Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {stats.map((stat) => (
                                <Link key={stat.label} to={stat.path}>
                                    <div className={`bg-white rounded-2xl border ${stat.border} shadow-xs p-6 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between`}>
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                                                    <stat.icon size={22} />
                                                </div>
                                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${stat.badgeColor}`}>
                                                    {stat.badge}
                                                </span>
                                            </div>
                                            <p className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                                                {isLoading ? '...' : stat.value}
                                            </p>
                                            <p className="text-sm font-bold text-slate-700 mb-1">{stat.label}</p>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                            <span>{stat.sub}</span>
                                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                                                Open <ArrowRight size={13} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Status Cue / Action Banner */}
                        {pendingPrescriptions.length > 0 ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertCircle size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-amber-950">
                                            {pendingPrescriptions.length} Customer Prescription{pendingPrescriptions.length > 1 ? 's' : ''} Waiting for Verification
                                        </h3>
                                        <p className="text-xs text-amber-800 mt-0.5">
                                            Customers have uploaded doctor slips. Please check the medicine names and approve them.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/admin/prescriptions"
                                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                                >
                                    Open Prescriptions Now <ArrowRight size={13} />
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                                        <CheckCircle size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-emerald-950">All Customer Prescriptions Are Verified</h3>
                                        <p className="text-xs text-emerald-800 mt-0.5">
                                            There are no pending doctor slips waiting for review right now.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/admin/orders"
                                    className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-300 px-4 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                                >
                                    View Customer Orders <ArrowRight size={13} />
                                </Link>
                            </div>
                        )}

                        {/* Quick Navigation Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                to="/admin/orders"
                                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <ShoppingBag size={22} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Manage Customer Orders</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Check delivery addresses, mark orders as packed, and print GST bills</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-700 transition-colors" />
                            </Link>

                            <Link
                                to="/admin/prescriptions"
                                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <FileText size={22} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Review Customer Prescriptions</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Inspect uploaded doctor slips, confirm medicines, and generate quotes</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-700 transition-colors" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB 2: SALES & REVENUE REPORTS
                ══════════════════════════════════════════════ */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        {isLoadingReport && !salesReport ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-emerald-600" size={32} />
                                <p className="text-xs text-slate-500 font-medium">Loading sales figures...</p>
                            </div>
                        ) : (
                            <>
                                {/* 4 Financial Metric Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Sales Revenue</span>
                                        <p className="text-2xl font-black text-emerald-700 mt-1">
                                            ₹{(salesReport?.total_revenue ?? salesReport?.totalRevenue ?? 0).toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
                                            <CheckCircle size={12} /> Cash + Online UPI
                                        </span>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Order Bill</span>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            ₹{(salesReport?.avg_order_value ?? salesReport?.averageOrderValue ?? 0).toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[11px] text-slate-500 mt-1 block">Average per customer bill</span>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Orders Delivered</span>
                                        <p className="text-2xl font-black text-emerald-700 mt-1">
                                            {salesReport?.delivered_orders ?? salesReport?.deliveredOrders ?? 0}
                                        </p>
                                        <span className="text-[11px] text-slate-500 mt-1 block">
                                            Out of {salesReport?.total_orders ?? salesReport?.totalOrders ?? 0} total customer orders
                                        </span>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Orders Waiting to Deliver</span>
                                        <p className="text-2xl font-black text-amber-700 mt-1">
                                            {salesReport?.pending_orders ?? salesReport?.pendingOrders ?? 0}
                                        </p>
                                        <span className="text-[11px] text-amber-800 mt-1 block">Pending dispatch</span>
                                    </div>
                                </div>

                                {/* Row: Top Selling Medicines + Payment Split */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Top Selling Medicines (2 cols) */}
                                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Award size={20} className="text-amber-500" />
                                                <h3 className="font-bold text-slate-900 text-sm">Top-Selling Medicines</h3>
                                            </div>
                                            <span className="text-xs text-slate-500 font-semibold">Ranked by Strips Sold</span>
                                        </div>

                                        {(salesReport?.top_medicines || salesReport?.topSelling) && (salesReport.top_medicines || salesReport.topSelling).length > 0 ? (
                                            <div className="divide-y divide-slate-100">
                                                {(salesReport.top_medicines || salesReport.topSelling).map((med, idx) => (
                                                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                                                idx === 0 ? 'bg-amber-100 text-amber-800' :
                                                                idx === 1 ? 'bg-slate-200 text-slate-800' :
                                                                idx === 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {idx + 1}
                                                            </span>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{med.name}</p>
                                                                <p className="text-[11px] text-slate-500">Total Money: ₹{(med.revenue ?? 0).toLocaleString('en-IN')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                                {med.units ?? med.unitsSold ?? 0} units
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 py-6 text-center">No sales recorded yet.</p>
                                        )}
                                    </div>

                                    {/* Payment Methods & Regional Breakdown (1 col) */}
                                    <div className="space-y-6">
                                        {/* Payment Methods */}
                                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={18} className="text-emerald-700" />
                                                <h3 className="font-bold text-slate-900 text-sm">Payment Methods</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                                                    <span className="font-bold text-slate-700">Cash on Delivery (COD)</span>
                                                    <span className="font-bold text-emerald-700">
                                                        {(salesReport?.payment_methods?.COD ?? salesReport?.paymentMethods?.COD ?? 0)} orders
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                                                    <span className="font-bold text-slate-700">Online UPI / Scanner</span>
                                                    <span className="font-bold text-blue-700">
                                                        {(salesReport?.payment_methods?.UPI ?? salesReport?.paymentMethods?.UPI ?? 0)} orders
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Regional Delivery Breakdown */}
                                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={18} className="text-emerald-700" />
                                                <h3 className="font-bold text-slate-900 text-sm">Delivery Towns &amp; Hubs</h3>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                {(salesReport?.district_sales || salesReport?.districtSales) && Object.keys(salesReport.district_sales || salesReport.districtSales).length > 0 ? (
                                                    Object.entries(salesReport.district_sales || salesReport.districtSales).map(([district, count]) => (
                                                        <div key={district} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                                                            <span className="text-slate-700 font-semibold">{district}</span>
                                                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                                                {count} orders
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-400 py-2">No regional orders yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB 3: DISCOUNT OFFERS & COUPONS
                ══════════════════════════════════════════════ */}
                {activeTab === 'coupons' && (
                    <div className="space-y-6">
                        {/* Create New Coupon Code Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                                    <Tag size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Create New Discount Offer</h3>
                                    <p className="text-xs text-slate-500">Create discount promo codes that customers can enter at checkout.</p>
                                </div>
                            </div>

                            {couponMessage && (
                                <div className={`p-3 rounded-xl text-xs mb-4 flex items-center justify-between ${
                                    couponMessage.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                    <span className="font-semibold">{couponMessage.text}</span>
                                    <button onClick={() => setCouponMessage(null)} className="p-0.5 hover:opacity-75">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Discount Code *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. FESTIVE10 or DHRUV50"
                                        value={newCoupon.code}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold outline-none focus:border-emerald-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Discount Type *</label>
                                    <select
                                        value={newCoupon.discount_type}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600 bg-white font-medium"
                                    >
                                        <option value="percentage">Percentage Discount (%) Off</option>
                                        <option value="fixed">Flat Rupee Discount (₹) Off</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        Discount Amount ({newCoupon.discount_type === 'percentage' ? '%' : '₹'}) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.5"
                                        placeholder="e.g. 10 or 50"
                                        value={newCoupon.discount_value}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Minimum Bill Required (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0 for no minimum"
                                        value={newCoupon.min_order_amount}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Maximum Discount Limit (₹ optional)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 150 (max ₹ discount)"
                                        value={newCoupon.max_discount || ''}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, max_discount: e.target.value || null })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Usage Per Customer *</label>
                                    <select
                                        value={newCoupon.max_uses_per_user === null ? 'null' : newCoupon.max_uses_per_user}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, max_uses_per_user: e.target.value === 'null' ? null : parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600 bg-white font-medium"
                                    >
                                        <option value={1}>1 Time Per Customer (Single use)</option>
                                        <option value={2}>2 Times Per Customer</option>
                                        <option value={3}>3 Times Per Customer</option>
                                        <option value="null">Unlimited Times Per Customer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Total Uses Allowed (All Customers) *</label>
                                    <select
                                        value={newCoupon.max_uses_total === null ? 'null' : newCoupon.max_uses_total}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, max_uses_total: e.target.value === 'null' ? null : parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600 bg-white font-medium"
                                    >
                                        <option value="null">Unlimited Overall Uses</option>
                                        <option value={1}>1 Time Total (Single use coupon)</option>
                                        <option value={10}>First 10 Customers</option>
                                        <option value={25}>First 25 Customers</option>
                                        <option value={50}>First 50 Customers</option>
                                        <option value={100}>First 100 Customers</option>
                                        <option value={500}>First 500 Customers</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Offer Note (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Special festive 10% discount"
                                        value={newCoupon.description}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Offer Status</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="is_active"
                                                checked={newCoupon.is_active === true}
                                                onChange={() => setNewCoupon({ ...newCoupon, is_active: true })}
                                                className="accent-emerald-600"
                                            />
                                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                                                <CheckCircle size={14} /> Active (Usable)
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="is_active"
                                                checked={newCoupon.is_active === false}
                                                onChange={() => setNewCoupon({ ...newCoupon, is_active: false })}
                                                className="accent-slate-500"
                                            />
                                            <span className="text-slate-500 font-bold text-xs flex items-center gap-1">
                                                <AlertCircle size={14} /> Inactive (Stopped)
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Show in Customer Cart?</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="show_in_cart"
                                                checked={newCoupon.show_in_cart === true}
                                                onChange={() => setNewCoupon({ ...newCoupon, show_in_cart: true })}
                                                className="accent-blue-600"
                                            />
                                            <span className="text-blue-700 font-bold text-xs">
                                                Yes (Show in Cart)
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="show_in_cart"
                                                checked={newCoupon.show_in_cart === false}
                                                onChange={() => setNewCoupon({ ...newCoupon, show_in_cart: false })}
                                                className="accent-slate-500"
                                            />
                                            <span className="text-slate-500 font-bold text-xs">
                                                No (Private Code)
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="md:col-span-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isCreatingCoupon}
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    >
                                        <Plus size={16} />
                                        {isCreatingCoupon ? 'Creating...' : 'Create & Save Discount Offer'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Existing Coupons Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Active &amp; Inactive Discount Offers ({coupons.length})</h3>
                                    <p className="text-xs text-slate-500">You can turn any offer On or Off at any time. Inactive offers cannot be used by customers.</p>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">Automatic Check at Checkout</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4">Discount Code</th>
                                            <th className="py-3 px-4">Offer Value</th>
                                            <th className="py-3 px-4">Min Bill Required</th>
                                            <th className="py-3 px-4">Customer Limit</th>
                                            <th className="py-3 px-4 text-center">Times Used</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4 text-center">Show in Cart?</th>
                                            <th className="py-3 px-4 text-center">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {coupons.map((c) => {
                                            const isActive = c.is_active !== undefined ? c.is_active : c.isActive
                                            const maxTotal = c.max_uses_total !== undefined ? c.max_uses_total : c.maxUsesTotal
                                            const maxPerUser = c.max_uses_per_user !== undefined ? c.max_uses_per_user : c.maxUsesPerUser
                                            const usage = c.usage_count !== undefined ? c.usage_count : c.usageCount || 0

                                            return (
                                                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                                                        <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                                                            {c.code}
                                                        </span>
                                                        {c.description && (
                                                            <p className="text-[11px] text-slate-500 font-sans font-normal mt-0.5">
                                                                {c.description}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-bold text-slate-900">
                                                        {(c.discount_type || c.discountType) === 'percentage'
                                                            ? `${c.discount_value || c.discountValue}% OFF`
                                                            : `₹${c.discount_value || c.discountValue} FLAT`}
                                                        {(c.max_discount || c.maxDiscount) && (c.discount_type || c.discountType) === 'percentage' && (
                                                            <span className="text-[10px] text-slate-400 block font-normal">Cap: ₹{c.max_discount || c.maxDiscount}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                                                        {(c.min_order_amount || c.minOrderAmount) > 0 ? `₹${c.min_order_amount || c.minOrderAmount}` : 'None'}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-semibold text-slate-800 block">
                                                            {maxPerUser === 1 ? '1 time per person' : maxPerUser ? `${maxPerUser}x per person` : 'Unlimited / person'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 block">
                                                            {maxTotal === 1 ? 'Single-use total' : maxTotal ? `Max ${maxTotal} total uses` : 'Unlimited total'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className="font-bold text-slate-900">{usage}</span>
                                                        {maxTotal ? (
                                                             <span className="text-[10px] text-slate-400 block">of {maxTotal}</span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 block">orders</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCoupon(c.id)}
                                                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                                                                isActive
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                                            }`}
                                                            title="Click to turn Active or Inactive"
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                                                        </button>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {(() => {
                                                            const isShow = c.show_in_cart !== undefined ? c.show_in_cart : c.showInCart
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleCouponCartDisplay(c.id)}
                                                                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                                                                        isShow
                                                                            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                                                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                                                    }`}
                                                                    title={isShow ? 'Shown in customer cart. Click to hide.' : 'Hidden from cart. Click to show.'}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full ${isShow ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                                                    <span>{isShow ? 'Shown in Cart' : 'Hidden'}</span>
                                                                </button>
                                                            )
                                                        })()}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteCoupon(c.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                            title="Delete offer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}

                                        {coupons.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                                                    No discount offers created yet. Create one above!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    )
}
