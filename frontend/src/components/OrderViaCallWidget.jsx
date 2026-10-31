import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    Phone,
    PhoneCall,
    MessageSquare,
    Clock,
    X,
    Upload,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    AlertCircle,
    MapPin,
    Sparkles,
} from 'lucide-react'

const PHARMACY_PHONE = '9503500725'
const PHARMACY_PHONE_DISPLAY = '+91 95035 00725'

export default function OrderViaCallWidget() {
    const { currentUser } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [callbackModalOpen, setCallbackModalOpen] = useState(false)

    // Callback Request Form State
    const [formData, setFormData] = useState({
        customerName: currentUser?.displayName || '',
        phone: '',
        district: 'Nandurbar',
        preferredTime: 'Immediate (within 15 mins)',
        medicinesNeeded: '',
    })
    const [rxFile, setRxFile] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')

        if (!formData.customerName.trim()) {
            setErrorMessage('Please enter your name.')
            return
        }

        const cleanPhone = formData.phone.replace(/\D/g, '')
        if (cleanPhone.length < 10) {
            setErrorMessage('Please enter a valid 10-digit mobile number.')
            return
        }

        setIsSubmitting(true)
        try {
            const data = new FormData()
            data.append('customerName', formData.customerName.trim())
            data.append('phone', formData.phone.trim())
            data.append('district', formData.district)
            data.append('preferredTime', formData.preferredTime)
            data.append('medicinesNeeded', formData.medicinesNeeded.trim())
            if (rxFile) {
                data.append('prescriptionFile', rxFile)
            }

            const res = await fetch('http://localhost:8000/api/callbacks', {
                method: 'POST',
                body: data,
            })

            const result = await res.json()
            if (!res.ok) {
                throw new Error(result.detail || 'Failed to submit callback request.')
            }

            setSuccessMessage(result.message || 'Callback registered! A pharmacist will call you shortly.')
            // Reset form
            setFormData({
                customerName: currentUser?.displayName || '',
                phone: '',
                district: 'Nandurbar',
                preferredTime: 'Immediate (within 15 mins)',
                medicinesNeeded: '',
            })
            setRxFile(null)
        } catch (err) {
            console.error('Callback error:', err)
            setErrorMessage(err.message || 'Could not connect to server. Please dial +91 95035 00725 directly.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const whatsappUrl = `https://wa.me/91${PHARMACY_PHONE}?text=${encodeURIComponent(
        'Hello Dhruv Pharma, I would like to place an order for medicines via call/WhatsApp. Please assist me.'
    )}`

    return (
        <>
            {/* ── Persistent Floating Button on Bottom-Right ── */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
                {/* Expandable Quick Action Card */}
                {isOpen && (
                    <div className="mb-3 w-84 sm:w-92 bg-white rounded-3xl border border-gray-100 shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-3 relative text-left">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="space-y-1 pr-6">
                            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider">
                                <Sparkles size={13} />
                                <span>Express Phone Ordering</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-base leading-snug">
                                Order via Pharmacist Call
                            </h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Don't want to type or browse? Speak directly with our licensed pharmacist in Maharashtra.
                            </p>
                        </div>

                        {/* Action 1: One-Tap Direct Dial */}
                        <a
                            href={`tel:+91${PHARMACY_PHONE}`}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <PhoneCall size={18} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Call Now: {PHARMACY_PHONE_DISPLAY}</p>
                                    <p className="text-[10px] text-blue-100 font-normal">Available 24/7 for Patient Orders</p>
                                </div>
                            </div>
                            <span className="text-sm group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </a>

                        {/* Action 2: WhatsApp Order */}
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <MessageSquare size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-emerald-950">Order via WhatsApp</p>
                                    <p className="text-[10px] text-emerald-700 font-normal">Send prescription photo or list</p>
                                </div>
                            </div>
                            <span className="text-sm text-emerald-700 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </a>

                        {/* Action 3: Request a Callback */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false)
                                setCallbackModalOpen(true)
                                setSuccessMessage('')
                                setErrorMessage('')
                            }}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 font-semibold text-xs transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-gray-900">Request a Free Callback</p>
                                    <p className="text-[10px] text-gray-500 font-normal">We'll call you within 15 minutes</p>
                                </div>
                            </div>
                            <span className="text-sm text-gray-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </button>
                    </div>
                )}

                {/* The Floating Pill Trigger (Larger & Bottom-Right with Radar Wave Animation) */}
                <div className="relative group">
                    {/* Concentric radar ripple rings */}
                    <span className="radar-ring" />
                    <span className="radar-ring-delayed" />

                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="relative z-10 flex items-center gap-2.5 sm:gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white font-bold text-sm py-3 px-4 sm:py-3.5 sm:px-6 rounded-full shadow-2xl hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 cursor-pointer border-2 border-white/20"
                        aria-label="Order medicines via phone call"
                    >
                        <span className="relative flex h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-emerald-500" />
                        </span>
                        <Phone size={17} className="shrink-0" />
                        <span className="tracking-wide text-xs sm:text-sm font-extrabold whitespace-nowrap">Order via Call</span>
                        <span className="font-mono text-[11px] sm:text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-bold border border-white/25 whitespace-nowrap">
                            95035 00725
                        </span>
                    </button>
                </div>
            </div>

            {/* ── "Request Pharmacist Callback" Modal ── */}
            {callbackModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 border border-gray-100 shadow-2xl relative">
                        {/* Close */}
                        <button
                            type="button"
                            onClick={() => setCallbackModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="text-center space-y-1">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <PhoneCall size={26} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Request a Free Callback</h3>
                            <p className="text-xs text-gray-500">
                                Our licensed pharmacist will call you at your preferred time to verify medicines and doorstep delivery.
                            </p>
                        </div>

                        {successMessage ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                                <h4 className="font-bold text-emerald-900 text-sm">Callback Request Confirmed!</h4>
                                <p className="text-xs text-emerald-700 leading-relaxed">
                                    {successMessage}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setCallbackModalOpen(false)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-xs"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
                                {errorMessage && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                                        <AlertCircle size={15} className="shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Your Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ramesh Patil"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                        required
                                    />
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
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">
                                            Authorized Hub / District
                                        </label>
                                        <select
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                                        >
                                            <option value="Nandurbar">Nandurbar (425412)</option>
                                            <option value="Shahada">Shahada (425409)</option>
                                            <option value="Taloda">Taloda (425413)</option>
                                            <option value="Nijampur">Nijampur (424305)</option>
                                            <option value="Akkalkuwa">Akkalkuwa (425415)</option>
                                            <option value="Shirpur">Shirpur (424405)</option>
                                            <option value="Sakri">Sakri (424304)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Preferred Call Time (24/7 Service)
                                    </label>
                                    <select
                                        value={formData.preferredTime}
                                        onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value="Immediate (within 15 mins)">Immediate (within 15 mins)</option>
                                        <option value="Anytime (24/7 Available)">Anytime (24/7 Available)</option>
                                        <option value="Morning">Morning</option>
                                        <option value="Afternoon">Afternoon</option>
                                        <option value="Evening">Evening</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Medicines Needed / Specific Request (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. Monthly diabetes medicines, Dolo 650, or doctor advised BP tablets"
                                        value={formData.medicinesNeeded}
                                        onChange={(e) => setFormData({ ...formData, medicinesNeeded: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Attach Prescription Photo (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setRxFile(e.target.files[0] || null)}
                                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 mt-2 text-xs cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Submitting Request...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PhoneCall size={15} />
                                            <span>Request Pharmacist Callback</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

