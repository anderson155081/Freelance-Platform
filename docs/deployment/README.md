# Deployment Guide

This document provides detailed instructions for deploying the Freelance Platform in different environments.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git
- At least 4GB RAM
- 10GB free disk space

## Environment Setup

### Development Environment

The development environment includes hot reloading and development tools:

```bash
# Clone the repository
git clone https://github.com/your-username/freelance-platform.git
cd freelance-platform

# Copy environment variables
cp .env.example .env

# Start development environment
docker-compose -f docker-compose.dev.yml up -d
```

**Services Available:**
- Frontend: http://localhost:3000 (React with hot reload)
- API: http://localhost:8080 (Go with air for hot reload)
- Database: localhost:5432 (PostgreSQL)
- Redis: localhost:6379
- Adminer: http://localhost:8081 (Database management)
- Redis Commander: http://localhost:8082 (Redis management)

### Production Environment

The production environment is optimized for performance:

```bash
# Start production environment
docker-compose up -d
```

**Services Available:**
- Application: http://localhost (Nginx reverse proxy)
- All services are internal except the main application

### Test Environment

For running automated tests:

```bash
# Run tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USER=freelance_user
DB_PASSWORD=your_secure_password
DB_NAME=freelance_platform

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE_HOURS=24

# Application Configuration
APP_ENV=production
API_PORT=8080
FRONTEND_URL=http://localhost:3000

# Third-party Services (Optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
CLOUDINARY_URL=cloudinary://...
```

## Database Management

### Initial Setup

```bash
# Run migrations
docker-compose exec api go run cmd/migrate/main.go

# Seed with sample data
docker-compose exec api go run cmd/seed/main.go
```

### Reset Database

```bash
# Reset and recreate all tables
docker-compose exec api go run cmd/migrate/main.go -reset
```

### Backup and Restore

```bash
# Backup database
docker-compose exec db pg_dump -U freelance_user freelance_platform > backup.sql

# Restore database
docker-compose exec -T db psql -U freelance_user freelance_platform < backup.sql
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
```

### Health Checks

```bash
# Check service status
docker-compose ps

# Check API health
curl http://localhost:8080/api/health

# Check database connection
docker-compose exec db psql -U freelance_user -d freelance_platform -c "SELECT 1;"
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3000
   lsof -i :8080
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Failed**
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Restart database
   docker-compose restart db
   ```

3. **Frontend Build Errors**
   ```bash
   # Rebuild frontend
   docker-compose build frontend
   
   # Clear node modules
   docker-compose exec frontend rm -rf node_modules
   docker-compose exec frontend npm install
   ```

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Use connection pooling
   - Regular VACUUM and ANALYZE

2. **Frontend Optimization**
   - Enable Gzip compression
   - Use CDN for static assets
   - Implement code splitting

3. **Backend Optimization**
   - Use Redis for caching
   - Implement rate limiting
   - Optimize database queries

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong passwords and secrets
   - Rotate JWT secrets regularly

2. **Database Security**
   - Use strong database passwords
   - Limit database access
   - Regular security updates

3. **Application Security**
   - Enable HTTPS in production
   - Implement rate limiting
   - Regular dependency updates

## Scaling

### Horizontal Scaling

For high-traffic scenarios:

1. **Load Balancer**
   - Use Nginx or HAProxy
   - Multiple API instances
   - Session affinity for WebSocket

2. **Database Scaling**
   - Read replicas
   - Connection pooling
   - Database sharding

3. **Caching Strategy**
   - Redis cluster
   - CDN for static assets
   - Application-level caching

### Monitoring

Recommended monitoring tools:
- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Application Performance Monitoring (APM)

## Cloud Deployment

### AWS Deployment

1. **ECS/Fargate**
   - Use AWS ECS for container orchestration
   - RDS for PostgreSQL
   - ElastiCache for Redis

2. **EKS (Kubernetes)**
   - Use Kubernetes manifests
   - Helm charts for deployment
   - Auto-scaling capabilities

### Google Cloud Platform

1. **Cloud Run**
   - Serverless container deployment
   - Cloud SQL for PostgreSQL
   - Memorystore for Redis

### DigitalOcean

1. **App Platform**
   - Simple container deployment
   - Managed databases
   - Built-in monitoring

## Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery
   - Cross-region replication

2. **File Backups**
   - User uploaded files
   - Application logs
   - Configuration files

3. **Disaster Recovery**
   - Recovery time objective (RTO)
   - Recovery point objective (RPO)
   - Regular disaster recovery testing 