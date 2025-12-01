@echo off
echo Installing dependencies step by step...
echo.

echo [1/5] Installing core packages...
pip install python-dotenv pydantic>=2.7.4 email-validator bcrypt python-jose[cryptography]

echo [2/5] Installing FastAPI and Uvicorn...
pip install fastapi uvicorn python-multipart

echo [3/5] Installing MongoDB drivers...
pip install pymongo motor

echo [4/5] Installing document processing...
pip install PyPDF2 python-docx

echo [5/5] Installing LangChain and RAG components...
pip install langchain langchain-community langchain-text-splitters ollama chromadb
pip install langchain-chroma --upgrade

echo.
echo ========================================
echo Installation complete!
echo ========================================
pause
