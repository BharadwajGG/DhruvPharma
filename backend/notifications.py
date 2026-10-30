import json
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dhruv_notifications")

# Clinical knowledge dictionary for common Indian salt formulations
SALT_CLINICAL_PROFILES = {
    "PARACETAMOL": {
        "uses": ["Relief of mild to moderate fever", "Headaches and body ache relief", "Post-vaccination pain and toothache"],
        "dosage": "1 tablet every 4–6 hours as needed, with or after meals. Do not exceed 4000mg in 24 hours.",
        "sideEffects": ["Nausea (rare)", "Allergic skin rash (very rare)", "Liver toxicity if overdosed"],
        "warnings": ["Do not combine with other Paracetamol-containing formulations", "Avoid excessive alcohol consumption"],
        "storage": "Store in a cool, dry place below 25°C away from direct sunlight.",
        "packSize": "10–15 tablets per strip",
    },
    "CEFIXIME": {
        "uses": ["Bacterial infections of the respiratory tract", "Urinary tract infections (UTIs)", "Typhoid fever and ear/throat infections"],
        "dosage": "200mg twice daily or as prescribed by your physician. Complete the full course.",
        "sideEffects": ["Loose stools / diarrhea", "Stomach discomfort", "Nausea or headache"],
        "warnings": ["Mandatory Doctor's prescription (Schedule H antibiotic)", "Do not stop treatment early even if symptoms improve"],
        "storage": "Store in a tightly closed container below 25°C. Keep out of reach of children.",
        "packSize": "10 dispersible tablets per strip",
    },
    "AMOXYCILLIN": {
        "uses": ["Chest infections and bronchitis", "Dental and ENT infections", "Skin and soft tissue bacterial infections"],
        "dosage": "1 tablet twice daily after food, for 5 to 7 days as prescribed.",
        "sideEffects": ["Mild nausea", "Skin rash in allergic individuals", "Diarrhea"],
        "warnings": ["Inform doctor if allergic to Penicillin or cephalosporins", "Requires valid Schedule H prescription"],
        "storage": "Store at room temperature below 30°C in moisture-proof strip.",
        "packSize": "10 tablets per strip",
    },
    "METFORMIN": {
        "uses": ["Type 2 Diabetes Mellitus blood glucose management", "Polycystic Ovary Syndrome (PCOS) insulin resistance", "Metabolic syndrome regulation"],
        "dosage": "Take with or immediately after meals to reduce stomach upset. Typically once or twice daily.",
        "sideEffects": ["Initial digestive upset or bloating", "Metallic taste in mouth", "Mild stomach cramps"],
        "warnings": ["Monitor blood sugar regularly", "Inform doctor if scheduled for CT scans with radiocontrast dye"],
        "storage": "Store below 25°C in a dry place. Protect from heat and moisture.",
        "packSize": "10–15 tablets per strip",
    },
    "TELMISARTAN": {
        "uses": ["Hypertension (High blood pressure) management", "Cardiovascular event risk reduction", "Kidney protection in diabetic hypertensive patients"],
        "dosage": "1 tablet daily in the morning with or without food. Take at the same time each day.",
        "sideEffects": ["Dizziness when standing quickly", "Sinus congestion", "Back pain or tiredness"],
        "warnings": ["Do not discontinue abruptly without consulting doctor", "Not safe during pregnancy"],
        "storage": "Store in original blister pack below 30°C. Protect from moisture.",
        "packSize": "15 tablets per strip",
    },
    "PANTOPRAZOLE": {
        "uses": ["Gastroesophageal Reflux Disease (GERD) & heartburn", "Gastric and duodenal ulcers", "Prevention of acid-related stomach erosion caused by NSAIDs"],
        "dosage": "Take 1 tablet daily in the morning, 30 to 60 minutes before breakfast with a glass of water.",
        "sideEffects": ["Headache", "Mild flatulence or dry mouth", "Abdominal discomfort"],
        "warnings": ["Best taken on an empty stomach", "Consult physician for usage extending beyond 4 weeks"],
        "storage": "Store below 25°C. Protect from direct heat and light.",
        "packSize": "10–15 capsules/tablets per strip",
    },
    "CALCIUM": {
        "uses": ["Bone density strengthening & osteoporosis prevention", "Correction of Calcium and Vitamin D3 deficiency", "Nutritional supplement during pregnancy & lactation"],
        "dosage": "1 tablet daily after lunch or dinner with water.",
        "sideEffects": ["Constipation", "Mild belching or gas"],
        "warnings": ["Drink plenty of water throughout the day", "Do not take at the exact same hour as thyroid medications"],
        "storage": "Store in a dry place below 25°C. Keep bottle cap securely tightened.",
        "packSize": "15 tablets per bottle/strip",
    },
    "CETIRIZINE": {
        "uses": ["Allergic rhinitis, sneezing, and runny nose", "Urticaria and itchy skin rashes", "Watery eyes and seasonal pollen allergies"],
        "dosage": "1 tablet (10mg) once daily, preferably at bedtime.",
        "sideEffects": ["Mild drowsiness or sleepiness", "Dry mouth", "Fatigue"],
        "warnings": ["Avoid driving or operating machinery if experiencing drowsiness", "Avoid alcohol while taking this medicine"],
        "storage": "Store at controlled room temperature below 25°C.",
        "packSize": "10 tablets per strip",
    },
}

