'use strict';

/**
 * @description
 * DOING: Should import or include the required
 * libraries and files for this script to run.
 */
const async = require('async');
const { v4: uuidv4 } = require('uuid');

/**
  * @method migrate
  * @access public
  *
  * @description
  * DOING: Should based on the collection passed as a cursor, search parameters and data perform the required
  * and actionable steps to locate the collection, path of documents and update the missing
  * fields using upsertion with the assigned data template.
  *
  * @param {Object} - The invoke object
  * @property {Object|Function} connection - The connection object
  * @property {Object|*} connection.client - The client handle
  * @property {Object|*} connection.database - The database handle
  * @property {Object|*} connection.collection - The collection instance
  * @property {Object} cursor - Cursor specific operations to entire collection
  * @property {Object} cursor.query - The criteria to query the collection by the cursor
  * @property {Number} cursor.limit - The amount of documents to ask from the collection by cursor
  * @property {Array|List} cursor.fields - The specific fields to ask from the collection by cursor
  * @property {Array|List} path - The path within a collection to traverse in search (optional)
  * @property {Object} conditon - The match condition identifier for the path (optional)
  * @property {Object} filter - The match expression to filter actions upon (optional)
  * @property {Object} data - The data values to upsert into the fields
  * @property {Object} options - Options to apply to the update (optional)
  * @property {Number} concurrency - The number of concurrent operations allowed per batch.
  *
  * @example
  * // Advanced query with sub collections
  * migrateFields({
  *  connection: {
  *    client: client,
  *    database: database,
  *    collection: contracts
  *  },
  *  cursor: {
  *    query: { "timeZone": "Europe/Oslo", "language": "no" }
  *    limit: 1000,
  *    fields: ['timeZone','language']
  *  }
  *  criteria: { "hasKey" : { $exists: true } },
  *  path: ['addOns'],
  *  condition: { $exists: true }
  *  filter: { createdAt": { "$ne": "2020-11-17T20:40:19+01:00"  } },
  *  data: {
  *    aString: "Some chars",
  *    aNumber: 2,
  *    aBoolean: true,
  *    anArray: [],
  *    anObject: {},
  *    fieldValueCopied: "$$aString",
  *    internallyGeneratedRandomValue: ">>RANDOM"
  *  },
  *  options: {
  *    verbose: true,
  *    writeMode: true,
  *    document: {
  *      upsert: true
  *      multi: true,
  *      arrayFilters: [{ "addOns.id" : { $exists: true }}]
  *    },
  *    concurrency: 3,
  *  }
  * });
  *
  * // Simple dry run query on collection (See writeMode)
  * migrateFields({
  *  connection: {
  *    client: client,
  *    database: database,
  *    collection: contracts
  *  },
  *   data: { aKey: "A value" },
  *   options: { verbose: true, writeMode: false }
  * })
  *
  * @returns {Object|Null}
 */
