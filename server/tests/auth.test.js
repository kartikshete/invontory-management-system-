const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Assuming app is exported from server.js
const User = require('../models/User');

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
      
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.token).toBeDefined();
  });

  it('should login an existing user', async () => {
    // First register
    await request(app).post('/api/auth/register').send(testUser);
    
    // Then login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.token).toBeDefined();
    expect(res.body.data.email).toEqual(testUser.email);
  });
});
