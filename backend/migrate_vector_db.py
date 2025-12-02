"""
Migration script to add organization_id to existing vector database chunks.

This script updates all existing chunks in the Chroma vector database to include
the organization_id metadata field for proper multi-tenant isolation.

Usage:
    python migrate_vector_db.py
"""

import os
import sys
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

# Configuration
PERSIST_DIRECTORY = "./chroma_db"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = "nomic-embed-text"

def migrate_vector_db():
    """Add organization_id to all existing chunks"""
    
    print("🔄 Starting vector database migration...")
    print(f"📁 Database directory: {PERSIST_DIRECTORY}")
    
    if not os.path.exists(PERSIST_DIRECTORY):
        print("❌ Vector database not found. Nothing to migrate.")
        return
    
    try:
        # Initialize embeddings
        embeddings = OllamaEmbeddings(
            base_url=OLLAMA_BASE_URL,
            model=EMBEDDING_MODEL
        )
        
        # Load vector database
        vectordb = Chroma(
            persist_directory=PERSIST_DIRECTORY,
            embedding_function=embeddings
        )
        
        # Get all documents
        print("📊 Fetching all documents from vector database...")
        collection = vectordb._collection
        
        # Get all items
        all_items = collection.get(include=['metadatas', 'documents'])
        
        if not all_items or not all_items['ids']:
            print("❌ No documents found in vector database.")
            return
        
        total_chunks = len(all_items['ids'])
        print(f"📄 Found {total_chunks} chunks to migrate")
        
        # Group chunks by source file to determine organization
        from collections import defaultdict
        files_by_org = defaultdict(list)
        
        # First pass: identify which files belong to which organization
        # For now, we'll need to get this from the documents collection
        from database import documents_collection
        import asyncio
        
        async def get_org_mapping():
            """Get mapping of file paths to organization IDs"""
            mapping = {}
            async for doc in documents_collection.find({}):
                file_path = doc.get('file_path')
                org_id = doc.get('organization_id')
                if file_path and org_id:
                    mapping[file_path] = org_id
            return mapping
        
        # Run async function
        org_mapping = asyncio.run(get_org_mapping())
        
        if not org_mapping:
            print("⚠️  No organization mapping found in documents collection.")
            print("   Please ensure documents have been uploaded through the API.")
            return
        
        print(f"🏢 Found {len(org_mapping)} files with organization mapping")
        
        # Second pass: update chunks with organization_id
        updated_count = 0
        skipped_count = 0
        
        for i, (chunk_id, metadata) in enumerate(zip(all_items['ids'], all_items['metadatas'])):
            # Check if already has organization_id
            if metadata.get('organization_id'):
                skipped_count += 1
                continue
            
            # Get source file from metadata
            source_file = metadata.get('source_file')
            
            if not source_file:
                print(f"⚠️  Chunk {chunk_id} has no source_file metadata")
                continue
            
            # Find organization_id for this file
            org_id = org_mapping.get(source_file)
            
            if not org_id:
                print(f"⚠️  No organization found for file: {source_file}")
                continue
            
            # Update metadata
            metadata['organization_id'] = org_id
            
            # Update in vector database
            collection.update(
                ids=[chunk_id],
                metadatas=[metadata]
            )
            
            updated_count += 1
            
            # Progress indicator
            if (i + 1) % 100 == 0:
                print(f"   Progress: {i + 1}/{total_chunks} chunks processed...")
        
        print(f"\n✅ Migration complete!")
        print(f"   Updated: {updated_count} chunks")
        print(f"   Skipped: {skipped_count} chunks (already had organization_id)")
        print(f"   Total: {total_chunks} chunks")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    migrate_vector_db()
