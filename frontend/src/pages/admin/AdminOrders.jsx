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
    PhoneCall,
    Plus,
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
    Pill,
    UserCheck,
    ShoppingBag,
    Loader2,
    Printer,
    Copy,
    MessageSquare,
} from 'lucide-react'
import OrderInvoiceModal from '../../components/OrderInvoiceModal'

const STATUS_CONFIG = {
    pending:   { label: 'New Order',       style: 'bg-amber-100 text-amber-900 border-amber-200', icon: Clock },
    confirmed: { label: 'Packed & Ready',  style: 'bg-blue-100 text-blue-900 border-blue-200',   icon: CheckCircle },
    dispatched:{ label: 'Out for Delivery',style: 'bg-purple-100 text-purple-900 border-purple-200', icon: Truck },
    delivered: { label: 'Delivered',       style: 'bg-emerald-100 text-emerald-900 border-emerald-200', icon: CheckCircle },
    cancelled: { label: 'Cancelled',       style: 'bg-rose-100 text-rose-900 border-rose-200', icon: X },
}

const ALL_STATUSES = [
    { key: 'all',        label: 'All Orders' },
    { key: 'pending',    label: 'New Orders' },
    { key: 'confirmed',  label: 'Packed & Ready' },
    { key: 'dispatched', label: 'Out for Delivery' },
    { key: 'delivered',  label: 'Delivered' },
]

