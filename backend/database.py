import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "dhruv_pharma.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PrescriptionModel(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    rx_id = Column(String(50), unique=True, index=True)
    patient_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    district = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True, default="")
    status = Column(String(50), default="pending", index=True)  # pending, reviewed, approved, rejected
    files = Column(Text, nullable=False, default="[]")  # JSON list of file URLs / names
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        try:
            parsed_files = json.loads(self.files)
        except Exception:
            parsed_files = []

        return {
            "id": self.rx_id,
            "numericId": self.id,
            "patient": self.patient_name,
            "phone": self.phone,
            "district": self.district,
            "address": self.address,
            "notes": self.notes or "",
            "status": self.status,
            "files": parsed_files,
            "submittedAt": self.created_at.strftime("%d %b %Y, %I:%M %p") if self.created_at else "",
        }


class MedicineModel(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(100), unique=True, index=True)
    name = Column(String(250), nullable=False, index=True)
    salt = Column(String(250), nullable=True, default="")
    manufacturer = Column(String(200), nullable=True, default="")
    category = Column(String(100), nullable=False, index=True)
    mrp = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    stock_quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=15)
    requires_prescription = Column(Boolean, default=False)
    image_url = Column(String(500), nullable=True, default="")
    is_published = Column(Boolean, default=False, index=True)  # False = Staged/Draft, True = Live Store
    is_visible = Column(Boolean, default=True, index=True)  # Free will of store owner to showcase/hide in store
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        discount_pct = 0
        if self.mrp and self.mrp > 0 and self.selling_price and self.selling_price < self.mrp:
            discount_pct = round(((self.mrp - self.selling_price) / self.mrp) * 100)

        return {
            "id": self.id,
            "itemCode": self.item_code,
            "name": self.name,
            "salt": self.salt or "",
            "brand": self.manufacturer or "Generic",
            "manufacturer": self.manufacturer or "",
            "category": self.category,
            "mrp": round(self.mrp, 2),
            "costPrice": round(self.cost_price, 2),
            "price": round(self.selling_price, 2),  # used by customer store components
            "sellingPrice": round(self.selling_price, 2),
            "stock": self.stock_quantity,
            "stockQuantity": self.stock_quantity,
            "minStock": self.min_stock,
            "requires_rx": self.requires_prescription,
            "requiresPrescription": self.requires_prescription,
            "imageUrl": self.image_url or "",
            "image_url": self.image_url or "",
            "isPublished": self.is_published,
            "isVisible": self.is_visible if self.is_visible is not None else True,
            "is_visible": self.is_visible if self.is_visible is not None else True,
            "inStock": self.stock_quantity > 0,
            "discountPct": discount_pct,
            "rating": 4.7,
            "reviews": 85,
            "createdAt": self.created_at.strftime("%d %b %Y, %I:%M %p") if self.created_at else "",
        }


