# Backend Local Setup Guide

## Option 1: Using Local PostgreSQL (Recommended for local dev without Docker)

### Prerequisites
1. **PostgreSQL 15+** - Download from https://www.postgresql.org/download/windows/
2. **Redis** - Download from https://github.com/microsoftarchive/redis/releases (Windows) or use WSL

### Step 1: Install PostgreSQL
1. Download and install PostgreSQL 15+ from https://www.postgresql.org/download/windows/
2. During installation:
   - Set password: `postgres`
   - Port: `5432`
   - Locale: Default

### Step 2: Create Database
Open pgAdmin (installed with PostgreSQL) or use psql:

```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE aramco_reviews;
\c aramco_reviews
```

### Step 3: Install Redis (Optional but recommended)
For Windows, use WSL2 or Docker Desktop just for Redis:

**Option A: Using Windows Subsystem for Linux (WSL)**
```bash
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

**Option B: Skip Redis for now** (some features won't work, but API will run)
In `.env`, you can temporarily disable Redis-dependent features.

### Step 4: Start Backend

```bash
cd backend
npm install  # if not already done
npm run start:dev
```

The backend will start on `http://localhost:3000`

---

## Option 2: Using Docker Desktop (Full setup)

### Prerequisites
1. Download **Docker Desktop** from https://www.docker.com/products/docker-desktop

### Steps
1. Install Docker Desktop and restart your computer
2. Open PowerShell and run:

```bash
cd infrastructure
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- RabbitMQ on port 5672

Then start the backend:
```bash
cd backend
npm install
npm run start:dev
```

---

## Quick Start Without Database (Testing only)

If you want to test the API without a real database, you can:

1. Modify `backend/src/app.module.ts` to use SQLite for testing
2. Run with in-memory database

But this won't persist data.

---

## Environment Variables for Local Dev

The `.env` file is already configured for local PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=aramco_reviews
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

---

## Verify Backend is Running

Once started, check:
- Health: `http://localhost:3000/health` (if endpoint exists)
- Swagger Docs: `http://localhost:3000/api/docs`
- Terminal output should show: `🚀 Application is running on: http://localhost:3000`

---

## Common Issues

### Issue: PostgreSQL not found
**Solution**: Make sure PostgreSQL is installed and running. Check Services in Windows or start it manually.

### Issue: Connection refused on port 5432
**Solution**: 
- Make sure PostgreSQL is running
- Check `DB_HOST` in `.env` is `localhost`
- Verify port is 5432

### Issue: Redis connection error
**Solution**: 
- Either install Redis or set `REDIS_HOST=` (empty) in `.env` to skip it for now
- Some features that depend on caching won't work

### Issue: TypeORM migration errors
**Solution**: Run migrations:
```bash
npm run migrate:latest
```

---

## Next Steps After Backend Starts

1. **Frontend** is already running on `http://localhost:3000` (or start it with `npm run dev` from frontend folder)
2. **Test the API** with Swagger docs: `http://localhost:3000/api/docs`
3. **Create test data** using the API endpoints or database directly

Good luck! 🚀
