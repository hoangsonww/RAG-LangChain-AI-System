#!/bin/bash

###############################################################################
# RAG AI System - Wiki Server Script
# 
# This script starts a local HTTP server to view the wiki page
# Usage: ./serve-wiki.sh [port]
# Default port: 8080
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default port
PORT="${1:-8080}"

# Print banner
echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║             🤖 RAG AI System - Wiki Server 🤖              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Warning: Port $PORT is already in use${NC}"
    echo -e "${CYAN}   Finding an available port...${NC}"
    
    # Find next available port
    PORT=$((PORT + 1))
    while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; do
        PORT=$((PORT + 1))
    done
    
    echo -e "${GREEN}✅ Using port: $PORT${NC}"
fi

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo -e "${RED}❌ Error: index.html not found!${NC}"
    echo -e "${YELLOW}   Please run this script from the project root directory${NC}"
    exit 1
fi

# Print server information
echo -e "${CYAN}🚀 Starting HTTP server...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   📁 Serving from:${NC} $(pwd)"
echo -e "${GREEN}   🌐 Local URL:${NC}    http://localhost:$PORT"
echo -e "${GREEN}   🌐 Network URL:${NC}  http://$(ipconfig getifaddr en0 2>/dev/null || hostname):$PORT"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📋 Quick Links:${NC}"
echo -e "   • Wiki Home:        http://localhost:$PORT"
echo -e "   • GitHub Repo:      https://github.com/hoangsonww/RAG-LangChain-AI-System"
echo -e "   • Live Demo:        https://rag-langchain-ai-system.onrender.com"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • Press Ctrl+C to stop the server"
echo -e "   • The page will auto-refresh when you make changes"
echo -e "   • Check browser console (F12) for any errors"
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Server is running! Open the URL above in your browser ✨${NC}"
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
echo ""

# Try to open browser automatically
if command -v open &> /dev/null; then
    # macOS
    echo -e "${CYAN}🌐 Opening browser...${NC}"
    sleep 2
    open "http://localhost:$PORT"
elif command -v xdg-open &> /dev/null; then
    # Linux
    echo -e "${CYAN}🌐 Opening browser...${NC}"
    sleep 2
    xdg-open "http://localhost:$PORT"
elif command -v start &> /dev/null; then
    # Windows
    echo -e "${CYAN}🌐 Opening browser...${NC}"
    sleep 2
    start "http://localhost:$PORT"
fi

# Start the server
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 Server Logs:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check which HTTP server is available and start it
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m http.server $PORT
elif command -v node &> /dev/null && command -v npx &> /dev/null; then
    npx serve -p $PORT
elif command -v php &> /dev/null; then
    php -S localhost:$PORT
else
    echo -e "${RED}❌ Error: No HTTP server found!${NC}"
    echo -e "${YELLOW}   Please install one of the following:${NC}"
    echo -e "   • Python 3: https://www.python.org/"
    echo -e "   • Node.js: https://nodejs.org/"
    echo -e "   • PHP: https://www.php.net/"
    exit 1
fi
