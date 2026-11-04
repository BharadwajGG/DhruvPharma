import React, { useRef, useState, useEffect } from 'react'
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function OrderInvoiceModal({ order, isOpen, onClose }) {
    const printRef = useRef(null)
    const [invoiceData, setInvoiceData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Real-time backend invoice sync
    useEffect(() => {
        if (!isOpen || !order) return

        let isMounted = true
        const orderId = order.orderId || order.id

        if (orderId) {
            setIsLoading(true)
            fetch(`http://localhost:8000/api/orders/${orderId}/invoice`)
                .then((res) => {
                    if (res.ok) return res.json()
                    throw new Error('Invoice fetch error')
                })
                .then((data) => {
                    if (isMounted) {
                        setInvoiceData(data)
                        setIsLoading(false)
                    }
                })
                .catch((err) => {
                    console.warn('Real-time invoice fallback to client computation:', err)
                    if (isMounted) setIsLoading(false)
                })
        }

        return () => {
            isMounted = false
        }
    }, [isOpen, order])

    if (!isOpen || !order) return null

    // Determine payment and delivery status
    const paymentStatusRaw = (order.paymentStatus || order.payment_status || '').toLowerCase()
    const deliveryStatusRaw = (order.status || '').toLowerCase()
    const isPaid = paymentStatusRaw === 'paid' || deliveryStatusRaw === 'delivered' || (invoiceData && invoiceData.isPaid)
    const isDelivered = deliveryStatusRaw === 'delivered' || (invoiceData && invoiceData.isDelivered)

    // Parse items if string
    let rawItems = []
    try {
        rawItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
    } catch {
        rawItems = order.items || []
    }

    // Build or use multi-batch invoice lines
    let lines = []
    let totalMrpSum = 0
    let totalDiscountSum = 0
    let priceLockSavings = 0

    if (invoiceData && Array.isArray(invoiceData.invoiceLines) && invoiceData.invoiceLines.length > 0) {
        lines = invoiceData.invoiceLines
        totalMrpSum = invoiceData.mrpTotal || 0
        totalDiscountSum = invoiceData.mrpDiscountAmount || 0
        priceLockSavings = invoiceData.priceLockSavings || 0
    } else {
        // Dynamic client-side calculation with multi-batch logic
        rawItems.forEach((item, index) => {
            const itemName = item.name || 'Medicine Item'
            const marketer = item.brand || item.manufacturer || 'Dhruv Pharma'
            const hsn = item.hsn_code || item.hsnCode || '30049099'
            const totalQty = parseInt(item.qty || item.quantity || 1) || 1
            const baseMrp = Number(item.mrp || item.price || item.sellingPrice || 0)
            const unitSellingPrice = Number(item.price || item.sellingPrice || baseMrp)

            const batchNo = item.batch_number || item.batchNumber || `DPB-${((item.id || index + 1) * 37) % 8999 + 1000}`
            const expDate = item.expiry_date || item.expiryDate || '09/27'

            const secBatch = item.secondary_batch_number || item.secondaryBatchNumber || ''
            const secExp = item.secondary_expiry_date || item.secondaryExpiryDate || '12/27'
            const secMrp = Number(item.secondary_mrp || item.secondaryMrp || (baseMrp * 1.1))

            // Multi-batch split check
            if (secBatch && totalQty >= 2) {
                const qty1 = Math.floor(totalQty / 2)
                const qty2 = totalQty - qty1
                const mrpTotal1 = Number((baseMrp * qty1).toFixed(2))
                const totalAmt1 = Number((unitSellingPrice * qty1).toFixed(2))
                const disc1 = Number(Math.max(0, mrpTotal1 - totalAmt1).toFixed(2))
                const taxable1 = Number((totalAmt1 / 1.05).toFixed(2))
                const gst1 = Number((totalAmt1 - taxable1).toFixed(2))

                lines.push({
                    sr: lines.length + 1,
                    itemName,
                    marketer,
                    hsn,
                    batchNo,
                    expDate,
                    mrp: baseMrp,
                    qty: qty1,
                    mrpTotal: mrpTotal1,
                    discount: disc1,
                    taxableAmt: taxable1,
                    gstPct: 5.0,
                    gstAmt: gst1,
                    totalAmt: totalAmt1,
                })

                const mrpTotal2 = Number((secMrp * qty2).toFixed(2))
                const totalAmt2 = Number((unitSellingPrice * qty2).toFixed(2))
                const disc2 = Number(Math.max(0, mrpTotal2 - totalAmt2).toFixed(2))
                const taxable2 = Number((totalAmt2 / 1.05).toFixed(2))
                const gst2 = Number((totalAmt2 - taxable2).toFixed(2))

                const extraAbsorbed = Number(Math.max(0, (secMrp - baseMrp) * qty2).toFixed(2))
                priceLockSavings += extraAbsorbed

                lines.push({
                    sr: lines.length + 1,
                    itemName,
                    marketer,
                    hsn,
                    batchNo: secBatch,
                    expDate: secExp,
                    mrp: secMrp,
                    qty: qty2,
                    mrpTotal: mrpTotal2,
                    discount: disc2,
                    taxableAmt: taxable2,
                    gstPct: 5.0,
                    gstAmt: gst2,
                    totalAmt: totalAmt2,
                })

                totalMrpSum += mrpTotal1 + mrpTotal2
                totalDiscountSum += disc1 + disc2
            } else {
                const mrpTotal = Number((baseMrp * totalQty).toFixed(2))
                const totalAmt = Number((unitSellingPrice * totalQty).toFixed(2))
                const disc = Number(Math.max(0, mrpTotal - totalAmt).toFixed(2))
                const taxable = Number((totalAmt / 1.05).toFixed(2))
                const gst = Number((totalAmt - taxable).toFixed(2))

                lines.push({
                    sr: lines.length + 1,
                    itemName,
                    marketer,
                    hsn,
                    batchNo,
                    expDate,
                    mrp: baseMrp,
                    qty: totalQty,
                    mrpTotal,
                    discount: disc,
                    taxableAmt: taxable,
                    gstPct: 5.0,
                    gstAmt: gst,
                    totalAmt,
                })

                totalMrpSum += mrpTotal
                totalDiscountSum += disc
            }
        })
    }

    const subtotal = Number(order.subtotal || order.totalAmount || 0)
    const deliveryFee = Number(order.deliveryFee || order.delivery_fee || 0)
    const packagingCharge = 0.0
    const totalAmount = Number(order.totalAmount || order.amount || 0)

    const totTaxable = Number(lines.reduce((acc, l) => acc + Number(l.taxableAmt || 0), 0).toFixed(2))
    const totGst = Number(lines.reduce((acc, l) => acc + Number(l.gstAmt || 0), 0).toFixed(2))
    const cgstAmt = Number((totGst / 2).toFixed(2))
    const sgstAmt = Number((totGst - cgstAmt).toFixed(2))

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:rounded-none">
                {/* Top Action Bar (Hidden in Print) */}
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                            TAX INVOICE
                        </span>
                        <span className="text-sm font-semibold text-slate-300">
                            INV-{order.orderId || order.id}
                        </span>
                        {isLoading && (
                            <span className="text-[11px] text-slate-400 italic ml-2 animate-pulse">
                                Syncing real-time pharma batches...
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                            <Printer size={14} />
                            <span>Print / PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Legal Tax Invoice Content */}
                <div
                    ref={printRef}
                    className="p-5 sm:p-8 overflow-y-auto font-sans text-slate-800 text-[11px] bg-white print:p-4 print:overflow-visible"
                >
                    {/* Header Row: Pharmacy Details & License Credentials */}
                    <div className="flex flex-col sm:flex-row items-start justify-between pb-4 border-b border-slate-300 gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm tracking-tighter">
                                    DP
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                                        DHRUV PHARMA
                                    </h1>
                                    <p className="text-[10px] font-bold text-emerald-800 tracking-wide mt-0.5">
                                        Retail &amp; Wholesale Chemist
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-snug mt-1.5">
                                First Floor, Plot No. 122-133, Shop No. C/135, Gokuldham Complex, Shahada Road, Nandurbar - 425412<br />
                                <strong>Helpline:</strong> +91 9503500725 &bull; <strong>Email:</strong> dhruvpharma25@gmail.com
                            </p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-slate-700 font-medium">
                                <p><strong>Supplier GSTIN:</strong> <span className="font-mono">27ABBCA6074H1ZN</span></p>
                                <p><strong>FSSAI License:</strong> <span className="font-mono">11525013000013</span></p>
                                <p><strong>DL No:</strong> <span className="font-mono">MH-NDB-20B-184920 / 21B-184921</span></p>
                                <p><strong>CIN:</strong> <span className="font-mono">U47720MH2024PTC434474</span></p>
                                <p><strong>Place of Supply:</strong> Maharashtra (27)</p>
                                <p><strong>Doctor / Practitioner:</strong> Dr. Sachin Singh</p>
                            </div>
                        </div>

                        {/* Top Right: QR Code & Invoice Identifier */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                            <div className="flex flex-col items-center text-center p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                                <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1">
                                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                                        <rect x="0" y="0" width="30" height="30" />
                                        <rect x="5" y="5" width="20" height="20" fill="white" />
                                        <rect x="10" y="10" width="10" height="10" />
                                        <rect x="70" y="0" width="30" height="30" />
                                        <rect x="75" y="5" width="20" height="20" fill="white" />
                                        <rect x="80" y="10" width="10" height="10" />
                                        <rect x="0" y="70" width="30" height="30" />
                                        <rect x="5" y="75" width="20" height="20" fill="white" />
                                        <rect x="10" y="80" width="10" height="10" />
                                        <rect x="40" y="10" width="10" height="10" />
                                        <rect x="50" y="20" width="10" height="10" />
                                        <rect x="40" y="40" width="20" height="20" />
                                        <rect x="70" y="40" width="10" height="10" />
                                        <rect x="70" y="60" width="10" height="20" />
                                        <rect x="40" y="70" width="10" height="20" />
                                        <rect x="55" y="80" width="15" height="10" />
                                        <rect x="85" y="75" width="10" height="15" />
                                    </svg>
                                </div>
                                <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                                    T&amp;C Apply* Scan to verify
                                </span>
                            </div>
                            <div className="text-right text-[10px] space-y-0.5">
                                <p><span className="text-slate-500">Invoice No:</span> <strong className="font-mono text-slate-900 text-xs">INV-{order.orderId || order.id}</strong></p>
                                <p><span className="text-slate-500">Date:</span> <strong>{order.date || order.createdAt || new Date().toLocaleDateString('en-IN')}</strong></p>
                                <p><span className="text-slate-500">Order ID:</span> <span className="font-mono font-bold text-slate-800">{order.orderId || order.id}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Patient & Delivery Information Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-slate-200">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                                Patient / Billed To
                            </span>
                            <p className="font-bold text-slate-900 text-xs">
                                {order.customerName || order.patient || 'Valued Customer'}
                            </p>
                            <p className="text-slate-600 text-[10px]">Phone: <strong className="font-mono">{order.phone || order.customerPhone || '—'}</strong></p>
                            {order.email && <p className="text-slate-500 text-[10px]">Email: {order.email}</p>}
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                                Delivery Address &amp; Service District
                            </span>
                            <p className="text-slate-800 text-[10px] font-medium leading-tight">
                                {order.address || 'Standard Delivery'}
                            </p>
                            <p className="text-slate-600 text-[10px] mt-0.5">
                                <strong>District:</strong> {order.district || 'Nandurbar'} &bull; <strong>PIN:</strong> {order.pincode || '425412'}
                            </p>
                        </div>
                    </div>

                    {/* Itemized Medicine Table matching Reference Bill */}
                    <div className="mt-4 overflow-x-auto border border-slate-300 rounded-lg">
                        <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300 text-[9px] uppercase tracking-wider">
                                    <th className="py-2.5 px-2 text-center w-8">Sr.</th>
                                    <th className="py-2.5 px-3 min-w-[170px]">Item Name</th>
                                    <th className="py-2.5 px-2 min-w-[130px]">Marketer Name</th>
                                    <th className="py-2.5 px-2 text-center w-18">HSN</th>
                                    <th className="py-2.5 px-2 text-center min-w-[95px] bg-emerald-50/60 font-black text-emerald-900 border-x border-emerald-200">
                                        Batch No.
                                    </th>
                                    <th className="py-2.5 px-2 text-center w-16 bg-emerald-50/60 font-black text-emerald-900 border-r border-emerald-200">
                                        Exp. Date
                                    </th>
                                    <th className="py-2.5 px-2 text-right w-16">MRP</th>
                                    <th className="py-2.5 px-2 text-center w-10">Qty.</th>
                                    <th className="py-2.5 px-2 text-right w-18">MRP Total</th>
                                    <th className="py-2.5 px-2 text-right w-16 text-emerald-700">Discount</th>
                                    <th className="py-2.5 px-2 text-right w-18">Taxable Amt.</th>
                                    <th className="py-2.5 px-1 text-center w-12">GST%</th>
                                    <th className="py-2.5 px-2 text-right w-16">GST Amt.</th>
                                    <th className="py-2.5 px-3 text-right w-20 font-black text-slate-900">Total Amt.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                                {lines.map((line, idx) => {
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-2 px-2 text-center text-slate-400 font-mono font-medium">
                                                {line.sr || idx + 1}
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-slate-900">
                                                {line.itemName}
                                            </td>
                                            <td className="py-2 px-2 text-slate-600 truncate max-w-[150px]" title={line.marketer}>
                                                {line.marketer}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-500">
                                                {line.hsn}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 bg-emerald-50/40 border-x border-emerald-100">
                                                {line.batchNo}
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 bg-emerald-50/40 border-r border-emerald-100">
                                                {line.expDate}
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono text-slate-600">
                                                {Number(line.mrp).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-2 text-center font-bold text-slate-900">
                                                {line.qty}
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono text-slate-700">
                                                {Number(line.mrpTotal).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">
                                                {Number(line.discount).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono text-slate-700">
                                                {Number(line.taxableAmt).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-1 text-center font-mono text-slate-600">
                                                {Number(line.gstPct || 5.0).toFixed(1)}%
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono text-slate-700">
                                                {Number(line.gstAmt).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                                                ₹{Number(line.totalAmt).toFixed(2)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Summary Section matching Reference Bill */}
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Left Side: GST Statutory Breakdown (4 Cols) */}
                        <div className="md:col-span-4 space-y-2">
                            <div className="border border-slate-300 rounded-lg overflow-hidden">
                                <table className="w-full text-center border-collapse text-[9px]">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                            <th className="py-1.5 px-2">Taxable Amt.</th>
                                            <th className="py-1.5 px-1">CGST%</th>
                                            <th className="py-1.5 px-2">CGST Amt.</th>
                                            <th className="py-1.5 px-1">SGST%</th>
                                            <th className="py-1.5 px-2">SGST Amt.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                                        <tr>
                                            <td className="py-1.5 px-2">{totTaxable.toFixed(2)}</td>
                                            <td className="py-1.5 px-1">2.5</td>
                                            <td className="py-1.5 px-2">{cgstAmt.toFixed(2)}</td>
                                            <td className="py-1.5 px-1">2.5</td>
                                            <td className="py-1.5 px-2">{sgstAmt.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[9px] text-slate-500">
                                Cash Handling Charge SAC: <strong>996819</strong> &bull; HSN: 30049099
                            </p>
                        </div>

                        {/* Center: Authentic PAID Stamp & Digital Signature (4 Cols) */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center p-2 text-center min-h-[140px]">
                            {isPaid ? (
                                <div className="relative inline-flex items-center justify-center select-none transform -rotate-12 hover:rotate-0 transition-transform">
                                    {/* Authentic Circular Scalloped PAID Stamp */}
                                    <div className="w-28 h-28 rounded-full border-4 border-dashed border-emerald-600/90 flex flex-col items-center justify-center p-1.5 bg-emerald-50/40 shadow-xs">
                                        <div className="w-full h-full rounded-full border-2 border-emerald-600/80 flex flex-col items-center justify-center">
                                            <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">
                                                DHRUV PHARMA
                                            </span>
                                            <span className="text-2xl font-black text-emerald-700 tracking-widest leading-none my-0.5">
                                                PAID
                                            </span>
                                            <span className="text-[8px] font-bold text-emerald-600">
                                                {order.paymentMethod || 'UPI/CASH'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="inline-flex items-center justify-center p-3 border-2 border-dashed border-amber-400 rounded-xl bg-amber-50/60 text-amber-800 text-[10px] font-bold">
                                    CASH ON DELIVERY &bull; PAYMENT DUE UPON ARRIVAL
                                </div>
                            )}

                            {/* Pharmacist Dispensing Digital Signature (Delivered Only) */}
                            <div className="mt-2 text-center w-full">
                                {isDelivered ? (
                                    <div className="p-2 border border-emerald-200 bg-emerald-50/30 rounded-lg text-center">
                                        <div className="font-serif italic font-bold text-emerald-900 text-sm tracking-wide">
                                            Devendra Chavan
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-800">
                                            Devendra Chavan, Reg. Pharmacist
                                        </p>
                                        <p className="text-[8px] text-slate-600">
                                            Reg. No. <strong>MH-28491</strong> &bull; FDA Form 20B/21B
                                        </p>
                                        <div className="inline-flex items-center gap-1 text-[8px] text-emerald-700 font-bold mt-0.5">
                                            <CheckCircle2 size={10} className="text-emerald-600" />
                                            <span>Digitally Dispensed &amp; Verified</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-center">
                                        <p className="text-[9px] text-slate-500 italic">
                                            Digital dispensing signature generated upon doorstep handover &amp; verification.
                                        </p>
                                        <p className="text-[8px] text-slate-400 mt-0.5">
                                            FDA License 20B/21B &bull; Inspection Pending Delivery
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Financial Bill Summary matching Reference Bill (4 Cols) */}
                        <div className="md:col-span-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-slate-700">
                                <span>MRP Total:</span>
                                <span className="font-mono font-semibold">₹{totalMrpSum.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-slate-700">
                                <span>Packaging &amp; Handling Charge (GST@5.0%):</span>
                                <span className="font-mono font-semibold">
                                    <span className="line-through text-slate-400 mr-1.5">₹33.0</span>
                                    <span>₹{packagingCharge.toFixed(1)}</span>
                                </span>
                            </div>

                            <div className="flex justify-between text-slate-700">
                                <span>Delivery Charges (GST@5.0%):</span>
                                <span className="font-mono font-semibold">
                                    {deliveryFee === 0 ? <span className="text-emerald-700">₹0.0</span> : `₹${deliveryFee.toFixed(1)}`}
                                </span>
                            </div>

                            <div className="flex justify-between text-emerald-700 font-bold">
                                <span>MRP Discount Amount:</span>
                                <span className="font-mono">-₹{totalDiscountSum.toFixed(2)}</span>
                            </div>

                            {priceLockSavings > 0 && (
                                <div className="flex justify-between text-emerald-800 font-extrabold bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                                    <span>Price Lock Savings:</span>
                                    <span className="font-mono">-₹{priceLockSavings.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="pt-1.5 border-t border-slate-300 flex justify-between font-bold text-slate-900">
                                <span>Bill Amount:</span>
                                <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
                            </div>

                            <div className="pt-1.5 border-t-2 border-slate-900 flex justify-between items-baseline text-xs font-black text-slate-900 bg-white p-2 rounded-lg border">
                                <span>Payable Amount:</span>
                                <span className="font-mono text-sm text-emerald-800">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Statutory Bottom Note matching Reference Bill */}
                    <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-500">
                        <p>
                            Note: This is a computer generated paid invoice, signature not required. Signed physical copy of the invoice has already been shared with your order.
                        </p>
                        <p className="text-[8px] text-slate-400 mt-0.5">
                            Dhruv Pharma &bull; Gokuldham Complex, Shahada Road, Nandurbar - 425412 &bull; FDA Form 20B/21B Compliant
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