CATEGORY_DEFAULT_PROFILES = {
    "Pain Relief & Fever": {
        "uses": ["Relief from fever, muscle ache, backache, headache, and dental pain."],
        "dosage": "Take after meals with a full glass of water as directed by your physician.",
        "sideEffects": ["Mild gastric irritation", "Nausea", "Heartburn"],
        "warnings": ["Do not exceed recommended daily dosage", "Consult doctor if fever persists beyond 3 days"],
        "storage": "Store in a cool, dry place below 25°C.",
        "packSize": "10 tablets / 30gm tube",
    },
    "Antibiotics & Infections": {
        "uses": ["Treatment of diagnosed bacterial and systemic infections."],
        "dosage": "As strictly prescribed by your medical practitioner. Complete the full antibiotic cycle.",
        "sideEffects": ["Loose motions", "Nausea", "Temporary altered taste"],
        "warnings": ["Schedule H / H1 Prescription Medicine - Do not self-administer", "Avoid missing doses"],
        "storage": "Store below 25°C in airtight moisture-resistant packaging.",
        "packSize": "6–10 tablets/capsules per strip",
    },
    "Acidity & Digestion": {
        "uses": ["Acidity relief, heartburn, gastric gas, and indigestion."],
        "dosage": "Usually taken once daily before meals or as advised by your doctor.",
        "sideEffects": ["Occasional headache", "Abdominal fullness"],
        "warnings": ["Maintain healthy dietary habits", "Consult physician if symptoms do not subside in 2 weeks"],
        "storage": "Store below 25°C in a dry place.",
        "packSize": "10–15 capsules per strip",
    },
    "Diabetes Care": {
        "uses": ["Blood sugar stabilization and glycemic control."],
        "dosage": "Take strictly as prescribed, regularly with or before meals.",
        "sideEffects": ["Occasional mild digestive changes", "Low blood sugar if meals skipped"],
        "warnings": ["Schedule H Drug - Requires valid doctor prescription", "Carry fast-acting glucose tablets when travelling"],
        "storage": "Store below 25°C. Protect insulin products in refrigerator (2°C–8°C).",
        "packSize": "10–15 tablets per strip",
    },
    "Heart & Blood Pressure": {
        "uses": ["Cardiovascular care, blood pressure management, and stroke prevention."],
        "dosage": "Take once daily at the same time every day.",
        "sideEffects": ["Mild dizziness", "Tiredness"],
        "warnings": ["Do not stop taking without doctor's explicit direction", "Monitor BP regularly"],
        "storage": "Store in original protective blister below 25°C.",
        "packSize": "15 tablets per strip",
    },
    "General Healthcare": {
        "uses": ["General wellness, therapeutic support, and symptom relief."],
        "dosage": "Follow doctor's advice or package label guidelines.",
        "sideEffects": ["Minimal when taken as directed"],
        "warnings": ["Keep out of reach of children", "Check expiry date before consumption"],
        "storage": "Store in a cool, dry place away from heat.",
        "packSize": "Standard medical pack",
    },
}


