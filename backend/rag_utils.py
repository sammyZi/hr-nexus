import os
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

PERSIST_DIRECTORY = "./chroma_db"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")  # or "mistral", "phi3", etc.

def process_document(file_path: str, file_type: str = None):
    """
    Process a document and add it to the vector database using local Ollama embeddings.
    Optimized for speed with batch processing.
    Supports PDF, DOCX, and TXT files.
    """
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        import time
        
        start_time = time.time()
        
        # Determine file type if not provided
        if not file_type:
            _, ext = os.path.splitext(file_path)
            file_type = ext.lower().replace('.', '')
        
        print(f"Loading {file_type} document...")
        
        # Load document based on type
        if file_type == 'pdf':
            loader = PyPDFLoader(file_path)
        elif file_type in ['docx', 'doc']:
            loader = Docx2txtLoader(file_path)
        elif file_type == 'txt':
            loader = TextLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        documents = loader.load()
        
        if not documents:
            raise ValueError("No content extracted from document")
        
        print(f"Document loaded in {time.time() - start_time:.2f}s. Splitting into chunks...")
        
        # Extract and enhance headings/titles for better search
        enhanced_docs = []
        for doc in documents:
            content = doc.page_content
            
            # Detect and enhance headings (lines that are short, capitalized, or have special formatting)
            lines = content.split('\n')
            enhanced_lines = []
            
            for line in lines:
                stripped = line.strip()
                if stripped:
                    # Check if line is likely a heading
                    is_heading = (
                        len(stripped) < 100 and  # Short line
                        (stripped.isupper() or  # All caps
                         stripped.istitle() or  # Title case
                         stripped.endswith(':') or  # Ends with colon
                         any(stripped.startswith(prefix) for prefix in ['Unit', 'Chapter', 'Section', 'Topic']))
                    )
                    
                    if is_heading:
                        # Boost heading importance by repeating it
                        enhanced_lines.append(f"\n[HEADING] {stripped} [/HEADING]")
                        enhanced_lines.append(f"Important: {stripped}")
                        enhanced_lines.append(stripped)
                    else:
                        enhanced_lines.append(stripped)
            
            doc.page_content = '\n'.join(enhanced_lines)
            enhanced_docs.append(doc)
        
        # Smart text splitting - preserve document structure
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200,  # Larger to accommodate enhanced headings
            chunk_overlap=150,
            length_function=len,
            # Split on these separators in order of priority
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        split_docs = text_splitter.split_documents(enhanced_docs)
        
        # Add metadata and extract headings for each chunk
        for i, doc in enumerate(split_docs):
            # Extract heading from chunk if present
            heading = ""
            content = doc.page_content
            if "[HEADING]" in content:
                import re
                heading_match = re.search(r'\[HEADING\](.*?)\[/HEADING\]', content)
                if heading_match:
                    heading = heading_match.group(1).strip()
            
            doc.metadata.update({
                "chunk_index": i,
                "total_chunks": len(split_docs),
                "source_file": file_path,
                "file_type": file_type,
                "heading": heading,
                "has_heading": bool(heading)
            })
        
        print(f"Created {len(split_docs)} chunks. Generating embeddings...", flush=True)
        
        # Use local Ollama embeddings with optimized settings
        embeddings = OllamaEmbeddings(
            base_url=OLLAMA_BASE_URL,
            model="nomic-embed-text",
            show_progress=False  # Disable progress bar for cleaner output
        )
        
        # Larger batches for faster processing
        batch_size = 50  # Process 50 chunks at a time (increased from 20)
        
        if os.path.exists(PERSIST_DIRECTORY):
            vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
            
            # Add documents in batches with progress tracking
            for i in range(0, len(split_docs), batch_size):
                batch = split_docs[i:i + batch_size]
                vectordb.add_documents(batch)
                progress = min(i + batch_size, len(split_docs))
                percent = int((progress / len(split_docs)) * 100)
                print(f"📊 Embedding progress: {percent}% ({progress}/{len(split_docs)} chunks)", flush=True)
        else:
            # Create new database - process in batches for progress tracking
            print(f"📊 Creating new vector database...", flush=True)
            vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
            
            for i in range(0, len(split_docs), batch_size):
                batch = split_docs[i:i + batch_size]
                vectordb.add_documents(batch)
                progress = min(i + batch_size, len(split_docs))
                percent = int((progress / len(split_docs)) * 100)
                print(f"📊 Embedding progress: {percent}% ({progress}/{len(split_docs)} chunks)", flush=True)
        
        total_time = time.time() - start_time
        print(f"Document processing completed in {total_time:.2f}s")
        
        return {
            "success": True, 
            "message": f"Document processed in {total_time:.1f}s. Created {len(split_docs)} searchable chunks.", 
            "num_chunks": len(split_docs),
            "processing_time": total_time
        }
    
    except Exception as e:
        return {"success": False, "message": f"Error processing document: {str(e)}"}

