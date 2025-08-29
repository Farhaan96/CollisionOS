#!/bin/bash

# CollisionOS Rollback Script
# Quick rollback procedure for production deployment issues

set -e

# Configuration
BACKUP_DIR="/opt/backups/collisionos"
LOG_FILE="/var/log/collisionos-rollback.log"
CONTAINER_NAME="collisionos-prod"
DB_CONTAINER="collisionos-postgres-prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    log "${BLUE}INFO: $1${NC}"
}

# Safety check
log_warning "⚠️  PRODUCTION ROLLBACK PROCEDURE"
log_warning "This will restore CollisionOS to a previous backup state."
echo ""
echo "Available backups:"
ls -la "$BACKUP_DIR" | grep backup_manifest | tail -5

echo ""
read -p "Enter backup timestamp to restore (YYYYMMDD_HHMMSS): " BACKUP_TIMESTAMP

if [[ ! "$BACKUP_TIMESTAMP" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
    log_error "Invalid timestamp format. Use YYYYMMDD_HHMMSS"
    exit 1
fi

# Check if backup exists
DB_BACKUP="$BACKUP_DIR/database_backup_${BACKUP_TIMESTAMP}.sql.gz"
DATA_BACKUP="$BACKUP_DIR/data_backup_${BACKUP_TIMESTAMP}.tar.gz"
MANIFEST="$BACKUP_DIR/backup_manifest_${BACKUP_TIMESTAMP}.txt"

if [[ ! -f "$MANIFEST" ]]; then
    log_error "Backup manifest not found: $MANIFEST"
    exit 1
fi

log_info "📋 Backup manifest found. Showing details:"
cat "$MANIFEST"

echo ""
read -p "Continue with rollback? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    log_info "Rollback cancelled by user"
    exit 0
fi

log_info "🚀 Starting rollback procedure for timestamp: $BACKUP_TIMESTAMP"

# 1. Create pre-rollback backup
log_info "📦 Creating pre-rollback backup..."
PRE_ROLLBACK_DIR="$BACKUP_DIR/pre-rollback-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$PRE_ROLLBACK_DIR"

if docker ps | grep -q "$DB_CONTAINER"; then
    docker exec "$DB_CONTAINER" pg_dump -U collisionos_prod -d collisionos_prod | gzip > "$PRE_ROLLBACK_DIR/database_pre_rollback.sql.gz"
    log_success "Pre-rollback database backup created"
fi

# 2. Stop application container
log_info "🛑 Stopping application container..."
if docker ps | grep -q "$CONTAINER_NAME"; then
    docker stop "$CONTAINER_NAME"
    log_success "Application container stopped"
fi

# 3. Restore database
if [[ -f "$DB_BACKUP" ]]; then
    log_info "🗄️  Restoring database..."
    
    # Drop and recreate database
    docker exec "$DB_CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS collisionos_prod;"
    docker exec "$DB_CONTAINER" psql -U postgres -c "CREATE DATABASE collisionos_prod OWNER collisionos_prod;"
    
    # Restore database
    gunzip -c "$DB_BACKUP" | docker exec -i "$DB_CONTAINER" psql -U collisionos_prod -d collisionos_prod
    
    log_success "Database restored from backup"
else
    log_warning "Database backup not found: $DB_BACKUP"
fi

# 4. Restore application data
if [[ -f "$DATA_BACKUP" ]]; then
    log_info "📁 Restoring application data..."
    
    # Remove existing data volume and recreate
    docker volume rm collisionos-prod-data 2>/dev/null || true
    docker volume create collisionos-prod-data
    
    # Restore data
    docker run --rm \
        -v collisionos-prod-data:/restore \
        -v "$BACKUP_DIR":/backup:ro \
        alpine:latest \
        sh -c "cd /restore && tar xzf /backup/data_backup_${BACKUP_TIMESTAMP}.tar.gz"
    
    log_success "Application data restored"
else
    log_warning "Data backup not found: $DATA_BACKUP"
fi

# 5. Restore uploads
UPLOADS_BACKUP="$BACKUP_DIR/uploads_backup_${BACKUP_TIMESTAMP}.tar.gz"
if [[ -f "$UPLOADS_BACKUP" ]]; then
    log_info "📸 Restoring uploaded files..."
    
    # Remove existing uploads volume and recreate
    docker volume rm collisionos-prod-uploads 2>/dev/null || true
    docker volume create collisionos-prod-uploads
    
    # Restore uploads
    docker run --rm \
        -v collisionos-prod-uploads:/restore \
        -v "$BACKUP_DIR":/backup:ro \
        alpine:latest \
        sh -c "cd /restore && tar xzf /backup/uploads_backup_${BACKUP_TIMESTAMP}.tar.gz"
    
    log_success "Uploads restored"
else
    log_warning "Uploads backup not found: $UPLOADS_BACKUP"
fi

# 6. Start application container
log_info "🚀 Starting application container..."
docker start "$CONTAINER_NAME"

# Wait for container to be ready
log_info "⏳ Waiting for application to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker exec "$CONTAINER_NAME" curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        log_success "Application is ready and healthy!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -eq 0 ]; then
    log_error "Application failed to start properly after rollback"
    log_info "Check container logs:"
    docker logs "$CONTAINER_NAME" --tail 50
    exit 1
fi

# 7. Verify rollback
log_info "✅ Verifying rollback..."

# Check container status
CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME")
CONTAINER_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no healthcheck")

log_info "Container Status: $CONTAINER_STATUS"
log_info "Container Health: $CONTAINER_HEALTH"

# Check database connectivity
if docker exec "$DB_CONTAINER" psql -U collisionos_prod -d collisionos_prod -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "Database connectivity verified"
else
    log_error "Database connectivity check failed"
fi

# 8. Post-rollback actions
log_info "📝 Post-rollback actions..."

# Clear cache if Redis is available
if docker ps | grep -q "collisionos-redis"; then
    docker exec collisionos-redis-prod redis-cli FLUSHALL
    log_info "Redis cache cleared"
fi

# Restart nginx if available
if docker ps | grep -q "collisionos-nginx"; then
    docker restart collisionos-nginx-prod
    log_info "Nginx restarted"
fi

# Create rollback summary
ROLLBACK_SUMMARY="$BACKUP_DIR/rollback_summary_$(date +%Y%m%d_%H%M%S).txt"
cat > "$ROLLBACK_SUMMARY" << EOF
CollisionOS Rollback Summary
============================
Rollback Date: $(date)
Host: $(hostname)
Backup Timestamp: $BACKUP_TIMESTAMP
Rollback Duration: $(($(date +%s) - START_TIME)) seconds

Actions Performed:
- Pre-rollback backup created
- Application container stopped
- Database restored from: $DB_BACKUP
- Application data restored from: $DATA_BACKUP
- Uploads restored from: $UPLOADS_BACKUP
- Application container restarted

Final Status:
- Container: $CONTAINER_STATUS
- Health: $CONTAINER_HEALTH
- Database: Connected

Post-Rollback Checklist:
□ Verify application functionality
□ Check recent data consistency
□ Monitor error logs
□ Notify team of rollback completion
□ Update monitoring dashboards
□ Schedule post-incident review
EOF

log_success "🎉 Rollback completed successfully!"
log_info "📊 Rollback Summary:"
log_info "   • Restored to: $BACKUP_TIMESTAMP"
log_info "   • Container: $CONTAINER_STATUS"
log_info "   • Health: $CONTAINER_HEALTH"
log_info "   • Summary: $ROLLBACK_SUMMARY"

log_warning "⚠️  IMPORTANT: Verify application functionality and data consistency"
log_info "🔗 Access application: https://collisionos.com"
log_info "🩺 Health check: curl https://collisionos.com/api/health"

exit 0