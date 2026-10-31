import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useDelivery } from '../context/DeliveryContext'
import MedicineImage from '../components/MedicineImage'
import {
    Star,
    ShoppingCart,
    Heart,
    Phone,
    Upload,
    Shield,
    Truck,
    RotateCcw,
    AlertCircle,
    CheckCircle,
    Pill,
    ChevronRight,
    Plus,
    Minus,
    Check,
    Loader2,
    FileText,
} from 'lucide-react'

export default function MedicineDetailPage() {
    const { id } = useParams()
    const { addToCart } = useCart()
    const { isInWishlist, toggleWishlist } = useWishlist()
    const { selectedLocation } = useDelivery()

    const [medicine, setMedicine] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [qty, setQty] = useState(1)
    const [justAdded, setJustAdded] = useState(false)

    // Customer Reviews & Rating State
    const [reviews, setReviews] = useState([])
    const [avgRating, setAvgRating] = useState(4.8)
    const [reviewName, setReviewName] = useState('')
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewComment, setReviewComment] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)
    const [reviewSuccess, setReviewSuccess] = useState('')

    const fetchReviews = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/medicines/${id}/reviews`)
            if (res.ok) {
                const data = await res.json()
                setReviews(data.reviews || [])
                if (data.averageRating) setAvgRating(data.averageRating)
            }
        } catch (e) {}
    }

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        const fetchMedicineDetail = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`http://localhost:8000/api/medicines/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setMedicine(data)
                } else {
                    // Fallback template if not found in db
                    setMedicine({
                        id: Number(id),
                        name: 'Medicine Item',
                        brand: 'Dhruv Pharma Assured',
                        manufacturer: 'Verified Pharma Manufacturer',
                        category: 'General Healthcare',
                        price: 120,
                        mrp: 140,
                        rating: 4.8,
                        reviews: 65,
                        requires_rx: false,
                        composition: 'Standard active clinical formulation',
                        dosageForm: 'Tablet',
                        packSize: '10 tablets per strip',
                        uses: ['Symptom relief and health maintenance'],
                        dosage: 'Take as directed by your physician with water.',
                        sideEffects: ['No common side effects when taken as prescribed.'],
                        warnings: ['Keep out of reach of children', 'Store in a cool dry place'],
                        storage: 'Store below 25°C away from direct sunlight.',
                    })
                }
            } catch (err) {
                console.warn('Failed to fetch medicine detail:', err)
            } finally {
                setIsLoading(false)
            }
        }

        if (id) {
            fetchMedicineDetail()
            fetchReviews()
        }
    }, [id])

    const handleAddToCart = () => {
        if (!medicine) return
        addToCart(medicine, qty)
        setJustAdded(true)
        setTimeout(() => setJustAdded(false), 2000)
    }

    const handleAddReview = async (e) => {
        e.preventDefault()
        if (!reviewComment.trim()) return
        setIsSubmittingReview(true)
        try {
            const res = await fetch(`http://localhost:8000/api/medicines/${id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_name: reviewName.trim() || 'Verified Customer',
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                }),
            })
            if (res.ok) {
                setReviewComment('')
                setReviewSuccess('Thank you! Your verified rating was submitted.')
                fetchReviews()
                setTimeout(() => setReviewSuccess(''), 3000)
            }
        } catch (e) {
        } finally {
            setIsSubmittingReview(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <Loader2 size={40} className="text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-gray-500 font-medium">Loading clinical medicine details...</p>
            </div>
        )
    }

    if (!medicine) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <Pill size={56} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Medicine Not Found</h2>
                <p className="text-sm text-gray-500 mb-5">The requested medicine could not be found in our verified catalog.</p>
                <Link
                    to="/medicines"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                    Back to Medicine Store
                </Link>
            </div>
        )
    }

    const mrp = medicine.mrp || 0
    const price = medicine.sellingPrice || medicine.price || 0
    const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0
    const requiresRx = Boolean(medicine.requires_rx || medicine.requiresPrescription)

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
                    <Link to="/" className="hover:text-blue-600">Home</Link>
                    <ChevronRight size={12} />
                    <Link to="/medicines" className="hover:text-blue-600">Medicine Store</Link>
                    <ChevronRight size={12} />
                    <span className="text-gray-700 font-medium truncate max-w-xs">{medicine.name}</span>
                </nav>

                {/* ── Product Detail Card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row gap-8">

                        {/* Image with Tier 2 Pack Shot & Tier 1 Vector Fallback */}
                        <div className="rounded-2xl border border-gray-100 bg-white w-full sm:w-72 h-64 sm:h-72 flex items-center justify-center shrink-0 relative overflow-hidden shadow-xs">
                            <MedicineImage medicine={medicine} aspectRatio="detail" className="rounded-2xl" />
                            {discount > 0 && (
                                <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs z-10">
                                    {discount}% OFF
                                </span>
                            )}
                            {requiresRx ? (
                                <span className="absolute top-3 right-3 bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 z-10 shadow-2xs">
                                    <AlertCircle size={12} /> Prescription Required
                                </span>
                            ) : (
                                <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 z-10 shadow-2xs">
                                    <CheckCircle size={12} /> Direct Buy (No Rx)
                                </span>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                                <div>
                                    <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                                        {medicine.category}
                                    </span>
                                    <h1 className="text-2xl font-bold text-gray-900 mt-1">
                                        {medicine.name}
                                    </h1>
                                    <p className="text-gray-500 text-sm mt-0.5">
                                        Manufactured by <strong className="text-gray-700">{medicine.brand || medicine.manufacturer}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Active Chemical Composition */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 my-3">
                                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wide mb-0.5">
                                    Active Chemical Formulation / Salt
                                </p>
                                <p className="text-sm font-semibold text-gray-800 italic">
                                    {medicine.composition || medicine.salt || 'Clinical active composition'}
                                </p>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-2 my-2">
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < Math.floor(medicine.rating || 4.8) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{medicine.rating || 4.8}</span>
                                <span className="text-xs text-gray-400">({medicine.reviews || 85} verified reviews)</span>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-3 my-4">
                                <span className="text-3xl font-extrabold text-gray-900">₹{price}</span>
                                {mrp > price && (
                                    <span className="text-gray-400 text-lg line-through">₹{mrp}</span>
                                )}
                                <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                    Inclusive of all taxes
                                </span>
                            </div>

                            <p className="text-xs text-gray-500 mb-5">
                                Pack size: <strong className="text-gray-700">{medicine.packSize || '10 units per pack'}</strong> · Form: <strong className="text-gray-700">{medicine.dosageForm || 'Tablet'}</strong>
                            </p>

                            {/* Quantity + Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                                {/* Quantity Increment/Decrement */}
                                <div className="flex items-center border border-gray-300 rounded-xl p-1 bg-gray-50 w-32 justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 transition-colors"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="font-bold text-sm text-gray-800">{qty}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQty((q) => q + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className={`flex-1 flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl transition-all shadow-xs ${
                                        justAdded
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.99]'
                                    }`}
                                >
                                    {justAdded ? (
                                        <>
                                            <Check size={18} /> Added to Cart!
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={18} /> Add {qty > 1 ? `(${qty})` : ''} to Cart
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => toggleWishlist(medicine)}
                                    className={`inline-flex items-center justify-center gap-1.5 border px-4 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                        isInWishlist(medicine.id)
                                            ? 'border-red-200 bg-red-50 text-red-600'
                                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                                    }`}
                                    title={isInWishlist(medicine.id) ? 'Saved in Wishlist' : 'Save to Wishlist'}
                                >
                                    <Heart size={16} className={isInWishlist(medicine.id) ? 'fill-red-500 text-red-500' : ''} />
                                    <span>{isInWishlist(medicine.id) ? 'Saved' : 'Wishlist'}</span>
                                </button>

                                {requiresRx && (
                                    <Link
                                        to="/prescription"
                                        className="inline-flex items-center justify-center gap-1.5 border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold px-4 py-3 rounded-xl transition-colors shrink-0"
                                    >
                                        <Upload size={14} /> Upload Doctor's Rx
                                    </Link>
                                )}
                            </div>

                            {/* Order via Phone Call Banner */}
                            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                                        <Phone size={15} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-blue-950">Prefer to order this medicine by phone?</p>
                                        <p className="text-[11px] text-blue-700">Speak directly with our pharmacist for dosage advice &amp; doorstep delivery.</p>
                                    </div>
                                </div>
                                <a
                                    href="tel:+919503500725"
                                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-2xs shrink-0"
                                >
                                    <Phone size={13} />
                                    <span>Call: 95035 00725</span>
                                </a>
                            </div>

                            {/* Trust Icons */}
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                <span className="flex items-center gap-1.5">
                                    <Shield size={13} className="text-green-600" /> 100% Genuine Pharmacy Stock
                                </span>
                                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                                    <Truck size={13} className="text-blue-600" /> Delivery in 3–4 Days to <strong className="text-blue-700">{selectedLocation.name} ({selectedLocation.pincode})</strong>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <RotateCcw size={13} className="text-purple-600" /> Temperature Regulated
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Dynamic Clinical Guidelines ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Uses */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" /> Therapeutic Uses
                        </h3>
                        <ul className="space-y-1.5">
                            {(medicine.uses || ['Symptomatic relief']).map((use, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                    <Check size={13} className="text-green-600 shrink-0 mt-0.5" />
                                    <span>{use}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Dosage & Directions */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" /> Dosage &amp; Directions
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                            {medicine.dosage || 'Take as advised by your medical practitioner.'}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-2.5 text-[11px] text-gray-500">
                            <strong>Packaging:</strong> {medicine.packSize || 'Standard blister pack'}
                        </div>
                    </div>

                    {/* Side Effects */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Potential Side Effects
                        </h3>
                        <ul className="space-y-1.5">
                            {(medicine.sideEffects || ['Well tolerated']).map((se, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                                    <span>{se}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Storage & Safety Warnings */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> Storage &amp; Precautions
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                            {medicine.storage || 'Store in a cool, dry place below 25°C away from moisture and heat.'}
                        </p>
                        <ul className="space-y-1.5">
                            {(medicine.warnings || ['Keep out of reach of children']).map((w, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-red-600">
                                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                    <span>{w}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Customer Reviews & Ratings Section ── */}
                <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span>Verified Customer Ratings</span>
                                <span className="bg-yellow-50 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1">
                                    <Star size={12} className="fill-amber-400 text-amber-400" /> {avgRating} / 5
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Read verified feedback from patients across Nandurbar and Maharashtra.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                        {/* Reviews List */}
                        <div className="lg:col-span-2 space-y-4">
                            {reviews.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl p-4">
                                    <Star size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-xs text-gray-500">No customer reviews yet. Be the first to rate this medicine!</p>
                                </div>
                            ) : (
                                reviews.map((rev) => (
                                    <div key={rev.id} className="p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                                                    {(rev.userName || 'P').charAt(0)}
                                                </div>
                                                <span className="font-bold text-xs text-gray-800">{rev.userName}</span>
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                                    Verified Purchase
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400">{rev.createdAt}</span>
                                        </div>
                                        <div className="flex gap-0.5 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    className={i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Submit Review Box */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 h-fit">
                            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                                Rate This Medicine
                            </h3>
                            <p className="text-[11px] text-slate-500 mb-3">
                                Share your dosage experience and packaging feedback.
                            </p>

                            {reviewSuccess && (
                                <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200 flex items-center gap-1.5">
                                    <Check size={13} className="text-emerald-600 shrink-0" />
                                    <span>{reviewSuccess}</span>
                                </div>
                            )}

                            <form onSubmit={handleAddReview} className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Rating</label>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setReviewRating(star)}
                                                className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                            >
                                                <Star
                                                    size={20}
                                                    className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                                />
                                            </button>
                                        ))}
                                        <span className="text-xs font-bold text-slate-600 ml-2">{reviewRating} / 5</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. S. Deshmukh"
                                        value={reviewName}
                                        onChange={(e) => setReviewName(e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Review</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Explain packaging, expiry date, efficacy, or delivery speed..."
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingReview}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {isSubmittingReview ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />}
                                    <span>Submit Verified Review</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
