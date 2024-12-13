import { MongoClient } from 'mongodb';
import { expect } from 'chai';
import sinon from 'sinon';

describe('Database Client', () => {
  let mongoStub;

  before(() => {
    mongoStub = sinon.stub(MongoClient, 'connect').resolves({
      db: sinon.stub().returns({
        collection: sinon.stub().returns({
          findOne: sinon.stub().resolves({ name: 'file1', userId: 'user1' }),
        }),
      }),
    });
  });

  after(() => {
    mongoStub.restore();
  });

  it('should connect to the database and retrieve a file', async () => {
    const dbClient = new MongoClient('mongodb://localhost:27017');
    const file = await dbClient.db('files_manager').collection('files').findOne({});
    
    expect(file.name).to.equal('file1');
    expect(file.userId).to.equal('user1');
    expect(mongoStub.calledOnce).to.be.true;
  });
});
