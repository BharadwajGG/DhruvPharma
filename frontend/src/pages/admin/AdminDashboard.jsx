import AdminLayout from '../../components/AdminLayout'
import {
    FileText,
    ShoppingBag,
    Package,
    TrendingUp,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const STATS = [
    {
        label:   'Pending Prescriptions',
        value:   '5',
        sub:     '2 urgent',
        icon:    FileText,
        color:   'bg-orange-50 text-orange-600',
        border:  'border-orange-100',
        path:    '/admin/prescriptions',
    },
    {
        label:   'Orders Today',
        value:   '18',
        sub:     '3 pending dispatch',
        icon:    ShoppingBag,
        color:   'bg-blue-50 text-blue-600',
        border:  'border-blue-100',
        path:    '/admin/orders',
    },
    {
        label:   'Low Stock Medicines',
        value:   '4',
        sub:     'Need restocking',
        icon:    Package,
        color:   'bg-red-50 text-red-600',
        border:  'border-red-100',
        path:    '/admin/inventory',
    },
    {
        label:   "Revenue Today",
        value:   '₹4,280',
        sub:     '↑ 12% vs yesterday',
        icon:    TrendingUp,
        color:   'bg-green-50 text-green-600',
        border:  'border-green-100',
        path:    '/admin/orders',
    },
]

const RECENT_PRESCRIPTIONS = [
    { id: 'RX-001', patient: 'Sunita Deshmukh', district: 'Nashik',     time: '10 min ago', status: 'pending' },
    { id: 'RX-002', patient: 'Anil Kulkarni',   district: 'Ahmednagar', time: '25 min ago', status: 'pending' },
    { id: 'RX-003', patient: 'Priya More',       district: 'Pune',       time: '1 hr ago',   status: 'reviewed' },
]

const RECENT_ORDERS = [
    { id: 'DP-142', patient: 'Rajesh Patil',    amount: '₹198', status: 'dispatched', time: '2 hr ago' },
    { id: 'DP-141', patient: 'Meena Joshi',      amount: '₹450', status: 'delivered',  time: '3 hr ago' },
    { id: 'DP-140', patient: 'Suresh Kale',      amount: '₹120', status: 'confirmed',  time: '4 hr ago' },
]

const STATUS_BADGE = {
    pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    reviewed:  'bg-blue-100 text-blue-700 border-blue-200',
    confirmed: 'bg-purple-100 text-purple-700 border-purple-200',
    dispatched:'bg-orange-100 text-orange-700 border-orange-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
}

const STATUS_ICON = {
    pending:   Clock,
    reviewed:  CheckCircle,
    confirmed: CheckCircle,
    dispatched:Truck,
    delivered: CheckCircle,
}

export default function AdminDashboard() {
    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Welcome ── */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Good morning, Dhruv 👋</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Here's what's happening at Dhruv Pharma today — Wednesday, 28 Oct 2024
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {STATS.map((stat) => (
                        <Link key={stat.label} to={stat.path}>
                            <div className={`bg-white rounded-xl border ${stat.border} shadow-sm p-5 hover:shadow-md transition-all cursor-pointer`}>
                                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                                    <stat.icon size={18} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
                                <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-[10px] text-gray-400">{stat.sub}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── Alert: Pending Prescriptions ── */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-orange-800">
                            5 prescriptions are waiting for your review
                        </p>
                        <p className="text-xs text-orange-600 mt-0.5">
                            2 prescriptions have been waiting for over 30 minutes. Please review them promptly.
                        </p>
                    </div>
                    <Link
                        to="/admin/prescriptions"
                        className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                        Review Now
                    </Link>
                </div>

                {/* ── Recent Prescriptions + Orders ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recent Prescriptions */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <h2 className="font-semibold text-gray-800 text-sm">Recent Prescriptions</h2>
                            <Link to="/admin/prescriptions" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                                View all <ArrowRight size={11} />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {RECENT_PRESCRIPTIONS.map((rx) => {
                                const Icon = STATUS_ICON[rx.status]
                                return (
                                    <div key={rx.id} className="flex items-center gap-3 px-5 py-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                            {rx.patient[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{rx.patient}</p>
                                            <p className="text-[10px] text-gray-400">{rx.district} · {rx.time}</p>
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border capitalize flex items-center gap-1 ${STATUS_BADGE[rx.status]}`}>
                                            <Icon size={10} /> {rx.status}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <h2 className="font-semibold text-gray-800 text-sm">Recent Orders</h2>
                            <Link to="/admin/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                                View all <ArrowRight size={11} />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {RECENT_ORDERS.map((order) => {
                                const Icon = STATUS_ICON[order.status]
                                return (
                                    <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                                            {order.patient[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{order.patient}</p>
                                            <p className="text-[10px] text-gray-400">{order.id} · {order.time}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-gray-800">{order.amount}</p>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize flex items-center gap-1 mt-0.5 ${STATUS_BADGE[order.status]}`}>
                                                <Icon size={10} /> {order.status}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
