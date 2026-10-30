import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import {
    Heart,
    ShoppingCart,
    Trash2,
    Pill,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Check,
    Sparkles,
} from 'lucide-react'

export default function WishlistPage() {
    const { wishlist, removeFromWishlist, moveToCart, clearWishlist } = useWishlist()
    const { addToCart } = useCart()
    const [actionMsg, setActionMsg] = useState('')

    const showNotification = (msg) => {
        setActionMsg(msg)
        setTimeout(() => setActionMsg(''), 3000)
    }

    const handleMoveAllToCart = () => {
        if (wishlist.length === 0) return
        wishlist.forEach((item) => {
            addToCart(item, 1)
        })
        clearWishlist()
        showNotification(`All ${wishlist.length} saved medicines moved to your shopping cart!`)
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                <Heart size={20} className="fill-red-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                                <p className="text-gray-500 text-xs mt-0.5">
                                    Saved medicines & health products for quick ordering
                                </p>
                            </div>
                        </div>
                    </div>

                    {wishlist.length > 0 && (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                onClick={handleMoveAllToCart}
                                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                                <ShoppingCart size={14} />
                                <span>Move All to Cart ({wishlist.length})</span>
                            </button>
                            <button
                                onClick={clearWishlist}
                                className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>Clear</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Notification toast */}
                {actionMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{actionMsg}</span>
                    </div>
                )}

                {/* Empty State */}
                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto">
                            <Heart size={32} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">Your Wishlist is Empty</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                Save clinical medicines and everyday health essentials you need regularly. Tap the heart icon on any medicine to keep it here.
                            </p>
                        </div>
                        <Link
                            to="/medicines"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-2xs"
                        >
                            <span>Explore Medicines Store</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlist.map((med) => {
                            const mrp = med.mrp || 0
                            const price = med.price || 0
                            const discount = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0
                            const requiresRx = med.requires_rx || med.requiresPrescription

                            return (
                                <div
                                    key={med.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-blue-200 transition-all p-4 space-y-3"
                                >
                                    {/* Top details */}
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Pill size={20} />
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                {discount > 0 && (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                                        {discount}% OFF
                                                    </span>
                                                )}
                                                {requiresRx && (
                                                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                                                        Rx
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        removeFromWishlist(med.id)
                                                        showNotification(`Removed "${med.name}" from your wishlist.`)
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove from wishlist"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                                {med.category || 'General Health'}
                                            </p>
                                            <Link
                                                to={`/medicines/${med.id}`}
                                                className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors line-clamp-1 block mt-0.5"
                                            >
                                                {med.name}
                                            </Link>
                                            {med.salt && (
                                                <p className="text-[11px] text-gray-400 italic line-clamp-1">
                                                    {med.salt}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                {med.brand || 'Generic formulation'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Price and CTA */}
                                    <div className="pt-2 border-t border-gray-100 space-y-2.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-base font-extrabold text-gray-900">
                                                ₹{price}
                                            </span>
                                            {mrp > price && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    ₹{mrp}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    moveToCart(med)
                                                    showNotification(`Moved "${med.name}" to your cart!`)
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                                            >
                                                <ShoppingCart size={13} />
                                                <span>Move to Cart</span>
                                            </button>
                                            <Link
                                                to={`/medicines/${med.id}`}
                                                className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                                            >
                                                Details
                                            </Link>
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

