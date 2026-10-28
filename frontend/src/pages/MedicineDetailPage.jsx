import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { Star, ShoppingCart, Upload, Shield, Truck, RotateCcw, AlertCircle, Pill, ChevronRight } from 'lucide-react'

/* ── Mock medicine detail data ── */
const MEDICINES_DB = {
    1: {
        id: 1,
        name: 'Metformin 500mg',
        brand: 'Glucophage',
        manufacturer: 'USV Private Limited',
        price: 45,
        mrp: 60,
        category: 'Diabetes Care',
        rating: 4.8,
        reviews: 120,
        requires_rx: true,
        inStock: true,
        composition: 'Metformin Hydrochloride 500mg',
        uses: ['Type 2 Diabetes management', 'Blood sugar control', 'PCOS management'],
        sideEffects: ['Nausea', 'Stomach upset', 'Diarrhea (initial days)', 'Loss of appetite'],
        dosage: '1 tablet twice daily with meals, or as directed by your doctor.',
        storage: 'Store below 25°C. Keep away from moisture and direct sunlight.',
        warnings: [
            'Do not take without prescription',
            'Inform doctor if you have kidney problems',
            'Avoid alcohol while on this medication',
        ],
        packSize: '10 tablets per strip',
    },
}

export default function MedicineDetailPage() {
    const { id } = useParams()
    const medicine = MEDICINES_DB[id] || MEDICINES_DB[1]
    const discount = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100)

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
                    <Link to="/" className="hover:text-blue-600">Home</Link>
                    <ChevronRight size={12} />
                    <Link to="/medicines" className="hover:text-blue-600">Medicine Store</Link>
                    <ChevronRight size={12} />
                    <span className="text-gray-700 font-medium">{medicine.name}</span>
                </nav>

                {/* ── Product Detail Card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row gap-8">

                        {/* Image */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl w-full sm:w-64 h-56 flex items-center justify-center shrink-0">
                            <Pill size={72} className="text-blue-200" />
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                                <div>
                                    <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                                        {medicine.category}
                                    </span>
                                    <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
                                        {medicine.name}
                                    </h1>
                                    <p className="text-gray-500 text-sm">
                                        by {medicine.brand} · {medicine.manufacturer}
                                    </p>
                                </div>
                                {medicine.requires_rx && (
                                    <span className="flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-200">
                                        <AlertCircle size={12} /> Prescription Required
                                    </span>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-2 my-3">
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < Math.floor(medicine.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{medicine.rating}</span>
                                <span className="text-xs text-gray-400">({medicine.reviews} reviews)</span>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-3xl font-bold text-gray-900">₹{medicine.price}</span>
                                <span className="text-gray-400 text-lg line-through">₹{medicine.mrp}</span>
                                <span className="bg-green-100 text-green-700 text-sm font-bold px-2 py-0.5 rounded-full">
                                    {discount}% OFF
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-5">Pack size: {medicine.packSize}</p>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                {medicine.requires_rx ? (
                                    <Link
                                        to="/prescription"
                                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                                    >
                                        <Upload size={16} />
                                        Upload Prescription to Order
                                    </Link>
                                ) : (
                                    <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                                        <ShoppingCart size={16} />
                                        Add to Cart
                                    </button>
                                )}
                            </div>

                            {/* Trust Icons */}
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <Shield size={13} className="text-green-500" /> Licensed Medicine
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Truck size={13} className="text-blue-500" /> Local Delivery
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <RotateCcw size={13} className="text-purple-500" /> Easy Returns
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Info Sections ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                        { title: 'Composition',    content: medicine.composition, type: 'text' },
                        { title: 'Dosage',         content: medicine.dosage,      type: 'text' },
                        { title: 'Uses',           content: medicine.uses,        type: 'list' },
                        { title: 'Side Effects',   content: medicine.sideEffects, type: 'list' },
                        { title: 'Storage',        content: medicine.storage,     type: 'text' },
                        { title: '⚠️ Warnings',   content: medicine.warnings,    type: 'list' },
                    ].map((section) => (
                        <div key={section.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-800 text-sm mb-3">{section.title}</h3>
                            {section.type === 'text' ? (
                                <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {section.content.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
