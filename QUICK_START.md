# Quick Start Guide - Aramco Reviews Enterprise

## 🚀 Project Setup (5 minutes)

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-org/aramco-reviews.git
cd aramco-reviews-enterprise
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### 3. Setup Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env with your local values
nano .env

# Key values for local development:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=aramco_reviews
REDIS_HOST=localhost
RABBITMQ_URL=amqp://guest:guest@localhost:5672
NODE_ENV=development
```

### 4. Start Services (Docker)
```bash
# Start all services
npm run docker:up

# Wait for services to be healthy (~30 seconds)
docker-compose -f infrastructure/docker-compose.yml ps

# Expected output:
# postgres          running
# redis             running
# rabbitmq          running
# prometheus        running
# grafana           running
```

### 5. Run Database Migrations
```bash
cd backend
npm run migrate:latest
cd ..
```

### 6. Start Development Servers
```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Workers
cd workers && npm run dev
```

### 7. Access Applications
| Service | URL | Credentials |
|---------|-----|-------------|
| API | http://localhost:3000 | - |
| API Docs (Swagger) | http://localhost:3000/api/docs | - |
| Frontend | http://localhost:3001 | - |
| Grafana | http://localhost:3002 | admin / admin |
| RabbitMQ | http://localhost:15672 | guest / guest |
| PostgreSQL | localhost:5432 | postgres / postgres |
| Redis | localhost:6379 | - |

## 📁 Project Structure

```
aramco-reviews-enterprise/
├── backend/              # NestJS API (Port 3000)
│   ├── src/
│   │   ├── auth/         # 🔐 Authentication & RBAC
│   │   ├── reviews/      # 📝 Review management
│   │   ├── stations/     # 🏢 Station CRUD
│   │   ├── analytics/    # 📊 Dashboards & reports
│   │   ├── alerts/       # 🚨 Alert system
│   │   └── database/     # 💾 Entities & migrations
│   └── package.json
│
├── frontend/             # Next.js Dashboard (Port 3001)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Next.js pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API clients
│   │   └── store/        # State management
│   └── package.json
│
├── workers/              # Background processors
│   ├── src/
│   │   ├── sentiment/    # Sentiment analysis
│   │   ├── summarizer/   # AI summaries
│   │   ├── translator/   # Language translation
│   │   └── queue/        # RabbitMQ consumer
│   └── package.json
│
├── infrastructure/       # Deployment & monitoring
│   ├── docker-compose.yml
│   ├── k8s/             # Kubernetes manifests
│   └── monitoring/      # Prometheus config
│
├── docs/                 # Comprehensive documentation
│   ├── API.md           # API reference
│   ├── ARCHITECTURE.md   # System design
│   ├── DATABASE.md      # Schema & migrations
│   ├── DEPLOYMENT.md    # Deployment guide
│   └── AI_PROMPTS.md    # LLM templates
│
└── README.md            # Project overview
```

## 🔑 Key Features to Explore

### 1. Submit a Review
```bash
# Using cURL
curl -X POST http://localhost:3000/stations/test-station-id/reviews \
  -F "rating=5" \
  -F "text=Great service!" \
  -F "categories=staff" \
  -F "media=@photo.jpg"
```

### 2. View Reviews
```bash
curl http://localhost:3000/stations/test-station-id/reviews
```

### 3. View API Documentation
Open browser → http://localhost:3000/api/docs

### 4. Check Application Health
```bash
curl http://localhost:3000/health
```

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Project overview & goals |
| [docs/API.md](./docs/API.md) | Complete API reference |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design & data flows |
| [docs/DATABASE.md](./docs/DATABASE.md) | Database schema & optimization |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment guide |
| [docs/AI_PROMPTS.md](./docs/AI_PROMPTS.md) | LLM prompts & configurations |

## 🧪 Testing

```bash
# Run all tests
npm run test --workspaces

# Run tests with coverage
npm run test:cov --workspaces

# Run E2E tests
npm run test:e2e

# Run specific backend test
cd backend && npm run test -- auth.spec.ts
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start all services in dev mode
npm run docker:up       # Start Docker containers
npm run docker:down     # Stop Docker containers

# Building
npm run build           # Build all workspaces
cd backend && npm run build

# Database
cd backend
npm run migrate:latest  # Run migrations
npm run migrate:revert  # Rollback migration

