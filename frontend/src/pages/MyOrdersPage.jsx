import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import OrderInvoiceModal from '../components/OrderInvoiceModal'
import { detectDosageForm } from '../utils/packFormat'
import {
    Package,
    Clock,
    CheckCircle2,
    Truck,
    MapPin,
    Phone,
    Pill,
    ShoppingBag,
    AlertCircle,
    RefreshCw,
    X,
    Calendar,
    ArrowRight,
    ExternalLink,
    Lock,
    User,
    Loader2,
    Printer,
    Search,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    FileText,
    ShieldCheck,
    Sparkles,
    HelpCircle,
    MessageSquare,
} from 'lucide-react'

const STATUS_CONFIG = {
    pending: {
        label: 'Pending Pharmacist Review',
        shortLabel: 'Pending',
        badge: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100',
        dot: 'bg-amber-500',
        icon: Clock,
        step: 1,
        stepTitle: 'Order Placed',
        description: 'Undergoing licensed pharmacist inspection & batch verification.',
    },
    confirmed: {
        label: 'Verified & Packed',
        shortLabel: 'Packed',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-100',
        dot: 'bg-indigo-500',
        icon: CheckCircle2,
        step: 2,
        stepTitle: 'Packed & Verified',
        description: 'Packed safely in tamper-evident packaging under FDA 20B/21B guidelines.',
    },
    dispatched: {
        label: 'Out for Doorstep Delivery',
        shortLabel: 'Out for Delivery',
        badge: 'bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-100',
        dot: 'bg-sky-500',
        icon: Truck,
        step: 3,
        stepTitle: 'Out for Delivery',
        description: 'With express courier partner. Handover expected today.',
    },
    delivered: {
        label: 'Delivered Successfully',
        shortLabel: 'Delivered',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        step: 4,
        stepTitle: 'Delivered',
        description: 'Handover complete and payment settled. Store medicines in cool, dry place.',
    },
    cancelled: {
        label: 'Order Cancelled',
        shortLabel: 'Cancelled',
        badge: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-100',
        dot: 'bg-rose-500',
        icon: X,
        step: 0,
        stepTitle: 'Cancelled',
        description: 'Order voided. Warehouse stock auto-restored.',
    },
}

function parseOrderItems(itemsData) {
    if (!itemsData) return []
    if (Array.isArray(itemsData)) return itemsData
    if (typeof itemsData === 'string') {
        try {
            const parsed = JSON.parse(itemsData)
            if (Array.isArray(parsed)) return parsed
        } catch {
            if (itemsData.includes('|')) {
                return itemsData.split('|').map((chunk) => {
                    const clean = chunk.trim()
                    return { name: clean, qty: 1, price: 0 }
                })
            }
            if (itemsData.trim()) {
                return [{ name: itemsData.trim(), qty: 1, price: 0 }]
            }
        }
    }
    return []
}

