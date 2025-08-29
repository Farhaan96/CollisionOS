-- CollisionOS Database Initialization Script
-- Production Environment

-- Create production database if not exists
SELECT 'CREATE DATABASE collisionos_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'collisionos_prod')\gexec

-- Connect to production database
\c collisionos_prod;

-- Create extensions for production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create production user if not exists (will be created by environment variables)
-- User creation is handled by Docker environment variables

-- Set up database settings for production
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Performance tuning for production
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Security settings
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET log_min_messages = warning;

-- Apply configuration (requires restart)
SELECT pg_reload_conf();