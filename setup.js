'use strict';

/**
 * @description
 * DOING: Should import or include the required
 * libraries and files for this script to run.
 */
const { MongoClient } = require("mongodb");
const faker = require('faker');

function generateFakeData() {
  var i = 0, dataArr = [];
  for (i; i < 100; i++) {
    dataArr.push({
      metaTemplateId: faker.random.uuid(),
      status: faker.random.word(),
      createdAt: faker.date.past(),
      timeZone: faker.address.timeZone(),
      language: faker.random.locale(),
      signMethod: faker.random.word(),
      templatePrice: faker.random.number(),
      currency: faker.finance.currencyCode(),
      fieldsData: {},
      addOns: [
        {
          id: faker.random.uuid()
        },
        {
          id: faker.random.uuid()
        },
        {
          id: faker.random.uuid()
        }
      ]
    });
  }
  return dataArr;
}

(async function _() {
  let database;
  try {
    const uri = "mongodb://127.0.0.1:27017";
    const client = new MongoClient(uri, {
      poolSize: 20,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await client.connect();

    database = client.db('_mongo_utils');
    database.dropDatabase();
    database = client.db('_mongo_utils');

    database.createCollection('_test_collection', async function(err, db) {
      if (err) {
        throw new Error('Could not setup _test_collection');
      }
      const collection = database.collection('_test_collection');
      const data = generateFakeData();
      await collection.insertMany(data);
      client.close();
    });
    console.log('\nTest database and collection successfully setup with 100 documents.\n'); // eslint-disable-line
  } catch (e) {
    throw new Error('Could not setup');
  }
})();
