# Quick Start Guide

## ⚠️ System Requirements

Your system is missing some required tools. You need to install:

1. **python3-pip** - Python package manager
2. **python3-venv** - Python virtual environment tool

## Installation Steps

### Step 1: Install System Dependencies

Run this command (you may be prompted for your password):

```bash
cd /home/admproctor/university-proctoring
bash install-dependencies.sh
```

Or manually:

```bash
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv python3-dev nodejs npm
```

Verify installation:
```bash
python3 --version      # Should show Python 3.x
pip3 --version         # Should show pip version
npm --version          # Should show npm version
```

### Step 2: Run Setup Script

Once dependencies are installed:

```bash
cd /home/admproctor/university-proctoring
bash setup.sh
```

This will automatically:
- Create Python virtual environment
- Install Python dependencies
- Install npm packages

### Step 3: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python3 -m uvicorn app.main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.0.x  ready in xxx ms
Local: http://localhost:3000
```

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Manual Setup (if automated fails)

### Backend Manual Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment (Linux/Mac)
source venv/bin/activate
# or (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Manual Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Docker Setup (Alternative)

If you have Docker and Docker Compose installed:

```bash
cd /home/admproctor/university-proctoring
docker-compose up --build
```

This starts:
- MySQL database (port 3306)
- FastAPI backend (port 8000)
- React frontend (port 3000)

## Troubleshooting

### Error: "No module named 'venv'"
Install python3-venv:
```bash
sudo apt-get install python3-venv
```

### Error: "pip: command not found"
Install python3-pip:
```bash
sudo apt-get install python3-pip
```

### Error: "npm: command not found"
Install Node.js:
```bash
sudo apt-get install nodejs npm
```

Or from: https://nodejs.org

### Error: "Cannot find module 'react'"
Make sure you're in the frontend directory and npm installed:
```bash
cd frontend
npm install
npm run dev
```

### Error: "Connection refused" when accessing API
Make sure backend is running on port 8000:
```bash
cd backend
source venv/bin/activate
python3 -m uvicorn app.main:app --reload
```

### Error: "Port already in use"
Change the port:
```bash
# Backend on different port
uvicorn app.main:app --reload --port 8001

# Frontend - edit vite.config.ts and change port in server config
```

## API Endpoints

Once running, test the API:

```bash
# Health check
curl http://localhost:8000/health

# API documentation (interactive)
# Open: http://localhost:8000/docs
```

## Project Structure

```
/home/admproctor/university-proctoring/
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   ├── requirements.txt  # Python dependencies
│   └── venv/            # Virtual environment (created by setup)
├── frontend/             # React + TypeScript frontend
│   ├── src/             # Source code
│   ├── package.json     # npm dependencies
│   └── node_modules/    # Dependencies (created by npm install)
├── docker-compose.yml    # Docker configuration
├── setup.sh             # Automated setup script
├── README.md            # Full documentation
└── QUICKSTART.md        # This file
```

## Environment Variables (Optional)

Create a `.env` file in the project root if you need to customize:

```env
# Database
MYSQL_USER=proctor_user
MYSQL_PASSWORD=proctor_password
MYSQL_SERVER=localhost
MYSQL_DATABASE=proctoring_db

# Security
SECRET_KEY=your_secret_key_here

# API
API_HOST=0.0.0.0
API_PORT=8000
```

## Next Steps After Setup

1. Explore the API: http://localhost:8000/docs
2. Check the frontend: http://localhost:3000
3. Read [README.md](README.md) for architecture details
4. Start developing!

## Support

For issues:
1. Check the Troubleshooting section above
2. Verify all dependencies are installed
3. Check both terminals for error messages
4. Review the full [README.md](README.md)

