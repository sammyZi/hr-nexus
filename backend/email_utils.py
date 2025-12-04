import os
from pydantic import EmailStr
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

# Gmail SMTP configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "HR Nexus <sammyi8857@gmail.com>")

# Frontend URL for invitation links
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Check if email is configured
EMAIL_CONFIGURED = bool(SMTP_USER and SMTP_PASSWORD)

if EMAIL_CONFIGURED:
    print(f"[EMAIL] Email service configured with Gmail SMTP ({SMTP_USER})", flush=True)
else:
    print("[EMAIL] Email service not configured - skipping email sending", flush=True)


async def send_verification_email(email: EmailStr, code: str):
    """Send verification email with 6-digit code to a new user using Gmail SMTP."""
    if not EMAIL_CONFIGURED:
        print(f"[EMAIL] Skipping verification email to {email} - email not configured", flush=True)
        return
    
    try:
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4F46E5; margin: 0; font-family: 'Inter', sans-serif;">HR Nexus</h1>
                </div>
                
                <h2 style="color: #333; margin-bottom: 20px; font-family: 'Inter', sans-serif;">Welcome to HR Nexus!</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.5; font-family: 'Inter', sans-serif;">
                    Thank you for signing up! To complete your registration, please use the verification code below:
                </p>
                
                <div style="background-color: #F3F4F6; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; font-family: 'Inter', sans-serif;">Your Verification Code</p>
                    <div style="font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: 'Inter', sans-serif;">
                        {code}
                    </div>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.5; font-family: 'Inter', sans-serif;">
                    This code will expire in <strong>10 minutes</strong>.
                </p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.5; font-family: 'Inter', sans-serif;">
                    If you didn't create an account with HR Nexus, you can safely ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; font-family: 'Inter', sans-serif;">
                    © 2024 HR Nexus. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Verify your HR Nexus Account"
        msg['From'] = EMAIL_FROM
        msg['To'] = email
        
        html_part = MIMEText(html, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            
        print(f"[EMAIL] Verification email sent successfully to {email}", flush=True)
                
    except Exception as e:
        print(f"[EMAIL] Failed to send verification email to {email}: {e}", flush=True)
        raise


async def send_invitation_email(email: EmailStr, token: str, organization_name: str):
    """
    Send invitation email to a user to join an organization using Gmail SMTP.
    
    Args:
        email: Email address of the invitee
        token: Unique invitation token
        organization_name: Name of the organization
    """
    if not EMAIL_CONFIGURED:
        print(f"[EMAIL] Skipping invitation email to {email} - email not configured", flush=True)
        return
    
    try:
        invitation_link = f"{FRONTEND_URL}/invitations/accept/{token}"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4F46E5; margin: 0; font-family: 'Inter', sans-serif;">HR Nexus</h1>
                </div>
                
                <h2 style="color: #333; font-family: 'Inter', sans-serif;">You're Invited to Join {organization_name}</h2>
                <p style="font-family: 'Inter', sans-serif;">Hello,</p>
                <p style="font-family: 'Inter', sans-serif;">You've been invited to join <strong>{organization_name}</strong> on HR Nexus, 
                an AI-powered HR management platform.</p>
                <p style="font-family: 'Inter', sans-serif;">Click the button below to accept your invitation and create your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{invitation_link}" 
                       style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block; font-family: 'Inter', sans-serif;">
                        Accept Invitation
                    </a>
                </div>
                <p style="color: #666; font-size: 14px; font-family: 'Inter', sans-serif;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{invitation_link}">{invitation_link}</a>
                </p>
                <p style="color: #666; font-size: 14px; font-family: 'Inter', sans-serif;">
                    This invitation will expire in 7 days.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; font-family: 'Inter', sans-serif;">
                    If you didn't expect this invitation, you can safely ignore this email.
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Invitation to join {organization_name} on HR Nexus"
        msg['From'] = EMAIL_FROM
        msg['To'] = email
        
        html_part = MIMEText(html, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            
        print(f"[EMAIL] Invitation email sent to {email}", flush=True)
                
    except Exception as e:
        print(f"[EMAIL] Failed to send invitation email to {email}: {e}", flush=True)
        raise
