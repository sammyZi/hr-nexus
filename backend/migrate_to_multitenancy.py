"""
Database Migration Script for Multi-Tenancy
============================================

This script migrates existing single-tenant data to multi-tenant structure.
It creates a default organization and assigns all existing data to it.

Requirements: 1.4, 1.5, 4.1

Usage:
    python migrate_to_multitenancy.py [--dry-run] [--org-name "Organization Name"]

Options:
    --dry-run           Show what would be migrated without making changes
    --org-name          Name for the default organization (default: "Default Organization")
    --skip-chromadb     Skip ChromaDB metadata migration

Note: For fresh installations, this script is not needed.
      The multi-tenant structure is already in place.
"""

import asyncio
import argparse
import os
import sys
from datetime import datetime
from bson import ObjectId

# Import database collections
from database import (
    organizations_collection,
    users_collection,
    tasks_collection,
    documents_collection
)
from models import generate_slug
from organization_service import OrganizationService


class MigrationStats:
    """Track migration statistics"""
    def __init__(self):
        self.users_migrated = 0
        self.tasks_migrated = 0
        self.documents_migrated = 0
        self.chromadb_chunks_migrated = 0
        self.errors = []
    
    def print_summary(self):
        """Print migration summary"""
        print("\n" + "="*60)
        print("MIGRATION SUMMARY")
        print("="*60)
        print(f"Users migrated:           {self.users_migrated}")
        print(f"Tasks migrated:           {self.tasks_migrated}")
        print(f"Documents migrated:       {self.documents_migrated}")
        print(f"ChromaDB chunks migrated: {self.chromadb_chunks_migrated}")
        
        if self.errors:
            print(f"\nErrors encountered:       {len(self.errors)}")
            for error in self.errors:
                print(f"  - {error}")
        else:
            print("\n✓ Migration completed successfully with no errors")
        print("="*60)


async def check_existing_migration():
    """Check if data has already been migrated"""
    # Check if any users already have organization_id
    user_with_org = await users_collection.find_one({"organization_id": {"$exists": True}})
    
    # Check if any tasks already have organization_id
    task_with_org = await tasks_collection.find_one({"organization_id": {"$exists": True}})
    
    # Check if any documents already have organization_id
    doc_with_org = await documents_collection.find_one({"organization_id": {"$exists": True}})
    
    return user_with_org is not None or task_with_org is not None or doc_with_org is not None


async def count_records_to_migrate():
    """Count records that need migration"""
    users_count = await users_collection.count_documents({"organization_id": {"$exists": False}})
    tasks_count = await tasks_collection.count_documents({"organization_id": {"$exists": False}})
    docs_count = await documents_collection.count_documents({"organization_id": {"$exists": False}})
    
    return users_count, tasks_count, docs_count


async def create_default_organization(org_name: str, dry_run: bool = False):
    """Create default organization for existing data"""
    print(f"\n1. Creating default organization: '{org_name}'...")
    
    if dry_run:
        print("   [DRY RUN] Would create organization")
        # Return a fake ID for dry run
        return "000000000000000000000000"
    
    # Generate slug
    slug = generate_slug(org_name)
    
    # Check if organization already exists
    existing_org = await organizations_collection.find_one({"slug": slug})
    if existing_org:
        org_id = str(existing_org["_id"])
        print(f"   ✓ Organization already exists (ID: {org_id})")
        return org_id
    
    # Create organization
    org = await OrganizationService.create_organization(
        name=org_name,
        slug=slug
    )
    org_id = str(org.id)
    
    print(f"   ✓ Created organization (ID: {org_id})")
    return org_id


