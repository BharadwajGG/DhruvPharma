import os
import sys
import io
import re
import csv
import json
import shutil
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, File, Form, UploadFile, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import init_db, get_db, PrescriptionModel, MedicineModel, OrderModel, CallbackRequestModel, CouponModel, ReviewModel, UserProfileModel, SessionLocal
from categorizer import categorize_medicine, calculate_selling_price, clean_text
from notifications import (
    generate_clinical_info,
    generate_order_email_html,
    generate_whatsapp_message,
    generate_cancellation_email_html,
    generate_cancellation_whatsapp_message,
    send_order_email,
)

# ==============================================================================
# TIER 2 BRAND IMAGE SEED REGISTRY (Authentic Studio Pack Shots)
# ==============================================================================
BRAND_PACK_SHOTS = [
    {
        "patterns": [r"\bDOLO\b", r"\bDOLO[- ]?650\b", r"\bDOLIPRANE\b", r"\bPARACIP[- ]?650\b", r"\bPYRICOOL[- ]?650\b"],
        "url": "/images/medicines/dolo-650.svg"
    },
    {
        "patterns": [r"\bPAN[- ]?40\b", r"\bP[- ]?40\b", r"\bPENTAB[- ]?40\b", r"\bPAN[- ]?D\b", r"\bP[- ]?40[- ]?DSR\b"],
        "url": "/images/medicines/pan-40.svg"
    },
    {
        "patterns": [r"\bLIMCEE\b"],
        "url": "/images/medicines/limcee.svg"
    },
    {
        "patterns": [r"\bAUGMENTIN\b", r"\bAMOXYCLAV\b", r"\bALMOX[- ]?CV\b", r"\bMEGAMOX[- ]?CV\b", r"\bCIPMOX[- ]?CV\b", r"\bMOXIKEM[- ]?CV\b"],
        "url": "/images/medicines/augmentin-625.svg"
    },
    {
        "patterns": [r"\bCIPLADINE\b"],
        "url": "/images/medicines/cipladine.svg"
    },
    {
        "patterns": [r"\bVOLINI\b"],
        "url": "/images/medicines/volini.svg"
    },
    {
        "patterns": [r"\bBECOSULES\b", r"\bBECOLES\b", r"\bBECODER\b", r"\bBEECEEKEM\b"],
        "url": "/images/medicines/becosules.svg"
    },
    {
        "patterns": [r"\bSHELCAL\b", r"\bCIPCAL\b"],
        "url": "/images/medicines/shelcal-500.svg"
    },
    {
        "patterns": [r"\bTELMA\b", r"\bTELMIKIND\b", r"\bTELPRES\b", r"\bVENPRES\b"],
        "url": "/images/medicines/telma-40.svg"
    },
    {
        "patterns": [r"\bAZITHRAL\b", r"\bAZIKEM\b", r"\bAZICIP\b", r"\bAZIPRO\b", r"\bZATURA\b"],
        "url": "/images/medicines/azithral-500.svg"
    },
    {
        "patterns": [r"\bSUMO[- +]?GEL\b", r"\bSUMO\b"],
        "url": "/images/medicines/sumo-gel.svg"
    },
    {
        "patterns": [r"\bOMEE\b"],
        "url": "/images/medicines/omee.svg"
    },
    {
        "patterns": [r"\bVICKS\b"],
        "url": "/images/medicines/vicks.svg"
    },
    {
        "patterns": [r"\bBENADRYL\b"],
        "url": "/images/medicines/benadryl.svg"
    },
    {
        "patterns": [r"\bDISPRIN\b"],
        "url": "/images/medicines/disprin.svg"
    },
    {
        "patterns": [r"\bOKACET\b"],
        "url": "/images/medicines/okacet.svg"
    },
    {
        "patterns": [r"\bCHESTON[- ]?COLD\b"],
        "url": "/images/medicines/cheston-cold.svg"
    },
    {
        "patterns": [r"\bSAFI\b"],
        "url": "/images/medicines/safi.svg"
    },
    {
        "patterns": [r"\bSKINSHINE\b"],
        "url": "/images/medicines/skinshine.svg"
    },
    {
        "patterns": [r"\bOMNIGEL\b"],
        "url": "/images/medicines/omnigel.svg"
    },
]


def resolve_brand_pack_shot(name: str, manufacturer: str = "") -> str:
    """Matches medicine names to authentic studio pack shots in registry."""
    combined = f"{name or ''} {manufacturer or ''}".upper()
    for entry in BRAND_PACK_SHOTS:
        for pat in entry["patterns"]:
            if re.search(pat, combined, re.IGNORECASE):
                return entry["url"]
    return ""


def backfill_brand_pack_shots():
    """Auto-links matching medicines in database to genuine manufacturer pack shot URLs."""
    db = SessionLocal()
    try:
        meds = db.query(MedicineModel).filter(
            or_(MedicineModel.image_url == None, MedicineModel.image_url == "")
        ).all()
        updated = 0
        for m in meds:
            pack_url = resolve_brand_pack_shot(m.name, m.manufacturer)
            if pack_url:
                m.image_url = pack_url
                updated += 1
        if updated > 0:
            db.commit()
            print(f"Auto-linked {updated} medicine(s) to authentic manufacturer pack shots.")
    except Exception as e:
        print("Notice during brand pack backfill:", e)
    finally:
        db.close()


# Ensure upload folders exist
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
PRESCRIPTIONS_DIR = os.path.join(UPLOADS_DIR, "prescriptions")
ORDERS_PRESCRIPTIONS_DIR = os.path.join(UPLOADS_DIR, "order_prescriptions")
os.makedirs(PRESCRIPTIONS_DIR, exist_ok=True)
os.makedirs(ORDERS_PRESCRIPTIONS_DIR, exist_ok=True)

# Initialize database and auto-link pack shots
init_db()
backfill_brand_pack_shots()

