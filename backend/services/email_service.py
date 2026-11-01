import os
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
        err_msg = str(e)
        if "only send testing emails to your own email address" in err_msg.lower() or "403" in err_msg:
            print(f"[Resend Sandbox Mode] Notice: in trial mode, Resend permits test emails to your registered email ({RESEND_SANDBOX_OWNER}). Rerouting test copy...")
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