class OrderModel(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, index=True)  # e.g. DP-101
    customer_name = Column(String(200), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    customer_email = Column(String(200), nullable=True, default="")
    user_id = Column(String(100), nullable=True, index=True, default="")
    district = Column(String(100), nullable=False)  # Pune, Nashik, Ahmednagar, Aurangabad
    address = Column(Text, nullable=False)
    pincode = Column(String(20), nullable=True, default="")
    items = Column(Text, nullable=False, default="[]")  # JSON list of cart items
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_method = Column(String(50), default="COD")  # COD, UPI
    payment_status = Column(String(50), default="pending")  # pending, paid
    prescription_file = Column(String(300), nullable=True, default="")
    status = Column(String(50), default="pending", index=True)  # pending, confirmed, dispatched, delivered, cancelled
    expected_delivery = Column(String(150), nullable=True, default="Expected in 3–4 Days")
    delivery_agent = Column(String(100), nullable=True, default="Sanjay Kumar (Dhruv Express)")
    stock_deducted = Column(Boolean, default=False)
    notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        try:
            parsed_items = json.loads(self.items)
        except Exception:
            parsed_items = []

        return {
            "id": self.order_id,
            "numericId": self.id,
            "orderId": self.order_id,
            "patient": self.customer_name,
            "customerName": self.customer_name,
            "phone": self.customer_phone,
            "email": self.customer_email or "",
            "userId": self.user_id or "",
            "district": self.district,
            "address": self.address,
            "pincode": self.pincode or "",
            "items": parsed_items,
            "itemCount": sum(i.get("qty", 1) for i in parsed_items) if parsed_items else 0,
            "subtotal": round(self.subtotal, 2),
            "discount": round(self.discount, 2),
            "deliveryFee": round(self.delivery_fee, 2),
            "amount": round(self.total_amount, 2),
            "totalAmount": round(self.total_amount, 2),
            "paymentMethod": self.payment_method,
            "paymentStatus": self.payment_status,
            "prescriptionFile": self.prescription_file or "",
            "status": self.status,
            "expectedDelivery": self.expected_delivery or "Expected in 3–4 Days",
            "type": "prescription" if bool(self.prescription_file) else "direct",
            "agent": self.delivery_agent or "—",
            "deliveryAgent": self.delivery_agent or "—",
            "stockDeducted": bool(self.stock_deducted),
            "stock_deducted": bool(self.stock_deducted),
            "notes": self.notes or "",
            "date": self.created_at.strftime("%d %b %Y, %I:%M %p") if self.created_at else "",
            "createdAt": self.created_at.strftime("%d %b %Y, %I:%M %p") if self.created_at else "",
        }


class CallbackRequestModel(Base):
    __tablename__ = "callback_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(200), nullable=False)
    customer_phone = Column(String(50), nullable=False, index=True)
    district = Column(String(100), nullable=False, default="Pune")
    preferred_time = Column(String(100), default="Immediate (within 15 mins)")
    medicines_needed = Column(Text, nullable=True, default="")
    prescription_file = Column(String(300), nullable=True, default="")
    status = Column(String(50), default="pending", index=True)  # pending, called, converted, cancelled
    admin_notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "requestId": f"CB-{self.id:04d}",
            "customerName": self.customer_name,
            "phone": self.customer_phone,
            "district": self.district,
            "preferredTime": self.preferred_time or "Immediate (within 15 mins)",
            "medicinesNeeded": self.medicines_needed or "",
            "prescriptionFile": self.prescription_file or "",
            "status": self.status,
            "adminNotes": self.admin_notes or "",
            "createdAt": self.created_at.strftime("%d %b %Y, %I:%M %p") if self.created_at else "",
            "timeAgo": "Recent",
        }


class CouponModel(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(200), default="")
    discount_type = Column(String(20), default="percentage")  # "percentage" or "fixed"
    discount_value = Column(Float, default=10.0)  # 10% or ₹50
    min_order_amount = Column(Float, default=0.0)
    max_discount = Column(Float, default=500.0)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    max_uses_total = Column(Integer, nullable=True, default=None)  # None = Unlimited, 1 = 1-time global use
    max_uses_per_user = Column(Integer, default=1)  # 1 = 1-time per customer, 0/None = Unlimited
    used_by = Column(Text, default="[]")  # JSON list of user identifiers (phone, email, uid)
    show_in_cart = Column(Boolean, default=False)  # Owner controls whether coupon is shown in customer cart
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        try:
            used_list = json.loads(self.used_by) if self.used_by else []
        except Exception:
            used_list = []

        return {
            "id": self.id,
            "code": self.code,
            "description": self.description or "",
            "discount_type": self.discount_type,
            "discountType": self.discount_type,
            "discount_value": self.discount_value,
            "discountValue": self.discount_value,
            "min_order_amount": self.min_order_amount,
            "minOrderAmount": self.min_order_amount,
            "max_discount": self.max_discount,
            "maxDiscount": self.max_discount,
            "is_active": self.is_active,
            "isActive": self.is_active,
            "usage_count": self.usage_count,
            "usageCount": self.usage_count,
            "max_uses_total": self.max_uses_total,
            "maxUsesTotal": self.max_uses_total,
            "max_uses_per_user": self.max_uses_per_user,
            "maxUsesPerUser": self.max_uses_per_user,
            "show_in_cart": bool(self.show_in_cart) if self.show_in_cart is not None else False,
            "showInCart": bool(self.show_in_cart) if self.show_in_cart is not None else False,
            "usedByCount": len(used_list),
            "createdAt": self.created_at.strftime("%d %b %Y") if self.created_at else "",
        }


