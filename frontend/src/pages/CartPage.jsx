import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, Upload, ArrowRight, Tag } from 'lucide-react'

/* ── Mock cart items ── */
const INITIAL_CART = [
    { id: 7,  name: 'Vitamin D3 60K IU',  brand: 'Calcirol',  price: 90,  mrp: 120, requires_rx: false, qty: 2 },
    { id: 9,  name: 'Paracetamol 500mg',  brand: 'Crocin',    price: 18,  mrp: 25,  requires_rx: false, qty: 1 },
    { id: 13, name: 'Cetirizine 10mg',    brand: 'Okacet',    price: 22,  mrp: 30,  requires_rx: false, qty: 3 },
]

export default function CartPage() {
    const [cartItems, setCartItems] = useState(INITIAL_CART)
    const [coupon, setCoupon]       = useState('')
    const [couponApplied, setCouponApplied] = useState(false)

    const updateQty = (id, delta) =>
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
            )
        )

    const removeItem = (id) => setCartItems((prev) => prev.filter((i) => i.id !== id))

    const subtotal    = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    const savings     = cartItems.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0)
    const deliveryFee = subtotal >= 300 ? 0 : 40
    const discount    = couponApplied ? Math.round(subtotal * 0.05) : 0
    const total       = subtotal + deliveryFee - discount

    const applyCoupon = () => {
        if (coupon.toUpperCase() === 'DHRUV5') setCouponApplied(true)
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <ShoppingCart size={72} className="text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
                <p className="text-gray-400 text-sm mb-6">Browse our medicine store and add items to your cart</p>
                <Link
                    to="/medicines"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                    Shop Medicines
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Your Cart ({cartItems.length} items)
                </h1>

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── Cart Items ── */}
                    <div className="flex-1 space-y-3">
                        {cartItems.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center">
                                {/* Pill icon */}
                                <div className="bg-blue-50 rounded-xl w-16 h-16 flex items-center justify-center shrink-0">
                                    <ShoppingCart size={22} className="text-blue-300" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.brand}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="font-bold text-gray-900">₹{item.price}</span>
                                        <span className="text-xs text-gray-400 line-through">₹{item.mrp}</span>
                                    </div>
                                </div>

                                {/* Qty controls */}
                                <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                                    <button
                                        onClick={() => updateQty(item.id, -1)}
                                        className="p-1.5 hover:bg-gray-50 rounded-l-lg transition-colors"
                                    >
                                        <Minus size={14} className="text-gray-600" />
                                    </button>
                                    <span className="text-sm font-semibold text-gray-800 w-6 text-center">
                                        {item.qty}
                                    </span>
                                    <button
                                        onClick={() => updateQty(item.id, 1)}
                                        className="p-1.5 hover:bg-gray-50 rounded-r-lg transition-colors"
                                    >
                                        <Plus size={14} className="text-gray-600" />
                                    </button>
                                </div>

                                {/* Total + remove */}
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-gray-900 text-sm">₹{item.price * item.qty}</p>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-red-400 hover:text-red-600 mt-1 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Prescription note */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <Upload size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">Have prescription medicines?</p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Upload your prescription separately for medicines that require a doctor's prescription.
                                </p>
                                <Link
                                    to="/prescription"
                                    className="text-xs text-amber-700 font-semibold hover:underline mt-1 inline-block"
                                >
                                    Upload Prescription →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── Order Summary ── */}
                    <div className="lg:w-72 shrink-0">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-28">
                            <h2 className="font-semibold text-gray-800 mb-4">Order Summary</h2>

                            {/* Coupon */}
                            <div className="flex gap-2 mb-5">
                                <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <Tag size={14} className="ml-3 text-gray-400 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Coupon code"
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                        className="flex-1 px-2 py-2.5 text-sm outline-none"
                                        disabled={couponApplied}
                                    />
                                </div>
                                <button
                                    onClick={applyCoupon}
                                    disabled={couponApplied}
                                    className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                                        ${couponApplied
                                            ? 'bg-green-100 text-green-700 cursor-default'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {couponApplied ? '✓' : 'Apply'}
                                </button>
                            </div>
                            {couponApplied && (
                                <p className="text-xs text-green-600 font-medium -mt-4 mb-4">
                                    ✓ Coupon DHRUV5 applied — 5% off!
                                </p>
                            )}

                            {/* Price breakdown */}
                            <div className="space-y-2.5 text-sm mb-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>You Save</span>
                                    <span>- ₹{savings}</span>
                                </div>
                                {couponApplied && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Coupon Discount</span>
                                        <span>- ₹{discount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                                    </span>
                                </div>
                                {deliveryFee > 0 && (
                                    <p className="text-xs text-gray-400">
                                        Add ₹{300 - subtotal} more for free delivery
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-3 mb-5">
                                <div className="flex justify-between font-bold text-gray-900 text-base">
                                    <span>Total</span>
                                    <span>₹{total}</span>
                                </div>
                            </div>

                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                                Proceed to Checkout
                                <ArrowRight size={16} />
                            </button>

                            <p className="text-[10px] text-gray-400 text-center mt-3">
                                COD &amp; Online Payment available
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
