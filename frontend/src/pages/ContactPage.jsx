import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'

const CONTACT_INFO = [
    {
        icon: Phone,
        label: 'Phone',
        value: '+91 98765 43210',
        sub: 'Mon – Sat, 9 AM – 8 PM',
        href: 'tel:+919876543210',
        color: 'text-blue-600 bg-blue-50',
    },
    {
        icon: Mail,
        label: 'Email',
        value: 'info@dhruvpharma.com',
        sub: 'We reply within 24 hours',
        href: 'mailto:info@dhruvpharma.com',
        color: 'text-green-600 bg-green-50',
    },
    {
        icon: MapPin,
        label: 'Address',
        value: 'Shop No. 12, Medical Complex, Pune – 411001',
        sub: 'Maharashtra, India',
        href: '#',
        color: 'text-red-500 bg-red-50',
    },
    {
        icon: Clock,
        label: 'Hours',
        value: 'Mon – Sat: 9:00 AM – 8:00 PM',
        sub: 'Closed on Sundays',
        href: null,
        color: 'text-purple-600 bg-purple-50',
    },
]

export default function ContactPage() {
    const [form, setForm]         = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [errors, setErrors]     = useState({})
    const [submitted, setSubmitted] = useState(false)

    const validate = () => {
        const e = {}
        if (!form.name.trim())       e.name    = 'Name is required'
        if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email required'
        if (!/^\d{10}$/.test(form.phone))        e.phone = 'Valid 10-digit phone required'
        if (!form.message.trim())    e.message = 'Message is required'
        return e
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setErrors({})
        setSubmitted(true)
    }

    return (
        <div className="bg-gray-50 min-h-screen py-10 px-4">
            <div className="max-w-5xl mx-auto">

                {/* ── Header ── */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Have a question or need help with your order? We're here to help.
                    </p>
                </div>

                {/* ── Contact Info Cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    {CONTACT_INFO.map((info) => (
                        <div key={info.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                            <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                                <info.icon size={20} />
                            </div>
                            <p className="font-semibold text-gray-700 text-xs mb-1">{info.label}</p>
                            {info.href ? (
                                <a href={info.href} className="text-xs text-gray-600 hover:text-blue-600 transition-colors font-medium">
                                    {info.value}
                                </a>
                            ) : (
                                <p className="text-xs text-gray-600 font-medium">{info.value}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">{info.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Form + Map ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                            <MessageSquare size={18} className="text-blue-600" />
                            Send us a Message
                        </h2>

                        {submitted ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <CheckCircle size={48} className="text-green-500 mb-3" />
                                <h3 className="font-bold text-gray-800 text-lg mb-1">Message Sent!</h3>
                                <p className="text-gray-500 text-sm">
                                    Thank you, {form.name}. We'll get back to you within 24 hours.
                                </p>
                                <button
                                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                                    className="mt-5 text-blue-600 text-sm font-medium hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                {/* Name + Phone */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Your name"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-all
                                                ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                                        />
                                        {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Phone <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="10-digit number"
                                            value={form.phone}
                                            maxLength={10}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                                            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-all
                                                ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                                        />
                                        {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-all
                                            ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                                    />
                                    {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Subject</label>
                                    <select
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="order">Order Issue</option>
                                        <option value="prescription">Prescription Query</option>
                                        <option value="medicine">Medicine Availability</option>
                                        <option value="delivery">Delivery Problem</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Describe your query in detail..."
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition-all
                                            ${errors.message ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                                    />
                                    {errors.message && (
                                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> {errors.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send size={16} />
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Map placeholder + Serving areas */}
                    <div className="space-y-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-64 flex items-center justify-center">
                            <div className="text-center">
                                <MapPin size={40} className="text-blue-200 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-gray-600">Dhruv Pharma</p>
                                <p className="text-xs text-gray-400">Shop No. 12, Medical Complex, Pune</p>
                                <a href="#" className="mt-3 inline-block text-blue-600 text-xs font-medium hover:underline">
                                    View on Google Maps →
                                </a>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-800 text-sm mb-3">Serving Districts</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {['Pune', 'Nashik', 'Ahmednagar', 'Aurangabad'].map((dist) => (
                                    <div key={dist} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                        <span className="text-sm font-medium text-blue-700">{dist}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
