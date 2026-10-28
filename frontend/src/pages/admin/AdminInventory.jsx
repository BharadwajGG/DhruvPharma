import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    Search,
    Plus,
    Edit,
    Trash2,
    AlertTriangle,
    Package,
    X,
    CheckCircle,
} from 'lucide-react'

const INVENTORY = [
    { id: 1,  name: 'Metformin 500mg',       brand: 'Glucophage',  category: 'Diabetes Care',  price: 45,  mrp: 60,  stock: 120, minStock: 20, requires_rx: true  },
    { id: 2,  name: 'Metformin 1000mg',      brand: 'Glycomet',    category: 'Diabetes Care',  price: 80,  mrp: 110, stock: 8,   minStock: 15, requires_rx: true  },
    { id: 3,  name: 'Amlodipine 5mg',        brand: 'Norvasc',     category: 'Heart & BP',     price: 55,  mrp: 75,  stock: 85,  minStock: 20, requires_rx: true  },
    { id: 4,  name: 'Telmisartan 40mg',      brand: 'Telma',       category: 'Heart & BP',     price: 90,  mrp: 130, stock: 5,   minStock: 15, requires_rx: true  },
    { id: 5,  name: 'Vitamin D3 60K IU',     brand: 'Calcirol',    category: 'Vitamins',        price: 90,  mrp: 120, stock: 200, minStock: 30, requires_rx: false },
    { id: 6,  name: 'Vitamin B12 500mcg',    brand: 'Cobadex',     category: 'Vitamins',        price: 55,  mrp: 70,  stock: 3,   minStock: 20, requires_rx: false },
    { id: 7,  name: 'Paracetamol 500mg',     brand: 'Crocin',      category: 'Pain Relief',     price: 18,  mrp: 25,  stock: 350, minStock: 50, requires_rx: false },
    { id: 8,  name: 'Ibuprofen 400mg',       brand: 'Brufen',      category: 'Pain Relief',     price: 28,  mrp: 40,  stock: 45,  minStock: 20, requires_rx: false },
    { id: 9,  name: 'Pantoprazole 40mg',     brand: 'Pan-D',       category: 'Digestive',       price: 60,  mrp: 85,  stock: 12,  minStock: 15, requires_rx: true  },
    { id: 10, name: 'Cetirizine 10mg',       brand: 'Okacet',      category: 'Allergy',         price: 22,  mrp: 30,  stock: 90,  minStock: 20, requires_rx: false },
]

const CATEGORIES = ['All', 'Diabetes Care', 'Heart & BP', 'Vitamins', 'Pain Relief', 'Digestive', 'Allergy']

const BLANK_FORM = { name: '', brand: '', category: '', price: '', mrp: '', stock: '', minStock: '', requires_rx: false }

