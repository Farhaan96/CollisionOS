#!/bin/sh

# CollisionOS Docker startup script

set -e

echo "Starting CollisionOS..."

# Initialize database if it doesn't exist
if [ ! -f /app/data/collisionos.db ]; then
    echo "Initializing database..."
    npm run db:migrate
    npm run db:seed
fi

# Start the server
echo "Starting server on port 3001..."
exec node server/index.js