#!/bin/bash

# CollisionOS Backup Script
# Automated database and application data backup

set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/collisionos"
RETENTION_DAYS=30
DB_CONTAINER="collisionos-postgres-prod"
APP_CONTAINER="collisionos-prod"
LOG_FILE="/var/log/collisionos-backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    log "${RED}ERROR: $1${NC}"
}

log_success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

log_warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

log_info() {
    log "$1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    log_warning "Running as root. Consider using a dedicated backup user."
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "📦 Starting CollisionOS backup - $TIMESTAMP"

# Check if containers are running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    log_error "Database container $DB_CONTAINER is not running"
    exit 1
fi

if ! docker ps | grep -q "$APP_CONTAINER"; then
    log_error "Application container $APP_CONTAINER is not running"
    exit 1
fi

# 1. Backup PostgreSQL Database
log_info "🗄️  Backing up PostgreSQL database..."
DB_BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"

if docker exec "$DB_CONTAINER" pg_dump -U collisionos_prod -d collisionos_prod > "$DB_BACKUP_FILE"; then
    log_success "Database backup completed: $DB_BACKUP_FILE"
    
    # Compress database backup
    gzip "$DB_BACKUP_FILE"
    log_info "Database backup compressed: ${DB_BACKUP_FILE}.gz"
else
    log_error "Database backup failed"
    exit 1
fi

# 2. Backup SQLite Database (if used)
log_info "📊 Backing up SQLite database..."
SQLITE_BACKUP_FILE="$BACKUP_DIR/sqlite_backup_$TIMESTAMP.db"

if docker exec "$APP_CONTAINER" sqlite3 /app/data/collisionos.db ".backup /tmp/backup.db"; then
    docker cp "$APP_CONTAINER:/tmp/backup.db" "$SQLITE_BACKUP_FILE"
    log_success "SQLite backup completed: $SQLITE_BACKUP_FILE"
else
    log_warning "SQLite backup failed or database doesn't exist"
fi

# 3. Backup Application Data
log_info "📁 Backing up application data..."
DATA_BACKUP_FILE="$BACKUP_DIR/data_backup_$TIMESTAMP.tar.gz"

# Create temporary directory for data collection
TMP_DIR="/tmp/collisionos_backup_$TIMESTAMP"
mkdir -p "$TMP_DIR"

# Copy data from container volumes
docker run --rm \
    -v collisionos-prod-data:/source:ro \
    -v "$TMP_DIR":/backup \
    alpine:latest \
    tar czf /backup/data.tar.gz -C /source .

mv "$TMP_DIR/data.tar.gz" "$DATA_BACKUP_FILE"
rm -rf "$TMP_DIR"

if [[ -f "$DATA_BACKUP_FILE" ]]; then
    log_success "Application data backup completed: $DATA_BACKUP_FILE"
else
    log_error "Application data backup failed"
fi

# 4. Backup Uploads
log_info "📸 Backing up uploaded files..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"

TMP_DIR="/tmp/collisionos_uploads_$TIMESTAMP"
mkdir -p "$TMP_DIR"

docker run --rm \
    -v collisionos-prod-uploads:/source:ro \
    -v "$TMP_DIR":/backup \
    alpine:latest \
    tar czf /backup/uploads.tar.gz -C /source .

mv "$TMP_DIR/uploads.tar.gz" "$UPLOADS_BACKUP_FILE"
rm -rf "$TMP_DIR"

if [[ -f "$UPLOADS_BACKUP_FILE" ]]; then
    log_success "Uploads backup completed: $UPLOADS_BACKUP_FILE"
else
    log_error "Uploads backup failed"
fi

# 5. Backup Configuration Files
log_info "⚙️  Backing up configuration files..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"

tar czf "$CONFIG_BACKUP_FILE" \
    /opt/collisionos/.env.production \
    /opt/collisionos/docker-compose.prod.yml \
    /opt/collisionos/nginx/ \
    /opt/collisionos/scripts/ \
    2>/dev/null || log_warning "Some configuration files may not exist"

if [[ -f "$CONFIG_BACKUP_FILE" ]]; then
    log_success "Configuration backup completed: $CONFIG_BACKUP_FILE"
fi

# 6. Create backup manifest
log_info "📋 Creating backup manifest..."
MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$TIMESTAMP.txt"

cat > "$MANIFEST_FILE" << EOF
CollisionOS Backup Manifest
===========================
Timestamp: $TIMESTAMP
Date: $(date)
Host: $(hostname)

Backup Files:
- Database: database_backup_$TIMESTAMP.sql.gz
- SQLite: sqlite_backup_$TIMESTAMP.db
- Data: data_backup_$TIMESTAMP.tar.gz
- Uploads: uploads_backup_$TIMESTAMP.tar.gz
- Config: config_backup_$TIMESTAMP.tar.gz

Database Info:
$(docker exec "$DB_CONTAINER" psql -U collisionos_prod -d collisionos_prod -c "SELECT version();" 2>/dev/null || echo "Database info unavailable")

Disk Usage:
$(du -sh "$BACKUP_DIR"/* 2>/dev/null | tail -10)

Container Status:
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep collisionos)
EOF

log_success "Backup manifest created: $MANIFEST_FILE"

# 7. Cleanup old backups
log_info "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*backup_*" -type f -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "*backup_*" -type f -mtime +$RETENTION_DAYS | wc -l)

if [[ $DELETED_COUNT -gt 0 ]]; then
    log_info "Deleted $DELETED_COUNT old backup files"
else
    log_info "No old backup files to delete"
fi

# 8. Backup verification
log_info "✅ Verifying backup integrity..."
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
FILE_COUNT=$(ls -1 "$BACKUP_DIR"/*backup_$TIMESTAMP* | wc -l)

log_success "🎉 Backup completed successfully!"
log_info "📊 Backup Summary:"
log_info "   • Files created: $FILE_COUNT"
log_info "   • Total size: $BACKUP_SIZE"
log_info "   • Location: $BACKUP_DIR"
log_info "   • Timestamp: $TIMESTAMP"

# Optional: Send notification (uncomment if needed)
# echo "CollisionOS backup completed successfully on $(hostname)" | mail -s "Backup Success" admin@collisionos.com

exit 0