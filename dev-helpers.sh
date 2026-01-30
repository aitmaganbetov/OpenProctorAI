#!/bin/bash
# University Proctoring AI - Helper Functions
# Source this file to get quick commands:
#   source dev-helpers.sh

PROJECT_DIR="/home/admproctor/university-proctoring"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  University Proctoring AI - Helper Commands       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Available commands:"
echo ""

# Install system dependencies
install-deps() {
    echo -e "${YELLOW}Installing system dependencies...${NC}"
    bash "$PROJECT_DIR/install-dependencies.sh"
}
echo -e "${GREEN}install-deps${NC} - Install python3-pip, python3-venv, nodejs"

# Run setup
setup() {
    echo -e "${YELLOW}Running project setup...${NC}"
    cd "$PROJECT_DIR" && bash setup.sh
}
echo -e "${GREEN}setup${NC} - Run automated project setup"

# Start backend
backend() {
    echo -e "${YELLOW}Starting backend server...${NC}"
    cd "$PROJECT_DIR/backend"
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    echo -e "${GREEN}Backend running on http://localhost:8000${NC}"
    echo -e "${GREEN}API docs: http://localhost:8000/docs${NC}"
    python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}
echo -e "${GREEN}backend${NC} - Start backend development server"

# Start frontend
frontend() {
    echo -e "${YELLOW}Starting frontend server...${NC}"
    cd "$PROJECT_DIR/frontend"
    npm run dev
    echo -e "${GREEN}Frontend running on http://localhost:3000${NC}"
}
echo -e "${GREEN}frontend${NC} - Start frontend development server"

# Show project status
status() {
    echo ""
    echo -e "${BLUE}Project Status:${NC}"
    echo -e "  Location: ${YELLOW}$PROJECT_DIR${NC}"
    echo -e "  Python: ${GREEN}$(python3 --version 2>/dev/null || echo 'NOT FOUND')${NC}"
    echo -e "  Node.js: ${GREEN}$(node --version 2>/dev/null || echo 'NOT FOUND')${NC}"
    echo -e "  npm: ${GREEN}$(npm --version 2>/dev/null || echo 'NOT FOUND')${NC}"
    
    if [ -f "$PROJECT_DIR/backend/venv/bin/activate" ]; then
        echo -e "  Venv: ${GREEN}✓ Available${NC}"
    else
        echo -e "  Venv: ${RED}✗ Not created${NC}"
    fi
    
    if [ -d "$PROJECT_DIR/frontend/node_modules" ]; then
        echo -e "  npm packages: ${GREEN}✓ Installed${NC}"
    else
        echo -e "  npm packages: ${RED}✗ Not installed${NC}"
    fi
    echo ""
}
echo -e "${GREEN}status${NC} - Show project environment status"

# Open in editor
code() {
    echo -e "${YELLOW}Opening project in VS Code...${NC}"
    cd "$PROJECT_DIR" && code .
}
echo -e "${GREEN}code${NC} - Open project in VS Code"

# Show documentation
docs() {
    echo ""
    echo "Available documentation:"
    echo "  README.md - Full project documentation"
    echo "  QUICKSTART.md - Setup and usage guide"
    echo "  FIXES_SUMMARY.md - Summary of fixes applied"
    echo "  SETUP_STATUS.txt - Current setup status"
    echo ""
    echo "View with: cat $PROJECT_DIR/QUICKSTART.md"
    echo ""
}
echo -e "${GREEN}docs${NC} - Show available documentation"

# Quick help
help() {
    echo ""
    echo -e "${BLUE}Quick help for common tasks:${NC}"
    echo ""
    echo "First time setup:"
    echo "  1. ${GREEN}install-deps${NC} - Install system packages"
    echo "  2. ${GREEN}setup${NC} - Run automated setup"
    echo ""
    echo "Daily development:"
    echo "  ${GREEN}backend${NC} - Start backend (one terminal)"
    echo "  ${GREEN}frontend${NC} - Start frontend (another terminal)"
    echo ""
    echo "Other commands:"
    echo "  ${GREEN}status${NC} - Check environment"
    echo "  ${GREEN}code${NC} - Open in VS Code"
    echo "  ${GREEN}docs${NC} - Show documentation"
    echo ""
}
echo -e "${GREEN}help${NC} - Show this help message"

echo ""
echo -e "${YELLOW}Run 'help' for quick start instructions${NC}"
echo ""
