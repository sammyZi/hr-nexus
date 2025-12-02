import os
from pydantic import EmailStr
from dotenv import load_dotenv
import httpx

load_dotenv()

# Resend API configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Balo App <onboarding@resend.dev>")

# Check if email is configured
EMAIL_CONFIGURED = bool(RESEND_API_KEY)

if EMAIL_CONFIGURED:
    print(f"[EMAIL] Email service configured with Resend API", flush=True)
else:
    print("[EMAIL] Email service not configured - skipping email sending", flush=True)


async def send_verification_email(email: EmailStr, code: str):
    """Send verification email with 6-digit code to a new user using Resend API."""
    if not EMAIL_CONFIGURED:
        print(f"[EMAIL] Skipping verification email to {email} - email not configured", flush=True)
        return
    
    try:
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4F46E5; margin: 0;">HR Nexus</h1>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to HR Nexus!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Thank you for signing up! To complete your registration, please use the verification code below:
            </p>
            
            <div style="background-color: #F3F4F6; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Your Verification Code</p>
                <div style="font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    {code}
                </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
                This code will expire in <strong>10 minutes</strong>.
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
                If you didn't create an account with HR Nexus, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                © 2024 HR Nexus. All rights reserved.
            </p>
        </div>
        """

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": EMAIL_FROM,
                    "to": [email],
                    "subject": "Verify your HR Nexus Account",
                    "html": html
                }
            )
            
            if response.status_code == 200:
                print(f"[EMAIL] Verification email sent successfully to {email}", flush=True)
                print(f"[EMAIL] Response: {response.json()}", flush=True)
            else:
                error_msg = f"Resend API error: {response.status_code} - {response.text}"
                print(f"[EMAIL] Failed to send verification email: {error_msg}", flush=True)
                raise Exception(error_msg)
                
    except Exception as e:
        print(f"[EMAIL] Failed to send verification email to {email}: {e}", flush=True)
        raise


async def send_invitation_email(email: EmailStr, token: str, organization_name: str):
    """
    Send invitation email to a user to join an organization using Resend API.
    
    Args:
        email: Email address of the invitee
        token: Unique invitation token
        organization_name: Name of the organization
    """
    if not EMAIL_CONFIGURED:
        print(f"[EMAIL] Skipping invitation email to {email} - email not configured", flush=True)
        return
    
    try:
        invitation_link = f"http://localhost:3000/invitations/accept/{token}"
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You're Invited to Join {organization_name}</h2>
            <p>Hello,</p>
            <p>You've been invited to join <strong>{organization_name}</strong> on HR Nexus, 
            an AI-powered HR management platform.</p>
            <p>Click the button below to accept your invitation and create your account:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{invitation_link}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Accept Invitation
                </a>
            </div>
            <p style="color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="{invitation_link}">{invitation_link}</a>
            </p>
            <p style="color: #666; font-size: 14px;">
                This invitation will expire in 7 days.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
                If you didn't expect this invitation, you can safely ignore this email.
            </p>
        </div>
        """

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": EMAIL_FROM,
                    "to": [email],
                    "subject": f"Invitation to join {organization_name} on HR Nexus",
                    "html": html
                }
            )
            
            if response.status_code == 200:
                print(f"[EMAIL] Invitation email sent to {email}", flush=True)
            else:
                print(f"[EMAIL] Failed to send invitation email: {response.status_code} - {response.text}", flush=True)
                
    except Exception as e:
        print(f"[EMAIL] Failed to send invitation email to {email}: {e}", flush=True)
        raise
