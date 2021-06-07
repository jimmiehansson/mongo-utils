'use strict';

/**
 * @description
 * DOING: Should import or include the required
 * libraries and files for this script to run.
 */
const t = require('tap');
const { MongoClient } = require('mongodb');

const utils = require('./');
var client, database, collection;

t.beforeEach(async(done, t) => {
  try {
    const uri = "mongodb://127.0.0.1:27017";
    client = new MongoClient(uri, {
      poolSize: 20,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    await client.connect();
    database = client.db('_mongo_utils');
    collection = database.collection('_test_collection');

    t.ok(collection);
    t.type(collection, 'object');
    t.equal(collection.s.namespace.db, '_mongo_utils');
    t.equal(collection.s.namespace.collection, '_test_collection');
    done();
  } catch (e) {
    throw new Error(e);
    done();
  }
});
t.test('Should not count the existing documents in collection to 0', async(t) => {
  const data = await collection.find({ }).toArray();

  t.notEqual(data.length, 0);
  client.close();
  t.end();
});
t.test('Should count the existing documents in collection to 100', async(t) => {
  const data = await collection.find({ }).toArray();

  t.equal(data.length, 100);
  client.close();
  t.end();
});
t.test('Should insert key aString and "a value" in all root level documents', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        data: {
          aString: 'a value'
        },
        options: {
          verbose: false,
          writeMode: true,
          document: {
            upsert: true,
            multi: true
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all documents with aString and "a value"', async (t) => {
  try {
    const data = await collection.find({ aString: { $exists: true } }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 100);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should update key aString with "a new value" in all root level documents', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        data: {
          aString: 'a new value'
        },
        options: {
          verbose: false,
          writeMode: true,
          document: {
            upsert: true,
            multi: true
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all documents with key aString and "a new value"', async (t) => {
  try {
    const data = await collection.find({ aString: 'a new value' }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 100);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should add key aRandom with a random value to all root level documents', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        data: {
          aRandom: '>>RANDOM'
        },
        options: {
          verbose: false,
          writeMode: true,
          document: {
            upsert: true,
            multi: true
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all documents with key aRandom', async (t) => {
  try {
    const data = await collection.find({ aRandom: { $exists : true } }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 100);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should add key aSymbolicLink with referenced value key aString to all root level documents', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        data: {
          aSymbolicLink: '$$aString'
        },
        options: {
          verbose: false,
          writeMode: true,
          document: {
            upsert: true,
            multi: true
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all documents with key aSymbolicLink', async (t) => {
  try {
    const data = await collection.find({ aSymbolicLink: { $exists : true } }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 100);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should add key addOnTemplateId with referenced value key id to all sub level addOns documents', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        path: ['addOns'],
        data: {
          addOnTemplateId: '$$id'
        },
        options: {
          verbose: false,
          writeMode: true,
          document: {
            upsert: true,
            multi: true,
            arrayFilters: [{ "addOns.id" : { $exists: true }}]
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all occurrences of key addOnTemplateId', async (t) => {
  try {
    const data = await collection.find({ "addOns.addOnTemplateId": { $exists : true } }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 100);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should add key addOnInstanceId with random value UUID to all sub level addOns documents', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        path: ['addOns'],
        data: {
          addOnInstanceId: '>>RANDOM'
        },
        options: {
          verbose: false,
          writeMode: true,
          document: {
            upsert: true,
            multi: true,
            arrayFilters: [{ "addOns.id" : { $exists: true }}]
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all occurrences of key addOnInstanceId', async (t) => {
  try {
    const data = await collection.find({ "addOns.addOnInstanceId": { $exists : true } }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 100);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should not add key invalidKey with random value UUID to all sub level addOns documents with writeMode false', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        path: ['addOns'],
        data: {
          invalidKey: '>>RANDOM'
        },
        options: {
          verbose: false,
          writeMode: false,
          document: {
            upsert: true,
            multi: true,
            arrayFilters: [{ "addOns.id" : { $exists: true }}]
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all occurrences of key invalidKey', async (t) => {
  try {
    const data = await collection.find({ "addOns.invalidKey": { $exists : true } }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 0);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should add key randomUUID with random value UUID to all contracts where fieldsData is an empty object  ', async (t) => {
  try {
    let ctx, res;
    ctx = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection
        },
        cursor: {
          query: { "fieldsData": { $exists : true, $eq: {} }}
        },
        data: {
          randomUUID: '>>RANDOM'
        },
        options: {
          verbose: false,
          writeMode: true,
          document: {
            upsert: true,
            multi: true,
          }
        }
      }
    });
    res = await ctx();

    t.hasStrict(res, undefined);
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
t.test('Should find all occurrences of key randomUUID', async (t) => {
  try {
    const data = await collection.find({ "randomUUID": { $exists : true } }).toArray();

    t.ok(data);
    t.type(data, 'object');
    t.equal(data.length, 100);
    client.close();
    t.end();
  } catch (e) {
    throw new Error(e);
  }
});