export default function MyOrdersPage() {
    const { currentUser, loading: authLoading, loginWithGoogle } = useAuth()
    const { customerOrders, reorderItems } = useCart()
    const navigate = useNavigate()

    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [authError, setAuthError] = useState('')

    // Search & Filter state
    const [activeTab, setActiveTab] = useState('all') // 'all', 'active', 'delivered', 'cancelled'
    const [searchQuery, setSearchQuery] = useState('')

    // Collapsed/Expanded medicine items per order
    const [expandedOrders, setExpandedOrders] = useState({})

    // Cancellation & Reorder States
    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null)
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null)
    const [cancelReason, setCancelReason] = useState('Changed my mind / Placed by mistake')
    const [isCancelling, setIsCancelling] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [copiedOrderId, setCopiedOrderId] = useState(null)
    const [sseConnected, setSseConnected] = useState(false)

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(''), 4000)
    }

    const toggleExpandOrder = (orderKey) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderKey]: !prev[orderKey],
        }))
    }

    const handleCopyOrderId = (id) => {
        if (!id) return
        navigator.clipboard?.writeText(id)
        setCopiedOrderId(id)
        setTimeout(() => setCopiedOrderId(null), 2000)
        showToast(`Copied Order #${id} to clipboard`)
    }

    const handleReorder = (order) => {
        const items = parseOrderItems(order.items)
        if (!items || items.length === 0) return
        const count = reorderItems(items)
        showToast(`Added ${count} medicine${count > 1 ? 's' : ''} from Order #${order.id || order.orderId} to your cart!`)
    }

    const handleConfirmCancelOrder = async () => {
        if (!selectedOrderToCancel) return
        setIsCancelling(true)
        try {
            const orderRef = selectedOrderToCancel.id || selectedOrderToCancel.orderId
            const res = await fetch(`http://localhost:8000/api/orders/${orderRef}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: cancelReason || 'Customer cancelled via My Orders' }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.detail || 'Failed to cancel order')

            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderRef || o.orderId === orderRef
                        ? { ...o, status: 'cancelled', cancellationReason: cancelReason, cancelledBy: 'customer' }
                        : o
                )
            )
            setCancelModalOpen(false)
            setSelectedOrderToCancel(null)
            showToast(`Order #${orderRef} cancelled successfully. Stock auto-restored.`)
        } catch (err) {
            console.error('Cancellation error:', err)
            alert(err.message || 'Unable to cancel order. Please contact our pharmacist support.')
        } finally {
            setIsCancelling(false)
        }
    }

    // Fetch orders strictly scoped to authenticated user
    const currentUid = currentUser?.uid
    const currentEmail = currentUser?.email

    const fetchOrders = async () => {
        if (!currentUid && !currentEmail) {
            setOrders(customerOrders || [])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        try {
            const queryParams = new URLSearchParams()
            if (currentUid) queryParams.set('userId', currentUid)
            if (currentEmail) queryParams.set('email', currentEmail)

            const res = await fetch(`http://localhost:8000/api/orders?${queryParams.toString()}`, {
                signal: controller.signal,
            })
            clearTimeout(timeoutId)

            if (res.ok) {
                const serverOrders = await res.json()
                if (Array.isArray(serverOrders)) {
                    const isolated = serverOrders.filter((o) => {
                        const matchesUid = o.userId && o.userId === currentUid
                        const matchesEmail = o.email && currentEmail && o.email.toLowerCase() === currentEmail.toLowerCase()
                        return matchesUid || matchesEmail
                    })
                    setOrders(isolated)
                    return
                }
            }
            setOrders(customerOrders || [])
        } catch (err) {
            console.warn('Backend unavailable, using local orders:', err)
            setOrders(customerOrders || [])
        } finally {
            clearTimeout(timeoutId)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            fetchOrders()
        }
    }, [currentUid, currentEmail, authLoading])

    // Real-Time SSE listener
    useEffect(() => {
        if (!currentUid && !currentEmail) return

        let eventSource = null
        try {
            eventSource = new EventSource('http://localhost:8000/api/orders/stream')

            eventSource.onopen = () => {
                setSseConnected(true)
            }

            eventSource.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data)

                    if (parsed.type === 'status_update' && parsed.order) {
                        const updated = parsed.order
                        setOrders((prev) => {
                            const isMine =
                                updated.userId === currentUid ||
                                (updated.email && currentEmail && updated.email.toLowerCase() === currentEmail.toLowerCase()) ||
                                prev.some((o) => o.id === updated.id || o.orderId === updated.id)

                            if (!isMine) return prev
                            return prev.map((o) => (o.id === updated.id || o.orderId === updated.id ? { ...o, ...updated } : o))
                        })
                    }

                    if (parsed.type === 'new_order' && parsed.order) {
                        const newOrder = parsed.order
                        const isMine =
                            newOrder.userId === currentUid ||
                            (newOrder.email && currentEmail && newOrder.email.toLowerCase() === currentEmail.toLowerCase())

                        if (isMine) {
                            setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)])
                        }
                    }

                    if (parsed.type === 'order_deleted' && parsed.orderId) {
                        setOrders((prev) =>
                            prev.filter((o) => o.id !== parsed.orderId && o.orderId !== parsed.orderId)
                        )
                    }
                } catch {
                    // Ignore parsing glitches or heartbeats
                }
            }

            eventSource.onerror = () => {
                setSseConnected(false)
                eventSource.close()
            }
        } catch (e) {
            console.warn('Real-time connection error:', e)
        }

        return () => {
            if (eventSource) eventSource.close()
        }
    }, [currentUid, currentEmail])

    const handleGoogleSignIn = async () => {
        setAuthError('')
        setGoogleLoading(true)
        try {
            await loginWithGoogle()
        } catch (err) {
            console.error('Google login error on My Orders:', err)
            if (err.code !== 'auth/popup-closed-by-user') {
                setAuthError(err.message || 'Google sign-in failed. Please try again.')
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    // ── Metric Calculations ──
    const metrics = useMemo(() => {
        const total = orders.length
        const active = orders.filter((o) => ['pending', 'confirmed', 'dispatched'].includes(o.status)).length
        const delivered = orders.filter((o) => o.status === 'delivered').length
        const cancelled = orders.filter((o) => o.status === 'cancelled').length
        const totalSpend = orders
            .filter((o) => o.status !== 'cancelled')
            .reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.amount || 0) || 0), 0)

        return { total, active, delivered, cancelled, totalSpend }
    }, [orders])

    // ── Filtered & Searched Orders ──
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            // Tab filter
            if (activeTab === 'active') {
                if (!['pending', 'confirmed', 'dispatched'].includes(order.status)) return false
            } else if (activeTab === 'delivered') {
                if (order.status !== 'delivered') return false
            } else if (activeTab === 'cancelled') {
                if (order.status !== 'cancelled') return false
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const orderId = (order.orderId || order.id || '').toLowerCase()
                const district = (order.district || '').toLowerCase()
                const phone = (order.phone || order.customer_phone || '').toLowerCase()
                const items = parseOrderItems(order.items)
                const matchesItem = items.some((it) => (it.name || '').toLowerCase().includes(q) || (it.salt || '').toLowerCase().includes(q))

                if (!orderId.includes(q) && !district.includes(q) && !phone.includes(q) && !matchesItem) {
                    return false
                }
            }

            return true
        })
    }, [orders, activeTab, searchQuery])

    // ── 1. Loading Guard Screen ──
    if (authLoading) {
        return (
            <div className="bg-slate-50 min-h-screen py-20 px-4 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Verifying secure customer session...</p>
                    <p className="text-xs text-slate-400">Loading your Dhruv Pharma prescriptions &amp; order history</p>
                </div>
            </div>
        )
    }

    // ── 2. Unauthenticated Guard Screen ──
    if (!currentUser) {
        return (
            <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                        <Lock size={32} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Sign In to View Orders
                        </h2>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Under FDA regulations, medicine order histories and live prescription tracking are strictly encrypted and restricted to verified account holders.
                        </p>
                    </div>

                    {authError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 text-left">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{authError}</span>
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
                        >
                            {googleLoading ? (
                                <Loader2 size={18} className="animate-spin text-blue-600" />
                            ) : (
                                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                            )}
                            <span>{googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}</span>
                        </button>

                        <div className="relative my-3">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                                    or
                                </span>
                            </div>
                        </div>

                        <Link
                            to="/login"
                            state={{ from: '/my-orders' }}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                        >
                            <User size={15} />
                            <span>Sign In with Email &amp; Password</span>
                        </Link>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                        <span>FDA Licensed 20B/21B Genuine Medicine Guarantee</span>
                    </div>
                </div>
            </div>
        )
    }

    // ── 3. Authenticated Orders Hub ──
    return (
        <div className="bg-gradient-to-b from-slate-50 via-slate-50 to-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ── Top Hero Passport Banner ── */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-100/40 via-indigo-100/20 to-transparent rounded-full -translate-y-20 translate-x-20 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    My Orders
                                </h1>
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {sseConnected ? 'Live Dispatch Stream Active' : 'Real-Time Sync Ready'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Account orders for{' '}
                                <strong className="text-slate-900 font-bold">
                                    {currentUser.displayName || currentUser.email}
                                </strong>
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                    <ShieldCheck size={14} className="text-emerald-600" />
                                    FDA License 20B/21B
                                </span>
                                <span>•</span>
                                <span className="text-slate-600">Nandurbar &amp; Dhule Express Hubs</span>
                            </div>
                        </div>

                        {/* Quick Helper Actions */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={fetchOrders}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                                title="Refresh order status"
                            >
                                <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} />
                                <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
                            </button>

                            <a
                                href="https://wa.me/919503500725?text=Hello%20Dhruv%20Pharma%2C%20I%20have%20an%20inquiry%20about%20my%20medicine%20order."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                                <MessageSquare size={14} />
                                <span>WhatsApp Pharmacist</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── Filters & Real-Time Search Bar ── */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Tab Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        {[
                            { key: 'all', label: 'All Orders', count: metrics.total },
                            { key: 'active', label: 'In Progress', count: metrics.active },
                            { key: 'delivered', label: 'Delivered', count: metrics.delivered },
                            { key: 'cancelled', label: 'Cancelled', count: metrics.cancelled },
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setActiveTab(t.key)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                                    activeTab === t.key
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            >
                                <span>{t.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                        activeTab === t.key
                                            ? 'bg-slate-700 text-white'
                                            : 'bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative sm:w-72">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Order ID, Medicine..."
                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Orders Feed ── */}
                {isLoading ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-4 shadow-2xs">
                        <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
                        <div>
                            <p className="text-sm font-bold text-slate-800">Retrieving Your Medicine Orders...</p>
                            <p className="text-xs text-slate-400 mt-1">Connecting to Nandurbar central dispatch ledger</p>
                        </div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 text-center space-y-5 shadow-2xs">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                            <ShoppingBag size={28} />
                        </div>
                        <div className="max-w-md mx-auto space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-lg">
                                {searchQuery || activeTab !== 'all' ? 'No Matching Orders Found' : 'No Medicine Orders Placed Yet'}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {searchQuery || activeTab !== 'all'
                                    ? `No orders matched your search "${searchQuery}" or the active filter tab. Try clearing the filter to see all orders.`
                                    : 'You have not placed any orders yet. Browse our verified pharmaceutical catalog to order medicines with doorstep delivery in 2–4 hours.'}
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            {searchQuery || activeTab !== 'all' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setActiveTab('all')
                                    }}
                                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                                >
                                    <span>Clear All Filters</span>
                                </button>
                            ) : (
                                <Link
                                    to="/medicines"
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs"
                                >
                                    <span>Browse Medicine Catalog</span>
                                    <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredOrders.map((order) => {
                            const orderId = order.orderId || order.id || 'DP-Order'
                            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                            const StatusIcon = cfg.icon
                            const items = parseOrderItems(order.items)
                            const isExpanded = Boolean(expandedOrders[orderId])
                            const displayedItems = isExpanded || items.length <= 2 ? items : items.slice(0, 2)
                            const totalAmount = parseFloat(order.totalAmount || order.amount || 0)
                            const isCod = (order.paymentMethod || 'COD').toUpperCase().includes('COD') || (order.paymentMethod || '').toUpperCase().includes('CASH')

                            return (
                                <div
                                    key={orderId}
                                    className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden"
                                >
                                    {/* ── Card Header Strip ── */}
                                    <div className="bg-slate-50/90 px-5 sm:px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {/* Order ID chip with copy button */}
                                            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2.5 py-1 shadow-2xs group">
                                                <span className="font-mono text-xs font-black text-slate-800 tracking-tight">
                                                    #{orderId}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyOrderId(orderId)}
                                                    className="ml-2 text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded cursor-pointer"
                                                    title="Copy Order ID"
                                                >
                                                    {copiedOrderId === orderId ? (
                                                        <Check size={13} className="text-emerald-600" />
                                                    ) : (
                                                        <Copy size={13} />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Placed Date */}
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-400 shrink-0" />
                                                Placed: <strong className="text-slate-700 font-bold">{order.date || order.createdAt || 'Recent'}</strong>
                                            </span>
                                        </div>

                                        {/* Status Pill */}
                                        <div className="flex items-center gap-2.5">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${cfg.badge}`}>
                                                <span className={`w-2 h-2 rounded-full ${cfg.dot} ${order.status !== 'cancelled' && order.status !== 'delivered' ? 'animate-pulse' : ''}`} />
                                                <StatusIcon size={13} />
                                                <span>{cfg.label}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── Real-Time Delivery / Dispatch Banner ── */}
                                    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 px-5 sm:px-6 py-3 border-b border-blue-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                        <div className="flex items-center gap-2.5 text-slate-800">
                                            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                                <Truck size={13} />
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-medium">Delivery Window: </span>
                                                <strong className="text-blue-900 font-extrabold">
                                                    {order.expectedDelivery || 'Expected in 3–4 Days (Express Hub Dispatch)'}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                                            {order.deliveryAgent && order.status === 'dispatched' && (
                                                <span className="bg-white/90 border border-blue-200 px-2.5 py-0.5 rounded-lg text-blue-800 font-bold">
                                                    Rider: {order.deliveryAgent}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <MapPin size={12} className="text-blue-600" />
                                                Hub: <strong className="text-slate-800">{order.district || 'Nandurbar'} {order.pincode ? `(${order.pincode})` : ''}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── 4-Step Interactive Fulfillment Progress Bar ── */}
                                    {order.status !== 'cancelled' ? (
                                        <div className="px-5 sm:px-8 py-5 bg-white border-b border-slate-100">
                                            <div className="relative flex items-center justify-between max-w-xl mx-auto">
                                                {/* Connecting track line */}
                                                <div className="absolute top-3.5 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
                                                <div
                                                    className="absolute top-3.5 left-4 h-1 bg-blue-600 -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${Math.min(100, Math.max(0, ((cfg.step - 1) / 3) * 100))}%` }}
                                                />

                                                {[
                                                    { step: 1, label: 'Order Placed', hint: 'Verified' },
                                                    { step: 2, label: 'Packed & Ready', hint: 'Quality Checked' },
                                                    { step: 3, label: 'Dispatched', hint: 'On The Way' },
                                                    { step: 4, label: 'Delivered', hint: 'Doorstep Handover' },
                                                ].map((s) => {
                                                    const isCompleted = cfg.step >= s.step
                                                    const isCurrent = cfg.step === s.step
                                                    return (
                                                        <div key={s.step} className="relative z-10 flex flex-col items-center">
                                                            <div
                                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                                                    isCurrent
                                                                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110'
                                                                        : isCompleted
                                                                        ? 'bg-blue-600 text-white shadow-2xs'
                                                                        : 'bg-white text-slate-400 border-2 border-slate-300'
                                                                }`}
                                                            >
                                                                {isCompleted ? '✓' : s.step}
                                                            </div>
                                                            <span
                                                                className={`text-[11px] mt-1.5 font-bold whitespace-nowrap ${
                                                                    isCurrent
                                                                        ? 'text-blue-700'
                                                                        : isCompleted
                                                                        ? 'text-slate-800'
                                                                        : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {s.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                                                                {s.hint}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="mt-3 text-center">
                                                <p className="text-xs text-slate-500 font-medium">
                                                    <span className="text-blue-700 font-bold">{cfg.stepTitle}: </span>
                                                    {cfg.description}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-5 sm:px-6 py-4 bg-rose-50/80 border-b border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5 border border-rose-200">
                                                    <AlertCircle size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-rose-950 text-sm">
                                                        {order.cancelledBy === 'admin'
                                                            ? 'Order Cancelled by Pharmacy Administration'
                                                            : 'Order Cancelled as Requested'}
                                                    </p>
                                                    <p className="text-rose-800 text-xs mt-0.5">
                                                        <strong>Reason:</strong>{' '}
                                                        {order.cancellationReason || order.reason || 'Customer cancelled via My Orders'}
                                                    </p>
                                                    <p className="text-slate-500 text-[11px] mt-1">
                                                        ✓ Bill voided (₹0.00 payable) · Reserved medicine inventory restored to catalog
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 self-start sm:self-auto">
                                                <a
                                                    href="tel:+919503500725"
                                                    className="inline-flex items-center gap-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-colors"
                                                >
                                                    <Phone size={13} />
                                                    <span>Call Support</span>
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Order Body: Purchased Medicines List ── */}
                                    <div className="p-5 sm:p-6 space-y-5">
                                        <div>
                                            <div className="flex items-center justify-between mb-2.5">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Pill size={14} className="text-blue-600" />
                                                    Prescription Medicines ({items.length})
                                                </p>
                                                {order.prescriptionFile && (
                                                    <a
                                                        href={order.prescriptionFile}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg"
                                                    >
                                                        <FileText size={12} />
                                                        <span>Prescription Attached</span>
                                                    </a>
                                                )}
                                            </div>

                                            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/40">
                                                {displayedItems.map((item, idx) => {
                                                    const dosageForm = detectDosageForm(item.name, item.salt, item.category)
                                                    const itemPrice = parseFloat(item.price || 0)
                                                    const itemQty = parseInt(item.qty || 1, 10)
                                                    const lineTotal = itemPrice * itemQty

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="p-3.5 sm:p-4 flex items-center justify-between gap-4 text-xs hover:bg-white transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                                                    <Pill size={18} />
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                                                            {item.name}
                                                                        </p>
                                                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                                                            {dosageForm}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-400">
                                                                        {item.salt || item.brand || 'Authentic formulation · Batch verified'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                <p className="font-black text-slate-900 text-sm">
                                                                    ₹{lineTotal.toFixed(2)}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 font-medium">
                                                                    Qty: <strong className="text-slate-600 font-bold">{itemQty}</strong> × ₹{itemPrice.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Expand/Collapse Toggle if order has >2 medicines */}
                                            {items.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpandOrder(orderId)}
                                                    className="w-full mt-2 py-1.5 text-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <span>Show Fewer Medicines</span>
                                                            <ChevronUp size={14} />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>View all {items.length} medicines (+{items.length - 2} more)</span>
                                                            <ChevronDown size={14} />
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* ── Delivery Info & Payment Breakdown ── */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                                            {/* Delivery Address */}
                                            <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
                                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                                    <MapPin size={13} className="text-blue-600 shrink-0" />
                                                    Doorstep Delivery Destination
                                                </p>
                                                <p className="text-slate-700 leading-relaxed font-medium">
                                                    {order.address}, {order.district} {order.pincode}
                                                </p>
                                                <p className="text-slate-500 text-[11px] pt-1">
                                                    Recipient: <strong>{order.customerName || order.patient || currentUser.displayName || 'Customer'}</strong> ({order.phone || order.customer_phone || '—'})
                                                </p>
                                            </div>

                                            {/* Payment & Financial Ledger */}
                                            <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 font-medium">Payment Mode:</span>
                                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                                                        isCod
                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    }`}>
                                                        {order.paymentMethod || 'Cash on Delivery (COD)'}
                                                    </span>
                                                </div>

                                                {isCod && order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                    <div className="p-2 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                                                        <span>💵 Please keep <strong>₹{totalAmount.toFixed(2)}</strong> cash ready for the delivery rider.</span>
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-900 font-bold">
                                                    <span className="text-xs">Total Bill:</span>
                                                    <span className="text-lg font-black text-blue-700">₹{totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Card Actions Footer ── */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Reorder Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorder(order)}
                                                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                                                >
                                                    <RefreshCw size={13} />
                                                    <span>Reorder Items ({items.length})</span>
                                                </button>

                                                {/* Tax Invoice */}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedInvoiceOrder(order)}
                                                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                                                >
                                                    <Printer size={13} />
                                                    <span>Tax Invoice</span>
                                                </button>
                                            </div>

                                            {/* Cancel Order capability (Active for pending or confirmed orders) */}
                                            {(order.status === 'pending' || order.status === 'confirmed') ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedOrderToCancel(order)
                                                        setCancelReason('Changed my mind / Placed by mistake')
                                                        setCancelModalOpen(true)
                                                    }}
                                                    className="inline-flex items-center gap-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <X size={13} />
                                                    <span>Cancel Order</span>
                                                </button>
                                            ) : order.status === 'cancelled' ? (
                                                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                                                    Order Voided
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                                    <span>Completed</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ── Toast Notification ── */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-3 border border-slate-800">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* ── Order Cancellation Modal ── */}
                {cancelModalOpen && selectedOrderToCancel && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl relative">
                            {/* Close */}
                            <button
                                type="button"
                                onClick={() => setCancelModalOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                                <AlertCircle size={28} />
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-black text-slate-900">Cancel Medicine Order?</h3>
                                <p className="text-xs text-slate-500">
                                    Are you sure you want to cancel Order{' '}
                                    <strong className="text-slate-900 font-mono font-bold">
                                        #{selectedOrderToCancel.orderId || selectedOrderToCancel.id}
                                    </strong>
                                    ?
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1.5">
                                <p className="font-bold text-slate-800">What happens when you cancel:</p>
                                <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                                    <li>Order processing and packing will cease immediately.</li>
                                    <li>Reserved medicines will be returned to warehouse catalog stock.</li>
                                    <li>Customer and store owner will receive automated cancellation notices.</li>
                                </ul>
                            </div>

                            {/* Reason Selector */}
                            <div className="space-y-1.5 text-xs">
                                <label className="block font-bold text-slate-700">Cancellation Reason</label>
                                <select
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white font-medium text-slate-800"
                                >
                                    <option value="Changed my mind / Placed by mistake">Changed my mind / Placed by mistake</option>
                                    <option value="Bought medicines from nearby local chemist">Bought medicines from nearby local chemist</option>
                                    <option value="Need to change delivery address or contact number">Need to change delivery address or contact number</option>
                                    <option value="Doctor revised or cancelled prescription">Doctor revised or cancelled prescription</option>
                                    <option value="Other operational reason">Other operational reason</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCancelModalOpen(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                >
                                    Keep Order
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmCancelOrder}
                                    disabled={isCancelling}
                                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {isCancelling ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Cancelling...</span>
                                        </>
                                    ) : (
                                        <span>Confirm Cancellation</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tax Invoice Modal ── */}
                {selectedInvoiceOrder && (
                    <OrderInvoiceModal
                        order={selectedInvoiceOrder}
                        isOpen={Boolean(selectedInvoiceOrder)}
                        onClose={() => setSelectedInvoiceOrder(null)}
                    />
                )}
            </div>
        </div>
    )
}
