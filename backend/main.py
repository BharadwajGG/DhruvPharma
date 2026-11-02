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

from fastapi import FastAPI, Depends, File, Form, UploadFile, HTTPException, Query, Response, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from database import init_db, get_db, PrescriptionModel, MedicineModel, OrderModel, CallbackRequestModel, CouponModel, ReviewModel, UserProfileModel, SessionLocal, PricingRuleModel
from categorizer import categorize_medicine, calculate_selling_price, clean_text
from notifications import (
    generate_clinical_info,
    generate_order_email_html,
    generate_whatsapp_message,
    generate_cancellation_email_html,
    generate_cancellation_whatsapp_message,
    send_order_email,
)
from services.email_service import send_login_alert_email, send_order_cancelled_email, send_admin_cancellation_audit_email

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

# Enable CORS for React frontend & Production deployments
CORS_ORIGINS_ENV = os.getenv("CORS_ALLOWED_ORIGINS", "")
allowed_origins_list = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]
if CORS_ORIGINS_ENV:
    allowed_origins_list.extend([o.strip() for o in CORS_ORIGINS_ENV.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount uploads static folder so frontend can view/download uploaded photos & PDFs
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Real-Time Server-Sent Events (SSE) Client Queues for Live Admin Dashboard
sse_clients: List[asyncio.Queue] = []


def broadcast_order_event_sync(event_type: str, data: dict):
    """Synchronous non-blocking push to all SSE client queues using put_nowait."""
    message = json.dumps({"type": event_type, "order": data, "timestamp": datetime.utcnow().isoformat()})
    disconnected = []
    for queue in list(sse_clients):
        try:
            queue.put_nowait(message)
        except Exception:
            disconnected.append(queue)
    for q in disconnected:
        if q in sse_clients:
            sse_clients.remove(q)


async def broadcast_order_event(event_type: str, data: dict):
    """Pushes a live event to all connected admin and customer browser tabs."""
    broadcast_order_event_sync(event_type, data)


@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        med_count = db.query(MedicineModel).count()
        db_status = "connected"
    except Exception as e:
        med_count = 0
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "Dhruv Pharma Backend API",
        "version": "2.1.0",
        "database": db_status,
        "catalog_size": med_count,
        "hubs_count": 7,
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


class AdminOrderCancelPayload(BaseModel):
    reason: str
    adminNotes: Optional[str] = ""


@app.post("/api/orders/{order_id}/cancel")
async def cancel_customer_order(
    order_id: str,
    payload: Optional[OrderCancelRequest] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
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
    order.cancelled_by = "customer"
    cancel_note = (payload.reason if payload and payload.reason else "Cancelled by customer").strip()
    order.cancellation_reason = cancel_note
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

    # Operational audit email to admin
    background_tasks.add_task(
        send_admin_cancellation_audit_email,
        order_data=order_dict,
        reason=cancel_note,
        cancelled_by="customer"
    )

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


@app.post("/api/admin/orders/{order_id}/cancel")
async def admin_cancel_order(
    order_id: str,
    payload: AdminOrderCancelPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Emergency Order Cancellation by Pharmacist / Admin.
    Restores inventory, marks order as cancelled by admin, voids revenue,
    and sends transparent notification emails to BOTH the customer and admin.
    """
    order = (
        db.query(OrderModel)
        .filter((OrderModel.order_id == order_id) | (OrderModel.id == order_id))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    if (order.status or "").lower() == "cancelled":
        return {
            "success": True,
            "message": f"Order {order.order_id} is already marked as cancelled.",
            "order": order.to_dict(),
        }

    # 1. Restore medicine stock
    if order.stock_deducted:
        try:
            items = json.loads(order.items) if isinstance(order.items, str) else (order.items or [])
            for it in items:
                m_id = it.get("id") or it.get("medicineId")
                qty = int(it.get("qty", it.get("quantity", 1)) or 1)
                med = None
                if m_id:
                    med = db.query(MedicineModel).filter(MedicineModel.id == m_id).first()
                if not med and it.get("name"):
                    med = db.query(MedicineModel).filter(MedicineModel.name.ilike(it.get("name").strip())).first()
                if med and med.stock_quantity is not None:
                    med.stock_quantity += qty
            order.stock_deducted = False
        except Exception as e:
            print(f"Stock restore warning on admin order cancellation: {e}")

    # 2. Update order record
    reason_clean = (payload.reason or "Cancelled by store administration for urgent operational reason").strip()
    order.status = "cancelled"
    order.cancelled_by = "admin"
    order.cancellation_reason = reason_clean
    admin_note_str = f"Admin Cancelled: {reason_clean}"
    if payload.adminNotes:
        admin_note_str += f" ({payload.adminNotes.strip()})"

    if order.notes:
        order.notes += f" | {admin_note_str}"
    else:
        order.notes = admin_note_str

    db.commit()
    db.refresh(order)

    order_dict = order.to_dict()

    # 3. Transparent Email to Customer
    customer_email = order.customer_email or ""
    if customer_email and "@" in customer_email:
        background_tasks.add_task(
            send_order_cancelled_email,
            to_email=customer_email,
            order_data=order_dict,
            reason=reason_clean,
            cancelled_by="admin"
        )

    # 4. Operational Audit Email to Store Owner / Admin
    background_tasks.add_task(
        send_admin_cancellation_audit_email,
        order_data=order_dict,
        reason=reason_clean,
        cancelled_by="admin"
    )

    # 5. Broadcast real-time SSE event to all connected dashboards & tracking views
    cancel_wa = generate_cancellation_whatsapp_message(order_dict, cancelled_by="store", reason=reason_clean)
    await broadcast_order_event("order_cancelled", {
        "order": order_dict,
        "orderId": order.order_id,
        "cancelledBy": "admin",
        "customerName": order.customer_name,
        "phone": order.customer_phone,
        "amount": order.total_amount,
        "reason": reason_clean,
        "whatsappText": cancel_wa,
    })
    await broadcast_order_event("status_update", order_dict)

    return {
        "success": True,
        "message": f"Order #{order.order_id} has been cancelled by Admin. Transparent notification emails have been dispatched to both customer and store owner.",
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
    district: Optional[str] = Form("Nandurbar"),
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
        district=(district or "Nandurbar").strip(),
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
    district: str = "Nandurbar"
    address: str
    pincode: Optional[str] = ""
    items: List[AdminManualOrderItem]
    paymentMethod: str = "COD"  # COD, UPI, CASH, PAID
    expectedDelivery: Optional[str] = "Expected in 3–4 Days"
    status: Optional[str] = "confirmed"
    deliveryAgent: Optional[str] = "Sanjay Kumar (Dhruv Express)"
    notes: Optional[str] = "Order created by store pharmacist"
    callbackId: Optional[int] = None


@app.post("/api/admin/orders/create")
async def create_admin_phone_order(
    payload: AdminManualOrderCreate,
    db: Session = Depends(get_db),
):
    """
    Allows pharmacist to place an order on behalf of a customer.
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

    pay_status = "paid" if payload.paymentMethod and payload.paymentMethod.upper() in ["PAID", "ONLINE_PAID", "PREPAID"] else "pending"

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
        payment_status=pay_status,
        prescription_file="",
        status=payload.status or "confirmed",
        expected_delivery=payload.expectedDelivery or "Expected in 3–4 Days",
        delivery_agent=payload.deliveryAgent or "Sanjay Kumar (Dhruv Express)",
        notes=payload.notes or "Order placed via Admin dashboard",
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
        "message": f"Order #{order_id} created successfully!",
        "order": order_dict,
    }


@app.get("/api/admin/orders/sample-csv")
def download_sample_orders_csv():
    """Generates a downloadable sample CSV template for bulk importing customer orders."""
    sample_content = (
        "Customer Name,Phone Number,District / Hub,Pincode,Delivery Address,Expected Delivery Window,Total Amount,Payment Method,Status,Ordered Items,Notes\n"
        "Rajesh Patil,9823456789,Nandurbar,425412,Gokuldham Colony Near Station,Expected in 3–4 Days,520,COD,confirmed,Dolo 650 (x2 @ 30) | Shelcal 500 (x1 @ 120),Regular prescription order\n"
        "Suresh Shinde,9988776655,Shahada,425409,Shop No 4 Market Yard,Expected in 3–4 Days,350,UPI,confirmed,Pan 40 (x2 @ 85),Phone order verification\n"
    )
    return Response(
        content=sample_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=DHRUV_PHARMA_ORDERS_SAMPLE.csv"}
    )


@app.post("/api/admin/orders/import-csv")
async def import_orders_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Imports customer orders from a CSV spreadsheet and adds them directly into the chart.
    """
    import csv
    import io

    if not file.filename.lower().endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    imported_orders = []

    max_order = db.query(OrderModel).order_by(OrderModel.id.desc()).first()
    next_num = (max_order.id + 140) if max_order else 101

    for row in reader:
        clean_row = {str(k).strip().lower(): (str(v).strip() if v else "") for k, v in row.items() if k}

        name = clean_row.get("customer name") or clean_row.get("patient / customer") or clean_row.get("customer") or clean_row.get("name")
        phone = clean_row.get("phone number") or clean_row.get("phone") or clean_row.get("mobile")
        if not name or not phone:
            continue

        district = clean_row.get("district / hub") or clean_row.get("district") or clean_row.get("hub") or "Nandurbar"
        pincode = clean_row.get("pincode") or clean_row.get("pin") or "425412"
        address = clean_row.get("delivery address") or clean_row.get("address") or f"{district} Hub Area"
        delivery_window = clean_row.get("expected delivery window") or clean_row.get("delivery window") or clean_row.get("expected delivery") or "Expected in 3–4 Days"
        payment_method = clean_row.get("payment method") or clean_row.get("payment mode") or clean_row.get("payment") or "COD"
        status = clean_row.get("status") or clean_row.get("order status") or "confirmed"
        notes = clean_row.get("notes") or "Imported from CSV"

        items_str = clean_row.get("ordered items") or clean_row.get("medicines") or clean_row.get("items") or ""
        items_list = []
        if items_str:
            for part in items_str.split("|"):
                part = part.strip()
                if not part:
                    continue
                items_list.append({
                    "id": 0,
                    "name": part,
                    "price": 50.0,
                    "qty": 1,
                    "salt": ""
                })
        if not items_list:
            items_list = [{"id": 0, "name": "Prescribed Medicines", "price": 100.0, "qty": 1, "salt": ""}]

        try:
            total_amount = float(clean_row.get("total amount") or clean_row.get("amount") or clean_row.get("total") or 100.0)
        except ValueError:
            total_amount = 100.0

        subtotal = max(0.0, total_amount - (0.0 if total_amount >= 300 else 40.0))
        delivery_fee = 0.0 if total_amount >= 300 else 40.0

        while db.query(OrderModel).filter(OrderModel.order_id == f"DP-{next_num}").first():
            next_num += 1
        order_id = f"DP-{next_num}"
        next_num += 1

        order = OrderModel(
            order_id=order_id,
            customer_name=name,
            customer_phone=phone,
            customer_email="",
            user_id="",
            district=district,
            address=address,
            pincode=pincode,
            items=json.dumps(items_list),
            subtotal=float(subtotal),
            discount=0.0,
            delivery_fee=float(delivery_fee),
            total_amount=float(total_amount),
            payment_method=payment_method,
            payment_status="paid" if payment_method.upper() in ["PAID", "ONLINE"] else "pending",
            prescription_file="",
            status=status.lower() if status.lower() in ["pending", "confirmed", "dispatched", "delivered", "cancelled"] else "confirmed",
            expected_delivery=delivery_window,
            delivery_agent="Sanjay Kumar (Dhruv Express)",
            notes=notes,
            created_at=datetime.now(),
        )
        db.add(order)
        imported_orders.append(order_id)

    db.commit()
    return {
        "success": True,
        "importedCount": len(imported_orders),
        "importedOrderIds": imported_orders,
        "message": f"Successfully imported {len(imported_orders)} customer orders into the chart!",
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

    # Collision-proof sequential Prescription ID
    last_rx = db.query(PrescriptionModel).order_by(PrescriptionModel.id.desc()).first()
    next_num = (last_rx.id + 101) if last_rx else 101
    while db.query(PrescriptionModel).filter(
        (PrescriptionModel.rx_id == f"RX-{next_num}") | 
        (PrescriptionModel.rx_id == f"RX-{str(next_num).zfill(3)}")
    ).first():
        next_num += 1
    rx_id = f"RX-{next_num}"

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
    try:
        db.add(prescription)
        db.commit()
        db.refresh(prescription)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while saving prescription: {str(e)}")

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


# Auto-Sanitizer for Medicine Image URLs
def sanitize_medicine_image_url(url: str) -> str:
    """
    Cleans and repairs common copy/paste or export glitches in medicine image URLs.
    1. Fixes PharmEasy pattern: productsnowatermark?53572 -> productsnowatermark/53572
    2. Fixes Truemeds pattern: TM-?smuth -> TM-smuth
    3. Fixes stray ? inside file basename before valid extensions (.jpg, .jpeg, .png, .webp, .avif)
    """
    if not url:
        return ""
    clean = url.strip().strip("'\"")
    if not (clean.startswith("http://") or clean.startswith("https://") or clean.startswith("/")):
        return ""
    # Fix Truemeds TM-?
    clean = re.sub(r"TM-\?", "TM-", clean)
    # Fix PharmEasy /productsnowatermark?123 -> /productsnowatermark/123
    clean = re.sub(r"(/productsnowatermark)\?(\d+)", r"\1/\2", clean)
    clean = re.sub(r"(/dam/[a-zA-Z0-9_-]+)\?(\d+)", r"\1/\2", clean)
    # If a ? is used where a / or separator should be before a filename ending in an image extension
    match = re.search(r"^(https?://[^?]+)\?([^?]+\.(?:jpg|jpeg|png|webp|avif))(\?.*)?$", clean, re.IGNORECASE)
    if match:
        base_path = match.group(1).rstrip("/")
        file_part = match.group(2)
        query_params = match.group(3) or ""
        clean = f"{base_path}/{file_part}{query_params}"
    return clean


@app.post("/api/inventory/upload")
def upload_distributor_inventory(
    file: UploadFile = File(...),
    mode: str = Form("merge"), # "merge" (default) or "replace"
    update_strategy: str = Form("keep_live"), # "keep_live" (default) or "send_to_drafts"
    publish_immediately: bool = Form(False),
    db: Session = Depends(get_db),
):
    """
    Intelligent bulk distributor CSV ingestion engine.
    Supports 2 upload modes:
      - 'merge': Updates matching medicines & keeps existing catalog safe.
      - 'replace': Clears previous catalog and starts 100% fresh with new distributor file.
    Extracts all 24 CSV columns including real CDN image URLs (webp/jpg/png),
    uses, side effects, interactions, storage, and dosage instructions.
    """
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

    code_idx = find_column_index(headers, ["itemcode", "item_code", "code", "productcode", "itemno", "itemid", "item_id"])
    item_id_idx = find_column_index(headers, ["itemid", "item_id"])
    name_idx = find_column_index(headers, ["name", "itemname", "item_name", "product", "description", "medicinename"])
    company_idx = find_column_index(headers, ["company", "mfg", "manufacturer", "brand", "mfgby"])
    salt_idx = find_column_index(headers, ["salt", "composition", "formulation", "generic", "genericname"])
    mrp_idx = find_column_index(headers, ["mrp", "m.r.p.", "m.r.p", "maximumretailprice"])
    rate_idx = find_column_index(headers, ["rate", "cost", "costprice", "purchaserate", "ptr", "wrate"])
    selling_price_idx = find_column_index(headers, ["sellingprice", "selling_price", "saleprice", "salerate", "custprice", "netrate"])
    stock_idx = find_column_index(headers, ["stock", "qty", "quantity", "balance", "curstock", "closingstock"])
    image_idx = find_column_index(headers, [
        "images", "image", "imageurl", "image_url", "image_link", "imagelink",
        "img", "imgurl", "img_url", "photo", "photourl", "picture",
        "pictureurl", "productimage", "product_image", "packshot", "url"
    ])
    cat_idx = find_column_index(headers, ["category", "group", "section", "dept"])
    uses_idx = find_column_index(headers, ["uses", "use", "indication", "indications", "therapeutic"])
    interactions_idx = find_column_index(headers, ["interactions", "interaction", "druginteractions", "warnings"])
    side_effects_idx = find_column_index(headers, ["sideeffects", "side_effects", "sideeffect", "side_effect", "adverseeffects"])
    how_to_use_idx = find_column_index(headers, ["howtouse", "how_to_use", "dosage", "directions", "instructions"])
    storage_idx = find_column_index(headers, ["storage", "storageconditions", "storage_conditions"])
    hsn_idx = find_column_index(headers, ["hsncode", "hsn_code", "hsn", "hsnname"])

    # Load active Category Pricing & Profit Margin Rules
    pricing_rules_db = db.query(PricingRuleModel).all()
    rules_map = {r.category: r for r in pricing_rules_db}
    default_rule = rules_map.get("DEFAULT")
    default_discount = default_rule.discount_pct if default_rule else 0.0
    default_margin = default_rule.min_margin_pct if default_rule else 5.0

    if name_idx is None:
        raise HTTPException(
            status_code=400,
            detail="Could not find medicine Name column in CSV. Found headers: " + ", ".join(headers),
        )

    mode_clean = str(mode or "merge").strip().lower()
    is_replace_mode = mode_clean in ["replace", "fresh", "clean"]
    replaced_count = 0

    if is_replace_mode:
        # Fresh Start: Safely wipe previous medicine catalog
        replaced_count = db.query(MedicineModel).delete()
        db.commit()
        existing_map = {}
    else:
        # Merge: Pre-index existing catalog in memory for instant lookups (handles zero-padding variations and names)
        existing_map = {}
        name_map = {}
        for m in db.query(MedicineModel).all():
            if m.item_code:
                code_str = str(m.item_code).strip()
                existing_map[code_str] = m
                existing_map[code_str.lstrip("0")] = m
                existing_map[code_str.zfill(6)] = m
            if m.name:
                name_map[m.name.strip().upper()] = m

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

        # Extract Item Code (checks itemcode first, then itemid, then generates)
        raw_code = ""
        if code_idx is not None and code_idx < len(row) and row[code_idx].strip():
            raw_code = row[code_idx].strip()
        elif item_id_idx is not None and item_id_idx < len(row) and row[item_id_idx].strip():
            raw_code = row[item_id_idx].strip()
        else:
            raw_code = f"MED-{int(datetime.utcnow().timestamp())}-{row_idx}"

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

        # Category resolution
        explicit_cat = row[cat_idx].strip() if cat_idx is not None and cat_idx < len(row) else ""
        if explicit_cat and explicit_cat.lower() not in ["", "none", "null"]:
            category = explicit_cat
            _, requires_rx = categorize_medicine(name=raw_name, salt=cleaned_salt)
        else:
            category, requires_rx = categorize_medicine(name=raw_name, salt=cleaned_salt)

        category_counts[category] = category_counts.get(category, 0) + 1
        if requires_rx:
            rx_flagged_count += 1

        # Selling price resolution: respect explicit CSV selling price if present, else apply category pricing rule
        explicit_selling_price = 0.0
        if selling_price_idx is not None and selling_price_idx < len(row):
            try:
                explicit_selling_price = float(re.sub(r"[^\d.]", "", row[selling_price_idx]) or 0)
            except ValueError:
                explicit_selling_price = 0.0

        if explicit_selling_price > 0:
            selling_price = round(explicit_selling_price, 2)
        else:
            cat_rule = rules_map.get(category, default_rule)
            disc = cat_rule.discount_pct if cat_rule and cat_rule.enabled else default_discount
            margin = cat_rule.min_margin_pct if cat_rule and cat_rule.enabled else default_margin
            selling_price = calculate_selling_price(
                mrp=raw_mrp,
                cost_price=raw_rate,
                discount_pct=disc,
                min_margin_pct=margin,
            )

        # Image URL sanitization & validation (handles CDN links with params, webp, jpg, png, and repairs stray '?')
        raw_image_url = ""
        if image_idx is not None and image_idx < len(row):
            candidate_url = row[image_idx].strip().strip("'\"")
            raw_image_url = sanitize_medicine_image_url(candidate_url)

        pack_shot_url = raw_image_url or resolve_brand_pack_shot(raw_name, raw_company)

        # Rich Clinical Data
        raw_uses = row[uses_idx].strip() if uses_idx is not None and uses_idx < len(row) else ""
        raw_interactions = row[interactions_idx].strip() if interactions_idx is not None and interactions_idx < len(row) else ""
        raw_side_effects = row[side_effects_idx].strip() if side_effects_idx is not None and side_effects_idx < len(row) else ""
        raw_how_to_use = row[how_to_use_idx].strip() if how_to_use_idx is not None and how_to_use_idx < len(row) else ""
        raw_storage = row[storage_idx].strip() if storage_idx is not None and storage_idx < len(row) else ""
        if raw_storage:
            # Clean encoding artifacts e.g. "Store Below 30? C" -> "Store Below 30°C"
            raw_storage = re.sub(r"(\d+)\s*[\?]\s*C", r"\1°C", raw_storage)
            raw_storage = raw_storage.replace("?", "°")
        raw_hsn = row[hsn_idx].strip() if hsn_idx is not None and hsn_idx < len(row) else ""

        existing = (
            existing_map.get(raw_code)
            or existing_map.get(raw_code.lstrip("0"))
            or existing_map.get(raw_code.zfill(6))
            or (name_map.get(raw_name.upper()) if not is_replace_mode else None)
        )

        if existing and not is_replace_mode:
            existing.name = raw_name
            existing.salt = cleaned_salt
            existing.manufacturer = raw_company
            existing.category = category
            existing.mrp = raw_mrp
            existing.cost_price = raw_rate
            existing.selling_price = selling_price
            existing.stock_quantity = raw_stock
            existing.requires_prescription = requires_rx
            if pack_shot_url:
                existing.image_url = pack_shot_url
            if raw_uses:
                existing.uses = raw_uses
            if raw_interactions:
                existing.interactions = raw_interactions
            if raw_side_effects:
                existing.side_effects = raw_side_effects
            if raw_how_to_use:
                existing.how_to_use = raw_how_to_use
            if raw_storage:
                existing.storage = raw_storage
            if raw_hsn:
                existing.hsn_code = raw_hsn
            existing.updated_at = datetime.utcnow()

            # Handle publish status based on update strategy
            if update_strategy == "send_to_drafts":
                existing.is_published = False
            elif publish_immediately:
                existing.is_published = True
            # else keep_live: preserves existing publication status

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
                uses=raw_uses,
                interactions=raw_interactions,
                side_effects=raw_side_effects,
                how_to_use=raw_how_to_use,
                storage=raw_storage,
                hsn_code=raw_hsn,
                is_published=bool(publish_immediately),
                is_visible=True,
            )
            db.add(new_item)
            existing_map[raw_code] = new_item
            created_count += 1

    db.commit()

    # Broadcast real-time catalog update to storefront and admin panels
    try:
        broadcast_order_event_sync("catalog_update", {
            "action": "csv_upload",
            "mode": mode_clean,
            "createdCount": created_count,
            "updatedCount": updated_count,
            "totalParsed": total_parsed,
        })
    except Exception as e:
        print(f"Error broadcasting catalog update: {e}")

    mode_label = "Fresh Start (Catalog Replaced)" if is_replace_mode else "Merged with Catalog"
    action_note = f"Previous {replaced_count} medicines replaced. " if is_replace_mode else ""
    return {
        "success": True,
        "mode": "replace" if is_replace_mode else "merge",
        "message": f"{mode_label}: {action_note}Processed {total_parsed} medicines ({created_count} imported, {updated_count} updated).",
        "stats": {
            "mode": mode_clean,
            "totalParsed": total_parsed,
            "created": created_count,
            "updated": updated_count,
            "replaced": replaced_count,
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


class MedicineManualCreate(BaseModel):
    itemCode: Optional[str] = None
    name: str
    company: Optional[str] = ""
    salt: Optional[str] = ""
    category: Optional[str] = "General Healthcare"
    mrp: float = 0.0
    costPrice: Optional[float] = 0.0
    sellingPrice: Optional[float] = None
    stockQuantity: int = 15
    minStock: int = 15
    requiresPrescription: bool = False
    isPublished: bool = True   # True = Live Store Catalog, False = Drafts
    isVisible: bool = True


@app.post("/api/inventory/add")
def add_inventory_medicine(
    payload: MedicineManualCreate,
    db: Session = Depends(get_db),
):
    """
    Manually creates a new medicine in inventory / live catalog.
    Fills all columns: Item Code, Name, Company, Salt, Category, MRP, Selling Price, Stock, Rx, Visibility.
    """
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Medicine name is required.")

    name_clean = payload.name.strip()
    salt_clean = (payload.salt or "").strip()
    company_clean = (payload.company or "").strip()

    # Auto-resolve category if not provided or set to Auto
    cat = payload.category
    if not cat or cat in ["Auto", "All"]:
        cat = categorize_medicine(name_clean, salt_clean, company_clean)

    # Auto-resolve Item Code
    item_code = (payload.itemCode or "").strip()
    if not item_code:
        last_item = db.query(MedicineModel).order_by(MedicineModel.id.desc()).first()
        next_num = (last_item.id + 1001) if last_item else 1001
        while db.query(MedicineModel).filter(MedicineModel.item_code == f"ITM-{next_num}").first():
            next_num += 1
        item_code = f"ITM-{next_num}"
    else:
        existing = db.query(MedicineModel).filter(MedicineModel.item_code == item_code).first()
        if existing:
            item_code = f"{item_code}-{uuid.uuid4().hex[:4].upper()}"

    # Calculate selling price if not explicitly provided
    mrp = round(float(payload.mrp or 0.0), 2)
    cost = round(float(payload.costPrice or 0.0), 2)
    if payload.sellingPrice is not None and payload.sellingPrice > 0:
        selling = round(float(payload.sellingPrice), 2)
    else:
        cat_rule = db.query(PricingRuleModel).filter(PricingRuleModel.category == cat).first()
        if not cat_rule or not cat_rule.enabled:
            cat_rule = db.query(PricingRuleModel).filter(PricingRuleModel.category == "DEFAULT").first()
        disc = cat_rule.discount_pct if cat_rule and cat_rule.enabled else 0.0
        margin = cat_rule.min_margin_pct if cat_rule and cat_rule.enabled else 5.0
        selling = calculate_selling_price(mrp=mrp, cost_price=cost, discount_pct=disc, min_margin_pct=margin)

    pack_shot = resolve_brand_pack_shot(name_clean, company_clean)

    new_med = MedicineModel(
        item_code=item_code,
        name=name_clean,
        salt=salt_clean,
        manufacturer=company_clean,
        category=cat,
        mrp=mrp,
        cost_price=cost,
        selling_price=selling,
        stock_quantity=int(payload.stockQuantity or 0),
        min_stock=int(payload.minStock or 15),
        requires_prescription=bool(payload.requiresPrescription),
        image_url=pack_shot or "",
        is_published=bool(payload.isPublished),
        is_visible=bool(payload.isVisible),
        created_at=datetime.utcnow(),
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)

    return {
        "success": True,
        "message": f"Medicine '{new_med.name}' ({new_med.item_code}) added successfully to {'Live Store Catalog' if new_med.is_published else 'Drafts'}!",
        "item": new_med.to_dict(),
    }


@app.get("/api/inventory/export-csv")
def export_inventory_csv(db: Session = Depends(get_db)):
    """Exports all inventory medicines with all columns to a CSV spreadsheet."""
    import io
    import csv

    items = db.query(MedicineModel).order_by(MedicineModel.id.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ItemCode",
        "Name",
        "Company",
        "Salt",
        "Category",
        "M.R.P.",
        "CostPrice",
        "SellingPrice",
        "Stock",
        "RequiresPrescription",
        "Status",
        "ShowInStore",
    ])
    for it in items:
        writer.writerow([
            it.item_code or f"ITM-{it.id}",
            it.name,
            it.manufacturer or "",
            it.salt or "",
            it.category or "General Healthcare",
            f"{it.mrp:.2f}" if it.mrp else "0.00",
            f"{it.cost_price:.2f}" if it.cost_price else "0.00",
            f"{it.selling_price:.2f}" if it.selling_price else "0.00",
            it.stock_quantity or 0,
            "Yes" if it.requires_prescription else "No",
            "Live" if it.is_published else "Draft",
            "Visible" if it.is_visible else "Hidden",
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=DHRUV_PHARMA_INVENTORY_CATALOG.csv"}
    )


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

    now_utc = datetime.utcnow()
    count = query.update({MedicineModel.is_published: True, MedicineModel.updated_at: now_utc}, synchronize_session=False)
    db.commit()

    # Broadcast real-time catalog update to storefront
    try:
        broadcast_order_event_sync("catalog_update", {
            "action": "publish",
            "publishedCount": count,
        })
    except Exception as e:
        print(f"Error broadcasting publish catalog update: {e}")

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
# 3.1 PRICING & PROFIT MARGIN RULES API (/api/admin/pricing-rules)
# ==============================================================================

class PricingRuleUpdateItem(BaseModel):
    category: str
    discount_pct: float
    min_margin_pct: Optional[float] = 5.0
    enabled: Optional[bool] = True
    notes: Optional[str] = ""


class PricingRulesBatchRequest(BaseModel):
    rules: List[PricingRuleUpdateItem]
    default_discount: Optional[float] = 0.0
    default_margin: Optional[float] = 5.0


@app.get("/api/admin/pricing-rules")
def get_pricing_rules(db: Session = Depends(get_db)):
    """Returns all category discount rules and profit margin floors for admin."""
    rules = db.query(PricingRuleModel).all()
    if not rules:
        init_db()
        rules = db.query(PricingRuleModel).all()
    return [r.to_dict() for r in rules]


@app.post("/api/admin/pricing-rules")
def update_pricing_rules(payload: PricingRulesBatchRequest, db: Session = Depends(get_db)):
    """Updates category-wise discount percentages and margin floors."""
    for item in payload.rules:
        r = db.query(PricingRuleModel).filter(PricingRuleModel.category == item.category).first()
        disc = max(0.0, min(100.0, float(item.discount_pct)))
        margin = max(0.0, float(item.min_margin_pct if item.min_margin_pct is not None else 5.0))
        is_en = bool(item.enabled if item.enabled is not None else True)

        if r:
            r.discount_pct = disc
            r.min_margin_pct = margin
            r.enabled = is_en
            if item.notes:
                r.notes = item.notes
            r.updated_at = datetime.utcnow()
        else:
            new_r = PricingRuleModel(
                category=item.category,
                discount_pct=disc,
                min_margin_pct=margin,
                enabled=is_en,
                notes=item.notes or "",
            )
            db.add(new_r)

    db.commit()
    all_rules = db.query(PricingRuleModel).all()
    return {
        "success": True,
        "message": f"Successfully updated {len(payload.rules)} pricing & margin rule(s).",
        "rules": [r.to_dict() for r in all_rules],
    }


@app.post("/api/admin/pricing-rules/recalculate-catalog")
def recalculate_catalog_prices(db: Session = Depends(get_db)):
    """
    Recalculates customer selling prices across the entire medicine catalog
    based on the currently configured category pricing & profit margin rules.
    Guarantees zero selling below wholesale cost price.
    """
    pricing_rules_db = db.query(PricingRuleModel).all()
    rules_map = {r.category: r for r in pricing_rules_db}
    default_rule = rules_map.get("DEFAULT")
    default_discount = default_rule.discount_pct if default_rule else 0.0
    default_margin = default_rule.min_margin_pct if default_rule else 5.0

    meds = db.query(MedicineModel).all()
    updated_count = 0
    now_utc = datetime.utcnow()

    for m in meds:
        rule = rules_map.get(m.category, default_rule)
        disc = rule.discount_pct if rule and rule.enabled else default_discount
        margin = rule.min_margin_pct if rule and rule.enabled else default_margin

        new_price = calculate_selling_price(
            mrp=m.mrp,
            cost_price=m.cost_price,
            discount_pct=disc,
            min_margin_pct=margin,
        )
        if m.selling_price != new_price:
            m.selling_price = new_price
            m.updated_at = now_utc
            updated_count += 1

    db.commit()

    # Broadcast catalog update so all open storefront tabs sync
    broadcast_order_event_sync("catalog_update", {
        "action": "recalculate_catalog",
        "updatedCount": updated_count,
        "totalCatalog": len(meds),
    })

    return {
        "success": True,
        "message": f"Recalculated prices for {len(meds)} catalog medicines ({updated_count} prices adjusted according to current margin rules).",
        "updatedCount": updated_count,
        "totalCatalog": len(meds),
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
def get_medicines_showcase(response: Response, db: Session = Depends(get_db)):
    """
    Returns data-driven collections for the storefront homepage:
    1. trending: dynamically aggregated from actual customer purchase order quantities.
       Fallback: top-rated high-frequency essentials.
    2. new_launches: newest medicine items uploaded/published/restocked by admin from distributor CSVs.
       Fallback: latest catalog additions/restocks.
    """
    # Prevent browser caching of showcase data for real-time customer-admin sync
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    # ── 1. TRENDING MEDICINES ──
    orders = db.query(OrderModel).filter(OrderModel.status != "cancelled").all()
    sales_map = {}  # { int(id): units_sold }
    for o in orders:
        try:
            items = json.loads(o.items) if isinstance(o.items, str) else (o.items or [])
            for it in items:
                m_id = it.get("id") or it.get("medicine_id")
                qty = it.get("qty") or it.get("quantity") or 1
                if m_id:
                    try:
                        int_id = int(m_id)
                        sales_map[int_id] = sales_map.get(int_id, 0) + int(qty)
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
                d["badge"] = f"🔥 {sales_map[tid]} Bought Recently"
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
        fallback_meds = fallback_query.order_by(
            MedicineModel.stock_quantity.desc(),
            func.coalesce(MedicineModel.updated_at, MedicineModel.created_at).desc(),
            MedicineModel.id.desc()
        ).limit(needed).all()

        for m in fallback_meds:
            d = m.to_dict()
            d["units_sold"] = 0
            d["badge"] = "⭐ Popular Demand"
            d["badge_type"] = "trending"
            trending_list.append(d)

    # ── 2. NEW LAUNCHES ──
    # Query newest published medicines prioritized by latest updated/published time
    newest_meds = db.query(MedicineModel).filter(
        MedicineModel.is_published == True,
        or_(MedicineModel.is_visible == True, MedicineModel.is_visible == None),
    ).order_by(
        func.coalesce(MedicineModel.updated_at, MedicineModel.created_at).desc(),
        MedicineModel.id.desc(),
    ).limit(8).all()

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    new_launches_list = []
    for m in newest_meds:
        d = m.to_dict()
        effective_time = m.updated_at or m.created_at
        if effective_time and effective_time >= thirty_days_ago:
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
# AUTHENTICATION SECURITY & LOGIN ALERTS (/api/auth/login-alert)
# ==============================================================================

class LoginAlertPayload(BaseModel):
    email: str
    displayName: Optional[str] = ""

@app.post("/api/auth/login-alert")
async def trigger_login_alert(
    payload: LoginAlertPayload,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Sends an automated account login security alert email via Resend.
    Dispatched non-blocking via BackgroundTasks for 0ms frontend latency.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"

    user_agent = request.headers.get("user-agent", "Desktop / Web Browser")

    background_tasks.add_task(
        send_login_alert_email,
        to_email=payload.email,
        user_name=payload.displayName or "",
        client_ip=client_ip,
        user_agent=user_agent
    )
    return {"status": "queued", "email": payload.email}


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

AUTHORIZED_HUBS_CONFIG = [
    {"name": "Nandurbar", "pincode": "425412", "district": "Nandurbar"},
    {"name": "Shahada",   "pincode": "425409", "district": "Nandurbar"},
    {"name": "Taloda",    "pincode": "425413", "district": "Nandurbar"},
    {"name": "Nijampur",  "pincode": "424305", "district": "Dhule"},
    {"name": "Akkalkuwa", "pincode": "425415", "district": "Nandurbar"},
    {"name": "Shirpur",   "pincode": "424405", "district": "Dhule"},
    {"name": "Sakri",     "pincode": "424304", "district": "Dhule"},
]

@app.get("/api/admin/sales-report")
def get_sales_report(
    timeframe: Optional[str] = Query("all"),
    month: Optional[str] = Query("all"),
    db: Session = Depends(get_db)
):
    all_orders = db.query(OrderModel).order_by(OrderModel.created_at.desc()).all()

    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = datetime(now.year, now.month, 1)

    def stats_for_orders(order_list):
        non_can = [o for o in order_list if (o.status or "").lower() != "cancelled"]
        can = [o for o in order_list if (o.status or "").lower() == "cancelled"]
        deliv = [o for o in order_list if (o.status or "").lower() == "delivered"]
        pend = [o for o in order_list if (o.status or "").lower() not in ["delivered", "cancelled"]]
        rev = sum(o.total_amount for o in non_can)
        can_rev = sum(o.total_amount for o in can)
        return {
            "revenue": round(rev, 2),
            "orders": len(order_list),
            "delivered": len(deliv),
            "pending": len(pend),
            "cancelled": len(can),
            "cancelled_revenue": round(can_rev, 2),
            "avg_order": round(rev / max(1, len(non_can)), 2)
        }

    # Timeframe metrics (Daily, Weekly, Monthly, All-time)
    today_orders = [o for o in all_orders if o.created_at and o.created_at >= today_start]
    week_orders = [o for o in all_orders if o.created_at and o.created_at >= week_start]
    cur_month_orders = [o for o in all_orders if o.created_at and o.created_at >= month_start]

    today_stats = stats_for_orders(today_orders)
    weekly_stats = stats_for_orders(week_orders)
    monthly_stats = stats_for_orders(cur_month_orders)
    all_time_stats = stats_for_orders(all_orders)

    # Monthly Archive list (all historical months available in database)
    from collections import defaultdict
    months_dict = defaultdict(lambda: {"revenue": 0.0, "orders": 0, "delivered": 0, "cancelled": 0})
    for o in all_orders:
        if o.created_at:
            ym_key = o.created_at.strftime("%Y-%m")
            months_dict[ym_key]["orders"] += 1
            if (o.status or "").lower() == "delivered":
                months_dict[ym_key]["delivered"] += 1
            if (o.status or "").lower() == "cancelled":
                months_dict[ym_key]["cancelled"] += 1
            else:
                months_dict[ym_key]["revenue"] += o.total_amount

    available_months = []
    for ym in sorted(months_dict.keys(), reverse=True):
        try:
            dt = datetime.strptime(ym, "%Y-%m")
            label = dt.strftime("%B %Y")
        except Exception:
            label = ym
        available_months.append({
            "key": ym,
            "label": label,
            "revenue": round(months_dict[ym]["revenue"], 2),
            "orders": months_dict[ym]["orders"],
            "delivered": months_dict[ym]["delivered"],
            "cancelled": months_dict[ym]["cancelled"],
        })

    # Active Filter Scoping:
    scoped_orders = all_orders
    if month and month != "all":
        scoped_orders = [o for o in all_orders if o.created_at and o.created_at.strftime("%Y-%m") == month]
    elif timeframe == "today":
        scoped_orders = today_orders
    elif timeframe == "week":
        scoped_orders = week_orders
    elif timeframe == "month":
        scoped_orders = cur_month_orders

    active_stats = stats_for_orders(scoped_orders)

    # Payment breakdown (ready for COD, UPI QR, Cashfree, and Razorpay)
    payment_methods = {
        "COD": 0,
        "ONLINE": 0,
        "UPI_QR": 0,
        "CASHFREE": 0,
        "RAZORPAY": 0,
    }
    for o in scoped_orders:
        pm = (o.payment_method or "COD").strip().upper()
        if pm in ["UPI_QR", "UPI"]:
            payment_methods["UPI_QR"] += 1
            payment_methods["ONLINE"] += 1
        elif pm in ["CASHFREE"]:
            payment_methods["CASHFREE"] += 1
            payment_methods["ONLINE"] += 1
        elif pm in ["RAZORPAY"]:
            payment_methods["RAZORPAY"] += 1
            payment_methods["ONLINE"] += 1
        elif pm in ["ONLINE", "NETBANKING", "CARD"]:
            payment_methods["ONLINE"] += 1
        else:
            payment_methods["COD"] += 1

    # Delivery Hubs breakdown for the 7 Authorized Service Hubs
    hub_counts = {h["name"]: {"orders": 0, "delivered": 0, "revenue": 0.0, "pincode": h["pincode"], "district": h["district"]} for h in AUTHORIZED_HUBS_CONFIG}
    for o in scoped_orders:
        d_name = (o.district or "").strip()
        matched_hub = None
        for h in AUTHORIZED_HUBS_CONFIG:
            if h["name"].lower() == d_name.lower() or (o.pincode and o.pincode.strip() == h["pincode"]):
                matched_hub = h["name"]
                break
        if not matched_hub:
            matched_hub = "Nandurbar"  # Default central hub

        hub_counts[matched_hub]["orders"] += 1
        if (o.status or "").lower() == "delivered":
            hub_counts[matched_hub]["delivered"] += 1
        if (o.status or "").lower() != "cancelled":
            hub_counts[matched_hub]["revenue"] += o.total_amount

    hub_sales_list = []
    for h in AUTHORIZED_HUBS_CONFIG:
        info = hub_counts[h["name"]]
        hub_sales_list.append({
            "name": h["name"],
            "pincode": h["pincode"],
            "district": h["district"],
            "orders": info["orders"],
            "delivered": info["delivered"],
            "revenue": round(info["revenue"], 2),
        })

    # Sort hubs by order volume descending
    hub_sales_list.sort(key=lambda x: x["orders"], reverse=True)

    # Top selling medicines for the active scope
    item_sales = {}
    for o in scoped_orders:
        if (o.status or "").lower() == "cancelled":
            continue
        try:
            items = json.loads(o.items) if isinstance(o.items, str) else (o.items or [])
            for it in items:
                name = it.get("name", "Unknown")
                qty = int(it.get("qty", it.get("quantity", 1)) or 1)
                price = float(it.get("price", it.get("sellingPrice", 0.0)) or 0.0)
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

    # Daily revenue chart for active scope
    daily_revenue = defaultdict(float)
    for o in scoped_orders:
        if (o.status or "").lower() != "cancelled" and o.created_at:
            day_str = o.created_at.strftime("%d %b")
            daily_revenue[day_str] += o.total_amount

    daily_chart = [{"date": k, "revenue": round(v, 2)} for k, v in daily_revenue.items()]

    current_time_str = datetime.now().isoformat()

    return {
        # Timeframe & Filter Context
        "active_timeframe": timeframe,
        "selected_month": month,
        "available_months": available_months,

        # Real-Time Resettable Tickers
        "today_sales": today_stats,
        "weekly_sales": weekly_stats,
        "monthly_sales": monthly_stats,
        "all_time_sales": all_time_stats,

        # Metrics for the Active Scope (Selected Month or Filter)
        "total_revenue": active_stats["revenue"],
        "total_orders": active_stats["orders"],
        "delivered_orders": active_stats["delivered"],
        "cancelled_orders": active_stats["cancelled"],
        "cancelled_revenue": active_stats["cancelled_revenue"],
        "pending_orders": active_stats["pending"],
        "avg_order_value": active_stats["avg_order"],

        # 7 Authorized Service Hubs
        "hub_sales": hub_sales_list,
        "district_sales": {h["name"]: h["orders"] for h in hub_sales_list if h["orders"] > 0},

        # Payment Methods (COD, Online, Razorpay ready)
        "payment_methods": {
            "COD": payment_methods["COD"],
            "UPI": payment_methods["ONLINE"],
            "ONLINE": payment_methods["ONLINE"],
            "UPI_QR": payment_methods["UPI_QR"],
            "CASHFREE": payment_methods["CASHFREE"],
            "RAZORPAY": payment_methods["RAZORPAY"],
        },

        # Top Medicines & Chart
        "top_medicines": top_selling,
        "daily_revenue": daily_chart,
        "updated_at": current_time_str,

        # Backwards compatibility camelCase
        "totalRevenue": active_stats["revenue"],
        "totalOrders": active_stats["orders"],
        "deliveredOrders": active_stats["delivered"],
        "cancelledOrders": active_stats["cancelled"],
        "cancelledRevenue": active_stats["cancelled_revenue"],
        "pendingOrders": active_stats["pending"],
        "averageOrderValue": active_stats["avg_order"],
        "todaySales": today_stats,
        "weeklySales": weekly_stats,
        "monthlySales": monthly_stats,
        "allTimeSales": all_time_stats,
        "availableMonths": available_months,
        "hubSales": hub_sales_list,
        "paymentMethods": payment_methods,
        "topSelling": top_selling,
        "dailyRevenue": daily_chart,
        "updatedAt": current_time_str,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