async def migrate_users(org_id: str, dry_run: bool = False):
    """Migrate users to include organization_id"""
    print("\n2. Migrating users...")
    
    # Find users without organization_id
    users = await users_collection.find({"organization_id": {"$exists": False}}).to_list(length=None)
    
    if not users:
        print("   ✓ No users to migrate")
        return 0
    
    print(f"   Found {len(users)} users to migrate")
    
    if dry_run:
        print("   [DRY RUN] Would update users with organization_id")
        return len(users)
    
    # Update users with organization_id and default role
    migrated = 0
    for user in users:
        try:
            # Set default role to 'employee' if not set, first user becomes admin
            role = user.get("role", "admin" if migrated == 0 else "employee")
            
            await users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "organization_id": org_id,
                        "role": role
                    }
                }
            )
            migrated += 1
            print(f"   ✓ Migrated user: {user.get('email', 'unknown')} (role: {role})")
        except Exception as e:
            print(f"   ✗ Error migrating user {user.get('email', 'unknown')}: {str(e)}")
    
    print(f"   ✓ Migrated {migrated} users")
    return migrated


async def migrate_tasks(org_id: str, dry_run: bool = False):
    """Migrate tasks to include organization_id"""
    print("\n3. Migrating tasks...")
    
    # Find tasks without organization_id
    tasks = await tasks_collection.find({"organization_id": {"$exists": False}}).to_list(length=None)
    
    if not tasks:
        print("   ✓ No tasks to migrate")
        return 0
    
    print(f"   Found {len(tasks)} tasks to migrate")
    
    if dry_run:
        print("   [DRY RUN] Would update tasks with organization_id")
        return len(tasks)
    
    # Bulk update tasks
    result = await tasks_collection.update_many(
        {"organization_id": {"$exists": False}},
        {"$set": {"organization_id": org_id}}
    )
    
    migrated = result.modified_count
    print(f"   ✓ Migrated {migrated} tasks")
    return migrated


async def migrate_documents(org_id: str, dry_run: bool = False):
    """Migrate documents to include organization_id"""
    print("\n4. Migrating documents...")
    
    # Find documents without organization_id
    documents = await documents_collection.find({"organization_id": {"$exists": False}}).to_list(length=None)
    
    if not documents:
        print("   ✓ No documents to migrate")
        return 0
    
    print(f"   Found {len(documents)} documents to migrate")
    
    if dry_run:
        print("   [DRY RUN] Would update documents with organization_id")
        return len(documents)
    
    # Bulk update documents
    result = await documents_collection.update_many(
        {"organization_id": {"$exists": False}},
        {"$set": {"organization_id": org_id}}
    )
    
    migrated = result.modified_count
    print(f"   ✓ Migrated {migrated} documents")
    return migrated


def migrate_chromadb(org_id: str, dry_run: bool = False, skip: bool = False):
    """Migrate ChromaDB metadata to include organization_id"""
    print("\n5. Migrating ChromaDB metadata...")
    
    if skip:
        print("   ⊘ Skipped (--skip-chromadb flag)")
        return 0
    
    try:
        from langchain_community.embeddings import OllamaEmbeddings
        from langchain_chroma import Chroma
        
        PERSIST_DIRECTORY = "./chroma_db"
        OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        if not os.path.exists(PERSIST_DIRECTORY):
            print("   ✓ No ChromaDB to migrate")
            return 0
        
        if dry_run:
            print("   [DRY RUN] Would update ChromaDB metadata with organization_id")
            print("   Note: ChromaDB migration requires manual intervention")
            print("   Recommendation: Re-process documents after migration")
            return 0
        
        # Initialize ChromaDB
        embeddings = OllamaEmbeddings(
            base_url=OLLAMA_BASE_URL,
            model="nomic-embed-text"
        )
        vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
        
        # Get all documents
        collection = vectordb._collection
        all_docs = collection.get()
        
        if not all_docs or not all_docs['ids']:
            print("   ✓ No ChromaDB documents to migrate")
            return 0
        
        total_docs = len(all_docs['ids'])
        print(f"   Found {total_docs} ChromaDB chunks to migrate")
        
        # Update metadata for each document
        migrated = 0
        for i, doc_id in enumerate(all_docs['ids']):
            try:
                metadata = all_docs['metadatas'][i] if all_docs['metadatas'] else {}
                
                # Add organization_id to metadata if not present
                if 'organization_id' not in metadata:
                    metadata['organization_id'] = org_id
                    
                    # Update the document
                    collection.update(
                        ids=[doc_id],
                        metadatas=[metadata]
                    )
                    migrated += 1
            except Exception as e:
                print(f"   ✗ Error migrating chunk {doc_id}: {str(e)}")
        
        print(f"   ✓ Migrated {migrated} ChromaDB chunks")
        print("   ⚠ Note: It's recommended to re-process documents to ensure consistency")
        return migrated
        
    except ImportError:
        print("   ⚠ ChromaDB libraries not available, skipping vector DB migration")
        return 0
    except Exception as e:
        print(f"   ✗ Error migrating ChromaDB: {str(e)}")
        print("   ⚠ Recommendation: Re-process all documents after migration")
        return 0