def generate_clinical_info(name: str, salt: str = "", category: str = "") -> Dict[str, Any]:
    """Generates accurate dynamic clinical guidance based on active salt and category."""
    clean_salt = (salt or "").upper()
    clean_name = (name or "").upper()
    combined = f"{clean_salt} {clean_name}"

    matched_profile = None

    # Check known salt formulations
    for salt_key, profile in SALT_CLINICAL_PROFILES.items():
        if salt_key in combined:
            matched_profile = profile
            break

    # Fallback to category default
    if not matched_profile:
        matched_profile = CATEGORY_DEFAULT_PROFILES.get(
            category, CATEGORY_DEFAULT_PROFILES["General Healthcare"]
        )

    # Detect dosage form
    dosage_form = "Tablet"
    if "SYP" in combined or "SYRUP" in combined:
        dosage_form = "Syrup (Oral Liquid)"
    elif "GEL" in combined or "OINTMENT" in combined or "CREAM" in combined:
        dosage_form = "Topical Gel / Cream"
    elif "CAP" in combined or "CAPSULE" in combined:
        dosage_form = "Capsule"
    elif "DROP" in combined or "DROPS" in combined:
        dosage_form = "Drops"
    elif "INJ" in combined:
        dosage_form = "Injectable"

    return {
        "composition": salt if salt and salt != "-BLANK-" else f"{name} Active Formulation",
        "dosageForm": dosage_form,
        "uses": matched_profile.get("uses", ["Symptomatic relief"]),
        "dosage": matched_profile.get("dosage", "As directed by physician."),
        "sideEffects": matched_profile.get("sideEffects", ["Well tolerated"]),
        "warnings": matched_profile.get("warnings", ["Store safely"]),
        "storage": matched_profile.get("storage", "Store below 25°C."),
        "packSize": matched_profile.get("packSize", "Standard pack"),
    }


