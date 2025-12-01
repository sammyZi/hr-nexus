import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "noreply@hrnexus.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_verification_email(email: EmailStr, token: str):
    html = f"""
    <p>Welcome to HR Nexus!</p>
    <p>Please verify your account by clicking the link below:</p>
    <p><a href="http://localhost:3000/verify/{token}">Verify Account</a></p>
    """

    message = MessageSchema(
        subject="Verify your HR Nexus Account",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_invitation_email(email: EmailStr, token: str, organization_name: str):
    """
    Send invitation email to a user to join an organization.
    
    Args:
        email: Email address of the invitee
        token: Unique invitation token
        organization_name: Name of the organization
    """
    # Create invitation link
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

    message = MessageSchema(
        subject=f"Invitation to join {organization_name} on HR Nexus",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
