# Introduction (mongo-utils)
This module is aimed to help resolve complex queries and tasks against MongoDB.

### What can I do with this utility?

* Add new fields or change existing fields and values inside MongoDB collections in bulk
* Perform complex queries to meet and match lists inside of each document
* Evaluate the query plan before performing the real update to the database
> Read more: [node-mongodb-native](http://mongodb.github.io/node-mongodb-native/3.0/reference/connecting/connection-settings/)

____

#### Disclaimer

**<u>Release</u>**

This release is considered to be in minor alpha, therefore should be considered to be used with <u>caution</u>, adhering to <u>proper guidelines</u> included in the documentation of this Pull Request. Please read the "**Known issues**" list below before proceeding.

**<u>Known issues</u>** :boom:

* Path (`<Array|List>`) does **<u>not</u>** currently support multiple paths in list.
* Data (`<Object>`) members must preexist in full (key and value), if referred to using symbolic values with the `$$` identifiers.
* <s>Data (`<Object>`) internal methods `>>RANDOM` does **<u>not</u>** currently support randomized values per document iterative update. This is a bug due to the nature of MongoDB `arrayFilters` in conjunction with indexed `$`  identifiers.</s> (**<u>RESOLVED</u>**)

____

#### Introduction

**<u>migrate</u>**
This utility attempts to improve how we interact with this interface for *field migration* specific operations, and improve otherwise unwanted behaviors as a result of a synchronous call-chain for *some* database specific operations.



**<u>Behavior</u>**

The implementation of this utility, <u>attempts</u> to eliminate some of the error-prone states that the database may create, as a result of simultaneous execution of multiple operations.

1. **Queue operations**

   * All operations are processed using a FIFO (First-In-First-Out) sequence.
   * Operations are processed in batches, limited by a configurable threshold.
   * Operations are processed only when I/O-wait is non-saturated.
   * Erroneous exceptions will guarantee to remove any pending operations.

2. **Database operations**

   * Data is written to the collection using a server-side *bulkWrite* execution.
   * All *bulkWrite* tasks are intercepted as asynchronous actions.
   * Query planner is used for *non-writable* operations ( `<options>.writeMode`)



____



#### Feature list

As of this release, the features below are available.

**Data**

* Build your data collection based on the result of a queried criteria
* Configure cursor specific options as drafted by [Node MongoDB Native Driver 3.6](https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#find)

**Migrate**

* Adding *new* fields and values to all documents in a collection.
* Adding *new* fields and values to all documents in a sub-collection or list.
* Updating *existing* fields and values in all documents in a collection.
* Updating *existing* fields and values in all documents in a sub-collection or list.
* Adding *new* fields and values to specific documents in a collection.
* Adding *new* fields and values to specific documents in a sub-collection or list.
* Updating *existing* fields and values in specific documents in a collection.
* Updating *existing* fields and values in specific documents in a sub-collection or list.

**Query**

* Optionally, find specific documents by paths and conditions of a criteria.
* Optionally, filter specific documents by matching conditions to identifiers inside the documents.
* Optionally, retrieve the value of another preexisting field using a symbolic identifier `$$field`
* Optionally, execute internal helper methods using a identifier `>>FUNC`

**Execute**

* Enable or disable verbose logging output of the transactions in your console.
* Enable or disable database updates to test queries before transaction.
* Configure specific worker-size concurrency per batch before writing to database.



____


## Installation
* Clone this repository to your local machine using `git clone`.
* Install the required NPM module using `npm install`
* Ensure that you have an instance of MongoDB running on your local machine using port `27017`

**Prerequisites**

* Ensure that MongoDB is started and listening on your local machine.

* Make sure to make a backup of your current database before testing as this **WILL** affect your current data dump. Run the following command inside of your terminal.

  * ```
    $ mongodump -d meteor --out /Users/<yourname>/Desktop
    ```

## Tests
* Enter the root directory of the repository on your local machine
* Type `node setup.js` and enter.
* * This should create a new database in MongoDB named `_mongo_utils`.
* * This should create a new collection the database named `_test_collection`.
* * This should insert 100 documents in the collection, mimicking the `contracts` collection.
* * This should print "Test database and collection successfully setup with 100 documents." when finished.
* * Open your favorite MongoDB Client and verify that the database, collection and documents exist.
* Type `npm run-script test` and enter.
* * This should execute a test-suit and fail on first execution. This is due nature of MongoDB server side executions.
* Type `npm run-script test` once again and enter.
* * This should successfully execute `1 test suit` and `110 tests` which should also pass.

## Example
* Enter the root directory of the respository on your local machine
* Open the file `example.js` with your desired editor.
* Inspect the example code.
* Type `node example.js` and enter.
* * Change the `writeMode` property from `false` to `true` to perform an actual database update.
* * Change the `writeMode` property back from `true` to `false` to generate a query-plan report.
* * Experiment with the two modes as needed.
* Open your favorite MongoDB Client and verify that the updates were successful.

### Operations (A query plan)
When `writeMode` is set to `false` a query plan report will be generated.
Running this will **not** affect your database.

   > ```shell
   >  ----------------------------------------------------------------
   > → Database operations
   > ----------------------------------------------------------------
   > A query plan has been successfully requested.
   > ...
   > ```

### Operations (A bulk write)
When `writeMode` is set to `true` a bulkWrite execution will be performed.
Running this **will** affect your database.

   > ```shell
   > ----------------------------------------------------------------
   > → Database operations (final)
   > ----------------------------------------------------------------
   > A bulk write has been successfully executed.
   >
   > OK (details below)
   > ...
   > ```

____


#### Getting started

```javascript
const mongoUtils = require('mongo-utils');
```

To use the utility you need to invoke it with a number of properties, passed as a parameter to a factory.

A factory expects a handler and params to send to it.

<u>**Available handlers**</u>
* migrate

```javascript
const mongoUtils = require('mongo-utils');

const migrate = mongoUtils({
  handler: 'migrate,
  params: {
  ...
  }
});
```

### Params

<u>**Property declaration**</u>

* `<Object>.params.connection` - An object containing required connection handles for MongoDB.

  ```javascript
  params: {
    connection: {
      client: clientObject,
      database: databaseObject,
      collection: collectionObject
    }
  	...
  }
  ```
* * All connection members must be established and exist in full before passing it to params.

* `<Object>.params.cursor` - An object containing find operation specific options for the cursor.

  ```javascript
  params: {
    connection: {
      client: clientObject,
      database: databaseObject,
      collection: collectionObject
    },
    cursor: {
      query: { 'addOnTemplateId' : { $neq : null }},
      limit: 1000,
      fields: ['addOnTemplateId', 'addOnInstanceId'],
      sort: { 'addOnTemplateId': -1 }
    }
	...
  }
  ```
* * Read more about the cursor options here https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#find.

* `<Object>.params.path` - Path of sub-collection or list inside of document to execute on.

  ```javascript
  params: {
    connection: {
      client,
      database,
      collection
    },
    cursor: {
      query: { 'addOnTemplateId' : { $neq : null }},
      limit: 1000,
      fields: ['addOnTemplateId', 'addOnInstanceId'],
      sort: { 'addOnTemplateId': -1 }
    },
    path: ['addOns'],
  	...
  }
  ```

  > Execute update inside of `addOns` list.

* `<Object>.params.condition` - Match expression to return the assigned search path by.

  ```javascript
  params: {
    connection: {
      client,
      database,
      collection
    },
    cursor: {
      query: { 'addOnTemplateId' : { $neq : null }},
      limit: 1000,
      fields: ['addOnTemplateId', 'addOnInstanceId'],
      sort: { 'addOnTemplateId': -1 }
    },
    path: ['addOns'],
    condition: { $exists : true },
  	...
  }
  ```

  > Execute update inside of `addOns` only if they exist.

* `<Object>.params.filter` - Match expression to filter the returned result by.

  ```javascript
  params: {
    connection: {
      client,
      database,
      collection
    },
    cursor: {
      query: { 'addOnTemplateId' : { $neq : null }},
      limit: 1000,
      fields: ['addOnTemplateId', 'addOnInstanceId'],
      sort: { 'addOnTemplateId': -1 }
    },
    path: ['addOns'],
    condition: { $exists : true },
    filter: { id: { "$ne" : "XYZ"}}
  	...
  }
  ```

  > Execute update inside of `addOns` only if they exist and `id` does not equal `XYZ`

* `<Object>.params.data` - Data object to create or update current document with.

  ```javascript
  params: {
    connection: {
      client,
      database,
      collection
    },
    cursor: {
      query: { 'addOnTemplateId' : { $neq : null }},
      limit: 1000,
      fields: ['addOnTemplateId', 'addOnInstanceId'],
      sort: { 'addOnTemplateId': -1 }
    },
    path: ['addOns'],
    condition: { $exists : true },
    filter: { id: { "$ne" : "XYZ"}},
    data: { newKey: "new value" },
  	...
  }
  ```

  > Execute update inside of `addOns` only if they exist and `id` does not equal `XYZ` with a new key and a new value.

  * Call internal helper function as a value of a field with a `>>` prefix.

    ```javascript
    data: { keyWithRandomValue: ">>RANDOM" } // Will generate a random V4 UUID.
    ```

  * Use the existing value of an existing field with a symbolic identifier `$$` prefix.

    ```javascript
    data: { newKeyWithCopiedValue: "$$existingKey" }
    ```
  * Data may be of any BSON enumerable type such as `char`,`string`, `number`, `array`, `object`. Arrays and Objects must be enclosed by quotes.

  
* `<Object>.params.options` - Options object to control queue and database operations.

  ```javascript
  params: {
    connection: {
      client,
      database,
      collection
    },
    cursor: {
      query: { 'addOnTemplateId' : { $neq : null }},
      limit: 1000,
      fields: ['addOnTemplateId', 'addOnInstanceId'],
      sort: { 'addOnTemplateId': -1 }
    },
    path: ['addOns'],
    condition: { $exists : true },
    filter: { id: { "$ne" : "XYZ"}},
    data: { newKey: "new value" },
    options: {
        verbose: true,
        writeMode: true,
        concurrency: 3,
        document: {
            upsert: true,
            multi: true,
            arrayFilters: [{ "addOns.id": { $exists: true}}]
      }
    }
  	...
  }
  ```

  * `<Object>.verbose` - Enable or disable verbose logging output, expects a boolean. **REQUIRED**
  * `<Object>.writeMode` - Enable or disable query plan (`false`) or database update (`true`), expects a boolean. **REQUIRED**
  * `<Object>.concurrency` - Select number of operations to process per batch against the database. Expects a number.
  * `<Object>.document` - Add any MongoDB `updateMany` parameters such as `arrayFilters` here.



**<u>Example usage</u>**



> Updating all documents in a collection with a new property

```javascript
const mongoUtils = require('mongo-utils');

// connect (check your driver docs)
const client = MongoDB.client();
client.connect();
const database = client.db('some_db');
const collection = database.collection('some_collection');

const customMigration = mongoUtils({
  handle: 'migrate',
  params: {
    connection: {
      client,
      database,
      collection
    },
    data: {
      newProp: 'new value'
    },
    options: {
      verbose: true,
      writeMode: true
    }
  }
});

const result = await customMigration();
console.log(result);
```

> Updating all documents in contracts, addOns list with two new properties

```javascript
const mongoUtils = require('mongo-utils');

// connect (check your driver docs)
const client = MongoDB.client();
client.connect();
const database = client.db('meteor');
const collection = database.collection('contracts');

// update contracts.addOns
const addOnUpdate = mongoUtils({
  handle: 'migrate',
  params: {
    connection: {
      client,
      database,
      collection
    },
    cursor: {
        query: { 'addOnTemplateId' : { $neq : null }},
        fields: ['addOnTemplateId', 'addOnInstanceId']
    }
    path: ['addOns'],
    condition: { $exists: true },
    filter: {},
    data: {
      addOnTemplateId: '$$id',
      addOnInstanceId: '>>RANDOM'
    },
    options: {
      verbose: true,
      writeMode: true,
      document: {
        upsert: true,
        multi: true,
        arrayFilter: [{ "addOns.id" : { $exists: true } }]
      }
    }
  }
});

const result = await addOnUpdate();
console.log(result);
```
