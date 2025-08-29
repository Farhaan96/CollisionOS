#!/bin/bash

# CollisionOS Production Deployment Script
# IMPORTANT: This script requires manual review and approval before use

set -e

echo "🚀 CollisionOS Production Deployment"
echo "===================================="

# Configuration
APP_NAME="collisionos"
DOCKER_IMAGE="collisionos:latest"
CONTAINER_NAME="collisionos-prod"
PORT=3001
BACKUP_DIR="/opt/backups/collisionos"
LOG_DIR="/var/log/collisionos"

# Safety check - require confirmation
echo "⚠️  WARNING: This will deploy to PRODUCTION environment!"
echo "📋 Pre-deployment checklist:"
echo "   □ Database backup completed"
echo "   □ Environment variables configured"
echo "   □ SSL certificates installed"
echo "   □ Monitoring systems ready"
echo "   □ Rollback plan prepared"
echo ""
read -p "Have you completed the checklist above? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled. Complete the checklist first."
    exit 1
fi

# Create necessary directories
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $LOG_DIR

# Backup existing data if container exists
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "📦 Creating backup of existing data..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Backup database
    docker exec $CONTAINER_NAME sqlite3 /app/data/collisionos.db ".backup /tmp/backup.db"
    docker cp $CONTAINER_NAME:/tmp/backup.db $BACKUP_DIR/collisionos_$TIMESTAMP.db
    
    echo "✅ Backup created: $BACKUP_DIR/collisionos_$TIMESTAMP.db"
fi

# Stop existing container
if docker ps | grep -q $CONTAINER_NAME; then
    echo "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME
fi

# Remove existing container
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "🗑️  Removing existing container..."
    docker rm $CONTAINER_NAME
fi

# Pull latest image
echo "⬇️  Pulling latest Docker image..."
docker pull $DOCKER_IMAGE

# Create and start new container
echo "🚀 Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:3001 \
    -v collisionos-data:/app/data \
    -v $LOG_DIR:/app/logs \
    -e NODE_ENV=production \
    -e PORT=3001 \
    --health-cmd="node server/healthcheck.js" \
    --health-interval=30s \
    --health-timeout=3s \
    --health-retries=3 \
    $DOCKER_IMAGE

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker ps | grep -q $CONTAINER_NAME && docker exec $CONTAINER_NAME curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Container is ready and healthy!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Container failed to start properly. Check logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Show deployment status
echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "   • Container: $CONTAINER_NAME"
echo "   • Image: $DOCKER_IMAGE"
echo "   • Port: $PORT"
echo "   • Status: $(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)"
echo "   • Health: $(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME)"
echo ""
echo "🔗 Application URL: http://localhost:$PORT"
echo "📊 Container logs: docker logs $CONTAINER_NAME -f"
echo "🩺 Health check: curl http://localhost:$PORT/api/health"
echo ""
echo "⚠️  Remember to:"
echo "   • Update DNS records if needed"
echo "   • Configure SSL/HTTPS"
echo "   • Update monitoring dashboards"
echo "   • Notify team of deployment"