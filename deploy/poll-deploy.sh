#!/bin/bash

# Polling-based deployment script for Synology NAS
# Run this as a cron job every 5-10 minutes to check for updates

set -e

# Configuration
DEPLOY_DIR="/volume1/docker/shopping-list"
REPO_URL_BACKEND="https://github.com/your-username/shopping-list-backend.git"
REPO_URL_FRONTEND="https://github.com/your-username/shopping-list-frontend.git"
BRANCH="main"
LOG_FILE="$DEPLOY_DIR/poll-deploy.log"
LAST_DEPLOY_FILE="$DEPLOY_DIR/.last-deploy-hashes"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to get remote commit hash
get_remote_hash() {
    local repo_url=$1
    git ls-remote "$repo_url" "$BRANCH" | cut -f1
}

# Function to read stored hashes
read_stored_hashes() {
    if [ -f "$LAST_DEPLOY_FILE" ]; then
        cat "$LAST_DEPLOY_FILE"
    else
        echo "no-hash no-hash"
    fi
}

# Function to store current hashes
store_hashes() {
    local backend_hash=$1
    local frontend_hash=$2
    echo "$backend_hash $frontend_hash" > "$LAST_DEPLOY_FILE"
}

# Function to deploy (same as webhook version but called selectively)
deploy_if_needed() {
    local component=$1  # "backend" or "frontend"
    local current_hash=$2
    
    log "🚀 Deploying $component (hash: ${current_hash:0:7})..."
    
    if [ "$component" = "backend" ]; then
        # Backend deployment logic
        cd "$DEPLOY_DIR"
        
        if [ -d "backend-src" ]; then
            cd backend-src
            git fetch origin
            git reset --hard origin/$BRANCH
            cd ..
        else
            git clone "$REPO_URL_BACKEND" backend-src
            cd backend-src
            git checkout "$BRANCH"
            cd ..
        fi
        
        # Build and deploy
        cd backend-src
        docker build -t shopping-list-backend:latest -f Dockerfile .
        cd ..
        
        docker-compose stop app || true
        docker-compose up -d app
        
        # Health check
        for i in {1..30}; do
            if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                log "✅ Backend deployment successful!"
                return 0
            fi
            sleep 10
        done
        
        log "❌ Backend health check failed!"
        return 1
        
    elif [ "$component" = "frontend" ]; then
        # Frontend deployment logic
        cd "$DEPLOY_DIR"
        
        if [ -d "frontend-src" ]; then
            cd frontend-src
            git fetch origin
            git reset --hard origin/$BRANCH
            cd ..
        else
            git clone "$REPO_URL_FRONTEND" frontend-src
            cd frontend-src
            git checkout "$BRANCH"
            cd ..
        fi
        
        # Build and deploy
        cd frontend-src
        docker build -t shopping-list-frontend:latest .
        cd ..
        
        docker-compose -f docker-compose.synology.yml stop shopping-list-frontend || true
        docker-compose -f docker-compose.synology.yml up -d shopping-list-frontend
        
        # Health check
        for i in {1..20}; do
            if curl -f http://localhost:8080 > /dev/null 2>&1; then
                log "✅ Frontend deployment successful!"
                return 0
            fi
            sleep 5
        done
        
        log "❌ Frontend health check failed!"
        return 1
    fi
}

# Main execution
main() {
    log "🔍 Checking for updates..."
    
    # Get current remote hashes
    backend_hash=$(get_remote_hash "$REPO_URL_BACKEND")
    frontend_hash=$(get_remote_hash "$REPO_URL_FRONTEND")
    
    # Read stored hashes
    read stored_backend_hash stored_frontend_hash < <(read_stored_hashes)
    
    log "Backend: stored=${stored_backend_hash:0:7}, remote=${backend_hash:0:7}"
    log "Frontend: stored=${stored_frontend_hash:0:7}, remote=${frontend_hash:0:7}"
    
    # Check if backend needs update
    backend_needs_update=false
    if [ "$backend_hash" != "$stored_backend_hash" ]; then
        backend_needs_update=true
        log "📦 Backend update detected!"
    fi
    
    # Check if frontend needs update
    frontend_needs_update=false
    if [ "$frontend_hash" != "$stored_frontend_hash" ]; then
        frontend_needs_update=true
        log "🎨 Frontend update detected!"
    fi
    
    # Deploy if needed
    if [ "$backend_needs_update" = true ] || [ "$frontend_needs_update" = true ]; then
        # Create backup
        cd "$DEPLOY_DIR"
        docker-compose ps > "backup-$(date +%Y%m%d-%H%M%S).txt"
        
        # Deploy backend first (if needed)
        if [ "$backend_needs_update" = true ]; then
            if deploy_if_needed "backend" "$backend_hash"; then
                log "✅ Backend updated successfully"
            else
                log "❌ Backend update failed"
                return 1
            fi
        fi
        
        # Deploy frontend (if needed)
        if [ "$frontend_needs_update" = true ]; then
            if deploy_if_needed "frontend" "$frontend_hash"; then
                log "✅ Frontend updated successfully"
            else
                log "❌ Frontend update failed"
                return 1
            fi
        fi
        
        # Store new hashes on success
        store_hashes "$backend_hash" "$frontend_hash"
        
        # Cleanup
        docker image prune -f
        docker container prune -f
        
        log "🎉 Update completed successfully!"
        
        # Optional: Send notification
        # curl -X POST -H 'Content-type: application/json' \
        #   --data '{"text":"🔄 Shopping List updated on Synology NAS!"}' \
        #   YOUR_SLACK_WEBHOOK_URL
        
    else
        log "📝 No updates needed - everything is up to date"
    fi
}

# Ensure deploy directory exists
mkdir -p "$DEPLOY_DIR"

# Run main function with error handling
if main; then
    log "✅ Poll completed successfully"
else
    log "❌ Poll failed"
    exit 1
fi
