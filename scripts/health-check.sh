#!/bin/bash

# CollisionOS Health Check Script
# Comprehensive system health monitoring

set -e

# Configuration
LOG_FILE="/var/log/collisionos-health.log"
CONTAINER_NAME="collisionos-prod"
DB_CONTAINER="collisionos-postgres-prod"
REDIS_CONTAINER="collisionos-redis-prod"
NGINX_CONTAINER="collisionos-nginx-prod"
HEALTH_ENDPOINT="http://localhost:3001/api/health"
EXTERNAL_ENDPOINT="https://collisionos.com/api/health"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
TOTAL_CHECKS=0

# Logging functions
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_pass() {
    log "${GREEN}✅ PASS: $1${NC}"
    ((CHECKS_PASSED++))
    ((TOTAL_CHECKS++))
}

check_fail() {
    log "${RED}❌ FAIL: $1${NC}"
    ((CHECKS_FAILED++))
    ((TOTAL_CHECKS++))
}

check_warn() {
    log "${YELLOW}⚠️  WARN: $1${NC}"
    ((CHECKS_WARNING++))
    ((TOTAL_CHECKS++))
}

check_info() {
    log "${BLUE}ℹ️  INFO: $1${NC}"
}

# Start health check
log "🏥 Starting CollisionOS Health Check - $(date)"
START_TIME=$(date +%s)

# 1. Container Status Checks
check_info "Checking container status..."

if docker ps | grep -q "$CONTAINER_NAME"; then
    CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME")
    if [[ "$CONTAINER_STATUS" == "running" ]]; then
        check_pass "Application container is running"
    else
        check_fail "Application container status: $CONTAINER_STATUS"
    fi
else
    check_fail "Application container not found"
fi

if docker ps | grep -q "$DB_CONTAINER"; then
    DB_STATUS=$(docker inspect --format='{{.State.Status}}' "$DB_CONTAINER")
    if [[ "$DB_STATUS" == "running" ]]; then
        check_pass "Database container is running"
    else
        check_fail "Database container status: $DB_STATUS"
    fi
else
    check_fail "Database container not found"
fi

if docker ps | grep -q "$REDIS_CONTAINER"; then
    REDIS_STATUS=$(docker inspect --format='{{.State.Status}}' "$REDIS_CONTAINER")
    if [[ "$REDIS_STATUS" == "running" ]]; then
        check_pass "Redis container is running"
    else
        check_fail "Redis container status: $REDIS_STATUS"
    fi
else
    check_warn "Redis container not found (optional)"
fi

if docker ps | grep -q "$NGINX_CONTAINER"; then
    NGINX_STATUS=$(docker inspect --format='{{.State.Status}}' "$NGINX_CONTAINER")
    if [[ "$NGINX_STATUS" == "running" ]]; then
        check_pass "Nginx container is running"
    else
        check_fail "Nginx container status: $NGINX_STATUS"
    fi
else
    check_warn "Nginx container not found (optional)"
fi

# 2. Application Health Checks
check_info "Checking application health..."

if curl -f -s -m 10 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
    check_pass "Internal health endpoint responding"
    
    # Get health details
    HEALTH_RESPONSE=$(curl -s -m 10 "$HEALTH_ENDPOINT" | jq -r '.status' 2>/dev/null || echo "unknown")
    if [[ "$HEALTH_RESPONSE" == "healthy" ]]; then
        check_pass "Application reports healthy status"
    else
        check_fail "Application health status: $HEALTH_RESPONSE"
    fi
else
    check_fail "Internal health endpoint not responding"
fi

if curl -f -s -m 10 "$EXTERNAL_ENDPOINT" >/dev/null 2>&1; then
    check_pass "External health endpoint responding"
else
    check_fail "External health endpoint not responding"
fi

# 3. Database Health Checks
check_info "Checking database health..."

