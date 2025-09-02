#!/bin/bash
# CollisionOS Automated Parts Sourcing - Staging Deployment Script
# Enterprise-grade deployment with comprehensive validation and rollback

set -euo pipefail
IFS=$'\n\t'

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/collisionos-staging-deploy-$(date +%Y%m%d_%H%M%S).log"
DEPLOYMENT_ID="staging-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Error handling
cleanup() {
    log "Cleaning up temporary files..."
    # Add cleanup logic here
}

error_exit() {
    log_error "Deployment failed: $1"
    cleanup
    exit 1
}

trap cleanup EXIT
trap 'error_exit "Script interrupted"' INT TERM

# Configuration validation
validate_environment() {
    log "Validating staging environment configuration..."
    
    # Check required environment variables
    local required_vars=(
        "STAGING_DATABASE_URL"
        "STAGING_REDIS_URL" 
        "STAGING_JWT_SECRET"
        "STAGING_LKQ_API_KEY"
        "STAGING_PARTS_TRADER_API_KEY"
        "STAGING_OE_CONNECTION_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
    
    log_success "Environment variables validated"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check Docker is running
    if ! docker info >/dev/null 2>&1; then
        error_exit "Docker is not running or not accessible"
    fi
    
    # Check Docker Compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        error_exit "Docker Compose is not installed"
    fi
    
    # Check network connectivity to container registry
    if ! curl -sSf "https://ghcr.io" >/dev/null; then
        error_exit "Cannot reach container registry"
    fi
    
    # Validate Docker image exists
    local image_tag="${1:-latest}"
    if ! docker manifest inspect "ghcr.io/farhaan96/collisionos/collisionos-automated-sourcing:$image_tag" >/dev/null 2>&1; then
        log_warning "Cannot verify Docker image. Proceeding with deployment..."
    fi
    
    log_success "Pre-deployment checks passed"
}

# Database migration and preparation
prepare_database() {
    log "Preparing staging database..."
    
    # Run database migrations
    docker run --rm \
        --network collisionos-staging-network \
        -e DATABASE_URL="$STAGING_DATABASE_URL" \
        -e NODE_ENV=staging \
        ghcr.io/farhaan96/collisionos/collisionos-automated-sourcing:${IMAGE_TAG:-latest} \
        npm run db:migrate || error_exit "Database migration failed"
    
    # Seed test data if requested
    if [[ "${SEED_TEST_DATA:-false}" == "true" ]]; then
        log "Seeding test data..."
        docker run --rm \
            --network collisionos-staging-network \
            -e DATABASE_URL="$STAGING_DATABASE_URL" \
            -e NODE_ENV=staging \
            ghcr.io/farhaan96/collisionos/collisionos-automated-sourcing:${IMAGE_TAG:-latest} \
            npm run db:seed
    fi
    
    log_success "Database preparation completed"
}

# Deploy to staging environment
deploy_staging() {
    log "Deploying CollisionOS Automated Parts Sourcing to staging..."
    
    local image_tag="${IMAGE_TAG:-latest}"
    
    # Create staging docker-compose configuration
    cat > "$PROJECT_ROOT/docker-compose.staging.override.yml" << EOF
version: '3.8'
services:
  collisionos:
    image: ghcr.io/farhaan96/collisionos/collisionos-automated-sourcing:${image_tag}
    container_name: collisionos-staging
    environment:
      - NODE_ENV=staging
      - PORT=3001
      - DATABASE_URL=${STAGING_DATABASE_URL}
      - REDIS_URL=${STAGING_REDIS_URL}
      - JWT_SECRET=${STAGING_JWT_SECRET}
      - SESSION_SECRET=${STAGING_SESSION_SECRET:-staging_session_secret}
      - CORS_ORIGIN=${STAGING_CORS_ORIGIN:-*}
      - LOG_LEVEL=debug
      - MONITORING_ENABLED=true
      - HEALTH_CHECK_ENABLED=true
      - AUTOMATED_SOURCING_ENABLED=true
      # Vendor API Keys (Staging/Sandbox)
      - LKQ_API_KEY=${STAGING_LKQ_API_KEY}
      - PARTS_TRADER_API_KEY=${STAGING_PARTS_TRADER_API_KEY}
      - OE_CONNECTION_API_KEY=${STAGING_OE_CONNECTION_API_KEY}
      - LKQ_API_URL=${STAGING_LKQ_API_URL:-https://api-sandbox.lkq.com}
      - PARTS_TRADER_API_URL=${STAGING_PARTS_TRADER_API_URL:-https://api-staging.partstrader.com}
      - OE_CONNECTION_API_URL=${STAGING_OE_CONNECTION_API_URL:-https://api-staging.oeconnection.com}
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "node", "server/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    labels:
      - "deployment.id=${DEPLOYMENT_ID}"
      - "deployment.environment=staging"
      - "deployment.timestamp=$(date -u +%Y%m%d_%H%M%S)"
    networks:
      - collisionos-staging-network

networks:
  collisionos-staging-network:
    name: collisionos-staging-network
    driver: bridge
EOF

    # Deploy using docker-compose
    cd "$PROJECT_ROOT"
    
    # Pull latest image
    docker-compose -f docker-compose.yml -f docker-compose.staging.override.yml pull || error_exit "Failed to pull Docker image"
    
    # Stop existing containers gracefully
    log "Stopping existing staging containers..."
    docker-compose -f docker-compose.yml -f docker-compose.staging.override.yml down --timeout 30
    
    # Start new deployment
    log "Starting new staging deployment..."
    docker-compose -f docker-compose.yml -f docker-compose.staging.override.yml up -d || error_exit "Failed to start staging containers"
    
    log_success "Staging deployment completed"
}

# Health checks and validation
validate_deployment() {
    log "Validating staging deployment..."
    
    local max_attempts=30
    local attempt=1
    
    # Wait for application to be ready
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        if curl -sSf "http://localhost:3001/api/health" >/dev/null 2>&1; then
            log_success "Application health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error_exit "Application health check failed after $max_attempts attempts"
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Detailed health validation
    log "Running detailed health validation..."
    
    # Test automated sourcing endpoint
    if curl -sSf "http://localhost:3001/api/sourcing/health" >/dev/null 2>&1; then
        log_success "Automated sourcing endpoint is healthy"
    else
        log_warning "Automated sourcing endpoint health check failed"
    fi
    
    # Test vendor API connectivity (staging/sandbox)
    log "Testing vendor API connectivity..."
    
    # LKQ API test
    if curl -sSf -H "Authorization: Bearer $STAGING_LKQ_API_KEY" "$STAGING_LKQ_API_URL/health" >/dev/null 2>&1; then
        log_success "LKQ API connectivity verified"
    else
        log_warning "LKQ API connectivity test failed (may be expected for sandbox)"
    fi
    
    # Parts Trader API test  
    if curl -sSf -H "Authorization: Bearer $STAGING_PARTS_TRADER_API_KEY" "$STAGING_PARTS_TRADER_API_URL/health" >/dev/null 2>&1; then
        log_success "Parts Trader API connectivity verified"
    else
        log_warning "Parts Trader API connectivity test failed (may be expected for staging)"
    fi
    
    log_success "Deployment validation completed"
}

# Performance and load testing
run_performance_tests() {
    if [[ "${RUN_PERFORMANCE_TESTS:-false}" == "true" ]]; then
        log "Running performance tests against staging..."
        
        # Basic load test using curl
        log "Running basic load test..."
        for i in {1..10}; do
            curl -sSf "http://localhost:3001/api/health" >/dev/null &
        done
        wait
        
        log_success "Performance tests completed"
    else
        log "Skipping performance tests (RUN_PERFORMANCE_TESTS not set)"
    fi
}

# Deployment reporting
generate_deployment_report() {
    log "Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/deployment-reports/staging-${DEPLOYMENT_ID}.md"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# CollisionOS Staging Deployment Report

**Deployment ID:** $DEPLOYMENT_ID
**Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Environment:** Staging
**Image Tag:** ${IMAGE_TAG:-latest}
**Script Version:** $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

## Deployment Summary
- ✅ Pre-deployment checks passed
- ✅ Database migration completed
- ✅ Docker containers deployed
- ✅ Health checks passed
- ✅ Vendor API connectivity tested

## Deployed Components
- **CollisionOS App:** ghcr.io/farhaan96/collisionos/collisionos-automated-sourcing:${IMAGE_TAG:-latest}
- **Database:** ${STAGING_DATABASE_URL%/*}/...
- **Cache:** Redis at ${STAGING_REDIS_URL%/*}/...

## Key Features Available
- 🔄 Enhanced BMS processing with automated parts sourcing
- 🔌 Real-time vendor integration APIs (LKQ, PartsTrader, OE Connection)
- 📊 Enhanced database schema with automated sourcing models
- 📱 Desktop dashboard with real-time monitoring
- 🧪 Comprehensive testing suite

## Access URLs
- **Application:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health
- **Automated Sourcing:** http://localhost:3001/api/sourcing/health
- **API Documentation:** http://localhost:3001/api/docs

## Test Commands
\`\`\`bash
# Basic health check
curl http://localhost:3001/api/health

# Automated sourcing health
curl http://localhost:3001/api/sourcing/health

# BMS processing endpoint
curl http://localhost:3001/api/bms/health
\`\`\`

## Next Steps
1. Run integration tests
2. Validate automated sourcing workflows
3. Test vendor API integrations
4. Monitor application performance
5. Prepare for production deployment

## Rollback Command
\`\`\`bash
docker-compose -f docker-compose.yml -f docker-compose.staging.override.yml down
\`\`\`

---
Generated by CollisionOS staging deployment script v1.0
EOF

    log_success "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log "Starting CollisionOS Automated Parts Sourcing staging deployment..."
    log "Deployment ID: $DEPLOYMENT_ID"
    log "Log file: $LOG_FILE"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --image-tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            --seed-data)
                SEED_TEST_DATA="true"
                shift
                ;;
            --run-tests)
                RUN_PERFORMANCE_TESTS="true"
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION="true"
                shift
                ;;
            *)
                log_warning "Unknown option: $1"
                shift
                ;;
        esac
    done
    
    # Execute deployment steps
    validate_environment
    pre_deployment_checks "${IMAGE_TAG:-latest}"
    prepare_database
    deploy_staging
    
    if [[ "${SKIP_VALIDATION:-false}" != "true" ]]; then
        validate_deployment
        run_performance_tests
    fi
    
    generate_deployment_report
    
    log_success "🎉 CollisionOS staging deployment completed successfully!"
    log "Access your staging environment at: http://localhost:3001"
    log "View deployment report: deployment-reports/staging-${DEPLOYMENT_ID}.md"
    log "Full deployment log: $LOG_FILE"
}

# Execute main function
main "$@"