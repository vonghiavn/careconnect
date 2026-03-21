# CareConnect Deployment Guide

## Development Deployment

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Docker & Docker Compose
- Git

### Quick Setup

```bash
# 1. Clone and enter directory
git clone <repo-url>
cd CareNet

# 2. Run quick start script
bash quickstart.sh

# 3. Update .env with API keys

# 4. Start servers
# Terminal 1:
cd backend && python run.py

# Terminal 2:
cd frontend/public && python -m http.server 8000

# 5. Open http://localhost:8000
```

## Production Deployment on Railway.app

### 1. Prepare Repository

Create `Procfile` in root:
```
web: cd backend && gunicorn -w 4 -b 0.0.0.0:$PORT run.py
```

Add to `requirements.txt`:
```
gunicorn==20.1.0
```

### 2. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables add FLASK_ENV production
railway variables add DATABASE_URL <your-db-url>
railway variables add JWT_SECRET_KEY <your-secret>
railway variables add ANTHROPIC_API_KEY <your-key>
railway variables add FLASK_DEBUG False

# Deploy
railway deploy
```

### 3. Database Setup

```bash
# Create PostgreSQL add-on in Railway dashboard
# Or use managed database

# Set DATABASE_URL environment variable
railway variables add DATABASE_URL postgresql://user:pass@host:5432/db

# Initialize database
railway run python backend/scripts/seed.py
```

## Docker Deployment

### Local Docker Deployment

```bash
# Build image
docker build -t carenet:latest .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f
```

### Production docker-compose.yml

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/carenet_prod
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: carenet_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Kubernetes Deployment

### Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: carenet-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: carenet-backend
  template:
    metadata:
      labels:
        app: carenet-backend
    spec:
      containers:
      - name: carenet
        image: carenet:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: carenet-secrets
              key: database-url
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: carenet-secrets
              key: anthropic-key
```

## Environment Variables

### Development
```env
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=postgresql://carenet_user:carenet_password@localhost:5432/carenet_dev
```

### Production
```env
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db>
JWT_SECRET_KEY=<use-strong-secret>
ANTHROPIC_API_KEY=<your-key>
STRIPE_SECRET_KEY=<your-key>
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
```

## Security Checklist

- [ ] Set strong JWT_SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Use rate limiting on API endpoints
- [ ] Implement CSRF protection
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Monitoring & Logging

### Application Logs
```bash
# View logs
tail -f logs/app.log

# Structured logging
python -m logging.config
```

### Database Monitoring
```bash
# PostgreSQL stats
SELECT * FROM pg_stat_statements;

# Active connections
SELECT count(*) FROM pg_stat_activity;
```

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_email ON users(email);
   CREATE INDEX idx_service_status ON service_requests(status);
   CREATE INDEX idx_user_role ON users(role);
   ```

2. **Caching**
   - Implement Redis caching for frequently accessed data
   - Cache volunteer scores and user profiles

3. **API Optimization**
   - Implement pagination
   - Use query parameters for filtering
   - Add response compression

## Backup & Recovery

### Database Backup
```bash
# Backup PostgreSQL
pg_dump carenet_db > backup.sql

# Restore from backup
psql carenet_db < backup.sql

# Automated backups
0 2 * * * pg_dump carenet_db | gzip > /backups/carenet_$(date +%Y%m%d).sql.gz
```

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql -U carenet_user -d carenet_dev -h localhost

# Check container logs
docker-compose logs postgres
```

### Server Not Starting
```bash
# Check port availability
lsof -i :5000

# Check error logs
tail -f logs/errors.log
```

### Memory Issues
```bash
# Monitor memory usage
docker stats

# Increase limits in docker-compose.yml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 1G
```

## Performance Metrics

Monitor these key metrics:

- **API Response Time**: Target < 200ms
- **Database Query Time**: Target < 100ms
- **Error Rate**: Target < 0.1%
- **Uptime**: Target > 99.9%
- **User Concurrent Sessions**: Current capacity

## Maintenance Schedule

- Daily: Check error logs, monitor uptime
- Weekly: Review performance metrics, database size
- Monthly: Security audit, dependency updates
- Quarterly: Full system review, capacity planning

---

For more information, see [README.md](README.md)
