import React, { useState, useEffect } from 'react'
import { ShieldCheck, Pill } from 'lucide-react'

/**
 * Detects dosage form from medicine name & category to render the appropriate Tier-1 vector graphic.
 */
function detectDosageForm(name = '', category = '') {
    const text = `${name} ${category}`.toUpperCase()

    if (/\b(SYP|SYRUP|SUSP|SUSPENSION|SOLN|SOLUTION|LIQUID|DROPS|DRY SYP|PEDIATRIC SYP)\b/.test(text)) {
        return 'syrup'
    }
    if (/\b(GEL|OINT|OINTMENT|CREAM|EMULGEL)\b/.test(text)) {
        return 'ointment'
    }
    if (/\b(CAP|CAPS|CAPSULE|DSR|SOFTGEL|SR CAP)\b/.test(text)) {
        return 'capsule'
    }
    if (/\b(INJ|INJECTION|VIAL|AMPOULE|WFI)\b/.test(text)) {
        return 'injection'
    }
    if (/\b(SPRAY|INHALER|POWDER|SACHET)\b/.test(text)) {
        return 'spray'
    }
    return 'tablet'
}

/**
 * Extracts clean short abbreviation for Tier-1 vector graphic label.
 */
function getMedicineAbbr(name = '') {
    if (!name) return 'MED'
    const clean = name.replace(/\[.*?\]|\(.*?\)/g, '').trim()
    const firstWord = clean.split(/[\s-]+/)[0]
    return firstWord.slice(0, 8).toUpperCase()
}

/**
 * Extracts pack size indicator (e.g. "10 Tabs", "100ml", "30g").
 */
function getPackSizeLabel(name = '', form = 'tablet') {
    const text = name.toUpperCase()
    const tabMatch = text.match(/(\d+)\s*(TAB|TABLET|TABS|CAP|CAPSULE)/)
    if (tabMatch) return `${tabMatch[1]} ${tabMatch[2].startsWith('CAP') ? 'Capsules' : 'Strip'}`

    const mlMatch = text.match(/(\d+)\s*ML/)
    if (mlMatch) return `${mlMatch[1]} ml`

    const gmMatch = text.match(/(\d+)\s*(GM|G)\b/)
    if (gmMatch) return `${gmMatch[1]} g`

    switch (form) {
        case 'syrup': return 'Syrup (Oral)'
        case 'ointment': return 'Topical (Tube)'
        case 'capsule': return 'Blister (Capsules)'
        case 'injection': return 'Sterile Vial'
        case 'spray': return 'Spray/Canister'
        default: return 'Tablets (Blister)'
    }
}

/**
 * Tier 1: Smart Dosage-Form Vector Graphics
 */
