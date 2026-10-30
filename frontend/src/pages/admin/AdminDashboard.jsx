import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    FileText,
    ShoppingBag,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    RefreshCw,
    Radio,
    Clock,
    CheckCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
    const [orders, setOrders] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(new Date())

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

    useEffect(() => {
        loadData()
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
                    } else if (parsed.type === 'status_update' && parsed.order) {
                        setOrders((prev) =>
                            prev.map((o) => (o.id === parsed.order.id ? { ...o, ...parsed.order } : o))
                        )
                        setLastUpdated(new Date())
                    } else if (parsed.type === 'order_deleted' && parsed.orderId) {
                        setOrders((prev) => prev.filter((o) => o.id !== parsed.orderId))
                        setLastUpdated(new Date())
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

    // Calculate Dynamic Metrics
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
        (sum, o) => sum + (Number(o.totalAmount) || 0),
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
                            Real-time overview of customer orders, prescriptions, and pharmacy operations across Maharashtra.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-colors cursor-pointer"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ── Exactly 3 Summary Metric Cards ── */}
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

                {/* ── Status Cue / Action Banner ── */}
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

                {/* ── Quick Navigation Cards ── */}
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
                                <p className="text-xs text-gray-400 mt-0.5">Update delivery times, packing status, or cancel/delete test orders</p>
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
        </AdminLayout>
    )
}
