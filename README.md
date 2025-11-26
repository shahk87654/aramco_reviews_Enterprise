# Aramco Reviews Enterprise App

An advanced customer feedback collection, moderation, and analytics platform for Aramco service stations with AI-powered sentiment analysis, real-time alerts, and comprehensive dashboards.

## 🎯 Project Overview

**Mission:** Build an intelligent feedback system that collects structured and unstructured reviews from customers, provides actionable insights to station managers and headquarters, detects issues in real-time, and suggests improvements through AI analysis.

**Key Features:**
- 📝 Structured review submission (1-5 stars + categories)
- 🎬 Media attachments (photos/videos)
- 🤖 AI sentiment analysis & summaries
- 🚨 Real-time negative review alerts
- 📊 Interactive dashboards for managers & admins
- 🔐 Role-based access control (Customer, Manager, Regional Manager, Admin)
- 📈 Advanced analytics & trend detection
- 🌍 Multi-language support (auto-translate Urdu → English)
- 📱 Mobile-responsive & PWA support
- 🔗 Integration with Aramco X GO & external systems

## 📂 Project Structure

```
aramco-reviews-enterprise/
├── backend/                    # Node.js/NestJS API server
│   ├── src/
│   │   ├── auth/              # Authentication & authorization
│   │   ├── reviews/           # Review management
│   │   ├── stations/          # Station management
│   │   ├── analytics/         # Analytics & reporting
│   │   ├── alerts/            # Alert system
│   │   ├── common/            # Shared utilities
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React/Next.js dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Next.js pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API clients
│   │   └── styles/            # TailwindCSS config
│   ├── package.json
│   └── next.config.js
├── workers/                    # Background processors (NLU, summarization)
│   ├── src/
│   │   ├── sentiment/         # Sentiment analysis
│   │   ├── summarizer/        # AI summarization
│   │   ├── translator/        # Language translation
│   │   └── queue/             # Message queue consumer
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/             # Docker, K8s, configs
│   ├── docker-compose.yml
│   ├── k8s/
│   ├── nginx.conf
│   └── monitoring/
├── .github/
│   ├── workflows/             # CI/CD pipelines
│   └── copilot-instructions.md
├── docs/                       # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DATABASE.md
│   └── AI_PROMPTS.md
├── package.json               # Root workspace config
├── README.md
└── .env.example
```

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **Cache:** Redis
- **Queue:** RabbitMQ / AWS SQS
- **Storage:** AWS S3
- **Auth:** JWT + OTP

### Frontend
- **Framework:** Next.js (React + TypeScript)
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **State Management:** React Query / Redux Toolkit
- **Forms:** React Hook Form

### AI & ML
- **LLM:** OpenAI / Anthropic Claude / In-house
- **Sentiment:** Fine-tuned transformer or hosted API
- **Translation:** Google Translate API / Hugging Face
- **Vector DB:** Pinecone / Weaviate (optional)

### DevOps & Monitoring
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes (optional)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack
- **Error Tracking:** Sentry

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd aramco-reviews-enterprise
   npm run setup
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services (Docker):**
   ```bash
   npm run docker:up
   ```