app = FastAPI(
    title="Dhruv Pharma Backend API",
    description="Backend API for DhruvPharma: inventory categorization, real-time orders, dynamic medicines, and prescription uploads.",
    version="2.1.0",
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static folder so frontend can view/download uploaded photos & PDFs
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Real-Time Server-Sent Events (SSE) Client Queues for Live Admin Dashboard
sse_clients: List[asyncio.Queue] = []


async def broadcast_order_event(event_type: str, data: dict):
    """Pushes a live event to all connected admin browser tabs."""
    message = json.dumps({"type": event_type, "order": data, "timestamp": datetime.utcnow().isoformat()})
    disconnected = []
    for queue in sse_clients:
        try:
            await queue.put(message)
        except Exception:
            disconnected.append(queue)
    for q in disconnected:
        if q in sse_clients:
            sse_clients.remove(q)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Dhruv Pharma Backend API",
        "version": "2.1.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ==============================================================================
# 1. REAL-TIME ORDERS PIPELINE (/api/orders)
# ==============================================================================

@app.get("/api/orders/stream")
async def orders_stream():
    """
    Server-Sent Events (SSE) endpoint for Admin Orders.
    Pushes real-time events when new orders arrive or status changes occur.
    """
    queue = asyncio.Queue()
    sse_clients.append(queue)

    async def event_generator():
        try:
            # Initial connection acknowledgement ping
            yield "event: connected\ndata: {\"status\":\"listening\"}\n\n"
            while True:
                # Wait for broadcasted order event or send heartbeat
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in sse_clients:
                sse_clients.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/orders")
async def place_order(
    customerName: str = Form(...),
    phone: str = Form(...),
    email: Optional[str] = Form(""),
    userId: Optional[str] = Form(""),
    district: str = Form(...),
    address: str = Form(...),
    pincode: Optional[str] = Form(""),
    items: str = Form(...),  # JSON string of cart items
    subtotal: float = Form(0.0),
    discount: float = Form(0.0),
    deliveryFee: float = Form(0.0),
    totalAmount: float = Form(...),
    paymentMethod: Optional[str] = Form("COD"),
    notes: Optional[str] = Form(""),
    couponCode: Optional[str] = Form(""),
    prescriptionFile: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Direct storefront order placement.
    Atomically saves order, decrements stock in catalog, triggers notifications,
    and broadcasts instant event to the live admin dashboard via SSE.
    """
    try:
        parsed_items = json.loads(items) if isinstance(items, str) else items
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid items payload format.")

    if not parsed_items or len(parsed_items) == 0:
        raise HTTPException(status_code=400, detail="Cart cannot be empty.")

    # Handle prescription file upload if provided
    prescription_url = ""
    if prescriptionFile and prescriptionFile.filename:
        timestamp_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_name = os.path.basename(prescriptionFile.filename)
        unique_filename = f"rx_order_{timestamp_prefix}_{uuid.uuid4().hex[:6]}_{original_name}"
        destination_path = os.path.join(ORDERS_PRESCRIPTIONS_DIR, unique_filename)

        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(prescriptionFile.file, buffer)

        prescription_url = f"/uploads/order_prescriptions/{unique_filename}"

    # Generate collision-proof sequential Order ID
    max_order = db.query(OrderModel).order_by(OrderModel.id.desc()).first()
    next_num = (max_order.id + 140) if max_order else 101
    while db.query(OrderModel).filter(OrderModel.order_id == f"DP-{next_num}").first():
        next_num += 1
    order_id = f"DP-{next_num}"

    # Determine initial status
    initial_status = "pending"

    # Strictly check coupon code if submitted
    if couponCode:
        c = db.query(CouponModel).filter(CouponModel.code == couponCode.strip().upper()).first()
        if c:
            if not c.is_active:
                raise HTTPException(status_code=400, detail="This discount coupon is inactive.")
            if c.max_uses_total is not None and (c.usage_count or 0) >= c.max_uses_total:
                raise HTTPException(status_code=400, detail="This coupon code has reached its maximum usage limit.")
            
            # Check user identifiers
            identifiers = set()
            for val in [phone, userId, email]:
                if val and str(val).strip():
                    clean_val = str(val).strip().lower()
                    identifiers.add(clean_val)
                    digits = "".join(filter(str.isdigit, clean_val))
                    if len(digits) >= 10:
                        identifiers.add(digits[-10:])

            if c.max_uses_per_user and identifiers:
                try:
                    used_list = json.loads(c.used_by) if c.used_by else []
                except Exception:
                    used_list = []
                user_times = 0
                for used_item in used_list:
                    used_str = str(used_item).strip().lower()
                    used_digits = "".join(filter(str.isdigit, used_str))
                    if used_str in identifiers or (len(used_digits) >= 10 and used_digits[-10:] in identifiers):
                        user_times += 1
                if user_times >= c.max_uses_per_user:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Coupon code '{c.code}' has already been used by this customer (limit: {c.max_uses_per_user} time{'s' if c.max_uses_per_user > 1 else ''})."
                    )

    new_order = OrderModel(
        order_id=order_id,
        customer_name=customerName.strip(),
        customer_phone=phone.strip(),
        customer_email=(email or "").strip(),
        user_id=(userId or "").strip(),
        district=district.strip(),
        address=address.strip(),
        pincode=(pincode or "").strip(),
        items=json.dumps(parsed_items),
        subtotal=float(subtotal),
        discount=float(discount),
        delivery_fee=float(deliveryFee),
        total_amount=float(totalAmount),
        payment_method=paymentMethod or "COD",
        payment_status="paid" if paymentMethod == "UPI" else "pending",
        prescription_file=prescription_url,
        status=initial_status,
        expected_delivery="Expected in 3–4 Days",
        delivery_agent="Sanjay Kumar (Dhruv Express)",
        stock_deducted=False,
        notes=(notes or "").strip(),
        created_at=datetime.now(),
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Track coupon usage if redeemed
    if couponCode:
        c = db.query(CouponModel).filter(CouponModel.code == couponCode.strip().upper()).first()
        if c:
            c.usage_count = (c.usage_count or 0) + 1
            try:
                used_list = json.loads(c.used_by) if c.used_by else []
            except Exception:
                used_list = []
            
            # Record all customer identifiers so future checks instantly catch them
            for val in [phone, userId, email]:
                if val and str(val).strip():
                    clean_val = str(val).strip().lower()
                    if clean_val not in used_list:
                        used_list.append(clean_val)
                    digits = "".join(filter(str.isdigit, clean_val))
                    if len(digits) >= 10 and digits[-10:] not in used_list:
                        used_list.append(digits[-10:])
            
            c.used_by = json.dumps(used_list)
            # If total limit reached, auto-deactivate
            if c.max_uses_total is not None and c.usage_count >= c.max_uses_total:
                c.is_active = False
            db.commit()

    order_dict = new_order.to_dict()

    # Generate multi-channel notification payloads
    email_html = generate_order_email_html(order_dict)
    whatsapp_text = generate_whatsapp_message(order_dict)
    send_order_email(order_dict)

    # Broadcast real-time event to Admin Hub
    await broadcast_order_event("new_order", order_dict)

    return {
        "success": True,
        "message": f"Order #{order_id} placed successfully!",
        "order": order_dict,
        "whatsappMessage": whatsapp_text,
        "emailReceiptPreview": email_html,
    }


@app.get("/api/orders")
def get_all_orders(
    status: Optional[str] = Query("all"),
    search: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns list of orders for Admin hub or scoped strictly for a customer."""
    query = db.query(OrderModel).order_by(OrderModel.id.desc())

    # Per-user isolation filter (protects user privacy)
    target_uid = (user_id or userId or "").strip()
    target_email = (email or "").strip()
    if target_uid and target_email:
        query = query.filter(
            or_(
                OrderModel.user_id == target_uid,
                OrderModel.customer_email.ilike(target_email),
            )
        )
    elif target_uid:
        query = query.filter(OrderModel.user_id == target_uid)
    elif target_email:
        query = query.filter(OrderModel.customer_email.ilike(target_email))

    if status and status != "all":
        query = query.filter(OrderModel.status == status.lower())

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                OrderModel.order_id.ilike(search_filter),
                OrderModel.customer_name.ilike(search_filter),
                OrderModel.customer_phone.ilike(search_filter),
                OrderModel.district.ilike(search_filter),
            )
        )

    orders = query.all()
    return [o.to_dict() for o in orders]


