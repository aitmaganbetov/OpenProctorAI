#!/bin/bash
# Install System Dependencies for University Proctoring AI

echo "Installing system dependencies for University Proctoring AI..."
echo ""

# Update package list
echo "Updating package list..."
sudo apt-get update -y

# Install Python development tools
echo "Installing Python development tools..."
sudo apt-get install -y python3-pip python3-venv python3-dev

# Install Node.js (if not already installed)
if ! command -v npm &> /dev/null; then
    echo "Installing Node.js..."
    sudo apt-get install -y nodejs npm
fi

echo ""
echo "✅ System dependencies installed!"
echo ""
echo "Now run: cd /home/admproctor/university-proctoring && ./setup.sh"
