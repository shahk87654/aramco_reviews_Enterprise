# Aramco Reviews Enterprise - API Endpoints Reference

## Authentication Endpoints

### Register User
- **POST** `/api/auth/register`
- **Auth**: None
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "manager" | "customer" | "admin"
  }
  ```
- **Response**: User object with access token

### Login
- **POST** `/api/auth/login`
- **Auth**: None
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response**: Access token & refresh token

### Refresh Token
- **POST** `/api/auth/refresh`
- **Auth**: Bearer Token (refresh token)
- **Response**: New access token

---

## Stations Management

### Get All Active Stations
- **GET** `/api/stations`
- **Auth**: None
- **Response**: Array of station objects (sorted by stationCode ascending)

### Get Specific Station
- **GET** `/api/stations/:id`
- **Auth**: None
- **Response**: Station details

### Create Station (Admin Only)
- **POST** `/api/stations`
- **Auth**: Required (Admin)
- **Request**:
  ```json
  {
    "name": "Station Name",
    "stationCode": "ST001",
    "city": "City Name",
    "address": "Full Address",
    "contact": "+966XXXXXXXXX"
  }
  ```
- **Response**: Created station object

### Update Station (Admin Only)
- **PATCH** `/api/stations/:id`
- **Auth**: Required (Admin)
- **Request**: Partial station object
- **Response**: Updated station object

### Delete Station (Admin Only - Soft Delete)
- **DELETE** `/api/stations/:id`
- **Auth**: Required (Admin)
- **Response**: Success message

### Get All Stations Including Inactive (Admin Only)
- **GET** `/api/stations/admin/all`
- **Auth**: Required (Admin)
- **Response**: Array of all stations (including inactive)

---

## Reviews Management

### Submit Review
- **POST** `/api/reviews`
- **Auth**: Required
- **Request**:
  ```json
  {
    "stationId": "uuid",
    "rating": 1-5,
    "content": "Review text",
    "category": "cleanliness|staff|fuel|convenience|safety|experience",
    "phoneNumber": "966XXXXXXXXX",
    "customerName": "Name"
  }
  ```
- **Response**: Review object with reward if applicable

### Get All Reviews
- **GET** `/api/reviews`
- **Auth**: None
- **Response**: Array of reviews

### Get Specific Review
- **GET** `/api/reviews/:id`
- **Auth**: None
- **Response**: Review details

### Get Station Reviews
- **GET** `/api/reviews/station/:stationId`
- **Auth**: None
- **Response**: Array of reviews for station

---

## Campaigns & Rewards Management

### Create Campaign (Admin Only)
- **POST** `/api/campaigns`
- **Auth**: Required (Admin)
- **Request**:
  ```json
  {
    "name": "Campaign Name",
    "description": "Campaign description",
    "reviewThreshold": 5,
    "rewardType": "discount_10_percent|free_tea|free_coffee",
    "status": "active|inactive|expired",
    "startDate": "ISO Date",
    "endDate": "ISO Date"
  }
  ```
- **Response**: Campaign object

### Get All Campaigns (Admin Only)
- **GET** `/api/campaigns`
- **Auth**: Required (Admin)
- **Response**: Array of campaigns

### Get Campaign by ID (Admin Only)
- **GET** `/api/campaigns/:id`
- **Auth**: Required (Admin)
- **Response**: Campaign details

### Update Campaign (Admin Only)
- **PATCH** `/api/campaigns/:id`
- **Auth**: Required (Admin)
- **Response**: Updated campaign

### Delete Campaign (Admin Only)
- **DELETE** `/api/campaigns/:id`
- **Auth**: Required (Admin)
- **Response**: Success message

---

## Coupon/Reward Tracking

### Get All Coupon Claims (Admin Only - Track Generation & Claims)
- **GET** `/api/campaigns/admin/all-claims`
- **Auth**: Required (Admin)
- **Response**: Array of all reward claims with generation status and claim status

### Get Coupon Claims Summary (Admin Only - Admin Dashboard)
- **GET** `/api/campaigns/admin/claims-summary`
- **Auth**: Required (Admin)
- **Response**:
  ```json
  {
    "summary": {
      "totalGenerated": 150,
      "totalClaimed": 120,
      "unclaimedCoupons": 30,
      "claimRate": "80.00"
    },
    "byRewardType": {
      "discount_10_percent": { "total": 80, "claimed": 64 },
      "free_tea": { "total": 45, "claimed": 36 },
      "free_coffee": { "total": 25, "claimed": 20 }
    },
    "recentClaims": [...]
  }
  ```

### Get Station Coupons (Manager/Admin - Manager sees only their station)
- **GET** `/api/campaigns/station/:stationId/claims`
- **Auth**: Required (Manager/Admin)
- **Response**: Array of reward claims for the station
- **Note**: Managers can only see their managed stations

### Get User Reward Claims by Phone Number
- **GET** `/api/campaigns/phone/:phoneNumber/claims`
- **Auth**: None
- **Response**: Array of reward claims for the phone number

### Get Specific Reward Claim
- **GET** `/api/campaigns/claims/:claimId`
- **Auth**: None
- **Response**: Reward claim details with QR code

### Claim Reward
- **POST** `/api/campaigns/claims/:claimId/claim`
- **Auth**: None
- **Request**:
  ```json
  {
    "notes": "Claimed at station counter"
  }
  ```
- **Response**: Updated reward claim with isClaimed: true

---

## Analytics & Insights

### Get System-Wide Analytics (Admin Only)
- **GET** `/api/analytics`
- **Auth**: Required (Admin)
- **Response**:
  ```json
  {
    "totalReviews": 1500,
    "avgRating": 4.5,
    "totalStations": 25,
    "sentimentBreakdown": {...},
    "topComplaints": [...],
    "topPositives": [...]
  }
  ```

### Get Station Analytics (Manager/Admin)
- **GET** `/api/analytics/station/:stationId`
- **Auth**: Required (Manager/Admin)
- **Response**:
  ```json
  {
    "stationId": "uuid",
    "totalReviews": 150,
    "avgRating": 4.6,
    "positivePercentage": 85,
    "sentimentBreakdown": {...}
  }
  ```

---

## Alerts Management

### Get Alerts (Manager/Admin)
- **GET** `/api/alerts`
- **Auth**: Required
- **Response**: Array of active alerts for user/station

---

## Health Check

### Health Status
- **GET** `/api/health`
- **Auth**: None
- **Response**:
  ```json
  {
    "status": "ok",
    "database": "connected",
    "timestamp": "ISO Date"
  }
  ```

---

## Error Responses

### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 403 - Forbidden
```json
{
  "statusCode": 403,
  "message": "Admin access required",
  "error": "Forbidden"
}
```

### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

---

## Rate Limiting (Recommended for Production)

Implement with `@nestjs/throttler`:
- 100 requests per 15 minutes for unauthenticated endpoints
- 500 requests per 15 minutes for authenticated endpoints
- 50 requests per 15 minutes for auth endpoints

---

## Security Notes

1. **All passwords** are hashed with bcrypt (10 salt rounds)
2. **JWT tokens** expire (access: 1h, refresh: 7d)
3. **CORS** is configured for specified origins only
4. **SQL Injection** protected via TypeORM parameterized queries
5. **XSS** protected via Helmet.js security headers
6. **CSRF** protected via JWT token-based authentication
7. **Role-based access control** on all protected endpoints
8. **Data validation** via class-validator DTOs

---

## Integration Examples

### JavaScript/Fetch Example
```javascript
// Login and get token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { accessToken } = await response.json();

// Use token for subsequent requests
const stationClaims = await fetch('/api/campaigns/station/{stationId}/claims', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

### cURL Example
```bash
# Get all stations
curl -X GET http://localhost:3000/api/stations

# Create campaign (with token)
curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Campaign Name",...}'

# Get coupon summary
curl -X GET http://localhost:3000/api/campaigns/admin/claims-summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```
