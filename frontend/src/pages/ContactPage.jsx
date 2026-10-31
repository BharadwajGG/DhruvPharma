import { useState } from 'react'
import { Phone, Mail, MapPin, Sparkles, Send, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'

const CONTACT_INFO = [
    {
        icon: Phone,
        label: 'Order on Call & WhatsApp',
        value: '+91 95035 00725',
        sub: 'Always Available 24/7',
        href: 'tel:+919503500725',
        color: 'text-blue-600 bg-blue-50',
    },
    {
        icon: Mail,
        label: 'Official Email',
        value: 'dhruvpharma25@gmail.com',
        sub: 'Customer Support & Inquiries',
        href: 'mailto:dhruvpharma25@gmail.com',
        color: 'text-green-600 bg-green-50',
    },
    {
        icon: MapPin,
        label: 'Store Address',
        value: 'Gokuldham Complex, Nandurbar',
        sub: 'Shop C/135, Shahada Road, Nandurbar - 425412',
        href: '#',
        color: 'text-red-500 bg-red-50',
    },
    {
        icon: Sparkles,
        label: 'Customer Service',
        value: '24/7 Ordering & Support',
        sub: 'Ready to serve anytime',
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
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
                            <MapPin size={36} className="text-blue-600 mb-2" />
                            <h3 className="text-base font-bold text-gray-900">DHRUV PHARMA</h3>
                            <p className="text-xs text-gray-600 max-w-sm mt-1 leading-relaxed">
                                First Floor, Plot No. 122-133, Shop No. C/135, Gokuldham Complex, Shahada Road, Nandurbar - 425412 (Maharashtra)
                            </p>
                            <p className="text-xs font-semibold text-blue-600 mt-2">
                                Helpline: +91 95035 00725 • Email: dhruvpharma25@gmail.com
                            </p>
                            <a
                                href="https://maps.google.com/?q=Gokuldham+Complex+Shahada+Road+Nandurbar+425412"
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline"
                            >
                                View Location on Google Maps →
                            </a>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-900 text-sm">Authorized Delivery Hubs</h3>
                                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                    7 Hubs · 3–4 Days Delivery
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                    { name: 'Nandurbar', pin: '425412', dist: 'Nandurbar' },
                                    { name: 'Shahada',   pin: '425409', dist: 'Nandurbar' },
                                    { name: 'Taloda',    pin: '425413', dist: 'Nandurbar' },
                                    { name: 'Akkalkuwa', pin: '425415', dist: 'Nandurbar' },
                                    { name: 'Shirpur',   pin: '424405', dist: 'Dhule' },
                                    { name: 'Nijampur',  pin: '424305', dist: 'Dhule' },
                                    { name: 'Sakri',     pin: '424304', dist: 'Dhule' },
                                ].map((hub) => (
                                    <div key={hub.pin} className="flex items-center justify-between bg-blue-50/60 border border-blue-100/80 rounded-xl px-3 py-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                            <span className="font-semibold text-gray-800">{hub.name}</span>
                                        </div>
                                        <span className="font-mono text-[10px] text-blue-700 font-bold">{hub.pin}</span>
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
