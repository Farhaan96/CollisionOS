# CollisionOS Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### ✅ Code Quality & Testing
- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing (`npm run test:integration`)
- [ ] E2E tests passing (`npm run test:playwright`)
- [ ] ESLint issues resolved (`npm run lint`)
- [ ] TypeScript compilation clean (`npm run typecheck`)
- [ ] Production build completes successfully (`npm run build`)
- [ ] Bundle analysis reviewed (`npm run build:analyze`)
- [ ] Code review completed and approved
- [ ] Security audit passed (`npm audit`)

### 🔐 Security Configuration
- [ ] New JWT secret generated (64 bytes)
  ```bash
  openssl rand -hex 64
  ```
- [ ] New session secret generated (32 bytes)
  ```bash
  openssl rand -hex 32
  ```
- [ ] Database passwords updated
- [ ] All API keys configured
- [ ] SSL certificates obtained and validated
- [ ] Security headers configured in nginx
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured appropriately
- [ ] All development/debug flags disabled

### 🗄️ Database Configuration
- [ ] Production PostgreSQL database created
- [ ] Database user and permissions configured
- [ ] Database connection string tested
- [ ] Migrations tested in staging
- [ ] Backup strategy implemented
- [ ] Database performance tuning applied
- [ ] Connection pooling configured

### 🐳 Infrastructure Setup
- [ ] Docker installed and configured
- [ ] Docker Compose files reviewed
- [ ] Production environment variables configured
- [ ] Volume mounts configured for data persistence
- [ ] Network configuration validated
- [ ] Resource limits set appropriately
- [ ] Health checks configured
- [ ] Restart policies configured

### 🌐 Network & DNS
- [ ] Domain name configured
- [ ] DNS records pointing to production server
- [ ] SSL certificates installed and tested
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured (if applicable)
- [ ] Firewall rules configured
- [ ] Port configuration verified

### 📊 Monitoring & Logging
- [ ] Error tracking configured (Sentry)
- [ ] Application monitoring set up
- [ ] Log aggregation configured
- [ ] Health check endpoints tested
- [ ] Alerting rules configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured

---

## 🚀 Deployment Steps

### 1. Final Pre-deployment Verification
```bash
# Run full test suite
npm test
npm run test:integration
npm run test:playwright

# Verify build
npm run build

# Security audit
npm audit --audit-level moderate

# Type check
npm run typecheck
```

### 2. Environment Configuration
```bash
# Copy production environment file
cp .env.production .env

# Verify all secrets are updated
grep -E "(CHANGE_THIS|GENERATE_|your-)" .env
# Should return no results

# Test database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? 'DB Error:' + err : 'DB Connected:', res.rows[0]);
  process.exit(err ? 1 : 0);
});
"
```

### 3. Docker Deployment

#### Option A: Production Docker Compose
```bash
# Build and deploy with production compose
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

#### Option B: Individual Container Deployment
```bash
# Build production image
docker build -t collisionos:latest .

# Deploy container
docker run -d \
  --name collisionos-prod \
  --restart unless-stopped \
  -p 3001:3001 \
  -v collisionos-data:/app/data \
  -v collisionos-logs:/app/logs \
  --env-file .env.production \
  collisionos:latest

# Verify container
docker ps
docker logs collisionos-prod
```

### 4. Database Setup
```bash
# Run production migrations
docker exec collisionos-prod npm run db:migrate

# Seed initial data (if needed)
docker exec collisionos-prod npm run db:seed

# Verify database
docker exec collisionos-prod node -e "
const db = require('./server/database');
db.query('SELECT COUNT(*) FROM users').then(console.log);
"
```

### 5. Health Verification
```bash
# Check application health
curl -f http://localhost:3001/api/health

# Check detailed health
curl http://localhost:3001/api/health/detailed

# Verify all endpoints
curl -f http://localhost:3001/api/auth/status
curl -f http://localhost:3001/api/customers
```

### 6. SSL & Reverse Proxy Setup
```bash
# Deploy nginx reverse proxy
docker run -d \
  --name collisionos-nginx \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro \
  -v ./nginx/ssl:/etc/nginx/ssl:ro \
  --link collisionos-prod \
  nginx:alpine