async def run_migration(org_name: str, dry_run: bool = False, skip_chromadb: bool = False):
    """Run the complete migration process"""
    print("\n" + "="*60)
    print("MULTI-TENANCY MIGRATION SCRIPT")
    print("="*60)
    
    if dry_run:
        print("\n⚠ DRY RUN MODE - No changes will be made")
    
    stats = MigrationStats()
    
    try:
        # Check if already migrated
        already_migrated = await check_existing_migration()
        if already_migrated:
            print("\n⚠ WARNING: Some data already has organization_id")
            print("This might indicate a partial or previous migration.")
            response = input("Continue anyway? (yes/no): ")
            if response.lower() != "yes":
                print("Migration cancelled")
                return
        
        # Count records to migrate
        users_count, tasks_count, docs_count = await count_records_to_migrate()
        
        print(f"\nRecords to migrate:")
        print(f"  - Users:     {users_count}")
        print(f"  - Tasks:     {tasks_count}")
        print(f"  - Documents: {docs_count}")
        
        if users_count == 0 and tasks_count == 0 and docs_count == 0:
            print("\n✓ No data to migrate. Database is either empty or already migrated.")
            return
        
        if not dry_run:
            print("\n⚠ This will modify your database!")
            response = input("Proceed with migration? (yes/no): ")
            if response.lower() != "yes":
                print("Migration cancelled")
                return
        
        # Step 1: Create default organization
        org_id = await create_default_organization(org_name, dry_run)
        
        # Step 2: Migrate users
        stats.users_migrated = await migrate_users(org_id, dry_run)
        
        # Step 3: Migrate tasks
        stats.tasks_migrated = await migrate_tasks(org_id, dry_run)
        
        # Step 4: Migrate documents
        stats.documents_migrated = await migrate_documents(org_id, dry_run)
        
        # Step 5: Migrate ChromaDB
        stats.chromadb_chunks_migrated = migrate_chromadb(org_id, dry_run, skip_chromadb)
        
        # Print summary
        stats.print_summary()
        
        if not dry_run:
            print("\n✓ Migration completed successfully!")
            print(f"\nDefault Organization ID: {org_id}")
            print("\nNext steps:")
            print("1. Verify the migration by checking the database")
            print("2. Test the application with the new multi-tenant structure")
            print("3. Consider re-processing documents to ensure ChromaDB consistency")
        else:
            print("\n✓ Dry run completed. Run without --dry-run to apply changes.")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Migrate database to multi-tenant structure",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be migrated without making changes"
    )
    parser.add_argument(
        "--org-name",
        type=str,
        default="Default Organization",
        help="Name for the default organization (default: 'Default Organization')"
    )
    parser.add_argument(
        "--skip-chromadb",
        action="store_true",
        help="Skip ChromaDB metadata migration"
    )
    
    args = parser.parse_args()
    
    # Run migration
    asyncio.run(run_migration(args.org_name, args.dry_run, args.skip_chromadb))


if __name__ == "__main__":
    main()