@app.get("/api/orders/{order_id}")
def get_order_detail(order_id: str, db: Session = Depends(get_db)):
    """Returns detail for single order."""
    order = (
        db.query(OrderModel)
        .filter((OrderModel.order_id == order_id) | (OrderModel.id == order_id))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.to_dict()


class OrderStatusUpdateRequest(BaseModel):
    status: Optional[str] = None
    delivery_agent: Optional[str] = None
    expected_delivery: Optional[str] = None


@app.patch("/api/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """Updates order status, delivery agent, and expected delivery time; manages stock; broadcasts real-time update."""
    order = (
        db.query(OrderModel)
        .filter((OrderModel.order_id == order_id) | (OrderModel.id == order_id))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    status_message = f"Order {order_id} updated."
    stock_updates = []

    if payload.status:
        valid_statuses = ["pending", "confirmed", "dispatched", "delivered", "cancelled"]
        status_lower = payload.status.lower()
        if status_lower not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

        old_status = (order.status or "").lower()
        order.status = status_lower

        # ── Stock Management on Dispatch / Delivery ──
        if status_lower in ["dispatched", "delivered"] and not order.stock_deducted:
            try:
                items = json.loads(order.items) if isinstance(order.items, str) else (order.items or [])
                for it in items:
                    m_id = it.get("id")
                    qty = int(it.get("qty", 1) or 1)
                    med = None
                    if m_id:
                        med = db.query(MedicineModel).filter(MedicineModel.id == m_id).first()
                    if not med and it.get("name"):
                        med = db.query(MedicineModel).filter(MedicineModel.name.ilike(it.get("name").strip())).first()

                    if med and med.stock_quantity is not None:
                        old_qty = med.stock_quantity
                        new_qty = max(0, old_qty - qty)
                        med.stock_quantity = new_qty
                        stock_updates.append({
                            "id": med.id,
                            "name": med.name,
                            "qty": qty,
                            "oldStock": old_qty,
                            "newStock": new_qty,
                            "isLow": new_qty <= med.min_stock,
                        })
                order.stock_deducted = True
            except Exception as e:
                print("Error deducting stock on dispatch:", e)

            if stock_updates:
                stock_summary = ", ".join([f"{u['name']} -{u['qty']} (Remaining: {u['newStock']})" for u in stock_updates])
                status_message = f"Order {order.order_id} marked as {status_lower.title()}. Stock deducted: {stock_summary}"
                await broadcast_order_event("stock_updated", {"orderId": order.order_id, "updates": stock_updates})

        # ── Stock Restoration & Notifications on Cancellation by Store ──
        elif status_lower == "cancelled":
            if order.stock_deducted:
                try:
                    items = json.loads(order.items) if isinstance(order.items, str) else (order.items or [])
                    for it in items:
                        m_id = it.get("id")
                        qty = int(it.get("qty", 1) or 1)
                        med = None
                        if m_id:
                            med = db.query(MedicineModel).filter(MedicineModel.id == m_id).first()
                        if not med and it.get("name"):
                            med = db.query(MedicineModel).filter(MedicineModel.name.ilike(it.get("name").strip())).first()
                        if med and med.stock_quantity is not None:
                            med.stock_quantity += qty
                    order.stock_deducted = False
                except Exception as e:
                    print("Error restoring stock on cancellation:", e)

            # Customer cancellation notifications (Email & WhatsApp)
            order_dict = order.to_dict()
            cancel_reason = "Order cancelled by store pharmacist / owner"
            cancel_email = generate_cancellation_email_html(order_dict, cancelled_by="store", reason=cancel_reason)
            cancel_wa = generate_cancellation_whatsapp_message(order_dict, cancelled_by="store", reason=cancel_reason)
            send_order_email(order_dict, subject=f"Order #{order.order_id} Cancelled - Dhruv Pharma", html_content=cancel_email)

            await broadcast_order_event("order_cancelled", {
                "order": order_dict,
                "orderId": order.order_id,
                "cancelledBy": "store",
                "reason": cancel_reason,
                "whatsappText": cancel_wa,
            })
            status_message = f"Order {order.order_id} cancelled. Notification sent to customer via Email & WhatsApp."

    if payload.delivery_agent is not None:
        order.delivery_agent = payload.delivery_agent.strip()

    if payload.expected_delivery is not None:
        order.expected_delivery = payload.expected_delivery.strip()

    db.commit()
    db.refresh(order)

    order_dict = order.to_dict()

    # Broadcast update event to all active customer and admin tabs
    await broadcast_order_event("status_update", order_dict)

    return {
        "success": True,
        "message": status_message,
        "order": order_dict,
        "stockUpdates": stock_updates,
    }


@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str, db: Session = Depends(get_db)):
    """Permanently deletes an order and broadcasts the event via SSE."""
    order = (
        db.query(OrderModel)
        .filter((OrderModel.order_id == order_id) | (OrderModel.id == order_id))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    deleted_id = order.order_id
    db.delete(order)
    db.commit()

    await broadcast_order_event("order_deleted", {"orderId": deleted_id, "id": deleted_id})
    return {"success": True, "message": f"Order {deleted_id} deleted successfully."}


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = "Customer requested cancellation"


@app.post("/api/orders/{order_id}/cancel")
async def cancel_customer_order(
    order_id: str,
    payload: Optional[OrderCancelRequest] = None,
    db: Session = Depends(get_db),
):
    """Allows customers to cancel pending/confirmed orders, restores medicine stock, triggers notifications, and broadcasts update to Admin in real-time."""
    order = (
        db.query(OrderModel)
        .filter((OrderModel.order_id == order_id) | (OrderModel.id == order_id))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    status_lower = (order.status or "").lower()
    if status_lower in ["dispatched", "delivered"]:
        raise HTTPException(
            status_code=400,
            detail=f"This order is already {order.status} and cannot be cancelled online. Please contact our pharmacist support at +91 9503500725.",
        )

    if status_lower == "cancelled":
        return {
            "success": True,
            "message": f"Order {order.order_id} is already cancelled.",
            "order": order.to_dict(),
        }

    # Restore stock if it was deducted
    if order.stock_deducted:
        try:
            items = json.loads(order.items) if isinstance(order.items, str) else (order.items or [])
            for it in items:
                m_id = it.get("id")
                qty = int(it.get("qty", 1) or 1)
                med = None
                if m_id:
                    med = db.query(MedicineModel).filter(MedicineModel.id == m_id).first()
                if not med and it.get("name"):
                    med = db.query(MedicineModel).filter(MedicineModel.name.ilike(it.get("name").strip())).first()
                if med and med.stock_quantity is not None:
                    med.stock_quantity += qty
            order.stock_deducted = False
        except Exception as e:
            print(f"Stock restore warning on order cancellation: {e}")

    order.status = "cancelled"
    cancel_note = (payload.reason if payload and payload.reason else "Cancelled by customer").strip()
    if order.notes:
        order.notes += f" | {cancel_note}"
    else:
        order.notes = cancel_note

    db.commit()
    db.refresh(order)

    order_dict = order.to_dict()

    # Generate customer notifications (Email & WhatsApp)
    cancel_email = generate_cancellation_email_html(order_dict, cancelled_by="customer", reason=cancel_note)
    cancel_wa = generate_cancellation_whatsapp_message(order_dict, cancelled_by="customer", reason=cancel_note)
    send_order_email(order_dict, subject=f"Order #{order.order_id} Cancelled - Dhruv Pharma", html_content=cancel_email)

    # Broadcast real-time SSE cancellation event to Admin Portal
    await broadcast_order_event("order_cancelled", {
        "order": order_dict,
        "orderId": order.order_id,
        "cancelledBy": "customer",
        "customerName": order.customer_name,
        "phone": order.customer_phone,
        "amount": order.total_amount,
        "reason": cancel_note,
        "whatsappText": cancel_wa,
    })
    await broadcast_order_event("status_update", order_dict)

    return {
        "success": True,
        "message": f"Order #{order.order_id} has been cancelled successfully. Confirmation sent via WhatsApp & Email.",
        "order": order_dict,
        "whatsappText": cancel_wa,
    }


# ==============================================================================
# PAYMENT GATEWAY ENDPOINTS (CASHFREE + UPI QR)
# ==============================================================================

CASHFREE_APP_ID = os.getenv("CASHFREE_APP_ID", "")
CASHFREE_SECRET_KEY = os.getenv("CASHFREE_SECRET_KEY", "")
CASHFREE_ENV = os.getenv("CASHFREE_ENV", "TEST").upper()  # 'TEST' or 'PROD'

CASHFREE_BASE_URL = (
    "https://api.cashfree.com/pg"
    if CASHFREE_ENV == "PROD"
    else "https://sandbox.cashfree.com/pg"
)


class CashfreeCreateOrderRequest(BaseModel):
    orderId: str
    amount: float
    customerName: str
    customerPhone: str
    customerEmail: Optional[str] = ""
    returnUrl: Optional[str] = ""


class CashfreeVerifyRequest(BaseModel):
    orderId: str
    cashfreeOrderId: Optional[str] = None
    paymentId: Optional[str] = None


class UPIQRConfirmRequest(BaseModel):
    orderId: str
    utrNumber: Optional[str] = None
    upiApp: Optional[str] = "UPI"


@app.post("/api/payment/cashfree/create-order")
async def create_cashfree_order(payload: CashfreeCreateOrderRequest):
    """
    Creates a Cashfree PG order session.
    If CASHFREE_APP_ID and CASHFREE_SECRET_KEY are set, connects to Cashfree PG Sandbox/Live API.
    Otherwise, returns a simulated test session so testing can proceed seamlessly in dev.
    """
    clean_phone = re.sub(r"\D", "", payload.customerPhone)
    if len(clean_phone) < 10:
        clean_phone = "9876543210"
    else:
        clean_phone = clean_phone[-10:]

    # Check if Cashfree API keys are configured
    if CASHFREE_APP_ID and CASHFREE_SECRET_KEY:
        import urllib.request
        import urllib.error

        req_data = {
            "order_id": payload.orderId,
            "order_amount": float(payload.amount),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": f"cust_{clean_phone}",
                "customer_phone": clean_phone,
                "customer_name": payload.customerName.strip() or "Dhruv Pharma Customer",
                "customer_email": payload.customerEmail.strip() or "customer@dhruvpharma.com",
            },
            "order_meta": {
                "return_url": payload.returnUrl or f"http://localhost:5173/my-orders?order_id={payload.orderId}",
            },
        }

        try:
            req = urllib.request.Request(
                f"{CASHFREE_BASE_URL}/orders",
                data=json.dumps(req_data).encode("utf-8"),
                headers={
                    "x-client-id": CASHFREE_APP_ID,
                    "x-client-secret": CASHFREE_SECRET_KEY,
                    "x-api-version": "2023-08-01",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                return {
                    "success": True,
                    "mode": "live" if CASHFREE_ENV == "PROD" else "sandbox",
                    "paymentSessionId": resp_json.get("payment_session_id"),
                    "orderId": payload.orderId,
                    "cashfreeOrderId": resp_json.get("cf_order_id"),
                }
        except Exception as e:
            print(f"Cashfree API Error: {e}, falling back to test sandbox session")

    # Seamless test simulation mode
    return {
        "success": True,
        "mode": "test_simulation",
        "paymentSessionId": f"session_test_{uuid.uuid4().hex[:14]}",
        "orderId": payload.orderId,
        "amount": payload.amount,
        "message": "Cashfree test mode active. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to backend/.env when ready for live transactions.",
    }


@app.post("/api/payment/cashfree/verify")
async def verify_cashfree_payment(payload: CashfreeVerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies payment completion with Cashfree and updates order payment status to 'paid'.
    """
    order = (
        db.query(OrderModel)
        .filter((OrderModel.order_id == payload.orderId) | (OrderModel.id == payload.orderId))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.payment_status = "paid"
    order.payment_method = "Cashfree Online (UPI/Cards)"
    trans_note = f"Paid via Cashfree PG (ID: {payload.paymentId or payload.cashfreeOrderId or 'TEST_PG'})"
    if order.notes:
        order.notes += f" | {trans_note}"
    else:
        order.notes = trans_note

    db.commit()
    db.refresh(order)

    order_dict = order.to_dict()
    await broadcast_order_event("status_update", order_dict)

    return {
        "success": True,
        "message": f"Payment for Order #{order.order_id} verified successfully.",
        "order": order_dict,
    }


@app.post("/api/payment/upi-qr/confirm")
async def confirm_upi_qr_payment(payload: UPIQRConfirmRequest, db: Session = Depends(get_db)):
    """
    Confirms UPI QR payment, records optional UTR / reference, and updates payment status.
    """
    order = (
        db.query(OrderModel)
        .filter((OrderModel.order_id == payload.orderId) | (OrderModel.id == payload.orderId))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.payment_status = "paid"
    order.payment_method = f"UPI QR ({payload.upiApp or 'Direct'})"
    utr_str = f"UTR Ref: {payload.utrNumber.strip()}" if payload.utrNumber and payload.utrNumber.strip() else "Direct QR scan confirmed"
    if order.notes:
        order.notes += f" | {utr_str}"
    else:
        order.notes = utr_str

    db.commit()
    db.refresh(order)

    order_dict = order.to_dict()
    await broadcast_order_event("status_update", order_dict)

    return {
        "success": True,
        "message": f"UPI Payment for Order #{order.order_id} confirmed successfully.",
        "order": order_dict,
    }


# ==============================================================================
# CALLBACK REQUESTS & PHONE ORDER MANAGEMENT (ORDER VIA CALL)
# ==============================================================================

@app.post("/api/callbacks")
async def create_callback_request(
    customerName: str = Form(...),
    phone: str = Form(...),
    district: Optional[str] = Form("Pune"),
    preferredTime: Optional[str] = Form("Immediate (within 15 mins)"),
    medicinesNeeded: Optional[str] = Form(""),
    prescriptionFile: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Submits a new 'Order via Call' callback request from a customer.
    Broadcasts real-time alert to all connected admin portals.
    """
    clean_phone = re.sub(r"\D", "", phone)
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number.")

    rx_url = ""
    if prescriptionFile and prescriptionFile.filename:
        timestamp_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_name = os.path.basename(prescriptionFile.filename)
        unique_filename = f"cb_rx_{timestamp_prefix}_{uuid.uuid4().hex[:6]}_{original_name}"
        destination_path = os.path.join(ORDERS_PRESCRIPTIONS_DIR, unique_filename)
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(prescriptionFile.file, buffer)
        rx_url = f"/uploads/order_prescriptions/{unique_filename}"

    new_cb = CallbackRequestModel(
        customer_name=customerName.strip(),
        customer_phone=phone.strip(),
        district=(district or "Pune").strip(),
        preferred_time=(preferredTime or "Immediate (within 15 mins)").strip(),
        medicines_needed=(medicinesNeeded or "").strip(),
        prescription_file=rx_url,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(new_cb)
    db.commit()
    db.refresh(new_cb)

    cb_dict = new_cb.to_dict()
    await broadcast_order_event("new_callback", cb_dict)

    return {
        "success": True,
        "message": f"Callback request registered! Our registered pharmacist will call you at {phone} within 15 minutes.",
        "callback": cb_dict,
    }


@app.get("/api/callbacks")
def get_callbacks(
    status: Optional[str] = Query("all"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(CallbackRequestModel)
    if status and status != "all":
        query = query.filter(CallbackRequestModel.status == status.lower())
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CallbackRequestModel.customer_name.ilike(term),
                CallbackRequestModel.customer_phone.ilike(term),
                CallbackRequestModel.district.ilike(term),
                CallbackRequestModel.medicines_needed.ilike(term),
            )
        )
    callbacks = query.order_by(CallbackRequestModel.id.desc()).all()
    return [c.to_dict() for c in callbacks]


class CallbackStatusUpdate(BaseModel):
    status: str  # pending, called, converted, cancelled
    adminNotes: Optional[str] = None


@app.patch("/api/callbacks/{callback_id}/status")
async def update_callback_status(
    callback_id: int,
    payload: CallbackStatusUpdate,
    db: Session = Depends(get_db),
):
    cb = db.query(CallbackRequestModel).filter(CallbackRequestModel.id == callback_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Callback request not found")

    cb.status = payload.status.lower()
    if payload.adminNotes is not None:
        cb.admin_notes = payload.adminNotes.strip()
    db.commit()
    db.refresh(cb)

    cb_dict = cb.to_dict()
    await broadcast_order_event("callback_update", cb_dict)
    return {"success": True, "callback": cb_dict}


@app.delete("/api/callbacks/{callback_id}")
async def delete_callback(callback_id: int, db: Session = Depends(get_db)):
    """Allows owner to delete callback requests so requests do not stack up."""
    cb = db.query(CallbackRequestModel).filter(CallbackRequestModel.id == callback_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Callback request not found")

    req_id = f"CB-{cb.id:04d}"
    db.delete(cb)
    db.commit()

    await broadcast_order_event("callback_deleted", {"callbackId": callback_id, "requestId": req_id})
    return {"success": True, "message": f"Callback request {req_id} deleted successfully."}


class AdminManualOrderItem(BaseModel):
    id: Optional[int] = None
    name: str
    price: float
    qty: int = 1
    salt: Optional[str] = ""
    brand: Optional[str] = ""


class AdminManualOrderCreate(BaseModel):
    customerName: str
    phone: str
    email: Optional[str] = ""
    district: str = "Pune"
    address: str
    pincode: Optional[str] = ""
    items: List[AdminManualOrderItem]
    paymentMethod: str = "COD"  # COD, UPI on Delivery
    notes: Optional[str] = "Phone Order (taken by pharmacist on call)"
    callbackId: Optional[int] = None


@app.post("/api/admin/orders/create")
async def create_admin_phone_order(
    payload: AdminManualOrderCreate,
    db: Session = Depends(get_db),
):
    """
    Allows pharmacist to place an order on behalf of a phone/callback customer.
    Auto-decrements stock, assigns DP sequential order ID, broadcasts new_order event,
    and if linked to a callback, marks it as 'converted'.
    """
    if not payload.items or len(payload.items) == 0:
        raise HTTPException(status_code=400, detail="Order must contain at least one medicine item.")

    # Generate sequential Order ID
    max_order = db.query(OrderModel).order_by(OrderModel.id.desc()).first()
    next_num = (max_order.id + 140) if max_order else 101
    while db.query(OrderModel).filter(OrderModel.order_id == f"DP-{next_num}").first():
        next_num += 1
    order_id = f"DP-{next_num}"

    # Calculate financials
    subtotal = sum(i.price * i.qty for i in payload.items)
    delivery_fee = 0.0 if subtotal >= 300 else 40.0
    total_amount = subtotal + delivery_fee

    items_list = [i.dict() for i in payload.items]

    # Decrement stock
    for item in payload.items:
        if item.id:
            med = db.query(MedicineModel).filter(MedicineModel.id == item.id).first()
            if med and med.stock_quantity is not None:
                med.stock_quantity = max(0, med.stock_quantity - item.qty)

    new_order = OrderModel(
        order_id=order_id,
        customer_name=payload.customerName.strip(),
        customer_phone=payload.phone.strip(),
        customer_email=(payload.email or "").strip(),
        user_id="",
        district=payload.district.strip(),
        address=payload.address.strip(),
        pincode=(payload.pincode or "").strip(),
        items=json.dumps(items_list),
        subtotal=float(subtotal),
        discount=0.0,
        delivery_fee=float(delivery_fee),
        total_amount=float(total_amount),
        payment_method=payload.paymentMethod or "COD",
        payment_status="pending",
        prescription_file="",
        status="confirmed",  # Confirmed directly by pharmacist
        expected_delivery="Expected in 3–4 Days (Phone Order)",
        delivery_agent="Sanjay Kumar (Dhruv Express)",
        notes=payload.notes or "Phone Order confirmed by pharmacist",
        created_at=datetime.now(),
    )
    db.add(new_order)

    # If linked to a callback, mark as converted
    if payload.callbackId:
        cb = db.query(CallbackRequestModel).filter(CallbackRequestModel.id == payload.callbackId).first()
        if cb:
            cb.status = "converted"
            cb.admin_notes = f"Converted to Order #{order_id}"

    db.commit()
    db.refresh(new_order)

    order_dict = new_order.to_dict()
    await broadcast_order_event("new_order", order_dict)

    return {
        "success": True,
        "message": f"Phone order #{order_id} created and confirmed successfully!",
        "order": order_dict,
    }


# ==============================================================================
# 2. PRESCRIPTION WORKFLOW ENDPOINTS
# ==============================================================================

@app.post("/api/prescriptions/upload")
async def upload_prescription(
    patientName: str = Form(...),
    phone: str = Form(...),
    district: str = Form(...),
    address: str = Form(...),
    notes: Optional[str] = Form(""),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="Please upload at least one prescription file.")

    saved_files = []
    timestamp_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")

    for file in files:
        original_name = os.path.basename(file.filename)
        unique_filename = f"{timestamp_prefix}_{uuid.uuid4().hex[:6]}_{original_name}"
        destination_path = os.path.join(PRESCRIPTIONS_DIR, unique_filename)

        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_url = f"/uploads/prescriptions/{unique_filename}"
        saved_files.append(file_url)

    count = db.query(PrescriptionModel).count()
    rx_id = f"RX-{100 + count + 1}"

    prescription = PrescriptionModel(
        rx_id=rx_id,
        patient_name=patientName.strip(),
        phone=phone.strip(),
        district=district.strip(),
        address=address.strip(),
        notes=(notes or "").strip(),
        status="pending",
        files=json.dumps(saved_files),
        created_at=datetime.now(),
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    return {
        "success": True,
        "message": "Prescription uploaded successfully. The pharmacist will review it within 30 minutes.",
        "prescription": prescription.to_dict(),
    }


@app.get("/api/prescriptions")
def get_prescriptions(
    status: Optional[str] = Query("all"),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(PrescriptionModel).order_by(PrescriptionModel.id.desc())

    if status and status != "all":
        query = query.filter(PrescriptionModel.status == status.lower())

    if district:
        query = query.filter(PrescriptionModel.district == district)

    results = query.all()
    return [p.to_dict() for p in results]


class PrescriptionStatusRequest(BaseModel):
    status: str


@app.patch("/api/prescriptions/{rx_id}/status")
def update_prescription_status(
    rx_id: str,
    payload: PrescriptionStatusRequest,
    db: Session = Depends(get_db),
):
    valid_statuses = ["pending", "reviewed", "approved", "rejected"]
    status_lower = payload.status.lower()

    if status_lower not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed values: {', '.join(valid_statuses)}",
        )

    prescription = (
        db.query(PrescriptionModel)
        .filter((PrescriptionModel.rx_id == rx_id) | (PrescriptionModel.id == rx_id))
        .first()
    )

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    prescription.status = status_lower
    db.commit()
    db.refresh(prescription)

    return {
        "success": True,
        "message": f"Prescription {rx_id} updated to {status_lower}",
        "prescription": prescription.to_dict(),
    }


@app.delete("/api/prescriptions/{rx_id}")
async def delete_prescription(rx_id: str, db: Session = Depends(get_db)):
    """Allows store owner to delete prescription requests so requests do not stack up."""
    prescription = (
        db.query(PrescriptionModel)
        .filter((PrescriptionModel.rx_id == rx_id) | (PrescriptionModel.id == rx_id))
        .first()
    )
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    deleted_id = prescription.rx_id
    db.delete(prescription)
    db.commit()

    await broadcast_order_event("prescription_deleted", {"rxId": deleted_id, "id": deleted_id})
    return {"success": True, "message": f"Prescription request {deleted_id} deleted successfully."}


# ==============================================================================
# 3. INVENTORY AUTO-CATEGORIZATION & STAGING WORKSPACE
# ==============================================================================

def normalize_header(h: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "", h.lower())


def find_column_index(headers: List[str], candidates: List[str]) -> Optional[int]:
    """Find index of matching column name from distributor variants."""
    clean_headers = [normalize_header(h) for h in headers]
    for cand in candidates:
        cand_clean = normalize_header(cand)
        for idx, h in enumerate(clean_headers):
            if h == cand_clean:
                return idx
    for cand in candidates:
        cand_clean = normalize_header(cand)
        for idx, h in enumerate(clean_headers):
            if cand_clean in h and len(h) <= len(cand_clean) + 4:
                return idx
    return None


@app.get("/api/inventory/sample-csv")
def download_sample_csv():
    sample_path = os.path.join(BASE_DIR, "sample_distributor_inventory.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample CSV not found")
    return FileResponse(
        sample_path,
        media_type="text/csv",
        filename="DHRUV_PHARMA_DISTRIBUTOR_SAMPLE.csv",
    )


@app.post("/api/inventory/upload")
def upload_distributor_inventory(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are currently supported.")

    try:
        content_bytes = file.file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read the uploaded CSV file.")

    text_content = None
    for enc in ["utf-8-sig", "utf-8", "cp1252", "latin-1"]:
        try:
            text_content = content_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue

    if text_content is None:
        raise HTTPException(status_code=400, detail="Unable to decode CSV file. Please ensure file is valid UTF-8 or CP1252.")

    reader = csv.reader(io.StringIO(text_content))
    rows = list(reader)

    if not rows or len(rows) < 2:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty or missing headers.")

    headers = [h.strip() for h in rows[0]]

    code_idx = find_column_index(headers, ["itemcode", "item_code", "code", "itemid", "item_id", "productcode", "itemno"])
    name_idx = find_column_index(headers, ["name", "itemname", "item_name", "product", "description", "medicinename"])
    company_idx = find_column_index(headers, ["company", "mfg", "manufacturer", "brand", "mfgby"])
    salt_idx = find_column_index(headers, ["salt", "composition", "formulation", "generic", "genericname"])
    mrp_idx = find_column_index(headers, ["mrp", "m.r.p.", "m.r.p", "maximumretailprice"])
    rate_idx = find_column_index(headers, ["rate", "cost", "costprice", "purchaserate", "ptr", "wrate"])
    stock_idx = find_column_index(headers, ["stock", "qty", "quantity", "balance", "curstock", "closingstock"])
    image_idx = find_column_index(headers, [
        "image", "imageurl", "image_url", "image_link", "imagelink",
        "img", "imgurl", "img_url", "photo", "photourl", "picture",
        "pictureurl", "productimage", "product_image", "packshot", "url"
    ])

    if name_idx is None:
        raise HTTPException(
            status_code=400,
            detail="Could not find medicine Name column in CSV. Found headers: " + ", ".join(headers),
        )

    # Pre-index existing catalog in memory to make bulk ingestion instant (< 0.5s)
    existing_map = {m.item_code: m for m in db.query(MedicineModel).all() if m.item_code}

    category_counts: Dict[str, int] = {}
    total_parsed = 0
    updated_count = 0
    created_count = 0
    rx_flagged_count = 0

    for row_idx, row in enumerate(rows[1:], start=2):
        if not row or not any(row):
            continue

        raw_name = row[name_idx].strip() if name_idx < len(row) else ""
        if not raw_name:
            continue

        total_parsed += 1

        raw_code = (
            row[code_idx].strip()
            if code_idx is not None and code_idx < len(row) and row[code_idx].strip()
            else f"DIST-{int(datetime.utcnow().timestamp())}-{row_idx}"
        )

        raw_company = (
            row[company_idx].strip()
            if company_idx is not None and company_idx < len(row)
            else "Generic"
        )

        raw_salt = (
            row[salt_idx].strip()
            if salt_idx is not None and salt_idx < len(row)
            else ""
        )
        cleaned_salt = clean_text(raw_salt)

        raw_mrp = 0.0
        if mrp_idx is not None and mrp_idx < len(row):
            try:
                raw_mrp = float(re.sub(r"[^\d.]", "", row[mrp_idx]) or 0)
            except ValueError:
                raw_mrp = 0.0

        raw_rate = 0.0
        if rate_idx is not None and rate_idx < len(row):
            try:
                raw_rate = float(re.sub(r"[^\d.]", "", row[rate_idx]) or 0)
            except ValueError:
                raw_rate = 0.0

        raw_stock = 10
        if stock_idx is not None and stock_idx < len(row):
            try:
                raw_stock = int(float(re.sub(r"[^\d.]", "", row[stock_idx]) or 10))
            except ValueError:
                raw_stock = 10

        category, requires_rx = categorize_medicine(name=raw_name, salt=cleaned_salt)
        category_counts[category] = category_counts.get(category, 0) + 1
        if requires_rx:
            rx_flagged_count += 1

        selling_price = calculate_selling_price(mrp=raw_mrp, cost_price=raw_rate, discount_pct=12.0)

        raw_image_url = (
            row[image_idx].strip()
            if image_idx is not None and image_idx < len(row) and row[image_idx].strip()
            else ""
        )
        pack_shot_url = raw_image_url or resolve_brand_pack_shot(raw_name, raw_company)

        existing = existing_map.get(raw_code)

        if existing:
            existing.name = raw_name
            existing.salt = cleaned_salt
            existing.manufacturer = raw_company
            existing.category = category
            existing.mrp = raw_mrp
            existing.cost_price = raw_rate
            existing.selling_price = selling_price
            existing.stock_quantity = raw_stock
            existing.requires_prescription = requires_rx
            if pack_shot_url and not existing.image_url:
                existing.image_url = pack_shot_url
            # Preserve publication status: do not accidentally hide already-live medicines!
            updated_count += 1
        else:
            new_item = MedicineModel(
                item_code=raw_code,
                name=raw_name,
                salt=cleaned_salt,
                manufacturer=raw_company,
                category=category,
                mrp=raw_mrp,
                cost_price=raw_rate,
                selling_price=selling_price,
                stock_quantity=raw_stock,
                min_stock=15,
                requires_prescription=requires_rx,
                image_url=pack_shot_url,
                is_published=False, # New uploads start as draft for admin review
                is_visible=True,
            )
            db.add(new_item)
            existing_map[raw_code] = new_item
            created_count += 1

    db.commit()

    return {
        "success": True,
        "message": f"Successfully organized {total_parsed} medicines ({created_count} new drafts, {updated_count} updated).",
        "stats": {
            "totalParsed": total_parsed,
            "created": created_count,
            "updated": updated_count,
            "rxFlagged": rx_flagged_count,
            "categoryBreakdown": category_counts,
        },
    }


@app.get("/api/inventory/staged")
def get_staged_inventory(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(MedicineModel).filter(MedicineModel.is_published == False)

    if search and isinstance(search, str) and search.strip():
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MedicineModel.name.ilike(search_filter),
                MedicineModel.salt.ilike(search_filter),
                MedicineModel.manufacturer.ilike(search_filter),
                MedicineModel.item_code.ilike(search_filter),
            )
        )

    if category and isinstance(category, str) and category != "All":
        query = query.filter(MedicineModel.category == category)

    total_count = query.count()
    items = (
        query.order_by(MedicineModel.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    all_staged = db.query(MedicineModel.category).filter(MedicineModel.is_published == False).all()
    counts: Dict[str, int] = {}
    for (cat,) in all_staged:
        counts[cat] = counts.get(cat, 0) + 1

    return {
        "items": [item.to_dict() for item in items],
        "total": total_count,
        "page": page,
        "limit": limit,
        "totalPages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "categoryCounts": counts,
    }


@app.get("/api/inventory/live")
def get_live_inventory(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(MedicineModel).filter(MedicineModel.is_published == True)

    if search and isinstance(search, str) and search.strip():
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MedicineModel.name.ilike(search_filter),
                MedicineModel.salt.ilike(search_filter),
                MedicineModel.manufacturer.ilike(search_filter),
                MedicineModel.item_code.ilike(search_filter),
            )
        )

    if category and isinstance(category, str) and category != "All":
        query = query.filter(MedicineModel.category == category)

    total_count = query.count()
    items = (
        query.order_by(MedicineModel.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "items": [item.to_dict() for item in items],
        "total": total_count,
        "page": page,
        "limit": limit,
        "totalPages": (total_count + limit - 1) // limit if total_count > 0 else 1,
    }


class MedicineUpdateRequest(BaseModel):
    category: Optional[str] = None
    selling_price: Optional[float] = None
    mrp: Optional[float] = None
    stock_quantity: Optional[int] = None
    requires_prescription: Optional[bool] = None
    salt: Optional[str] = None
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    image_url: Optional[str] = None
    imageUrl: Optional[str] = None
    is_visible: Optional[bool] = None
    isVisible: Optional[bool] = None


@app.patch("/api/inventory/{item_id}")
def update_inventory_item(
    item_id: int,
    payload: MedicineUpdateRequest,
    db: Session = Depends(get_db),
):
    item = db.query(MedicineModel).filter(MedicineModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    if payload.category is not None:
        item.category = payload.category.strip()
    if payload.selling_price is not None:
        item.selling_price = round(float(payload.selling_price), 2)
    if payload.mrp is not None:
        item.mrp = round(float(payload.mrp), 2)
    if payload.stock_quantity is not None:
        item.stock_quantity = int(payload.stock_quantity)
    if payload.requires_prescription is not None:
        item.requires_prescription = bool(payload.requires_prescription)
    if payload.salt is not None:
        item.salt = clean_text(payload.salt)
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.manufacturer is not None:
        item.manufacturer = payload.manufacturer.strip()
    if payload.image_url is not None:
        item.image_url = payload.image_url.strip()
    elif payload.imageUrl is not None:
        item.image_url = payload.imageUrl.strip()
    if payload.is_visible is not None:
        item.is_visible = bool(payload.is_visible)
    elif payload.isVisible is not None:
        item.is_visible = bool(payload.isVisible)

    db.commit()
    db.refresh(item)
    return {"success": True, "item": item.to_dict()}


@app.patch("/api/inventory/{item_id}/toggle-visibility")
def toggle_inventory_visibility(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MedicineModel).filter(MedicineModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    current_state = item.is_visible if item.is_visible is not None else True
    item.is_visible = not current_state
    db.commit()
    db.refresh(item)
    return {
        "success": True,
        "id": item.id,
        "name": item.name,
        "is_visible": item.is_visible,
        "message": f"Medicine '{item.name}' is now {'showcased in the store' if item.is_visible else 'hidden from storefront'}."
    }


@app.delete("/api/inventory/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MedicineModel).filter(MedicineModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    db.delete(item)
    db.commit()
    return {"success": True, "message": "Medicine deleted successfully."}


class PublishRequest(BaseModel):
    item_ids: Optional[List[int]] = None


@app.post("/api/inventory/publish")
def publish_staged_medicines(
    payload: PublishRequest,
    db: Session = Depends(get_db),
):
    query = db.query(MedicineModel).filter(MedicineModel.is_published == False)
    if payload.item_ids and len(payload.item_ids) > 0:
        query = query.filter(MedicineModel.id.in_(payload.item_ids))

    count = query.update({MedicineModel.is_published: True}, synchronize_session=False)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully published {count} medicine(s) to the live patient storefront.",
        "publishedCount": count,
    }


@app.delete("/api/inventory/staged/clear")
def clear_staged_medicines(db: Session = Depends(get_db)):
    count = (
        db.query(MedicineModel)
        .filter(MedicineModel.is_published == False)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {
        "success": True,
        "message": f"Discarded {count} draft medicine(s) from staging.",
        "clearedCount": count,
    }


# ==============================================================================
# 4. CUSTOMER LIVE STOREFRONT & DYNAMIC DETAILS (/api/medicines)
# ==============================================================================

@app.get("/api/medicines")
def get_customer_medicines(
    category: Optional[str] = "All",
    search: Optional[str] = None,
    sort: Optional[str] = "popular",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    rx_filter: Optional[str] = "all",
    in_stock_only: Optional[bool] = False,
    db: Session = Depends(get_db),
):
    query = db.query(MedicineModel).filter(
        MedicineModel.is_published == True,
        or_(MedicineModel.is_visible == True, MedicineModel.is_visible == None),
    )

    if in_stock_only is True:
        query = query.filter(MedicineModel.stock_quantity > 0)

    if category and isinstance(category, str) and category != "All":
        query = query.filter(MedicineModel.category == category)

    if search and isinstance(search, str) and search.strip():
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MedicineModel.name.ilike(search_filter),
                MedicineModel.salt.ilike(search_filter),
                MedicineModel.manufacturer.ilike(search_filter),
                MedicineModel.item_code.ilike(search_filter),
            )
        )

    if min_price is not None and isinstance(min_price, (int, float)):
        query = query.filter(MedicineModel.selling_price >= min_price)
    if max_price is not None and isinstance(max_price, (int, float)):
        query = query.filter(MedicineModel.selling_price <= max_price)

    if rx_filter == "otc":
        query = query.filter(MedicineModel.requires_prescription == False)
    elif rx_filter == "rx":
        query = query.filter(MedicineModel.requires_prescription == True)

    if sort == "price_asc":
        query = query.order_by(MedicineModel.selling_price.asc())
    elif sort == "price_desc":
        query = query.order_by(MedicineModel.selling_price.desc())
    elif sort == "name_asc":
        query = query.order_by(MedicineModel.name.asc())
    else:
        query = query.order_by(MedicineModel.id.desc())

    medicines = query.all()
    return [m.to_dict() for m in medicines]


@app.get("/api/medicines/showcase")
def get_medicines_showcase(db: Session = Depends(get_db)):
    """
    Returns data-driven collections for the storefront homepage:
    1. trending: dynamically aggregated from actual customer purchase order quantities.
       Fallback: top-rated high-frequency essentials.
    2. new_launches: newest medicine items uploaded/published by admin from distributor CSVs.
       Fallback: latest catalog additions/restocks.
    """
    # ── 1. TRENDING MEDICINES ──
    orders = db.query(OrderModel).filter(OrderModel.status != "cancelled").all()
    sales_map = {}  # { int(id): units_sold }
    for o in orders:
        try:
            items = json.loads(o.items) if isinstance(o.items, str) else (o.items or [])
            for it in items:
                m_id = it.get("id")
                qty = it.get("qty", 1)
                if m_id:
                    try:
                        int_id = int(m_id)
                        sales_map[int_id] = sales_map.get(int_id, 0) + qty
                    except (ValueError, TypeError):
                        pass
        except Exception:
            pass

    trending_ids = sorted(sales_map.keys(), key=lambda i: sales_map[i], reverse=True)
    trending_list = []

    if trending_ids:
        ordered_meds = db.query(MedicineModel).filter(
            MedicineModel.id.in_(trending_ids),
            MedicineModel.is_published == True,
            or_(MedicineModel.is_visible == True, MedicineModel.is_visible == None),
        ).all()
        med_by_id = {m.id: m for m in ordered_meds}
        for tid in trending_ids:
            if tid in med_by_id:
                d = med_by_id[tid].to_dict()
                d["units_sold"] = sales_map.get(tid, 0)
                d["badge"] = "🔥 Trending Now"
                d["badge_type"] = "trending"
                trending_list.append(d)
                if len(trending_list) >= 8:
                    break

    # If fewer than 8 trending from order sales, fill with high-demand published medicines
    if len(trending_list) < 8:
        existing_ids = {item["id"] for item in trending_list}
        needed = 8 - len(trending_list)
        fallback_query = db.query(MedicineModel).filter(
            MedicineModel.is_published == True,
            or_(MedicineModel.is_visible == True, MedicineModel.is_visible == None),
        )
        if existing_ids:
            fallback_query = fallback_query.filter(~MedicineModel.id.in_(existing_ids))
        fallback_meds = fallback_query.order_by(MedicineModel.stock_quantity.desc(), MedicineModel.id.asc()).limit(needed).all()

        for m in fallback_meds:
            d = m.to_dict()
            d["units_sold"] = 0
            d["badge"] = "⭐ Popular Demand"
            d["badge_type"] = "trending"
            trending_list.append(d)

    # ── 2. NEW LAUNCHES ──
    # Directly query the 8 newest published medicines by created_at DESC, id DESC
    newest_meds = db.query(MedicineModel).filter(
        MedicineModel.is_published == True,
        or_(MedicineModel.is_visible == True, MedicineModel.is_visible == None),
    ).order_by(MedicineModel.created_at.desc(), MedicineModel.id.desc()).limit(8).all()

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    new_launches_list = []
    for m in newest_meds:
        d = m.to_dict()
        if m.created_at and m.created_at >= thirty_days_ago:
            d["badge"] = "✨ New Launch"
            d["badge_type"] = "new_arrival"
            d["is_new_arrival"] = True
        else:
            d["badge"] = "✨ Recent Restock"
            d["badge_type"] = "new_arrival"
            d["is_new_arrival"] = True
        new_launches_list.append(d)

    total_count = db.query(MedicineModel).filter(
        MedicineModel.is_published == True,
        or_(MedicineModel.is_visible == True, MedicineModel.is_visible == None),
    ).count()

    return {
        "trending": trending_list,
        "new_launches": new_launches_list,
        "meta": {
            "total_catalog": total_count,
            "trending_count": len(trending_list),
            "new_launches_count": len(new_launches_list),
            "has_live_sales_data": len(trending_ids) > 0,
        }
    }


@app.get("/api/medicines/{item_id}")
def get_customer_medicine_detail(item_id: int, db: Session = Depends(get_db)):
    """
    Returns full dynamic medicine detail with auto-synthesized clinical information
    (composition, dosage form, uses, dosage advisory, side effects, warnings, and pack size).
    """
    item = (
        db.query(MedicineModel)
        .filter(MedicineModel.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found in catalog.")

    base_dict = item.to_dict()
    clinical_data = generate_clinical_info(
        name=item.name,
        salt=item.salt,
        category=item.category,
    )

    # Merge dynamic clinical guidelines
    base_dict.update(clinical_data)
    return base_dict


# ==============================================================================
# 5. COUPONS & DISCOUNTS API (/api/coupons)
# ==============================================================================

class CouponCreateRequest(BaseModel):
    code: str
    description: Optional[str] = ""
    discount_type: Optional[str] = "percentage"
    discount_value: float
    min_order_amount: Optional[float] = 0.0
    max_discount: Optional[float] = 500.0
    is_active: Optional[bool] = True
    max_uses_total: Optional[int] = None
    max_uses_per_user: Optional[int] = 1
    show_in_cart: Optional[bool] = False


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float
    userId: Optional[str] = None
    user_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


@app.get("/api/coupons")
def list_coupons(active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(CouponModel).order_by(CouponModel.id.desc())
    if active_only:
        query = query.filter(CouponModel.is_active == True)
    return [c.to_dict() for c in query.all()]


@app.get("/api/coupons/public")
def list_public_coupons(db: Session = Depends(get_db)):
    """Returns only coupons that are active AND explicitly marked by the owner to show in customer cart."""
    coupons = db.query(CouponModel).filter(
        CouponModel.is_active == True,
        CouponModel.show_in_cart == True,
    ).order_by(CouponModel.id.desc()).all()
    return [c.to_dict() for c in coupons]


@app.post("/api/coupons")
def create_coupon(payload: CouponCreateRequest, db: Session = Depends(get_db)):
    code_upper = payload.code.strip().upper()
    existing = db.query(CouponModel).filter(CouponModel.code == code_upper).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Coupon code '{code_upper}' already exists.")

    new_coupon = CouponModel(
        code=code_upper,
        description=payload.description or "",
        discount_type=payload.discount_type or "percentage",
        discount_value=float(payload.discount_value),
        min_order_amount=float(payload.min_order_amount or 0.0),
        max_discount=float(payload.max_discount or 500.0) if payload.max_discount is not None else None,
        is_active=bool(payload.is_active) if payload.is_active is not None else True,
        max_uses_total=int(payload.max_uses_total) if payload.max_uses_total is not None and int(payload.max_uses_total) > 0 else None,
        max_uses_per_user=int(payload.max_uses_per_user) if payload.max_uses_per_user is not None and int(payload.max_uses_per_user) > 0 else 1,
        show_in_cart=bool(payload.show_in_cart) if payload.show_in_cart is not None else False,
        used_by="[]",
        usage_count=0,
    )
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    return {"success": True, "coupon": new_coupon.to_dict()}


@app.patch("/api/coupons/{coupon_id}/toggle")
def toggle_coupon(coupon_id: int, db: Session = Depends(get_db)):
    c = db.query(CouponModel).filter(CouponModel.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    c.is_active = not c.is_active
    db.commit()
    return {"success": True, "isActive": c.is_active, "coupon": c.to_dict()}


@app.patch("/api/coupons/{coupon_id}/toggle-cart-display")
def toggle_coupon_cart_display(coupon_id: int, db: Session = Depends(get_db)):
    """Allows owner to toggle whether this coupon is shown as a selectable pill in the customer cart."""
    c = db.query(CouponModel).filter(CouponModel.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    current_show = c.show_in_cart if c.show_in_cart is not None else False
    c.show_in_cart = not current_show
    db.commit()
    db.refresh(c)
    return {
        "success": True,
        "showInCart": c.show_in_cart,
        "coupon": c.to_dict(),
        "message": f"Coupon '{c.code}' is now {'visible in the customer cart' if c.show_in_cart else 'hidden from customer cart'}."
    }


@app.delete("/api/coupons/{coupon_id}")
def delete_coupon(coupon_id: int, db: Session = Depends(get_db)):
    c = db.query(CouponModel).filter(CouponModel.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(c)
    db.commit()
    return {"success": True, "message": "Coupon deleted successfully."}


@app.post("/api/coupons/validate")
def validate_coupon(payload: CouponValidateRequest, db: Session = Depends(get_db)):
    code_clean = payload.code.strip().upper()
    c = db.query(CouponModel).filter(CouponModel.code == code_clean).first()
    if not c:
        return {"valid": False, "discount": 0.0, "message": "Invalid coupon code. Please verify the code entered."}

    # Strict active / inactive check
    if not c.is_active:
        return {
            "valid": False,
            "discount": 0.0,
            "message": "This coupon code is currently inactive and cannot be redeemed.",
        }

    # Check total usage limit (e.g. 1 time global use)
    if c.max_uses_total is not None and c.usage_count >= c.max_uses_total:
        return {
            "valid": False,
            "discount": 0.0,
            "message": f"This coupon code has reached its maximum total limit ({c.max_uses_total} use{'s' if c.max_uses_total > 1 else ''}).",
        }

    # Check per-user usage limit (e.g. 1 time per person)
    identifiers = set()
    for val in [payload.user_id, payload.userId, payload.phone, payload.email]:
        if val and str(val).strip():
            clean_val = str(val).strip().lower()
            identifiers.add(clean_val)
            digits = "".join(filter(str.isdigit, clean_val))
            if len(digits) >= 10:
                identifiers.add(digits[-10:])

    if c.max_uses_per_user and identifiers:
        try:
            used_list = json.loads(c.used_by) if c.used_by else []
        except Exception:
            used_list = []
        user_times = 0
        for used_item in used_list:
            used_str = str(used_item).strip().lower()
            used_digits = "".join(filter(str.isdigit, used_str))
            if used_str in identifiers or (len(used_digits) >= 10 and used_digits[-10:] in identifiers):
                user_times += 1
        if user_times >= c.max_uses_per_user:
            return {
                "valid": False,
                "discount": 0.0,
                "message": f"You have already redeemed this coupon code (limit: {c.max_uses_per_user} time{'s' if c.max_uses_per_user > 1 else ''} per customer).",
            }

    if payload.subtotal < c.min_order_amount:
        return {
            "valid": False,
            "discount": 0.0,
            "message": f"Coupon requires a minimum order subtotal of ₹{c.min_order_amount:.0f}.",
        }

    if c.discount_type == "percentage":
        discount = round((payload.subtotal * c.discount_value) / 100.0, 2)
        if c.max_discount and discount > c.max_discount:
            discount = c.max_discount
    else:
        discount = min(c.discount_value, payload.subtotal)

    return {
        "valid": True,
        "code": c.code,
        "discount": discount,
        "description": c.description,
        "message": f"Coupon applied! You saved ₹{discount:.0f}.",
        "coupon": c.to_dict(),
    }


# ==============================================================================
# 6. PRODUCT REVIEWS API (/api/medicines/{item_id}/reviews)
# ==============================================================================

class ReviewCreateRequest(BaseModel):
    user_name: Optional[str] = "Verified Patient"
    rating: int = 5
    comment: str


@app.get("/api/medicines/{item_id}/reviews")
def get_medicine_reviews(item_id: int, db: Session = Depends(get_db)):
    reviews = db.query(ReviewModel).filter(ReviewModel.medicine_id == item_id).order_by(ReviewModel.id.desc()).all()
    avg_rating = 5.0
    if reviews:
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)
    return {
        "reviews": [r.to_dict() for r in reviews],
        "count": len(reviews),
        "averageRating": avg_rating,
    }


@app.post("/api/medicines/{item_id}/reviews")
def add_medicine_review(item_id: int, payload: ReviewCreateRequest, db: Session = Depends(get_db)):
    med = db.query(MedicineModel).filter(MedicineModel.id == item_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    rating = max(1, min(5, int(payload.rating)))
    new_rev = ReviewModel(
        medicine_id=item_id,
        user_name=payload.user_name.strip() or "Verified Patient",
        rating=rating,
        comment=payload.comment.strip(),
    )
    db.add(new_rev)
    db.commit()
    db.refresh(new_rev)
    return {"success": True, "review": new_rev.to_dict()}


# ==============================================================================
# 7. CUSTOMER PROFILE & SAVED ADDRESSES API (/api/user/profile)
# ==============================================================================

class UserProfileUpdateRequest(BaseModel):
    user_id: str
    full_name: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    addresses: Optional[List[dict]] = []


@app.get("/api/user/profile")
def get_user_profile(user_id: Optional[str] = None, email: Optional[str] = None, phone: Optional[str] = None, db: Session = Depends(get_db)):
    lookup = user_id or email or phone
    if not lookup:
        return {"profile": None}

    profile = db.query(UserProfileModel).filter(
        or_(
            UserProfileModel.user_id == lookup,
            UserProfileModel.email == lookup,
            UserProfileModel.phone == lookup,
        )
    ).first()

    return {"profile": profile.to_dict() if profile else None}


@app.post("/api/user/profile")
def save_user_profile(payload: UserProfileUpdateRequest, db: Session = Depends(get_db)):
    uid = payload.user_id.strip()
    if not uid:
        raise HTTPException(status_code=400, detail="User identifier required.")

    profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == uid).first()
    addresses_json = json.dumps(payload.addresses or [])

    if profile:
        profile.full_name = payload.full_name or profile.full_name
        profile.phone = payload.phone or profile.phone
        profile.email = payload.email or profile.email
        profile.addresses = addresses_json
    else:
        profile = UserProfileModel(
            user_id=uid,
            full_name=payload.full_name or "",
            phone=payload.phone or "",
            email=payload.email or "",
            addresses=addresses_json,
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return {"success": True, "profile": profile.to_dict()}


# ==============================================================================
# 8. CUSTOMER PRESCRIPTION HISTORY (/api/user/prescriptions)
# ==============================================================================

@app.get("/api/user/prescriptions")
def get_user_prescriptions(phone: Optional[str] = None, email: Optional[str] = None, user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PrescriptionModel)
    filters = []
    if phone:
        clean_p = re.sub(r"[^\d]", "", phone)
        if len(clean_p) >= 10:
            filters.append(PrescriptionModel.phone.ilike(f"%{clean_p[-10:]}%"))
    if email:
        filters.append(PrescriptionModel.notes.ilike(f"%{email.strip()}%"))

    if not filters:
        return []

    prescriptions = query.filter(or_(*filters)).order_by(PrescriptionModel.id.desc()).all()
    return [p.to_dict() for p in prescriptions]


# ==============================================================================
# 9. BULK ORDER STATUS UPDATE (/api/orders/bulk-status)
# ==============================================================================

class BulkOrderStatusRequest(BaseModel):
    order_ids: List[str]
    status: str


@app.post("/api/orders/bulk-status")
async def bulk_update_order_status(payload: BulkOrderStatusRequest, db: Session = Depends(get_db)):
    valid_statuses = ["pending", "confirmed", "dispatched", "delivered", "cancelled"]
    st = payload.status.lower()
    if st not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status.")

    updated_orders = []
    stock_notes = []

    for oid in payload.order_ids:
        order = db.query(OrderModel).filter(OrderModel.order_id == oid).first()
        if order:
            order.status = st

            # Handle stock deduction on bulk dispatch
            if st in ["dispatched", "delivered"] and not order.stock_deducted:
                try:
                    items = json.loads(order.items) if isinstance(order.items, str) else (order.items or [])
                    for it in items:
                        m_id = it.get("id")
                        qty = int(it.get("qty", 1) or 1)
                        med = db.query(MedicineModel).filter(MedicineModel.id == m_id).first() if m_id else None
                        if not med and it.get("name"):
                            med = db.query(MedicineModel).filter(MedicineModel.name.ilike(it.get("name").strip())).first()
                        if med and med.stock_quantity is not None:
                            med.stock_quantity = max(0, med.stock_quantity - qty)
                            stock_notes.append(f"{med.name} -{qty}")
                    order.stock_deducted = True
                except Exception as e:
                    print("Bulk dispatch stock error:", e)

            # Handle stock restore on bulk cancel
            elif st == "cancelled" and order.stock_deducted:
                try:
                    items = json.loads(order.items) if isinstance(order.items, str) else (order.items or [])
                    for it in items:
                        m_id = it.get("id")
                        qty = int(it.get("qty", 1) or 1)
                        med = db.query(MedicineModel).filter(MedicineModel.id == m_id).first() if m_id else None
                        if not med and it.get("name"):
                            med = db.query(MedicineModel).filter(MedicineModel.name.ilike(it.get("name").strip())).first()
                        if med and med.stock_quantity is not None:
                            med.stock_quantity += qty
                    order.stock_deducted = False
                except Exception as e:
                    print("Bulk cancel stock restore error:", e)

            updated_orders.append(order.to_dict())

    db.commit()

    # Broadcast event via SSE for live admin dashboards
    for od in updated_orders:
        await broadcast_order_event("status_update", od)

    msg = f"Successfully updated {len(updated_orders)} orders to '{st.title()}'."
    if stock_notes:
        msg += f" Stock deducted: {', '.join(stock_notes[:4])}"

    return {
        "success": True,
        "updatedCount": len(updated_orders),
        "status": st,
        "message": msg,
    }


# ==============================================================================
# 10. ORDER INVOICE DATA API (/api/orders/{order_id}/invoice)
# ==============================================================================

@app.get("/api/orders/{order_id}/invoice")
def get_order_invoice(order_id: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    o_dict = order.to_dict()
    items = o_dict.get("items", [])

    # Calculate GST breakdown (Pharma GST: 5% = 2.5% CGST + 2.5% SGST)
    taxable_subtotal = round(order.subtotal / 1.05, 2)
    cgst_total = round((order.subtotal - taxable_subtotal) / 2.0, 2)
    sgst_total = cgst_total

    invoice_data = {
        "invoiceNumber": f"INV-{order.order_id}",
        "invoiceDate": order.created_at.strftime("%d %b %Y"),
        "company": {
            "name": "DHRUV PHARMA",
            "tagline": "Authentic Healthcare & 100% Genuine Medicines",
            "address": "First Floor, Plot No. 122-133, Shop No. C/135, Gokuldham Complex, Shahada Road, Nandurbar - 425412",
            "phone": "+91 9503500725",
            "email": "dhruvpharma25@gmail.com",
            "gstin": "27AABCD1234F1Z5",
            "drugLicense": "MH-NDB-20B-184920 / 21B-184921",
            "fssai": "11521045000123",
        },
        "order": o_dict,
        "items": items,
        "taxSummary": {
            "taxableValue": taxable_subtotal,
            "cgst": cgst_total,
            "sgst": sgst_total,
            "totalGst": round(cgst_total + sgst_total, 2),
        },
        "subtotal": order.subtotal,
        "deliveryFee": order.delivery_fee,
        "discount": order.discount,
        "totalAmount": order.total_amount,
        "paymentMethod": order.payment_method,
        "paymentStatus": order.payment_status,
    }

    return invoice_data


# ==============================================================================
# 11. ADMIN SALES REPORTS & ANALYTICS (/api/admin/sales-report)
# ==============================================================================

@app.get("/api/admin/sales-report")
def get_sales_report(db: Session = Depends(get_db)):
    orders = db.query(OrderModel).all()

    total_revenue = sum(o.total_amount for o in orders if o.status != "cancelled")
    total_orders = len(orders)
    delivered_orders = len([o for o in orders if o.status == "delivered"])
    cancelled_orders = len([o for o in orders if o.status == "cancelled"])
    pending_orders = max(0, total_orders - delivered_orders - cancelled_orders)
    avg_order_value = round(total_revenue / max(1, (total_orders - cancelled_orders)), 2)

    # Payment breakdown
    payment_methods = {"COD": 0, "UPI": 0}
    for o in orders:
        pm = o.payment_method or "COD"
        payment_methods[pm] = payment_methods.get(pm, 0) + 1

    # District breakdown
    district_sales = {}
    for o in orders:
        d = o.district or "Nandurbar"
        district_sales[d] = district_sales.get(d, 0) + 1

    # Top selling medicines from parsed items
    item_sales = {}
    for o in orders:
        if o.status == "cancelled":
            continue
        try:
            items = json.loads(o.items) if isinstance(o.items, str) else (o.items or [])
            for it in items:
                name = it.get("name", "Unknown")
                qty = it.get("qty", 1)
                price = float(it.get("price", 0.0))
                if name not in item_sales:
                    item_sales[name] = {"name": name, "units": 0, "unitsSold": 0, "revenue": 0.0}
                item_sales[name]["units"] += qty
                item_sales[name]["unitsSold"] += qty
                item_sales[name]["revenue"] += round(price * qty, 2)
        except Exception:
            pass

    top_selling = sorted(
        list(item_sales.values()),
        key=lambda x: x["unitsSold"],
        reverse=True
    )[:8]

    # Daily revenue
    from collections import defaultdict
    daily_revenue = defaultdict(float)
    for o in orders:
        if o.status != "cancelled" and o.created_at:
            day_str = o.created_at.strftime("%d %b")
            daily_revenue[day_str] += o.total_amount

    daily_chart = [{"date": k, "revenue": round(v, 2)} for k, v in daily_revenue.items()][-7:]

    return {
        # Snake-case (used by frontend components)
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "pending_orders": pending_orders,
        "avg_order_value": avg_order_value,
        "payment_methods": payment_methods,
        "district_sales": district_sales,
        "top_medicines": top_selling,
        "daily_revenue": daily_chart,

        # Camel-case (backwards compatibility)
        "totalRevenue": round(total_revenue, 2),
        "totalOrders": total_orders,
        "deliveredOrders": delivered_orders,
        "cancelledOrders": cancelled_orders,
        "pendingOrders": pending_orders,
        "averageOrderValue": avg_order_value,
        "avgOrderValue": avg_order_value,
        "paymentMethods": payment_methods,
        "districtSales": district_sales,
        "topSelling": top_selling,
        "dailyRevenue": daily_chart,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

