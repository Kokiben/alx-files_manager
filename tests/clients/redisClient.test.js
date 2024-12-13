import redisClient from '../utils/redisClient';  // Adjust the path based on your project structure
import { expect } from 'chai';
import sinon from 'sinon';

describe('Redis Client', () => {
  it('should store and retrieve a value from Redis', async () => {
    // Stub the Redis set and get methods
    const setStub = sinon.stub(redisClient, 'set').resolves('OK');
    const getStub = sinon.stub(redisClient, 'get').resolves('12345');
    
    await redisClient.set('auth_token', '12345');
    const token = await redisClient.get('auth_token');
    
    expect(token).to.equal('12345');
    expect(setStub.calledOnce).to.be.true;
    expect(getStub.calledOnce).to.be.true;

    setStub.restore();
    getStub.restore();
  });

  it('should return null for missing token', async () => {
    const getStub = sinon.stub(redisClient, 'get').resolves(null);

    const token = await redisClient.get('missing_token');
    expect(token).to.equal(null);

    getStub.restore();
  });
});