# Code Quality
npm run lint            # Lint all workspaces
npm run format          # Format code with Prettier

# Cleaning
docker system prune     # Clean up Docker
npm run docker:down && npm run docker:up  # Fresh restart
```

## 🐛 Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if container is running
docker ps | grep postgres

# View logs
docker logs aramco_postgres

# Restart
docker-compose -f infrastructure/docker-compose.yml restart postgres
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Database Migration Error
```bash
# Check migration status
cd backend && npm run migrate:status

# Revert last migration
npm run migrate:revert

# Check database state
psql -h localhost -U postgres -d aramco_reviews
\dt  # List tables
```

### Worker Not Processing
```bash
# Check RabbitMQ
docker logs aramco_rabbitmq

# Check queue
curl http://localhost:15672/api/queues -u guest:guest

# Restart workers
docker-compose restart worker
```

## 📊 Monitoring & Dashboards

### View Metrics
1. **Grafana Dashboard:** http://localhost:3002
   - Default: admin / admin
   - Pre-built dashboards for API, Database, Workers

2. **Prometheus:** http://localhost:9090
   - Query metrics
   - View scrape targets
   - Set up alerts

3. **Logs:** 
   - Check container logs: `docker logs -f aramco_backend`
   - Grep for errors: `docker logs aramco_backend | grep error`

## 🚀 Next Steps

1. **Explore the Codebase**
   - Read backend/src/app.module.ts for module structure
   - Check frontend/pages/ for UI components
   - Review workers/src/index.ts for async processing

2. **Run Example Workflows**
   - Submit a review with media
   - Check worker processing
   - View alert triggers
   - Generate analytics report

3. **Implement Your Features**
   - Follow existing patterns
   - Add tests for new code
   - Update documentation
   - Create PR with detailed description

4. **Set Up IDE Extensions**
   - ESLint
   - Prettier
   - Thunder Client / REST Client (for API testing)
   - SQL Tools (for database queries)

## 👥 Team Collaboration

### Code Review Checklist
- [ ] Tests pass
- [ ] No lint errors
- [ ] Documentation updated
- [ ] Database migration included (if applicable)
- [ ] Error handling implemented
- [ ] Security reviewed

### Deployment Checklist
- [ ] Code reviewed and merged
- [ ] All tests passing
- [ ] Database backup taken
- [ ] Environment variables configured
- [ ] Monitoring alerts set up
- [ ] Rollback plan documented

## 📞 Getting Help

1. **Documentation:** Check [docs/](./docs/) directory
2. **GitHub Issues:** Create issue with details
3. **Code Comments:** Questions in PR comments
4. **Slack:** Use #aramco-reviews channel

## 📝 Development Tips

1. **Database Queries:** Use TypeORM QueryBuilder
   ```typescript
   const reviews = await reviewRepository.createQueryBuilder('review')
     .where('review.stationId = :stationId', { stationId })
     .orderBy('review.createdAt', 'DESC')
     .take(20)
     .getMany();
   ```

2. **Error Handling:** Always return proper HTTP codes
   ```typescript
   throw new NotFoundException('Review not found');
   throw new BadRequestException('Invalid rating');
   throw new ConflictException('Duplicate review');
   ```

3. **Logging:** Use logger service
   ```typescript
   this.logger.log('Review submitted', { reviewId, stationId });
   this.logger.error('Processing failed', error);
   ```

4. **Testing:** Write unit tests for business logic
   ```typescript
   describe('ReviewService', () => {
     it('should submit review', async () => {
       const result = await service.submitReview(reviewData);
       expect(result.id).toBeDefined();
     });
   });
   ```

## 📈 Performance Tips

1. **Database:** Use indices on frequently queried columns
2. **Cache:** Leverage Redis for hot data
3. **Frontend:** Code-split and lazy-load components
4. **Backend:** Paginate large datasets
5. **Workers:** Batch process reviews during off-peak hours

## 🔒 Security Reminders

1. Never commit `.env` files
2. Rotate secrets regularly
3. Use HTTPS in production
4. Validate all user inputs
5. Sanitize data before external API calls
6. Enable MFA for admin accounts
7. Review audit logs periodically

---

**Happy coding! 🎉**

Last Updated: 2025-11-25
