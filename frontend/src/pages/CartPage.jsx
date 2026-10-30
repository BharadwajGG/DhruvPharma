import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Upload,
    ArrowRight,
    ArrowLeft,
    Tag,
    AlertCircle,
    CheckCircle,
    Phone,
    MapPin,
    ShieldCheck,
    Truck,
    Loader2,
    FileText,
    ExternalLink,
} from 'lucide-react'

export default function CartPage() {
    const navigate = useNavigate()
    const { currentUser, loginWithGoogle } = useAuth()
    const {
        cart,
        updateQty,
        removeFromCart,
        clearCart,
        savePlacedOrder,
        totalItems,
        subtotal,
        totalSavings,
        deliveryFee,
        totalAmount,
        hasRxItem,
    } = useCart()

    const rxFileInputRef = useRef(null)

    // Flow Step: 'cart' (Review Items) or 'checkout' (Enter Details)
    const [step, setStep] = useState('cart')

    // Checkout Form State
    const [formData, setFormData] = useState({
        customerName: currentUser?.displayName || '',
        phone: '',
        email: currentUser?.email || '',
        district: 'Pune',
        address: '',
        pincode: '',
        paymentMethod: 'COD',
        notes: '',
    })

    const [rxFile, setRxFile] = useState(null)
    const [coupon, setCoupon] = useState('')
    const [couponApplied, setCouponApplied] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [orderSuccess, setOrderSuccess] = useState(null)
    const [formErrors, setFormErrors] = useState({})

    const handleApplyCoupon = () => {
        if (coupon.trim().toUpperCase() === 'DHRUV5') {
            setCouponApplied(true)
        } else {
            alert('Invalid coupon. Try "DHRUV5" for 5% off.')
        }
    }

    const discountAmount = couponApplied ? Math.round(subtotal * 0.05) : 0
    const finalPayable = Math.max(0, totalAmount - discountAmount)

    // Form Validation
    const validateForm = () => {
        const errors = {}
        if (!formData.customerName.trim()) errors.customerName = 'Patient / Customer name is required'
        if (!formData.phone.trim() || formData.phone.length < 10) errors.phone = 'Valid 10-digit phone number is required'
        if (!formData.address.trim()) errors.address = 'Full delivery address is required'
        if (!formData.district.trim()) errors.district = 'Select your Maharashtra delivery district'
        if (hasRxItem && !rxFile) {
            errors.rxFile = "Doctor's prescription photo or PDF is required for this order"
        }
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    // Submit Order
    const handlePlaceOrder = async (e) => {
        e.preventDefault()
        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        try {
            const data = new FormData()
            data.append('customerName', formData.customerName.trim())
            data.append('phone', formData.phone.trim())
            data.append('email', (formData.email || currentUser?.email || '').trim())
            data.append('userId', currentUser?.uid || '')
            data.append('district', formData.district)
            data.append('address', formData.address.trim())
            data.append('pincode', (formData.pincode || '').trim())
            data.append('items', JSON.stringify(cart))
            data.append('subtotal', String(subtotal))
            data.append('discount', String(discountAmount))
            data.append('deliveryFee', String(deliveryFee))
            data.append('totalAmount', String(finalPayable))
            data.append('paymentMethod', formData.paymentMethod)
            data.append('notes', formData.notes || '')

            if (rxFile) {
                data.append('prescriptionFile', rxFile)
            }

            const res = await fetch('http://localhost:8000/api/orders', {
                method: 'POST',
                body: data,
            })

            const result = await res.json()
            if (!res.ok) {
                throw new Error(result.detail || 'Failed to place order.')
            }

            // Save order into customer's persistent order history
            savePlacedOrder(result.order)

            // Clear active cart ONLY upon successful order placement
            clearCart()
            setOrderSuccess(result)
        } catch (err) {
            console.error('Order placement error:', err)
            alert(err.message || 'Unable to place order. Please ensure the backend server is running.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Success State
    if (orderSuccess) {
        const order = orderSuccess.order
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 max-w-lg w-full text-center space-y-6">
                    <div className="w-18 h-18 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle size={44} />
                    </div>

                    <div>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Order Confirmed
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 mt-2">
                            Thank You, {order.patient || order.customerName}!
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Your order has been placed and saved to <strong>My Orders</strong>.
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                            <span className="text-xs font-semibold text-blue-800">Order Reference</span>
                            <span className="font-mono text-xs font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                                {order.id || order.orderId}
                            </span>
                        </div>
                        <p className="text-xs text-blue-700">Amount: <strong className="text-gray-900">₹{order.amount || order.totalAmount}</strong> ({order.paymentMethod})</p>
                        <p className="text-xs text-blue-700">Delivery Address: <span className="font-medium text-gray-800">{order.address}, {order.district}</span></p>
                        <p className="text-xs text-blue-700">Estimated Delivery: <strong className="text-green-700">{order.expectedDelivery || '2–4 Hours (Doorstep)'}</strong></p>
                    </div>

                    {orderSuccess.whatsappMessage && (
                        <a
                            href={`https://wa.me/91${formData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(orderSuccess.whatsappMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors text-xs shadow-xs"
                        >
                            <span>Open WhatsApp Confirmation Message</span>
                            <ExternalLink size={13} />
                        </a>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Link
                            to="/medicines"
                            className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
                        >
                            Shop More Medicines
                        </Link>
                        <Link
                            to="/my-orders"
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                        >
                            View in My Orders
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Empty Cart State
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={40} className="text-blue-300" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Your Cart is Empty</h2>
                <p className="text-gray-400 text-xs mb-6 max-w-sm">
                    You have not added any medicines to your cart yet. Explore our genuine pharmacy store.
                </p>
                <div className="flex gap-3">
                    <Link
                        to="/medicines"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-xs shadow-xs"
                    >
                        Browse Medicines Store
                    </Link>
                    <Link
                        to="/my-orders"
                        className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-3 rounded-xl transition-colors text-xs"
                    >
                        View My Orders
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {step === 'cart' ? 'Your Shopping Cart' : 'Checkout & Delivery Address'}
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {totalItems} medicine{totalItems !== 1 ? 's' : ''} · Delivering across Maharashtra
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {step === 'checkout' ? (
                            <button
                                type="button"
                                onClick={() => setStep('cart')}
                                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                            >
                                <ArrowLeft size={13} />
                                <span>Back to Cart</span>
                            </button>
                        ) : (
                            <Link
                                to="/medicines"
                                className="text-xs text-blue-600 hover:underline font-medium"
                            >
                                + Add More Medicines
                            </Link>
                        )}
                    </div>
                </div>

                {/* Prescription Warning Banner */}
                {hasRxItem && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                                Prescription Required (Schedule H Item In Cart)
                            </h4>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Your order contains regulated medications. You will be prompted to attach a doctor's prescription during checkout.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: REVIEW CART ITEMS ── */}
                {step === 'cart' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Cart Items Table */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3">
                                <h3 className="font-bold text-gray-800 text-sm pb-2 border-b border-gray-100">
                                    Cart Items ({cart.length})
                                </h3>

                                {cart.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-none"
                                    >
                                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                            <ShoppingCart size={20} className="text-blue-400" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 text-xs truncate">{item.name}</p>
                                                {item.requires_rx && (
                                                    <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.2 rounded border border-red-200 shrink-0">
                                                        Rx
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 italic truncate">{item.salt || item.brand}</p>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="font-bold text-gray-900 text-xs">₹{item.price}</span>
                                                {item.mrp > item.price && (
                                                    <span className="text-[10px] text-gray-400 line-through">₹{item.mrp}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Qty controls */}
                                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => updateQty(item.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-gray-600 transition-colors"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-xs font-bold text-gray-800 w-6 text-center">
                                                {item.qty}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateQty(item.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-gray-600 transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        {/* Item Total & Remove */}
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-gray-900 text-xs">
                                                ₹{(item.price * item.qty).toFixed(2)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title="Remove item"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bill Breakdown & Proceed Button */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4 text-xs">
                                <h3 className="font-bold text-gray-800 text-sm pb-2 border-b border-gray-100">
                                    Order Summary
                                </h3>

                                <div className="space-y-2.5 text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Cart Subtotal:</span>
                                        <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    {totalSavings > 0 && (
                                        <div className="flex justify-between text-green-700">
                                            <span>Total MRP Discount:</span>
                                            <span className="font-semibold">-₹{totalSavings.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {couponApplied && (
                                        <div className="flex justify-between text-green-700 font-semibold">
                                            <span>Special Discount (DHRUV5):</span>
                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Regional Delivery Fee:</span>
                                        <span className="font-semibold text-gray-800">
                                            {deliveryFee === 0 ? (
                                                <span className="text-green-600 font-bold">FREE (Above ₹300)</span>
                                            ) : (
                                                `₹${deliveryFee}`
                                            )}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-gray-900">
                                        <span>Total Payable:</span>
                                        <span className="text-blue-700 text-base">₹{finalPayable.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Coupon Input */}
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <input
                                        type="text"
                                        placeholder="Coupon (e.g. DHRUV5)"
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 uppercase font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>

                                {/* Proceed to Checkout Button */}
                                <button
                                    type="button"
                                    onClick={() => setStep('checkout')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm mt-3"
                                >
                                    <span>Proceed to Checkout</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: CHECKOUT DETAILS & CONFIRMATION ── */}
                {step === 'checkout' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Form Column */}
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
                            <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100 flex items-center gap-1.5">
                                <MapPin size={16} className="text-blue-600" /> Enter Delivery Information
                            </h3>

                            {!currentUser && (
                                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                    <div className="flex items-center gap-2 text-blue-900">
                                        <span className="text-base">👤</span>
                                        <span>Sign in to save this order to your account automatically.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const res = await loginWithGoogle()
                                                if (res?.user) {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        customerName: res.user.displayName || prev.customerName,
                                                        email: res.user.email || prev.email,
                                                    }))
                                                }
                                            } catch (e) {
                                                console.error('Google sign-in during checkout:', e)
                                            }
                                        }}
                                        className="shrink-0 self-start sm:self-auto bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs px-3 py-1.5 rounded-lg border border-gray-300 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                        </svg>
                                        <span>Sign in with Google</span>
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handlePlaceOrder} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Patient / Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 ${
                                            formErrors.customerName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                                        }`}
                                    />
                                    {formErrors.customerName && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.customerName}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="10-digit mobile"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 ${
                                                formErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                                            }`}
                                        />
                                        {formErrors.phone && (
                                            <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">
                                            Email (For Invoice Receipt)
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="name@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Maharashtra District <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value="Pune">Pune</option>
                                        <option value="Nashik">Nashik</option>
                                        <option value="Ahmednagar">Ahmednagar</option>
                                        <option value="Aurangabad">Aurangabad (Chhatrapati Sambhajinagar)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Doorstep Address <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Flat/House no., Street, Area, Landmark"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none ${
                                            formErrors.address ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                                        }`}
                                    />
                                    {formErrors.address && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.address}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        PIN Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 411045"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Prescription Attachment */}
                                <div className={`p-3 rounded-xl border ${hasRxItem ? 'bg-amber-50/70 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <label className="block font-bold text-gray-800 mb-1">
                                        Attach Doctor's Prescription {hasRxItem ? <span className="text-red-600">* (Required)</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
                                    </label>
                                    <input
                                        ref={rxFileInputRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setRxFile(e.target.files[0] || null)}
                                        className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                    />
                                    {formErrors.rxFile && (
                                        <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} /> {formErrors.rxFile}
                                        </p>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1.5">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                                            className={`py-2 px-3 rounded-xl border text-center font-semibold text-xs transition-colors ${
                                                formData.paymentMethod === 'COD'
                                                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            💵 Cash on Delivery (COD)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'UPI' })}
                                            className={`py-2 px-3 rounded-xl border text-center font-semibold text-xs transition-colors ${
                                                formData.paymentMethod === 'UPI'
                                                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            📱 UPI on Delivery
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 mt-4 text-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Placing Order...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} />
                                            <span>Confirm &amp; Place Order (₹{finalPayable.toFixed(2)})</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Order Summary Column */}
                        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4 text-xs">
                            <h3 className="font-bold text-gray-800 text-sm pb-2 border-b border-gray-100">
                                Order Items Summary ({cart.length})
                            </h3>
                            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                                {cart.map((item) => (
                                    <div key={item.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">{item.name}</p>
                                            <p className="text-[10px] text-gray-400">Qty: {item.qty} × ₹{item.price}</p>
                                        </div>
                                        <span className="font-bold text-gray-900">₹{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 pt-3 space-y-1.5">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal:</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Delivery:</span>
                                    <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-50">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-700 text-base">₹{finalPayable.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
