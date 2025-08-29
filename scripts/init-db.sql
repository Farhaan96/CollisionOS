-- CollisionOS Database Initialization Script
-- Development Environment

-- Create development database if not exists
CREATE DATABASE IF NOT EXISTS collisionos_dev;

-- Create test database for testing
CREATE DATABASE IF NOT EXISTS collisionos_test;

-- Create user for development
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'collisionos') THEN
        CREATE USER collisionos WITH PASSWORD 'collisionos_dev_password';
    END IF;
END
$$;

-- Grant privileges for development database
GRANT ALL PRIVILEGES ON DATABASE collisionos_dev TO collisionos;
GRANT ALL PRIVILEGES ON DATABASE collisionos_test TO collisionos;

-- Connect to development database
\c collisionos_dev;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO collisionos;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO collisionos;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO collisionos;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO collisionos;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO collisionos;