import { useState, useEffect } from 'react'
import {
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    Phone,
    FileText,
    X,
    AlertCircle,
    Download,
    ExternalLink,
    RotateCw,
    Loader2,
    Trash2,
} from 'lucide-react'

export const INITIAL_PRESCRIPTIONS = [
    {
        id: 'RX-001',
        patient:   'Sunita Deshmukh',
        phone:     '+91 94523 10012',
        district:  'Nandurbar',
        address:   'First Floor, Gokuldham Complex, Shahada Road, Nandurbar – 425412',
        files:     ['prescription_1.jpg'],
        notes:     'Regular monthly BP medicines',
        submittedAt: '28 Oct 2024, 10:15 AM',
        status:    'pending',
    },
    {
        id: 'RX-002',
        patient:   'Anil Kulkarni',
        phone:     '+91 98001 34567',
        district:  'Shahada',
        address:   '7, Market Yard Colony, Shahada – 425409',
        files:     ['prescription_front.pdf', 'prescription_back.jpg'],
        notes:     '',
        submittedAt: '28 Oct 2024, 09:55 AM',
        status:    'pending',
    },
    {
        id: 'RX-003',
        patient:   'Priya More',
        phone:     '+91 76543 21098',
        district:  'Shirpur',
        address:   '3, Station Road, Shirpur – 424405',
        files:     ['rx_priya.jpg'],
        notes:     'Diabetic patient. Needs Metformin 500mg x 3 strips',
        submittedAt: '28 Oct 2024, 09:10 AM',
        status:    'reviewed',
    },
    {
        id: 'RX-004',
        patient:   'Ramesh Bhosale',
        phone:     '+91 98765 00011',
        district:  'Taloda',
        address:   'Plot 22, Shivaji Chowk, Taloda – 425413',
        files:     ['scan_rx.pdf'],
        notes:     '',
        submittedAt: '27 Oct 2024, 6:30 PM',
        status:    'approved',
    },
    {
        id: 'RX-005',
        patient:   'Kavita Shah',
        phone:     '+91 91122 33445',
        district:  'Sakri',
        address:   '14, Bypass Road, Sakri – 424304',
        files:     ['kavita_rx.jpg'],
        notes:     'Doctor said to take Atorvastatin 10mg',
        submittedAt: '27 Oct 2024, 4:15 PM',
        status:    'rejected',
    },
]

const STATUS_CONFIG = {
    pending:  { label: 'Waiting Review',  style: 'bg-amber-100 text-amber-900 border-amber-200',   icon: Clock },
    reviewed: { label: 'Checked',         style: 'bg-blue-100 text-blue-900 border-blue-200',      icon: Eye },
    approved: { label: 'Approved',        style: 'bg-emerald-100 text-emerald-900 border-emerald-200', icon: CheckCircle },
    rejected: { label: 'Rejected',        style: 'bg-rose-100 text-rose-900 border-rose-200',       icon: XCircle },
}