if docker exec "$DB_CONTAINER" pg_isready -U collisionos_prod >/dev/null 2>&1; then
    check_pass "PostgreSQL is ready"
else
    check_fail "PostgreSQL is not ready"
fi

if docker exec "$DB_CONTAINER" psql -U collisionos_prod -d collisionos_prod -c "SELECT 1;" >/dev/null 2>&1; then
    check_pass "Database connection working"
    
    # Check database size
    DB_SIZE=$(docker exec "$DB_CONTAINER" psql -U collisionos_prod -d collisionos_prod -c "SELECT pg_size_pretty(pg_database_size('collisionos_prod'));" -t | xargs 2>/dev/null || echo "unknown")
    check_info "Database size: $DB_SIZE"
    
    # Check active connections
    ACTIVE_CONNECTIONS=$(docker exec "$DB_CONTAINER" psql -U collisionos_prod -d collisionos_prod -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" -t | xargs 2>/dev/null || echo "unknown")
    check_info "Active connections: $ACTIVE_CONNECTIONS"
    
else
    check_fail "Database connection failed"
fi

# 4. Redis Health Checks (if available)
if docker ps | grep -q "$REDIS_CONTAINER"; then
    check_info "Checking Redis health..."
    
    if docker exec "$REDIS_CONTAINER" redis-cli ping | grep -q "PONG"; then
        check_pass "Redis is responding"
        
        # Check Redis memory usage
        REDIS_MEMORY=$(docker exec "$REDIS_CONTAINER" redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r' 2>/dev/null || echo "unknown")
        check_info "Redis memory usage: $REDIS_MEMORY"
    else
        check_fail "Redis is not responding"
    fi
fi

# 5. File System Health Checks
check_info "Checking file system health..."

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -lt 80 ]]; then
    check_pass "Disk usage: ${DISK_USAGE}%"
elif [[ $DISK_USAGE -lt 90 ]]; then
    check_warn "Disk usage: ${DISK_USAGE}% (approaching limit)"
else
    check_fail "Disk usage: ${DISK_USAGE}% (critical)"
fi

# Check data volume
if docker volume inspect collisionos-prod-data >/dev/null 2>&1; then
    check_pass "Data volume exists"
else
    check_fail "Data volume not found"
fi

# Check uploads volume
if docker volume inspect collisionos-prod-uploads >/dev/null 2>&1; then
    check_pass "Uploads volume exists"
else
    check_warn "Uploads volume not found"
fi

# 6. Performance Checks
check_info "Checking system performance..."

# Check load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
if (( $(echo "$LOAD_AVG < 2.0" | bc -l) )); then
    check_pass "Load average: $LOAD_AVG"
elif (( $(echo "$LOAD_AVG < 4.0" | bc -l) )); then
    check_warn "Load average: $LOAD_AVG (elevated)"
else
    check_fail "Load average: $LOAD_AVG (high)"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE < 80.0" | bc -l) )); then
    check_pass "Memory usage: ${MEMORY_USAGE}%"
elif (( $(echo "$MEMORY_USAGE < 90.0" | bc -l) )); then
    check_warn "Memory usage: ${MEMORY_USAGE}% (elevated)"
else
    check_fail "Memory usage: ${MEMORY_USAGE}% (critical)"
fi

# 7. Network Connectivity Checks
check_info "Checking network connectivity..."

# Check port 3001 (application)
if netstat -tuln | grep -q ":3001"; then
    check_pass "Port 3001 is listening"
else
    check_fail "Port 3001 is not listening"
fi

# Check port 5432 (database)
if netstat -tuln | grep -q ":5432"; then
    check_pass "Port 5432 (PostgreSQL) is listening"
else
    check_fail "Port 5432 (PostgreSQL) is not listening"
fi