def get_answer(query: str):
    embeddings = OllamaEmbeddings(
        base_url=OLLAMA_BASE_URL,
        model="nomic-embed-text"
    )
    vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    
    llm = Ollama(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL,
        temperature=0
    )
    retriever = vectordb.as_retriever()
    
    # Create a simple RAG chain using LCEL (LangChain Expression Language)
    template = """Answer the question based only on the following context:
{context}

Question: {question}
"""
    prompt = ChatPromptTemplate.from_template(template)
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
    
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    result = rag_chain.invoke(query)
    return result

def expand_query(query: str, llm) -> str:
    """Expand short queries into more detailed search queries"""
    # If query is already detailed (more than 5 words), return as is
    if len(query.split()) > 5:
        return query
    
    # Expand short queries
    expansion_prompt = f"""Expand this short query into a more detailed search query. Add relevant keywords.

Original: {query}

Expanded (one sentence):"""
    
    try:
        expanded = llm.invoke(expansion_prompt)
        # Take first sentence only
        expanded = expanded.split('.')[0].strip()
        print(f"Query expanded from '{query}' to '{expanded}'")
        return expanded
    except:
        return query

def get_answer_with_fallback(query: str, conversation_history: list = None, stream: bool = False):
    """
    Answer questions ONLY from uploaded documents with conversation context.
    Uses local Ollama LLM - no API keys needed!
    Returns a tuple: (answer, source) where source is 'documents' or 'no_documents'
    Or if stream=True, returns a generator that yields chunks
    
    Args:
        query: The user's question
        conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
        stream: If True, returns a generator for streaming responses
    """
    try:
        # Check if documents exist
        if not os.path.exists(PERSIST_DIRECTORY):
            if stream:
                yield ("❌ No documents have been uploaded yet. Please upload HR policy documents first, then I can answer questions about them.", "no_documents")
                return
            return ("❌ No documents have been uploaded yet. Please upload HR policy documents first, then I can answer questions about them.", "no_documents")
        
        # Documents exist, try to get answer from them
        embeddings = OllamaEmbeddings(
            base_url=OLLAMA_BASE_URL,
            model="nomic-embed-text"
        )
        vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
        llm = Ollama(
            base_url=OLLAMA_BASE_URL,
            model=OLLAMA_MODEL,
            temperature=0.2,
            num_predict=512,  # Reduced for faster responses
            num_ctx=2048  # Context window
        )
        
        # Fast keyword extraction - use simple rules instead of LLM
        stop_words = {'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'there', 'any', 'what', 'how', 'when', 'where', 'who', 'which'}
        important_keywords = [word.strip('?.,!').lower() for word in query.split() 
                             if len(word) > 3 and word.lower() not in stop_words][:3]
        
        print(f"🔑 Keywords: {important_keywords}")
        print(f"Original query: '{query}'")
        
        # Search with similarity scores to see what's happening
        all_docs = []
        
        # 1. Try original query with scores
        try:
            docs_with_scores = vectordb.similarity_search_with_score(query, k=10)
            all_docs.extend([doc for doc, score in docs_with_scores])
            print(f"✓ Original query found: {len(docs_with_scores)} results")
            # Show top 3 scores for debugging
            for i, (doc, score) in enumerate(docs_with_scores[:3]):
                preview = doc.page_content[:100].replace('\n', ' ')
                print(f"  [{i+1}] Score: {score:.3f} | {preview}...")
        except Exception as e:
            print(f"✗ Original query failed: {e}")
        
        # 2. Try searching just the main keyword
        if important_keywords:
            main_keyword = important_keywords[0]
            try:
                docs_kw_with_scores = vectordb.similarity_search_with_score(main_keyword, k=10)
                print(f"✓ Keyword '{main_keyword}' found: {len(docs_kw_with_scores)} results")
                # Show top 3 scores
                for i, (doc, score) in enumerate(docs_kw_with_scores[:3]):
                    preview = doc.page_content[:100].replace('\n', ' ')
                    print(f"  [{i+1}] Score: {score:.3f} | {preview}...")
                
                # Add keyword results
                all_docs.extend([doc for doc, score in docs_kw_with_scores])
            except Exception as e:
                print(f"✗ Keyword '{main_keyword}' failed: {e}")
        
        # Remove duplicates while preserving order
        seen = set()
        docs = []
        for doc in all_docs:
            doc_id = doc.page_content[:100]  # Use first 100 chars as ID
            if doc_id not in seen:
                seen.add(doc_id)
                docs.append(doc)
        
        print(f"📊 Total unique results: {len(docs)}")
        
        # If still no results, check if database has any data
        if len(docs) == 0:
            try:
                test_docs = vectordb.similarity_search("test", k=1)
                if len(test_docs) == 0:
                    print("⚠️ WARNING: Vector database appears to be empty!")
                else:
                    print(f"✓ Database has data (test query returned {len(test_docs)} results)")
            except Exception as e:
                print(f"⚠️ Database check failed: {e}")
        
        # Re-rank results: prioritize chunks with headings
        if docs and len(docs) > 0:
            # Separate docs with and without headings
            docs_with_headings = [d for d in docs if d.metadata.get('has_heading', False)]
            docs_without_headings = [d for d in docs if not d.metadata.get('has_heading', False)]
            
            # Prioritize docs with headings, then others
            docs = docs_with_headings[:3] + docs_without_headings[:2]
            
            print(f"Re-ranked: {len(docs_with_headings)} with headings, {len(docs_without_headings)} without")
            if docs_with_headings:
                print(f"Top heading: {docs_with_headings[0].metadata.get('heading', 'N/A')}")
        
        # Debug: print what was found
        print(f"Found {len(docs)} relevant documents for query: '{query}'")
        if docs:
            print(f"First result preview: {docs[0].page_content[:300]}...")
            print(f"First result metadata: {docs[0].metadata}")
        
        # Check if we found any relevant documents
        if not docs or len(docs) == 0:
            return ("❌ I couldn't find any relevant information in the uploaded documents about this topic. Please upload documents related to your question or ask about topics covered in the existing documents.", "no_documents")
        
        # We have relevant documents, format them with heading context
        context_parts = []
        for doc in docs:
            heading = doc.metadata.get('heading', '')
            content = doc.page_content
            
            # Clean up enhanced markers
            content = content.replace('[HEADING]', '').replace('[/HEADING]', '')
            content = '\n'.join([line for line in content.split('\n') if not line.startswith('Important:')])
            
            if heading:
                context_parts.append(f"Section: {heading}\n{content}")
            else:
                context_parts.append(content)
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Debug: Show context being sent
        print(f"\n📝 Context length: {len(context)} characters")
        print(f"📝 Context preview (first 500 chars):\n{context[:500]}\n")
        
        # Build conversation context
        conversation_context = ""
        if conversation_history and len(conversation_history) > 0:
            recent_history = conversation_history[-4:] if len(conversation_history) > 4 else conversation_history
            conversation_context = "\n\nRecent conversation:\n" + "\n".join([
                f"{msg['role'].capitalize()}: {msg['content'][:200]}" for msg in recent_history
            ])
        
        # Create improved prompt for better answers with conversation awareness
        prompt = f"""You are a helpful assistant. Answer using ONLY the provided documents.

CRITICAL RULES:
1. DO NOT MIX information from different documents or topics
2. If asked about "holidays" - ONLY provide holiday/vacation information, NOT course units
3. If asked about "units" in education context - ONLY provide course units/chapters, NOT holidays
4. When listing units, extract ACTUAL NAMES: "Unit I: [Topic Name]", "Unit II: [Topic Name]"
5. Stay focused on the SPECIFIC question - don't include unrelated information
6. If context has the answer, provide it clearly and accurately
7. If context doesn't have the answer, say: "I couldn't find information about this in the uploaded documents."

Context from documents (may contain multiple topics - use only what's relevant):
{context}
{conversation_context}

Question: {query}

Answer (focused ONLY on what was asked):"""
        
        # Get answer from LLM - streaming or regular
        if stream:
            # Stream response directly from LLM
            prefix_sent = False
            for chunk in llm.stream(prompt):
                if not prefix_sent:
                    yield ("📄 Based on your company documents:\n\n", "documents", False)
                    prefix_sent = True
                yield (chunk, "documents", False)
            yield ("", "documents", True)  # Signal completion
        else:
            # Regular non-streaming response
            answer = llm.invoke(prompt)
            
            # Check if the answer indicates no information found
            if any(phrase in answer.lower() for phrase in [
                "don't have information",
                "not mentioned",
                "not found",
                "no information",
                "cannot find",
                "not in the documents"
            ]):
                return (f"❌ {answer}\n\nPlease upload relevant HR policy documents or ask about topics covered in the existing documents.", "no_documents")
            
            return (f"📄 Based on your company documents:\n\n{answer}", "documents")
    
    except Exception as e:
        if stream:
            yield (f"❌ Error accessing documents: {str(e)}\n\nMake sure Ollama is running and documents are uploaded.", "error", True)
        else:
            return (f"❌ Error accessing documents: {str(e)}\n\nMake sure Ollama is running and documents are uploaded.", "error")

