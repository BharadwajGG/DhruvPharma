import os
import json
import resend
from datetime import datetime
import pytz
from typing import Dict, Any, Optional

# Automatically load backend/.env if present
def _load_env_if_present():
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip()
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_env_if_present()

# Load Resend API Key securely from environment (.env)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "DhruvPharma <onboarding@resend.dev>")
RESEND_SANDBOX_OWNER = os.getenv("RESEND_SANDBOX_OWNER", "bharadwajchavan0@gmail.com")

resend.api_key = RESEND_API_KEY


def _send_with_sandbox_fallback(params: dict, original_recipient: str):
    """
    Attempts to send via Resend. If Resend's free tier restricts delivery
    to the account owner's email address (HTTP 403), seamlessly reroutes to
    the verified account owner so local testing always succeeds with HTTP 200.
    """
    try:
        return resend.Emails.send(params)
    except Exception as e:
        err_msg = str(e).lower()
        sandbox_triggers = [
            "only send testing emails",
            "403",
            "testing email address",
            "example.com",
            "validation_error",
            "not verified",
            "invalid `to` field",
        ]
        if any(trigger in err_msg for trigger in sandbox_triggers) and original_recipient != RESEND_SANDBOX_OWNER:
            print(f"[Resend Sandbox Mode] Notice: in trial mode, Resend permits test emails to your registered email ({RESEND_SANDBOX_OWNER}). Rerouting test copy for {original_recipient}...")
            sandbox_note = (
                f'<div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 12px; color: #92400e;">'
                f'<strong>Resend Sandbox Preview:</strong> This notification was triggered for customer <strong>{original_recipient}</strong>.<br>'
                f'Delivered to your registered Resend account during localhost testing. To send directly to all customer emails, verify your domain at <a href="https://resend.com/domains" style="color: #b45309; font-weight: bold;">resend.com/domains</a>.'
                f'</div>'
            )
            fallback_html = params.get("html", "").replace('<div class="content">', f'<div class="content">{sandbox_note}')
            fallback_params = {
                **params,
                "to": [RESEND_SANDBOX_OWNER],
                "subject": f"[Test for {original_recipient}] " + params.get("subject", ""),
                "html": fallback_html
            }
            return resend.Emails.send(fallback_params)
        raise e


