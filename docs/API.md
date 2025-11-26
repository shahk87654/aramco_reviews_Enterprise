# API Documentation - Aramco Reviews Enterprise

## API Overview

- **Base URL:** `https://api.aramcoreview.com` (production)
- **Development:** `http://localhost:3000`
- **Authentication:** Bearer token in Authorization header
- **Content-Type:** application/json (except multipart endpoints)
- **API Docs:** `{baseUrl}/api/docs` (Swagger UI)

## Authentication Endpoints

### 1. Email/Password Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "station_manager"
  }
}
```

### 2. OTP Login (Managers)
```http
POST /auth/otp-login
Content-Type: application/json

{
  "phone": "+923001234567"
}

Response (200 OK):
{
  "message": "OTP sent to your registered phone",
  "expiresIn": 600
}
```

### 3. Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+923001234567",
  "otp": "123456"
}

Response (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800,
  "user": {
    "id": "uuid",
    "phone": "+923001234567",
    "role": "station_manager"
  }
}
```

### 4. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800
}
```

### 5. Logout
```http
POST /auth/logout
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "message": "Logged out successfully"
}
```

---

## Review Endpoints

### 1. Submit Review
```http
POST /stations/{stationId}/reviews
Content-Type: multipart/form-data
[Optional] Authorization: Bearer {accessToken}

Form Data:
{
  "rating": 4,
  "categories": ["washroom", "staff"],
  "text": "Great service but washroom needs cleaning",
  "media": [File, File],
  "geoLat": 24.8607,
  "geoLng": 67.0011,
  "userEmail": "customer@example.com",
  "userName": "Ahmed Ali"
}

