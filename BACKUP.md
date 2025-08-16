# Shopping List Database Backup System

This document describes the automated backup system for the Shopping List PostgreSQL database, designed specifically for Synology Container Manager environments.

## 🎯 Overview

The backup system provides:
- **Automated daily backups** with configurable scheduling
- **Compressed storage** with gzip compression
- **Automatic cleanup** with configurable retention policies
- **Easy restore** with interactive and automated options
- **Health monitoring** and logging
- **Synology NAS optimization**

## 📁 Files Structure

```
shopping-list-backend/
├── scripts/
│   ├── backup-database.sh      # Main backup script
│   └── restore-database.sh     # Database restore script
├── docker-compose.backup.yml   # Backup service configuration
├── Dockerfile.backup          # Backup container definition
└── BACKUP.md                  # This documentation
```

## 🚀 Quick Start

### 1. Setup for Synology Container Manager

1. **Adjust backup paths** in the scripts:
   ```bash
   # Edit backup-database.sh and restore-database.sh
   # Change BACKUP_DIR to match your Synology volume:
   BACKUP_DIR="/volume1/docker/shopping-list-backups"
   ```

2. **Create backup directory** on your Synology:
   ```bash
   mkdir -p /volume1/docker/shopping-list-backups
   chmod 755 /volume1/docker/shopping-list-backups
   ```

3. **Start the backup service**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.backup.yml up -d
   ```

### 2. Manual Backup (Immediate)

```bash
# Run manual backup via container
docker-compose -f docker-compose.backup.yml exec backup /app/backup-now.sh

# Or run directly on Synology
/volume1/docker/shopping-list-backend/scripts/backup-database.sh
```

### 3. List Available Backups

```bash
# Via restore script
./scripts/restore-database.sh --list

# Or check directory directly
ls -la /volume1/docker/shopping-list-backups/
```

### 4. Restore Database

```bash
# Interactive restore (shows menu)
./scripts/restore-database.sh

# Restore latest backup automatically
./scripts/restore-database.sh --latest

# Restore specific backup
./scripts/restore-database.sh shopping_list_backup_20240110_143022.sql.gz
```

## ⚙️ Configuration

### Backup Schedule

Default: Daily at 2:00 AM (UTC)

Change the schedule in `docker-compose.backup.yml`:
```yaml
environment:
  BACKUP_SCHEDULE: "0 2 * * *"  # Cron format: min hour day month weekday
```

**Common schedules:**
- Every 6 hours: `"0 */6 * * *"`
- Twice daily: `"0 2,14 * * *"`
- Weekly (Sunday 2 AM): `"0 2 * * 0"`

### Retention Policy

```yaml
environment:
  RETENTION_DAYS: 30    # Delete backups older than 30 days
  MAX_BACKUPS: 50      # Keep maximum 50 recent backups
```

### Paths (Synology-specific)

Adjust these paths in both script files and Docker Compose:

```bash
# In backup-database.sh and restore-database.sh:
BACKUP_DIR="/volume1/docker/shopping-list-backups"

# In docker-compose.backup.yml:
volumes:
  - /volume1/docker/shopping-list-backups:/backups
```

## 🔧 Advanced Usage

### Custom Backup Location

```bash
# Backup to external USB drive
BACKUP_DIR="/volumeUSB1/backups" ./scripts/backup-database.sh

# Backup to network share
BACKUP_DIR="/volume1/NetBackup/shopping-list" ./scripts/backup-database.sh
```

### Backup Verification

```bash
# Test backup integrity
gzip -t /volume1/docker/shopping-list-backups/shopping_list_backup_*.sql.gz

# Check backup contents (first 20 lines)
gunzip -c backup_file.sql.gz | head -20
```

### Remote Backup Copy

```bash
# Copy to another Synology or remote server
rsync -av /volume1/docker/shopping-list-backups/ user@remote:/backups/

# Using Synology's built-in backup tools
# Configure Hyper Backup to include /volume1/docker/shopping-list-backups/
```

## 📊 Monitoring and Logs

### Check Backup Service Status

```bash
# Container status
docker-compose -f docker-compose.backup.yml ps

# Service logs
docker-compose -f docker-compose.backup.yml logs -f backup

