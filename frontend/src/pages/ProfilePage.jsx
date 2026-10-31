import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDelivery } from '../context/DeliveryContext'
import OrderInvoiceModal from '../components/OrderInvoiceModal'
import {
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    ShoppingBag,
    Plus,
    Trash2,
    Check,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Printer,
    Download,
    Save,
    Home,
    Briefcase,
    Building2,
    Loader2,
    ShieldCheck,
} from 'lucide-react'

export default function ProfilePage() {
    const { currentUser, loginWithGoogle } = useAuth()
    const { serviceableAreas } = useDelivery()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'addresses' | 'prescriptions' | 'orders'

    // Profile state
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [profileSuccessMsg, setProfileSuccessMsg] = useState('')

    // Addresses state
    const [addresses, setAddresses] = useState([])
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        address: '',
        pincode: '425412',
        district: 'Nandurbar',
        isDefault: false,
    })

    // Prescriptions state
    const [prescriptions, setPrescriptions] = useState([])
    const [isLoadingRx, setIsLoadingRx] = useState(false)

    // Orders state
    const [orders, setOrders] = useState([])
    const [isLoadingOrders, setIsLoadingOrders] = useState(false)
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null)

    // Load user data on mount
    useEffect(() => {
        const storedProfile = localStorage.getItem('dhruv_user_profile')
        const storedPhone = localStorage.getItem('dhruv_user_phone') || ''
        const storedAddrs = localStorage.getItem('dhruv_saved_addresses')

        if (currentUser) {
            setFullName(currentUser.displayName || '')
            setEmail(currentUser.email || '')
        }

        if (storedProfile) {
            try {
                const parsed = JSON.parse(storedProfile)
                if (parsed.fullName) setFullName(parsed.fullName)
                if (parsed.phone) setPhone(parsed.phone)
                if (parsed.email && !currentUser?.email) setEmail(parsed.email)
            } catch (e) {}
        } else if (storedPhone) {
            setPhone(storedPhone)
        }

        if (storedAddrs) {
            try {
                setAddresses(JSON.parse(storedAddrs))
            } catch (e) {}
        }

        // Fetch from backend if available
        const userIdentifier = currentUser?.uid || currentUser?.email || storedPhone
        if (userIdentifier) {
            fetch(`http://localhost:8000/api/user/profile?userId=${encodeURIComponent(userIdentifier)}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data?.profile) {
                        if (data.profile.fullName) setFullName(data.profile.fullName)
                        if (data.profile.phone) setPhone(data.profile.phone)
                        if (data.profile.addresses && data.profile.addresses.length > 0) {
                            setAddresses(data.profile.addresses)
                            localStorage.setItem('dhruv_saved_addresses', JSON.stringify(data.profile.addresses))
                        }
                    }
                })
                .catch(() => {})
        }
    }, [currentUser])

    // Load prescriptions & orders when user phone/email is known
    useEffect(() => {
        const userPhone = phone || localStorage.getItem('dhruv_user_phone') || ''
        const userEmail = email || currentUser?.email || ''

        if (userPhone || userEmail) {
            // Load prescriptions
            setIsLoadingRx(true)
            fetch(`http://localhost:8000/api/user/prescriptions?phone=${encodeURIComponent(userPhone)}&email=${encodeURIComponent(userEmail)}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => setPrescriptions(data || []))
                .catch(() => {})
                .finally(() => setIsLoadingRx(false))

            // Load orders
            setIsLoadingOrders(true)
            fetch(`http://localhost:8000/api/orders?phone=${encodeURIComponent(userPhone)}&email=${encodeURIComponent(userEmail)}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => setOrders(data || []))
                .catch(() => {})
                .finally(() => setIsLoadingOrders(false))
        }
    }, [phone, email, currentUser])

    // Save Profile
    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setIsSavingProfile(true)
        setProfileSuccessMsg('')

        const profileData = {
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
        }

        localStorage.setItem('dhruv_user_profile', JSON.stringify(profileData))
        if (phone.trim()) localStorage.setItem('dhruv_user_phone', phone.trim())

        const uid = currentUser?.uid || currentUser?.email || phone.trim()
        if (uid) {
            try {
                await fetch('http://localhost:8000/api/user/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: uid,
                        full_name: fullName.trim(),
                        phone: phone.trim(),
                        email: email.trim(),
                        addresses: addresses,
                    }),
                })
            } catch (err) {
                console.warn('Backend sync notice:', err)
            }
        }

        setIsSavingProfile(false)
        setProfileSuccessMsg('Profile updated successfully!')
        setTimeout(() => setProfileSuccessMsg(''), 3000)
    }

    // Add Address
    const handleAddAddress = (e) => {
        e.preventDefault()
        if (!newAddress.address.trim()) return

        const selectedArea = serviceableAreas.find((a) => a.pincode === newAddress.pincode)

        const addrObj = {
            id: Date.now().toString(),
            label: newAddress.label,
            address: newAddress.address.trim(),
            pincode: newAddress.pincode,
            areaName: selectedArea?.name || 'Local Area',
            district: selectedArea?.district || newAddress.district,
            isDefault: addresses.length === 0 || newAddress.isDefault,
        }

        const updated = newAddress.isDefault
            ? addresses.map((a) => ({ ...a, isDefault: false })).concat(addrObj)
            : [...addresses, addrObj]

        setAddresses(updated)
        localStorage.setItem('dhruv_saved_addresses', JSON.stringify(updated))

        // Sync with backend
        const uid = currentUser?.uid || currentUser?.email || phone.trim()
        if (uid) {
            fetch('http://localhost:8000/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: uid,
                    full_name: fullName,
                    phone: phone,
                    email: email,
                    addresses: updated,
                }),
            }).catch(() => {})
        }

        setNewAddress({
            label: 'Home',
            address: '',
            pincode: '425412',
            district: 'Nandurbar',
            isDefault: false,
        })
        setShowAddressModal(false)
    }

    // Delete Address
    const handleDeleteAddress = (id) => {
        const updated = addresses.filter((a) => a.id !== id)
        setAddresses(updated)
        localStorage.setItem('dhruv_saved_addresses', JSON.stringify(updated))

        const uid = currentUser?.uid || currentUser?.email || phone.trim()
        if (uid) {
            fetch('http://localhost:8000/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: uid,
                    full_name: fullName,
                    phone: phone,
                    email: email,
                    addresses: updated,
                }),
            }).catch(() => {})
        }
    }

    // Set Default Address
    const handleSetDefault = (id) => {
        const updated = addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
        }))
        setAddresses(updated)
        localStorage.setItem('dhruv_saved_addresses', JSON.stringify(updated))
    }

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                        <CheckCircle size={12} /> Approved
                    </span>
                )
            case 'reviewed':
                return (
                    <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                        <ShieldCheck size={12} /> Pharmacist Reviewed
                    </span>
                )
            case 'rejected':
                return (
                    <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
                        <XCircle size={12} /> Rejected
                    </span>
                )
            default:
                return (
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                        <Clock size={12} /> Under Verification
                    </span>
                )
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header Banner */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                            {fullName ? fullName.charAt(0).toUpperCase() : <User size={28} />}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900">
                                {fullName || 'My Account & Patient Profile'}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {phone || email ? `${phone || ''} ${email ? '• ' + email : ''}` : 'Manage your delivery addresses and prescriptions'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/medicines"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-2xs"
                        >
                            Browse Medicines
                        </Link>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'profile'
                                ? 'border-emerald-600 text-emerald-800'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <User size={15} /> Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab('addresses')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'addresses'
                                ? 'border-emerald-600 text-emerald-800'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <MapPin size={15} /> Saved Addresses ({addresses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('prescriptions')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'prescriptions'
                                ? 'border-emerald-600 text-emerald-800'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <FileText size={15} /> Prescription Tracking ({prescriptions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`pb-2.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'orders'
                                ? 'border-emerald-600 text-emerald-800'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <ShoppingBag size={15} /> Orders & Invoices ({orders.length})
                    </button>
                </div>

                {/* TAB 1: PERSONAL INFO */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl">
                        <h2 className="text-base font-bold text-slate-900 mb-1">Personal Details</h2>
                        <p className="text-xs text-slate-500 mb-5">
                            Used for prescription verification, doctor calls, and fast checkout.
                        </p>

                        {profileSuccessMsg && (
                            <div className="mb-4 bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                                <Check size={14} className="text-emerald-600" />
                                <span>{profileSuccessMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Patient / Customer Full Name
                                </label>
                                <div className="relative">
                                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Contact Phone Number (for Delivery &amp; OTP)
                                </label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="e.g. 9503500725"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Email Address (for Digital Tax Invoices)
                                </label>
                                <div className="relative">
                                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="e.g. patient@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                {isSavingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                <span>Save Changes</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 2: SAVED ADDRESSES */}
                {activeTab === 'addresses' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Saved Delivery Addresses</h2>
                                <p className="text-xs text-slate-500">
                                    Store multiple addresses for 1-click checkout within our 7 authorized delivery pincodes.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddressModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                                <Plus size={14} /> Add New Address
                            </button>
                        </div>

                        {addresses.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                                <MapPin size={40} className="mx-auto text-slate-300 mb-2" />
                                <h3 className="font-bold text-slate-800 text-sm mb-1">No Saved Addresses Yet</h3>
                                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                                    Add your home or clinic address now for quick medicine orders.
                                </p>
                                <button
                                    onClick={() => setShowAddressModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                                >
                                    + Add Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`bg-white rounded-xl border p-4 shadow-2xs relative flex flex-col justify-between ${
                                            addr.isDefault ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                    {addr.label === 'Home' && <Home size={12} />}
                                                    {addr.label === 'Office' && <Briefcase size={12} />}
                                                    {addr.label === 'Clinic' && <Building2 size={12} />}
                                                    {addr.label}
                                                </span>
                                                {addr.isDefault && (
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        Default Address
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-1">
                                                {addr.address}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {addr.areaName || addr.district} • PIN: <strong className="font-mono text-slate-800">{addr.pincode}</strong>
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            {!addr.isDefault ? (
                                                <button
                                                    onClick={() => handleSetDefault(addr.id)}
                                                    className="text-slate-500 hover:text-emerald-700 font-semibold text-[11px]"
                                                >
                                                    Set as Default
                                                </button>
                                            ) : (
                                                <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                                                    <Check size={12} /> Active Default
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleDeleteAddress(addr.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete Address"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: PRESCRIPTION TRACKING */}
                {activeTab === 'prescriptions' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Prescription Verification Tracker</h2>
                                <p className="text-xs text-slate-500">
                                    Track status of doctor prescriptions reviewed by our registered pharmacists.
                                </p>
                            </div>
                            <Link
                                to="/prescription"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs"
                            >
                                <Plus size={14} /> Upload New Rx
                            </Link>
                        </div>

                        {isLoadingRx ? (
                            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                                <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                                <p className="text-xs text-slate-500">Fetching your prescription records...</p>
                            </div>
                        ) : prescriptions.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                                <FileText size={40} className="mx-auto text-slate-300 mb-2" />
                                <h3 className="font-bold text-slate-800 text-sm mb-1">No Prescriptions Found</h3>
                                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                                    Upload a doctor prescription photo to get automatic quotation and delivery within 3–4 days.
                                </p>
                                <Link
                                    to="/prescription"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl inline-block"
                                >
                                    Upload Prescription
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {prescriptions.map((rx) => (
                                    <div
                                        key={rx.id}
                                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-900">
                                                    {rx.id || rx.rxId}
                                                </span>
                                                {getStatusBadge(rx.status)}
                                            </div>
                                            <p className="text-xs font-bold text-slate-800">
                                                Patient: {rx.patient || rx.patientName || 'Self'}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {rx.notes || 'Routine prescription'} • Submitted on {rx.date || rx.submittedAt || 'Recently'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            {rx.files && rx.files.length > 0 && (
                                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                    {rx.files.length} File(s)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: ORDERS & INVOICES */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Orders &amp; Tax Invoices</h2>
                                <p className="text-xs text-slate-500">
                                    Download official GST tax invoices for reimbursement or record-keeping.
                                </p>
                            </div>
                            <Link
                                to="/my-orders"
                                className="text-emerald-700 hover:text-emerald-800 font-bold text-xs"
                            >
                                View Detailed Order History &rarr;
                            </Link>
                        </div>

                        {isLoadingOrders ? (
                            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                                <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                                <p className="text-xs text-slate-500">Loading your invoices...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                                <ShoppingBag size={40} className="mx-auto text-slate-300 mb-2" />
                                <h3 className="font-bold text-slate-800 text-sm mb-1">No Orders Placed Yet</h3>
                                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                                    Once you place an order, you can download your official tax bill here.
                                </p>
                                <Link
                                    to="/medicines"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl inline-block"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((o) => (
                                    <div
                                        key={o.id}
                                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs font-black text-slate-900">
                                                    #{o.id}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                    {o.status}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    ₹{o.totalAmount || o.amount}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600">
                                                Delivery Area: <strong>{o.district}</strong> ({o.pincode}) • {o.date || o.createdAt}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setSelectedInvoiceOrder(o)}
                                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Download size={14} />
                                            <span>Download PDF Invoice</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal: Add Address */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-black text-slate-900 text-base mb-1">Add Delivery Address</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Deliveries are active across Nandurbar, Shahada, Taloda, Shirpur, Nijampur, Akkalkuwa &amp; Sakri.
                        </p>

                        <form onSubmit={handleAddAddress} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address Label</label>
                                <div className="flex gap-2">
                                    {['Home', 'Office', 'Clinic', 'Other'].map((l) => (
                                        <button
                                            type="button"
                                            key={l}
                                            onClick={() => setNewAddress({ ...newAddress, label: l })}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                                newAddress.label === l
                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Serviceable Area &amp; PIN Code
                                </label>
                                <select
                                    value={newAddress.pincode}
                                    onChange={(e) => {
                                        const pin = e.target.value
                                        const area = serviceableAreas.find((a) => a.pincode === pin)
                                        setNewAddress({
                                            ...newAddress,
                                            pincode: pin,
                                            district: area?.district || 'Nandurbar',
                                        })
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
                                >
                                    {serviceableAreas.map((area) => (
                                        <option key={area.pincode} value={area.pincode}>
                                            {area.name} ({area.pincode}) – {area.district}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    House / Flat No., Building, Street &amp; Landmark
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Flat 204, Shivneri Heights, Near Bus Stand"
                                    value={newAddress.address}
                                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={newAddress.isDefault}
                                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                    className="rounded border-slate-300 text-emerald-600"
                                />
                                <span className="text-xs text-slate-700 font-semibold">Make this my default address</span>
                            </label>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddressModal(false)}
                                    className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                                >
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Tax Invoice Preview / Print */}
            {selectedInvoiceOrder && (
                <OrderInvoiceModal
                    order={selectedInvoiceOrder}
                    isOpen={Boolean(selectedInvoiceOrder)}
                    onClose={() => setSelectedInvoiceOrder(null)}
                />
            )}
        </div>
    )
}