Response (202 Accepted):
{
  "id": "uuid",
  "stationId": "uuid",
  "rating": 4,
  "status": "open",
  "createdAt": "2025-11-25T10:30:00Z",
  "message": "Review submitted successfully and queued for processing"
}
```

### 2. Get Station Reviews
```http
GET /stations/{stationId}/reviews?rating=1-3&category=washroom&sentiment=negative&page=1&limit=20
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "data": [
    {
      "id": "uuid",
      "stationId": "uuid",
      "rating": 2,
      "categories": ["washroom"],
      "text": "Dirty washroom",
      "sentiment": "negative",
      "sentimentScore": 0.92,
      "keywords": ["dirty", "washroom", "hygiene"],
      "status": "open",
      "media": [
        {
          "id": "uuid",
          "fileUrl": "https://s3.amazonaws.com/...",
          "fileType": "image",
          "thumbnailUrl": "https://s3.amazonaws.com/..."
        }
      ],
      "createdAt": "2025-11-25T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### 3. Get Review Details
```http
GET /reviews/{reviewId}
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "id": "uuid",
  "stationId": "uuid",
  "userId": "uuid",
  "rating": 2,
  "categories": ["washroom", "cleanliness"],
  "text": "Facility is dirty and poorly maintained",
  "language": "en",
  "sentiment": "negative",
  "sentimentScore": 0.95,
  "keywords": ["dirty", "maintenance", "poor"],
  "aiSummary": "Customer complained about cleanliness",
  "status": "open",
  "managerReply": null,
  "resolvedAt": null,
  "resolutionNotes": null,
  "media": [
    {
      "id": "uuid",
      "fileUrl": "https://s3.amazonaws.com/...",
      "fileType": "image",
      "fileSize": 2048576,
      "thumbnailUrl": "https://s3.amazonaws.com/...",
      "ocrText": "Visible dirt on floors",
      "nsfw": false,
      "createdAt": "2025-11-25T09:15:00Z"
    }
  ],
  "alerts": [
    {
      "id": "uuid",
      "type": "negative_rating",
      "priority": "high",
      "createdAt": "2025-11-25T09:16:00Z"
    }
  ],
  "isVerified": true,
  "flaggedAsSpam": false,
  "flaggedForModeration": false,
  "createdAt": "2025-11-25T09:15:00Z",
  "updatedAt": "2025-11-25T09:15:00Z"
}
```

### 4. Manager Reply
```http
POST /reviews/{reviewId}/reply
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "reply": "Thank you for your feedback. We have scheduled cleaning immediately."
}

Response (200 OK):
{
  "id": "uuid",
  "managerReply": "Thank you for your feedback. We have scheduled cleaning immediately.",
  "managerReplyAt": "2025-11-25T11:20:00Z",
  "updatedAt": "2025-11-25T11:20:00Z"
}
```

### 5. Update Review Status
```http
PATCH /reviews/{reviewId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionNotes": "Washroom cleaned and inspected"
}

Response (200 OK):
{
  "id": "uuid",
  "status": "resolved",
  "resolvedAt": "2025-11-25T11:30:00Z",
  "resolutionNotes": "Washroom cleaned and inspected",
  "updatedAt": "2025-11-25T11:30:00Z"
}
```

---

## Station Endpoints

### 1. List Stations
```http
GET /stations?region=punjab&city=karachi&page=1&limit=50&q=search
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "data": [
    {
      "id": "uuid",
      "name": "Karachi Port Terminal",
      "stationCode": "KPT001",
      "regionId": "uuid",
      "city": "Karachi",
      "address": "123 Port Road, Karachi",
      "geoLat": 24.8607,
      "geoLng": 67.0011,
      "contact": "+923001234567",
      "managerId": "uuid",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "pages": 5
  }
}
```

### 2. Get Station Details
```http
GET /stations/{stationId}
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "id": "uuid",
  "name": "Karachi Port Terminal",
  "stationCode": "KPT001",
  "regionId": "uuid",
  "city": "Karachi",
  "address": "123 Port Road, Karachi",
  "geoLat": 24.8607,
  "geoLng": 67.0011,
  "contact": "+923001234567",
  "manager": {
    "id": "uuid",
    "name": "Ali Khan",
    "email": "ali@example.com",
    "phone": "+923001234567"
  },
  "metrics": {
    "totalReviews": 245,
    "avgRating": 3.8,
    "negativeCount": 35,
    "positiveCount": 180,
    "neutralCount": 30,
    "reviewsThisMonth": 42
  },
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-11-25T10:00:00Z"
}
```

### 3. Create Station (Admin)
```http
POST /stations
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "New Station",
  "stationCode": "NEW001",
  "regionId": "uuid",
  "city": "Lahore",
  "address": "123 Main Street",
  "geoLat": 31.5204,
  "geoLng": 74.3587,
  "contact": "+923001234567",
  "managerId": "uuid"
}

Response (201 Created):
{
  "id": "new-uuid",
  "name": "New Station",
  "stationCode": "NEW001",
  ...
}
```

---

## Analytics Endpoints

### 1. Global Overview
```http
GET /analytics/overview?range=30d
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "period": {
    "startDate": "2025-10-26",
    "endDate": "2025-11-25"
  },
  "global": {
    "totalReviews": 12450,
    "avgRating": 3.7,
    "totalStations": 234,
    "activeStations": 210,
    "avgReviewsPerStation": 53.2
  },
  "sentiment": {
    "positive": 8315,
    "neutral": 2340,
    "negative": 1795
  },
  "ratings": {
    "5": 3450,
    "4": 4865,
    "3": 2340,
    "2": 1200,
    "1": 595
  },
  "trends": {
    "reviewsUp": 12.5,
    "avgRatingTrend": -0.2,
    "sentimentImprovement": 3.2
  }
}
```

### 2. Station Metrics
```http
GET /analytics/station/{stationId}?range=30d
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "stationId": "uuid",
  "stationName": "Karachi Port Terminal",
  "period": {
    "startDate": "2025-10-26",
    "endDate": "2025-11-25"
  },
  "metrics": {
    "totalReviews": 42,
    "avgRating": 3.8,
    "negativeCount": 6,
    "positiveCount": 28,
    "neutralCount": 8
  },
  "categories": {
    "washroom": 12,
    "staff": 18,
    "cleanliness": 15,
    "fuel_quality": 8,
    "overall": 5
  },
  "topComplaints": [
    {
      "complaint": "dirty washroom",
      "count": 8,
      "percentage": 19.0
    },
    {
      "complaint": "rude staff",
      "count": 4,
      "percentage": 9.5
    }
  ],
  "topPraises": [
    {
      "praise": "helpful staff",
      "count": 12,
      "percentage": 28.6
    }
  ]
}
```

### 3. Trends Report
```http
GET /analytics/trends?metric=rating&group=region&range=60d
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "metric": "rating",
  "groupBy": "region",
  "period": 60,
  "data": [
    {
      "region": "Punjab",
      "trend": [
        {
          "date": "2025-09-26",
          "value": 3.65
        },
        {
          "date": "2025-10-26",
          "value": 3.72
        },
        {
          "date": "2025-11-25",
          "value": 3.78
        }
      ]
    },
    {
      "region": "Sindh",
      "trend": [
        {
          "date": "2025-09-26",
          "value": 3.54
        },
        {
          "date": "2025-10-26",
          "value": 3.58
        },
        {
          "date": "2025-11-25",
          "value": 3.65
        }
      ]
    }
  ]
}
```

### 4. Export Data
```http
GET /analytics/export?format=csv&range=30d&stationId=uuid
Authorization: Bearer {accessToken}

Response (200 OK - CSV file):
station_id,station_name,review_date,rating,sentiment,category,text
uuid,Karachi Port Terminal,2025-11-25,4,positive,staff,"Great service"
...
```

---

## Alert Endpoints

### 1. List Alerts
```http
GET /alerts?stationId=uuid&resolved=false&priority=high&page=1&limit=20
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "data": [
    {
      "id": "uuid",
      "reviewId": "uuid",
      "stationId": "uuid",
      "type": "negative_rating",
      "priority": "high",
      "payload": {
        "rating": 1,
        "text": "Terrible experience",
        "station": "Karachi Port Terminal"
      },
      "resolved": false,
      "createdAt": "2025-11-25T10:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 2. Resolve Alert
```http
PATCH /alerts/{alertId}/resolve
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "resolutionNotes": "Issue resolved, station cleaned"
}

Response (200 OK):
{
  "id": "uuid",
  "resolved": true,
  "resolvedAt": "2025-11-25T12:00:00Z",
  "resolutionNotes": "Issue resolved, station cleaned"
}
```

---

## Admin Endpoints

### 1. Configure Alert Rules
```http
POST /admin/alerts/config
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "negativeRatingThreshold": 3,
  "criticalKeywords": ["dirty", "leak", "rude", "unsafe", "fire"],
  "spikeThresholdPercentage": 30,
  "spikeLookbackHours": 24,
  "escalationSlaSeconds": 86400
}

Response (200 OK):
{
  "id": "uuid",
  "name": "default",
  "negativeRatingThreshold": 3,
  "criticalKeywords": ["dirty", "leak", "rude", "unsafe", "fire"],
  ...
}
```

### 2. Get Audit Logs
```http
GET /admin/audit-logs?entity=review&action=CREATE&page=1&limit=50
Authorization: Bearer {adminToken}

Response (200 OK):
{
  "data": [
    {
      "id": "uuid",
      "actorId": "uuid",
      "action": "CREATE",
      "entity": "review",
      "entityId": "uuid",
      "details": {
        "rating": 4,
        "station": "Karachi Port Terminal"
      },
      "ipAddress": "192.168.1.1",
      "timestamp": "2025-11-25T10:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5234
  }
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "field": "rating",
    "message": "Rating must be between 1 and 5"
  },
  "timestamp": "2025-11-25T10:15:00Z",
  "path": "/stations/uuid/reviews"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 202 | Accepted (async processing) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

**Last Updated:** 2025-11-25
**Version:** 1.0.0