def send_login_alert_email(to_email: str, user_name: str, client_ip: str, user_agent: str):
    """
    Sends a security alert email when an account login is detected.
    Runs asynchronously inside FastAPI BackgroundTasks.
    """
    if not to_email or "@" not in to_email:
        print(f"[Resend] Skipped login alert: invalid recipient email '{to_email}'")
        return None

    try:
        ist = pytz.timezone("Asia/Kolkata")
        login_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")

        # Simplified browser/device detection snippet
        device_hint = "Desktop / Web Browser"
        ua_lower = (user_agent or "").lower()
        if "mobile" in ua_lower or "android" in ua_lower or "iphone" in ua_lower or "ipad" in ua_lower:
            device_hint = "Mobile Device"
        elif "mac" in ua_lower:
            device_hint = "Mac / Apple Desktop"
        elif "windows" in ua_lower:
            device_hint = "Windows Desktop"
        elif "linux" in ua_lower:
            device_hint = "Linux Desktop"

        clean_ip = client_ip or "127.0.0.1 (Localhost)"
        if clean_ip in ["::1", "127.0.0.1"]:
            clean_ip = "127.0.0.1 (Localhost Session)"

        display_name = user_name.strip() if user_name and user_name.strip() else to_email.split("@")[0]

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
            .container {{ max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
            .header {{ background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: #ffffff; padding: 24px; text-align: center; }}
            .content {{ padding: 28px 24px; color: #334155; line-height: 1.6; }}
            .badge {{ display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; border: 1px solid #bfdbfe; }}
            .info-box {{ background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }}
            .info-row {{ margin: 6px 0; display: flex; justify-content: space-between; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }}
            .btn {{ display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; margin-top: 14px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 28px; margin-bottom: 4px;">🛡️</div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">DhruvPharma Security Alert</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Account Protection &amp; Login Verification</p>
            </div>
            <div class="content">
              <span class="badge">Active Sign-In Detected</span>
              <p style="font-size: 15px; margin-top: 0;">Namaskar <strong>{display_name}</strong>,</p>
              <p style="font-size: 14px; color: #475569;">
                Your DhruvPharma account was just accessed with this email address (<strong>{to_email}</strong>).
              </p>
              
              <div class="info-box">
                <p style="margin: 4px 0;"><strong>Time of Login:</strong> {login_time}</p>
                <p style="margin: 4px 0;"><strong>Device / Browser:</strong> {device_hint}</p>
                <p style="margin: 4px 0;"><strong>IP Address:</strong> {clean_ip}</p>
                <p style="margin: 4px 0;"><strong>Regional Hub:</strong> Nandurbar &amp; Dhule Service Area</p>
              </div>

              <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                ✓ If this was you, no action is needed and you may safely disregard this message.
              </p>
              <p style="font-size: 13px; color: #dc2626; margin-top: 0; font-weight: 500;">
                ⚠️ If you did not initiate this login, please contact DhruvPharma Support immediately at <strong>+91 95035 00725</strong> or reply to this email to freeze your account.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600; color: #64748b;">DhruvPharma • Genuine Medicine Delivery Hub</p>
              <p style="margin: 4px 0 0 0;">Licensed Pharmacy under FDA Regulations 20B/21B • Maharashtra Regional Dispatch</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": f"Security Alert: New Sign-In to your DhruvPharma Account",
            "html": html_template
        }
        response = _send_with_sandbox_fallback(params, to_email)
        print(f"[Resend] Sign-in alert sent for {to_email}. Response: {response}")
        return response
    except Exception as e:
        print(f"[Resend Error] Failed to send login alert to {to_email}: {str(e)}")
        return None


def send_order_placed_email(to_email: str, order_data: Dict[str, Any]):
    """
    Sends an automated order confirmation & invoice receipt email when an order is placed.
    """
    if not to_email or "@" not in to_email:
        return None

    try:
        ist = pytz.timezone("Asia/Kolkata")
        order_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Valued Customer"
        total_amount = order_data.get("totalAmount") or order_data.get("amount") or 0.0
        delivery_hub = order_data.get("district") or "Nandurbar"
        payment_method = order_data.get("paymentMethod") or "COD"

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 550px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
            .header {{ background: #16a34a; color: #fff; padding: 20px; text-align: center; }}
            .content {{ padding: 24px; color: #334155; font-size: 14px; line-height: 1.6; }}
            .receipt {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 16px 0; }}
            .footer {{ padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <h2 style="margin: 0; font-size: 20px;">✓ Order Confirmed — DhruvPharma</h2>
            </div>
            <div class="content">
              <p>Namaskar <strong>{customer_name}</strong>,</p>
              <p>Thank you for choosing DhruvPharma. Your medicine order has been received and scheduled for dispatch.</p>
              <div class="receipt">
                <p style="margin: 4px 0;"><strong>Order Reference:</strong> #{order_id}</p>
                <p style="margin: 4px 0;"><strong>Bill Amount:</strong> ₹{total_amount:.2f}</p>
                <p style="margin: 4px 0;"><strong>Payment Type:</strong> {payment_method}</p>
                <p style="margin: 4px 0;"><strong>Delivery Hub:</strong> {delivery_hub} (Expected in 3–4 Days)</p>
                <p style="margin: 4px 0;"><strong>Order Date:</strong> {order_time}</p>
              </div>
              <p style="color: #64748b; font-size: 13px;">Our licensed pharmacist is currently inspecting your batch.</p>
            </div>
            <div class="footer">
              <p style="margin: 0;">DhruvPharma • Doorstep Medicine Delivery</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": f"Order Confirmed #{order_id} — DhruvPharma",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, to_email)
    except Exception as e:
        print(f"[Resend Error] Failed to send order confirmation to {to_email}: {str(e)}")
        return None


def send_order_cancelled_email(to_email: str, order_data: Dict[str, Any], reason: str = "", cancelled_by: str = "customer"):
    """
    Sends an automated cancellation confirmation to the customer.
    Clearly specifies whether cancellation was requested by customer or initiated by admin.
    """
    if not to_email or "@" not in to_email:
        return None

    try:
        ist = pytz.timezone("Asia/Kolkata")
        cancel_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Valued Customer"
        total_amount = float(order_data.get("totalAmount") or order_data.get("amount") or 0.0)

        is_admin = (cancelled_by or "").lower() == "admin"
        header_title = "Order Cancelled by Pharmacy Admin" if is_admin else "Order Cancellation Confirmed"
        header_bg = "#dc2626" if is_admin else "#475569"
        sub_desc = (
            f"Your medicine order <strong>#{order_id}</strong> has been cancelled by the DhruvPharma store pharmacist / administration."
            if is_admin else
            f"Your medicine order <strong>#{order_id}</strong> has been cancelled as requested."
        )

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 550px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }}
            .header {{ background: {header_bg}; color: #fff; padding: 22px; text-align: center; }}
            .content {{ padding: 24px; color: #334155; font-size: 14px; line-height: 1.6; }}
            .receipt {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 16px; margin: 16px 0; }}
            .footer {{ padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }}
            .badge {{ display: inline-block; background: #fee2e2; color: #991b1b; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-bottom: 8px; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <span style="font-size: 26px;">⚠️</span>
              <h2 style="margin: 6px 0 0 0; font-size: 20px; font-weight: bold;">{header_title}</h2>
            </div>
            <div class="content">
              <span class="badge">{'Action Taken by Store Administration' if is_admin else 'Cancelled on Request'}</span>
              <p>Namaskar <strong>{customer_name}</strong>,</p>
              <p>{sub_desc}</p>
              
              <div class="receipt">
                <p style="margin: 4px 0;"><strong>Order ID:</strong> #{order_id}</p>
                <p style="margin: 4px 0;"><strong>Voided Bill:</strong> ₹{total_amount:.2f} (Zero payment due)</p>
                <p style="margin: 4px 0;"><strong>Cancelled By:</strong> {'DhruvPharma Store Admin' if is_admin else 'Customer'}</p>
                <p style="margin: 4px 0;"><strong>Reason:</strong> {reason or ('Cancelled for urgent operational reason' if is_admin else 'Customer cancelled via My Orders')}</p>
                <p style="margin: 4px 0;"><strong>Timestamp:</strong> {cancel_time}</p>
              </div>

              <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 14px; border-radius: 6px; margin-top: 14px; font-size: 13px; color: #475569;">
                <strong>Need immediate assistance or alternative medicines?</strong><br>
                Please call our helpline directly at <strong>+91 95035 00725</strong> or reply to this email. Our pharmacist will gladly assist you.
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">DhruvPharma • Genuine Medicine Delivery Hub</p>
              <p style="margin: 4px 0 0 0;">Nandurbar &amp; Dhule Service Districts • Maharashtra</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": f"Notice: Order #{order_id} Cancelled by {'Admin' if is_admin else 'Customer'} — DhruvPharma",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, to_email)
    except Exception as e:
        print(f"[Resend Error] Failed to send cancellation email to {to_email}: {str(e)}")
        return None


def send_admin_cancellation_audit_email(order_data: Dict[str, Any], reason: str, cancelled_by: str = "admin"):
    """
    Sends an operational alert email directly to the store owner / admin
    whenever an order is cancelled (either by admin or customer).
    """
    admin_recipient = os.getenv("ADMIN_NOTIFICATION_EMAIL", RESEND_SANDBOX_OWNER)
    try:
        ist = pytz.timezone("Asia/Kolkata")
        cancel_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Customer"
        customer_phone = order_data.get("phone") or order_data.get("customer_phone") or "—"
        customer_email = order_data.get("email") or order_data.get("customer_email") or "—"
        total_amount = float(order_data.get("totalAmount") or order_data.get("amount") or 0.0)

        is_admin = (cancelled_by or "").lower() == "admin"
        subject_tag = "CANCELLED BY ADMIN" if is_admin else "CANCELLED BY CUSTOMER"

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 550px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #cbd5e1; overflow: hidden; }}
            .header {{ background: #0f172a; color: #fff; padding: 20px; text-align: center; }}
            .content {{ padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6; }}
            .info {{ background: #f1f5f9; border-radius: 8px; padding: 14px; margin: 16px 0; border: 1px solid #e2e8f0; }}
            .footer {{ padding: 14px; text-align: center; font-size: 11px; color: #64748b; background: #fafafa; border-top: 1px solid #f1f5f9; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <h2 style="margin: 0; font-size: 18px; color: #f8fafc;">DhruvPharma Admin Audit Log</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Order Cancellation Record</p>
            </div>
            <div class="content">
              <p>Hello Admin,</p>
              <p>Order <strong>#{order_id}</strong> has been marked as <strong>CANCELLED</strong> in the pharmacy system.</p>
              
              <div class="info">
                <p style="margin: 4px 0;"><strong>Order ID:</strong> #{order_id}</p>
                <p style="margin: 4px 0;"><strong>Cancelled By:</strong> {'Store Admin / Pharmacist' if is_admin else 'Customer'}</p>
                <p style="margin: 4px 0;"><strong>Reason Given:</strong> {reason or 'None'}</p>
                <p style="margin: 4px 0;"><strong>Customer Name:</strong> {customer_name}</p>
                <p style="margin: 4px 0;"><strong>Customer Phone:</strong> {customer_phone}</p>
                <p style="margin: 4px 0;"><strong>Customer Email:</strong> {customer_email}</p>
                <p style="margin: 4px 0;"><strong>Voided Revenue:</strong> ₹{total_amount:.2f}</p>
                <p style="margin: 4px 0;"><strong>Warehouse Stock:</strong> Automatically Restored</p>
                <p style="margin: 4px 0;"><strong>Audit Time:</strong> {cancel_time}</p>
              </div>

              <p style="font-size: 13px; color: #64748b;">
                Customer has been notified via email. The revenue metric on the sales dashboard has been deducted accordingly.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">DhruvPharma Automated Store System</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [admin_recipient],
            "subject": f"[{subject_tag}] Order #{order_id} — DhruvPharma Audit",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, admin_recipient)
    except Exception as e:
        print(f"[Resend Error] Failed to send admin cancellation audit to {admin_recipient}: {str(e)}")
        return None


def _format_order_items_html(items_data) -> str:
    """
    Renders an HTML itemized table row snippet for any supported order items format:
    JSON string, list of dicts, or pipe-separated plain strings.
    """
    parsed_items = []
    if isinstance(items_data, str):
        try:
            parsed_items = json.loads(items_data)
        except Exception:
            if "|" in items_data:
                for chunk in items_data.split("|"):
                    chunk = chunk.strip()
                    if chunk:
                        parsed_items.append({"name": chunk, "qty": 1, "price": 0.0})
            elif items_data.strip():
                parsed_items.append({"name": items_data.strip(), "qty": 1, "price": 0.0})
    elif isinstance(items_data, list):
        parsed_items = items_data

    if not parsed_items:
        return '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #94a3b8; font-size: 13px;">Prescription Verified Medicines</td></tr>'

    rows = []
    for it in parsed_items:
        if isinstance(it, dict):
            name = it.get("name") or it.get("title") or "Medicine"
            qty = it.get("qty") or it.get("quantity") or 1
            price = float(it.get("price") or 0.0)
            item_total = price * int(qty)
            rows.append(
                f'<tr style="border-bottom: 1px solid #f1f5f9;">'
                f'<td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 600;">{name}</td>'
                f'<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;">{qty}</td>'
                f'<td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;">₹{price:.2f}</td>'
                f'<td style="padding: 10px 12px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 700;">₹{item_total:.2f}</td>'
                f'</tr>'
            )
        else:
            rows.append(
                f'<tr style="border-bottom: 1px solid #f1f5f9;">'
                f'<td colspan="4" style="padding: 10px 12px; font-size: 13px; color: #1e293b;">{str(it)}</td>'
                f'</tr>'
            )
    return "\n".join(rows)


def send_owner_new_order_email(order_data: Dict[str, Any]):
    """
    Alerts the store owner immediately whenever a new order is placed on the store.
    Includes full item breakdown, customer details, address, payment mode, and total.
    """
    admin_recipient = os.getenv("ADMIN_NOTIFICATION_EMAIL", RESEND_SANDBOX_OWNER)
    try:
        ist = pytz.timezone("Asia/Kolkata")
        order_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Customer"
        customer_phone = order_data.get("phone") or order_data.get("customer_phone") or "—"
        customer_email = order_data.get("email") or order_data.get("customer_email") or "—"
        district = order_data.get("district") or "Nandurbar"
        address = order_data.get("address") or "—"
        pincode = order_data.get("pincode") or ""
        total_amount = float(order_data.get("totalAmount") or order_data.get("amount") or 0.0)
        subtotal = float(order_data.get("subtotal") or 0.0)
        delivery_fee = float(order_data.get("deliveryFee") or order_data.get("delivery_fee") or 0.0)
        discount = float(order_data.get("discount") or 0.0)
        payment_method = str(order_data.get("paymentMethod") or "COD").upper()
        rx_file = order_data.get("prescriptionFile") or order_data.get("prescription_file") or ""

        items_html = _format_order_items_html(order_data.get("items"))

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06); }}
            .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 22px 28px; }}
            .content {{ padding: 26px 28px; color: #1e293b; font-size: 14px; line-height: 1.6; }}
            .highlight-card {{ background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }}
            .info-grid {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin: 16px 0; }}
            .footer {{ padding: 16px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; border-top: 1px solid #e2e8f0; }}
            .badge-new {{ display: inline-block; background: #22c55e; color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }}
            .badge-pay {{ display: inline-block; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <span class="badge-new">New Store Order</span>
              <h2 style="margin: 8px 0 0 0; font-size: 21px; font-weight: 800;">🔔 New Order Received: #{order_id}</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Dhruv Pharma Store Owner Real-Time Dispatch Alert</p>
            </div>
            <div class="content">
              <div class="highlight-card">
                <table style="width: 100%;">
                  <tr>
                    <td>
                      <p style="margin: 0; font-size: 12px; color: #15803d; font-weight: 700; text-transform: uppercase;">Total Order Amount</p>
                      <h3 style="margin: 2px 0 0 0; font-size: 24px; color: #166534; font-weight: 900;">₹{total_amount:.2f}</h3>
                    </td>
                    <td style="text-align: right;">
                      <span class="badge-pay">{payment_method}</span>
                      <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Placed: {order_time}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Customer & Delivery Details</h4>
              <div class="info-grid">
                <p style="margin: 4px 0;"><strong>Customer Name:</strong> {customer_name}</p>
                <p style="margin: 4px 0;"><strong>Phone:</strong> <a href="tel:{customer_phone}" style="color: #2563eb; font-weight: bold;">{customer_phone}</a></p>
                <p style="margin: 4px 0;"><strong>Email:</strong> {customer_email}</p>
                <p style="margin: 4px 0;"><strong>Delivery Hub:</strong> {district} {pincode}</p>
                <p style="margin: 4px 0;"><strong>Address:</strong> {address}</p>
                {f'<p style="margin: 4px 0; color: #b45309;"><strong>Prescription:</strong> <a href="{rx_file}" style="color: #b45309; text-decoration: underline;">View Uploaded Prescription</a></p>' if rx_file else ''}
              </div>

              <h4 style="margin: 18px 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Medicines Ordered</h4>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                  <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
                    <th style="padding: 8px 12px;">Item</th>
                    <th style="padding: 8px 12px; text-align: center;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right;">Rate</th>
                    <th style="padding: 8px 12px; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items_html}
                </tbody>
              </table>

              <div style="border-top: 2px solid #e2e8f0; padding-top: 10px;">
                <table style="width: 100%; font-size: 13px;">
                  <tr>
                    <td style="color: #64748b; padding: 2px 0;">Subtotal:</td>
                    <td style="text-align: right; font-weight: 600;">₹{subtotal:.2f}</td>
                  </tr>
                  {f'<tr><td style="color: #16a34a; padding: 2px 0;">Discount Coupon:</td><td style="text-align: right; color: #16a34a; font-weight: 600;">-₹{discount:.2f}</td></tr>' if discount > 0 else ''}
                  <tr>
                    <td style="color: #64748b; padding: 2px 0;">Delivery Charge:</td>
                    <td style="text-align: right; font-weight: 600;">{('₹' + str(delivery_fee)) if delivery_fee > 0 else '<span style="color: #16a34a; font-weight: bold;">FREE</span>'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 800; font-size: 15px; padding-top: 6px;">Total Bill:</td>
                    <td style="text-align: right; font-weight: 800; font-size: 17px; color: #0f172a; padding-top: 6px;">₹{total_amount:.2f}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 22px;">
                <a href="http://localhost:5173/admin/orders" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
                  Open Orders Portal to Pack &amp; Dispatch &rarr;
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">Dhruv Pharma Management Suite</p>
              <p style="margin: 4px 0 0 0;">FDA License 20B/21B • Nandurbar Headquarters</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [admin_recipient],
            "subject": f"🔔 [NEW ORDER] #{order_id} Received from {customer_name} — ₹{total_amount:.2f}",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, admin_recipient)
    except Exception as e:
        print(f"[Resend Error] Failed to send owner new order alert to {admin_recipient}: {str(e)}")
        return None


def send_order_packed_email(to_email: str, order_data: Dict[str, Any]):
    """
    Sends step-by-step alert to customer: Order has been inspected and packed by pharmacist.
    """
    if not to_email or "@" not in to_email:
        return None

    try:
        ist = pytz.timezone("Asia/Kolkata")
        packed_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Valued Customer"
        total_amount = float(order_data.get("totalAmount") or order_data.get("amount") or 0.0)
        expected_window = order_data.get("expectedDelivery") or order_data.get("expected_delivery") or "Expected in 3–4 Days"
        district = order_data.get("district") or "Nandurbar"
        items_html = _format_order_items_html(order_data.get("items"))

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 580px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff; padding: 24px; text-align: center; }}
            .content {{ padding: 26px; color: #334155; font-size: 14px; line-height: 1.6; }}
            .status-card {{ background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin: 16px 0; }}
            .step-bar {{ display: flex; justify-content: space-between; margin: 20px 0; padding: 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 12px; }}
            .footer {{ padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }}
            .badge {{ display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <span style="font-size: 32px;">📦</span>
              <h2 style="margin: 6px 0 0 0; font-size: 21px; font-weight: bold;">Order Packed &amp; Verified!</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Quality checked by registered pharmacist</p>
            </div>
            <div class="content">
              <span class="badge">Step 2 of 4: Order Packed</span>
              <p>Namaskar <strong>{customer_name}</strong>,</p>
              <p>Great news! Your medicine order <strong>#{order_id}</strong> has been verified against licensed pharmacy standards (FDA 20B/21B) and packed safely in tamper-evident packaging.</p>

              <div class="status-card">
                <table style="width: 100%; font-size: 13px;">
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Order ID:</strong></td>
                    <td style="text-align: right; font-weight: bold; color: #0284c7;">#{order_id}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Packed On:</strong></td>
                    <td style="text-align: right; color: #1e293b;">{packed_time}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Delivery Window:</strong></td>
                    <td style="text-align: right; font-weight: 600; color: #15803d;">{expected_window}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Destination Hub:</strong></td>
                    <td style="text-align: right; color: #1e293b;">{district}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Bill Amount:</strong></td>
                    <td style="text-align: right; font-weight: 800; font-size: 15px; color: #0f172a;">₹{total_amount:.2f}</td>
                  </tr>
                </table>
              </div>

              <h4 style="margin: 18px 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Packed Medicines</h4>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                  <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
                    <th style="padding: 8px 12px;">Item</th>
                    <th style="padding: 8px 12px; text-align: center;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right;">Rate</th>
                    <th style="padding: 8px 12px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items_html}
                </tbody>
              </table>

              <p style="font-size: 13px; color: #64748b;">
                Our express courier partner will pick up your parcel shortly. You will receive an immediate update once the delivery rider is on the way.
              </p>

              <div style="text-align: center; margin-top: 20px;">
                <a href="http://localhost:5173/track-order" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 13px;">
                  Track Order Status Online &rarr;
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">DhruvPharma • Genuine Medicines &amp; Healthcare</p>
              <p style="margin: 4px 0 0 0;">Helpline: +91 95035 00725 • FDA 20B/21B Licensed</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": f"📦 Order #{order_id} Packed & Quality Checked — Dhruv Pharma",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, to_email)
    except Exception as e:
        print(f"[Resend Error] Failed to send order packed email to {to_email}: {str(e)}")
        return None


def send_order_out_for_delivery_email(to_email: str, order_data: Dict[str, Any]):
    """
    Sends step-by-step alert to customer: Order is out for delivery with assigned rider/courier.
    Specifies COD cash amount to keep ready or confirms prepaid status.
    """
    if not to_email or "@" not in to_email:
        return None

    try:
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Valued Customer"
        total_amount = float(order_data.get("totalAmount") or order_data.get("amount") or 0.0)
        delivery_agent = order_data.get("deliveryAgent") or order_data.get("delivery_agent") or "Dhruv Express Courier Partner"
        expected_window = order_data.get("expectedDelivery") or order_data.get("expected_delivery") or "Arriving Shortly"
        address = order_data.get("address") or "—"
        district = order_data.get("district") or "Nandurbar"
        payment_method = str(order_data.get("paymentMethod") or "COD").upper()
        is_cod = "COD" in payment_method or "CASH" in payment_method

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 580px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #fff; padding: 24px; text-align: center; }}
            .content {{ padding: 26px; color: #334155; font-size: 14px; line-height: 1.6; }}
            .cod-alert {{ background: #fefce8; border: 2px dashed #eab308; border-radius: 12px; padding: 16px 20px; margin: 18px 0; }}
            .prepaid-alert {{ background: #ecfdf5; border: 1px solid #86efac; border-radius: 12px; padding: 16px 20px; margin: 18px 0; }}
            .info-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin: 16px 0; }}
            .footer {{ padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }}
            .badge {{ display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <span style="font-size: 36px;">🚚</span>
              <h2 style="margin: 6px 0 0 0; font-size: 21px; font-weight: bold;">Your Order is Out for Delivery!</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Heading to your doorstep in {district}</p>
            </div>
            <div class="content">
              <span class="badge">Step 3 of 4: Out for Delivery</span>
              <p>Namaskar <strong>{customer_name}</strong>,</p>
              <p>Your medicine package <strong>#{order_id}</strong> is in transit and will reach your doorstep today!</p>

              {f'''
              <div class="cod-alert">
                <p style="margin: 0; font-size: 12px; color: #a16207; font-weight: 700; text-transform: uppercase;">💵 Cash on Delivery (COD) Notice</p>
                <h3 style="margin: 4px 0 0 0; font-size: 22px; color: #854d0e; font-weight: 900;">Please keep ₹{total_amount:.2f} in exact cash ready</h3>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #713f12;">Our delivery partner will hand over your verified medicines upon receiving this amount.</p>
              </div>
              ''' if is_cod else f'''
              <div class="prepaid-alert">
                <p style="margin: 0; font-size: 12px; color: #15803d; font-weight: 700; text-transform: uppercase;">✓ Fully Prepaid Order</p>
                <h3 style="margin: 4px 0 0 0; font-size: 20px; color: #166534; font-weight: 800;">₹{total_amount:.2f} Paid Online</h3>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #14532d;">Zero cash collection at doorstep. Just verify your parcel and collect.</p>
              </div>
              '''}

              <div class="info-card">
                <p style="margin: 4px 0;"><strong>Assigned Delivery Partner:</strong> {delivery_agent}</p>
                <p style="margin: 4px 0;"><strong>Estimated Arrival Window:</strong> {expected_window}</p>
                <p style="margin: 4px 0;"><strong>Delivering To:</strong> {address}, {district}</p>
              </div>

              <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #475569;">
                <strong>Rider Helpline:</strong> Need to give delivery instructions or landmark directions? Call <strong>+91 95035 00725</strong>.
              </div>

              <div style="text-align: center; margin-top: 22px;">
                <a href="http://localhost:5173/track-order" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
                  Live Track Delivery &rarr;
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">DhruvPharma • Express Regional Medicine Delivery</p>
              <p style="margin: 4px 0 0 0;">Licensed Pharmacy FDA 20B/21B • Maharashtra</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": f"🚚 Out for Delivery: Order #{order_id} is on the way! — Dhruv Pharma",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, to_email)
    except Exception as e:
        print(f"[Resend Error] Failed to send out for delivery email to {to_email}: {str(e)}")
        return None


def send_order_delivered_email(to_email: str, order_data: Dict[str, Any]):
    """
    Sends step-by-step alert to customer: Order has been successfully delivered.
    Includes medicine storage instructions and pharmacy contact.
    """
    if not to_email or "@" not in to_email:
        return None

    try:
        ist = pytz.timezone("Asia/Kolkata")
        delivered_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Valued Customer"
        total_amount = float(order_data.get("totalAmount") or order_data.get("amount") or 0.0)
        items_html = _format_order_items_html(order_data.get("items"))

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 580px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #fff; padding: 24px; text-align: center; }}
            .content {{ padding: 26px; color: #334155; font-size: 14px; line-height: 1.6; }}
            .success-card {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin: 16px 0; }}
            .storage-card {{ background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 16px; margin: 18px 0; font-size: 13px; color: #1e3a8a; }}
            .footer {{ padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafafa; border-top: 1px solid #f1f5f9; }}
            .badge {{ display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <span style="font-size: 36px;">🎉</span>
              <h2 style="margin: 6px 0 0 0; font-size: 21px; font-weight: bold;">Delivered Successfully!</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Thank you for trusting Dhruv Pharma</p>
            </div>
            <div class="content">
              <span class="badge">Step 4 of 4: Completed</span>
              <p>Namaskar <strong>{customer_name}</strong>,</p>
              <p>Your order <strong>#{order_id}</strong> has been successfully handed over to you on <strong>{delivered_time}</strong>.</p>

              <div class="success-card">
                <table style="width: 100%; font-size: 13px;">
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Order ID:</strong></td>
                    <td style="text-align: right; font-weight: bold; color: #16a34a;">#{order_id}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Delivered At:</strong></td>
                    <td style="text-align: right; color: #1e293b;">{delivered_time}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 3px 0;"><strong>Total Bill Settled:</strong></td>
                    <td style="text-align: right; font-weight: 800; font-size: 16px; color: #0f172a;">₹{total_amount:.2f}</td>
                  </tr>
                </table>
              </div>

              <h4 style="margin: 18px 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Delivered Medicines</h4>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                  <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
                    <th style="padding: 8px 12px;">Item</th>
                    <th style="padding: 8px 12px; text-align: center;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right;">Rate</th>
                    <th style="padding: 8px 12px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items_html}
                </tbody>
              </table>

              <div class="storage-card">
                <strong style="font-size: 13px;">💊 Important Medicine Storage &amp; Safety Tips:</strong>
                <ul style="margin: 6px 0 0 0; padding-left: 20px;">
                  <li>Store in a cool, dry place away from direct sunlight (below 25°C).</li>
                  <li>Refrigerate syrups / suspensions only if indicated on the package.</li>
                  <li>Keep out of reach of children. Consume strictly as per doctor's prescription.</li>
                </ul>
              </div>

              <p style="font-size: 13px; color: #64748b;">
                Need medicine refill or pharmacist consultation? Call us directly at <strong>+91 95035 00725</strong> or visit our online store anytime.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">DhruvPharma • Genuine Medicines &amp; Healthcare</p>
              <p style="margin: 4px 0 0 0;">Licensed Pharmacy FDA 20B/21B • Nandurbar Headquarters</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": f"🎉 Order #{order_id} Delivered Successfully — Dhruv Pharma",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, to_email)
    except Exception as e:
        print(f"[Resend Error] Failed to send delivered email to {to_email}: {str(e)}")
        return None


def send_owner_order_delivered_email(order_data: Dict[str, Any]):
    """
    Alerts the store owner that an order has been successfully delivered and money collected.
    """
    admin_recipient = os.getenv("ADMIN_NOTIFICATION_EMAIL", RESEND_SANDBOX_OWNER)
    try:
        ist = pytz.timezone("Asia/Kolkata")
        delivered_time = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")
        order_id = order_data.get("orderId") or order_data.get("id") or "DP-Order"
        customer_name = order_data.get("customerName") or order_data.get("patient") or "Customer"
        customer_phone = order_data.get("phone") or order_data.get("customer_phone") or "—"
        district = order_data.get("district") or "Nandurbar"
        address = order_data.get("address") or "—"
        total_amount = float(order_data.get("totalAmount") or order_data.get("amount") or 0.0)
        payment_method = str(order_data.get("paymentMethod") or "COD").upper()
        delivery_agent = order_data.get("deliveryAgent") or order_data.get("delivery_agent") or "Dhruv Express Courier Partner"

        items_html = _format_order_items_html(order_data.get("items"))

        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }}
            .box {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06); }}
            .header {{ background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: #fff; padding: 22px 28px; }}
            .content {{ padding: 26px 28px; color: #1e293b; font-size: 14px; line-height: 1.6; }}
            .card {{ background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }}
            .info-grid {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin: 16px 0; }}
            .footer {{ padding: 16px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; border-top: 1px solid #e2e8f0; }}
            .badge-complete {{ display: inline-block; background: #ffffff; color: #15803d; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }}
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <span class="badge-complete">Delivery Complete &amp; Reconciled</span>
              <h2 style="margin: 8px 0 0 0; font-size: 21px; font-weight: 800;">💰 Order #{order_id} Delivered Successfully</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #bbf7d0;">Dhruv Pharma Revenue &amp; Cash Reconciliation Alert</p>
            </div>
            <div class="content">
              <div class="card">
                <table style="width: 100%;">
                  <tr>
                    <td>
                      <p style="margin: 0; font-size: 12px; color: #15803d; font-weight: 700; text-transform: uppercase;">Payment Collected</p>
                      <h3 style="margin: 2px 0 0 0; font-size: 26px; color: #14532d; font-weight: 900;">₹{total_amount:.2f}</h3>
                    </td>
                    <td style="text-align: right;">
                      <span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">{payment_method}</span>
                      <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Delivered: {delivered_time}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Delivery Details</h4>
              <div class="info-grid">
                <p style="margin: 4px 0;"><strong>Customer:</strong> {customer_name} (<a href="tel:{customer_phone}" style="color: #2563eb;">{customer_phone}</a>)</p>
                <p style="margin: 4px 0;"><strong>Delivered To:</strong> {address}, {district}</p>
                <p style="margin: 4px 0;"><strong>Delivery Partner:</strong> {delivery_agent}</p>
                <p style="margin: 4px 0;"><strong>Order Status:</strong> <span style="color: #16a34a; font-weight: bold;">Completed / Delivered</span></p>
              </div>

              <h4 style="margin: 18px 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Medicines Delivered</h4>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                  <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
                    <th style="padding: 8px 12px;">Item</th>
                    <th style="padding: 8px 12px; text-align: center;">Qty</th>
                    <th style="padding: 8px 12px; text-align: right;">Rate</th>
                    <th style="padding: 8px 12px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items_html}
                </tbody>
              </table>

              <p style="font-size: 13px; color: #64748b;">
                Customer has received their delivery receipt and safety storage guidance. The sales report and cash collection register have been updated.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">Dhruv Pharma Management Suite</p>
              <p style="margin: 4px 0 0 0;">Automated Store Operations • Nandurbar Headquarters</p>
            </div>
          </div>
        </body>
        </html>
        """

        params = {
            "from": EMAIL_FROM,
            "to": [admin_recipient],
            "subject": f"💰 [DELIVERY COMPLETED] Order #{order_id} — ₹{total_amount:.2f} Collected",
            "html": html_template
        }
        return _send_with_sandbox_fallback(params, admin_recipient)
    except Exception as e:
        print(f"[Resend Error] Failed to send owner delivery alert to {admin_recipient}: {str(e)}")
        return None


