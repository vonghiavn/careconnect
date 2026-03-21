#!/bin/bash

# Quick Start Script for CareConnect
# This script automates the initial setup

set -e

echo "🚀 CareConnect Quick Start"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check dependencies
echo "📋 Checking dependencies..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed (needed for PostgreSQL)"
fi

if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies check passed${NC}"
echo ""

# Step 1: Create .env file
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env file - Please update with your API keys${NC}"
else
    echo "✅ .env file already exists"
fi
echo ""

# Step 2: Install requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt -q
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Start database
echo "🐘 Starting PostgreSQL and Redis..."
docker-compose up -d
echo -e "${GREEN}✅ Database services started${NC}"
echo ""

# Step 4: Initialize database with seed data
echo "🌱 Initializing database..."
cd backend
python scripts/seed.py
cd ..
echo -e "${GREEN}✅ Database initialized${NC}"
echo ""

# Summary
echo "🎉 Setup complete!"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Update .env file with your API keys (ANTHROPIC_API_KEY, STRIPE keys, etc.)"
echo ""
echo "2. Start the backend server in one terminal:"
echo "   cd backend && python run.py"
echo ""
echo "3. Start the frontend server in another terminal:"
echo "   cd frontend/public && python -m http.server 8000"
echo ""
echo "4. Open http://localhost:8000 in your browser"
echo ""
echo -e "${GREEN}Demo credentials:${NC}"
echo "  Elderly:   elderly@example.com / password123"
echo "  Volunteer: volunteer@example.com / password123"
echo "  Family:    family@example.com / password123"
echo ""
