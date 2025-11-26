# Database Schema - Aramco Reviews Enterprise

## ER Diagram

```
┌─────────────────┐          ┌──────────────────┐
│    USERS        │          │    STATIONS      │
├─────────────────┤          ├──────────────────┤
│ id (PK)         │◄─────────│ id (PK)          │
│ name            │  manages │ name             │
│ email (UNIQUE)  │          │ station_code     │
│ phone           │          │ region_id        │
│ role (ENUM)     │          │ city             │
│ password_hash   │          │ address          │
│ provider        │          │ geo_lat          │
│ is_verified     │          │ geo_lng          │
│ mfa_enabled     │          │ contact          │
│ is_active       │          │ manager_id (FK)  │
│ created_at      │          │ is_active        │
│ updated_at      │          │ created_at       │
└─────────────────┘          │ updated_at       │
         △                    └──────────────────┘
         │                            △
         │                            │
         │                            │ has
    manages                           │
         │                            │
         │                    ┌───────┴────────────┐
         │                    │                    │
         │            ┌──────────────────┐  ┌─────────────────────┐
         │            │    REVIEWS       │  │ STATIONS_SCORECARDS │
         │            ├──────────────────┤  ├─────────────────────┤
         │            │ id (PK)          │  │ id (PK)             │
    replied_by        │ station_id (FK)  │  │ station_id (FK)     │
         │            │ user_id (FK)     │  │ period_start        │
         │            │ rating           │  │ period_end          │
         │            │ categories       │  │ avg_rating          │
         │            │ text             │  │ total_reviews       │
         │            │ language         │  │ negative_count      │
         │            │ sentiment        │  │ positive_count      │
         │            │ sentiment_score  │  │ neutral_count       │
         │            │ keywords         │  │ top_complaints      │
         │            │ ai_summary       │  │ top_praises         │
         │            │ status           │  │ ai_insights         │
         │            │ manager_reply    │  │ recommendations     │
         │            │ manager_reply_at │  │ created_at          │
         │            │ resolved_by_user │  │ updated_at          │
         │            │ resolved_at      │  └─────────────────────┘
         │            │ resolution_notes │
         │            │ geo_lat          │
         │            │ geo_lng          │
         │            │ device_finger    │
         │            │ is_verified      │
         │            │ flagged_as_spam  │
         │            │ created_at       │
         │            │ updated_at       │
         └────────────│                  │
                      └──────────────────┘
                              △
                              │ has
                              │
                    ┌─────────┴─────────────┐
                    │                       │
         ┌──────────────────────┐ ┌─────────────────────┐
         │   REVIEW_MEDIA       │ │      ALERTS         │
         ├──────────────────────┤ ├─────────────────────┤
         │ id (PK)              │ │ id (PK)             │
         │ review_id (FK)       │ │ review_id (FK)      │
         │ file_url             │ │ station_id (FK)     │
         │ file_type            │ │ type (ENUM)         │
         │ mime_type            │ │ priority (ENUM)     │
         │ file_size            │ │ payload (JSON)      │
         │ thumbnail_url        │ │ resolved            │
         │ ocr_text             │ │ resolved_at         │
         │ nsfw                 │ │ resolved_by_user    │
         │ created_at           │ │ resolution_notes    │
         └──────────────────────┘ │ created_at          │
                                  │ updated_at          │
                                  └─────────────────────┘

┌──────────────────────────┐  ┌──────────────────────┐
│   AUDIT_LOGS             │  │  ALERT_CONFIGURATIONS│
├──────────────────────────┤  ├──────────────────────┤
│ id (PK)                  │  │ id (PK)              │
│ actor_id (FK)            │  │ name (UNIQUE)        │
│ action (ENUM)            │  │ negative_rating_th   │
│ entity                   │  │ critical_keywords    │
│ entity_id                │  │ spike_threshold_pct  │
│ details (JSON)           │  │ spike_lookback_h     │
│ ip_address               │  │ escalation_sla_sec   │
│ user_agent               │  │ email_enabled        │
│ timestamp                │  │ sms_enabled          │
└──────────────────────────┘  │ push_enabled         │
                              │ created_at           │
                              │ updated_at           │
                              └──────────────────────┘
```

## Table Specifications

### USERS
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| phone | VARCHAR(20) | NULLABLE | Phone number |
| role | ENUM | NOT NULL | customer, station_manager, regional_manager, admin |
| password_hash | VARCHAR(255) | NULLABLE | Bcrypt hash |
| provider | VARCHAR(50) | NULLABLE | 'local', 'google', 'azure', etc. |
| is_verified | BOOLEAN | DEFAULT false | Email verified |
| verification_token | VARCHAR(255) | NULLABLE | For email verification |
| verification_token_expires_at | TIMESTAMP | NULLABLE | Token expiry |
| otp_code | VARCHAR(6) | NULLABLE | One-time password |
| otp_expires_at | TIMESTAMP | NULLABLE | OTP expiry |
| otp_attempts | INT | DEFAULT 0 | Failed OTP attempts |
| mfa_enabled | BOOLEAN | DEFAULT false | MFA enabled |
| mfa_secret | VARCHAR(255) | NULLABLE | TOTP secret |
| is_active | BOOLEAN | DEFAULT true | Account active |
| created_at | TIMESTAMP | DEFAULT now() | Creation date |
| updated_at | TIMESTAMP | DEFAULT now() | Last update |