module.exports = async function migrate(construct) {

  let {
    cursor: cursorArg,
    path: pathArg,
    condition: conditionArg,
    filter: filterArg,
  } = construct;

  const {
    connection: connArg,
    data,
    options: optsArg
  } = construct;

  const {
    client,
    database,
    collection
  } = connArg;

  const collectionCursor = collection;
  const criteria = {};
  const objDescriptors = {
    writable: false,
    enumerable: true,
    configurable: false
  };
  let ops = [];
  let status;
  let chunk;
  let pathStr;
  let internalsRef; // Internal pointer

  /**
   * @description
   * DOING: Should validate the input from the configuration
   * params and throw a verbose output if not requirements are met.
   * Linters complain about accessing the prototype of these objects,
   * which is exactly what we want, not to mutate it. Linter doesn't know this,
   * which is wrong.
   */
  if (!connArg || typeof connArg !== 'object') {
    throw new Error('A connection object must exist.');
  }
  if (!client || typeof client !== 'object') {
    throw new Error('A client must exist and be of type Object');
  }
  if (!database || typeof database !== 'object') {
    throw new Error('A database must exist and be of type Object');
  }
  if (!collection || typeof collection !== 'object') {
    throw new Error('A collection must exist and be of type Object');
  }
  if (!cursorArg || typeof cursorArg !== 'object') {
    cursorArg = {}; // eslint-disable-line
  }
  if (!Array.isArray(pathArg)) {
    pathArg = []; // eslint-disable-line
  }
  if (typeof conditionArg !== 'object') {
    conditionArg = {}; // eslint-disable-line
  }
  if (typeof filterArg !== 'object') {
    filterArg = {}; // eslint-disable-line
  }
  if (typeof optsArg !== 'object') {
    throw new Error('Options is not valid, should be of type Object');
  }
  if (!optsArg.hasOwnProperty('writeMode') || typeof optsArg.writeMode !== 'boolean') { // eslint-disable-line
    throw new Error('<options>.writeMode is not valid, should be of type Boolean');
  }
  if (!optsArg.hasOwnProperty('verbose') || typeof optsArg.verbose !== 'boolean') { // eslint-disable-line
    throw new Error('<options>.verbose is not valid, should be of type Boolean');
  }
  if (!optsArg.hasOwnProperty('concurrency') || typeof optsArg.concurrency !== 'number') { // eslint-disable-line
    optsArg.concurrency = 5; // eslint-disable-line
  }
  if (typeof data !== 'object' || Object.keys(data).length === 0) {
    throw new Error('Data is not valid, should of type Object');
  }
  if (optsArg.writeMode) {
    delete optsArg.document.arrayFilters; // eslint-disable-line
  }

  /**
   * @description
   * CLARIFY: Should validate the input fromt he configuration
   * params and sanitize the value to create a frozen copy
   * before transaction.
   */
  if (Object.keys(conditionArg).length === 0) {
    Object.defineProperty(conditionArg, '$exists', {
      value: true,
      ...objDescriptors // eslint-disable-line
    });
  }
  if (cursorArg.hasOwnProperty('query')) {
    Object.assign({}, criteria, cursorArg.query);
  }
  if (pathArg.length > 1) {
    pathArg.forEach((pathCursor) => {
      Object.defineProperty(criteria, pathCursor, {
        value: conditionArg,
        ...objDescriptors
      });
    });
  }
  if (pathArg.length === 1) {
    Object.defineProperty(criteria, pathArg, {
      value: conditionArg,
      ...objDescriptors
    });
  }

  /**
   * @name internalsFn
   * @access protected
   *
   * @description
   * DOING: Should add internal helpers
   * and protected methods for insertion of global
   * vars and magic utils in the query.
   *
   * @returns {Object.<invokable>}
   */
  const internalsFn = {
    '>>RANDOM': () => uuidv4() // Change to random function
  };

  /**
   * @name PRINTF
   * @access private
   *
   * @description
   * DOING: Should return a formatted print
   * for verbose display in the tty.
   *
   * @returns {String}
   */
  /* eslint-disable */
  const PRINTF = (msg) => {

    if (optsArg.verbose || msg.persist === true) {
      console.log(
        `
----------------------------------------------------------------
→ ${msg.topic}
----------------------------------------------------------------
${msg.data}
`
      );
    }
  };
  /* eslint-enable */

  /**
   * @description
   * DOING: Should create an asynchronous multi-concurrency queue
   * to process the amount of operations required in order to fulfill
   * the bulk update against the documents in the collection.
   */
  const queue = async.queue(function(task, next) {
    // wait for io
    async.setImmediate(() => {
      PRINTF({
        topic: 'Adding tasks to the queue',
        data: `Task (${queue.running()} / ${optsArg.concurrency}) : ${JSON.stringify(task.writeAction, 2, '')}`
      });

      ops.push({
        updateMany: {
          filter: Object.assign({}, task.filterAction, { ...filterArg }),
          update: task.writeAction,
          ...optsArg.document
        }
      });
      internalsRef = false; // clear
      next();
    });
  }, optsArg.concurrency);

  /**
   * @description
   * DOING: Traverse all the documents in the collection
   * based on the criteria before executing the bulk write actions.
   */
  const documents = await collectionCursor.find(criteria, cursorArg).toArray();

  // Dataset is empty, exit.
  if (documents.length === 0) {
    PRINTF({
      topic: 'Database operations (final)',
      data: `The dataset is empty. Nothing to do, exiting now.`
    });
    status = void 0;
    await client.close();
    return status;
  }

  documents.forEach(function(doc) {
    PRINTF({
      topic: 'Database operations',
      data: `Preparing document: ${doc._id}`
    });

    // Path is root, empty path was given
    if (pathArg && pathArg.length === 0) {
      chunk = {};
      Object.keys(data).forEach(async (k) => {
        const fieldValue = data[k];
        const key = k;
        /**
          * @description
          * CLARIFY: Should create a copy of the document path
          * intended to write to and update each field as a reference
          * value of an existing field. $$ indicates a pointer to an existing value.
          */

        /* eslint-disable-next-line */
        const statement = (`${fieldValue}`.includes('$$', 0)) ? doc[fieldValue.substring(2)] : fieldValue;
        chunk = Object.assign({}, {
          /* eslint-disable-next-line */
          [`${key}`]: internalsFn.hasOwnProperty(`${statement}`) ? internalsFn[`${statement}`]() : statement
        });
        queue.push({ filterAction: { _id: doc._id }, writeAction: { $set: chunk } }, function(e) {
          if (e) {
            throw new Error('There was an error adding fields to the update queue', e);
          }
        });
      });
    }

    // Multiple paths were found, treat as list type
    if (pathArg && pathArg.length > 0) {
      pathArg.forEach((path, pathIndex) => {
        Object.keys(data).forEach(async (k) => {
          const fieldValue = data[k];
          const key = k;
          let statement;

          doc[`${path}`].forEach((subPath, subPathIndex) => {
            /**
             * @description
             * CLARIFY: Should create a copy of the document path
             * intended to write to and update each field as a reference
             * value of an existing field. $$ indicates a pointer to an existing value.
             */
            pathStr = {
              doc: Object.assign({}, doc[path][pathIndex]),
              rel: [`${path}.${subPathIndex}.${key}`],
            };

            /* eslint-disable-next-line */
            statement = (`${fieldValue}`.includes('$$', 0)) ? subPath[fieldValue.substring(2)] : fieldValue;
            /* eslint-disable-next-line */
            internalsRef = (internalsFn.hasOwnProperty(`${statement}`)) ? internalsFn[`${statement}`]() : false;

            queue.push(
              {
                filterAction: { _id: doc._id, [`${path}.${subPathIndex}`]: subPath[subPathIndex] },
                writeAction: {
                  $set: {
                    [`${pathStr.rel}`]: (internalsRef) ? internalsRef : statement // eslint-disable-line
                  }
                }
              }, function(e) {
                if (e) {
                  throw new Error('There was an error adding fields to the update queue', e);
                }
              }
            );
          });
        });
      });
    }

    /**
     * @method error
     * @access private
     *
     * @description
     * CLARIFY: Should catch any error thrown
     * by the queue from the callstack before process.exit.
     *
     * @property {Object} error - Error instance retrieved by the queue
     * @returns {Function,<object>} errorCb
     */
    queue.error(async function errorCb(error) {
      await client.close();
      throw new Error(error);
    });

    /**
     * @method empty
     * @access private
     *
     * @description
     * CLARIFY: Should ensure that queue ops liste
     * has been reset on init and completion once the queue is empty.
     *
     * @returns {Function.<invokable>} emptyCb
     */
    queue.empty(function emptyCb() {
      PRINTF({
        topic: 'Queue operations',
        data: `The queue is empty, current length is: ${queue.length()}`
      });
    });

    /**
     * @method drain
     * @access private
     *
     * @description
     * DOING: Should upon last task returned from worker in queue
     * process the bulk actions against the database when the queue is flushed.
     *
     * @returns {Function.<invokable>} drainCb
     */
    queue.drain(async function drainCb() {
      PRINTF({
        topic: 'Queue operations',
        data: `The queue is being drained, current length is: ${queue.length()}`
      });

      try {
        status = await executeFn();
        ops = [];
      } catch (err) {
        console.err(err);
        async.nextTick(() => queue.kill());
        await client.close();
        throw new Error('Fatal error. Unable to recover, stopping now.');
      }
    });

    /**
     * @method saturated
     * @access private
     *
     * @description
     * DOING: Should upon queue saturation, reaching the maxiumum
     * limit of concurrency, stop any attempts at proceeding
     * the queue until all io operations are finished.
     * This is required in order to reduce any io wait
     * generated by the lock mechanisms of MongoDB.
     *
     * @returns {Function.<invokable>} saturatedCb
     */
    queue.saturated(function saturatedCb() {
      PRINTF({
        topic: 'Queue operations',
        data: `The queue is saturated and have been paused.`
      });

      queue.pause();
      if (queue.running() === optsArg.concurrency) {
        PRINTF({
          topic: 'Queue operations',
          data: `The queue is being resumed to last state.`
        });

        async.setImmediate(() => queue.resume());
      }
    });

    /**
     * @description
     * DOING: Should execute the final command against the database
     * to fulfill the criteria and update the fields. Alternatively,
     * perform a dry-run operation and return the common executionStats
     * query plan using explain.
     * eslint complains about return statements here, lets clarify what happens
     * if there's no return from this context. Timers won't close the current
     * timer context and the timers won't be sweeped until major gc. Linters don't
     * understand this, which also means they suck.
     */
    function executeFn() {
      return new Promise(async (resolve, reject) => {
        if (optsArg.writeMode) {
          async.setImmediate(
            async () => await collectionCursor.bulkWrite(ops, { ordered: optsArg.ordered },
              async function(err, res) {
                if (err) {
                  async.nextTick(() => queue.kill());
                  reject(new Error(err));
                }
                resolve(PRINTF({
                  persist: true,
                  topic: 'Database operations (final)',
                  data: `A bulk write has been successfully executed. \n\nOK (details below)\n ${JSON.stringify(res, 2, ' ')}`
                }));
                await client.close();
              })
          );
        } else {
          async.nextTick(() => queue.kill());

          let arrFilters = {};
          let findByFilter;

          if (pathArg && pathArg.length > 0) {
            arrFilters = {};
            optsArg.document.arrayFilters.forEach((k) => {
              arrFilters = Object.assign({}, { ...k });
            });

            findByFilter = { ...arrFilters };
          }

          try {
            const queryPlanner = await collectionCursor.find(
              Object.assign({},
                criteria,
                cursorArg,
                findByFilter)
            ).explain('executionStats');
            resolve(PRINTF({
              persist: true,
              topic: 'Database operations (final)',
              data: `A query plan has been successfully requested. \n ${JSON.stringify(queryPlanner, 2, ' ')}`
            }));
            await client.close();
          } catch (e) {
            reject(PRINTF({
              persist: true,
              topic: 'Database operations',
              data: `A query plan could not be retrieved. \n ${e}`
            }));
            await client.close();
          }
        }
      });
    }
  });

  /**
    * @description
    * CLARIFY: Guarantee this process to exit cleanly and
    * free currently allocated handles before proceeding.
    * Potential Denial of service amplification vector.
    */
  process.on('uncaughtException', () => process.exit(7));

  return status;
};
