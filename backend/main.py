import os
import io
import re
import csv
import json
import shutil
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, File, Form, UploadFile, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import init_db, get_db, PrescriptionModel, MedicineModel
from categorizer import categorize_medicine, calculate_selling_price, clean_text

# Ensure upload folders exist
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
PRESCRIPTIONS_DIR = os.path.join(UPLOADS_DIR, "prescriptions")
os.makedirs(PRESCRIPTIONS_DIR, exist_ok=True)

# Initialize database
init_db()

app = FastAPI(
    title="Dhruv Pharma Backend API",
    description="Backend API for DhruvPharma: inventory categorization, staging catalog, live patient store, and prescription uploads.",
    version="2.0.0",
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


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Dhruv Pharma Backend API",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ==============================================================================
# 1. PRESCRIPTION WORKFLOW ENDPOINTS
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


# ==============================================================================
# 2. INVENTORY AUTO-CATEGORIZATION & STAGING WORKSPACE
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
    # Substring fallback
    for cand in candidates:
        cand_clean = normalize_header(cand)
        for idx, h in enumerate(clean_headers):
            if cand_clean in h and len(h) <= len(cand_clean) + 4:
                return idx
    return None


@app.get("/api/inventory/sample-csv")
def download_sample_csv():
    """Provides a sample distributor CSV for testing the staging and auto-categorization system."""
    sample_path = os.path.join(BASE_DIR, "sample_distributor_inventory.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample CSV not found")
    return FileResponse(
        sample_path,
        media_type="text/csv",
        filename="DHRUV_PHARMA_DISTRIBUTOR_SAMPLE.csv",
    )


@app.post("/api/inventory/upload")
async def upload_distributor_inventory(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Ingests raw distributor CSV file, runs intelligent auto-categorization,
    calculates selling prices with margins, flags Schedule H prescriptions,
    and inserts items into the Staging Queue (is_published = False).
    """
    if not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are currently supported.")

    content_bytes = await file.read()

    # Try standard encodings commonly used by Indian billing & distributor software
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

    # Map distributor columns
    code_idx = find_column_index(headers, ["itemcode", "item_code", "code", "itemid", "item_id", "productcode", "itemno"])
    name_idx = find_column_index(headers, ["name", "itemname", "item_name", "product", "description", "medicinename"])
    company_idx = find_column_index(headers, ["company", "mfg", "manufacturer", "brand", "mfgby"])
    salt_idx = find_column_index(headers, ["salt", "composition", "formulation", "generic", "genericname"])
    mrp_idx = find_column_index(headers, ["mrp", "m.r.p.", "m.r.p", "maximumretailprice"])
    rate_idx = find_column_index(headers, ["rate", "cost", "costprice", "purchaserate", "ptr", "wrate"])
    stock_idx = find_column_index(headers, ["stock", "qty", "quantity", "balance", "curstock", "closingstock"])

    if name_idx is None:
        raise HTTPException(
            status_code=400,
            detail="Could not find medicine Name column in CSV. Found headers: " + ", ".join(headers),
        )

    staged_items = []
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

        # Parse numeric values
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

        # Run Auto-Categorization & Prescription Intelligence
        category, requires_rx = categorize_medicine(name=raw_name, salt=cleaned_salt)
        category_counts[category] = category_counts.get(category, 0) + 1
        if requires_rx:
            rx_flagged_count += 1

        # Calculate Customer Selling Price with discount
        selling_price = calculate_selling_price(mrp=raw_mrp, cost_price=raw_rate, discount_pct=12.0)

        # Check existing item by item_code
        existing = db.query(MedicineModel).filter(MedicineModel.item_code == raw_code).first()

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
            existing.is_published = False  # Placed back into Staging for admin approval
            updated_count += 1
            staged_items.append(existing)
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
                is_published=False,  # Enters Staging first
            )
            db.add(new_item)
            created_count += 1
            staged_items.append(new_item)

    db.commit()

    return {
        "success": True,
        "message": f"Successfully ingested {total_parsed} medicines into the Staging Catalog.",
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
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns paginated medicines currently in Staging (Draft mode, not yet live)."""
    query = db.query(MedicineModel).filter(MedicineModel.is_published == False)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MedicineModel.name.ilike(search_filter),
                MedicineModel.salt.ilike(search_filter),
                MedicineModel.manufacturer.ilike(search_filter),
                MedicineModel.item_code.ilike(search_filter),
            )
        )

    if category and category != "All":
        query = query.filter(MedicineModel.category == category)

    total_count = query.count()
    items = (
        query.order_by(MedicineModel.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    # Category breakdown for all staged items
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
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns paginated medicines published and live on the patient storefront."""
    query = db.query(MedicineModel).filter(MedicineModel.is_published == True)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MedicineModel.name.ilike(search_filter),
                MedicineModel.salt.ilike(search_filter),
                MedicineModel.manufacturer.ilike(search_filter),
                MedicineModel.item_code.ilike(search_filter),
            )
        )

    if category and category != "All":
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


@app.patch("/api/inventory/{item_id}")
def update_inventory_item(
    item_id: int,
    payload: MedicineUpdateRequest,
    db: Session = Depends(get_db),
):
    """Inline update for any staged or published medicine."""
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

    db.commit()
    db.refresh(item)
    return {"success": True, "item": item.to_dict()}


@app.delete("/api/inventory/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    """Deletes an item from inventory."""
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
    """
    Publishes staged medicines to the live storefront (sets is_published = True).
    If item_ids is provided, publishes only those; otherwise publishes ALL staged medicines.
    """
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
    """Discards all draft medicines currently in staging."""
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
# 3. CUSTOMER LIVE STOREFRONT ENDPOINTS (/api/medicines)
# ==============================================================================

@app.get("/api/medicines")
def get_customer_medicines(
    category: Optional[str] = Query("All"),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("popular"),
    db: Session = Depends(get_db),
):
    """
    Customer storefront query: Strictly returns items that are published
    (is_published == True) and in stock (stock_quantity > 0).
    """
    query = db.query(MedicineModel).filter(
        MedicineModel.is_published == True,
        MedicineModel.stock_quantity > 0,
    )

    if category and category != "All":
        query = query.filter(MedicineModel.category == category)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MedicineModel.name.ilike(search_filter),
                MedicineModel.salt.ilike(search_filter),
                MedicineModel.manufacturer.ilike(search_filter),
            )
        )

    if sort == "price_asc":
        query = query.order_by(MedicineModel.selling_price.asc())
    elif sort == "price_desc":
        query = query.order_by(MedicineModel.selling_price.desc())
    else:
        query = query.order_by(MedicineModel.id.desc())

    medicines = query.all()
    return [m.to_dict() for m in medicines]


@app.get("/api/medicines/{item_id}")
def get_customer_medicine_detail(item_id: int, db: Session = Depends(get_db)):
    """Customer medicine detail endpoint."""
    item = (
        db.query(MedicineModel)
        .filter(MedicineModel.id == item_id, MedicineModel.is_published == True)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found in catalog.")
    return item.to_dict()