const FILTER_TABS = [
    { key: 'all',      label: 'All Prescriptions' },
    { key: 'pending',  label: 'Waiting Review' },
    { key: 'reviewed', label: 'Checked' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
]

export default function PrescriptionQueueView({ title = 'Prescriptions', subtitle }) {
    const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS)
    const [filter, setFilter]               = useState('all')
    const [selected, setSelected]           = useState(null)
    const [isLoading, setIsLoading]         = useState(false)
    const [isRefreshing, setIsRefreshing]   = useState(false)

    const fetchLivePrescriptions = async (isManual = false) => {
        if (isManual) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const res = await fetch('http://localhost:8000/api/prescriptions')
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    setPrescriptions(data)
                }
            }
        } catch (err) {
            console.warn('Backend currently offline or unreachable, using default view:', err)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchLivePrescriptions()
    }, [])

    const displayed = filter === 'all'
        ? prescriptions
        : prescriptions.filter((rx) => rx.status === filter)

    const pendingCount = prescriptions.filter((rx) => rx.status === 'pending').length

    const handleUpdateStatus = async (id, newStatus) => {
        // Optimistic UI update
        setPrescriptions((prev) =>
            prev.map((rx) => (rx.id === id ? { ...rx, status: newStatus } : rx))
        )
        if (selected && selected.id === id) {
            setSelected((prev) => ({ ...prev, status: newStatus }))
        }

        try {
            await fetch(`http://localhost:8000/api/prescriptions/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
        } catch (err) {
            console.error('Failed to sync status with server:', err)
        }
    }

    const handleOpenReview = (rx) => {
        setSelected(rx)
        if (rx.status === 'pending') {
            handleUpdateStatus(rx.id, 'reviewed')
        }
    }

    const handleDeletePrescription = async (id, patientName) => {
        if (!window.confirm(`Delete prescription request for "${patientName || id}"? This request will be permanently removed.`)) {
            return
        }
        setPrescriptions((prev) => prev.filter((rx) => rx.id !== id))
        if (selected && selected.id === id) {
            setSelected(null)
        }
        try {
            await fetch(`http://localhost:8000/api/prescriptions/${id}`, {
                method: 'DELETE',
            })
        } catch (err) {
            console.error('Failed to delete prescription from server:', err)
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {subtitle || `${pendingCount} prescription${pendingCount !== 1 ? 's' : ''} waiting for pharmacist review`}
                    </p>
                </div>
                <button
                    onClick={() => fetchLivePrescriptions(true)}
                    disabled={isRefreshing || isLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 shadow-xs transition-colors"
                    title="Refresh live uploads from server"
                >
                    <RotateCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : 'text-gray-500'} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {FILTER_TABS.map((tab) => {
                    const count = tab.key === 'all'
                        ? prescriptions.length
                        : prescriptions.filter((rx) => rx.status === tab.key).length
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer flex items-center gap-1.5
                                ${filter === tab.key
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                filter === tab.key ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Prescription List */}
            <div className="space-y-3">
                {displayed.map((rx) => {
                    const cfg  = STATUS_CONFIG[rx.status]
                    const Icon = cfg.icon
                    return (
                        <div key={rx.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Avatar + Info */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                                    {rx.patient[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="font-semibold text-gray-800 text-sm">{rx.patient}</p>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${cfg.style}`}>
                                            <Icon size={9} /> {cfg.label}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin size={11} /> {rx.district}
                                        </span>
                                        <a
                                            href={`tel:${rx.phone}`}
                                            className="text-xs text-slate-700 hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                                            title="Click to call customer"
                                        >
                                            <Phone size={11} className="text-emerald-600" /> {rx.phone}
                                        </a>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <FileText size={11} /> {rx.files.length} file(s)
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={11} /> {rx.submittedAt}
                                        </span>
                                    </div>
                                    {rx.notes && (
                                        <p className="text-xs text-gray-400 italic mt-1 truncate">
                                            Note: {rx.notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleOpenReview(rx)}
                                    className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Eye size={13} /> Review
                                </button>
                                {rx.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(rx.id, 'approved')}
                                            className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <CheckCircle size={13} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(rx.id, 'rejected')}
                                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <XCircle size={13} /> Reject
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleDeletePrescription(rx.id, rx.patient)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete prescription request"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )
                })}

                {displayed.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <FileText size={48} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm">No prescriptions found for this filter</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                            <div>
                                <h2 className="font-bold text-gray-900">{selected.patient}</h2>
                                <p className="text-xs text-gray-500">{selected.id} · {selected.submittedAt}</p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">Prescription Files</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selected.files.map((file, idx) => {
                                        const fileUrl = file.startsWith('http')
                                            ? file
                                            : file.startsWith('/uploads/')
                                            ? `http://localhost:8000${file}`
                                            : null
                                        const isImg = fileUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
                                        const isPdf = fileUrl && /\.pdf$/i.test(file)

                                        if (isImg) {
                                            return (
                                                <a
                                                    key={idx}
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 block aspect-4/3"
                                                >
                                                    <img
                                                        src={fileUrl}
                                                        alt="Prescription"
                                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5">
                                                        <ExternalLink size={14} /> Open Full Image
                                                    </div>
                                                </a>
                                            )
                                        }

                                        if (isPdf) {
                                            return (
                                                <a
                                                    key={idx}
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors text-center aspect-4/3"
                                                >
                                                    <FileText size={36} className="text-red-500" />
                                                    <p className="text-xs font-medium text-gray-800 line-clamp-1 max-w-full px-2">
                                                        {file.split('/').pop()}
                                                    </p>
                                                    <span className="text-[11px] font-semibold text-red-600 bg-white px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                                                        <ExternalLink size={12} /> View PDF
                                                    </span>
                                                </a>
                                            )
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 aspect-4/3"
                                            >
                                                <FileText size={32} className="text-gray-300" />
                                                <p className="text-xs text-gray-500 text-center px-2 truncate max-w-full">{file}</p>
                                                <span className="text-[11px] text-gray-400">Sample Mock File</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Phone',    value: selected.phone },
                                    { label: 'District', value: selected.district },
                                    { label: 'Address',  value: selected.address },
                                    { label: 'Notes',    value: selected.notes || '—' },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                                        <p className="text-sm text-gray-700 font-medium">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    Verify prescription authenticity before approval. Check doctor's signature,
                                    registration number, and ensure the prescription date is valid.
                                </p>
                            </div>

                            {selected.status === 'pending' && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            handleUpdateStatus(selected.id, 'approved')
                                            setSelected(null)
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
                                    >
                                        <CheckCircle size={16} /> Approve &amp; Create Order
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleUpdateStatus(selected.id, 'rejected')
                                            setSelected(null)
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-3 rounded-xl transition-colors"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            )}
                            <div className="pt-2 flex items-center justify-between border-t border-gray-100 gap-3">
                                <button
                                    onClick={() => handleDeletePrescription(selected.id, selected.patient)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    <Trash2 size={14} /> Delete Request
                                </button>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

