import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    Search,
    Eye,
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    Phone,
    Package,
    X,
    Filter,
    Bell,
    Volume2,
    VolumeX,
    AlertCircle,
    ExternalLink,
    FileText,
    RefreshCw,
    Trash2,
    Check,
    Calendar,
} from 'lucide-react'

const STATUS_CONFIG = {
    pending:   { label: 'Pending Verification', style: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    confirmed: { label: 'Confirmed / Packed',   style: 'bg-purple-100 text-purple-800 border-purple-200', icon: CheckCircle },
    dispatched:{ label: 'Dispatched',           style: 'bg-orange-100 text-orange-800 border-orange-200', icon: Truck },
    delivered: { label: 'Delivered',            style: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle },
    cancelled: { label: 'Cancelled',            style: 'bg-red-100 text-red-800 border-red-200',          icon: X },
}

const ALL_STATUSES = ['all', 'pending', 'confirmed', 'dispatched', 'delivered']

function playChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) return
        const ctx = new AudioContext()

        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime)
        gain1.gain.setValueAtTime(0.15, ctx.currentTime)
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(ctx.currentTime)
        osc1.stop(ctx.currentTime + 0.3)

        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12)
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12)
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(ctx.currentTime + 0.12)
        osc2.stop(ctx.currentTime + 0.45)
    } catch (e) {
        console.warn('Audio chime could not be played:', e)
    }
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [liveNotification, setLiveNotification] = useState(null)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [editingDeliveryTimeId, setEditingDeliveryTimeId] = useState(null)
    const [tempDeliveryTime, setTempDeliveryTime] = useState('')

    // Fetch initial orders list
    const fetchOrders = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('http://localhost:8000/api/orders')
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
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
                        const newOrder = parsed.order
                        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)])

                        if (soundEnabled) playChime()

                        setLiveNotification({
                            id: newOrder.id,
                            name: newOrder.patient || newOrder.customerName,
                            amount: newOrder.amount || newOrder.totalAmount,
                        })

                        setTimeout(() => setLiveNotification(null), 6000)
                    }

                    if (parsed.type === 'status_update' && parsed.order) {
                        const updated = parsed.order
                        setOrders((prev) =>
                            prev.map((o) => (o.id === updated.id || o.orderId === updated.id ? updated : o))
                        )
                        if (selected && (selected.id === updated.id || selected.orderId === updated.id)) {
                            setSelected(updated)
                        }
                    }

                    if (parsed.type === 'order_deleted' && parsed.orderId) {
                        setOrders((prev) =>
                            prev.filter((o) => o.id !== parsed.orderId && o.orderId !== parsed.orderId)
                        )
                        if (selected && (selected.id === parsed.orderId || selected.orderId === parsed.orderId)) {
                            setSelected(null)
                        }
                    }
                } catch (e) {
                    // Ignore heartbeats
                }
            }
        } catch (err) {
            console.warn('Real-time SSE connection error:', err)
        }

        return () => {
            if (eventSource) eventSource.close()
        }
    }, [soundEnabled, selected])

    // Update Status Handler
    const handleStatusTransition = async (orderId, newStatus) => {
        setIsUpdatingStatus(true)
        try {
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId || o.orderId === orderId ? { ...o, status: newStatus } : o))
            )
            if (selected && (selected.id === orderId || selected.orderId === orderId)) {
                setSelected((prev) => ({ ...prev, status: newStatus }))
            }

            await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
        } catch (err) {
            console.error('Status transition error:', err)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    // Update Expected Delivery Time Handler
    const handleSaveDeliveryTime = async (orderId, newTime) => {
        if (!newTime || !newTime.trim()) return
        try {
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId || o.orderId === orderId ? { ...o, expectedDelivery: newTime } : o
                )
            )
            if (selected && (selected.id === orderId || selected.orderId === orderId)) {
                setSelected((prev) => ({ ...prev, expectedDelivery: newTime }))
            }

            await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expected_delivery: newTime.trim() }),
            })

            setEditingDeliveryTimeId(null)
        } catch (err) {
            console.error('Delivery time update error:', err)
        }
    }

    // Delete Order Handler
    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm(`Are you sure you want to permanently delete order ${orderId}? This cannot be undone.`)) {
            return
        }

        try {
            setOrders((prev) => prev.filter((o) => o.id !== orderId && o.orderId !== orderId))
            if (selected && (selected.id === orderId || selected.orderId === orderId)) {
                setSelected(null)
            }

            const res = await fetch(`http://localhost:8000/api/orders/${orderId}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                console.error('Failed to delete order from backend.')
            }
        } catch (err) {
            console.error('Delete order error:', err)
        }
    }

    const displayed = orders.filter((o) => {
        const matchStatus = filter === 'all' || o.status === filter
        const q = search.toLowerCase()
        const matchSearch =
            (o.patient && o.patient.toLowerCase().includes(q)) ||
            (o.customerName && o.customerName.toLowerCase().includes(q)) ||
            (o.id && o.id.toLowerCase().includes(q)) ||
            (o.phone && o.phone.toLowerCase().includes(q)) ||
            (o.district && o.district.toLowerCase().includes(q))
        return matchStatus && matchSearch
    })

    const totalRevenue = orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)

    const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Real-Time Notification Toast ── */}
                {liveNotification && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <Bell size={20} className="animate-bounce" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">New Real-Time Order Received!</p>
                                <p className="text-xs text-blue-100">
                                    Order <strong>{liveNotification.id}</strong> from <strong>{liveNotification.name}</strong> · Total: <strong>₹{liveNotification.amount}</strong>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setLiveNotification(null)}
                            className="text-white/80 hover:text-white p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">Orders Management</h1>
                            <span className="flex items-center gap-1 bg-green-100 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Real-Time Feed Active
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {orders.length} total orders · {pendingOrdersCount} pending · ₹{totalRevenue.toFixed(2)} collected
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Audio Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                soundEnabled
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-400'
                            }`}
                            title={soundEnabled ? 'Audio Chime Enabled' : 'Audio Chime Muted'}
                        >
                            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={fetchOrders}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ── Search + Filter ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                        <Search size={16} className="ml-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by patient name, phone, order ID or district..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2.5 text-xs outline-none bg-transparent"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {ALL_STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                                    filter === s
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                {s === 'all' ? `All (${orders.length})` : s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Orders Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Patient / Customer</th>
                                    <th className="py-3 px-4">Expected Delivery Window</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayed.map((o) => {
                                    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending
                                    const Icon = cfg.icon
                                    const isEditingThis = editingDeliveryTimeId === (o.id || o.orderId)

                                    return (
                                        <tr key={o.id || o.orderId} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                                                {o.id || o.orderId}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-bold text-gray-900">{o.patient || o.customerName}</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{o.phone} · {o.district}</p>
                                            </td>

                                            {/* Expected Delivery Date/Time Control */}
                                            <td className="py-3.5 px-4">
                                                {isEditingThis ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={tempDeliveryTime}
                                                            onChange={(e) => setTempDeliveryTime(e.target.value)}
                                                            placeholder="e.g. Tomorrow by 4:00 PM"
                                                            className="px-2 py-1 border border-blue-400 rounded-lg text-xs outline-none bg-white w-48 font-medium"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleSaveDeliveryTime(o.id || o.orderId, tempDeliveryTime)}
                                                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                            title="Save Delivery Time"
                                                        >
                                                            <Check size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingDeliveryTimeId(null)}
                                                            className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                            title="Cancel"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => {
                                                            setEditingDeliveryTimeId(o.id || o.orderId)
                                                            setTempDeliveryTime(o.expectedDelivery || 'Expected in 2–4 hours')
                                                        }}
                                                        className="group cursor-pointer flex items-center gap-1.5 text-gray-700 hover:text-blue-600"
                                                        title="Click to edit expected delivery time"
                                                    >
                                                        <Truck size={13} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
                                                        <span className="font-medium underline decoration-dotted decoration-gray-300">
                                                            {o.expectedDelivery || 'Expected in 2–4 hours'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <p className="font-bold text-gray-900">₹{o.amount || o.totalAmount}</p>
                                                <p className="text-[10px] text-gray-400">{o.paymentMethod}</p>
                                            </td>

                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${cfg.style}`}>
                                                    <Icon size={11} /> {cfg.label}
                                                </span>
                                            </td>

                                            {/* Action Buttons: Inspect & Delete */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelected(o)}
                                                        className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                                                        title="Inspect full order"
                                                    >
                                                        <Eye size={12} /> Inspect
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOrder(o.id || o.orderId)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Delete order"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}

                                {displayed.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400">
                                            <Package size={36} className="mx-auto mb-2 text-gray-200" />
                                            <p className="font-semibold text-gray-600 text-sm">No orders found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Order Detail & Prescription Modal ── */}
                {selected && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="font-bold text-gray-900 text-base">
                                        Order {selected.id || selected.orderId} · {selected.patient || selected.customerName}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Placed: {selected.date || selected.createdAt}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDeleteOrder(selected.id || selected.orderId)}
                                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                        title="Delete this order"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="text-gray-400 hover:text-gray-700 p-1"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-5 text-xs">

                                {/* Status Workflow Transition Bar */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-700">Status:</span>
                                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                                            STATUS_CONFIG[selected.status]?.style || 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {STATUS_CONFIG[selected.status]?.label || selected.status}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {selected.status === 'pending' && (
                                            <button
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleStatusTransition(selected.id || selected.orderId, 'confirmed')}
                                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                            >
                                                <Check size={12} /> Verify &amp; Confirm
                                            </button>
                                        )}
                                        {selected.status === 'confirmed' && (
                                            <button
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleStatusTransition(selected.id || selected.orderId, 'dispatched')}
                                                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                            >
                                                <Truck size={12} /> Dispatch Order
                                            </button>
                                        )}
                                        {selected.status === 'dispatched' && (
                                            <button
                                                disabled={isUpdatingStatus}
                                                onClick={() => handleStatusTransition(selected.id || selected.orderId, 'delivered')}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                            >
                                                <CheckCircle size={12} /> Mark Delivered
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expected Delivery Time Setting */}
                                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2">
                                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                        <Truck size={14} className="text-blue-600" /> Set Expected Delivery Time (Broadcasts to Customer Live)
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            defaultValue={selected.expectedDelivery || 'Expected in 2–4 hours'}
                                            id="modalDeliveryTimeInput"
                                            className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-xs outline-none bg-white font-medium"
                                            placeholder="e.g. Expected by tomorrow, 4:00 PM"
                                        />
                                        <button
                                            onClick={() => {
                                                const val = document.getElementById('modalDeliveryTimeInput').value
                                                handleSaveDeliveryTime(selected.id || selected.orderId, val)
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                                        >
                                            Save Window
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {['Within 2 hours', 'Today by 6:00 PM', 'Tomorrow by 11:00 AM', 'Tomorrow by 4:00 PM'].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    document.getElementById('modalDeliveryTimeInput').value = preset
                                                    handleSaveDeliveryTime(selected.id || selected.orderId, preset)
                                                }}
                                                className="bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors"
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer Info Grid */}
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
                                    <div>
                                        <p className="text-gray-400 font-semibold mb-0.5">Customer Phone</p>
                                        <p className="font-bold text-gray-900">{selected.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-semibold mb-0.5">District / Region</p>
                                        <p className="font-bold text-gray-900">{selected.district} {selected.pincode}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-400 font-semibold mb-0.5">Full Delivery Address</p>
                                        <p className="font-medium text-gray-800">{selected.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-semibold mb-0.5">Payment Method</p>
                                        <p className="font-bold text-gray-900">{selected.paymentMethod} ({selected.paymentStatus || 'pending'})</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-semibold mb-0.5">Delivery Agent</p>
                                        <p className="font-bold text-gray-900">{selected.agent || selected.deliveryAgent}</p>
                                    </div>
                                </div>

                                {/* Attached Prescription Viewer (If Any) */}
                                {selected.prescriptionFile && (
                                    <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-red-900 flex items-center gap-1.5">
                                                <FileText size={15} /> Attached Doctor's Prescription
                                            </span>
                                            <a
                                                href={`http://localhost:8000${selected.prescriptionFile}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                                            >
                                                <ExternalLink size={12} /> Open Full View
                                            </a>
                                        </div>
                                        <div className="rounded-lg overflow-hidden border border-red-200 bg-gray-900 max-h-60 flex items-center justify-center">
                                            {selected.prescriptionFile.endsWith('.pdf') ? (
                                                <div className="p-8 text-center text-white">
                                                    <FileText size={40} className="mx-auto mb-2 text-red-400" />
                                                    <p className="font-bold">PDF Prescription Document</p>
                                                </div>
                                            ) : (
                                                <img
                                                    src={`http://localhost:8000${selected.prescriptionFile}`}
                                                    alt="Prescription"
                                                    className="w-full h-full object-contain max-h-56"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Itemized Medicines Table */}
                                <div>
                                    <p className="font-bold text-gray-800 mb-2">Itemized Medicines</p>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                                                    <th className="py-2 px-3">Item</th>
                                                    <th className="py-2 px-3 text-center">Qty</th>
                                                    <th className="py-2 px-3 text-right">Price</th>
                                                    <th className="py-2 px-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(selected.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-2.5 px-3">
                                                            <p className="font-bold text-gray-900">{item.name}</p>
                                                            <p className="text-[10px] text-gray-400">{item.salt || item.brand}</p>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center font-semibold text-gray-700">
                                                            {item.qty}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right text-gray-600">
                                                            ₹{item.price}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                                                            ₹{(item.price * item.qty).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Total Amount */}
                                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm font-bold">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-700 text-base">₹{selected.amount || selected.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
