import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean
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
    is_published = Column(Boolean, default=False, index=True)  # False = Staged/Draft, True = Live Store
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
            "isPublished": self.is_published,
            "inStock": self.stock_quantity > 0,
            "discountPct": discount_pct,
            "rating": 4.7,
            "reviews": 85,
            "createdAt": self.created_at.strftime("%d %b %Y, %I:%M %p") if self.created_at else "",
        }


def init_db():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed prescriptions if empty
        if db.query(PrescriptionModel).count() == 0:
            sample_rx = [
                {
                    "rx_id": "RX-001",
                    "patient_name": "Sunita Deshmukh",
                    "phone": "+91 94523 10012",
                    "district": "Nashik",
                    "address": "45, Gangapur Rd, Nashik – 422013",
                    "notes": "Regular monthly BP medicines",
                    "status": "pending",
                    "files": json.dumps(["prescription_1.jpg"]),
                    "created_at": datetime.now(),
                },
                {
                    "rx_id": "RX-002",
                    "patient_name": "Anil Kulkarni",
                    "phone": "+91 98001 34567",
                    "district": "Ahmednagar",
                    "address": "7, Savedi Colony, Ahmednagar – 414003",
                    "notes": "Diabetic care - Metformin 500mg required",
                    "status": "pending",
                    "files": json.dumps(["prescription_front.pdf", "prescription_back.jpg"]),
                    "created_at": datetime.now(),
                },
                {
                    "rx_id": "RX-003",
                    "patient_name": "Priya More",
                    "phone": "+91 76543 21098",
                    "district": "Pune",
                    "address": "3, Kothrud, Pune – 411029",
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
                # Staged / Draft Items (Admin workspace inspection)
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

    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