### STATIONS
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Station name |
| station_code | VARCHAR(50) | UNIQUE, NOT NULL | Unique code (e.g., PKR001) |
| region_id | UUID | NULLABLE | Region identifier |
| city | VARCHAR(100) | NOT NULL | City name |
| address | TEXT | NOT NULL | Full address |
| geo_lat | DECIMAL(10,8) | NULLABLE | Latitude |
| geo_lng | DECIMAL(11,8) | NULLABLE | Longitude |
| contact | VARCHAR(20) | NULLABLE | Contact phone |
| manager_id | UUID | FOREIGN KEY (users.id) | Station manager |
| is_active | BOOLEAN | DEFAULT true | Station active |
| created_at | TIMESTAMP | DEFAULT now() | Creation date |
| updated_at | TIMESTAMP | DEFAULT now() | Last update |

**Indices:**
- UNIQUE (name)
- UNIQUE (station_code)
- INDEX (region_id, is_active)
- INDEX (manager_id)

### REVIEWS
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| station_id | UUID | FOREIGN KEY, NOT NULL | Station reference |
| user_id | UUID | FOREIGN KEY, NULLABLE | User reference (anonymous if null) |
| rating | INT | NOT NULL | 1-5 stars |
| categories | VARCHAR[] | NULLABLE | Array of tags |
| text | TEXT | NOT NULL | Review content |
| language | VARCHAR(10) | DEFAULT 'en' | Language code |
| sentiment | ENUM | NULLABLE | positive, neutral, negative |
| sentiment_score | DECIMAL(3,2) | NULLABLE | 0.0 - 1.0 score |
| keywords | VARCHAR[] | NULLABLE | Extracted keywords |
| ai_summary | TEXT | NULLABLE | AI-generated summary |
| status | ENUM | DEFAULT 'open' | open, resolved, ignored |
| manager_reply | TEXT | NULLABLE | Manager's response |
| manager_reply_at | TIMESTAMP | NULLABLE | Reply timestamp |
| resolved_by_user_id | UUID | NULLABLE | User who resolved |
| resolved_at | TIMESTAMP | NULLABLE | Resolution timestamp |
| resolution_notes | TEXT | NULLABLE | Resolution details |
| geo_lat | DECIMAL(10,8) | NULLABLE | Submission location |
| geo_lng | DECIMAL(11,8) | NULLABLE | Submission location |
| device_fingerprint | VARCHAR(255) | NULLABLE | Device identifier |
| is_verified | BOOLEAN | DEFAULT false | Location verified |
| flagged_as_spam | BOOLEAN | DEFAULT false | Spam flag |
| flagged_for_moderation | BOOLEAN | DEFAULT false | Moderation flag |
| created_at | TIMESTAMP | DEFAULT now() | Creation date |
| updated_at | TIMESTAMP | DEFAULT now() | Last update |

**Indices:**
- INDEX (station_id, created_at)
- INDEX (rating, station_id)
- INDEX (sentiment)
- INDEX (status, station_id)
- INDEX (created_at) — for time-series queries

**Partitioning Strategy:**
- Range partition by created_at (monthly) for large datasets

### ALERTS
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| review_id | UUID | FOREIGN KEY, NULLABLE | Related review |
| station_id | UUID | FOREIGN KEY, NOT NULL | Station reference |
| type | ENUM | NOT NULL | negative_rating, keyword_trigger, spike |
| priority | ENUM | NOT NULL | low, medium, high |
| payload | JSONB | NOT NULL | Alert details |
| resolved | BOOLEAN | DEFAULT false | Resolution status |
| resolved_at | TIMESTAMP | NULLABLE | Resolution timestamp |
| resolved_by_user_id | UUID | NULLABLE | User who resolved |
| resolution_notes | TEXT | NULLABLE | Resolution notes |
| created_at | TIMESTAMP | DEFAULT now() | Creation date |
| updated_at | TIMESTAMP | DEFAULT now() | Last update |

**Indices:**
- INDEX (station_id, created_at)
- INDEX (resolved, priority)
- INDEX (type, station_id)

### Queries Performance Tips

#### High-Volume Queries
```sql
-- Get reviews for a station (paginated)
SELECT * FROM reviews
WHERE station_id = $1
  AND created_at > $2
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;

-- Get alerts for dashboard
SELECT * FROM alerts
WHERE station_id = $1
  AND resolved = false
ORDER BY priority DESC, created_at DESC;

-- Get metrics for period
SELECT 
  AVG(rating) as avg_rating,
  COUNT(*) as total_reviews,
  SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count
FROM reviews
WHERE station_id = $1
  AND created_at BETWEEN $2 AND $3;
```

#### Aggregation View (Materialized)
```sql
CREATE MATERIALIZED VIEW station_metrics_daily AS
SELECT 
  station_id,
  DATE(created_at) as review_date,
  AVG(rating) as avg_rating,
  COUNT(*) as total_reviews,
  SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_count,
  mode() WITHIN GROUP (ORDER BY sentiment) as most_common_sentiment
FROM reviews
GROUP BY station_id, DATE(created_at);

CREATE INDEX idx_station_metrics_date 
ON station_metrics_daily (station_id, review_date DESC);
```

## Migration Strategy

```bash
# Create new migration
npm run migrate:create -- InitialSchema

# Run migrations
npm run migrate:latest

# Revert last migration
npm run migrate:revert
```

---

**Last Updated:** 2025-11-25
