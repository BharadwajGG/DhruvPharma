import { useState } from 'react'
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone } from 'lucide-react'

const STATUS_STEPS = [
    { key: 'placed',      label: 'Order Placed',     icon: Package },
    { key: 'confirmed',   label: 'Confirmed',        icon: CheckCircle },
    { key: 'dispatched',  label: 'Dispatched',       icon: Truck },
    { key: 'delivered',   label: 'Delivered',        icon: CheckCircle },
]

/* Mock order data */
const MOCK_ORDER = {
    orderId:     'DP-2024-00142',
    status:      'dispatched',
    patient:     'Rajesh Patil',
    phone:       '+91 98765 43210',
    address:     '12, Shivaji Nagar, Pune – 411005',
    items:       [
        { name: 'Vitamin D3 60K IU', qty: 2, price: 90  },
        { name: 'Paracetamol 500mg', qty: 1, price: 18  },
    ],
    total:       198,
    placedAt:    '28 Oct 2024, 10:15 AM',
    expectedBy:  '28 Oct 2024, 2:00 PM',
    deliveryAgent: 'Sanjay Kumar',
    agentPhone:  '+91 99887 76655',
}

export default function OrderTrackingPage() {
    const [orderId, setOrderId] = useState('')
    const [order, setOrder]     = useState(null)
    const [notFound, setNotFound] = useState(false)

    const handleSearch = (e) => {
        e.preventDefault()
        setNotFound(false)
        if (orderId.toUpperCase() === 'DP-2024-00142') {
            setOrder(MOCK_ORDER)
        } else {
            setOrder(null)
            setNotFound(true)
        }
    }

    const currentStep = STATUS_STEPS.findIndex((s) => s.key === order?.status)

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4">
            <div className="max-w-3xl mx-auto">

                {/* ── Header ── */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Track Your Order
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Enter your order ID to see the live delivery status
                    </p>
                </div>

                {/* ── Search ── */}
                <form onSubmit={handleSearch} className="flex gap-3 mb-8">
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Search size={16} className="ml-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Enter Order ID (e.g. DP-2024-00142)"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="flex-1 px-3 py-3.5 text-sm outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                        Track
                    </button>
                </form>

                {/* ── Demo Hint ── */}
                {!order && !notFound && (
                    <p className="text-center text-sm text-gray-400 mb-6">
                        Try demo order ID: <button className="text-blue-600 font-medium" onClick={() => setOrderId('DP-2024-00142')}>DP-2024-00142</button>
                    </p>
                )}

                {/* ── Not Found ── */}
                {notFound && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-sm text-red-600">
                        Order not found. Please check your Order ID or contact us at <strong>+91 98765 43210</strong>.
                    </div>
                )}

                {/* ── Order Details ── */}
                {order && (
                    <div className="space-y-5">

                        {/* Status progress */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
                                    <p className="font-bold text-gray-900">{order.orderId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-0.5">Expected By</p>
                                    <p className="font-bold text-blue-600 text-sm">{order.expectedBy}</p>
                                </div>
                            </div>

                            {/* Progress Steps */}
                            <div className="relative">
                                {/* Connecting line */}
                                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
                                <div
                                    className="absolute top-5 left-5 h-0.5 bg-blue-600 transition-all"
                                    style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                                />

                                <div className="relative flex justify-between">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const done = idx <= currentStep
                                        const active = idx === currentStep
                                        return (
                                            <div key={step.key} className="flex flex-col items-center gap-2">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all
                                                    ${done
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'bg-white border-gray-200 text-gray-400'
                                                    }
                                                    ${active ? 'ring-4 ring-blue-100' : ''}`}
                                                >
                                                    <step.icon size={16} />
                                                </div>
                                                <p className={`text-[11px] font-medium text-center ${done ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Placed at */}
                            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                                <Clock size={11} /> Placed on {order.placedAt}
                            </p>
                        </div>

                        {/* Delivery info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                    <MapPin size={15} className="text-blue-600" /> Delivery Address
                                </h3>
                                <p className="font-medium text-gray-800 text-sm">{order.patient}</p>
                                <p className="text-xs text-gray-500 mt-1">{order.address}</p>
                                <p className="text-xs text-gray-500">{order.phone}</p>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                    <Truck size={15} className="text-blue-600" /> Delivery Agent
                                </h3>
                                <p className="font-medium text-gray-800 text-sm">{order.deliveryAgent}</p>
                                <a href={`tel:${order.agentPhone}`} className="flex items-center gap-1.5 text-blue-600 text-xs mt-2 hover:underline">
                                    <Phone size={12} /> {order.agentPhone}
                                </a>
                            </div>
                        </div>

                        {/* Order items */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-800 text-sm mb-3">Order Items</h3>
                            <div className="space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-medium text-gray-700">{item.name}</p>
                                            <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                                        </div>
                                        <p className="font-semibold text-gray-800">₹{item.price * item.qty}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-bold text-gray-900">
                                <span>Total</span>
                                <span>₹{order.total}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
