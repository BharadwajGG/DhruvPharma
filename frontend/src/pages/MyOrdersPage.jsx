import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import {
    Package,
    Clock,
    CheckCircle,
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
} from 'lucide-react'

const STATUS_CONFIG = {
    pending: {
        label: 'Pending Verification',
        style: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        step: 1,
    },
    confirmed: {
        label: 'Order Confirmed',
        style: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: CheckCircle,
        step: 2,
    },
    dispatched: {
        label: 'Dispatched / Out for Delivery',
        style: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Truck,
        step: 3,
    },
    delivered: {
        label: 'Delivered',
        style: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        step: 4,
    },
    cancelled: {
        label: 'Cancelled',
        style: 'bg-red-100 text-red-800 border-red-200',
        icon: X,
        step: 0,
    },
}

export default function MyOrdersPage() {
    const { currentUser, loading: authLoading, loginWithGoogle } = useAuth()
    const { customerOrders } = useCart()
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [authError, setAuthError] = useState('')

    // Fetch orders strictly scoped to authenticated user
    const fetchOrders = async () => {
        if (!currentUser) {
            setOrders([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            // Strictly scope query by logged-in user's UID and email
            const queryParams = new URLSearchParams()
            if (currentUser.uid) queryParams.set('userId', currentUser.uid)
            if (currentUser.email) queryParams.set('email', currentUser.email)

            const res = await fetch(`http://localhost:8000/api/orders?${queryParams.toString()}`)
            if (res.ok) {
                const serverOrders = await res.json()
                if (Array.isArray(serverOrders)) {
                    // Double security check on client: ensure no other user's order slips through
                    const isolated = serverOrders.filter((o) => {
                        const matchesUid = o.userId && o.userId === currentUser.uid
                        const matchesEmail = o.email && currentUser.email && o.email.toLowerCase() === currentUser.email.toLowerCase()
                        return matchesUid || matchesEmail
                    })
                    setOrders(isolated)
                    return
                }
            }
            // Fallback to locally isolated customer orders
            setOrders(customerOrders || [])
        } catch (err) {
            console.warn('Backend unavailable, using isolated local orders:', err)
            setOrders(customerOrders || [])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            fetchOrders()
        }
    }, [currentUser, authLoading])

    // Real-Time Server-Sent Events (SSE) Listener: live updates scoped strictly to this user
    useEffect(() => {
        if (!currentUser) return

        let eventSource = null
        try {
            eventSource = new EventSource('http://localhost:8000/api/orders/stream')

            eventSource.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data)

                    // 1. Live status or expected delivery update
                    if (parsed.type === 'status_update' && parsed.order) {
                        const updated = parsed.order
                        // Only update if it belongs to current user
                        const isMine =
                            updated.userId === currentUser.uid ||
                            (updated.email && currentUser.email && updated.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                            orders.some((o) => o.id === updated.id || o.orderId === updated.id)

                        if (isMine) {
                            setOrders((prev) =>
                                prev.map((o) => (o.id === updated.id || o.orderId === updated.id ? updated : o))
                            )
                        }
                    }

                    // 2. Newly placed order
                    if (parsed.type === 'new_order' && parsed.order) {
                        const newOrder = parsed.order
                        const isMine =
                            newOrder.userId === currentUser.uid ||
                            (newOrder.email && currentUser.email && newOrder.email.toLowerCase() === currentUser.email.toLowerCase())

                        if (isMine) {
                            setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)])
                        }
                    }

                    // 3. Order deleted by admin
                    if (parsed.type === 'order_deleted' && parsed.orderId) {
                        setOrders((prev) =>
                            prev.filter((o) => o.id !== parsed.orderId && o.orderId !== parsed.orderId)
                        )
                    }
                } catch (e) {
                    // Ignore parsing glitches or heartbeats
                }
            }
        } catch (e) {
            console.warn('Real-time connection error:', e)
        }

        return () => {
            if (eventSource) eventSource.close()
        }
    }, [currentUser, orders])

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

    // ── 1. Loading State ──
    if (authLoading) {
        return (
            <div className="bg-gray-50 min-h-screen py-16 px-4 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
                    <p className="text-xs text-gray-500 font-medium">Verifying authentication session...</p>
                </div>
            </div>
        )
    }

    // ── 2. Unauthenticated Guard Screen ──
    if (!currentUser) {
        return (
            <div className="bg-gray-50 min-h-screen py-12 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10 text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                        <Lock size={32} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Sign in to view your orders
                        </h2>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            To protect your health records and personal information, order history and live prescription delivery status require sign-in.
                        </p>
                    </div>

                    {authError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{authError}</span>
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        {/* Primary Google Sign-In Button */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl border border-gray-300 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
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
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">
                                    or
                                </span>
                            </div>
                        </div>

                        {/* Email Sign-In Option */}
                        <Link
                            to="/login"
                            state={{ from: '/my-orders' }}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition-colors"
                        >
                            <User size={15} />
                            <span>Sign In with Email & Password</span>
                        </Link>
                    </div>

                    <p className="text-[11px] text-gray-400">
                        New to Dhruv Pharma? You can create a free account in just a few clicks.
                    </p>
                </div>
            </div>
        )
    }

    // ── 3. Authenticated Orders Hub ──
    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                            <span className="flex items-center gap-1 bg-green-100 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Live Status
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                            Orders for <strong className="text-gray-800">{currentUser.displayName || currentUser.email}</strong>
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={fetchOrders}
                            disabled={isLoading}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                {isLoading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
                        <Loader2 size={28} className="animate-spin text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-500">Retrieving your order history...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                            <ShoppingBag size={32} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">No Orders Placed Yet</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                You haven't placed any medicine orders on this account yet. Explore our genuine pharmacy catalog to place your first order.
                            </p>
                        </div>
                        <Link
                            to="/medicines"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-2xs"
                        >
                            <span>Browse Medicine Store</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                            const Icon = cfg.icon
                            const items = Array.isArray(order.items) ? order.items : []

                            return (
                                <div
                                    key={order.id || order.orderId}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden transition-all hover:border-blue-200"
                                >
                                    {/* Order Top Bar */}
                                    <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                                                {order.id || order.orderId}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Placed: <strong className="text-gray-700">{order.date || order.createdAt}</strong>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.style}`}>
                                                <Icon size={13} />
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Real-Time Expected Delivery Banner */}
                                    <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 px-5 py-2.5 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                                            <Truck size={15} className="text-blue-600 shrink-0" />
                                            <span>
                                                Delivery Window:{' '}
                                                <span className="text-blue-700 font-extrabold">
                                                    {order.expectedDelivery || 'Expected in 2–4 hours'}
                                                </span>
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-blue-800 font-medium">
                                            Agent: <strong>{order.agent || order.deliveryAgent || 'Sanjay Kumar (Dhruv Express)'}</strong>
                                        </span>
                                    </div>

                                    {/* Order Body: Purchased Medicines List */}
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                Purchased Medicines ({items.length})
                                            </p>
                                            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                                {items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-3 flex items-center justify-between gap-4 text-xs"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                                <Pill size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                                <p className="text-[11px] text-gray-400 italic">
                                                                    {item.salt || item.brand || 'Clinical formulation'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0">
                                                            <p className="font-bold text-gray-900">
                                                                ₹{(item.price * item.qty).toFixed(2)}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">
                                                                Qty: {item.qty} × ₹{item.price}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Delivery Info & Total */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 text-xs">
                                            <div>
                                                <p className="font-bold text-gray-700 flex items-center gap-1 mb-1">
                                                    <MapPin size={13} className="text-gray-400" /> Doorstep Delivery Address
                                                </p>
                                                <p className="text-gray-600 leading-relaxed">
                                                    {order.address}, {order.district} {order.pincode}
                                                </p>
                                                <p className="text-gray-400 text-[11px] mt-0.5">Phone: {order.phone}</p>
                                            </div>

                                            <div className="sm:text-right flex flex-col justify-end">
                                                <p className="text-gray-400 text-xs">
                                                    Payment: <strong className="text-gray-700">{order.paymentMethod}</strong> ({order.paymentStatus || 'pending'})
                                                </p>
                                                <div className="text-sm font-bold text-gray-900 mt-1">
                                                    Total Paid/Due: <span className="text-blue-700 text-base">₹{order.amount || order.totalAmount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
