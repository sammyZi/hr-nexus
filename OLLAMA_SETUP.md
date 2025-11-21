# Ollama Setup Guide - Local Open Source LLM

This project now uses **Ollama** - a local, open-source LLM that runs on your machine. No API keys needed!

## Installation Steps

### 1. Install Ollama

**Windows:**
- Download from: https://ollama.com/download/windows
- Run the installer
- Ollama will start automatically

**Mac/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull the Required Models

Open a terminal and run:

```bash
# Pull the main LLM model (choose one):
ollama pull llama3.2          # Recommended - Fast and efficient (2GB)
# OR
ollama pull mistral           # Alternative - Good performance (4GB)
# OR
ollama pull phi3              # Lightweight option (2GB)

# Pull the embedding model (required for document search):
ollama pull nomic-embed-text  # Fast embeddings (274MB)
```

### 3. Verify Ollama is Running

```bash
ollama list
```

You should see the models you pulled.

### 4. Start the Backend

The backend will automatically connect to Ollama at `http://localhost:11434`

```bash
cd backend
uvicorn main:app --reload
```

## Features Now Available

✅ **Full RAG (Retrieval Augmented Generation)**
- Upload documents (PDF, DOCX, TXT)
- Documents are embedded and stored locally
- AI searches your documents first before answering

✅ **No API Keys Required**
- Everything runs locally on your machine
- No quota limits
- Complete privacy - your data never leaves your computer

✅ **Fast & Efficient**
- Llama 3.2 is optimized for speed
- Nomic embeddings are lightweight
- Runs well on most modern computers

## Changing Models

Edit `backend/.env`:
```
OLLAMA_MODEL=llama3.2  # Change to mistral, phi3, etc.
```

## Troubleshooting

**"Connection refused" error:**
- Make sure Ollama is running: `ollama serve`
- Check if models are pulled: `ollama list`

**Slow responses:**
- Try a smaller model like `phi3`
- Ensure you have enough RAM (8GB+ recommended)

**Document upload fails:**
- Make sure `nomic-embed-text` model is pulled
- Check backend logs for specific errors

## Model Recommendations

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| llama3.2 | 2GB | Fast | Good | General use (Recommended) |
| mistral | 4GB | Medium | Excellent | Complex questions |
| phi3 | 2GB | Very Fast | Good | Quick responses |
| llama3.1 | 4.7GB | Slow | Excellent | Best quality |

## Resources

- Ollama Website: https://ollama.com
- Model Library: https://ollama.com/library
- Documentation: https://github.com/ollama/ollama
