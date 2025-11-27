import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Endpoints Tests (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let adminToken: string;
  let stationId: string;
  let reviewId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    it('POST /auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'manager',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          jwtToken = res.body.access_token;
        });
    });

    it('POST /auth/login - should login user and return token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });

    it('POST /auth/register - admin should register', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
          name: 'Admin User',
          role: 'admin',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          adminToken = res.body.access_token;
        });
    });
  });

  describe('Stations Endpoints', () => {
    it('GET /stations - should retrieve all active stations', () => {
      return request(app.getHttpServer())
        .get('/api/stations')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /stations - admin should create a new station', () => {
      return request(app.getHttpServer())
        .post('/api/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Station',
          stationCode: 'TS001',
          city: 'Test City',
          address: '123 Test Street',
          contact: '+966123456789',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          stationId = res.body.id;
        });
    });

    it('GET /stations/:id - should retrieve a specific station', () => {
      return request(app.getHttpServer())
        .get(`/api/stations/${stationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', stationId);
        });
    });

    it('PATCH /stations/:id - admin should update a station', () => {
      return request(app.getHttpServer())
        .patch(`/api/stations/${stationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          city: 'Updated City',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.city).toBe('Updated City');
        });
    });

    it('GET /stations/admin/all - admin should get all stations including inactive', () => {
      return request(app.getHttpServer())
        .get('/api/stations/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Reviews Endpoints', () => {
    it('POST /reviews - should create a new review', () => {
      return request(app.getHttpServer())
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          stationId,
          rating: 5,
          content: 'Great service and clean facility',
          category: 'cleanliness',
          phoneNumber: '966500000000',
          customerName: 'John Doe',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          reviewId = res.body.id;
        });
    });

    it('GET /reviews - should retrieve reviews', () => {
      return request(app.getHttpServer())
        .get('/api/reviews')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /reviews/:id - should retrieve a specific review', () => {
      return request(app.getHttpServer())
        .get(`/api/reviews/${reviewId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', reviewId);
        });
    });

    it('GET /reviews/station/:stationId - should retrieve reviews for a station', () => {
      return request(app.getHttpServer())
        .get(`/api/reviews/station/${stationId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Campaigns & Rewards Endpoints', () => {
    let campaignId: string;

    it('POST /campaigns - admin should create a campaign', () => {
      return request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Summer Rewards 2024',
          description: 'Earn rewards on your 5th review',
          reviewThreshold: 5,
          rewardType: 'discount_10_percent',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          campaignId = res.body.id;
        });
    });

    it('GET /campaigns - admin should get all campaigns', () => {
      return request(app.getHttpServer())
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /campaigns/admin/all-claims - admin should get all reward claims', () => {
      return request(app.getHttpServer())
        .get('/api/campaigns/admin/all-claims')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /campaigns/admin/claims-summary - admin should get claims summary', () => {
      return request(app.getHttpServer())
        .get('/api/campaigns/admin/claims-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('summary');
        });
    });

    it('GET /campaigns/station/:stationId/claims - manager should get station claims', () => {
      return request(app.getHttpServer())
        .get(`/api/campaigns/station/${stationId}/claims`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });

  describe('Alerts Endpoints', () => {
    it('GET /alerts - should retrieve alerts', () => {
      return request(app.getHttpServer())
        .get('/api/alerts')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });

  describe('Analytics Endpoints', () => {
    it('GET /analytics - should retrieve analytics data', () => {
      return request(app.getHttpServer())
        .get('/api/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /analytics/station/:stationId - should retrieve station analytics', () => {
      return request(app.getHttpServer())
        .get(`/api/analytics/station/${stationId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });

  describe('Error Handling & Security', () => {
    it('GET /stations - should be accessible without auth', () => {
      return request(app.getHttpServer())
        .get('/api/stations')
        .expect(200);
    });

    it('POST /stations - should require admin auth', () => {
      return request(app.getHttpServer())
        .post('/api/stations')
        .send({
          name: 'Unauthorized Station',
          stationCode: 'UNAUTH',
          city: 'Test City',
          address: 'Test Address',
        })
        .expect(401);
    });

    it('POST /campaigns - non-admin should be forbidden', () => {
      return request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Unauthorized Campaign',
          reviewThreshold: 5,
          rewardType: 'discount_10_percent',
        })
        .expect(403);
    });

    it('GET /non-existent-endpoint - should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/non-existent')
        .expect(404);
    });
  });

  describe('Coupon/Reward Tracking', () => {
    it('GET /campaigns/phone/:phoneNumber/claims - should get claims by phone', () => {
      return request(app.getHttpServer())
        .get('/api/campaigns/phone/966500000000/claims')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /campaigns/claims/:claimId/claim - should claim a reward', () => {
      // This would require a valid claim ID from a previous request
      // Skipping specific ID for now
      return request(app.getHttpServer())
        .post('/api/campaigns/claims/invalid-id/claim')
        .send({ notes: 'Test claim' })
        .expect(404);
    });
  });
});
