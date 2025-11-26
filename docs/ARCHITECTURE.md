# Architecture Overview - Aramco Reviews Enterprise

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Mobile Web (PWA)  │  Manager Dashboard  │  Admin Portal        │
│  (React/Next.js)   │  (React/Next.js)    │  (React/Next.js)     │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTPS / WebSocket
┌──────────────▼──────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                  │
│                   (Nginx / Kong / AWS ALB)                      │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                    BACKEND SERVICES (NestJS)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Auth Module    │  │ Reviews API  │  │ Stations API    │   │
│  │  • JWT/OTP      │  │ • Submit     │  │ • CRUD          │   │
│  │  • MFA          │  │ • List       │  │ • List/Filter   │   │
│  │  • RBAC         │  │ • Reply      │  │ • Metrics       │   │
│  └─────────────────┘  └──────────────┘  └─────────────────┘   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Analytics API    │  │ Alerts API   │  │ Admin API       │  │
│  │ • Dashboards     │  │ • Rules      │  │ • Config        │  │
│  │ • Reports        │  │ • Escalate   │  │ • Export        │  │
│  │ • Exports        │  │ • Resolve    │  │ • Audit Logs    │  │
│  └──────────────────┘  └──────────────┘  └─────────────────┘  │
│                                                                  │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                  MESSAGE QUEUE & CACHE LAYER                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐        ┌──────────────────────┐       │
│  │   RabbitMQ Queue    │        │   Redis Cache        │       │
│  │  • reviews.nlu      │        │ • Session cache      │       │
│  │  • reviews.summary  │        │ • Analytics cache    │       │
│  │  • alerts.process   │        │ • Rate limits        │       │
│  └─────────────────────┘        └──────────────────────┘       │
│                                                                  │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│              BACKGROUND WORKERS & PROCESSORS                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  NLU Worker  │  │ Summary      │  │ Alert        │          │
│  │  • Language  │  │ • Aggregate  │  │ • Route      │          │
│  │  • Sentiment │  │ • LLM call   │  │ • Notify     │          │
│  │  • Keywords  │  │ • Store      │  │ • Escalate   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                      DATA & STORAGE LAYER                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │  AWS S3      │  │ Elasticsearch│          │
│  │ • Relational │  │  • Media     │  │  • Full-text │          │
│  │ • ACID       │  │  • Files     │  │  • Search    │          │
│  │ • Backups    │  │  • Backups   │  │  • Analytics │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ OpenAI/      │  │ SendGrid/    │  │ Twilio       │          │
│  │ Anthropic    │  │ SES Email    │  │ SMS          │          │
│  │ (LLM)        │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Google       │  │ Firebase     │  │ Slack/       │          │
│  │ Translate    │  │ Cloud        │  │ Webhooks     │          │
│  │              │  │ Messaging    │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│               MONITORING & OBSERVABILITY                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Prometheus   │  │ Grafana      │  │ Sentry       │          │
│  │ • Metrics    │  │ • Dashboards │  │ • Errors     │          │
│  │ • Alerting   │  │ • Alerts     │  │ • Tracing    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ ELK Stack    │  │ CloudWatch   │                            │
│  │ • Logs       │  │ • AWS Logs   │                            │
│  │ • Analysis   │  │ • Metrics    │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Review Submission Flow

```
User submits review → API Gateway
                      ↓
                   Backend API
                      ↓
         ┌────────────┬────────────┐
         ↓            ↓            ↓
    Validate      Upload Media   Store Review
         ↓            ↓            ↓
    Pass checks   S3 Storage   PostgreSQL
         ↓            ↓            ↓
         └────────────┬────────────┘
                      ↓
              Publish to Queue
                      ↓
         ┌────────────┬────────────┐
         ↓            ↓            ↓
    NLU Worker  Summary Worker  Alert Engine
         ↓            ↓            ↓
    Sentiment   Aggregate     Check Rules
    Keywords    Reviews       ↓
    Translate   LLM Call      Trigger Alert
         ↓            ↓            ↓
    Update DB   Store in DB   Send Notif
         ↓            ↓            ↓
         └────────────┬────────────┘
                      ↓
            Manager Dashboard
                   Updates
```

### 2. Alert Processing Flow

