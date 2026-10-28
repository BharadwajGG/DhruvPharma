import { Link } from 'react-router-dom'
import {
    Upload,
    ShoppingBag,
    Truck,
    Shield,
    Clock,
    Star,
    ChevronRight,
    Pill,
    Heart,
    Activity,
    Zap,
    Eye,
    Baby,
    Leaf,
    Thermometer,
} from 'lucide-react'

/* ── Data ── */
const CATEGORIES = [
    { icon: Activity,    label: 'Diabetes Care',          color: 'bg-blue-50 text-blue-600',   border: 'border-blue-100' },
    { icon: Heart,       label: 'Heart & BP',             color: 'bg-red-50 text-red-600',     border: 'border-red-100' },
    { icon: Zap,         label: 'Vitamins & Supplements', color: 'bg-yellow-50 text-yellow-600', border: 'border-yellow-100' },
    { icon: Thermometer, label: 'Pain Relief',            color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
    { icon: Leaf,        label: 'Skin Care',              color: 'bg-green-50 text-green-600', border: 'border-green-100' },
    { icon: Eye,         label: 'Eye & Ear Care',         color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
    { icon: Baby,        label: 'Baby Care',              color: 'bg-pink-50 text-pink-600',   border: 'border-pink-100' },
    { icon: Pill,        label: 'General Medicines',      color: 'bg-teal-50 text-teal-600',   border: 'border-teal-100' },
]

const FEATURED_MEDICINES = [
    { id: 1, name: 'Metformin 500mg',     brand: 'Glucophage',   price: 45,   mrp: 60,   category: 'Diabetes', rating: 4.8, reviews: 120, requires_rx: true  },
    { id: 2, name: 'Amlodipine 5mg',      brand: 'Norvasc',      price: 55,   mrp: 75,   category: 'Heart & BP', rating: 4.7, reviews: 98, requires_rx: true  },
    { id: 3, name: 'Vitamin D3 60K IU',   brand: 'Calcirol',     price: 90,   mrp: 120,  category: 'Vitamins', rating: 4.9, reviews: 210, requires_rx: false },
    { id: 4, name: 'Paracetamol 500mg',   brand: 'Crocin',       price: 18,   mrp: 25,   category: 'Pain Relief', rating: 4.9, reviews: 450, requires_rx: false },
    { id: 5, name: 'Pantoprazole 40mg',   brand: 'Pan-D',        price: 60,   mrp: 85,   category: 'Digestive', rating: 4.6, reviews: 75, requires_rx: true  },
    { id: 6, name: 'Cetirizine 10mg',     brand: 'Okacet',       price: 22,   mrp: 30,   category: 'Allergy',  rating: 4.7, reviews: 185, requires_rx: false },
]

const TESTIMONIALS = [
    {
        name: 'Rajesh Patil',
        location: 'Pune',
        text: 'Excellent service! My monthly diabetes medicines are always delivered on time. The prescription verification process is very smooth.',
        rating: 5,
    },
    {
        name: 'Sunita Deshmukh',
        location: 'Nashik',
        text: 'I uploaded my prescription via the app and got a call from the pharmacist within 30 minutes. Very professional and reliable.',
        rating: 5,
    },
    {
        name: 'Anil Kulkarni',
        location: 'Ahmednagar',
        text: 'Great discounts on branded medicines. COD option is very convenient. Highly recommend Dhruv Pharma!',
        rating: 4,
    },
]

/* ── Sub-components ── */
function MedicineCard({ medicine }) {
    const discount = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100)

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            {/* Placeholder Image */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-xl h-36 flex items-center justify-center relative">
                <Pill size={48} className="text-blue-200 group-hover:text-blue-300 transition-colors" />
                {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {discount}% OFF
                    </span>
                )}
                {medicine.requires_rx && (
                    <span className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-200">
                        Rx Required
                    </span>
                )}
            </div>

            <div className="p-4">
                <p className="text-[11px] text-blue-600 font-medium uppercase tracking-wide mb-1">
                    {medicine.category}
                </p>
                <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-0.5">
                    {medicine.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{medicine.brand}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={11}
                                className={i < Math.floor(medicine.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-gray-500">({medicine.reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-gray-900">₹{medicine.price}</span>
                    <span className="text-xs text-gray-400 line-through">₹{medicine.mrp}</span>
                </div>

                <Link
                    to={`/medicines/${medicine.id}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                    View Details
                </Link>
            </div>
        </div>
    )
}

function TestimonialCard({ t }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex mb-3">
                {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {t.name[0]}
                </div>
                <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                </div>
            </div>
        </div>
    )
}

/* ── Main Page ── */
export default function HomePage() {
    return (
        <div>

            {/* ════════════════════════════════════════
                HERO SECTION
            ════════════════════════════════════════ */}
            <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
                <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">

                    {/* Hero Text */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6">
                            <Shield size={14} />
                            Licensed & Trusted Pharmacy — Maharashtra
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                            Your Health,<br />
                            <span className="text-yellow-300">Our Priority</span>
                        </h1>

                        <p className="text-blue-100 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                            Order medicines online with home delivery across Pune, Nashik,
                            Ahmednagar &amp; Aurangabad. Upload your prescription and let us
                            take care of the rest.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <Link
                                to="/prescription"
                                className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-800/20"
                            >
                                <Upload size={18} />
                                Upload Prescription
                            </Link>
                            <Link
                                to="/medicines"
                                className="flex items-center gap-2 bg-blue-500/30 hover:bg-blue-500/50 border border-white/30 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
                            >
                                <ShoppingBag size={18} />
                                Shop Medicines
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
                            {[
                                { value: '500+', label: 'Medicines' },
                                { value: '1,200+', label: 'Happy Patients' },
                                { value: '4 Districts', label: 'We Serve' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <p className="text-2xl font-bold text-yellow-300">{stat.value}</p>
                                    <p className="text-xs text-blue-200">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="flex-1 flex justify-center lg:justify-end">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 w-full max-w-sm">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/20">
                                <div className="bg-green-400 w-10 h-10 rounded-full flex items-center justify-center">
                                    <Pill size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">Quick Prescription Order</p>
                                    <p className="text-blue-200 text-xs">Upload &amp; get delivery in 2–4 hrs</p>
                                </div>
                            </div>
                            {[
                                { step: '1', text: 'Upload your prescription photo/PDF' },
                                { step: '2', text: 'Owner reviews within 30 minutes' },
                                { step: '3', text: 'Medicines dispatched for delivery' },
                                { step: '4', text: 'Delivered to your doorstep' },
                            ].map((item) => (
                                <div key={item.step} className="flex items-center gap-3 mb-3">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {item.step}
                                    </div>
                                    <p className="text-blue-100 text-sm">{item.text}</p>
                                </div>
                            ))}
                            <Link
                                to="/prescription"
                                className="mt-4 block w-full text-center bg-white text-blue-700 font-semibold py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                            >
                                Upload Now →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
                WHY CHOOSE US
            ════════════════════════════════════════ */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Shield,  title: 'Licensed Pharmacy',    desc: 'Govt. approved drug license',          color: 'text-blue-600',   bg: 'bg-blue-50' },
                            { icon: Clock,   title: 'Fast Delivery',        desc: '2–4 hours local delivery',             color: 'text-green-600',  bg: 'bg-green-50' },
                            { icon: Truck,   title: 'COD Available',        desc: 'Cash on delivery accepted',            color: 'text-purple-600', bg: 'bg-purple-50' },
                            { icon: Heart,   title: 'Expert Care',          desc: 'Rx reviewed by licensed pharmacist',   color: 'text-red-500',    bg: 'bg-red-50' },
                        ].map((item) => (
                            <div key={item.title} className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                                <div className={`${item.bg} p-3 rounded-xl mb-3`}>
                                    <item.icon size={22} className={item.color} />
                                </div>
                                <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
                CATEGORIES
            ════════════════════════════════════════ */}
            <section className="py-14 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            Shop by Category
                        </h2>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            Browse our wide range of medicines organised by health conditions
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.label}
                                to={`/medicines?category=${encodeURIComponent(cat.label)}`}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${cat.border} ${cat.color} bg-white hover:shadow-md transition-all text-center group`}
                            >
                                <div className={`${cat.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                    <cat.icon size={22} />
                                </div>
                                <p className="text-[11px] font-semibold text-gray-700 leading-tight">
                                    {cat.label}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
                FEATURED MEDICINES
            ════════════════════════════════════════ */}
            <section className="py-14 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                Popular Medicines
                            </h2>
                            <p className="text-gray-500 text-sm">Most ordered by our patients</p>
                        </div>
                        <Link
                            to="/medicines"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {FEATURED_MEDICINES.map((med) => (
                            <MedicineCard key={med.id} medicine={med} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
                PRESCRIPTION BANNER
            ════════════════════════════════════════ */}
            <section className="py-14 bg-gradient-to-r from-green-600 to-teal-600 text-white">
                <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                            Have a Prescription?
                        </h2>
                        <p className="text-green-100 text-sm max-w-lg leading-relaxed">
                            Upload your doctor's prescription and our owner will personally
                            review it. We'll check medicine availability and arrange doorstep
                            delivery — all within hours.
                        </p>
                        <ul className="mt-4 space-y-1.5">
                            {['Camera photo, PDF or image — any format accepted',
                              'Reviewed personally by our licensed pharmacist',
                              'Only safe, available medicines are dispatched'].map((point) => (
                                <li key={point} className="flex items-center gap-2 text-green-100 text-sm">
                                    <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full shrink-0" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Link
                        to="/prescription"
                        className="shrink-0 flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-lg text-lg"
                    >
                        <Upload size={22} />
                        Upload Prescription
                    </Link>
                </div>
            </section>

            {/* ════════════════════════════════════════
                TESTIMONIALS
            ════════════════════════════════════════ */}
            <section className="py-14 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            What Our Patients Say
                        </h2>
                        <p className="text-gray-500 text-sm">Trusted by thousands across Maharashtra</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t) => (
                            <TestimonialCard key={t.name} t={t} />
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}
