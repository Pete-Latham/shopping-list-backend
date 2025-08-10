#!/bin/bash

# Shopping List Database Backup Script
# This script creates compressed PostgreSQL backups with automatic rotation
# Designed to work with Docker containers in Synology Container Manager

set -euo pipefail

# Configuration
CONTAINER_NAME="shopping-list-db"
DB_NAME="shopping_list"
DB_USER="postgres"
BACKUP_DIR="/volume1/docker/shopping-list-backups"  # Adjust path for your Synology
RETENTION_DAYS=30
MAX_BACKUPS=50

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="shopping_list_backup_${TIMESTAMP}.sql"
COMPRESSED_FILENAME="${BACKUP_FILENAME}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Check if running on Synology (optional)
check_synology() {
    if [[ -f /etc/synoinfo.conf ]]; then
        log "Running on Synology NAS"
        return 0
    else
        warning "Not running on Synology - backup path may need adjustment"
        return 1
    fi
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        
        # Set appropriate permissions for Synology
        chmod 755 "$BACKUP_DIR"
    fi
}

# Check if container is running
check_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        error "Container '${CONTAINER_NAME}' is not running!"
        exit 1
    fi
    log "Container '${CONTAINER_NAME}' is running"
}

# Perform database backup
perform_backup() {
    log "Starting backup of database '${DB_NAME}'"
    
    local temp_backup_file="${BACKUP_DIR}/${BACKUP_FILENAME}"
    local compressed_backup_file="${BACKUP_DIR}/${COMPRESSED_FILENAME}"
    
    # Create the backup
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$temp_backup_file"; then
        log "Database dump completed successfully"
        
        # Compress the backup
        if gzip "$temp_backup_file"; then
            log "Backup compressed: $compressed_backup_file"
            
            # Get backup size
            local backup_size=$(du -h "$compressed_backup_file" | cut -f1)
            log "Backup size: $backup_size"
            
            return 0
        else
            error "Failed to compress backup file"
            rm -f "$temp_backup_file"
            return 1
        fi
    else
        error "Database backup failed!"
        rm -f "$temp_backup_file"
        return 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="${BACKUP_DIR}/${COMPRESSED_FILENAME}"
    
    log "Verifying backup integrity..."
    
    # Test if the gzip file is valid
    if gzip -t "$backup_file" 2>/dev/null; then
        log "Backup file integrity verified"
        return 0
    else
        error "Backup file is corrupted!"
        rm -f "$backup_file"
        return 1
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Remove backups older than retention period
    find "$BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Also limit total number of backups (keep most recent)
    local backup_count=$(find "$BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" -type f | wc -l)
    
    if [[ $backup_count -gt $MAX_BACKUPS ]]; then
        warning "Too many backups ($backup_count), keeping only the $MAX_BACKUPS most recent"
        find "$BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" -type f -printf '%T@ %p\n' | \
        sort -rn | tail -n +$((MAX_BACKUPS + 1)) | cut -d' ' -f2- | xargs -r rm -f
    fi
    
    local remaining_count=$(find "$BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" -type f | wc -l)
    log "Cleanup completed. $remaining_count backups remaining"
}

# Send notification (optional - can be extended for Synology notifications)
send_notification() {
    local status=$1
    local message=$2
    
    # For Synology, you could integrate with synology notification system
    # For now, just log the status
    if [[ "$status" == "success" ]]; then
        log "BACKUP SUCCESS: $message"
    else
        error "BACKUP FAILED: $message"
    fi
}

# Main execution
main() {
    log "=== Shopping List Database Backup Started ==="
    
    # Check environment
    check_synology || true
    
    # Create backup directory
    create_backup_dir
    
    # Check if container is running
    check_container
    
    # Perform backup
    if perform_backup; then
        # Verify backup
        if verify_backup; then
            # Clean up old backups
            cleanup_old_backups
            
            send_notification "success" "Database backup completed successfully: ${COMPRESSED_FILENAME}"
            log "=== Backup Process Completed Successfully ==="
            exit 0
        else
            send_notification "error" "Backup verification failed"
            exit 1
        fi
    else
        send_notification "error" "Database backup failed"
        exit 1
    fi
}

# Run main function
main "$@"