4. **Run migrations:**
   ```bash
   cd backend && npm run migrate:latest
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

### Access Points
- **API:** http://localhost:3000
- **Frontend:** http://localhost:3001
- **Swagger API Docs:** http://localhost:3000/api/docs
- **Grafana:** http://localhost:3002 (user: admin, password: admin)

## 📋 Core Data Models

### Users
- **Fields:** id, name, email, phone, role, password_hash, provider, is_verified, created_at
- **Roles:** Customer, Station Manager, Regional Manager, Admin

### Stations
- **Fields:** id, name, station_code, region_id, city, address, geo_lat, geo_lng, manager_id
- **Relationships:** has_many reviews, alerts, scores

### Reviews
- **Fields:** id, station_id, user_id, rating (1-5), categories[], text, language, sentiment, sentiment_score, ai_summary, status, created_at
- **Processing:** auto-populate sentiment, keywords, summary via worker

### Alerts
- **Fields:** id, review_id, station_id, type, priority, payload, resolved, created_at, resolved_at
- **Types:** negative_rating, keyword_trigger, spike_detection

### StationsScorecard
- **Fields:** id, station_id, period_start, period_end, avg_rating, total_reviews, negative_count, top_complaints, ai_insights

## 🔐 Security & Authentication

- **Transport:** TLS/SSL everywhere
- **Authentication:** JWT tokens + refresh tokens
- **OTP Login:** For station managers
- **MFA:** Required for admin accounts
- **RBAC:** Fine-grained role-based access control
- **Audit Logs:** All actions tracked
- **Data Encryption:** At rest for sensitive fields
- **Rate Limiting:** Per IP, per user, per device
- **Geo-Verification:** Optional location-based validation

## 📊 API Endpoints (MVP)

### Authentication
```
POST   /auth/login                 - Email/password login
POST   /auth/otp-login             - OTP login for managers
POST   /auth/verify-otp            - Verify OTP code
POST   /auth/refresh               - Refresh token
POST   /auth/logout                - Logout
```

### Reviews
```
POST   /stations/:id/reviews       - Submit review (multipart)
GET    /stations/:id/reviews       - List reviews (filterable)
GET    /reviews/:id                - Get review details
POST   /reviews/:id/reply          - Manager reply
PATCH  /reviews/:id/status         - Update status
DELETE /reviews/:id                - Delete review (admin)
```

### Stations
```
GET    /stations                   - List stations
POST   /stations                   - Create station (admin)
GET    /stations/:id               - Get station details
PATCH  /stations/:id               - Update station (admin)
```

### Analytics
```
GET    /analytics/overview?range=30d           - Global KPIs
GET    /analytics/station/:id?range=30d        - Station metrics
GET    /analytics/trends?metric=rating&group=region  - Trends
```

### Alerts & Tasks
```
GET    /alerts                     - List alerts
PATCH  /alerts/:id/resolve         - Mark alert resolved
POST   /tasks                      - Create task
PATCH  /tasks/:id                  - Update task
```

### Admin
```
GET    /admin/reports/export?format=csv&range=30d  - Export data
POST   /admin/alerts/config        - Configure alert rules
GET    /admin/audit-logs           - View audit logs
```

## 🤖 AI Features

### 1. Sentiment Analysis & Keyword Extraction
- Fast text classification (1-3 sec latency)
- Extract sentiment score (0-1)
- Detect critical keywords (dirty, leak, rude, etc.)
- Fuzzy matching for synonyms
- Language detection (Urdu, Arabic, English)

### 2. Summaries & Recommendations
- Weekly/monthly station summaries (80-100 words)
- Main issues & improvement suggestions
- Aggregate reviews into structured insights
- Professional, neutral tone
- Actionable recommendations

### 3. Anti-Fraud & Moderation
- Geo-verification (within configurable radius)
- Device fingerprinting & rate-limiting
- Duplicate detection (similarity threshold)
- Manual moderation queue
- NSFW filter for media

## 📈 Performance Targets

- **API Latency:** 95th percentile < 300ms
- **Alert Latency:** Review ingestion to alert delivery < 2 min
- **Availability:** 99.5% SLA
- **Scalability:** Auto-scaling for 1000+ reviews/min
- **Throughput:** Process 10,000 reviews/day

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run E2E tests
npm run test:e2e

# Run security tests
npm run test:security
```

## 📚 Documentation

- **[API Documentation](./docs/API.md)** - Full API reference & examples
- **[Architecture](./docs/ARCHITECTURE.md)** - System design & data flow
- **[Database Schema](./docs/DATABASE.md)** - ER diagram & migrations
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production setup
- **[AI Prompts](./docs/AI_PROMPTS.md)** - LLM prompt templates

## 🔄 CI/CD Pipeline

GitHub Actions workflows:
- **Build & Test:** Run on every PR
- **Staging Deploy:** Auto-deploy on merge to main
- **Production Deploy:** Manual approval + canary rollout
- **Security Scan:** Dependency check, SAST
- **Load Testing:** Weekly performance baseline

## 📋 Development Workflow

1. **Create feature branch:** `git checkout -b feature/feature-name`
2. **Make changes** following code standards
3. **Run tests & lint:** `npm run test && npm run lint`
4. **Submit PR** with clear description
5. **Code review** by team
6. **Merge & auto-deploy** to staging
7. **Promote to production** after QA sign-off

## 🚨 Monitoring & Alerts

- **Uptime:** Prometheus metrics + Grafana dashboards
- **Errors:** Sentry integration with Slack notifications
- **Performance:** APM metrics (latency, throughput, error rate)
- **Infrastructure:** CPU, memory, disk usage alerts
- **Queue Health:** Message queue depth monitoring

## 🤝 Contributing

1. Follow TypeScript & ESLint standards
2. Write tests for new features
3. Update documentation
4. Submit PR with test evidence

## 📄 License

Proprietary - Aramco Reviews Enterprise

## 👥 Team

- **Backend Lead:** [Assign]
- **Frontend Lead:** [Assign]
- **AI/ML Engineer:** [Assign]
- **DevOps Engineer:** [Assign]
- **QA Lead:** [Assign]

## 📞 Support

For issues, questions, or feedback:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation first

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0 (MVP Phase)
