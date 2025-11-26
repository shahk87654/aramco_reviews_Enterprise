# Deployment Guide - Aramco Reviews Enterprise

## Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] Secrets configured in environment
- [ ] Database backups taken
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Load testing completed
- [ ] Security scan passed

## Environment Setup

### 1. Production Environment Variables

Create `.env.production`:

```bash
# Core
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# Database (managed, e.g., RDS)
DB_HOST=aramco-reviews-prod.cxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}
DB_NAME=aramco_reviews_prod
DB_SSL=true

# Redis (managed, e.g., ElastiCache)
REDIS_HOST=aramco-cache.xxxxxx.ng.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# RabbitMQ (managed)
RABBITMQ_URL=amqps://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq.aramcoreview.com:5671

# JWT
JWT_SECRET=${JWT_SECRET_PROD}
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET_PROD}

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${AWS_KEY}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET}
AWS_S3_BUCKET=aramco-reviews-prod-media

# LLM
OPENAI_API_KEY=${OPENAI_KEY}
OPENAI_MODEL=gpt-3.5-turbo

# Email
SENDGRID_API_KEY=${SENDGRID_KEY}
FROM_EMAIL=alerts@aramcoreview.com

# SMS
TWILIO_ACCOUNT_SID=${TWILIO_SID}
TWILIO_AUTH_TOKEN=${TWILIO_TOKEN}

# Monitoring
SENTRY_DSN=${SENTRY_DSN_PROD}
SENTRY_ENVIRONMENT=production
```

### 2. Secrets Management (AWS Secrets Manager)

```bash
# Store secrets
aws secretsmanager create-secret --name aramco/prod/db-password \
  --secret-string "your-secure-password"

aws secretsmanager create-secret --name aramco/prod/jwt-secret \
  --secret-string "your-jwt-secret"

# Retrieve in application
const secretsManager = new SecretsManager();
const dbPassword = await secretsManager.getSecretValue('aramco/prod/db-password');
```

## Docker Deployment

### 1. Build Images

```bash
# Backend
docker build -f backend/Dockerfile -t aramco-reviews/backend:1.0.0 ./backend
docker tag aramco-reviews/backend:1.0.0 aramco-reviews/backend:latest

# Frontend
docker build -f frontend/Dockerfile -t aramco-reviews/frontend:1.0.0 ./frontend
docker tag aramco-reviews/frontend:1.0.0 aramco-reviews/frontend:latest

# Workers
docker build -f workers/Dockerfile -t aramco-reviews/workers:1.0.0 ./workers
docker tag aramco-reviews/workers:1.0.0 aramco-reviews/workers:latest

# Push to registry
docker push aramco-reviews/backend:1.0.0
docker push aramco-reviews/frontend:1.0.0
docker push aramco-reviews/workers:1.0.0
```

### 2. Docker Compose Deployment

```bash
# Development/Staging
docker-compose -f infrastructure/docker-compose.yml up -d

# Check logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Kubernetes Deployment

### 1. Kubernetes Manifests

Create `infrastructure/k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aramco-reviews-backend
  namespace: aramco
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: backend
        image: aramco-reviews/backend:1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: aramco
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: backend
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: aramco
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aramco-reviews-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 2. Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace aramco

# Create secrets
kubectl create secret generic db-secret \
  --from-literal=host=postgresql.service.local \
  --from-literal=password=secret123 \
  -n aramco

# Apply manifests
kubectl apply -f infrastructure/k8s/ -n aramco

# Check rollout status
kubectl rollout status deployment/aramco-reviews-backend -n aramco

# View pods
kubectl get pods -n aramco
```

## Database Migration

### 1. Pre-Migration

```bash
# Backup production database
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d).sql

# Verify backup
psql -h $DB_HOST -U $DB_USER $DB_NAME < backup.sql
```

### 2. Run Migrations

```bash
# In container
docker exec aramco-backend npm run migrate:latest

# Or locally
NODE_ENV=production npm run migrate:latest

# Verify migration
npm run migrate:status
```

### 3. Rollback Plan

```bash
# If migration fails, rollback
npm run migrate:revert

# Or restore from backup
psql -h $DB_HOST -U $DB_USER $DB_NAME < backup.sql
```

## Deployment Process

### 1. Staging Deployment

```bash
# Merge to develop branch
git merge feature/new-feature develop

# GitHub Actions triggers staging deployment
# Check: https://github.com/your-org/aramco-reviews/actions

# Run smoke tests
npm run test:e2e:staging

# Monitor: https://staging.aramcoreview.com
```

### 2. Production Deployment

```bash
# Create release PR: develop -> main
# Requires code review approval

