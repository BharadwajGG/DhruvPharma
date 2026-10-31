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

    const loadSalesReport = async () => {
        setIsLoadingReport(true)
        try {
            const res = await fetch('http://localhost:8000/api/admin/sales-report')
            if (res.ok) {
                const data = await res.json()
                setSalesReport(data)
            }
        } catch (err) {
            console.error('Failed to load sales report:', err)
        } finally {
            setIsLoadingReport(false)
        }
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
                        loadSalesReport()
                    } else if (parsed.type === 'status_update' && parsed.order) {
                        setOrders((prev) =>
                            prev.map((o) => (o.id === parsed.order.id ? { ...o, ...parsed.order } : o))
                        )
                        setLastUpdated(new Date())
                        loadSalesReport()
                    } else if (parsed.type === 'order_deleted' && parsed.orderId) {
                        setOrders((prev) => prev.filter((o) => o.id !== parsed.orderId))
                        setLastUpdated(new Date())
                        loadSalesReport()
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
            setCouponMessage({ type: 'error', text: 'Please enter a coupon code.' })
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
            }
            const res = await fetch('http://localhost:8000/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok) {
                setCouponMessage({ type: 'success', text: `Coupon ${data.coupon?.code || payload.code} created successfully (${payload.is_active ? 'Active' : 'Inactive'})!` })
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
                })
                loadCoupons()
            } else {
                setCouponMessage({ type: 'error', text: data.detail || 'Failed to create coupon.' })
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

    const handleDeleteCoupon = async (couponId) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return
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
            label: 'Pending Prescriptions',
            value: pendingPrescriptions.length,
            sub: `${prescriptions.length} total submitted`,
            icon: FileText,
            color: 'bg-orange-50 text-orange-600',
            border: 'border-orange-100',
            path: '/admin/prescriptions',
            badge: pendingPrescriptions.length > 0 ? `${pendingPrescriptions.length} Needs Review` : 'Queue Clear',
            badgeColor: pendingPrescriptions.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700',
        },
        {
            label: 'Total Orders',
            value: orders.length,
            sub: `${pendingOrders.length} pending processing`,
            icon: ShoppingBag,
            color: 'bg-blue-50 text-blue-600',
            border: 'border-blue-100',
            path: '/admin/orders',
            badge: `${pendingOrders.length} Active`,
            badgeColor: 'bg-blue-100 text-blue-700',
        },
        {
            label: 'Total Revenue',
            value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            sub: `From ${nonCancelledOrders.length} active orders`,
            icon: TrendingUp,
            color: 'bg-green-50 text-green-600',
            border: 'border-green-100',
            path: '/admin/orders',
            badge: 'Live Calculated',
            badgeColor: 'bg-green-100 text-green-700',
        },
    ]

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Welcome Header with Live Sync Indicator ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">Good day, Dhruv 👋</h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Sync Active
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Real-time overview of customer orders, revenue reports, prescriptions, and promotional discounts.
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-colors cursor-pointer"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'overview'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        <TrendingUp size={14} />
                        Operations Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'reports'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        <BarChart3 size={14} />
                        Sales Reports &amp; Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'coupons'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        <Tag size={14} />
                        Coupons &amp; Discounts
                        {coupons.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                activeTab === 'coupons' ? 'bg-blue-800 text-blue-100' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {coupons.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* ══════════════════════════════════════════════
                    TAB 1: OPERATIONS OVERVIEW
                ══════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* 3 Summary Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {stats.map((stat) => (
                                <Link key={stat.label} to={stat.path}>
                                    <div className={`bg-white rounded-2xl border ${stat.border} shadow-sm p-6 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between`}>
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                                                    <stat.icon size={22} />
                                                </div>
                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${stat.badgeColor}`}>
                                                    {stat.badge}
                                                </span>
                                            </div>
                                            <p className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
                                                {isLoading ? '...' : stat.value}
                                            </p>
                                            <p className="text-sm font-medium text-gray-700 mb-1">{stat.label}</p>
                                        </div>
                                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                            <span>{stat.sub}</span>
                                            <span className="text-blue-600 font-medium flex items-center gap-0.5">
                                                View details <ArrowRight size={12} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Status Cue / Action Banner */}
                        {pendingPrescriptions.length > 0 ? (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-orange-900">
                                            {pendingPrescriptions.length} Prescription{pendingPrescriptions.length > 1 ? 's' : ''} Awaiting Pharmacist Review
                                        </h3>
                                        <p className="text-xs text-orange-700 mt-0.5">
                                            Customers are waiting for validation and medicine quotation. Please review and approve them promptly.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/admin/prescriptions"
                                    className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                    Open Prescription Queue <ArrowRight size={13} />
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-emerald-900">All Prescriptions Processed</h3>
                                        <p className="text-xs text-emerald-700 mt-0.5">
                                            There are currently no pending prescription requests requiring immediate review.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/admin/orders"
                                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-300 px-3.5 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1"
                                >
                                    View Active Orders <ArrowRight size={12} />
                                </Link>
                            </div>
                        )}

                        {/* Quick Navigation Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                to="/admin/orders"
                                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Manage Customer Orders</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">Update delivery times, bulk status, or print official GST invoices</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                            </Link>

                            <Link
                                to="/admin/prescriptions"
                                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">Review Prescriptions</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">Inspect uploaded doctor prescriptions, verify salts, and generate quotes</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-600 transition-colors" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB 2: SALES REPORTS & ANALYTICS
                ══════════════════════════════════════════════ */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        {isLoadingReport && !salesReport ? (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                <p className="text-xs text-gray-500 font-medium">Loading sales analytics &amp; financial metrics...</p>
                            </div>
                        ) : (
                            <>
                                {/* 4 Financial Metric Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Sales Revenue</span>
                                        <p className="text-2xl font-black text-blue-700 mt-1">
                                            ₹{(salesReport?.total_revenue ?? salesReport?.totalRevenue ?? 0).toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                                            <CheckCircle size={11} /> Completed + Active
                                        </span>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Average Order Value</span>
                                        <p className="text-2xl font-black text-gray-900 mt-1">
                                            ₹{(salesReport?.avg_order_value ?? salesReport?.averageOrderValue ?? 0).toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[11px] text-gray-500 mt-1 block">Per non-cancelled order</span>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Delivered Orders</span>
                                        <p className="text-2xl font-black text-emerald-600 mt-1">
                                            {salesReport?.delivered_orders ?? salesReport?.deliveredOrders ?? 0}
                                        </p>
                                        <span className="text-[11px] text-gray-500 mt-1 block">
                                            Out of {salesReport?.total_orders ?? salesReport?.totalOrders ?? 0} total orders
                                        </span>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Pending Fulfillment</span>
                                        <p className="text-2xl font-black text-orange-600 mt-1">
                                            {salesReport?.pending_orders ?? salesReport?.pendingOrders ?? 0}
                                        </p>
                                        <span className="text-[11px] text-orange-700 mt-1 block">Awaiting dispatch</span>
                                    </div>
                                </div>

                                {/* Row: Top Selling Medicines + Payment Split */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Top Selling Medicines (2 cols) */}
                                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Award size={18} className="text-amber-500" />
                                                <h3 className="font-bold text-gray-900 text-sm">Top-Selling Medicines</h3>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono">By Units Sold</span>
                                        </div>

                                        {(salesReport?.top_medicines || salesReport?.topSelling) && (salesReport.top_medicines || salesReport.topSelling).length > 0 ? (
                                            <div className="divide-y divide-gray-100">
                                                {(salesReport.top_medicines || salesReport.topSelling).map((med, idx) => (
                                                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                                                idx === 0 ? 'bg-amber-100 text-amber-800' :
                                                                idx === 1 ? 'bg-gray-200 text-gray-800' :
                                                                idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {idx + 1}
                                                            </span>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{med.name}</p>
                                                                <p className="text-[11px] text-gray-400">Total Revenue: ₹{(med.revenue ?? 0).toLocaleString('en-IN')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                                                                {med.units ?? med.unitsSold ?? 0} units
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 py-6 text-center">No sales data recorded yet.</p>
                                        )}
                                    </div>

                                    {/* Payment Methods & Regional Breakdown (1 col) */}
                                    <div className="space-y-6">
                                        {/* Payment Methods */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={18} className="text-blue-600" />
                                                <h3 className="font-bold text-gray-900 text-sm">Payment Methods</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs">
                                                    <span className="font-semibold text-gray-700">Cash on Delivery (COD)</span>
                                                    <span className="font-bold text-blue-700">
                                                        {(salesReport?.payment_methods?.COD ?? salesReport?.paymentMethods?.COD ?? 0)} orders
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs">
                                                    <span className="font-semibold text-gray-700">Online UPI / QR</span>
                                                    <span className="font-bold text-purple-700">
                                                        {(salesReport?.payment_methods?.UPI ?? salesReport?.paymentMethods?.UPI ?? 0)} orders
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Regional Delivery Breakdown */}
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={18} className="text-emerald-600" />
                                                <h3 className="font-bold text-gray-900 text-sm">Hub Delivery Orders</h3>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                {(salesReport?.district_sales || salesReport?.districtSales) && Object.keys(salesReport.district_sales || salesReport.districtSales).length > 0 ? (
                                                    Object.entries(salesReport.district_sales || salesReport.districtSales).map(([district, count]) => (
                                                        <div key={district} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                                            <span className="text-gray-600 font-medium">{district}</span>
                                                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                                                {count} orders
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-400 py-2">No regional breakdown yet.</p>
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
                    TAB 3: COUPONS & DISCOUNT MANAGEMENT
                ══════════════════════════════════════════════ */}
                {activeTab === 'coupons' && (
                    <div className="space-y-6">
                        {/* Create New Coupon Code Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                <Tag size={18} className="text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Generate Promotional Coupon</h3>
                                    <p className="text-xs text-gray-400">Create discount promo codes that customers can apply at checkout.</p>
                                </div>
                            </div>

                            {couponMessage && (
                                <div className={`p-3 rounded-xl text-xs mb-4 flex items-center justify-between ${
                                    couponMessage.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    <span>{couponMessage.text}</span>
                                    <button onClick={() => setCouponMessage(null)} className="p-0.5 hover:opacity-75">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Coupon Code *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. FESTIVE20 or DHRUV100"
                                        value={newCoupon.code}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono uppercase font-bold outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Discount Type *</label>
                                    <select
                                        value={newCoupon.discount_type}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value="percentage">Percentage Discount (%)</option>
                                        <option value="fixed">Flat Amount Discount (₹)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">
                                        Discount Value ({newCoupon.discount_type === 'percentage' ? '%' : '₹'}) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.5"
                                        placeholder="e.g. 10 or 50"
                                        value={newCoupon.discount_value}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Minimum Order Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0 for no minimum"
                                        value={newCoupon.min_order_amount}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Max Cap Discount (₹ optional)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 150 (for percentage)"
                                        value={newCoupon.max_discount || ''}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, max_discount: e.target.value || null })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Per-Customer Limit *</label>
                                    <select
                                        value={newCoupon.max_uses_per_user === null ? 'null' : newCoupon.max_uses_per_user}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, max_uses_per_user: e.target.value === 'null' ? null : parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value={1}>1 Time Per Customer (Single use per person)</option>
                                        <option value={2}>2 Times Per Customer</option>
                                        <option value={3}>3 Times Per Customer</option>
                                        <option value="null">Unlimited Uses Per Customer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Total Overall Uses Limit *</label>
                                    <select
                                        value={newCoupon.max_uses_total === null ? 'null' : newCoupon.max_uses_total}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, max_uses_total: e.target.value === 'null' ? null : parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value="null">Unlimited Overall Uses</option>
                                        <option value={1}>1 Time Total (Single-Use Global Code)</option>
                                        <option value={10}>First 10 Customers Total</option>
                                        <option value={25}>First 25 Customers Total</option>
                                        <option value={50}>First 50 Customers Total</option>
                                        <option value={100}>First 100 Customers Total</option>
                                        <option value={500}>First 500 Customers Total</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Offer Description</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Special festive 10% off on all medicines"
                                        value={newCoupon.description}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Initial Status</label>
                                    <div className="flex items-center gap-3 mt-2">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="is_active"
                                                checked={newCoupon.is_active === true}
                                                onChange={() => setNewCoupon({ ...newCoupon, is_active: true })}
                                                className="accent-emerald-600"
                                            />
                                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                                                <CheckCircle size={13} /> Active
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="is_active"
                                                checked={newCoupon.is_active === false}
                                                onChange={() => setNewCoupon({ ...newCoupon, is_active: false })}
                                                className="accent-gray-600"
                                            />
                                            <span className="text-gray-500 font-bold text-xs flex items-center gap-1">
                                                <AlertCircle size={13} /> Inactive
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="md:col-span-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isCreatingCoupon}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    >
                                        <Plus size={15} />
                                        {isCreatingCoupon ? 'Creating...' : 'Create & Save Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Existing Coupons Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Configured Promotion Codes ({coupons.length})</h3>
                                    <p className="text-xs text-gray-400">Toggle status anytime. Inactive coupons are immediately rejected at checkout.</p>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">Live Validation</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4">Coupon Code</th>
                                            <th className="py-3 px-4">Offer Value</th>
                                            <th className="py-3 px-4">Min Order</th>
                                            <th className="py-3 px-4">Usage Limits</th>
                                            <th className="py-3 px-4 text-center">Usage Count</th>
                                            <th className="py-3 px-4 text-center">Status (Click to Toggle)</th>
                                            <th className="py-3 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {coupons.map((c) => {
                                            const isActive = c.is_active !== undefined ? c.is_active : c.isActive
                                            const maxTotal = c.max_uses_total !== undefined ? c.max_uses_total : c.maxUsesTotal
                                            const maxPerUser = c.max_uses_per_user !== undefined ? c.max_uses_per_user : c.maxUsesPerUser
                                            const usage = c.usage_count !== undefined ? c.usage_count : c.usageCount || 0

                                            return (
                                                <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                                                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                                                        <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                                                            {c.code}
                                                        </span>
                                                        {c.description && (
                                                            <p className="text-[11px] text-gray-400 font-sans font-normal mt-0.5">
                                                                {c.description}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-bold text-gray-900">
                                                        {(c.discount_type || c.discountType) === 'percentage'
                                                            ? `${c.discount_value || c.discountValue}% OFF`
                                                            : `₹${c.discount_value || c.discountValue} FLAT`}
                                                        {(c.max_discount || c.maxDiscount) && (c.discount_type || c.discountType) === 'percentage' && (
                                                            <span className="text-[10px] text-gray-400 block font-normal">Cap: ₹{c.max_discount || c.maxDiscount}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-gray-600">
                                                        {(c.min_order_amount || c.minOrderAmount) > 0 ? `₹${c.min_order_amount || c.minOrderAmount}` : 'None'}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-semibold text-gray-800 block">
                                                            {maxPerUser === 1 ? '👤 1 time per person' : maxPerUser ? `👤 ${maxPerUser}x per person` : '👤 Unlimited/person'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 block">
                                                            {maxTotal === 1 ? '⚡ Single-use (1 total)' : maxTotal ? `🎯 Max ${maxTotal} total uses` : '🌐 Unlimited total'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className="font-bold text-gray-800">{usage}</span>
                                                        {maxTotal ? (
                                                            <span className="text-[10px] text-gray-400 block">of {maxTotal}</span>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 block">times</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCoupon(c.id)}
                                                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border cursor-pointer transition-all active:scale-95 shadow-2xs ${
                                                                isActive
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                                    : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                                                            }`}
                                                            title="Click to toggle Active / Inactive"
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                                                        </button>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteCoupon(c.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                            title="Delete coupon"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}

                                        {coupons.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-gray-400">
                                                    No coupon codes created yet. Add one above!
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
