#!/bin/bash
# ============================================
# Marqa Souq - Production Deployment Script
# Medusa v2 Professional Deployment
# ============================================

set -e

# Configuration
PROJECT_ROOT="/var/www/marqa-souq"
BACKEND_DIR="$PROJECT_ROOT/backend/my-medusa-store"
FRONTEND_DIR="$PROJECT_ROOT/frontend/markasouq-web"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_ROOT/logs/deploy-$TIMESTAMP.log"
GIT_BRANCH="${GIT_BRANCH:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Header
print_header() {
    echo ""
    echo "============================================"
    echo "  Marqa Souq Production Deployment"
    echo "  Timestamp: $TIMESTAMP"
    echo "  Branch: $GIT_BRANCH"
    echo "============================================"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js 20+ required. Current: $(node -v)"
        exit 1
    fi
    log_success "Node.js version: $(node -v)"
    
    # Check Yarn
    if ! command -v yarn &> /dev/null; then
        log_error "Yarn is not installed"
        exit 1
    fi
    log_success "Yarn version: $(yarn -v)"
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed"
        exit 1
    fi
    log_success "PM2 available"
    
    # Check disk space (require at least 2GB)
    AVAILABLE_SPACE=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then
        log_warning "Low disk space: $((AVAILABLE_SPACE / 1024)) MB available"
    fi
}

# Deploy Backend
deploy_backend() {
    log "=========================================="
    log "📦 Deploying Medusa Backend..."
    log "=========================================="
    
    cd "$BACKEND_DIR"
    
    # Step 1: Backup current build
    if [ -d ".medusa" ]; then
        log "Backing up current build to .medusa.backup.$TIMESTAMP"
        cp -r .medusa ".medusa.backup.$TIMESTAMP"
    fi
    
    # Step 2: Pull latest code
    log "Pulling latest code from $GIT_BRANCH..."
    git fetch origin
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
    
    # Step 3: Install dependencies
    log "Installing dependencies..."
    yarn install
    
    # Step 4: Clean previous build
    log "Cleaning previous build..."
    rm -rf .medusa
    
    # Step 5: Build Medusa (includes Admin UI)
    log "Building Medusa (API + Admin Dashboard)..."
    log "This may take 2-5 minutes..."
    NODE_OPTIONS="--max-old-space-size=4096" yarn build
    
    # Step 6: Verify admin build
    if [ ! -f ".medusa/client/index.html" ]; then
        log_error "Admin build failed! index.html not found in .medusa/client/"
        log "Checking for build errors..."
        
        # Attempt recovery
        if [ -d ".medusa.backup.$TIMESTAMP" ]; then
            log_warning "Restoring from backup..."
            rm -rf .medusa
            mv ".medusa.backup.$TIMESTAMP" .medusa
        fi
        
        exit 1
    fi
    log_success "Admin build verified: .medusa/client/index.html exists"
    
    # Step 7: Verify server build
    if [ ! -f ".medusa/server/package.json" ]; then
        log_error "Server build failed! package.json not found in .medusa/server/"
        exit 1
    fi
    log_success "Server build verified"
    
    # Step 8: Copy environment file
    log "Copying environment configuration..."
    if [ -f ".env" ]; then
        cp .env .medusa/server/.env
        log_success "Environment file copied to .medusa/server/"
    else
        log_error ".env file not found! Create it before deploying."
        exit 1
    fi
    
    # Step 9: Install production dependencies
    log "Installing production dependencies in .medusa/server/..."
    cd .medusa/server
    yarn install --production
    cd "$BACKEND_DIR"
    
    # Step 10: Run database migrations
    log "Running database migrations..."
    npx medusa db:migrate || log_warning "Migration command completed (check for errors above)"
    
    # Step 11: Restart PM2 process
    log "Restarting Medusa backend via PM2..."
    pm2 restart medusa-backend 2>/dev/null || pm2 start "$PROJECT_ROOT/ecosystem.config.js" --only medusa-backend
    
    # Step 12: Wait and verify
    log "Waiting for backend to start..."
    sleep 10
    
    # Health check
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health 2>/dev/null || echo "000")
    if [ "$HEALTH_CHECK" = "200" ]; then
        log_success "Backend health check passed!"
    else
        log_warning "Health check returned: $HEALTH_CHECK (may still be starting)"
    fi
    
    # Step 13: Cleanup old backups (keep last 3)
    log "Cleaning up old backups..."
    cd "$BACKEND_DIR"
    ls -dt .medusa.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
    
    log_success "Backend deployment completed!"
}