def generate_order_email_html(order: Dict[str, Any]) -> str:
    """Generates an HTML receipt email for customers."""
    items = order.get("items", [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except Exception:
            items = []

    rows_html = ""
    for item in items:
        name = item.get("name", "Medicine")
        qty = item.get("qty", 1)
        price = item.get("price", 0.0)
        item_total = price * qty
        rows_html += f"""
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 600;">{name}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;">{qty}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;">₹{price:.2f}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; text-align: right; font-weight: bold;">₹{item_total:.2f}</td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>DhruvPharma Order Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #1d4ed8; padding: 24px 32px; text-align: left;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.5px;">Dhruv Pharma</h1>
                <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 12px;">Licensed Pharmacy · Pune · Nashik · Ahmednagar · Aurangabad</p>
            </div>

            <!-- Body -->
            <div style="padding: 28px 32px;">
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                    <p style="color: #065f46; font-size: 14px; font-weight: bold; margin: 0;">✓ Order Received &amp; Confirmed!</p>
                    <p style="color: #047857; font-size: 12px; margin: 4px 0 0 0;">
                        Namaskar {order.get('customerName', order.get('patient', 'Valued Customer'))}, our pharmacist is preparing your medicines. Estimated doorstep delivery is <strong>2–4 hours</strong>.
                    </p>
                </div>

                <!-- Order Meta -->
                <table style="width: 100%; margin-bottom: 24px; font-size: 13px; color: #475569;">
                    <tr>
                        <td style="padding-bottom: 6px;"><strong>Order ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #1d4ed8;">{order.get('orderId', order.get('id', ''))}</span></td>
                        <td style="padding-bottom: 6px; text-align: right;"><strong>Date:</strong> {order.get('date', order.get('createdAt', ''))}</td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 6px;"><strong>Payment Method:</strong> {order.get('paymentMethod', 'Cash on Delivery')}</td>
                        <td style="padding-bottom: 6px; text-align: right;"><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">Confirmed</span></td>
                    </tr>
                </table>

                <!-- Shipping Details -->
                <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Delivery Address</p>
                    <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.5;">
                        <strong>{order.get('customerName', order.get('patient', ''))}</strong> ({order.get('phone', '')})<br>
                        {order.get('address', '')}<br>
                        District: {order.get('district', '')} {order.get('pincode', '')}
                    </p>
                </div>

                <!-- Items Table -->
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Itemized Medicines</p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
                            <th style="padding: 8px 12px;">Medicine</th>
                            <th style="padding: 8px 12px; text-align: center;">Qty</th>
                            <th style="padding: 8px 12px; text-align: right;">Price</th>
                            <th style="padding: 8px 12px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows_html}
                    </tbody>
                </table>

                <!-- Total Summary -->
                <div style="border-top: 2px solid #e2e8f0; padding-top: 12px; margin-bottom: 24px;">
                    <table style="width: 100%; font-size: 13px;">
                        <tr>
                            <td style="color: #64748b; padding: 4px 0;">Subtotal:</td>
                            <td style="text-align: right; color: #1e293b; font-weight: 600;">₹{order.get('subtotal', 0.0):.2f}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; padding: 4px 0;">Regional Delivery:</td>
                            <td style="text-align: right; color: #1e293b; font-weight: 600;">{('₹' + str(order.get('deliveryFee', 0.0))) if order.get('deliveryFee', 0) > 0 else '<span style="color: #16a34a; font-weight: bold;">FREE</span>'}</td>
                        </tr>
                        <tr>
                            <td style="color: #0f172a; font-size: 16px; font-weight: bold; padding: 10px 0 0 0;">Total Payable:</td>
                            <td style="text-align: right; color: #1d4ed8; font-size: 18px; font-weight: bold; padding: 10px 0 0 0;">₹{order.get('totalAmount', order.get('amount', 0.0)):.2f}</td>
                        </tr>
                    </table>
                </div>

                <!-- Footer support -->
                <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px; text-align: center; font-size: 12px; color: #475569;">
                    Need help with your prescription order? Call us at <strong>+91 98765 43210</strong><br>
                    Shop Address: Dhruv Pharma, Maharashtra.
                </div>
            </div>
        </div>
    </body>
    </html>
    """


def generate_whatsapp_message(order: Dict[str, Any]) -> str:
    """Creates formatted text message for WhatsApp confirmation."""
    order_id = order.get("orderId", order.get("id", ""))
    patient = order.get("customerName", order.get("patient", "Customer"))
    amount = order.get("totalAmount", order.get("amount", 0))
    address = order.get("address", "")
    district = order.get("district", "")

    return (
        f"Namaskar {patient}!\n\n"
        f"Your order #{order_id} at DhruvPharma for Rs. {amount} has been confirmed.\n\n"
        f"📍 Delivery Address: {address}, {district}\n"
        f"Estimated delivery time: 2–4 hours.\n\n"
        f"Track your order here: http://localhost:5173/order-tracking?id={order_id}"
    )


def send_order_email(order: Dict[str, Any]) -> bool:
    """Sends confirmation email or logs receipt."""
    recipient = order.get("customerEmail") or order.get("email")
    order_id = order.get("orderId", order.get("id"))
    logger.info(f"[EMAIL DISPATCH] Triggering Order Invoice for #{order_id} to recipient: {recipient or 'no-email-provided'}")
    return True

