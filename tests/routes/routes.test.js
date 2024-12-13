import request from 'supertest';
import { expect } from 'chai';
import app from '../app';  // Assuming the Express app is exported from app.js

describe('API Routes', () => {
  it('GET /status should return status OK', async () => {
    const res = await request(app).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('OK');
  });

  it('GET /stats should return file stats', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body.files).to.be.an('number');
  });

  it('POST /users should create a new user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ username: 'newuser', password: 'password123' });
    expect(res.status).to.equal(201);
    expect(res.body.username).to.equal('newuser');
  });

  it('GET /connect should initiate a connection', async () => {
    const res = await request(app).get('/connect');
    expect(res.status).to.equal(200);
  });

  it('GET /disconnect should disconnect the user', async () => {
    const res = await request(app).get('/disconnect');
    expect(res.status).to.equal(200);
  });

  it('GET /users/me should return the logged-in user', async () => {
    const res = await request(app).get('/users/me').set('x-token', 'valid_token');
    expect(res.status).to.equal(200);
    expect(res.body.userId).to.equal('user1');
  });

  it('POST /files should upload a file', async () => {
    const res = await request(app)
      .post('/files')
      .attach('file', './test_image.jpg');
    expect(res.status).to.equal(201);
    expect(res.body.name).to.equal('test_image.jpg');
  });

  it('GET /files/:id should return a file', async () => {
    const res = await request(app).get('/files/12345');
    expect(res.status).to.equal(200);
  });

  it('GET /files with pagination should return paginated files', async () => {
    const res = await request(app).get('/files?page=1&page_size=5');
    expect(res.status).to.equal(200);
    expect(res.body.files).to.be.an('array');
  });

  it('PUT /files/:id/publish should publish the file', async () => {
    const res = await request(app).put('/files/12345/publish');
    expect(res.status).to.equal(200);
  });

  it('PUT /files/:id/unpublish should unpublish the file', async () => {
    const res = await request(app).put('/files/12345/unpublish');
    expect(res.status).to.equal(200);
  });

  it('GET /files/:id/data should return file data', async () => {
    const res = await request(app).get('/files/12345/data?size=500');
    expect(res.status).to.equal(200);
  });
});
