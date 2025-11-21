#!/usr/bin/env python3
"""Quick test to check if vector database has data"""

import os
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma

PERSIST_DIRECTORY = "./chroma_db"
OLLAMA_BASE_URL = "http://localhost:11434"

if not os.path.exists(PERSIST_DIRECTORY):
    print("❌ Vector database folder does not exist!")
    exit(1)

print("✓ Vector database folder exists")

try:
    embeddings = OllamaEmbeddings(
        base_url=OLLAMA_BASE_URL,
        model="nomic-embed-text"
    )
    
    vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    
    # Try a simple search
    results = vectordb.similarity_search("deep learning", k=5)
    
    print(f"\n📊 Database Statistics:")
    print(f"  - Search for 'deep learning': {len(results)} results")
    
    if results:
        print(f"\n✓ Database has data!")
        print(f"\nFirst result preview:")
        print(f"  {results[0].page_content[:200]}...")
        print(f"\nMetadata:")
        print(f"  {results[0].metadata}")
    else:
        print("\n❌ Database is empty or search failed!")
        
        # Try getting all data
        print("\nTrying to get any data...")
        test_results = vectordb.similarity_search("test", k=1)
        if test_results:
            print(f"✓ Found data with test query")
        else:
            print("❌ No data found at all - database is empty!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nMake sure:")
    print("  1. Ollama is running")
    print("  2. nomic-embed-text model is installed")
    print("  3. Documents have been uploaded")
