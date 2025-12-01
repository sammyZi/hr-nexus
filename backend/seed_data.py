"""
Script to seed MongoDB with sample data
Run this script to populate the database with initial data
"""
from pymongo import MongoClient
import bcrypt
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "hrnexus")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_database():
    """Seed the database with sample data"""
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Clear existing data
    print("Clearing existing data...")
    db.users.delete_many({})
    db.tasks.delete_many({})
    db.documents.delete_many({})
    
    # Create sample users
    print("Creating sample users...")
    users = [
        {
            "email": "admin@hrnexus.com",
            "hashed_password": hash_password("admin123"),
            "is_active": True,
            "is_verified": True,
            "verification_token": None,
            "created_at": datetime.utcnow()
        },
        {
            "email": "hr.manager@hrnexus.com",
            "hashed_password": hash_password("manager123"),
            "is_active": True,
            "is_verified": True,
            "verification_token": None,
            "created_at": datetime.utcnow()
        },
        {
            "email": "recruiter@hrnexus.com",
            "hashed_password": hash_password("recruiter123"),
            "is_active": True,
            "is_verified": True,
            "verification_token": None,
            "created_at": datetime.utcnow()
        }
    ]
    
    result = db.users.insert_many(users)
    admin_id = str(result.inserted_ids[0])
    manager_id = str(result.inserted_ids[1])
    recruiter_id = str(result.inserted_ids[2])
    
    print(f"✓ Created {len(users)} users")
    
    # Create sample tasks
    print("Creating sample tasks...")
    tasks = [
        {
            "title": "Screen Candidates for Senior Developer Position",
            "description": "Review resumes and conduct initial phone screenings for the senior developer role. Focus on candidates with 5+ years of experience in Python and React.",
            "category": "Recruiting",
            "priority": "High",
            "status": "In Progress",
            "owner_id": recruiter_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Prepare Onboarding Kit for New Hire - Alice Johnson",
            "description": "Prepare welcome package, setup workstation, create accounts, and schedule orientation sessions for Alice starting next Monday.",
            "category": "Onboarding",
            "priority": "High",
            "status": "Pending",
            "owner_id": admin_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Process Monthly Payroll for December",
            "description": "Review timesheets, process salary payments, handle deductions, and generate payslips for all employees.",
            "category": "Payroll",
            "priority": "High",
            "status": "Pending",
            "owner_id": manager_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Review Health Insurance Options for 2025",
            "description": "Compare different health insurance providers, analyze costs and benefits, and prepare recommendations for management.",
            "category": "Benefits",
            "priority": "Medium",
            "status": "In Progress",
            "owner_id": manager_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Schedule Python Advanced Workshop",
            "description": "Organize a 2-day advanced Python workshop for the development team. Find instructor, book venue, and send invitations.",
            "category": "Learning_Development",
            "priority": "Low",
            "status": "Pending",
            "owner_id": admin_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Mediate Team Conflict - Engineering Department",
            "description": "Schedule and conduct mediation session between team members regarding project responsibilities and communication issues.",
            "category": "Employee_Relations",
            "priority": "High",
            "status": "In Progress",
            "owner_id": manager_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Conduct Q4 Performance Reviews",
            "description": "Complete performance evaluations for all team members, schedule one-on-one meetings, and prepare development plans.",
            "category": "Performance",
            "priority": "High",
            "status": "Pending",
            "owner_id": manager_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Exit Interview with Bob Martinez",
            "description": "Conduct exit interview, collect company property, process final paycheck, and update documentation.",
            "category": "Offboarding",
            "priority": "Medium",
            "status": "Completed",
            "owner_id": admin_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Update Employee Handbook",
            "description": "Review and update company policies, remote work guidelines, and code of conduct sections in the employee handbook.",
            "category": "Employee_Relations",
            "priority": "Medium",
            "status": "Pending",
            "owner_id": admin_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Organize Team Building Event",
            "description": "Plan and coordinate quarterly team building event. Research venues, activities, and manage budget.",
            "category": "Employee_Relations",
            "priority": "Low",
            "status": "Pending",
            "owner_id": manager_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Review Compensation Benchmarks",
            "description": "Research industry salary standards and prepare compensation analysis report for management review.",
            "category": "Payroll",
            "priority": "Medium",
            "status": "In Progress",
            "owner_id": manager_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Post Job Opening for Marketing Manager",
            "description": "Create job description, post on job boards, and start collecting applications for the marketing manager position.",
            "category": "Recruiting",
            "priority": "High",
            "status": "Pending",
            "owner_id": recruiter_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    db.tasks.insert_many(tasks)
    print(f"✓ Created {len(tasks)} tasks")
    
    # Create indexes for better performance
    print("Creating database indexes...")
    db.users.create_index("email", unique=True)
    db.tasks.create_index("category")
    db.tasks.create_index("status")
    db.tasks.create_index("owner_id")
    db.documents.create_index("filename")
    db.documents.create_index("category")
    print("✓ Created indexes")
    
    print("\n" + "="*50)
    print("Database seeded successfully!")
    print("="*50)
    print("\nSample Users:")
    print("  - admin@hrnexus.com / admin123")
    print("  - hr.manager@hrnexus.com / manager123")
    print("  - recruiter@hrnexus.com / recruiter123")
    print(f"\nTotal Tasks: {len(tasks)}")
    print("="*50)
    
    client.close()

if __name__ == "__main__":
    seed_database()
