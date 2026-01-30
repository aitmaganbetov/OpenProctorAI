#!/bin/bash
# Setup script for University Proctoring AI System - with proper error handling

set +e  # Don't exit on error, handle gracefully

echo "🚀 Setting up University Proctoring AI System..."
echo ""

# Check Python
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed"
    echo "Install with: apt install python3"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo "✅ Found $PYTHON_VERSION"

# Check if pip is available
echo ""
echo "Checking pip installation..."
if ! python3 -m pip --version &> /dev/null; then
    echo "❌ pip is not installed"
    echo ""
    echo "Install with: sudo apt install python3-pip"
    echo "Or: sudo apt install python3.12-pip"
    exit 1
fi
echo "✅ pip is available"

# Check if venv is available
echo ""
echo "Checking Python venv module..."
if ! python3 -m venv --help &> /dev/null; then
    echo "⚠️  venv module not found"
    echo "Install with: sudo apt install python3-venv"
    echo "Or: sudo apt install python3.12-venv"
    echo ""
    echo "For now, continuing without venv..."
fi

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend || exit 1

# Try to create venv, but continue if it fails
if python3 -m venv venv &> /dev/null; then
    echo "Creating Python virtual environment..."
    source venv/bin/activate 2>/dev/null
    USE_VENV=true
else
    echo "⚠️ Could not create venv - will install packages globally for user"
    USE_VENV=false
fi

# Install Python dependencies
echo "Installing Python dependencies..."
if [ "$USE_VENV" = true ]; then
    python3 -m pip install -q -r requirements.txt 2>/dev/null
else
    python3 -m pip install --user -q -r requirements.txt 2>/dev/null
fi

if [ $? -eq 0 ]; then
    echo "✅ Backend setup complete!"
else
    echo "❌ Failed to install Python dependencies"
    echo "Try manually: python3 -m pip install --user -r requirements.txt"
fi

# Frontend setup
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend || exit 1

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Install from: https://nodejs.org or apt install nodejs"
    exit 1
fi

# Install Node dependencies
if [ -f "package.json" ]; then
    echo "Installing npm dependencies..."
    npm install --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Frontend setup complete!"
    else
        echo "❌ npm install failed"
        exit 1
    fi
else
    echo "❌ package.json not found"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "To start the development servers:"
echo "═══════════════════════════════════════════════════════════"
echo ""
if [ "$USE_VENV" = true ]; then
    echo "Terminal 1 - Backend:"
    echo "  cd backend && source venv/bin/activate"
    echo "  python3 -m uvicorn app.main:app --reload"
else
    echo "Terminal 1 - Backend:"
    echo "  cd backend"
    echo "  python3 -m uvicorn app.main:app --reload"
fi
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "API Docs: http://localhost:8000/docs"
echo "═══════════════════════════════════════════════════════════"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development servers:"
echo ""
echo "Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "Frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker Compose:"
echo "docker-compose up --build"
