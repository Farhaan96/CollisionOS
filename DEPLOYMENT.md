# CollisionOS Automated Parts Sourcing - Enterprise Deployment Guide

This guide provides comprehensive instructions for deploying the CollisionOS automated parts sourcing system with enterprise-grade reliability, scalability, and observability for collision repair operations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- SSL certificates (for production)

### Development Environment

```bash
# Clone repository
git clone <repository-url>
cd CollisionOS

# Install dependencies
npm ci --legacy-peer-deps

# Setup environment
cp env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

### Staging Deployment

```bash
# Deploy to staging
./deploy/staging-deploy.sh

# Access staging environment
curl http://localhost:3002/api/health
```

### Production Deployment

```bash
# IMPORTANT: Review and complete pre-deployment checklist
./deploy/production-deploy.sh
```

## 🏗️ Architecture Overview

### Application Stack

- **Frontend**: React 18 + Material-UI + Electron
- **Backend**: Node.js + Express + SQLite/Supabase
- **Database**: SQLite (primary) + Supabase (optional)
- **Container**: Docker + Alpine Linux
- **CI/CD**: GitHub Actions

### Port Configuration

- **Development**: 3000 (React), 3001 (Backend)
- **Staging**: 3002
- **Production**: 3001

## 🐳 Docker Deployment

### Build Docker Image

```bash
# Build production image
docker build -t collisionos:latest .

# Build staging image
docker build -t collisionos:staging .
```

### Run with Docker

```bash
# Production
docker run -d \
  --name collisionos-prod \
  -p 3001:3001 \
  -v collisionos-data:/app/data \
  -e NODE_ENV=production \
  collisionos:latest

# Staging
docker run -d \
  --name collisionos-staging \
  -p 3002:3001 \
  -v collisionos-staging-data:/app/data \
  -e NODE_ENV=staging \
  collisionos:staging
```

### Docker Compose

```yaml
version: '3.8'

services:
  collisionos:
    build: .
    ports:
      - '3001:3001'
    volumes:
      - collisionos-data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'node', 'server/healthcheck.js']
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  collisionos-data:
```

## 🔐 Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret

# Database
DATABASE_URL=./data/collisionos.db

# Supabase (Optional)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Features
SUPABASE_ENABLED=false
ENABLE_REALTIME=true
ENABLE_ANALYTICS=true
```

### Production Secrets

**⚠️ CRITICAL: Generate new secrets for production**

```bash
# Generate JWT secret
openssl rand -hex 64

# Generate session secret
openssl rand -hex 32
```

## 📋 Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] ESLint issues resolved (`npm run lint`)
- [ ] TypeScript compilation clean (`npm run typecheck`)
- [ ] Build completes successfully (`npm run build`)

### Security

- [ ] Environment secrets generated
- [ ] Database connections secured
- [ ] SSL certificates installed
- [ ] Security audit passed (`npm audit`)

### Infrastructure

- [ ] Server resources adequate
- [ ] Database backup strategy implemented
- [ ] Monitoring systems configured
- [ ] Log aggregation setup

### Production Environment

- [ ] DNS records configured
- [ ] Load balancer configured
- [ ] CDN setup (if applicable)
- [ ] Reverse proxy configured (nginx/Apache)

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Test Stage**: ESLint, TypeScript check, Unit tests
2. **Build Stage**: React build, Electron packaging
3. **Security Stage**: npm audit, dependency check
4. **Deploy Stage**: Staging/Production deployment

### Deployment Triggers

- **Staging**: Push to `develop` branch
- **Production**: Push to `main` branch (requires manual approval)
- **Releases**: Git tags starting with `v*`

### Manual Deployment

```bash
# Deploy specific version
git checkout v1.2.3
./deploy/production-deploy.sh

# Rollback to previous version
git checkout v1.2.2
./deploy/production-deploy.sh
```

## 🖥️ Desktop App Deployment

### Electron Packaging

```bash
# Build for current platform
npm run electron-pack

# Build for all platforms (requires additional setup)
npm run electron-pack -- --publish=never
```

### Distribution

Built applications are available in `dist/` directory:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` portable

## 📊 Monitoring & Health Checks

### Health Endpoints

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/metrics` - Application metrics

### Container Health Check

```bash
# Check container health
docker ps
docker inspect collisionos-prod | grep Health

# View health check logs
docker logs collisionos-prod
```

### Application Logs

```bash
# View real-time logs
docker logs collisionos-prod -f

# Export logs
docker logs collisionos-prod > collisionos.log
```

## 🔄 Backup & Recovery

### Database Backup

```bash
# Create backup
docker exec collisionos-prod sqlite3 /app/data/collisionos.db ".backup /tmp/backup.db"
docker cp collisionos-prod:/tmp/backup.db ./backup-$(date +%Y%m%d).db

# Restore backup
docker cp ./backup.db collisionos-prod:/tmp/restore.db
docker exec collisionos-prod sqlite3 /app/data/collisionos.db ".restore /tmp/restore.db"
```

### Full System Backup

```bash
# Backup data volume
docker run --rm -v collisionos-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .

# Restore data volume
docker run --rm -v collisionos-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data
```

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Container Issues

```bash
# Check container logs
docker logs collisionos-prod

# Access container shell
docker exec -it collisionos-prod /bin/sh

# Restart container
docker restart collisionos-prod
```

#### Database Issues

```bash
# Check database file
docker exec collisionos-prod ls -la /app/data/

# Run database migrations
docker exec collisionos-prod npm run db:migrate
```

### Performance Tuning

```bash
# Analyze bundle size
npm run build:analyze

# Monitor resource usage
docker stats collisionos-prod
```

## 🔒 Security Considerations

### Production Security

- Use HTTPS only in production
- Implement rate limiting
- Configure CORS properly
- Regular security updates
- Monitor for vulnerabilities

### Database Security

- Regular backups
- Access control
- Encryption at rest
- Audit logging

## 📞 Support

### Deployment Support

- Check deployment logs first
- Verify environment configuration
- Test health endpoints
- Review container status

### Rollback Procedure

1. Stop current container
2. Restore from backup
3. Deploy previous version
4. Verify functionality
5. Update monitoring systems

---

**⚠️ Important**: Never deploy directly to production without testing in staging first. Always have a rollback plan ready.
