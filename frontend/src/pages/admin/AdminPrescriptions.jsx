import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
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
} from 'lucide-react'

const PRESCRIPTIONS = [
    {
        id: 'RX-001',
        patient:   'Sunita Deshmukh',
        phone:     '+91 94523 10012',
        district:  'Nashik',
        address:   '45, Gangapur Rd, Nashik – 422013',
        files:     ['prescription_1.jpg'],
        notes:     'Regular monthly BP medicines',
        submittedAt: '28 Oct 2024, 10:15 AM',
        status:    'pending',
    },
    {
        id: 'RX-002',
        patient:   'Anil Kulkarni',
        phone:     '+91 98001 34567',
        district:  'Ahmednagar',
        address:   '7, Savedi Colony, Ahmednagar – 414003',
        files:     ['prescription_front.pdf', 'prescription_back.jpg'],
        notes:     '',
        submittedAt: '28 Oct 2024, 09:55 AM',
        status:    'pending',
    },
    {
        id: 'RX-003',
        patient:   'Priya More',
        phone:     '+91 76543 21098',
        district:  'Pune',
        address:   '3, Kothrud, Pune – 411029',
        files:     ['rx_priya.jpg'],
        notes:     'Diabetic patient. Needs Metformin 500mg x 3 strips',
        submittedAt: '28 Oct 2024, 09:10 AM',
        status:    'reviewed',
    },
    {
        id: 'RX-004',
        patient:   'Ramesh Bhosale',
        phone:     '+91 98765 00011',
        district:  'Aurangabad',
        address:   'Plot 22, CIDCO, Aurangabad – 431001',
        files:     ['scan_rx.pdf'],
        notes:     '',
        submittedAt: '27 Oct 2024, 6:30 PM',
        status:    'approved',
    },
    {
        id: 'RX-005',
        patient:   'Kavita Shah',
        phone:     '+91 91122 33445',
        district:  'Pune',
        address:   '14, Baner, Pune – 411045',
        files:     ['kavita_rx.jpg'],
        notes:     'Doctor said to take Atorvastatin 10mg',
        submittedAt: '27 Oct 2024, 4:15 PM',
        status:    'rejected',
    },
]

const STATUS_CONFIG = {
    pending:  { label: 'Pending',  style: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    reviewed: { label: 'Reviewed', style: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Eye },
    approved: { label: 'Approved', style: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle },
    rejected: { label: 'Rejected', style: 'bg-red-100 text-red-700 border-red-200',          icon: XCircle },
}

const FILTER_TABS = ['all', 'pending', 'reviewed', 'approved', 'rejected']

export default function AdminPrescriptions() {
    const [filter, setFilter]     = useState('all')
    const [selected, setSelected] = useState(null) // open prescription detail

    const displayed = filter === 'all'
        ? PRESCRIPTIONS
        : PRESCRIPTIONS.filter((rx) => rx.status === filter)

    const pendingCount = PRESCRIPTIONS.filter((rx) => rx.status === 'pending').length

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Prescriptions</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {pendingCount} prescription{pendingCount !== 1 ? 's' : ''} waiting for your review
                        </p>
                    </div>
                </div>

                {/* ── Filter Tabs ── */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors border
                                ${filter === tab
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            {tab === 'all' ? `All (${PRESCRIPTIONS.length})` : tab}
                            {tab === 'pending' && pendingCount > 0 && (
                                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                    ${filter === 'pending' ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Prescription List ── */}
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
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Phone size={11} /> {rx.phone}
                                            </span>
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
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => setSelected(rx)}
                                        className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Eye size={13} /> Review
                                    </button>
                                    {rx.status === 'pending' && (
                                        <>
                                            <button className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                                                <CheckCircle size={13} /> Approve
                                            </button>
                                            <button className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                                                <XCircle size={13} /> Reject
                                            </button>
                                        </>
                                    )}
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
            </div>

            {/* ── Detail Modal ── */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
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
                            {/* Prescription files placeholder */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">Prescription Files</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {selected.files.map((file) => (
                                        <div
                                            key={file}
                                            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl h-40 flex flex-col items-center justify-center gap-2"
                                        >
                                            <FileText size={32} className="text-gray-300" />
                                            <p className="text-xs text-gray-500 text-center px-2 truncate max-w-full">{file}</p>
                                            <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                                                <Download size={11} /> Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Patient details */}
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

                            {/* Safety notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    Verify prescription authenticity before approval. Check doctor's signature,
                                    registration number, and that the prescription is not expired.
                                </p>
                            </div>

                            {/* Action buttons */}
                            {selected.status === 'pending' && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
                                    >
                                        <CheckCircle size={16} /> Approve &amp; Create Order
                                    </button>
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-3 rounded-xl transition-colors"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