function Tier1VectorPack({ medicine, form }) {
    const abbr = getMedicineAbbr(medicine?.name)
    const packLabel = getPackSizeLabel(medicine?.name, form)
    const mfr = (medicine?.manufacturer || medicine?.brand || 'Dhruv Care').split(' ')[0].toUpperCase()

    if (form === 'syrup') {
        return (
            <div className="w-full h-full bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-100/60 flex items-center justify-center p-3 relative group overflow-hidden">
                {/* Amber Medicine Bottle Vector */}
                <div className="w-20 sm:w-24 h-28 sm:h-32 bg-amber-800 rounded-xl rounded-t-sm shadow-md border-2 border-amber-950 flex flex-col items-center justify-between p-2 relative group-hover:scale-105 transition-transform duration-300">
                    {/* White Childproof Measuring Cap */}
                    <div className="w-10 h-5 bg-white rounded-t-sm border border-slate-300 -mt-4 shadow-xs flex items-center justify-center">
                        <div className="w-6 h-1 bg-slate-200 rounded-full" />
                    </div>
                    {/* Label */}
                    <div className="w-full bg-amber-100/95 rounded-md p-1.5 shadow-xs border border-amber-300/80 text-center">
                        <div className="text-[7px] font-extrabold text-amber-900 tracking-wider uppercase truncate">{mfr}</div>
                        <div className="text-[10px] sm:text-[11px] font-black text-amber-950 leading-tight truncate">{abbr}</div>
                        <div className="text-[6.5px] font-bold text-amber-700 uppercase mt-0.5">ORAL SUSPENSION</div>
                    </div>
                    {/* Bottle Base Level */}
                    <div className="text-[7px] font-mono font-semibold text-amber-200/90 tracking-widest">{packLabel}</div>
                </div>

                {/* Dosage Pill Badge */}
                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-amber-800 shadow-2xs border border-amber-200/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{packLabel}</span>
                </div>
            </div>
        )
    }

    if (form === 'ointment') {
        return (
            <div className="w-full h-full bg-gradient-to-br from-teal-50/80 via-cyan-50/40 to-emerald-50/60 flex items-center justify-center p-3 relative group overflow-hidden">
                {/* Ointment Tube Vector */}
                <div className="w-14 sm:w-16 h-28 sm:h-32 bg-gradient-to-r from-slate-200 via-white to-slate-200 rounded-t-xl rounded-b-sm border border-slate-300 shadow-md flex flex-col items-center justify-between p-1.5 relative group-hover:scale-105 transition-transform duration-300">
                    {/* Ribbed Hex Screw Cap */}
                    <div className="w-8 h-4 bg-teal-600 rounded-sm -mt-3 shadow-xs border border-teal-700" />
                    {/* Brand Name on Tube Body */}
                    <div className="rotate-90 origin-center text-center my-auto py-2">
                        <div className="text-[7px] font-extrabold text-teal-800 tracking-wider uppercase truncate">{mfr}</div>
                        <div className="text-[10px] font-black text-slate-800 tracking-wide uppercase truncate">{abbr}</div>
                        <div className="text-[6.5px] font-bold text-teal-600 uppercase">GEL / OINTMENT</div>
                    </div>
                    {/* Crimped Bottom Seal */}
                    <div className="w-full h-2 bg-slate-400 rounded-xs shadow-inner" />
                </div>

                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-teal-800 shadow-2xs border border-teal-200/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span>{packLabel}</span>
                </div>
            </div>
        )
    }

    if (form === 'capsule') {
        return (
            <div className="w-full h-full bg-gradient-to-br from-purple-50/80 via-fuchsia-50/40 to-indigo-50/60 flex items-center justify-center p-3 relative group overflow-hidden">
                {/* Capsule Blister Strip */}
                <div className="w-36 sm:w-40 bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl p-2.5 shadow-md border border-slate-300/80 group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5 text-[8px] font-bold text-slate-600">
                        <span className="truncate">{mfr}</span>
                        <span className="font-mono text-purple-700 font-extrabold">{abbr}</span>
                    </div>
                    {/* 2x3 Dual-Tone Capsules */}
                    <div className="grid grid-cols-3 gap-1.5 justify-items-center py-0.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="w-5 h-8 rounded-full shadow-xs border border-slate-300 overflow-hidden flex flex-col">
                                <div className="h-1/2 bg-purple-600" />
                                <div className="h-1/2 bg-amber-400" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-purple-800 shadow-2xs border border-purple-200/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span>{packLabel}</span>
                </div>
            </div>
        )
    }

    if (form === 'injection') {
        return (
            <div className="w-full h-full bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-indigo-50/60 flex items-center justify-center p-3 relative group overflow-hidden">
                {/* Sterile Injection Glass Vial */}
                <div className="w-16 sm:w-18 h-28 sm:h-32 bg-white/90 rounded-b-xl rounded-t-sm border-2 border-sky-300/80 shadow-md flex flex-col items-center justify-between p-2 relative group-hover:scale-105 transition-transform duration-300">
                    {/* Flip-off Cap & Stopper */}
                    <div className="w-8 h-4 bg-red-500 rounded-xs -mt-4 shadow-xs border border-red-700" />
                    <div className="w-5 h-2 bg-slate-300 -mt-1" />
                    {/* Glass Body Label */}
                    <div className="w-full bg-sky-100/90 rounded p-1 text-center border border-sky-200">
                        <div className="text-[7px] font-extrabold text-sky-900 tracking-wider truncate">{mfr}</div>
                        <div className="text-[10px] font-black text-sky-950 truncate">{abbr}</div>
                        <div className="text-[6.5px] font-bold text-red-600 uppercase">STERILE INJ</div>
                    </div>
                    {/* Clear Solution Water Level */}
                    <div className="w-full h-4 bg-sky-200/50 rounded-b-lg border-t border-sky-300/40" />
                </div>

                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-sky-800 shadow-2xs border border-sky-200/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <span>{packLabel}</span>
                </div>
            </div>
        )
    }

    if (form === 'spray') {
        return (
            <div className="w-full h-full bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-cyan-50/60 flex items-center justify-center p-3 relative group overflow-hidden">
                {/* Spray Canister */}
                <div className="w-16 sm:w-18 h-28 sm:h-32 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl border border-slate-300 shadow-md flex flex-col items-center justify-between p-2 relative group-hover:scale-105 transition-transform duration-300">
                    <div className="w-6 h-4 bg-slate-700 rounded-t-sm -mt-3 shadow-xs" />
                    <div className="w-full bg-emerald-100/95 rounded p-1 text-center border border-emerald-300">
                        <div className="text-[7px] font-extrabold text-emerald-900 tracking-wider truncate">{mfr}</div>
                        <div className="text-[10px] font-black text-emerald-950 truncate">{abbr}</div>
                        <div className="text-[6.5px] font-bold text-emerald-700 uppercase">SPRAY / SACHET</div>
                    </div>
                    <div className="text-[7px] font-mono font-bold text-slate-500">{packLabel}</div>
                </div>

                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-emerald-800 shadow-2xs border border-emerald-200/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{packLabel}</span>
                </div>
            </div>
        )
    }

    // Default: Tablet Blister Strip
    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 via-sky-50/50 to-blue-100/40 flex items-center justify-center p-3 relative group overflow-hidden">
            {/* Blister Strip Foil Container */}
            <div className="w-36 sm:w-44 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 rounded-xl p-2.5 shadow-md border border-slate-300/80 group-hover:scale-105 transition-transform duration-300">
                {/* Header Foil */}
                <div className="flex items-center justify-between border-b border-slate-300/80 pb-1 mb-1.5 text-[8px] font-extrabold text-slate-600">
                    <span className="truncate">{mfr}</span>
                    <span className="font-mono text-blue-700 font-extrabold">{abbr}</span>
                </div>
                {/* 2x3 Round Tablets */}
                <div className="grid grid-cols-3 gap-1.5 justify-items-center py-0.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-300 to-blue-500 shadow-inner border border-sky-400 flex items-center justify-center text-[7px] font-black text-white"
                        >
                            •
                        </div>
                    ))}
                </div>
                {/* Foil Stamp */}
                <div className="mt-1.5 pt-1 border-t border-slate-300/70 flex items-center justify-between text-[7px] font-mono text-slate-500">
                    <span>ALU-ALU</span>
                    <span>EXP 2027</span>
                </div>
            </div>

            {/* Dosage Pill Badge */}
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 shadow-2xs border border-slate-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>{packLabel}</span>
            </div>
        </div>
    )
}