class ReviewModel(Base):
    __tablename__ = "product_reviews"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False, index=True)
    user_name = Column(String(150), default="Verified Patient")
    rating = Column(Integer, default=5)
    comment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "medicineId": self.medicine_id,
            "userName": self.user_name,
            "rating": self.rating,
            "comment": self.comment or "",
            "createdAt": self.created_at.strftime("%d %b %Y") if self.created_at else "",
        }


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(200), default="")
    phone = Column(String(50), default="")
    email = Column(String(200), default="")
    addresses = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        try:
            parsed_addresses = json.loads(self.addresses)
        except Exception:
            parsed_addresses = []

        return {
            "id": self.id,
            "userId": self.user_id,
            "fullName": self.full_name or "",
            "phone": self.phone or "",
            "email": self.email or "",
            "addresses": parsed_addresses,
            "createdAt": self.created_at.strftime("%d %b %Y") if self.created_at else "",
        }


def init_db():
    Base.metadata.create_all(bind=engine)

    # SQLite schema migration for newly added columns
    with engine.connect() as conn:
        try:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(orders)")
            cols = [col[1] for col in cursor.fetchall()]
            if cols and "expected_delivery" not in cols:
                cursor.execute("ALTER TABLE orders ADD COLUMN expected_delivery VARCHAR(150) DEFAULT 'Expected in 3–4 Days'")
                conn.connection.commit()
            if cols and "user_id" not in cols:
                cursor.execute("ALTER TABLE orders ADD COLUMN user_id VARCHAR(100) DEFAULT ''")
                conn.connection.commit()
            if cols and "stock_deducted" not in cols:
                cursor.execute("ALTER TABLE orders ADD COLUMN stock_deducted BOOLEAN DEFAULT 0")
                conn.connection.commit()

            cursor.execute("PRAGMA table_info(medicines)")
            med_cols = [col[1] for col in cursor.fetchall()]
            if med_cols and "image_url" not in med_cols:
                cursor.execute("ALTER TABLE medicines ADD COLUMN image_url VARCHAR(500) DEFAULT ''")
                conn.connection.commit()
            if med_cols and "is_visible" not in med_cols:
                cursor.execute("ALTER TABLE medicines ADD COLUMN is_visible BOOLEAN DEFAULT 1")
                conn.connection.commit()

            cursor.execute("PRAGMA table_info(coupons)")
            coupon_cols = [col[1] for col in cursor.fetchall()]
            if coupon_cols:
                if "max_uses_total" not in coupon_cols:
                    cursor.execute("ALTER TABLE coupons ADD COLUMN max_uses_total INTEGER DEFAULT NULL")
                    conn.connection.commit()
                if "max_uses_per_user" not in coupon_cols:
                    cursor.execute("ALTER TABLE coupons ADD COLUMN max_uses_per_user INTEGER DEFAULT 1")
                    conn.connection.commit()
                if "used_by" not in coupon_cols:
                    cursor.execute("ALTER TABLE coupons ADD COLUMN used_by TEXT DEFAULT '[]'")
                    conn.connection.commit()
                if "show_in_cart" not in coupon_cols:
                    cursor.execute("ALTER TABLE coupons ADD COLUMN show_in_cart BOOLEAN DEFAULT 0")
                    conn.connection.commit()
        except Exception as e:
            print("Database migration notice:", e)

    db = SessionLocal()
    try:
        # 1. Seed prescriptions if empty
        if db.query(PrescriptionModel).count() == 0:
            sample_rx = [
                {
                    "rx_id": "RX-001",
                    "patient_name": "Sunita Deshmukh",
                    "phone": "+91 95035 00725",
                    "district": "Nandurbar",
                    "address": "Gokuldham Complex, Shahada Road, Nandurbar – 425412",
                    "notes": "Regular monthly BP medicines",
                    "status": "pending",
                    "files": json.dumps(["prescription_1.jpg"]),
                    "created_at": datetime.now(),
                },
                {
                    "rx_id": "RX-002",
                    "patient_name": "Anil Kulkarni",
                    "phone": "+91 98001 34567",
                    "district": "Shahada",
                    "address": "7, Market Yard, Shahada – 425409",
                    "notes": "Diabetic care - Metformin 500mg required",
                    "status": "pending",
                    "files": json.dumps(["prescription_front.pdf", "prescription_back.jpg"]),
                    "created_at": datetime.now(),
                },
                {
                    "rx_id": "RX-003",
                    "patient_name": "Priya More",
                    "phone": "+91 76543 21098",
                    "district": "Taloda",
                    "address": "3, Main Bazaar, Taloda – 425413",
                    "notes": "Diabetic patient. Needs Metformin 500mg x 3 strips",
                    "status": "reviewed",
                    "files": json.dumps(["rx_priya.jpg"]),
                    "created_at": datetime.now(),
                },
            ]
            for item in sample_rx:
                db.add(PrescriptionModel(**item))
            db.commit()

        # 2. Seed initial medicines if empty
        if db.query(MedicineModel).count() == 0:
            sample_medicines = [
                # Published (Live Catalog)
                {
                    "item_code": "MED-001",
                    "name": "Augmentin 625 Duo Tablet",
                    "salt": "Amoxycillin and Potassium Clavulanate",
                    "manufacturer": "GlaxoSmithKline",
                    "category": "Antibiotics & Infections",
                    "mrp": 223.50,
                    "cost_price": 175.00,
                    "selling_price": 196.00,
                    "stock_quantity": 120,
                    "min_stock": 25,
                    "requires_prescription": True,
                    "is_published": True,
                },
                {
                    "item_code": "MED-002",
                    "name": "Dolo 650 Tablet",
                    "salt": "Paracetamol 650mg",
                    "manufacturer": "Micro Labs Ltd",
                    "category": "Pain Relief & Fever",
                    "mrp": 34.00,
                    "cost_price": 22.00,
                    "selling_price": 29.00,
                    "stock_quantity": 450,
                    "min_stock": 50,
                    "requires_prescription": False,
                    "is_published": True,
                },
                {
                    "item_code": "MED-003",
                    "name": "Glycomet 500mg Tablet",
                    "salt": "Metformin Hydrochloride 500mg",
                    "manufacturer": "USV Ltd",
                    "category": "Diabetes Care",
                    "mrp": 48.00,
                    "cost_price": 32.00,
                    "selling_price": 42.00,
                    "stock_quantity": 210,
                    "min_stock": 30,
                    "requires_prescription": True,
                    "is_published": True,
                },
                {
                    "item_code": "MED-004",
                    "name": "Telma 40 Tablet",
                    "salt": "Telmisartan 40mg",
                    "manufacturer": "Glenmark Pharmaceuticals",
                    "category": "Heart & Blood Pressure",
                    "mrp": 142.00,
                    "cost_price": 95.00,
                    "selling_price": 125.00,
                    "stock_quantity": 95,
                    "min_stock": 20,
                    "requires_prescription": True,
                    "is_published": True,
                },
                {
                    "item_code": "MED-005",
                    "name": "Pan-D Capsule",
                    "salt": "Pantoprazole 40mg + Domperidone 30mg",
                    "manufacturer": "Alkem Laboratories",
                    "category": "Acidity & Digestion",
                    "mrp": 199.00,
                    "cost_price": 135.00,
                    "selling_price": 175.00,
                    "stock_quantity": 140,
                    "min_stock": 25,
                    "requires_prescription": True,
                    "is_published": True,
                },
                {
                    "item_code": "MED-006",
                    "name": "Shelcal 500 Tablet",
                    "salt": "Calcium 500mg + Vitamin D3 250 IU",
                    "manufacturer": "Torrent Pharmaceuticals",
                    "category": "Vitamins & Supplements",
                    "mrp": 131.00,
                    "cost_price": 90.00,
                    "selling_price": 115.00,
                    "stock_quantity": 180,
                    "min_stock": 30,
                    "requires_prescription": False,
                    "is_published": True,
                },
                # Staged / Draft Items
                {
                    "item_code": "MED-STG-001",
                    "name": "PHENSEDYL DX SYP 100ML",
                    "salt": "-BLANK-",
                    "manufacturer": "Abbott Healthcare",
                    "category": "Cold, Cough & Allergy",
                    "mrp": 168.00,
                    "cost_price": 120.00,
                    "selling_price": 147.00,
                    "stock_quantity": 60,
                    "min_stock": 15,
                    "requires_prescription": False,
                    "is_published": False,
                },
                {
                    "item_code": "MED-STG-002",
                    "name": "CEFIXIME-200MG DISPERSIBLE TAB",
                    "salt": "CEFIXIME 200MG",
                    "manufacturer": "Cipla Ltd",
                    "category": "Antibiotics & Infections",
                    "mrp": 110.00,
                    "cost_price": 72.00,
                    "selling_price": 96.00,
                    "stock_quantity": 80,
                    "min_stock": 20,
                    "requires_prescription": True,
                    "is_published": False,
                },
                {
                    "item_code": "MED-STG-003",
                    "name": "DICLOFAM HOT GEL 30GM",
                    "salt": "Diclofenac Diethylamine + Virgin Linseed Oil",
                    "manufacturer": "Mankind Pharma",
                    "category": "Pain Relief & Fever",
                    "mrp": 95.00,
                    "cost_price": 55.00,
                    "selling_price": 83.00,
                    "stock_quantity": 40,
                    "min_stock": 10,
                    "requires_prescription": False,
                    "is_published": False,
                },
            ]
            for m in sample_medicines:
                db.add(MedicineModel(**m))
            db.commit()

        # 3. Seed sample orders if empty
        if db.query(OrderModel).count() == 0:
            sample_orders = [
                {
                    "order_id": "DP-142",
                    "customer_name": "Rajesh Patil",
                    "customer_phone": "+91 95035 00725",
                    "customer_email": "dhruvpharma25@gmail.com",
                    "district": "Nandurbar",
                    "address": "Flat 302, Gokuldham, Shahada Road, Nandurbar – 425412",
                    "pincode": "425412",
                    "items": json.dumps([
                        {"id": 2, "name": "Dolo 650 Tablet", "price": 29.0, "mrp": 34.0, "qty": 2, "brand": "Micro Labs"},
                        {"id": 5, "name": "Pan-D Capsule", "price": 175.0, "mrp": 199.0, "qty": 1, "brand": "Alkem Labs"},
                    ]),
                    "subtotal": 233.0,
                    "discount": 0.0,
                    "delivery_fee": 0.0,
                    "total_amount": 233.0,
                    "payment_method": "COD",
                    "payment_status": "pending",
                    "status": "dispatched",
                    "delivery_agent": "Sanjay Kumar (Dhruv Express)",
                    "created_at": datetime.now(),
                },
                {
                    "order_id": "DP-141",
                    "customer_name": "Meena Joshi",
                    "customer_phone": "+91 76543 21098",
                    "customer_email": "meena.j@example.com",
                    "district": "Shahada",
                    "address": "12, College Road, Shahada – 425409",
                    "pincode": "425409",
                    "items": json.dumps([
                        {"id": 1, "name": "Augmentin 625 Duo Tablet", "price": 196.0, "mrp": 223.5, "qty": 2, "brand": "GSK"},
                        {"id": 6, "name": "Shelcal 500 Tablet", "price": 115.0, "mrp": 131.0, "qty": 1, "brand": "Torrent"},
                    ]),
                    "subtotal": 507.0,
                    "discount": 25.0,
                    "delivery_fee": 0.0,
                    "total_amount": 482.0,
                    "payment_method": "UPI",
                    "payment_status": "paid",
                    "status": "delivered",
                    "delivery_agent": "Ramesh Yadav",
                    "created_at": datetime.now(),
                },
                {
                    "order_id": "DP-140",
                    "customer_name": "Suresh Kale",
                    "customer_phone": "+91 98001 34567",
                    "customer_email": "suresh.kale@example.com",
                    "district": "Shirpur",
                    "address": "45, Station Road, Shirpur – 424405",
                    "pincode": "424405",
                    "items": json.dumps([
                        {"id": 4, "name": "Telma 40 Tablet", "price": 125.0, "mrp": 142.0, "qty": 1, "brand": "Glenmark"},
                    ]),
                    "subtotal": 125.0,
                    "discount": 0.0,
                    "delivery_fee": 40.0,
                    "total_amount": 165.0,
                    "payment_method": "COD",
                    "payment_status": "pending",
                    "status": "confirmed",
                    "delivery_agent": "Sanjay Kumar",
                    "created_at": datetime.now(),
                },
            ]
            for order in sample_orders:
                db.add(OrderModel(**order))
            db.commit()

        # 4. Seed default coupons if empty
        if db.query(CouponModel).count() == 0:
            sample_coupons = [
                {
                    "code": "DHRUV10",
                    "description": "10% off on all medicines (orders above ₹199)",
                    "discount_type": "percentage",
                    "discount_value": 10.0,
                    "min_order_amount": 199.0,
                    "max_discount": 150.0,
                    "is_active": True,
                },
                {
                    "code": "WELCOME50",
                    "description": "Flat ₹50 off on your first order above ₹399",
                    "discount_type": "fixed",
                    "discount_value": 50.0,
                    "min_order_amount": 399.0,
                    "max_discount": 50.0,
                    "is_active": True,
                },
                {
                    "code": "HEALTH5",
                    "description": "Flat 5% instant wellness discount on any order",
                    "discount_type": "percentage",
                    "discount_value": 5.0,
                    "min_order_amount": 0.0,
                    "max_discount": 100.0,
                    "is_active": True,
                },
            ]
            for c in sample_coupons:
                db.add(CouponModel(**c))
            db.commit()

        # 5. Seed sample product reviews if empty
        if db.query(ReviewModel).count() == 0:
            sample_reviews = [
                {
                    "medicine_id": 1,
                    "user_name": "Ramesh Patil",
                    "rating": 5,
                    "comment": "Genuine GSK Augmentin 625 Duo. Fast delivery to Shahada, very well packed.",
                },
                {
                    "medicine_id": 2,
                    "user_name": "Pooja Sharma",
                    "rating": 5,
                    "comment": "Authentic Dolo 650 with long expiry. Best price in Nandurbar district.",
                },
                {
                    "medicine_id": 4,
                    "user_name": "Vijay Kulkarni",
                    "rating": 5,
                    "comment": "Regular BP medicine, prompt 3-day delivery to Shirpur. Highly recommended!",
                },
            ]
            for r in sample_reviews:
                db.add(ReviewModel(**r))
            db.commit()

    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
