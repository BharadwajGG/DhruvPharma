import React, { useRef } from 'react'
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react'

export default function OrderInvoiceModal({ order, isOpen, onClose }) {
    const printRef = useRef(null)

    if (!isOpen || !order) return null

    // Parse items if string
    let items = []
    try {
        items = typeof order.items === 'string' ? json.parse(order.items) : (order.items || [])
    } catch {
        items = order.items || []
    }

    const subtotal = Number(order.subtotal || order.totalAmount || 0)
    const discount = Number(order.discount || 0)
    const deliveryFee = Number(order.deliveryFee || order.delivery_fee || 0)
    const totalAmount = Number(order.totalAmount || order.amount || 0)

    // Calculate GST (Standard 5% pharma tax: 2.5% CGST + 2.5% SGST)
    const taxableSubtotal = (subtotal / 1.05).toFixed(2)
    const cgst = ((subtotal - Number(taxableSubtotal)) / 2).toFixed(2)
    const sgst = cgst

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Modal Action Bar (Hidden in Print) */}
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                            TAX INVOICE
                        </span>
                        <span className="text-sm font-semibold text-slate-300">#{order.id || order.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Printer size={14} />
                            <span>Print / Save as PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto font-sans text-slate-800 text-xs bg-white">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                                    DP
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                    DHRUV PHARMA
                                </h1>
                            </div>
                            <p className="text-[11px] font-semibold text-emerald-700">Retail & Wholesale Chemist</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                Opp. Civil Hospital, Main Road, Nandurbar – 425412 (Maharashtra)<br />
                                <strong>Helpline:</strong> +91 9503500725 • <strong>Email:</strong> orders@dhruvpharma.com
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-600">
                                <span><strong>D.L. No.:</strong> MH-NDB-20B-184920 / 21B-184921</span>
                                <span><strong>GSTIN:</strong> 27AABCD1234F1Z5</span>
                                <span><strong>FSSAI:</strong> 11521045000123</span>
                            </div>
                        </div>

                        <div className="text-left sm:text-right">
                            <span className="inline-block bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded text-[11px] mb-2">
                                ORIGINAL TAX INVOICE
                            </span>
                            <div className="space-y-0.5 text-[11px]">
                                <p><span className="text-slate-500">Invoice No:</span> <strong className="font-mono text-slate-900">INV-{order.id || order.orderId}</strong></p>
                                <p><span className="text-slate-500">Date:</span> <strong>{order.date || order.createdAt || new Date().toLocaleDateString('en-IN')}</strong></p>
                                <p><span className="text-slate-500">Payment:</span> <span className="uppercase font-bold text-emerald-700">{order.paymentMethod || 'COD'}</span> ({order.paymentStatus || 'Pending'})</p>
                                <p><span className="text-slate-500">Delivery Status:</span> <strong className="uppercase text-slate-800">{order.status || 'Confirmed'}</strong></p>
                            </div>
                        </div>
                    </div>

                    {/* Patient & Delivery Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Patient / Billed To
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">
                                {order.customerName || order.patient || 'Valued Customer'}
                            </h3>
                            <p className="text-slate-600 mt-0.5">Phone: <strong>{order.phone || '—'}</strong></p>
                            {order.email && <p className="text-slate-500">Email: {order.email}</p>}
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Delivery Address & Service Area
                            </span>
                            <p className="text-slate-700 leading-relaxed font-medium">
                                {order.address || 'Standard Delivery'}
                            </p>
                            <p className="mt-1 text-slate-500">
                                <strong>District:</strong> {order.district || 'Nandurbar'} • <strong>PIN:</strong> {order.pincode || '425412'}
                            </p>
                            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                Verified Service Area (3–4 Days Delivery)
                            </p>
                        </div>
                    </div>

                    {/* Medicines Itemized Table */}
                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-300 text-[10px] uppercase font-bold text-slate-500 bg-slate-50/70">
                                    <th className="py-2 px-2">#</th>
                                    <th className="py-2 px-3">Item Description</th>
                                    <th className="py-2 px-2">HSN</th>
                                    <th className="py-2 px-2 text-center">Qty</th>
                                    <th className="py-2 px-2 text-right">MRP (₹)</th>
                                    <th className="py-2 px-2 text-right">Rate (₹)</th>
                                    <th className="py-2 px-3 text-right">Total (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {items.map((item, index) => {
                                    const qty = item.qty || item.quantity || 1
                                    const price = Number(item.price || item.sellingPrice || 0)
                                    const itemMrp = Number(item.mrp || price)
                                    const lineTotal = (qty * price).toFixed(2)

                                    return (
                                        <tr key={index} className="hover:bg-slate-50/50">
                                            <td className="py-2.5 px-2 text-slate-400 font-mono">{index + 1}</td>
                                            <td className="py-2.5 px-3">
                                                <p className="font-bold text-slate-900">{item.name}</p>
                                                <p className="text-[10px] text-slate-400">{item.brand || item.manufacturer || 'Dhruv Pharma'}</p>
                                            </td>
                                            <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500">3004</td>
                                            <td className="py-2.5 px-2 text-center font-bold text-slate-900">{qty}</td>
                                            <td className="py-2.5 px-2 text-right text-slate-400 font-mono">₹{itemMrp.toFixed(2)}</td>
                                            <td className="py-2.5 px-2 text-right font-mono font-semibold">₹{price.toFixed(2)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{lineTotal}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Tax & Total Summary */}
                    <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                        {/* GST Breakdown Table */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[10px] space-y-1.5">
                            <span className="font-bold text-slate-800 uppercase block mb-1">
                                GST Statutory Breakdown (Pharma 5%)
                            </span>
                            <div className="flex justify-between text-slate-600">
                                <span>Taxable Goods Value:</span>
                                <span className="font-mono font-semibold">₹{taxableSubtotal}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Central GST (CGST @ 2.5%):</span>
                                <span className="font-mono font-semibold">₹{cgst}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>State GST (SGST @ 2.5%):</span>
                                <span className="font-mono font-semibold">₹{sgst}</span>
                            </div>
                            <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                                <span>Total GST Included:</span>
                                <span className="font-mono">₹{(Number(cgst) + Number(sgst)).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Financial Totals */}
                        <div className="space-y-1.5 text-xs text-slate-700">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Items Subtotal:</span>
                                <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-emerald-700 font-semibold">
                                    <span>Discount / Coupon Applied:</span>
                                    <span className="font-mono">- ₹{discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-500">Delivery Charges:</span>
                                <span className="font-mono font-semibold">
                                    {deliveryFee === 0 ? <span className="text-emerald-700">FREE</span> : `₹${deliveryFee.toFixed(2)}`}
                                </span>
                            </div>
                            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline text-sm font-black text-slate-900">
                                <span>Grand Total:</span>
                                <span className="font-mono text-base text-emerald-800">₹{totalAmount.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 text-right mt-0.5">Inclusive of all central & state taxes</p>
                        </div>
                    </div>

                    {/* Pharmacist Verification & Terms */}
                    <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-4">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-emerald-800 font-bold">
                                <ShieldCheck size={13} className="text-emerald-600" />
                                <span>100% Genuine Medicines • Batch Inspected by Registered Pharmacist</span>
                            </div>
                            <p>Terms: Goods once sold will be replaced only in case of manufacturer defect. Keep in cool & dry place.</p>
                        </div>
                        <div className="text-center sm:text-right">
                            <div className="h-8 border-b border-dashed border-slate-400 w-36 mb-1 mx-auto sm:ml-auto"></div>
                            <span className="font-semibold text-slate-700">Authorized Signatory</span>
                            <p className="text-[9px] text-slate-400">Dhruv Pharma Nandurbar</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

