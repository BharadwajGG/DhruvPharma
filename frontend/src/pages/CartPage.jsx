import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { useDelivery } from '../context/DeliveryContext'
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Heart,
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
    QrCode,
    CreditCard,
    Copy,
    Check,
    X,
    Info,
    Sparkles,
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

    const { rxFileInputRef } = { rxFileInputRef: useRef(null) }
    const { addToWishlist } = useWishlist()
    const { selectedLocation, checkPincode, serviceableAreas, setLocationByPincode } = useDelivery()

    // Flow Step: 'cart' (Review Items) or 'checkout' (Enter Details)
    const [step, setStep] = useState('cart')

    // Checkout Form State (defaults to user's selected delivery location)
    const [formData, setFormData] = useState({
        customerName: currentUser?.displayName || '',
        phone: localStorage.getItem('dhruv_user_phone') || '',
        email: currentUser?.email || '',
        district: selectedLocation?.district || 'Nandurbar',
        areaName: selectedLocation?.name || 'Nandurbar',
        address: '',
        pincode: selectedLocation?.pincode || '425412',
        paymentMethod: 'COD', // 'COD' | 'UPI_QR' | 'CASHFREE'
        notes: '',
    })

    // Keep form in sync when user changes selected delivery location
    useEffect(() => {
        if (selectedLocation) {
            setFormData((prev) => ({
                ...prev,
                pincode: prev.pincode || selectedLocation.pincode,
                areaName: prev.areaName || selectedLocation.name,
                district: prev.district || selectedLocation.district,
            }))
        }
    }, [selectedLocation])

    const [rxFile, setRxFile] = useState(null)
    const [coupon, setCoupon] = useState('')
    const [couponApplied, setCouponApplied] = useState(false)
    const [couponDiscount, setCouponDiscount] = useState(0)
    const [couponMsg, setCouponMsg] = useState('')
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
    const [publicCoupons, setPublicCoupons] = useState([])
    const [savedAddresses, setSavedAddresses] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [orderSuccess, setOrderSuccess] = useState(null)
    const [formErrors, setFormErrors] = useState({})

    // Fetch public showcase coupons (only coupons owner selected to show in cart)
    useEffect(() => {
        const fetchPublicCoupons = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/coupons/public')
                if (res.ok) {
                    const data = await res.json()
                    setPublicCoupons(Array.isArray(data) ? data : [])
                }
            } catch (err) {
                // Silently ignore if offline
            }
        }
        fetchPublicCoupons()
    }, [])

    // Load saved addresses on mount
    useEffect(() => {
        const storedAddrs = localStorage.getItem('dhruv_saved_addresses')
        if (storedAddrs) {
            try {
                const parsed = JSON.parse(storedAddrs)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSavedAddresses(parsed)
                    const def = parsed.find((a) => a.isDefault) || parsed[0]
                    if (def && !formData.address) {
                        setFormData((prev) => ({
                            ...prev,
                            address: def.address,
                            pincode: def.pincode,
                            district: def.district || prev.district,
                            areaName: def.areaName || prev.areaName,
                        }))
                        setLocationByPincode(def.pincode)
                    }
                }
            } catch (e) {}
        }
    }, [])

    // Payment Gateway & UPI QR Modals State
    const [upiModalOpen, setUpiModalOpen] = useState(false)
    const [cashfreeModalOpen, setCashfreeModalOpen] = useState(false)
    const [cashfreeSession, setCashfreeSession] = useState(null)
    const [activePaymentOrder, setActivePaymentOrder] = useState(null)
    const [utrInput, setUtrInput] = useState('')
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
    const [copiedUpi, setCopiedUpi] = useState(false)
    const [toastMessage, setToastMessage] = useState('')

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(''), 3000)
    }

    const handleApplyCoupon = async () => {
        const cleanCode = coupon.trim().toUpperCase()
        if (!cleanCode) return
        setIsValidatingCoupon(true)
        setCouponMsg('')

        // Ensure persistent device ID
        let clientId = localStorage.getItem('dhruv_client_id')
        if (!clientId) {
            clientId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
            localStorage.setItem('dhruv_client_id', clientId)
        }

        const savedPhone = (formData.phone || localStorage.getItem('dhruv_user_phone') || '').trim()
        const checkEmail = (formData.email || currentUser?.email || '').trim()
        const checkUserId = currentUser?.uid || savedPhone || checkEmail || clientId

        try {
            const res = await fetch('http://localhost:8000/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: cleanCode,
                    subtotal: subtotal,
                    userId: checkUserId,
                    phone: savedPhone,
                    email: checkEmail,
                }),
            })
            const data = await res.json()
            if (data.valid) {
                setCouponApplied(true)
                setCouponDiscount(data.discount)
                setCouponMsg(data.message)
            } else {
                setCouponApplied(false)
                setCouponDiscount(0)
                setCouponMsg(data.message || 'Invalid coupon code or usage limit exceeded.')
            }
        } catch (e) {
            setCouponApplied(false)
            setCouponDiscount(0)
            setCouponMsg('Unable to validate coupon code at this time. Please try again.')
        } finally {
            setIsValidatingCoupon(false)
        }
    }

    const discountAmount = couponApplied ? couponDiscount : 0
    const finalPayable = Math.max(0, totalAmount - discountAmount)

    // Form Validation
    const validateForm = () => {
        const errors = {}
        if (!formData.customerName.trim()) errors.customerName = 'Patient / Customer name is required'
        if (!formData.phone.trim() || formData.phone.length < 10) errors.phone = 'Valid 10-digit phone number is required'
        if (!formData.address.trim()) errors.address = 'Full delivery address is required'
        
        // Strict PIN code validation against the 7 authorized areas
        const cleanPin = (formData.pincode || '').trim()
        const matchedArea = checkPincode(cleanPin)
        if (!cleanPin) {
            errors.pincode = '6-digit PIN code is required'
        } else if (!matchedArea) {
            errors.pincode = 'Delivery available only to: Nandurbar (425412), Shahada (425409), Taloda (425413), Nijampur (424305), Akkalkuwa (425415), Shirpur (424405) & Sakri (424304).'
        }

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
            if (couponApplied && coupon.trim()) {
                data.append('couponCode', coupon.trim().toUpperCase())
            }

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

            // Branch based on selected payment method
            if (formData.paymentMethod === 'UPI_QR') {
                setActivePaymentOrder(result.order)
                setUpiModalOpen(true)
                return
            }

            if (formData.paymentMethod === 'CASHFREE') {
                setActivePaymentOrder(result.order)
                try {
                    const cfRes = await fetch('http://localhost:8000/api/payment/cashfree/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId: result.order.id || result.order.orderId,
                            amount: finalPayable,
                            customerName: formData.customerName,
                            customerPhone: formData.phone,
                            customerEmail: formData.email || currentUser?.email || '',
                        }),
                    })
                    const cfData = await cfRes.json()
                    setCashfreeSession(cfData)
                    setCashfreeModalOpen(true)
                } catch (e) {
                    console.error('Cashfree session init error:', e)
                    setCashfreeSession({ mode: 'test_simulation', orderId: result.order.id || result.order.orderId })
                    setCashfreeModalOpen(true)
                }
                return
            }

            // Cash on Delivery (COD) places immediately
            clearCart()
            setOrderSuccess(result)
        } catch (err) {
            console.error('Order placement error:', err)
            alert(err.message || 'Unable to place order. Please ensure the backend server is running.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Confirm UPI QR Payment
    const handleConfirmUpiPayment = async () => {
        if (!activePaymentOrder) return
        setIsVerifyingPayment(true)
        try {
            const res = await fetch('http://localhost:8000/api/payment/upi-qr/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: activePaymentOrder.id || activePaymentOrder.orderId,
                    utrNumber: utrInput.trim(),
                    upiApp: 'UPI QR',
                }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.detail || 'Failed to verify UPI payment')

            const confirmedOrder = result.order || activePaymentOrder
            savePlacedOrder(confirmedOrder)
            clearCart()
            setUpiModalOpen(false)
            setOrderSuccess({
                order: confirmedOrder,
                whatsappMessage: `Hello Dhruv Pharma, I have paid ₹${finalPayable} via UPI QR for Order #${confirmedOrder.id || confirmedOrder.orderId}.`,
            })
        } catch (err) {
            console.error('UPI confirm error:', err)
            alert(err.message || 'Payment confirmation failed. Please try again.')
        } finally {
            setIsVerifyingPayment(false)
        }
    }

    // Confirm Cashfree Payment
    const handleConfirmCashfreePayment = async (paymentId = 'CF_SANDBOX_SUCCESS') => {
        if (!activePaymentOrder) return
        setIsVerifyingPayment(true)
        try {
            const res = await fetch('http://localhost:8000/api/payment/cashfree/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: activePaymentOrder.id || activePaymentOrder.orderId,
                    paymentId,
                    cashfreeOrderId: cashfreeSession?.cashfreeOrderId || '',
                }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.detail || 'Failed to verify Cashfree payment')

            const confirmedOrder = result.order || activePaymentOrder
            savePlacedOrder(confirmedOrder)
            clearCart()
            setCashfreeModalOpen(false)
            setOrderSuccess({
                order: confirmedOrder,
                whatsappMessage: `Hello Dhruv Pharma, I have paid ₹${finalPayable} via Cashfree Online Gateway for Order #${confirmedOrder.id || confirmedOrder.orderId}.`,
            })
        } catch (err) {
            console.error('Cashfree verify error:', err)
            alert(err.message || 'Payment verification failed. Please try again.')
        } finally {
            setIsVerifyingPayment(false)
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
                        <p className="text-xs text-blue-700">Estimated Delivery: <strong className="text-green-700">{order.expectedDelivery || 'Expected in 3–4 Days'}</strong></p>
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

                                        {/* Item Total, Save for Later & Remove */}
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-gray-900 text-xs">
                                                ₹{(item.price * item.qty).toFixed(2)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        addToWishlist(item)
                                                        removeFromCart(item.id)
                                                        showToast(`Saved "${item.name}" to your wishlist!`)
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                                                    title="Save for Later (Move to Wishlist)"
                                                >
                                                    <Heart size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
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
                                        <span>Medicines Price:</span>
                                        <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    {totalSavings > 0 && (
                                        <div className="flex justify-between text-green-700">
                                            <span>Total Savings on MRP:</span>
                                            <span className="font-semibold">-₹{totalSavings.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {couponApplied && (
                                        <div className="flex justify-between text-green-700 font-semibold">
                                            <span>Coupon Discount ({coupon.trim().toUpperCase()}):</span>
                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Home Delivery Fee:</span>
                                        <span className="font-semibold text-gray-800">
                                            {deliveryFee === 0 ? (
                                                <span className="text-green-600 font-bold">FREE (Above ₹300)</span>
                                            ) : (
                                                `₹${deliveryFee}`
                                            )}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-gray-900">
                                        <span>Total Amount to Pay:</span>
                                        <span className="text-blue-700 text-base">₹{finalPayable.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Coupon Input (Owner controls whether coupon buttons appear) */}
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter Coupon Code (Optional)"
                                            value={coupon}
                                            onChange={(e) => setCoupon(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 uppercase font-mono"
                                        />
                                        <button
                                            type="button"
                                            disabled={isValidatingCoupon || !coupon.trim()}
                                            onClick={handleApplyCoupon}
                                            className="bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            {isValidatingCoupon ? <Loader2 size={12} className="animate-spin" /> : <Tag size={12} />}
                                            <span>Apply</span>
                                        </button>
                                    </div>

                                    {couponMsg && (
                                        <p className={`text-[11px] mt-1.5 font-medium ${couponApplied ? 'text-emerald-700' : 'text-red-500'}`}>
                                            {couponMsg}
                                        </p>
                                    )}

                                    {/* Show coupon pills ONLY if owner has explicitly enabled showcase in cart */}
                                    {!couponApplied && publicCoupons && publicCoupons.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {publicCoupons.map((pc) => (
                                                <button
                                                    key={pc.id}
                                                    type="button"
                                                    onClick={() => setCoupon(pc.code)}
                                                    className="text-[10px] font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer flex items-center gap-1 transition-colors"
                                                    title={`Click to apply ${pc.code}`}
                                                >
                                                    <span>🏷️ {pc.code}</span>
                                                    <span className="text-[9px] text-blue-600 font-sans">
                                                        ({pc.discount_type === 'percentage' ? `${pc.discount_value}% OFF` : `₹${pc.discount_value} OFF`})
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
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

                                {/* Direct Pharmacy Assistance Box */}
                                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-700">
                                    <div className="flex items-center gap-1.5">
                                        <Phone size={13} className="text-emerald-600 shrink-0" />
                                        <span>Need help? Call pharmacy:</span>
                                    </div>
                                    <a
                                        href="tel:9503500725"
                                        className="font-bold text-emerald-700 hover:underline font-mono"
                                    >
                                        9503500725
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: CHECKOUT DETAILS & CONFIRMATION ── */}
                {step === 'checkout' && (
                    <form onSubmit={handlePlaceOrder} className="space-y-5">
                        {/* Top Back & Assurance Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                            <button
                                type="button"
                                onClick={() => setStep('cart')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs hover:bg-blue-50 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                <span>Back to Bag</span>
                            </button>
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                <ShieldCheck size={15} className="text-emerald-600" />
                                <span>100% Genuine Pharmacy · Safe Checkout</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Column: Delivery Address & Patient Details (7 cols) */}
                            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4 text-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                        <MapPin size={16} className="text-blue-600" />
                                        <span>Delivery &amp; Patient Information</span>
                                    </h3>
                                    <span className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold">
                                        Nandurbar District
                                    </span>
                                </div>

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

                                {/* Saved Delivery Addresses Quick Selector */}
                                {savedAddresses.length > 0 && (
                                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mb-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                                                <MapPin size={12} className="text-emerald-600" />
                                                <span>Deliver to a Saved Address:</span>
                                            </p>
                                            <Link to="/profile" className="text-[10px] text-emerald-700 font-bold hover:underline">
                                                Manage Addresses &rarr;
                                            </Link>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {savedAddresses.map((addr) => {
                                                const isSelected = formData.pincode === addr.pincode && formData.address === addr.address
                                                return (
                                                    <button
                                                        key={addr.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                address: addr.address,
                                                                pincode: addr.pincode,
                                                                district: addr.district || prev.district,
                                                                areaName: addr.areaName || prev.areaName,
                                                            }))
                                                            setLocationByPincode(addr.pincode)
                                                        }}
                                                        className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 font-medium'
                                                        }`}
                                                    >
                                                        <span className="font-bold">[{addr.label}]</span> {addr.areaName || addr.district} ({addr.pincode})
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3.5 pt-1">
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
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setFormData({ ...formData, phone: val })
                                                    const digits = val.replace(/\D/g, '')
                                                    if (digits.length >= 10) {
                                                        localStorage.setItem('dhruv_user_phone', digits)
                                                    }
                                                }}
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
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block font-semibold text-gray-700">
                                                Select Delivery Hub / Town <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                                                Expected in 3–4 Days
                                            </span>
                                        </div>
                                        <select
                                            value={formData.pincode}
                                            onChange={(e) => {
                                                const selectedPin = e.target.value
                                                const match = checkPincode(selectedPin)
                                                if (match) {
                                                    setFormData({
                                                        ...formData,
                                                        pincode: match.pincode,
                                                        district: match.district,
                                                        areaName: match.name,
                                                    })
                                                    setLocationByPincode(match.pincode)
                                                }
                                            }}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white font-medium text-xs"
                                        >
                                            {serviceableAreas.map((area) => (
                                                <option key={area.pincode} value={area.pincode}>
                                                    {area.name} — PIN {area.pincode} ({area.district} Dist.) · 3–4 Days Delivery
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                PIN Code <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="e.g. 425412"
                                                value={formData.pincode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '')
                                                    const match = checkPincode(val)
                                                    setFormData({
                                                        ...formData,
                                                        pincode: val,
                                                        district: match ? match.district : formData.district,
                                                        areaName: match ? match.name : formData.areaName,
                                                    })
                                                    if (match) setLocationByPincode(match.pincode)
                                                }}
                                                className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-mono ${
                                                    formErrors.pincode ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                                                }`}
                                            />
                                            {formErrors.pincode ? (
                                                <p className="text-[11px] text-red-500 mt-1 leading-snug">{formErrors.pincode}</p>
                                            ) : (
                                                <p className="text-[10px] text-green-700 font-medium mt-1">
                                                    ✓ Authorized hub ({formData.areaName || 'Serviceable'}) · Expected in 3–4 Days
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">
                                                District
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={(formData.district || 'Nandurbar') + ' District, Maharashtra'}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">
                                            Doorstep Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="Flat/House no., Building, Street, Landmark"
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

                                    {/* Prescription Attachment */}
                                    <div className={`p-3.5 rounded-xl border ${hasRxItem ? 'bg-amber-50/70 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <label className="block font-bold text-gray-800 mb-1">
                                            Doctor's Prescription {hasRxItem ? <span className="text-red-600">* (Required for Rx Medicines)</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
                                        </label>
                                        <p className="text-[11px] text-gray-500 mb-2">
                                            Take a photo from your mobile phone camera or attach PDF.
                                        </p>
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
                                </div>
                            </div>

                            {/* Right Column: Order Items Summary + Payment Method (5 cols) */}
                            <div className="lg:col-span-5 space-y-4">
                                {/* Card 1: Order Items Summary */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3.5 text-xs">
                                    <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100 flex items-center justify-between">
                                        <span>Order Items Summary ({cart.length})</span>
                                        <span className="text-[11px] text-gray-400 font-normal">Review Items</span>
                                    </h3>
                                    <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto pr-1">
                                        {cart.map((item) => (
                                            <div key={item.id} className="py-2 flex justify-between items-center">
                                                <div className="pr-2">
                                                    <p className="font-bold text-gray-800 line-clamp-1">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400">Qty: {item.qty} × ₹{item.price}</p>
                                                </div>
                                                <span className="font-bold text-gray-900 shrink-0">₹{(item.price * item.qty).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 pt-3 space-y-1.5 text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Medicines Price:</span>
                                            <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        {couponApplied && (
                                            <div className="flex justify-between text-emerald-700 font-semibold">
                                                <span>Coupon Discount:</span>
                                                <span>-₹{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Home Delivery Fee:</span>
                                            <span className="font-semibold text-slate-800">
                                                {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                                            <span>Total Amount:</span>
                                            <span className="text-blue-700 text-base">₹{finalPayable.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Select Payment Method & Place Order (Directly Downside) */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3.5 text-xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <label className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                            <CreditCard size={15} className="text-blue-600" />
                                            <span>Select Payment Method</span>
                                        </label>
                                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            100% Secure
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {/* Option 1: Cash on Delivery */}
                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                formData.paymentMethod === 'COD'
                                                    ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                                                    formData.paymentMethod === 'COD' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    💵
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-xs">Cash on Delivery (COD)</p>
                                                    <p className="text-[11px] text-gray-500">Pay cash upon doorstep delivery</p>
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                formData.paymentMethod === 'COD' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                            }`}>
                                                {formData.paymentMethod === 'COD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>

                                        {/* Option 2: Instant UPI Dynamic QR */}
                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'UPI_QR' })}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                formData.paymentMethod === 'UPI_QR'
                                                    ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                                                    formData.paymentMethod === 'UPI_QR' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    <QrCode size={16} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-bold text-gray-900 text-xs">Instant UPI Dynamic QR</p>
                                                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 rounded">
                                                            Zero Fee
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500">Scan via Google Pay, PhonePe, Paytm, BHIM</p>
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                formData.paymentMethod === 'UPI_QR' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                            }`}>
                                                {formData.paymentMethod === 'UPI_QR' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>

                                        {/* Option 3: Cashfree Online Gateway */}
                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'CASHFREE' })}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                formData.paymentMethod === 'CASHFREE'
                                                    ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                                                    formData.paymentMethod === 'CASHFREE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    <CreditCard size={16} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-bold text-gray-900 text-xs">Cashfree Online Gateway</p>
                                                        <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 rounded">
                                                            Cards / Netbanking
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500">Cards, Netbanking &amp; UPI online settlement</p>
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                formData.paymentMethod === 'CASHFREE' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                            }`}>
                                                {formData.paymentMethod === 'CASHFREE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confirm & Place Order Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 mt-4 text-sm cursor-pointer active:scale-98"
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

                                    <div className="pt-2 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
                                        <ShieldCheck size={12} className="text-emerald-600" />
                                        <span>256-bit encrypted secure checkout · Dhruv Pharma</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* ── Toast Notification ── */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* ── 1. UPI DYNAMIC QR CODE MODAL ── */}
                {upiModalOpen && activePaymentOrder && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-gray-100 shadow-2xl relative">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setUpiModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Header */}
                            <div className="text-center space-y-1">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <QrCode size={26} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Scan &amp; Pay via UPI</h3>
                                <p className="text-xs text-gray-500">
                                    Order <strong className="text-gray-800 font-mono">{activePaymentOrder.id || activePaymentOrder.orderId}</strong> · Instant 0% gateway fee
                                </p>
                            </div>

                            {/* Amount Highlight */}
                            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-center">
                                <p className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider">Payable Amount</p>
                                <p className="text-2xl font-black text-blue-900 mt-0.5">₹{finalPayable.toFixed(2)}</p>
                            </div>

                            {/* Dynamic QR Code */}
                            <div className="flex flex-col items-center justify-center py-2">
                                <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-gray-300 shadow-inner">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
                                            `upi://pay?pa=dhruvpharma@okaxis&pn=DhruvPharma&am=${finalPayable}&tr=${activePaymentOrder.id || activePaymentOrder.orderId}&cu=INR&tn=Order%20Payment`
                                        )}`}
                                        alt="UPI Dynamic QR Code"
                                        className="w-48 h-48 rounded-xl object-contain mx-auto"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2 text-center">
                                    Scan with Google Pay, PhonePe, Paytm, BHIM, or any banking app
                                </p>
                            </div>

                            {/* UPI ID Copy & Mobile Link */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                                <div className="min-w-0 pr-2">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Dhruv Pharma UPI ID</p>
                                    <p className="font-mono font-bold text-gray-800 truncate">dhruvpharma@okaxis</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText('dhruvpharma@okaxis')
                                        setCopiedUpi(true)
                                        setTimeout(() => setCopiedUpi(false), 2000)
                                    }}
                                    className="shrink-0 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                    {copiedUpi ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                    <span>{copiedUpi ? 'Copied!' : 'Copy ID'}</span>
                                </button>
                            </div>

                            {/* UTR Input */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-700">
                                    UPI Ref / UTR No. <span className="text-gray-400 font-normal">(Optional for instant match)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 324158904512 (12-digit UTR)"
                                    value={utrInput}
                                    onChange={(e) => setUtrInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 font-mono"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleConfirmUpiPayment}
                                    disabled={isVerifyingPayment}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all shadow-xs text-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isVerifyingPayment ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Verifying Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={15} />
                                            <span>I Have Completed Payment</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setUpiModalOpen(false)
                                        setFormData((prev) => ({ ...prev, paymentMethod: 'COD' }))
                                        showToast('Switched payment method to Cash on Delivery.')
                                    }}
                                    className="w-full text-center text-xs text-gray-500 hover:text-gray-800 py-1 transition-colors"
                                >
                                    Cancel &amp; Pay via Cash on Delivery instead
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 2. CASHFREE ONLINE GATEWAY MODAL ── */}
                {cashfreeModalOpen && activePaymentOrder && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-gray-100 shadow-2xl relative">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setCashfreeModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Cashfree Header */}
                            <div className="text-center space-y-1">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <CreditCard size={26} />
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <h3 className="text-xl font-bold text-gray-900">Cashfree Payments</h3>
                                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        Sandbox Test
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Secured by 256-bit encryption · Order <strong className="text-gray-800 font-mono">{activePaymentOrder.id || activePaymentOrder.orderId}</strong>
                                </p>
                            </div>

                            {/* Amount Highlight */}
                            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3 text-center">
                                <p className="text-[11px] text-indigo-700 font-semibold uppercase tracking-wider">Total Payable Amount</p>
                                <p className="text-2xl font-black text-indigo-950 mt-0.5">₹{finalPayable.toFixed(2)}</p>
                            </div>

                            {/* Available Methods Simulator */}
                            <div className="space-y-2 text-xs">
                                <p className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Choose Online Method</p>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl text-indigo-900 font-semibold flex flex-col items-center gap-1">
                                        <QrCode size={18} />
                                        <span className="text-[11px]">UPI Apps</span>
                                    </div>
                                    <div className="p-3 border border-gray-200 hover:border-indigo-200 rounded-xl text-gray-700 font-semibold flex flex-col items-center gap-1">
                                        <CreditCard size={18} />
                                        <span className="text-[11px]">Debit/Credit</span>
                                    </div>
                                    <div className="p-3 border border-gray-200 hover:border-indigo-200 rounded-xl text-gray-700 font-semibold flex flex-col items-center gap-1">
                                        <span className="text-sm">🏦</span>
                                        <span className="text-[11px]">Net Banking</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sandbox Ready Banner */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                                <Info size={15} className="shrink-0 text-amber-600 mt-0.5" />
                                <div>
                                    <strong>Sandbox Mode Active:</strong> This gateway is connected and ready. Once your domain is hosted, add your Cashfree App ID &amp; Secret Key in <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">backend/.env</code> to switch to live money settlements!
                                </div>
                            </div>

                            {/* Confirm Action Button */}
                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => handleConfirmCashfreePayment(`CF_SANDBOX_TXN_${Date.now().toString().slice(-6)}`)}
                                    disabled={isVerifyingPayment}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs text-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isVerifyingPayment ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Processing via Cashfree...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} />
                                            <span>Simulate Successful Payment (₹{finalPayable.toFixed(2)})</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCashfreeModalOpen(false)}
                                    className="w-full text-center text-xs text-gray-500 hover:text-gray-800 py-1 transition-colors"
                                >
                                    Close &amp; Return to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
