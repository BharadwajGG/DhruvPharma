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
    Download,
    Upload,
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
    { key: 'cancelled',  label: 'Cancelled' },
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
    const [batchAssignModal, setBatchAssignModal] = useState(null)
    const [isSavingBatch, setIsSavingBatch] = useState(false)

    // ── Callbacks Queue & Phone Orders States ──
    const [callbacks, setCallbacks] = useState([])
    const [callbacksModalOpen, setCallbacksModalOpen] = useState(false)
    const [phoneOrderModalOpen, setPhoneOrderModalOpen] = useState(false)
    const [selectedCallbackForOrder, setSelectedCallbackForOrder] = useState(null)
    const [medicinesCatalog, setMedicinesCatalog] = useState([])
    const [isSubmittingPhoneOrder, setIsSubmittingPhoneOrder] = useState(false)

    // Customer Order Form
    const [phoneOrderForm, setPhoneOrderForm] = useState({
        customerName: '',
        phone: '',
        email: '',
        district: 'Nandurbar',
        pincode: '425412',
        address: '',
        items: [],
        paymentMethod: 'COD',
        expectedDelivery: 'Expected in 3–4 Days',
        status: 'confirmed',
        notes: '',
    })
    const [selectedMedId, setSelectedMedId] = useState('')
    const [selectedMedQty, setSelectedMedQty] = useState(1)

    // Custom Medicine Entry for Manual Order
    const [customMedName, setCustomMedName] = useState('')
    const [customMedPrice, setCustomMedPrice] = useState('')
    const [customMedQty, setCustomMedQty] = useState(1)
    const [isCustomMedMode, setIsCustomMedMode] = useState(false)

    // CSV Bulk Import State
    const [importCsvModalOpen, setImportCsvModalOpen] = useState(false)
    const [importCsvFile, setImportCsvFile] = useState(null)
    const [isImportingCsv, setIsImportingCsv] = useState(false)
    const [importCsvResult, setImportCsvResult] = useState(null)

    // ── Emergency Admin Order Cancellation State ──
    const [adminCancelModalOpen, setAdminCancelModalOpen] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState(null)
    const [cancelReasonPreset, setCancelReasonPreset] = useState('Out of batch stock / expired batch')
    const [cancelCustomNotes, setCancelCustomNotes] = useState('')
    const [isSubmittingAdminCancel, setIsSubmittingAdminCancel] = useState(false)

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

    // ── Emergency Admin Cancellation Handler ──
    const handleExecuteAdminCancel = async () => {
        if (!orderToCancel) return
        setIsSubmittingAdminCancel(true)
        const orderId = orderToCancel.orderId || orderToCancel.id
        const effectiveReason = cancelReasonPreset === 'Custom Reason'
            ? (cancelCustomNotes.trim() || 'Cancelled by store administration for urgent operational reason')
            : (cancelCustomNotes.trim() ? `${cancelReasonPreset}: ${cancelCustomNotes.trim()}` : cancelReasonPreset)

        try {
            const res = await fetch(`http://localhost:8000/api/admin/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: effectiveReason,
                    adminNotes: cancelCustomNotes.trim(),
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setOrders((prev) =>
                    prev.map((o) =>
                        o.id === orderId || o.orderId === orderId
                            ? { ...o, status: 'cancelled', cancelledBy: 'admin', cancellationReason: effectiveReason }
                            : o
                    )
                )
                if (selected && (selected.id === orderId || selected.orderId === orderId)) {
                    setSelected((prev) => ({
                        ...prev,
                        status: 'cancelled',
                        cancelledBy: 'admin',
                        cancellationReason: effectiveReason,
                    }))
                }
                setStockAlertMessage(`⚠️ Order #${orderId} was CANCELLED by Admin. Customer & Store Owner notified via email. Stock restored.`)
                setTimeout(() => setStockAlertMessage(''), 8000)
                setAdminCancelModalOpen(false)
                setOrderToCancel(null)
                setCancelCustomNotes('')
            } else {
                alert(data.detail || 'Failed to cancel order')
            }
        } catch (err) {
            console.error('Admin cancel error:', err)
            alert('Failed to connect to backend server')
        } finally {
            setIsSubmittingAdminCancel(false)
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

    // Save Real-Time Physical Batch Allocation for Order Item
    const handleSaveBatchAllocation = async (allocationPayload) => {
        if (!batchAssignModal) return
        const orderId = batchAssignModal.order.orderId || batchAssignModal.order.id
        setIsSavingBatch(true)
        try {
            const res = await fetch(`http://localhost:8000/api/orders/${orderId}/assign-batches`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_index: batchAssignModal.itemIndex,
                    ...allocationPayload,
                }),
            })
            const data = await res.json()
            if (res.ok && data.order) {
                setOrders((prev) => prev.map((o) => ((o.orderId === orderId || o.id === orderId) ? data.order : o)))
                setSelected(data.order)
                setBatchAssignModal(null)
            } else {
                alert(data.detail || 'Failed to update batch allocation.')
            }
        } catch (err) {
            console.error('Batch assign error:', err)
            alert('Failed to connect to server.')
        } finally {
            setIsSavingBatch(false)
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

    // Open Order Creation Modal (optionally linked to a callback)
    const handleOpenPhoneOrder = (callbackItem = null) => {
        setSelectedCallbackForOrder(callbackItem)
        const hubPincode = callbackItem
            ? (DELIVERY_HUBS.find(h => h.name === callbackItem.district)?.pincode || '425412')
            : '425412'

        setPhoneOrderForm({
            customerName: callbackItem ? callbackItem.customerName : '',
            phone: callbackItem ? callbackItem.phone : '',
            email: '',
            district: callbackItem ? callbackItem.district : 'Nandurbar',
            address: '',
            pincode: hubPincode,
            items: [],
            paymentMethod: 'COD',
            expectedDelivery: 'Expected in 3–4 Days',
            status: 'confirmed',
            notes: callbackItem
                ? `Order from Callback #${callbackItem.requestId}. Notes: ${callbackItem.medicinesNeeded || 'None'}`
                : '',
        })
        setSelectedMedId('')
        setSelectedMedQty(1)
        setCustomMedName('')
        setCustomMedPrice('')
        setCustomMedQty(1)
        setIsCustomMedMode(false)
        if (callbackItem) {
            setCallbacksModalOpen(false)
        }
        setPhoneOrderModalOpen(true)
    }

    // Add item from catalog to order
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

    // Add custom medicine to order
    const handleAddCustomMedicine = () => {
        const name = customMedName.trim()
        const price = parseFloat(customMedPrice)
        const qty = Math.max(1, parseInt(customMedQty) || 1)
        if (!name) {
            alert('Please enter medicine name.')
            return
        }
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price.')
            return
        }
        setPhoneOrderForm((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: 0,
                    name,
                    price,
                    qty,
                    salt: 'Direct Addition',
                    brand: 'Dhruv Pharma',
                },
            ],
        }))
        setCustomMedName('')
        setCustomMedPrice('')
        setCustomMedQty(1)
    }

    // Remove item from order
    const handleRemoveItemFromPhoneOrder = (index) => {
        setPhoneOrderForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }))
    }

    // Submit New Customer Order
    const handleSubmitPhoneOrder = async (e) => {
        e.preventDefault()
        if (!phoneOrderForm.customerName.trim() || !phoneOrderForm.phone.trim() || !phoneOrderForm.address.trim()) {
            alert('Customer name, phone number, and delivery address are required.')
            return
        }
        if (phoneOrderForm.items.length === 0) {
            alert('Please add at least one medicine item to this order.')
            return
        }

        setIsSubmittingPhoneOrder(true)
        try {
            const payload = {
                customerName: phoneOrderForm.customerName.trim(),
                phone: phoneOrderForm.phone.trim(),
                email: (phoneOrderForm.email || '').trim(),
                district: phoneOrderForm.district,
                address: phoneOrderForm.address.trim(),
                pincode: (phoneOrderForm.pincode || '').trim(),
                items: phoneOrderForm.items,
                paymentMethod: phoneOrderForm.paymentMethod,
                expectedDelivery: phoneOrderForm.expectedDelivery,
                status: phoneOrderForm.status,
                notes: (phoneOrderForm.notes || '').trim(),
                callbackId: selectedCallbackForOrder ? selectedCallbackForOrder.id : null,
            }

            const res = await fetch('http://localhost:8000/api/admin/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const result = await res.json()
            if (!res.ok) {
                throw new Error(result.detail || 'Failed to create customer order.')
            }

            setPhoneOrderModalOpen(false)
            setSelectedCallbackForOrder(null)
            fetchOrders()
            fetchCallbacks()
            alert(result.message || 'Order created and added to chart successfully!')
        } catch (err) {
            console.error('Order creation error:', err)
            alert(err.message || 'Failed to create order.')
        } finally {
            setIsSubmittingPhoneOrder(false)
        }
    }

    // Export All Orders to CSV File
    const handleExportOrdersCSV = () => {
        if (!orders || orders.length === 0) {
            alert('No orders available to export.')
            return
        }

        const headers = [
            'Order ID',
            'Order Date',
            'Customer Name',
            'Phone Number',
            'District / Hub',
            'Pincode',
            'Delivery Address',
            'Expected Delivery Window',
            'Total Amount (₹)',
            'Payment Method',
            'Order Status',
            'Ordered Medicines',
            'Notes',
        ]

        const csvRows = [headers.join(',')]

        orders.forEach((ord) => {
            const dateStr = ord.createdAt || ord.created_at || ''
            const itemsSummary = (ord.items || [])
                .map((it) => `${it.name || 'Medicine'} (x${it.qty || 1} @ ₹${it.price || 0})`)
                .join(' | ')

            const escape = (val) => {
                if (val === null || val === undefined) return '""'
                const str = String(val).replace(/"/g, '""')
                return `"${str}"`
            }

            const row = [
                escape(ord.orderId || ord.order_id || ord.id),
                escape(dateStr),
                escape(ord.customerName || ord.customer_name),
                escape(ord.phone || ord.customer_phone),
                escape(ord.district),
                escape(ord.pincode),
                escape(ord.address),
                escape(ord.deliveryTime || ord.expected_delivery || 'Expected in 3–4 Days'),
                escape(ord.totalAmount || ord.total_amount || 0),
                escape(ord.paymentMethod || ord.payment_method || 'COD'),
                escape(STATUS_CONFIG[ord.status]?.label || ord.status),
                escape(itemsSummary),
                escape(ord.notes || ''),
            ]

            csvRows.push(row.join(','))
        })

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'))
        const link = document.createElement('a')
        link.setAttribute('href', csvContent)
        const timestamp = new Date().toISOString().split('T')[0]
        link.setAttribute('download', `DhruvPharma_Orders_${timestamp}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Import Orders from CSV File
    const handleImportOrdersCSV = async (e) => {
        e.preventDefault()
        if (!importCsvFile) {
            alert('Please select a CSV file to upload.')
            return
        }

        setIsImportingCsv(true)
        setImportCsvResult(null)
        try {
            const formData = new FormData()
            formData.append('file', importCsvFile)

            const res = await fetch('http://localhost:8000/api/admin/orders/import-csv', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to import orders CSV.')
            }

            setImportCsvResult({ type: 'success', message: data.message, count: data.importedCount })
            fetchOrders()
            setTimeout(() => {
                setImportCsvModalOpen(false)
                setImportCsvFile(null)
                setImportCsvResult(null)
            }, 1800)
        } catch (err) {
            console.error('CSV Import error:', err)
            setImportCsvResult({ type: 'error', message: err.message || 'Error uploading CSV' })
        } finally {
            setIsImportingCsv(false)
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
    const confirmedOrdersCount = orders.filter((o) => o.status === 'confirmed').length
    const dispatchedOrdersCount = orders.filter((o) => o.status === 'dispatched').length
    const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length
    const cancelledOrdersCount = orders.filter((o) => o.status === 'cancelled').length
    const needsActionCount = pendingOrdersCount + confirmedOrdersCount

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">

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
                            className="text-white/80 hover:text-white p-1 cursor-pointer"
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
                            className="text-slate-400 hover:text-white p-1 cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Orders</h1>
                            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Live Store Orders Feed
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Track live patient orders, dispatch shipments across Nandurbar &amp; Maharashtra hubs, print GST invoices, and coordinate deliveries.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Callbacks Queue Button */}
                        <button
                            type="button"
                            onClick={() => setCallbacksModalOpen(true)}
                            className="relative bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <PhoneCall size={14} className="text-emerald-700" />
                            <span>Customer Callbacks</span>
                            {pendingCallbacksCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                                    {pendingCallbacksCount}
                                </span>
                            )}
                        </button>

                        {/* + Add Order Button */}
                        <button
                            type="button"
                            onClick={() => handleOpenPhoneOrder()}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Add medicines and create customer order"
                        >
                            <Plus size={15} />
                            <span>+ Add Order</span>
                        </button>

                        {/* Export CSV Button */}
                        <button
                            type="button"
                            onClick={handleExportOrdersCSV}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Export all orders from chart to CSV spreadsheet"
                        >
                            <Download size={14} className="text-blue-600" />
                            <span>Export CSV</span>
                        </button>

                        {/* Import CSV Button */}
                        <button
                            type="button"
                            onClick={() => setImportCsvModalOpen(true)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Import customer orders from CSV file"
                        >
                            <Upload size={14} className="text-emerald-700" />
                            <span>Import CSV</span>
                        </button>

                        {/* Audio Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                                soundEnabled
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-white border-slate-200 text-slate-400'
                            }`}
                            title={soundEnabled ? 'Order notification chime enabled' : 'Order notification chime muted'}
                        >
                            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={() => {
                                fetchOrders()
                                fetchCallbacks()
                            }}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* ── KPI Summary Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Orders Placed */}
                    <div 
                        onClick={() => setFilter('all')}
                        className={`bg-white rounded-2xl border p-4.5 shadow-xs flex items-center gap-3.5 transition-all cursor-pointer ${
                            filter === 'all' ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/90 hover:border-blue-300'
                        }`}
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                            <ShoppingBag size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">
                                {orders.length.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {pendingCallbacksCount > 0 ? `${pendingCallbacksCount} callbacks pending` : 'All channels active'}
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Needs Action (Dispatch Queue) */}
                    <div 
                        onClick={() => setFilter('pending')}
                        className={`bg-white rounded-2xl border p-4.5 shadow-xs flex items-center gap-3.5 transition-all cursor-pointer ${
                            filter === 'pending' || filter === 'confirmed' ? 'border-amber-500 ring-2 ring-amber-100 shadow-sm' : 'border-slate-200/90 hover:border-amber-300'
                        }`}
                    >
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                            <Clock size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Needs Action</p>
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.2 rounded-full">Packing</span>
                            </div>
                            <p className="text-2xl font-black text-amber-700 mt-0.5">
                                {needsActionCount}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {pendingOrdersCount} new · {confirmedOrdersCount} packed &amp; ready
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Out for Delivery */}
                    <div 
                        onClick={() => setFilter('dispatched')}
                        className={`bg-white rounded-2xl border p-4.5 shadow-xs flex items-center gap-3.5 transition-all cursor-pointer ${
                            filter === 'dispatched' ? 'border-purple-500 ring-2 ring-purple-100 shadow-sm' : 'border-slate-200/90 hover:border-purple-300'
                        }`}
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                            <Truck size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Out for Delivery</p>
                                <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.2 rounded-full">In Transit</span>
                            </div>
                            <p className="text-2xl font-black text-purple-700 mt-0.5">
                                {dispatchedOrdersCount}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                With delivery rider / hub
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Delivered Revenue */}
                    <div 
                        onClick={() => setFilter('delivered')}
                        className={`bg-white rounded-2xl border p-4.5 shadow-xs flex items-center gap-3.5 transition-all cursor-pointer ${
                            filter === 'delivered' ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm' : 'border-slate-200/90 hover:border-emerald-300'
                        }`}
                    >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                            <CheckCircle size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Money Collected</p>
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.2 rounded-full">Delivered</span>
                            </div>
                            <p className="text-2xl font-black text-emerald-700 mt-0.5">
                                ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {deliveredOrdersCount} orders fulfilled
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Search + Filter ── */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by customer name, phone number, order ID, town, or PIN code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-slate-800"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Clear search"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Chips */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {ALL_STATUSES.map((item) => {
                                const count = item.key === 'all'
                                    ? orders.length
                                    : orders.filter((o) => o.status === item.key).length
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => setFilter(item.key)}
                                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
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
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 no-scrollbar">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <MapPin size={12} className="text-emerald-700" />
                            Town / Hub:
                        </span>
                        {DELIVERY_HUBS.map((hub) => (
                            <button
                                key={hub.pincode}
                                onClick={() => setAreaFilter(hub.pincode)}
                                className={`shrink-0 px-2.5 py-1 rounded-xl font-bold transition-all text-xs border cursor-pointer ${
                                    areaFilter === hub.pincode
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-black'
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

                {/* ── Orders Table (Compact, Zero Horizontal Scroll) ── */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse table-auto">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-3 text-center w-10">
                                    <input
                                        type="checkbox"
                                        checked={displayed.length > 0 && displayed.every((o) => selectedOrderIds.includes(o.id || o.orderId))}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        title="Select all displayed orders"
                                    />
                                </th>
                                <th className="py-3.5 px-4 w-[28%]">Order &amp; Customer</th>
                                <th className="py-3.5 px-4 w-[34%]">Ordered Medicines &amp; Delivery</th>
                                <th className="py-3.5 px-4 text-right w-[12%]">Amount</th>
                                <th className="py-3.5 px-4 text-center w-[13%]">Status</th>
                                <th className="py-3.5 px-4 text-center w-[13%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayed.map((o) => {
                                const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending
                                const Icon = cfg.icon
                                const isEditingThis = editingDeliveryTimeId === (o.id || o.orderId)
                                const isRowSelected = selectedOrderIds.includes(o.id || o.orderId)
                                const cleanPhone = (o.phone || '').replace(/\D/g, '')

                                return (
                                    <tr key={o.id || o.orderId} className={`hover:bg-slate-50/80 transition-colors ${isRowSelected ? 'bg-emerald-50/30' : ''}`}>
                                        {/* Checkbox */}
                                        <td className="py-3.5 px-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isRowSelected}
                                                onChange={() => toggleSelectRow(o.id || o.orderId)}
                                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            />
                                        </td>

                                        {/* Order & Customer */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                                                    #{o.id || o.orderId}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {o.date || o.createdAt || 'Recent'}
                                                </span>
                                            </div>
                                            <p className="font-bold text-slate-900 text-xs mt-1 truncate" title={o.patient || o.customerName}>
                                                {o.patient || o.customerName}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
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
                                                <span className="inline-flex items-center gap-0.5 text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                                    <MapPin size={9} className="text-emerald-700" />
                                                    {o.district || 'Nandurbar'} {o.pincode ? `(${o.pincode})` : ''}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Ordered Medicines & Delivery Window */}
                                        <td className="py-3.5 px-4">
                                            {Array.isArray(o.items) && o.items.length > 0 ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-md border border-emerald-200">
                                                            {o.items.length} {o.items.length === 1 ? 'Item' : 'Items'}
                                                        </span>
                                                        <span
                                                            className="text-[11px] font-semibold text-slate-800 truncate max-w-[280px]"
                                                            title={o.items.map((i) => `${i.name || 'Medicine'} (x${i.qty || i.quantity || 1})`).join(', ')}
                                                        >
                                                            {o.items.map((i) => `${i.name || 'Medicine'} (x${i.qty || i.quantity || 1})`).join(', ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-[11px]">Direct Prescription / Order</span>
                                            )}

                                            {/* Delivery Window (Directly under medicines) */}
                                            <div className="mt-1 pt-1 border-t border-slate-100/80">
                                                {isEditingThis ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={tempDeliveryTime}
                                                            onChange={(e) => setTempDeliveryTime(e.target.value)}
                                                            placeholder="e.g. Expected in 3–4 Days"
                                                            className="px-2 py-0.5 border border-emerald-400 rounded-lg text-xs outline-none bg-white w-40 font-medium shadow-xs"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleSaveDeliveryTime(o.id || o.orderId, tempDeliveryTime)}
                                                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                                            title="Save Delivery Time"
                                                        >
                                                            <Check size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingDeliveryTimeId(null)}
                                                            className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                                                            title="Cancel"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => {
                                                             setEditingDeliveryTimeId(o.id || o.orderId)
                                                             setTempDeliveryTime(o.expectedDelivery || 'Expected in 3–4 Days')
                                                        }}
                                                        className="group cursor-pointer inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 transition-colors"
                                                        title="Click to edit expected delivery time"
                                                    >
                                                        <Truck size={12} className="text-slate-400 group-hover:text-emerald-700 shrink-0" />
                                                        <span className="font-semibold underline decoration-dotted decoration-slate-300 text-[11px]">
                                                            {o.expectedDelivery || 'Expected in 3–4 Days'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <p className="font-black text-slate-900 text-xs">₹{Number(o.amount || o.totalAmount || 0).toLocaleString('en-IN')}</p>
                                            <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                {o.paymentMethod || 'COD'}
                                            </span>
                                        </td>

                                        {/* Order Status Badge (Safe, No accidental changes) */}
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${cfg.style}`}>
                                                <Icon size={12} /> {cfg.label}
                                            </span>
                                        </td>

                                        {/* Action Buttons: View, Bill, WhatsApp & Delete */}
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setSelected(o)}
                                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                                    title="View full order details"
                                                >
                                                    <Eye size={12} /> View
                                                </button>
                                                <button
                                                    onClick={() => setSelectedInvoiceOrder(o)}
                                                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                                    title="Print GST Tax Bill"
                                                >
                                                    <Printer size={12} /> Bill
                                                </button>
                                                {cleanPhone && (
                                                    <a
                                                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${o.patient || o.customerName || 'Customer'}, regarding your Dhruv Pharma Order #${o.id || o.orderId}...`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                                                        title="Chat on WhatsApp"
                                                    >
                                                        <MessageSquare size={13} />
                                                    </a>
                                                )}
                                                {o.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => {
                                                            setOrderToCancel(o)
                                                            setAdminCancelModalOpen(true)
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Emergency Cancel Order by Admin"
                                                    >
                                                        <X size={13} className="text-rose-500" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteOrder(o.id || o.orderId)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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
                                    <td colSpan={6} className="text-center py-12 text-slate-400">
                                        <Package size={36} className="mx-auto mb-2 text-slate-300" />
                                        <p className="font-bold text-slate-600 text-sm">No customer orders found.</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {search ? 'Try adjusting your search query or town filter.' : 'When patients place orders online or over phone, they will appear here.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                                    <div className="flex flex-wrap items-center gap-2">
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
                                        {selected.status !== 'cancelled' && (
                                            <button
                                                disabled={isUpdatingStatus}
                                                onClick={() => {
                                                    setOrderToCancel(selected)
                                                    setAdminCancelModalOpen(true)
                                                }}
                                                className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer ml-auto"
                                                title="Emergency Order Cancellation by Admin"
                                            >
                                                <X size={12} /> Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Cancelled Order Reassurance Banner */}
                                {selected.status === 'cancelled' && (
                                    <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 space-y-1 text-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-rose-900">
                                            <AlertCircle size={15} className="text-rose-600 shrink-0" />
                                            <span>
                                                Order Cancelled ({selected.cancelledBy === 'admin' ? 'by Store Pharmacist / Admin' : 'by Customer'})
                                            </span>
                                        </div>
                                        <p className="text-rose-800 text-[11px] leading-relaxed">
                                            <strong>Reason:</strong> {selected.cancellationReason || 'Order marked cancelled upon request'}
                                        </p>
                                        <p className="text-slate-500 text-[10px] pt-0.5">
                                            ✓ Medicine items restocked to catalog · Revenue deducted · Notification emails dispatched
                                        </p>
                                    </div>
                                )}

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
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5">
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Customer Phone &amp; Chat</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <a href={`tel:${selected.phone}`} className="font-bold text-slate-900 hover:text-emerald-700 hover:underline inline-flex items-center gap-1">
                                                <Phone size={12} className="text-emerald-600" />
                                                <span>{selected.phone}</span>
                                            </a>
                                            {selected.phone && (
                                                <a
                                                    href={`https://wa.me/91${(selected.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selected.patient || selected.customerName || 'Customer'}, regarding your Dhruv Pharma Order #${selected.id || selected.orderId}...`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 transition-colors"
                                                    title="Chat with customer on WhatsApp"
                                                >
                                                    <MessageSquare size={11} /> WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">District / Hub Pincode</p>
                                        <p className="font-bold text-slate-900 inline-flex items-center gap-1">
                                            <MapPin size={12} className="text-emerald-700" />
                                            <span>{selected.district} {selected.pincode ? `(${selected.pincode})` : ''}</span>
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Full Delivery Address</p>
                                        <p className="font-medium text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs leading-relaxed">{selected.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Payment Method</p>
                                        <p className="font-bold text-slate-900 uppercase">{selected.paymentMethod} ({selected.paymentStatus || 'pending'})</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Delivery Agent</p>
                                        <p className="font-bold text-slate-900">{selected.agent || selected.deliveryAgent || 'Assigned to Local Hub Rider'}</p>
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
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-gray-800 text-xs">
                                            Itemized Medicines &amp; Physical Batch Allocation
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedInvoiceOrder(selected)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                        >
                                            <FileText size={12} /> View Tax Invoice
                                        </button>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
                                                    <th className="py-2 px-3">Item &amp; Dispensed Batch</th>
                                                    <th className="py-2 px-3 text-center">Qty</th>
                                                    <th className="py-2 px-3 text-right">Selling Price</th>
                                                    <th className="py-2 px-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-xs">
                                                {(selected.items || []).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/60">
                                                        <td className="py-2.5 px-3">
                                                            <p className="font-bold text-gray-900">{item.name}</p>
                                                            <p className="text-[10px] text-gray-400">{item.salt || item.brand}</p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                                                                {item.batch_allocations && item.batch_allocations.length > 0 ? (
                                                                    item.batch_allocations.map((ba, bIdx) => (
                                                                        <span key={bIdx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                                                            Batch {bIdx + 1}: {ba.batch_no} (Exp: {ba.exp_date}, MRP: ₹{ba.mrp}, Qty: {ba.qty})
                                                                        </span>
                                                                    ))
                                                                ) : item.batch_number ? (
                                                                    <span className="bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                                                        Batch: {item.batch_number} {item.expiry_date ? `(Exp: ${item.expiry_date})` : ''} {item.mrp ? `· MRP ₹${item.mrp}` : ''}
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                                                        Batch: Pending Verification
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBatchAssignModal({ order: selected, itemIndex: idx, item })}
                                                                    className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer ml-1"
                                                                    title="Assign physical strips batch number or split multi-batch"
                                                                >
                                                                    Assign / Split Batch
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center font-semibold text-gray-700">
                                                            {item.qty}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right text-gray-600 font-mono">
                                                            ₹{item.price}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">
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

                {/* ── 2. "CREATE CUSTOMER ORDER / ADD MEDICINES" MODAL ── */}
                {phoneOrderModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 shadow-2xl relative max-h-[92vh] flex flex-col">
                            {/* Close */}
                            <button
                                type="button"
                                onClick={() => setPhoneOrderModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-base">Create Customer Order</h3>
                                        {selectedCallbackForOrder && (
                                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                From Callback {selectedCallbackForOrder.requestId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Add medicines, delivery window, and fill all columns to place directly into the orders chart
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitPhoneOrder} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                                {/* 1. Customer Info */}
                                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-3">
                                    <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                        <UserCheck size={14} className="text-emerald-700" />
                                        <span>1. Patient / Customer Details</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                Customer Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Narendra Chavan"
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
                                            <label className="block font-semibold text-gray-700 mb-1">Hub / District</label>
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
                                                Full Delivery Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="House/Shop no., Street, Area, Landmark"
                                                value={phoneOrderForm.address}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, address: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Medicine Selector */}
                                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                            <Pill size={14} className="text-blue-600" />
                                            <span>2. Add Medicines to Order</span>
                                        </p>
                                        <div className="flex rounded-lg border border-gray-200 p-0.5 bg-white text-[11px]">
                                            <button
                                                type="button"
                                                onClick={() => setIsCustomMedMode(false)}
                                                className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                                                    !isCustomMedMode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                From Catalog
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsCustomMedMode(true)}
                                                className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                                                    isCustomMedMode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                + Custom Medicine
                                            </button>
                                        </div>
                                    </div>

                                    {!isCustomMedMode ? (
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
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white p-2.5 rounded-xl border border-gray-200">
                                            <div className="sm:col-span-6">
                                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Medicine Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Paracetamol 650mg"
                                                    value={customMedName}
                                                    onChange={(e) => setCustomMedName(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Price (₹)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="₹ Price"
                                                    value={customMedPrice}
                                                    onChange={(e) => setCustomMedPrice(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="sm:col-span-1">
                                                <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Qty</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={customMedQty}
                                                    onChange={(e) => setCustomMedQty(e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomMedicine}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

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
                                                            className="text-red-500 hover:text-red-700 p-1 rounded cursor-pointer"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-[11px] italic text-center py-2">
                                            No medicines added yet. Select from catalog or type a custom medicine above.
                                        </p>
                                    )}
                                </div>

                                {/* 3. Expected Delivery Window & Status (Matching Chart Columns) */}
                                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-3">
                                    <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                        <Truck size={14} className="text-purple-600" />
                                        <span>3. Chart Columns: Delivery Window &amp; Order Status</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                Expected Delivery Window
                                            </label>
                                            <select
                                                value={phoneOrderForm.expectedDelivery}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, expectedDelivery: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                                            >
                                                <option value="Expected in 3–4 Days">Expected in 3–4 Days</option>
                                                <option value="Expected in 1–2 Days">Expected in 1–2 Days (Express)</option>
                                                <option value="Same Day Delivery">Same Day Delivery (Local)</option>
                                                <option value="Expected in 7 Days">Expected in 7 Days (Rural Dispatch)</option>
                                                <option value="Walk-in / Immediate Pickup">Walk-in / Immediate Pickup</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                Initial Order Status
                                            </label>
                                            <select
                                                value={phoneOrderForm.status}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, status: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                                            >
                                                <option value="confirmed">🔵 Packed &amp; Ready (confirmed)</option>
                                                <option value="pending">🟡 New Order (pending)</option>
                                                <option value="dispatched">🟣 Out for Delivery (dispatched)</option>
                                                <option value="delivered">🟢 Delivered (delivered)</option>
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block font-semibold text-gray-700 mb-1">Order Notes (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Regular monthly BP medicines or Special packaging"
                                                value={phoneOrderForm.notes}
                                                onChange={(e) => setPhoneOrderForm({ ...phoneOrderForm, notes: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Payment Mode & Total Financial Breakdown */}
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
                                            <option value="PAID">💳 Paid Online / Prepaid</option>
                                            <option value="CASH">🏢 Cash at Store Counter</option>
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
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer"
                                >
                                    {isSubmittingPhoneOrder ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Adding Order to Chart...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            <span>Confirm &amp; Add Order to Chart</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── 3. BULK IMPORT ORDERS FROM CSV MODAL ── */}
                {importCsvModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-gray-100 shadow-2xl relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setImportCsvModalOpen(false)
                                    setImportCsvFile(null)
                                    setImportCsvResult(null)
                                }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Bulk Import Orders (CSV)</h3>
                                    <p className="text-xs text-gray-500">
                                        Fill all columns in a spreadsheet and upload to populate the chart
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleImportOrdersCSV} className="space-y-4 text-xs">
                                <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 space-y-2">
                                    <p className="font-bold text-blue-900 text-xs">Need a CSV template?</p>
                                    <p className="text-[11px] text-blue-700 leading-relaxed">
                                        Download our sample CSV with pre-filled columns matching the chart (Customer Name, Phone, Hub, Address, Delivery Window, Amount, Medicines).
                                    </p>
                                    <a
                                        href="http://localhost:8000/api/admin/orders/sample-csv"
                                        download="DHRUV_PHARMA_ORDERS_SAMPLE.csv"
                                        className="inline-flex items-center gap-1.5 bg-white text-blue-700 font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-xs shadow-2xs hover:bg-blue-50 transition-colors"
                                    >
                                        <Download size={13} />
                                        <span>Download Sample Orders CSV</span>
                                    </a>
                                </div>

                                <div className="space-y-2">
                                    <label className="block font-semibold text-gray-700">
                                        Select CSV File to Upload
                                    </label>
                                    <input
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={(e) => setImportCsvFile(e.target.files[0] || null)}
                                        className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-gray-200 rounded-xl p-2"
                                        required
                                    />
                                </div>

                                {importCsvResult && (
                                    <div
                                        className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                            importCsvResult.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                                        }`}
                                    >
                                        {importCsvResult.type === 'success' ? (
                                            <CheckCircle size={16} className="text-emerald-600" />
                                        ) : (
                                            <AlertCircle size={16} className="text-rose-600" />
                                        )}
                                        <span>{importCsvResult.message}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isImportingCsv || !importCsvFile}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isImportingCsv ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Importing Orders to Chart...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            <span>Upload &amp; Add to Orders Chart</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Emergency Admin Order Cancellation Modal ── */}
                {adminCancelModalOpen && orderToCancel && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setAdminCancelModalOpen(false)
                                    setOrderToCancel(null)
                                }}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Emergency Order Cancellation
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Admin Action for Order #{orderToCancel.orderId || orderToCancel.id}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Customer:</span>
                                    <span className="font-bold text-slate-800">{orderToCancel.customerName || orderToCancel.patient}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Phone:</span>
                                    <span className="font-bold text-slate-800">{orderToCancel.phone || orderToCancel.customerPhone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="font-semibold text-slate-700">{orderToCancel.email || 'No email provided'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Bill to Void:</span>
                                    <span className="font-black text-rose-700">₹{orderToCancel.amount || orderToCancel.totalAmount}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Select Cancellation Reason:
                                    </label>
                                    <select
                                        value={cancelReasonPreset}
                                        onChange={(e) => setCancelReasonPreset(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                                    >
                                        <option value="Out of batch stock / expired batch">Out of batch stock / expired batch</option>
                                        <option value="Unserviceable delivery address">Unserviceable delivery address</option>
                                        <option value="Customer requested cancellation via emergency call">Customer requested cancellation via emergency call</option>
                                        <option value="Prescription paper rejected by pharmacist">Prescription paper rejected by pharmacist</option>
                                        <option value="Pricing discrepancy or distributor recall">Pricing discrepancy or distributor recall</option>
                                        <option value="Custom Reason">Custom Reason / Pharmacist Note</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Explanation Note (Visible to Customer in Email &amp; Orders screen):
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={cancelCustomNotes}
                                        onChange={(e) => setCancelCustomNotes(e.target.value)}
                                        placeholder="e.g. Current batch of Augmentin is out of stock. Alternative Azithromycin suggested on call."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 resize-none font-medium"
                                    />
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                                    <p className="font-bold flex items-center gap-1 text-amber-950">
                                        <span>🛡️ Transparent Multi-Channel Guarantee:</span>
                                    </p>
                                    <p>
                                        • Confirmation email dispatched to <strong>customer</strong> explaining the reason.
                                    </p>
                                    <p>
                                        • Audit record emailed to <strong>store owner</strong> for accounting.
                                    </p>
                                    <p>
                                        • Medicine items automatically restocked to store inventory.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdminCancelModalOpen(false)
                                        setOrderToCancel(null)
                                    }}
                                    className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                    Keep Order
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmittingAdminCancel}
                                    onClick={handleExecuteAdminCancel}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {isSubmittingAdminCancel ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            <span>Cancelling...</span>
                                        </>
                                    ) : (
                                        <>
                                            <X size={13} />
                                            <span>Confirm &amp; Cancel Order</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Real-Time Batch Allocation & Price-Lock Modal ── */}
                {batchAssignModal && (
                    <BatchAssignModalView
                        modalData={batchAssignModal}
                        onClose={() => setBatchAssignModal(null)}
                        onSave={handleSaveBatchAllocation}
                        isSaving={isSavingBatch}
                    />
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

function BatchAssignModalView({ modalData, onClose, onSave, isSaving }) {
    const { item, order } = modalData
    const totalQty = parseInt(item.qty || 1) || 1
    const baseSelling = Number(item.price || item.sellingPrice || 0)

    const initialAllocations = item.batch_allocations || []
    const [isSplit, setIsSplit] = useState(initialAllocations.length > 1)

    // Single batch state
    const [singleBatchNo, setSingleBatchNo] = useState(item.batch_number || '')
    const [singleExpDate, setSingleExpDate] = useState(item.expiry_date || '')
    const [singleMrp, setSingleMrp] = useState(item.mrp || item.price || '')

    // Split multi-batch state (Old Batch vs New Restocked Batch)
    const [b1BatchNo, setB1BatchNo] = useState(initialAllocations[0]?.batch_no || item.batch_number || '')
    const [b1ExpDate, setB1ExpDate] = useState(initialAllocations[0]?.exp_date || item.expiry_date || '')
    const [b1Mrp, setB1Mrp] = useState(initialAllocations[0]?.mrp || item.mrp || item.price || '')
    const [b1Qty, setB1Qty] = useState(initialAllocations[0]?.qty || Math.floor(totalQty / 2) || 1)

    const [b2BatchNo, setB2BatchNo] = useState(initialAllocations[1]?.batch_no || item.secondary_batch_number || '')
    const [b2ExpDate, setB2ExpDate] = useState(initialAllocations[1]?.exp_date || item.secondary_expiry_date || '')
    const [b2Mrp, setB2Mrp] = useState(initialAllocations[1]?.mrp || item.secondary_mrp || (Number(item.mrp || item.price || 0) * 1.1).toFixed(2))
    const [b2Qty, setB2Qty] = useState(initialAllocations[1]?.qty || (totalQty - (Math.floor(totalQty / 2) || 1)) || 1)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (isSplit) {
            const q1 = parseInt(b1Qty) || 0
            const q2 = parseInt(b2Qty) || 0
            if (q1 + q2 !== totalQty) {
                alert(`Total split quantities (${q1} + ${q2} = ${q1 + q2}) must equal total ordered quantity (${totalQty})!`)
                return
            }
            onSave({
                batch_allocations: [
                    { batch_no: b1BatchNo.trim(), exp_date: b1ExpDate.trim(), mrp: parseFloat(b1Mrp) || 0, qty: q1 },
                    { batch_no: b2BatchNo.trim(), exp_date: b2ExpDate.trim(), mrp: parseFloat(b2Mrp) || 0, qty: q2 },
                ],
                batch_number: b1BatchNo.trim(),
                expiry_date: b1ExpDate.trim(),
                mrp: parseFloat(b1Mrp) || 0,
                secondary_batch_number: b2BatchNo.trim(),
                secondary_expiry_date: b2ExpDate.trim(),
                secondary_mrp: parseFloat(b2Mrp) || 0,
            })
        } else {
            onSave({
                batch_allocations: [],
                batch_number: singleBatchNo.trim(),
                expiry_date: singleExpDate.trim(),
                mrp: parseFloat(singleMrp) || 0,
            })
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl relative max-h-[92vh] flex flex-col">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Pill size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">Real-Time Batch Allocation</h3>
                        <p className="text-xs text-slate-500">
                            Set physical strip batch &amp; exp. date for order <strong className="text-slate-800">#{order.orderId || order.id}</strong>
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-slate-500 text-[11px]">{item.salt || item.brand}</p>
                    <div className="pt-1 flex items-center justify-between text-slate-700 font-medium">
                        <span>Total Quantity: <strong>{totalQty} Strips</strong></span>
                        <span>Agreed Customer Price: <strong className="text-emerald-700 font-mono">₹{baseSelling.toFixed(2)} / strip</strong></span>
                    </div>
                </div>

                {/* Allocation Mode Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setIsSplit(false)}
                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                            !isSplit ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Single Batch (All {totalQty} Strips)
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsSplit(true)}
                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                            isSplit ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Multi-Batch Split (Price Lock)
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                    {!isSplit ? (
                        <div className="bg-white p-3.5 border border-slate-200 rounded-2xl space-y-3">
                            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                                Physical Batch Details
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Batch No. (Printed on Strip)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. ZHVC031025"
                                        value={singleBatchNo}
                                        onChange={(e) => setSingleBatchNo(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold uppercase text-slate-800 outline-none focus:border-emerald-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Exp. Date (MM/YY)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 09/27"
                                        value={singleExpDate}
                                        onChange={(e) => setSingleExpDate(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 outline-none focus:border-emerald-600"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Printed MRP on Strip (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="e.g. 168.17"
                                        value={singleMrp}
                                        onChange={(e) => setSingleMrp(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 outline-none focus:border-emerald-600"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-900 leading-snug">
                                <strong>💡 Price Lock Guarantee:</strong> If Batch 2 has a higher printed MRP, the customer still receives it at the agreed selling price (<strong className="font-mono">₹{baseSelling.toFixed(2)}</strong>). The discount expands automatically on the Tax Invoice!
                            </div>

                            {/* Batch 1 (Old Batch) */}
                            <div className="bg-white p-3 border border-slate-200 rounded-2xl space-y-2">
                                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                                    1. Old Batch (Remaining Stock)
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">Batch No.</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. ZHVC031025"
                                            value={b1BatchNo}
                                            onChange={(e) => setB1BatchNo(e.target.value)}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">Exp. Date</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 09/27"
                                            value={b1ExpDate}
                                            onChange={(e) => setB1ExpDate(e.target.value)}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">Printed MRP (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="168.17"
                                            value={b1Mrp}
                                            onChange={(e) => setB1Mrp(e.target.value)}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">Qty from this batch</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={totalQty - 1}
                                            required
                                            value={b1Qty}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value) || 1
                                                setB1Qty(v)
                                                setB2Qty(Math.max(1, totalQty - v))
                                            }}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Batch 2 (New Restocked Batch) */}
                            <div className="bg-emerald-50/40 p-3 border border-emerald-300 rounded-2xl space-y-2">
                                <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block">
                                    2. New Restocked Batch (Higher Revised MRP)
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">Batch No.</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. ZHVC020126"
                                            value={b2BatchNo}
                                            onChange={(e) => setB2BatchNo(e.target.value)}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">Exp. Date</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 12/27"
                                            value={b2ExpDate}
                                            onChange={(e) => setB2ExpDate(e.target.value)}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">New Printed MRP (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="184.98"
                                            value={b2Mrp}
                                            onChange={(e) => setB2Mrp(e.target.value)}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold text-emerald-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-600 font-semibold block mb-0.5">Qty from this batch</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={totalQty - 1}
                                            required
                                            value={b2Qty}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value) || 1
                                                setB2Qty(v)
                                                setB1Qty(Math.max(1, totalQty - v))
                                            }}
                                            className="w-full px-2 py-1 border rounded-lg font-mono font-bold text-emerald-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            <span>Save &amp; Update Tax Invoice</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