/**
 * Universal MedicineImage Component
 * - Displays Tier 2 Authentic Studio Pack Shot when image exists and loads successfully.
 * - Displays "100% Genuine Pack Shot" verification pill badge.
 * - Smooth hover zoom effect.
 * - Graceful onError fallback to Tier 1 smart dosage-form visual (Tablet, Syrup, Gel, Capsule, Injection, Spray).
 */
export default function MedicineImage({
    medicine,
    aspectRatio = 'card', // 'card', 'detail', 'thumb'
    showGenuineBadge = true,
    className = '',
}) {
    const rawImageUrl = medicine?.imageUrl || medicine?.image_url || ''
    const [imgFailed, setImgFailed] = useState(false)

    // Reset failed flag if URL changes
    useEffect(() => {
        setImgFailed(false)
    }, [rawImageUrl])

    const form = detectDosageForm(medicine?.name, medicine?.category)

    const isDetail = aspectRatio === 'detail'
    const isThumb = aspectRatio === 'thumb'

    // Determine container height / aspect styling
    let containerClass = 'h-36 sm:h-40 w-full'
    if (isDetail) {
        containerClass = 'w-full sm:w-72 sm:h-72 h-64'
    } else if (isThumb) {
        containerClass = 'w-16 h-16 shrink-0'
    }

    const hasValidImage = Boolean(rawImageUrl && rawImageUrl.trim() !== '' && !imgFailed)

    return (
        <div className={`relative overflow-hidden flex items-center justify-center bg-white ${containerClass} ${className}`}>
            {hasValidImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-3 bg-white group">
                    <img
                        src={rawImageUrl}
                        alt={medicine?.name || 'Medicine'}
                        onError={() => {
                            console.warn(`Medicine image failed to load for "${medicine?.name}":`, rawImageUrl)
                            setImgFailed(true)
                        }}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none"
                        loading="lazy"
                    />

                    {showGenuineBadge && !isThumb && (
                        <div className="absolute bottom-2 left-2 bg-emerald-50/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-800 shadow-2xs border border-emerald-200/80 flex items-center gap-1 z-10 pointer-events-none">
                            <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                            <span>100% Genuine Pack Shot</span>
                        </div>
                    )}
                </div>
            ) : (
                <Tier1VectorPack medicine={medicine} form={form} />
            )}
        </div>
    )
}

