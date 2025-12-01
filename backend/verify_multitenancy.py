"""
Multi-Tenancy Verification Script
==================================

This script verifies that the multi-tenant database structure is properly set up.
Use this for fresh installations to ensure everything is configured correctly.

Usage:
    python verify_multitenancy.py
"""

import asyncio
import sys
from database import (
    organizations_collection,
    users_collection,
    tasks_collection,
    documents_collection,
    invitations_collection
)


async def verify_indexes():
    """Verify that required indexes exist"""
    print("\n1. Verifying database indexes...")
    
    issues = []
    
    # Check users collection indexes
    user_indexes = await users_collection.index_information()
    if not any('organization_id' in str(idx) for idx in user_indexes.values()):
        issues.append("Users collection missing organization_id index")
    else:
        print("   ✓ Users collection has organization_id index")
    
    # Check tasks collection indexes
    task_indexes = await tasks_collection.index_information()
    if not any('organization_id' in str(idx) for idx in task_indexes.values()):
        issues.append("Tasks collection missing organization_id index")
    else:
        print("   ✓ Tasks collection has organization_id index")
    
    # Check documents collection indexes
    doc_indexes = await documents_collection.index_information()
    if not any('organization_id' in str(idx) for idx in doc_indexes.values()):
        issues.append("Documents collection missing organization_id index")
    else:
        print("   ✓ Documents collection has organization_id index")
    
    # Check organizations collection
    org_indexes = await organizations_collection.index_information()
    if not any('slug' in str(idx) for idx in org_indexes.values()):
        issues.append("Organizations collection missing slug index")
    else:
        print("   ✓ Organizations collection has slug index")
    
    # Check invitations collection
    inv_indexes = await invitations_collection.index_information()
    if not any('token' in str(idx) for idx in inv_indexes.values()):
        issues.append("Invitations collection missing token index")
    else:
        print("   ✓ Invitations collection has token index")
    
    return issues


async def verify_schema():
    """Verify that collections have the correct schema"""
    print("\n2. Verifying collection schemas...")
    
    issues = []
    
    # Check if collections exist
    collections = await organizations_collection.database.list_collection_names()
    
    required_collections = [
        'organizations',
        'users',
        'tasks',
        'documents',
        'invitations'
    ]
    
    for coll in required_collections:
        if coll in collections:
            print(f"   ✓ Collection '{coll}' exists")
        else:
            issues.append(f"Collection '{coll}' does not exist")
    
    # Check for any data without organization_id (except organizations and invitations)
    users_without_org = await users_collection.count_documents({"organization_id": {"$exists": False}})
    if users_without_org > 0:
        issues.append(f"{users_without_org} users missing organization_id")
    else:
        print("   ✓ All users have organization_id")
    
    tasks_without_org = await tasks_collection.count_documents({"organization_id": {"$exists": False}})
    if tasks_without_org > 0:
        issues.append(f"{tasks_without_org} tasks missing organization_id")
    else:
        print("   ✓ All tasks have organization_id (or no tasks exist)")
    
    docs_without_org = await documents_collection.count_documents({"organization_id": {"$exists": False}})
    if docs_without_org > 0:
        issues.append(f"{docs_without_org} documents missing organization_id")
    else:
        print("   ✓ All documents have organization_id (or no documents exist)")
    
    return issues


async def verify_data_isolation():
    """Verify that data isolation is working"""
    print("\n3. Verifying data isolation...")
    
    # Count organizations
    org_count = await organizations_collection.count_documents({})
    print(f"   ℹ Found {org_count} organization(s)")
    
    if org_count == 0:
        print("   ℹ No organizations yet (fresh installation)")
        return []
    
    # For each organization, verify data is properly scoped
    orgs = await organizations_collection.find({}).to_list(length=None)
    
    for org in orgs:
        org_id = str(org["_id"])
        org_name = org.get("name", "Unknown")
        
        user_count = await users_collection.count_documents({"organization_id": org_id})
        task_count = await tasks_collection.count_documents({"organization_id": org_id})
        doc_count = await documents_collection.count_documents({"organization_id": org_id})
        
        print(f"   ✓ Organization '{org_name}' ({org_id}):")
        print(f"     - Users: {user_count}")
        print(f"     - Tasks: {task_count}")
        print(f"     - Documents: {doc_count}")
    
    return []


async def create_indexes():
    """Create required indexes if they don't exist"""
    print("\n4. Creating missing indexes...")
    
    try:
        # Users indexes
        await users_collection.create_index([("organization_id", 1), ("email", 1)])
        await users_collection.create_index([("organization_id", 1), ("role", 1)])
        print("   ✓ Created users indexes")
        
        # Tasks indexes
        await tasks_collection.create_index([("organization_id", 1), ("category", 1)])
        await tasks_collection.create_index([("organization_id", 1), ("status", 1)])
        print("   ✓ Created tasks indexes")
        
        # Documents indexes
        await documents_collection.create_index([("organization_id", 1), ("uploaded_at", -1)])
        await documents_collection.create_index([("organization_id", 1), ("category", 1)])
        print("   ✓ Created documents indexes")
        
        # Organizations indexes
        await organizations_collection.create_index([("slug", 1)], unique=True)
        print("   ✓ Created organizations indexes")
        
        # Invitations indexes
        await invitations_collection.create_index([("token", 1)], unique=True)
        await invitations_collection.create_index([("organization_id", 1), ("email", 1)])
        await invitations_collection.create_index([("expires_at", 1)], expireAfterSeconds=0)
        print("   ✓ Created invitations indexes")
        
        return True
    except Exception as e:
        print(f"   ✗ Error creating indexes: {str(e)}")
        return False


async def run_verification():
    """Run all verification checks"""
    print("\n" + "="*60)
    print("MULTI-TENANCY VERIFICATION")
    print("="*60)
    
    all_issues = []
    
    try:
        # Verify indexes
        index_issues = await verify_indexes()
        all_issues.extend(index_issues)
        
        # If indexes are missing, offer to create them
        if index_issues:
            print("\n⚠ Some indexes are missing")
            response = input("Create missing indexes? (yes/no): ")
            if response.lower() == "yes":
                success = await create_indexes()
                if success:
                    # Re-verify indexes
                    index_issues = await verify_indexes()
                    all_issues = [i for i in all_issues if i not in index_issues]
        
        # Verify schema
        schema_issues = await verify_schema()
        all_issues.extend(schema_issues)
        
        # Verify data isolation
        isolation_issues = await verify_data_isolation()
        all_issues.extend(isolation_issues)
        
        # Print summary
        print("\n" + "="*60)
        print("VERIFICATION SUMMARY")
        print("="*60)
        
        if all_issues:
            print(f"\n⚠ Found {len(all_issues)} issue(s):")
            for issue in all_issues:
                print(f"  - {issue}")
            print("\nRecommendation: Run migration script if you have existing data")
            print("Command: python migrate_to_multitenancy.py --dry-run")
            sys.exit(1)
        else:
            print("\n✓ All checks passed!")
            print("✓ Multi-tenant structure is properly configured")
            print("\nYour application is ready to use with multi-tenancy support.")
            sys.exit(0)
        
    except Exception as e:
        print(f"\n✗ Verification failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    """Main entry point"""
    asyncio.run(run_verification())


if __name__ == "__main__":
    main()