# Test HTTPS
curl -f https://collisionos.com/api/health
```

---

## ✅ Post-Deployment Verification

### Application Testing
- [ ] Login/authentication working
- [ ] Dashboard loading correctly
- [ ] Customer management functional
- [ ] Job creation and management working
- [ ] BMS import functionality tested
- [ ] Photo upload working
- [ ] Reporting features functional
- [ ] Real-time updates working
- [ ] All critical user workflows tested

### Performance Testing
- [ ] Page load times acceptable (< 3s)
- [ ] Database queries performing well
- [ ] File uploads working efficiently
- [ ] Memory usage within limits
- [ ] CPU usage reasonable under load
- [ ] Disk I/O performance adequate

### Security Testing
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Authentication required for protected routes
- [ ] SQL injection protection verified
- [ ] XSS protection working
- [ ] CSRF protection enabled
- [ ] Rate limiting functional

### Monitoring Verification
- [ ] Error tracking receiving events
- [ ] Performance monitoring active
- [ ] Log aggregation working
- [ ] Health checks reporting
- [ ] Alerting rules triggered correctly
- [ ] Backup jobs scheduled and working

---

## 🔧 Troubleshooting Guide

### Common Issues

#### Application Won't Start
```bash
# Check container logs
docker logs collisionos-prod -f

# Check environment variables
docker exec collisionos-prod env | grep -E "(NODE_ENV|PORT|DATABASE)"

# Test database connection
docker exec collisionos-prod node -e "
const db = require('./server/database');
db.authenticate().then(() => console.log('DB OK')).catch(console.error);
"
```

#### Database Connection Issues
```bash
# Verify PostgreSQL is running
docker exec collisionos-postgres-prod pg_isready

# Check connection string
echo $DATABASE_URL

# Test direct connection
docker exec collisionos-postgres-prod psql -U collisionos_prod -d collisionos_prod -c "SELECT 1;"
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect collisionos.com:443 -servername collisionos.com

# Check nginx configuration
docker exec collisionos-nginx nginx -t
```

### Performance Issues
```bash
# Check resource usage
docker stats collisionos-prod

# Analyze slow queries
docker exec collisionos-postgres-prod psql -U collisionos_prod -d collisionos_prod -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"

# Check application metrics
curl http://localhost:3001/api/metrics
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Application health status
- [ ] Error rates within normal range
- [ ] Response times acceptable
- [ ] Database performance metrics
- [ ] Disk space availability
- [ ] Backup completion status

### Weekly Checks
- [ ] Security updates available
- [ ] Database cleanup and optimization
- [ ] Log rotation and cleanup
- [ ] Performance trend analysis
- [ ] Capacity planning review

### Monthly Checks
- [ ] SSL certificate expiration dates
- [ ] Dependency security audit
- [ ] Backup restoration testing
- [ ] Disaster recovery planning
- [ ] Performance optimization review

---

## 🚨 Emergency Procedures

### Application Down
1. Check container status: `docker ps`
2. Check logs: `docker logs collisionos-prod`
3. Restart container: `docker restart collisionos-prod`
4. If persistent, rollback: `./scripts/rollback.sh`

### Database Issues
1. Check PostgreSQL status: `docker exec collisionos-postgres-prod pg_isready`
2. Check disk space: `df -h`
3. Review slow queries: Check pg_stat_statements
4. If corrupted, restore from backup

### Performance Degradation
1. Check resource usage: `docker stats`
2. Review application logs for errors
3. Check database performance
4. Scale resources if needed
5. Optimize queries if identified

### Security Incident
1. Isolate affected systems
2. Review access logs
3. Update credentials if compromised
4. Apply security patches
5. Document incident for review

---

## 📞 Support Contacts

- **System Administrator**: admin@collisionos.com
- **DevOps Team**: devops@collisionos.com  
- **Security Team**: security@collisionos.com
- **Emergency Hotline**: +1-555-SUPPORT

---

## 📝 Deployment Log Template

```
Date: __________
Deployed By: __________
Version/Commit: __________
Environment: Production

Pre-deployment Checks:
□ Code quality verified
□ Security configuration updated
□ Database migrations tested
□ Infrastructure ready

Deployment Steps:
□ Environment configured
□ Docker containers deployed
□ Database migrations run
□ Health checks passed
□ SSL certificates verified

Post-deployment Verification:
□ Application functionality tested
□ Performance verified
□ Monitoring configured
□ Team notified

Issues Encountered:
__________

Resolution:
__________

Rollback Plan:
□ Backup created before deployment
□ Rollback procedure tested
□ Emergency contacts notified

Sign-off:
Developer: __________
DevOps: __________  
QA: __________
```

---

**🎉 Deployment Complete!**

Remember to:
- Document any issues or deviations from this checklist
- Update monitoring dashboards with new deployment
- Schedule post-deployment review meeting
- Plan for next release cycle