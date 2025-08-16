#!/bin/bash

# Shopping List Database Restore Script
# This script restores PostgreSQL backups from compressed files
# Designed to work with Docker containers in Synology Container Manager

set -euo pipefail

# Configuration
CONTAINER_NAME="shopping-list-db"
DB_NAME="shopping_list"
DB_USER="postgres"
BACKUP_DIR="/volume1/docker/shopping-list-backups"  # Adjust path for your Synology

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] [BACKUP_FILE]

Restore Shopping List database from backup

OPTIONS:
    -h, --help          Show this help message
    -l, --list          List available backups
    -f, --force         Skip confirmation prompts
    --latest            Restore from the latest backup
    --dry-run          Show what would be restored without doing it

BACKUP_FILE:
    Path to backup file (relative to $BACKUP_DIR)
    Or full path to backup file
    If not specified, will prompt for selection

Examples:
    $0 --list                           # List all available backups
    $0 --latest                         # Restore latest backup
    $0 shopping_list_backup_20240110_143022.sql.gz  # Restore specific backup
    $0 /path/to/backup.sql.gz          # Restore from custom path
EOF
}

# List available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        error "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
    
    local backups=($(find "$BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" -type f | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        warning "No backup files found"
        return 1
    fi
    
    printf "\n%-5s %-35s %-12s %-20s\n" "ID" "FILENAME" "SIZE" "DATE"
    printf "%.0s-" {1..75}
    printf "\n"
    
    for i in "${!backups[@]}"; do
        local backup="${backups[$i]}"
        local filename=$(basename "$backup")
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1 || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup")
        
        printf "%-5s %-35s %-12s %-20s\n" "$((i+1))" "$filename" "$size" "$date"
    done
    
    printf "\n"
    return 0
}

# Get latest backup
get_latest_backup() {
    local latest=$(find "$BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" -type f | sort -r | head -n1)
    
    if [[ -z "$latest" ]]; then
        error "No backup files found"
        return 1
    fi
    
    echo "$latest"
}

# Check if container is running
check_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        error "Container '${CONTAINER_NAME}' is not running!"
        exit 1
    fi
    log "Container '${CONTAINER_NAME}' is running"
}

# Verify backup file
verify_backup_file() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Verifying backup file integrity..."
    
    if gzip -t "$backup_file" 2>/dev/null; then
        log "Backup file integrity verified"
        return 0
    else
        error "Backup file is corrupted: $backup_file"
        return 1
    fi
}

# Create database backup before restore
create_pre_restore_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_filename="pre_restore_backup_${timestamp}.sql.gz"
    local backup_path="${BACKUP_DIR}/${backup_filename}"
    
    log "Creating backup before restore: $backup_filename"
    
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$backup_path"; then
        log "Pre-restore backup created successfully"
        return 0
    else
        warning "Failed to create pre-restore backup (continuing anyway)"
        return 1
    fi
}

# Perform database restore
perform_restore() {
    local backup_file="$1"
    local force_mode="$2"
    
    log "Starting restore from: $(basename "$backup_file")"
    
    # Create temporary uncompressed file
    local temp_sql_file="/tmp/restore_temp_$(date +%s).sql"
    
    # Uncompress backup
    log "Uncompressing backup file..."
    if gunzip -c "$backup_file" > "$temp_sql_file"; then
        log "Backup uncompressed successfully"
    else
        error "Failed to uncompress backup file"
        rm -f "$temp_sql_file"
        return 1
    fi
    
    # Drop existing connections (if any)
    log "Terminating active connections to database..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true
    
    # Drop and recreate database
    log "Dropping and recreating database..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    # Restore database
    log "Restoring database from backup..."
    if docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$temp_sql_file"; then
        log "Database restore completed successfully"
        rm -f "$temp_sql_file"
        return 0
    else
        error "Database restore failed!"
        rm -f "$temp_sql_file"
        return 1
    fi
}

# Interactive backup selection
select_backup_interactive() {
    local backups=($(find "$BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" -type f | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        error "No backup files found"
        return 1
    fi
    
    echo
    list_backups
    
    while true; do
        read -p "Enter backup ID (1-${#backups[@]}) or 'q' to quit: " selection
        
        if [[ "$selection" == "q" || "$selection" == "Q" ]]; then
            info "Restore cancelled"
            exit 0
        fi
        
        if [[ "$selection" =~ ^[0-9]+$ ]] && [[ "$selection" -ge 1 ]] && [[ "$selection" -le ${#backups[@]} ]]; then
            echo "${backups[$((selection-1))]}"
            return 0
        else
            warning "Invalid selection. Please enter a number between 1 and ${#backups[@]}, or 'q' to quit."
        fi
    done
}

# Confirmation prompt
confirm_restore() {
    local backup_file="$1"
    local force_mode="$2"
    
    if [[ "$force_mode" == "true" ]]; then
        return 0
    fi
    
    warning "This will completely replace the current database with the backup!"
    warning "Current data will be lost unless you have a backup."
    echo
    info "Backup file: $(basename "$backup_file")"
    info "Backup size: $(du -h "$backup_file" | cut -f1)"
    info "Backup date: $(stat -c %y "$backup_file" 2>/dev/null | cut -d'.' -f1 || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup_file")"
    echo
    
    read -p "Do you want to continue? (type 'yes' to confirm): " confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        info "Restore cancelled"
        exit 0
    fi
}

# Main execution
main() {
    local backup_file=""
    local force_mode="false"
    local dry_run="false"
    local use_latest="false"
    local list_only="false"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -l|--list)
                list_only="true"
                shift
                ;;
            -f|--force)
                force_mode="true"
                shift
                ;;
            --dry-run)
                dry_run="true"
                shift
                ;;
            --latest)
                use_latest="true"
                shift
                ;;
            -*)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    log "=== Shopping List Database Restore Started ==="
    
    # Handle list-only mode
    if [[ "$list_only" == "true" ]]; then
        list_backups
        exit 0
    fi
    
    # Check if container is running
    check_container
    
    # Determine backup file
    if [[ "$use_latest" == "true" ]]; then
        backup_file=$(get_latest_backup)
        log "Using latest backup: $(basename "$backup_file")"
    elif [[ -z "$backup_file" ]]; then
        log "No backup file specified, showing interactive selection..."
        backup_file=$(select_backup_interactive)
    elif [[ "$backup_file" != /* ]]; then
        # Relative path, prepend backup directory
        backup_file="${BACKUP_DIR}/${backup_file}"
    fi
    
    # Verify backup file
    if ! verify_backup_file "$backup_file"; then
        exit 1
    fi
    
    # Handle dry-run mode
    if [[ "$dry_run" == "true" ]]; then
        info "DRY RUN MODE - No actual restore will be performed"
        info "Would restore from: $backup_file"
        info "Backup size: $(du -h "$backup_file" | cut -f1)"
        exit 0
    fi
    
    # Confirm restore
    confirm_restore "$backup_file" "$force_mode"
    
    # Create backup before restore
    create_pre_restore_backup || warning "Continuing without pre-restore backup"
    
    # Perform restore
    if perform_restore "$backup_file" "$force_mode"; then
        log "=== Database Restore Completed Successfully ==="
        info "Database has been restored from: $(basename "$backup_file")"
    else
        error "=== Database Restore Failed ==="
        exit 1
    fi
}

# Run main function
main "$@"
