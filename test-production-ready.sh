#!/bin/bash

# Production Readiness Test Script
# Tests all critical functionality before production deployment

set -e

echo "🚀 Starting Production Readiness Tests..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_backend() {
    echo -e "${YELLOW}🧪 Testing Backend...${NC}"
    
    # Start backend in background
    cd backend
    npm install > /dev/null 2>&1
    npm run test > test-results.txt 2>&1 &
    BACKEND_PID=$!
    
    wait $BACKEND_PID
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend tests passed${NC}"
    else
        echo -e "${RED}❌ Backend tests failed${NC}"
        cat test-results.txt
        return 1
    fi
    
    # Test linting
    npm run lint > lint-results.txt 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend linting passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend linting issues found${NC}"
        cat lint-results.txt
    fi
    
    cd ..
}

test_analytics() {
    echo -e "${YELLOW}🧪 Testing Analytics...${NC}"
    
    cd analytics
    pip install -r requirements-test.txt > /dev/null 2>&1
    
    # Run tests
    python -m pytest tests/ -v --cov=. > test-results.txt 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Analytics tests passed${NC}"
    else
        echo -e "${RED}❌ Analytics tests failed${NC}"
        cat test-results.txt
        return 1
    fi
    
    # Test code quality
    black --check . > lint-results.txt 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Analytics code formatting passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Analytics formatting issues found${NC}"
        cat lint-results.txt
    fi
    
    cd ..
}

test_frontend() {
    echo -e "${YELLOW}🧪 Testing Frontend...${NC}"
    
    cd frontend
    npm install > /dev/null 2>&1
    npm run test > test-results.txt 2>&1 &
    FRONTEND_PID=$!
    
    wait $FRONTEND_PID
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend tests passed${NC}"
    else
        echo -e "${RED}❌ Frontend tests failed${NC}"
        cat test-results.txt
        return 1
    fi
    
    # Test build
    npm run build > build-results.txt 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend build successful${NC}"
    else
        echo -e "${RED}❌ Frontend build failed${NC}"
        cat build-results.txt
        return 1
    fi
    
    cd ..
}

test_security() {
    echo -e "${YELLOW}🔒 Testing Security...${NC}"
    
    # Check for hardcoded secrets
    echo "Checking for hardcoded secrets..."
    if grep -r "admin123\|secret\|password123" --include="*.js" --include="*.jsx" --include="*.py" --include="*.sql" --exclude-dir=node_modules --exclude-dir=.git . > secrets-check.txt 2>&1; then
        echo -e "${RED}❌ Hardcoded secrets found!${NC}"
        cat secrets-check.txt
        return 1
    else
        echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
    fi
    
    # Check environment variables
    echo "Checking environment variables..."
    if [ -f ".env" ]; then
        if grep -q "cambia-esto-por" .env; then
            echo -e "${RED}❌ Default placeholder secrets found in .env${NC}"
            return 1
        else
            echo -e "${GREEN}✅ Environment variables configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ No .env file found${NC}"
    fi
}

test_docker() {
    echo -e "${YELLOW}🐳 Testing Docker...${NC}"
    
    # Test Docker build
    docker-compose -f docker-compose.yml build > docker-build.txt 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker build successful${NC}"
    else
        echo -e "${RED}❌ Docker build failed${NC}"
        cat docker-build.txt
        return 1
    fi
    
    # Test production build
    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml build > docker-prod-build.txt 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Production Docker build successful${NC}"
        else
            echo -e "${RED}❌ Production Docker build failed${NC}"
            cat docker-prod-build.txt
            return 1
        fi
    fi
}

test_integration() {
    echo -e "${YELLOW}🔗 Testing Integration...${NC}"
    
    # Start services
    echo "Starting services for integration tests..."
    docker-compose up -d > integration-start.txt 2>&1
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    timeout 60 bash -c 'until curl -f http://localhost:3001/api/health; do sleep 2; done'
    timeout 60 bash -c 'until curl -f http://localhost:8000/health; do sleep 2; done'
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Services started successfully${NC}"
        
        # Test API endpoints
        echo "Testing API endpoints..."
        curl -f http://localhost:3001/api/health > api-health.txt 2>&1
        curl -f http://localhost:8000/health > analytics-health.txt 2>&1
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ API health checks passed${NC}"
        else
            echo -e "${RED}❌ API health checks failed${NC}"
            cat api-health.txt
            cat analytics-health.txt
            return 1
        fi
    else
        echo -e "${RED}❌ Services failed to start${NC}"
        cat integration-start.txt
        return 1
    fi
    
    # Stop services
    docker-compose down
}

# Main test execution
main() {
    echo "Running production readiness tests..."
    echo ""
    
    # Run all tests
    test_backend || exit 1
    test_analytics || exit 1
    test_frontend || exit 1
    test_security || exit 1
    test_docker || exit 1
    test_integration || exit 1
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}🎉 ALL TESTS PASSED - READY FOR PRODUCTION!${NC}"
    echo "=========================================="
    
    # Cleanup
    rm -f */test-results.txt */lint-results.txt */build-results.txt
    rm -f */secrets-check.txt */docker-build.txt */docker-prod-build.txt
    rm -f */integration-start.txt */api-health.txt */analytics-health.txt
}

# Run main function
main