# Deploy Frontend
deploy_frontend() {
    log "=========================================="
    log "🎨 Deploying Next.js Frontend..."
    log "=========================================="
    
    cd "$FRONTEND_DIR"
    
    # Step 1: Pull latest code
    log "Pulling latest code from $GIT_BRANCH..."
    git fetch origin
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
    
    # Step 2: Install dependencies
    log "Installing dependencies..."
    yarn install
    
    # Step 3: Build Next.js
    log "Building Next.js application..."
    yarn build
    
    # Step 4: Verify build
    if [ ! -d ".next" ]; then
        log_error "Next.js build failed! .next directory not found."
        exit 1
    fi
    log_success "Next.js build verified"
    
    # Step 5: Restart PM2 process
    log "Restarting Next.js frontend via PM2..."
    pm2 restart nextjs-storefront 2>/dev/null || pm2 start "$PROJECT_ROOT/ecosystem.config.js" --only nextjs-storefront
    
    # Step 6: Wait and verify
    log "Waiting for frontend to start..."
    sleep 5
    
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    if [ "$HEALTH_CHECK" = "200" ]; then
        log_success "Frontend health check passed!"
    else
        log_warning "Health check returned: $HEALTH_CHECK (may still be starting)"
    fi
    
    log_success "Frontend deployment completed!"
}

# Rollback function
rollback_backend() {
    log "=========================================="
    log "⏮️  Rolling back Backend..."
    log "=========================================="
    
    cd "$BACKEND_DIR"
    
    # Find latest backup
    LATEST_BACKUP=$(ls -dt .medusa.backup.* 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found to rollback to!"
        exit 1
    fi
    
    log "Restoring from: $LATEST_BACKUP"
    rm -rf .medusa
    mv "$LATEST_BACKUP" .medusa
    
    pm2 restart medusa-backend
    
    log_success "Rollback completed!"
}

# Status check
check_status() {
    echo ""
    echo "============================================"
    echo "  Current Deployment Status"
    echo "============================================"
    echo ""
    
    # PM2 Status
    pm2 list
    
    echo ""
    echo "Backend Health:"
    curl -s http://localhost:9000/health | head -c 200 || echo "Unable to reach backend"
    
    echo ""
    echo ""
    echo "Frontend Health:"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000 || echo "Unable to reach frontend"
    
    echo ""
    echo "Admin Panel:"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:9000/app/ || echo "Unable to reach admin"
}

# Main execution
main() {
    mkdir -p "$PROJECT_ROOT/logs"
    
    print_header
    check_prerequisites
    
    case "${1:-help}" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            deploy_frontend
            ;;
        rollback)
            rollback_backend
            ;;
        status)
            check_status
            ;;
        help|*)
            echo "Usage: $0 {backend|frontend|all|rollback|status}"
            echo ""
            echo "Commands:"
            echo "  backend   - Deploy only the Medusa backend (API + Admin)"
            echo "  frontend  - Deploy only the Next.js storefront"
            echo "  all       - Deploy both backend and frontend"
            echo "  rollback  - Rollback backend to previous build"
            echo "  status    - Check current deployment status"
            echo ""
            echo "Environment Variables:"
            echo "  GIT_BRANCH=develop ./deploy.sh backend  # Deploy from specific branch"
            exit 0
            ;;
    esac
    
    echo ""
    echo "============================================"
    echo "  Deployment Summary"
    echo "============================================"
    pm2 list
    echo ""
    log_success "Deployment script completed! Log: $LOG_FILE"
}

main "$@"