# Backup-specific logs
tail -f ./logs/backup/backup.log
```

### Log Locations

- **Container logs**: `docker-compose logs backup`
- **Backup operation logs**: `./logs/backup/backup.log`
- **Cron logs**: Accessible via container logs

### Health Checks

The backup service includes health monitoring:
```bash
# Check container health
docker inspect shopping-list-backup | grep -A 10 Health

# Manual health check
docker-compose -f docker-compose.backup.yml exec backup test -f /app/backup-database.sh
```

## 🆘 Troubleshooting

### Common Issues

1. **Permission denied errors**:
   ```bash
   # Fix Synology permissions
   sudo chown -R $(whoami):users /volume1/docker/shopping-list-backups
   chmod -R 755 /volume1/docker/shopping-list-backups
   ```

2. **Container not running**:
   ```bash
   # Check if database container exists
   docker ps -a | grep shopping-list-db
   
   # Restart backup service
   docker-compose -f docker-compose.backup.yml restart backup
   ```

3. **Backup directory not accessible**:
   ```bash
   # Verify mount point
   mount | grep volume1
   
   # Check Synology volume status
   synovolume --list
   ```

4. **Large backup files**:
   ```bash
   # Check database size
   docker exec shopping-list-db psql -U postgres -d shopping_list -c "SELECT pg_size_pretty(pg_database_size('shopping_list'));"
   
   # Monitor backup compression ratio
   ls -lah /volume1/docker/shopping-list-backups/
   ```

### Recovery Scenarios

1. **Complete data loss**:
   ```bash
   # Stop application
   docker-compose down
   
   # Remove database volume (if corrupted)
   docker volume rm shopping-list-backend_postgres_data
   
   # Restart database only
   docker-compose up -d postgres
   
   # Wait for database to initialize, then restore
   ./scripts/restore-database.sh --latest --force
   
   # Restart application
   docker-compose up -d
   ```

2. **Partial data corruption**:
   ```bash
   # Create emergency backup of current state
   ./scripts/backup-database.sh
   
   # Restore from known good backup
   ./scripts/restore-database.sh
   ```

## 🔐 Security Considerations

1. **Backup file permissions**:
   ```bash
   # Ensure only authorized users can read backups
   chmod 600 /volume1/docker/shopping-list-backups/*.sql.gz
   ```

2. **Network access**:
   - Backups contain complete database dumps
   - Store in secure locations only
   - Consider encryption for off-site backups

3. **Retention policy**:
   - Balance storage costs vs. recovery needs
   - Consider regulatory requirements for data retention

## 🎛️ Synology Integration

### Enable Automatic Snapshots

1. Go to **Storage Manager > Volume > Settings**
2. Enable **File system snapshot**
3. Configure snapshot schedule
4. Include `/volume1/docker` in snapshots

### Hyper Backup Configuration

1. Create backup task in **Hyper Backup**
2. Include folder: `/volume1/docker/shopping-list-backups`
3. Set destination (external drive, cloud, remote server)
4. Schedule regular off-site backups

### Task Scheduler Integration

Alternative to Docker-based scheduling:
1. Go to **Control Panel > Task Scheduler**
2. Create new task: **User-defined script**
3. Schedule: Daily at desired time
4. User-defined script:
   ```bash
   /volume1/docker/shopping-list-backend/scripts/backup-database.sh
   ```

## 📈 Best Practices

1. **Test restores regularly**:
   ```bash
   # Monthly restore test
   ./scripts/restore-database.sh --dry-run --latest
   ```

2. **Monitor backup sizes**:
   ```bash
   # Check for unexpected size changes
   du -sh /volume1/docker/shopping-list-backups/* | tail -10
   ```

3. **Multiple backup locations**:
   - Local Synology storage (fast recovery)
   - External USB drive (offline backup)
   - Cloud storage (off-site protection)

4. **Documentation**:
   - Keep restore procedures accessible
   - Document any customizations
   - Maintain emergency contact information

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review backup logs for errors
- **Monthly**: Test restore procedure
- **Quarterly**: Review retention policy and storage usage
- **Annually**: Test disaster recovery scenarios

### Updates

When updating the application:
1. Create manual backup before updates
2. Test backup/restore with new version
3. Update backup scripts if database schema changes

---

For additional help or questions about the backup system, check the container logs and verify your Synology system configuration.
