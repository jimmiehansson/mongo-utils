'use strict';

/**
 * @description
 * DOING: Should import or include the required
 * libraries and files for this script to run.
 */
const { MongoClient } = require("mongodb");
const utils = require('./');

async function run() {
  try {

    // Connect to MongoDB
    const uri = "mongodb://127.0.0.1:27017/meteor";
    const client = new MongoClient(uri, {
      poolSize: 2,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    await client.connect();
    const database = client.db('meteor');
    const contracts = database.collection('contracts');

    // Tell mongo-utils what to do
    const updateAddOns = utils({
      handler: 'migrate',
      params: {
        connection: {
          client,
          database,
          collection: contracts
        },
        cursor: {
          fields: ['addOns.id'],
          limit: 100
        },
        path: ['addOns'],
        condition: { $exists: true },
        data: {
          newObj: {
            stringValue: 'string',
            numericValuee: 10,
            listValue: [0, 1, 2, 3],
            objectValue: { key: 'value' }
          },
          newList: [[0, 1, 2, 3], [0, 1, 2, 3]],
          newString: 'test string',
          newNumber: 1001011,
          newBool: true,
          newRandom: '>>RANDOM',
          newCopy: '$$id'
        },
        options: {
          verbose: true,
          writeMode: false, // set true for real update
          document: {
            upsert: true,
            multi: true,
            arrayFilters: [
              { 'addOns.id': { $exists: true } },
              { 'addOns.newObj': { $exists: false } },
              { 'addOns.newList': { $exists: false } },
              { 'addOns.newString': { $exists: false } },
              { 'addOns.newNumber': { $exists: false } },
              { 'addOns.newBool': { $exists: false } },
              { 'addOns.newRandom': { $exists: false } },
              { 'addOns.newCopy': { $exists: false } }
            ]
          }
        }
      }
    });

    // Execute mongo-utils
    const result = await updateAddOns();
    console.log('Result from database: ', result); //eslint-disable-line
  } catch (e) {
    throw new Error(e);
  }
};

run();
