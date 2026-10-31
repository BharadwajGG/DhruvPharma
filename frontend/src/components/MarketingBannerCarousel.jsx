import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDelivery } from '../context/DeliveryContext'
import {
    ChevronLeft,
    ChevronRight,
    Tag,
    ShieldCheck,
    Truck,
    PhoneCall,
    Sparkles,
} from 'lucide-react'

export default function MarketingBannerCarousel() {
    const { selectedLocation } = useDelivery()
    const [liveCoupon, setLiveCoupon] = useState({ code: 'DHRUV10', discount: '10%' })
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const containerRef = useRef(null)

    // Fetch active coupons from backend
    useEffect(() => {
        const fetchCoupon = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/coupons')
                if (res.ok) {
                    const coupons = await res.json()
                    const active = coupons.find((c) => c.is_active)
                    if (active) {
                        setLiveCoupon({
                            code: active.code,
                            discount: active.discount_type === 'percentage'
                                ? `${active.discount_value}%`
                                : `₹${active.discount_value}`,
                        })
                    }
                }
            } catch (e) {
                // Graceful fallback
            }
        }
        fetchCoupon()
    }, [])

    // 4 Marketing Advertisement Cards tailored to Dhruv Pharma
    const banners = [
        // ── Card 1: Lowest Price Guaranteed (Matching Reference Image) ──
        {
            id: 'lowest-price',
            badge: 'Up to 25% off',
            badgeBg: 'bg-emerald-700 text-white',
            brandTag: 'DHRUV PHARMA ASSURED',
            headline: 'LOWEST PRICE GUARANTEED',
            subheadline: `Save on all chronic & daily medicines. Extra ${liveCoupon.discount} OFF with code ${liveCoupon.code}`,
            bgClass: 'bg-gradient-to-br from-emerald-50 via-green-100/70 to-emerald-200/50 border-emerald-200/70',
            textColor: 'text-emerald-950',
            subColor: 'text-emerald-800/80',
            btnText: 'Order now',
            link: '/medicines',
            packImage: '/images/medicines/dolo-650.svg',
            packSecondary: '/images/medicines/shelcal-500.svg',
            packName: 'Dolo 650 & Shelcal',
            packTag: '100% Price Match',
            icon: Tag,
        },

        // ── Card 2: 100% Genuine Products (Matching Reference Image) ──
        {
            id: 'genuine-products',
            badge: '100% Genuine',
            badgeBg: 'bg-amber-600 text-white',
            brandTag: 'FDA LICENSE 20B/21B',
            headline: 'TRUSTABLE HEALTHCARE PRODUCTS',
            subheadline: 'Direct batch sourcing from Cipla, Abbott, Alkem & Sun Pharma. Genuine manufacturer pack shots.',
            bgClass: 'bg-gradient-to-br from-orange-50 via-amber-100/60 to-orange-100 border-amber-200/70',
            textColor: 'text-amber-950',
            subColor: 'text-amber-900/80',
            btnText: 'Order now',
            link: '/medicines',
            packImage: '/images/medicines/augmentin-625.svg',
            packSecondary: '/images/medicines/pan-40.svg',
            packName: 'Augmentin & Pan-40',
            packTag: 'Batch Verified',
            icon: ShieldCheck,
        },

        // ── Card 3: Real-Time Hub Delivery (Pulls user location live) ──
        {
            id: 'hub-delivery',
            badge: 'Fast Hub Delivery',
            badgeBg: 'bg-blue-600 text-white',
            brandTag: `SERVING ${selectedLocation.name.toUpperCase()} (${selectedLocation.pincode})`,
            headline: `DELIVERY IN ${selectedLocation.deliveryTime || '3–4 DAYS'}`,
            subheadline: `Doorstep delivery across Nandurbar, Shahada, Taloda, Shirpur, Akkalkuwa, Nijampur & Sakri. FREE above ₹300!`,
            bgClass: 'bg-gradient-to-br from-blue-50 via-sky-100/70 to-indigo-100 border-blue-200/70',
            textColor: 'text-blue-950',
            subColor: 'text-blue-900/80',
            btnText: 'Check products',
            link: '/medicines',
            packImage: '/images/medicines/limcee-500.svg',
            packSecondary: '/images/medicines/telma-40.svg',
            packName: 'Limcee & Telma',
            packTag: `Hub: ${selectedLocation.name}`,
            icon: Truck,
        },

        // ── Card 4: Order via Phone / WhatsApp ──
        {
            id: 'order-via-call',
            badge: 'Call Helpline',
            badgeBg: 'bg-purple-700 text-white',
            brandTag: 'AVAILABLE 24/7',
            headline: 'ORDER VIA PHARMACIST CALL',
            subheadline: 'Don’t want to type? Speak directly with our pharmacist or WhatsApp your prescription slip to 95035 00725.',
            bgClass: 'bg-gradient-to-br from-purple-50 via-fuchsia-100/60 to-purple-100 border-purple-200/70',
            textColor: 'text-purple-950',
            subColor: 'text-purple-900/80',
            btnText: 'Call now',
            link: 'tel:+919503500725',
            packImage: '/images/medicines/becosules.svg',
            packSecondary: '/images/medicines/dolo-650.svg',
            packName: 'Phone Helpline',
            packTag: 'Instant Quotation',
            icon: PhoneCall,
            isPhoneCall: true,
        },
    ]

    // Track screen width for 2-card desktop vs 1-card mobile
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    )

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Desktop displays 2 cards side by side; mobile displays 1 card
    const maxIndex = isMobile ? banners.length - 1 : Math.max(0, banners.length - 2)

    // Auto-scroll every 5.5 to 6 seconds with pause on hover
    useEffect(() => {
        if (isHovered) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
        }, 5500)

        return () => clearInterval(timer)
    }, [isHovered, maxIndex])

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }

    return (
        <div
            className="max-w-7xl mx-auto px-4 relative select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Carousel Outer Wrapper */}
            <div className="relative">

                {/* Left Floating Circular Navigation Arrow (‹) */}
                <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous advertisement"
                    className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer border-2 border-white"
                >
                    <ChevronLeft size={22} className="stroke-[2.5]" />
                </button>

                {/* Right Floating Circular Navigation Arrow (›) */}
                <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next advertisement"
                    className="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer border-2 border-white"
                >
                    <ChevronRight size={22} className="stroke-[2.5]" />
                </button>

                {/* Horizontal Scroll Track (Shows 2 Cards Side-by-Side on Desktop) */}
                <div
                    ref={containerRef}
                    className="overflow-hidden rounded-3xl"
                >
                    <div
                        className="flex transition-transform duration-700 ease-in-out gap-4 sm:gap-5"
                        style={{
                            transform: isMobile
                                ? `translateX(calc(-${currentIndex} * (100% + 1rem)))`
                                : `translateX(calc(-${currentIndex} * (50% + 0.625rem)))`,
                        }}
                    >
                        {banners.map((item) => (
                            <div
                                key={item.id}
                                className="w-full md:w-[calc(50%-0.625rem)] shrink-0"
                            >
                                <div
                                    className={`relative overflow-hidden rounded-3xl border ${item.bgClass} shadow-md p-5 sm:p-6 h-[210px] sm:h-[230px] flex flex-col justify-between group`}
                                >
                                    {/* Top Row: Badge + Store Brand Tag */}
                                    <div className="flex items-center justify-between z-10">
                                        <span
                                            className={`${item.badgeBg} text-[11px] sm:text-xs font-black px-3 py-1 rounded-xl shadow-xs uppercase tracking-wider`}
                                        >
                                            {item.badge}
                                        </span>
                                        <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-gray-500 uppercase font-mono">
                                            {item.brandTag}
                                        </span>
                                    </div>

                                    {/* Middle Content + Product Pack Showcase */}
                                    <div className="relative z-10 flex items-center justify-between gap-3 mt-1">
                                        {/* Left Side: Headlines */}
                                        <div className="max-w-[62%] sm:max-w-[65%] space-y-1">
                                            <h3
                                                className={`text-base sm:text-lg md:text-xl font-black ${item.textColor} tracking-tight leading-tight uppercase`}
                                            >
                                                {item.headline}
                                            </h3>
                                            <p
                                                className={`text-[11px] sm:text-xs ${item.subColor} leading-snug line-clamp-2 font-medium`}
                                            >
                                                {item.subheadline}
                                            </p>
                                        </div>

                                        {/* Right Side: Authentic Medicine Pack Shots Display */}
                                        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                                            <div className="w-16 h-18 sm:w-20 sm:h-22 bg-white/95 rounded-2xl p-1.5 shadow-md border border-white flex flex-col items-center justify-between transform group-hover:scale-105 transition-transform">
                                                <img
                                                    src={item.packImage}
                                                    alt={item.packName}
                                                    className="w-11 h-11 sm:w-13 sm:h-13 object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none'
                                                    }}
                                                />
                                                <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 truncate max-w-full font-mono">
                                                    {item.packName.split(' ')[0]}
                                                </span>
                                            </div>

                                            {item.packSecondary && (
                                                <div className="hidden sm:flex w-14 h-16 bg-white/80 rounded-2xl p-1 shadow-sm border border-white/80 flex-col items-center justify-between">
                                                    <img
                                                        src={item.packSecondary}
                                                        alt="Pharma"
                                                        className="w-9 h-9 object-contain"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none'
                                                        }}
                                                    />
                                                    <span className="text-[8px] font-bold text-gray-400 truncate">
                                                        Genuine
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Row: Dark Action Button (Matches Reference Screenshots) */}
                                    <div className="relative z-10 flex items-center justify-between pt-1">
                                        {item.isPhoneCall ? (
                                            <a
                                                href={item.link}
                                                className="bg-gray-900 hover:bg-black active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <PhoneCall size={14} />
                                                <span>{item.btnText}</span>
                                            </a>
                                        ) : (
                                            <Link
                                                to={item.link}
                                                className="bg-gray-900 hover:bg-black active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <span>{item.btnText}</span>
                                            </Link>
                                        )}

                                        <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/80">
                                            {item.packTag}
                                        </span>
                                    </div>

                                    {/* Ambient Background Wave Accent */}
                                    <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Pagination Dots Indicator (Matching Reference Image) */}
                <div className="flex items-center justify-center gap-1.5 pt-3">
                    {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`transition-all duration-300 rounded-full cursor-pointer ${
                                currentIndex === idx
                                    ? 'w-7 h-2 bg-blue-600 shadow-xs'
                                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>

            </div>
        </div>
    )
}