```
Review Created Event
        ↓
  Alert Engine Checks
        ↓
   ┌───┴────┬─────────┐
   ↓        ↓         ↓
Rating   Keyword    Spike
Trigger  Match      Detection
   ↓        ↓         ↓
   └───┬────┴─────────┘
       ↓
Create Alert Record
       ↓
Determine Priority
       ↓
Send Notifications
   ┌───┴────────┬────────────┬─────────┐
   ↓            ↓            ↓         ↓
Email         SMS          Push      Slack
   ↓            ↓            ↓         ↓
SendGrid      Twilio      Firebase   Webhook
   ↓            ↓            ↓         ↓
   └───┬────────┴────────────┴─────────┘
       ↓
Monitor SLA
       ↓
Escalate if needed
       ↓
Create Task
```

### 3. Summary Generation Flow (Async)

```
Nightly Batch Job (e.g., 11 PM)
        ↓
Fetch reviews for period
(e.g., last 30 days)
        ↓
Aggregate by station
        ↓
Calculate metrics:
- Avg rating
- Sentiment distribution
- Top complaints
- Keywords frequency
        ↓
Prepare LLM input:
{
  station_name,
  period,
  total_reviews,
  avg_rating,
  negative_count,
  top_keywords,
  representative_reviews
}
        ↓
Call LLM (OpenAI/Claude)
        ↓
Validate response
        ↓
Store in StationsScorecard
        ↓
Cache in Redis
        ↓
Admin Dashboard
Updates
```

## Key Components

### 1. **Authentication Module**
- JWT token-based authentication
- OTP login for managers
- MFA for admin accounts
- Role-based access control (RBAC)
- Token refresh mechanism
- Session management

### 2. **Reviews Module**
- POST /stations/:id/reviews (multipart form-data)
- GET /stations/:id/reviews (with filters)
- Media upload and processing
- Status tracking (open/resolved/ignored)
- Manager replies
- Moderation queue

### 3. **Analytics Module**
- Real-time dashboards
- Station metrics (rating distribution, trends)
- Regional analytics
- Export functionality (CSV/Excel/PDF)
- Custom report generation
- Data aggregation pipelines

### 4. **Alerts Module**
- Rule engine
- Multiple alert types (rating, keyword, spike)
- Priority assignment
- Notification routing
- SLA tracking
- Escalation workflows

### 5. **AI/ML Pipeline**
- Sentiment analysis
- Keyword extraction
- Language detection & translation
- Summary generation
- Anti-fraud checks

## Technology Decisions

### Why NestJS?
- Built-in dependency injection
- Decorators for clean API design
- Excellent TypeScript support
- Modular architecture
- Great for scalable backend APIs

### Why PostgreSQL?
- ACID compliance for data integrity
- Advanced indexing for analytics queries
- JSON support for flexible data
- Full-text search capabilities
- Proven reliability for enterprise

### Why RabbitMQ?
- Reliable message queuing
- Easy worker scaling
- Message persistence
- Priority queue support
- Dead-letter exchanges for error handling

### Why Redis?
- Fast in-memory caching
- Session management
- Rate limiting
- Pub/Sub for real-time updates
- Analytics metric caching

### Why Next.js?
- Server-side rendering for SEO
- API routes for simple endpoints
- Built-in optimization
- Great developer experience
- Easy deployment options

## Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API servers (auto-scaling)
   - Worker instances scale independently
   - Load balancing across instances
   - Database read replicas for reporting

2. **Caching Strategy**
   - Redis cache for hot data (dashboards, metrics)
   - CDN for static assets
   - Client-side caching with React Query

3. **Database Optimization**
   - Strategic indexing on common filters
   - Materialized views for aggregations
   - Archive old reviews for query performance
   - Connection pooling

4. **Message Queue**
   - Pre-allocate queue infrastructure
   - Worker autoscaling based on queue depth
   - Priority queues for critical alerts

## High Availability

1. **Redundancy**
   - Multiple API server instances
   - Database replication
   - Multi-region deployment option

2. **Failover**
   - Health checks on all services
   - Automatic restart of failed services
   - Load balancer health checks

3. **Backup & Recovery**
   - Daily database backups
   - Point-in-time recovery
   - Media file replication to secondary S3

## Security Architecture

1. **Transport Security**
   - TLS 1.3 for all communications
   - Certificate pinning (optional)

2. **Authentication**
   - JWT with RS256 signing
   - OTP via SMS/Email
   - MFA with TOTP

3. **Authorization**
   - Fine-grained RBAC
   - Resource-level permissions
   - Audit logging of all actions

4. **Data Protection**
   - Encryption at rest (AES-256)
   - PII field encryption
   - Sensitive field masking

5. **Infrastructure**
   - WAF (Web Application Firewall)
   - DDoS protection
   - Regular security scanning
   - Penetration testing

---

**Last Updated:** 2025-11-25
