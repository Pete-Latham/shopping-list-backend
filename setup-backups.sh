#!/bin/bash

# Shopping List Backup System Setup Script
# Run this on your Synology NAS to configure automated backups

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration - Adjust these paths for your Synology
SYNOLOGY_BACKUP_DIR="/volume1/docker/shopping-list-backups"
PROJECT_DIR="/volume1/docker/shopping-list-backend"

echo -e "${GREEN}=== Shopping List Backup System Setup ===${NC}"
echo

# Check if running on Synology
check_synology() {
    if [[ -f /etc/synoinfo.conf ]]; then
        echo -e "${GREEN}✓ Running on Synology NAS${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Not running on Synology - adjust paths manually${NC}"
        return 1
    fi
}

# Create backup directory
setup_backup_directory() {
    echo -e "${YELLOW}Setting up backup directory...${NC}"
    
    if [[ ! -d "$SYNOLOGY_BACKUP_DIR" ]]; then
        mkdir -p "$SYNOLOGY_BACKUP_DIR"
        echo -e "${GREEN}✓ Created backup directory: $SYNOLOGY_BACKUP_DIR${NC}"
    else
        echo -e "${GREEN}✓ Backup directory already exists${NC}"
    fi
    
    # Set permissions
    chmod 755 "$SYNOLOGY_BACKUP_DIR"
    echo -e "${GREEN}✓ Set directory permissions${NC}"
}

# Update script configurations
update_script_paths() {
    echo -e "${YELLOW}Updating script configurations...${NC}"
    
    if [[ -f "$PROJECT_DIR/scripts/backup-database.sh" ]]; then
        # Update backup directory in backup script
        sed -i "s|BACKUP_DIR=\".*\"|BACKUP_DIR=\"$SYNOLOGY_BACKUP_DIR\"|" "$PROJECT_DIR/scripts/backup-database.sh"
        echo -e "${GREEN}✓ Updated backup-database.sh${NC}"
    else
        echo -e "${RED}✗ backup-database.sh not found${NC}"
    fi
    
    if [[ -f "$PROJECT_DIR/scripts/restore-database.sh" ]]; then
        # Update backup directory in restore script
        sed -i "s|BACKUP_DIR=\".*\"|BACKUP_DIR=\"$SYNOLOGY_BACKUP_DIR\"|" "$PROJECT_DIR/scripts/restore-database.sh"
        echo -e "${GREEN}✓ Updated restore-database.sh${NC}"
    else
        echo -e "${RED}✗ restore-database.sh not found${NC}"
    fi
}

# Test manual backup
test_backup() {
    echo -e "${YELLOW}Testing manual backup...${NC}"
    
    if [[ -f "$PROJECT_DIR/scripts/backup-database.sh" ]]; then
        echo "Running test backup..."
        if "$PROJECT_DIR/scripts/backup-database.sh"; then
            echo -e "${GREEN}✓ Manual backup test successful${NC}"
            
            # Show backup file
            local latest_backup=$(find "$SYNOLOGY_BACKUP_DIR" -name "shopping_list_backup_*.sql.gz" | sort -r | head -n1)
            if [[ -n "$latest_backup" ]]; then
                local backup_size=$(du -h "$latest_backup" | cut -f1)
                echo -e "${GREEN}✓ Backup created: $(basename "$latest_backup") ($backup_size)${NC}"
            fi
        else
            echo -e "${RED}✗ Manual backup test failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Backup script not found${NC}"
        return 1
    fi
}

# Setup automated backups
setup_automation() {
    echo -e "${YELLOW}Setting up automated backups...${NC}"
    
    echo "You have two options for automation:"
    echo "1. Docker-based backup service (recommended)"
    echo "2. Synology Task Scheduler"
    echo
    
    read -p "Choose option (1 or 2): " choice
    
    case $choice in
        1)
            echo -e "${GREEN}Docker-based backup setup:${NC}"
            echo "1. Copy your project to Synology if not already there"
            echo "2. Run: docker-compose -f docker-compose.yml -f docker-compose.backup.yml up -d"
            echo "3. Check logs: docker-compose -f docker-compose.backup.yml logs -f backup"
            ;;
        2)
            echo -e "${GREEN}Synology Task Scheduler setup:${NC}"
            echo "1. Go to Control Panel > Task Scheduler"
            echo "2. Create > Scheduled Task > User-defined script"
            echo "3. General tab:"
            echo "   - Task: Shopping List Backup"
            echo "   - User: root (or your admin user)"
            echo "4. Schedule tab: Daily at desired time"
            echo "5. Task Settings tab:"
            echo "   - Script: $PROJECT_DIR/scripts/backup-database.sh"
            echo "   - Send run details by email: Enabled (optional)"
            ;;
        *)
            echo -e "${YELLOW}No automation setup selected${NC}"
            ;;
    esac
}

# Setup Synology integration
setup_synology_integration() {
    echo -e "${YELLOW}Synology Integration Recommendations:${NC}"
    echo
    echo "1. Enable File System Snapshots:"
    echo "   - Go to Storage Manager > Volume > Settings"
    echo "   - Enable 'File system snapshot'"
    echo "   - Include /volume1/docker in snapshots"
    echo
    echo "2. Configure Hyper Backup:"
    echo "   - Include folder: $SYNOLOGY_BACKUP_DIR"
    echo "   - Set up external/cloud backup destination"
    echo "   - Schedule regular off-site backups"
    echo
    echo "3. Set up notifications (optional):"
    echo "   - Control Panel > Notification > Email"
    echo "   - Configure SMTP settings for backup alerts"
}

# Show summary
show_summary() {
    echo
    echo -e "${GREEN}=== Setup Complete ===${NC}"
    echo
    echo "📁 Backup Directory: $SYNOLOGY_BACKUP_DIR"
    echo "🔧 Scripts Location: $PROJECT_DIR/scripts/"
    echo
    echo "Quick Commands:"
    echo "  Manual backup: $PROJECT_DIR/scripts/backup-database.sh"
    echo "  List backups:  $PROJECT_DIR/scripts/restore-database.sh --list"
    echo "  Restore:       $PROJECT_DIR/scripts/restore-database.sh"
    echo
    echo "Next Steps:"
    echo "1. Set up automated backups (Docker or Task Scheduler)"
    echo "2. Configure Synology snapshots and Hyper Backup"
    echo "3. Test the restore process"
    echo "4. Set up monitoring and notifications"
    echo
    echo "See BACKUP.md for detailed documentation."
}

# Main execution
main() {
    # Check environment
    check_synology || echo -e "${YELLOW}Continue with manual path adjustment${NC}"
    
    # Setup backup directory
    setup_backup_directory
    
    # Update script paths
    if [[ -d "$PROJECT_DIR/scripts" ]]; then
        update_script_paths
    else
        echo -e "${YELLOW}⚠ Project directory not found: $PROJECT_DIR${NC}"
        echo "Please copy your project to the Synology and update PROJECT_DIR in this script"
    fi
    
    # Test backup (if scripts are available)
    if [[ -f "$PROJECT_DIR/scripts/backup-database.sh" ]]; then
        echo
        read -p "Test manual backup now? (y/n): " test_choice
        if [[ "$test_choice" =~ ^[Yy] ]]; then
            test_backup
        fi
    fi
    
    # Setup automation
    echo
    setup_automation
    
    # Show integration recommendations
    echo
    setup_synology_integration
    
    # Show summary
    show_summary
}

# Run main function
main "$@"