# Check SSL certificate (if HTTPS is enabled)
if command -v openssl >/dev/null 2>&1; then
    if openssl s_client -connect collisionos.com:443 -servername collisionos.com </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        CERT_EXPIRY=$(openssl s_client -connect collisionos.com:443 -servername collisionos.com </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        CERT_EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo 0)
        CURRENT_TIMESTAMP=$(date +%s)
        DAYS_TO_EXPIRY=$(( (CERT_EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
        
        if [[ $DAYS_TO_EXPIRY -gt 30 ]]; then
            check_pass "SSL certificate valid for $DAYS_TO_EXPIRY days"
        elif [[ $DAYS_TO_EXPIRY -gt 7 ]]; then
            check_warn "SSL certificate expires in $DAYS_TO_EXPIRY days"
        else
            check_fail "SSL certificate expires in $DAYS_TO_EXPIRY days (critical)"
        fi
    else
        check_warn "Could not check SSL certificate"
    fi
fi

# 8. Log Analysis
check_info "Checking application logs..."

# Check for recent errors in application logs
if docker logs "$CONTAINER_NAME" --since="1h" 2>&1 | grep -i error | head -5; then
    ERROR_COUNT=$(docker logs "$CONTAINER_NAME" --since="1h" 2>&1 | grep -i error | wc -l)
    if [[ $ERROR_COUNT -eq 0 ]]; then
        check_pass "No errors in recent logs"
    elif [[ $ERROR_COUNT -lt 10 ]]; then
        check_warn "$ERROR_COUNT errors in recent logs"
    else
        check_fail "$ERROR_COUNT errors in recent logs"
    fi
else
    check_pass "No errors in recent logs"
fi

# 9. Backup Status
check_info "Checking backup status..."

LATEST_BACKUP=$(find /opt/backups/collisionos -name "backup_manifest_*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- | xargs basename 2>/dev/null | sed 's/backup_manifest_//' | sed 's/.txt//' 2>/dev/null || echo "none")

if [[ "$LATEST_BACKUP" != "none" ]]; then
    BACKUP_TIMESTAMP=$(date -d "${LATEST_BACKUP:0:8} ${LATEST_BACKUP:9:2}:${LATEST_BACKUP:11:2}:${LATEST_BACKUP:13:2}" +%s 2>/dev/null || echo 0)
    CURRENT_TIMESTAMP=$(date +%s)
    HOURS_SINCE_BACKUP=$(( (CURRENT_TIMESTAMP - BACKUP_TIMESTAMP) / 3600 ))
    
    if [[ $HOURS_SINCE_BACKUP -lt 25 ]]; then
        check_pass "Latest backup: $HOURS_SINCE_BACKUP hours ago"
    elif [[ $HOURS_SINCE_BACKUP -lt 48 ]]; then
        check_warn "Latest backup: $HOURS_SINCE_BACKUP hours ago (stale)"
    else
        check_fail "Latest backup: $HOURS_SINCE_BACKUP hours ago (very stale)"
    fi
else
    check_warn "No backups found"
fi

# Calculate health score
HEALTH_SCORE=$(( (CHECKS_PASSED * 100) / TOTAL_CHECKS ))
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Generate summary
log ""
log "📊 Health Check Summary"
log "======================"
log "Duration: ${DURATION}s"
log "Total Checks: $TOTAL_CHECKS"
log "✅ Passed: $CHECKS_PASSED"
log "⚠️  Warnings: $CHECKS_WARNING"
log "❌ Failed: $CHECKS_FAILED"
log "📈 Health Score: ${HEALTH_SCORE}%"

# Overall status
if [[ $CHECKS_FAILED -eq 0 && $CHECKS_WARNING -eq 0 ]]; then
    log "${GREEN}🎉 OVERALL STATUS: HEALTHY${NC}"
    exit 0
elif [[ $CHECKS_FAILED -eq 0 ]]; then
    log "${YELLOW}⚠️  OVERALL STATUS: WARNING${NC}"
    exit 1
else
    log "${RED}🚨 OVERALL STATUS: CRITICAL${NC}"
    exit 2
fi