const DELIVERY_HUBS = [
    { name: 'All Hubs', pincode: 'all' },
    { name: 'Nandurbar', pincode: '425412' },
    { name: 'Shahada', pincode: '425409' },
    { name: 'Taloda', pincode: '425413' },
    { name: 'Nijampur', pincode: '424305' },
    { name: 'Akkalkuwa', pincode: '425415' },
    { name: 'Shirpur', pincode: '424405' },
    { name: 'Sakri', pincode: '424304' },
]

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
    const [areaFilter, setAreaFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [liveNotification, setLiveNotification] = useState(null)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [editingDeliveryTimeId, setEditingDeliveryTimeId] = useState(null)
    const [tempDeliveryTime, setTempDeliveryTime] = useState('')

    // ── Bulk Selection & Invoice States ──
    const [selectedOrderIds, setSelectedOrderIds] = useState([])
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null)
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)
    const [stockAlertMessage, setStockAlertMessage] = useState('')
    const [copiedCallbackPhone, setCopiedCallbackPhone] = useState(null)

    // ── Callbacks Queue & Phone Orders States ──
    const [callbacks, setCallbacks] = useState([])
    const [callbacksModalOpen, setCallbacksModalOpen] = useState(false)
    const [phoneOrderModalOpen, setPhoneOrderModalOpen] = useState(false)
    const [selectedCallbackForOrder, setSelectedCallbackForOrder] = useState(null)
    const [medicinesCatalog, setMedicinesCatalog] = useState([])
    const [isSubmittingPhoneOrder, setIsSubmittingPhoneOrder] = useState(false)

    // Phone Order Form
    const [phoneOrderForm, setPhoneOrderForm] = useState({
        customerName: '',
        phone: '',
        email: '',
        district: 'Nandurbar',
        pincode: '425412',
        address: '',
        items: [],
        paymentMethod: 'COD',
        notes: 'Phone order taken by pharmacist',
    })
    const [selectedMedId, setSelectedMedId] = useState('')
    const [selectedMedQty, setSelectedMedQty] = useState(1)

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

    // Fetch callback requests
    const fetchCallbacks = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/callbacks')
            if (res.ok) {
                const data = await res.json()
                setCallbacks(data)
            }
        } catch (err) {
            console.error('Failed to fetch callbacks:', err)
        }
    }

    // Fetch medicines catalog for phone order search
    const fetchMedicines = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/medicines')
            if (res.ok) {
                const data = await res.json()
                setMedicinesCatalog(data)
            }
        } catch (err) {
            console.error('Failed to fetch medicines catalog:', err)
        }
    }

    useEffect(() => {
        fetchOrders()
        fetchCallbacks()
        fetchMedicines()
    }, [])

    // Real-Time Server-Sent Events (SSE) Listener
    useEffect(() => {
        let eventSource = null

        try {
            eventSource = new EventSource('http://localhost:8000/api/orders/stream')

            eventSource.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data)

                    // 1. New Order
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

                    // 2. New Callback Request from Customer (Order via Call)
                    if (parsed.type === 'new_callback' && parsed.order) {
                        const newCb = parsed.order
                        setCallbacks((prev) => [newCb, ...prev.filter((c) => c.id !== newCb.id)])

                        if (soundEnabled) playChime()

                        setLiveNotification({
                            id: newCb.requestId || 'Callback',
                            name: `📞 Callback: ${newCb.customerName}`,
                            amount: newCb.phone,
                        })

                        setTimeout(() => setLiveNotification(null), 7000)
                    }

                    // 3. Callback Updated
                    if (parsed.type === 'callback_update' && parsed.order) {
                        const updatedCb = parsed.order
                        setCallbacks((prev) =>
                            prev.map((c) => (c.id === updatedCb.id ? updatedCb : c))
                        )
                    }

                    // 4. Order Status Update
                    if (parsed.type === 'status_update' && parsed.order) {
                        const updated = parsed.order
                        setOrders((prev) =>
                            prev.map((o) => (o.id === updated.id || o.orderId === updated.id ? updated : o))
                        )
                        if (selected && (selected.id === updated.id || selected.orderId === updated.id)) {
                            setSelected(updated)
                        }
                    }

                    // 5. Real-Time Order Cancelled
                    if (parsed.type === 'order_cancelled' && parsed.order) {
                        const cancelled = parsed.order
                        setOrders((prev) =>
                            prev.map((o) => (o.id === cancelled.id || o.orderId === cancelled.id ? { ...o, status: 'cancelled' } : o))
                        )
                        if (selected && (selected.id === cancelled.id || selected.orderId === cancelled.id)) {
                            setSelected((prev) => ({ ...prev, status: 'cancelled' }))
                        }
                        if (soundEnabled) playChime()
                        const byWhom = parsed.cancelledBy === 'customer' ? 'Customer' : 'Store Admin'
                        setStockAlertMessage(`⚠️ Order #${cancelled.orderId || cancelled.id} was CANCELLED by ${byWhom}. Notification email & WhatsApp delivered.`)
                        setTimeout(() => setStockAlertMessage(''), 10000)
                    }

                    // 6. Real-Time Stock Updated
                    if (parsed.type === 'stock_updated' && parsed.message) {
                        setStockAlertMessage(parsed.message)
                        setTimeout(() => setStockAlertMessage(''), 8000)
                    }

                    // 7. Order Deleted
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

            const res = await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            const data = await res.json()
            if (res.ok) {
                if (data.stockMessage) {
                    setStockAlertMessage(`📦 Order #${orderId}: ${data.stockMessage}`)
                    setTimeout(() => setStockAlertMessage(''), 8000)
                } else if (newStatus === 'cancelled') {
                    setStockAlertMessage(`⚠️ Order #${orderId} has been cancelled. Confirmation sent via WhatsApp & Email.`)
                    setTimeout(() => setStockAlertMessage(''), 8000)
                } else if (data.message) {
                    setStockAlertMessage(data.message)
                    setTimeout(() => setStockAlertMessage(''), 6000)
                }
            }
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

    // ── Bulk Order Actions ──
    const handleBulkUpdateStatus = async (newStatus) => {
        if (!selectedOrderIds.length) return
        setIsBulkUpdating(true)
        try {
            const res = await fetch('http://localhost:8000/api/orders/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_ids: selectedOrderIds, status: newStatus }),
            })
            const data = await res.json()
            if (res.ok) {
                setOrders((prev) =>
                    prev.map((o) => (selectedOrderIds.includes(o.id || o.orderId) ? { ...o, status: newStatus } : o))
                )
                const count = data.updatedCount || data.updated_count || selectedOrderIds.length
                setSelectedOrderIds([])
                setStockAlertMessage(data.message || `Successfully updated ${count} orders to "${newStatus}".`)
                setTimeout(() => setStockAlertMessage(''), 8000)
            } else {
                alert(data.detail || 'Failed to update orders.')
            }
        } catch (err) {
            console.error('Bulk update error:', err)
            alert('Network error while performing bulk update.')
        } finally {
            setIsBulkUpdating(false)
        }
    }

    // Delete Callback Request Handler
    const handleDeleteCallback = async (callbackId) => {
        if (!window.confirm('Delete this customer callback request? This will permanently remove it from the queue.')) {
            return
        }
        setCallbacks((prev) => prev.filter((c) => c.id !== callbackId))
        try {
            const res = await fetch(`http://localhost:8000/api/callbacks/${callbackId}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                console.error('Failed to delete callback on server.')
            }
        } catch (err) {
            console.error('Delete callback error:', err)
        }
    }

    const toggleSelectAll = () => {
        const currentDisplayedIds = displayed.map((o) => o.id || o.orderId)
        const allSelected = currentDisplayedIds.length > 0 && currentDisplayedIds.every((id) => selectedOrderIds.includes(id))
        if (allSelected) {
            setSelectedOrderIds((prev) => prev.filter((id) => !currentDisplayedIds.includes(id)))
        } else {
            setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...currentDisplayedIds])))
        }
    }

    const toggleSelectRow = (orderId) => {
        setSelectedOrderIds((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        )
    }

    // ── Callbacks Handlers ──
    const handleUpdateCallbackStatus = async (callbackId, newStatus) => {
        try {
            setCallbacks((prev) =>
                prev.map((c) => (c.id === callbackId ? { ...c, status: newStatus } : c))
            )
            await fetch(`http://localhost:8000/api/callbacks/${callbackId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
        } catch (err) {
            console.error('Failed to update callback status:', err)
        }
    }

    // Open Phone Order Modal (optionally linked to a callback)
    const handleOpenPhoneOrder = (callbackItem = null) => {
        setSelectedCallbackForOrder(callbackItem)
        setPhoneOrderForm({
            customerName: callbackItem ? callbackItem.customerName : '',
            phone: callbackItem ? callbackItem.phone : '',
            email: '',
            district: callbackItem ? callbackItem.district : 'Pune',
            address: '',
            pincode: '',
            items: [],
            paymentMethod: 'COD',
            notes: callbackItem
                ? `Phone order from Callback #${callbackItem.requestId}. Notes: ${callbackItem.medicinesNeeded || 'None'}`
                : 'Phone order taken on call by pharmacist',
        })
        setSelectedMedId('')
        setSelectedMedQty(1)
        if (callbackItem) {
            setCallbacksModalOpen(false)
        }
        setPhoneOrderModalOpen(true)
    }

    // Add item to phone order
    const handleAddItemToPhoneOrder = () => {
        if (!selectedMedId) return
        const med = medicinesCatalog.find((m) => String(m.id) === String(selectedMedId))
        if (!med) return

        const qty = Math.max(1, parseInt(selectedMedQty) || 1)
        const price = med.sellingPrice || med.price || 0

        setPhoneOrderForm((prev) => {
            const existingIdx = prev.items.findIndex((i) => i.id === med.id)
            let updatedItems
            if (existingIdx >= 0) {
                updatedItems = [...prev.items]
                updatedItems[existingIdx].qty += qty
            } else {
                updatedItems = [
                    ...prev.items,
                    {
                        id: med.id,
                        name: med.name,
                        price: Number(price),
                        qty,
                        salt: med.salt || '',
                        brand: med.brand || med.manufacturer || 'Generic',
                    },
                ]
            }
            return { ...prev, items: updatedItems }
        })
        setSelectedMedId('')
        setSelectedMedQty(1)
    }

    // Remove item from phone order
    const handleRemoveItemFromPhoneOrder = (index) => {
        setPhoneOrderForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }))
    }

    // Submit Phone Order
    const handleSubmitPhoneOrder = async (e) => {
        e.preventDefault()
        if (!phoneOrderForm.customerName.trim() || !phoneOrderForm.phone.trim() || !phoneOrderForm.address.trim()) {
            alert('Customer name, 10-digit phone, and delivery address are required.')
            return
        }
        if (phoneOrderForm.items.length === 0) {
            alert('Please add at least one medicine item to this phone order.')
            return
        }

        setIsSubmittingPhoneOrder(true)
        try {
            const payload = {
                customerName: phoneOrderForm.customerName.trim(),
                phone: phoneOrderForm.phone.trim(),
                email: phoneOrderForm.email.trim(),
                district: phoneOrderForm.district,
                address: phoneOrderForm.address.trim(),
                pincode: phoneOrderForm.pincode.trim(),
                items: phoneOrderForm.items,
                paymentMethod: phoneOrderForm.paymentMethod,
                notes: phoneOrderForm.notes.trim(),
                callbackId: selectedCallbackForOrder ? selectedCallbackForOrder.id : null,
            }

            const res = await fetch('http://localhost:8000/api/admin/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const result = await res.json()
            if (!res.ok) {
                throw new Error(result.detail || 'Failed to place phone order.')
            }

            setPhoneOrderModalOpen(false)
            setSelectedCallbackForOrder(null)
            fetchOrders()
            fetchCallbacks()
            alert(result.message || 'Phone order created successfully!')
        } catch (err) {
            console.error('Phone order error:', err)
            alert(err.message || 'Failed to create phone order.')
        } finally {
            setIsSubmittingPhoneOrder(false)
        }
    }

    const pendingCallbacksCount = callbacks.filter((c) => c.status === 'pending').length

    const displayed = orders.filter((o) => {
        const matchStatus = filter === 'all' || o.status === filter
        const matchArea = areaFilter === 'all' ||
            (o.pincode && String(o.pincode).trim() === areaFilter) ||
            (o.district && o.district.toLowerCase().includes(DELIVERY_HUBS.find(h => h.pincode === areaFilter)?.name.toLowerCase() || ''))
        const q = search.toLowerCase()
        const matchSearch =
            (o.patient && o.patient.toLowerCase().includes(q)) ||
            (o.customerName && o.customerName.toLowerCase().includes(q)) ||
            (o.id && o.id.toLowerCase().includes(q)) ||
            (o.phone && o.phone.toLowerCase().includes(q)) ||
            (o.district && o.district.toLowerCase().includes(q)) ||
            (o.pincode && String(o.pincode).includes(q))
        return matchStatus && matchArea && matchSearch
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

                {/* ── Real-Time Stock & Cancellation Alert Banner ── */}
                {stockAlertMessage && (
                    <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-300 border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-emerald-400">Inventory &amp; Order Notification</p>
                                <p className="text-xs text-slate-200 mt-0.5">{stockAlertMessage}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setStockAlertMessage('')}
                            className="text-slate-400 hover:text-white p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-bold text-slate-900">Customer Orders</h1>
                            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Store Connected
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                            {orders.length} total orders · {pendingOrdersCount} waiting for dispatch · ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} money collected
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Callbacks Queue Button */}
                        <button
                            type="button"
                            onClick={() => setCallbacksModalOpen(true)}
                            className="relative bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <PhoneCall size={14} className="text-emerald-700" />
                            <span>Customer Callbacks</span>
                            {pendingCallbacksCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                                    {pendingCallbacksCount}
                                </span>
                            )}
                        </button>

                        {/* Take Phone Order Button */}
                        <button
                            type="button"
                            onClick={() => handleOpenPhoneOrder()}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>+ New Phone Order</span>
                        </button>

                        {/* Audio Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                soundEnabled
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-white border-slate-200 text-slate-400'
                            }`}
                            title={soundEnabled ? 'Order notification chime enabled' : 'Order notification chime muted'}
                        >
                            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={() => {
                                fetchOrders()
                                fetchCallbacks()
                            }}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            Refresh List
                        </button>
                    </div>
                </div>

                {/* ── Search + Filter ── */}
                <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all shadow-2xs">
                            <Search size={16} className="ml-4 text-slate-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search by customer name, phone number, order ID, town, or PIN code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 px-3 py-2.5 text-xs outline-none bg-transparent"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {ALL_STATUSES.map((item) => {
                                const count = item.key === 'all'
                                    ? orders.length
                                    : orders.filter((o) => o.status === item.key).length
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => setFilter(item.key)}
                                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                            filter === item.key
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                        }`}
                                    >
                                        <span>{item.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                            filter === item.key ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── Delivery Hub Selector Bar (Real-Time Serviceable Areas) ── */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <MapPin size={12} className="text-emerald-700" />
                            Town / Hub:
                        </span>
                        {DELIVERY_HUBS.map((hub) => (
                            <button
                                key={hub.pincode}
                                onClick={() => setAreaFilter(hub.pincode)}
                                className={`shrink-0 px-2.5 py-1 rounded-lg font-bold transition-all text-xs border cursor-pointer ${
                                    areaFilter === hub.pincode
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {hub.name} {hub.pincode !== 'all' && <span className="opacity-70 text-[10px]">({hub.pincode})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Bulk Actions Toolbar ── */}
                {selectedOrderIds.length > 0 && (
                    <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-xs bg-emerald-500 text-slate-900 px-3 py-1 rounded-xl shadow-xs">
                                {selectedOrderIds.length} Order{selectedOrderIds.length > 1 ? 's' : ''} Selected
                            </span>
                            <span className="text-xs text-slate-300 hidden md:inline">
                                Update all selected orders at once:
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkUpdateStatus('confirmed')}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                                <Check size={12} /> Mark Packed
                            </button>
                            <button
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkUpdateStatus('dispatched')}
                                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                                <Truck size={12} /> Out for Delivery
                            </button>
                            <button
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkUpdateStatus('delivered')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                                <CheckCircle size={12} /> Mark Delivered
                            </button>
                            <button
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkUpdateStatus('cancelled')}
                                className="bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                                <X size={12} /> Cancel Orders
                            </button>
                            <button
                                onClick={() => setSelectedOrderIds([])}
                                className="text-xs text-slate-400 hover:text-white underline ml-2 cursor-pointer font-medium"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Orders Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-3 text-center w-10">
                                        <input
                                            type="checkbox"
                                            checked={displayed.length > 0 && displayed.every((o) => selectedOrderIds.includes(o.id || o.orderId))}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            title="Select all displayed orders"
                                        />
                                    </th>
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
                                    const isRowSelected = selectedOrderIds.includes(o.id || o.orderId)

                                    return (
                                        <tr key={o.id || o.orderId} className={`hover:bg-blue-50/20 transition-colors ${isRowSelected ? 'bg-blue-50/40' : ''}`}>
                                            <td className="py-3.5 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isRowSelected}
                                                    onChange={() => toggleSelectRow(o.id || o.orderId)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                                                {o.id || o.orderId}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-bold text-slate-900">{o.patient || o.customerName}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                    {o.phone ? (
                                                        <a
                                                            href={`tel:${o.phone}`}
                                                            className="hover:text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold text-slate-700"
                                                            title="Click to call customer"
                                                        >
                                                            <Phone size={10} className="text-emerald-600" />
                                                            <span>{o.phone}</span>
                                                        </a>
                                                    ) : (
                                                        <span>No phone</span>
                                                    )}
                                                    <span>·</span>
                                                    <span className="inline-flex items-center gap-0.5 text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                                                        <MapPin size={10} className="text-emerald-700" />
                                                        {o.district || 'Nandurbar'} {o.pincode ? `(${o.pincode})` : ''}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Expected Delivery Date/Time Control */}
                                            <td className="py-3.5 px-4">
                                                {isEditingThis ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={tempDeliveryTime}
                                                            onChange={(e) => setTempDeliveryTime(e.target.value)}
                                                            placeholder="e.g. Expected in 3–4 Days"
                                                            className="px-2 py-1 border border-emerald-400 rounded-lg text-xs outline-none bg-white w-48 font-medium"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleSaveDeliveryTime(o.id || o.orderId, tempDeliveryTime)}
                                                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                                            title="Save Delivery Time"
                                                        >
                                                            <Check size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingDeliveryTimeId(null)}
                                                            className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                                                            title="Cancel"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => {
                                                             setEditingDeliveryTimeId(o.id || o.orderId)
                                                             setTempDeliveryTime(o.expectedDelivery || 'Expected in 3–4 Days')
                                                        }}
                                                        className="group cursor-pointer flex items-center gap-1.5 text-slate-700 hover:text-emerald-700"
                                                        title="Click to edit expected delivery time"
                                                    >
                                                        <Truck size={13} className="text-slate-400 group-hover:text-emerald-700 shrink-0" />
                                                        <span className="font-semibold underline decoration-dotted decoration-slate-300">
                                                            {o.expectedDelivery || 'Expected in 3–4 Days'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <p className="font-bold text-slate-900">₹{o.amount || o.totalAmount}</p>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase">{o.paymentMethod || 'COD'}</p>
                                            </td>

                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.style}`}>
                                                    <Icon size={12} /> {cfg.label}
                                                </span>
                                            </td>

                                            {/* Action Buttons: View, Bill & Delete */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelected(o)}
                                                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                                        title="View full order details"
                                                    >
                                                        <Eye size={12} /> View
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedInvoiceOrder(o)}
                                                        className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                                        title="Print GST Bill"
                                                    >
                                                        <Printer size={12} /> Print Bill
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOrder(o.id || o.orderId)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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
                                        <td colSpan={7} className="text-center py-12 text-gray-400">
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
                                        onClick={() => setSelectedInvoiceOrder(selected)}
                                        className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="View / Print GST Invoice"
                                    >
                                        <Printer size={13} /> Tax Invoice
                                    </button>
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
                                            defaultValue={selected.expectedDelivery || 'Expected in 3–4 Days'}
                                            id="modalDeliveryTimeInput"
                                            className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-xs outline-none bg-white font-medium"
                                            placeholder="e.g. Expected in 3–4 Days"
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
                                        {['Expected in 3–4 Days', 'Expected in 2–3 Days', 'Expected Tomorrow', 'Express Delivery (1–2 Days)'].map((preset) => (
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

                {/* ── 1. CALLBACK REQUESTS QUEUE MODAL ── */}
                {callbacksModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 shadow-2xl relative max-h-[90vh] flex flex-col">
                            {/* Close */}
                            <button
                                type="button"
                                onClick={() => setCallbacksModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <PhoneCall size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Customer Callback Requests</h3>
                                    <p className="text-xs text-gray-500">
                                        Customers requesting a call to place or verify medicine orders
                                    </p>
                                </div>
                            </div>

                            {/* Queue List */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                                {callbacks.length === 0 ? (
                                    <div className="text-center py-12 space-y-2">
                                        <Phone size={32} className="text-gray-300 mx-auto" />
                                        <p className="font-bold text-gray-700">No callback requests yet</p>
                                        <p className="text-gray-400 text-xs">When customers tap "Order via Call" and request a callback, they will appear here in real time.</p>
                                    </div>
                                ) : (
                                    callbacks.map((cb) => (
                                        <div
                                            key={cb.id}
                                            className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-blue-200 transition-all space-y-2.5"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                                                        {cb.requestId}
                                                    </span>
                                                    <span className="font-bold text-gray-900 text-sm">{cb.customerName}</span>
                                                    <span className="text-gray-400">·</span>
                                                    <span className="text-gray-600 font-medium">{cb.district}</span>
                                                </div>

                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                    cb.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                        : cb.status === 'called'
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                        : cb.status === 'converted'
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {cb.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
                                                <p>📞 Phone: <strong className="text-gray-900 font-mono">{cb.phone}</strong></p>
                                                <p>🕒 Preferred Time: <strong className="text-gray-800">{cb.preferredTime}</strong></p>
                                                {cb.medicinesNeeded && (
                                                    <p className="sm:col-span-2 bg-white p-2 rounded-xl border border-gray-100 text-gray-700">
                                                        💊 Request / Medicines: <em>"{cb.medicinesNeeded}"</em>
                                                    </p>
                                                )}
                                                {cb.prescriptionFile && (
                                                    <p className="sm:col-span-2">
                                                        📎 Rx Attachment:{' '}
                                                        <a
                                                            href={`http://localhost:8000${cb.prescriptionFile}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 underline font-semibold"
                                                        >
                                                            View Uploaded Prescription &rarr;
                                                        </a>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {(() => {
                                                const cleanPhone = String(cb.phone || '').replace(/[^0-9+]/g, '')
                                                const rawDigits = cleanPhone.replace(/\D/g, '')
                                                const waNumber = rawDigits.length === 10 ? '91' + rawDigits : rawDigits

                                                return (
                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {/* Direct Telephone Dial */}
                                                            <a
                                                                href={`tel:${cleanPhone}`}
                                                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-2xs"
                                                                title={`Dial ${cleanPhone}`}
                                                            >
                                                                <PhoneCall size={12} />
                                                                <span>Call Now</span>
                                                            </a>

                                                            {/* Direct WhatsApp Chat */}
                                                            {waNumber && (
                                                                <a
                                                                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${cb.customerName}, this is Dhruv Pharma Nandurbar regarding your callback request #${cb.requestId}. How may we help you?`)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-2xs"
                                                                    title="Open customer WhatsApp chat"
                                                                >
                                                                    <MessageSquare size={12} className="text-emerald-600" />
                                                                    <span>WhatsApp</span>
                                                                </a>
                                                            )}

                                                            {/* Copy Phone to Clipboard */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (cleanPhone) {
                                                                        navigator.clipboard.writeText(cleanPhone)
                                                                        setCopiedCallbackPhone(cb.id)
                                                                        setTimeout(() => setCopiedCallbackPhone(null), 2500)
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                                                                title="Copy customer phone number"
                                                            >
                                                                {copiedCallbackPhone === cb.id ? (
                                                                    <>
                                                                        <Check size={12} className="text-emerald-600" />
                                                                        <span className="text-emerald-700 font-bold">Copied!</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy size={12} />
                                                                        <span>Copy</span>
                                                                    </>
                                                                )}
                                                            </button>

                                                            {/* Take Phone Order */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenPhoneOrder(cb)}
                                                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                                                            >
                                                                <Plus size={12} />
                                                                <span>Take Order</span>
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 text-[11px]">
                                                            {cb.status === 'pending' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateCallbackStatus(cb.id, 'called')}
                                                                    className="text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                                                                >
                                                                    Mark Called
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteCallback(cb.id)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                                title="Delete callback request"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 2. "TAKE PHONE ORDER" PHARMACIST POS MODAL ── */}
                {phoneOrderModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 shadow-2xl relative max-h-[92vh] flex flex-col">
                            {/* Close */}
                            <button
                                type="button"
                                onClick={() => setPhoneOrderModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-base">Take Phone Order</h3>
                                        {selectedCallbackForOrder && (
                                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                From {selectedCallbackForOrder.requestId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Create and confirm a manual order directly while speaking with a customer on the phone
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitPhoneOrder} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                                {/* Customer Info */}
                                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-3">
                                    <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                        1. Caller / Patient Details
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                Customer Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Caller full name"
                                                value={phoneOrderForm.customerName}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, customerName: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="10-digit mobile number"
                                                value={phoneOrderForm.phone}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">Serviceable Hub / Area</label>
                                            <select
                                                value={phoneOrderForm.district}
                                                onChange={(e) => {
                                                    const chosenArea = e.target.value
                                                    const hub = DELIVERY_HUBS.find(h => h.name === chosenArea)
                                                    setPhoneOrderForm({
                                                        ...phoneOrderForm,
                                                        district: chosenArea,
                                                        pincode: hub && hub.pincode !== 'all' ? hub.pincode : phoneOrderForm.pincode
                                                    })
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                                            >
                                                {DELIVERY_HUBS.filter(h => h.pincode !== 'all').map((hub) => (
                                                    <option key={hub.pincode} value={hub.name}>
                                                        {hub.name} ({hub.pincode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">PIN Code</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 425412"
                                                value={phoneOrderForm.pincode}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, pincode: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                Delivery Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Flat/House no., Street, Area, Landmark"
                                                value={phoneOrderForm.address}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, address: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medicine Selector */}
                                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-3">
                                    <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                        2. Select Medicines
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={selectedMedId}
                                            onChange={(e) => setSelectedMedId(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-xs"
                                        >
                                            <option value="">-- Choose Medicine from Inventory --</option>
                                            {medicinesCatalog.map((med) => (
                                                <option key={med.id} value={med.id}>
                                                    {med.name} (₹{med.sellingPrice || med.price}) · Stock: {med.stock_quantity ?? 'Available'}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            value={selectedMedQty}
                                            onChange={(e) => setSelectedMedQty(e.target.value)}
                                            className="w-16 px-2.5 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-xs text-center font-bold"
                                            placeholder="Qty"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddItemToPhoneOrder}
                                            disabled={!selectedMedId}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                                        >
                                            + Add
                                        </button>
                                    </div>

                                    {/* Added items list */}
                                    {phoneOrderForm.items.length > 0 ? (
                                        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden divide-y divide-gray-100">
                                            {phoneOrderForm.items.map((it, idx) => (
                                                <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                                                    <div>
                                                        <p className="font-bold text-gray-900">{it.name}</p>
                                                        <p className="text-[10px] text-gray-400">Qty: {it.qty} × ₹{it.price}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-gray-900">
                                                            ₹{(it.price * it.qty).toFixed(2)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItemFromPhoneOrder(idx)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-[11px] italic text-center py-2">
                                            No medicines added yet. Choose a medicine above and tap "+ Add".
                                        </p>
                                    )}
                                </div>

                                {/* Payment & Total */}
                                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-blue-900 font-semibold">Payment Mode:</span>
                                        <select
                                            value={phoneOrderForm.paymentMethod}
                                            onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, paymentMethod: e.target.value })}
                                            className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-semibold"
                                        >
                                            <option value="COD">💵 Cash on Delivery (COD)</option>
                                            <option value="UPI">📱 UPI on Delivery</option>
                                        </select>
                                    </div>

                                    {/* Price breakdown */}
                                    {(() => {
                                        const sub = phoneOrderForm.items.reduce((sum, i) => sum + (i.price * i.qty), 0)
                                        const fee = sub === 0 ? 0 : sub >= 300 ? 0 : 40
                                        const total = sub + fee
                                        return (
                                            <div className="pt-2 border-t border-blue-200/60 space-y-1">
                                                <div className="flex justify-between text-blue-800 text-[11px]">
                                                    <span>Subtotal:</span>
                                                    <span>₹{sub.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-blue-800 text-[11px]">
                                                    <span>Delivery Fee:</span>
                                                    <span>{fee === 0 ? 'FREE (Above ₹300)' : `₹${fee}`}</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-bold text-blue-950 pt-1 border-t border-blue-200/80">
                                                    <span>Total Payable:</span>
                                                    <span className="text-base text-blue-700">₹{total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingPhoneOrder}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer"
                                >
                                    {isSubmittingPhoneOrder ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            <span>Creating Order...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={15} />
                                            <span>Confirm &amp; Place Phone Order</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Official GST Tax Invoice Modal ── */}
                <OrderInvoiceModal
                    order={selectedInvoiceOrder}
                    isOpen={Boolean(selectedInvoiceOrder)}
                    onClose={() => setSelectedInvoiceOrder(null)}
                />
            </div>
        </AdminLayout>
    )
}
