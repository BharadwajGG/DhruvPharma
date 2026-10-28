import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    Search,
    Eye,
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    Phone,
    Package,
    X,
    Filter,
} from 'lucide-react'

const ORDERS = [
    { id: 'DP-142', patient: 'Rajesh Patil',    phone: '+91 98765 43210', district: 'Pune',       amount: 198,  items: 3, type: 'direct',       status: 'dispatched', date: '28 Oct 2024, 10:15 AM', agent: 'Sanjay Kumar' },
    { id: 'DP-141', patient: 'Meena Joshi',      phone: '+91 76543 21098', district: 'Nashik',     amount: 450,  items: 5, type: 'prescription',  status: 'delivered',  date: '28 Oct 2024, 9:00 AM',  agent: 'Ramesh Yadav' },
    { id: 'DP-140', patient: 'Suresh Kale',      phone: '+91 98001 34567', district: 'Ahmednagar', amount: 120,  items: 2, type: 'direct',        status: 'confirmed',  date: '28 Oct 2024, 8:30 AM',  agent: '—' },
    { id: 'DP-139', patient: 'Anita Pawar',      phone: '+91 91122 33445', district: 'Pune',       amount: 680,  items: 7, type: 'prescription',  status: 'dispatched', date: '27 Oct 2024, 5:00 PM',  agent: 'Sanjay Kumar' },
    { id: 'DP-138', patient: 'Deepak Shinde',    phone: '+91 94523 10012', district: 'Aurangabad', amount: 250,  items: 4, type: 'direct',        status: 'delivered',  date: '27 Oct 2024, 3:45 PM',  agent: 'Ramesh Yadav' },
    { id: 'DP-137', patient: 'Savita Gaikwad',   phone: '+91 99887 76655', district: 'Nashik',     amount: 340,  items: 3, type: 'prescription',  status: 'pending',    date: '27 Oct 2024, 2:00 PM',  agent: '—' },
]

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   style: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    confirmed: { label: 'Confirmed', style: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
    dispatched:{ label: 'Dispatched',style: 'bg-orange-100 text-orange-700 border-orange-200', icon: Truck },
    delivered: { label: 'Delivered', style: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle },
}

const ALL_STATUSES = ['all', 'pending', 'confirmed', 'dispatched', 'delivered']

export default function AdminOrders() {
    const [filter, setFilter]     = useState('all')
    const [search, setSearch]     = useState('')
    const [selected, setSelected] = useState(null)

    const displayed = ORDERS.filter((o) => {
        const matchStatus = filter === 'all' || o.status === filter
        const matchSearch = o.patient.toLowerCase().includes(search.toLowerCase()) ||
                            o.id.toLowerCase().includes(search.toLowerCase())
        return matchStatus && matchSearch
    })

    const totalRevenue = ORDERS.filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.amount, 0)

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {ORDERS.length} orders today · ₹{totalRevenue} collected
                        </p>
                    </div>
                </div>

                {/* ── Search + Filter ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Search size={16} className="ml-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by patient name or order ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-3 py-3 text-sm outline-none"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {ALL_STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium capitalize border transition-colors
                                    ${filter === s
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Orders Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">District</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayed.map((order) => {
                                    const cfg  = STATUS_CONFIG[order.status]
                                    const Icon = cfg.icon
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-gray-800">{order.id}</p>
                                                <p className="text-[10px] text-gray-400">{order.items} items</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-gray-700">{order.patient}</p>
                                                <p className="text-[10px] text-gray-400">{order.phone}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-1 text-xs text-gray-600">
                                                    <MapPin size={11} /> {order.district}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full capitalize
                                                    ${order.type === 'prescription'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {order.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-gray-800">₹{order.amount}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border capitalize ${cfg.style}`}>
                                                    <Icon size={9} /> {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => setSelected(order)}
                                                        className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={11} /> View
                                                    </button>
                                                    {order.status === 'confirmed' && (
                                                        <button className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors">
                                                            <Truck size={11} /> Dispatch
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {displayed.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <Package size={40} className="mx-auto mb-2 text-gray-200" />
                            <p className="text-sm">No orders found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Order Detail Modal ── */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">Order {selected.id}</h2>
                            <button onClick={() => setSelected(null)}>
                                <X size={18} className="text-gray-400 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Patient',   value: selected.patient },
                                { label: 'Phone',     value: selected.phone },
                                { label: 'District',  value: selected.district },
                                { label: 'Type',      value: selected.type },
                                { label: 'Amount',    value: `₹${selected.amount}` },
                                { label: 'Agent',     value: selected.agent },
                                { label: 'Date',      value: selected.date },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between">
                                    <span className="text-xs text-gray-400">{item.label}</span>
                                    <span className="text-sm font-medium text-gray-700 capitalize">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
