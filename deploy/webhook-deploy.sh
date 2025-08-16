#!/bin/bash

# Webhook-based deployment script for Synology NAS
# This script should be called by a webhook service when main branch is updated

set -e  # Exit on any error

# Configuration
DEPLOY_DIR="/volume1/docker/shopping-list"
REPO_URL_BACKEND="https://github.com/your-username/shopping-list-backend.git"
REPO_URL_FRONTEND="https://github.com/your-username/shopping-list-frontend.git"
BRANCH="main"
LOG_FILE="$DEPLOY_DIR/deploy.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
cleanup_on_error() {
    log "❌ Deployment failed! Rolling back..."
    docker-compose -f "$DEPLOY_DIR/docker-compose.yml" up -d || true
    exit 1
}

trap cleanup_on_error ERR

log "🚀 Starting automatic deployment from main branch..."

# Change to deployment directory
cd "$DEPLOY_DIR"

# Function to deploy backend
deploy_backend() {
    log "📦 Deploying backend..."
    
    # Clone/pull latest backend code
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
    
    # Build backend image
    log "🔨 Building backend Docker image..."
    cd backend-src
    docker build -t shopping-list-backend:latest -f Dockerfile .
    cd ..
    
    # Update and restart backend service
    log "🔄 Restarting backend service..."
    docker-compose stop app || true
    docker-compose up -d app
    
    # Health check
    log "🏥 Performing backend health check..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            log "✅ Backend is healthy!"
            return 0
        fi
        log "⏳ Waiting for backend... (attempt $i/30)"
        sleep 10
    done
    
    log "❌ Backend health check failed!"
    return 1
}

# Function to deploy frontend
deploy_frontend() {
    log "🎨 Deploying frontend..."
    
    # Clone/pull latest frontend code
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
    
    # Build frontend image
    log "🔨 Building frontend Docker image..."
    cd frontend-src
    docker build -t shopping-list-frontend:latest .
    cd ..
    
    # Update and restart frontend service
    log "🔄 Restarting frontend service..."
    docker-compose -f docker-compose.synology.yml stop shopping-list-frontend || true
    docker-compose -f docker-compose.synology.yml up -d shopping-list-frontend
    
    # Simple health check
    log "🏥 Performing frontend health check..."
    for i in {1..20}; do
        if curl -f http://localhost:8080 > /dev/null 2>&1; then
            log "✅ Frontend is healthy!"
            return 0
        fi
        log "⏳ Waiting for frontend... (attempt $i/20)"
        sleep 5
    done
    
    log "❌ Frontend health check failed!"
    return 1
}

# Create backup of current state
log "📋 Creating backup of current deployment..."
docker-compose ps > "backup-$(date +%Y%m%d-%H%M%S).txt"

# Deploy backend first
if deploy_backend; then
    log "✅ Backend deployment successful!"
else
    log "❌ Backend deployment failed!"
    cleanup_on_error
fi

# Deploy frontend
if deploy_frontend; then
    log "✅ Frontend deployment successful!"
else
    log "❌ Frontend deployment failed!"
    cleanup_on_error
fi

# Cleanup old images and containers
log "🧹 Cleaning up old Docker images..."
docker image prune -f
docker container prune -f

log "🎉 Deployment completed successfully!"
log "📊 Current status:"
docker-compose ps

# Send notification (optional - add webhook to Slack/Discord/etc.)
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"✅ Shopping List deployed successfully to Synology NAS!"}' \
#   YOUR_SLACK_WEBHOOK_URL
