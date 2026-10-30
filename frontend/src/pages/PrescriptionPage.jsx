import { useState, useRef } from 'react'
import {
    Upload,
    Camera,
    FileText,
    X,
    CheckCircle,
    AlertCircle,
    Clock,
    Phone,
    Info,
    Image,
    Loader2,
} from 'lucide-react'

const STEPS = [
    { icon: Upload,        title: 'Upload Prescription', desc: 'Photo, PDF or image in any format' },
    { icon: Clock,         title: 'Owner Reviews',       desc: 'Reviewed within 30 minutes' },
    { icon: CheckCircle,   title: 'Order Confirmed',     desc: 'Available medicines are confirmed' },
    { icon: Phone,         title: 'Delivered to You',    desc: 'Doorstep delivery in 2–4 hours' },
]

export default function PrescriptionPage() {
    const fileInputRef               = useRef(null)
    const [files, setFiles]          = useState([])
    const [dragActive, setDragActive] = useState(false)
    const [formData, setFormData]    = useState({
        patientName:  '',
        phone:        '',
        address:      '',
        district:     '',
        notes:        '',
    })
    const [submitted, setSubmitted]      = useState(false)
    const [submittedRxId, setSubmittedRxId] = useState('')
    const [isUploading, setIsUploading]  = useState(false)
    const [uploadError, setUploadError]  = useState('')
    const [errors, setErrors]            = useState({})

    /* ── Helpers ── */
    const handleFiles = (incoming) => {
        const valid = [...incoming].filter((f) => {
            const ok = f.size <= 10 * 1024 * 1024 // 10 MB
            return ok
        })
        setFiles((prev) => [...prev, ...valid].slice(0, 3)) // max 3 files
    }

    const removeFile = (index) =>
        setFiles((prev) => prev.filter((_, i) => i !== index))

    const onDrop = (e) => {
        e.preventDefault()
        setDragActive(false)
        handleFiles(e.dataTransfer.files)
    }

    const validate = () => {
        const e = {}
        if (!formData.patientName.trim()) e.patientName = 'Patient name is required'
        if (!/^\d{10}$/.test(formData.phone)) e.phone = 'Enter a valid 10-digit phone number'
        if (!formData.address.trim())      e.address  = 'Delivery address is required'
        if (!formData.district)            e.district = 'Please select your district'
        if (files.length === 0)            e.files    = 'Please upload at least one prescription'
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setUploadError('')
        const errs = validate()
        if (Object.keys(errs).length > 0) {
            setErrors(errs)
            return
        }
        setErrors({})
        setIsUploading(true)

        try {
            const payload = new FormData()
            payload.append('patientName', formData.patientName.trim())
            payload.append('phone', formData.phone.trim())
            payload.append('district', formData.district.trim())
            payload.append('address', formData.address.trim())
            payload.append('notes', (formData.notes || '').trim())

            // Append each file
            files.forEach((file) => {
                payload.append('files', file)
            })

            const response = await fetch('http://localhost:8000/api/prescriptions/upload', {
                method: 'POST',
                body: payload,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || 'Failed to upload prescription to server.')
            }

            const data = await response.json()
            setSubmittedRxId(data.prescription?.id || 'RX-PENDING')
            setSubmitted(true)
        } catch (err) {
            console.error('Prescription upload error:', err)
            setUploadError(
                err.message || 'Unable to connect to Dhruv Pharma server. Please ensure backend is running.'
            )
        } finally {
            setIsUploading(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024)       return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    /* ── Success State ── */
    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Prescription Submitted!
                    </h2>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Your prescription has been received. Our owner will review it within
                        <strong className="text-gray-700"> 30 minutes</strong> and call you on{' '}
                        <strong className="text-gray-700">{formData.phone}</strong> to confirm.
                    </p>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-center justify-between mb-3 border-b border-blue-100 pb-2">
                            <p className="text-sm font-semibold text-blue-800">Order Summary</p>
                            <span className="bg-blue-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                                {submittedRxId || 'RX-PENDING'}
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs text-blue-700">Patient: <span className="font-semibold text-gray-800">{formData.patientName}</span></p>
                            <p className="text-xs text-blue-700">Phone: <span className="font-semibold text-gray-800">{formData.phone}</span></p>
                            <p className="text-xs text-blue-700">District: <span className="font-semibold text-gray-800">{formData.district}</span></p>
                            <p className="text-xs text-blue-700">Files: <span className="font-semibold text-gray-800">{files.length} prescription file(s)</span></p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setSubmitted(false); setFiles([]); setFormData({ patientName: '', phone: '', address: '', district: '', notes: '' }) }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        Submit Another Prescription
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4">
            <div className="max-w-5xl mx-auto">

                {/* ── Page Title ── */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Upload Your Prescription
                    </h1>
                    <p className="text-gray-500 text-sm max-w-lg mx-auto">
                        Upload your doctor's prescription below. Our licensed pharmacist will
                        personally review it and call you to confirm your order.
                    </p>
                </div>

                {/* ── How it works ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    {STEPS.map((step, idx) => (
                        <div key={step.title} className="bg-white rounded-xl border border-gray-100 p-4 text-center relative">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                                <step.icon size={18} />
                            </div>
                            <p className="text-xs font-semibold text-gray-700 leading-tight mb-1">{step.title}</p>
                            <p className="text-[10px] text-gray-400 leading-snug">{step.desc}</p>
                            {idx < STEPS.length - 1 && (
                                <div className="hidden sm:block absolute top-6 -right-2 text-gray-300 text-lg font-bold z-10">
                                    →
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Important Notice ── */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-8">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800 mb-0.5">Important Note</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Certain medicines require a valid prescription by law. Our owner personally
                            reviews each prescription for patient safety. Medicines will only be
                            dispatched after verification.
                        </p>
                    </div>
                </div>

                {/* ── Main Form ── */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Left: File Upload */}
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600" />
                                    Prescription Files
                                </h2>

                                {/* Drop Zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                        ${dragActive
                                            ? 'border-blue-400 bg-blue-50'
                                            : errors.files
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />
                                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Upload size={24} className="text-blue-600" />
                                    </div>
                                    <p className="font-semibold text-gray-700 text-sm mb-1">
                                        Drag &amp; drop or click to upload
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Supported: JPG, PNG, PDF, HEIC (max 10 MB each, up to 3 files)
                                    </p>
                                </div>

                                {errors.files && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                                        <AlertCircle size={12} /> {errors.files}
                                    </p>
                                )}

                                {/* Quick action buttons */}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="flex-1 flex items-center justify-center gap-2 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
                                    >
                                        <Image size={15} /> Select Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
                                    >
                                        <Camera size={15} /> Camera
                                    </button>
                                </div>

                                {/* Uploaded files list */}
                                {files.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Uploaded Files ({files.length}/3)
                                        </p>
                                        {files.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                                            >
                                                <CheckCircle size={14} className="text-green-500 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-700 truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tips box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5 mb-2">
                                    <Info size={13} /> Tips for a clear prescription
                                </p>
                                <ul className="space-y-1">
                                    {[
                                        'Place prescription on a flat, well-lit surface',
                                        'All 4 edges of the prescription should be visible',
                                        'Ensure doctor\'s name, date & stamp are clear',
                                        'PDF files are preferred for best quality',
                                    ].map((tip) => (
                                        <li key={tip} className="text-[11px] text-blue-700 flex items-start gap-1.5">
                                            <span className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Right: Patient Details */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <Phone size={18} className="text-blue-600" />
                                Patient &amp; Delivery Details
                            </h2>

                            <div className="space-y-4">
                                {/* Patient Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Patient Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={formData.patientName}
                                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all
                                            ${errors.patientName
                                                ? 'border-red-300 bg-red-50 focus:border-red-400'
                                                : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                                            }`}
                                    />
                                    {errors.patientName && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={11} /> {errors.patientName}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center border rounded-xl overflow-hidden transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 border-gray-200">
                                        <span className="px-3 py-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 shrink-0">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            placeholder="10-digit mobile number"
                                            value={formData.phone}
                                            maxLength={10}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                            className={`flex-1 px-3 py-3 text-sm outline-none bg-transparent
                                                ${errors.phone ? 'text-red-700' : 'text-gray-700'}`}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={11} /> {errors.phone}
                                        </p>
                                    )}
                                </div>

                                {/* District */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        District <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all cursor-pointer
                                            ${errors.district
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                                            }`}
                                    >
                                        <option value="">Select your district</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Nashik">Nashik</option>
                                        <option value="Ahmednagar">Ahmednagar</option>
                                        <option value="Aurangabad">Aurangabad (Chhatrapati Sambhajinagar)</option>
                                    </select>
                                    {errors.district && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={11} /> {errors.district}
                                        </p>
                                    )}
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Full Delivery Address <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="House/Flat no., Street, Landmark, City, PIN code"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all
                                            ${errors.address
                                                ? 'border-red-300 bg-red-50 focus:border-red-400'
                                                : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                                            }`}
                                    />
                                    {errors.address && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={11} /> {errors.address}
                                        </p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Any special instructions or notes for the pharmacist..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                    />
                                </div>

                                {/* Upload Error Banner */}
                                {uploadError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700">
                                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-semibold mb-0.5">Upload Failed</p>
                                            <p>{uploadError}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className={`w-full text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2
                                        ${isUploading
                                            ? 'bg-blue-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-sm'
                                        }`}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Uploading Prescription...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            <span>Submit Prescription</span>
                                        </>
                                    )}
                                </button>

                                <p className="text-[11px] text-gray-400 text-center">
                                    By submitting, you confirm that the prescription is genuine and valid.
                                    Our team will contact you within 30 minutes.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
