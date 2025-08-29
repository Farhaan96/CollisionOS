#!/bin/bash

# CollisionOS Staging Deployment Script

set -e

echo "🧪 CollisionOS Staging Deployment"
echo "================================="

# Configuration
APP_NAME="collisionos-staging"
DOCKER_IMAGE="collisionos:staging"
CONTAINER_NAME="collisionos-staging"
PORT=3002
LOG_DIR="/var/log/collisionos-staging"

# Create necessary directories
sudo mkdir -p $LOG_DIR

# Stop existing staging container
if docker ps | grep -q $CONTAINER_NAME; then
    echo "🛑 Stopping existing staging container..."
    docker stop $CONTAINER_NAME
fi

# Remove existing staging container
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "🗑️  Removing existing staging container..."
    docker rm $CONTAINER_NAME
fi

# Build staging image
echo "🔨 Building staging Docker image..."
docker build -t $DOCKER_IMAGE .

# Create and start staging container
echo "🚀 Starting staging container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:3001 \
    -v collisionos-staging-data:/app/data \
    -v $LOG_DIR:/app/logs \
    -e NODE_ENV=staging \
    -e PORT=3001 \
    --health-cmd="node server/healthcheck.js" \
    --health-interval=30s \
    --health-timeout=3s \
    --health-retries=3 \
    $DOCKER_IMAGE

# Wait for container to be ready
echo "⏳ Waiting for staging container to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker ps | grep -q $CONTAINER_NAME && docker exec $CONTAINER_NAME curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Staging container is ready and healthy!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Staging container failed to start properly. Check logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Run staging tests
echo "🧪 Running staging environment tests..."
# Add your staging tests here

echo ""
echo "🎉 Staging deployment completed successfully!"
echo ""
echo "📊 Staging Summary:"
echo "   • Container: $CONTAINER_NAME"
echo "   • Image: $DOCKER_IMAGE"
echo "   • Port: $PORT"
echo "   • Status: $(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)"
echo "   • Health: $(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME)"
echo ""
echo "🔗 Staging URL: http://localhost:$PORT"
echo "📊 Container logs: docker logs $CONTAINER_NAME -f"
echo "🩺 Health check: curl http://localhost:$PORT/api/health"