# Once merged, GitHub Actions triggers production deployment
# Canary: deploy to 10% of traffic first
# Monitor for 15 minutes
# Roll forward: deploy to 100% of traffic

# Deployment status
kubectl rollout status deployment/aramco-reviews-backend -n aramco

# View current revision
kubectl rollout history deployment/aramco-reviews-backend -n aramco
```

### 3. Rollback Procedure

```bash
# If issues detected
kubectl rollout undo deployment/aramco-reviews-backend -n aramco

# To specific revision
kubectl rollout undo deployment/aramco-reviews-backend --to-revision=2 -n aramco

# Verify rollback
kubectl get pods -n aramco
```

## Health Checks

### 1. Endpoint Checks

```bash
# Application health
curl https://api.aramcoreview.com/health

# Database connectivity
curl https://api.aramcoreview.com/health/db

# Cache connectivity
curl https://api.aramcoreview.com/health/redis

# Queue connectivity
curl https://api.aramcoreview.com/health/queue
```

### 2. Monitoring Dashboard

- **Grafana:** https://monitoring.aramcoreview.com
- **Prometheus:** https://metrics.aramcoreview.com
- **CloudWatch:** AWS Console

### 3. Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API Latency (95th) | 200ms | 500ms |
| Error Rate | 1% | 5% |
| Database CPU | 60% | 80% |
| Memory Usage | 70% | 85% |
| Queue Depth | 1000 | 5000 |

## Scaling

### 1. Horizontal Scaling

```bash
# Increase replicas
kubectl scale deployment aramco-reviews-backend --replicas=5 -n aramco

# Auto-scaling is configured via HPA (see K8s manifests above)
# Scales based on CPU and memory utilization
```

### 2. Database Scaling

```bash
# AWS RDS: Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier aramco-reviews-prod-replica \
  --source-db-instance-identifier aramco-reviews-prod

# Update read-heavy queries to use replica
```

### 3. Cache Scaling

```bash
# AWS ElastiCache: Change node type
aws elasticache modify-cache-cluster \
  --cache-cluster-id aramco-cache \
  --cache-node-type cache.r6g.xlarge
```

## Monitoring & Logging

### 1. Prometheus Metrics

```bash
# Query metrics
curl "http://prometheus:9090/api/v1/query?query=rate(http_requests_total[5m])"

# Key metrics:
# - http_requests_total
# - http_request_duration_seconds
# - db_query_duration_seconds
# - cache_hits_total
# - llm_calls_total
# - alerts_generated_total
```

### 2. Logs (ELK Stack)

```bash
# View logs in Kibana
# Dashboard: https://logs.aramcoreview.com

# Common queries:
# error logs: level:error
# slow queries: query_time:>1000
# failed alerts: component:alerting status:failed
```

### 3. Error Tracking (Sentry)

```bash
# View errors
# Dashboard: https://sentry.io/organizations/aramco/

# Create alert for:
# - New errors
# - Error spike (5x normal rate)
# - Specific error types
```

## Performance Optimization

### 1. Database

```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM reviews WHERE station_id = 'uuid';

# Create indices on slow queries
CREATE INDEX idx_reviews_station_date 
ON reviews(station_id, created_at DESC);

# Vacuum and analyze
VACUUM ANALYZE reviews;
```

### 2. Cache Strategy

```bash
# Cache endpoints for 5 minutes
GET /analytics/overview -> Cache-Control: max-age=300

# Cache station data for 1 hour
GET /stations/:id -> Cache-Control: max-age=3600

# Invalidate on update
POST /reviews/:id -> Invalidate /stations/:id cache
```

### 3. CDN

```bash
# CloudFront for static assets
# Distribution: d123456.cloudfront.net

# Cache policy: 1 year for immutable assets
# Cache policy: 1 hour for HTML
```

## Runbook

### Alert: API Error Rate > 5%

1. Check Sentry for error patterns
2. Check database connectivity
3. Check external service status (OpenAI, SendGrid, etc.)
4. Scale up if needed: `kubectl scale deployment aramc
o-reviews-backend --replicas=10 -n aramco`
5. Investigate logs: grep "error" logs.txt

### Alert: Database CPU > 80%

1. Check slow queries: `SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10`
2. Optimize query or add index
3. Scale database vertically: RDS instance type change
4. Or scale horizontally: read replica

### Alert: Message Queue Depth > 5000

1. Check worker status: `kubectl get pods -n aramco | grep worker`
2. Scale workers: `kubectl scale deployment aramco-reviews-worker --replicas=5 -n aramco`
3. Check for failed messages: check DLQ
4. Monitor queue processing rate

---

**Last Updated:** 2025-11-25