export default function AdminInventory() {
    const [items, setItems]           = useState(INVENTORY)
    const [search, setSearch]         = useState('')
    const [catFilter, setCatFilter]   = useState('All')
    const [showModal, setShowModal]   = useState(false)
    const [editItem, setEditItem]     = useState(null)
    const [form, setForm]             = useState(BLANK_FORM)

    const lowStock = items.filter((i) => i.stock <= i.minStock)

    const displayed = items.filter((item) => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                            item.brand.toLowerCase().includes(search.toLowerCase())
        const matchCat = catFilter === 'All' || item.category === catFilter
        return matchSearch && matchCat
    })

    const openAdd = () => {
        setEditItem(null)
        setForm(BLANK_FORM)
        setShowModal(true)
    }

    const openEdit = (item) => {
        setEditItem(item)
        setForm({ ...item, price: String(item.price), mrp: String(item.mrp), stock: String(item.stock), minStock: String(item.minStock) })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editItem) {
            setItems((prev) => prev.map((i) =>
                i.id === editItem.id
                    ? { ...i, ...form, price: +form.price, mrp: +form.mrp, stock: +form.stock, minStock: +form.minStock }
                    : i
            ))
        } else {
            setItems((prev) => [...prev, { ...form, id: Date.now(), price: +form.price, mrp: +form.mrp, stock: +form.stock, minStock: +form.minStock }])
        }
        setShowModal(false)
    }

    const handleDelete = (id) => {
        if (window.confirm('Delete this medicine from inventory?')) {
            setItems((prev) => prev.filter((i) => i.id !== id))
        }
    }

    const getStockStyle = (item) => {
        if (item.stock === 0)             return 'text-red-600 bg-red-50 border-red-200'
        if (item.stock <= item.minStock)  return 'text-orange-600 bg-orange-50 border-orange-200'
        return 'text-green-600 bg-green-50 border-green-200'
    }

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {items.length} medicines · {lowStock.length} need restocking
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                    >
                        <Plus size={16} />
                        Add Medicine
                    </button>
                </div>

                {/* ── Low Stock Alert ── */}
                {lowStock.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-orange-800">
                                {lowStock.length} medicines are running low on stock
                            </p>
                            <p className="text-xs text-orange-600 mt-0.5">
                                {lowStock.map((i) => i.name).join(' · ')}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Search + Category Filter ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Search size={16} className="ml-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search medicines..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-3 py-3 text-sm outline-none"
                        />
                    </div>
                    <select
                        value={catFilter}
                        onChange={(e) => setCatFilter(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 cursor-pointer"
                    >
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                </div>

                {/* ── Inventory Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {['Medicine', 'Category', 'Price / MRP', 'Stock', 'Rx', 'Actions'].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayed.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="font-semibold text-gray-800">{item.name}</p>
                                            <p className="text-[10px] text-gray-400">{item.brand}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-semibold text-gray-800">₹{item.price}</span>
                                            <span className="text-gray-400 text-xs ml-1 line-through">₹{item.mrp}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStockStyle(item)}`}>
                                                {item.stock === 0 ? 'Out of Stock' : `${item.stock} units`}
                                            </span>
                                            {item.stock > 0 && item.stock <= item.minStock && (
                                                <p className="text-[9px] text-orange-500 mt-0.5">Min: {item.minStock}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {item.requires_rx ? (
                                                <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full font-semibold">
                                                    Rx
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full font-semibold">
                                                    OTC
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Edit size={11} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={11} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {displayed.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <Package size={40} className="mx-auto mb-2 text-gray-200" />
                            <p className="text-sm">No medicines found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Add / Edit Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                            <h2 className="font-bold text-gray-900">
                                {editItem ? 'Edit Medicine' : 'Add New Medicine'}
                            </h2>
                            <button onClick={() => setShowModal(false)}>
                                <X size={18} className="text-gray-400 hover:text-gray-700" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Medicine Name', key: 'name',     placeholder: 'e.g. Metformin 500mg', span: 2 },
                                    { label: 'Brand',         key: 'brand',    placeholder: 'e.g. Glucophage',     span: 1 },
                                    { label: 'Category',      key: 'category', placeholder: 'Diabetes Care',       span: 1, type: 'select' },
                                    { label: 'Price (₹)',     key: 'price',    placeholder: '45',                  span: 1, type: 'number' },
                                    { label: 'MRP (₹)',       key: 'mrp',      placeholder: '60',                  span: 1, type: 'number' },
                                    { label: 'Stock (units)', key: 'stock',    placeholder: '100',                 span: 1, type: 'number' },
                                    { label: 'Min Stock',     key: 'minStock', placeholder: '20',                  span: 1, type: 'number' },
                                ].map((field) => (
                                    <div key={field.key} className={field.span === 2 ? 'col-span-2' : ''}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{field.label}</label>
                                        {field.type === 'select' ? (
                                            <select
                                                value={form[field.key]}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                                            >
                                                <option value="">Select category</option>
                                                {CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type || 'text'}
                                                placeholder={field.placeholder}
                                                value={form[field.key]}
                                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Requires Rx toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.requires_rx}
                                    onChange={(e) => setForm({ ...form, requires_rx: e.target.checked })}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700 font-medium">Prescription Required (Rx)</span>
                            </label>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                                >
                                    <CheckCircle size={16} />
                                    {editItem ? 'Save Changes' : 'Add Medicine'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
