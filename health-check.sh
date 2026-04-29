#!/bin/bash

# ANSI Color Codes for readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🩺 Starting Wipsom Pre-Push Health Check...${NC}\n"

# 1. Check for accidental .env commits
if git diff --cached --name-only | grep -q ".env"; then
    echo -e "${RED}❌ ERROR: You are about to commit a .env file!${NC}"
    echo "Run 'git reset HEAD <file>' to unstage it."
    exit 1
fi
echo -e "${GREEN}✅ No .env files staged.${NC}"

# 2. Check Backend (Server) Health
echo -e "\n${YELLOW}➡️ Checking Server Health...${NC}"
cd backend || { echo -e "${RED}❌ Backend directory not found!${NC}"; exit 1; }

# ... (keep the find command the same) ...
cd ..

# 3. Check Frontend Health
echo -e "\n${YELLOW}➡️ Checking Frontend Health...${NC}"
cd frontend || { echo -e "${RED}❌ Frontend directory not found!${NC}"; exit 1; }
cd ..

# 3. Check Frontend (Client) Health
echo -e "\n${YELLOW}➡️ Checking Frontend Health...${NC}"
cd frontend || { echo -e "${RED}❌ Frontend directory not found!${NC}"; exit 1; }

# Attempt a production build to catch missing modules (like Vite errors)
echo "Running Vite build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend build successful.${NC}"
else
    echo -e "${RED}❌ Frontend build failed! Run 'npm run build' manually in the frontend folder to see the error.${NC}"
    exit 1
fi
cd ..

# 4. Final Verdict
echo -e "\n${GREEN}🚀 All health checks passed! Your code is safe to commit and push.${NC}"
exit 0