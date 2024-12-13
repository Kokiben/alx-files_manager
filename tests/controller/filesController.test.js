import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import fs from 'fs';
import app from '../../app'; // Adjust the path to where your Express app is defined
import dbClient from '../../utils/dbClient';
import redisClient from '../../utils/redisClient';

describe('Files Controller', () => {
  before(() => {
    sinon.stub(redisClient, 'get').resolves('valid_token'); // Stub Redis for authentication
    sinon.stub(dbClient, 'isConnected').returns(true); // Stub database connection check
  });

  after(() => {
    redisClient.get.restore();
    dbClient.isConnected.restore();
  });

  describe('POST /files', () => {
    it('should upload a file successfully', async () => {
      const res = await request(app)
        .post('/files')
        .set('x-token', 'valid_token')
        .field('name', 'test_file')
        .field('type', 'image')
        .attach('file', './tests/assets/test_image.jpg'); // Use a sample test file

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('name', 'test_file');
      expect(res.body).to.have.property('type', 'image');
    });

    it('should return an error if the file is missing', async () => {
      const res = await request(app)
        .post('/files')
        .set('x-token', 'valid_token')
        .field('name', 'test_file')
        .field('type', 'image');

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing file');
    });
  });

  describe('GET /files/:id', () => {
    it('should retrieve a file successfully', async () => {
      const res = await request(app)
        .get('/files/valid_file_id')
        .set('x-token', 'valid_token');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', 'valid_file_id');
      expect(res.body).to.have.property('name');
      expect(res.body).to.have.property('type');
    });

    it('should return an error if the file does not exist', async () => {
      const res = await request(app)
        .get('/files/invalid_file_id')
        .set('x-token', 'valid_token');

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error', 'File not found');
    });
  });

  describe('GET /files with pagination', () => {
    it('should return paginated files', async () => {
      const res = await request(app)
        .get('/files?page=1&page_size=2')
        .set('x-token', 'valid_token');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('files');
      expect(res.body.files).to.be.an('array');
    });
  });

  describe('PUT /files/:id/publish', () => {
    it('should publish a file', async () => {
      const res = await request(app)
        .put('/files/valid_file_id/publish')
        .set('x-token', 'valid_token');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', 'valid_file_id');
      expect(res.body).to.have.property('isPublic', true);
    });
  });

  describe('PUT /files/:id/unpublish', () => {
    it('should unpublish a file', async () => {
      const res = await request(app)
        .put('/files/valid_file_id/unpublish')
        .set('x-token', 'valid_token');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', 'valid_file_id');
      expect(res.body).to.have.property('isPublic', false);
    });
  });

  describe('GET /files/:id/data', () => {
    it('should retrieve file data of a specific size', async () => {
      const res = await request(app)
        .get('/files/valid_file_id/data?size=500')
        .set('x-token', 'valid_token');

      expect(res.status).to.equal(200);
      expect(res.text).to.not.be.empty;
    });

    it('should return 404 if the requested file data size does not exist', async () => {
      const res = await request(app)
        .get('/files/valid_file_id/data?size=1000')
        .set('x-token', 'valid_token');

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error', 'Not found');
    });
  });
});
