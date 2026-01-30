#!/bin/bash
# Setup script for University Proctoring AI System

set -e

echo "🚀 Setting up University Proctoring AI System..."

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

echo "✅ Backend setup complete!"

# Frontend setup
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend

# Install Node dependencies
if [ -f "package.json" ]; then
    echo "Installing npm dependencies..."
    npm install --quiet
    echo "✅ Frontend setup complete!"
else
    echo "⚠️ package.json not found"
fi

cd ..

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
